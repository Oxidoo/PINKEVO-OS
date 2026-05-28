-- ============================================================================
-- Migration : refonte format devis (sections détaillées, infos prestataire,
-- numéro auto, line items)
-- ============================================================================

-- 1. Numéro lisible auto-incrémenté pour les devis
ALTER TABLE "proposals"
  ADD COLUMN IF NOT EXISTS "number" varchar(32) UNIQUE;

-- 2. Nouvelle structure sections : on supprime defaults setup/recurring
-- (les lineItems contiennent maintenant toute la tarification)
ALTER TABLE "proposal_templates"
  DROP COLUMN IF EXISTS "default_setup",
  DROP COLUMN IF EXISTS "default_recurring";

-- 3. Reset le seed précédent : la shape de "sections" a changé,
-- les anciens templates sont incompatibles
DELETE FROM "proposal_templates" WHERE "slug" = 'pack-agence-default';

-- 4. Nouveau seed avec la structure complète
INSERT INTO "proposal_templates" ("slug", "name", "description", "sections", "variables")
VALUES (
  'prestation-digitale-default',
  'Prestation digitale — SEO & Avis',
  'Template complet inspiré du devis GAIA Club (3 pages, conditions, mentions légales)',
  jsonb_build_object(
    'title', 'Devis de prestation de services pour {{client}}',
    'subtitle', 'Référencement Web · Gestion des Avis Clients',
    'objectDescription', 'Le présent devis a pour objet la fourniture d''une prestation de services digitaux comprenant : l''optimisation du référencement naturel (SEO) du site web du client ainsi que la mise en place et la gestion d''un système légal de collecte et d''amélioration des avis clients. Ces services sont proposés sous la forme d''un abonnement mensuel récurrent, complété d''une phase de mise en service facturée en une fois.',
    'lineItems', jsonb_build_array(
      jsonb_build_object('label', 'Audit SEO & analyse concurrentielle', 'frequency', '1x', 'unitPrice', 150, 'group', 'setup'),
      jsonb_build_object('label', 'Mise en place du système de collecte d''avis', 'frequency', '1x', 'unitPrice', 150, 'group', 'setup'),
      jsonb_build_object('label', 'SEO — Optimisation on-page, suivi de positions, netlinking', 'frequency', '/mois', 'unitPrice', 150, 'group', 'recurring'),
      jsonb_build_object('label', 'Système d''avis — Flux de demandes, réponses, veille plateformes', 'frequency', '/mois', 'unitPrice', 100, 'group', 'recurring'),
      jsonb_build_object('label', 'Rapport mensuel de performance (PDF)', 'frequency', '/mois', 'unitPrice', 30, 'group', 'recurring')
    ),
    'deliverables', jsonb_build_array(
      jsonb_build_object(
        'service', 'SEO',
        'frequency', 'Mensuel',
        'items', jsonb_build_array(
          'Rapport de positions (top 10 mots-clés)',
          'Optimisations on-page (balises, vitesse, maillage)',
          'Création / amélioration de 2 contenus / mois',
          'Soumission Google Search Console',
          'Suivi Google My Business'
        )
      ),
      jsonb_build_object(
        'service', 'Avis clients',
        'frequency', 'Continu + suivi hebdo',
        'items', jsonb_build_array(
          'Système intelligent de génération d''avis favorisant le référencement',
          'Accès aux avis négatifs avec coordonnées clients',
          'Tableau de bord (Google, Trustpilot, etc.)',
          'Guide de bonnes pratiques remis au client'
        )
      ),
      jsonb_build_object(
        'service', 'Reporting',
        'frequency', '1x / mois',
        'items', jsonb_build_array(
          'Rapport PDF personnalisé',
          'KPIs : positions, trafic, avis, engagement',
          'Recommandations pour le mois suivant',
          'Appel bilan de 30 min (en option)'
        )
      )
    ),
    'conditionsEngagement', 'L''abonnement est souscrit pour une durée minimale de 3 mois à compter de la date de signature du devis. À l''issue de cette période, il se renouvelle tacitement mois par mois. Résiliation possible avec un préavis de 30 jours calendaires par courrier ou email avec accusé de réception.',
    'conditionsBilling', 'Les frais de mise en service sont facturés à la signature et payables avant démarrage des travaux. L''abonnement mensuel est facturé le 1er de chaque mois, payable à réception de facture. Moyens de paiement acceptés : virement bancaire, PayPal, Stripe. Tout retard de paiement pourra entraîner l''arrêt de la prestation de service.',
    'conditionsPriceRevision', 'Les tarifs pourront être révisés une fois par an, avec notification 30 jours à l''avance. La révision ne pourra excéder l''indice des prix à la consommation (INSEE) + 5 %.',
    'conditionsClientObligations', 'Fournir les accès nécessaires (CMS, Google Search Console, Instagram, Google My Business) dans un délai de 5 jours ouvrés après signature. Valider les contenus soumis à approbation dans un délai de 5 jours ouvrés. Désigner un interlocuteur unique pour les échanges liés à la prestation.',
    'additionalSections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Système d''avis — Conformité légale',
        'body', 'Conformément au Décret n° 2017-1436 du 29 septembre 2017 et au Règlement (UE) 2022/2065 (DSA), le système de collecte d''avis mis en place repose exclusivement sur des pratiques légales : envoi automatisé d''emails / SMS de relance post-achat, aucun avis fictif ou rémunéré, aucune incitation financière, réponses professionnelles validées par le client, plateformes tierces certifiées (AFNOR NF Z74-501).'
      ),
      jsonb_build_object(
        'title', 'Propriété intellectuelle & confidentialité',
        'body', 'Les contenus (textes, visuels) créés dans le cadre de la prestation sont cédés au client à compter du paiement intégral. Le prestataire peut mentionner le nom du client dans ses références commerciales, sauf opposition écrite. Chaque partie traite les informations échangées comme confidentielles. Les données personnelles sont traitées conformément au RGPD (UE 2016/679).'
      )
    )
  ),
  ARRAY['client', 'prenom', 'date', 'societe']
)
ON CONFLICT (slug) DO NOTHING;

-- 5. Table agency_settings (infos prestataire singleton)
CREATE TABLE IF NOT EXISTS "agency_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(32) NOT NULL UNIQUE DEFAULT 'default',
  "legal_name" text NOT NULL,
  "trading_name" text,
  "legal_status" text,
  "siret" varchar(32),
  "ape_code" varchar(16),
  "vat_regime" text,
  "vat_number" varchar(32),
  "address" text,
  "postal_code" varchar(16),
  "city" text,
  "country" text DEFAULT 'France',
  "email" text,
  "phone" text,
  "website" text,
  "iban" varchar(64),
  "bic" varchar(16),
  "jurisdiction" text,
  "brand_color" varchar(16),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "agency_settings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_settings_all" ON "agency_settings";
CREATE POLICY "agency_settings_all" ON "agency_settings"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Seed d'un agency_settings vide à compléter via /settings/billing
INSERT INTO "agency_settings" ("slug", "legal_name", "country", "vat_regime", "jurisdiction")
VALUES (
  'default',
  'À compléter dans Paramètres → Facturation',
  'France',
  'Franchise en base de TVA — Art. 293 B du CGI',
  'Tribunal de commerce de Paris'
)
ON CONFLICT (slug) DO NOTHING;
