import { Coupon, Prisma } from "@prisma/client";
import { AppError } from "@/utils/AppError";

export interface CouponApplication {
  discountAmount: number;
  freeShipping: boolean;
}

function validateCoupon(coupon: Coupon, subtotal: number): void {
  if (!coupon.active) throw new AppError(400, "This coupon is no longer active");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError(400, "This coupon has expired");
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(400, "This coupon has reached its usage limit");
  }
  if (subtotal < Number(coupon.minOrderAmount)) {
    throw new AppError(400, `Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
  }
}

export function applyCoupon(coupon: Coupon, subtotal: number): CouponApplication {
  validateCoupon(coupon, subtotal);

  if (coupon.type === "PERCENTAGE") {
    return { discountAmount: Math.round(((subtotal * Number(coupon.value)) / 100) * 100) / 100, freeShipping: false };
  }
  if (coupon.type === "FIXED") {
    return { discountAmount: Math.min(Number(coupon.value), subtotal), freeShipping: false };
  }
  return { discountAmount: 0, freeShipping: true }; // FREE_SHIPPING
}

function isEligible(coupon: Coupon, subtotal: number): boolean {
  if (!coupon.active) return false;
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return false;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return false;
  if (subtotal < Number(coupon.minOrderAmount)) return false;
  return true;
}

function effectiveSavings(coupon: Coupon, subtotal: number, shippingFee: number): number {
  return coupon.type === "FREE_SHIPPING" ? shippingFee : applyCoupon(coupon, subtotal).discountAmount;
}

type TxClient = Pick<Prisma.TransactionClient, "coupon">;

// Finds the best-value active, auto-apply coupon for a cart with no code entered — used
// both by the checkout preview endpoint and real order creation, so the ranking logic
// only lives in one place. Returns null if nothing qualifies.
export async function findBestAutoApplyCoupon(
  tx: TxClient,
  subtotal: number,
  shippingFee: number
): Promise<Coupon | null> {
  const candidates = await tx.coupon.findMany({
    where: {
      active: true,
      autoApply: true,
      minOrderAmount: { lte: subtotal },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  const eligible = candidates.filter((c) => isEligible(c, subtotal));
  if (eligible.length === 0) return null;

  return eligible.reduce((best, c) =>
    effectiveSavings(c, subtotal, shippingFee) > effectiveSavings(best, subtotal, shippingFee) ? c : best
  );
}
