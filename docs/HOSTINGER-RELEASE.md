# Dune release — September 21, 2026

## Stack and delivered features

Frontend: Next.js 14, React 18, TypeScript, Tailwind, Recharts. Backend: Express, TypeScript, Prisma 5 and MySQL. Services: Resend email, Cloudinary images, optional Leopards/PostEx shipping.

This release includes Dune storefront styling and shared light/dark layouts, catalog/collections, admin-controlled announcements and banner appearance, compact rotating reviews with admin-managed photos, and six-digit email password resets. Existing cart, checkout, wishlist, tracking, accounts, reports, staff permissions and admin management routes remain present.

## Verification performed

- Backend production build passed, with Prisma generated before TypeScript compilation.
- Frontend production build passed, including all 40 pages and standalone static/public asset copying.
- Password reset regression suite passed (9 reported tests including parent suite).
- Local admin login and 20 read-only public/admin API requests passed: catalog, categories, collections, banners, settings, homepage reviews, shipping, staff, customers, orders, coupons, email templates and reports.
- Full browser checkout, payment processing, real inbox delivery, real Cloudinary upload and courier booking were not verified in this release check. API reads and builds are not proof of those external integrations.

## Cleanup

Standalone design concept pages and demo-data scripts were archived in ignored `.local/development-archive`. The Dune SVG remains in `frontend/public/concepts` because storefront components and local sample data reference it. Generated `tsconfig.tsbuildinfo` is no longer tracked. Local database files, credentials and demo records do not go to Git.

## Update the existing Hostinger deployment

1. Back up the live MySQL database. Keep the working local `.env` pointed at local MySQL.
2. Apply the three additive migrations to the live database through your established migration workflow, using a separate production connection:
   - `20260914000000_banner_appearance`
   - `20260914010000_password_reset_codes`
   - `20260917000000_dune_content`
   Run `prisma migrate deploy`, not `migrate reset`, `migrate dev`, or the seed command. Do not deploy this backend before these columns exist.
3. In Hostinger backend environment settings, retain live DATABASE_URL and JWT secrets; set NODE_ENV=production, CORS_ORIGIN=https://akclothings.shop, FRONTEND_URL=https://akclothings.shop, RESEND_API_KEY and RESEND_FROM_ADDRESS with the verified sender. Retain/configure Cloudinary and courier credentials as needed. Replace previously exposed secrets.
4. In frontend build environment, set NEXT_PUBLIC_API_URL=https://api.akclothings.shop/api and NEXT_PUBLIC_SITE_URL=https://akclothings.shop. The API URL is embedded at build time; never upload the locally built `.next` directory.
5. Merge the release branch into the branch connected to Hostinger, then redeploy backend and frontend from Git using the existing app roots. Backend start: `node dist/server.js`. Frontend standalone start: `node server.js` from the deployed standalone output.
6. Verify storefront, live admin login, password-reset delivery, product image upload and a controlled checkout. Configure the announcement/WhatsApp number in Admin > Settings. Use real customer reviews and catalog content.

The local sample catalog/orders/reviews remain local and are not part of this deployment. No live database mutation or deployment was performed during preparation.
