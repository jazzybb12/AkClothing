"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

const PAGE_SIZE = 20;

export default function AdminCustomersPage() {
  const { token } = useAdminAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(currentPage: number, currentSearch: string) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(currentPage), pageSize: String(PAGE_SIZE) });
      if (currentSearch) params.set("search", currentSearch);
      const res = await apiFetch<{ items: Customer[]; total: number }>(`/admin/customers?${params}`, { token });
      setCustomers(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  // Debounce search: reset to page 1 and reload after the user pauses typing.
  useEffect(() => {
    const t = setTimeout(() => {
      if (page === 1) load(1, search);
      else setPage(1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone..."
          className="rang-input w-64"
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : (
        <>
          <table className="rang-card w-full text-left text-sm">
            <thead className="bg-ink/5 text-ink-soft">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Joined</th>
                <th className="px-4 py-2">Orders</th>
                <th className="px-4 py-2">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-ink/10">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/admin/customers/${c.id}`} className="hover:text-brand hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2">{c.phone ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-ink-soft">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2">{c.orderCount}</td>
                  <td className="px-4 py-2">Rs. {c.totalSpent.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <p className="rang-card mt-2 p-4 text-sm text-ink-soft">No customers found.</p>
          )}

          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-ink-soft">
              {total} customer{total === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-ink/25 px-3 py-1.5 font-medium transition hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-ink-soft">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-ink/25 px-3 py-1.5 font-medium transition hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
