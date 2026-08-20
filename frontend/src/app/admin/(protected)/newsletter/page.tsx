"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export default function AdminNewsletterPage() {
  const { token } = useAdminAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    setSubscribers(await apiFetch<Subscriber[]>("/admin/newsletter", { token }));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleDelete(id: string) {
    if (!token) return;
    await apiFetch(`/admin/newsletter/${id}`, { method: "DELETE", token });
    load();
  }

  function copyAllEmails() {
    navigator.clipboard.writeText(subscribers.map((s) => s.email).join(", "));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
        {subscribers.length > 0 && (
          <button onClick={copyAllEmails} className="rang-btn-outline px-3 py-1.5">
            Copy all emails
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : subscribers.length === 0 ? (
        <p className="text-sm text-ink-soft">No subscribers yet.</p>
      ) : (
        <table className="rang-card w-full text-left text-sm">
          <thead className="bg-ink/5 text-ink-soft">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Subscribed</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-t border-ink/10">
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2 text-ink-soft">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleDelete(s.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
