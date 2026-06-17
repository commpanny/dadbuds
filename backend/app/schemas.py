from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    neighborhood: str
    age_range: str
    kids_age_range: str
    discord_username: Optional[str] = None
    sms_opt_in: bool = False
    comfort_level: str
    interests: list[str] = Field(default_factory=list)
    typical_availability: list[str] = Field(default_factory=list)


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    neighborhood: str
    age_range: str
    kids_age_range: str
    discord_username: Optional[str]
    sms_opt_in: bool
    comfort_level: str
    interests: list[str]
    typical_availability: list[str]
    created_at: datetime


class AvailabilityCreate(BaseModel):
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None
    date: str
    start_time: str
    end_time: str
    kid_status: str
    preferred_vibe: str
    notes: Optional[str] = None


class AvailabilityRead(BaseModel):
    id: int
    user_id: Optional[int]
    user_name: Optional[str]
    user_email: Optional[str]
    date: str
    start_time: str
    end_time: str
    kid_status: str
    preferred_vibe: str
    notes: Optional[str]
    status: str
    created_at: datetime


class AvailabilityStatusUpdate(BaseModel):
    status: str


class PlanCreate(BaseModel):
    title: str
    description: str
    date: str
    start_time: str
    end_time: str = ""
    location: str
    cost: str = "Free"
    kid_friendly: bool = False
    capacity: Optional[int] = None
    status: str = "draft"
    visibility: str = "public"
    tags: list[str] = Field(default_factory=list)
    related_interests: list[str] = Field(default_factory=list)


class PlanRead(BaseModel):
    id: int
    title: str
    description: str
    date: str
    start_time: str
    end_time: str
    location: str
    cost: str
    kid_friendly: bool
    capacity: Optional[int]
    status: str
    visibility: str
    tags: list[str]
    related_interests: list[str]
    rsvp_count: int
    created_at: datetime


class RsvpCreate(BaseModel):
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    status: str = "interested"


class RsvpRead(BaseModel):
    id: int
    plan_id: int
    plan_title: str
    user_id: int
    status: str
    created_at: datetime


class MessageCreate(BaseModel):
    channel: str
    recipient_type: str
    recipient_id: Optional[int] = None
    body: str
    status: str = "draft"
    related_plan_id: Optional[int] = None


class MessageRead(BaseModel):
    id: int
    channel: str
    recipient_type: str
    recipient_id: Optional[int]
    body: str
    status: str
    related_plan_id: Optional[int]
    created_at: datetime
    sent_at: Optional[datetime]

