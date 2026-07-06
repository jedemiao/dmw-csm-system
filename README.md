# DMW Client Satisfaction Measurement (CSM) System

Digitizes and administers the Anti-Red Tape Authority's mandatory Client Satisfaction Measurement survey (PSA Approval No. ARTA-2242-3) for the Department of Migrant Workers, Regional Office XIII (Caraga).

## What it does

- **Public survey form** (`/survey`) — the official CSM form (demographics, CC1-CC3 Citizen's Charter awareness, SQD1-8 satisfaction items), accessed by clients via a QR code posted at the service counter. No login required.
- **Admin dashboard** (`/admin`) — internal reporting for DMW staff: response browsing, analytics, generated PDF reports (monthly/quarterly/semester/annual), and the printable QR code. Requires an admin login.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + React 19 + TypeScript
- PostgreSQL via [Prisma 7](https://www.prisma.io/) (driver adapter, `@prisma/adapter-pg`)
- Tailwind CSS v4 for admin UI; hand-rolled CSS (`app/globals.css`) matching the existing DMW brand system for the public-facing pages
- `@tanstack/react-table` (admin tables), `recharts` (analytics charts), `@react-pdf/renderer` (report PDFs), `qrcode` + `sharp` (branded survey QR code)
- Custom session auth (bcrypt + a revocable `Session` table) — no third-party auth provider
- Deployed on Vercel

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (local or hosted)

### Setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL (and DIRECT_URL if using a pooled connection)
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The app runs at `http://localhost:3000`. The public survey is at `/survey`; the admin dashboard is at `/admin` (see `prisma/seed.ts` / `prisma/add-admins.ts` for admin accounts).

### Environment variables

| Variable       | Purpose                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Runtime connection string (can be a pooled/pgbouncer connection).                            |
| `DIRECT_URL`   | Direct (non-pooled) connection used only by the Prisma CLI for migrations. Falls back to `DATABASE_URL` if unset. |
| `NODE_ENV`     | Marks session cookies `Secure` only in production.                                           |

### Scripts

| Command              | Description                                          |
| --------------------- | ----------------------------------------------------- |
| `npm run dev`         | Start the dev server (Turbopack).                     |
| `npm run build`       | Run pending Prisma migrations, then build for production. |
| `npm start`           | Start the production server.                          |
| `npm run lint`        | Run ESLint.                                           |

## Project structure

```
app/
  survey/          Public CSM survey form
  admin/
    login/         Admin login
    (protected)/   Admin dashboard (overview, responses, analytics, reports, QR code)
  api/             Auth and notification endpoints
components/        Shared UI (site header/footer, admin sidebar/topbar)
lib/
  auth/            Session, password hashing, and access-control helpers
  reports/         Report aggregation and PDF generation
  validation/       Zod schemas for form input
prisma/
  schema.prisma    Data model (SurveyResponse, AdminUser, Session, ...)
  migrations/      Migration history
proxy.ts           Edge-level route guard for /admin and /api/admin
```

## Design reference

UI decisions follow `front-end-skill.md` (public-sector preset) and `taste-skill.md` in the repo root. Brand tokens (navy header/footer, light-blue service tiles, PH seal) are inherited from the existing dmw.gov.ph site, not invented — see `CLAUDE.md` for the full design brief.
