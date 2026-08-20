import type { Metadata } from "next";
import { Suspense } from "react";
import { Roboto_Slab, Inter, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/CartContext";
import { WishlistProvider } from "@/lib/WishlistContext";
import { CustomerAuthProvider } from "@/lib/CustomerAuthContext";
import SiteChrome from "@/components/SiteChrome";
import PageViewTracker from "@/components/PageViewTracker";
import { apiFetch } from "@/lib/api";
import { Category } from "@/lib/types";
import { colorTokenVars, isValidHex } from "@/lib/color";
import { ThemeProvider } from "@/components/ThemeProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Falls back to these when the admin hasn't customized branding yet — matches the
// app's original hardcoded colors, so there's zero visual change out of the box.
const DEFAULT_BRAND_HEX = "#C4276B";
const DEFAULT_ACCENT_HEX = "#E8951C";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Geometric sans used only by the storefront's "Rang" redesign (via the `font-rang`
// utility, applied in Header/Footer/SiteChrome) — admin keeps Inter (--font-body) as its
// default everywhere else, so this never affects admin styling.
const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rang-body",
  display: "swap",
});

async function getCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>("/categories");
  } catch {
    return [];
  }
}

interface BrandingSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
  brandColor: string | null;
  accentColor: string | null;
}

async function getBrandingSettings(): Promise<BrandingSettings> {
  try {
    const settings = await apiFetch<BrandingSettings>("/settings");
    return {
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      brandColor: settings.brandColor,
      accentColor: settings.accentColor,
    };
  } catch {
    return { logoUrl: null, faviconUrl: null, brandColor: null, accentColor: null };
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ak.shop — Pakistan's Online Fashion Store",
    template: "%s | ak.shop",
  },
  description: "Shop the latest men's and women's clothing with Cash on Delivery across Pakistan.",
  openGraph: {
    type: "website",
    siteName: "ak.shop",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, branding] = await Promise.all([getCategories(), getBrandingSettings()]);

  const brandVars = colorTokenVars("brand", isValidHex(branding.brandColor) ? branding.brandColor : DEFAULT_BRAND_HEX);
  const accentVars = colorTokenVars("accent", isValidHex(branding.accentColor) ? branding.accentColor : DEFAULT_ACCENT_HEX);

  return (
    <html lang="en" className={`${robotoSlab.variable} ${inter.variable} ${jost.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved (or system) color scheme to <html> before first paint,
            so there's no flash of the wrong theme while React hydrates. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
        {/* Sets --brand-rgb/--accent-rgb (+ light/dark) before first paint so Tailwind's
            `bg-brand`/`text-accent`/etc. utilities reflect the admin's chosen colors with
            no flash of the default palette. */}
        <style dangerouslySetInnerHTML={{ __html: `:root{${brandVars}${accentVars}}` }} />
        {branding.faviconUrl && <link rel="icon" href={branding.faviconUrl} />}
      </head>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink transition-colors">
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <ThemeProvider>
          <CustomerAuthProvider>
            <WishlistProvider>
              <CartProvider>
                <SiteChrome categories={categories} logoUrl={branding.logoUrl}>
                  {children}
                </SiteChrome>
              </CartProvider>
            </WishlistProvider>
          </CustomerAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
