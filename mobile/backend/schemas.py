from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ComplaintCreate(BaseModel):
    name: str
    mobile: str
    location: str
    issue_type: str
    description: str


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    complaint_id: str
    name: str
    mobile: str
    location: str
    issue_type: str
    description: str
    image_path: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class StatusUpdate(BaseModel):
    status: str = Field(..., min_length=1)
