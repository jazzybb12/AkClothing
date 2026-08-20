"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import BrandMark from "@/components/BrandMark";

const FOOTER_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/track", label: "Track Order" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export default function Footer({ logoUrl }: { logoUrl?: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      await apiFetch("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
      setStatus("done");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Could not subscribe");
    }
  }

  return (
    <footer className="font-rang mt-20 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center gap-2">
          <BrandMark
            logoUrl={logoUrl}
            size={52}
            fallback={
              <span className="font-display text-lg font-bold text-paper">
                ak<span className="text-accent">.</span>shop
              </span>
            }
          />
        </div>

        <div className="max-w-sm rounded-2xl border-2 border-paper/25 bg-paper/[0.06] p-5">
          <h3 className="font-display text-base font-semibold text-paper">Get updates on new arrivals &amp; sales</h3>
          <p className="mt-1 text-xs text-paper/60">No spam — just new drops and offers.</p>
          {status === "done" ? (
            <p className="mt-3 text-sm font-medium text-jade">Subscribed — thanks!</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full flex-1 rounded-lg border-2 border-paper/25 bg-paper/10 px-3 py-2.5 text-sm text-paper shadow-sm transition placeholder:text-paper/40 focus:border-accent focus:outline-none"
              />
              <button type="submit" disabled={status === "loading"} className="rang-btn-accent shrink-0 px-4 py-2.5">
                {status === "loading" ? "..." : "Subscribe"}
              </button>
            </form>
          )}
          {error && <p className="mt-1 text-sm text-rose-300">{error}</p>}
        </div>

        <nav className="mt-10 flex flex-wrap gap-x-8 gap-y-2 border-t border-paper/15 pt-6 text-sm font-semibold text-paper/80">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-1 text-sm text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} ak.shop. All rights reserved.</p>
          <p className="font-medium text-paper/80">Cash on Delivery available across Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
