import { LogIn, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, type User } from "../lib/api";
import { getLocalEmail, saveLocalUser } from "../lib/storage";

export default function SigninPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(getLocalEmail());
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(searchParams.get("token")));

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;
    const signInToken = token;

    async function verify() {
      setVerifying(true);
      setError(null);
      try {
        const session = await api.verifyAuthLink(signInToken);
        saveLocalUser(session.user.id, session.user.email, session.token);
        setFoundUser(session.user);
        window.history.replaceState({}, "", "/signin");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not verify that sign-in link.",
        );
      } finally {
        setVerifying(false);
      }
    }

    void verify();
  }, [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFoundUser(null);
    setMagicLink(null);

    try {
      const response = await api.requestAuthLink(email.trim());
      setMagicLink(response.magic_link ?? null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not request a sign-in link for that email.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section-shell min-h-[calc(100vh-8rem)] py-12">
      <div className="mx-auto max-w-xl rounded-lg bg-cream p-8 shadow-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-moss/12 text-moss">
          <UserRound size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-black">Find my profile</h1>
        <p className="mt-3 leading-7 text-ink/72">
          Already in the pilot? Request a sign-in link for the email on your
          DadBuds profile.
        </p>
        {verifying ? (
          <p className="mt-5 rounded-md bg-paper p-3 text-sm font-bold text-ink/70">
            Verifying sign-in link...
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2">
            <span className="label">Email</span>
            <input
              required
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {error ? (
            <p className="rounded-md bg-brick/10 p-3 text-sm font-semibold text-brick">
              {error}
            </p>
          ) : null}
          {foundUser ? (
            <div className="rounded-md border border-moss/20 bg-moss/10 p-4">
              <p className="font-black">Signed in as {foundUser.name}.</p>
              <p className="mt-1 text-sm text-ink/70">
                Secure access restored for this browser.
              </p>
              <button
                className="btn-primary mt-4"
                type="button"
                onClick={() => navigate("/me")}
              >
                Go to dashboard
              </button>
            </div>
          ) : null}
          {magicLink ? (
            <div className="rounded-md border border-amber/30 bg-sticky p-4 text-sm">
              <p className="font-black">Development sign-in link</p>
              <p className="mt-1 leading-6 text-ink/70">
                Production sends this by email. Local/dev shows it here because
                SMTP is not required.
              </p>
              <a className="mt-3 block break-all font-bold underline" href={magicLink}>
                {magicLink}
              </a>
            </div>
          ) : null}
          <button className="btn-primary w-full" disabled={loading}>
            <LogIn size={18} />
            {loading ? "Sending..." : "Send sign-in link"}
          </button>
        </form>

        <p className="mt-5 text-sm text-ink/60">
          New here?{" "}
          <Link className="font-bold underline" to="/signup">
            Join the Spokane pilot
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
