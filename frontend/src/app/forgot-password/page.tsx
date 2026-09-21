"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(n => Math.max(0,n-1)),1000); return () => clearTimeout(timer); }, [cooldown]);
  async function sendCode() {
    setBusy(true); setError("");
    try { await apiFetch("/auth/forgot-password", {method:"POST",body:JSON.stringify({email:email.trim()})}); setStep("code"); setCode(""); setCooldown(60); }
    catch(e) { setError(e instanceof ApiError ? e.message : "Could not request a code. Please try again."); }
    finally { setBusy(false); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if(step === "email") { await sendCode(); return; }
    setError(""); if(password !== confirm) { setError("Passwords do not match."); return; } setBusy(true);
    try { await apiFetch("/auth/reset-password-code",{method:"POST",body:JSON.stringify({email:email.trim(),code,password})}); setStep("done"); setPassword(""); setConfirm(""); setCode(""); }
    catch(e) { setError(e instanceof ApiError ? e.message : "Could not reset password. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-sm">
    <h1 className="mb-6 text-2xl font-bold">{step === "done" ? "Password reset" : "Forgot password"}</h1>
    {step === "done" ? <p role="status" className="rang-card p-5">Your password has been changed. Sign in below with your new password.</p> : <form onSubmit={submit} className="rang-card space-y-4 p-6">
      <p className="text-sm text-ink-soft">{step === "email" ? "Enter your account email to receive a six-digit password reset code." : `If an active account exists for ${email.trim()}, a code will arrive shortly. Check your inbox and spam folder. It expires in 10 minutes; only the newest code works.`}</p>
      <fieldset disabled={busy} className="space-y-4">
        {step === "email" ? <label className="block text-sm">Email<input autoComplete="email" required type="email" value={email} onChange={e => setEmail(e.target.value)} className="rang-input mt-1" /></label> : <>
          <label className="block text-sm">Email code<input required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0,6))} className="rang-input mt-1 tracking-widest" /></label>
          <label className="block text-sm">New password<input required autoComplete="new-password" type="password" minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} className="rang-input mt-1" /></label>
          <p className="text-xs text-ink-soft">At least 8 characters, including a letter and a number.</p>
          <label className="block text-sm">Confirm password<input required autoComplete="new-password" type="password" minLength={8} maxLength={72} value={confirm} onChange={e => setConfirm(e.target.value)} className="rang-input mt-1" /></label>
        </>}
        <button type="submit" className="rang-btn-primary w-full">{busy ? "Please wait..." : step === "email" ? "Send email code" : "Reset password"}</button>
        {step === "code" && <div className="flex justify-between gap-3 text-sm"><button type="button" disabled={cooldown > 0} onClick={sendCode} className="underline disabled:opacity-50">{cooldown ? `Resend in ${cooldown}s` : "Resend code"}</button><button type="button" onClick={() => {setStep("email");setError("");setCode("");}} className="underline">Change email</button></div>}
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>}
    <p className="mt-4 text-center text-sm"><Link href="/admin/login" className="underline">Admin sign in</Link>{" · "}<Link href="/account/login" className="underline">Customer sign in</Link></p>
  </div>;
}
