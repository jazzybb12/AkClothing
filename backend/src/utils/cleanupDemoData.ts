import { prisma } from "@/config/prisma";

// Removes only records explicitly created by the old demo seed. This is
// idempotent and safe to run on every boot while existing production data stays
// untouched.
export async function cleanupDemoData() {
  await prisma.$transaction(async (tx) => {
    const demoOrders = await tx.order.findMany({
      where: { orderNumber: { startsWith: "DEMO-" } },
      select: { id: true },
    });
    if (demoOrders.length) {
      await tx.orderItem.deleteMany({ where: { orderId: { in: demoOrders.map((order) => order.id) } } });
      await tx.order.deleteMany({ where: { id: { in: demoOrders.map((order) => order.id) } } });
    }
    await tx.review.deleteMany({ where: { id: { startsWith: "dune-demo-review-" } } });
    await tx.newsletterSubscriber.deleteMany({ where: { email: { endsWith: "@example.invalid" } } });
    await tx.coupon.deleteMany({ where: { code: "DEMO20" } });
    await tx.shippingMethod.deleteMany({ where: { id: { startsWith: "dune-demo-shipping-" } } });
    await tx.banner.deleteMany({ where: { id: { startsWith: "dune-demo-banner-" } } });
    await tx.user.deleteMany({ where: { email: "dune-demo@example.invalid" } });
  });
}
