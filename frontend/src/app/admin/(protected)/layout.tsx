"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import BrandMark from "@/components/BrandMark";
import { Permission } from "@/lib/permissions";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/reports", label: "Reports", icon: "reports", permission: "REPORTS" as Permission },
  { href: "/admin/banners", label: "Banners", icon: "banners", permission: "BANNERS" as Permission },
  { href: "/admin/collections", label: "Collections", icon: "collections", permission: "COLLECTIONS" as Permission },
  { href: "/admin/products", label: "Products", icon: "products", permission: "PRODUCTS" as Permission },
  { href: "/admin/categories", label: "Categories", icon: "categories", permission: "CATEGORIES" as Permission },
  { href: "/admin/orders", label: "Orders", icon: "orders", permission: "ORDERS" as Permission },
  { href: "/admin/customers", label: "Customers", icon: "customers", permission: "CUSTOMERS" as Permission },
  { href: "/admin/coupons", label: "Coupons", icon: "coupons", permission: "COUPONS" as Permission },
  { href: "/admin/shipping-methods", label: "Shipping", icon: "shipping", permission: "SHIPPING" as Permission },
  { href: "/admin/reviews", label: "Reviews", icon: "reviews", permission: "REVIEWS" as Permission },
  { href: "/admin/newsletter", label: "Newsletter", icon: "newsletter", permission: "NEWSLETTER" as Permission },
  {
    href: "/admin/email-templates",
    label: "Emails",
    icon: "email-templates",
    permission: "EMAIL_TEMPLATES" as Permission,
  },
  { href: "/admin/team", label: "Team", icon: "team", adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: "settings", permission: "SETTINGS" as Permission },
] as const;

const ICON_PATHS: Record<string, string> = {
  dashboard: "M3 13h4V3H3v10Zm0 8h4v-6H3v6Zm6 0h4V9H9v12Zm6 0h4V3h-4v18Z",
  reports: "M9 17V9m6 8V5m-3 12v-4M4 20h16M4 4h16v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4Z",
  banners:
    "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2 2a1 1 0 0 0-1 1v9l4-4 3 3 5-5 4 4V5H4Zm2 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z",
  products: "M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  collections: "M4 6h16M4 6v12a1 1 0 0 0 1 1h6M4 6l2-3h12l2 3M20 6v5M14 21l6-6m0 0-6-6m6 6H14",
  categories: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  orders: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Zm-3 4h18M16 10a4 4 0 0 1-8 0",
  customers: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  coupons: "M4 9V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M4 9a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3a2 2 0 0 0 0-4M4 9v4m16-4v4M9 6v12",
  shipping: "M3 3h13v10H3V3Zm13 4h4l3 3v3h-7V7ZM5.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm13 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  reviews: "M12 17.3 6.2 20l1.1-6.5L2.5 9l6.5-.9L12 2l3 6.1 6.5.9-4.8 4.5 1.1 6.5Z",
  newsletter: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 0 8 8 8-8",
  "email-templates": "M3 8l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  team: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 1-.1 1.2l2.1 1.6-2 3.5-2.5-1a7.5 7.5 0 0 1-2.1 1.2l-.4 2.7h-4l-.4-2.7a7.5 7.5 0 0 1-2.1-1.2l-2.5 1-2-3.5 2.1-1.6a7.4 7.4 0 0 1 0-2.4L2.4 8.6l2-3.5 2.5 1a7.5 7.5 0 0 1 2.1-1.2L9.4 2.2h4l.4 2.7a7.5 7.5 0 0 1 2.1 1.2l2.5-1 2 3.5-2.1 1.6c.07.4.1.8.1 1.2Z",
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="1.8">
      <path d={ICON_PATHS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-soft">Loading...</div>;
  }

  const visibleNav = NAV.filter((item) => {
    if ("adminOnly" in item && user.role !== "ADMIN") return false;
    if ("permission" in item && user.role !== "ADMIN" && !user.permissions.includes(item.permission)) return false;
    return true;
  });

  const navLinks = (onNavigate?: () => void) => (
    <nav className="space-y-0.5 text-sm">
      {visibleNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-colors ${
            pathname.startsWith(item.href)
              ? "bg-brand text-white shadow-soft"
              : "text-ink-soft hover:bg-brand/5 hover:text-brand"
          }`}
        >
          <NavIcon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper md:flex">
      {/* Mobile top bar — sidebar is hidden below md, this replaces it with a hamburger toggle */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-ink/15 bg-surface/90 p-4 backdrop-blur-sm md:hidden">
        <BrandMark size={42} fallback={<p className="font-display text-lg font-semibold text-brand">ak.shop Admin</p>} />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            aria-label="Toggle admin menu"
            onClick={() => setMobileNavOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-ink/5"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current text-ink">
              {mobileNavOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" fill="none" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {mobileNavOpen && (
        <div className="animate-fade-in border-b-2 border-ink/15 bg-surface p-4 md:hidden">
          {navLinks(() => setMobileNavOpen(false))}
          <button
            onClick={() => logout().then(() => router.replace("/admin/login"))}
            className="mt-4 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            Log out
          </button>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 border-r-2 border-ink/15 bg-surface p-4 md:flex md:flex-col">
        <div className="mb-6 flex items-center justify-between px-2">
          <BrandMark size={48} fallback={<p className="font-display text-lg font-semibold text-brand">ak.shop Admin</p>} />
          <ThemeToggle />
        </div>
        {navLinks()}
        <button
          onClick={() => logout().then(() => router.replace("/admin/login"))}
          className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Log out
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
