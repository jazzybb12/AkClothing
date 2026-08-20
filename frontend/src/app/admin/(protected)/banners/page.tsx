"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { uploadImage } from "@/lib/cloudinary";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Banner, BannerGradientKey } from "@/lib/types";

const GRADIENT_OPTIONS: { key: BannerGradientKey; label: string; swatch: string }[] = [
  { key: "brand", label: "Brand (magenta)", swatch: "from-brand-dark to-brand" },
  { key: "emerald", label: "Emerald", swatch: "from-emerald-900 to-violet-700" },
  { key: "accent", label: "Accent (marigold)", swatch: "from-accent-dark to-accent" },
];

function gradientClass(key: BannerGradientKey) {
  return GRADIENT_OPTIONS.find((g) => g.key === key)?.swatch ?? GRADIENT_OPTIONS[0].swatch;
}

export default function AdminBannersPage() {
  const { token } = useAdminAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [eyebrow, setEyebrow] = useState("");
  const [heading, setHeading] = useState("");
  const [subtext, setSubtext] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("/shop");
  const [gradientKey, setGradientKey] = useState<BannerGradientKey>("brand");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!token) return;
    setBanners(await apiFetch<Banner[]>("/admin/banners", { token }));
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
      const position = banners.length === 0 ? 0 : Math.max(...banners.map((b) => b.position)) + 1;
      await apiFetch("/admin/banners", {
        method: "POST",
        token,
        body: JSON.stringify({
          eyebrow: eyebrow || undefined,
          heading,
          subtext: subtext || undefined,
          ctaLabel: ctaLabel || undefined,
          ctaHref: ctaHref || undefined,
          imageUrl: imageUrl || undefined,
          gradientKey,
          position,
        }),
      });
      setEyebrow("");
      setHeading("");
      setSubtext("");
      setCtaLabel("");
      setCtaHref("/shop");
      setGradientKey("brand");
      setImageUrl(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create banner");
    } finally {
      setSubmitting(false);
    }
  }

  async function patchBanner(id: string, patch: Record<string, unknown>) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/banners/${id}`, { method: "PATCH", token, body: JSON.stringify(patch) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update banner");
    }
  }

  async function handleReplaceImage(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !e.target.files?.[0]) return;
    try {
      const url = await uploadImage(e.target.files[0], token);
      await patchBanner(id, { imageUrl: url });
    } catch {
      setError("Image upload failed — check your Cloudinary settings.");
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    await apiFetch(`/admin/banners/${id}`, { method: "DELETE", token });
    load();
  }

  function move(index: number, direction: -1 | 1) {
    const target = banners[index + direction];
    const current = banners[index];
    if (!target) return;
    patchBanner(current.id, { position: target.position });
    patchBanner(target.id, { position: current.position });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Homepage Banners</h1>

      <div className="rang-card mb-8 max-w-2xl p-5">
        <h2 className="mb-1 font-semibold">Add Banner</h2>
        <p className="mb-4 text-xs text-ink-soft">
          Slides rotate on the homepage in order. Upload a photo, or leave it blank to use a color background.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Eyebrow (optional)</label>
              <input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="New Season" className="rang-input" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Heading</label>
              <input required value={heading} onChange={(e) => setHeading(e.target.value)} className="rang-input" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subtext (optional)</label>
            <textarea value={subtext} onChange={(e) => setSubtext(e.target.value)} rows={2} className="rang-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Button Label (optional)</label>
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Shop Now" className="rang-input" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Button Link</label>
              <input value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} placeholder="/shop" className="rang-input" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Photo (optional)</label>
            <div className="flex items-center gap-4">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-14 w-24 rounded-lg border-2 border-ink/15 object-cover" />
              ) : (
                <div className={`h-14 w-24 rounded-lg bg-gradient-to-br ${gradientClass(gradientKey)}`} />
              )}
              <div>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="text-sm" />
                {uploading && <p className="mt-1 text-xs text-ink-soft">Uploading...</p>}
                {imageUrl && (
                  <button type="button" onClick={() => setImageUrl(null)} className="mt-1 block text-xs text-red-600 hover:underline dark:text-red-400">
                    Remove photo, use color instead
                  </button>
                )}
              </div>
            </div>
          </div>
          {!imageUrl && (
            <div>
              <label className="mb-1 block text-sm font-medium">Color Background</label>
              <div className="flex gap-3">
                {GRADIENT_OPTIONS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGradientKey(g.key)}
                    className={`h-9 w-16 rounded-md bg-gradient-to-br ${g.swatch} ${
                      gradientKey === g.key ? "ring-2 ring-offset-2 ring-brand" : ""
                    }`}
                    aria-label={g.label}
                    title={g.label}
                  />
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className="rang-btn-primary">
            {submitting ? "Adding..." : "Add Banner"}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : banners.length === 0 ? (
        <p className="text-sm text-ink-soft">No banners yet — the homepage hero will be blank until you add one.</p>
      ) : (
        <div className="space-y-4">
          {banners.map((b, i) => (
            <div key={b.id} className="rang-card p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg sm:w-36">
                  {b.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${gradientClass(b.gradientKey)}`} />
                  )}
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-[11px] font-medium text-transparent transition hover:bg-black/40 hover:text-white">
                    Replace
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReplaceImage(b.id, e)} />
                  </label>
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    defaultValue={b.eyebrow ?? ""}
                    placeholder="Eyebrow (optional)"
                    onBlur={(e) => e.target.value !== (b.eyebrow ?? "") && patchBanner(b.id, { eyebrow: e.target.value || null })}
                    className="rang-input py-1 text-xs"
                  />
                  <input
                    defaultValue={b.heading}
                    onBlur={(e) => e.target.value !== b.heading && e.target.value && patchBanner(b.id, { heading: e.target.value })}
                    className="rang-input py-1.5 font-semibold"
                  />
                  <textarea
                    defaultValue={b.subtext ?? ""}
                    placeholder="Subtext (optional)"
                    rows={2}
                    onBlur={(e) => e.target.value !== (b.subtext ?? "") && patchBanner(b.id, { subtext: e.target.value || null })}
                    className="rang-input py-1 text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      defaultValue={b.ctaLabel ?? ""}
                      placeholder="Button label"
                      onBlur={(e) => e.target.value !== (b.ctaLabel ?? "") && patchBanner(b.id, { ctaLabel: e.target.value || null })}
                      className="rang-input w-32 py-1 text-xs"
                    />
                    <input
                      defaultValue={b.ctaHref ?? ""}
                      placeholder="/shop"
                      onBlur={(e) => e.target.value !== (b.ctaHref ?? "") && patchBanner(b.id, { ctaHref: e.target.value || null })}
                      className="rang-input flex-1 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                  <button
                    onClick={() => patchBanner(b.id, { active: !b.active })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      b.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-900/60"
                        : "bg-ink/10 text-ink-soft hover:bg-ink/15"
                    }`}
                  >
                    {b.active ? "Live" : "Hidden"}
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
                      disabled={i === banners.length - 1}
                      className="rounded px-1.5 py-0.5 text-sm text-ink-soft hover:bg-ink/10 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
