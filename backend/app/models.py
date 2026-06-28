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


class AuthLoginToken(SQLModel, table=True):
    __tablename__ = "auth_login_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    token_hash: str = Field(index=True, unique=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    expires_at: datetime
    consumed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)


class AuthSession(SQLModel, table=True):
    __tablename__ = "auth_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True)
    expires_at: datetime
    revoked_at: Optional[datetime] = None
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


class BudRelationship(SQLModel, table=True):
    __tablename__ = "bud_relationships"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_a_id: int = Field(foreign_key="users.id", index=True)
    user_b_id: int = Field(foreign_key="users.id", index=True)
    user_a_saved: bool = False
    user_b_saved: bool = False
    confirmation_status: str = "none"
    requested_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    request_expires_at: Optional[datetime] = None
    blocked_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_type: str = "plan"
    related_plan_id: Optional[int] = Field(default=None, foreign_key="plans.id", index=True)
    related_crew_id: Optional[int] = Field(default=None, foreign_key="crews.id", index=True)
    lifecycle_status: str = "active"
    expires_at: Optional[datetime] = None
    graduated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ConversationMember(SQLModel, table=True):
    __tablename__ = "conversation_members"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    membership_status: str = "active"
    notification_preference: str = "all"
    persistence_choice: str = "unanswered"
    joined_at: datetime = Field(default_factory=utc_now)
    left_at: Optional[datetime] = None
    muted_at: Optional[datetime] = None


class ConversationMessage(SQLModel, table=True):
    __tablename__ = "conversation_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    sender_user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    sender_type: str = "user"
    body: str
    message_type: str = "text"
    metadata_json: str = "{}"
    created_at: datetime = Field(default_factory=utc_now)
    edited_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class Crew(SQLModel, table=True):
    __tablename__ = "crews"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    origin_conversation_id: Optional[int] = Field(
        default=None, foreign_key="conversations.id", index=True
    )
    status: str = "active"
    created_at: datetime = Field(default_factory=utc_now)
    archived_at: Optional[datetime] = None


class CrewMember(SQLModel, table=True):
    __tablename__ = "crew_members"

    id: Optional[int] = Field(default=None, primary_key=True)
    crew_id: int = Field(foreign_key="crews.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    status: str = "active"
    notification_preference: str = "all"
    joined_at: datetime = Field(default_factory=utc_now)
    left_at: Optional[datetime] = None


class SafetyReport(SQLModel, table=True):
    __tablename__ = "safety_reports"

    id: Optional[int] = Field(default=None, primary_key=True)
    reporter_user_id: int = Field(foreign_key="users.id", index=True)
    reported_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    conversation_id: Optional[int] = Field(default=None, foreign_key="conversations.id")
    message_id: Optional[int] = Field(default=None, foreign_key="conversation_messages.id")
    report_type: str
    reason: str = ""
    status: str = "open"
    created_at: datetime = Field(default_factory=utc_now)


class SocialSimulation(SQLModel, table=True):
    __tablename__ = "social_simulations"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    status: str = "active"
    human_user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    current_date: str
    day_index: int = 0
    agent_count: int = 0
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class SocialSimulationAgent(SQLModel, table=True):
    __tablename__ = "social_simulation_agents"

    id: Optional[int] = Field(default=None, primary_key=True)
    simulation_id: int = Field(foreign_key="social_simulations.id", index=True)
    display_name: str
    archetype: str = Field(index=True)
    neighborhood: str = ""
    activity_score: float = 0.5
    resistance_score: float = 0.2
    coordinator_score: float = 0.0
    trust_score: float = 0.3
    plans_created: int = 0
    rsvps_sent: int = 0
    messages_sent: int = 0
    mutes: int = 0
    ignores: int = 0
    status: str = "active"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class SocialSimulationEvent(SQLModel, table=True):
    __tablename__ = "social_simulation_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    simulation_id: int = Field(foreign_key="social_simulations.id", index=True)
    sim_date: str = Field(index=True)
    day_index: int = Field(index=True)
    event_type: str = Field(index=True)
    actor_agent_id: Optional[int] = Field(
        default=None, foreign_key="social_simulation_agents.id", index=True
    )
    actor_user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    target_agent_id: Optional[int] = Field(
        default=None, foreign_key="social_simulation_agents.id"
    )
    title: str = ""
    body: str
    impact_score: float = 0.0
    created_at: datetime = Field(default_factory=utc_now)


class UxFeedback(SQLModel, table=True):
    __tablename__ = "ux_feedback"

    id: Optional[int] = Field(default=None, primary_key=True)
    source_type: str = "human"
    page: str = ""
    severity: str = "painpoint"
    body: str
    status: str = "open"
    simulation_id: Optional[int] = Field(default=None, foreign_key="social_simulations.id", index=True)
    agent_id: Optional[int] = Field(default=None, foreign_key="social_simulation_agents.id")
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
