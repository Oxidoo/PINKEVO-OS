import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db/client";
import {
  activities,
  agentRuns,
  apiUsage,
  clients,
  deals,
  leads,
  proposals,
  toolSubscriptions,
} from "@/lib/db/schema";

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function _getDashboardData() {
  const ms = monthStart();

  const [
    mrrRow,
    activeRow,
    hotLeadsRow,
    toolRow,
    apiRow,
    monthSeries,
    todoLeads,
    todoProposals,
    recent,
    wonDeals,
    newClients,
    acceptedProposals,
  ] = await Promise.all([
    db
      .select({ v: sql<string>`coalesce(sum(${clients.mrr}), 0)` })
      .from(clients)
      .where(eq(clients.status, "active")),
    db.select({ n: sql<number>`count(*)::int` }).from(clients).where(eq(clients.status, "active")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(leads)
      .where(sql`${leads.status} = 'qualified' or ${leads.score} >= 70`),
    db
      .select({ v: sql<string>`coalesce(sum(${toolSubscriptions.monthlyCost}), 0)` })
      .from(toolSubscriptions),
    db
      .select({ v: sql<string>`coalesce(sum(${apiUsage.costUsd}), 0)` })
      .from(apiUsage)
      .where(gte(apiUsage.date, ms.toISOString().slice(0, 10))),
    db
      .select({
        month: sql<string>`to_char(${agentRuns.createdAt}, 'YYYY-MM')`,
        cost: sql<string>`coalesce(sum(${agentRuns.costUsd}), 0)`,
      })
      .from(agentRuns)
      .groupBy(sql`to_char(${agentRuns.createdAt}, 'YYYY-MM')`),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(leads)
      .where(sql`${leads.status} in ('contacted','qualified')`),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(proposals)
      .where(eq(proposals.status, "sent")),
    db.select().from(activities).orderBy(desc(activities.performedAt)).limit(8),
    db
      .select({ id: deals.id, title: deals.title, value: deals.value })
      .from(deals)
      .where(and(eq(deals.stage, "won"), gte(deals.updatedAt, ms))),
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(and(eq(clients.status, "active"), gte(clients.acquiredAt, ms))),
    db
      .select({ id: proposals.id, title: proposals.title })
      .from(proposals)
      .where(and(eq(proposals.status, "accepted"), gte(proposals.acceptedAt, ms))),
  ]);

  const mrr = Number(mrrRow[0]?.v ?? 0);
  const monthCost = Number(toolRow[0]?.v ?? 0) + Number(apiRow[0]?.v ?? 0);

  // Build 6-month revenue (MRR proxy) vs cost series for the chart.
  const costByMonth = new Map(monthSeries.map((r) => [r.month, Number(r.cost)]));
  const series: { month: string; revenue: number; cost: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    series.push({ month: key, revenue: mrr, cost: costByMonth.get(key) ?? 0 });
  }

  const wins = [
    ...wonDeals.map((d) => ({
      kind: "deal" as const,
      label: `Deal gagné : ${d.title}`,
      value: Number(d.value),
    })),
    ...newClients.map((c) => ({
      kind: "client" as const,
      label: `Nouveau client : ${c.name}`,
      value: 0,
    })),
    ...acceptedProposals.map((p) => ({
      kind: "proposal" as const,
      label: `Propale acceptée : ${p.title}`,
      value: 0,
    })),
  ];

  return {
    kpis: {
      mrr,
      activeClients: activeRow[0]?.n ?? 0,
      hotLeads: hotLeadsRow[0]?.n ?? 0,
      monthMargin: mrr - monthCost,
    },
    series,
    todo: {
      leadsToFollow: todoLeads[0]?.n ?? 0,
      proposalsPending: todoProposals[0]?.n ?? 0,
    },
    recent: recent.map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      content: a.content,
      at: a.performedAt.toISOString(),
    })),
    wins,
  };
}

export const getDashboardData = unstable_cache(_getDashboardData, ["dashboard-data"], {
  revalidate: 60,
  tags: ["dashboard"],
});
