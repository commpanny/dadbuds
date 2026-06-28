from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import TYPE_CHECKING, Literal, Optional

from .schemas import PlanCreate

if TYPE_CHECKING:
    from sqlmodel import Session

SourceType = Literal[
    "venue_recurring", "sports_schedule", "activity_rotation", "live_music"
]


@dataclass(frozen=True)
class EventSource:
    key: str
    source_type: SourceType
    name: str
    category: str
    default_venue: str
    source_url: str
    owner: str
    cadence: str
    tags: tuple[str, ...]
    related_interests: tuple[str, ...]
    active_months: Optional[tuple[int, ...]] = None


@dataclass(frozen=True)
class Venue:
    name: str
    google_maps_url: str
    validation_status: Literal["google_directory"] = "google_directory"


@dataclass(frozen=True)
class LocalEvent:
    source_key: str
    title: str
    description: str
    date: date
    start_time: str
    end_time: str
    location: str
    cost: str
    kid_friendly: bool
    capacity: Optional[int]
    tags: tuple[str, ...]
    related_interests: tuple[str, ...]
    listing_url: str = ""
    location_url: Optional[str] = None
    external_id: Optional[int] = None


@dataclass(frozen=True)
class EventCandidate:
    source_key: str
    title: str
    description: str
    category: str
    date: Optional[date]
    start_time: str
    end_time: str
    location: str
    location_url: Optional[str]
    source_url: str
    cost: str
    kid_friendly: bool
    capacity: Optional[int]
    tags: tuple[str, ...]
    related_interests: tuple[str, ...]
    status: Literal["ready", "needs_ingestion"]


def google_maps_search_url(query: str) -> str:
    encoded = query.replace(" ", "+").replace("'", "%27")
    return f"https://www.google.com/maps/search/?api=1&query={encoded}"


