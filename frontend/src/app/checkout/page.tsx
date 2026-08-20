"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { Order, ShippingMethod } from "@/lib/types";

interface CheckoutSettings {
  shippingFee: string;
  codEnabled: boolean;
  bankDepositEnabled: boolean;
  bankDepositInstructions: string | null;
}

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const { user, token } = useCustomerAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [autoAppliedCode, setAutoAppliedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<CheckoutSettings | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_DEPOSIT">("COD");

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name);
      if (user.phone) setPhone((prev) => prev || user.phone!);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  useEffect(() => {
    apiFetch<CheckoutSettings>("/settings")
      .then((s) => {
        setSettings(s);
        // Prefer COD when available (matches this store's default assumption); fall back
        // to Bank Deposit only if COD has been disabled by the admin.
        setPaymentMethod(s.codEnabled ? "COD" : "BANK_DEPOSIT");
      })
      .catch(() => {});
    apiFetch<ShippingMethod[]>("/shipping-methods")
      .then((methods) => {
        setShippingMethods(methods);
        if (methods.length > 0) setSelectedShippingId(methods[0].id);
      })
      .catch(() => {});
  }, []);

  const selectedShippingMethod = shippingMethods.find((m) => m.id === selectedShippingId) ?? null;
  const shippingFee = selectedShippingMethod ? Number(selectedShippingMethod.fee) : Number(settings?.shippingFee ?? 0);

  // Preview a no-code auto-apply discount as soon as the subtotal is known, so it's
  // never a surprise that only shows up after the order is placed. A manually-entered
  // coupon (applyCoupon, below) always overrides this.
  useEffect(() => {
    if (subtotal <= 0 || couponCode) return;
    apiFetch<{ applied: boolean; code?: string; discountAmount?: number; freeShipping?: boolean }>(
      `/coupons/auto-apply?subtotal=${subtotal}`
    )
      .then((res) => {
        if (res.applied) {
          setDiscount(res.discountAmount ?? 0);
          setFreeShipping(res.freeShipping ?? false);
          setAutoAppliedCode(res.code ?? null);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  async function applyCoupon() {
    if (!couponCode) return;
    try {
      const result = await apiFetch<{ discountAmount: number; freeShipping: boolean }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      setDiscount(result.discountAmount);
      setFreeShipping(result.freeShipping);
      setAutoAppliedCode(null);
      setError(null);
    } catch (err) {
      setDiscount(0);
      setFreeShipping(false);
      setError(err instanceof ApiError ? err.message : "Could not apply coupon");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const order = await apiFetch<Order>("/orders", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
          shippingAddress: { address, city },
          items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
          couponCode: couponCode || undefined,
          shippingMethodId: selectedShippingId || undefined,
          paymentMethod,
        }),
      });
      clear();
      router.push(`/order-confirmation/${order.orderNumber}?phone=${encodeURIComponent(phone)}`);
      // Not resetting `submitting` here — see frontend/src/app/admin/login/page.tsx for why.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong placing your order");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return <p className="text-ink-soft">Your cart is empty.</p>;
  }

  const effectiveShipping = freeShipping ? 0 : shippingFee;
  const total = Math.max(0, subtotal - discount + effectiveShipping);

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
      <form onSubmit={handleSubmit} className="rang-card space-y-4 p-6 md:col-span-2">
        <h1 className="text-2xl font-bold">Checkout</h1>
        {!user && (
          <p className="text-sm text-ink-soft">
            <Link href="/account/login" className="text-brand underline">
              Sign in
            </Link>{" "}
            to save this order to your account, or continue as a guest below.
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Full Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="rang-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone Number</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03xxxxxxxxx"
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="For your order confirmation"
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Address</label>
          <textarea
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rang-input"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">City</label>
          <input required value={city} onChange={(e) => setCity(e.target.value)} className="rang-input" />
        </div>

        {shippingMethods.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium">Shipping Method</label>
            <div className="space-y-2">
              {shippingMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                    selectedShippingId === m.id ? "border-brand bg-brand/5" : "border-ink/15"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={selectedShippingId === m.id}
                      onChange={() => setSelectedShippingId(m.id)}
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">{m.name}</span>
                      {m.description && <span className="block text-xs text-ink-soft">{m.description}</span>}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-ink">{Number(m.fee) > 0 ? `Rs. ${Number(m.fee).toFixed(2)}` : "Free"}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Payment Method</label>
          <div className="space-y-2">
            {settings?.codEnabled !== false && (
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                  paymentMethod === "COD" ? "border-brand bg-brand/5" : "border-ink/15"
                }`}
              >
                <input type="radio" name="paymentMethod" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                <span>
                  <span className="block text-sm font-medium text-ink">Cash on Delivery</span>
                  <span className="block text-xs text-ink-soft">Pay when your order arrives.</span>
                </span>
              </label>
            )}
            {settings?.bankDepositEnabled && (
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                  paymentMethod === "BANK_DEPOSIT" ? "border-brand bg-brand/5" : "border-ink/15"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "BANK_DEPOSIT"}
                  onChange={() => setPaymentMethod("BANK_DEPOSIT")}
                />
                <span>
                  <span className="block text-sm font-medium text-ink">Bank Deposit</span>
                  <span className="block text-xs text-ink-soft">Transfer before your order ships.</span>
                </span>
              </label>
            )}
          </div>
          {paymentMethod === "BANK_DEPOSIT" && settings?.bankDepositInstructions && (
            <div className="mt-2 whitespace-pre-line rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm text-ink">
              {settings.bankDepositInstructions}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={submitting} className="rang-btn-primary w-full py-3">
          {submitting ? "Placing order..." : paymentMethod === "COD" ? "Place Order (COD)" : "Place Order"}
        </button>
      </form>

      <div className="rang-card h-fit p-5">
        <h2 className="mb-3 font-semibold">Order Summary</h2>
        {lines.map((l) => (
          <div key={l.variantId} className="flex justify-between py-1 text-sm">
            <span>
              {l.productName} ({l.size}/{l.color}) x{l.qty}
            </span>
            <span>Rs. {(l.unitPrice * l.qty).toFixed(2)}</span>
          </div>
        ))}

        <div className="mt-3 flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Coupon code"
            className="rang-input flex-1 py-1.5"
          />
          <button type="button" onClick={applyCoupon} className="rang-btn-outline px-3 py-1.5">
            Apply
          </button>
        </div>
        {autoAppliedCode && !couponCode && (
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            &ldquo;{autoAppliedCode}&rdquo; applied automatically.
          </p>
        )}

        <div className="mt-4 space-y-1 border-t border-ink/15 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span>-Rs. {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping{selectedShippingMethod ? ` (${selectedShippingMethod.name})` : ""}</span>
            <span>
              {effectiveShipping > 0 ? `Rs. ${effectiveShipping.toFixed(2)}` : "Free"}
              {freeShipping && shippingFee > 0 && (
                <span className="ml-1 text-xs text-green-600 dark:text-green-400">(coupon)</span>
              )}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-brand">
            <span>Total</span>
            <span>Rs. {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
