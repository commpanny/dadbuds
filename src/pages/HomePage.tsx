import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTaglineIndex((current) => (current + 1) % taglines.length);
    }, 20000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-cream">
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
  );
}
