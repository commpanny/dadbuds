from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DadUser(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True)
    phone: str = ""
    neighborhood: str = ""
    age_range: str = ""
    kids_age_range: str = ""
    discord_username: Optional[str] = None
    sms_opt_in: bool = False
    comfort_level: str = "Just notify me"
    created_at: datetime = Field(default_factory=utc_now)


class Interest(SQLModel, table=True):
    __tablename__ = "interests"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)


class UserInterest(SQLModel, table=True):
    __tablename__ = "user_interests"

    user_id: int = Field(foreign_key="users.id", primary_key=True)
    interest_id: int = Field(foreign_key="interests.id", primary_key=True)


class UserAvailabilityPreference(SQLModel, table=True):
    __tablename__ = "user_availability_preferences"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    label: str


class AvailabilityWindow(SQLModel, table=True):
    __tablename__ = "availability_windows"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    guest_email: Optional[str] = Field(default=None, index=True)
    date: str
    start_time: str
    end_time: str
    kid_status: str
    preferred_vibe: str
    notes: Optional[str] = None
    status: str = "new"
    created_at: datetime = Field(default_factory=utc_now)


class Plan(SQLModel, table=True):
    __tablename__ = "plans"

    id: Optional[int] = Field(default=None, primary_key=True)
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
    created_at: datetime = Field(default_factory=utc_now)


class PlanTag(SQLModel, table=True):
    __tablename__ = "plan_tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: int = Field(foreign_key="plans.id", index=True)
    tag: str


class PlanRelatedInterest(SQLModel, table=True):
    __tablename__ = "plan_related_interests"

    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: int = Field(foreign_key="plans.id", index=True)
    interest: str


class Rsvp(SQLModel, table=True):
    __tablename__ = "rsvps"

    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: int = Field(foreign_key="plans.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    status: str = "interested"
    created_at: datetime = Field(default_factory=utc_now)


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    channel: str
    recipient_type: str
    recipient_id: Optional[int] = None
    body: str
    status: str = "draft"
    related_plan_id: Optional[int] = Field(default=None, foreign_key="plans.id")
    created_at: datetime = Field(default_factory=utc_now)
    sent_at: Optional[datetime] = None

