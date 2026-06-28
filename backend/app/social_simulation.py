from __future__ import annotations

import random
from collections import Counter
from datetime import date, timedelta

from sqlmodel import Session, func, select

from .models import (
    Conversation,
    ConversationMember,
    ConversationMessage,
    DadUser,
    Interest,
    Plan,
    PlanRelatedInterest,
    PlanTag,
    Rsvp,
    SafetyReport,
    SocialSimulation,
    SocialSimulationAgent,
    SocialSimulationEvent,
    UserInterest,
    UxFeedback,
    utc_now,
)

NEIGHBORHOODS = [
    "South Hill",
    "Perry",
    "Garland",
    "Browne's Addition",
    "Kendall Yards",
    "Liberty Lake",
    "North Spokane",
    "Spokane Valley",
]

PLAN_TITLES = [
    "Comstock pickleball",
    "Brick West trivia table",
    "Manito playground lap",
    "Mariners at Uprise",
    "3-on-3 at Hooptown",
    "No-Li patio watch",
    "Jefferson Park morning runaround",
    "Lumberbeard brewery table",
]

PLAN_DETAILS = {
    "Comstock pickleball": {
        "location": "Comstock Park",
        "start_time": "09:00",
        "end_time": "10:30",
        "cost": "Free",
        "kid_friendly": False,
        "tags": ["Shadow sim", "Pickleball", "Sports"],
        "interests": ["Sports", "Fitness", "Casual meetups"],
    },
    "Brick West trivia table": {
        "location": "Brick West Brewing",
        "start_time": "19:00",
        "end_time": "21:00",
        "cost": "$10-20",
        "kid_friendly": False,
        "tags": ["Shadow sim", "Trivia", "Brewery"],
        "interests": ["Trivia", "Breweries", "Sports"],
    },
    "Manito playground lap": {
        "location": "Manito Park Playground",
        "start_time": "10:00",
        "end_time": "11:30",
        "cost": "Free",
        "kid_friendly": True,
        "tags": ["Shadow sim", "Playground", "Dad/kid"],
        "interests": ["Outdoors", "Dad/kid activities", "Coffee"],
    },
    "Mariners at Uprise": {
        "location": "Uprise Brewing",
        "start_time": "18:30",
        "end_time": "21:30",
        "cost": "$10-25",
        "kid_friendly": False,
        "tags": ["Shadow sim", "Sports watch", "Brewery"],
        "interests": ["Sports", "Breweries", "Casual meetups"],
    },
    "3-on-3 at Hooptown": {
        "location": "Hooptown USA Basketball Court",
        "start_time": "18:00",
        "end_time": "19:30",
        "cost": "Free",
        "kid_friendly": False,
        "tags": ["Shadow sim", "Basketball", "Sports"],
        "interests": ["Sports", "Fitness"],
    },
    "No-Li patio watch": {
        "location": "No-Li Brewhouse",
        "start_time": "18:00",
        "end_time": "21:00",
        "cost": "$10-25",
        "kid_friendly": False,
        "tags": ["Shadow sim", "Sports watch", "Brewery"],
        "interests": ["Sports", "Breweries"],
    },
    "Jefferson Park morning runaround": {
        "location": "Jefferson Park Playground",
        "start_time": "10:00",
        "end_time": "11:30",
        "cost": "Free",
        "kid_friendly": True,
        "tags": ["Shadow sim", "Playground", "Dad/kid"],
        "interests": ["Outdoors", "Dad/kid activities", "Coffee"],
    },
    "Lumberbeard brewery table": {
        "location": "Lumberbeard Brewing",
        "start_time": "19:00",
        "end_time": "21:00",
        "cost": "$10-25",
        "kid_friendly": False,
        "tags": ["Shadow sim", "Brewery", "Casual"],
        "interests": ["Breweries", "Casual meetups"],
    },
    "Human-led DadBuds plan": {
        "location": "Brick West Brewing",
        "start_time": "18:30",
        "end_time": "20:30",
        "cost": "$10-25",
        "kid_friendly": False,
        "tags": ["Shadow sim", "Human-led", "Brewery"],
        "interests": ["Breweries", "Casual meetups"],
    },
}

