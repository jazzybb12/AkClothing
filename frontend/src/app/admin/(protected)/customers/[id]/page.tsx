"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Order } from "@/lib/types";

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export default function AdminCustomerDetailPage() {
  const { token } = useAdminAuth();
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !params.id) return;
    apiFetch<{ customer: CustomerDetail; orders: Order[] }>(`/admin/customers/${params.id}`, { token })
      .then((res) => {
        setCustomer(res.customer);
        setOrders(res.orders);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load this customer"))
      .finally(() => setLoading(false));
  }, [token, params.id]);

  if (loading) return <p className="text-sm text-ink-soft">Loading...</p>;
  if (error || !customer) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error ?? "Customer not found"}</p>;
  }

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div>
      <Link href="/admin/customers" className="mb-4 inline-block text-sm text-brand hover:underline">
        ← Back to Customers
      </Link>
      <h1 className="mb-1 text-2xl font-bold">{customer.name}</h1>
      <p className="mb-6 text-sm text-ink-soft">
        {customer.email} · {customer.phone ?? "No phone on file"} · Joined{" "}
        {new Date(customer.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rang-card p-4">
          <p className="text-xs font-semibold uppercase text-ink-soft">Orders</p>
          <p className="mt-1 text-xl font-bold">{orders.length}</p>
        </div>
        <div className="rang-card p-4">
          <p className="text-xs font-semibold uppercase text-ink-soft">Lifetime Spend</p>
          <p className="mt-1 text-xl font-bold">Rs. {totalSpent.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Order History</h2>
      <table className="rang-card w-full text-left text-sm">
        <thead className="bg-ink/5 text-ink-soft">
          <tr>
            <th className="px-4 py-2">Order #</th>
            <th className="px-4 py-2">Placed</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-ink/10">
              <td className="px-4 py-2 font-medium">{o.orderNumber}</td>
              <td className="whitespace-nowrap px-4 py-2 text-ink-soft">
                {new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </td>
              <td className="px-4 py-2">Rs. {o.total}</td>
              <td className="px-4 py-2">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <p className="rang-card mt-2 p-4 text-sm text-ink-soft">No orders yet.</p>}
    </div>
  );
}
