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

const trackedFields = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
] as const;

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

export default function JoinSignupPage() {
  const [searchParams] = useSearchParams();
  const [captured, setCaptured] = useState(
    searchParams.get("captured") === "1",
  );
  const fullAppEnabled =
    import.meta.env.DEV ||
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
            DadBuds will use this for Spokane pilot updates and local event
            invites.
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
            <h1 className="mt-5 text-4xl font-black">Join Spokane beta</h1>
            <p className="mt-3 text-lg font-bold text-brick">
              First 25 Spokane members get in free.
            </p>
            <p className="mt-5 leading-7 text-ink/72">
              DadBuds starts with enough local density to make plans useful. The
              pilot uses your ZIP code and email to understand where to launch,
              what to invite you to, and whether Spokane has enough dads ready
              to show up.
            </p>
            <p className="mt-3 text-sm font-bold text-ink/62">
              Not in Spokane? Use the same form to request DadBuds in your ZIP
              code.
            </p>
          </div>

          <div className="rounded-lg border border-moss/25 bg-moss/10 p-6">
            <div className="flex items-center gap-2 text-moss">
              <MapPin size={20} />
              <h2 className="text-xl font-black">Standing event</h2>
            </div>
            <p className="mt-4 text-2xl font-black leading-tight">
              Upper Manito Playground
            </p>
            <p className="mt-2 text-lg font-bold text-ink/72">
              Sundays, 10:00 AM-noon
            </p>
            <p className="mt-4 leading-7 text-ink/72">
              No signup required. This is the live, recurring DadBuds park hang:
              show up if it works, bring kids if you have them, and leave when
              you need to leave.
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
          name="dadbuds-spokane-beta"
          netlify-honeypot="bot-field"
          onSubmit={onSubmit}
        >
          <input name="form-name" type="hidden" value="dadbuds-spokane-beta" />
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
              <h2 className="text-2xl font-black">Quick intake</h2>
              <p className="mt-2 text-sm leading-6 text-ink/66">
                This does not create a full profile. It gives DadBuds enough to
                invite you when there is a relevant Spokane plan or enough
                interest in your ZIP code.
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
                name="spokane_beta"
                type="checkbox"
                value="yes"
              />
              <span>Sign up for Spokane beta</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-pencil/15 bg-cream p-3 text-sm font-bold">
              <input
                className="mt-1 h-4 w-4 accent-moss"
                defaultChecked
                name="zip_code_interest"
                type="checkbox"
                value="yes"
              />
              <span>Bring DadBuds to my ZIP code</span>
            </label>
            <label className="space-y-2">
              <span className="label">Referral code</span>
              <input
                className="input"
                defaultValue={defaults.referralCode}
                name="referral_code"
                placeholder="BOYSOFSUMMER"
              />
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-pencil/15 bg-cream p-3 text-sm">
              <input
                className="mt-1 h-4 w-4 accent-moss"
                name="marketing_consent"
                type="checkbox"
                value="yes"
              />
              <span>
                Send me DadBuds beta updates, local event invitations, and
                occasional product news. I can unsubscribe at any time.
              </span>
            </label>
          </div>

          <button className="btn-primary mt-6 w-full" type="submit">
            Join
            <ArrowRight size={18} />
          </button>

          <p className="mt-4 text-xs leading-5 text-ink/55">
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
              "By joining the pilot list, you agree that DadBuds may use this intake to follow up about the Spokane beta."
            )}
          </p>
        </form>
      </div>
    </section>
  );
}
