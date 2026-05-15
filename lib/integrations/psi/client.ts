export interface PsiResult {
  strategy: "mobile" | "desktop";
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  metrics: Record<string, number>;
  mock?: boolean;
}

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

    const res = await fetch(endpoint, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`PSI ${res.status}`);
    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: Record<string, { score?: number }>;
        audits?: Record<string, { numericValue?: number }>;
      };
    };
    const cats = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};
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
      },
    };
  } catch {
    const base = strategy === "mobile" ? 62 : 84;
    return {
      strategy,
      performance: base,
      seo: 88,
      accessibility: 91,
      bestPractices: 83,
      metrics: { lcp: 3200, cls: 0.08, tbt: 240 },
      mock: true,
    };
  }
}
