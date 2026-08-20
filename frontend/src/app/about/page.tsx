export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">About ak.shop</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink">
        <p>
          ak.shop is an online clothing store bringing quality men&apos;s, women&apos;s, and kids&apos; fashion to
          customers across Pakistan, with the convenience of Cash on Delivery — no advance payment required, just
          inspect your order and pay when it arrives at your door.
        </p>
        <p>
          We work directly with trusted couriers to make sure your order reaches you quickly and safely, and every
          product listing goes through a quality check before it&apos;s added to the store.
        </p>
        <p>
          Have a question about an order, a product, or anything else? Visit our{" "}
          <a href="/contact" className="text-brand underline">
            Contact page
          </a>{" "}
          or message us directly on WhatsApp using the button in the corner of your screen.
        </p>
      </div>
    </div>
  );
}
