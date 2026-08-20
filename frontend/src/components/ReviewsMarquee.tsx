import { Review } from "@/lib/types";
import StarRating from "./StarRating";

interface Props {
  reviews: Review[];
  eyebrow?: string;
  heading?: string;
}

function ReviewCard({ review }: { review: Review }) {
  const name = review.authorName ?? review.user.name;
  return (
    <div className="rang-card w-72 shrink-0 p-4">
      <StarRating value={review.rating} />
      <p className="mt-2 line-clamp-3 text-sm text-ink">{review.comment}</p>
      <p className="mt-2 text-xs font-semibold text-ink-soft">
        {name}
        {review.product?.name && <span className="font-normal"> · {review.product.name}</span>}
      </p>
    </div>
  );
}

export default function ReviewsMarquee({ reviews, eyebrow = "From Our Customers", heading = "What They're Saying" }: Props) {
  if (reviews.length === 0) return null;

  return (
    <section className="font-rang mt-16">
      <p className="rang-section-tag">{eyebrow}</p>
      <h2 className="mb-6 mt-1 font-display text-2xl font-bold text-ink">{heading}</h2>
      <div className="overflow-hidden">
        <div className="ribbon-track-slow inline-flex w-max gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="inline-flex gap-4 pl-4 first:pl-0">
              {reviews.map((r) => (
                <ReviewCard key={`${i}-${r.id}`} review={r} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
