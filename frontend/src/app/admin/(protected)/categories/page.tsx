"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Category } from "@/lib/types";
import { uploadImage } from "@/lib/cloudinary";

export default function AdminCategoriesPage() {
  const { token } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function handleCoverUpload(id: string, file: File) {
    if (!token) return;
    setError(null); setUploadingId(id);
    try {
      const imageUrl = await uploadImage(file, token);
      await apiFetch(`/categories/${id}`, { method: "PATCH", token, body: JSON.stringify({ imageUrl }) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload category cover photo");
    } finally { setUploadingId(null); }
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState("");

  async function load() {
    setCategories(await apiFetch<Category[]>("/categories"));
  }

  useEffect(() => {
    load();
  }, []);

  const parents = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (coverFile) { setUploading(true); imageUrl = await uploadImage(coverFile, token); }
      await apiFetch("/categories", {
        method: "POST",
        token,
        body: JSON.stringify({ name, parentId: parentId || undefined, imageUrl }),
      });
      setName("");
      setParentId("");
      setCoverFile(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create category");
    } finally { setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/categories/${id}`, { method: "DELETE", token });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete category (it may still have products)");
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditParentId(c.parentId ?? "");
  }

  async function saveEdit(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/categories/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ name: editName, parentId: editParentId || null }),
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update category");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>

      <form onSubmit={handleCreate} className="rang-card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Men, or Shirts"
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Parent (optional)</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rang-input"
          >
            <option value="">None (top-level, e.g. Men/Women/Kids)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rang-btn-primary">
          {uploading ? "Uploading..." : "Add Category"}
        </button>
        <label className="text-sm"><span className="mb-1 block font-medium">Cover photo</span><input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} /></label>
      </form>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="space-y-4">
        {parents.length === 0 ? (
          <p className="text-sm text-ink-soft">No categories yet.</p>
        ) : (
          parents.map((p) => (
            <div key={p.id} className="rang-card p-4">
              <div className="flex items-center justify-between gap-2">
                {editingId === p.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rang-input flex-1 py-1 font-semibold"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-12 w-16 rounded object-cover" /> : <span className="h-12 w-16 rounded bg-ink/5" />}
                    <Link href={`/admin/categories/${p.id}`} className="font-semibold hover:underline">{p.name} <span className="ml-2 text-xs font-normal text-ink-soft">View products →</span></Link>
                    <label className="cursor-pointer text-xs text-brand hover:underline">{uploadingId === p.id ? "Uploading..." : "Cover photo"}<input type="file" accept="image/*" className="hidden" disabled={uploadingId === p.id} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCoverUpload(p.id, file); }} /></label>
                  </div>
                )}
                <div className="flex shrink-0 gap-3">
                  {editingId === p.id ? (
                    <>
                      <button onClick={() => saveEdit(p.id)} className="text-xs font-medium text-brand hover:underline">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-ink-soft hover:underline">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(p)} className="text-xs font-medium text-brand hover:underline">
                      Rename
                    </button>
                  )}
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                    Delete
                  </button>
                </div>
              </div>
              {childrenOf(p.id).length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-ink/10 pt-2">
                  {childrenOf(p.id).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-sm text-ink-soft">
                      {editingId === c.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <span>—</span>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="rang-input flex-1 py-1"
                          />
                          <select
                            value={editParentId}
                            onChange={(e) => setEditParentId(e.target.value)}
                            className="rang-input py-1"
                          >
                            {parents.map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                {parent.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-10 w-14 rounded object-cover" /> : <span className="h-10 w-14 rounded bg-ink/5" />}
                          <Link href={`/admin/categories/${c.id}`} className="hover:underline">— {c.name} · View products →</Link>
                          <label className="cursor-pointer text-xs text-brand hover:underline">{uploadingId === c.id ? "Uploading..." : "Cover photo"}<input type="file" accept="image/*" className="hidden" disabled={uploadingId === c.id} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCoverUpload(c.id, file); }} /></label>
                        </div>
                      )}
                      <div className="flex shrink-0 gap-3">
                        {editingId === c.id ? (
                          <>
                            <button onClick={() => saveEdit(c.id)} className="text-xs font-medium text-brand hover:underline">
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-ink-soft hover:underline">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(c)} className="text-xs font-medium text-brand hover:underline">
                            Edit
                          </button>
                        )}
                        <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
