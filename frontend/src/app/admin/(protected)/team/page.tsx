"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { PERMISSIONS, PERMISSION_LABELS, Permission } from "@/lib/permissions";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  active: boolean;
  permissions: string[];
  createdAt: string;
}

export default function AdminTeamPage() {
  const { token, user: me } = useAdminAuth();
  const [team, setTeam] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!token) return;
    setTeam(await apiFetch<StaffUser[]>("/admin/staff", { token }));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/admin/staff", {
        method: "POST",
        token,
        body: JSON.stringify({ name, email, password, role }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the account");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(member: StaffUser) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/staff/${member.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ active: !member.active }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this account");
    }
  }

  async function togglePermission(member: StaffUser, permission: Permission) {
    if (!token) return;
    const next = member.permissions.includes(permission)
      ? member.permissions.filter((p) => p !== permission)
      : [...member.permissions, permission];
    setError(null);
    try {
      await apiFetch(`/admin/staff/${member.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ permissions: next }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update permissions");
    }
  }

  async function handleRemove(member: StaffUser) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/staff/${member.id}`, { method: "DELETE", token });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove this account");
    }
  }

  if (me?.role !== "ADMIN") {
    return <p className="text-sm text-ink-soft">Only an admin can manage the team.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Team</h1>

      <form onSubmit={handleCreate} className="rang-card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ chars, letter + number"
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
            className="rang-input"
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={submitting} className="rang-btn-primary">
          {submitting ? "Adding..." : "Add Team Member"}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : (
        <div className="rang-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-ink-soft">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Joined</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Permissions</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-t border-ink/10">
                  <td className="px-4 py-2 font-medium">
                    {member.name} {member.id === me.id && <span className="text-xs text-ink-soft">(you)</span>}
                  </td>
                  <td className="px-4 py-2">{member.email}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-ink-soft">
                    {new Date(member.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2">{member.role}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        member.active
                          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : "bg-ink/10 text-ink-soft"
                      }`}
                    >
                      {member.active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {member.role === "ADMIN" ? (
                      <span className="text-xs text-ink-soft">Full access</span>
                    ) : (
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {PERMISSIONS.map((p) => {
                          const granted = member.permissions.includes(p);
                          return (
                            <button
                              key={p}
                              onClick={() => togglePermission(member, p)}
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${
                                granted
                                  ? "bg-brand/10 text-brand hover:bg-brand/20"
                                  : "bg-ink/10 text-ink-soft hover:bg-ink/15"
                              }`}
                            >
                              {PERMISSION_LABELS[p]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {member.id !== me.id && (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => toggleActive(member)} className="text-xs font-medium text-brand hover:underline">
                          {member.active ? "Deactivate" : "Reactivate"}
                        </button>
                        <button onClick={() => handleRemove(member)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
