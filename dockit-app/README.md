# Dockit · Receipts

A personal receipt-keeping app: snap a photo → AI reads merchant/total/GST → save with a category + project. Browse, filter by date, export CSV for tax. Web + mobile (PWA — install to home screen).

This is a complete, real app — not a prototype. Follow the steps below and you'll have it running on your phone and your laptop in **under an hour**, with $0 monthly cost.

> Looking for the prototype you saw first? It's `Dockit · Receipts App.html` at the repo root — keep it as a design reference.

---

## What you need to set up (one-time)

You'll create accounts on **three** services. All free.

| # | Service | Why | URL |
|---|---|---|---|
| 1 | **GitHub** (you have this) | hosts the code + serves the live site | github.com |
| 2 | **Supabase** | database, file storage, auth | supabase.com |
| 3 | **Mindee** *(optional but recommended)* | OCR — reads photos of receipts | mindee.com |

---

## Step 1 — Supabase (10 minutes)

1. Go to **supabase.com**, sign up, **New project**.
   - Name: `dockit`
   - Database password: anything, store it somewhere
   - Region: pick the closest one
   - Wait ~2 min for it to provision.

2. **Run the schema.** Sidebar → **SQL Editor** → **New query**. Paste the entire contents of [`dockit-app/supabase/schema.sql`](dockit-app/supabase/schema.sql), click **Run**. You should see "Success. No rows returned."

3. **Create the storage bucket** for receipt images. Sidebar → **Storage** → **New bucket**:
   - Name: `receipt-images`
   - **Private** (leave Public off)
   - Create.

   The schema you ran in step 2 already wrote the RLS policies for this bucket — every uploaded file has to live under your user-id folder.

4. **Grab your API keys.** Sidebar → **Project Settings** → **API**. Copy these two:
   - `Project URL` → starts with `https://`
   - `anon public` key → long `eyJ…` string

   Keep these handy for step 4.

5. *(Optional but recommended)* **Lock the magic-link to your email only** so randoms can't sign up. Sidebar → **Authentication** → **Providers** → **Email** → set **Enable email confirmations: on**, then **Authentication** → **Policies** → for `auth.users`, add a policy that only allows your own email through. Or just don't share the URL with anyone.

---

## Step 2 — Mindee for OCR *(optional)*

If you skip this, the app still works — you just type merchant/total/date yourself. With it, you snap the photo and the form pre-fills.

1. Go to **mindee.com**, sign up. Free tier: **250 free receipt scans per month** — plenty for personal use.

2. **Create an API key.** Dashboard → **API Keys** → **Create new** → copy the token.

