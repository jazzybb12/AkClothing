"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: string;
  active: boolean;
  autoApply: boolean;
  usedCount: number;
  usageLimit: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { token } = useAdminAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED" | "FREE_SHIPPING">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [autoApply, setAutoApply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setCoupons(await apiFetch<Coupon[]>("/coupons", { token }));
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
      await apiFetch("/coupons", {
        method: "POST",
        token,
        body: JSON.stringify({ code, type, value: type === "FREE_SHIPPING" ? 0 : Number(value), autoApply }),
      });
      setCode("");
      setValue("");
      setAutoApply(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create coupon");
    }
  }

  async function updateCoupon(id: string, patch: Record<string, unknown>) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/coupons/${id}`, { method: "PATCH", token, body: JSON.stringify(patch) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update coupon");
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/coupons/${id}`, { method: "DELETE", token });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete coupon");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Coupons</h1>

      <form onSubmit={handleCreate} className="rang-card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Code</label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED" | "FREE_SHIPPING")}
            className="rang-input"
          >
            <option value="PERCENTAGE">Percentage %</option>
            <option value="FIXED">Fixed Rs.</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </select>
        </div>
        {type !== "FREE_SHIPPING" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Value</label>
            <input
              required
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="rang-input w-24"
            />
          </div>
        )}
        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} />
          Auto-apply (no code needed)
        </label>
        <button type="submit" className="rang-btn-primary">
          Create
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="rang-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink/5 text-ink-soft">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Value</th>
              <th className="px-4 py-2">Usage Limit</th>
              <th className="px-4 py-2">Expires</th>
              <th className="px-4 py-2">Used</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Auto</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-ink/10">
                <td className="px-4 py-2 font-medium">{c.code}</td>
                <td className="whitespace-nowrap px-4 py-2 text-ink-soft">
                  {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-2">{c.type}</td>
                <td className="px-4 py-2">
                  {c.type === "FREE_SHIPPING" ? (
                    <span className="text-ink-soft">—</span>
                  ) : (
                    <input
                      type="number"
                      defaultValue={c.value}
                      onBlur={(e) => {
                        const num = Number(e.target.value);
                        if (num > 0 && num !== Number(c.value)) updateCoupon(c.id, { value: num });
                      }}
                      className="rang-input w-20 py-1"
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="∞"
                    defaultValue={c.usageLimit ?? ""}
                    onBlur={(e) => {
                      const raw = e.target.value;
                      const num = raw === "" ? null : Number(raw);
                      if (num !== c.usageLimit) updateCoupon(c.id, { usageLimit: num });
                    }}
                    className="rang-input w-20 py-1"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="date"
                    defaultValue={c.expiresAt ? c.expiresAt.slice(0, 10) : ""}
                    onBlur={(e) => {
                      const raw = e.target.value;
                      const iso = raw ? new Date(raw).toISOString() : null;
                      if (iso !== c.expiresAt) updateCoupon(c.id, { expiresAt: iso });
                    }}
                    className="rang-input py-1"
                  />
                </td>
                <td className="px-4 py-2">
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => updateCoupon(c.id, { active: !c.active })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      c.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-900/60"
                        : "bg-ink/10 text-ink-soft hover:bg-ink/15"
                    }`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => updateCoupon(c.id, { autoApply: !c.autoApply })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      c.autoApply
                        ? "bg-brand/10 text-brand hover:bg-brand/20"
                        : "bg-ink/10 text-ink-soft hover:bg-ink/15"
                    }`}
                  >
                    {c.autoApply ? "Auto" : "Manual"}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-4 text-sm text-ink-soft">No coupons yet.</p>}
      </div>
    </div>
  );
}
