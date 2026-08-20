"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { Category } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  categories: Category[];
  logoUrl?: string | null;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${filled ? "fill-rose-600 stroke-rose-600" : "fill-none stroke-current"}`}
      strokeWidth="2"
    >
      <path d="M12 21s-6.7-4.35-9.3-8.3C1 10 1.6 6.5 4.6 5.1 7 4 9.5 4.8 12 7.5c2.5-2.7 5-3.5 7.4-2.4 3 1.4 3.6 4.9 1.9 7.6C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

export default function Header({ categories, logoUrl }: Props) {
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user: customerUser } = useCustomerAuth();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const parents = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/shop?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setMobileOpen(false);
  }

  return (
    <header className="font-rang sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="overflow-hidden whitespace-nowrap bg-ink py-1.5 text-xs font-bold tracking-wide text-paper">
        <div className="ribbon-track inline-flex w-max gap-10">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="inline-flex gap-10 pl-10">
              <span>CASH ON DELIVERY, NATIONWIDE <span className="text-accent">✦</span></span>
              <span>ORDER ON WHATSAPP <span className="text-accent">✦</span></span>
              <span>DELIVERED BY LEOPARDS &amp; POSTEX <span className="text-accent">✦</span></span>
              <span>CASH ON DELIVERY, NATIONWIDE <span className="text-accent">✦</span></span>
              <span>ORDER ON WHATSAPP <span className="text-accent">✦</span></span>
              <span>DELIVERED BY LEOPARDS &amp; POSTEX <span className="text-accent">✦</span></span>
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-1.5 font-display text-2xl font-bold tracking-tight text-ink transition hover:opacity-80">
          {logoUrl ? (
            <Image src={logoUrl} alt="ak.shop" width={68} height={68} className="rounded object-contain" />
          ) : (
            <>
              ak<span className="text-brand">.</span>shop
            </>
          )}
        </Link>

        <div ref={navRef} className="hidden items-center gap-6 text-sm font-bold text-ink md:flex">
          {parents.map((parent) => {
            const children = childrenOf(parent.id);
            const isOpen = openDropdown === parent.id;
            return (
              <div key={parent.id} className="relative">
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : parent.id)}
                  className="flex items-center gap-1 border-b-2 border-transparent py-2 transition-colors hover:border-accent"
                >
                  {parent.name}
                  {children.length > 0 && (
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-3 w-3 fill-current transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M5 7l5 5 5-5H5z" />
                    </svg>
                  )}
                </button>
                {isOpen && children.length > 0 && (
                  <div className="rang-card absolute left-0 top-full z-10 min-w-40 animate-fade-in overflow-hidden py-2">
                    <Link
                      href={`/shop?category=${parent.slug}`}
                      onClick={() => setOpenDropdown(null)}
                      className="block px-4 py-1.5 text-sm font-bold text-ink hover:bg-brand hover:text-white"
                    >
                      All {parent.name}
                    </Link>
                    {children.map((c) => (
                      <Link
                        key={c.id}
                        href={`/shop?category=${c.slug}`}
                        onClick={() => setOpenDropdown(null)}
                        className="block px-4 py-1.5 text-sm font-medium text-ink-soft hover:bg-brand hover:text-white"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Link href="/shop" className="border-b-2 border-transparent py-2 transition-colors hover:border-accent">Shop</Link>
          <Link href="/track" className="border-b-2 border-transparent py-2 transition-colors hover:border-accent">Track Order</Link>

          <button
            aria-label="Search"
            onClick={() => setSearchOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-brand"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>

          <Link href="/wishlist" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-brand">
            <HeartIcon filled={false} />
            {wishlistCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#241300]">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href={customerUser ? "/account/orders" : "/account/login"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-brand"
            aria-label={customerUser ? "My Account" : "Login"}
          >
            <AccountIcon />
          </Link>

          <Link href="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-brand" aria-label="Cart">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#241300]">
                {count}
              </span>
            )}
          </Link>

          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle className="h-7 w-7" />
          <button aria-label="Search" onClick={() => setSearchOpen((o) => !o)}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current text-ink" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
          <Link href="/wishlist" className="relative text-ink">
            <HeartIcon filled={false} />
            {wishlistCount > 0 && (
              <span className="absolute -right-3 -top-2 rounded-full bg-brand px-1.5 text-xs text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href={customerUser ? "/account/orders" : "/account/login"}
            className="text-ink"
            aria-label={customerUser ? "My Account" : "Login"}
          >
            <AccountIcon />
          </Link>
          <Link href="/cart" className="relative text-sm font-bold text-ink">
            Cart
            {count > 0 && (
              <span className="absolute -right-3 -top-2 rounded-full bg-brand px-1.5 text-xs text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current text-ink">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" fill="none" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="animate-fade-in border-t-2 border-ink bg-paper px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-6xl gap-2">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="rang-input flex-1"
            />
            <button type="submit" className="rang-btn-primary">
              Search
            </button>
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="animate-fade-in border-t-2 border-ink bg-paper px-4 py-3 text-sm font-bold text-ink md:hidden">
          {parents.map((parent) => {
            const children = childrenOf(parent.id);
            const isExpanded = mobileExpanded === parent.id;
            return (
              <div key={parent.id} className="border-b border-ink/15 py-2">
                <div className="flex items-center justify-between">
                  <Link href={`/shop?category=${parent.slug}`} onClick={() => setMobileOpen(false)}>
                    {parent.name}
                  </Link>
                  {children.length > 0 && (
                    <button
                      aria-label={`Expand ${parent.name}`}
                      onClick={() => setMobileExpanded(isExpanded ? null : parent.id)}
                      className="px-2 py-1 text-ink-soft"
                    >
                      {isExpanded ? "−" : "+"}
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <div className="mt-2 space-y-2 pl-3">
                    {children.map((c) => (
                      <Link
                        key={c.id}
                        href={`/shop?category=${c.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block font-medium text-ink-soft"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Link href="/shop" onClick={() => setMobileOpen(false)} className="block py-2">
            Shop
          </Link>
          <Link href="/track" onClick={() => setMobileOpen(false)} className="block py-2">
            Track Order
          </Link>
          <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="block py-2">
            Wishlist
          </Link>
          <Link
            href={customerUser ? "/account/orders" : "/account/login"}
            onClick={() => setMobileOpen(false)}
            className="block py-2"
          >
            {customerUser ? "My Account" : "Login / Register"}
          </Link>
        </div>
      )}
    </header>
  );
}
