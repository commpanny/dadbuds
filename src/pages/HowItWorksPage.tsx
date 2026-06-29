import { ArrowRight, MapPin, Plus, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { crewPreviews } from "../lib/crews";

const steps = [
  {
    title: "Pick your crews",
    body: "Choose the kinds of plans, events, and people you’d actually leave the house for.",
  },
  {
    title: "DadBuds finds the opening",
    body: "When there is a relevant Spokane event—or enough local interest—DadBuds surfaces an opportunity.",
  },
  {
    title: "DadBuds makes the ask",
    body: "DadBuds will invite your crews to relevant events.",
  },
  {
    title: "RSVP when it works",
    body: "Join when the date works, skip it when it doesn’t, and stay connected to the crew either way.",
  },
];

const featuredCrews = crewPreviews;

const faqs = [
  {
    q: "Is this for work stuff?",
    a: "No. DadBuds is for making plans, not business.",
  },
  {
    q: "Do I have to know anyone already?",
    a: "No. That is the point. Pick a crew, show up to something that works, and DadBuds handles the awkward first introduction.",
  },
  {
    q: "Am I signing up for a bunch of group chats?",
    a: "No. Crews organize interests, plans, and local opportunities. You control what you join, follow, mute, or skip.",
  },
  {
    q: "Do I have to explain why I can’t go?",
    a: "No. RSVP, skip, leave, or change your mind without making it weird.",
  },
  {
    q: "Does this cost money?",
    a: "The Spokane pilot is free.",
  },
  {
    q: "What’s the vibe?",
    a: "No politics, religious debates, alpha bullshit, sales pitches, or social ranking. Don’t be a dick.",
  },
];

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

export default function HowItWorksPage() {
  const nextSaturdayLabel = getNextSaturdayLabel();

  return (
    <div>
      <section className="bg-cream py-12">
        <div className="section-shell">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black">How it works</h1>
            <p className="mt-4 text-lg leading-8 text-ink/72">
              Pick a few crews you’d actually show up for. DadBuds watches for
              relevant local events, rallies interested dads, and handles the
              awkward first ask.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-lg border border-ink/10 bg-paper p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pencil text-sm font-black text-cream">
                  {index + 1}
                </span>
                <h2 className="mt-4 font-black leading-6">{step.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/72">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-14" id="pilot-crews">
        <div className="section-shell">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="space-y-5 lg:sticky lg:top-24">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-cream px-3 py-2 text-sm font-bold text-moss">
                  <UsersRound size={17} />
                  Find your crew(s)
                </div>
                <h2 className="mt-4 text-3xl font-black">Pilot crews</h2>
                <p className="mt-4 leading-7 text-ink/78">
                  Crews are ongoing interest groups that give relevant plans,
                  events, and conversations somewhere to land.
                </p>
                <p className="mt-4 leading-7 text-ink/78">
                  Join the ones that sound like you. You can add, remove, or
                  change crews whenever you want, and joining a crew never means
                  you have to attend everything.
                </p>
                <p className="mt-4 text-sm font-bold leading-6 text-moss">
                  Start with up to 6 during signup. You can add, remove, or edit
                  crews afterward.
                </p>
              </div>

              <div className="rounded-lg border border-moss/25 bg-moss/10 p-6">
                <div className="flex items-center gap-2 text-moss">
                  <MapPin size={20} />
                  <h2 className="text-xl font-black">Show up this Saturday</h2>
                </div>
                <p className="mt-4 text-2xl font-black leading-tight">
                  Upper Manito Playground
                </p>
                <p className="mt-2 text-lg font-bold text-ink/78">
                  {nextSaturdayLabel}
                </p>
                <p className="mt-1 text-lg font-bold text-ink/78">11:00 AM</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase text-moss">
                  <span className="rounded-sm bg-cream px-2 py-1">
                    Dad + kid friendly
                  </span>
                  <span className="rounded-sm bg-cream px-2 py-1">
                    Drop in anytime
                  </span>
                  <span className="rounded-sm bg-cream px-2 py-1">
                    No signup required
                  </span>
                </div>
                <p className="mt-4 leading-7 text-ink/78">
                  No signup required. Show up if it works and leave when you
                  need to.
                </p>
                <p className="mt-2 text-sm font-bold text-ink/62">
                  Repeats every Saturday
                </p>
                <a
                  className="btn-secondary mt-5 inline-flex"
                  href="https://www.google.com/maps/search/?api=1&query=Upper+Manito+Playground+Spokane+WA"
                  rel="noreferrer"
                  target="_blank"
                >
                  Open map
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>

            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featuredCrews.map((crew) => (
                  <Link
                    className="block min-h-28 rounded-lg border border-pencil/15 bg-cream p-4 transition hover:border-moss hover:bg-sticky focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 focus:ring-offset-paper"
                    key={crew.id}
                    to={`/join/signup?crew=${crew.id}`}
                  >
                    <h3 className="font-black">{crew.name}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-ink/78">
                      {crew.description}
                    </p>
                  </Link>
                ))}
                <div className="rounded-lg border border-dashed border-pencil/30 bg-paper/70 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <Plus size={18} className="text-moss" />
                    <h3 className="font-black">Suggest a crew</h3>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/78">
                    Missing your thing? Add it in the crew suggestion field when
                    you join. If enough dads name the same idea, it can become a
                    pilot crew.
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-lg border border-pencil/15 bg-cream p-5">
                <p className="text-lg font-black">
                  Found a few that sound like you?
                </p>
                <Link className="btn-primary mt-4" to="/join/signup">
                  Join the Spokane pilot
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper py-14">
        <div className="section-shell">
          <h2 className="text-3xl font-black">FAQ</h2>
          <div className="mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg bg-cream p-5">
                <div className="flex items-center gap-2">
                  <UsersRound size={18} className="text-moss" />
                  <h3 className="font-black">{faq.q}</h3>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-ink/78">
                  {faq.a}
                  {faq.q === "What’s the vibe?" ? (
                    <>
                      {" "}
                      <Link className="font-bold underline" to="/standard">
                        Read the policy.
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
