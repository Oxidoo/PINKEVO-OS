# PINKEVO OS

Le cockpit central de l'agence PINKEVO : CRM, leads, deals, projets, sites livrés, agents IA, automatisations, calendrier, documents, facturation, finance, notifications — tout en un seul onglet.

Plateforme propriétaire, utilisateurs internes uniquement (rôles distincts), non multi-tenant.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| DB / Auth / Storage / Realtime | Supabase (Postgres 15+) |
| ORM | Drizzle |
| UI | Tailwind CSS v4 + shadcn/ui + Radix |
| Animations | Framer Motion + canvas-confetti |
| Forms | React Hook Form + Zod |
| Data fetching | TanStack Query + React Server Components |
| State | Zustand |
| i18n | next-intl (FR par défaut, EN) |
| Background jobs | Inngest |
| AI orchestration | Vercel AI SDK (Anthropic, OpenAI) |
| Emails | Resend + React Email |
| Paiements | Stripe |
| Calendrier | Google Calendar + Cal.com |
| Bot reporting | Telegram |
| SEO / perf | Google PSI + Google Search Console |
| Lint/format | Biome |
| Tests | Vitest + Playwright |
| Logs | Pino |
| Hosting | Vercel |

## Démarrage

```bash
pnpm install
cp .env.example .env.local      # remplir les variables
pnpm db:push                    # initialiser la DB Supabase
pnpm seed                       # données de démo (Phase 2+)
pnpm dev                        # http://localhost:3000
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Dev server Next.js (Turbopack) |
| `pnpm build` | Build de prod |
| `pnpm start` | Sert le build |
| `pnpm lint` | Biome check (lint + format check) |
| `pnpm lint:fix` | Auto-fix Biome |
| `pnpm typecheck` | TypeScript strict, no emit |
| `pnpm test` | Tests unitaires Vitest |
| `pnpm test:e2e` | Tests Playwright |
| `pnpm db:generate` | Génère migration Drizzle à partir du schema |
| `pnpm db:push` | Push schema vers Supabase (dev) |
| `pnpm db:migrate` | Applique migrations (prod) |
| `pnpm db:studio` | UI Drizzle Studio |
| `pnpm seed` | Insère données de démo |
| `pnpm email:dev` | Preview des templates React Email |

## Architecture

```
pinkevo-os/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # login, signup
│   ├── (dashboard)/              # routes protégées (sidebar + topbar)
│   │   ├── dashboard/            # KPI globaux
│   │   ├── clients/ leads/ deals/ calendar/ websites/
│   │   ├── agents/ automations/ documents/ finance/ settings/
│   └── api/                      # webhooks (Stripe, Cal, Telegram, Inngest)
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── shared/                   # cards, empty states, skeletons
│   ├── celebrations/             # confetti, milestone toasts
│   └── modules/                  # widgets spécifiques aux modules
├── lib/
│   ├── db/                       # Drizzle client + schema (split par domaine)
│   ├── supabase/                 # server / browser / middleware clients
│   ├── auth/                     # helpers + RBAC
│   ├── ai/                       # providers, prompts, orchestration agents
│   ├── integrations/             # Stripe, Resend, Google, Cal.com, Telegram, GSC, PSI
│   ├── inngest/                  # functions (cron + event-driven)
│   ├── email/                    # templates React Email
│   ├── i18n/                     # config + dictionnaires loader
│   ├── env.ts                    # validation Zod des env vars
│   ├── logger.ts                 # Pino
│   └── utils.ts                  # cn helper
├── messages/                     # next-intl FR / EN
├── scripts/                      # seed.ts, etc.
├── tests/                        # unit (vitest) + e2e (playwright)
├── drizzle/                      # migrations générées
├── biome.json
├── drizzle.config.ts
├── middleware.ts                 # Supabase session refresh + protected routes
└── next.config.ts
```

## Rôles (RBAC)

| Rôle | Description |
|---|---|
| `owner` | Tout accès, gestion équipe, facturation, intégrations |
| `admin` | Idem owner sauf facturation Stripe et suppression compte |
| `manager` | Lecture totale + édition clients/projets/deals, lance les agents |
| `sales` | CRM, leads, deals, propales, agents prospection |
| `producer` | Projets, sites, audits, tâches, documents |
| `viewer` | Lecture seule |

RLS Postgres sur toutes les tables + helper `requireRole()` côté serveur en sécurité défense-en-profondeur.

## Roadmap

Voir [`PROGRESS.md`](./PROGRESS.md). Build par phases (0 → 11) : Setup, Foundations, CRM, Communication, Agents IA, Calendrier, Finance, Sites/Audits, Documents/Propales, Automatisations, Telegram, Dashboard & Polish.

## Conventions

- Server Components par défaut ; `'use client'` réservé à l'interactivité.
- Server Actions pour mutations internes ; Route Handlers pour webhooks publics.
- Zéro `any`. Drizzle infère les types depuis le schema. Zod valide tous les inputs externes.
- Naming : composants PascalCase, fichiers kebab-case, fonctions camelCase, env SCREAMING_SNAKE.
- Commits : Conventional Commits.
- A11y : labels, aria-labels, focus visible, contraste AA min.
- Aucun secret côté client. Tokens OAuth stockés chiffrés via `ENCRYPTION_KEY` (AES-GCM).
