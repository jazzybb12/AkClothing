"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, apiFetchBlob } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import DateRangePicker, { DateRangeValue, DEFAULT_RANGE } from "@/components/admin/DateRangePicker";

interface ProductRow {
  productId: string;
  name: string;
  slug: string | null;
  qtySold: number;
  revenue: number;
}

interface CustomerRow {
  userId: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
}

const PAGE_SIZE = 10;

function rangeFromSearchParams(searchParams: URLSearchParams): DateRangeValue {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return DEFAULT_RANGE;
  return { from, to, label: from === to ? from : `${from} – ${to}` };
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsContent />
    </Suspense>
  );
}

function ReportsContent() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);

  const [products, setProducts] = useState<{ items: ProductRow[]; total: number }>({ items: [], total: 0 });
  const [productPage, setProductPage] = useState(1);
  const [customers, setCustomers] = useState<{ items: CustomerRow[]; total: number; repeatPurchaseRate: number }>({
    items: [],
    total: 0,
    repeatPurchaseRate: 0,
  });
  const [customerPage, setCustomerPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRange(rangeFromSearchParams(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRangeChange(next: DateRangeValue) {
    setRange(next);
    setProductPage(1);
    setCustomerPage(1);
    router.replace(`/admin/reports?from=${next.from}&to=${next.to}`);
  }

  useEffect(() => {
    if (!token) return;
    const params = `from=${range.from}&to=${range.to}&page=${productPage}&pageSize=${PAGE_SIZE}`;
    apiFetch<{ items: ProductRow[]; total: number }>(`/admin/reports/products?${params}`, { token }).then(setProducts);
  }, [token, range.from, range.to, productPage]);

  useEffect(() => {
    if (!token) return;
    const params = `from=${range.from}&to=${range.to}&page=${customerPage}&pageSize=${PAGE_SIZE}`;
    apiFetch<{ items: CustomerRow[]; total: number; repeatPurchaseRate: number }>(
      `/admin/reports/customers?${params}`,
      { token }
    ).then(setCustomers);
  }, [token, range.from, range.to, customerPage]);

  async function downloadCsv(path: string, filename: string) {
    if (!token) return;
    setDownloading(filename);
    setError(null);
    try {
      const blob = await apiFetchBlob(path, { token });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not export CSV");
    } finally {
      setDownloading(null);
    }
  }

  const productTotalPages = Math.max(1, Math.ceil(products.total / PAGE_SIZE));
  const customerTotalPages = Math.max(1, Math.ceil(customers.total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <DateRangePicker value={range} onChange={handleRangeChange} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Product Performance</h2>
          <button
            onClick={() => downloadCsv(`/admin/reports/products?from=${range.from}&to=${range.to}&format=csv`, "product-performance.csv")}
            disabled={downloading === "product-performance.csv"}
            className="rounded-lg border border-ink/25 px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {downloading === "product-performance.csv" ? "Exporting..." : "Export CSV"}
          </button>
        </div>
        <table className="rang-card w-full text-left text-sm">
          <thead className="bg-ink/5 text-ink-soft">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Qty Sold</th>
              <th className="px-4 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {products.items.map((p) => (
              <tr key={p.productId} className="border-t border-ink/10">
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2">{p.qtySold}</td>
                <td className="px-4 py-2">Rs. {p.revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.items.length === 0 && (
          <p className="rang-card mt-2 p-4 text-sm text-ink-soft">No sales in this range.</p>
        )}
        {products.total > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-end gap-3 text-sm">
            <button
              onClick={() => setProductPage((p) => Math.max(1, p - 1))}
              disabled={productPage <= 1}
              className="rounded-lg border border-ink/25 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-ink-soft">
              Page {productPage} of {productTotalPages}
            </span>
            <button
              onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
              disabled={productPage >= productTotalPages}
              className="rounded-lg border border-ink/25 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Customer Report{" "}
            <span className="text-sm font-normal text-ink-soft">
              ({customers.repeatPurchaseRate}% repeat purchase rate)
            </span>
          </h2>
          <button
            onClick={() => downloadCsv(`/admin/reports/customers?from=${range.from}&to=${range.to}&format=csv`, "customer-report.csv")}
            disabled={downloading === "customer-report.csv"}
            className="rounded-lg border border-ink/25 px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {downloading === "customer-report.csv" ? "Exporting..." : "Export CSV"}
          </button>
        </div>
        <table className="rang-card w-full text-left text-sm">
          <thead className="bg-ink/5 text-ink-soft">
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Orders</th>
              <th className="px-4 py-2">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.items.map((c) => (
              <tr key={c.userId} className="border-t border-ink/10">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2">{c.email}</td>
                <td className="px-4 py-2">{c.orderCount}</td>
                <td className="px-4 py-2">Rs. {c.totalSpent.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.items.length === 0 && (
          <p className="rang-card mt-2 p-4 text-sm text-ink-soft">No customer orders in this range.</p>
        )}
        {customers.total > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-end gap-3 text-sm">
            <button
              onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
              disabled={customerPage <= 1}
              className="rounded-lg border border-ink/25 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-ink-soft">
              Page {customerPage} of {customerTotalPages}
            </span>
            <button
              onClick={() => setCustomerPage((p) => Math.min(customerTotalPages, p + 1))}
              disabled={customerPage >= customerTotalPages}
              className="rounded-lg border border-ink/25 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
