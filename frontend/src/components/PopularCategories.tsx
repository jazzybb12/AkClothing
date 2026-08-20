import Link from "next/link";
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

  return (
    <section className="font-rang mt-16">
      <p className="rang-section-tag">{eyebrow}</p>
      <h2 className="mb-6 mt-1 font-display text-2xl font-bold text-ink">{heading}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((c, i) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl p-4 text-center text-sm font-bold transition duration-300 hover:-translate-y-1 ${
              TILE_TONES[i % TILE_TONES.length]
            }`}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{ backgroundImage: "repeating-linear-gradient(60deg, currentColor 0 3px, transparent 3px 18px)" }}
            />
            <span className="relative">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
