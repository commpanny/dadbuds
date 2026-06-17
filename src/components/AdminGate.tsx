import { LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import {
  clearAdminToken,
  getAdminToken,
  saveAdminToken,
} from "../lib/adminAuth";

export default function AdminGate({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getAdminToken());
  const [draft, setDraft] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveAdminToken(draft);
    setToken(draft.trim());
    setDraft("");
  }

  if (token) {
    return (
      <>
        <div className="border-b border-pencil/10 bg-cream/65">
          <div className="section-shell flex flex-col justify-between gap-3 py-3 text-sm sm:flex-row sm:items-center">
            <span className="font-semibold text-ink/70">
              Admin token loaded for this browser.
            </span>
            <button
              className="btn-ghost"
              onClick={() => {
                clearAdminToken();
                setToken("");
              }}
            >
              Clear admin token
            </button>
          </div>
        </div>
        {children}
      </>
    );
  }

  return (
    <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
      <div className="mx-auto max-w-xl rounded-lg bg-cream p-8 shadow-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-pencil text-cream">
          <LockKeyhole size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-black">Admin access</h1>
        <p className="mt-3 leading-7 text-ink/72">
          Enter the pilot admin token. Admin tools expose signup, availability,
          plan, RSVP, and message data.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="space-y-2">
            <span className="label">Admin token</span>
            <input
              required
              className="input"
              type="password"
              autoComplete="current-password"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <button className="btn-primary w-full" type="submit">
            Unlock admin
          </button>
        </form>
      </div>
    </section>
  );
}
