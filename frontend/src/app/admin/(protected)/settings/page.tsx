"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { uploadImage } from "@/lib/cloudinary";

interface Settings {
  logoUrl: string | null;
  faviconUrl: string | null;
  brandColor: string | null;
  accentColor: string | null;
  whatsappNumber: string | null;
  defaultCourier: "LEOPARDS" | "POSTEX" | null;
  storeName: string | null;
  storeContactEmail: string | null;
  storeContactPhone: string | null;
  shippingFee: string;
  codEnabled: boolean;
  bankDepositEnabled: boolean;
  bankDepositInstructions: string | null;
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

const DEFAULT_BRAND_HEX = "#C4276B";
const DEFAULT_ACCENT_HEX = "#E8951C";

export default function AdminSettingsPage() {
  const { token, user, updateProfile } = useAdminAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [accountName, setAccountName] = useState(user?.name ?? "");
  const [accountEmail, setAccountEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setAccountName(user.name);
      setAccountEmail(user.email);
    }
  }, [user]);

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAccountError(null);
    setAccountSaved(false);
    if (newPassword && newPassword !== confirmNewPassword) {
      setAccountError("New passwords don't match");
      return;
    }
    setAccountSaving(true);
    try {
      await updateProfile({
        currentPassword,
        name: accountName !== user?.name ? accountName : undefined,
        email: accountEmail !== user?.email ? accountEmail : undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setAccountSaved(true);
    } catch (err) {
      setAccountError(err instanceof ApiError ? err.message : "Could not update your account");
    } finally {
      setAccountSaving(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    apiFetch<Settings>("/admin/settings", { token }).then(setSettings);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await apiFetch<Settings>("/admin/settings", {
        method: "PATCH",
        token,
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !settings || !e.target.files?.[0]) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(e.target.files[0], token);
      setSettings({ ...settings, logoUrl: url });
    } catch {
      setError("Logo upload failed — check your Cloudinary settings.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFaviconSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !settings || !e.target.files?.[0]) return;
    setUploadingFavicon(true);
    setError(null);
    try {
      const url = await uploadImage(e.target.files[0], token);
      setSettings({ ...settings, faviconUrl: url });
    } catch {
      setError("Favicon upload failed — check your Cloudinary settings.");
    } finally {
      setUploadingFavicon(false);
    }
  }

  if (!settings) {
    return <p className="text-sm text-ink-soft">Loading...</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="rang-card mb-8 p-5">
        <h2 className="mb-4 font-semibold">My Account</h2>
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="rang-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              className="rang-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">New Password (optional)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="rang-input"
            />
          </div>
          {newPassword && (
            <div>
              <label className="mb-1 block text-sm font-medium">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="rang-input"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Current Password</label>
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required to save any change above"
              className="rang-input"
            />
          </div>

          {accountError && <p className="text-sm text-red-600 dark:text-red-400">{accountError}</p>}
          {accountSaved && <p className="text-sm text-green-600 dark:text-green-400">Account updated.</p>}

          <button type="submit" disabled={accountSaving} className="rang-btn-primary">
            {accountSaving ? "Saving..." : "Update My Account"}
          </button>
        </form>
      </div>

      <h2 className="mb-4 font-semibold">Branding</h2>
      <div className="rang-card mb-8 p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Store Logo</label>
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="Store logo" className="h-14 w-14 rounded-lg border-2 border-ink/15 bg-white object-contain p-1" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-dashed border-ink/25 text-xs text-ink-soft">
                None
              </div>
            )}
            <div>
              <input type="file" accept="image/*" onChange={handleLogoSelect} className="text-sm" />
              {uploading && <p className="mt-1 text-xs text-ink-soft">Uploading...</p>}
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, logoUrl: null })}
                  className="mt-1 block text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Remove logo
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Shown in the header in place of the text wordmark.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Favicon</label>
          <div className="flex items-center gap-4">
            {settings.faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.faviconUrl} alt="Favicon" className="h-8 w-8 rounded border-2 border-ink/15 bg-white object-contain p-0.5" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded border-2 border-dashed border-ink/25 text-[10px] text-ink-soft">
                None
              </div>
            )}
            <div>
              <input type="file" accept="image/*" onChange={handleFaviconSelect} className="text-sm" />
              {uploadingFavicon && <p className="mt-1 text-xs text-ink-soft">Uploading...</p>}
              {settings.faviconUrl && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, faviconUrl: null })}
                  className="mt-1 block text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Remove favicon
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Shown as the browser tab icon.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.brandColor ?? DEFAULT_BRAND_HEX}
                onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                className="h-9 w-10 shrink-0 cursor-pointer rounded border-2 border-ink/25 p-0.5"
              />
              <input
                value={settings.brandColor ?? DEFAULT_BRAND_HEX}
                onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                className="rang-input"
              />
            </div>
            <p className="mt-1 text-xs text-ink-soft">Buttons, links, active states.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.accentColor ?? DEFAULT_ACCENT_HEX}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="h-9 w-10 shrink-0 cursor-pointer rounded border-2 border-ink/25 p-0.5"
              />
              <input
                value={settings.accentColor ?? DEFAULT_ACCENT_HEX}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="rang-input"
              />
            </div>
            <p className="mt-1 text-xs text-ink-soft">Highlights, badges, secondary CTAs.</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

        <button type="submit" disabled={saving} className="rang-btn-primary">
          {saving ? "Saving..." : "Save Branding"}
        </button>
      </form>
      </div>

      <h2 className="mb-4 font-semibold">Store Settings</h2>
      <div className="rang-card p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">WhatsApp Number</label>
          <input
            value={settings.whatsappNumber ?? ""}
            onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
            placeholder="923001234567"
            className="rang-input"
          />
          <p className="mt-1 text-xs text-ink-soft">
            Country code + number, no spaces or +. Powers the &quot;Order on WhatsApp&quot; button on the storefront.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Default Courier</label>
          <select
            value={settings.defaultCourier ?? ""}
            onChange={(e) =>
              setSettings({ ...settings, defaultCourier: (e.target.value || null) as Settings["defaultCourier"] })
            }
            className="rang-input"
          >
            <option value="">None</option>
            <option value="LEOPARDS">Leopards</option>
            <option value="POSTEX">PostEx</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Shipping Fee (Rs.)</label>
          <input
            type="number"
            min={0}
            value={settings.shippingFee}
            onChange={(e) => setSettings({ ...settings, shippingFee: e.target.value })}
            className="rang-input"
          />
          <p className="mt-1 text-xs text-ink-soft">
            Fallback fee, only used if no shipping methods are configured under Admin &gt; Shipping. Manage the
            options customers actually pick from there.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Store Name</label>
          <input
            value={settings.storeName ?? ""}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            className="rang-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Contact Email</label>
          <input
            type="email"
            value={settings.storeContactEmail ?? ""}
            onChange={(e) => setSettings({ ...settings, storeContactEmail: e.target.value })}
            className="rang-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Contact Phone</label>
          <input
            value={settings.storeContactPhone ?? ""}
            onChange={(e) => setSettings({ ...settings, storeContactPhone: e.target.value })}
            className="rang-input"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

        <button type="submit" disabled={saving} className="rang-btn-primary">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
      </div>

      <h2 className="mb-4 mt-8 font-semibold">Payment Methods</h2>
      <div className="rang-card p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">Cash on Delivery</span>
            <span className="block text-xs text-ink-soft">Pay when the order arrives.</span>
          </span>
          <input
            type="checkbox"
            checked={settings.codEnabled}
            onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
            className="h-5 w-5 shrink-0 accent-brand"
          />
        </label>

        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">Bank Deposit</span>
            <span className="block text-xs text-ink-soft">Customer transfers before shipment.</span>
          </span>
          <input
            type="checkbox"
            checked={settings.bankDepositEnabled}
            onChange={(e) => setSettings({ ...settings, bankDepositEnabled: e.target.checked })}
            className="h-5 w-5 shrink-0 accent-brand"
          />
        </label>

        {settings.bankDepositEnabled && (
          <div>
            <label className="mb-1 block text-sm font-medium">Bank Deposit Instructions</label>
            <textarea
              value={settings.bankDepositInstructions ?? ""}
              onChange={(e) => setSettings({ ...settings, bankDepositInstructions: e.target.value })}
              rows={4}
              placeholder={"Bank: HBL\nAccount Title: ak.shop\nAccount Number: 1234-5678901-2\nIBAN: PK00HABB0001234567890"}
              className="rang-input font-mono text-xs"
            />
            <p className="mt-1 text-xs text-ink-soft">
              Shown to the customer at checkout and in their order confirmation email.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

        <button type="submit" disabled={saving} className="rang-btn-primary">
          {saving ? "Saving..." : "Save Payment Methods"}
        </button>
      </form>
      </div>

      <h2 className="mb-4 mt-8 font-semibold">Homepage Sections</h2>
      <div className="rang-card p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">&ldquo;Shop the Occasion&rdquo; category grid</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Eyebrow (small tag above the title)</label>
              <input
                value={settings.occasionEyebrow ?? ""}
                onChange={(e) => setSettings({ ...settings, occasionEyebrow: e.target.value || null })}
                placeholder="Browse"
                className="rang-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Section Title</label>
              <input
                value={settings.occasionHeading ?? ""}
                onChange={(e) => setSettings({ ...settings, occasionHeading: e.target.value || null })}
                placeholder="Shop the Occasion"
                className="rang-input"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-ink/10 pt-4">
          <p className="mb-2 text-sm font-medium">&ldquo;Best of the Bazaar&rdquo; product grid</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Eyebrow (small tag above the title)</label>
              <input
                value={settings.bazaarEyebrow ?? ""}
                onChange={(e) => setSettings({ ...settings, bazaarEyebrow: e.target.value || null })}
                placeholder="Trending Now"
                className="rang-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Section Title</label>
              <input
                value={settings.bazaarHeading ?? ""}
                onChange={(e) => setSettings({ ...settings, bazaarHeading: e.target.value || null })}
                placeholder="Best of the Bazaar"
                className="rang-input"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs text-ink-soft">Number of products to show</label>
            <input
              type="number"
              min={1}
              max={24}
              value={settings.bazaarLimit ?? 8}
              onChange={(e) => setSettings({ ...settings, bazaarLimit: e.target.value ? Number(e.target.value) : null })}
              className="rang-input w-24"
            />
            <p className="mt-1 text-xs text-ink-soft">
              Shows products marked &ldquo;Featured&rdquo; in Admin → Products, up to this many. If none are featured,
              it falls back to the most recently added products.
            </p>
          </div>
        </div>

        <div className="border-t border-ink/10 pt-4">
          <p className="mb-2 text-sm font-medium">&ldquo;Shop by Collection&rdquo; grid</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Eyebrow (small tag above the title)</label>
              <input
                value={settings.collectionsEyebrow ?? ""}
                onChange={(e) => setSettings({ ...settings, collectionsEyebrow: e.target.value || null })}
                placeholder="Curated"
                className="rang-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Section Title</label>
              <input
                value={settings.collectionsHeading ?? ""}
                onChange={(e) => setSettings({ ...settings, collectionsHeading: e.target.value || null })}
                placeholder="Shop by Collection"
                className="rang-input"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-soft">Manage the collections themselves under Admin → Collections.</p>
        </div>

        <div className="border-t border-ink/10 pt-4">
          <p className="mb-2 text-sm font-medium">Customer reviews marquee</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Eyebrow (small tag above the title)</label>
              <input
                value={settings.reviewsEyebrow ?? ""}
                onChange={(e) => setSettings({ ...settings, reviewsEyebrow: e.target.value || null })}
                placeholder="From Our Customers"
                className="rang-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Section Title</label>
              <input
                value={settings.reviewsHeading ?? ""}
                onChange={(e) => setSettings({ ...settings, reviewsHeading: e.target.value || null })}
                placeholder="What They're Saying"
                className="rang-input"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Shows reviews marked &ldquo;Show on Homepage&rdquo; in Admin → Reviews. If none are marked, it falls back
            to the highest-rated reviews site-wide.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

        <button type="submit" disabled={saving} className="rang-btn-primary">
          {saving ? "Saving..." : "Save Homepage Sections"}
        </button>
      </form>
      </div>
    </div>
  );
}