FIRST_NAMES = [
    "Mike",
    "Andre",
    "Chris",
    "Kevin",
    "Drew",
    "Ben",
    "Sam",
    "Tyler",
    "Jordan",
    "Matt",
    "Evan",
    "Cole",
    "Aaron",
    "Nate",
    "Ryan",
    "Kyle",
]

CHAT_LINES = [
    "I could probably make this work.",
    "Following. I need to confirm family logistics.",
    "Parking decent there?",
    "I am in if the time stays the same.",
    "Can someone grab a table?",
    "I might be 15 late but interested.",
    "I need to confirm kid coverage, but this could work.",
    "If two other people are in, I am in.",
]

RESISTANT_LINES = [
    "Not trying to join another group chat.",
    "This feels like a lot of coordination for a simple plan.",
    "Maybe, but I do not want a million notifications.",
    "I am following for now.",
]

NUDGE_LINES = [
    "Can we confirm time, place, and who is attending?",
    "I am going to call this a plan unless someone objects.",
    "Looks like enough interest. I will be there.",
    "Thread needs a decision before the calendar invite is useful.",
]

ARCHETYPE_MIX = {
    "inactive": 0.32,
    "resistant": 0.18,
    "steady": 0.35,
    "social": 0.135,
    "coordinator": 0.015,
}


def _get_or_create_interest(session: Session, name: str) -> Interest:
    existing = session.exec(select(Interest).where(Interest.name == name)).first()
    if existing:
        return existing
    interest = Interest(name=name)
    session.add(interest)
    session.flush()
    return interest


def _shadow_agent_email(simulation: SocialSimulation, agent: SocialSimulationAgent) -> str:
    return f"shadow-sim-{simulation.id}-{agent.id}@shadow.dadbuds.local"


def _shadow_user_for_agent(
    session: Session, simulation: SocialSimulation, agent: SocialSimulationAgent
) -> DadUser:
    email = _shadow_agent_email(simulation, agent)
    existing = session.exec(select(DadUser).where(DadUser.email == email)).first()
    if existing:
        return existing
    user = DadUser(
        name=agent.display_name,
        email=email,
        phone="",
        neighborhood=agent.neighborhood,
        age_range="35-44",
        kids_age_range="Mixed",
        discord_username=f"shadow-{simulation.id}-{agent.id}",
        sms_opt_in=False,
        comfort_level=(
            "Just notify me" if agent.archetype in {"inactive", "resistant"} else "Invite me"
        ),
    )
    session.add(user)
    session.flush()
    for label in ["Sports", "Casual meetups"]:
        interest = _get_or_create_interest(session, label)
        session.add(UserInterest(user_id=user.id, interest_id=interest.id))
    return user


def _plan_conversation(session: Session, plan: Plan) -> Conversation:
    existing = session.exec(
        select(Conversation).where(
            Conversation.conversation_type == "plan",
            Conversation.related_plan_id == plan.id,
        )
    ).first()
    if existing:
        return existing
    conversation = Conversation(
        conversation_type="plan",
        related_plan_id=plan.id,
        lifecycle_status="active",
    )
    session.add(conversation)
    session.flush()
    session.add(
        ConversationMessage(
            conversation_id=conversation.id,
            sender_type="dadbuds",
            body=(
                f"{plan.title} thread. Shadow agents are using this to test "
                "RSVPs, bookmarks, messages, mutes, and reports."
            ),
        )
    )
    session.flush()
    return conversation


def _ensure_conversation_member(
    session: Session,
    conversation: Conversation,
    user_id: int,
    *,
    notification_preference: str = "all",
) -> ConversationMember:
    existing = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation.id,
            ConversationMember.user_id == user_id,
        )
    ).first()
    if existing:
        existing.membership_status = "active"
        existing.left_at = None
        existing.notification_preference = notification_preference
        session.add(existing)
        return existing
    member = ConversationMember(
        conversation_id=conversation.id,
        user_id=user_id,
        notification_preference=notification_preference,
    )
    session.add(member)
    session.flush()
    return member


