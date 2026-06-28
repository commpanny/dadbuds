import { MessageCircle, Send, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import FieldGroup from "../components/FieldGroup";
import { api, type User } from "../lib/api";
import {
  availabilityOptions,
  comfortLevels,
  interests,
} from "../lib/options";
import { saveLocalUser } from "../lib/storage";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  neighborhood: "",
  age_range: "",
  kids_age_range: "",
  discord_username: "",
  comfort_level: comfortLevels[1],
  sms_opt_in: false,
  standard_acknowledged: false,
};

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(
    [],
  );
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [recoveredExisting, setRecoveredExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const user = await api.createUser({
        ...form,
        interests: selectedInterests,
        typical_availability: selectedAvailability,
      });
      saveLocalUser(user.id, user.email);
      setCreatedUser(user);
      setRecoveredExisting(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed.";
      if (message.includes("already exists") && form.email.trim()) {
        try {
          const user = await api.findUserByEmail(form.email.trim());
          saveLocalUser(user.id, user.email);
          setCreatedUser(user);
          setRecoveredExisting(true);
          return;
        } catch {
          setError(message);
        }
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (createdUser) {
    return (
      <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
        <div className="mx-auto max-w-2xl rounded-lg bg-cream p-8 shadow-soft">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-moss/12 text-moss">
            <UserRound size={28} />
          </div>
          <h1 className="mt-6 text-3xl font-black">
            {recoveredExisting
              ? `Welcome back, ${createdUser.name}.`
              : `You’re in, ${createdUser.name}.`}
          </h1>
          <p className="mt-3 leading-7 text-ink/72">
            {recoveredExisting
              ? "DadBuds found your existing Spokane pilot profile and reconnected this browser."
              : "DadBuds saved your Spokane pilot profile. Next best move: tell us the first window that might work."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" to="/free">
              <Send size={18} />
              Set status
            </Link>
            <a
              className="btn-secondary"
              href="https://discord.gg/qWEp9bTd"
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle size={18} />
              Link Discord
            </a>
            <Link className="btn-ghost" to="/me">
              View profile
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black">Join Spokane Pilot</h1>
        <p className="mt-3 leading-7 text-ink/72">
          Build a lightweight profile so DadBuds can suggest plans that match
          your actual life.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-5">
          <div className="card grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="label">Name</span>
              <input
                required
                className="input"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label className="space-y-2">
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
            <label className="space-y-2">
              <span className="label">Phone</span>
              <input
                required
                type="tel"
                className="input"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </label>
            <label className="space-y-2">
              <span className="label">Neighborhood</span>
              <input
                required
                className="input"
                placeholder="South Hill, Garland, Perry..."
                value={form.neighborhood}
                onChange={(event) =>
                  setForm({ ...form, neighborhood: event.target.value })
                }
              />
            </label>
            <label className="space-y-2">
              <span className="label">Age range</span>
              <select
                required
                className="input"
                value={form.age_range}
                onChange={(event) =>
                  setForm({ ...form, age_range: event.target.value })
                }
              >
                <option value="">Select</option>
                <option>25-34</option>
                <option>35-44</option>
                <option>45-54</option>
                <option>55+</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="label">Kids age range</span>
              <select
                required
                className="input"
                value={form.kids_age_range}
                onChange={(event) =>
                  setForm({ ...form, kids_age_range: event.target.value })
                }
              >
                <option value="">Select</option>
                <option>Baby/toddler</option>
                <option>Elementary</option>
                <option>Middle school</option>
                <option>High school</option>
                <option>Mixed ages</option>
              </select>
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="label">Discord username optional</span>
              <input
                className="input"
                placeholder="dadbud#1234"
                value={form.discord_username}
                onChange={(event) =>
                  setForm({ ...form, discord_username: event.target.value })
                }
              />
            </label>
          </div>

          <div className="card space-y-5">
            <FieldGroup
              label="Interests"
              values={interests}
              selected={selectedInterests}
              onChange={setSelectedInterests}
            />
            <FieldGroup
              label="Typical availability"
              values={availabilityOptions}
              selected={selectedAvailability}
              onChange={setSelectedAvailability}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="card space-y-4">
            <label className="space-y-2">
              <span className="label">Comfort level</span>
              <select
                className="input"
                value={form.comfort_level}
                onChange={(event) =>
                  setForm({ ...form, comfort_level: event.target.value })
                }
              >
                {comfortLevels.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-ink/15 bg-paper p-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-moss"
                checked={form.sms_opt_in}
                onChange={(event) =>
                  setForm({ ...form, sms_opt_in: event.target.checked })
                }
              />
              <span>
                <strong>Optional SMS pilot consent</strong>
                <span className="block pt-1 text-ink/65">
                  I agree DadBuds may text me about Spokane pilot plans,
                  RSVPs, and follow-ups. Consent is optional and not required to
                  join. Message and data rates may apply. Reply STOP to opt out
                  after real SMS is enabled. For now this records consent only;
                  no real Twilio sends happen yet.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-moss/25 bg-moss/10 p-3 text-sm">
              <input
                required
                type="checkbox"
                className="mt-1 h-4 w-4 accent-moss"
                checked={form.standard_acknowledged}
                onChange={(event) =>
                  setForm({
                    ...form,
                    standard_acknowledged: event.target.checked,
                  })
                }
              />
              <span>
                <strong className="inline-flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Don’t Be a Dick
                </strong>
                <span className="block pt-1 text-ink/65">
                  Keep DadBuds practical, welcoming, and respectful. No
                  harassment, pickup-artist behavior, bigotry, culture-war bait,
                  or attempts to dominate the group.
                </span>
                <Link className="mt-2 block font-bold underline" to="/standard">
                  Read the community standard
                </Link>
              </span>
            </label>
            <p className="text-xs leading-5 text-ink/55">
              By creating a profile, you agree to the DadBuds pilot{" "}
              <Link className="font-bold underline" to="/terms">
                terms
              </Link>{" "}
              and acknowledge the{" "}
              <Link className="font-bold underline" to="/privacy">
                privacy notice
              </Link>
              .
            </p>
            {error ? (
              <p className="rounded-md bg-brick/10 p-3 text-sm font-semibold text-brick">
                {error}
              </p>
            ) : null}
            <button className="btn-primary w-full" disabled={saving}>
              <Send size={18} />
              {saving ? "Saving..." : "Create profile"}
            </button>
          </div>
        </aside>
      </form>
    </section>
  );
}
