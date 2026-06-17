import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlanCard from "../components/PlanCard";

const examplePlans = [
  {
    id: 1,
    title: "Spokane Indians Game",
    description:
      "Low-pressure baseball hang. Show up, grab a beer, talk when you feel like it.",
    date: "Saturday",
    start_time: "5:00 PM",
    end_time: "",
    location: "Avista Stadium",
    cost: "$12-20",
    kid_friendly: true,
    capacity: 8,
    status: "published",
    visibility: "public",
    tags: ["Sports", "Low-key"],
    related_interests: ["Sports", "Breweries"],
    rsvp_count: 3,
    created_at: "",
  },
  {
    id: 2,
    title: "Saturday Morning Coffee",
    description:
      "Easy caffeine window before the weekend errands start multiplying.",
    date: "Saturday",
    start_time: "9:30 AM",
    end_time: "",
    location: "Indaba Coffee",
    cost: "$5-10",
    kid_friendly: false,
    capacity: 6,
    status: "published",
    visibility: "public",
    tags: ["Coffee", "Small group"],
    related_interests: ["Coffee", "Low-key hangouts"],
    rsvp_count: 2,
    created_at: "",
  },
  {
    id: 3,
    title: "Manito Park Loop",
    description:
      "Bring kids or don’t. Walk, talk, bail early if bedtime politics demand it.",
    date: "Sunday",
    start_time: "10:00 AM",
    end_time: "",
    location: "Manito Park",
    cost: "Free",
    kid_friendly: true,
    capacity: null,
    status: "published",
    visibility: "public",
    tags: ["Outdoors", "Dad/kid"],
    related_interests: ["Outdoors", "Dad/kid activities"],
    rsvp_count: 4,
    created_at: "",
  },
];

const steps = [
  "Tell DadBuds when you’re free",
  "DadBuds finds a local hang or creates one",
  "DadBuds rallies the group",
  "You show up if it works",
];

const taglines = [
  "Where you’ll actually get that beer.",
  'No more "can I get your number dude?"',
  "The end of “we should hang sometime.”",
  "Nobody wants to text 12 people.",
  "The answer to girls’ weekend.",
  "Sometimes kid-friendly. Sometimes.",
];

const faqs = [
  {
    q: "Is this for work stuff?",
    a: "No. It is for normal hangs, not elevator pitches.",
  },
  {
    q: "Do I have to know people already?",
    a: "No. DadBuds can keep it small, local, and low-pressure.",
  },
  {
    q: "Is SMS live yet?",
    a: "Not yet. The MVP logs fake sends first, then Twilio can be added.",
  },
];

export default function HomePage() {
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTaglineIndex((current) => (current + 1) % taglines.length);
    }, 20000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-cream">
        <div className="section-shell relative grid min-h-[calc(100vh-4rem)] items-center gap-10 py-14 md:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md bg-moss/12 px-3 py-2 text-sm font-bold text-moss">
              <Sparkles size={17} />
              Spokane pilot
            </div>
            <h1 className="text-5xl font-black leading-[1.02] tracking-normal text-ink sm:text-6xl lg:text-7xl">
              DadBuds
            </h1>
            <p
              aria-live="polite"
              className="mt-4 min-h-[4rem] text-2xl font-black leading-tight text-brick transition-opacity sm:min-h-[2.5rem]"
            >
              {taglines[taglineIndex]}
            </p>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink/75">
              DadBuds helps busy dads make actual plans with actual people. Tell
              us when you’re free. We’ll find local stuff, rally the buds, track
              interest, and remind everyone.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" to="/signup">
                Join Spokane Pilot
                <ArrowRight size={18} />
              </Link>
              <a className="btn-secondary" href="#how-it-works">
                See how it works
              </a>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src="/dadbuds-logo.png"
              alt="DadBuds logo"
              className="aspect-square w-full max-w-md rounded-lg border border-ink/10 bg-cream object-contain p-4 shadow-soft"
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-cream py-16">
        <div className="section-shell">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black">How it works</h2>
            <p className="mt-3 text-ink/70">
              Nobody wants to be the cruise director. DadBuds handles the first
              awkward move.
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

      <section className="bg-paper py-16">
        <div className="section-shell grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-black">Spokane pilot</h2>
            <p className="mt-4 leading-7 text-ink/72">
              Spokane has plenty to do. The hard part is knowing what’s worth
              doing and who’s actually in.
            </p>
            <p className="mt-4 leading-7 text-ink/72">
              DadBuds is starting here because it’s the perfect middle ground:
              enough events, enough dads, not enough social infrastructure.
            </p>
            <div className="mt-6 grid gap-3 text-sm font-bold sm:grid-cols-3">
              <span className="rounded-md bg-cream px-3 py-3">25 users</span>
              <span className="rounded-md bg-cream px-3 py-3">10 plans</span>
              <span className="rounded-md bg-cream px-3 py-3">5 meetups</span>
            </div>
          </div>
          <div className="rounded-lg bg-pencil p-6 text-cream">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber">
              Core promise
            </p>
            <p className="mt-4 text-3xl font-black leading-tight">
              The end of “we should hang sometime.”
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="section-shell">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black">Example plan cards</h2>
              <p className="mt-3 text-ink/70">
                Simple, specific, and easy to say yes, maybe, or no to.
              </p>
            </div>
            <Link className="btn-secondary" to="/plans">
              View plan feed
              <CalendarCheck size={18} />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {examplePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sky py-16">
        <div className="section-shell grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <h2 className="text-3xl font-black">Join the first 25 dads</h2>
            <p className="mt-3 max-w-2xl leading-7 text-ink/72">
              Sign up, tell DadBuds what works, and get looped into low-pressure
              Spokane hangs without needing to become the group chat adult.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <Link className="btn-primary" to="/signup">
              <CheckCircle2 size={18} />
              Join Spokane Pilot
            </Link>
            <a className="btn-secondary" href="https://discord.com">
              <MessageCircle size={18} />
              Discord
            </a>
          </div>
        </div>
      </section>

      <section className="bg-paper py-16">
        <div className="section-shell">
          <h2 className="text-3xl font-black">FAQ</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg bg-cream p-5">
                <div className="flex items-center gap-2">
                  <UsersRound size={18} className="text-moss" />
                  <h3 className="font-black">{faq.q}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
