import { CheckCircle2, PlusCircle, Rows3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncState from "../components/AsyncState";
import { api, type AvailabilityWindow } from "../lib/api";

export default function AdminAvailability() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.listAvailability());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load availability.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function mark(id: number, status: string) {
    try {
      await api.updateAvailabilityStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  return (
    <section className="section-shell py-10">
      <h1 className="text-4xl font-black">Availability requests</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/72">
        Turn real windows into suggested plans, match them to existing plans, or
        mark them handled.
      </p>

      <div className="mt-8">
        <AsyncState loading={loading} error={error} empty={!items.length}>
          <div className="grid gap-4">
            {items.map((item) => (
              <article key={item.id} className="card">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">
                        {item.date} · {item.start_time}-{item.end_time}
                      </h2>
                      <span className="rounded-md bg-paper px-2 py-1 text-xs font-bold">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ink/70">
                      {item.user_name || item.user_email || "Unknown dad"} ·{" "}
                      {item.kid_status} · {item.preferred_vibe}
                    </p>
                    {item.notes ? (
                      <p className="mt-3 text-sm leading-6 text-ink/75">
                        {item.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-primary"
                      onClick={() =>
                        navigate("/admin/plans/new", { state: { item } })
                      }
                    >
                      <PlusCircle size={18} />
                      Create plan from this
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => void mark(item.id, "matched")}
                    >
                      <Rows3 size={18} />
                      Match to existing plan
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => void mark(item.id, "handled")}
                    >
                      <CheckCircle2 size={18} />
                      Mark handled
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AsyncState>
      </div>
    </section>
  );
}

