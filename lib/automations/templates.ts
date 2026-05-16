import type { AutomationStep } from "./engine";

export interface AutomationTemplate {
  slug: string;
  name: string;
  description: string;
  triggerType: "event" | "manual" | "cron";
  triggerEvent: string;
  steps: AutomationStep[];
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    slug: "lead_csv_qualify_email",
    name: "Nouveau lead → qualifier → email",
    description:
      "À l'import de leads, l'agent qualifie chaque lead puis envoie une relance automatique.",
    triggerType: "event",
    triggerEvent: "pinkevo/lead.created",
    steps: [{ kind: "qualify_lead" }, { kind: "send_followup" }],
  },
  {
    slug: "deal_won_onboarding",
    name: "Deal gagné → client + onboarding",
    description: "Quand un deal passe en « gagné », crée le client et envoie l'email d'onboarding.",
    triggerType: "event",
    triggerEvent: "pinkevo/deal.won",
    steps: [{ kind: "create_client_from_lead" }, { kind: "onboarding_email" }],
  },
  {
    slug: "site_delivered_audit",
    name: "Site livré → audit complet",
    description: "À la livraison d'un site, lance un audit SEO + performance.",
    triggerType: "event",
    triggerEvent: "pinkevo/website.delivered",
    steps: [{ kind: "audit_site" }],
  },
];

export function getTemplate(slug: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((t) => t.slug === slug);
}
