import { ShieldCheck } from "lucide-react";

const prohibited = [
  "political arguments",
  "religious debate or recruiting",
  "culture-war bait",
  "alpha male content",
  "misogyny",
  "harassment",
  "bullying",
  "racism or other bigotry",
  "pickup-artist behavior",
  "aggressive sales pitches",
  "conspiracy dumping",
  "trying to dominate the group",
];

export default function CommunityStandardPage() {
  return (
    <section className="section-shell py-10">
      <div className="max-w-4xl">
        <div className="flex items-start gap-4">
          <div className="rounded-md bg-moss/15 p-3 text-moss">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="text-sm font-black uppercase text-moss">
              Community standard
            </p>
            <h1 className="mt-2 text-4xl font-black">Don’t Be a Dick</h1>
            <p className="mt-3 max-w-2xl leading-7 text-ink/72">
              DadBuds is for making plans, meeting people, and having
              low-pressure fun.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-md border border-pencil/15 bg-sticky p-5">
          <p className="text-2xl font-black">Don’t be a dick.</p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="card">
            <h2 className="text-xl font-black">Not for</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {prohibited.map((item) => (
                <span
                  className="rounded-md bg-paper px-3 py-2 text-sm font-bold text-ink/72"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="card space-y-5">
            <div>
              <h2 className="text-xl font-black">What happens</h2>
              <p className="mt-2 leading-7 text-ink/72">
                DadBuds can remove messages, mute threads, remove people from
                crews, or suspend accounts when behavior makes plans harder or
                less welcoming.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-black">Keep it practical</h2>
              <p className="mt-2 leading-7 text-ink/72">
                You do not need to agree with everyone. You do need to keep
                event threads useful, respectful, and easy to leave.
              </p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
