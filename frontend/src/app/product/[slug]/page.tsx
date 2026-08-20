import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Product } from "@/lib/types";
import ProductDetail from "@/components/ProductDetail";
import RelatedProducts from "@/components/RelatedProducts";

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await apiFetch<Product>(`/products/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// Same-category products first; if the category has no other items yet (common for a
// small/young catalog), falls back to other recent active products so the section isn't
// silently empty rather than genuinely having nothing relevant to show.
async function getRelatedProducts(categorySlug: string, excludeId: string): Promise<Product[]> {
  try {
    const { items } = await apiFetch<{ items: Product[] }>(`/products?category=${categorySlug}&pageSize=5`);
    const sameCategory = items.filter((p) => p.id !== excludeId).slice(0, 4);
    if (sameCategory.length > 0) return sameCategory;

    const { items: fallback } = await apiFetch<{ items: Product[] }>(`/products?pageSize=5`);
    return fallback.filter((p) => p.id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description.slice(0, 155),
    openGraph: {
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.description.slice(0, 155),
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category.slug, product.id);
  const anyInStock = product.variants.some((v) => !v.isOutOfStock && v.stockQty > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.basePrice,
      availability: anyInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail product={product} />
      <RelatedProducts products={related} />
    </div>
  );
}
