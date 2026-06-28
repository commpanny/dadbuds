from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Optional

from .event_pipeline import LocalEvent, VENUES, google_maps_search_url

INGEST_CACHE_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "ingested_events.json"
)

SPOKANE_LAT = 47.658
SPOKANE_LON = -117.426
SPOKANE_RANGE = "50mi"
DEFAULT_LOOKAHEAD_DAYS = 90

SEATGEEK_SOURCE_KEY = "seatgeek-spokane"

VENUE_ALIASES = {
    "knitting factory concert house": "Knitting Factory Spokane",
    "knitting factory spokane": "Knitting Factory Spokane",
    "knitting factory - spokane": "Knitting Factory Spokane",
    "northern quest casino": "Northern Quest Casino",
    "northern quest casino and resort": "Northern Quest Casino",
    "the fox theater": "Fox Theater",
    "fox theater": "Fox Theater",
    "district bar": "District Bar",
    "the big dipper": "The Big Dipper",
    "the chameleon": "The Chameleon",
    "the podium": "Podium Spokane",
    "podium spokane": "Podium Spokane",
    "the pin": "The Pin",
    "the vogue theatre": "The Vogue Theatre",
    "the martin woldson theatre": "The Martin Woldson Theatre",
    "the martin woldson theater": "The Martin Woldson Theatre",
    "the martin woldson theatre at the fox": "The Martin Woldson Theatre",
    "the martin woldson theater at the fox": "The Martin Woldson Theatre",
    "spokane arena": "Spokane Arena",
    "one spokane stadium": "One Spokane Stadium",
    "avista stadium": "Avista Stadium",
    "brick west brewing co": "Brick West Brewing",
    "brick west brewing": "Brick West Brewing",
    "uprise brewing": "Uprise Brewing",
    "lumberbeard brewing co": "Lumberbeard Brewing",
    "no-li brewhouse": "No-Li Brewhouse",
}


