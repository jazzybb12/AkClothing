"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/CartContext";

export default function CartPage() {
  const { lines, updateQty, removeLine, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/5 text-brand">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <p className="mt-4 text-ink-soft">Your cart is empty.</p>
        <Link href="/shop" className="rang-btn-primary mt-5">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your Cart</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          {lines.map((line) => (
            <div key={line.variantId} className="rang-card flex items-center gap-4 p-4">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
                {line.image && <Image src={line.image} alt={line.productName} fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink">{line.productName}</p>
                <p className="text-sm text-ink-soft">
                  {line.size} / {line.color}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-brand">Rs. {line.unitPrice}</p>
              </div>
              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) => updateQty(line.variantId, Math.max(1, Number(e.target.value)))}
                className="rang-input w-16 py-1.5 text-center"
              />
              <button
                aria-label="Remove item"
                onClick={() => removeLine(line.variantId)}
                className="rounded-full p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="rang-card h-fit p-5">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Shipping and any coupon discount are applied at checkout.</p>
          <Link href="/checkout" className="rang-btn-primary mt-4 w-full">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
