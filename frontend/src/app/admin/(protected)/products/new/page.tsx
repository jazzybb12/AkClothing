"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { uploadImage } from "@/lib/cloudinary";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Category } from "@/lib/types";

interface VariantRow {
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

export default function NewProductPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">("ACTIVE");
  const [featured, setFeatured] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([{ size: "M", color: "Black", sku: "", stockQty: 10 }]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = buildCategoryOptions(categories);

  useEffect(() => {
    apiFetch<Category[]>("/categories").then((cats) => {
      setCategories(cats);
      const options = buildCategoryOptions(cats);
      if (options[0]) setCategoryId(options[0].id);
    });
  }, []);

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, { size: "", color: "", sku: "", stockQty: 0 }]);
  }

  function removeVariantRow(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !e.target.files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(e.target.files).map((file) => uploadImage(file, token)));
      setImages((prev) => [...prev, ...urls]);
    } catch {
      setError("Image upload failed — check your Cloudinary settings.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/products", {
        method: "POST",
        token,
        body: JSON.stringify({
          name,
          description,
          basePrice: Number(basePrice),
          categoryId,
          status,
          featured,
          variants: variants.map((v) => ({ ...v, stockQty: Number(v.stockQty) })),
          images: images.map((url) => ({ url })),
        }),
      });
      router.push("/admin/products");
      // Not resetting `submitting` here — see frontend/src/app/admin/login/page.tsx for why.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create product");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add Product</h1>
      <form onSubmit={handleSubmit} className="rang-card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Product Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="rang-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rang-input">
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
            value={status}
            onChange={(e) => setStatus(e.target.value as "ACTIVE" | "DRAFT")}
            className="rang-input"
          >
            <option value="ACTIVE">Active (visible on the store)</option>
            <option value="DRAFT">Draft (hidden)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-brand" />
          Feature on homepage (&quot;Best of the Bazaar&quot;)
        </label>

        <div>
          <label className="mb-2 block text-sm font-medium">Sizes, Colors &amp; Stock</label>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Size (e.g. M)"
                  value={v.size}
                  onChange={(e) => updateVariant(i, { size: e.target.value })}
                  className="rang-input w-24 py-1.5"
                />
                <input
                  placeholder="Color"
                  value={v.color}
                  onChange={(e) => updateVariant(i, { color: e.target.value })}
                  className="rang-input w-28 py-1.5"
                />
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  className="rang-input flex-1 py-1.5"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stockQty}
                  onChange={(e) => updateVariant(i, { stockQty: Number(e.target.value) })}
                  className="rang-input w-20 py-1.5"
                />
                <button
                  type="button"
                  onClick={() => removeVariantRow(i)}
                  className="rounded-full px-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addVariantRow} className="mt-2 text-sm font-medium text-brand underline">
            + Add size/color
          </button>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Product Images</label>
          <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="text-sm" />
          {uploading && <p className="mt-1 text-sm text-ink-soft">Uploading...</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg border-2 border-ink/15 object-cover" />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={submitting} className="rang-btn-primary">
          {submitting ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
