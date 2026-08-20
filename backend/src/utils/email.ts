import fetch from "node-fetch";
import { env } from "@/config/env";

// Falls back to logging the email to the console when no Resend API key is configured,
// so password reset (and anything else built on this) is fully testable in dev without
// needing a real email provider — see backend/.env.example for how to go live.
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.resend.apiKey) {
    console.log(`\n[email:dev-fallback] No RESEND_API_KEY set — logging email instead of sending.`);
    console.log(`  To: ${to}\n  Subject: ${subject}\n  Body:\n${html}\n`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resend.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.resend.fromAddress, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Failed to send email via Resend: ${response.status} ${body}`);
  }
}
