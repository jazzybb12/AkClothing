import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Collection } from "@/lib/types";

async function getCollections(): Promise<Collection[]> {
  try {
    return await apiFetch<Collection[]>("/collections");
  } catch {
    return [];
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 font-rang">
      <p className="rang-section-tag">The curated edit</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-ink">Collections</h1>
      <p className="mt-3 max-w-xl text-sm text-ink-soft">Explore our considered edits, shaped around texture, occasion, and everyday style.</p>
      {collections.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-ink/15 p-10 text-center text-ink-soft">Collections will appear here soon.</div>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.slug}`} className="group">
              <div className="overflow-hidden rounded-2xl bg-ink/5 aspect-[4/5]">
                {collection.imageUrl ? <img src={collection.imageUrl} alt={collection.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="h-full w-full bg-brand/20" />}
              </div>
              <h2 className="mt-4 text-xl font-semibold transition-colors group-hover:text-brand">{collection.name}</h2>
              {collection.description && <p className="mt-2 text-sm text-ink-soft">{collection.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
