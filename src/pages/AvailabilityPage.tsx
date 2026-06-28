import {
  Beer,
  Coffee,
  Gamepad2,
  Send,
  Shield,
  Trees,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AvailabilityWindow } from "../lib/api";
import { kidStatuses, vibeOptions } from "../lib/options";
import { getLocalEmail, getLocalUserId } from "../lib/storage";

type DadStatus = {
  label: string;
  description: string;
  icon: typeof Beer;
  start_time: string;
  end_time: string;
  kid_status: string;
  preferred_vibe: string;
};

function todayValue() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

const dadStatuses: DadStatus[] = [
  {
    label: "Available tonight",
    description: "Open to an evening plan if there is a clear time and place.",
    icon: Beer,
    start_time: "19:30",
    end_time: "21:30",
    kid_status: "Solo",
    preferred_vibe: "Casual",
  },
  {
    label: "Kid-friendly window",
    description: "Available for a park, playground, walk, or family-friendly plan.",
    icon: Trees,
    start_time: "10:00",
    end_time: "11:30",
    kid_status: "With kids",
    preferred_vibe: "Kid-friendly",
  },
  {
    label: "Coffee window",
    description: "Available for a shorter meetup earlier in the day.",
    icon: Coffee,
    start_time: "08:30",
    end_time: "10:00",
    kid_status: "Either",
    preferred_vibe: "Coffee",
  },
  {
    label: "Watching the game",
    description: "Open to joining a sports watch plan.",
    icon: Gamepad2,
    start_time: "18:00",
    end_time: "21:00",
    kid_status: "Solo",
    preferred_vibe: "Sports",
  },
  {
    label: "Not available",
    description: "Unavailable for plans, but still open to future notifications.",
    icon: Shield,
    start_time: "18:00",
    end_time: "18:30",
    kid_status: "Either",
    preferred_vibe: "Just notify me",
  },
];

const initialStatus = dadStatuses[0];

const initialForm = {
  date: todayValue(),
  start_time: initialStatus.start_time,
  end_time: initialStatus.end_time,
  kid_status: initialStatus.kid_status,
  preferred_vibe: initialStatus.preferred_vibe,
  notes: "",
  email: getLocalEmail(),
};

export default function AvailabilityPage() {
  const [selectedStatus, setSelectedStatus] = useState(initialStatus.label);
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState<AvailabilityWindow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function chooseStatus(status: DadStatus) {
    setSelectedStatus(status.label);
    setForm({
      ...form,
      start_time: status.start_time,
      end_time: status.end_time,
      kid_status: status.kid_status,
      preferred_vibe: status.preferred_vibe,
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const note = form.notes.trim();
      const availability = await api.createAvailability({
        ...form,
        user_id: getLocalUserId(),
        notes: note ? `${selectedStatus}: ${note}` : selectedStatus,
      });
      setCreated(availability);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
        <div className="mx-auto max-w-xl rounded-lg bg-cream p-8 shadow-soft">
          <h1 className="text-3xl font-black">Status posted.</h1>
          <p className="mt-3 leading-7 text-ink/72">
            This status helps with scheduling. It does not commit you to a plan.
          </p>
          <div className="mt-6 rounded-md bg-paper p-4 text-sm">
            <p className="font-bold">
              {created.notes || selectedStatus}
            </p>
            <p className="mt-1 text-ink/70">
              {created.date} · {created.start_time}-{created.end_time}
            </p>
            <p className="mt-1 text-ink/70">
              {created.kid_status} · {created.preferred_vibe}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" to="/plans">
              Spokane Calendar
            </Link>
            <Link className="btn-secondary" to="/me">
              Me
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-black">Set your status</h1>
        <p className="mt-3 leading-7 text-ink/72">
          Share your current availability. DadBuds can use it to match you with
          existing plans or identify overlap for future plans.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 max-w-4xl space-y-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dadStatuses.map((status) => {
            const Icon = status.icon;
            const selected = selectedStatus === status.label;
            return (
              <button
                className={`rounded-md border p-4 text-left transition ${
                  selected
                    ? "border-moss bg-moss/12 shadow-[2px_2px_0_rgba(78,117,87,0.25)]"
                    : "border-pencil/15 bg-cream hover:border-moss/40"
                }`}
                key={status.label}
                onClick={() => chooseStatus(status)}
                type="button"
              >
                <Icon size={22} className={selected ? "text-moss" : "text-ink/55"} />
                <p className="mt-3 font-black">{status.label}</p>
                <p className="mt-1 text-sm leading-6 text-ink/65">
                  {status.description}
                </p>
              </button>
            );
          })}
        </section>

        <div className="card grid gap-4 sm:grid-cols-2">
          {!getLocalUserId() ? (
            <label className="space-y-2 sm:col-span-2">
              <span className="label">Email</span>
              <input
                required
                type="email"
                className="input"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>
          ) : null}
          <label className="space-y-2">
            <span className="label">Applies to</span>
            <input
              required
              type="date"
              className="input"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="label">From</span>
              <input
                required
                type="time"
                className="input"
                value={form.start_time}
                onChange={(event) =>
                  setForm({ ...form, start_time: event.target.value })
                }
              />
            </label>
            <label className="space-y-2">
              <span className="label">Until</span>
              <input
                required
                type="time"
                className="input"
                value={form.end_time}
                onChange={(event) =>
                  setForm({ ...form, end_time: event.target.value })
                }
              />
            </label>
          </div>
          <label className="space-y-2">
            <span className="label">Kid situation</span>
            <select
              className="input"
              value={form.kid_status}
              onChange={(event) =>
                setForm({ ...form, kid_status: event.target.value })
              }
            >
              {kidStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Vibe</span>
            <select
              className="input"
              value={form.preferred_vibe}
              onChange={(event) =>
                setForm({ ...form, preferred_vibe: event.target.value })
              }
            >
              {vibeOptions.map((vibe) => (
                <option key={vibe}>{vibe}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="label">Optional note</span>
            <textarea
              className="input min-h-24"
              placeholder="Neighborhood, constraints, kid situation, or other useful context."
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-md bg-brick/10 p-3 text-sm font-semibold text-brick">
            {error}
          </p>
        ) : null}
        <button className="btn-primary" disabled={saving}>
          <Send size={18} />
          {saving ? "Posting..." : "Post status"}
        </button>
      </form>
    </section>
  );
}
