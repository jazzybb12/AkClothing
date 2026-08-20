export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Privacy Policy</h1>
      <div className="space-y-5 text-sm leading-relaxed text-ink">
        <p>
          This policy explains what information ak.shop collects when you shop with us, and how we use it. By using
          this site, you agree to the practices described below.
        </p>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Information we collect</h2>
          <p>
            When you place an order, create an account, subscribe to our newsletter, or contact us, we collect
            information such as your name, phone number, email address, and delivery address. We use this solely to
            process and deliver your order, respond to your questions, and — if you&apos;ve subscribed — send you
            updates about new arrivals and sales.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">How we use your information</h2>
          <p>
            Your order details are shared with our courier partners (Leopards, PostEx) only as needed to deliver your
            package. We do not sell or rent your personal information to third parties for marketing purposes.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Cookies</h2>
          <p>
            We use your browser&apos;s local storage to remember your cart and wishlist items between visits. This
            stays on your device and isn&apos;t used for tracking or advertising.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Returns &amp; Refunds</h2>
          <p>
            If an item arrives damaged, defective, or different from what you ordered, contact us within 3 days of
            delivery for a free exchange or refund. Items must be unworn, unwashed, and in their original packaging
            with tags attached. To start a return or exchange, message us on WhatsApp or use the{" "}
            <a href="/contact" className="text-brand underline">
              Contact page
            </a>{" "}
            with your order number. Refunds for Cash on Delivery orders are issued via bank transfer or store
            credit, whichever you prefer. Full shipping and delivery details are on the{" "}
            <a href="/shipping-returns" className="text-brand underline">
              Shipping &amp; Returns page
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Your choices</h2>
          <p>
            You can unsubscribe from marketing emails at any time using the link in those emails, and you can request
            that we delete your account and associated data by contacting us directly.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Contact</h2>
          <p>
            Questions about this policy? Reach us via the{" "}
            <a href="/contact" className="text-brand underline">
              Contact page
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
