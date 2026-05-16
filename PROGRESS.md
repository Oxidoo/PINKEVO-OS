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

## Phase 5 — Calendrier ✅

### Sécurité / crypto
- [x] `lib/crypto.ts` : AES-256-GCM `encryptSecret`/`decryptSecret` via `ENCRYPTION_KEY` (iv+tag+ciphertext base64) — utilisé pour stocker les tokens OAuth

### Google Calendar (OAuth par user)
- [x] `lib/integrations/google/oauth.ts` : build auth URL, exchange code, refresh token (scopes calendar.events.readonly + webmasters.readonly pour Phase 7)
- [x] `lib/integrations/google/calendar.ts` : `fetchGoogleEvents` avec refresh auto du token expiré, `isGoogleConnected`
- [x] `/api/google/connect` (redirige vers consent, state = user id) + `/api/google/callback` (stocke tokens chiffrés dans `integrations`)
- [x] Bouton « Connecter via OAuth » câblé dans Settings → Intégrations (carte Google)

### Cal.com
- [x] `/api/cal/webhook` : vérif signature HMAC-SHA256 (`x-cal-signature-256`), gère BOOKING_CREATED/CANCELLED, upsert `calendar_events`

### Matching auto
- [x] `lib/calendar/match.ts` : `matchEntityByEmail` → lead, sinon contact→client, sinon client par nom

### Data layer & UI
- [x] `lib/calendar/actions.ts` : `getCalendarEvents(range)`, `syncGoogleCalendar` (pull + upsert + matching), `googleConnectionStatus`
- [x] `/calendar` : grille mensuelle (jours cliquables, events du jour) + colonne « À venir », badges provider + lead/client lié + bouton Sync/Connect

### Préparation IA avant RDV
- [x] `lib/integrations/telegram/client.ts` : `sendTelegramMessage` (no-op gracieux sans token)
- [x] `lib/calendar/prep.ts` : `runMeetingPrep` — trouve les RDV à ~30 min, compose un récap (contexte lead/client), push Telegram aux membres ayant un `telegram_chat_id`, marque l'event pour éviter le doublon
- [x] Fonction Inngest cron `meeting-prep` (`*/5 * * * *`)

