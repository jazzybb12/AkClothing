"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import BrandMark from "@/components/BrandMark";
import { ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/admin/dashboard");
      // Deliberately NOT resetting `submitting` here. router.push() returns before the
      // dashboard route has actually finished loading (in dev mode this can take several
      // seconds the first time a route compiles) — resetting the button here re-enables
      // "Sign In" while navigation is still pending, which is exactly what was inviting
      // repeated clicks. The button staying disabled until this component unmounts (i.e.
      // until the dashboard actually takes over) is the fix, not a bug.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-brand-light px-4">
      <form onSubmit={handleSubmit} className="rang-card w-full max-w-sm space-y-4 bg-surface p-8 shadow-card-hover">
        <div className="mb-2 text-center">
          <div className="flex items-center justify-center">
            <BrandMark size={84} fallback={<p className="font-display text-2xl font-semibold text-brand">ak.shop</p>} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">Admin sign in</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rang-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rang-input"
          />
        </div>
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
    </div>
  );
}
