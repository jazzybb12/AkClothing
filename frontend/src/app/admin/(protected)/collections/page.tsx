"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { uploadImage } from "@/lib/cloudinary";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Collection } from "@/lib/types";

interface ProductOption {
  id: string;
  name: string;
}

export default function AdminCollectionsPage() {
  const { token } = useAdminAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSaving, setPickerSaving] = useState(false);

  async function load() {
    if (!token) return;
    setCollections(await apiFetch<Collection[]>("/admin/collections", { token }));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !e.target.files?.[0]) return;
    setUploading(true);
    try {
      setImageUrl(await uploadImage(e.target.files[0], token));
    } catch {
      setError("Image upload failed — check your Cloudinary settings.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const position = collections.length === 0 ? 0 : Math.max(...collections.map((c) => c.position)) + 1;
      await apiFetch("/admin/collections", {
        method: "POST",
        token,
        body: JSON.stringify({ name, description: description || undefined, imageUrl: imageUrl || undefined, position }),
      });
      setName("");
      setDescription("");
      setImageUrl(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create collection");
    } finally {
      setSubmitting(false);
    }
  }

  async function patchCollection(id: string, patch: Record<string, unknown>) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/collections/${id}`, { method: "PATCH", token, body: JSON.stringify(patch) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update collection");
    }
  }

  async function handleReplaceImage(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !e.target.files?.[0]) return;
    try {
      const url = await uploadImage(e.target.files[0], token);
      await patchCollection(id, { imageUrl: url });
    } catch {
      setError("Image upload failed — check your Cloudinary settings.");
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    await apiFetch(`/admin/collections/${id}`, { method: "DELETE", token });
    load();
  }

  function move(index: number, direction: -1 | 1) {
    const target = collections[index + direction];
    const current = collections[index];
    if (!target) return;
    patchCollection(current.id, { position: target.position });
    patchCollection(target.id, { position: current.position });
  }

  async function openPicker(collectionId: string) {
    if (!token) return;
    setPickerOpenFor(collectionId);
    setPickerLoading(true);
    try {
      const [{ items }, detail] = await Promise.all([
        apiFetch<{ items: ProductOption[] }>("/products?pageSize=100"),
        apiFetch<{ productIds: string[] }>(`/admin/collections/${collectionId}`, { token }),
      ]);
      setAllProducts(items);
      setSelectedIds(new Set(detail.productIds));
    } finally {
      setPickerLoading(false);
    }
  }

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function savePicker() {
    if (!token || !pickerOpenFor) return;
    setPickerSaving(true);
    try {
      await apiFetch(`/admin/collections/${pickerOpenFor}/products`, {
        method: "PUT",
        token,
        body: JSON.stringify({ productIds: Array.from(selectedIds) }),
      });
      setPickerOpenFor(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save products");
    } finally {
      setPickerSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Collections</h1>

      <div className="rang-card mb-8 max-w-2xl p-5">
        <h2 className="mb-1 font-semibold">Add Collection</h2>
        <p className="mb-4 text-xs text-ink-soft">
          A named, curated group of products shown as its own homepage section and its own browsable page.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Eid Collection" className="rang-input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rang-input" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Photo (optional)</label>
            <div className="flex items-center gap-4">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-14 w-24 rounded-lg border-2 border-ink/15 object-cover" />
              ) : (
                <div className="h-14 w-24 rounded-lg bg-ink/10" />
              )}
              <div>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="text-sm" />
                {uploading && <p className="mt-1 text-xs text-ink-soft">Uploading...</p>}
                {imageUrl && (
                  <button type="button" onClick={() => setImageUrl(null)} className="mt-1 block text-xs text-red-600 hover:underline dark:text-red-400">
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className="rang-btn-primary">
            {submitting ? "Adding..." : "Add Collection"}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : collections.length === 0 ? (
        <p className="text-sm text-ink-soft">No collections yet.</p>
      ) : (
        <div className="space-y-4">
          {collections.map((c, i) => (
            <div key={c.id} className="rang-card p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg sm:w-36">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-ink/10" />
                  )}
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-[11px] font-medium text-transparent transition hover:bg-black/40 hover:text-white">
                    Replace
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReplaceImage(c.id, e)} />
                  </label>
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    defaultValue={c.name}
                    onBlur={(e) => e.target.value !== c.name && e.target.value && patchCollection(c.id, { name: e.target.value })}
                    className="rang-input py-1.5 font-semibold"
                  />
                  <textarea
                    defaultValue={c.description ?? ""}
                    placeholder="Description (optional)"
                    rows={2}
                    onBlur={(e) => e.target.value !== (c.description ?? "") && patchCollection(c.id, { description: e.target.value || null })}
                    className="rang-input py-1 text-xs"
                  />
                  <p className="text-xs text-ink-soft">{c._count?.products ?? 0} product(s)</p>
                  <button
                    onClick={() => openPicker(c.id)}
                    className="rang-btn-outline px-3 py-1 text-xs"
                  >
                    Manage Products
                  </button>
                </div>

                <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                  <button
                    onClick={() => patchCollection(c.id, { active: !c.active })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      c.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-900/60"
                        : "bg-ink/10 text-ink-soft hover:bg-ink/15"
                    }`}
                  >
                    {c.active ? "Live" : "Hidden"}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded px-1.5 py-0.5 text-sm text-ink-soft hover:bg-ink/10 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === collections.length - 1}
                      className="rounded px-1.5 py-0.5 text-sm text-ink-soft hover:bg-ink/10 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                    Delete
                  </button>
                </div>
              </div>

              {pickerOpenFor === c.id && (
                <div className="mt-4 border-t-2 border-ink/10 pt-4">
                  <h3 className="mb-2 text-sm font-semibold">Products in this collection</h3>
                  {pickerLoading ? (
                    <p className="text-xs text-ink-soft">Loading products...</p>
                  ) : (
                    <>
                      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border-2 border-ink/10 p-2">
                        {allProducts.map((p) => (
                          <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-ink/5">
                            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleProduct(p.id)} />
                            {p.name}
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={savePicker} disabled={pickerSaving} className="rang-btn-primary px-3 py-1.5 text-xs">
                          {pickerSaving ? "Saving..." : "Save Products"}
                        </button>
                        <button onClick={() => setPickerOpenFor(null)} className="rang-btn-outline px-3 py-1.5 text-xs">
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
