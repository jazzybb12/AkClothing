import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { CollectionDetail } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

async function getCollection(slug: string): Promise<CollectionDetail | null> {
  try {
    return await apiFetch<CollectionDetail>(`/collections/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return { title: "Collection not found" };
  return {
    title: collection.name,
    description: collection.description ?? undefined,
  };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  return (
    <div className="font-rang mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="rang-section-tag">Collection</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">{collection.name}</h1>
      {collection.description && <p className="mt-2 max-w-2xl text-ink-soft">{collection.description}</p>}

      {collection.products.length === 0 ? (
        <p className="mt-8 text-ink-soft">No products in this collection yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {collection.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
