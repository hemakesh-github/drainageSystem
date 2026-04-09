import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, Complaint, ComplaintCounter
from schemas import ComplaintCreate, ComplaintOut, StatusUpdate

ISSUE_TYPES = frozenset({"blocked", "overflow", "open_drain", "stagnant"})
STATUSES = frozenset({"submitted", "under_review", "in_progress", "resolved"})

LOG = logging.getLogger("drainage.api")
if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
LOG.setLevel(logging.INFO)


class RequestLogMiddleware(BaseHTTPMiddleware):
    """Log every HTTP request: client, method, path, status, duration, optional content-length."""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        client = request.client.host if request.client else "-"
        path = request.url.path
        query = request.url.query
        path_q = f"{path}?{query}" if query else path
        content_length = request.headers.get("content-length", "-")

        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - start) * 1000
            LOG.exception(
                "%s | %s %s | error after %.2fms | content-length=%s",
                client,
                request.method,
                path_q,
                elapsed_ms,
                content_length,
            )
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        LOG.info(
            "%s | %s %s -> %s | %.2fms | content-length=%s",
            client,
            request.method,
            path_q,
            response.status_code,
            elapsed_ms,
            content_length,
        )
        return response

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def mint_complaint_id(db: Session) -> str:
    year = datetime.now(timezone.utc).year
    dialect = db.get_bind().dialect.name
    if dialect == "postgresql":
        ins = pg_insert(ComplaintCounter).values(year=year, last_seq=0).on_conflict_do_nothing(
            index_elements=["year"]
        )
    else:
        ins = sqlite_insert(ComplaintCounter).values(year=year, last_seq=0).on_conflict_do_nothing(
            index_elements=["year"]
        )
    db.execute(ins)
    db.flush()
    counter = db.execute(
        select(ComplaintCounter).where(ComplaintCounter.year == year).with_for_update()
    ).scalar_one()
    counter.last_seq += 1
    return f"NMB-{year}-{counter.last_seq:04d}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLogMiddleware)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/complaints", response_model=ComplaintOut)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    if payload.issue_type not in ISSUE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid issue_type")

    try:
        human_id = mint_complaint_id(db)
        row = Complaint(
            complaint_id=human_id,
            name=payload.name.strip(),
            mobile=payload.mobile.strip(),
            location=payload.location.strip(),
            issue_type=payload.issue_type,
            description=payload.description.strip(),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    except Exception:
        db.rollback()
        raise


@app.get("/complaints", response_model=list[ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    rows = db.execute(select(Complaint).order_by(Complaint.created_at.desc())).scalars().all()
    return rows


@app.get("/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    row = db.execute(select(Complaint).where(Complaint.complaint_id == complaint_id)).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return row


@app.patch("/complaints/{complaint_id}/status", response_model=ComplaintOut)
def update_status(complaint_id: str, body: StatusUpdate, db: Session = Depends(get_db)):
    if body.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    row = db.execute(select(Complaint).where(Complaint.complaint_id == complaint_id)).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    row.status = body.status
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return row


@app.post("/complaints/{complaint_id}/upload", response_model=ComplaintOut)
async def upload_image(
    complaint_id: str,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
):
    row = db.execute(select(Complaint).where(Complaint.complaint_id == complaint_id)).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    ext = ".jpg"
    filename = f"{uuid4()}{ext}"
    dest = UPLOAD_DIR / filename

    content = await file.read()
    dest.write_bytes(content)

    relative = f"uploads/{filename}"
    row.image_path = relative
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return row
