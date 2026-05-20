import { z } from "zod";

export const clientStatusValues = ["prospect", "active", "churned"] as const;
export const leadSourceValues = [
  "csv",
  "pappers",
  "google_maps",
  "form",
  "manual",
  "agent",
] as const;
export const leadStatusValues = [
  "new",
  "enriched",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;
export const dealStageValues = ["discovery", "proposal", "negotiation", "won", "lost"] as const;

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : undefined));

export const clientInput = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160),
  company: optionalText,
  industry: optionalText,
  status: z.enum(clientStatusValues).default("prospect"),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    ),
  mrr: z.coerce.number().min(0).default(0),
  notes: optionalText,
});
export type ClientInput = z.infer<typeof clientInput>;

export const contactInput = z.object({
  clientId: z.string().uuid(),
  firstName: optionalText,
  lastName: optionalText,
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: optionalText,
  position: optionalText,
  linkedinUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  isPrimary: z.coerce.boolean().default(false),
});
export type ContactInput = z.infer<typeof contactInput>;

export const leadInput = z.object({
  firstName: optionalText,
  lastName: optionalText,
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: optionalText,
  company: optionalText,
  category: optionalText,
  sector: optionalText,
  zone: optionalText,
  source: z.enum(leadSourceValues).default("manual"),
  status: z.enum(leadStatusValues).default("new"),
});
export type LeadInput = z.infer<typeof leadInput>;

export const dealInput = z.object({
  title: z.string().trim().min(1, "Titre requis").max(160),
  clientId: z.string().uuid().optional().or(z.literal("")),
  leadId: z.string().uuid().optional().or(z.literal("")),
  value: z.coerce.number().min(0).default(0),
  stage: z.enum(dealStageValues).default("discovery"),
  probability: z.coerce.number().int().min(0).max(100).default(20),
  expectedCloseDate: z.string().optional().or(z.literal("")),
});
export type DealInput = z.infer<typeof dealInput>;

export const activityInput = z.object({
  entityType: z.enum(["client", "lead", "deal"]),
  entityId: z.string().uuid(),
  type: z.enum(["email", "call", "meeting", "note", "task", "agent_action"]),
  subject: optionalText,
  content: optionalText,
  direction: z.enum(["inbound", "outbound"]).optional(),
});
export type ActivityInput = z.infer<typeof activityInput>;

/** Default win probability per deal stage (for weighted forecast). */
export const STAGE_PROBABILITY: Record<(typeof dealStageValues)[number], number> = {
  discovery: 20,
  proposal: 45,
  negotiation: 70,
  won: 100,
  lost: 0,
};