def _record_rsvp(session: Session, plan: Plan, user_id: int, status: str) -> Rsvp:
    existing = session.exec(
        select(Rsvp).where(Rsvp.plan_id == plan.id, Rsvp.user_id == user_id)
    ).first()
    if existing:
        existing.status = status
        session.add(existing)
        return existing
    rsvp = Rsvp(plan_id=plan.id, user_id=user_id, status=status)
    session.add(rsvp)
    session.flush()
    return rsvp


def _post_thread_message(
    session: Session,
    conversation: Conversation,
    user_id: int,
    body: str,
) -> None:
    session.add(
        ConversationMessage(
            conversation_id=conversation.id,
            sender_user_id=user_id,
            sender_type="user",
            body=body,
        )
    )

ARCHETYPE_CONFIG = {
    "inactive": {
        "activity": 0.03,
        "resistance": 0.1,
        "coordinator": 0.0,
        "trust": 0.08,
    },
    "resistant": {
        "activity": 0.08,
        "resistance": 0.78,
        "coordinator": 0.02,
        "trust": 0.12,
    },
    "steady": {
        "activity": 0.32,
        "resistance": 0.25,
        "coordinator": 0.08,
        "trust": 0.35,
    },
    "social": {
        "activity": 0.52,
        "resistance": 0.16,
        "coordinator": 0.22,
        "trust": 0.52,
    },
    "coordinator": {
        "activity": 0.92,
        "resistance": 0.08,
        "coordinator": 0.95,
        "trust": 0.65,
    },
}


def _agent_counts(agent_count: int) -> dict[str, int]:
    coordinator_count = max(1, round(agent_count * ARCHETYPE_MIX["coordinator"]))
    counts = {
        "coordinator": coordinator_count,
        "inactive": round(agent_count * ARCHETYPE_MIX["inactive"]),
        "resistant": round(agent_count * ARCHETYPE_MIX["resistant"]),
        "steady": round(agent_count * ARCHETYPE_MIX["steady"]),
    }
    assigned = sum(counts.values())
    counts["social"] = max(0, agent_count - assigned)
    return counts


def _rng_for(simulation_id: int | None, day_index: int) -> random.Random:
    seed_id = simulation_id or 0
    return random.Random(f"dadbuds-social-sim:{seed_id}:{day_index}")


def _create_event(
    session: Session,
    simulation: SocialSimulation,
    event_type: str,
    body: str,
    *,
    actor_agent: SocialSimulationAgent | None = None,
    actor_user_id: int | None = None,
    target_agent: SocialSimulationAgent | None = None,
    title: str = "",
    impact_score: float = 0.0,
) -> SocialSimulationEvent:
    event = SocialSimulationEvent(
        simulation_id=simulation.id,
        sim_date=simulation.current_date,
        day_index=simulation.day_index,
        event_type=event_type,
        actor_agent_id=actor_agent.id if actor_agent else None,
        actor_user_id=actor_user_id,
        target_agent_id=target_agent.id if target_agent else None,
        title=title,
        body=body,
        impact_score=impact_score,
    )
    session.add(event)
    return event


def _create_ux_feedback(
    session: Session,
    simulation: SocialSimulation,
    body: str,
    *,
    page: str,
    severity: str = "painpoint",
    actor_agent: SocialSimulationAgent | None = None,
) -> None:
    session.add(
        UxFeedback(
            source_type="agent" if actor_agent else "system",
            page=page,
            severity=severity,
            body=body,
            simulation_id=simulation.id,
            agent_id=actor_agent.id if actor_agent else None,
        )
    )
    _create_event(
        session,
        simulation,
        "UX_FEEDBACK",
        body,
        actor_agent=actor_agent,
        title=page,
        impact_score=-1 if severity == "painpoint" else 0.5,
    )


