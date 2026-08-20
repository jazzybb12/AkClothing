import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { applyCoupon, findBestAutoApplyCoupon } from "@/modules/coupons/coupons.service";
import { getCourierAdapter } from "@/modules/courier/courier.service";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "./order-emails";
import { CourierProvider, PaymentMethod } from "@prisma/client";

export interface CheckoutItemInput {
  variantId: string;
  qty: number;
}

export interface CheckoutInput {
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: { address: string; city: string };
  items: CheckoutItemInput[];
  couponCode?: string;
  shippingMethodId?: string;
  paymentMethod?: PaymentMethod;
}

async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  return `ORD-${1000 + count + 1}`;
}

// Re-validates price + stock server-side (never trusts the cart the client sent) and
// creates the order + order items + decrements stock atomically.
export async function createOrder(input: CheckoutInput) {
  if (input.items.length === 0) {
    throw new AppError(400, "Cart is empty");
  }

  return prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const lineItems: {
      productId: string;
      variantId: string;
      productNameSnapshot: string;
      size: string;
      color: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (const item of input.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });
      if (!variant) throw new AppError(404, `Product variant not found: ${item.variantId}`);
      if (variant.isOutOfStock || variant.stockQty < item.qty) {
        throw new AppError(400, `${variant.product.name} (${variant.size}/${variant.color}) is out of stock`);
      }

      const unitPrice = Number(variant.priceOverride ?? variant.product.basePrice);
      const lineTotal = unitPrice * item.qty;
      subtotal += lineTotal;

      lineItems.push({
        productId: variant.productId,
        variantId: variant.id,
        productNameSnapshot: variant.product.name,
        size: variant.size,
        color: variant.color,
        qty: item.qty,
        unitPrice,
        lineTotal,
      });

      const newStock = variant.stockQty - item.qty;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stockQty: newStock, isOutOfStock: newStock <= 0 },
      });
    }

    const settings = await tx.settings.findUnique({ where: { id: "singleton" } });

    // Resolve shipping: prefer the requested active method, else the lowest-position
    // active method, else the legacy flat Settings.shippingFee as a last resort (should
    // only happen if an admin deletes every shipping method).
    let shippingMethodId: string | undefined;
    let shippingMethodName: string | undefined;
    let shippingFee: number;
    const requestedMethod = input.shippingMethodId
      ? await tx.shippingMethod.findFirst({ where: { id: input.shippingMethodId, active: true } })
      : null;
    const fallbackMethod = requestedMethod
      ? null
      : await tx.shippingMethod.findFirst({ where: { active: true }, orderBy: { position: "asc" } });
    const resolvedMethod = requestedMethod ?? fallbackMethod;
    if (resolvedMethod) {
      shippingMethodId = resolvedMethod.id;
      shippingMethodName = resolvedMethod.name;
      shippingFee = Number(resolvedMethod.fee);
    } else {
      shippingFee = Number(settings?.shippingFee ?? 0);
    }

    const paymentMethod = input.paymentMethod ?? "COD";
    if (paymentMethod === "COD" && settings?.codEnabled === false) {
      throw new AppError(400, "Cash on Delivery is not currently available");
    }
    if (paymentMethod === "BANK_DEPOSIT" && !settings?.bankDepositEnabled) {
      throw new AppError(400, "Bank deposit is not currently available");
    }

    let discountAmount = 0;
    let couponId: string | undefined;

    if (input.couponCode) {
      // A manually-entered code always takes precedence over any auto-apply coupon.
      const coupon = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
      if (!coupon) throw new AppError(404, "Coupon not found");
      const applied = applyCoupon(coupon, subtotal);
      discountAmount = applied.discountAmount;
      if (applied.freeShipping) shippingFee = 0;
      couponId = coupon.id;
      await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    } else {
      const autoCoupon = await findBestAutoApplyCoupon(tx, subtotal, shippingFee);
      if (autoCoupon) {
        const applied = applyCoupon(autoCoupon, subtotal);
        discountAmount = applied.discountAmount;
        if (applied.freeShipping) shippingFee = 0;
        couponId = autoCoupon.id;
        await tx.coupon.update({ where: { id: autoCoupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }

    const total = Math.max(0, subtotal - discountAmount + shippingFee);

    const order = await tx.order.create({
      data: {
        orderNumber: await generateOrderNumber(),
        userId: input.userId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        shippingAddress: input.shippingAddress,
        subtotal,
        discountAmount,
        shippingFee,
        shippingMethodId,
        shippingMethodName,
        paymentMethod,
        total,
        couponId,
        items: { create: lineItems },
      },
      include: { items: true },
    });

    return order;
  }).then(async (order) => {
    // Outside the transaction — a slow or failed email send should never hold the DB
    // transaction open or roll back an otherwise-successful order.
    await sendOrderConfirmationEmail(order).catch((err) => console.error("Order confirmation email failed:", err));
    return order;
  });
}

// Lets a customer (or a guest who can prove the order's phone number) back out of an
// order before it's been confirmed/shipped. Restocks whatever was reserved at checkout.
export async function cancelOrder(orderId: string, requester: { userId?: string; phone?: string }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new AppError(404, "Order not found");

    const isOwner = order.userId && requester.userId === order.userId;
    const isVerifiedGuest = !order.userId && requester.phone === order.customerPhone;
    if (!isOwner && !isVerifiedGuest) {
      throw new AppError(403, "You can only cancel your own order");
    }
    if (order.status !== "PENDING") {
      throw new AppError(400, "Only orders that are still pending can be cancelled");
    }

    for (const item of order.items) {
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
      if (variant) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQty: variant.stockQty + item.qty, isOutOfStock: false },
        });
      }
    }

    return tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" }, include: { items: true } });
  });
}

export async function trackOrder(orderNumber: string, phone: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order || order.customerPhone !== phone) {
    throw new AppError(404, "No order found matching that order number and phone");
  }
  return order;
}

// Moving an order to CONFIRMED books the courier shipment automatically so the admin
// doesn't have to separately go create it on the courier's own dashboard.
export async function updateOrderStatus(
  orderId: string,
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED",
  courierProvider?: CourierProvider
) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new AppError(404, "Order not found");

  let updated;
  if (status === "CONFIRMED" && !order.courierTrackingNumber) {
    const provider = courierProvider ?? order.courierProvider ?? "LEOPARDS";
    const adapter = getCourierAdapter(provider);
    const shipment = await adapter.createShipment(order);
    updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        courierProvider: provider,
        courierTrackingNumber: shipment.trackingNumber,
        courierStatus: "BOOKED",
      },
      include: { items: true },
    });
  } else {
    updated = await prisma.order.update({ where: { id: orderId }, data: { status }, include: { items: true } });
  }

  await sendOrderStatusEmail(updated).catch((err) => console.error("Order status email failed:", err));
  return updated;
}
