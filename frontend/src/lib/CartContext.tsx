"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CartLine } from "./types";
import { readCart, writeCart } from "./cart-storage";

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeCart(lines);
  }, [lines, hydrated]);

  const addLine = (line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === line.variantId ? { ...l, qty: l.qty + line.qty } : l
        );
      }
      return [...prev, line];
    });
  };

  const updateQty = (variantId: string, qty: number) => {
    setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, qty } : l)));
  };

  const removeLine = (variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  };

  const clear = () => setLines([]);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <CartContext.Provider value={{ lines, addLine, updateQty, removeLine, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
