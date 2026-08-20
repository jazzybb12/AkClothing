"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import StarRating from "@/components/StarRating";

interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  authorName: string | null;
  showOnHomepage: boolean;
  createdAt: string;
  user: { name: string; email: string };
  product: { name: string; slug: string };
}

interface ProductOption {
  id: string;
  name: string;
}

export default function AdminReviewsPage() {
  const { token } = useAdminAuth();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [productId, setProductId] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setReviews(await apiFetch<AdminReview[]>("/admin/reviews", { token }));
    setLoading(false);
  }

  useEffect(() => {
    load();
    apiFetch<{ items: ProductOption[] }>("/products?pageSize=100").then(({ items }) => {
      setProducts(items);
      if (items[0]) setProductId(items[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleDelete(id: string) {
    if (!token) return;
    await apiFetch(`/reviews/${id}`, { method: "DELETE", token });
    load();
  }

  async function toggleHomepage(review: AdminReview) {
    if (!token) return;
    await apiFetch(`/admin/reviews/${review.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ showOnHomepage: !review.showOnHomepage }),
    });
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/admin/reviews", {
        method: "POST",
        token,
        body: JSON.stringify({ productId, authorName, rating, comment }),
      });
      setAuthorName("");
      setComment("");
      setRating(5);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reviews</h1>

      <div className="rang-card mb-8 max-w-lg p-5">
        <h2 className="mb-1 font-semibold">Write a Review</h2>
        <p className="mb-4 text-xs text-ink-soft">
          Add a review under a display name of your choice — useful for a new product with no customer feedback yet.
          It appears on the storefront exactly like any other review.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="rang-input">
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reviewer Name</label>
            <input
              required
              minLength={2}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Ayesha K."
              className="rang-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Comment</label>
            <textarea
              required
              minLength={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="rang-input"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={submitting || !productId} className="rang-btn-primary">
            {submitting ? "Posting..." : "Post Review"}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-soft">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rang-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/product/${r.product.slug}`} target="_blank" className="font-semibold transition-colors hover:text-brand">
                    {r.product.name}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {r.authorName ? (
                      <>
                        {r.authorName}{" "}
                        <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-dark">
                          Seeded by {r.user.name}
                        </span>
                      </>
                    ) : (
                      `${r.user.name} (${r.user.email})`
                    )}{" "}
                    — {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <StarRating value={r.rating} />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleHomepage(r)}
                    title="Show in the homepage reviews marquee"
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      r.showOnHomepage ? "bg-brand/10 text-brand hover:bg-brand/20" : "bg-ink/10 text-ink-soft hover:bg-ink/15"
                    }`}
                  >
                    {r.showOnHomepage ? "★ On Homepage" : "☆ Show on Homepage"}
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
