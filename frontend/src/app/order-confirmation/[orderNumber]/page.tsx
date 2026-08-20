import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Order } from "@/lib/types";

// Best-effort: only fetchable when the phone used at checkout is present in the URL
// (same guest-auth requirement as /track), so this degrades gracefully to the plain
// confirmation message if it's missing or the lookup fails.
async function getOrder(orderNumber: string, phone: string): Promise<Order | null> {
  if (!phone) return null;
  try {
    return await apiFetch<Order>(
      `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
    );
  } catch {
    return null;
  }
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: { orderNumber: string };
  searchParams: { phone?: string };
}) {
  const phone = searchParams.phone ?? "";
  const order = await getOrder(params.orderNumber, phone);

  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400">
        <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-ink">Order Placed!</h1>
      <p className="mt-2 text-ink-soft">
        Thank you — your order <span className="font-semibold text-brand">{params.orderNumber}</span> has been
        received
        {!order || order.paymentMethod === "COD"
          ? " and will be paid for on delivery (COD)."
          : " — please complete your bank deposit to confirm it."}
      </p>
      {order && (
        <p className="mt-2 text-sm text-ink-soft">
          Placed{" "}
          {new Date(order.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}{" "}
          · {order.shippingMethodName ?? "Shipping"} · Total Rs. {order.total}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <Link href={`/track?orderNumber=${params.orderNumber}&phone=${searchParams.phone ?? ""}`} className="rang-btn-primary">
          Track This Order
        </Link>
        <Link href="/shop" className="rang-btn-outline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
