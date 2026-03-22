# Golden Bake & Cakes

Luxury bakery website for Golden Bake & Cakes in Gurgaon, India.

## What is included

- Premium luxury homepage with parallax hero, reveal animations, glassmorphism cards, and curated use of all provided brand images
- Full menu system with category filters, search, quantity controls, add-to-cart, and checkout
- WhatsApp-integrated online ordering flow
- Custom cake booking form with WhatsApp follow-up
- Admin login and dashboard for products, orders, and bookings
- Storage layer for `products`, `categories`, `orders`, and `bookings`

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Local asset optimization with `next/image`
- Hybrid storage:
  - Local file storage by default for development
  - Neon/Postgres via `DATABASE_URL` when deployed

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment

Copy `.env.example` to `.env.local` and set values as needed.

```bash
DATABASE_URL=
ADMIN_EMAIL=admin@goldenbakecakes.in
ADMIN_PASSWORD=GoldenBake123!
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
```

## Admin access

- URL: `/admin`
- Default email fallback: `admin@goldenbakecakes.in`
- Default password fallback: `GoldenBake123!`

Set your own secure values before production use.

## Database notes

- Local development writes to `data/store.json`
- If `DATABASE_URL` is present, the app uses Neon/Postgres and auto-creates the required tables
- SQL schema reference: [database/schema.sql](/Users/Mcman/Downloads/bakery/database/schema.sql)

## Vercel deployment

1. Import the project into Vercel.
2. Add `DATABASE_URL` if you want persistent cloud storage.
3. Add secure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.
4. Deploy.

Without `DATABASE_URL`, the public site still works, but persistent admin/order data is best handled with Neon/Postgres in production.

## Verification

- `npm run lint`
- `npm run build`
