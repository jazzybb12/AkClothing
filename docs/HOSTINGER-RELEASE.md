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

## Current launch procedure (latest admin changes)

Rechecked September 21: backend production build passed; frontend production build passed (40 pages); password-reset suite passed 9 tests. Real production email, upload, checkout and courier integration still require live smoke tests. Latest product/collection/order editor changes are not yet committed or pushed.

1. Use the existing Hostinger Node.js apps: frontend root frontend on akclothings.shop, backend root backend on api.akclothings.shop. Hostinger Business/Cloud Node.js hosting supports Next.js and Express. Keep the existing working runtime version; this local check used Node 24.
2. For the requested fresh launch, create a NEW MySQL database/user in hPanel. Keep the previous database for rollback.
3. If publishing local content, export brand_db_mysql using MySQL Workbench Data Export (structure and data, including _prisma_migrations), then import that SQL into the new database using phpMyAdmin. Review local demo orders, users, reviews and content before export. Do not put the dump in Git. A full import also transfers local account password hashes. Cloudinary images remain in Cloudinary; retain access to that account.
4. Run npm run prisma:deploy from backend using a separate terminal's production DATABASE_URL override. Use the remote MySQL hostname supplied by Hostinger and allow your current IP in Remote MySQL if connecting from your computer. Do not change the local .env. The server's runtime hostname may differ from the remote-access hostname. Close that terminal afterward. This repository applies migrations separately, not at API startup. Do not run seed/reset. For a blank database, migrations create structure only; admin:recover can create the admin using production-scoped SEED_ADMIN_EMAIL/PASSWORD.
5. Configure backend environment: NODE_ENV=production, DATABASE_URL for the new Hostinger database, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN=https://akclothings.shop, FRONTEND_URL=https://akclothings.shop, RESEND_API_KEY, RESEND_FROM_ADDRESS=ak.shop <noreply@akclothings.shop>, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. Configure actual courier credentials before booking shipments. Allow Hostinger to supply PORT. Rotate previously exposed secrets.
6. Frontend build environment: NEXT_PUBLIC_API_URL=https://api.akclothings.shop/api and NEXT_PUBLIC_SITE_URL=https://akclothings.shop. Rebuild on Hostinger after setting these.
7. Commit/review the pending changes, then push to the branch selected in BOTH Hostinger apps. Current local branch: release/dune-local-ready. Confirm the Hostinger branch before pushing because automatic deployment may publish it immediately.
8. Backend: install including dev dependencies (npm ci --include=dev), build npm run build, start npm start (node dist/server.js from backend root). Frontend: build npm run build; standalone output .next/standalone, entry server.js within that output. If starting from frontend root, use node .next/standalone/server.js. Preserve Hostinger's working Next.js preset if already configured.
9. Deploy backend first, then frontend. Verify HTTPS, admin login, products/collections, order submission/status, image upload and actual password reset inbox delivery. Confirm production requests go to api.akclothings.shop, never localhost.

Do not upload local node_modules, .next, .env, .local or Windows-generated Prisma binaries. Hostinger should build from source. No deployment or database transfer has been performed by this check.
