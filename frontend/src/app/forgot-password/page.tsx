"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Forgot Password</h1>
      {submitted ? (
        <p className="rang-card p-5 text-sm text-ink-soft">
          If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a link to reset your
          password. It expires in 1 hour.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="rang-card space-y-4 p-6">
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
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className="rang-btn-primary w-full">
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-ink-soft">
        <Link href="/admin/login" className="text-brand underline">
          Admin sign in
        </Link>{" "}
        &middot;{" "}
        <Link href="/account/login" className="text-brand underline">
          Customer sign in
        </Link>
      </p>
    </div>
  );
}
