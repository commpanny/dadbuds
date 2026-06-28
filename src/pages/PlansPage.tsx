import {
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AsyncState from "../components/AsyncState";
import PlanCard from "../components/PlanCard";
import { api, type Plan } from "../lib/api";
import { getLocalEmail, getLocalUserId } from "../lib/storage";

type CalendarDay = {
  key: string;
  date: Date;
  inMonth: boolean;
  plans: Plan[];
};

function parsePlanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function monthInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function monthFromInput(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function buildMonth(
  plans: Plan[],
  selectedMonth: Date,
): { label: string; days: CalendarDay[] } {
  const sorted = [...plans].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1,
  );
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const plansByDate = new Map<string, Plan[]>();
  for (const plan of sorted) {
    const items = plansByDate.get(plan.date) ?? [];
    items.push(plan);
    plansByDate.set(plan.date, items);
  }

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      date,
      inMonth:
        date.getMonth() === selectedMonth.getMonth() &&
        date.getFullYear() === selectedMonth.getFullYear(),
      plans: plansByDate.get(key) ?? [],
    };
  });

  return {
    label: first.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
    days,
  };
}

function audiencePillClass(plan: Plan) {
  return plan.kid_friendly
    ? "border-moss/25 bg-moss/15 text-moss hover:bg-moss/20"
    : "border-brick/20 bg-brick/10 text-brick hover:bg-brick/20";
}

