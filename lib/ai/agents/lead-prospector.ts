import { z } from "zod";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { searchPlaces } from "@/lib/integrations/google-maps/client";
import { llmJson } from "./llm";
import type { AgentHandler } from "./types";

const inputSchema = z.object({
  keyword: z.string().min(1),
  city: z.string().min(1),
  count: z.coerce.number().int().min(1).max(50).default(10),
});

const extractionSchema = z.object({
  contacts: z.array(
    z.object({
      company: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      contactName: z.string().nullable(),
    }),
  ),
});

export const leadProspector: AgentHandler<typeof inputSchema> = {
  slug: "lead_prospector",
  defaultModel: "claude-opus-4-5",
  inputSchema,
  run: async (input, model, ctx) => {
    const places = await searchPlaces(input.keyword, input.city, input.count);

    const { data, tokensInput, tokensOutput } = await llmJson({
      model,
      schema: extractionSchema,
      system:
        "Tu es un expert en prospection B2B locale. À partir d'une liste d'entreprises, déduis pour chacune un email de contact plausible, un téléphone et le nom probable du dirigeant. Réponds en JSON strict.",
      prompt: `Entreprises trouvées:\n${JSON.stringify(places, null, 2)}`,
    });

    const toInsert = data.contacts
      .filter((c) => c.company)
      .map((c) => ({
        firstName: c.contactName?.split(" ")[0] ?? null,
        lastName: c.contactName?.split(" ").slice(1).join(" ") || null,
        email: c.email,
        phone: c.phone,
        company: c.company,
        source: "agent" as const,
        status: "new" as const,
        assignedTo: ctx.triggeredBy,
      }));

    if (toInsert.length > 0) await db.insert(leads).values(toInsert);

    return {
      output: { createdLeads: toInsert.length, places: places.length },
      tokensInput,
      tokensOutput,
      summary: `${toInsert.length} leads créés pour « ${input.keyword} » à ${input.city}`,
    };
  },
};
