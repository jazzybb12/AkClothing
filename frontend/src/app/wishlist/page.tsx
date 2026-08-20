"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Product } from "@/lib/types";
import { useWishlist } from "@/lib/WishlistContext";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const { slugs } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      slugs.map((slug) =>
        apiFetch<Product>(`/products/${slug}`).catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        })
      )
    ).then((results) => {
      setProducts(results.filter((p): p is Product => p !== null));
      setLoading(false);
    });
  }, [slugs]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Wishlist</h1>
      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-ink-soft">
          Your wishlist is empty.{" "}
          <Link href="/shop" className="text-brand underline">
            Browse the shop
          </Link>{" "}
          and tap the heart on anything you like.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
