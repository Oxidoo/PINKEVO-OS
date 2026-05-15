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

## Phase 2 — CRM core ✅

### Couche data (`lib/crm/`)
- [x] `validation.ts` : schémas Zod (client, contact, lead, deal, activity) + table `STAGE_PROBABILITY`
- [x] `clients.ts` : `createClient`, `updateClient`, `deleteClient`, `getClients`, `getClientDetail` (contacts + deals + activités)
- [x] `contacts.ts` : `createContact`, `deleteContact`
- [x] `activities.ts` : `logActivity` (timeline)
- [x] `leads.ts` : `createLead`, `updateLeadStatus`, `enrichLead`, `importLeadsCsv`, `convertLeadToClient`
- [x] `deals.ts` : `createDeal`, `updateDealStage` (proba auto par étape), `deleteDeal`
- [x] Toutes les mutations passent par `requireRole()` (defense-in-depth en plus du RLS)

### Intégration Pappers
- [x] `lib/integrations/pappers/client.ts` : `searchCompany()` — appelle l'API v2 si `PAPPERS_API_KEY`, sinon mock déterministe (flag `mock: true`) pour rester testable sans clé

### Module Clients
- [x] Liste avec toggle table/cards, filtres (recherche + statut), badges statut
- [x] Dialog création/édition (`ClientForm` réutilisable)
- [x] Fiche détaillée `/clients/[id]` : tabs Activité / Contacts / Deals / Infos
- [x] Timeline activités + composer inline
- [x] Ajout de contacts via dialog

### Module Leads
- [x] Kanban 6 colonnes (new → enriched → contacted → qualified → converted → lost) avec dnd-kit
- [x] Drag & drop optimiste (`useOptimistic`) → `updateLeadStatus`
- [x] Création lead via dialog
- [x] Import CSV avec mapping de colonnes intelligent (alias FR/EN, séparateur `,` ou `;`), parsing client-side
- [x] Bouton "Enrichir" (Pappers) et "Convertir en client" sur chaque carte

### Module Deals
- [x] Pipeline kanban 5 étapes avec **montants cumulés par colonne**
- [x] Bandeau forecast : pipeline ouvert, **forecast pondéré** (valeur × proba), gagné
- [x] Drag & drop entre étapes (proba recalculée automatiquement)
- [x] Création deal via dialog (rattachement client optionnel)

### Seed & tooling
- [x] `pnpm seed` : 5 clients, contacts, 5 leads (sources variées), 4 deals, activités — données FR crédibles
- [x] Biome : exclusion `components/ui` (shadcn généré) + `*.css`/`*.json` (Tailwind v4 at-rules non parsables) → lint clean
- [x] typecheck + build OK (23 routes, `/clients/[id]` ajouté)

### Décisions techniques
- **Pappers mock fallback** : sans clé API, on renvoie un objet mock `{ mock: true }` plutôt que d'échouer — permet de tester tout le flow d'enrichissement en démo.
- **Drag & drop optimiste** : `useOptimistic` + `useState` local pour un feedback instantané; la Server Action revalide en arrière-plan, toast d'erreur si échec.
- **`numeric` Drizzle = string** : montants stockés/retournés en string, conversion via `Number()` au calcul et `formatCurrency()` (Intl fr-FR) à l'affichage.
- **Biome exclut `components/ui`** : code shadcn généré, on ne le lint pas (pratique standard) — notre code applicatif reste 100% lint-clean.

### Points laissés pour plus tard
- Prospection Google Maps (création de leads via Places API) : déplacée en **Phase 4** car portée par l'agent `lead_prospector`.
- Score IA auto à la création de lead : **Phase 4** (agent `lead_qualifier`).
- Édition/suppression de lead et deal depuis l'UI : CRUD de base présent, édition inline à enrichir en Phase 11 (polish).

## Phase 3 — Email & Communication ✅

### Templates React Email (`lib/email/templates/`)
- [x] `base.tsx` : layout commun (header brand rose, footer, styles boutons/paragraphes)
- [x] `invitation.tsx` : invitation équipe (inviter, rôle, CTA)
- [x] `welcome.tsx` : bienvenue client
- [x] `follow-up.tsx` : relance générique (utilisée par les campagnes)
- [x] `proposal.tsx` : envoi de proposition (lien signature)
- [x] `invoice.tsx` : facture (lien paiement)
- [x] Preview via `pnpm email:dev` (script déjà câblé Phase 0)

### Resend (`lib/integrations/resend/`)
- [x] `client.ts` : `sendEmail()` — render React Email → HTML + texte, envoi Resend, **log systématique dans `email_messages`**
- [x] Fallback sans `RESEND_API_KEY` : email rendu + loggé en statut `queued` (flow testable sans clé, `skipped: true`)
- [x] `FROM_EMAIL` configurable via env, défaut `onboarding@resend.dev`

### Webhook
- [x] `/api/resend/webhook` : traite `delivered` / `opened` / `clicked` / `bounced` / `complained`, met à jour `email_messages` par `resend_id`
- [x] Ajouté à la liste de bypass du middleware auth

### Campagnes (`lib/email/campaigns.ts` + `/campaigns`)
- [x] `createCampaign` (nom, objet, message, programmation optionnelle → statut `scheduled`/`draft`)
- [x] `sendCampaign` : envoie à tous les leads ayant un email, met à jour `sentCount` + statut
- [x] Page `/campaigns` : 2 tabs (Campagnes avec bouton Envoyer / Journal des messages avec statut + ouvertures)
- [x] Entrée de nav « Communication » ajoutée à la sidebar

### Branchements
- [x] **Email d'invitation Phase 1 câblé** : `inviteTeammate` envoie désormais le template `InvitationEmail` via Resend (TODO de la Phase 1 résolu)

