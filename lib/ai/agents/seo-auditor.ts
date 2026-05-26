import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { audits, websites } from "@/lib/db/schema";
import { runPsi } from "@/lib/integrations/psi/client";
import { llmJson } from "./llm";
import type { AgentHandler } from "./types";

const inputSchema = z.object({ websiteId: z.string().uuid() });

const auditSchema = z.object({
  score: z.number().int().min(0).max(100),
  criticalIssues: z.number().int().min(0),
  actions: z.array(
    z.object({
      title: z.string(),
      impact: z.enum(["faible", "moyen", "fort"]),
      effort: z.enum(["faible", "moyen", "fort"]),
    }),
  ),
});

export const seoAuditor: AgentHandler<typeof inputSchema> = {
  slug: "seo_auditor",
  defaultModel: "claude-opus-4-5",
  inputSchema,
  run: async (input, model) => {
    const [site] = await db
      .select()
      .from(websites)
      .where(eq(websites.id, input.websiteId))
      .limit(1);
    if (!site) throw new Error("Site introuvable");

    const [mobile, desktop] = await Promise.all([
      runPsi(site.url, "mobile"),
      runPsi(site.url, "desktop"),
    ]);

    const { data, tokensInput, tokensOutput } = await llmJson({
      model,
      schema: auditSchema,
      system:
        "Tu es un consultant SEO senior. À partir des données PSI/SEO, donne un score global et 10 actions priorisées par impact × effort.",
      prompt: `Site: ${site.url}\nMobile: ${JSON.stringify(mobile)}\nDesktop: ${JSON.stringify(desktop)}`,
    });

    await db.insert(audits).values({
      websiteId: site.id,
      type: "seo",
      score: data.score,
      rawData: { mobile, desktop, analysis: data },
    });

    return {
      output: { ...data },
      tokensInput,
      tokensOutput,
      summary: `Score SEO ${data.score}/100 — ${data.criticalIssues} issues critiques`,
    };
  },
};
