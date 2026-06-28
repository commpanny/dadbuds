import {
  Ban,
  BellOff,
  Flag,
  LogOut,
  Send,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AsyncState from "../components/AsyncState";
import {
  api,
  type Conversation,
  type ConversationMember,
  type ConversationMessage,
} from "../lib/api";
import { getLocalUserId } from "../lib/storage";

function senderName(message: ConversationMessage) {
  if (message.sender_type === "dadbuds") return "DadBuds";
  if (message.sender_type === "system") return "System";
  return message.sender_user?.name ?? "Someone";
}

function messageTone(message: ConversationMessage) {
  return message.sender_type === "dadbuds"
    ? "border-moss/20 bg-moss/10"
    : "border-pencil/15 bg-paper";
}

export default function ConversationPage() {
  const params = useParams();
  const planId = Number(params.planId);
  const userId = getLocalUserId();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(Boolean(userId && planId));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function loadConversation() {
    if (!userId || !planId) return;
    setLoading(true);
    setError(null);
    try {
      setConversation(await api.getPlanConversation(planId, userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load thread.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, userId]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversation || !userId || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.createConversationMessage(conversation.id, {
        user_id: userId,
        body,
      });
      setBody("");
      await loadConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  async function updatePreference(action: "mute" | "leave" | "keep") {
    if (!conversation || !userId) return;
    setError(null);
    try {
      if (action === "mute") {
        setConversation(await api.muteConversation(conversation.id, userId));
        setNotice("Muted. You can still reopen the thread later.");
      }
      if (action === "leave") {
        setConversation(await api.leaveConversation(conversation.id, userId));
        setNotice("You left the thread. No public announcement was posted.");
      }
      if (action === "keep") {
        setConversation(
          await api.setPersistenceChoice(conversation.id, userId, "keep"),
        );
        setNotice("Saved privately. Crews only form when enough people opt in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update thread.");
    }
  }

  async function reportMessage(message: ConversationMessage) {
    if (!conversation || !userId) return;
    await api.createSafetyReport({
      reporter_user_id: userId,
      reported_user_id: message.sender_user?.id,
      conversation_id: conversation.id,
      message_id: message.id,
      report_type: "message",
      reason: "Reported from conversation controls.",
    });
    setNotice("Report saved privately.");
  }

  async function reportUser(member: ConversationMember) {
    if (!conversation || !userId) return;
    await api.createSafetyReport({
      reporter_user_id: userId,
      reported_user_id: member.user.id,
      conversation_id: conversation.id,
      report_type: "user",
      reason: "Reported from participant controls.",
    });
    setNotice("User report saved privately.");
  }

  async function blockUser(member: ConversationMember) {
    if (!userId) return;
    await api.blockUser(member.user.id, userId);
    setNotice("Blocked. DadBuds will avoid matching you together.");
  }

  async function saveBud(member: ConversationMember) {
    if (!userId) return;
    await api.saveBud(member.user.id, userId);
    setNotice("Saved privately. They are not notified.");
  }

  if (!userId) {
    return (
      <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
        <div className="mx-auto max-w-xl rounded-lg bg-cream p-8 shadow-soft">
          <UsersRound size={34} className="text-moss" />
          <h1 className="mt-5 text-3xl font-black">Join before the thread</h1>
          <p className="mt-3 leading-7 text-ink/72">
            Event threads unlock after you have a local DadBuds profile and RSVP.
          </p>
          <Link className="btn-primary mt-6" to="/signup">
            Join Spokane Pilot
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-10">
      <AsyncState loading={loading} error={error} empty={!conversation}>
        {conversation ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-black uppercase text-moss">
                    Temporary plan thread
                  </p>
                  <h1 className="mt-2 text-3xl font-black">
                    {conversation.plan_title ?? "DadBuds thread"}
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-ink/60">
                    RSVP threads are for logistics first. They only become crews
                    when multiple people privately keep them on.
                  </p>
                </div>
                <Link className="btn-secondary" to="/standard">
                  <ShieldCheck size={18} />
                  Don’t Be a Dick
                </Link>
              </div>

              {notice ? (
                <p className="rounded-md bg-moss/10 p-3 text-sm font-bold text-moss">
                  {notice}
                </p>
              ) : null}

              <div className="space-y-3">
                {conversation.messages.map((message) => (
                  <article
                    className={`rounded-md border p-4 ${messageTone(message)}`}
                    key={message.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-black">{senderName(message)}</p>
                      {message.sender_type === "user" ? (
                        <button
                          className="btn-ghost px-3 py-2 text-xs"
                          onClick={() => void reportMessage(message)}
                        >
                          <Flag size={15} />
                          Report message
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 leading-7 text-ink/78">{message.body}</p>
                  </article>
                ))}
              </div>

              <form
                className="rounded-md border border-pencil/15 bg-cream p-3"
                onSubmit={submitMessage}
              >
                <label className="sr-only" htmlFor="thread-message">
                  Message
                </label>
                <textarea
                  className="input min-h-24"
                  id="thread-message"
                  placeholder="Parking, timing, kids, who has the table..."
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
                <div className="mt-3 flex justify-end">
                  <button className="btn-primary" disabled={sending}>
                    <Send size={18} />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>

            <aside className="space-y-5">
              <section className="card space-y-3">
                <h2 className="text-xl font-black">Thread controls</h2>
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => void updatePreference("mute")}
                >
                  <BellOff size={18} />
                  Mute thread
                </button>
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => void updatePreference("leave")}
                >
                  <LogOut size={18} />
                  Leave thread
                </button>
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => void updatePreference("keep")}
                >
                  <UsersRound size={18} />
                  Keep notifications on
                </button>
              </section>

              <section className="card">
                <h2 className="text-xl font-black">People here</h2>
                <div className="mt-4 space-y-3">
                  {conversation.members.map((member) => {
                    const isMe = member.user.id === userId;
                    return (
                      <div
                        className="rounded-md border border-pencil/15 bg-paper p-3"
                        key={member.id}
                      >
                        <p className="font-black">
                          {member.user.name}
                          {isMe ? " (you)" : ""}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase text-ink/50">
                          {member.notification_preference}
                        </p>
                        {!isMe ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              className="btn-secondary px-3 py-2 text-xs"
                              onClick={() => void saveBud(member)}
                            >
                              <UserPlus size={15} />
                              Save
                            </button>
                            <button
                              className="btn-ghost px-3 py-2 text-xs"
                              onClick={() => void reportUser(member)}
                            >
                              <Flag size={15} />
                              Report
                            </button>
                            <button
                              className="btn-ghost px-3 py-2 text-xs"
                              onClick={() => void blockUser(member)}
                            >
                              <Ban size={15} />
                              Block
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-md border border-pencil/15 bg-sticky p-4">
                <h2 className="text-lg font-black">Privacy note</h2>
                <p className="mt-2 text-sm leading-6 text-ink/70">
                  DadBuds can read DadBuds conversations to coordinate plans,
                  reminders, suggestions, and safety. This does not become a
                  public profile, ranking, or ad target.
                </p>
              </section>
            </aside>
          </div>
        ) : null}
      </AsyncState>
    </section>
  );
}
