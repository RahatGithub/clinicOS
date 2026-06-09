# ClinicOS — Project Context

## What this is
ClinicOS is a multi-tenant SaaS demo for diagnostic/healthcare centers, built as a portfolio piece to showcase to freelance clients (US/EU/AUS). It is an interactive, NON-persistent demo: data lives in mock JSON + in-session React state and resets on refresh. There is NO real backend and NO database.

## Tech stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui (new-york style)
- Framer Motion (UI interactions, transitions)
- GSAP + ScrollTrigger (landing-page scroll animations)
- lucide-react (icons)
- Package manager: pnpm ONLY (never npm/yarn)

## Commands
- Dev: pnpm dev
- Build: pnpm build
- Add shadcn component: pnpm dlx shadcn@latest add <name>

## Folder structure
- src/app/                routes (App Router)
- src/components/ui/       shadcn components
- src/components/shared/   shared app components (sidebar, topbar, stat cards, tables)
- src/components/landing/  landing-page sections
- src/lib/                 utils
- src/lib/data/            mock data
- src/types/               TypeScript types
- src/hooks/               custom hooks

## Roles (six)
1. Super Admin — platform level: tenants, plans, billing. CANNOT see any center's private data (patients, clinical, revenue).
2. Center Admin — one tenant: staff, patients overview, appointments overview, activity logs, center settings, branding.
3. Doctor — clinical: own schedule, assigned patients, consultations, prescriptions (PDF).
4. Nurse — pre-consultation: vitals/health-metric entry, queue. No prescriptions, no full history.
5. Receptionist — front desk: register patients, book/manage appointments, check-in. No clinical data.
6. Patient — REMOVED. No patient-facing pages exist in this app.

## Design tokens
- Theme: light mode, clean medical.
- Primary: yellow-orange gradient — linear-gradient(105deg, #F2700F 0%, #F89B1E 50%, #FCC23A 100%).
- Primary solid (text/borders/icons): #F08A1D. Deep: #D9700C. Tint: #FDEFD9.
- Fonts: Sora (headings), Inter (body/UI).
- Lists default to table/list view. Sidebar nav inside app, topbar on landing.
- Each center can upload a logo + cover image shown on its staff dashboards (multi-tenant branding).

## Conventions
- TypeScript strict. Prettier: no semicolons, single quotes, 2-space tabs.
- Prefer server components; use "use client" only when needed (state, effects, animation).
- Keep components in the correct folder per structure above.
- After any change, ensure `pnpm dev` compiles with no errors.

## Git rules (CRITICAL)
- Use my globally configured git identity. Never change it.
- Commit messages: conventional style (feat:, chore:, fix:, etc.).
- NEVER add "Co-authored-by", "Generated with", or any AI/tool attribution to commits. All commits are authored solely by me.
- Remote: https://github.com/RahatGithub/clinicOS.git, branch main.