def _create_shadow_plan(
    session: Session,
    simulation: SocialSimulation,
    title: str,
    rng: random.Random,
    *,
    actor_agent: SocialSimulationAgent | None = None,
    actor_user_id: int | None = None,
) -> Plan:
    details = PLAN_DETAILS.get(title, PLAN_DETAILS["Human-led DadBuds plan"])
    plan_date = (
        date.fromisoformat(simulation.current_date) + timedelta(days=rng.randint(2, 12))
    ).isoformat()
    creator = actor_agent.display_name if actor_agent else "the human participant"
    existing = session.exec(
        select(Plan).where(
            Plan.title == title,
            Plan.date == plan_date,
            Plan.location == details["location"],
        )
    ).first()
    if existing:
        return existing

    plan = Plan(
        title=title,
        description=(
            f"Shadow simulation plan created by {creator}. Published to the "
            "shadow Spokane calendar for RSVP, bookmark, and thread testing."
        ),
        date=plan_date,
        start_time=details["start_time"],
        end_time=details["end_time"],
        location=details["location"],
        cost=details["cost"],
        kid_friendly=details["kid_friendly"],
        capacity=rng.randint(6, 14),
        status="published",
        visibility="public",
    )
    session.add(plan)
    session.flush()

    for tag in details["tags"]:
        session.add(PlanTag(plan_id=plan.id, tag=tag))
    for interest in details["interests"]:
        session.add(PlanRelatedInterest(plan_id=plan.id, interest=interest))
    if actor_user_id:
        session.add(PlanTag(plan_id=plan.id, tag="Human proposed"))
    return plan


def _materialize_plan_activity(
    session: Session,
    simulation: SocialSimulation,
    plan: Plan,
    creator: SocialSimulationAgent,
    responders: list[SocialSimulationAgent],
    rng: random.Random,
    *,
    human_action: str,
) -> tuple[int, int, int, int, int]:
    conversation = _plan_conversation(session, plan)
    creator_user = _shadow_user_for_agent(session, simulation, creator)
    _record_rsvp(session, plan, creator_user.id, "going")
    _ensure_conversation_member(session, conversation, creator_user.id)
    if rng.random() < 0.75:
        _post_thread_message(
            session,
            conversation,
            creator_user.id,
            rng.choice(NUDGE_LINES),
        )
        creator.messages_sent += 1

    attending = 1
    bookmarked = 0
    resistant_pushback = 0
    muted = 0
    reports = 0

    for agent in responders:
        response_probability = _response_probability(agent)
        if human_action == "nudge" and agent.archetype in {"steady", "social"}:
            response_probability += 0.07
        if human_action == "coordinate" and agent.archetype == "coordinator":
            response_probability += 0.1

        user = _shadow_user_for_agent(session, simulation, agent)
        if rng.random() < response_probability:
            status = "going" if rng.random() < 0.62 else "bookmarked"
            _record_rsvp(session, plan, user.id, status)
            notification = "muted" if rng.random() < 0.08 else "all"
            member = _ensure_conversation_member(
                session,
                conversation,
                user.id,
                notification_preference=notification,
            )
            if status == "going":
                attending += 1
            else:
                bookmarked += 1
            agent.rsvps_sent += 1
            agent.trust_score = min(1, agent.trust_score + 0.025)
            if rng.random() < (0.42 if agent.archetype in {"social", "coordinator"} else 0.18):
                _post_thread_message(
                    session,
                    conversation,
                    user.id,
                    rng.choice(CHAT_LINES),
                )
                agent.messages_sent += 1
            if notification == "muted":
                muted += 1
                agent.mutes += 1
                member.muted_at = utc_now()
                session.add(member)
        elif agent.archetype == "resistant" and rng.random() < 0.24:
            resistant_pushback += 1
            agent.ignores += 1
            agent.resistance_score = min(1, agent.resistance_score + 0.015)
            if rng.random() < 0.5:
                _ensure_conversation_member(
                    session,
                    conversation,
                    user.id,
                    notification_preference="muted",
                )
                _post_thread_message(
                    session,
                    conversation,
                    user.id,
                    rng.choice(RESISTANT_LINES),
                )
                agent.messages_sent += 1
                muted += 1
            if rng.random() < 0.08:
                session.add(
                    SafetyReport(
                        reporter_user_id=user.id,
                        conversation_id=conversation.id,
                        report_type="thread",
                        reason="Shadow sim report: cadence felt too high.",
                    )
                )
                reports += 1
        elif agent.archetype == "inactive":
            agent.ignores += 1

        if agent.archetype == "resistant" and rng.random() < 0.03:
            muted += 1
            agent.mutes += 1
        session.add(agent)

    return attending, bookmarked, resistant_pushback, muted, reports


