import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { clients, leads, proposals } from "@/lib/db/schema";
import { ProposalEmail } from "@/lib/email/templates/proposal";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/integrations/resend/client";
import { llmJson } from "./llm";
import type { AgentHandler } from "./types";

const inputSchema = z.object({
  clientId: z.string().uuid().optional().or(z.literal("")),
  leadId: z.string().uuid().optional().or(z.literal("")),
  service: z.enum(["audit_seo", "refonte_site", "seo_recurrent", "pack_agence"]),
  objectives: z.string().min(1),
});

const proposalSchema = z.object({
  title: z.string(),
  context: z.string(),
  objectives: z.array(z.string()),
  deliverables: z.array(z.string()),
  timeline: z.string(),
  totalSetup: z.number(),
  totalRecurring: z.number(),
});

const SERVICE_LABEL: Record<string, string> = {
  audit_seo: "Audit SEO",
  refonte_site: "Refonte de site",
  seo_recurrent: "SEO récurrent",
  pack_agence: "Pack agence",
};

export const proposalWriter: AgentHandler<typeof inputSchema> = {
  slug: "proposal_writer",
  defaultModel: "claude-opus-4-5",
  inputSchema,
  run: async (input, model) => {
    let targetEmail: string | null = null;
    let targetName = "client";
    if (input.clientId) {
      const [c] = await db.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
      targetName = c?.name ?? targetName;
    } else if (input.leadId) {
      const [l] = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      targetEmail = l?.email ?? null;
      targetName = l?.company ?? (`${l?.firstName ?? ""}`.trim() || targetName);
    }

    const { data, tokensInput, tokensOutput } = await llmJson({
      model,
      schema: proposalSchema,
      system:
        "Tu es un rédacteur senior de propositions commerciales pour l'agence PINKEVO. Structure : titre, contexte, objectifs, livrables, planning, prix setup + récurrent (en euros, réalistes pour une PME française).",
      prompt: `Service: ${SERVICE_LABEL[input.service]}\nCible: ${targetName}\nObjectifs: ${input.objectives}`,
    });

    const signatureToken =
      crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const [row] = await db
      .insert(proposals)
      .values({
        clientId: input.clientId || null,
        leadId: input.leadId || null,
        title: data.title,
        content: data,
        totalSetup: String(data.totalSetup),
        totalRecurring: String(data.totalRecurring),
        status: "sent",
        sentAt: new Date(),
        signatureToken,
      })
      .returning({ id: proposals.id });

    if (targetEmail && row) {
      await sendEmail({
        to: targetEmail,
        subject: data.title,
        react: ProposalEmail({
          contactName: targetName,
          proposalTitle: data.title,
          viewUrl: `${env.NEXT_PUBLIC_APP_URL}/p/${signatureToken}`,
        }),
      });
    }

    return {
      output: {
        proposalId: row?.id,
        totalSetup: data.totalSetup,
        totalRecurring: data.totalRecurring,
      },
      tokensInput,
      tokensOutput,
      summary: `Propale « ${data.title} » — setup ${data.totalSetup}€ / récurrent ${data.totalRecurring}€`,
    };
  },
};
