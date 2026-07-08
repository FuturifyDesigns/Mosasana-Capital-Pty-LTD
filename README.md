# Mosasana Capital (PTY) LTD — Cash Loan Website

Professional cash loan services website built with **React**, **Supabase** (free tier), and **GitHub Pages**.

**Live site:** [mosasanacapital.com](https://mosasanacapital.com)  
**GitHub Pages fallback:** [futurifydesigns.github.io/Mosasana-Capital-Pty-LTD](https://futurifydesigns.github.io/Mosasana-Capital-Pty-LTD/)

Built by [Futurify Designs](https://futurifydesigns.com)

## Features

- **Loan applications** — secure online form with ID photo upload, physical address, and validation
- **Dual application channels** — apply via website or WhatsApp (parallel systems)
- **User accounts** — register, email verification, login, and track applications over time
- **Admin portal** — review loan requests and contact enquiries, update statuses
- **Contact page** — enquiry form stored in Supabase for admin review
- **Security** — Row Level Security, private ID document storage, CSP headers, input validation (Zod)
- **Responsive design** — light blue brand theme, smooth animations, mobile-friendly

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Supabase (Auth, PostgreSQL, Storage) — free tier |
| Email | Brevo (SMTP for Supabase email verification) |
| Hosting | GitHub Pages |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set your values:

```env
VITE_SUPABASE_URL=https://pwcootcdrbnadsbwduxi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_WHATSAPP_NUMBER=26773467206
```

### 3. Set up Supabase

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/pwcootcdrbnadsbwduxi/sql)
2. Run the full script in `supabase/schema.sql`
3. Promote admin users after they register:

```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tnkile@mosasanacapital.com');
```

### 4. Configure Brevo email verification

1. Create a Brevo account at [brevo.com](https://www.brevo.com)
2. In Supabase Dashboard → **Authentication** → **SMTP Settings**:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: your Brevo login email
   - Password: your Brevo SMTP key
3. Enable **Confirm email** under Authentication → Providers → Email

### 5. GitHub Pages deployment

1. In repo **Settings** → **Pages** → Source: **GitHub Actions**
2. Add repository secret `VITE_SUPABASE_ANON_KEY` with your Supabase anon key
3. Push to `main` — the workflow deploys automatically

### 6. Custom domain (mosasanacapital.com)

The site is configured to serve at **https://mosasanacapital.com** via GitHub Pages (`public/CNAME`).

#### A. Namecheap DNS

In Namecheap → **Domain List** → **Manage** → **Advanced DNS**, add:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `185.199.108.153` | Automatic |
| A Record | `@` | `185.199.109.153` | Automatic |
| A Record | `@` | `185.199.110.153` | Automatic |
| A Record | `@` | `185.199.111.153` | Automatic |
| CNAME | `www` | `futurifydesigns.github.io` | Automatic |

Remove any conflicting parking-page or URL-redirect records for `@` or `www`.

DNS can take up to 24–48 hours to propagate (often much faster).

#### B. GitHub Pages custom domain

1. Repo **Settings** → **Pages** → **Custom domain** → enter `mosasanacapital.com`
2. Wait for DNS check to pass, then enable **Enforce HTTPS**
3. Optionally add `www.mosasanacapital.com` as a second domain (redirects to apex)

#### C. Supabase auth redirects

In [Supabase Dashboard](https://supabase.com/dashboard/project/pwcootcdrbnadsbwduxi/auth/url-configuration), add:

- **Site URL:** `https://mosasanacapital.com`
- **Redirect URLs:** `https://mosasanacapital.com/**` and `https://www.mosasanacapital.com/**`

### 7. Google Sign-In (Supabase Auth)

The login and register pages include **Continue with Google**. Enable it once in Supabase and Google Cloud:

#### A. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. **Authorized JavaScript origins:**
   - `https://mosasanacapital.com`
   - `http://localhost:5173` (local dev)
4. **Authorized redirect URIs:**
   - `https://pwcootcdrbnadsbwduxi.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**

#### B. Supabase Dashboard

1. [Authentication → Providers → Google](https://supabase.com/dashboard/project/pwcootcdrbnadsbwduxi/auth/providers)
2. Enable **Google** and paste the Client ID and Client Secret
3. Confirm redirect URL shown by Supabase matches the Google Cloud redirect URI above

#### C. Live database (loan cap P10,000)

If the database was created before the P10,000 cap, run `supabase/fix-loan-cap.sql` in the SQL Editor.

### 8. Run locally

```bash
npm run dev
```

## Logo assets

Replace `public/logo-transparent.svg` and `public/favicon.svg` with the client's official logo files for production. The current SVGs are brand-matched placeholders.

## Admin access

Only users with `role = 'admin'` in the `profiles` table can access `/admin`. Promote officers via SQL after they register.

## Security notes

- ID documents are stored in a **private** Supabase Storage bucket
- Only admins can view ID photos via signed URLs
- All forms use Zod validation (client-side) and database constraints (server-side)
- Content Security Policy headers are set in `index.html`
- Row Level Security policies restrict data access per role

## Contact

**Principal Officer:** Tshepho Nkile, FCA — tnkile@mosasanacapital.com  
**Compliance Officer:** Olekantse Ndiweni — ondiweni@mosasanacapital.com

---

&copy; Mosasana Capital (PTY) LTD. Built by [Futurify Designs](https://futurifydesigns.com).
