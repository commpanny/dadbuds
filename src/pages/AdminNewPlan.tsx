import { Bot, Save, Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import FieldGroup from "../components/FieldGroup";
import { api, type AvailabilityWindow, type Message, type Plan } from "../lib/api";
import { interests, vibeOptions } from "../lib/options";

const defaultForm = {
  title: "",
  description: "",
  date: "",
  start_time: "",
  end_time: "",
  location: "",
  cost: "Free",
  kid_friendly: true,
  capacity: "",
  visibility: "public",
};

export default function AdminNewPlan() {
  const location = useLocation();
  const sourceItem = (location.state as { item?: AvailabilityWindow } | null)
    ?.item;
  const seeded = useMemo(() => {
    if (!sourceItem) return defaultForm;
    return {
      ...defaultForm,
      title: `${sourceItem.preferred_vibe} DadBuds hang`,
      description:
        sourceItem.notes ||
        `Low-pressure ${sourceItem.preferred_vibe.toLowerCase()} hang for dads who said they were free.`,
      date: sourceItem.date,
      start_time: sourceItem.start_time,
      end_time: sourceItem.end_time,
      kid_friendly: sourceItem.kid_status !== "Solo",
    };
  }, [sourceItem]);

  const [form, setForm] = useState(seeded);
  const [tags, setTags] = useState<string[]>(
    sourceItem ? [sourceItem.preferred_vibe] : [],
  );
  const [relatedInterests, setRelatedInterests] = useState<string[]>([]);
  const [savedPlan, setSavedPlan] = useState<Plan | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function savePlan(status: "draft" | "published") {
    setSaving(true);
    setError(null);
    try {
      const plan = await api.createPlan({
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        status,
        tags,
        related_interests: relatedInterests,
      });
      setSavedPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save plan.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await savePlan(form.visibility === "admin" ? "draft" : "published");
  }

  async function generateMessage() {
    setError(null);
    try {
      const plan = savedPlan ?? (await api.createPlan({
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: "draft",
        tags,
        related_interests: relatedInterests,
      }));
      setSavedPlan(plan);
      setMessage(await api.generateMessage(plan.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate message.",
      );
    }
  }

  return (
    <section className="section-shell py-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black">Create suggested plan</h1>
        <p className="mt-3 leading-7 text-ink/72">
          Make the manual version work first. Publishing makes the plan visible
          in the public feed.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="card grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="label">Title</span>
            <input
              required
              className="input"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="label">Description</span>
            <textarea
              required
              className="input min-h-32"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
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
                type="time"
                className="input"
                value={form.end_time}
                onChange={(event) =>
                  setForm({ ...form, end_time: event.target.value })
                }
              />
            </label>
          </div>
          <label className="space-y-2 sm:col-span-2">
            <span className="label">Location</span>
            <input
              required
              className="input"
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
            />
          </label>
          <label className="space-y-2">
            <span className="label">Cost</span>
            <input
              required
              className="input"
              value={form.cost}
              onChange={(event) => setForm({ ...form, cost: event.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="label">Capacity</span>
            <input
              type="number"
              min="1"
              className="input"
              value={form.capacity}
              onChange={(event) =>
                setForm({ ...form, capacity: event.target.value })
              }
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-pencil/15 bg-paper/60 p-3 text-sm font-bold">
            <input
              type="checkbox"
              className="h-4 w-4 accent-moss"
              checked={form.kid_friendly}
              onChange={(event) =>
                setForm({ ...form, kid_friendly: event.target.checked })
              }
            />
            Dad/kid friendly
          </label>
          <label className="space-y-2">
            <span className="label">Visibility</span>
            <select
              className="input"
              value={form.visibility}
              onChange={(event) =>
                setForm({ ...form, visibility: event.target.value })
              }
            >
              <option value="public">Public</option>
              <option value="signup_users">Signup users only</option>
              <option value="admin">Admin only draft</option>
            </select>
          </label>
        </div>

        <aside className="space-y-5">
          <div className="card space-y-5">
            <FieldGroup
              label="Vibe tags"
              values={vibeOptions}
              selected={tags}
              onChange={setTags}
            />
            <FieldGroup
              label="Related interests"
              values={interests}
              selected={relatedInterests}
              onChange={setRelatedInterests}
            />
          </div>
          <div className="card space-y-3">
            {error ? (
              <p className="rounded-md bg-brick/10 p-3 text-sm font-semibold text-brick">
                {error}
              </p>
            ) : null}
            {savedPlan ? (
              <p className="rounded-md bg-moss/10 p-3 text-sm font-semibold text-moss">
                Saved {savedPlan.title} as {savedPlan.status}.
              </p>
            ) : null}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={saving}
            >
              <Send size={18} />
              {saving ? "Saving..." : "Publish"}
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => void savePlan("draft")}
              disabled={saving}
            >
              <Save size={18} />
              Save draft
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => void generateMessage()}
            >
              <Bot size={18} />
              Generate message copy
            </button>
          </div>
          {message ? (
            <div className="card">
              <h2 className="text-xl font-black">Generated message</h2>
              <p className="mt-3 rounded-md bg-cream/70 p-3 text-sm leading-6">
                {message.body}
              </p>
              <Link className="btn-primary mt-4 w-full" to="/admin/messages">
                Open message log
              </Link>
            </div>
          ) : null}
        </aside>
      </form>
    </section>
  );
}
