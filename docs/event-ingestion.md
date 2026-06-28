# Event Ingestion

DadBuds plans should come from a defined source, not from generic filler copy.
When a new team, venue, or recurring activity is added, onboard it through this
pipeline.

1. Add the source to `EVENT_SOURCES` in `backend/app/event_pipeline.py`.
   Include the owner, source URL, cadence, category, tags, and active months
   when the source is seasonal.
2. Add every venue to `VENUES` in `backend/app/event_pipeline.py`.
   Each venue must include a Google Maps directory URL. Generated plans fail
   validation if their location is not in this catalog.
3. Map source events into `LocalEvent` records.
   Trivia can use a venue recurrence; sports watches should come from the
   relevant team schedule source; activity rotations can use an internal source
   with a clear operator owner.
4. Convert `LocalEvent` records to `PlanCreate` only after venue validation.
5. Refresh generated plans locally and verify `/plans` in both card and month
   views.

Current source categories:

- Venue recurrence: Brick West trivia.
- Sports schedules: Mariners, Seahawks/WSU/UW football, Kraken, Spokane
  Indians, Spokane Chiefs, Spokane Velocity.
- Live music listings: SeatGeek Spokane (via `npm run ingest`), legacy Bandsintown
  rows in `IMPORTED_SCHEDULES`, and Songkick as reference-only source metadata.
- Activity rotation: 3-on-3 basketball, pickleball, kid-friendly Sunday plans.

Next production step: run `npm run ingest` on a schedule (daily is fine) so
SeatGeek listings stay fresh, then optionally auto-publish validated rows into
`/plans`. Longer term, add sports schedule importers and venue-direct feeds.
