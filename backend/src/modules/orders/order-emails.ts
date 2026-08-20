import { Order, OrderItem, OrderStatus } from "@prisma/client";
import { sendEmail } from "@/utils/email";
import { env } from "@/config/env";
import { prisma } from "@/config/prisma";
import { getTemplate, interpolate } from "@/modules/email-templates/email-templates.service";

type OrderWithItems = Order & { items: OrderItem[] };

function itemsRows(items: OrderItem[]): string {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px 4px 0;">${i.productNameSnapshot} (${i.size}/${i.color}) x${i.qty}</td><td style="padding:4px 0;text-align:right;">Rs. ${i.lineTotal}</td></tr>`
    )
    .join("");
}

function trackUrl(order: OrderWithItems): string {
  return `${env.frontendUrl}/track?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(order.customerPhone)}`;
}

async function buildTemplateVars(order: OrderWithItems): Promise<Record<string, string>> {
  let paymentInfo = "";
  if (order.paymentMethod === "BANK_DEPOSIT") {
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
    if (settings?.bankDepositInstructions) {
      paymentInfo = `<p style="margin-top:12px;"><strong>Bank Deposit Instructions:</strong><br/>${settings.bankDepositInstructions.replace(/\n/g, "<br/>")}</p>`;
    }
  }

  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    itemsTable: itemsRows(order.items),
    subtotal: String(order.subtotal),
    discountAmount: String(order.discountAmount),
    shippingFee: String(order.shippingFee),
    shippingMethodName: order.shippingMethodName ?? "Standard Shipping",
    total: String(order.total),
    trackUrl: trackUrl(order),
    paymentMethod: order.paymentMethod === "BANK_DEPOSIT" ? "Bank Deposit" : "Cash on Delivery",
    paymentInfo,
    courierProvider: order.courierProvider ?? "",
    courierTrackingNumber: order.courierTrackingNumber ?? "",
    courierParenthetical: order.courierTrackingNumber
      ? ` (${order.courierProvider}, tracking #${order.courierTrackingNumber})`
      : "",
    courierDash: order.courierTrackingNumber ? ` — tracking #${order.courierTrackingNumber}` : "",
  };
}

// Fired once, right after checkout — confirms what was ordered and how to track it.
// No-ops silently if the order has no email on file (most guest checkouts, since email
// is optional there) — this is expected, not an error.
export async function sendOrderConfirmationEmail(order: OrderWithItems) {
  if (!order.customerEmail) return;

  const template = await getTemplate("ORDER_CONFIRMATION");
  const vars = await buildTemplateVars(order);
  await sendEmail(order.customerEmail, interpolate(template.subject, vars), interpolate(template.body, vars));
}

const STATUS_TEMPLATE_KEYS: Partial<Record<OrderStatus, "STATUS_CONFIRMED" | "STATUS_SHIPPED" | "STATUS_DELIVERED" | "STATUS_CANCELLED">> = {
  CONFIRMED: "STATUS_CONFIRMED",
  SHIPPED: "STATUS_SHIPPED",
  DELIVERED: "STATUS_DELIVERED",
  CANCELLED: "STATUS_CANCELLED",
};

// Fired on every admin-initiated status change (not on the customer's own cancellation,
// which already gets its own on-screen confirmation) — silently no-ops with no email on
// file, or for statuses with no template (PENDING/RETURNED).
export async function sendOrderStatusEmail(order: OrderWithItems) {
  if (!order.customerEmail) return;
  const templateKey = STATUS_TEMPLATE_KEYS[order.status];
  if (!templateKey) return;

  const template = await getTemplate(templateKey);
  const vars = await buildTemplateVars(order);
  await sendEmail(order.customerEmail, interpolate(template.subject, vars), interpolate(template.body, vars));
}
