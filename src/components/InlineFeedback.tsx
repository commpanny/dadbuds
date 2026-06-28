import { MessageSquarePlus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";

export default function InlineFeedback() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [sourceType, setSourceType] = useState("agent");
  const [severity, setSeverity] = useState("painpoint");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;

    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await api.createUxFeedback({
        source_type: sourceType,
        page: location.pathname,
        severity,
        body,
      });
      setBody("");
      setNotice("Feedback logged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end">
      {open ? (
        <form
          className="mb-3 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-pencil/15 bg-paper p-4 shadow-soft"
          onSubmit={(event) => void submitFeedback(event)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-moss">
                Inline UX feedback
              </p>
              <p className="mt-1 text-xs font-semibold text-ink/55">
                {location.pathname}
              </p>
            </div>
            <button
              aria-label="Close feedback"
              className="btn-ghost px-2 py-2"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="label">Source</span>
              <select
                className="input"
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value)}
              >
                <option value="agent">Agent</option>
                <option value="founder">Founder</option>
                <option value="human">Human tester</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="label">Type</span>
              <select
                className="input"
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
              >
                <option value="painpoint">Pain point</option>
                <option value="bug">Bug</option>
                <option value="naming">Naming</option>
                <option value="request">Request</option>
              </select>
            </label>
          </div>

          <label className="mt-3 block space-y-2">
            <span className="label">What got in the way?</span>
            <textarea
              className="input min-h-28"
              placeholder="Example: I created a plan in the sim but could not tell where it appeared."
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>

          {notice ? (
            <p className="mt-3 text-sm font-semibold text-moss">{notice}</p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm font-semibold text-brick">{error}</p>
          ) : null}

          <button
            className="btn-primary mt-4 w-full justify-center"
            disabled={saving || !body.trim()}
            type="submit"
          >
            {saving ? "Logging..." : "Log feedback"}
          </button>
        </form>
      ) : null}

      <button
        className="btn-primary shadow-soft"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <MessageSquarePlus size={18} />
        UX feedback
      </button>
    </div>
  );
}
