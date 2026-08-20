"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Order } from "@/lib/types";

const STATUS_LABELS: Record<Order["status"], string> = {
  PENDING: "Pending confirmation",
  CONFIRMED: "Confirmed — courier booked",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackForm />
    </Suspense>
  );
}

function TrackForm() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") ?? "");
  const [phone, setPhone] = useState(searchParams.get("phone") ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<Order>(
        `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      );
      setOrder(result);
    } catch (err) {
      setOrder(null);
      setError(err instanceof ApiError ? err.message : "Could not find that order");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    setCancelling(true);
    setError(null);
    try {
      const updated = await apiFetch<Order>(`/orders/${order.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setOrder(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel this order");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Track Your Order</h1>
      <form onSubmit={handleSubmit} className="rang-card space-y-3 p-6">
        <input
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order number (e.g. ORD-1001)"
          className="rang-input"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number used at checkout"
          className="rang-input"
        />
        <button type="submit" disabled={loading} className="rang-btn-primary w-full">
          {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {order && (
        <div className="rang-card mt-6 animate-fade-in p-5 text-sm">
          <p className="font-semibold">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-ink-soft">
            Placed {new Date(order.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className="mt-1">Status: {STATUS_LABELS[order.status]}</p>
          <p className="mt-1">Shipping: {order.shippingMethodName ?? "Standard"}</p>
          <p className="mt-1">Payment: {order.paymentMethod === "BANK_DEPOSIT" ? "Bank Deposit" : "Cash on Delivery"}</p>
          {order.courierTrackingNumber && (
            <p className="mt-1">
              Courier: {order.courierProvider} — Tracking #{order.courierTrackingNumber}
            </p>
          )}
          <p className="mt-1 font-semibold text-brand">Total: Rs. {order.total}</p>
          {order.status === "PENDING" && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-3 text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