3. **Deploy the parse-receipt edge function** to Supabase. From your laptop (you need the [Supabase CLI](https://supabase.com/docs/guides/cli) — `brew install supabase/tap/supabase` on Mac):
   ```bash
   cd dockit-app
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF   # find this in your Supabase URL
   supabase secrets set MINDEE_API_KEY=your_mindee_token_here
   supabase functions deploy parse-receipt
   ```

That's it — the function is live. The frontend will call it automatically when a receipt image is uploaded.

> Prefer Google Document AI instead? Replace the Mindee call in `dockit-app/supabase/functions/parse-receipt/index.ts` — same input (image bytes), same output (`{merchant, date, total, gst, ...}`).

---

## Step 3 — Run it locally (5 minutes)

```bash
cd dockit-app
cp .env.example .env.local
# Open .env.local in any editor — paste your Supabase URL + anon key from Step 1.4
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173/`). Sign in with your email → click the magic link → you're in.

Add a receipt. Add a category. Drag it around.

---

## Step 4 — Deploy to GitHub Pages (free, public URL)

1. **Push this whole folder** to a new GitHub repo. E.g.:
   ```bash
   git init
   git add .
   git commit -m "Initial Dockit"
   git remote add origin https://github.com/YOUR-NAME/dockit.git
   git push -u origin main
   ```

2. On the repo on github.com → **Settings → Pages → Source: GitHub Actions**.

3. Same Settings page → **Secrets and variables → Actions → New repository secret**. Add two:
   - `VITE_SUPABASE_URL` — same value as in your `.env.local`
   - `VITE_SUPABASE_ANON_KEY` — same value as in your `.env.local`

4. Push any commit. The workflow in `.github/workflows/deploy.yml` builds and deploys. Watch it on the **Actions** tab. ~2 minutes.

5. Your app is live at `https://YOUR-NAME.github.io/dockit/`.

> **Magic-link gotcha:** add this exact URL to **Supabase → Authentication → URL Configuration → Redirect URLs**, otherwise the magic link won't sign you in on the deployed version.

> **Custom domain (optional):** add a `CNAME` file in `dockit-app/public/` with your domain, point a DNS CNAME at `YOUR-NAME.github.io`, and remove `VITE_BASE_PATH` from the workflow.

---

## Step 5 — Install on your phone

1. Open the deployed URL in Safari (iPhone) or Chrome (Android).
2. **iPhone:** Share button → **Add to Home Screen**. **Android:** the browser will prompt, or use the ⋮ menu → **Install app**.
3. Open it from your home screen. It runs full-screen like a native app. Tap the camera FAB at the bottom — the OS camera opens, snap a receipt, done.

---

## What's where

```
dockit-app/
├── README.md                        ← (this file)
├── package.json, vite.config.ts     ← project config + PWA settings
├── .env.example                     ← copy to .env.local, fill in keys
├── index.html
├── public/
│   ├── favicon.svg
│   └── icon-192.png, icon-512.png   ← PWA install icons
├── supabase/
│   ├── schema.sql                   ← paste into Supabase SQL Editor (step 1.2)
│   └── functions/parse-receipt/     ← OCR edge function (step 2.3)
└── src/
    ├── main.tsx, App.tsx, styles.css
    ├── lib/
    │   ├── supabase.ts              ← client init
    │   ├── ocr.ts                   ← calls the edge function
    │   ├── types.ts                 ← row shapes (mirror schema.sql)
    │   ├── theme.ts                 ← colors, fonts, density
    │   └── format.ts                ← fmtNZD, fmtDate, monthlySpend
    ├── hooks/
    │   ├── useAuth.ts               ← session + magic-link signIn/signOut
    │   └── useData.ts               ← React Query hooks for all 3 tables
    ├── components/
    │   ├── AppShell.tsx             ← sidebar (desktop) + bottom tabs (mobile)
    │   └── ui.tsx                   ← Icon, Tag, Money, Donut, AreaChart…
    └── pages/
        ├── Login.tsx
        ├── Overview.tsx             ← donut + bars + recent feed
        ├── Receipts.tsx             ← list + filters
        ├── ReceiptDetail.tsx        ← single receipt + image
        ├── Capture.tsx              ← photo → OCR → review → save
        ├── Categories.tsx           ← add/edit/recolour categories
        ├── Projects.tsx             ← projects with budgets
        └── Export.tsx               ← CSV download
```

`.github/workflows/deploy.yml` at the repo root handles GitHub Pages deployment.

---

## Anatomy of the data layer

Three Postgres tables, each scoped by `user_id` with Row-Level Security so users only see their own rows. The `seed_defaults_for_new_user` trigger gives every new sign-up 8 starter categories and one "Household / Personal" project. See [`supabase/schema.sql`](dockit-app/supabase/schema.sql) for everything — it's commented.

Receipt images live in the `receipt-images` storage bucket under `<user_id>/<timestamp>-<random>.jpg`. RLS on the bucket means the user-id has to match the first folder segment, so users can't see each other's images.

---

## Extending it

A few ideas, ordered by impact:

- **Tax-ready PDF export** — wire `jsPDF` or `pdf-lib` into `pages/Export.tsx`. The data is already filtered for you.
- **Edit receipts** — the `ReceiptDetail` page has the data; copy the form bits from `Capture.tsx` into an edit mode and call `update.mutate(...)`.
- **Recurring receipts** — add an `is_recurring` flag + a daily cron via Supabase to auto-create the next instance.
- **Multi-user (shared household)** — add a `households` table and change RLS to `user is member of household`.
- **Bank import** — add a `bank_transactions` table, write a tiny parser for your bank's CSV export, surface "unmatched receipts" so you reconcile.

The codebase is small (~1500 LOC) and unopinionated — you can do all of the above without restructuring.

---

## Costs

| | Free tier | Paid if you grow |
|---|---|---|
| Supabase | 500 MB DB, 1 GB storage, 50k auth users | $25/mo for 8 GB DB + 100 GB storage |
| Mindee | 250 receipt scans/month | $0.10 / scan beyond |
| GitHub Pages | 100 GB bandwidth/mo | n/a for personal |
| **Total** | **$0** | unlikely to exceed for personal use |

---

## Privacy

- Receipt images are in **your** Supabase storage bucket, RLS-locked to your user-id.
- Receipt rows are in **your** Postgres tables, RLS-locked to your user-id.
- The only third party that touches images is Mindee — only when you take a photo, only the photo itself, only to extract text. If you skip step 2, no third party sees anything.
- All Supabase data exports as CSV/JSON any time. There is no lock-in.

If you'd prefer **everything on your own hardware**: replace Supabase with self-hosted Supabase or [PocketBase](https://pocketbase.io) (single binary, SQLite). The frontend is portable — only `lib/supabase.ts` needs to change.