def create_social_simulation(
    session: Session,
    *,
    human_user_id: int | None,
    agent_count: int = 120,
    start_date: str | None = None,
    name: str = "DadBuds Spokane door test",
) -> SocialSimulation:
    start = date.fromisoformat(start_date) if start_date else date.today()
    simulation = SocialSimulation(
        name=name,
        human_user_id=human_user_id,
        current_date=start.isoformat(),
        agent_count=agent_count,
    )
    session.add(simulation)
    session.flush()

    rng = _rng_for(simulation.id, 0)
    index = 1
    for archetype, count in _agent_counts(agent_count).items():
        config = ARCHETYPE_CONFIG[archetype]
        for _ in range(count):
            agent = SocialSimulationAgent(
                simulation_id=simulation.id,
                display_name=f"{rng.choice(FIRST_NAMES)} {index}",
                archetype=archetype,
                neighborhood=rng.choice(NEIGHBORHOODS),
                activity_score=max(0, min(1, rng.gauss(config["activity"], 0.08))),
                resistance_score=max(0, min(1, rng.gauss(config["resistance"], 0.08))),
                coordinator_score=max(0, min(1, rng.gauss(config["coordinator"], 0.08))),
                trust_score=max(0, min(1, rng.gauss(config["trust"], 0.08))),
                status="dormant" if archetype == "inactive" else "active",
            )
            session.add(agent)
            index += 1

    _create_event(
        session,
        simulation,
        "SIM_CREATED",
        (
            f"Created {agent_count} shadow dads with resistant, inactive, "
            "steady, social, and 1-2% high-activity coordinator personas."
        ),
        actor_user_id=human_user_id,
        impact_score=1,
    )
    _create_ux_feedback(
        session,
        simulation,
        (
            "Need a persistent UX feedback rail while agents operate pages; "
            "otherwise sim observations stay buried in the event log."
        ),
        page="/sim",
        severity="request",
    )
    session.commit()
    session.refresh(simulation)
    return simulation


def _response_probability(agent: SocialSimulationAgent) -> float:
    if agent.archetype == "inactive":
        return 0.015
    if agent.archetype == "resistant":
        return 0.04
    if agent.archetype == "steady":
        return 0.16
    if agent.archetype == "social":
        return 0.28
    return 0.42


def _plan_creation_probability(agent: SocialSimulationAgent) -> float:
    if agent.archetype == "coordinator":
        return 0.34
    if agent.archetype == "social":
        return 0.055
    if agent.archetype == "steady":
        return 0.015
    if agent.archetype == "resistant":
        return 0.003
    return 0.001


