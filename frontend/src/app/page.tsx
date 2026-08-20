import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Banner, Category, Collection, Product, Review } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import PopularCategories from "@/components/PopularCategories";
import CollectionsSection from "@/components/CollectionsSection";
import ReviewsMarquee from "@/components/ReviewsMarquee";

const DEFAULT_BAZAAR_LIMIT = 8;

interface HomepageSettings {
  occasionEyebrow: string | null;
  occasionHeading: string | null;
  bazaarEyebrow: string | null;
  bazaarHeading: string | null;
  bazaarLimit: number | null;
  collectionsEyebrow: string | null;
  collectionsHeading: string | null;
  reviewsEyebrow: string | null;
  reviewsHeading: string | null;
}

// Prefers admin-curated "featured" products; if none are marked featured, falls back to
// the most recent active products so the section is never empty out of the box.
async function getTrendingProducts(limit: number): Promise<Product[]> {
  try {
    const { items } = await apiFetch<{ items: Product[] }>(`/products?featured=true&pageSize=${limit}`);
    if (items.length > 0) return items;
    const fallback = await apiFetch<{ items: Product[] }>(`/products?pageSize=${limit}`);
    return fallback.items;
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>("/categories");
  } catch {
    return [];
  }
}

async function getBanners(): Promise<Banner[]> {
  try {
    return await apiFetch<Banner[]>("/banners");
  } catch {
    return [];
  }
}

async function getHomepageSettings(): Promise<HomepageSettings> {
  try {
    return await apiFetch<HomepageSettings>("/settings");
  } catch {
    return {
      occasionEyebrow: null,
      occasionHeading: null,
      bazaarEyebrow: null,
      bazaarHeading: null,
      bazaarLimit: null,
      collectionsEyebrow: null,
      collectionsHeading: null,
      reviewsEyebrow: null,
      reviewsHeading: null,
    };
  }
}

async function getCollections(): Promise<Collection[]> {
  try {
    return await apiFetch<Collection[]>("/collections");
  } catch {
    return [];
  }
}

async function getHomepageReviews(): Promise<Review[]> {
  try {
    return await apiFetch<Review[]>("/reviews/homepage");
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, banners, settings, collections, reviews] = await Promise.all([
    getCategories(),
    getBanners(),
    getHomepageSettings(),
    getCollections(),
    getHomepageReviews(),
  ]);
  const bazaarLimit = settings.bazaarLimit ?? DEFAULT_BAZAAR_LIMIT;
  const products = await getTrendingProducts(bazaarLimit);

  return (
    <div>
      <HeroCarousel banners={banners} />

      <PopularCategories
        categories={categories}
        eyebrow={settings.occasionEyebrow ?? "Browse"}
        heading={settings.occasionHeading ?? "Shop the Occasion"}
      />

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="rang-section-tag">{settings.bazaarEyebrow ?? "Trending Now"}</p>
            <h2 className="mb-6 mt-1 text-2xl font-bold text-ink">{settings.bazaarHeading ?? "Best of the Bazaar"}</h2>
          </div>
        </div>
        {products.length === 0 ? (
          <p className="text-ink-soft">
            No products yet — add your first product from the{" "}
            <Link href="/admin" className="underline">
              admin panel
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <CollectionsSection
        collections={collections}
        eyebrow={settings.collectionsEyebrow ?? "Curated"}
        heading={settings.collectionsHeading ?? "Shop by Collection"}
      />

      <ReviewsMarquee
        reviews={reviews}
        eyebrow={settings.reviewsEyebrow ?? "From Our Customers"}
        heading={settings.reviewsHeading ?? "What They're Saying"}
      />
    </div>
  );
}
