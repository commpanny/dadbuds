from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, func, select

from .database import create_db_and_tables, engine, get_session
from .models import (
    AvailabilityWindow,
    DadUser,
    Interest,
    Message,
    Plan,
    PlanRelatedInterest,
    PlanTag,
    Rsvp,
    UserAvailabilityPreference,
    UserInterest,
)
from .schemas import (
    AvailabilityCreate,
    AvailabilityRead,
    AvailabilityStatusUpdate,
    MessageCreate,
    MessageRead,
    PlanCreate,
    PlanRead,
    RsvpCreate,
    RsvpRead,
    UserCreate,
    UserRead,
)

app = FastAPI(title="DadBuds API", version="0.1.0")

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        seed_plans(session)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def normalize_email(email: str) -> str:
    return email.strip().lower()


def configured_admin_token() -> str:
    return os.getenv("ADMIN_TOKEN", "").strip()


def verify_admin_token(x_admin_token: Optional[str]) -> None:
    token = configured_admin_token()
    if not token or token == "change-me":
        raise HTTPException(
            status_code=503,
            detail="Admin auth is not configured. Set ADMIN_TOKEN before using admin routes.",
        )
    if x_admin_token != token:
        raise HTTPException(status_code=401, detail="Invalid admin token.")


def require_admin(x_admin_token: Optional[str] = Header(default=None)) -> None:
    verify_admin_token(x_admin_token)


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


def plan_to_read(session: Session, plan: Plan) -> PlanRead:
    rsvp_count = session.exec(
        select(func.count(Rsvp.id)).where(
            Rsvp.plan_id == plan.id,
            Rsvp.status.in_(["interested", "going", "maybe"]),
        )
    ).one()
    return PlanRead(
        id=plan.id,
        title=plan.title,
        description=plan.description,
        date=plan.date,
        start_time=plan.start_time,
        end_time=plan.end_time,
        location=plan.location,
        cost=plan.cost,
        kid_friendly=plan.kid_friendly,
        capacity=plan.capacity,
        status=plan.status,
        visibility=plan.visibility,
        tags=plan_tags(session, plan.id),
        related_interests=plan_interests(session, plan.id),
        rsvp_count=rsvp_count,
        created_at=plan.created_at,
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
    user = get_user_by_email(session, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user_to_read(session, user)


@app.get("/users/{user_id}", response_model=UserRead)
def read_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(DadUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user_to_read(session, user)


@app.post("/availability", response_model=AvailabilityRead)
def create_availability(
    payload: AvailabilityCreate, session: Session = Depends(get_session)
):
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
    session: Session = Depends(get_session),
):
    if user_id is None:
        verify_admin_token(x_admin_token)
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
    x_admin_token: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if include_drafts:
        verify_admin_token(x_admin_token)
    statement = select(Plan)
    if not include_drafts:
        statement = statement.where(
            Plan.status == "published",
            Plan.visibility.in_(["public", "signup_users"]),
        )
    statement = statement.order_by(Plan.date, Plan.start_time)
    plans = session.exec(statement).all()
    return [plan_to_read(session, plan) for plan in plans]


@app.post("/plans/{plan_id}/rsvps", response_model=RsvpRead)
def create_rsvp(
    plan_id: int,
    payload: RsvpCreate,
    session: Session = Depends(get_session),
):
    plan = session.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

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

    session.commit()
    session.refresh(rsvp)
    return RsvpRead(
        id=rsvp.id,
        plan_id=rsvp.plan_id,
        plan_title=plan.title,
        user_id=rsvp.user_id,
        status=rsvp.status,
        created_at=rsvp.created_at,
    )


@app.get("/rsvps", response_model=list[RsvpRead])
def list_rsvps(
    user_id: Optional[int] = Query(default=None),
    x_admin_token: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if user_id is None:
        verify_admin_token(x_admin_token)
    statement = select(Rsvp)
    if user_id:
        statement = statement.where(Rsvp.user_id == user_id)
    statement = statement.order_by(Rsvp.created_at.desc())
    rsvps = session.exec(statement).all()
    result: list[RsvpRead] = []
    for rsvp in rsvps:
        plan = session.get(Plan, rsvp.plan_id)
        result.append(
            RsvpRead(
                id=rsvp.id,
                plan_id=rsvp.plan_id,
                plan_title=plan.title if plan else "Deleted plan",
                user_id=rsvp.user_id,
                status=rsvp.status,
                created_at=rsvp.created_at,
            )
        )
    return result


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
        f"DadBuds found a low-pressure Spokane hang: {plan.title} "
        f"{plan.date} at {plan.start_time}. "
        f"{matching_count} buds match the vibe. Want in, maybe, or no?"
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


def seed_plans(session: Session) -> None:
    count = session.exec(select(func.count(Plan.id))).one()
    if count:
        return

    examples = [
        PlanCreate(
            title="Spokane Indians Game",
            description="Low-pressure baseball hang. Show up, grab a beer, talk when you feel like it.",
            date="2026-06-20",
            start_time="17:00",
            end_time="20:00",
            location="Avista Stadium",
            cost="$12-20",
            kid_friendly=True,
            capacity=8,
            status="published",
            visibility="public",
            tags=["Sports", "Low-key"],
            related_interests=["Sports", "Breweries", "Low-key hangouts"],
        ),
        PlanCreate(
            title="Saturday Morning Coffee",
            description="Easy caffeine window before the weekend errands start multiplying.",
            date="2026-06-21",
            start_time="09:30",
            end_time="10:30",
            location="Indaba Coffee",
            cost="$5-10",
            kid_friendly=False,
            capacity=6,
            status="published",
            visibility="public",
            tags=["Coffee", "Small group"],
            related_interests=["Coffee", "Low-key hangouts"],
        ),
    ]
    for payload in examples:
        create_plan(payload, session)