### Décisions techniques
- **Log avant tout** : `sendEmail` insère toujours dans `email_messages` même sans clé API ou en cas d'échec (statut `failed`) — traçabilité complète, base pour les analytics campagnes.
- **Audience V1 simple** : les campagnes ciblent tous les leads avec email. Le ciblage avancé (`audienceFilter` jsonb) est stocké mais l'UI de segmentation arrive en Phase 11.
- **Vérif signature Svix** : le webhook Resend matche par `email_id` sans vérif crypto pour l'instant — durcissement (Svix signature) prévu Phase 11.
- **Imports dynamiques dans `inviteTeammate`** : `sendEmail`/templates importés en `await import()` pour éviter de charger `server-only` + Resend dans tous les chemins de `profile-actions`.

### Points laissés pour plus tard
- Envoi programmé réel (cron) : statut `scheduled` stocké, l'exécution via Inngest cron arrive avec la Phase 9 (automatisations).
- Tab « Templates emails » + « Webhooks reçus (debug) » dans Settings : Phase 11 (polish).
- Tracking `openCount`/`clickCount` agrégé au niveau campagne : calculé à la volée pour l'instant, agrégation incrémentale via webhook en Phase 11.

## Phase 4 — Agents IA ✅

### Provider & coûts (`lib/ai/`)
- [x] `provider.ts` : résolution modèle Anthropic/OpenAI via Vercel AI SDK, `hasLlm()`, fallback gracieux
- [x] `cost.ts` : table de pricing USD/1M tokens + `computeCostUsd()` + `providerForModel()`
- [x] `agents/llm.ts` : `llmJson()` — `generateObject` typé Zod, **fallback mock déterministe sans clé** (tokens=0, `mock:true`)

### Les 5 agents (`lib/ai/agents/`)
- [x] `lead_prospector` : Google Places (mock fallback) → LLM extraction contacts → crée des leads en DB
- [x] `lead_qualifier` : Pappers + LLM scoring fit 0-100 → met à jour `leads.score` + statut
- [x] `proposal_writer` : LLM propale structurée → crée `proposals` → email Resend si destinataire
- [x] `seo_auditor` : PSI mobile+desktop → LLM 10 actions priorisées → crée `audits` (type seo)
- [x] `perf_auditor` : PSI → LLM quick wins FR → crée `audits` (type performance)
- [x] Registry `agents/index.ts` + `getHandler()`

### Intégrations ajoutées
- [x] `lib/integrations/google-maps/client.ts` : Places Text Search v1 + mock fallback
- [x] `lib/integrations/psi/client.ts` : PageSpeed Insights v5 (marche sans clé, rate-limité) + mock fallback

### Orchestration & tracking (`lib/ai/runs.ts`)
- [x] `executeAgentRun(runId)` : exécuteur core — parse input, run handler, met à jour `agent_runs` (status/output/tokens/coût/durée), insère `api_usage`
- [x] `triggerAgentRun(slug, input)` : crée le run `queued`, **dispatch Inngest si `INNGEST_EVENT_KEY`, sinon exécution inline** (UX fonctionnelle en démo sans worker)
- [x] Fonction Inngest `agent-run` (event `agent/run.requested`) → `executeAgentRun`
- [x] `updateAgentConfig`, `getAgentsWithStats` (runs/coût/succès du mois, dernière exéc.), `getAgentRuns`, `getAiCostBreakdown`

### UI
- [x] `/agents` : 5 cards avec stats (runs/mois, coût/mois, % succès, dernière exéc.), bouton Lancer
- [x] `/agents/[slug]` : tabs Historique (status, summary, tokens, coût, durée) + Configuration (prompt système éditable, modèle, on/off)
- [x] `LaunchDialog` générique : champs adaptés par agent, toast de progression
- [x] `/agents/costs` : breakdown par agent + par jour/provider, total du mois

### Décisions techniques
- **Exécution inline si pas d'Inngest** : le spec demande Inngest, mais sans worker Inngest qui tourne (cas démo / preview Vercel sans config), les events ne seraient jamais traités. Hybride : Inngest si `INNGEST_EVENT_KEY` présent, sinon `await executeAgentRun()` dans la Server Action → l'UI affiche toujours le résultat. Le même core est partagé, zéro duplication.
- **Mock déterministe partout** : chaque agent et chaque intégration externe (Maps, PSI, Pappers) renvoie un résultat mock crédible sans clé → la chaîne complète (création leads, scoring, propale, audit) est testable en démo. Les runs mock ont `tokens=0`/`cost=0` donc n'inversent pas les stats.
- **`api_usage` alimenté seulement si tokens > 0** : pas de bruit dans les coûts pour les runs mock.
- **Coût stocké en `numeric(12,6)`** : 6 décimales pour des coûts par run pouvant être < 1 centime.

### Points laissés pour plus tard
- Scrape réel des sites (Cheerio) dans `lead_prospector` : on s'appuie sur le LLM pour déduire les contacts à partir des données Places — scraping HTML ajouté en Phase 11 si besoin.
- Streaming temps réel du résultat (toast de progression live) : actuellement le run est synchrone côté action, le résultat apparaît au refresh/revalidate. Streaming SSE en Phase 11.
- GSC (Search Console) dans `seo_auditor` : OAuth GSC arrive en Phase 7, l'agent utilise PSI seul pour l'instant.

## Phases suivantes

- Phase 5 : Calendrier
- Phase 6 : Finance
- Phase 7 : Sites & Audits
- Phase 8 : Documents & Propales
- Phase 9 : Automatisations
- Phase 10 : Telegram bot
- Phase 11 : Dashboard & Polish
