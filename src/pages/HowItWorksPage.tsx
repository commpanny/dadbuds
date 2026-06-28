import { ArrowRight, MapPin, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  "DadBuds maintains a local calendar",
  "Set your status or RSVP",
  "Threads open for people who bookmark or attend",
  "Attend when the plan works for you",
];

const faqs = [
  {
    q: "Is this for work stuff?",
    a: "No. DadBuds is for local social plans, not networking or sales.",
  },
  {
    q: "Do I have to know people already?",
    a: "No. You can bookmark, attend, or stay out of a plan without explaining yourself.",
  },
  {
    q: "Does this cost money?",
    a: "The pilot is free. Get in the car.",
  },
  {
    q: "Can I be a dick?",
    a: "No. Don’t be a dick.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="bg-cream py-12">
        <div className="section-shell">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black">How it works</h1>
            <p className="mt-4 text-lg leading-8 text-ink/72">
              Plans start as source-backed ideas or recurring activities. Once
              they are concrete, they move to the Spokane calendar.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-lg border border-ink/10 bg-paper p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pencil text-sm font-black text-cream">
                  {index + 1}
                </span>
                <p className="mt-4 font-bold leading-6">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream py-14">
        <div className="section-shell">
          <div className="rounded-lg border border-moss/25 bg-moss/10 p-6">
            <div className="flex items-center gap-2 text-moss">
              <MapPin size={20} />
              <h2 className="text-xl font-black">Standing invite</h2>
            </div>
            <p className="mt-4 text-2xl font-black leading-tight">
              Upper Manito Playground
            </p>
            <p className="mt-2 text-lg font-bold text-ink/72">
              Sundays, 10:00 AM-noon
            </p>
            <p className="mt-4 max-w-2xl leading-7 text-ink/72">
              No signup required. This is the live, recurring DadBuds park hang:
              show up if it works and leave when you need to leave.
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
      </section>

      <section className="bg-paper py-14">
        <div className="section-shell max-w-3xl">
          <h2 className="text-3xl font-black">Spokane pilot</h2>
          <p className="mt-4 leading-7 text-ink/72">
            Spokane has plenty to do. DadBuds turns recurring activities, venue
            calendars, and local schedules into plans with dates, locations, and
            RSVP state.
          </p>
          <p className="mt-4 leading-7 text-ink/72">
            The pilot starts with one night activity per week and one
            kid-friendly park or playground session each weekend. Trivia, sports
            calendars, basketball, pickleball, and local events fill in the
            rest.
          </p>
        </div>
      </section>

      <section className="bg-paper py-14">
        <div className="section-shell">
          <h2 className="text-3xl font-black">FAQ</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg bg-cream p-5">
                <div className="flex items-center gap-2">
                  <UsersRound size={18} className="text-moss" />
                  <h3 className="font-black">{faq.q}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/70">
                  {faq.a}
                  {faq.q === "Can I be a dick?" ? (
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
