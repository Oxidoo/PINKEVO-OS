"use client";

import { LayoutGrid, List, MoreHorizontal, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/format";
import { ClientForm } from "./client-form";
import { ClientRowActions } from "./client-row-actions";

const STATUS_LABEL: Record<string, string> = {
  prospect: "Prospect",
  active: "Actif",
  churned: "Churned",
};
const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  prospect: "secondary",
  active: "default",
  churned: "outline",
};

export function ClientsView({ clients }: { clients: Client[] }) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.company ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || c.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [clients, query, status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-md border">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("table")}
            aria-label="Vue table"
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={view === "cards" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("cards")}
            aria-label="Vue cards"
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="mr-1 size-4" /> Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau client</DialogTitle>
            </DialogHeader>
            <ClientForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Aucun client. Créez-en un pour démarrer.
        </div>
      ) : view === "table" ? (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Société</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.company ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(c.mrr)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <ClientRowActions
                      client={c}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="relative h-full transition hover:border-brand-300 hover:shadow-sm"
            >
              <Link href={`/clients/${c.id}`} className="block">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="pr-8 text-base">{c.name}</CardTitle>
                  <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{c.company ?? "—"}</p>
                  <p className="text-base font-semibold text-foreground">
                    {formatCurrency(c.mrr)} <span className="text-xs font-normal">/ mois</span>
                  </p>
                </CardContent>
              </Link>
              <div className="absolute right-2 top-2">
                <ClientRowActions
                  client={c}
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  }
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
