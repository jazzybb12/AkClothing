# Architecture — Clothing Brand E-Commerce Platform

## 1. Overview

A Pakistan-focused clothing e-commerce platform. Cash on Delivery is the only payment
method, orders ship via **Leopards Courier** or **PostEx**, and customers can order
through a WhatsApp button in addition to the normal cart/checkout flow. The admin panel
is intentionally simple: the store owner must be able to add products, change prices,
mark items out of stock, and view orders without developer help.

## 2. Tech stack

| Layer          | Choice                                             |
|----------------|-----------------------------------------------------|
| Frontend       | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend        | Node.js + Express + TypeScript                     |
| Database       | PostgreSQL + Prisma ORM                            |
| Auth           | JWT (access + refresh) + role-based access control |
| File storage   | Cloudinary (signed uploads)                        |
| Courier        | Leopards Courier API + PostEx API (adapter pattern)|
| Deployment     | Docker Compose + Nginx reverse proxy on Ubuntu VPS |

## 3. Repository layout

```
/frontend        Next.js storefront + admin panel
/backend          Express API
  /src
    /modules       auth, products, orders, coupons, courier, uploads, admin
    /middleware     authenticate, requireRole, errorHandler
    /prisma         schema.prisma, migrations, seed.ts
/nginx            reverse proxy config
/docs             this document
docker-compose.yml
```

## 4. Data model

See `backend/prisma/schema.prisma` for the source of truth. Summary:

- **User**(id, name, email, phone, passwordHash, role[CUSTOMER|ADMIN|STAFF])
- **Category**(id, name, slug, parentId)
- **Product**(id, name, slug, description, basePrice, categoryId, status[ACTIVE|DRAFT], seoTitle, seoDescription)
- **ProductVariant**(id, productId, size, color, sku, priceOverride, stockQty, isOutOfStock)
- **ProductImage**(id, productId, variantId, url, altText, position)
- **Coupon**(id, code, type[PERCENTAGE|FIXED], value, minOrderAmount, usageLimit, usedCount, expiresAt, active)
- **Order**(id, orderNumber, userId, status, paymentMethod[COD], subtotal, discountAmount, shippingFee, total, shippingAddress(json), couponId, courierProvider, courierTrackingNumber, courierStatus)
- **OrderItem**(id, orderId, productId, variantId, productNameSnapshot, size, color, qty, unitPrice, lineTotal)

The cart is **not** persisted server-side in v1 — it lives in the browser (localStorage)
and is re-validated (price + stock) on the server at checkout time.

## 5. Auth & RBAC

- Access token: JWT, ~15 min, returned in the response body.
- Refresh token: JWT, ~7 days, set as an httpOnly secure cookie.
- `authenticate` middleware verifies the access token and attaches `req.user`.
- `requireRole(...roles)` middleware guards admin/staff-only routes.
- Guest checkout is allowed — a login is not required to place a COD order.

## 6. REST API map

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/products                          filters: category, size, color, minPrice, maxPrice, q, page
GET    /api/products/:slug
POST   /api/products                          [ADMIN]
PATCH  /api/products/:id                      [ADMIN]
DELETE /api/products/:id                      [ADMIN]
PATCH  /api/products/:id/variants/:variantId  [ADMIN]  stock qty / out-of-stock / price override

GET    /api/categories
POST   /api/categories                        [ADMIN]
PATCH  /api/categories/:id                    [ADMIN]
DELETE /api/categories/:id                    [ADMIN]

POST   /api/coupons/validate
GET    /api/coupons                           [ADMIN]
POST   /api/coupons                           [ADMIN]
PATCH  /api/coupons/:id                       [ADMIN]

POST   /api/orders                            guest or authed checkout
GET    /api/orders/track                      query: orderNumber, phone
GET    /api/orders                            [ADMIN] filters: status, from, to
GET    /api/orders/:id                        [ADMIN]
PATCH  /api/orders/:id/status                 [ADMIN]

POST   /api/uploads/sign                      [ADMIN] Cloudinary signed upload params

GET    /api/admin/dashboard                   [ADMIN] today's orders/revenue, low stock
```

## 7. Courier integration

`backend/src/modules/courier/CourierAdapter.ts` defines a shared interface:

```ts
interface CourierAdapter {
  createShipment(order: OrderWithItems): Promise<{ trackingNumber: string; raw: unknown }>;
  trackShipment(trackingNumber: string): Promise<{ status: string; raw: unknown }>;
}
```

`LeopardsAdapter` and `PostExAdapter` implement it against their respective REST APIs.
`CourierService` resolves the adapter to use from `order.courierProvider` (chosen by the
admin, defaulting to a value in `Settings`). The frontend never talks to a courier
directly — it always calls our own `/api/orders/track`, which proxies through the
adapter, so courier API keys never leave the server.

**Status:** adapters are structurally complete with real endpoint shapes documented in
code comments, but need live API keys and sandbox testing before going to production —
see `// TODO(courier-live)` markers.

## 8. WhatsApp ordering

A floating `WhatsAppButton` component appears on every storefront page, and each product
page has an "Order on WhatsApp" button. Both build a `https://wa.me/<number>?text=...`
link with a prefilled message (product name, size, color, page URL). The store's
WhatsApp number is an admin-editable setting, not hardcoded. Upgrading later to the
WhatsApp Business Cloud API (for automated order-status messages) is a drop-in addition,
not a rearchitecture.

## 9. Admin panel

Route group `/admin`, gated by `requireRole('ADMIN', 'STAFF')` on both the API and a
client-side redirect guard.

- **Dashboard** — today's orders, today's revenue, low-stock list.
- **Products** — table with inline price edit and an out-of-stock toggle per variant;
  "Add Product" form with a size × color stock grid and drag-and-drop Cloudinary upload.
- **Orders** — filterable table, detail view, one-click status update (moving to
  "Confirmed" triggers courier shipment creation).
- **Coupons** — list + create form.
- **Settings** — WhatsApp number, default courier provider, store contact info.

## 10. SEO

- Per-page metadata via the Next.js Metadata API, driven by `seoTitle`/`seoDescription`.
- Auto-generated `sitemap.xml` / `robots.txt`.
- JSON-LD `Product` structured data (price, availability, image) on product pages.
- Clean, human-readable slugs; OpenGraph tags for social sharing.

## 11. Deployment

`docker-compose.yml` runs four services: `frontend`, `backend`, `postgres`, `nginx`.
Nginx terminates SSL (Let's Encrypt via certbot, documented in the root README) and
reverse-proxies `/` to the frontend and `/api` to the backend. See the root `README.md`
for local dev and VPS deployment steps.

## 12. Known gaps / next steps

- Live Leopards/PostEx credentials + sandbox testing.
- Automated tests (unit + e2e).
- Full admin CRUD polish (categories UI, settings UI).
- Production SSL cert issuance (requires a real domain pointed at the server).
