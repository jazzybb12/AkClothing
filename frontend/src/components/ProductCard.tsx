"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useWishlist } from "@/lib/WishlistContext";
import StarRating from "./StarRating";

const LOW_STOCK_THRESHOLD = 5;

export default function ProductCard({ product }: { product: Product }) {
  const { isWishlisted, toggle } = useWishlist();
  const image = product.images[0]?.url;
  const inStockVariants = product.variants.filter((v) => !v.isOutOfStock && v.stockQty > 0);
  const anyInStock = inStockVariants.length > 0;
  const totalStock = inStockVariants.reduce((sum, v) => sum + v.stockQty, 0);
  const lowStock = anyInStock && totalStock <= LOW_STOCK_THRESHOLD;
  const wishlisted = isWishlisted(product.slug);

  return (
    <Link href={`/product/${product.slug}`} className="rang-card group block overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:rotate-[-0.3deg]">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink/5">
        {image ? (
          <Image
            src={image}
            alt={product.images[0]?.altText ?? product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-soft">No image</div>
        )}

        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(product.slug);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-sm transition hover:scale-110 hover:bg-surface"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${wishlisted ? "fill-rose-600 stroke-rose-600" : "fill-none stroke-ink"}`}
            strokeWidth="2"
          >
            <path d="M12 21s-6.7-4.35-9.3-8.3C1 10 1.6 6.5 4.6 5.1 7 4 9.5 4.8 12 7.5c2.5-2.7 5-3.5 7.4-2.4 3 1.4 3.6 4.9 1.9 7.6C18.7 16.65 12 21 12 21z" />
          </svg>
        </button>

        {!anyInStock && (
          <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-paper">
            Out of Stock
          </span>
        )}
        {anyInStock && lowStock && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-[#241300]">
            Only {totalStock} left
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-display text-sm text-ink transition-colors group-hover:text-brand">{product.name}</p>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <StarRating value={product.avgRating ?? 0} />
            <span className="text-xs text-ink-soft">({product.reviewCount})</span>
          </div>
        )}
        <p className="mt-1 text-sm font-bold text-brand">Rs. {product.basePrice}</p>
      </div>
    </Link>
  );
}
