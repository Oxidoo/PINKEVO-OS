import "server-only";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { apiUsage, clients, expenses, invoices, toolSubscriptions } from "@/lib/db/schema";

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getRevenueOverview() {
  const [mrrRow] = await db
    .select({ mrr: sql<string>`coalesce(sum(${clients.mrr}), 0)` })
    .from(clients)
    .where(eq(clients.status, "active"));
  const mrr = Number(mrrRow?.mrr ?? 0);

  const [activeCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(clients)
    .where(eq(clients.status, "active"));

  const recentInvoices = await db
    .select()
    .from(invoices)
    .orderBy(desc(invoices.issuedAt))
    .limit(20);

  return {
    mrr,
    arr: mrr * 12,
    activeClients: activeCount?.n ?? 0,
    invoices: recentInvoices,
  };
}

export async function getCostsOverview() {
  const tools = await db
    .select()
    .from(toolSubscriptions)
    .orderBy(desc(toolSubscriptions.monthlyCost));
  const toolMonthly = tools.reduce(
    (s, t) => s + Number(t.monthlyCost ?? 0) + Number(t.annualCost ?? 0) / 12,
    0,
  );

  const [apiRow] = await db
    .select({ cost: sql<string>`coalesce(sum(${apiUsage.costUsd}), 0)` })
    .from(apiUsage)
    .where(gte(apiUsage.date, monthsAgo(0).toISOString().slice(0, 10)));

  const recentExpenses = await db
    .select()
    .from(expenses)
    .orderBy(desc(expenses.createdAt))
    .limit(20);

  return {
    tools,
    toolMonthly,
    apiMonthly: Number(apiRow?.cost ?? 0),
    expenses: recentExpenses,
  };
}

/** 12-month revenue (paid invoices) vs cost (expenses + api usage) series. */
export async function getMarginSeries() {
  const since = monthsAgo(11);

  const [revenue, expense, api] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${invoices.paidAt}, 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${invoices.total}), 0)`,
      })
      .from(invoices)
      .where(sql`${invoices.paidAt} is not null and ${invoices.paidAt} >= ${since}`)
      .groupBy(sql`to_char(${invoices.paidAt}, 'YYYY-MM')`),
    db
      .select({
        month: sql<string>`to_char(coalesce(${expenses.billingPeriodStart}, ${expenses.createdAt}), 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(sql`coalesce(${expenses.billingPeriodStart}, ${expenses.createdAt}) >= ${since}`)
      .groupBy(
        sql`to_char(coalesce(${expenses.billingPeriodStart}, ${expenses.createdAt}), 'YYYY-MM')`,
      ),
    db
      .select({
        month: sql<string>`to_char(${apiUsage.date}, 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${apiUsage.costUsd}), 0)`,
      })
      .from(apiUsage)
      .where(gte(apiUsage.date, since.toISOString().slice(0, 10)))
      .groupBy(sql`to_char(${apiUsage.date}, 'YYYY-MM')`),
  ]);

  const revMap = new Map(revenue.map((r) => [r.month, Number(r.total)]));
  const expMap = new Map(expense.map((r) => [r.month, Number(r.total)]));
  const apiMap = new Map(api.map((r) => [r.month, Number(r.total)]));

  const series: { month: string; revenue: number; cost: number; margin: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = monthsAgo(i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const rev = revMap.get(key) ?? 0;
    const cost = (expMap.get(key) ?? 0) + (apiMap.get(key) ?? 0);
    series.push({ month: key, revenue: rev, cost, margin: rev - cost });
  }
  return series;
}
