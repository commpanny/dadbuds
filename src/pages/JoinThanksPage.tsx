import { CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

const availabilityOptions = [
  "Weekday evening",
  "Saturday morning",
  "Saturday afternoon/evening",
  "Sunday morning",
  "Sunday afternoon",
];

const planPreferenceOptions = [
  "Dad-only plans",
  "Dad-and-kid plans",
  "Either",
];

function isLocalHost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function getNextSaturdayLabel(date = new Date()) {
  const saturday = 6;
  const daysUntilSaturday = (saturday - date.getDay() + 7) % 7;
  const nextSaturday = new Date(date);
  nextSaturday.setDate(date.getDate() + daysUntilSaturday);

  return nextSaturday.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function JoinThanksPage() {
  const [saved, setSaved] = useState(false);
  const nextSaturdayLabel = getNextSaturdayLabel();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isLocalHost()) return;
    event.preventDefault();
    setSaved(true);
  }

  return (
    <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
      <div className="mx-auto max-w-2xl rounded-lg bg-cream p-8 shadow-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-moss/12 text-moss">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-black">You’re on the list.</h1>
        <p className="mt-3 leading-7 text-ink/72">
          DadBuds will send Spokane pilot updates and local event invites.
        </p>
        <div className="mt-8 rounded-md border border-moss/20 bg-moss/10 p-4">
          <p className="font-black">Upper Manito Playground</p>
          <p className="mt-1 text-sm font-bold text-ink/70">
            {nextSaturdayLabel}, 11:00 AM. No signup required.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-pencil/15 bg-paper p-5">
          <h2 className="text-2xl font-black">Help us find your first plan</h2>
          <p className="mt-2 text-sm leading-6 text-ink/68">
            Optional. This helps us send the first invite that might actually
            work.
          </p>

          {saved ? (
            <p className="mt-5 rounded-md bg-moss/12 p-3 text-sm font-black text-moss">
              Got it.
            </p>
          ) : (
            <form
              action="/join/thanks"
              className="mt-5 space-y-5"
              data-netlify="true"
              method="POST"
              name="dadbuds-first-plan"
              onSubmit={onSubmit}
            >
              <input
                name="form-name"
                type="hidden"
                value="dadbuds-first-plan"
              />
              <input
                name="source_url"
                type="hidden"
                value={window.location.href}
              />

              <fieldset>
                <legend className="text-sm font-black">
                  When are you most likely to show up?
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {availabilityOptions.map((option) => (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-pencil/15 bg-cream p-3 text-sm font-bold"
                      key={option}
                    >
                      <input
                        className="mt-1 h-4 w-4 accent-moss"
                        name="availability_preference"
                        type="radio"
                        value={option}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-black">
                  Usually looking for
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {planPreferenceOptions.map((option) => (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-pencil/15 bg-cream p-3 text-sm font-bold"
                      key={option}
                    >
                      <input
                        className="mt-1 h-4 w-4 accent-moss"
                        name="plan_preference"
                        type="radio"
                        value={option}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block space-y-2">
                <span className="label">Phone for first invite</span>
                <input
                  autoComplete="tel"
                  className="input bg-cream"
                  name="phone"
                  placeholder="Optional"
                  type="tel"
                />
              </label>

              <button className="btn-primary" type="submit">
                Save preferences
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="btn-primary" to="/join">
            Back to landing
          </Link>
        </div>
      </div>
    </section>
  );
}
