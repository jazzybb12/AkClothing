# Email code password reset

Admin sign in > Forgot password opens `/forgot-password`. The same flow also supports customer accounts.

1. Enter the account email and select Send email code.
2. Enter the six-digit emailed code, a new password, and its confirmation.
3. Select Reset password, then return to the appropriate sign-in page.

Codes expire after 10 minutes, allow up to five verification attempts, and are consumed atomically on success. Resends have a 60-second account cooldown and replace the previous challenge. Request and verification endpoints have IP rate limiting. Codes are stored as keyed hashes, not plaintext. Responses do not disclose whether an email belongs to an account. Unknown and inactive accounts receive no code. Existing long-token links remain supported until expiry; stored code hashes cannot be used as reset links.

## Setup and deployment

- Apply migrations with `npx prisma migrate deploy` from `backend`, using the intended database connection. New migration: `20260914010000_password_reset_codes`. The earlier banner migration is also pending locally.
- Build backend and frontend after applying migrations. Regenerate Prisma when developing locally.
- Set `RESEND_API_KEY` and `RESEND_FROM_ADDRESS` to a sender at your verified Resend domain. Set `NODE_ENV=production` on the live backend. Configure these in hosting settings; Git does not transfer local `.env` values.
- Production refuses reset requests when the email API key is missing. Provider failure clears the challenge and logs a generic failure without logging codes. The public response remains generic; check email-provider delivery logs when investigating a missing email.
- In local development without an API key, the existing email helper prints the email/code in the backend terminal. This tests the flow without actual delivery.
- The account email must be an inbox the account owner controls.

## Verification

Compile with `npx tsc -p tsconfig.json` and `npx tsc-alias -p tsconfig.json`, then run `node --test tests/password-reset.cjs` from backend. Tests replace persistence and email with in-memory doubles; they do not contact the database or send mail. Coverage includes success, reuse, inactive/unknown accounts, expiry, parallel attempt limits, resend throttling/replacement, concurrent consumption, delivery failure, and blocking hashes on the legacy link route.

Frontend and backend TypeScript checks passed. Database-backed and real inbox testing remain pending because local MySQL is unavailable. Existing issued login tokens are not revoked by this change; they retain their existing expiry behavior.
