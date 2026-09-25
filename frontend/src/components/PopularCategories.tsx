"use client";

import Link from "next/link";
import { useState } from "react";
import { Category } from "@/lib/types";

const TILE_TONES = [
  "bg-brand text-white",
  "bg-jade text-white",
  "bg-accent text-[#241300]",
  "bg-plum text-white",
  // Fixed (non-theme-reactive) near-black tile — stays the dark anchor tone in both light
  // and dark mode, since `bg-ink`/`text-paper` would otherwise invert to a washed-out
  // cream block against the dark-mode page background.
  "bg-[#1b1209] text-[#FBF0DC]",
];

interface Props {
  categories: Category[];
  eyebrow?: string;
  heading?: string;
}

export default function PopularCategories({ categories, eyebrow = "Browse", heading = "Shop the Occasion" }: Props) {
  if (categories.length === 0) return null;
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const pageCount = Math.ceil(categories.length / pageSize);
  const shown = categories.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="font-rang mt-16">
      <p className="rang-section-tag">{eyebrow}</p>
      <h2 className="mb-6 mt-1 font-display text-2xl font-bold text-ink">{heading}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map((c, i) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            className={`group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl p-4 text-center text-sm font-bold transition duration-300 hover:-translate-y-1 ${
              TILE_TONES[((page - 1) * pageSize + i) % TILE_TONES.length]
            }`}
          >
            {c.imageUrl && <img src={c.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-100 transition-transform duration-500 group-hover:scale-105" />}
            {c.imageUrl && <div className="pointer-events-none absolute inset-0 bg-black/10" />}
            <span className="relative opacity-75 drop-shadow transition-all duration-300 group-hover:scale-105 group-hover:opacity-100">{c.name}</span>
          </Link>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rang-btn-outline disabled:opacity-40">
            Previous
          </button>
          <span className="text-ink-soft">Page {page} of {pageCount}</span>
          <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="rang-btn-outline disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </section>
  );
}
