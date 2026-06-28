from __future__ import annotations

import os
import secrets
import hashlib
import smtplib
from email.message import EmailMessage
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlmodel import Session, func, select

from .database import create_db_and_tables, engine, get_session
from .event_pipeline import (
    EventCandidate,
    event_source_catalog,
    location_url_for,
    local_event_candidates,
    next_weekday,
    plan_from_event,
    require_validated_venue,
    scheduled_night_event,
    venue_catalog,
)
from .models import (
    AvailabilityWindow,
    AuthLoginToken,
    AuthSession,
    BudRelationship,
    Conversation,
    ConversationMember,
    ConversationMessage,
    Crew,
    CrewMember,
    DadUser,
    Interest,
    Message,
    Plan,
    PlanRelatedInterest,
    PlanTag,
    Rsvp,
    SafetyReport,
    SocialSimulation,
    UxFeedback,
    UserAvailabilityPreference,
    UserInterest,
)
from .schemas import (
    AvailabilityCreate,
    AvailabilityRead,
    AvailabilityStatusUpdate,
    AuthLinkRequest,
    AuthLinkResponse,
    AuthSessionRead,
    AuthVerifyRequest,
    BudAction,
    BudRelationshipRead,
    CommunityStandardRead,
    ConversationMemberRead,
    ConversationMessageCreate,
    ConversationMessageRead,
    ConversationPreferenceUpdate,
    ConversationRead,
    CrewRead,
    MessageCreate,
    MessageRead,
    PersistenceChoiceUpdate,
    PlanFromMessageCreate,
    PlanCreate,
    PlanRead,
    RsvpCreate,
    RsvpRead,
    SafetyReportCreate,
    SafetyReportRead,
    SocialSimulationAdvance,
    SocialSimulationCreate,
    UxFeedbackCreate,
    UxFeedbackRead,
    UserCreate,
    UserRead,
    UserRef,
)
from .social_simulation import (
    advance_social_simulation,
    create_social_simulation,
    latest_social_simulation_for_user,
    simulation_summary,
)

app = FastAPI(title="DadBuds API", version="0.1.0")

ATTENDING_RSVP_STATUSES = {"going"}
BOOKMARK_RSVP_STATUSES = {"bookmarked", "interested", "maybe"}
VALID_RSVP_STATUSES = ATTENDING_RSVP_STATUSES | BOOKMARK_RSVP_STATUSES | {"declined"}
POST_EVENT_WINDOW_HOURS = 48

COMMUNITY_STANDARD = {
    "title": "Don’t Be a Dick",
    "summary": (
        "DadBuds is for making plans, meeting people, and keeping "
        "coordination practical. Keep conversations welcoming and socially safe."
    ),
    "short_rule": "Don’t be a dick.",
    "prohibited": [
        "political arguments",
        "religious debate or proselytizing",
        "culture-war bait",
        "alpha male or manosphere content",
        "misogyny",
        "harassment or bullying",
        "racism, homophobia, or other bigotry",
        "pickup-artist behavior",
        "aggressive sales pitches",
        "conspiracy dumping",
        "trying to dominate or win the group",
    ],
    "agent_redirect": (
        "Keep this thread focused on the plan. Political and religious debates "
        "belong somewhere else."
    ),
    "serious_redirect": (
        "That crossed the line. The message was removed. Keep it respectful "
        "or you’ll be removed from the crew."
    ),
}

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app_env = os.getenv("APP_ENV", "development").strip().lower()
allow_local_cors = os.getenv("ALLOW_LOCAL_CORS", "false").strip().lower() == "true"
allow_insecure_email_signin = (
    os.getenv("ALLOW_INSECURE_EMAIL_SIGNIN", "false").strip().lower() == "true"
)
allow_insecure_internal_features = (
    os.getenv("ALLOW_INSECURE_INTERNAL_FEATURES", "false").strip().lower() == "true"
)
auth_session_days = int(os.getenv("AUTH_SESSION_DAYS", "30"))
auth_link_minutes = int(os.getenv("AUTH_LINK_MINUTES", "15"))

INSECURE_INTERNAL_PREFIXES = (
    "/availability",
    "/bud-requests",
    "/buds",
    "/conversations",
    "/crews",
    "/me",
    "/rsvps",
    "/safety-reports",
    "/simulations",
    "/users",
)

INSECURE_INTERNAL_PLAN_SEGMENTS = (
    "/conversation",
    "/rsvps",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+"
    if allow_local_cors or app_env != "production"
    else None,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Token"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()",
        )
        response.headers.setdefault("Cache-Control", "no-store")
        if request.url.scheme == "https" or app_env == "production":
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload",
            )
        return response


app.add_middleware(SecurityHeadersMiddleware)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def auth_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def auth_base_url() -> str:
    return os.getenv("APP_BASE_URL", "http://localhost:5173").rstrip("/")


def smtp_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_FROM"))


def send_auth_link(email: str, link: str) -> None:
    host = os.getenv("SMTP_HOST", "")
    from_email = os.getenv("SMTP_FROM", "")
    if not host or not from_email:
        raise RuntimeError("SMTP_HOST and SMTP_FROM are required to send auth links.")

    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    use_tls = os.getenv("SMTP_TLS", "true").strip().lower() != "false"

    message = EmailMessage()
    message["Subject"] = "Your DadBuds sign-in link"
    message["From"] = from_email
    message["To"] = email
    message.set_content(
        "Use this link to sign in to DadBuds. It expires soon and works once.\n\n"
        f"{link}\n\n"
        "If you did not request this, you can ignore it."
    )

    with smtplib.SMTP(host, port, timeout=10) as smtp:
        if use_tls:
            smtp.starttls()
        if username:
            smtp.login(username, password)
        smtp.send_message(message)


def bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return None
    token = authorization[len(prefix) :].strip()
    return token or None


def user_id_for_session_token(session: Session, token: str) -> Optional[int]:
    auth_session = session.exec(
        select(AuthSession).where(AuthSession.token_hash == token_hash(token))
    ).first()
    if not auth_session or auth_session.revoked_at:
        return None
    if auth_session.expires_at <= auth_now():
        return None
    return auth_session.user_id


def user_id_from_authorization(
    session: Session, authorization: Optional[str]
) -> Optional[int]:
    token = bearer_token(authorization)
    if not token:
        return None
    return user_id_for_session_token(session, token)


def route_requires_verified_user_session(path: str, method: str) -> bool:
    if path == "/users" or path.startswith("/users/"):
        return True
    if path == "/plans" and method == "POST":
        return False
    if path.startswith("/plans/") and any(
        segment in path for segment in INSECURE_INTERNAL_PLAN_SEGMENTS
    ):
        return True
    return path.startswith(INSECURE_INTERNAL_PREFIXES)


class ProductionAuthGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if (
            app_env == "production"
            and not allow_insecure_internal_features
            and route_requires_verified_user_session(
                request.url.path,
                request.method.upper(),
            )
        ):
            token = request.headers.get("x-admin-token")
            if token:
                try:
                    verify_admin_token(token)
                except HTTPException:
                    token = None
            auth_user_id = None
            bearer = bearer_token(request.headers.get("authorization"))
            if bearer:
                with Session(engine) as session:
                    auth_user_id = user_id_for_session_token(session, bearer)
            if not token and not auth_user_id:
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": (
                            "Internal DadBuds user features require secure session "
                            "auth before production exposure."
                        )
                    },
                )
        return await call_next(request)


app.add_middleware(ProductionAuthGuardMiddleware)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        seed_plans(session)


@app.get("/health")
def health(session: Session = Depends(get_session)) -> dict[str, str]:
    return {
        "status": "ok",
        "shadow_mode": "true" if os.getenv("SHADOW_MODE") == "true" else "false",
        "runtime_date": current_runtime_date(session).isoformat(),
    }


@app.get("/community-standard", response_model=CommunityStandardRead)
def read_community_standard() -> CommunityStandardRead:
    return CommunityStandardRead(**COMMUNITY_STANDARD)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def configured_admin_token() -> str:
    return os.getenv("ADMIN_TOKEN", "").strip()