def _normalize_venue_key(name: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", " ", name.casefold()).strip()
    return cleaned


def resolve_venue_name(raw_name: str, city: str = "", state: str = "") -> tuple[str, Optional[str]]:
    key = _normalize_venue_key(raw_name)
    if key in VENUE_ALIASES:
        canonical = VENUE_ALIASES[key]
        return canonical, VENUES[canonical].google_maps_url

    if raw_name in VENUES:
        return raw_name, VENUES[raw_name].google_maps_url

    for venue_name in VENUES:
        venue_key = _normalize_venue_key(venue_name)
        if venue_key in key or key in venue_key:
            return venue_name, VENUES[venue_name].google_maps_url

    location_hint = ", ".join(part for part in [raw_name, city, state, "US"] if part)
    return raw_name, google_maps_search_url(location_hint)


def _parse_local_datetime(value: str) -> tuple[date, str]:
    parsed = datetime.fromisoformat(value)
    return parsed.date(), parsed.strftime("%H:%M")


def _format_cost(stats: dict[str, Any]) -> str:
    lowest = stats.get("lowest_listing_price") or stats.get("lowest_ticket_prci")
    average = stats.get("average_listing_price") or stats.get("average_ticket_price")
    if lowest and average and lowest != average:
        return f"${int(lowest)}-${int(average)}"
    if lowest:
        return f"From ${int(lowest)}"
    if average:
        return f"Around ${int(average)}"
    return "Varies"


def _event_tags(event_type: str, taxonomies: list[dict[str, Any]]) -> tuple[str, ...]:
    tags = ["Live music"]
    lowered = event_type.casefold()
    if lowered in {"concert", "music_festival"}:
        tags.append("Concerts")
    elif lowered == "theater":
        tags.append("Theater")
    elif lowered == "comedy":
        tags.append("Comedy")
    else:
        tags.append("Events")

    for taxonomy in taxonomies:
        name = taxonomy.get("name")
        if name and name not in tags:
            tags.append(str(name).replace("_", " ").title())
    return tuple(dict.fromkeys(tags))


@dataclass(frozen=True)
class IngestSummary:
    fetched: int
    kept: int
    skipped_past: int
    skipped_missing_datetime: int
    cache_path: str


def fetch_seatgeek_events(
    *,
    client_id: str,
    lookahead_days: int = DEFAULT_LOOKAHEAD_DAYS,
) -> list[dict[str, Any]]:
    start = datetime.now().replace(microsecond=0)
    end = start + timedelta(days=lookahead_days)
    params_base = {
        "client_id": client_id,
        "lat": str(SPOKANE_LAT),
        "lon": str(SPOKANE_LON),
        "range": SPOKANE_RANGE,
        "datetime_utc.gte": start.strftime("%Y-%m-%dT%H:%M:%S"),
        "datetime_utc.lte": end.strftime("%Y-%m-%dT%H:%M:%S"),
        "per_page": "100",
    }

    collected: dict[int, dict[str, Any]] = {}
    page = 1
    while True:
        params = {**params_base, "page": str(page)}
        url = "https://api.seatgeek.com/2/events?" + urllib.parse.urlencode(params)
        request = urllib.request.Request(url, headers={"Accept": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"SeatGeek API error {exc.code}: {body}") from exc

        events = payload.get("events") or []
        if not events:
            break

        for event in events:
            event_id = event.get("id")
            if isinstance(event_id, int):
                collected[event_id] = event

        meta = payload.get("meta") or {}
        total = int(meta.get("total") or 0)
        per_page = int(meta.get("per_page") or len(events))
        if page * per_page >= total:
            break
        page += 1

    return list(collected.values())


def normalize_seatgeek_event(raw: dict[str, Any]) -> Optional[LocalEvent]:
    datetime_local = raw.get("datetime_local")
    if not datetime_local:
        return None

    event_date, start_time = _parse_local_datetime(str(datetime_local))
    venue = raw.get("venue") or {}
    venue_name = str(venue.get("name") or "Venue pending").strip()
    city = str(venue.get("city") or "Spokane").strip()
    state = str(venue.get("state") or "WA").strip()
    location, location_url = resolve_venue_name(venue_name, city, state)

    performers = raw.get("performers") or []
    performer_names = [
        str(performer.get("name")).strip()
        for performer in performers
        if performer.get("name")
    ]
    title = str(raw.get("short_title") or raw.get("title") or "Live event").strip()
    if performer_names and performer_names[0].casefold() not in title.casefold():
        title = performer_names[0]

    description_parts = [
        f"{title} listed via SeatGeek.",
        f"Venue: {venue_name}, {city}, {state}.",
    ]
    if performer_names:
        description_parts.append(f"Lineup: {', '.join(performer_names[:4])}.")

    stats = raw.get("stats") or {}
    taxonomies = raw.get("taxonomies") or []
    event_type = str(raw.get("type") or "concert")

    return LocalEvent(
        source_key=SEATGEEK_SOURCE_KEY,
        title=title,
        description=" ".join(description_parts),
        date=event_date,
        start_time=start_time,
        end_time="",
        location=location,
        cost=_format_cost(stats),
        kid_friendly=False,
        capacity=None,
        tags=_event_tags(event_type, taxonomies),
        related_interests=("Live music", "Casual meetups"),
        listing_url=str(raw.get("url") or "https://seatgeek.com"),
        location_url=location_url,
        external_id=int(raw["id"]) if raw.get("id") is not None else None,
    )


def ingest_seatgeek_events(
    *,
    client_id: str,
    lookahead_days: int = DEFAULT_LOOKAHEAD_DAYS,
    today: Optional[date] = None,
) -> tuple[list[LocalEvent], IngestSummary]:
    start = today or date.today()
    raw_events = fetch_seatgeek_events(client_id=client_id, lookahead_days=lookahead_days)

    kept: list[LocalEvent] = []
    skipped_past = 0
    skipped_missing_datetime = 0

    for raw in raw_events:
        normalized = normalize_seatgeek_event(raw)
        if normalized is None:
            skipped_missing_datetime += 1
            continue
        if normalized.date < start:
            skipped_past += 1
            continue
        kept.append(normalized)

    kept.sort(key=lambda event: (event.date, event.start_time, event.title.casefold()))
    summary = IngestSummary(
        fetched=len(raw_events),
        kept=len(kept),
        skipped_past=skipped_past,
        skipped_missing_datetime=skipped_missing_datetime,
        cache_path=str(INGEST_CACHE_PATH),
    )
    return kept, summary


def write_ingest_cache(events: list[LocalEvent]) -> Path:
    INGEST_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "fetched_at": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "source": "seatgeek",
        "events": [
            {
                **asdict(event),
                "date": event.date.isoformat(),
            }
            for event in events
        ],
    }
    INGEST_CACHE_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return INGEST_CACHE_PATH


def load_ingested_local_events(
    today: Optional[date] = None,
    *,
    cache_path: Path = INGEST_CACHE_PATH,
) -> list[LocalEvent]:
    start = today or date.today()
    if not cache_path.exists():
        return []

    payload = json.loads(cache_path.read_text(encoding="utf-8"))
    events: list[LocalEvent] = []
    for row in payload.get("events") or []:
        event_date = date.fromisoformat(row["date"])
        if event_date < start:
            continue
        events.append(
            LocalEvent(
                source_key=row.get("source_key") or SEATGEEK_SOURCE_KEY,
                title=row["title"],
                description=row["description"],
                date=event_date,
                start_time=row.get("start_time") or "",
                end_time=row.get("end_time") or "",
                location=row["location"],
                cost=row.get("cost") or "Varies",
                kid_friendly=bool(row.get("kid_friendly")),
                capacity=row.get("capacity"),
                tags=tuple(row.get("tags") or ()),
                related_interests=tuple(row.get("related_interests") or ()),
                listing_url=row.get("listing_url") or "",
                location_url=row.get("location_url"),
                external_id=row.get("external_id"),
            )
        )
    return events


def seatgeek_client_id() -> str:
    return os.getenv("SEATGEEK_CLIENT_ID", "").strip()
