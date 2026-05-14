# PINKEVO OS — Progress

Suivi des phases de build.

## Phase 0 — Setup ✅

- [x] `create-next-app` (Next.js 16, TypeScript strict, Tailwind v4, App Router, Turbopack)
- [x] Runtime deps : Supabase SSR, Drizzle + postgres, TanStack Query, Zustand, Framer Motion, canvas-confetti, RHF + Zod, next-intl, Resend + React Email, Inngest, Vercel AI SDK + Anthropic/OpenAI providers, Stripe, Recharts, dnd-kit, Pino, @t3-oss/env-nextjs, sonner
- [x] Dev deps : Biome, Vitest + plugin-react, Playwright, drizzle-kit, tsx, dotenv
- [x] shadcn/ui init + 25 composants
- [x] Biome configure (remplace ESLint + Prettier)
- [x] TS strict (`noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`)
- [x] `lib/env.ts` Zod
- [x] `drizzle.config.ts` + schema skeleton
- [x] Supabase clients (server, browser, middleware) + middleware Next.js
- [x] next-intl FR/EN
- [x] Layout dashboard + topbar + sidebar
- [x] Pages placeholder pour les 10 modules
- [x] Webhook stubs Stripe, Telegram, Cal.com + endpoint Inngest
- [x] Theme PINKEVO (rose + purple en OKLCH, light + dark)
- [x] `.env.example` + scripts pnpm + `PROGRESS.md` + `README.md`

## Phase 1 — Foundations ✅

### Database (Drizzle + RLS)

- [x] Schema éclaté par domaine sous `lib/db/schema/` :
  - `auth.ts` : `profiles` (1:1 avec `auth.users`), `team_invitations`
  - `crm.ts` : `clients`, `contacts`, `leads`, `deals`, `activities`
  - `projects.ts` : `projects`, `tasks`, `websites`, `audits`
  - `agents.ts` : `agents`, `agent_runs`, `automations`
  - `communications.ts` : `email_templates`, `email_campaigns`, `email_messages`, `calendar_events`
  - `finance.ts` : `subscriptions`, `invoices`, `proposals`, `expenses`, `tool_subscriptions`, `api_usage`
  - `system.ts` : `documents`, `notifications`, `audit_logs`, `integrations`
  - `enums.ts` : 23 enums Postgres (roles, statuses, stages, providers, …)
- [x] Migration générée : `drizzle/0000_*.sql` (28 tables + 23 enums)
- [x] **RLS Postgres** : `drizzle/0001_rls_and_triggers.sql` couvre :
  - Helpers SQL `current_user_role()`, `has_role(...)`, `is_team_member()`
  - Trigger `tg_set_updated_at` appliqué aux 28 tables
  - Trigger `tg_handle_new_user` sur `auth.users` qui crée le profile et applique l'invitation (1er user → owner, sinon viewer ou rôle de l'invitation)
  - Policies par table : lecture team, écriture matchée au rôle (sales / managers / admins / producers)
  - Notifications scoped à l'utilisateur, audit_logs visibles admins seulement
  - Seed des 5 agents (`lead_prospector`, `lead_qualifier`, `proposal_writer`, `seo_auditor`, `perf_auditor`) avec modèles + prompts système

### Auth

- [x] Server Actions : `signInWithPassword`, `signUpWithPassword`, `signInWithGoogle`, `signOut`
- [x] Route handler `/auth/callback` pour échange code → session (OAuth + magic link)
- [x] Helpers `lib/auth/server.ts` : `getUser`, `getProfile`, `requireUser`, `requireRole` (cached avec React `cache`)
- [x] Helpers `lib/auth/rbac.ts` : `ROLES`, `hasRole`, `ROLE_GROUPS`, `ROLE_LABELS_FR`
- [x] Server actions profil/équipe : `updateMyProfile`, `inviteTeammate`, `updateMemberRole`, `revokeInvitation`
- [x] Pages login + signup avec `useActionState` (React 19), erreurs serveur affichées
- [x] Bouton "Continuer avec Google" branché à `signInWithOAuth`
- [x] Layout auth dédié avec gradient brand

### UI globale

- [x] `next-themes` câblé dans `Providers` + composant `<ThemeToggle />` (clair / sombre / système)
- [x] `<LocaleToggle />` qui appelle une Server Action pour set le cookie `NEXT_LOCALE`
- [x] `NextIntlClientProvider` côté client pour `useTranslations` / `useLocale`
- [x] `<UserMenu />` : avatar + nom + rôle, lien settings, déconnexion
- [x] Layout dashboard maintenant guardé par `requireUser()` (redirige sur `/login`)
- [x] Topbar avec locale, theme, user menu

### Settings

- [x] Page `/settings` avec 3 tabs : Profil / Équipe (owner+admin) / Intégrations
- [x] Formulaire profil (nom, telegramChatId) avec toast success/error
- [x] Panel équipe : invitation par email + rôle, liste des membres avec changement de rôle inline, liste des invitations en attente avec révocation
- [x] Panel intégrations : 9 providers avec phase d'arrivée (placeholders)

### Décisions techniques

- **Trigger Postgres `tg_handle_new_user`** : 1er utilisateur inscrit devient `owner` automatiquement. Les suivants prennent le rôle de leur invitation, sinon `viewer` par défaut. Évite de leak l'auth UI à la création du profil.
- **`force row level security`** sur toutes les tables : même le rôle propriétaire de la base passe par les policies (service-role bypass quand même via `auth.role()`). Defense-in-depth réelle.
- **Updated_at via trigger** plutôt que `default now()` côté Drizzle : garantie que `updated_at` bouge à chaque UPDATE, même en cas d'oubli côté ORM.
- **`requireRole()` côté serveur** appelé en plus des RLS : le RLS est la sécurité réelle, le helper côté serveur permet une UX propre (redirect plutôt qu'erreur Postgres).

### Points laissés pour plus tard

- Envoi de l'email d'invitation : Phase 3 (Resend câblé). Le token est créé en DB mais pas encore envoyé.
- Verification d'email obligatoire : à valider côté Supabase project settings.
- Tests unitaires `requireRole()` : ajoutés en Phase 11.

## Phase 2 — CRM core (à venir)

- [ ] Module clients (CRUD, fiche détaillée, timeline activités, vue table/cards)
- [ ] Module contacts
- [ ] Module leads (kanban + table + import CSV + enrichissement Pappers/Sirene + Google Maps)
- [ ] Module deals (kanban + forecast)
- [ ] Seed `pnpm seed` avec données crédibles

## Phases suivantes

- Phase 3 : Email & Communication
- Phase 4 : Agents IA
- Phase 5 : Calendrier
- Phase 6 : Finance
- Phase 7 : Sites & Audits
- Phase 8 : Documents & Propales
- Phase 9 : Automatisations
- Phase 10 : Telegram bot
- Phase 11 : Dashboard & Polish