def verify_admin_token(x_admin_token: Optional[str]) -> None:
    token = configured_admin_token()
    if not token or token in {"change-me", "replace-with-a-long-random-admin-token"}:
        raise HTTPException(
            status_code=503,
            detail="Admin auth is not configured. Set ADMIN_TOKEN before using admin routes.",
        )
    if len(token) < 32:
        raise HTTPException(
            status_code=503,
            detail="Admin auth token is too short. Use a generated 32+ character token.",
        )
    if not x_admin_token or not secrets.compare_digest(x_admin_token, token):
        raise HTTPException(status_code=401, detail="Invalid admin token.")


def require_admin(x_admin_token: Optional[str] = Header(default=None)) -> None:
    verify_admin_token(x_admin_token)


def require_current_user(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> DadUser:
    user_id = user_id_from_authorization(session, authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in required.")
    return require_user(session, user_id)


def current_runtime_date(session: Session) -> date:
    if os.getenv("SHADOW_MODE") == "true":
        simulation = latest_social_simulation_for_user(session, None)
        if simulation:
            return date.fromisoformat(simulation.current_date)
    return date.today()


def shadow_sim_event_candidates(
    session: Session, runtime_date: date
) -> list[EventCandidate]:
    plans = session.exec(
        select(Plan)
        .join(PlanTag, PlanTag.plan_id == Plan.id)
        .where(PlanTag.tag == "Shadow sim", Plan.date >= runtime_date.isoformat())
        .order_by(Plan.created_at.desc())
        .limit(24)
    ).all()
    return [
        EventCandidate(
            source_key=f"shadow-sim-plan-{plan.id}",
            title=plan.title,
            description=(
                "Shadow sim proposal generated by an agent. It has also been "
                "published into the Spokane Calendar for testing."
            ),
            category="Shadow sim",
            date=date.fromisoformat(plan.date),
            start_time=plan.start_time,
            end_time=plan.end_time,
            location=plan.location,
            location_url=location_url_for(plan.location),
            source_url="/sim",
            cost=plan.cost,
            kid_friendly=plan.kid_friendly,
            capacity=plan.capacity,
            tags=tuple(plan_tags(session, plan.id)),
            related_interests=tuple(plan_interests(session, plan.id)),
            status="ready",
        )
        for plan in plans
    ]


def require_shadow_runtime() -> None:
    if os.getenv("SHADOW_MODE") != "true":
        raise HTTPException(
            status_code=403,
            detail="Social simulations run only against the shadow database.",
        )


@app.get("/event-sources")
def list_event_sources(_admin: None = Depends(require_admin)) -> dict[str, object]:
    return {
        "sources": [
            {
                "key": source.key,
                "type": source.source_type,
                "name": source.name,
                "category": source.category,
                "default_venue": source.default_venue,
                "source_url": source.source_url,
                "owner": source.owner,
                "cadence": source.cadence,
            }
            for source in event_source_catalog()
        ],
        "venues": [
            {
                "name": venue.name,
                "google_maps_url": venue.google_maps_url,
                "validation_status": venue.validation_status,
            }
            for venue in venue_catalog().values()
        ],
    }


def event_stream_sort_key(event: EventCandidate) -> tuple[object, ...]:
    if event.source_key == "seatgeek-spokane":
        tier = 0
    elif event.source_key.startswith("shadow-sim"):
        tier = 2
    elif event.status == "needs_ingestion":
        tier = 3
    else:
        tier = 1
    return (
        tier,
        event.date is None,
        event.date or date.max,
        event.start_time,
        event.title,
    )


@app.get("/local-events")
def list_local_events(session: Session = Depends(get_session)) -> dict[str, object]:
    runtime_date = current_runtime_date(session)
    events = local_event_candidates(runtime_date)
    if os.getenv("SHADOW_MODE") == "true":
        events = events + shadow_sim_event_candidates(session, runtime_date)
    events = sorted(events, key=event_stream_sort_key)
    return {
        "events": [
            {
                "source_key": event.source_key,
                "title": event.title,
                "description": event.description,
                "category": event.category,
                "date": event.date.isoformat() if event.date else None,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "location": event.location,
                "location_url": event.location_url,
                "source_url": event.source_url,
                "cost": event.cost,
                "kid_friendly": event.kid_friendly,
                "capacity": event.capacity,
                "tags": list(event.tags),
                "related_interests": list(event.related_interests),
                "status": event.status,
            }
            for event in events
        ],
        "sources": [
            {
                "key": source.key,
                "type": source.source_type,
                "name": source.name,
                "category": source.category,
                "default_venue": source.default_venue,
                "source_url": source.source_url,
                "owner": source.owner,
                "cadence": source.cadence,
            }
            for source in event_source_catalog()
        ],
    }


def get_user_by_email(session: Session, email: str) -> Optional[DadUser]:
    statement = select(DadUser).where(DadUser.email == normalize_email(email))
    return session.exec(statement).first()


def get_or_create_interest(session: Session, name: str) -> Interest:
    clean = name.strip()
    existing = session.exec(select(Interest).where(Interest.name == clean)).first()
    if existing:
        return existing
    interest = Interest(name=clean)
    session.add(interest)
    session.flush()
    return interest


def ux_feedback_to_read(item: UxFeedback) -> UxFeedbackRead:
    return UxFeedbackRead(
        id=item.id,
        source_type=item.source_type,
        page=item.page,
        severity=item.severity,
        body=item.body,
        status=item.status,
        simulation_id=item.simulation_id,
        agent_id=item.agent_id,
        created_at=item.created_at,
    )


@app.get("/ux-feedback", response_model=list[UxFeedbackRead])
def list_ux_feedback(
    simulation_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
):
    statement = select(UxFeedback)
    if simulation_id:
        statement = statement.where(UxFeedback.simulation_id == simulation_id)
    if status:
        statement = statement.where(UxFeedback.status == status)
    statement = statement.order_by(UxFeedback.created_at.desc(), UxFeedback.id.desc())
    items = session.exec(statement.limit(80)).all()
    return [ux_feedback_to_read(item) for item in items]


@app.post("/ux-feedback", response_model=UxFeedbackRead)
def create_ux_feedback(
    payload: UxFeedbackCreate,
    session: Session = Depends(get_session),
):
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="Feedback cannot be empty.")
    item = UxFeedback(
        source_type=payload.source_type.strip() or "human",
        page=payload.page.strip(),
        severity=payload.severity.strip() or "painpoint",
        body=body,
        simulation_id=payload.simulation_id,
        agent_id=payload.agent_id,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return ux_feedback_to_read(item)


def user_to_read(session: Session, user: DadUser) -> UserRead:
    interest_statement = (
        select(Interest.name)
        .join(UserInterest, UserInterest.interest_id == Interest.id)
        .where(UserInterest.user_id == user.id)
    )
    availability_statement = select(UserAvailabilityPreference.label).where(
        UserAvailabilityPreference.user_id == user.id
    )
    return UserRead(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        neighborhood=user.neighborhood,
        age_range=user.age_range,
        kids_age_range=user.kids_age_range,
        discord_username=user.discord_username,
        sms_opt_in=user.sms_opt_in,
        comfort_level=user.comfort_level,
        interests=list(session.exec(interest_statement)),
        typical_availability=list(session.exec(availability_statement)),
        created_at=user.created_at,
    )


def user_ref(user: DadUser) -> UserRef:
    return UserRef(id=user.id, name=user.name, neighborhood=user.neighborhood)


def require_user(session: Session, user_id: int) -> DadUser:
    user = session.get(DadUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


def canonical_user_pair(user_id: int, other_user_id: int) -> tuple[int, int]:
    if user_id == other_user_id:
        raise HTTPException(status_code=400, detail="Choose another user.")
    return tuple(sorted((user_id, other_user_id)))


def find_relationship(
    session: Session, user_id: int, other_user_id: int
) -> Optional[BudRelationship]:
    user_a_id, user_b_id = canonical_user_pair(user_id, other_user_id)
    return session.exec(
        select(BudRelationship).where(
            BudRelationship.user_a_id == user_a_id,
            BudRelationship.user_b_id == user_b_id,
        )
    ).first()


def get_or_create_relationship(
    session: Session, user_id: int, other_user_id: int
) -> BudRelationship:
    require_user(session, user_id)
    require_user(session, other_user_id)
    relationship = find_relationship(session, user_id, other_user_id)
    if relationship:
        return relationship
    user_a_id, user_b_id = canonical_user_pair(user_id, other_user_id)
    relationship = BudRelationship(user_a_id=user_a_id, user_b_id=user_b_id)
    session.add(relationship)
    session.flush()
    return relationship


def relationship_saved_by(relationship: BudRelationship, user_id: int) -> bool:
    return (
        relationship.user_a_saved
        if relationship.user_a_id == user_id
        else relationship.user_b_saved
    )


def set_relationship_saved(
    relationship: BudRelationship, user_id: int, saved: bool
) -> None:
    if relationship.user_a_id == user_id:
        relationship.user_a_saved = saved
    else:
        relationship.user_b_saved = saved


def update_relationship_status(relationship: BudRelationship) -> None:
    if relationship.confirmation_status == "blocked":
        return
    if relationship.user_a_saved and relationship.user_b_saved:
        relationship.confirmation_status = "confirmed"
        relationship.requested_by_user_id = None
        relationship.request_expires_at = None
    elif relationship.confirmation_status == "confirmed":
        relationship.confirmation_status = "removed"
    elif relationship.confirmation_status == "removed" and (
        relationship.user_a_saved or relationship.user_b_saved
    ):
        relationship.confirmation_status = "none"
    relationship.updated_at = datetime.now(timezone.utc)


def confirmed_bud_ids(session: Session, user_id: int) -> set[int]:
    relationships = session.exec(
        select(BudRelationship).where(
            (BudRelationship.user_a_id == user_id)
            | (BudRelationship.user_b_id == user_id),
            BudRelationship.confirmation_status == "confirmed",
        )
    ).all()
    return {
        item.user_b_id if item.user_a_id == user_id else item.user_a_id
        for item in relationships
    }


def mutual_bud_count(session: Session, user_id: int, other_user_id: int) -> int:
    return len(confirmed_bud_ids(session, user_id) & confirmed_bud_ids(session, other_user_id))


def relationship_to_read(
    session: Session, relationship: BudRelationship, viewer_user_id: int
) -> BudRelationshipRead:
    other_user_id = (
        relationship.user_b_id
        if relationship.user_a_id == viewer_user_id
        else relationship.user_a_id
    )
    other_user = require_user(session, other_user_id)
    saved_by_me = relationship_saved_by(relationship, viewer_user_id)
    if relationship.confirmation_status == "blocked":
        state = "blocked"
    elif relationship.confirmation_status == "confirmed":
        state = "confirmed"
    elif relationship.confirmation_status == "pending":
        state = "request_pending"
    elif saved_by_me:
        state = "saved_private"
    else:
        state = "none"
    return BudRelationshipRead(
        id=relationship.id,
        other_user=user_ref(other_user),
        relationship_state=state,
        confirmation_status=relationship.confirmation_status,
        saved_by_me=saved_by_me,
        mutual_bud_count=mutual_bud_count(session, viewer_user_id, other_user_id),
        request_expires_at=relationship.request_expires_at,
    )


def conversation_member_to_read(
    session: Session, member: ConversationMember
) -> ConversationMemberRead:
    return ConversationMemberRead(
        id=member.id,
        user=user_ref(require_user(session, member.user_id)),
        membership_status=member.membership_status,
        notification_preference=member.notification_preference,
        persistence_choice=member.persistence_choice,
        joined_at=member.joined_at,
        muted_at=member.muted_at,
        left_at=member.left_at,
    )


def conversation_message_to_read(
    session: Session, message: ConversationMessage
) -> ConversationMessageRead:
    sender = session.get(DadUser, message.sender_user_id) if message.sender_user_id else None
    return ConversationMessageRead(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_type=message.sender_type,
        sender_user=user_ref(sender) if sender else None,
        body=message.body,
        message_type=message.message_type,
        created_at=message.created_at,
        deleted_at=message.deleted_at,
    )


def read_conversation_member(
    session: Session, conversation_id: int, user_id: int
) -> Optional[ConversationMember]:
    return session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    ).first()


def eligible_rsvp(session: Session, plan_id: int, user_id: int) -> Optional[Rsvp]:
    return session.exec(
        select(Rsvp).where(Rsvp.plan_id == plan_id, Rsvp.user_id == user_id)
    ).first()


def plan_start_at(plan: Plan) -> Optional[datetime]:
    try:
        scheduled_start = datetime.fromisoformat(f"{plan.date}T{plan.start_time}")
    except ValueError:
        return None
    return scheduled_start.replace(tzinfo=timezone.utc)


def plan_has_started(plan: Plan) -> bool:
    scheduled_start = plan_start_at(plan)
    return bool(scheduled_start and datetime.now(timezone.utc) >= scheduled_start)


def rsvp_allows_thread(plan: Plan, rsvp: Optional[Rsvp]) -> bool:
    if not rsvp:
        return False
    if rsvp.status in ATTENDING_RSVP_STATUSES:
        return True
    if rsvp.status in BOOKMARK_RSVP_STATUSES:
        return not plan_has_started(plan)
    return False


def thread_denial_message(plan: Plan, rsvp: Optional[Rsvp]) -> str:
    if rsvp and rsvp.status in BOOKMARK_RSVP_STATUSES and plan_has_started(plan):
        return "Bookmark threads fall off when the event starts. Attend to keep access."
    if rsvp and rsvp.status == "declined":
        return "Attend to unlock this thread."
    return "Bookmark or attend to unlock this thread."


def require_plan_thread_access(
    session: Session, plan: Plan, user_id: int
) -> Rsvp:
    rsvp = eligible_rsvp(session, plan.id, user_id)
    if not rsvp_allows_thread(plan, rsvp):
        raise HTTPException(status_code=403, detail=thread_denial_message(plan, rsvp))
    return rsvp


def post_event_expires_at(plan: Plan) -> Optional[datetime]:
    try:
        end_time = plan.end_time or plan.start_time
        scheduled_end = datetime.fromisoformat(f"{plan.date}T{end_time}")
    except ValueError:
        return None
    return scheduled_end.replace(tzinfo=timezone.utc) + timedelta(
        hours=POST_EVENT_WINDOW_HOURS
    )


def get_or_create_plan_conversation(
    session: Session, plan: Plan
) -> Conversation:
    conversation = session.exec(
        select(Conversation).where(
            Conversation.conversation_type == "plan",
            Conversation.related_plan_id == plan.id,
        )
    ).first()
    if conversation:
        return conversation
    conversation = Conversation(
        conversation_type="plan",
        related_plan_id=plan.id,
        lifecycle_status="active",
        expires_at=post_event_expires_at(plan),
    )
    session.add(conversation)
    session.flush()
    opener = ConversationMessage(
        conversation_id=conversation.id,
        sender_type="dadbuds",
        body=(
            f"{plan.title} thread. Use this to coordinate, ask questions, "
            "or follow updates before deciding."
        ),
    )
    session.add(opener)
    session.flush()
    return conversation


def ensure_conversation_member(
    session: Session, conversation: Conversation, user_id: int
) -> ConversationMember:
    require_user(session, user_id)
    member = read_conversation_member(session, conversation.id, user_id)
    if member:
        if member.membership_status == "left":
            member.membership_status = "active"
            member.left_at = None
            session.add(member)
        return member
    member = ConversationMember(conversation_id=conversation.id, user_id=user_id)
    session.add(member)
    session.flush()
    return member


def require_active_conversation_member(
    session: Session, conversation_id: int, user_id: int
) -> ConversationMember:
    member = read_conversation_member(session, conversation_id, user_id)
    if not member or member.membership_status == "left":
        raise HTTPException(status_code=403, detail="Join the thread before reading it.")
    return member


def conversation_to_read(
    session: Session, conversation: Conversation, viewer_user_id: Optional[int] = None
) -> ConversationRead:
    plan = session.get(Plan, conversation.related_plan_id) if conversation.related_plan_id else None
    if viewer_user_id and plan:
        require_plan_thread_access(session, plan, viewer_user_id)
    if viewer_user_id:
        require_active_conversation_member(session, conversation.id, viewer_user_id)
    members = session.exec(
        select(ConversationMember)
        .where(ConversationMember.conversation_id == conversation.id)
        .order_by(ConversationMember.joined_at)
    ).all()
    messages = session.exec(
        select(ConversationMessage)
        .where(ConversationMessage.conversation_id == conversation.id)
        .order_by(ConversationMessage.created_at)
    ).all()
    crew = session.get(Crew, conversation.related_crew_id) if conversation.related_crew_id else None
    current_member = (
        read_conversation_member(session, conversation.id, viewer_user_id)
        if viewer_user_id
        else None
    )
    return ConversationRead(
        id=conversation.id,
        conversation_type=conversation.conversation_type,
        related_plan_id=conversation.related_plan_id,
        related_crew_id=conversation.related_crew_id,
        lifecycle_status=conversation.lifecycle_status,
        expires_at=conversation.expires_at,
        graduated_at=conversation.graduated_at,
        plan_title=plan.title if plan else None,
        crew_name=crew.name if crew else None,
        current_member=(
            conversation_member_to_read(session, current_member)
            if current_member
            else None
        ),
        members=[conversation_member_to_read(session, member) for member in members],
        messages=[conversation_message_to_read(session, message) for message in messages],
        can_post=bool(current_member and current_member.membership_status == "active"),
    )


def crew_member_to_conversation_member_read(
    session: Session, member: CrewMember
) -> ConversationMemberRead:
    return ConversationMemberRead(
        id=member.id,
        user=user_ref(require_user(session, member.user_id)),
        membership_status=member.status,
        notification_preference=member.notification_preference,
        persistence_choice="keep",
        joined_at=member.joined_at,
        muted_at=None if member.notification_preference != "muted" else member.joined_at,
        left_at=member.left_at,
    )


def crew_to_read(session: Session, crew: Crew) -> CrewRead:
    members = session.exec(
        select(CrewMember)
        .where(CrewMember.crew_id == crew.id)
        .order_by(CrewMember.joined_at)
    ).all()
    return CrewRead(
        id=crew.id,
        name=crew.name,
        status=crew.status,
        origin_conversation_id=crew.origin_conversation_id,
        created_at=crew.created_at,
        members=[
            crew_member_to_conversation_member_read(session, member)
            for member in members
        ],
    )


def maybe_graduate_conversation(session: Session, conversation: Conversation) -> Optional[Crew]:
    keepers = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation.id,
            ConversationMember.persistence_choice == "keep",
            ConversationMember.membership_status == "active",
        )
    ).all()
    if len(keepers) < 2:
        return None
    existing = session.exec(
        select(Crew).where(Crew.origin_conversation_id == conversation.id)
    ).first()
    if existing:
        return existing
    plan = session.get(Plan, conversation.related_plan_id) if conversation.related_plan_id else None
    crew_name = f"{plan.title} Crew" if plan else "DadBuds Crew"
    crew = Crew(name=crew_name, origin_conversation_id=conversation.id)
    session.add(crew)
    session.flush()
    conversation.lifecycle_status = "graduated"
    conversation.graduated_at = datetime.now(timezone.utc)
    conversation.related_crew_id = crew.id
    session.add(conversation)
    for keeper in keepers:
        session.add(CrewMember(crew_id=crew.id, user_id=keeper.user_id))
    crew_conversation = Conversation(
        conversation_type="crew",
        related_crew_id=crew.id,
        lifecycle_status="active",
    )
    session.add(crew_conversation)
    session.flush()
    for keeper in keepers:
        session.add(
            ConversationMember(
                conversation_id=crew_conversation.id,
                user_id=keeper.user_id,
            )
        )
    session.add(
        ConversationMessage(
            conversation_id=crew_conversation.id,
            sender_type="dadbuds",
            body=f"{crew.name} is live. Keep it useful, practical, and respectful.",
        )
    )
    session.flush()
    return crew


