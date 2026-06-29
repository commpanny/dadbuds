import { ArrowRight, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { crewPreviews } from "../lib/crews";

const taglines = [
  "Where you'll actually get that beer.",
  'No more "can I get your number dude?"',
  "The end of “we should hang sometime.”",
  "Nobody wants to text 12 people.",
  "The answer to girls’ weekend.",
  "Sometimes kid-friendly. Sometimes.",
];

type HomePageProps = {
  joinPath?: string;
};

export default function HomePage({ joinPath = "/join/signup" }: HomePageProps) {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [openCrewId, setOpenCrewId] = useState(crewPreviews[0]?.id ?? "");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTaglineIndex((current) => (current + 1) % taglines.length);
    }, 20000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="bg-cream">
      <section className="relative overflow-hidden">
        <div className="section-shell relative grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 md:grid-cols-[1.1fr_0.9fr]">
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
              <Link className="btn-secondary" to="/how-it-works">
                See how it works
              </Link>
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

      <section className="bg-paper py-14">
        <div className="section-shell">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-cream px-3 py-2 text-sm font-bold text-moss">
              <UsersRound size={17} />
              Crews preview
            </div>
            <h2 className="mt-4 text-3xl font-black">Find your people first.</h2>
            <p className="mt-3 leading-7 text-ink/72">
              Crews are interest groups that help DadBuds route plans to people
              who might actually care.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {crewPreviews.map((crew) => {
              const open = openCrewId === crew.id;

              return (
                <button
                  key={crew.id}
                  aria-expanded={open}
                  className={`rounded-lg border p-4 text-left transition ${
                    open
                      ? "border-moss bg-cream shadow-soft"
                      : "border-pencil/15 bg-cream/75 hover:border-moss/50 hover:bg-cream"
                  }`}
                  onClick={() => setOpenCrewId(open ? "" : crew.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{crew.name}</h3>
                      <p className="mt-1 text-xs font-bold uppercase text-ink/52">
                        {crew.examples}
                      </p>
                    </div>
                    <span className="rounded-md bg-paper px-2 py-1 text-xs font-black text-pencil">
                      {open ? "Hide" : "Open"}
                    </span>
                  </div>
                  {open ? (
                    <p className="mt-4 text-sm leading-6 text-ink/72">
                      {crew.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <Link className="btn-primary" to={joinPath}>
              Pick crews during signup
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
