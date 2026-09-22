"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Order } from "@/lib/types";

const STATUSES: Order["status"][] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
const COURIERS: NonNullable<Order["courierProvider"]>[] = ["LEOPARDS", "POSTEX"];

export default function AdminOrdersPage() {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [courierChoice, setCourierChoice] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, Order>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<{ orders: number; items: number; shipped: number; delivered: number; returned: number } | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
    const query = `?page=${page}${statusFilter ? "&status=" + statusFilter : ""}`;
    const { items, total, summary } = await apiFetch<{ items: Order[]; total: number; summary: { orders: number; items: number; shipped: number; delivered: number; returned: number } }>(`/orders${query}`, { token });
    setOrders(items);
    setTotal(total);
    setSummary(summary);
    setCourierChoice((prev) => {
      const next = { ...prev };
      for (const o of items) {
        if (!next[o.id]) next[o.id] = o.courierProvider ?? "LEOPARDS";
      }
      return next;
    });
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not load orders"); } finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter, page]);

  async function changeStatus(orderId: string, status: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status, courierProvider: courierChoice[orderId] }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update order status");
    }
  }

  async function refreshTracking(orderId: string) {
    if (!token) return;
    setError(null);
    setRefreshing(orderId);
    try {
      await apiFetch(`/orders/${orderId}/refresh-tracking`, { method: "POST", token });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not refresh tracking status");
    } finally {
      setRefreshing(null);
    }
  }

  async function toggleExpand(orderId: string) {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!detailCache[orderId] && token) {
      setDetailLoading(orderId);
      try {
        const detail = await apiFetch<Order>(`/orders/${orderId}`, { token });
        setDetailCache((prev) => ({ ...prev, [orderId]: detail }));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load order detail");
      } finally {
        setDetailLoading(null);
      }
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <select
          value={statusFilter}
          aria-label="Filter orders by status"
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rang-input w-auto py-1.5"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5 grid overflow-hidden rounded-2xl border border-ink/15 bg-surface shadow-sm sm:grid-cols-3 xl:grid-cols-6">
        <div className="flex items-center gap-2 border-b border-ink/10 p-5 text-sm text-ink-soft">All time</div>
        {[["Orders", summary?.orders], ["Items ordered", summary?.items], ["Orders returned", summary?.returned], ["Orders shipped", summary?.shipped], ["Orders delivered", summary?.delivered]].map(([label, value]) => <div key={label} className="border-b border-l border-ink/10 p-5"><p className="mb-2 text-sm font-medium">{label}</p><p className="text-lg font-semibold">{value ?? "—"}</p></div>)}
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-ink/15 bg-surface shadow-sm">
        {loading ? <div role="status" className="p-16 text-center text-ink-soft">Loading orders...</div> : error ? <div className="p-12 text-center"><button onClick={load} className="rang-btn-outline">Try again</button></div> : orders.length > 0 ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="bg-ink/5 text-ink-soft">
            <tr>
              <th className="px-4 py-2">Order #</th>
              <th className="px-4 py-2">Placed</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2">Courier</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isExpanded = expandedId === o.id;
              const detail = detailCache[o.id];
              return (
                <Fragment key={o.id}>
                  <tr className="border-t border-ink/10">
                    <td className="px-4 py-2 font-medium">
                      <button onClick={() => toggleExpand(o.id)} className="flex items-center gap-1 hover:text-brand">
                        <svg
                          viewBox="0 0 20 20"
                          className={`h-3 w-3 fill-current transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        >
                          <path d="M7 5l6 5-6 5V5z" />
                        </svg>
                        {o.orderNumber}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-soft">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-2">
                      {o.customerName}
                      <div className="text-xs text-ink-soft">{o.customerPhone}</div>
                    </td>
                    <td className="px-4 py-2">Rs. {o.total}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.paymentMethod === "BANK_DEPOSIT"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-ink/10 text-ink-soft"
                        }`}
                      >
                        {o.paymentMethod === "BANK_DEPOSIT" ? "Bank Deposit" : "COD"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {o.courierTrackingNumber ? (
                        <div>
                          <p>
                            {o.courierProvider} #{o.courierTrackingNumber}
                          </p>
                          <p className="text-xs text-ink-soft">{o.courierStatus ?? "Status unknown"}</p>
                          <button
                            onClick={() => refreshTracking(o.id)}
                            disabled={refreshing === o.id}
                            className="mt-1 text-xs font-medium text-brand hover:underline disabled:opacity-50"
                          >
                            {refreshing === o.id ? "Refreshing..." : "Refresh Tracking"}
                          </button>
                        </div>
                      ) : (
                        <select
                          value={courierChoice[o.id] ?? "LEOPARDS"}
                          onChange={(e) => setCourierChoice((prev) => ({ ...prev, [o.id]: e.target.value }))}
                          className="rang-input py-1 text-xs"
                        >
                          {COURIERS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                        className="rang-input py-1"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-t border-ink/10 bg-ink/5">
                      <td colSpan={7} className="px-4 py-4">
                        {detailLoading === o.id || !detail ? (
                          <p className="text-sm text-ink-soft">Loading...</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase text-ink-soft">Items</p>
                              <ul className="space-y-1 text-sm">
                                {detail.items.map((item) => (
                                  <li key={item.id} className="flex justify-between">
                                    <span>
                                      {item.productNameSnapshot} ({item.size}/{item.color}) x{item.qty}
                                    </span>
                                    <span>Rs. {item.lineTotal}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-3 space-y-1 border-t border-ink/15 pt-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Subtotal</span>
                                  <span>Rs. {detail.subtotal}</span>
                                </div>
                                {Number(detail.discountAmount) > 0 && (
                                  <div className="flex justify-between text-green-600 dark:text-green-400">
                                    <span>Discount</span>
                                    <span>-Rs. {detail.discountAmount}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Shipping{detail.shippingMethodName ? ` (${detail.shippingMethodName})` : ""}</span>
                                  <span>Rs. {detail.shippingFee}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                  <span>Total</span>
                                  <span>Rs. {detail.total}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase text-ink-soft">Shipping Address</p>
                              <p className="text-sm">
                                {detail.shippingAddress.address}, {detail.shippingAddress.city}
                              </p>
                              <p className="mt-1 text-sm text-ink-soft">{detail.customerPhone}</p>
                              {detail.customerEmail && <p className="text-sm text-ink-soft">{detail.customerEmail}</p>}
                              <p className="mt-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                    detail.paymentMethod === "BANK_DEPOSIT"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                      : "bg-ink/10 text-ink-soft"
                                  }`}
                                >
                                  {detail.paymentMethod === "BANK_DEPOSIT" ? "Bank Deposit" : "Cash on Delivery"}
                                </span>
                              </p>
                              <p className="mt-3 text-xs text-ink-soft">
                                Placed {new Date(detail.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table></div> : <div className="flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center">
          <svg aria-hidden="true" viewBox="0 0 200 200" className="mb-8 h-44 w-44"><circle cx="100" cy="105" r="85" fill="#f0f1f2"/><path d="M48 22h80l26 27v116H48z" fill="white" stroke="#d4d6d8" strokeWidth="2"/><path d="M128 22v28h26" fill="#d4d6d8"/><rect x="62" y="40" width="32" height="7" rx="3" fill="#477cab"/><rect x="62" y="70" width="34" height="34" rx="3" fill="#d9efeb"/><path d="M67 84h24a12 12 0 0 1-24 0" fill="#459d97"/><path d="M111 78h27m-27 10h20m-27 36h27m-27 10h20" stroke="#d4d6d8" strokeWidth="5" strokeLinecap="round"/><rect x="62" y="116" width="34" height="30" rx="3" fill="#f5dfd6"/><path d="M70 139l5-18h9l5 18z" fill="#d78469"/><path d="M24 152h53l7 20h32l7-20h53a85 85 0 0 1-152 0" fill="#399b96"/></svg>
          <h2 className="mb-2 text-lg font-semibold">{statusFilter ? "No matching orders" : "Your orders will show here"}</h2>
          <p className="max-w-md text-sm leading-6 text-ink-soft">{statusFilter ? "Choose another status to see more orders." : "When a customer places an order, you can manage its items, shipping, and delivery status here."}</p>
          {statusFilter ? <button className="rang-btn-outline mt-6" onClick={() => { setStatusFilter(""); setPage(1); }}>View all orders</button> : <a href="/" target="_blank" rel="noreferrer" className="rang-btn-primary mt-6">Visit your store</a>}
        </div>}
        {!loading && !error && total > 0 && <div className="flex items-center justify-between border-t border-ink/10 px-5 py-4 text-sm"><span>{total} orders · Page {page} of {Math.ceil(total / 25)}</span><div className="flex gap-3"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40">Previous</button><button disabled={page * 25 >= total} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Next</button></div></div>}
      </div>
    </div>
  );
}
