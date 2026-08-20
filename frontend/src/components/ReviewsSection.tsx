"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Review } from "@/lib/types";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import StarRating from "./StarRating";

export default function ReviewsSection({ productId }: { productId: string }) {
  const { user, token } = useCustomerAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    apiFetch<Review[]>(`/reviews?productId=${productId}`).then((data) => {
      setReviews(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const myReview = reviews.find((r) => r.userId === user?.id);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    }
  }, [myReview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        token,
        body: JSON.stringify({ productId, rating, comment }),
      });
      if (!myReview) setComment("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    await apiFetch(`/reviews/${id}`, { method: "DELETE", token });
    load();
  }

  return (
    <section className="mt-16 border-t border-ink/15 pt-10">
      <p className="rang-section-tag">Feedback</p>
      <h2 className="mb-6 mt-1 text-2xl font-bold">Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>

      {user ? (
        <form onSubmit={handleSubmit} className="rang-card mb-8 max-w-lg p-5">
          <p className="mb-2 text-sm font-semibold">{myReview ? "Update your review" : "Write a review"}</p>
          <StarRating value={rating} size="md" onChange={setRating} />
          <textarea
            required
            minLength={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on this product..."
            rows={3}
            className="rang-input mt-3"
          />
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className="rang-btn-primary mt-3">
            {submitting ? "Saving..." : myReview ? "Update Review" : "Submit Review"}
          </button>
        </form>
      ) : (
        <p className="mb-8 text-sm text-ink-soft">
          <Link href="/account/login" className="underline">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-soft">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-soft">No reviews yet — be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rang-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.authorName ?? r.user.name}</p>
                  <StarRating value={r.rating} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-soft">{new Date(r.createdAt).toLocaleDateString()}</span>
                  {r.userId === user?.id && (
                    <button onClick={() => handleDelete(r.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
