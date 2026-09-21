# ak.shop design concepts and feature review

## Four interactive concepts

Open `/concepts/index.html` on the frontend server. These standalone previews use sample collection names and code-drawn garment illustrations; they do not depend on MySQL. All four share controls and supporting sections while changing hero composition, typography, palette, and shapes.

| Concept | URL suffix | Direction |
|---|---|---|
| Atelier | `?concept=atelier` | Ivory and sage, editorial serif, floating sculptural shirt, restrained shopping grid |
| Orbit | `?concept=orbit` | Midnight and periwinkle, rounded stage, metallic-looking sphere, futuristic typography |
| Dune | `?concept=dune` | Terracotta and sand, reversed hero, architectural arch, heritage-inspired textures |
| Electric | `?concept=electric` | Acid yellow and violet, bold uppercase type, hard borders, angled announcement strip |

Public previews contain no customization controls. Banner editing lives in Admin > Banners: text and photo editing plus a separate appearance editor for height, image position, perspective, and background accent, with a preview and explicit save. The public concepts remain fixed design examples; saved appearance applies to the actual homepage carousel. Images have CSS perspective depth; this is not a 3D garment viewer. Store and support links lead to existing application routes. No checkout behavior is simulated.

## Existing feature inventory

Preview update: all four concepts now include an animated announcement strip, two rotating groups of three photo-review cards (five-second interval), previous/next buttons, a shared motion pause button, hover/focus pauses, reduced-motion support, and a persistent light/dark toggle. Campaign text is explicitly a demo (20%); the WhatsApp number is pending and the link leads to Contact. Testimonials are labeled sample reviews with illustrative Unsplash stock photography, not real customer submissions. These enhancements are in the static design previews; actual customer photo-review storage and admin campaign settings have not been added to the production app. The existing production header already has a theme toggle.

Photo previews require internet access; unavailable photos have a text fallback. JavaScript syntax and the stylesheet HTTP response were checked, but browser interaction has not been automated.

Source review of frontend routes/components and backend modules, September 14, 2026. Presence in code does not establish successful end-to-end behavior.

| Area | Present in the project | Dependencies / review notes |
|---|---|---|
| Homepage | Hero carousel, category browsing, collections, featured/latest products, curated review marquee, editable section headings and product limit | Content comes from API; database failure can produce empty sections |
| Navigation | Store header/footer, theme switching, brand mark, WhatsApp entry point | Configure branding and WhatsApp number |
| Product discovery | Search; category, size, color, price filters; sorting; collection pages | Catalog requires MySQL |
| Product details | Images, size/color variants, related products, reviews, cart/wishlist interactions | Inventory and product data require API |
| Cart and checkout | Cart, shipping address, selectable shipping methods, coupon validation and auto-apply, COD and bank deposit, order confirmation | Bank deposit is not an online card gateway; payment/shipping options depend on settings |
| Accounts | Registration, login, account orders, forgot/reset password; backend account update | Auth requires database and JWT settings; delivered reset email requires Resend |
| Tracking | Public order tracking and account order history | Courier synchronization requires configured courier integration |
| Reviews | Product reviews, customer submission, deletion rules, homepage curation | Customer review submission requires login |
| Contact and newsletter | Contact form, newsletter subscription and admin subscriber management | Email delivery requires service configuration |
| Information and discovery | About, FAQ, shipping/returns, privacy, terms, sitemap, robots | Business copy and policy accuracy still need owner review |
| Admin dashboard | Sales/revenue and traffic reporting components, date selection | Needs real order and page-view data |
| Admin catalog | Product creation/editing, variants, stock, images, categories, collections | Cloudinary required for uploads |
| Admin orders/customers | Order management, status changes, customer lists and detail/history | Live courier booking must be tested with authorized credentials |
| Admin merchandising | Banners, coupons, review curation, homepage/store settings | Existing banner fields listed below |
| Admin operations | Shipping methods, staff/team access, email templates, newsletter, product/customer reports and CSV exports | Role and permission checks present; operational testing outstanding |
| Backend integrations | Prisma/MySQL, JWT auth, Cloudinary signing, Resend, Leopards/PostEx adapters | Configuration and integration credentials determine availability |

## Existing banner capabilities and proposed additions

`HeroCarousel.tsx` rotates slides every five seconds and supports manual slide buttons. Existing admin controls/API support heading, eyebrow, subtext, CTA label/link, image upload, three gradient choices, position/order, and active visibility. Images currently use cover cropping. Hero spacing is fixed in CSS.

The admin appearance editor now includes height, focal position, accent, and perspective. Banner schema fields, migration, validated API updates, admin controls, and carousel rendering are implemented. Before deploying this change, apply `backend/prisma/migrations/20260914000000_banner_appearance/migration.sql` through the normal `npx prisma migrate deploy` workflow against the intended database. The migration has not been applied locally because MySQL is unavailable. A production carousel should also gain a pause control and reduced-motion handling for automatic slide changes. Responsive desktop/mobile images would improve cropping on phones.

## Known blockers and verification limits

- Local frontend and backend started successfully in the previous task; home and health returned HTTP 200. Database-backed product requests returned HTTP 500 because MySQL at localhost:3306 was unavailable. Full shopping and admin flows remain unverified.
- Local email variables were missing at the last configuration check. Production email settings have not been inspected. Current email helper logs messages when no Resend key exists and logs provider errors without throwing, so the reset form confirmation is not delivery proof.
- Production default admin login returned 401 earlier. The user subsequently identified an active admin account with a different email. A successful login with that account has not been verified.
- The recovery command exists locally and was type-checked; no recovery against the production database was performed.
- The design previews use no external image/font dependencies. JavaScript syntax validation passed. Browser interaction and visual rendering have not been automated in this environment.

## Suggested implementation order

1. Select a concept and supply actual campaign/product imagery.
2. Restore a local development database and configure/test email and image services.
3. Apply the selected layout to existing components while preserving shopping and admin routes.
4. Add persistent banner controls with a migration and admin editing UI.
5. Verify mobile layout, keyboard access, checkout, account reset, inventory, and admin permissions with test data before deployment.