### Décisions techniques
- **Tokens OAuth chiffrés en base** (`integrations.access/refresh_token_encrypted`) via AES-GCM — jamais en clair, jamais côté client. Refresh transparent quand l'access token expire.
- **State OAuth = user id** : simple et suffisant ici (flux déclenché depuis une session authentifiée, callback re-vérifie `getUser()` et compare). CSRF token signé prévu Phase 11 (durcissement).
- **Calendrier read-only V1** : scopes en lecture seule (`.events.readonly`). La sync est unidirectionnelle Google→PINKEVO. La sync bidirectionnelle (création d'events depuis PINKEVO) est reportée — pas nécessaire pour le cockpit V1.
- **Marqueur `[prep_sent]` dans `notes`** : évite d'ajouter une colonne juste pour l'idempotence du cron. Suffisant; une colonne dédiée pourra venir si besoin.
- **Grille mois sans navigation** : V1 affiche le mois courant + agenda à venir. Navigation prev/next reportée Phase 11 (polish) — l'essentiel (voir/synchroniser/joindre) est là.

### Points laissés pour plus tard
- Sync bidirectionnelle Google (write) + vues semaine/jour : Phase 11.
- Génération automatique du récap RDV par LLM (actuellement template structuré) : peut être branché sur un agent en Phase 11.

## Phase 6 — Finance ✅

### Stripe
- [x] `lib/integrations/stripe/client.ts` : SDK init (no-op gracieux sans clé)
- [x] `/api/stripe/webhook` : vérif signature `constructEvent` (fallback parse JSON sans secret), gère `customer.subscription.*` et `invoice.*` → upsert `subscriptions`/`invoices`
- [x] `lib/finance/sync.ts` : `resolveClientId` (metadata.client_id → email contact), `recomputeClientMrr` (annuel /12, somme des subs actives)

### Data & UI
- [x] `lib/finance/queries.ts` : `getRevenueOverview` (MRR/ARR/clients actifs/factures), `getCostsOverview` (outils + API du mois), `getMarginSeries` (12 mois CA vs coûts)
- [x] `lib/finance/actions.ts` : `addExpense`, `addToolSubscription` (saisie manuelle, owner/admin)
- [x] `/finance` (owner/admin only) : 3 onglets Revenus / Coûts / Marge, KPI cards, tables factures & outils, dialogs d'ajout
- [x] `MarginChart` Recharts (ComposedChart : barres CA + coûts, ligne marge) avec tokens de thème

### Cron mensuel
- [x] `lib/finance/rollup.ts` : `runFinanceRollup` — MRR courant vs encaissé du mois précédent, digest Telegram, alerte si variation > 10 %
- [x] Fonction Inngest cron `finance-rollup` (`TZ=Europe/Paris 0 8 1 * *`)

### Décisions techniques
- **Mapping client Stripe** : `metadata.client_id` prioritaire, sinon email du contact. Pas de colonne `stripe_customer_id` sur `clients` ajoutée — le mapping via metadata est plus explicite et évite une migration ; à mettre lors de la création des customers côté Stripe.
- **MRR recalculé depuis les subscriptions** (source de vérité Stripe) plutôt que saisi : `recomputeClientMrr` après chaque event subscription, annuel normalisé /12.
- **Coûts API = table `api_usage`** déjà alimentée par les agents (Phase 4) — pas de pull externe Anthropic/OpenAI (leurs APIs usage sont instables/variables) ; la donnée réelle des runs est plus fiable. Pull externe possible en option plus tard.
- **Webhook tolérant sans secret** : en dev/preview sans `STRIPE_WEBHOOK_SECRET`, parse le JSON directement (jamais en prod où le secret est requis). Durcissement Phase 11.
- **Finance = owner/admin only** : `requireRole(['owner','admin'])` sur la page, cohérent avec la matrice RBAC.

### Points laissés pour plus tard
- Pull automatique de l'usage Anthropic/OpenAI via leurs APIs : optionnel, `api_usage` couvre déjà le coût réel des agents.
- Snapshots MRR historiques (pour une vraie courbe MRR mois/mois) : l'alerte ±10 % compare au CA encaissé du mois précédent ; une table de snapshots mensuels viendra en Phase 11 si besoin d'historique précis.

## Phase 7 — Sites & Audits ✅

### Intégrations Google
- [x] `lib/integrations/google/token.ts` : `getGoogleAccessToken(userId)` — récupération + refresh transparent du token (réutilisable GSC + Calendar)
- [x] `lib/integrations/google/gsc.ts` : `fetchGscSummary` — Search Console searchAnalytics (clics, impressions, top requêtes/positions), fallback gracieux non connecté

### Data & UI
- [x] `lib/websites/queries.ts` : `getWebsitesWithScores` (dernier score SEO/perf par site), `getWebsiteDetail` (historique audits)
- [x] `lib/websites/actions.ts` : `createWebsite`, `toggleMonitoring`, `runFullAudit` (lance seo_auditor + perf_auditor en parallèle via Inngest ou inline)
- [x] `/websites` : grille de cards avec pastilles de score colorées (vert ≥90 / ambre ≥70 / rouge), dialog de création (rattachement client + CMS)
- [x] `/websites/[id]` : onglets Audits (historique) + Search Console (clics/impressions/top requêtes), bouton « Audit complet maintenant »

### Cron hebdo
- [x] `lib/websites/cron.ts` : `runWeeklyAudits` — re-audit PSI mobile des sites suivis, enregistre un audit perf, alerte Telegram si chute > 10 pts vs précédent
- [x] Fonction Inngest cron `weekly-audits` (`TZ=Europe/Paris 0 7 * * 1` — lundi 7h)

### Décisions techniques
- **Token Google factorisé** dans `token.ts` (refresh + déchiffrement) — partagé GSC/Calendar, pas de duplication de la logique OAuth.
- **`runFullAudit` réutilise le moteur d'agents Phase 4** : crée des `agent_runs` pour `seo_auditor`/`perf_auditor` et passe par `executeAgentRun` (inline) ou Inngest si configuré → tracking coût/tokens cohérent avec le module Agents.
- **Rôle producer autorisé** sur les sites/audits (`requireRole(['owner','admin','manager','producer'])`) conformément à la matrice RBAC.
- **Cron hebdo PSI seul** (pas de LLM) pour rester gratuit/rapide ; l'audit complet avec analyse LLM reste déclenché manuellement ou via automatisation.
- **Scores affichés = max des audits** par type (le meilleur score atteint), simple et lisible pour le cockpit ; historique complet disponible dans l'onglet détail.

### Points laissés pour plus tard
- Détail des recommandations LLM (10 actions priorisées) affiché brut dans `audits.rawData` — rendu UI structuré en Phase 11.
- Génération + envoi du rapport PDF au client : Phase 8 (génération PDF) puis branchement option « envoyer au client ».
- Suivi de positions de mots-clés dans le temps (graphe) : Phase 11.

## Phase 8 — Documents & Propales ✅

### Storage Supabase
- [x] `lib/supabase/admin.ts` : client service-role **lazy** (`getSupabaseAdmin()`), bucket privé `documents`
- [x] `lib/documents/storage.ts` : `uploadToStorage` (ensureBucket auto), `getSignedUrl` (URLs signées 1h), `deleteFromStorage`
- [x] `lib/documents/actions.ts` : `getDocuments`, `uploadDocument` (limite 25 Mo, path `clientId/timestamp-name`), `getDocumentUrl`, `deleteDocument`
- [x] `/documents` : upload bouton + table (taille humaine, ouvrir via URL signée, supprimer)

### Génération PDF des propales
- [x] `lib/proposals/pdf.tsx` : composant `@react-pdf/renderer` (charte rose PINKEVO, contexte/objectifs/livrables/planning/prix) + `renderProposalPdf`
- [x] `/api/proposals/[id]/pdf` (runtime nodejs, force-dynamic) : génère le PDF, l'upload dans Storage, met à jour `pdfUrl`, le stream inline
- [x] `lib/proposals/actions.ts` : `getProposals`, `ensureProposalToken`
- [x] `/proposals` : table des propales (statut, montants) + actions PDF / copier lien signature

### Signature électronique légère
- [x] `lib/proposals/public.ts` : `getProposalByToken` (marque `viewed`), `acceptProposal` (enregistre **IP + horodatage**, statut `accepted`)
- [x] `/p/[token]` : page **publique** (hors auth) — rendu de la propale + bouton « Accepter & signer », mention valeur signature
- [x] `proposal_writer` (agent) génère désormais un `signatureToken` et envoie le lien `/p/{token}` par email

### Décisions techniques
- **Client Supabase admin lazy** : `createClient` lançait à l'import quand l'env est vide au build (collect-page-data). Construction paresseuse + `@react-pdf/renderer` en `serverExternalPackages` → build vert.
- **Signature = token + IP + timestamp** loggés (`signatureToken`, `signedIp`, `acceptedAt`) : « signature électronique légère » comme spécifié, suffisant pour un accord commercial PME (pas d'eIDAS qualifié).
- **PDF régénéré à la demande** et ré-uploadé (source de vérité = `proposals.content` JSON) plutôt que stocké figé : toujours à jour si le contenu change.
- **Page `/p/[token]` publique** : requête DB directe (rôle DB superuser bypass RLS) sans session — accès anonyme volontaire pour signature client.
- **Bucket privé + URLs signées** (jamais public) pour tous les documents.

### Points laissés pour plus tard
- Aperçu PDF inline dans le drive (iframe) : ouverture via URL signée pour l'instant, viewer embarqué en Phase 11.
- Organisation en dossiers par client/projet dans l'UI : le `storagePath` est déjà préfixé par client, l'arborescence visuelle arrive en Phase 11.
- Refus de proposition (statut `rejected`) côté page publique : seul l'« accepter » est exposé pour le V1.

## Phases suivantes

- Phase 9 : Automatisations
- Phase 10 : Telegram bot
- Phase 11 : Dashboard & Polish