function isAttending(plan: Plan) {
  return plan.viewer_status === "going";
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);
  const [removalPlan, setRemovalPlan] = useState<Plan | null>(null);
  const [pendingAction, setPendingAction] = useState<"bookmarked" | "going">(
    "bookmarked",
  );
  const [view, setView] = useState<"cards" | "calendar">("cards");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [email, setEmail] = useState(getLocalEmail());
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPlans() {
    setLoading(true);
    setError(null);
    try {
      setPlans(await api.listPlans(false, getLocalUserId()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, []);

  useEffect(() => {
    if (!plans.length) return;
    setSelectedMonth((current) => {
      const currentValue = monthInputValue(current);
      const hasPlansThisMonth = plans.some((plan) =>
        plan.date.startsWith(currentValue),
      );
      if (hasPlansThisMonth) return current;
      const firstPlanDate = parsePlanDate(
        [...plans].sort((a, b) => a.date.localeCompare(b.date))[0].date,
      );
      return new Date(firstPlanDate.getFullYear(), firstPlanDate.getMonth(), 1);
    });
  }, [plans]);

  const month = useMemo(
    () => buildMonth(plans, selectedMonth),
    [plans, selectedMonth],
  );

  async function savePlanStatus(
    plan: Plan,
    nextStatus: "bookmarked" | "going",
    allowGuestSave = false,
  ) {
    if (nextStatus === "going" && isAttending(plan)) {
      setRemovalPlan(plan);
      return;
    }

    const localUserId = getLocalUserId();
    if (!localUserId && !allowGuestSave) {
      setSelectedPlan(plan);
      setPendingAction(nextStatus);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createRsvp(plan.id, {
        user_id: localUserId,
        email,
        name,
        status: nextStatus,
      });
      setNotice(
        nextStatus === "going"
          ? `You're attending ${plan.title}.`
          : `Bookmarked ${plan.title}.`,
      );
      setSelectedPlan(null);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function removePlanRsvp(plan: Plan) {
    const localUserId = getLocalUserId();
    setSaving(true);
    setError(null);
    try {
      await api.deleteRsvp(plan.id, {
        user_id: localUserId,
        email,
      });
      setNotice(`Removed RSVP for ${plan.title}.`);
      setRemovalPlan(null);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove RSVP.");
    } finally {
      setSaving(false);
    }
  }

  async function onGuestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;
    await savePlanStatus(selectedPlan, pendingAction, true);
  }

  return (
    <section className="section-shell py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black">Spokane calendar</h1>
          <p className="mt-3 leading-7 text-ink/72">
            Published plans with dates, times, RSVP state, and validated
            locations. Event ideas appear here after they become calendar
            items.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-ink/10 bg-paper p-1">
          <button
            className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-bold ${
              view === "cards" ? "bg-pencil text-cream" : "text-ink/70"
            }`}
            onClick={() => setView("cards")}
            type="button"
          >
            <LayoutGrid size={17} />
            Cards
          </button>
          <button
            className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-bold ${
              view === "calendar" ? "bg-pencil text-cream" : "text-ink/70"
            }`}
            onClick={() => setView("calendar")}
            type="button"
          >
            <CalendarDays size={17} />
            Month
          </button>
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
          emptyMessage="No calendar plans yet. Published plans will appear here."
        >
          {view === "cards" ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onAttend={(item) => void savePlanStatus(item, "going")}
                  onBookmark={(item) => void savePlanStatus(item, "bookmarked")}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-ink/10 bg-paper p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    aria-label="Previous month"
                    className="btn-ghost"
                    onClick={() =>
                      setSelectedMonth((current) => shiftMonth(current, -1))
                    }
                    type="button"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="min-w-44 text-2xl font-black">
                    {month.label}
                  </h2>
                  <button
                    aria-label="Next month"
                    className="btn-ghost"
                    onClick={() =>
                      setSelectedMonth((current) => shiftMonth(current, 1))
                    }
                    type="button"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <label className="ml-0 md:ml-2">
                    <span className="sr-only">Choose month</span>
                    <input
                      className="input min-h-10 w-40 bg-cream"
                      onChange={(event) =>
                        setSelectedMonth(monthFromInput(event.target.value))
                      }
                      type="month"
                      value={monthInputValue(selectedMonth)}
                    />
                  </label>
                </div>
                <span className="text-sm font-bold text-ink/60">
                  Hover for details. Click to open.
                </span>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-md border border-ink/10 bg-ink/10">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    className="bg-cream px-2 py-2 text-center text-xs font-black text-ink/60"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
                {month.days.map((day) => (
                  <div
                    className={`min-h-28 bg-cream p-2 ${
                      day.inMonth ? "" : "opacity-45"
                    }`}
                    key={day.key}
                  >
                    <p className="text-xs font-black text-ink/55">
                      {day.date.getDate()}
                    </p>
                    <div className="mt-2 space-y-1">
                      {day.plans.map((plan) => (
                        <div className="group/plan relative" key={plan.id}>
                          <button
                            className={`w-full rounded-md border px-2 py-1.5 text-left text-xs font-black leading-snug ${audiencePillClass(
                              plan,
                            )}`}
                            onClick={() => setDetailPlan(plan)}
                            type="button"
                          >
                            <span className="block text-[0.62rem] uppercase opacity-75">
                              {plan.start_time}
                            </span>
                            <span className="block truncate">{plan.title}</span>
                            <span className="block truncate text-[0.68rem] font-bold opacity-80">
                              {plan.location}
                            </span>
                          </button>
                          <div className="pointer-events-none absolute left-0 top-8 z-30 hidden w-80 group-hover/plan:block">
                            <div className="pointer-events-auto shadow-soft">
                              <PlanCard plan={plan} compact />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AsyncState>
      </div>

      {detailPlan ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-cream p-4 shadow-soft">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                aria-label="Close"
                className="btn-ghost"
                onClick={() => setDetailPlan(null)}
              >
                <X size={20} />
              </button>
            </div>
            <PlanCard plan={detailPlan} compact />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {!isAttending(detailPlan) ? (
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => {
                    const plan = detailPlan;
                    setDetailPlan(null);
                    void savePlanStatus(plan, "bookmarked");
                  }}
                  type="button"
                >
                  <Bookmark size={18} />
                  Bookmark
                </button>
              ) : null}
              <button
                className={`btn-primary w-full justify-center ${
                  isAttending(detailPlan) ? "sm:col-span-2" : ""
                }`}
                onClick={() => {
                  const plan = detailPlan;
                  setDetailPlan(null);
                  void savePlanStatus(plan, "going");
                }}
                type="button"
              >
                <CheckCircle2 size={18} />
                {isAttending(detailPlan) ? "Attending" : "Attend"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {removalPlan ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-cream p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-brick">Remove RSVP</p>
                <h2 className="mt-1 text-2xl font-black">
                  {removalPlan.title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="btn-ghost"
                onClick={() => setRemovalPlan(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-4 rounded-md bg-paper p-3 text-sm font-semibold leading-6 text-ink/70">
              Remove your RSVP? This will stop showing your attendance as
              confirmed and remove thread access unless you bookmark or attend
              again.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                className="btn-secondary w-full justify-center"
                disabled={saving}
                onClick={() => setRemovalPlan(null)}
                type="button"
              >
                Keep RSVP
              </button>
              <button
                className="btn-primary w-full justify-center"
                disabled={saving}
                onClick={() => void removePlanRsvp(removalPlan)}
                type="button"
              >
                {saving ? "Removing..." : "Yes, remove it"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedPlan ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4">
          <form
            onSubmit={onGuestSave}
            className="w-full max-w-md rounded-lg bg-cream p-6 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-moss">
                  {pendingAction === "going" ? "Attend" : "Bookmark"}
                </p>
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
              <p className="rounded-md bg-paper p-3 text-sm font-semibold leading-6 text-ink/70">
                {pendingAction === "going"
                  ? "Attend keeps the thread available through the event window."
                  : "Bookmark lets you follow the thread until the event starts. Attend later to keep access."}
              </p>
              <button className="btn-primary w-full" disabled={saving}>
                {pendingAction === "going" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Bookmark size={18} />
                )}
                {saving
                  ? "Saving..."
                  : pendingAction === "going"
                    ? "Attend"
                    : "Bookmark"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