def availability_to_read(
    session: Session, item: AvailabilityWindow
) -> AvailabilityRead:
    user = session.get(DadUser, item.user_id) if item.user_id else None
    return AvailabilityRead(
        id=item.id,
        user_id=item.user_id,
        user_name=user.name if user else None,
        user_email=user.email if user else item.guest_email,
        date=item.date,
        start_time=item.start_time,
        end_time=item.end_time,
        kid_status=item.kid_status,
        preferred_vibe=item.preferred_vibe,
        notes=item.notes,
        status=item.status,
        created_at=item.created_at,
    )


def plan_tags(session: Session, plan_id: int) -> list[str]:
    return list(
        session.exec(select(PlanTag.tag).where(PlanTag.plan_id == plan_id))
    )


def plan_interests(session: Session, plan_id: int) -> list[str]:
    return list(
        session.exec(
            select(PlanRelatedInterest.interest).where(
                PlanRelatedInterest.plan_id == plan_id
            )
        )
    )


def plan_to_read(
    session: Session, plan: Plan, viewer_user_id: Optional[int] = None
) -> PlanRead:
    rsvp_count = session.exec(
        select(func.count(Rsvp.id)).where(
            Rsvp.plan_id == plan.id,
            Rsvp.status == "going",
        )
    ).one()
    viewer_rsvp = (
        eligible_rsvp(session, plan.id, viewer_user_id)
        if viewer_user_id and plan.id
        else None
    )
    return PlanRead(
        id=plan.id,
        title=plan.title,
        description=plan.description,
        date=plan.date,
        start_time=plan.start_time,
        end_time=plan.end_time,
        location=plan.location,
        location_url=location_url_for(plan.location),
        cost=plan.cost,
        kid_friendly=plan.kid_friendly,
        capacity=plan.capacity,
        status=plan.status,
        visibility=plan.visibility,
        tags=plan_tags(session, plan.id),
        related_interests=plan_interests(session, plan.id),
        rsvp_count=rsvp_count,
        viewer_status=viewer_rsvp.status if viewer_rsvp else None,
        thread_available=rsvp_allows_thread(plan, viewer_rsvp),
        created_at=plan.created_at,
    )


