export const metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "How does Cash on Delivery work?",
    a: "Place your order online with no advance payment. Our courier partner brings it to your address — inspect it, then pay in cash when it's handed over.",
  },
  {
    q: "How long does delivery take?",
    a: "Most orders arrive within 3-5 business days, depending on your city. You'll get a courier tracking number once your order is confirmed.",
  },
  {
    q: "How do I track my order?",
    a: "Use the \"Track Order\" link in the menu with your order number and the phone number you checked out with.",
  },
  {
    q: "Can I cancel my order?",
    a: "Yes — orders can be cancelled for free as long as they're still in \"Pending\" status, from your account's Order History page or the Track Order page. Once an order is confirmed and handed to the courier, contact us directly to cancel.",
  },
  {
    q: "What's your return/exchange policy?",
    a: "See our Shipping & Returns page for the full policy.",
  },
  {
    q: "Do I need an account to order?",
    a: "No — you can check out as a guest. Creating an account just lets you see your order history in one place.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Frequently Asked Questions</h1>
      <div className="space-y-3">
        {FAQS.map((item) => (
          <div key={item.q} className="rang-card p-5">
            <h2 className="font-semibold text-ink">{item.q}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
