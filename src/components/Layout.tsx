import { Menu, MessageCircle, UserRound } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/plans", label: "Spokane Calendar" },
  { to: "/events", label: "Event Ideas" },
  { to: "/free", label: "Status" },
  { to: "/me", label: "Me" },
];

const shadowMode = import.meta.env.VITE_SHADOW_MODE === "true";
const fullAppEnabled =
  shadowMode ||
  import.meta.env.VITE_FULL_APP === "true";
const internalNavItems =
  fullAppEnabled
    ? [
        { to: "/sim", label: "Sim" },
        { to: "/admin", label: "Admin" },
      ]
    : [];
const visibleNavItems = fullAppEnabled
  ? [...navItems, ...internalNavItems]
  : [];
const InlineFeedback = shadowMode ? lazy(() => import("./InlineFeedback")) : null;

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const onJoinFlow = location.pathname.startsWith("/join/signup") ||
    location.pathname.startsWith("/join/thanks");
  const onHowItWorks = location.pathname.startsWith("/how-it-works");

  function goHome() {
    setOpen(false);
    window.history.pushState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      {shadowMode ? (
        <div className="border-b border-amber/40 bg-amber px-4 py-2 text-center text-sm font-black uppercase text-pencil">
          Shadow sim site · separate database · no real pilot data mutations
        </div>
      ) : null}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="section-shell flex min-h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" onClick={goHome}>
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-pencil/20 bg-cream text-sm font-black text-pencil"
            >
              DB
            </span>
            <span className="text-lg font-black tracking-normal">DadBuds</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-pencil text-cream"
                      : "text-ink/75 hover:bg-cream hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {fullAppEnabled ? (
              <>
                <a
                  className="btn-secondary"
                  href="https://discord.gg/qWEp9bTd"
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle size={18} />
                  Discord
                </a>
                <Link className="btn-secondary" to="/signin">
                  Sign in
                </Link>
              </>
            ) : null}
            {onHowItWorks ? (
              <a className="btn-secondary" href="#pilot-crews">
                Browse crews
              </a>
            ) : (
              <Link className="btn-secondary" to="/how-it-works">
                See how it works
              </Link>
            )}
            {onJoinFlow ? (
              <Link className="btn-secondary" to="/join">
                Back to DadBuds
              </Link>
            ) : (
              <Link className="btn-primary" to="/join/signup">
                <UserRound size={18} />
                Join Spokane Pilot
              </Link>
            )}
          </div>

          <button
            aria-label="Open menu"
            className="btn-ghost md:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu size={22} />
          </button>
        </div>

        {open ? (
          <div className="border-t border-ink/10 bg-paper md:hidden">
            <div className="section-shell flex flex-col gap-2 py-3">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-cream"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              {fullAppEnabled ? (
                <Link
                  className="btn-secondary"
                  to="/signin"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              ) : null}
              {onHowItWorks ? (
                <a
                  className="btn-secondary"
                  href="#pilot-crews"
                  onClick={() => setOpen(false)}
                >
                  Browse crews
                </a>
              ) : (
                <Link
                  className="btn-secondary"
                  to="/how-it-works"
                  onClick={() => setOpen(false)}
                >
                  See how it works
                </Link>
              )}
              {onJoinFlow ? (
                <Link
                  className="btn-secondary"
                  to="/join"
                  onClick={() => setOpen(false)}
                >
                  Back to DadBuds
                </Link>
              ) : (
                <Link
                  className="btn-primary"
                  to="/join/signup"
                  onClick={() => setOpen(false)}
                >
                  <UserRound size={18} />
                  Join Spokane Pilot
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>
      {InlineFeedback ? (
        <Suspense fallback={null}>
          <InlineFeedback />
        </Suspense>
      ) : null}

      <footer className="border-t border-ink/10 bg-pencil py-8 text-cream">
        <div className="section-shell flex flex-col justify-between gap-4 text-sm md:flex-row md:items-center">
          <p className="font-semibold">DadBuds.lol · Spokane pilot</p>
          <div className="flex flex-wrap gap-4 text-cream/70">
            {fullAppEnabled ? (
              <>
                <Link className="hover:text-cream" to="/privacy">
                  Privacy
                </Link>
                <Link className="hover:text-cream" to="/terms">
                  Terms
                </Link>
                <Link className="hover:text-cream" to="/standard">
                  Don’t Be a Dick
                </Link>
              </>
            ) : null}
            <span>Plans, crews, low pressure.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
