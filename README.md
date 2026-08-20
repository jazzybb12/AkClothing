# Clothing Brand E-Commerce Platform

Pakistan-focused clothing store: Cash on Delivery, Leopards/PostEx courier
integration, WhatsApp ordering, and a simple admin panel so the store owner can
manage products, prices, stock, and orders without a developer.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design (data model, API
map, admin panel flow, deployment layout).

## Stack

Next.js + Tailwind (frontend) · Express + TypeScript (backend) · MySQL + Prisma
(database) · JWT + RBAC (auth) · Cloudinary (images).

MySQL was chosen over PostgreSQL specifically because the deployment target is Hostinger
shared hosting, which only offers MySQL databases (no Postgres, no Docker, no root
access) — see "Deploying to Hostinger Shared Hosting" below. A Docker Compose + VPS path
is also kept as a documented fallback further down, in case that's ever preferred instead.

## Local development

Prerequisites: Node.js 20+, a local MySQL 8+ server, npm.

```bash
# 1. Backend
cd backend
cp .env.example .env      # edit DATABASE_URL, JWT secrets, Cloudinary/courier keys
npm install
npx prisma migrate dev    # creates tables
npm run seed               # creates an admin user — check the console output for the password
npm run dev                 # http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:3000
```

Admin panel: http://localhost:3000/admin/login — sign in with the email/password
printed by `npm run seed` (defaults to `admin@example.com` / `ChangeMe123!` unless you
set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `backend/.env` first). **Change this
password after your first login.**

### Running everything in Docker instead

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

This starts MySQL, backend, frontend, and Nginx together. Run migrations/seed once
inside the backend container the first time:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

## Configuration you need to fill in before going live

| Variable | Where | Purpose |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | `backend/.env` | Product image uploads from the admin panel |
| `LEOPARDS_API_KEY` / `LEOPARDS_API_PASSWORD` | `backend/.env` | Leopards Courier shipment booking + tracking |
| `POSTEX_TOKEN` | `backend/.env` | PostEx shipment booking + tracking |
| `WHATSAPP_DEFAULT_NUMBER` | `backend/.env` (and mirrored via Admin → Settings) | WhatsApp ordering button |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `backend/.env` | Must be long random strings in production |

Until real Leopards/PostEx credentials are added, order status can still be moved
through the pipeline manually — only the automatic shipment-booking step (triggered
when an order is marked "Confirmed") requires live courier API keys.

## Deploying to Hostinger Shared Hosting (chosen path)

Hostinger's shared/cloud plans support Node.js apps via a **"Deploy Your Web App"**
wizard in hPanel (Websites → your site → that deploy flow) — it natively supports both
Next.js (frontend) and Express (backend), deployed from a Git repo or a direct upload.
This app deploys as **two separate web apps** under that wizard: one for `frontend/`,
one for `backend/`.

1. **Get the code into a Git repo.** This folder isn't a git repo yet. Push it to a
   private GitHub repo — the deploy wizard's "Import Git repository" option connects to
   GitHub directly and is much smoother than re-uploading a zip on every change. Do
   **not** commit real `.env` files — keep `backend/.env`/`frontend/.env` in `.gitignore`
   (already the case) and set the real values as environment variables in each app's
   hPanel settings instead (see step 4).
