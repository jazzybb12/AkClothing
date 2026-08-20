"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [storeContact, setStoreContact] = useState<{ email: string | null; phone: string | null }>({
    email: null,
    phone: null,
  });

  useEffect(() => {
    apiFetch<{ storeContactEmail: string | null; storeContactPhone: string | null }>("/settings")
      .then((s) => setStoreContact({ email: s.storeContactEmail, phone: s.storeContactPhone }))
      .catch(() => {
        // fall back silently to the form-only view if the API is unreachable
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/contact", { method: "POST", body: JSON.stringify({ name, email, message }) });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send your message — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">Contact Us</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Question about an order or a product? Send us a message, or use the WhatsApp button for a faster reply.
      </p>

      {(storeContact.email || storeContact.phone) && (
        <div className="rang-card mb-6 space-y-1 p-4 text-sm text-ink">
          {storeContact.email && (
            <p>
              Email:{" "}
              <a href={`mailto:${storeContact.email}`} className="text-brand underline">
                {storeContact.email}
              </a>
            </p>
          )}
          {storeContact.phone && (
            <p>
              Phone:{" "}
              <a href={`tel:${storeContact.phone}`} className="text-brand underline">
                {storeContact.phone}
              </a>
            </p>
          )}
        </div>
      )}

      {sent ? (
        <p className="text-sm text-green-600 dark:text-green-400">Thanks — we&apos;ve received your message and will get back to you soon.</p>
      ) : (
        <form onSubmit={handleSubmit} className="rang-card space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="rang-input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rang-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea
              required
              minLength={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="rang-input"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className="rang-btn-primary">
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}
