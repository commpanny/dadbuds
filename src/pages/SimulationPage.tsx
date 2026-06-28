import {
  CalendarDays,
  FastForward,
  MessageSquareWarning,
  Play,
  Radio,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AsyncState from "../components/AsyncState";
import { api, type SocialSimulation, type UxFeedback } from "../lib/api";
import { getLocalUserId } from "../lib/storage";

const humanActions = [
  {
    value: "observe",
    label: "Observe",
    description: "Let the agents move without you.",
  },
  {
    value: "rsvp",
    label: "RSVP",
    description: "Signal that you plan to attend.",
  },
  {
    value: "coordinate",
    label: "Coordinate",
    description: "Create a plan and test how agents respond.",
  },
  {
    value: "nudge",
    label: "Nudge",
    description: "Prompt the thread to confirm the details.",
  },
];

const shadowMode = import.meta.env.VITE_SHADOW_MODE === "true";
const apiTarget = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function metricLabel(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function eventTone(type: string) {
  if (type === "RESISTANCE" || type === "MUTE") return "border-brick/25 bg-brick/8";
  if (type === "CREW_SEED" || type === "HUMAN_ACTION") {
    return "border-moss/25 bg-moss/10";
  }
  if (type === "PLAN_PROPOSED") return "border-amber/30 bg-amber/10";
  return "border-pencil/15 bg-paper";
}

export default function SimulationPage() {
  const userId = getLocalUserId();
  const [simulation, setSimulation] = useState<SocialSimulation | null>(null);
  const [loading, setLoading] = useState(Boolean(userId && shadowMode));
  const [error, setError] = useState<string | null>(null);
  const [agentCount, setAgentCount] = useState(120);
  const [days, setDays] = useState(7);
  const [humanAction, setHumanAction] = useState("observe");
  const [feedback, setFeedback] = useState<UxFeedback[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || !shadowMode) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const latest = await api.getLatestSocialSimulation(userId);
        setSimulation(latest);
      } catch {
        setSimulation(null);
      } finally {
        try {
          setFeedback(await api.listUxFeedback());
        } catch {
          setFeedback([]);
        }
        setLoading(false);
      }
    }

    void load();
  }, [userId]);

  async function startSimulation() {
    if (!userId || !shadowMode) return;
    setBusy(true);
    setError(null);
    try {
      setSimulation(
        await api.createSocialSimulation({
          user_id: userId,
          agent_count: agentCount,
          name: "DadBuds Spokane live door test",
        }),
      );
      setFeedback(await api.listUxFeedback());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start sim.");
    } finally {
      setBusy(false);
    }
  }

  async function advanceSimulation(nextDays = days) {
    if (!simulation || !userId || !shadowMode) return;
    setBusy(true);
    setError(null);
    try {
      setSimulation(
        await api.advanceSocialSimulation(simulation.id, {
          user_id: userId,
          days: nextDays,
          human_action: humanAction,
        }),
      );
      setFeedback(await api.listUxFeedback());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not advance sim.");
    } finally {
      setBusy(false);
    }
  }

  if (!shadowMode) {
    return (
      <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
        <div className="mx-auto max-w-2xl rounded-lg border border-amber/40 bg-sticky p-8 shadow-soft">
          <Radio size={34} className="text-moss" />
          <p className="mt-5 text-sm font-black uppercase text-moss">
            Shadow runtime required
          </p>
          <h1 className="mt-2 text-3xl font-black">Run the live sim on the shadow site</h1>
          <p className="mt-3 leading-7 text-ink/72">
            The simulation is blocked on the real local site so agent behavior
            cannot pollute pilot RSVPs, messages, crews, or safety data.
          </p>
          <div className="mt-6 rounded-md border border-pencil/15 bg-paper p-4 font-mono text-sm leading-7 text-ink/72">
            <p>npm run seed:shadow</p>
            <p>npm run api:shadow</p>
            <p>npm run dev:shadow</p>
          </div>
          <p className="mt-4 text-sm font-semibold text-ink/60">
            Shadow URL: http://127.0.0.1:5176
          </p>
        </div>
      </section>
    );
  }

  if (!userId) {
    return (
      <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
        <div className="mx-auto max-w-xl rounded-lg bg-cream p-8 shadow-soft">
          <Radio size={34} className="text-moss" />
          <h1 className="mt-5 text-3xl font-black">Sign in for live sim</h1>
          <p className="mt-3 leading-7 text-ink/72">
            The simulation needs your local DadBuds profile so you can
            participate as the human in the shadow cohort.
          </p>
          <Link className="btn-primary mt-6" to="/signin">
            Find my profile
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase text-moss">
            Agentic door test
          </p>
          <h1 className="mt-2 text-4xl font-black">Live social simulation</h1>
          <p className="mt-3 leading-7 text-ink/72">
            Advance a shadow Spokane cohort through plans, RSVPs, bookmarks,
            inactive users, resistant users, and high-activity coordinators.
          </p>
        </div>
        <div className="rounded-md border border-pencil/15 bg-sticky px-4 py-3">
          <p className="text-sm font-bold text-ink/60">Sim date</p>
          <p className="text-2xl font-black">
            {simulation?.current_date ?? "Not started"}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-moss/25 bg-moss/10 px-4 py-3 text-sm font-semibold text-ink/72">
        Shadow runtime active. API target:{" "}
        <span className="font-mono text-ink">{apiTarget}</span>
      </div>

      {error ? (
        <p className="mt-5 rounded-md bg-brick/10 p-3 text-sm font-semibold text-brick">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="card space-y-4">
            <h2 className="text-xl font-black">Run controls</h2>
            {!simulation ? (
              <>
                <label className="space-y-2">
                  <span className="label">Shadow dads</span>
                  <input
                    className="input"
                    min={25}
                    max={1000}
                    type="number"
                    value={agentCount}
                    onChange={(event) => setAgentCount(Number(event.target.value))}
                  />
                </label>
                <button
                  className="btn-primary w-full justify-center"
                  disabled={busy}
                  onClick={() => void startSimulation()}
                >
                  <Play size={18} />
                  {busy ? "Starting..." : "Start live sim"}
                </button>
              </>
            ) : (
              <>
                <label className="space-y-2">
                  <span className="label">Your move</span>
                  <select
                    className="input"
                    value={humanAction}
                    onChange={(event) => setHumanAction(event.target.value)}
                  >
                    {humanActions.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-sm leading-6 text-ink/62">
                  {
                    humanActions.find((action) => action.value === humanAction)
                      ?.description
                  }
                </p>
                <label className="space-y-2">
                  <span className="label">Days to advance</span>
                  <input
                    className="input"
                    min={1}
                    max={30}
                    type="number"
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                  />
                </label>
                <button
                  className="btn-primary w-full justify-center"
                  disabled={busy}
                  onClick={() => void advanceSimulation()}
                >
                  <FastForward size={18} />
                  {busy ? "Advancing..." : "Advance calendar"}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 7, 14].map((value) => (
                    <button
                      className="btn-secondary justify-center px-2 py-2 text-sm"
                      disabled={busy}
                      key={value}
                      onClick={() => void advanceSimulation(value)}
                    >
                      +{value}d
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          {simulation ? (
            <section className="card">
              <h2 className="text-xl font-black">Cohort mix</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(simulation.archetypes).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between gap-3 text-sm font-bold">
                      <span>{metricLabel(key)}</span>
                      <span>{value}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-pencil/10">
                      <div
                        className="h-2 rounded-full bg-moss"
                        style={{
                          width: `${Math.max(
                            2,
                            (value / simulation.agent_count) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="card">
            <div className="flex items-center gap-2">
              <MessageSquareWarning size={20} className="text-brick" />
              <h2 className="text-xl font-black">UX pain points</h2>
            </div>
            <AsyncState
              empty={!feedback.length}
              emptyMessage="No agent feedback logged yet."
            >
              <div className="mt-4 space-y-3">
                {feedback.slice(0, 8).map((item) => (
                  <article
                    className="rounded-md border border-pencil/15 bg-paper p-3"
                    key={item.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-brick/10 px-2 py-1 text-xs font-black uppercase text-brick">
                        {item.severity}
                      </span>
                      <span className="text-xs font-bold text-ink/50">
                        {item.source_type} · {item.page || "unknown page"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-ink/74">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </AsyncState>
          </section>
        </aside>

        <AsyncState loading={loading} error={null} empty={!simulation}>
          {simulation ? (
            <div className="space-y-6">
              <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                {Object.entries(simulation.metrics).map(([key, value]) => (
                  <div
                    className="rounded-md border border-pencil/15 bg-cream p-4"
                    key={key}
                  >
                    <p className="text-xs font-black uppercase text-ink/50">
                      {metricLabel(key)}
                    </p>
                    <p className="mt-2 text-2xl font-black">{value}</p>
                  </div>
                ))}
              </section>

              <section className="card">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-amber" />
                  <h2 className="text-xl font-black">Top coordinators</h2>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {simulation.top_coordinators.map((agent) => (
                    <div
                      className="rounded-md border border-pencil/15 bg-paper p-3"
                      key={agent.id}
                    >
                      <p className="font-black">{agent.display_name}</p>
                      <p className="mt-1 text-sm text-ink/60">
                        {metricLabel(agent.archetype)} · {agent.neighborhood}
                      </p>
                      <p className="mt-2 text-sm font-bold text-ink/72">
                        {agent.plans_created} plans · {agent.messages_sent} nudges ·{" "}
                        {agent.rsvps_sent} RSVPs
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="flex items-center gap-2">
                  <CalendarDays size={20} className="text-moss" />
                  <h2 className="text-xl font-black">Event log</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {simulation.events.map((event) => (
                    <article
                      className={`rounded-md border p-3 ${eventTone(
                        event.event_type,
                      )}`}
                      key={event.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black uppercase text-ink/55">
                          {event.sim_date} · {event.event_type.replaceAll("_", " ")}
                        </p>
                        <span className="rounded-md bg-paper/80 px-2 py-1 text-xs font-bold">
                          impact {event.impact_score}
                        </span>
                      </div>
                      <p className="mt-2 font-semibold text-ink/78">
                        {event.body}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="rounded-lg bg-cream p-8 shadow-soft">
              <UsersRound size={34} className="text-moss" />
              <h2 className="mt-5 text-2xl font-black">No live sim yet</h2>
              <p className="mt-3 leading-7 text-ink/72">
                Start one from the controls. It will persist locally and keep
                advancing from its current calendar date.
              </p>
            </div>
          )}
        </AsyncState>
      </div>
    </section>
  );
}
