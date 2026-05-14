# PINKEVO OS — Progress

Suivi des phases de build. Une seule phase en `in_progress` à la fois.

## Phase 0 — Setup ✅

- [x] `create-next-app` (Next.js 16, TypeScript strict, Tailwind v4, App Router, Turbopack)
- [x] Runtime deps : Supabase SSR, Drizzle + postgres, TanStack Query, Zustand, Framer Motion, canvas-confetti, RHF + Zod, next-intl, Resend + React Email, Inngest, Vercel AI SDK + Anthropic/OpenAI providers, Stripe, Recharts, dnd-kit, Pino, @t3-oss/env-nextjs, sonner
- [x] Dev deps : Biome, Vitest + plugin-react, Playwright, drizzle-kit, tsx, dotenv
- [x] shadcn/ui init + 25 composants (button, card, input, label, dialog, sheet, dropdown-menu, table, tabs, sonner, avatar, badge, select, command, popover, calendar, skeleton, separator, scroll-area, switch, tooltip, textarea, checkbox, radio-group, input-group)
- [x] Biome configure (remplace ESLint + Prettier) ; règles `noExplicitAny: error`, `noConsole: warn`, a11y recommended
- [x] TS strict (`noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`)
- [x] `lib/env.ts` avec validation Zod de toutes les env vars (server + client)
- [x] `drizzle.config.ts` + squelette `lib/db/client.ts` + `lib/db/schema/index.ts`
- [x] Supabase clients (server, browser, middleware) + middleware Next.js avec garde auth
- [x] next-intl configuré (FR par défaut, EN dispo) + dictionnaires `messages/{fr,en}.json`
- [x] Layout dashboard avec sidebar + topbar
- [x] Pages placeholder (`ComingSoon`) pour les 10 modules + auth pages
- [x] Webhook stubs Stripe, Telegram, Cal.com
- [x] Inngest endpoint `/api/inngest` + client + functions
- [x] Theme PINKEVO (rose `#EC4899`, accent purple, success/warning/danger) en OKLCH light + dark
- [x] Geist Sans + Mono câblés
- [x] `.env.example` exhaustif
- [x] Scripts pnpm : `dev`, `build`, `lint`, `typecheck`, `db:generate`, `db:push`, `db:studio`, `db:migrate`, `seed`, `email:dev`, `test`, `test:e2e`

### Décisions techniques

- **Next.js 16** (et non 15) car c'est la dernière stable au moment du scaffold. App Router + RSC par défaut.
- **pnpm** comme gestionnaire (plus rapide, déterministe).
- **Biome** remplace complètement ESLint + Prettier (un seul outil, ~10x plus rapide).
- **Tailwind v4** : pas de `tailwind.config.ts`, tout en CSS via `@theme inline` dans `globals.css`. Tokens OKLCH pour les couleurs (gamut étendu, prêt pour P3).
- **Drizzle** schema éclaté en fichiers par domaine sous `lib/db/schema/` (re-exporté via `index.ts`). `casing: "snake_case"` côté ORM, snake_case côté Postgres.
- **Middleware Supabase** réécrit pour le format `getAll/setAll` (nouveau standard `@supabase/ssr`).
- **Webhooks publics** (`/api/inngest`, `/api/stripe/webhook`, `/api/telegram/webhook`, `/api/cal/webhook`) exclus du middleware auth.

### Points de friction

- shadcn `form.tsx` non installé d'office (à ajouter en Phase 1 quand on a un vrai formulaire).
- Axiom logging : pas branché en Phase 0, à ajouter via l'intégration Vercel quand on aura un compte prod.

## Phase 1 — Foundations (à venir)

- [ ] Schema DB complet (auth, CRM, projets, agents, finance, ...) + RLS policies
- [ ] Auth Supabase : login email+password, Google OAuth, callback, signup par invitation
- [ ] Helpers `getUser()`, `requireRole()`
- [ ] Theme switcher (next-themes), language switcher
- [ ] Page profil + settings/team avec invitations

## Phases suivantes

- Phase 2 : CRM (clients, contacts, leads, deals)
- Phase 3 : Email & Communication (Resend, React Email, campaigns)
- Phase 4 : Agents IA (les 5 agents + tracking coûts)
- Phase 5 : Calendrier (Google + Cal.com)
- Phase 6 : Finance (Stripe, MRR, coûts)
- Phase 7 : Sites & Audits (PSI + GSC)
- Phase 8 : Documents & Propales (React PDF, signature)
- Phase 9 : Automatisations (Inngest)
- Phase 10 : Telegram bot (reporting + commandes)
- Phase 11 : Dashboard & Polish (KPI animées, célébrations, i18n EN, e2e tests, a11y)
