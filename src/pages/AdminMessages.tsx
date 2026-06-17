import { Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import AsyncState from "../components/AsyncState";
import { api, type Message } from "../lib/api";

const initialForm = {
  channel: "manual",
  recipient_type: "group",
  recipient_id: "",
  related_plan_id: "",
  body: "",
  status: "draft",
};

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setMessages(await api.listMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createMessage({
        ...form,
        recipient_id: form.recipient_id ? Number(form.recipient_id) : null,
        related_plan_id: form.related_plan_id
          ? Number(form.related_plan_id)
          : null,
      });
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save message.");
    } finally {
      setSaving(false);
    }
  }

  async function fakeSend(id: number) {
    setError(null);
    try {
      await api.fakeSendMessage(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fake-send.");
    }
  }

  return (
    <section className="section-shell py-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black">Message log</h1>
        <p className="mt-3 leading-7 text-ink/72">
          Fake SMS, Discord, and manual messages. Sending updates the log only
          unless a future Twilio or Discord integration is configured.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <form onSubmit={onSubmit} className="card space-y-4">
          <h2 className="text-xl font-black">Create message</h2>
          <label className="space-y-2">
            <span className="label">Channel</span>
            <select
              className="input"
              value={form.channel}
              onChange={(event) =>
                setForm({ ...form, channel: event.target.value })
              }
            >
              <option>SMS</option>
              <option>Discord</option>
              <option>manual</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Recipient type</span>
            <select
              className="input"
              value={form.recipient_type}
              onChange={(event) =>
                setForm({ ...form, recipient_type: event.target.value })
              }
            >
              <option>user</option>
              <option>group</option>
              <option>manual</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="label">Recipient/user/group ID optional</span>
            <input
              className="input"
              type="number"
              value={form.recipient_id}
              onChange={(event) =>
                setForm({ ...form, recipient_id: event.target.value })
              }
            />
          </label>
          <label className="space-y-2">
            <span className="label">Related plan ID optional</span>
            <input
              className="input"
              type="number"
              value={form.related_plan_id}
              onChange={(event) =>
                setForm({ ...form, related_plan_id: event.target.value })
              }
            />
          </label>
          <label className="space-y-2">
            <span className="label">Message body</span>
            <textarea
              required
              className="input min-h-36"
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
            />
          </label>
          <button className="btn-primary w-full" disabled={saving}>
            <Send size={18} />
            {saving ? "Saving..." : "Save message"}
          </button>
        </form>

        <div>
          <AsyncState loading={loading} error={error} empty={!messages.length}>
            <div className="space-y-4">
              {messages.map((message) => (
                <article key={message.id} className="card">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-md bg-paper px-2 py-1 text-xs font-bold">
                          {message.channel}
                        </span>
                        <span className="rounded-md bg-sky px-2 py-1 text-xs font-bold">
                          {message.status}
                        </span>
                        {message.related_plan_id ? (
                          <span className="rounded-md bg-cream px-2 py-1 text-xs font-bold">
                            Plan #{message.related_plan_id}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-4 leading-7 text-ink/82">
                        {message.body}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-ink/55">
                        {new Date(message.created_at).toLocaleString()}
                        {message.sent_at
                          ? ` · fake-sent ${new Date(
                              message.sent_at,
                            ).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    {message.status !== "fake-sent" ? (
                      <button
                        className="btn-secondary shrink-0"
                        onClick={() => void fakeSend(message.id)}
                      >
                        <Send size={18} />
                        Fake-send
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </AsyncState>
        </div>
      </div>
    </section>
  );
}
