"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { ApiError } from "@/lib/api";

export default function CustomerLoginPage() {
  const { login } = useCustomerAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password, remember);
      router.push("/account/orders");
      // Not resetting `submitting` here — see the identical fix on the admin login page
      // (frontend/src/app/admin/login/page.tsx) for why: router.push() returns before
      // the destination route has actually finished loading, so clearing this here
      // re-enables "Sign In" while navigation is still pending.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign In</h1>
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
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rang-input"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-brand" />
          Remember me on this device
        </label>
        <p className="text-xs text-ink-soft">Leave unchecked to keep this sign-in only in this tab.</p>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={submitting} className="rang-btn-primary w-full">
          {submitting ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-ink-soft underline">
            Forgot password?
          </Link>
        </p>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/account/register" className="font-medium text-brand underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
