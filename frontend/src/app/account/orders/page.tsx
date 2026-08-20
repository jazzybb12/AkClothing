"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { Order } from "@/lib/types";

export default function AccountOrdersPage() {
  const { user, token, loading, logout } = useCustomerAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/account/login");
    }
  }, [loading, user, router]);

  function loadOrders() {
    if (!token) return;
    apiFetch<Order[]>("/orders/mine", { token }).then((data) => {
      setOrders(data);
      setOrdersLoading(false);
    });
  }

  useEffect(loadOrders, [token]);

  async function handleCancel(orderId: string) {
    if (!token) return;
    setError(null);
    setCancellingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/cancel`, { method: "POST", token, body: JSON.stringify({}) });
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel this order");
    } finally {
      setCancellingId(null);
    }
  }

  if (loading || !user) {
    return <p className="text-sm text-ink-soft">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-ink-soft">
            {user.name} — {user.email}
          </p>
        </div>
        <button
          onClick={() => logout().then(() => router.push("/"))}
          className="text-sm text-ink-soft transition hover:text-brand hover:underline"
        >
          Log out
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {ordersLoading ? (
        <p className="text-sm text-ink-soft">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-ink-soft">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rang-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-ink-soft">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">{o.status}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                {o.items.map((item) => (
                  <li key={item.id}>
                    {item.productNameSnapshot} ({item.size}/{item.color}) x{item.qty}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Total: Rs. {o.total}</p>
                {o.status === "PENDING" && (
                  <button
                    onClick={() => handleCancel(o.id)}
                    disabled={cancellingId === o.id}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                  >
                    {cancellingId === o.id ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
