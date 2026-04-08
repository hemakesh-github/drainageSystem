import io

import pytest
from fastapi.testclient import TestClient

from database import Base, engine


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    from main import app

    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_complaint_crud_and_upload(client):
    body = {
        "name": "Test User",
        "mobile": "999",
        "location": "Village",
        "issue_type": "blocked",
        "description": "Blocked drain",
    }
    r = client.post("/complaints", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["complaint_id"].startswith("NMB-")
    assert data["status"] == "submitted"
    cid = data["complaint_id"]

    r = client.get(f"/complaints/{cid}")
    assert r.status_code == 200
    assert r.json()["complaint_id"] == cid

    r = client.get("/complaints")
    assert r.status_code == 200
    assert len(r.json()) == 1

    r = client.patch(f"/complaints/{cid}/status", json={"status": "under_review"})
    assert r.status_code == 200
    assert r.json()["status"] == "under_review"

    files = {"file": ("x.jpg", io.BytesIO(b"\xff\xd8\xff fake"), "image/jpeg")}
    r = client.post(f"/complaints/{cid}/upload", files=files)
    assert r.status_code == 200
    path = r.json()["image_path"]
    assert path.startswith("uploads/")

    fname = path.split("/")[-1]
    img = client.get(f"/uploads/{fname}")
    assert img.status_code == 200
    assert img.content.startswith(b"\xff\xd8\xff")
