import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AvailabilityWindow } from "../lib/api";
import { kidStatuses, vibeOptions } from "../lib/options";
import { getLocalEmail, getLocalUserId } from "../lib/storage";

const initialForm = {
  date: "",
  start_time: "",
  end_time: "",
  kid_status: kidStatuses[2],
  preferred_vibe: vibeOptions[0],
  notes: "",
  email: getLocalEmail(),
};

export default function AvailabilityPage() {
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState<AvailabilityWindow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const availability = await api.createAvailability({
        ...form,
        user_id: getLocalUserId(),
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
          <h1 className="text-3xl font-black">Nice.</h1>
          <p className="mt-3 leading-7 text-ink/72">
            DadBuds will look for a low-pressure plan.
          </p>
          <div className="mt-6 rounded-md bg-paper p-4 text-sm">
            <p className="font-bold">
              {created.date} · {created.start_time}-{created.end_time}
            </p>
            <p className="mt-1 text-ink/70">
              {created.kid_status} · {created.preferred_vibe}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" to="/plans">
              See plan feed
            </Link>
            <Link className="btn-secondary" to="/me">
              View dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-black">When are you free?</h1>
        <p className="mt-3 leading-7 text-ink/72">
          Give DadBuds a window. Admins can turn it into a suggested hang or
          match it to an existing plan.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 max-w-2xl space-y-5">
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
            <span className="label">Date</span>
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
              <span className="label">Start</span>
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
              <span className="label">End</span>
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
            <span className="label">Preferred vibe</span>
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
            <span className="label">Notes</span>
            <textarea
              className="input min-h-28"
              placeholder="Solo this time, kid nap window, near North Spokane..."
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
          {saving ? "Submitting..." : "Submit availability"}
        </button>
      </form>
    </section>
  );
}
