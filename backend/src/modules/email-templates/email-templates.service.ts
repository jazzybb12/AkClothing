import { EmailTemplateKey } from "@prisma/client";
import { prisma } from "@/config/prisma";

export interface EmailTemplateContent {
  subject: string;
  body: string;
}

// The store's original hardcoded email copy, tokenized with {{placeholder}} tokens so an
// admin can customize wording without touching code. {{itemsTable}}/{{courierParenthetical}}/
// {{courierDash}} stay opaque computed HTML fragments (see buildTemplateVars in
// order-emails.ts) rather than being split into per-row/per-field editable pieces.
export const DEFAULT_TEMPLATES: Record<EmailTemplateKey, EmailTemplateContent> = {
  ORDER_CONFIRMATION: {
    subject: "Order confirmed — {{orderNumber}}",
    body: `<p>Hi {{customerName}},</p>
     <p>Thanks for your order! Here's a summary of <strong>{{orderNumber}}</strong>:</p>
     <table style="width:100%;border-collapse:collapse;">{{itemsTable}}</table>
     <p style="margin-top:12px;">
       Subtotal: Rs. {{subtotal}}<br/>
       Discount: -Rs. {{discountAmount}}<br/>
       Shipping ({{shippingMethodName}}): Rs. {{shippingFee}}<br/>
       <strong>Total: Rs. {{total}}</strong> ({{paymentMethod}})
     </p>{{paymentInfo}}
     <p>We'll email you again once it's on the way. You can also track it anytime:</p>
     <p><a href="{{trackUrl}}">{{trackUrl}}</a></p>`,
  },
  STATUS_CONFIRMED: {
    subject: "Your order has been confirmed — {{orderNumber}}",
    body: `<p>Hi {{customerName}},</p>
     <p>Your order <strong>{{orderNumber}}</strong> has been confirmed and handed to our courier{{courierParenthetical}}.</p>
     <p>Track it anytime: <a href="{{trackUrl}}">{{trackUrl}}</a></p>`,
  },
  STATUS_SHIPPED: {
    subject: "Your order is on its way — {{orderNumber}}",
    body: `<p>Hi {{customerName}},</p>
     <p>Your order <strong>{{orderNumber}}</strong> has shipped{{courierDash}} and should arrive soon.</p>
     <p>Track it anytime: <a href="{{trackUrl}}">{{trackUrl}}</a></p>`,
  },
  STATUS_DELIVERED: {
    subject: "Your order has been delivered — {{orderNumber}}",
    body: `<p>Hi {{customerName}},</p>
     <p>Your order <strong>{{orderNumber}}</strong> has been marked as delivered. We hope you love it!</p>
     <p>Track it anytime: <a href="{{trackUrl}}">{{trackUrl}}</a></p>`,
  },
  STATUS_CANCELLED: {
    subject: "Your order has been cancelled — {{orderNumber}}",
    body: `<p>Hi {{customerName}},</p>
     <p>Your order <strong>{{orderNumber}}</strong> has been cancelled.</p>
     <p>Track it anytime: <a href="{{trackUrl}}">{{trackUrl}}</a></p>`,
  },
};

export const PLACEHOLDERS = [
  "orderNumber",
  "customerName",
  "itemsTable",
  "subtotal",
  "discountAmount",
  "shippingFee",
  "shippingMethodName",
  "total",
  "trackUrl",
  "paymentMethod",
  "paymentInfo",
  "courierProvider",
  "courierTrackingNumber",
  "courierParenthetical",
  "courierDash",
];

export async function getTemplate(key: EmailTemplateKey): Promise<EmailTemplateContent & { isCustomized: boolean }> {
  const override = await prisma.emailTemplate.findUnique({ where: { key } });
  if (override) return { subject: override.subject, body: override.body, isCustomized: true };
  return { ...DEFAULT_TEMPLATES[key], isCustomized: false };
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}
