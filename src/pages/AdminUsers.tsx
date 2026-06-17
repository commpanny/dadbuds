import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import AsyncState from "../components/AsyncState";
import { api, type User } from "../lib/api";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        setUsers(await api.listUsers());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load users.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <section className="section-shell py-10">
      <h1 className="text-4xl font-black">Users</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/72">
        Pilot dads, interests, availability preferences, SMS consent, and
        Discord handles.
      </p>

      <div className="mt-8">
        <AsyncState loading={loading} error={error} empty={!users.length}>
          <div className="overflow-x-auto rounded-lg border border-pencil/15 bg-cream shadow-soft">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-pencil text-cream">
                <tr>
                  <Th>Name</Th>
                  <Th>Neighborhood</Th>
                  <Th>Interests</Th>
                  <Th>Availability</Th>
                  <Th>SMS opt-in</Th>
                  <Th>Discord</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-pencil/10">
                    <Td>
                      <strong>{user.name}</strong>
                      <span className="block text-ink/65">{user.email}</span>
                    </Td>
                    <Td>{user.neighborhood}</Td>
                    <Td>{user.interests.join(", ") || "None"}</Td>
                    <Td>{user.typical_availability.join(", ") || "None"}</Td>
                    <Td>{user.sms_opt_in ? "Yes" : "No"}</Td>
                    <Td>{user.discord_username || "None"}</Td>
                    <Td>{new Date(user.created_at).toLocaleDateString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>
    </section>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-black">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="align-top px-4 py-3 text-ink/80">{children}</td>;
}
