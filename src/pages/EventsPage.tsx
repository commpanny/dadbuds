import { ExternalLink, MapPin, PlusCircle, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AsyncState from "../components/AsyncState";
import { api, type EventSource, type LocalEvent } from "../lib/api";

function formatWhen(event: LocalEvent) {
  if (!event.date) return "Dates pending";
  return `${event.date} · ${event.start_time}${
    event.end_time ? `-${event.end_time}` : ""
  }`;
}

function audienceClass(event: LocalEvent) {
  return event.kid_friendly
    ? "bg-moss/15 text-moss"
    : "bg-brick/10 text-brick";
}

function eventToPlanState(event: LocalEvent) {
  return {
    title: event.title,
    description: event.description,
    date: event.date ?? "",
    start_time: event.start_time,
    end_time: event.end_time,
    location: event.location === "Venue pending" ? "" : event.location,
    cost: event.cost,
    kid_friendly: event.kid_friendly,
    capacity: event.capacity ? String(event.capacity) : "",
    visibility: "public",
    tags: event.tags,
    related_interests: event.related_interests,
  };
}

function EventRow({ event }: { event: LocalEvent }) {
  return (
    <article className="rounded-md border border-pencil/15 bg-paper/88 px-4 py-3 shadow-[2px_2px_0_rgba(54,55,49,0.10)]">
      <div className="grid gap-3 md:grid-cols-[minmax(9rem,0.9fr)_minmax(0,2fr)_minmax(12rem,1.1fr)_auto] md:items-center">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-black text-pencil">
            {formatWhen(event)}
          </span>
          <span className="text-xs font-bold uppercase text-ink/50">
            {event.category}
          </span>
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-base font-black md:text-lg">
            {event.title}
          </h2>
          <div className="mt-1 flex flex-wrap gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${audienceClass(
                event,
              )}`}
            >
              {event.kid_friendly ? "Dad/kid friendly" : "Dads only"}
            </span>
            <span className="rounded-md bg-amber/15 px-2 py-0.5 text-xs font-bold text-amber">
              {event.cost}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink/70">
          <MapPin size={16} className="shrink-0 text-moss" />
          {event.location_url ? (
            <a
              className="truncate text-moss underline decoration-moss/30 underline-offset-4"
              href={event.location_url}
              rel="noreferrer"
              target="_blank"
            >
              {event.location}
            </a>
          ) : (
            <span className="truncate">{event.location}</span>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
          <a
            className="btn-secondary px-3 py-2 text-sm"
            href={event.source_url}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={16} />
            Source
          </a>
          <Link className="btn-primary px-3 py-2 text-sm" to="/free">
            <Radio size={16} />
            Status
          </Link>
          <Link
            className="btn-secondary px-3 py-2 text-sm"
            state={{ candidate: eventToPlanState(event) }}
            to="/admin/plans/new"
          >
            <PlusCircle size={16} />
            Draft
          </Link>
        </div>
      </div>
    </article>
  );
}

function SourceCoverage({ sources }: { sources: EventSource[] }) {
  if (!sources.length) return null;

  return (
    <section className="rounded-md border border-pencil/15 bg-sticky/70 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Coming next</h2>
          <p className="mt-1 text-sm font-semibold text-ink/62">
            Source calendars are linked here while exact event rows are being
            imported and venue-checked.
          </p>
        </div>
        <span className="rounded-md bg-pencil/10 px-3 py-2 text-sm font-black text-pencil">
          {sources.length}
        </span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <div
            className="flex items-center justify-between gap-3 rounded-md border border-pencil/10 bg-paper/75 px-3 py-2"
            key={source.key}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{source.name}</p>
              <p className="truncate text-xs font-bold text-ink/52">
                {source.category}
              </p>
            </div>
            <a
              className="btn-secondary shrink-0 px-3 py-2 text-sm"
              href={source.source_url}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink size={15} />
              Source
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [sources, setSources] = useState<EventSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      setError(null);
      try {
        const payload = await api.listLocalEvents();
        setEvents(payload.events);
        setSources(payload.sources);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load events.");
      } finally {
        setLoading(false);
      }
    }

    void loadEvents();
  }, []);

  const readyEvents = useMemo(
    () => events.filter((event) => event.status === "ready"),
    [events],
  );
  const sourceCoverage = useMemo(
    () =>
      sources.filter(
        (source) =>
          !readyEvents.some((event) => event.source_key === source.key) &&
          source.source_url.startsWith("http"),
      ),
    [readyEvents, sources],
  );

  return (
    <section className="section-shell py-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black">Event ideas</h1>
        <p className="mt-3 leading-7 text-ink/72">
          Browse source-backed local events that could become Spokane calendar
          plans. Draft one when the date, time, source, and location are clear.
        </p>
      </div>

      <div className="mt-8">
        <AsyncState
          loading={loading}
          error={error}
          empty={!events.length}
          emptyMessage="No local events are available yet."
        >
          <div className="space-y-10">
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">Schedule</h2>
                  <p className="mt-2 text-sm font-semibold text-ink/60">
                    Date, time, location, and source in one scan.
                  </p>
                </div>
                <span className="rounded-md bg-moss/15 px-3 py-2 text-sm font-black text-moss">
                  {readyEvents.length}
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {readyEvents.map((event, index) => (
                  <EventRow
                    event={event}
                    key={`${event.source_key}-${event.date}-${index}`}
                  />
                ))}
              </div>
            </section>

            <SourceCoverage sources={sourceCoverage} />
          </div>
        </AsyncState>
      </div>
    </section>
  );
}