def rsvp_to_read(session: Session, rsvp: Rsvp, plan: Optional[Plan] = None) -> RsvpRead:
    plan = plan or session.get(Plan, rsvp.plan_id)
    return RsvpRead(
        id=rsvp.id,
        plan_id=rsvp.plan_id,
        plan_title=plan.title if plan else "Deleted plan",
        plan_date=plan.date if plan else "",
        plan_start_time=plan.start_time if plan else "",
        plan_end_time=plan.end_time if plan else "",
        plan_location=plan.location if plan else "",
        plan_location_url=location_url_for(plan.location) if plan else None,
        plan_cost=plan.cost if plan else "",
        plan_kid_friendly=plan.kid_friendly if plan else False,
        user_id=rsvp.user_id,
        status=rsvp.status,
        created_at=rsvp.created_at,
    )


def message_to_read(message: Message) -> MessageRead:
    return MessageRead(
        id=message.id,
        channel=message.channel,
        recipient_type=message.recipient_type,
        recipient_id=message.recipient_id,
        body=message.body,
        status=message.status,
        related_plan_id=message.related_plan_id,
        created_at=message.created_at,
        sent_at=message.sent_at,
    )


@app.post("/auth/request-link", response_model=AuthLinkResponse)
def request_auth_link(
    payload: AuthLinkRequest,
    session: Session = Depends(get_session),
) -> AuthLinkResponse:
    email = normalize_email(payload.email)
    user = get_user_by_email(session, email)
    generic = AuthLinkResponse(
        status="ok",
        detail="If that email is in DadBuds, a sign-in link will be sent.",
    )
    if not user:
        return generic

    raw_token = secrets.token_urlsafe(32)
    login_token = AuthLoginToken(
        email=email,
        user_id=user.id,
        token_hash=token_hash(raw_token),
        expires_at=auth_now() + timedelta(minutes=auth_link_minutes),
    )
    session.add(login_token)
    session.commit()

    link = f"{auth_base_url()}/signin?token={raw_token}"
    if smtp_configured():
        send_auth_link(email, link)
        return generic
    if app_env == "production":
        raise HTTPException(
            status_code=503,
            detail="Email delivery is not configured. Set SMTP_HOST and SMTP_FROM.",
        )
    return AuthLinkResponse(
        status="ok",
        detail="Development sign-in link generated.",
        magic_link=link,
    )


