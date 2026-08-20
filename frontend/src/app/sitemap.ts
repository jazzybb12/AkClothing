import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/api";
import { Product } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const { items } = await apiFetch<{ items: Product[] }>("/products?pageSize=100");
    const productRoutes: MetadataRoute.Sitemap = items.map((p) => ({
      url: `${siteUrl}/product/${p.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
