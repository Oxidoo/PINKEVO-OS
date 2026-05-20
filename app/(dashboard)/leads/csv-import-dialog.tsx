"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { importLeadsFromCsv } from "@/lib/crm/leads";
import { CATEGORY_SECTORS, LEAD_CATEGORIES, LEAD_SECTORS } from "./leads-filters";

// RFC 4180 compliant CSV parser — handles quoted fields with commas/newlines inside
function parseCsvRfc4180(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuote = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\r" && text[i + 1] === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i++;
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

const SENTINEL = "### In progress ###";
function clean(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" || t === SENTINEL ? null : t;
}

function firstEmail(raw: string | null): string | null {
  if (!raw) return null;
  for (const part of raw.split(",")) {
    const e = part.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return e;
  }
  return null;
}

interface ParsedLead {
  company: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  enrichmentData: Record<string, string>;
}

function parseRows(text: string): ParsedLead[] {
  const raw = parseCsvRfc4180(text);
  if (raw.length < 2) return [];

  const headers = (raw[0] ?? []).map((h) =>
    h.toLowerCase().trim().replace(/['"]/g, "").replace(/\s+/g, " "),
  );

  const idx = (names: string[]): number =>
    names.reduce((found, n) => (found >= 0 ? found : headers.indexOf(n)), -1);

  const iName = idx(["name", "nom", "société", "societe", "company", "entreprise"]);
  const iFirstName = idx(["first name", "firstname", "prenom", "prénom"]);
  const iLastName = idx(["last name", "lastname", "nom"]);
  const iEmail = idx(["emails", "email", "mail"]);
  const iPhone = idx(["phone", "tel", "telephone", "téléphone"]);
  const iWebsite = idx(["website", "site web", "site"]);
  const iAddress = idx(["address", "adresse"]);
  const iRating = idx(["rating"]);
  const iFacebook = idx(["facebook"]);
  const iInstagram = idx(["instagram"]);
  const iBingCat = idx(["category", "catégorie", "categorie"]);

  const get = (cells: string[], i: number) => clean(cells[i]);

  return raw
    .slice(1)
    .map((cells) => {
      const enrichmentData: Record<string, string> = {};
      const website = get(cells, iWebsite);
      const address = get(cells, iAddress);
      const rating = get(cells, iRating);
      const facebook = get(cells, iFacebook);
      const instagram = get(cells, iInstagram);
      const bingCategory = get(cells, iBingCat);

      if (website) enrichmentData.website = website;
      if (address) enrichmentData.address = address;
      if (rating) enrichmentData.rating = rating;
      if (facebook) enrichmentData.facebook = facebook;
      if (instagram) enrichmentData.instagram = instagram;
      if (bingCategory) enrichmentData.bingCategory = bingCategory;

      return {
        company: iName >= 0 ? get(cells, iName) : null,
        firstName: iFirstName >= 0 ? get(cells, iFirstName) : null,
        lastName: iLastName >= 0 ? get(cells, iLastName) : null,
        email: firstEmail(iEmail >= 0 ? get(cells, iEmail) : null),
        phone: iPhone >= 0 ? get(cells, iPhone) : null,
        enrichmentData,
      };
    })
    .filter((r) => r.company || r.email || r.lastName);
}

export function CsvImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<ParsedLead[]>([]);
  const [category, setCategory] = useState("");
  const [sector, setSector] = useState("");
  const [zone, setZone] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text: string) => setRows(parseRows(text)));
  }

  function reset() {
    setRows([]);
    setCategory("");
    setSector("");
    setZone("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function onImport() {
    start(async () => {
      const res = await importLeadsFromCsv(rows, {
        category: category || undefined,
        sector: sector || undefined,
        zone: zone || undefined,
      });
      if (res.ok) {
        const { imported, skipped } = JSON.parse(res.id ?? "{}") as {
          imported: number;
          skipped: number;
        };
        toast.success(
          skipped > 0
            ? `${imported} leads importés · ${skipped} doublons ignorés`
            : `${imported} leads importés`,
        );
        router.refresh();
        setOpen(false);
        reset();
      } else {
        toast.error(res.error);
      }
    });
  }

  const preview: ParsedLead[] = rows.slice(0, 5);

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-1 size-4" /> Importer CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des leads</DialogTitle>
          <DialogDescription>
            Compatible Bing Maps Scraper et CSV standard (FR/EN, séparateur «&nbsp;,&nbsp;»). Les
            doublons (même email ou téléphone) sont ignorés automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors hover:border-brand-400 hover:bg-muted/40">
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {rows.length > 0
                ? `${rows.length} leads détectés — cliquer pour changer de fichier`
                : "Cliquer ou glisser un fichier CSV ici"}
            </span>
            <span className="text-xs text-muted-foreground">
              Bing Maps Scraper, export standard…
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="sr-only"
            />
          </label>

          {rows.length > 0 && (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom / Société</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Site web</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((r: ParsedLead, i: number) => {
                      const name =
                        (r.company ?? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()) || "—";
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell className="text-muted-foreground">{r.phone ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.email ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                            {r.enrichmentData.website
                              ? r.enrichmentData.website.replace(/^https?:\/\//, "")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {rows.length > 5 && (
                  <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                    + {rows.length - 5} autres lignes…
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Catégorie (appliquée à tous)</Label>
                  <Select
                    value={category || "none"}
                    onValueChange={(v: string) => {
                      setCategory(v === "none" ? "" : v);
                      setSector("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {LEAD_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Secteur / Métier (appliqué à tous)</Label>
                  <Select
                    value={sector || "none"}
                    onValueChange={(v: string) => setSector(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {(category ? (CATEGORY_SECTORS[category] ?? LEAD_SECTORS) : LEAD_SECTORS).map(
                        (s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label>Zone (appliquée à tous)</Label>
                  <Input
                    placeholder="Ex : Lille, Nord 59, Paris…"
                    value={zone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setZone(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={onImport} disabled={pending} className="w-full">
                {pending ? "Import en cours…" : `Importer ${rows.length} leads`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