@app.post("/auth/verify", response_model=AuthSessionRead)
def verify_auth_link(
    payload: AuthVerifyRequest,
    session: Session = Depends(get_session),
) -> AuthSessionRead:
    raw_token = payload.token.strip()
    if not raw_token:
        raise HTTPException(status_code=400, detail="Missing sign-in token.")
    login_token = session.exec(
        select(AuthLoginToken).where(AuthLoginToken.token_hash == token_hash(raw_token))
    ).first()
    if (
        not login_token
        or login_token.consumed_at
        or login_token.expires_at <= auth_now()
        or not login_token.user_id
    ):
        raise HTTPException(status_code=401, detail="Invalid or expired sign-in link.")

    user = session.get(DadUser, login_token.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    session_token = secrets.token_urlsafe(32)
    expires_at = auth_now() + timedelta(days=auth_session_days)
    auth_session = AuthSession(
        user_id=user.id,
        token_hash=token_hash(session_token),
        expires_at=expires_at,
    )
    login_token.consumed_at = auth_now()
    session.add(login_token)
    session.add(auth_session)
    session.commit()
    session.refresh(user)
    return AuthSessionRead(
        token=session_token,
        expires_at=expires_at,
        user=user_to_read(session, user),
    )


@app.get("/auth/me", response_model=UserRead)
def read_current_auth_user(current_user: DadUser = Depends(require_current_user)):
    with Session(engine) as session:
        user = session.get(DadUser, current_user.id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return user_to_read(session, user)


@app.post("/auth/logout")
def logout_current_session(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    raw_token = bearer_token(authorization)
    if raw_token:
        auth_session = session.exec(
            select(AuthSession).where(AuthSession.token_hash == token_hash(raw_token))
        ).first()
        if auth_session and not auth_session.revoked_at:
            auth_session.revoked_at = auth_now()
            session.add(auth_session)
            session.commit()
    return {"status": "signed_out"}


@app.post("/users", response_model=UserRead)
def create_user(payload: UserCreate, session: Session = Depends(get_session)):
    email = normalize_email(payload.email)
    if get_user_by_email(session, email):
        raise HTTPException(status_code=400, detail="A profile with that email already exists.")

    user = DadUser(
        name=payload.name.strip(),
        email=email,
        phone=payload.phone.strip(),
        neighborhood=payload.neighborhood.strip(),
        age_range=payload.age_range,
        kids_age_range=payload.kids_age_range,
        discord_username=payload.discord_username or None,
        sms_opt_in=payload.sms_opt_in,
        comfort_level=payload.comfort_level,
    )
    session.add(user)
    session.flush()

    for name in payload.interests:
        interest = get_or_create_interest(session, name)
        session.add(UserInterest(user_id=user.id, interest_id=interest.id))

    for label in payload.typical_availability:
        session.add(UserAvailabilityPreference(user_id=user.id, label=label))

    session.commit()
    session.refresh(user)
    return user_to_read(session, user)


@app.get("/users", response_model=list[UserRead])
def list_users(
    session: Session = Depends(get_session),
    _admin: None = Depends(require_admin),
):
    users = session.exec(select(DadUser).order_by(DadUser.created_at.desc())).all()
    return [user_to_read(session, user) for user in users]


@app.get("/users/by-email/{email}", response_model=UserRead)
def read_user_by_email(email: str, session: Session = Depends(get_session)):
    if not allow_insecure_email_signin and app_env == "production":
        raise HTTPException(
            status_code=403,
            detail="Email-only profile restore is disabled in production.",
        )
    user = get_user_by_email(session, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user_to_read(session, user)


@app.get("/users/{user_id}", response_model=UserRead)
def read_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    user = session.get(DadUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user_to_read(session, user)


@app.post("/users/{target_user_id}/save-bud", response_model=BudRelationshipRead)
def save_bud(
    target_user_id: int,
    payload: BudAction,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.actor_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    relationship = get_or_create_relationship(
        session, payload.actor_user_id, target_user_id
    )
    if relationship.confirmation_status == "blocked":
        raise HTTPException(status_code=403, detail="That user is blocked.")
    set_relationship_saved(relationship, payload.actor_user_id, True)
    update_relationship_status(relationship)
    session.add(relationship)
    session.commit()
    session.refresh(relationship)
    return relationship_to_read(session, relationship, payload.actor_user_id)


@app.delete("/users/{target_user_id}/save-bud", response_model=BudRelationshipRead)
def remove_saved_bud(
    target_user_id: int,
    payload: BudAction,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.actor_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    relationship = get_or_create_relationship(
        session, payload.actor_user_id, target_user_id
    )
    set_relationship_saved(relationship, payload.actor_user_id, False)
    update_relationship_status(relationship)
    session.add(relationship)
    session.commit()
    session.refresh(relationship)
    return relationship_to_read(session, relationship, payload.actor_user_id)


@app.post("/users/{target_user_id}/request-bud", response_model=BudRelationshipRead)
def request_bud(
    target_user_id: int,
    payload: BudAction,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.actor_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    relationship = get_or_create_relationship(
        session, payload.actor_user_id, target_user_id
    )
    if relationship.confirmation_status == "blocked":
        raise HTTPException(status_code=403, detail="That user is blocked.")
    if relationship.confirmation_status != "confirmed":
        relationship.confirmation_status = "pending"
        relationship.requested_by_user_id = payload.actor_user_id
        relationship.request_expires_at = datetime.now(timezone.utc) + timedelta(days=14)
        relationship.updated_at = datetime.now(timezone.utc)
    session.add(relationship)
    session.commit()
    session.refresh(relationship)
    return relationship_to_read(session, relationship, payload.actor_user_id)


@app.post("/bud-requests/{relationship_id}/confirm", response_model=BudRelationshipRead)
def confirm_bud_request(
    relationship_id: int,
    payload: BudAction,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.actor_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    relationship = session.get(BudRelationship, relationship_id)
    if not relationship:
        raise HTTPException(status_code=404, detail="Bud request not found.")
    if payload.actor_user_id not in {relationship.user_a_id, relationship.user_b_id}:
        raise HTTPException(status_code=403, detail="Not your bud request.")
    relationship.confirmation_status = "confirmed"
    relationship.user_a_saved = True
    relationship.user_b_saved = True
    relationship.requested_by_user_id = None
    relationship.request_expires_at = None
    relationship.updated_at = datetime.now(timezone.utc)
    session.add(relationship)
    session.commit()
    session.refresh(relationship)
    return relationship_to_read(session, relationship, payload.actor_user_id)


@app.post("/bud-requests/{relationship_id}/not-now", response_model=BudRelationshipRead)
def quiet_bud_request(
    relationship_id: int,
    payload: BudAction,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.actor_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    relationship = session.get(BudRelationship, relationship_id)
    if not relationship:
        raise HTTPException(status_code=404, detail="Bud request not found.")
    if payload.actor_user_id not in {relationship.user_a_id, relationship.user_b_id}:
        raise HTTPException(status_code=403, detail="Not your bud request.")
    relationship.confirmation_status = "none"
    relationship.requested_by_user_id = None
    relationship.request_expires_at = None
    relationship.updated_at = datetime.now(timezone.utc)
    session.add(relationship)
    session.commit()
    session.refresh(relationship)
    return relationship_to_read(session, relationship, payload.actor_user_id)


@app.delete("/buds/{target_user_id}", response_model=BudRelationshipRead)
def remove_confirmed_bud(
    target_user_id: int,
    payload: BudAction,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.actor_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    relationship = get_or_create_relationship(
        session, payload.actor_user_id, target_user_id
    )
    if relationship.confirmation_status == "confirmed":
        relationship.confirmation_status = "removed"
    set_relationship_saved(relationship, payload.actor_user_id, False)
    update_relationship_status(relationship)
    session.add(relationship)
    session.commit()
    session.refresh(relationship)
    return relationship_to_read(session, relationship, payload.actor_user_id)


@app.post("/users/{target_user_id}/block", response_model=BudRelationshipRead)
def block_user(
    target_user_id: int,
    payload: BudAction,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.actor_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    relationship = get_or_create_relationship(
        session, payload.actor_user_id, target_user_id
    )
    relationship.confirmation_status = "blocked"
    relationship.blocked_by_user_id = payload.actor_user_id
    relationship.requested_by_user_id = None
    relationship.request_expires_at = None
    relationship.updated_at = datetime.now(timezone.utc)
    session.add(relationship)
    session.commit()
    session.refresh(relationship)
    return relationship_to_read(session, relationship, payload.actor_user_id)


@app.delete("/users/{target_user_id}/block", response_model=BudRelationshipRead)
def unblock_user(
    target_user_id: int,
    payload: BudAction,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.actor_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    relationship = get_or_create_relationship(
        session, payload.actor_user_id, target_user_id
    )
    if relationship.blocked_by_user_id != payload.actor_user_id:
        raise HTTPException(status_code=403, detail="Only the blocker can unblock.")
    relationship.confirmation_status = "none"
    relationship.blocked_by_user_id = None
    update_relationship_status(relationship)
    session.add(relationship)
    session.commit()
    session.refresh(relationship)
    return relationship_to_read(session, relationship, payload.actor_user_id)


@app.get("/me/buds", response_model=list[BudRelationshipRead])
def list_my_buds(
    user_id: int = Query(),
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    require_user(session, user_id)
    relationships = session.exec(
        select(BudRelationship)
        .where(
            (BudRelationship.user_a_id == user_id)
            | (BudRelationship.user_b_id == user_id)
        )
        .order_by(BudRelationship.updated_at.desc())
    ).all()
    return [
        relationship_to_read(session, relationship, user_id)
        for relationship in relationships
        if relationship.confirmation_status != "none"
        or relationship_saved_by(relationship, user_id)
    ]


@app.get("/users/{target_user_id}/mutual-buds")
def read_mutual_buds(
    target_user_id: int,
    viewer_user_id: int = Query(),
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
) -> dict[str, object]:
    if viewer_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    require_user(session, viewer_user_id)
    require_user(session, target_user_id)
    return {
        "count": mutual_bud_count(session, viewer_user_id, target_user_id),
        "label": f"Connected through {mutual_bud_count(session, viewer_user_id, target_user_id)} buds.",
    }


@app.post("/availability", response_model=AvailabilityRead)
def create_availability(
    payload: AvailabilityCreate,
    session: Session = Depends(get_session),
    authorization: Optional[str] = Header(default=None),
):
    if payload.user_id:
        auth_user_id = user_id_from_authorization(session, authorization)
        if payload.user_id != auth_user_id:
            raise HTTPException(status_code=403, detail="That is not your account.")
    user = session.get(DadUser, payload.user_id) if payload.user_id else None
    if not user and payload.email:
        user = get_user_by_email(session, payload.email)

    item = AvailabilityWindow(
        user_id=user.id if user else None,
        guest_email=normalize_email(payload.email) if payload.email and not user else None,
        date=payload.date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        kid_status=payload.kid_status,
        preferred_vibe=payload.preferred_vibe,
        notes=payload.notes,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return availability_to_read(session, item)


@app.get("/availability", response_model=list[AvailabilityRead])
def list_availability(
    user_id: Optional[int] = Query(default=None),
    x_admin_token: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if user_id is None:
        verify_admin_token(x_admin_token)
    else:
        auth_user_id = user_id_from_authorization(session, authorization)
        if user_id != auth_user_id:
            raise HTTPException(status_code=403, detail="That is not your account.")
    statement = select(AvailabilityWindow)
    if user_id:
        statement = statement.where(AvailabilityWindow.user_id == user_id)
    statement = statement.order_by(AvailabilityWindow.created_at.desc())
    items = session.exec(statement).all()
    return [availability_to_read(session, item) for item in items]


@app.patch("/availability/{availability_id}/status", response_model=AvailabilityRead)
def update_availability_status(
    availability_id: int,
    payload: AvailabilityStatusUpdate,
    session: Session = Depends(get_session),
    _admin: None = Depends(require_admin),
):
    item = session.get(AvailabilityWindow, availability_id)
    if not item:
        raise HTTPException(status_code=404, detail="Availability not found.")
    item.status = payload.status
    session.add(item)
    session.commit()
    session.refresh(item)
    return availability_to_read(session, item)


@app.post("/plans", response_model=PlanRead)
def create_plan(
    payload: PlanCreate,
    session: Session = Depends(get_session),
    _admin: None = Depends(require_admin),
):
    plan = Plan(
        title=payload.title.strip(),
        description=payload.description.strip(),
        date=payload.date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location.strip(),
        cost=payload.cost.strip(),
        kid_friendly=payload.kid_friendly,
        capacity=payload.capacity,
        status=payload.status,
        visibility=payload.visibility,
    )
    session.add(plan)
    session.flush()

    for tag in payload.tags:
        if tag.strip():
            session.add(PlanTag(plan_id=plan.id, tag=tag.strip()))
    for interest in payload.related_interests:
        if interest.strip():
            session.add(
                PlanRelatedInterest(plan_id=plan.id, interest=interest.strip())
            )

    session.commit()
    session.refresh(plan)
    return plan_to_read(session, plan)


@app.get("/plans", response_model=list[PlanRead])
def list_plans(
    include_drafts: bool = Query(default=False),
    user_id: Optional[int] = Query(default=None),
    x_admin_token: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if include_drafts:
        verify_admin_token(x_admin_token)
    statement = select(Plan)
    if not include_drafts:
        runtime_date = current_runtime_date(session)
        statement = statement.where(
            Plan.status == "published",
            Plan.visibility.in_(["public", "signup_users"]),
            Plan.date >= runtime_date.isoformat(),
        )
    statement = statement.order_by(Plan.date, Plan.start_time)
    plans = session.exec(statement).all()
    return [plan_to_read(session, plan, user_id) for plan in plans]


@app.post("/plans/{plan_id}/rsvps", response_model=RsvpRead)
def create_rsvp(
    plan_id: int,
    payload: RsvpCreate,
    session: Session = Depends(get_session),
    authorization: Optional[str] = Header(default=None),
):
    plan = session.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    if payload.status not in VALID_RSVP_STATUSES:
        raise HTTPException(status_code=400, detail="Unsupported RSVP status.")
    if payload.status in BOOKMARK_RSVP_STATUSES and plan_has_started(plan):
        raise HTTPException(
            status_code=400,
            detail="Bookmarking closes when the event starts. Attend to keep access.",
        )

    if payload.user_id:
        auth_user_id = user_id_from_authorization(session, authorization)
        if payload.user_id != auth_user_id:
            raise HTTPException(status_code=403, detail="That is not your account.")

    user = session.get(DadUser, payload.user_id) if payload.user_id else None
    if not user and payload.email:
        user = get_user_by_email(session, payload.email)
    if not user and payload.email:
        user = DadUser(
            name=(payload.name or payload.email.split("@")[0]).strip(),
            email=normalize_email(payload.email),
            comfort_level="Just notify me",
        )
        session.add(user)
        session.flush()
    if not user:
        raise HTTPException(status_code=400, detail="RSVP requires a user or email.")

    existing = session.exec(
        select(Rsvp).where(Rsvp.plan_id == plan_id, Rsvp.user_id == user.id)
    ).first()
    if existing:
        existing.status = payload.status
        session.add(existing)
        rsvp = existing
    else:
        rsvp = Rsvp(plan_id=plan_id, user_id=user.id, status=payload.status)
        session.add(rsvp)
    session.flush()

    conversation = get_or_create_plan_conversation(session, plan)
    member = read_conversation_member(session, conversation.id, user.id)
    if rsvp_allows_thread(plan, rsvp):
        ensure_conversation_member(session, conversation, user.id)
    elif member:
        member.membership_status = "left"
        member.left_at = datetime.now(timezone.utc)
        session.add(member)

    session.commit()
    session.refresh(rsvp)
    return rsvp_to_read(session, rsvp, plan)


@app.delete("/plans/{plan_id}/rsvps")
def delete_rsvp(
    plan_id: int,
    user_id: Optional[int] = Query(default=None),
    email: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    plan = session.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    if user_id:
        auth_user_id = user_id_from_authorization(session, authorization)
        if user_id != auth_user_id:
            raise HTTPException(status_code=403, detail="That is not your account.")

    user = session.get(DadUser, user_id) if user_id else None
    if not user and email:
        user = get_user_by_email(session, email)
    if not user:
        raise HTTPException(status_code=400, detail="RSVP removal requires a user or email.")

    rsvp = session.exec(
        select(Rsvp).where(Rsvp.plan_id == plan_id, Rsvp.user_id == user.id)
    ).first()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found.")

    conversation = session.exec(
        select(Conversation).where(
            Conversation.conversation_type == "plan",
            Conversation.related_plan_id == plan.id,
        )
    ).first()
    if conversation:
        member = read_conversation_member(session, conversation.id, user.id)
        if member:
            member.membership_status = "left"
            member.left_at = datetime.now(timezone.utc)
            session.add(member)

    session.delete(rsvp)
    session.commit()
    return {"status": "removed"}


@app.get("/rsvps", response_model=list[RsvpRead])
def list_rsvps(
    user_id: Optional[int] = Query(default=None),
    x_admin_token: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if user_id is None:
        verify_admin_token(x_admin_token)
    else:
        auth_user_id = user_id_from_authorization(session, authorization)
        if user_id != auth_user_id:
            raise HTTPException(status_code=403, detail="That is not your account.")
    statement = select(Rsvp)
    if user_id:
        statement = statement.where(Rsvp.user_id == user_id)
    statement = statement.order_by(Rsvp.created_at.desc())
    rsvps = session.exec(statement).all()
    result: list[RsvpRead] = []
    for rsvp in rsvps:
        plan = session.get(Plan, rsvp.plan_id)
        if (
            user_id
            and plan
            and rsvp.status in BOOKMARK_RSVP_STATUSES
            and plan_has_started(plan)
        ):
            continue
        result.append(rsvp_to_read(session, rsvp, plan))
    return result


@app.get("/plans/{plan_id}/conversation", response_model=ConversationRead)
def read_plan_conversation(
    plan_id: int,
    user_id: int = Query(),
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    auth_user_id = user_id_from_authorization(session, authorization)
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    plan = session.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    require_plan_thread_access(session, plan, user_id)
    conversation = get_or_create_plan_conversation(session, plan)
    ensure_conversation_member(session, conversation, user_id)
    session.commit()
    session.refresh(conversation)
    return conversation_to_read(session, conversation, user_id)


@app.get("/conversations/{conversation_id}", response_model=ConversationRead)
def read_conversation(
    conversation_id: int,
    user_id: int = Query(),
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    auth_user_id = user_id_from_authorization(session, authorization)
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation_to_read(session, conversation, user_id)


@app.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[ConversationMessageRead],
)
def list_conversation_messages(
    conversation_id: int,
    user_id: int = Query(),
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    auth_user_id = user_id_from_authorization(session, authorization)
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if conversation.related_plan_id:
        plan = session.get(Plan, conversation.related_plan_id)
        if plan:
            require_plan_thread_access(session, plan, user_id)
    require_active_conversation_member(session, conversation_id, user_id)
    messages = session.exec(
        select(ConversationMessage)
        .where(ConversationMessage.conversation_id == conversation_id)
        .order_by(ConversationMessage.created_at)
    ).all()
    return [conversation_message_to_read(session, message) for message in messages]


@app.post(
    "/conversations/{conversation_id}/messages",
    response_model=ConversationMessageRead,
)
def create_conversation_message(
    conversation_id: int,
    payload: ConversationMessageCreate,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if conversation.related_plan_id:
        plan = session.get(Plan, conversation.related_plan_id)
        if plan:
            require_plan_thread_access(session, plan, payload.user_id)
    member = require_active_conversation_member(
        session, conversation_id, payload.user_id
    )
    if member.membership_status != "active":
        raise HTTPException(status_code=403, detail="You left this thread.")
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    message = ConversationMessage(
        conversation_id=conversation_id,
        sender_user_id=payload.user_id,
        sender_type="user",
        body=body,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return conversation_message_to_read(session, message)


@app.post("/conversations/{conversation_id}/mute", response_model=ConversationRead)
def mute_conversation(
    conversation_id: int,
    payload: ConversationPreferenceUpdate,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    member = require_active_conversation_member(
        session, conversation_id, payload.user_id
    )
    member.notification_preference = "muted"
    member.muted_at = datetime.now(timezone.utc)
    session.add(member)
    session.commit()
    session.refresh(conversation)
    return conversation_to_read(session, conversation)


@app.post("/conversations/{conversation_id}/leave", response_model=ConversationRead)
def leave_conversation(
    conversation_id: int,
    payload: ConversationPreferenceUpdate,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    member = require_active_conversation_member(
        session, conversation_id, payload.user_id
    )
    member.membership_status = "left"
    member.notification_preference = "muted"
    member.persistence_choice = "leave"
    member.left_at = datetime.now(timezone.utc)
    session.add(member)
    session.commit()
    session.refresh(conversation)
    return conversation_to_read(session, conversation, payload.user_id)


@app.post(
    "/conversations/{conversation_id}/persistence-choice",
    response_model=ConversationRead,
)
def set_persistence_choice(
    conversation_id: int,
    payload: PersistenceChoiceUpdate,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    member = require_active_conversation_member(
        session, conversation_id, payload.user_id
    )
    if payload.choice not in {"keep", "mute", "leave", "unanswered"}:
        raise HTTPException(status_code=400, detail="Invalid persistence choice.")
    member.persistence_choice = payload.choice
    if payload.choice == "mute":
        member.notification_preference = "muted"
        member.muted_at = datetime.now(timezone.utc)
    if payload.choice == "leave":
        member.membership_status = "left"
        member.notification_preference = "muted"
        member.left_at = datetime.now(timezone.utc)
    session.add(member)
    maybe_graduate_conversation(session, conversation)
    session.commit()
    session.refresh(conversation)
    if payload.choice == "leave":
        return conversation_to_read(session, conversation)
    return conversation_to_read(session, conversation, payload.user_id)


@app.post("/safety-reports", response_model=SafetyReportRead)
def create_safety_report(
    payload: SafetyReportCreate,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.reporter_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    require_user(session, payload.reporter_user_id)
    if payload.conversation_id:
        require_active_conversation_member(
            session, payload.conversation_id, payload.reporter_user_id
        )
    report = SafetyReport(
        reporter_user_id=payload.reporter_user_id,
        reported_user_id=payload.reported_user_id,
        conversation_id=payload.conversation_id,
        message_id=payload.message_id,
        report_type=payload.report_type,
        reason=payload.reason,
    )
    session.add(report)
    session.commit()
    session.refresh(report)
    return SafetyReportRead(
        id=report.id,
        reporter_user_id=report.reporter_user_id,
        reported_user_id=report.reported_user_id,
        conversation_id=report.conversation_id,
        message_id=report.message_id,
        report_type=report.report_type,
        reason=report.reason,
        status=report.status,
        created_at=report.created_at,
    )


@app.post("/messages/{message_id}/turn-into-plan", response_model=PlanRead)
def turn_message_into_plan(
    message_id: int,
    payload: PlanFromMessageCreate,
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    message = session.get(ConversationMessage, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")
    require_active_conversation_member(
        session, message.conversation_id, payload.user_id
    )
    plan_payload = PlanCreate(
        title=payload.title,
        description=f"Created from thread message: {message.body}",
        date=payload.date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        cost=payload.cost,
        kid_friendly=payload.kid_friendly,
        status="draft",
        visibility="signup_users",
        tags=["Crew idea"],
        related_interests=[],
    )
    plan = Plan(
        title=plan_payload.title.strip(),
        description=plan_payload.description,
        date=plan_payload.date,
        start_time=plan_payload.start_time,
        end_time=plan_payload.end_time,
        location=plan_payload.location.strip(),
        cost=plan_payload.cost.strip(),
        kid_friendly=plan_payload.kid_friendly,
        status=plan_payload.status,
        visibility=plan_payload.visibility,
    )
    session.add(plan)
    session.flush()
    session.add(PlanTag(plan_id=plan.id, tag="Crew idea"))
    session.commit()
    session.refresh(plan)
    return plan_to_read(session, plan)


@app.get("/me/crews", response_model=list[CrewRead])
def list_my_crews(
    user_id: int = Query(),
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    require_user(session, user_id)
    memberships = session.exec(
        select(CrewMember).where(
            CrewMember.user_id == user_id,
            CrewMember.status == "active",
        )
    ).all()
    crews = []
    for membership in memberships:
        crew = session.get(Crew, membership.crew_id)
        if crew:
            crews.append(crew_to_read(session, crew))
    return crews


@app.get("/crews/{crew_id}", response_model=CrewRead)
def read_crew(
    crew_id: int,
    user_id: int = Query(),
    session: Session = Depends(get_session),
    current_user: DadUser = Depends(require_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="That is not your account.")
    require_user(session, user_id)
    membership = session.exec(
        select(CrewMember).where(
            CrewMember.crew_id == crew_id,
            CrewMember.user_id == user_id,
            CrewMember.status == "active",
        )
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Join the crew before reading it.")
    crew = session.get(Crew, crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found.")
    return crew_to_read(session, crew)


@app.post("/simulations/social")
def create_social_sim(
    payload: SocialSimulationCreate,
    session: Session = Depends(get_session),
    _shadow: None = Depends(require_shadow_runtime),
    authorization: Optional[str] = Header(default=None),
) -> dict:
    if payload.user_id:
        auth_user_id = user_id_from_authorization(session, authorization)
        if payload.user_id != auth_user_id:
            raise HTTPException(status_code=403, detail="That is not your account.")
        require_user(session, payload.user_id)
    agent_count = max(25, min(payload.agent_count, 1000))
    simulation = create_social_simulation(
        session,
        human_user_id=payload.user_id,
        agent_count=agent_count,
        start_date=payload.start_date,
        name=payload.name,
    )
    return simulation_summary(session, simulation)


@app.get("/simulations/social/latest")
def read_latest_social_sim(
    user_id: Optional[int] = Query(default=None),
    session: Session = Depends(get_session),
    _shadow: None = Depends(require_shadow_runtime),
    authorization: Optional[str] = Header(default=None),
) -> dict:
    if user_id:
        auth_user_id = user_id_from_authorization(session, authorization)
        if user_id != auth_user_id:
            raise HTTPException(status_code=403, detail="That is not your account.")
    simulation = latest_social_simulation_for_user(session, user_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="No social simulation yet.")
    return simulation_summary(session, simulation)


@app.get("/simulations/social/{simulation_id}")
def read_social_simulation(
    simulation_id: int,
    session: Session = Depends(get_session),
    _shadow: None = Depends(require_shadow_runtime),
) -> dict:
    simulation = session.get(SocialSimulation, simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="Social simulation not found.")
    return simulation_summary(session, simulation)


@app.post("/simulations/social/{simulation_id}/advance")
def advance_social_sim(
    simulation_id: int,
    payload: SocialSimulationAdvance,
    session: Session = Depends(get_session),
    _shadow: None = Depends(require_shadow_runtime),
    authorization: Optional[str] = Header(default=None),
) -> dict:
    simulation = session.get(SocialSimulation, simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="Social simulation not found.")
    if payload.user_id and simulation.human_user_id != payload.user_id:
        raise HTTPException(status_code=403, detail="That is not your simulation.")
    if payload.user_id:
        auth_user_id = user_id_from_authorization(session, authorization)
        if payload.user_id != auth_user_id:
            raise HTTPException(status_code=403, detail="That is not your account.")
    days = max(1, min(payload.days, 30))
    if payload.human_action not in {"observe", "rsvp", "coordinate", "nudge"}:
        raise HTTPException(status_code=400, detail="Unsupported human action.")
    simulation = advance_social_simulation(
        session,
        simulation,
        days=days,
        human_action=payload.human_action,
    )
    return simulation_summary(session, simulation)


@app.post("/plans/{plan_id}/generate-message", response_model=MessageRead)
def generate_plan_message(
    plan_id: int,
    session: Session = Depends(get_session),
    _admin: None = Depends(require_admin),
):
    plan = session.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    related = plan_interests(session, plan_id)
    matching_count = 0
    if related:
        matching_count = session.exec(
            select(func.count(DadUser.id))
            .join(UserInterest, UserInterest.user_id == DadUser.id)
            .join(Interest, Interest.id == UserInterest.interest_id)
            .where(Interest.name.in_(related))
        ).one()

    body = (
        f"DadBuds found a Spokane plan: {plan.title} "
        f"{plan.date} at {plan.start_time}. "
        f"{matching_count} profiles match the related interests. Bookmark, attend, or pass."
    )
    message = Message(
        channel="SMS",
        recipient_type="group",
        body=body,
        status="draft",
        related_plan_id=plan.id,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message_to_read(message)


@app.get("/messages", response_model=list[MessageRead])
def list_messages(
    session: Session = Depends(get_session),
    _admin: None = Depends(require_admin),
):
    messages = session.exec(select(Message).order_by(Message.created_at.desc())).all()
    return [message_to_read(message) for message in messages]


@app.post("/messages", response_model=MessageRead)
def create_message(
    payload: MessageCreate,
    session: Session = Depends(get_session),
    _admin: None = Depends(require_admin),
):
    message = Message(
        channel=payload.channel,
        recipient_type=payload.recipient_type,
        recipient_id=payload.recipient_id,
        body=payload.body,
        status=payload.status,
        related_plan_id=payload.related_plan_id,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message_to_read(message)


@app.patch("/messages/{message_id}/fake-send", response_model=MessageRead)
def fake_send_message(
    message_id: int,
    session: Session = Depends(get_session),
    _admin: None = Depends(require_admin),
):
    message = session.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")
    message.status = "fake-sent"
    message.sent_at = datetime.now(timezone.utc)
    session.add(message)
    session.commit()
    session.refresh(message)
    return message_to_read(message)


def seed_start_date() -> date:
    configured = os.getenv("SEED_START_DATE", "").strip()
    if configured:
        return date.fromisoformat(configured)
    return date.today()


def kid_friendly_seed_for(seed_date: date, week: int) -> PlanCreate:
    venues = [
        {
            "title": "Playground Hang at Manito Park",
            "location": "Manito Park Playground",
            "cost": "Free",
            "description": "Weekend kid-friendly plan at Manito Park Playground. Open time for families to meet and use the park.",
        },
        {
            "title": "Playground Hang at Jefferson Park",
            "location": "Jefferson Park Playground",
            "cost": "Free",
            "description": "Weekend kid-friendly plan at Jefferson Park Playground. Simple park meetup with a clear start and end time.",
        },
        {
            "title": "Playground Hang at Ice Age Park",
            "location": "Ice Age Park",
            "cost": "Free",
            "description": "Weekend kid-friendly plan at Ice Age Park. Playground time for families on the regular weekend schedule.",
        },
    ]
    if seed_date.month in [6, 7, 8]:
        venues.append(
            {
                "title": "Aquatic Hang at Southside Family Aquatics Facility",
                "location": "Southside Family Aquatics Facility",
                "cost": "Admission varies",
                "description": "Summer kid-friendly plan at Southside Family Aquatics Facility. Seasonal swim option for June through August.",
            }
        )

    venue = venues[week % len(venues)]
    require_validated_venue(venue["location"])
    return PlanCreate(
        title=venue["title"],
        description=venue["description"],
        date=seed_date.isoformat(),
        start_time="10:00",
        end_time="11:30",
        location=venue["location"],
        cost=venue["cost"],
        kid_friendly=True,
        capacity=None,
        status="published",
        visibility="public",
        tags=["Weekend park", "Outdoors", "Dad/kid"],
        related_interests=["Outdoors", "Dad/kid activities", "Coffee"],
    )


def recurring_seed_plans(today: Optional[date] = None) -> list[PlanCreate]:
    today = today or seed_start_date()
    first_saturday = next_weekday(today, 5)
    first_sunday = next_weekday(today, 6)

    pickleball_venues = [
        "Comstock Park",
        "Wunderground",
        "Coeur d'Alene Park",
    ]

    plans: list[PlanCreate] = []

    for week in range(12):
        plans.append(plan_from_event(scheduled_night_event(today, week)))

        if week % 2 == 0:
            pickleball_date = first_saturday + timedelta(days=week * 7)
            venue = pickleball_venues[(week // 2) % len(pickleball_venues)]
            require_validated_venue(venue)
            plans.append(
                PlanCreate(
                    title=f"Pickleball at {venue}",
                    description=(
                        "Saturday pickleball with casual doubles and rotating courts. Rusty serves welcome."
                    ),
                    date=pickleball_date.isoformat(),
                    start_time="09:00",
                    end_time="10:30",
                    location=venue,
                    cost="Free",
                    kid_friendly=False,
                    capacity=8,
                    status="published",
                    visibility="public",
                    tags=["Pickleball", "Fitness", "Sports"],
                    related_interests=["Fitness", "Sports", "Casual meetups"],
                )
            )

        park_date = first_sunday + timedelta(days=week * 7)
        plans.append(kid_friendly_seed_for(park_date, week))

    return plans


def seed_plans(session: Session) -> None:
    for payload in recurring_seed_plans():
        existing = session.exec(
            select(Plan).where(Plan.title == payload.title, Plan.date == payload.date)
        ).first()
        if not existing:
            create_plan(payload, session)
