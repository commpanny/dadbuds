import {
  CalendarClock,
  ClipboardList,
  MessageSquareText,
  PlusCircle,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const adminLinks = [
  {
    to: "/admin/users",
    label: "Users",
    icon: UsersRound,
    description: "Profiles, interests, SMS opt-in, and Discord handles.",
  },
  {
    to: "/admin/availability",
    label: "Availability requests",
    icon: CalendarClock,
    description: "Windows that can become suggested plans.",
  },
  {
    to: "/admin/plans/new",
    label: "Create plan",
    icon: PlusCircle,
    description: "Draft or publish a Spokane calendar plan.",
  },
  {
    to: "/admin/messages",
    label: "Message log",
    icon: MessageSquareText,
    description: "Fake SMS, Discord, and manual send history.",
  },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    users: 0,
    availability: 0,
    plans: 0,
    messages: 0,
  });

  useEffect(() => {
    async function loadCounts() {
      try {
        const [users, availability, plans, messages] = await Promise.all([
          api.listUsers(),
          api.listAvailability(),
          api.listPlans(true),
          api.listMessages(),
        ]);
        setCounts({
          users: users.length,
          availability: availability.length,
          plans: plans.length,
          messages: messages.length,
        });
      } catch {
        setCounts({ users: 0, availability: 0, plans: 0, messages: 0 });
      }
    }

    void loadCounts();
  }, []);

  return (
    <section className="section-shell py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-moss">Manual MVP controls</p>
          <h1 className="mt-2 text-4xl font-black">Admin dashboard</h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink/72">
            External integrations are intentionally fake here. Plans, matching,
            RSVP nudges, and reminders all run through admin actions and logs.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={counts.users} />
        <Stat label="Availability" value={counts.availability} />
        <Stat label="Plans" value={counts.plans} />
        <Stat label="Messages" value={counts.messages} />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {adminLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="card block transition hover:-translate-y-0.5">
              <Icon size={26} className="text-moss" />
              <h2 className="mt-4 text-xl font-black">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>

      <section className="mt-8 rounded-lg bg-pencil p-6 text-cream">
        <div className="flex items-center gap-3">
          <ClipboardList size={24} />
          <h2 className="text-xl font-black">MVP operating loop</h2>
        </div>
        <p className="mt-3 max-w-3xl leading-7 text-cream/80">
          Watch availability, create a plan, generate message copy, fake-send it,
          collect RSVPs, then log reminder drafts before the event.
        </p>
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-cream p-5 shadow-soft">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-ink/65">{label}</p>
    </div>
  );
}
