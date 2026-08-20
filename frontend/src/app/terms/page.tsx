export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Terms &amp; Conditions</h1>
      <div className="space-y-5 text-sm leading-relaxed text-ink">
        <p>By placing an order on ak.shop, you agree to the following terms.</p>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Orders &amp; Payment</h2>
          <p>
            All orders are Cash on Delivery unless otherwise stated. Prices are listed in Pakistani Rupees (PKR) and
            include applicable taxes. We reserve the right to cancel any order in cases of stock unavailability,
            pricing errors, or suspected fraud.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Product Information</h2>
          <p>
            We try to display product colors and details as accurately as possible, but slight variations may occur
            due to photography and screen settings.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Shipping &amp; Returns</h2>
          <p>
            See our{" "}
            <a href="/shipping-returns" className="text-brand underline">
              Shipping &amp; Returns
            </a>{" "}
            page for delivery timelines and our return/exchange policy.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Account Responsibility</h2>
          <p>
            If you create an account, you&apos;re responsible for keeping your login credentials secure and for all
            activity under your account.
          </p>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-ink">Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of the site after changes means you accept
            the updated terms.
          </p>
        </div>
      </div>
    </div>
  );
}
