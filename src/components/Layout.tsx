import { Menu, MessageCircle, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import InlineFeedback from "./InlineFeedback";

const navItems = [
  { to: "/plans", label: "Spokane Calendar" },
  { to: "/events", label: "Event Ideas" },
  { to: "/free", label: "Status" },
  { to: "/me", label: "Me" },
];

const shadowMode = import.meta.env.VITE_SHADOW_MODE === "true";
const fullAppEnabled =
  import.meta.env.DEV ||
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

export default function Layout() {
  const [open, setOpen] = useState(false);

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
            <img
              src="/dadbuds-logo.png"
              alt="DadBuds"
              className="h-12 w-14 rounded-md object-cover object-center"
            />
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
            <Link className="btn-primary" to="/join/signup">
              <UserRound size={18} />
              Join Spokane Pilot
            </Link>
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
              <Link
                className="btn-primary"
                to="/join/signup"
                onClick={() => setOpen(false)}
              >
                <UserRound size={18} />
                Join Spokane Pilot
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>
      {shadowMode ? <InlineFeedback /> : null}

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
            <span>Local plans with clear details.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