2. **Create the MySQL database** (already done in hPanel → Databases → MySQL Databases,
   per this project's setup) and note its host, database name, username, and password —
   the deploy wizard's database section shows these, or hPanel → Databases → Management.
3. **Deploy the backend app**: in the wizard, point it at this repo with `backend/` as
   the app root, build command `npm install && npm run build`, start command
   `npx prisma migrate deploy && node dist/server.js`.
4. **Set backend environment variables** in that app's settings (mirroring
   `backend/.env.example`): `DATABASE_URL` (built from the MySQL credentials from step 2,
   e.g. `mysql://user:pass@host:3306/dbname`), fresh `JWT_ACCESS_SECRET`/
   `JWT_REFRESH_SECRET` (`openssl rand -base64 48`, don't reuse dev ones), your real
   Cloudinary keys, `CORS_ORIGIN=https://your-domain.com`, and the rest from the example
   file. Run `npm run seed` **once** afterward (via the app's shell/SSH access, if
   offered) on the fresh empty database only — it wipes and reseeds, so never repeat it.
5. **Deploy the frontend app**: point it at `frontend/` as the app root, build command
   `npm install && npm run build`, start command `node server.js` (the standalone
   output — see `next.config.mjs`'s `output: "standalone"`).
6. **Set frontend environment variables**: `NEXT_PUBLIC_API_URL=https://your-domain.com/api`,
   `NEXT_PUBLIC_SITE_URL=https://your-domain.com`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.
7. **Point your domain** at whichever URL/path structure the deploy wizard assigns
   (usually it wires the domain automatically, or you connect it under Domains — the
   wizard's UI clarifies this per-app). SSL is normally handled automatically by
   Hostinger for domains on their own hosting (AutoSSL/Let's Encrypt via hPanel), unlike
   the manual certbot dance the VPS path below needs.
8. Log into `/admin/login` with the seeded admin credentials and **change the password
   immediately**.

## Deploying to a VPS (Ubuntu + Docker + Nginx) — alternative, not the current plan

Target: **Hostinger VPS** (KVM plan — shared/web hosting won't work here since this app
needs Docker + a persistent Postgres process, not just PHP file hosting). Any other
Ubuntu VPS provider works identically.

1. In hPanel, create a VPS and pick the **"Ubuntu 22.04 with Docker"** OS template (skips
   step 2). Point your domain's DNS A records (`@` and `www`) at the VPS's IP — hPanel's
   DNS Zone Editor if the domain is also on Hostinger.
2. Install Docker + Docker Compose plugin on the server (skip if you picked the Docker template).
3. Get the code onto the server — this folder isn't a git repo yet, so either push it to
   a private GitHub repo and `git clone` it on the VPS (best if you'll keep deploying
   updates), or `scp -r`/`rsync` it directly from your machine. Either way, **never**
   commit or copy your real `backend/.env` into a public repo — copy it to the server
   separately (`scp backend/.env root@your-ip:/path/to/backend/.env`).
   Then `cp backend/.env.example backend/.env` and `cp frontend/.env.example frontend/.env`
   on the server (if you didn't just copy the real ones over) and fill in production values:
   generate **fresh** `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (don't reuse the dev ones —
   `openssl rand -base64 48`), your real Cloudinary/courier keys, and set `CORS_ORIGIN`,
   `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` to `https://your-domain.com` (with `/api`
   on the API URL).
4. Edit `nginx/nginx.conf` — replace `your-domain.com` with your real domain.
5. `docker compose up -d --build`. The backend container runs `prisma migrate deploy`
   automatically on startup (see its command in `docker-compose.yml`) — no separate
   migrate step needed. Run `docker compose exec backend npm run seed` **once**, only on
   a fresh empty database, to create the first admin login — it wipes and reseeds, so
   never run it again afterward. Log in and change that password immediately.
6. Issue a free SSL certificate with certbot (run once, after the site is reachable
   over plain HTTP on your domain):
   ```bash
   docker run --rm -v certbot_www:/var/www/certbot -v certbot_conf:/etc/letsencrypt \
     certbot/certbot certonly --webroot -w /var/www/certbot -d your-domain.com -d www.your-domain.com
   ```
7. Uncomment the HTTPS `server` block in `nginx/nginx.conf`, add a redirect from port 80
   to 443 in the first block, then `docker compose restart nginx`.
8. Set up a cron job or systemd timer to run `certbot renew` every ~60 days (mount the
   same volumes) and reload Nginx afterward.

## What's built vs. what's left

Done: auth + RBAC, product/variant/category CRUD, cart + COD checkout with server-side
stock/price re-validation, coupon codes, order tracking, courier adapter structure for
Leopards + PostEx, Cloudinary image uploads, WhatsApp button, SEO metadata/sitemap, admin
dashboard/products/orders/coupons screens, Docker Compose + Nginx.

Left for you (or a follow-up session) before launch: real Leopards/PostEx API
credentials and sandbox testing, automated tests, category management UI, settings UI
for the WhatsApp number/default courier (the API endpoints already exist — see
`GET/PATCH /api/admin/settings`), and production SSL cert issuance on your real domain.