VENUES = {
    "Brick West Brewing": Venue(
        name="Brick West Brewing",
        google_maps_url=google_maps_search_url("Brick West Brewing Spokane WA"),
    ),
    "Uprise Brewing": Venue(
        name="Uprise Brewing",
        google_maps_url=google_maps_search_url("Uprise Brewing Spokane WA"),
    ),
    "Lumberbeard Brewing": Venue(
        name="Lumberbeard Brewing",
        google_maps_url=google_maps_search_url("Lumberbeard Brewing Spokane WA"),
    ),
    "No-Li Brewhouse": Venue(
        name="No-Li Brewhouse",
        google_maps_url=google_maps_search_url("No-Li Brewhouse Spokane WA"),
    ),
    "Thornton Murphy Park": Venue(
        name="Thornton Murphy Park",
        google_maps_url=google_maps_search_url("Thornton Murphy Park Spokane WA"),
    ),
    "Comstock Park": Venue(
        name="Comstock Park",
        google_maps_url=google_maps_search_url("Comstock Park Spokane WA"),
    ),
    "Hooptown USA Basketball Court": Venue(
        name="Hooptown USA Basketball Court",
        google_maps_url=google_maps_search_url("Hooptown USA Basketball Court Spokane WA"),
    ),
    "Wunderground": Venue(
        name="Wunderground",
        google_maps_url=google_maps_search_url("Wunderground Spokane WA"),
    ),
    "Coeur d'Alene Park": Venue(
        name="Coeur d'Alene Park",
        google_maps_url=google_maps_search_url("Coeur d'Alene Park Spokane WA"),
    ),
    "Manito Park Playground": Venue(
        name="Manito Park Playground",
        google_maps_url=google_maps_search_url("Manito Park Playground Spokane WA"),
    ),
    "Jefferson Park Playground": Venue(
        name="Jefferson Park Playground",
        google_maps_url=google_maps_search_url("Jefferson Park Playground Spokane WA"),
    ),
    "Ice Age Park": Venue(
        name="Ice Age Park",
        google_maps_url=google_maps_search_url("Ice Age Park Spokane WA"),
    ),
    "Southside Family Aquatics Facility": Venue(
        name="Southside Family Aquatics Facility",
        google_maps_url=google_maps_search_url("Southside Family Aquatics Facility Spokane WA"),
    ),
    "Avista Stadium": Venue(
        name="Avista Stadium",
        google_maps_url=google_maps_search_url("Avista Stadium Spokane WA"),
    ),
    "Spokane Arena": Venue(
        name="Spokane Arena",
        google_maps_url=google_maps_search_url("Spokane Arena Spokane WA"),
    ),
    "One Spokane Stadium": Venue(
        name="One Spokane Stadium",
        google_maps_url=google_maps_search_url("One Spokane Stadium Spokane WA"),
    ),
    "The Big Dipper": Venue(
        name="The Big Dipper",
        google_maps_url=google_maps_search_url("The Big Dipper Spokane WA"),
    ),
    "The Chameleon": Venue(
        name="The Chameleon",
        google_maps_url=google_maps_search_url("The Chameleon Spokane WA"),
    ),
    "Nashville North": Venue(
        name="Nashville North",
        google_maps_url=google_maps_search_url("Nashville North Post Falls ID"),
    ),
    "Knitting Factory Spokane": Venue(
        name="Knitting Factory Spokane",
        google_maps_url=google_maps_search_url("Knitting Factory Spokane WA"),
    ),
    "Northern Quest Casino": Venue(
        name="Northern Quest Casino",
        google_maps_url=google_maps_search_url("Northern Quest Casino Airway Heights WA"),
    ),
    "Fox Theater": Venue(
        name="Fox Theater",
        google_maps_url=google_maps_search_url("Fox Theater Spokane WA"),
    ),
    "District Bar": Venue(
        name="District Bar",
        google_maps_url=google_maps_search_url("District Bar Spokane WA"),
    ),
    "Podium Spokane": Venue(
        name="Podium Spokane",
        google_maps_url=google_maps_search_url("Podium Spokane WA"),
    ),
    "The Pin": Venue(
        name="The Pin",
        google_maps_url=google_maps_search_url("The Pin Spokane WA"),
    ),
    "The Vogue Theatre": Venue(
        name="The Vogue Theatre",
        google_maps_url=google_maps_search_url("The Vogue Theatre Spokane WA"),
    ),
    "The Martin Woldson Theatre": Venue(
        name="The Martin Woldson Theatre",
        google_maps_url=google_maps_search_url("The Martin Woldson Theatre Spokane WA"),
    ),
    "Hamilton Studio": Venue(
        name="Hamilton Studio",
        google_maps_url=google_maps_search_url("Hamilton Studio Spokane WA"),
    ),
    "The Social": Venue(
        name="The Social",
        google_maps_url=google_maps_search_url("The Social Spokane WA"),
    ),
    "Kendall Yards Night Market": Venue(
        name="Kendall Yards Night Market",
        google_maps_url=google_maps_search_url("Kendall Yards Night Market Spokane WA"),
    ),
    "Spokane County Interstate Fairgrounds": Venue(
        name="Spokane County Interstate Fairgrounds",
        google_maps_url=google_maps_search_url(
            "Spokane County Interstate Fairgrounds Spokane Valley WA"
        ),
    ),
}


