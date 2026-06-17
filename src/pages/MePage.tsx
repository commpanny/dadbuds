import { CalendarClock, MessageCircle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AsyncState from "../components/AsyncState";
import {
  api,
  type AvailabilityWindow,
  type Rsvp,
  type User,
} from "../lib/api";
import { getLocalUserId } from "../lib/storage";

export default function MePage() {
  const userId = getLocalUserId();
  const [user, setUser] = useState<User | null>(null);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [loadedUser, loadedAvailability, loadedRsvps] = await Promise.all([
          api.getUser(userId!),
          api.listAvailability(userId),
          api.listRsvps(userId),
        ]);
        setUser(loadedUser);
        setAvailability(loadedAvailability);
        setRsvps(loadedRsvps);
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

  if (!userId) {
    return (
      <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
        <div className="mx-auto max-w-xl rounded-lg bg-cream p-8 shadow-soft">
          <UserRound size={34} className="text-moss" />
          <h1 className="mt-5 text-3xl font-black">No local profile yet</h1>
          <p className="mt-3 leading-7 text-ink/72">
            Sign up first so this dashboard can show your RSVPs, availability,
            Discord link, and SMS status.
          </p>
          <Link className="btn-primary mt-6" to="/signup">
            Join Spokane Pilot
          </Link>
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
                <p className="text-sm font-bold text-moss">User dashboard</p>
                <h1 className="mt-2 text-4xl font-black">Hey, {user.name}</h1>
                <p className="mt-3 text-ink/72">
                  Spokane · {user.neighborhood} · {user.comfort_level}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className="btn-primary" to="/free">
                  <CalendarClock size={18} />
                  Add availability
                </Link>
                <a className="btn-secondary" href="https://discord.gg/qWEp9bTd">
                  <MessageCircle size={18} />
                  Discord
                </a>
              </div>
            </div>

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
                <h2 className="text-xl font-black">Upcoming RSVPs</h2>
                <AsyncState
                  empty={!rsvps.length}
                  emptyMessage="No RSVPs yet. The plan feed is waiting."
                >
                  <div className="mt-4 space-y-3">
                    {rsvps.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="rounded-md border border-pencil/15 bg-cream/70 p-3"
                      >
                        <p className="font-bold">{rsvp.plan_title}</p>
                        <p className="mt-1 text-sm text-ink/70">
                          Status: {rsvp.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </AsyncState>
              </section>

              <section className="card">
                <h2 className="text-xl font-black">Submitted availability</h2>
                <AsyncState
                  empty={!availability.length}
                  emptyMessage="No availability submitted yet."
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
