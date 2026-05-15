import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { audits, websites } from "@/lib/db/schema";
import { runPsi } from "@/lib/integrations/psi/client";
import { llmJson } from "./llm";
import type { AgentHandler } from "./types";

const inputSchema = z.object({ websiteId: z.string().uuid() });

const perfSchema = z.object({
  perfMobile: z.number().int().min(0).max(100),
  perfDesktop: z.number().int().min(0).max(100),
  topActions: z.array(z.string()),
  summaryFr: z.string(),
});

export const perfAuditor: AgentHandler<typeof inputSchema> = {
  slug: "perf_auditor",
  defaultModel: "claude-haiku-4-5",
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

    const { data, tokensInput, tokensOutput, mock } = await llmJson({
      model,
      schema: perfSchema,
      system:
        "Tu es un expert performance web. Identifie les quick wins (images, JS bloquant, fonts) et résume en français clair pour le client.",
      prompt: `Site: ${site.url}\nMobile: ${JSON.stringify(mobile)}\nDesktop: ${JSON.stringify(desktop)}`,
      mockData: {
        perfMobile: mobile.performance,
        perfDesktop: desktop.performance,
        topActions: [
          "Compresser et servir les images en WebP",
          "Différer le JavaScript non critique",
          "Précharger les polices web",
          "Activer la mise en cache navigateur",
          "Minifier CSS/JS",
        ],
        summaryFr: `Performance mobile ${mobile.performance}/100, desktop ${desktop.performance}/100. Quelques optimisations rapides peuvent gagner 15-25 points sur mobile.`,
      },
    });

    await db.insert(audits).values({
      websiteId: site.id,
      type: "performance",
      score: data.perfMobile,
      rawData: { mobile, desktop, analysis: data },
    });

    return {
      output: { ...data, mock },
      tokensInput,
      tokensOutput,
      summary: `Perf mobile ${data.perfMobile} / desktop ${data.perfDesktop}`,
    };
  },
};