def _advance_one_day(
    session: Session,
    simulation: SocialSimulation,
    *,
    human_action: str,
) -> None:
    simulation.day_index += 1
    simulation.current_date = (
        date.fromisoformat(simulation.current_date) + timedelta(days=1)
    ).isoformat()
    simulation.updated_at = utc_now()
    rng = _rng_for(simulation.id, simulation.day_index)
    agents = session.exec(
        select(SocialSimulationAgent).where(
            SocialSimulationAgent.simulation_id == simulation.id
        )
    ).all()

    if human_action != "observe" and simulation.human_user_id:
        human_copy = {
            "rsvp": "You RSVP’d to a plan. The sim treats that as confirmed attendance.",
            "coordinate": "You proposed a plan. Coordinators amplified it; resistant dads mostly waited.",
            "nudge": "You nudged the thread. Steady dads responded better than inactive dads.",
        }.get(human_action, "You observed the simulation.")
        _create_event(
            session,
            simulation,
            "HUMAN_ACTION",
            human_copy,
            actor_user_id=simulation.human_user_id,
            impact_score=2.0 if human_action == "coordinate" else 1.0,
        )

    day_plans: list[tuple[SocialSimulationAgent, str, int, Plan]] = []
    for agent in agents:
        if rng.random() < _plan_creation_probability(agent):
            title = rng.choice(PLAN_TITLES)
            agent.plans_created += 1
            agent.messages_sent += 1
            plan = _create_shadow_plan(session, simulation, title, rng, actor_agent=agent)
            day_plans.append((agent, title, rng.randint(7, 20), plan))
            _create_event(
                session,
                simulation,
                "PLAN_PROPOSED",
                f"{agent.display_name} proposed {title}.",
                actor_agent=agent,
                title=title,
                impact_score=2.5 if agent.archetype == "coordinator" else 1.0,
            )

    if human_action == "coordinate":
        title = "Human-led DadBuds plan"
        pool_size = 24
        plan = _create_shadow_plan(
            session,
            simulation,
            title,
            rng,
            actor_user_id=simulation.human_user_id,
        )
        day_plans.append((rng.choice(agents), title, pool_size, plan))
        _create_event(
            session,
            simulation,
            "PLAN_PROPOSED",
            "You created a plan. The sim used it to test RSVP and message behavior.",
            actor_user_id=simulation.human_user_id,
            title=title,
            impact_score=3.0,
        )

    if not day_plans and agents:
        likely_creators = [
            agent
            for agent in agents
            if agent.archetype in {"coordinator", "social", "steady"}
        ]
        creator = rng.choice(likely_creators or agents)
        title = rng.choice(PLAN_TITLES)
        creator.plans_created += 1
        creator.messages_sent += 1
        session.add(creator)
        plan = _create_shadow_plan(session, simulation, title, rng, actor_agent=creator)
        day_plans.append((creator, title, rng.randint(7, 20), plan))
        _create_event(
            session,
            simulation,
            "PLAN_PROPOSED",
            f"{creator.display_name} proposed {title} after the day would otherwise have been quiet.",
            actor_agent=creator,
            title=title,
            impact_score=1.5,
        )

    for creator, title, pool_size, plan in day_plans:
        responders = rng.sample(agents, min(pool_size, len(agents)))
        attending, bookmarked, resistant_pushback, muted, reports = (
            _materialize_plan_activity(
                session,
                simulation,
                plan,
                creator,
                responders,
                rng,
                human_action=human_action,
            )
        )

        if attending or bookmarked:
            _create_event(
                session,
                simulation,
                "RSVP_CLUSTER",
                f"{attending} dads attended and {bookmarked} bookmarked {title}.",
                actor_agent=creator,
                title=title,
                impact_score=(attending + bookmarked) / 3,
            )
        if resistant_pushback:
            _create_event(
                session,
                simulation,
                "RESISTANCE",
                f"{resistant_pushback} resistant dads ignored or pushed back on {title}.",
                actor_agent=creator,
                title=title,
                impact_score=-resistant_pushback / 2,
            )
        if muted:
            _create_event(
                session,
                simulation,
                "MUTE",
                f"{muted} dads muted after the invite cadence felt too high.",
                actor_agent=creator,
                title=title,
                impact_score=-muted,
            )
        if reports:
            _create_event(
                session,
                simulation,
                "SAFETY_REPORT",
                f"{reports} shadow safety reports were created for {title}.",
                actor_agent=creator,
                title=title,
                impact_score=-reports,
            )
        if attending >= 4 and rng.random() < 0.32:
            _create_event(
                session,
                simulation,
                "CREW_SEED",
                f"{title} created enough overlap for a possible persistent crew.",
                actor_agent=creator,
                title=title,
                impact_score=3,
            )

    if day_plans and rng.random() < 0.28:
        _create_ux_feedback(
            session,
            simulation,
            (
                "Agent-created plans now appear in the Spokane calendar, but "
                "the product language still has to separate event ideas from "
                "committed plans and personal RSVPs."
            ),
            page="/plans",
            actor_agent=rng.choice(agents),
        )

    if simulation.day_index == 1:
        _create_ux_feedback(
            session,
            simulation,
            (
                "Events vs plans is ambiguous. Rename Events to Event Ideas, "
                "Plans to Spokane Calendar, and give the profile a My Calendar view."
            ),
            page="/events",
            severity="naming",
            actor_agent=rng.choice(agents),
        )

    if not day_plans and rng.random() < 0.4:
        inactive_count = sum(1 for agent in agents if agent.archetype == "inactive")
        _create_event(
            session,
            simulation,
            "QUIET_DAY",
            f"Quiet day. About {inactive_count} inactive dads remained untouched by the product.",
            impact_score=0,
        )

    for agent in agents:
        if agent.archetype == "coordinator" and rng.random() < 0.18:
            agent.messages_sent += 1
            _create_event(
                session,
                simulation,
                "COORDINATOR_NUDGE",
                f"{agent.display_name} tried to pull a loose thread into a concrete plan.",
                actor_agent=agent,
                impact_score=1.5,
            )
        session.add(agent)

    session.add(simulation)


