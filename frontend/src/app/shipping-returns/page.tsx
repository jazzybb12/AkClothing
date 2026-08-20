export const metadata = { title: "Shipping & Returns" };

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Shipping &amp; Returns</h1>

      <section className="mb-8">
        <h2 className="mb-2 font-semibold">Shipping</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink">
          <li>We deliver nationwide across Pakistan via courier partners.</li>
          <li>Orders are typically confirmed and handed to the courier within 1-2 business days.</li>
          <li>Delivery generally takes 3-5 business days depending on your city.</li>
          <li>You&apos;ll receive a courier tracking number once your order is confirmed — check it anytime on the Track Order page.</li>
          <li>Payment is Cash on Delivery: pay in cash when your order arrives.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Returns &amp; Exchanges</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink">
          <li>If an item arrives damaged, defective, or different from what you ordered, contact us within 3 days of delivery for a free exchange or refund.</li>
          <li>Items must be unworn, unwashed, and in their original packaging with tags attached.</li>
          <li>To start a return or exchange, message us on WhatsApp or use the Contact page with your order number.</li>
          <li>Refunds for Cash on Delivery orders are issued via bank transfer or store credit, whichever you prefer.</li>
        </ul>
      </section>
    </div>
  );
}