EVENT_SOURCES = [
    EventSource(
        key="brick-west-trivia",
        source_type="venue_recurring",
        name="Brick West Trivia",
        category="Trivia",
        default_venue="Brick West Brewing",
        source_url="https://brickwestbrewingco.com/",
        owner="Venue calendar",
        cadence="Wednesdays at 7:30 PM",
        tags=("Trivia", "Breweries", "Weekly night"),
        related_interests=("Trivia", "Breweries", "Casual meetups"),
    ),
    EventSource(
        key="mariners-watch",
        source_type="sports_schedule",
        name="Mariners Watch Night",
        category="Sports watch",
        default_venue="Brick West Brewing",
        source_url="https://www.mlb.com/mariners/schedule",
        owner="Seattle Mariners schedule",
        cadence="Ingest confirmed night games during MLB season",
        tags=("Mariners", "Sports", "Breweries"),
        related_interests=("Sports", "Breweries", "Casual meetups"),
        active_months=(4, 5, 6, 7, 8, 9, 10),
    ),
    EventSource(
        key="football-watch",
        source_type="sports_schedule",
        name="Football Watch Night",
        category="Sports watch",
        default_venue="No-Li Brewhouse",
        source_url="https://www.seahawks.com/schedule/",
        owner="Seahawks, WSU, and UW schedules",
        cadence="Ingest confirmed games during football season",
        tags=("Football", "Sports", "Breweries"),
        related_interests=("Sports", "Breweries", "Casual meetups"),
        active_months=(9, 10, 11, 12, 1),
    ),
    EventSource(
        key="kraken-watch",
        source_type="sports_schedule",
        name="Kraken Watch Night",
        category="Sports watch",
        default_venue="Lumberbeard Brewing",
        source_url="https://www.nhl.com/kraken/schedule",
        owner="Seattle Kraken schedule",
        cadence="Ingest confirmed games during NHL season",
        tags=("Kraken", "Sports", "Breweries"),
        related_interests=("Sports", "Breweries", "Casual meetups"),
        active_months=(1, 2, 3, 4, 5, 10, 11, 12),
    ),
    EventSource(
        key="basketball-rotation",
        source_type="activity_rotation",
        name="3-on-3 Basketball",
        category="Sports",
        default_venue="Thornton Murphy Park",
        source_url="internal:dadbuds/activity-rotations/basketball",
        owner="DadBuds operator",
        cadence="Rotating Friday evenings",
        tags=("Basketball", "Sports", "Fitness"),
        related_interests=("Sports", "Fitness", "Casual meetups"),
    ),
    EventSource(
        key="spokane-indians",
        source_type="sports_schedule",
        name="Spokane Indians",
        category="Local sports",
        default_venue="Avista Stadium",
        source_url="https://www.milb.com/spokane/schedule",
        owner="Spokane Indians schedule",
        cadence="Ingest confirmed home games during baseball season",
        tags=("Spokane Indians", "Sports", "Local teams"),
        related_interests=("Sports", "Dad/kid activities", "Casual meetups"),
        active_months=(4, 5, 6, 7, 8, 9),
    ),
    EventSource(
        key="spokane-chiefs",
        source_type="sports_schedule",
        name="Spokane Chiefs",
        category="Local sports",
        default_venue="Spokane Arena",
        source_url="https://chl.ca/whl-chiefs/schedule/",
        owner="Spokane Chiefs schedule",
        cadence="Ingest confirmed home games during WHL season",
        tags=("Spokane Chiefs", "Sports", "Local teams"),
        related_interests=("Sports", "Casual meetups"),
        active_months=(1, 2, 3, 4, 9, 10, 11, 12),
    ),
    EventSource(
        key="spokane-velocity",
        source_type="sports_schedule",
        name="Spokane Velocity",
        category="Local sports",
        default_venue="One Spokane Stadium",
        source_url="https://www.uslspokane.com/schedule/",
        owner="Spokane Velocity schedule",
        cadence="Ingest confirmed home matches during USL season",
        tags=("Spokane Velocity", "Sports", "Local teams"),
        related_interests=("Sports", "Dad/kid activities", "Casual meetups"),
        active_months=(3, 4, 5, 6, 7, 8, 9, 10, 11),
    ),
    EventSource(
        key="seatgeek-spokane",
        source_type="live_music",
        name="SeatGeek Spokane",
        category="Live music",
        default_venue="Venue pending",
        source_url="https://seatgeek.com",
        owner="SeatGeek listings",
        cadence="Refreshed by scripts/ingest_events.py",
        tags=("Live music", "Concerts"),
        related_interests=("Live music", "Casual meetups"),
    ),
    EventSource(
        key="bandsintown-spokane",
        source_type="live_music",
        name="Bandsintown Spokane",
        category="Live music",
        default_venue="Venue pending",
        source_url="https://www.bandsintown.com/c/spokane-wa",
        owner="Bandsintown local listings",
        cadence="Ingest local concerts after API/source access is configured",
        tags=("Live music", "Concerts"),
        related_interests=("Live music", "Casual meetups"),
    ),
    EventSource(
        key="songkick-spokane",
        source_type="live_music",
        name="Songkick Spokane",
        category="Live music",
        default_venue="Venue pending",
        source_url="https://www.songkick.com/metro-areas/8230-us-spokane",
        owner="Songkick metro listings",
        cadence="Ingest local concerts after API/source access is configured",
        tags=("Live music", "Concerts"),
        related_interests=("Live music", "Casual meetups"),
    ),
]

BREWERY_ROTATION = [
    "Brick West Brewing",
    "Uprise Brewing",
    "Lumberbeard Brewing",
    "No-Li Brewhouse",
]

BASKETBALL_ROTATION = [
    "Thornton Murphy Park",
    "Comstock Park",
    "Hooptown USA Basketball Court",
]

