import "server-only";
import { count, eq, gte, sql } from "drizzle-orm";
import { executeAgentRun } from "@/lib/ai/runs";
import { db } from "@/lib/db/client";
import { agentRuns, agents, clients, leads, profiles } from "@/lib/db/schema";

/** A chat id is authorized only if it matches a team member's profile. */
export async function authorizeChat(chatId: string): Promise<string | null> {
  const [p] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.telegramChatId, chatId))
    .limit(1);
  return p?.id ?? null;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function cmdLeads(): Promise<string> {
  const rows = await db
    .select({ status: leads.status, n: count() })
    .from(leads)
    .groupBy(leads.status);
  if (rows.length === 0) return "Aucun lead.";
  const lines = rows.map((r) => `• ${r.status}: *${r.n}*`).join("\n");
  return `📇 *Leads par statut*\n${lines}`;
}

async function cmdMrr(): Promise<string> {
  const [row] = await db
    .select({ mrr: sql<string>`coalesce(sum(${clients.mrr}), 0)` })
    .from(clients)
    .where(eq(clients.status, "active"));
  const [active] = await db
    .select({ n: count() })
    .from(clients)
    .where(eq(clients.status, "active"));
  const mrr = Number(row?.mrr ?? 0);
  return `💰 *MRR* : ${mrr.toLocaleString("fr-FR")} €\nARR : ${(mrr * 12).toLocaleString("fr-FR")} €\nClients actifs : ${active?.n ?? 0}`;
}

async function cmdToday(): Promise<string> {
  const since = startOfToday();
  const [newLeads] = await db.select({ n: count() }).from(leads).where(gte(leads.createdAt, since));
  const [runs] = await db
    .select({ n: count() })
    .from(agentRuns)
    .where(gte(agentRuns.createdAt, since));
  return `📅 *Aujourd'hui*\nNouveaux leads : ${newLeads?.n ?? 0}\nRuns agents : ${runs?.n ?? 0}`;
}

/**
 * Trigger an agent from Telegram. The webhook has no auth session so we
 * enqueue directly (chat already authorized via authorizeChat).
 */
async function cmdRun(args: string, profileId: string): Promise<string> {
  // Format: /run lead_prospector keyword=resto ville=Paris
  const [slug, ...pairs] = args.trim().split(/\s+/);
  if (!slug) return "Usage : /run <agent> clé=valeur …";
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug as (typeof agents.slug.enumValues)[number]))
    .limit(1);
  if (!agent) return `Agent inconnu : ${slug}`;
  if (!agent.enabled) return `Agent ${slug} désactivé.`;

  const input: Record<string, string> = {};
  for (const p of pairs) {
    const [k, v] = p.split("=");
    if (k && v) input[k === "ville" ? "city" : k === "mot" ? "keyword" : k] = v;
  }

  const [run] = await db
    .insert(agentRuns)
    .values({ agentId: agent.id, triggeredBy: profileId, input, status: "queued" })
    .returning({ id: agentRuns.id });
  if (!run) return "❌ Création du run échouée.";

  if (process.env.INNGEST_EVENT_KEY) {
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({ name: "agent/run.requested", data: { runId: run.id } });
  } else {
    await executeAgentRun(run.id);
  }
  return `🤖 Agent *${slug}* lancé (run ${run.id.slice(0, 8)}).`;
}

export async function handleCommand(text: string, profileId: string): Promise<string> {
  const [cmd, ...rest] = text.trim().split(/\s+/);
  const args = rest.join(" ");
  switch (cmd) {
    case "/leads":
      return cmdLeads();
    case "/mrr":
      return cmdMrr();
    case "/today":
      return cmdToday();
    case "/run":
      return cmdRun(args, profileId);
    case "/start":
    case "/help":
      return [
        "🤖 *PINKEVO bot*",
        "/leads — leads par statut",
        "/mrr — revenus récurrents",
        "/today — résumé du jour",
        "/run <agent> clé=valeur — lancer un agent",
      ].join("\n");
    default:
      return "Commande inconnue. /help pour la liste.";
  }
}
