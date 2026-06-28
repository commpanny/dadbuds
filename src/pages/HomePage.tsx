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
    title: "Pickleball Rotation",
    description:
      "Casual doubles rotating between Comstock, Wunderground, and Coeur d'Alene Park.",
    date: "Rotating Saturdays",
    start_time: "9:00 AM",
    end_time: "",
    location: "Comstock / Wunderground / Coeur d'Alene Park",
    cost: "Free",
    kid_friendly: false,
    capacity: 8,
    status: "published",
    visibility: "public",
    tags: ["Fitness", "Sports"],
    related_interests: ["Fitness", "Sports", "Casual meetups"],
    rsvp_count: 3,
    viewer_status: null,
    thread_available: false,
    created_at: "",
  },
  {
    id: 2,
    title: "Trivia",
    description:
      "Wednesday trivia at Brick West with a limited table size and clear end time.",
    date: "Wednesdays",
    start_time: "7:30 PM",
    end_time: "",
    location: "Brick West Brewing",
    location_url:
      "https://www.google.com/maps/search/?api=1&query=Brick+West+Brewing+Spokane+WA",
    cost: "$8-20",
    kid_friendly: false,
    capacity: 8,
    status: "published",
    visibility: "public",
    tags: ["Trivia", "Breweries"],
    related_interests: ["Trivia", "Breweries", "Casual meetups"],
    rsvp_count: 4,
    viewer_status: null,
    thread_available: false,
    created_at: "",
  },
  {
    id: 3,
    title: "Kid-Friendly Sunday Rotation",
    description:
      "Manito, Jefferson, Ice Age, and Southside Aquatics during summer months.",
    date: "Rotating Sundays",
    start_time: "10:00 AM",
    end_time: "",
    location: "Manito / Jefferson / Ice Age / Southside Aquatics",
    cost: "Free or admission",
    kid_friendly: true,
    capacity: null,
    status: "published",
    visibility: "public",
    tags: ["Outdoors", "Dad/kid"],
    related_interests: ["Outdoors", "Dad/kid activities"],
    rsvp_count: 4,
    viewer_status: null,
    thread_available: false,
    created_at: "",
  },
  {
    id: 4,
    title: "3-on-3 Basketball Rotation",
    description:
      "Half-court run rotating between Thornton Murphy Park, Comstock Park, and Hooptown USA.",
    date: "Rotating Fridays",
    start_time: "6:30 PM",
    end_time: "",
    location: "Thornton Murphy / Comstock / Hooptown USA",
    cost: "Free",
    kid_friendly: false,
    capacity: 12,
    status: "published",
    visibility: "public",
    tags: ["Sports", "Fitness"],
    related_interests: ["Sports", "Fitness", "Casual meetups"],
    rsvp_count: 5,
    viewer_status: null,
    thread_available: false,
    created_at: "",
  },
];

const steps = [
  "DadBuds maintains a local calendar",
  "Set your status or RSVP",
  "Threads open for people who bookmark or attend",
  "Attend when the plan works for you",
];

const taglines = [
  "Where you'll actually get that beer.",
  'No more "can I get your number dude?"',
  "The end of “we should hang sometime.”",
  "Nobody wants to text 12 people.",
  "The answer to girls’ weekend.",
  "Sometimes kid-friendly. Sometimes.",
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

type HomePageProps = {
  joinPath?: string;
};

export default function HomePage({ joinPath = "/join/signup" }: HomePageProps) {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const fullAppEnabled =
    import.meta.env.DEV ||
    import.meta.env.VITE_SHADOW_MODE === "true" ||
    import.meta.env.VITE_FULL_APP === "true";

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
              <Link className="btn-primary" to={joinPath}>
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

      <section className="bg-paper py-16">
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

      {fullAppEnabled ? (
        <section className="bg-cream py-16">
          <div className="section-shell">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-black">Plan rhythm</h2>
                <p className="mt-3 text-ink/70">
                  The calendar is for plans with enough information to make a
                  decision: time, location, cost, audience, and thread access.
                </p>
              </div>
              <Link className="btn-secondary" to="/plans">
                View plan feed
                <CalendarCheck size={18} />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {examplePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-sky py-16">
        <div className="section-shell grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <h2 className="text-3xl font-black">The pilot is free</h2>
            <p className="mt-3 max-w-2xl leading-7 text-ink/72">
              Join the Spokane pilot list. Get in the car.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <Link className="btn-primary" to={joinPath}>
              <CheckCircle2 size={18} />
              Join Spokane Pilot
            </Link>
            {fullAppEnabled ? (
              <a
                className="btn-secondary"
                href="https://discord.gg/qWEp9bTd"
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle size={18} />
                Discord
              </a>
            ) : null}
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
