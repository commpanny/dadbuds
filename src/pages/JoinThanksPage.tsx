import { CalendarDays, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function JoinThanksPage() {
  return (
    <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
      <div className="mx-auto max-w-2xl rounded-lg bg-cream p-8 shadow-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-moss/12 text-moss">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-black">You’re on the list.</h1>
        <p className="mt-3 leading-7 text-ink/72">
          DadBuds will use this for Spokane pilot updates and local event
          invites.
        </p>
        <div className="mt-8 rounded-md border border-moss/20 bg-moss/10 p-4">
          <p className="font-black">Upper Manito Playground</p>
          <p className="mt-1 text-sm font-bold text-ink/70">
            Sundays, 10:00 AM-noon. No signup required.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="btn-primary" to="/plans">
            Spokane calendar
            <CalendarDays size={18} />
          </Link>
          <Link className="btn-secondary" to="/join">
            Back to landing
          </Link>
        </div>
      </div>
    </section>
  );
}
