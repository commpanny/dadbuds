import { CheckCircle2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import AsyncState from "../components/AsyncState";
import PlanCard from "../components/PlanCard";
import { api, type Plan } from "../lib/api";
import { getLocalEmail, getLocalUserId } from "../lib/storage";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState(getLocalEmail());
  const [name, setName] = useState("");
  const [status, setStatus] = useState("interested");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPlans() {
    setLoading(true);
    setError(null);
    try {
      setPlans(await api.listPlans());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, []);

  async function onRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;

    setSaving(true);
    setError(null);
    try {
      await api.createRsvp(selectedPlan.id, {
        user_id: getLocalUserId(),
        email,
        name,
        status,
      });
      setNotice(`Saved ${status} for ${selectedPlan.title}.`);
      setSelectedPlan(null);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not RSVP.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section-shell py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black">Upcoming DadBuds plans</h1>
          <p className="mt-3 leading-7 text-ink/72">
            Public and pilot-visible hangs. Keep the ask small; make the yes
            easy.
          </p>
        </div>
      </div>

      {notice ? (
        <p className="mt-6 rounded-md bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">
          {notice}
        </p>
      ) : null}

      <div className="mt-8">
        <AsyncState
          loading={loading}
          error={error}
          empty={!plans.length}
          emptyMessage="No published plans yet. Check back after an admin publishes the first hang."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onInterested={setSelectedPlan}
              />
            ))}
          </div>
        </AsyncState>
      </div>

      {selectedPlan ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4">
          <form
            onSubmit={onRsvp}
            className="w-full max-w-md rounded-lg bg-cream p-6 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-moss">RSVP</p>
                <h2 className="mt-1 text-2xl font-black">
                  {selectedPlan.title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="btn-ghost"
                onClick={() => setSelectedPlan(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {!getLocalUserId() ? (
                <>
                  <label className="space-y-2">
                    <span className="label">Name</span>
                    <input
                      required
                      className="input"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="label">Email</span>
                    <input
                      required
                      type="email"
                      className="input"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                </>
              ) : null}
              <label className="space-y-2">
                <span className="label">Status</span>
                <select
                  className="input"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="interested">Interested</option>
                  <option value="going">Going</option>
                  <option value="maybe">Maybe</option>
                  <option value="declined">No thanks</option>
                </select>
              </label>
              <button className="btn-primary w-full" disabled={saving}>
                <CheckCircle2 size={18} />
                {saving ? "Saving..." : "Save RSVP"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
