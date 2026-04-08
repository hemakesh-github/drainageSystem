import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Uuid

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class ComplaintCounter(Base):
    """Serializes human-readable complaint_id minting per calendar year."""

    __tablename__ = "complaint_counters"

    year = Column(Integer, primary_key=True)
    last_seq = Column(Integer, nullable=False, default=0)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    mobile = Column(String(64), nullable=False)
    location = Column(String(512), nullable=False)
    issue_type = Column(String(32), nullable=False)
    description = Column(String(4000), nullable=False)
    image_path = Column(String(512), nullable=True)
    status = Column(String(32), nullable=False, default="submitted")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
