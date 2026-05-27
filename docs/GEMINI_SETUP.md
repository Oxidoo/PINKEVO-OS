# Utiliser Google Gemini gratuitement pour les agents IA

Google Gemini propose un **free tier généreux** qui suffit largement pour
faire tourner les 5 agents de Pinkevo-OS sans payer un centime tant que le
volume reste raisonnable.

## Quotas du free tier (au 27/05/2026)

| Modèle | Limite gratuite |
|---|---|
| **Gemini 2.5 Flash Lite** (par défaut) | **~1 000 req/jour** — le plus généreux |
| Gemini 2.5 Flash | ~250 req/jour |
| Gemini 2.0 Flash | ~200 req/jour |
| Gemini 2.0 Flash Lite | ~200 req/jour |
| Gemini 1.5 Flash (legacy) | Backup si les 2.x sont indispo |

À l'échelle de Pinkevo-OS, ça permet ~30–50 lancements d'agents par jour
sans aucun coût. Les modèles 2.5 sont privilégiés car leur free tier est
le mieux maintenu actuellement.

## Étape 1 — Récupérer une clé API

1. Ouvre https://aistudio.google.com/apikey
2. Connecte-toi avec ton compte Google
3. Clique **« Create API key »**
4. Choisis un projet Google Cloud (ou laisse Google en créer un)
5. Copie la clé `AIza...` qui s'affiche

**Important** : aucune carte bancaire n'est demandée. La clé reste gratuite
tant que tu restes sous les quotas ci-dessus. Si tu dépasses, l'API renvoie
une erreur 429 — elle **ne te facture pas automatiquement**.

## Étape 2 — Ajouter la clé dans Vercel

1. Dashboard Vercel → projet **pinkevo-os** → **Settings** → **Environment Variables**
2. Ajoute une nouvelle variable :
   - **Key** : `GOOGLE_GENERATIVE_AI_API_KEY`
   - **Value** : ta clé `AIza...`
   - **Environments** : coche **Production**, **Preview**, **Development**
3. Clique **Save**
4. Redeploy : **Deployments** → ⋯ → **Redeploy** sur le dernier déploiement

## Étape 3 — Basculer tous les agents sur Gemini

Va sur `/agents`. Si Gemini est correctement configuré, une bannière verte
s'affiche avec un bouton **« Tout basculer sur Gemini »**. Clique dessus →
les 5 agents (Lead Prospector, Lead Qualifier, Proposal Writer, SEO Auditor,
Perf Auditor) passent sur `gemini-2.0-flash` en un clic.

Alternative manuelle : ouvre chaque agent → onglet **Configuration** →
sélectionne **Gemini 2.0 Flash** dans le select → **Enregistrer**.

## Étape 4 — Tester

Lance n'importe quel agent. Si tout est OK :
- Le run termine en **`success`**
- Le **badge Gemini** apparaît dans l'historique
- Le **coût $0.0000** est affiché (free tier)

Si erreur : le message s'affiche dans l'historique du run (ex: « Modèle
gemini-2.0-flash : GOOGLE_GENERATIVE_AI_API_KEY manquante » → vérifie
l'étape 2 et le redeploy).

## Override ponctuel par run

Au lancement d'un agent, tu as un select **« Modèle LLM pour ce run »**.
Tu peux y choisir un autre modèle (Claude, GPT) si une tâche spécifique
nécessite plus de qualité — le coût s'applique alors normalement.

## Limites à connaître

- **Pas de cache prompt** côté Gemini (contrairement à Anthropic), donc
  chaque requête réinjecte le system prompt. Acceptable au vu du volume.
- **Structured output** (JSON strict via `generateObject`) est très bien
  supporté par Gemini, mais quelques schemas très complexes peuvent
  occasionnellement retourner des champs malformés. En cas de problème
  récurrent sur un agent, switche-le sur Gemini 1.5 Pro (50 req/jour
  gratuites mais qualité top) via la config.
- **Latence** : Gemini Flash est rapide (~1–3 s pour la plupart des
  agents). Le SEO Auditor / Perf Auditor reste limité par PSI (~20–30 s),
  pas par l'LLM.

## Si tu dépasses les quotas

Tu as plusieurs options :
1. **Payer le tier facturé Gemini** : extrêmement bon marché
   (~0.10$/M tokens input pour Flash 2.0)
2. **Ajouter une 2e clé** : crée un autre projet GCP → autre clé → ajoute-la
   dans le code (`provider.ts` peut être étendu pour faire du round-robin)
3. **Passer sur Anthropic / OpenAI** : ajoute leur clé en plus, et change
   le modèle de l'agent concerné dans la config

## Troubleshooting

### Erreur « Quota exceeded ... limit: 0 »

Si tu vois ce message :

```
Quota exceeded for metric: generate_content_free_tier_requests,
limit: 0, model: gemini-2.0-flash
```

`limit: 0` signifie que **ton projet Google n'a aucun quota free tier
disponible** sur ce modèle précis. Causes typiques :

- **Le projet a la facturation Google Cloud activée** : sur certains projets
  facturés, le quota « free tier » est mis à 0 pour t'éviter de basculer
  par erreur sur du payant. Les requêtes échouent au lieu d'être facturées
- **Le modèle n'est pas dispo pour ta région** ou ton tier d'organisation
- **Le quota journalier est épuisé** (à minuit Pacific Time il se reset)

**Solutions, dans l'ordre :**

1. **Essaie un autre modèle Gemini** : va sur la config de l'agent → switch
   sur `Gemini 2.5 Flash Lite` (1000 req/jour, le mieux supporté en free)
   ou `Gemini 2.5 Flash`. Les bannières "Tout basculer sur Gemini" sur
   `/agents` utilisent le default (`gemini-2.5-flash-lite`) — si tu cliques
   à nouveau dessus, tous les agents passent dessus en 1 clic
2. **Crée une clé sur un nouveau projet AI Studio** sans facturation activée :
   - Va sur https://aistudio.google.com/apikey
   - **Create API key in new project** (et non « add to existing project »)
   - Utilise la nouvelle clé dans Vercel
3. **Vérifie le statut billing du projet** : https://console.cloud.google.com/billing
   — si du « Billing is enabled » est affiché, désactive-le pour ce projet
   spécifique, ou crée-en un autre sans billing
4. **Attends la prochaine fenêtre de quota** : minuit Pacific Time
   (~9 h UTC) — le compteur se reset
