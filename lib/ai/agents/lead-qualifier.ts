import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { searchCompany } from "@/lib/integrations/pappers/client";
import { llmJson } from "./llm";
import type { AgentHandler } from "./types";

const inputSchema = z.object({ leadId: z.string().uuid() });

const scoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  reasons: z.array(z.string()),
  recommendation: z.enum(["contacter", "passer"]),
});

export const leadQualifier: AgentHandler<typeof inputSchema> = {
  slug: "lead_qualifier",
  defaultModel: "gemini-2.0-flash",
  inputSchema,
  run: async (input, model) => {
    const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
    if (!lead) throw new Error("Lead introuvable");

    const company = lead.company ? await searchCompany(lead.company) : null;

    const { data, tokensInput, tokensOutput } = await llmJson({
      model,
      schema: scoreSchema,
      system:
        "Tu es un expert en qualification de leads pour une agence digitale (sites web, SEO). Évalue le fit de 0 à 100 et justifie en 2-4 raisons concises.",
      prompt: `Lead:\n${JSON.stringify(lead)}\n\nDonnées entreprise (Pappers):\n${JSON.stringify(company)}`,
    });

    await db
      .update(leads)
      .set({
        score: data.score,
        status: lead.status === "new" ? "qualified" : lead.status,
        enrichmentData: {
          ...(lead.enrichmentData ?? {}),
          pappers: company,
          qualification: data,
        },
      })
      .where(eq(leads.id, input.leadId));

    return {
      output: { ...data },
      tokensInput,
      tokensOutput,
      summary: `Score ${data.score}/100 — ${data.recommendation}`,
    };
  },
};
