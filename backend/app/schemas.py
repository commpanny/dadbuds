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


class AuthLinkRequest(BaseModel):
    email: EmailStr


class AuthLinkResponse(BaseModel):
    status: str
    detail: str
    magic_link: Optional[str] = None


class AuthVerifyRequest(BaseModel):
    token: str


class AuthSessionRead(BaseModel):
    token: str
    expires_at: datetime
    user: UserRead


class CommunityStandardRead(BaseModel):
    title: str
    summary: str
    short_rule: str
    prohibited: list[str]
    agent_redirect: str
    serious_redirect: str


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
    location_url: Optional[str] = None
    cost: str
    kid_friendly: bool
    capacity: Optional[int]
    status: str
    visibility: str
    tags: list[str]
    related_interests: list[str]
    rsvp_count: int
    viewer_status: Optional[str] = None
    thread_available: bool = False
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
    plan_date: str
    plan_start_time: str
    plan_end_time: str
    plan_location: str
    plan_location_url: Optional[str] = None
    plan_cost: str
    plan_kid_friendly: bool
    user_id: int
    status: str
    created_at: datetime


class UserRef(BaseModel):
    id: int
    name: str
    neighborhood: str


class BudAction(BaseModel):
    actor_user_id: int


class BudRelationshipRead(BaseModel):
    id: int
    other_user: UserRef
    relationship_state: str
    confirmation_status: str
    saved_by_me: bool
    saved_by_them_visible: bool = False
    mutual_bud_count: int
    request_expires_at: Optional[datetime] = None


class ConversationMemberRead(BaseModel):
    id: int
    user: UserRef
    membership_status: str
    notification_preference: str
    persistence_choice: str
    joined_at: datetime
    muted_at: Optional[datetime]
    left_at: Optional[datetime]


class ConversationMessageCreate(BaseModel):
    user_id: int
    body: str


class ConversationMessageRead(BaseModel):
    id: int
    conversation_id: int
    sender_type: str
    sender_user: Optional[UserRef] = None
    body: str
    message_type: str
    created_at: datetime
    deleted_at: Optional[datetime]


class ConversationRead(BaseModel):
    id: int
    conversation_type: str
    related_plan_id: Optional[int]
    related_crew_id: Optional[int]
    lifecycle_status: str
    expires_at: Optional[datetime]
    graduated_at: Optional[datetime]
    plan_title: Optional[str] = None
    crew_name: Optional[str] = None
    current_member: Optional[ConversationMemberRead] = None
    members: list[ConversationMemberRead]
    messages: list[ConversationMessageRead]
    can_post: bool


class ConversationPreferenceUpdate(BaseModel):
    user_id: int


class PersistenceChoiceUpdate(BaseModel):
    user_id: int
    choice: str


class CrewRead(BaseModel):
    id: int
    name: str
    status: str
    origin_conversation_id: Optional[int]
    created_at: datetime
    members: list[ConversationMemberRead]


class SafetyReportCreate(BaseModel):
    reporter_user_id: int
    reported_user_id: Optional[int] = None
    conversation_id: Optional[int] = None
    message_id: Optional[int] = None
    report_type: str
    reason: str = ""


class SafetyReportRead(BaseModel):
    id: int
    reporter_user_id: int
    reported_user_id: Optional[int]
    conversation_id: Optional[int]
    message_id: Optional[int]
    report_type: str
    reason: str
    status: str
    created_at: datetime


class PlanFromMessageCreate(BaseModel):
    user_id: int
    title: str
    date: str
    start_time: str
    end_time: str = ""
    location: str
    cost: str = "Free"
    kid_friendly: bool = False


class SocialSimulationCreate(BaseModel):
    user_id: Optional[int] = None
    agent_count: int = 120
    start_date: Optional[str] = None
    name: str = "DadBuds Spokane door test"


class SocialSimulationAdvance(BaseModel):
    user_id: Optional[int] = None
    days: int = 1
    human_action: str = "observe"


class UxFeedbackCreate(BaseModel):
    source_type: str = "human"
    page: str = ""
    severity: str = "painpoint"
    body: str
    simulation_id: Optional[int] = None
    agent_id: Optional[int] = None


class UxFeedbackRead(BaseModel):
    id: int
    source_type: str
    page: str
    severity: str
    body: str
    status: str
    simulation_id: Optional[int]
    agent_id: Optional[int]
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
