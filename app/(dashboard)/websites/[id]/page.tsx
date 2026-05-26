import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUser, requireUser } from "@/lib/auth/server";
import { fetchGscSummary } from "@/lib/integrations/google/gsc";
import { scanOnPage } from "@/lib/websites/onpage-scan";
import { getLatestPsi, getWebsiteDetail } from "@/lib/websites/queries";
import { AuditButton } from "../audit-button";
import { QuickScanButton } from "../quick-scan-button";
import { InsightsTab } from "./insights-tab";

export default async function WebsiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const user = await getUser();
  const { id } = await params;
  const data = await getWebsiteDetail(id);
  if (!data) notFound();
  const { website, audits } = data;
  const [gsc, psi] = await Promise.all([
    user ? fetchGscSummary(user.id, website.url) : Promise.resolve(null),
    getLatestPsi(website.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/websites">
            <ArrowLeft className="mr-1 size-4" /> Sites
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {website.name}
            </h1>
            <a
              href={website.url}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm text-brand-600 hover:underline"
            >
              {website.url}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <QuickScanButton websiteId={website.id} />
            <AuditButton websiteId={website.id} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="insights">
        <TabsList>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="audits">Audits ({audits.length})</TabsTrigger>
          <TabsTrigger value="gsc">Search Console</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-6">
          <Suspense fallback={<InsightsSkeleton />}>
            <InsightsAsync website={website} psi={psi} />
          </Suspense>
        </TabsContent>

        <TabsContent value="audits" className="mt-6">
          {audits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun audit. Lancez un re-scan ou un audit complet (SEO + perf).
            </p>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {a.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {a.score ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {format(a.runAt, "d MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gsc" className="mt-6">
          {!gsc?.connected ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Search Console non connecté.{" "}
                <a href="/api/google/connect" className="text-brand-600 hover:underline">
                  Connecter Google
                </a>{" "}
                (scope webmasters.readonly).
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">Clics (120j)</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {gsc.totalClicks.toLocaleString("fr-FR")}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">Impressions (120j)</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {gsc.totalImpressions.toLocaleString("fr-FR")}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top requêtes</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requête</TableHead>
                        <TableHead className="text-right">Clics</TableHead>
                        <TableHead className="text-right">Impr.</TableHead>
                        <TableHead className="text-right">Pos.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gsc.topQueries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Aucune donnée
                          </TableCell>
                        </TableRow>
                      ) : (
                        gsc.topQueries.map((q) => (
                          <TableRow key={q.query}>
                            <TableCell className="font-medium">{q.query}</TableCell>
                            <TableCell className="text-right tabular-nums">{q.clicks}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {q.impressions}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{q.position}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function InsightsAsync({
  website,
  psi,
}: {
  website: { id: string; url: string };
  psi: Awaited<ReturnType<typeof getLatestPsi>>;
}) {
  const onPage = await scanOnPage(website.url);
  return (
    <InsightsTab
      mobilePsi={psi.mobile}
      desktopPsi={psi.desktop}
      lastRunAt={psi.lastRunAt}
      onPage={onPage}
    />
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-60 w-full rounded-xl" />
    </div>
  );
}
