"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { readWishlist, writeWishlist } from "./wishlist-storage";

interface WishlistContextValue {
  slugs: string[];
  isWishlisted: (slug: string) => boolean;
  toggle: (slug: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSlugs(readWishlist());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeWishlist(slugs);
  }, [slugs, hydrated]);

  const isWishlisted = (slug: string) => slugs.includes(slug);

  const toggle = (slug: string) => {
    setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  return (
    <WishlistContext.Provider value={{ slugs, isWishlisted, toggle, count: slugs.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
