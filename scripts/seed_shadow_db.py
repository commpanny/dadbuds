from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
LIVE_DB = BACKEND / "dadbuds.db"
SHADOW_DB = BACKEND / "dadbuds-shadow.db"

os.environ["DATABASE_URL"] = f"sqlite:///{SHADOW_DB}"
os.environ["SHADOW_MODE"] = "true"
sys.path.insert(0, str(ROOT))

from sqlmodel import Session, select  # noqa: E402

from backend.app.database import create_db_and_tables, engine  # noqa: E402
from backend.app.main import get_or_create_interest, seed_plans  # noqa: E402
from backend.app.models import (  # noqa: E402
    DadUser,
    UxFeedback,
    UserAvailabilityPreference,
    UserInterest,
)

SHADOW_RESET_TABLES = [
    "safety_reports",
    "conversation_messages",
    "conversation_members",
    "crew_members",
    "conversations",
    "crews",
    "bud_relationships",
    "rsvps",
    "availability_windows",
    "messages",
    "social_simulation_events",
    "social_simulation_agents",
    "social_simulations",
    "ux_feedback",
]


def _reset_shadow_state(session: Session) -> None:
    session.exec(text("PRAGMA foreign_keys=OFF"))
    session.exec(
        text(
            """
            delete from plans
            where id in (
                select plan_id from plan_tags where tag in ('Shadow sim', 'Human proposed')
            )
            or lower(title) like '%smoke%'
            """
        )
    )
    session.exec(
        text(
            """
            delete from plan_related_interests
            where plan_id not in (select id from plans)
            """
        )
    )
    session.exec(
        text(
            """
            delete from plan_tags
            where plan_id not in (select id from plans)
            """
        )
    )
    for table in SHADOW_RESET_TABLES:
        session.exec(text(f"delete from {table}"))
    session.exec(
        text(
            """
            delete from user_interests
            where user_id in (
                select id from users where email like '%@shadow.dadbuds.local'
            )
            """
        )
    )
    session.exec(
        text(
            """
            delete from user_availability_preferences
            where user_id in (
                select id from users where email like '%@shadow.dadbuds.local'
            )
            """
        )
    )
    session.exec(text("delete from users where email like '%@shadow.dadbuds.local'"))
    session.exec(text("PRAGMA foreign_keys=ON"))


def _copy_live_profile(session: Session) -> None:
    if not LIVE_DB.exists():
        return

    with sqlite3.connect(LIVE_DB) as live:
        live.row_factory = sqlite3.Row
        row = live.execute(
            """
            select id, name, email, phone, neighborhood, age_range,
                   kids_age_range, discord_username, sms_opt_in,
                   comfort_level
            from users
            order by id
            limit 1
            """
        ).fetchone()
        if row is None:
            return

        existing = session.exec(
            select(DadUser).where(DadUser.email == row["email"])
        ).first()
        if existing:
            user = existing
        else:
            user = DadUser(
                id=row["id"],
                name=row["name"],
                email=row["email"],
                phone=row["phone"] or "",
                neighborhood=row["neighborhood"] or "",
                age_range=row["age_range"] or "",
                kids_age_range=row["kids_age_range"] or "",
                discord_username=row["discord_username"],
                sms_opt_in=bool(row["sms_opt_in"]),
                comfort_level=row["comfort_level"] or "Just notify me",
            )
            session.add(user)
            session.flush()

        interest_rows = live.execute(
            """
            select interests.name
            from user_interests
            join interests on interests.id = user_interests.interest_id
            where user_interests.user_id = ?
            """,
            (row["id"],),
        ).fetchall()
        for interest_row in interest_rows:
            interest = get_or_create_interest(session, interest_row["name"])
            has_interest = session.exec(
                select(UserInterest).where(
                    UserInterest.user_id == user.id,
                    UserInterest.interest_id == interest.id,
                )
            ).first()
            if not has_interest:
                session.add(
                    UserInterest(user_id=user.id, interest_id=interest.id)
                )

        availability_rows = live.execute(
            """
            select label
            from user_availability_preferences
            where user_id = ?
            """,
            (row["id"],),
        ).fetchall()
        for availability_row in availability_rows:
            has_availability = session.exec(
                select(UserAvailabilityPreference).where(
                    UserAvailabilityPreference.user_id == user.id,
                    UserAvailabilityPreference.label == availability_row["label"],
                )
            ).first()
            if not has_availability:
                session.add(
                    UserAvailabilityPreference(
                        user_id=user.id,
                        label=availability_row["label"],
                    )
                )


def _seed_initial_ux_feedback(session: Session) -> None:
    items = [
        {
            "page": "/sim",
            "severity": "bug",
            "body": (
                "Event cards feel static because sim-created plans were only "
                "event-log entries. The sim needs to publish shadow plans into "
                "the Spokane calendar so the product surface changes as agents operate."
            ),
        },
        {
            "page": "/events",
            "severity": "naming",
            "body": (
                "Clarify the product model: Events should become Event Ideas, "
                "Plans should become Spokane Calendar, and the profile should "
                "expose a My Calendar view for RSVPs and saved plans."
            ),
        },
    ]
    for item in items:
        session.add(
            UxFeedback(
                source_type="founder",
                page=item["page"],
                severity=item["severity"],
                body=item["body"],
            )
        )


def main() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        _reset_shadow_state(session)
        _copy_live_profile(session)
        seed_plans(session)
        _seed_initial_ux_feedback(session)
        session.commit()

    print(f"Shadow DB ready: {SHADOW_DB}")


if __name__ == "__main__":
    main()