def advance_social_simulation(
    session: Session,
    simulation: SocialSimulation,
    *,
    days: int,
    human_action: str = "observe",
) -> SocialSimulation:
    for day_offset in range(days):
        action = human_action if day_offset == 0 else "observe"
        _advance_one_day(session, simulation, human_action=action)
    session.commit()
    session.refresh(simulation)
    return simulation


def simulation_summary(session: Session, simulation: SocialSimulation) -> dict:
    agents = session.exec(
        select(SocialSimulationAgent).where(
            SocialSimulationAgent.simulation_id == simulation.id
        )
    ).all()
    events = session.exec(
        select(SocialSimulationEvent)
        .where(SocialSimulationEvent.simulation_id == simulation.id)
        .order_by(SocialSimulationEvent.day_index.desc(), SocialSimulationEvent.id.desc())
        .limit(80)
    ).all()
    counts = Counter(agent.archetype for agent in agents)
    event_counts = Counter(event.event_type for event in session.exec(
        select(SocialSimulationEvent).where(
            SocialSimulationEvent.simulation_id == simulation.id
        )
    ).all())
    coordinators = sorted(
        agents,
        key=lambda agent: (
            agent.plans_created * 3 + agent.messages_sent + agent.rsvps_sent
        ),
        reverse=True,
    )[:8]
    total_trust = sum(agent.trust_score for agent in agents)
    total_resistance = sum(agent.resistance_score for agent in agents)
    return {
        "id": simulation.id,
        "name": simulation.name,
        "status": simulation.status,
        "human_user_id": simulation.human_user_id,
        "current_date": simulation.current_date,
        "day_index": simulation.day_index,
        "agent_count": simulation.agent_count,
        "archetypes": dict(counts),
        "metrics": {
            "plans_proposed": event_counts.get("PLAN_PROPOSED", 0),
            "rsvp_clusters": event_counts.get("RSVP_CLUSTER", 0),
            "crew_seeds": event_counts.get("CREW_SEED", 0),
            "resistance_events": event_counts.get("RESISTANCE", 0),
            "mutes": event_counts.get("MUTE", 0),
            "coordinator_nudges": event_counts.get("COORDINATOR_NUDGE", 0),
            "human_actions": event_counts.get("HUMAN_ACTION", 0),
            "avg_trust": round(total_trust / max(1, len(agents)), 3),
            "avg_resistance": round(total_resistance / max(1, len(agents)), 3),
        },
        "top_coordinators": [
            {
                "id": agent.id,
                "display_name": agent.display_name,
                "archetype": agent.archetype,
                "neighborhood": agent.neighborhood,
                "plans_created": agent.plans_created,
                "rsvps_sent": agent.rsvps_sent,
                "messages_sent": agent.messages_sent,
                "trust_score": round(agent.trust_score, 2),
            }
            for agent in coordinators
        ],
        "events": [
            {
                "id": event.id,
                "sim_date": event.sim_date,
                "day_index": event.day_index,
                "event_type": event.event_type,
                "title": event.title,
                "body": event.body,
                "impact_score": event.impact_score,
                "created_at": event.created_at,
            }
            for event in events
        ],
    }


def latest_social_simulation_for_user(
    session: Session, user_id: int | None
) -> SocialSimulation | None:
    statement = select(SocialSimulation).order_by(SocialSimulation.created_at.desc())
    if user_id:
        statement = statement.where(SocialSimulation.human_user_id == user_id)
    return session.exec(statement).first()
