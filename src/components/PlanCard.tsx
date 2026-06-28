import {
  Bookmark,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Plan } from "../lib/api";
import { getLocalUserId } from "../lib/storage";

type PlanCardProps = {
  plan: Plan;
  onBookmark?: (plan: Plan) => void;
  onAttend?: (plan: Plan) => void;
  compact?: boolean;
};

function audienceClass(kidFriendly: boolean) {
  return kidFriendly
    ? "bg-moss/15 text-moss"
    : "bg-brick/10 text-brick";
}

function interestCopy(plan: Plan) {
  if (!plan.capacity) {
    return plan.rsvp_count
      ? `${plan.rsvp_count} attending`
      : "Open invite";
  }

  const remaining = Math.max(0, plan.capacity - plan.rsvp_count);
  if (!plan.rsvp_count) return `Room for ${plan.capacity}`;
  if (!remaining) return `${plan.rsvp_count} attending · full for now`;
  return `${plan.rsvp_count} attending · ${remaining} spots left`;
}

function isAttending(plan: Plan) {
  return plan.viewer_status === "going";
}

function isBookmarked(plan: Plan) {
  return ["bookmarked", "interested", "maybe"].includes(plan.viewer_status ?? "");
}

export default function PlanCard({
  plan,
  onBookmark,
  onAttend,
  compact,
}: PlanCardProps) {
  const localUserId = getLocalUserId();
  const showActions = (onBookmark || onAttend) && !compact;

  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-md bg-amber/15 px-2 py-1 text-xs font-bold text-amber">
          {plan.tags[0] ?? "Plan"}
        </span>
        <span
          className={`rounded-md px-2 py-1 text-xs font-bold ${audienceClass(
            plan.kid_friendly,
          )}`}
        >
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
          {plan.location_url ? (
            <a
              className="font-bold text-moss underline decoration-moss/30 underline-offset-4"
              href={plan.location_url}
              rel="noreferrer"
              target="_blank"
            >
              {plan.location}
            </a>
          ) : (
            <span>{plan.location}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <UsersRound size={17} className="text-moss" />
          <span>{interestCopy(plan)}</span>
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-sm font-bold text-ink">{plan.cost}</span>
        {showActions ? (
          <div className="flex flex-wrap gap-2">
            {localUserId && plan.thread_available ? (
              <Link className="btn-secondary" to={`/plans/${plan.id}/thread`}>
                <MessageCircle size={18} />
                Thread
              </Link>
            ) : null}
            {onBookmark && !isAttending(plan) ? (
              <button
                className="btn-secondary"
                onClick={() => onBookmark(plan)}
                type="button"
              >
                <Bookmark size={18} />
                {isBookmarked(plan) ? "Bookmarked" : "Bookmark"}
              </button>
            ) : null}
            {onAttend ? (
              <button
                className="btn-primary"
                onClick={() => onAttend(plan)}
                type="button"
              >
                <CheckCircle2 size={18} />
                {isAttending(plan) ? "Attending" : "Attend"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
