"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Product, ProductVariant } from "@/lib/types";

export default function AdminProductsPage() {
  const { token } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    setLoading(true);
    const { items } = await apiFetch<{ items: Product[] }>("/products?pageSize=100", { token });
    setProducts(items);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function updatePrice(productId: string, basePrice: number) {
    if (!token) return;
    await apiFetch(`/products/${productId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ basePrice }),
    });
    load();
  }

  async function toggleFeatured(product: Product) {
    if (!token) return;
    await apiFetch(`/products/${product.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ featured: !product.featured }),
    });
    load();
  }

  async function toggleVariant(productId: string, variant: ProductVariant) {
    if (!token) return;
    await apiFetch(`/products/${productId}/variants/${variant.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ isOutOfStock: !variant.isOutOfStock }),
    });
    load();
  }

  async function updateStock(productId: string, variantId: string, stockQty: number) {
    if (!token) return;
    await apiFetch(`/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ stockQty, isOutOfStock: stockQty <= 0 }),
    });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="rang-btn-primary">
          + Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-ink-soft">No products yet. Click &quot;Add Product&quot; to create your first one.</p>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="rang-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/products/${p.id}/edit`} className="font-semibold transition-colors hover:text-brand">
                  {p.name}
                </Link>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink-soft">Price Rs.</span>
                  <input
                    type="number"
                    defaultValue={p.basePrice}
                    onBlur={(e) => {
                      const value = Number(e.target.value);
                      if (value !== Number(p.basePrice)) updatePrice(p.id, value);
                    }}
                    className="rang-input w-24 py-1"
                  />
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.status === "ACTIVE"
                        ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                        : "bg-ink/10 text-ink-soft"
                    }`}
                  >
                    {p.status}
                  </span>
                  <button
                    onClick={() => toggleFeatured(p)}
                    title="Show on the homepage's Best of the Bazaar section"
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      p.featured ? "bg-brand/10 text-brand hover:bg-brand/20" : "bg-ink/10 text-ink-soft hover:bg-ink/15"
                    }`}
                  >
                    {p.featured ? "★ Featured" : "☆ Feature"}
                  </button>
                  <Link href={`/admin/products/${p.id}/edit`} className="rang-btn-outline px-3 py-1 text-xs">
                    Edit
                  </Link>
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-ink-soft">
                  <tr>
                    <th className="pb-2">Size</th>
                    <th className="pb-2">Color</th>
                    <th className="pb-2">Stock</th>
                    <th className="pb-2">Out of Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {p.variants.map((v) => (
                    <tr key={v.id} className="border-t border-ink/10">
                      <td className="py-1.5">{v.size}</td>
                      <td className="py-1.5">{v.color}</td>
                      <td className="py-1.5">
                        <input
                          type="number"
                          min={0}
                          defaultValue={v.stockQty}
                          onBlur={(e) => {
                            const value = Number(e.target.value);
                            if (value !== v.stockQty) updateStock(p.id, v.id, value);
                          }}
                          className="rang-input w-20 py-1"
                        />
                      </td>
                      <td className="py-1.5">
                        <button
                          onClick={() => toggleVariant(p.id, v)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                            v.isOutOfStock
                              ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
                              : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-900/60"
                          }`}
                        >
                          {v.isOutOfStock ? "Out of Stock" : "In Stock"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
