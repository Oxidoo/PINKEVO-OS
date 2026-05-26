import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Monitor, Smartphone, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PsiOpportunity, PsiResult } from "@/lib/integrations/psi/client";
import type { OnPageScanResult } from "@/lib/websites/onpage-scan";

interface Props {
  mobilePsi: PsiResult | null;
  desktopPsi: PsiResult | null;
  lastRunAt: Date | null;
  onPage: OnPageScanResult;
}

export function InsightsTab({ mobilePsi, desktopPsi, lastRunAt, onPage }: Props) {
  return (
    <div className="space-y-6">
      {(mobilePsi || desktopPsi) && lastRunAt && (
        <p className="text-xs text-muted-foreground">
          Dernier audit PSI : {format(lastRunAt, "d MMM yyyy 'à' HH:mm", { locale: fr })}
          {(mobilePsi?.mock || desktopPsi?.mock) && (
            <Badge variant="outline" className="ml-2 text-[10px]">
              Données de démo
            </Badge>
          )}
        </p>
      )}

      {!mobilePsi && !desktopPsi ? (
        <Card>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            <p>
              Aucun audit PageSpeed enregistré pour ce site. Lancez un audit pour voir les scores
              mobile / desktop, les Core Web Vitals et les opportunités d'amélioration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {mobilePsi && <PsiCard label="Mobile" icon={Smartphone} psi={mobilePsi} />}
          {desktopPsi && <PsiCard label="Desktop" icon={Monitor} psi={desktopPsi} />}
        </div>
      )}

      {mobilePsi && mobilePsi.opportunities.length > 0 && (
        <OpportunitiesCard
          title="Opportunités performance (mobile)"
          subtitle="Trié par gain potentiel"
          items={mobilePsi.opportunities}
          showSavings
        />
      )}

      {mobilePsi && mobilePsi.failures.length > 0 && (
        <OpportunitiesCard
          title="Points SEO / accessibilité à corriger"
          subtitle="Audits Lighthouse échoués"
          items={mobilePsi.failures}
        />
      )}

      <OnPageCard scan={onPage} />
    </div>
  );
}

function PsiCard({
  label,
  icon: Icon,
  psi,
}: {
  label: string;
  icon: typeof Smartphone;
  psi: PsiResult;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreDial label="Perf." score={psi.performance} />
          <ScoreDial label="SEO" score={psi.seo} />
          <ScoreDial label="A11y" score={psi.accessibility} />
          <ScoreDial label="Best pr." score={psi.bestPractices} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Core Web Vitals
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="LCP" value={fmtMs(psi.metrics.lcp)} good={psi.metrics.lcp <= 2500} />
            <Metric label="CLS" value={psi.metrics.cls.toFixed(3)} good={psi.metrics.cls <= 0.1} />
            <Metric label="TBT" value={fmtMs(psi.metrics.tbt)} good={psi.metrics.tbt <= 200} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-muted-foreground">
            <Metric label="FCP" value={fmtMs(psi.metrics.fcp)} subtle />
            <Metric label="Speed Index" value={fmtMs(psi.metrics.si)} subtle />
            <Metric label="TTI" value={fmtMs(psi.metrics.tti)} subtle />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreDial({ label, score }: { label: string; score: number }) {
  const color =
    score >= 90
      ? "text-success border-success/30 bg-success/10"
      : score >= 70
        ? "text-warning border-warning/30 bg-warning/10"
        : "text-destructive border-destructive/30 bg-destructive/10";
  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <p className="text-2xl font-semibold tabular-nums">{score}</p>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  good,
  subtle,
}: {
  label: string;
  value: string;
  good?: boolean;
  subtle?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-2 ${
        subtle
          ? "border-border/60"
          : good
            ? "border-success/30 bg-success/5"
            : "border-warning/30 bg-warning/5"
      }`}
    >
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide">{label}</p>
    </div>
  );
}

function OpportunitiesCard({
  title,
  subtitle,
  items,
  showSavings,
}: {
  title: string;
  subtitle: string;
  items: PsiOpportunity[];
  showSavings?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((o) => (
          <div key={o.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-sm">{o.title}</p>
              {showSavings && o.savingsMs > 0 && (
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  -{fmtMs(o.savingsMs)}
                </Badge>
              )}
            </div>
            {o.description && <p className="mt-1 text-xs text-muted-foreground">{o.description}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OnPageCard({ scan }: { scan: OnPageScanResult }) {
  const passes = scan.checks.filter((c) => c.status === "pass").length;
  const warns = scan.checks.filter((c) => c.status === "warn").length;
  const fails = scan.checks.filter((c) => c.status === "fail").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Scan on-page SEO</CardTitle>
            <p className="text-xs text-muted-foreground">
              Analysé en direct ({scan.responseTimeMs} ms)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreDial label="Score" score={scan.score} />
            <div className="flex flex-col gap-1 text-xs">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="size-3" /> {passes} OK
              </span>
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="size-3" /> {warns}
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="size-3" /> {fails}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {scan.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {scan.error}
          </p>
        ) : (
          <div className="space-y-2">
            {scan.checks.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                {c.status === "pass" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                ) : c.status === "warn" ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.label}</p>
                  <p className="break-words text-xs text-muted-foreground">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function fmtMs(ms: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}
