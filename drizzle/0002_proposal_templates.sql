-- ============================================================================
-- Migration : proposal_templates + extensions proposals + cleanup proposal_writer
-- ============================================================================

-- 1. Nouvelle table de templates de devis
CREATE TABLE IF NOT EXISTS "proposal_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(96) NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "sections" jsonb NOT NULL,
  "default_setup" numeric(12, 2) NOT NULL DEFAULT '0',
  "default_recurring" numeric(12, 2) NOT NULL DEFAULT '0',
  "variables" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "proposal_templates_slug_idx" ON "proposal_templates" ("slug");

-- RLS : pour l'instant accessible aux roles authentifiés
ALTER TABLE "proposal_templates" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposal_templates_select" ON "proposal_templates";
CREATE POLICY "proposal_templates_select" ON "proposal_templates"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "proposal_templates_all" ON "proposal_templates";
CREATE POLICY "proposal_templates_all" ON "proposal_templates"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Extensions de la table proposals
ALTER TABLE "proposals"
  ADD COLUMN IF NOT EXISTS "template_id" uuid REFERENCES "proposal_templates"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "signature_name" text,
  ADD COLUMN IF NOT EXISTS "payment_link_url" text,
  ADD COLUMN IF NOT EXISTS "payment_link_label" text;

-- 3. Désactiver et supprimer l'agent proposal_writer (devis se font via templates maintenant)
DELETE FROM "agent_runs" WHERE "agent_id" IN (SELECT "id" FROM "agents" WHERE "slug" = 'proposal_writer');
DELETE FROM "agents" WHERE "slug" = 'proposal_writer';

-- Note : la valeur d'enum `proposal_writer` reste dans pg_enum (Postgres
-- ne permet pas de DROP VALUE proprement). Aucun code ne la référence plus.

-- 4. Seed d'un template d'exemple pour démarrer
INSERT INTO "proposal_templates" ("slug", "name", "description", "sections", "default_setup", "default_recurring", "variables")
VALUES (
  'pack-agence-default',
  'Pack agence — défaut',
  'Template par défaut pour les prestations Pack agence',
  jsonb_build_object(
    'title', 'Pack agence pour {{client}}',
    'context', 'Bonjour {{prenom}}, suite à notre échange du {{date}}, voici notre proposition d''accompagnement.',
    'objectives', jsonb_build_array(
      'Refonte du site web',
      'Optimisation SEO continue',
      'Reporting mensuel'
    ),
    'deliverables', jsonb_build_array(
      'Audit technique initial',
      'Maquettes & site livré sous 6 semaines',
      'Suivi des positions Google chaque mois',
      'Support email prioritaire'
    ),
    'timeline', '6 à 8 semaines pour la mise en place, puis suivi récurrent.',
    'conditions', 'Devis valable 30 jours. Règlement à 30 jours fin de mois. Accompte de 30% à la signature.'
  ),
  '6500',
  '990',
  ARRAY['client', 'prenom', 'date', 'societe']
)
ON CONFLICT (slug) DO NOTHING;
