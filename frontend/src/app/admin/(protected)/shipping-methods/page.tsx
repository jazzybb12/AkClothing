"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { ShippingMethod } from "@/lib/types";

export default function AdminShippingMethodsPage() {
  const { token } = useAdminAuth();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    setMethods(await apiFetch<ShippingMethod[]>("/admin/shipping-methods", { token }));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiFetch("/admin/shipping-methods", {
        method: "POST",
        token,
        body: JSON.stringify({ name, description: description || undefined, fee: Number(fee) }),
      });
      setName("");
      setDescription("");
      setFee("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create shipping method");
    }
  }

  async function updateMethod(id: string, patch: Record<string, unknown>) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/shipping-methods/${id}`, { method: "PATCH", token, body: JSON.stringify(patch) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update shipping method");
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/shipping-methods/${id}`, { method: "DELETE", token });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete shipping method");
    }
  }

  async function move(method: ShippingMethod, direction: -1 | 1) {
    const sorted = [...methods].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((m) => m.id === method.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    if (!token) return;
    await Promise.all([
      apiFetch(`/admin/shipping-methods/${method.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ position: swapWith.position }),
      }),
      apiFetch(`/admin/shipping-methods/${swapWith.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ position: method.position }),
      }),
    ]);
    load();
  }

  const sorted = [...methods].sort((a, b) => a.position - b.position);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shipping Methods</h1>
      <p className="mb-4 text-sm text-ink-soft">
        These are the shipping options customers choose from at checkout. The first active method is used as the
        default.
      </p>

      <form onSubmit={handleCreate} className="rang-card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="rang-input" placeholder="Standard Shipping" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rang-input"
            placeholder="3-5 business days"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Fee (Rs.)</label>
          <input required type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} className="rang-input w-28" />
        </div>
        <button type="submit" className="rang-btn-primary">
          Add Method
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
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Fee</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, idx) => (
                <tr key={m.id} className="border-t border-ink/10">
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => move(m, -1)}
                        disabled={idx === 0}
                        className="text-ink-soft hover:text-brand disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => move(m, 1)}
                        disabled={idx === sorted.length - 1}
                        className="text-ink-soft hover:text-brand disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">
                    <input
                      defaultValue={m.name}
                      onBlur={(e) => {
                        if (e.target.value && e.target.value !== m.name) updateMethod(m.id, { name: e.target.value });
                      }}
                      className="rang-input w-40 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      defaultValue={m.description ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (m.description ?? "")) updateMethod(m.id, { description: e.target.value || null });
                      }}
                      className="rang-input w-48 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      defaultValue={m.fee}
                      onBlur={(e) => {
                        const num = Number(e.target.value);
                        if (!isNaN(num) && num !== Number(m.fee)) updateMethod(m.id, { fee: num });
                      }}
                      className="rang-input w-24 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => updateMethod(m.id, { active: !m.active })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                        m.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-900/60"
                          : "bg-ink/10 text-ink-soft hover:bg-ink/15"
                      }`}
                    >
                      {m.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {methods.length === 0 && (
            <p className="p-4 text-sm text-ink-soft">
              No shipping methods yet — checkout falls back to a flat fee until you add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
