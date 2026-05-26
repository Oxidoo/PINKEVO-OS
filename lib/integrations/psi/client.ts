export interface PsiOpportunity {
  id: string;
  title: string;
  description: string;
  savingsMs: number;
}

export interface PsiResult {
  strategy: "mobile" | "desktop";
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  /** Numeric values for headline metrics (ms or unitless for cls). */
  metrics: {
    lcp: number;
    cls: number;
    tbt: number;
    fcp: number;
    si: number;
    tti: number;
  };
  /** Top performance opportunities sorted by potential savings. */
  opportunities: PsiOpportunity[];
  /** Top failing SEO / accessibility audits (score < 1). */
  failures: PsiOpportunity[];
  mock?: boolean;
}

type PsiAudit = {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  numericValue?: number;
  details?: { type?: string };
};

/**
 * Google PageSpeed Insights. Without GOOGLE_PSI_API_KEY we still hit the
 * public endpoint (it works keyless but rate-limited); on failure we return
 * a deterministic mock so audits remain demoable.
 */
export async function runPsi(url: string, strategy: "mobile" | "desktop"): Promise<PsiResult> {
  const key = process.env.GOOGLE_PSI_API_KEY;
  try {
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", strategy);
    for (const cat of ["performance", "seo", "accessibility", "best-practices"]) {
      endpoint.searchParams.append("category", cat);
    }
    if (key) endpoint.searchParams.set("key", key);

    const res = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`PSI ${res.status}`);
    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: Record<string, { score?: number; auditRefs?: { id: string }[] }>;
        audits?: Record<string, PsiAudit>;
      };
    };
    const cats = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};

    const opportunities: PsiOpportunity[] = Object.entries(audits)
      .filter(
        ([, a]) =>
          a?.details?.type === "opportunity" && (a.score ?? 1) < 0.9 && (a.numericValue ?? 0) > 0,
      )
      .sort((a, b) => (b[1].numericValue ?? 0) - (a[1].numericValue ?? 0))
      .slice(0, 6)
      .map(([id, a]) => ({
        id,
        title: a.title ?? id,
        description: stripMarkdown(a.description ?? ""),
        savingsMs: Math.round(a.numericValue ?? 0),
      }));

    const seoRefs = cats.seo?.auditRefs?.map((r) => r.id) ?? [];
    const a11yRefs = cats.accessibility?.auditRefs?.map((r) => r.id) ?? [];
    const failures: PsiOpportunity[] = [...seoRefs, ...a11yRefs]
      .map((id) => ({ id, audit: audits[id] }))
      .filter(({ audit }) => audit && (audit.score ?? 1) < 1 && audit.score !== null)
      .slice(0, 6)
      .map(({ id, audit }) => ({
        id,
        title: audit?.title ?? id,
        description: stripMarkdown(audit?.description ?? ""),
        savingsMs: 0,
      }));

    return {
      strategy,
      performance: Math.round((cats.performance?.score ?? 0) * 100),
      seo: Math.round((cats.seo?.score ?? 0) * 100),
      accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((cats["best-practices"]?.score ?? 0) * 100),
      metrics: {
        lcp: audits["largest-contentful-paint"]?.numericValue ?? 0,
        cls: audits["cumulative-layout-shift"]?.numericValue ?? 0,
        tbt: audits["total-blocking-time"]?.numericValue ?? 0,
        fcp: audits["first-contentful-paint"]?.numericValue ?? 0,
        si: audits["speed-index"]?.numericValue ?? 0,
        tti: audits.interactive?.numericValue ?? 0,
      },
      opportunities,
      failures,
    };
  } catch {
    const base = strategy === "mobile" ? 62 : 84;
    return {
      strategy,
      performance: base,
      seo: 88,
      accessibility: 91,
      bestPractices: 83,
      metrics: { lcp: 3200, cls: 0.08, tbt: 240, fcp: 1800, si: 4200, tti: 5100 },
      opportunities: [],
      failures: [],
      mock: true,
    };
  }
}

function stripMarkdown(text: string): string {
  // Remove [link](url) keeping label, then strip remaining brackets, code ticks, and trim.
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
