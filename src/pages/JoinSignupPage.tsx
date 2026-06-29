import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { crewPreviews } from "../lib/crews";

const trackedFields = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
] as const;

const CREW_SELECTION_LIMIT = 6;
const validCrewIds = new Set(crewPreviews.map((crew) => crew.id));

function firstParam(params: URLSearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }
  return "";
}

function isLocalHost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function getInitialCrewIds(params: URLSearchParams) {
  return Array.from(new Set(params.getAll("crew")))
    .filter((crewId) => validCrewIds.has(crewId))
    .slice(0, CREW_SELECTION_LIMIT);
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

export default function JoinSignupPage() {
  const [searchParams] = useSearchParams();
  const nextSaturdayLabel = getNextSaturdayLabel();
  const [captured, setCaptured] = useState(
    searchParams.get("captured") === "1",
  );
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>(() =>
    getInitialCrewIds(searchParams),
  );
  const [crewLimitMessage, setCrewLimitMessage] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const fullAppEnabled =
    import.meta.env.VITE_SHADOW_MODE === "true" ||
    import.meta.env.VITE_FULL_APP === "true";

  const defaults = useMemo(() => {
    const referralCode =
      firstParam(searchParams, "referral_code", "ref") || "BOYSOFSUMMER";

    return {
      email: searchParams.get("email") ?? "",
      referralCode,
      tracked: Object.fromEntries(
        trackedFields.map((field) => [
          field,
          field === "ref" ? referralCode : searchParams.get(field) ?? "",
        ]),
      ),
    };
  }, [searchParams]);
  const [referralCode, setReferralCode] = useState(defaults.referralCode);

  function toggleCrew(crewId: string) {
    if (selectedCrewIds.includes(crewId)) {
      setCrewLimitMessage("");
      setSelectedCrewIds((current) => current.filter((id) => id !== crewId));
      return;
    }

    if (selectedCrewIds.length >= CREW_SELECTION_LIMIT) {
      setCrewLimitMessage(
        "You can start with 6. You’ll be able to add more after signup.",
      );
      return;
    }

    setCrewLimitMessage("");
    setSelectedCrewIds((current) => [...current, crewId]);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isLocalHost()) return;
    event.preventDefault();
    setCaptured(true);
  }

  if (captured) {
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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {fullAppEnabled ? (
              <Link className="btn-primary" to="/plans">
                Spokane calendar
                <CalendarDays size={18} />
              </Link>
            ) : null}
            <Link className="btn-secondary" to="/join">
              Back to landing
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-5">
          <div className="rounded-lg border border-pencil/15 bg-cream p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber/35 text-pencil">
              <Sparkles size={24} />
            </div>
            <h1 className="mt-5 text-4xl font-black">Join Spokane pilot</h1>
            <p className="mt-5 leading-7 text-ink/72">
              We are starting with Spokane plans and South Hill-friendly crews.
              Email gets you updates. ZIP code helps us keep plans close enough
              to be useful.
            </p>
            <p className="mt-3 text-sm font-bold text-ink/62">
              Not in Spokane? Use the same form to request DadBuds in your ZIP
              code.
            </p>
          </div>

          <Link
            className="btn-secondary w-full justify-between bg-paper"
            to="/how-it-works"
          >
            See how it works
            <ArrowRight size={18} />
          </Link>

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
            <p className="mt-4 leading-7 text-ink/72">
              No signup required. Show up if it works and leave when you need
              to.
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

        <form
          action="/join/thanks"
          className="rounded-lg border border-pencil/15 bg-paper p-6 shadow-soft"
          data-netlify="true"
          method="POST"
          name="dadbuds-spokane-pilot"
          netlify-honeypot="bot-field"
          onSubmit={onSubmit}
        >
          <input name="form-name" type="hidden" value="dadbuds-spokane-pilot" />
          {trackedFields.map((field) => (
            <input
              key={field}
              name={field}
              type="hidden"
              value={defaults.tracked[field]}
            />
          ))}
          <input name="source_url" type="hidden" value={window.location.href} />
          <div aria-hidden="true" hidden>
            <input autoComplete="off" name="bot-field" tabIndex={-1} />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-pencil text-cream">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Where should we start?</h2>
              <p className="mt-2 text-sm leading-6 text-ink/66">
                Leave an email, your ZIP, and the first crews you would
                actually check.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="label">Email *</span>
              <input
                autoComplete="email"
                className="input"
                defaultValue={defaults.email}
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>
            <label className="space-y-2">
              <span className="label">ZIP code *</span>
              <input
                autoComplete="postal-code"
                className="input"
                inputMode="numeric"
                maxLength={5}
                name="zip"
                pattern="[0-9]{5}"
                placeholder="99201"
                required
                type="text"
              />
            </label>
          </div>

          <div className="mt-5 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-pencil/15 bg-cream p-3 text-sm font-bold">
              <input
                className="mt-1 h-4 w-4 accent-moss"
                defaultChecked
                name="invite_near_zip"
                type="checkbox"
                value="yes"
              />
              <span>Invite me to DadBuds plans near this ZIP code</span>
            </label>
            <div className="rounded-md border border-pencil/15 bg-cream p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black">
                    Pick crews you’d actually show up for
                  </p>
                  <p className="mt-1 text-xs font-semibold text-ink/58">
                    Choose up to 6 for now. You can add, remove, or edit crews
                    after signup.
                  </p>
                </div>
                <p className="text-xs font-black text-moss">
                  {selectedCrewIds.length} of {CREW_SELECTION_LIMIT} selected
                </p>
              </div>
              {crewLimitMessage ? (
                <p className="mt-3 rounded-md bg-amber/30 px-3 py-2 text-sm font-bold text-pencil">
                  {crewLimitMessage}
                </p>
              ) : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {crewPreviews.map((crew) => {
                  const selected = selectedCrewIds.includes(crew.id);

                  return (
                    <label
                      className={`grid min-h-16 cursor-pointer grid-cols-[1rem_1fr] gap-3 rounded-md border p-3 text-sm font-bold transition focus-within:ring-2 focus-within:ring-moss focus-within:ring-offset-2 focus-within:ring-offset-cream ${
                        selected
                          ? "border-moss bg-moss/15 shadow-[2px_2px_0_rgba(85,116,93,0.20)]"
                          : "border-pencil/10 bg-paper/60 hover:border-moss/50 hover:bg-paper"
                      }`}
                      key={crew.id}
                    >
                      <input
                        checked={selected}
                        className="mt-1 h-4 w-4 accent-moss"
                        name="crews"
                        onChange={() => toggleCrew(crew.id)}
                        type="checkbox"
                        value={crew.id}
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 leading-5">
                          {crew.name}
                          {selected ? (
                            <span className="rounded-sm bg-moss px-1.5 py-0.5 text-[0.65rem] font-black uppercase text-cream">
                              Selected
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-ink/58">
                          {crew.examples}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <label className="mt-3 block space-y-2">
                <span className="label">Suggest another crew</span>
                <input
                  className="input bg-paper/60"
                  name="crew_suggestion"
                  type="text"
                />
              </label>
            </div>
            <input name="referral_code" type="hidden" value={referralCode} />
            {showReferral ? (
              <label className="space-y-2">
                <span className="label">Referral code</span>
                <input
                  className="input"
                  onChange={(event) => setReferralCode(event.target.value)}
                  placeholder="BOYSOFSUMMER"
                  type="text"
                  value={referralCode}
                />
              </label>
            ) : (
              <button
                className="btn-secondary w-full justify-start bg-cream"
                onClick={() => setShowReferral(true)}
                type="button"
              >
                Have a referral code?
              </button>
            )}
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-pencil/15 bg-cream p-3 text-sm">
              <input
                className="mt-1 h-4 w-4 accent-moss"
                name="marketing_consent"
                type="checkbox"
                value="yes"
              />
              <span>
                Send me DadBuds pilot updates and local event invitations. I can
                unsubscribe at any time.
              </span>
            </label>
          </div>

          <button className="btn-primary mt-6 w-full" type="submit">
            Join DadBuds
            <ArrowRight size={18} />
          </button>

          <p className="mt-4 text-xs leading-5 text-ink/68">
            {fullAppEnabled ? (
              <>
                By joining the pilot list, you agree to the DadBuds{" "}
                <Link className="font-bold underline" to="/terms">
                  terms
                </Link>{" "}
                and{" "}
                <Link className="font-bold underline" to="/privacy">
                  privacy notice
                </Link>
                .
              </>
            ) : (
              "By joining, you are okay with DadBuds following up about the Spokane pilot."
            )}
          </p>
        </form>
      </div>
    </section>
  );
}
