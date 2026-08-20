"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { ApiError } from "@/lib/api";

export default function CustomerRegisterPage() {
  const { register } = useCustomerAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(name, email, password, phone || undefined);
      router.push("/account/orders");
      // Not resetting `submitting` here — see frontend/src/app/admin/login/page.tsx for why.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create account");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Create Account</h1>
      <form onSubmit={handleSubmit} className="rang-card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Full Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rang-input"
          />
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
          <label className="mb-1 block text-sm font-medium">Phone (optional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03xxxxxxxxx"
            className="rang-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rang-input"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={submitting} className="rang-btn-primary w-full">
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/account/login" className="font-medium text-brand underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
