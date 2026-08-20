import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Category, Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";

export const metadata = { title: "Shop" };

interface Props {
  searchParams: {
    category?: string;
    size?: string;
    color?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

async function getCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>("/categories");
  } catch {
    return [];
  }
}

async function getProducts(params: Props["searchParams"]): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.size) query.set("size", params.size);
  if (params.color) query.set("color", params.color);
  if (params.q) query.set("q", params.q);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.sort) query.set("sort", params.sort);
  try {
    const { items } = await apiFetch<{ items: Product[] }>(`/products?${query.toString()}`);
    return items;
  } catch {
    return [];
  }
}

export default async function ShopPage({ searchParams }: Props) {
  const [categories, products] = await Promise.all([getCategories(), getProducts(searchParams)]);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
      <aside className="md:sticky md:top-24 md:self-start">
        <div className="rang-card p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Category</h3>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="/shop"
                className={`block rounded px-2 py-1 transition-colors ${!searchParams.category ? "bg-brand/5 font-semibold text-brand" : "text-ink-soft hover:text-brand"}`}
              >
                All
              </Link>
            </li>
            {categories
              .filter((c) => !c.parentId)
              .map((parent) => (
                <li key={parent.id}>
                  <Link
                    href={`/shop?category=${parent.slug}`}
                    className={`block rounded px-2 py-1 transition-colors ${searchParams.category === parent.slug ? "bg-brand/5 font-semibold text-brand" : "text-ink-soft hover:text-brand"}`}
                  >
                    {parent.name}
                  </Link>
                  {categories.filter((c) => c.parentId === parent.id).length > 0 && (
                    <ul className="mt-1 space-y-1 border-l border-ink/15 pl-3">
                      {categories
                        .filter((c) => c.parentId === parent.id)
                        .map((c) => (
                          <li key={c.id}>
                            <Link
                              href={`/shop?category=${c.slug}`}
                              className={`block rounded px-2 py-1 transition-colors ${searchParams.category === c.slug ? "font-semibold text-brand" : "text-ink-soft hover:text-brand"}`}
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </aside>

      <div className="md:col-span-3">
        <h1 className="mb-4 text-2xl font-bold">
          {searchParams.q ? `Search results for "${searchParams.q}"` : "Shop"}
        </h1>
        <div className="rang-card mb-6 p-4">
          <ShopFilters />
        </div>
        {products.length === 0 ? (
          <p className="text-ink-soft">No products match these filters.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
