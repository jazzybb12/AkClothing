"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function ShopFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/shop?${params.toString()}`);
  }

  function applyPriceRange(e: React.FormEvent) {
    e.preventDefault();
    navigate({ minPrice: minPrice || null, maxPrice: maxPrice || null });
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <form onSubmit={applyPriceRange} className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Min Rs.</label>
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="rang-input w-24 py-1.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Max Rs.</label>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rang-input w-24 py-1.5"
          />
        </div>
        <button type="submit" className="rang-btn-outline px-3 py-1.5">
          Apply
        </button>
      </form>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Sort by</label>
        <select
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => navigate({ sort: e.target.value === "newest" ? null : e.target.value })}
          className="rang-input py-1.5"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
