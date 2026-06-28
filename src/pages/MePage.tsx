import {
  Bookmark,
  CalendarClock,
  CheckCircle2,
  MapPin,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AsyncState from "../components/AsyncState";
import PersonalityQuizPrompt from "../components/PersonalityQuizPrompt";
import {
  api,
  type AvailabilityWindow,
  type BudRelationship,
  type Crew,
  type Rsvp,
  type User,
} from "../lib/api";
import {
  dismissPersonalityPrompt,
  getLocalUserId,
  getPersonalityPromptDismissed,
  getPersonalitySignals,
  savePersonalitySignals,
  type PersonalitySignals,
} from "../lib/storage";
import { bucketSummary, selectedCount } from "../lib/personalityQuizzes";

function calendarStatus(rsvp: Rsvp) {
  if (rsvp.status === "going") {
    return {
      icon: CheckCircle2,
      label: "Attending",
      className: "bg-moss/15 text-moss",
      note: "Thread stays available through the event window.",
    };
  }
  return {
    icon: Bookmark,
    label: "Bookmarked",
    className: "bg-amber/15 text-amber",
    note: "Thread is available until the event starts.",
  };
}

export default function MePage() {
  const userId = getLocalUserId();
  const [user, setUser] = useState<User | null>(null);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [buds, setBuds] = useState<BudRelationship[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [showPersonalityPrompt, setShowPersonalityPrompt] = useState(
    () => !getPersonalityPromptDismissed(),
  );
  const [signals, setSignals] = useState(() => getPersonalitySignals());

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          loadedUser,
          loadedAvailability,
          loadedRsvps,
          loadedBuds,
          loadedCrews,
        ] = await Promise.all([
          api.getUser(userId!),
          api.listAvailability(userId),
          api.listRsvps(userId),
          api.listBuds(userId!),
          api.listCrews(userId!),
        ]);
        setUser(loadedUser);
        setAvailability(loadedAvailability);
        setRsvps(loadedRsvps);
        setBuds(loadedBuds);
        setCrews(loadedCrews);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [userId]);

  const attendingRsvps = rsvps.filter((rsvp) => rsvp.status === "going");
  const bookmarkedRsvps = rsvps.filter((rsvp) => rsvp.status !== "going");
  const orderedRsvps = [...attendingRsvps, ...bookmarkedRsvps];

  function dismissQuizPrompt() {
    dismissPersonalityPrompt();
    setShowPersonalityPrompt(false);
  }

  function updateSignals(nextSignals: PersonalitySignals) {
    setSignals(nextSignals);
    savePersonalitySignals(nextSignals);
  }
  const populatedSignals = bucketSummary(signals);

  if (!userId) {
    return (
      <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
        <div className="mx-auto max-w-xl rounded-lg bg-cream p-8 shadow-soft">
          <UserRound size={34} className="text-moss" />
          <h1 className="mt-5 text-3xl font-black">No local profile yet</h1>
          <p className="mt-3 leading-7 text-ink/72">
            If you already joined, reconnect this browser to your existing
            profile. New here? Create a pilot profile first.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" to="/signin">
              Find my profile
            </Link>
            <Link className="btn-secondary" to="/signup">
              Join Spokane Pilot
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-10">
      <AsyncState loading={loading} error={error} empty={!user}>
        {user ? (
          <>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold text-moss">My Calendar</p>
                <h1 className="mt-2 text-4xl font-black">Hey, {user.name}</h1>
                <p className="mt-3 text-ink/72">
                  Spokane · {user.neighborhood} · {user.comfort_level}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className="btn-primary" to="/free">
                  <CalendarClock size={18} />
                  Set status
                </Link>
                <a
                  className="btn-secondary"
                  href="https://discord.gg/qWEp9bTd"
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle size={18} />
                  Discord
                </a>
              </div>
            </div>

            {showPersonalityPrompt ? (
              <PersonalityQuizPrompt
                signals={signals}
                onChange={updateSignals}
                onDismiss={dismissQuizPrompt}
              />
            ) : null}

            <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="card space-y-5">
                <h2 className="text-xl font-black">Profile summary</h2>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="font-bold">Email</dt>
                    <dd className="text-ink/72">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="font-bold">Phone</dt>
                    <dd className="text-ink/72">{user.phone}</dd>
                  </div>
                  <div>
                    <dt className="font-bold">Kids</dt>
                    <dd className="text-ink/72">{user.kids_age_range}</dd>
                  </div>
                  <div>
                    <dt className="font-bold">SMS status</dt>
                    <dd className="text-ink/72">
                      {user.sms_opt_in
                        ? "Opted in, integration pending"
                        : "Not opted in"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold">Discord</dt>
                    <dd className="text-ink/72">
                      {user.discord_username || "Not linked yet"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="card">
                <h2 className="text-xl font-black">Interests</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-md bg-paper px-3 py-2 text-sm font-bold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                {selectedCount(signals) ? (
                  <>
                    <h2 className="mt-7 text-xl font-black">Preferences</h2>
                    <div className="mt-4 grid gap-3 text-sm">
                      {populatedSignals.map((signal) => (
                        <div
                          className="rounded-md bg-paper p-3"
                          key={`${signal.bucket}.${signal.keyName}`}
                        >
                          <p className="font-black">{signal.bucketLabel}</p>
                          <p className="mt-1 text-xs font-bold text-moss">
                            {signal.title}
                          </p>
                          <p className="mt-2 text-ink/68">
                            {signal.values.join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                <h2 className="mt-7 text-xl font-black">Typical availability</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.typical_availability.map((window) => (
                    <span
                      key={window}
                      className="rounded-md bg-sky px-3 py-2 text-sm font-bold"
                    >
                      {window}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <section className="card">
                <h2 className="text-xl font-black">Buds</h2>
                <AsyncState
                  empty={!buds.length}
                  emptyMessage="No saved buds yet. Save people privately from a thread."
                >
                  <div className="mt-4 space-y-3">
                    {buds.map((bud) => (
                      <div
                        key={bud.id}
                        className="rounded-md border border-pencil/15 bg-cream/70 p-3"
                      >
                        <p className="font-bold">{bud.other_user.name}</p>
                        <p className="mt-1 text-sm text-ink/70">
                          {bud.relationship_state.replaceAll("_", " ")} ·{" "}
                          {bud.mutual_bud_count
                            ? `Connected through ${bud.mutual_bud_count} buds`
                            : "No shared buds yet"}
                        </p>
                      </div>
                    ))}
                  </div>
                </AsyncState>
              </section>

              <section className="card">
                <h2 className="text-xl font-black">Crews</h2>
                <AsyncState
                  empty={!crews.length}
                  emptyMessage="No persistent crews yet. Threads become crews only when multiple people keep them on."
                >
                  <div className="mt-4 space-y-3">
                    {crews.map((crew) => (
                      <div
                        key={crew.id}
                        className="rounded-md border border-pencil/15 bg-cream/70 p-3"
                      >
                        <p className="font-bold">{crew.name}</p>
                        <p className="mt-1 text-sm text-ink/70">
                          {crew.members.length} members · {crew.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </AsyncState>
              </section>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <section className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">My calendar</h2>
                    <p className="mt-1 text-sm font-semibold text-ink/58">
                      {attendingRsvps.length} attending ·{" "}
                      {bookmarkedRsvps.length} bookmarked
                    </p>
                  </div>
                  {attendingRsvps.length ? (
                    <span className="rounded-md bg-moss/15 px-3 py-2 text-sm font-black text-moss">
                      Confirmed attendance
                    </span>
                  ) : null}
                </div>
                <AsyncState
                  empty={!rsvps.length}
                  emptyMessage="No RSVPs yet. Join something from the Spokane calendar."
                >
                  <div className="mt-4 space-y-3">
                    {orderedRsvps.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="rounded-md border border-pencil/15 bg-cream/70 p-3"
                      >
                        {(() => {
                          const status = calendarStatus(rsvp);
                          const StatusIcon = status.icon;
                          return (
                            <>
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-black">{rsvp.plan_title}</p>
                                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink/70">
                                    <CalendarClock size={16} className="text-moss" />
                                    {rsvp.plan_date} · {rsvp.plan_start_time}
                                    {rsvp.plan_end_time
                                      ? `-${rsvp.plan_end_time}`
                                      : ""}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black uppercase ${status.className}`}
                                >
                                  <StatusIcon size={14} />
                                  {status.label}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-ink/70">
                                <span className="rounded-md bg-paper px-2 py-1">
                                  {rsvp.plan_kid_friendly
                                    ? "Dad/kid friendly"
                                    : "Dads only"}
                                </span>
                                <span className="rounded-md bg-paper px-2 py-1">
                                  {rsvp.plan_cost}
                                </span>
                              </div>
                              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink/70">
                                <MapPin size={16} className="shrink-0 text-moss" />
                                {rsvp.plan_location_url ? (
                                  <a
                                    className="text-moss underline decoration-moss/30 underline-offset-4"
                                    href={rsvp.plan_location_url}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    {rsvp.plan_location}
                                  </a>
                                ) : (
                                  <span>{rsvp.plan_location}</span>
                                )}
                              </p>
                              <p className="mt-3 text-sm font-semibold text-ink/58">
                                {status.note}
                              </p>
                              <Link
                                className="btn-secondary mt-3 w-full justify-center"
                                to={`/plans/${rsvp.plan_id}/thread`}
                              >
                                <MessageCircle size={18} />
                                Open thread
                              </Link>
                            </>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </AsyncState>
              </section>

              <section className="card">
                <h2 className="text-xl font-black">Recent status</h2>
                <AsyncState
                  empty={!availability.length}
                  emptyMessage="No status updates yet."
                >
                  <div className="mt-4 space-y-3">
                    {availability.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-pencil/15 bg-cream/70 p-3"
                      >
                        <p className="font-bold">
                          {item.date} · {item.start_time}-{item.end_time}
                        </p>
                        <p className="mt-1 text-sm text-ink/70">
                          {item.kid_status} · {item.preferred_vibe} ·{" "}
                          {item.status}
                        </p>
                        {item.notes ? (
                          <p className="mt-2 text-sm font-semibold text-ink/58">
                            {item.notes}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </AsyncState>
              </section>
            </div>
          </>
        ) : null}
      </AsyncState>
    </section>
  );
}