IMPORTED_SCHEDULES = [
    LocalEvent(
        source_key="bandsintown-spokane",
        title="Marley Hale",
        description="Live music listing imported from the Spokane concert feed.",
        date=date(2026, 6, 18),
        start_time="20:00",
        end_time="",
        location="The Chameleon",
        cost="Varies",
        kid_friendly=False,
        capacity=None,
        tags=("Live music", "Concerts"),
        related_interests=("Live music", "Casual meetups"),
    ),
    LocalEvent(
        source_key="bandsintown-spokane",
        title="Jeremy McComb",
        description="Live music listing imported from the Spokane concert feed.",
        date=date(2026, 6, 19),
        start_time="19:30",
        end_time="",
        location="Nashville North",
        cost="Varies",
        kid_friendly=False,
        capacity=None,
        tags=("Live music", "Concerts"),
        related_interests=("Live music", "Casual meetups"),
    ),
    LocalEvent(
        source_key="bandsintown-spokane",
        title="Metal Mayhem",
        description="Live music listing imported from the Spokane concert feed.",
        date=date(2026, 6, 19),
        start_time="20:00",
        end_time="",
        location="Knitting Factory Spokane",
        cost="Varies",
        kid_friendly=False,
        capacity=None,
        tags=("Live music", "Concerts"),
        related_interests=("Live music", "Casual meetups"),
    ),
    LocalEvent(
        source_key="bandsintown-spokane",
        title="Nocteris",
        description="Live music listing imported from the Spokane concert feed.",
        date=date(2026, 6, 20),
        start_time="19:30",
        end_time="",
        location="The Big Dipper",
        cost="Varies",
        kid_friendly=False,
        capacity=None,
        tags=("Live music", "Concerts"),
        related_interests=("Live music", "Casual meetups"),
    ),
    LocalEvent(
        source_key="bandsintown-spokane",
        title="Brass Camel",
        description="Live music listing imported from the Spokane concert feed.",
        date=date(2026, 6, 21),
        start_time="19:00",
        end_time="",
        location="Knitting Factory Spokane",
        cost="Varies",
        kid_friendly=False,
        capacity=None,
        tags=("Live music", "Concerts"),
        related_interests=("Live music", "Casual meetups"),
    ),
    LocalEvent(
        source_key="bandsintown-spokane",
        title="Rock the Nest",
        description="Outdoor music series imported from the Spokane festival feed.",
        date=date(2026, 7, 1),
        start_time="18:00",
        end_time="",
        location="Kendall Yards Night Market",
        cost="Varies",
        kid_friendly=True,
        capacity=None,
        tags=("Live music", "Festivals", "Outdoor"),
        related_interests=("Live music", "Dad/kid activities", "Casual meetups"),
    ),
    LocalEvent(
        source_key="bandsintown-spokane",
        title="Blessing In Disguise",
        description="Local festival listing imported from the Spokane concert feed.",
        date=date(2026, 7, 11),
        start_time="16:00",
        end_time="",
        location="One Spokane Stadium",
        cost="Varies",
        kid_friendly=True,
        capacity=None,
        tags=("Live music", "Festivals"),
        related_interests=("Live music", "Dad/kid activities", "Casual meetups"),
    ),
    LocalEvent(
        source_key="bandsintown-spokane",
        title="Spokane County Interstate Fair",
        description="Fair listing imported from the Spokane event feed.",
        date=date(2026, 9, 11),
        start_time="17:00",
        end_time="",
        location="Spokane County Interstate Fairgrounds",
        cost="Varies",
        kid_friendly=True,
        capacity=None,
        tags=("Live music", "Local events", "Fair"),
        related_interests=("Live music", "Dad/kid activities", "Casual meetups"),
    ),
]


def next_weekday(start: date, weekday: int) -> date:
    days_until = (weekday - start.weekday()) % 7
    return start + timedelta(days=days_until)


def event_source_catalog() -> list[EventSource]:
    return EVENT_SOURCES


def venue_catalog() -> dict[str, Venue]:
    return VENUES


def location_url_for(location: str) -> Optional[str]:
    venue = VENUES.get(location)
    return venue.google_maps_url if venue else None


def require_validated_venue(location: str) -> None:
    if location not in VENUES:
        raise ValueError(
            f"{location} is missing from the Google directory venue catalog."
        )


def active_sports_source(event_date: date) -> EventSource:
    for source in EVENT_SOURCES:
        if source.source_type != "sports_schedule":
            continue
        if source.active_months and event_date.month in source.active_months:
            return source
    return EVENT_SOURCES[1]


