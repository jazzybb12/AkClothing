import Link from "next/link";
import { Collection } from "@/lib/types";

interface Props {
  collections: Collection[];
  eyebrow?: string;
  heading?: string;
}

export default function CollectionsSection({ collections, eyebrow = "Curated", heading = "Shop by Collection" }: Props) {
  if (collections.length === 0) return null;

  return (
    <section className="font-rang mt-16">
      <p className="rang-section-tag">{eyebrow}</p>
      <h2 className="mb-6 mt-1 font-display text-2xl font-bold text-ink">{heading}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.slug}`}
            className="rang-card group relative flex aspect-[4/3] items-end overflow-hidden p-4 transition-transform duration-200 hover:-translate-y-1"
          >
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-dark to-brand" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <span className="relative font-display text-lg font-bold text-white">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
