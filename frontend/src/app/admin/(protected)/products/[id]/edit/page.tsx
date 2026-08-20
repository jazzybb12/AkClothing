"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { uploadImage } from "@/lib/cloudinary";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Category, Product } from "@/lib/types";

interface NewVariantRow {
  size: string;
  color: string;
  sku: string;
  stockQty: number;
}

// Flattens the department/sub-category tree into a single list, e.g. "Men (General)",
// "Men — Shirts", "Kids — Boys" — every category visible at once in one dropdown.
function buildCategoryOptions(categories: Category[]) {
  const departments = categories.filter((c) => !c.parentId);
  const options: { id: string; label: string }[] = [];
  for (const dept of departments) {
    options.push({ id: dept.id, label: `${dept.name} (General)` });
    for (const child of categories.filter((c) => c.parentId === dept.id)) {
      options.push({ id: child.id, label: `${dept.name} — ${child.name}` });
    }
  }
  return options;
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariantRow>({ size: "", color: "", sku: "", stockQty: 0 });

  async function load() {
    if (!token) return;
    const [p, cats] = await Promise.all([
      apiFetch<Product>(`/products/id/${id}`, { token }),
      apiFetch<Category[]>("/categories"),
    ]);
    setProduct(p);
    setCategories(cats);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !product) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiFetch(`/products/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          basePrice: Number(product.basePrice),
          categoryId: product.category.id,
          status: product.status,
          featured: product.featured,
          seoTitle: product.seoTitle || undefined,
          seoDescription: product.seoDescription || undefined,
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  async function saveVariant(variantId: string, patch: Record<string, unknown>) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/products/${id}/variants/${variantId}`, { method: "PATCH", token, body: JSON.stringify(patch) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update variant");
    }
  }

  async function deleteVariant(variantId: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/products/${id}/variants/${variantId}`, { method: "DELETE", token });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove variant");
    }
  }

  async function addVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/products/${id}/variants`, {
        method: "POST",
        token,
        body: JSON.stringify(newVariant),
      });
      setNewVariant({ size: "", color: "", sku: "", stockQty: 0 });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add variant");
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !e.target.files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(Array.from(e.target.files).map((file) => uploadImage(file, token)));
      for (const url of urls) {
        await apiFetch(`/products/${id}/images`, { method: "POST", token, body: JSON.stringify({ url }) });
      }
      load();
    } catch {
      setError("Image upload failed — check your Cloudinary settings.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(imageId: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/products/${id}/images/${imageId}`, { method: "DELETE", token });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove image");
    }
  }

  if (!product) {
    return <p className="text-sm text-ink-soft">Loading...</p>;
  }

  const categoryOptions = buildCategoryOptions(categories);

  function handleCategoryChange(catId: string) {
    const cat = categories.find((c) => c.id === catId);
    if (cat && product) setProduct({ ...product, category: cat });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <button
          onClick={() => router.push("/admin/products")}
          className="text-sm text-ink-soft transition hover:text-brand hover:underline"
        >
          Back to Products
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSaveDetails} className="space-y-4 rang-card p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Product Name</label>
          <input
            required
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            value={product.description}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            rows={4}
            className="rang-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Base Price (Rs.)</label>
            <input
              required
              type="number"
              value={product.basePrice}
              onChange={(e) => setProduct({ ...product, basePrice: e.target.value })}
              className="rang-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select value={product.category.id} onChange={(e) => handleCategoryChange(e.target.value)} className="rang-input">
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={product.status}
            onChange={(e) => setProduct({ ...product, status: e.target.value as "ACTIVE" | "DRAFT" })}
            className="rang-input"
          >
            <option value="ACTIVE">Active (visible on the store)</option>
            <option value="DRAFT">Draft (hidden)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={product.featured}
            onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
            className="h-4 w-4 accent-brand"
          />
          Feature on homepage (&quot;Best of the Bazaar&quot;)
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">SEO Title (optional)</label>
          <input
            value={product.seoTitle ?? ""}
            onChange={(e) => setProduct({ ...product, seoTitle: e.target.value })}
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">SEO Description (optional)</label>
          <textarea
            value={product.seoDescription ?? ""}
            onChange={(e) => setProduct({ ...product, seoDescription: e.target.value })}
            rows={2}
            className="rang-input"
          />
        </div>

        {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
        <button type="submit" disabled={saving} className="rang-btn-primary">
          {saving ? "Saving..." : "Save Details"}
        </button>
      </form>

      <div className="mt-6 rang-card p-5">
        <h2 className="mb-3 font-semibold">Sizes, Colors &amp; Stock</h2>
        <div className="space-y-2">
          {product.variants.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-2">
              <input
                defaultValue={v.size}
                onBlur={(e) => e.target.value !== v.size && saveVariant(v.id, { size: e.target.value })}
                placeholder="Size"
                className="rang-input w-20 py-1.5"
              />
              <input
                defaultValue={v.color}
                onBlur={(e) => e.target.value !== v.color && saveVariant(v.id, { color: e.target.value })}
                placeholder="Color"
                className="rang-input w-28 py-1.5"
              />
              <input
                defaultValue={v.sku}
                onBlur={(e) => e.target.value !== v.sku && saveVariant(v.id, { sku: e.target.value })}
                placeholder="SKU"
                className="rang-input w-32 py-1.5"
              />
              <input
                type="number"
                defaultValue={v.stockQty}
                onBlur={(e) => Number(e.target.value) !== v.stockQty && saveVariant(v.id, { stockQty: Number(e.target.value) })}
                placeholder="Stock"
                className="rang-input w-20 py-1.5"
              />
              <button
                onClick={() => saveVariant(v.id, { isOutOfStock: !v.isOutOfStock })}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  v.isOutOfStock
                    ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
                    : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-900/60"
                }`}
              >
                {v.isOutOfStock ? "Out of Stock" : "In Stock"}
              </button>
              <button onClick={() => deleteVariant(v.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                Remove
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={addVariant} className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
          <input
            required
            placeholder="Size"
            value={newVariant.size}
            onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
            className="rang-input w-20 py-1.5"
          />
          <input
            required
            placeholder="Color"
            value={newVariant.color}
            onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
            className="rang-input w-28 py-1.5"
          />
          <input
            required
            placeholder="SKU"
            value={newVariant.sku}
            onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
            className="rang-input w-32 py-1.5"
          />
          <input
            type="number"
            placeholder="Stock"
            value={newVariant.stockQty}
            onChange={(e) => setNewVariant({ ...newVariant, stockQty: Number(e.target.value) })}
            className="rang-input w-20 py-1.5"
          />
          <button type="submit" className="rang-btn-outline px-3 py-1.5">
            + Add Variant
          </button>
        </form>
      </div>

      <div className="mt-6 rang-card p-5">
        <h2 className="mb-3 font-semibold">Product Images</h2>
        <div className="flex flex-wrap gap-3">
          {product.images.map((img) => (
            <div key={img.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-20 w-20 rounded-lg border-2 border-ink/15 object-cover" />
              <button
                onClick={() => deleteImage(img.id)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="mt-4 text-sm" />
        {uploading && <p className="mt-1 text-sm text-ink-soft">Uploading...</p>}
      </div>
    </div>
  );
}
