import { CalendarDays, CheckCircle2, MapPin, UsersRound } from "lucide-react";
import type { Plan } from "../lib/api";

type PlanCardProps = {
  plan: Plan;
  onInterested?: (plan: Plan) => void;
  compact?: boolean;
};

export default function PlanCard({ plan, onInterested, compact }: PlanCardProps) {
  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-md bg-amber/15 px-2 py-1 text-xs font-bold text-amber">
          {plan.tags[0] ?? "Low-key hang"}
        </span>
        <span className="rounded-md bg-sky px-2 py-1 text-xs font-bold text-ink">
          {plan.kid_friendly ? "Dad/kid friendly" : "Dads only"}
        </span>
      </div>
      <div>
        <h3 className="text-xl font-black">{plan.title}</h3>
        <p className="mt-2 text-sm leading-6 text-ink/72">{plan.description}</p>
      </div>
      <dl className="grid gap-3 text-sm text-ink/75">
        <div className="flex items-center gap-2">
          <CalendarDays size={17} className="text-moss" />
          <span>
            {plan.date} · {plan.start_time}
            {plan.end_time ? `-${plan.end_time}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={17} className="text-moss" />
          <span>{plan.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <UsersRound size={17} className="text-moss" />
          <span>
            {plan.rsvp_count} interested
            {plan.capacity ? ` · ${plan.capacity} spots` : ""}
          </span>
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-sm font-bold text-ink">{plan.cost}</span>
        {onInterested && !compact ? (
          <button className="btn-primary" onClick={() => onInterested(plan)}>
            <CheckCircle2 size={18} />
            I’m interested
          </button>
        ) : null}
      </div>
    </article>
  );
}