def scheduled_night_event(start: date, week: int) -> LocalEvent:
    if week % 3 == 0:
        source = EVENT_SOURCES[0]
        event_date = next_weekday(start + timedelta(days=week * 7), 2)
        return LocalEvent(
            source_key=source.key,
            title="Trivia",
            description="Wednesday trivia at Brick West with a limited table size and a clear end time.",
            date=event_date,
            start_time="19:30",
            end_time="21:30",
            location=source.default_venue,
            cost="$8-20",
            kid_friendly=False,
            capacity=8,
            tags=source.tags,
            related_interests=source.related_interests,
        )

    if week % 3 == 2:
        source = EVENT_SOURCES[4]
        event_date = next_weekday(start + timedelta(days=week * 7), 4)
        venue = BASKETBALL_ROTATION[(week // 3) % len(BASKETBALL_ROTATION)]
        return LocalEvent(
            source_key=source.key,
            title=f"3-on-3 Basketball at {venue}",
            description="Friday half-court basketball with rotating teams and a scheduled end time.",
            date=event_date,
            start_time="18:30",
            end_time="20:00",
            location=venue,
            cost="Free",
            kid_friendly=False,
            capacity=12,
            tags=source.tags,
            related_interests=source.related_interests,
        )

    event_date = next_weekday(start + timedelta(days=week * 7), 4)
    source = active_sports_source(event_date)
    venue = BREWERY_ROTATION[week % len(BREWERY_ROTATION)]
    return LocalEvent(
        source_key=source.key,
        title=f"{source.name} at {venue}",
        description="Scheduled sports watch at a Spokane brewery. Game choice follows the team calendar for the season.",
        date=event_date,
        start_time="18:30",
        end_time="21:00",
        location=venue,
        cost="$8-20",
        kid_friendly=False,
        capacity=10,
        tags=source.tags,
        related_interests=source.related_interests,
    )


def plan_from_event(event: LocalEvent) -> PlanCreate:
    require_validated_venue(event.location)
    return PlanCreate(
        title=event.title,
        description=event.description,
        date=event.date.isoformat(),
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        cost=event.cost,
        kid_friendly=event.kid_friendly,
        capacity=event.capacity,
        status="published",
        visibility="public",
        tags=list(event.tags),
        related_interests=list(event.related_interests),
    )


def candidate_from_event(event: LocalEvent, source: EventSource) -> EventCandidate:
    return EventCandidate(
        source_key=event.source_key,
        title=event.title,
        description=event.description,
        category=source.category,
        date=event.date,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        location_url=event.location_url or location_url_for(event.location),
        source_url=event.listing_url or source.source_url,
        cost=event.cost,
        kid_friendly=event.kid_friendly,
        capacity=event.capacity,
        tags=event.tags,
        related_interests=event.related_interests,
        status="ready",
    )


def candidate_from_source(source: EventSource) -> EventCandidate:
    location_url = location_url_for(source.default_venue)
    return EventCandidate(
        source_key=source.key,
        title=source.name,
        description=(
            f"{source.name} is connected as a source feed. Exact events appear "
            "after date, time, and venue rows are imported."
        ),
        category=source.category,
        date=None,
        start_time="",
        end_time="",
        location=source.default_venue,
        location_url=location_url,
        source_url=source.source_url,
        cost="Varies",
        kid_friendly=False,
        capacity=None,
        tags=source.tags,
        related_interests=source.related_interests,
        status="needs_ingestion",
    )


def local_event_candidates(today: Optional[date] = None) -> list[EventCandidate]:
    from .seatgeek_ingest import load_ingested_local_events

    start = today or date.today()
    by_key = {source.key: source for source in EVENT_SOURCES}
    candidates = []
    seen: set[tuple[str, Optional[date], str]] = set()

    for event in load_ingested_local_events(start):
        source = by_key[event.source_key]
        candidates.append(candidate_from_event(event, source))
        seen.add((event.title.casefold(), event.date, event.location.casefold()))

    for event in IMPORTED_SCHEDULES:
        if event.date < start:
            continue
        key = (event.title.casefold(), event.date, event.location.casefold())
        if key in seen:
            continue
        candidates.append(candidate_from_event(event, by_key[event.source_key]))
        seen.add(key)

    for week in range(4):
        event = scheduled_night_event(start, week)
        candidates.append(candidate_from_event(event, by_key[event.source_key]))

    for key in [
        "spokane-indians",
        "spokane-chiefs",
        "spokane-velocity",
    ]:
        candidates.append(candidate_from_source(by_key[key]))

    return sorted(
        candidates,
        key=lambda event: (
            event.date is None,
            event.date or date.max,
            event.start_time,
            event.title,
        ),
    )
