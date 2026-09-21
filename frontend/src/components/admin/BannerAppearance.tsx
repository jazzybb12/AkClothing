"use client";

import { useState } from "react";
import { Banner } from "@/lib/types";
import HeroCarousel from "@/components/HeroCarousel";

export type BannerAppearanceValues = Pick<Banner, "height" | "imagePosition" | "imageRotation" | "accentColor">;

export default function BannerAppearance({ banner, onSave }: { banner: Banner; onSave: (values: BannerAppearanceValues) => Promise<void> }) {
  const [values, setValues] = useState<BannerAppearanceValues>({ height: banner.height ?? null, imagePosition: banner.imagePosition ?? 50, imageRotation: banner.imageRotation ?? 0, accentColor: banner.accentColor ?? null });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  function change(patch: BannerAppearanceValues) { setValues(v => ({ ...v, ...patch })); setMessage(""); }
  async function save() {
    setSaving(true); setMessage("");
    try { await onSave(values); setMessage("Banner appearance saved."); }
    catch { setMessage("Could not save banner appearance. Please try again."); }
    finally { setSaving(false); }
  }
  return <details className="mt-4 border-t border-ink/15 pt-4">
    <summary className="cursor-pointer font-semibold">Customize banner appearance</summary>
    <div className="mt-4 space-y-4">
      <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Banner height: {values.height ?? "Automatic"}
          <input aria-label="Banner height" className="block w-full" type="range" min={380} max={760} value={values.height ?? 560} onChange={e => change({ height: Number(e.target.value) })} />
        </label>
        <label className="text-sm">Image position: {values.imagePosition}%
          <input className="block w-full" type="range" min={0} max={100} value={values.imagePosition} onChange={e => change({ imagePosition: Number(e.target.value) })} />
        </label>
        <label className="text-sm">Image perspective: {values.imageRotation}°
          <input className="block w-full" type="range" min={-35} max={35} value={values.imageRotation} onChange={e => change({ imageRotation: Number(e.target.value) })} />
        </label>
        <label className="text-sm">Background accent (visible without a photo)
          <input className="block" type="color" value={values.accentColor ?? "#74866b"} onChange={e => change({ accentColor: e.target.value })} />
        </label>
        <button type="button" className="text-left text-sm underline" onClick={() => change({ height: null, imagePosition: 50, imageRotation: 0, accentColor: null })}>Restore default appearance</button>
      </fieldset>
      <p className="text-xs text-ink-soft">Preview your changes below, then save to update this banner on the homepage. Edit text and replace the photo above.</p>
      <div ref={node => { if (node) node.setAttribute("inert", ""); }} className="pointer-events-none"><HeroCarousel banners={[{ ...banner, ...values }]} /></div>
      <button type="button" disabled={saving} onClick={save} className="rang-btn-primary">{saving ? "Saving..." : "Save appearance"}</button>
      <p role="status" className="text-sm">{message}</p>
    </div>
  </details>;
}
