import { ArrowRight, CheckCircle2, UsersRound } from "lucide-react";
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

      <section className="bg-paper py-14">
        <div className="section-shell grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-black">Spokane pilot</h2>
            <p className="mt-4 leading-7 text-ink/72">
              Spokane has plenty to do. DadBuds turns recurring activities,
              venue calendars, and local schedules into plans with dates,
              locations, and RSVP state.
            </p>
            <p className="mt-4 leading-7 text-ink/72">
              The pilot starts with one night activity per week and one
              kid-friendly park or playground session each weekend. Trivia,
              sports calendars, basketball, pickleball, and local events fill
              in the rest.
            </p>
            <div className="mt-6 grid gap-3 text-sm font-bold sm:grid-cols-3">
              <span className="rounded-md bg-cream px-3 py-3">Free pilot</span>
              <span className="rounded-md bg-cream px-3 py-3">10 plans</span>
              <span className="rounded-md bg-cream px-3 py-3">5 meetups</span>
            </div>
          </div>
          <div className="rounded-lg bg-pencil p-6 text-cream">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber">
              Core promise
            </p>
            <p className="mt-4 text-3xl font-black leading-tight">
              The plan needs a date, place, and thread.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sky py-14">
        <div className="section-shell grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <h2 className="text-3xl font-black">The pilot is free</h2>
            <p className="mt-3 max-w-2xl leading-7 text-ink/72">
              Join the Spokane pilot list. Get in the car.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <Link className="btn-primary" to="/join/signup">
              <CheckCircle2 size={18} />
              Join Spokane Pilot
            </Link>
            <Link className="btn-secondary" to="/">
              Back to DadBuds
              <ArrowRight size={18} />
            </Link>
          </div>
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
