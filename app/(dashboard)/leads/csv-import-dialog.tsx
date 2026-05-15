"use client";

import { Upload } from "lucide-react";
import { useState, useTransition } from "react";
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
import { importLeadsCsv } from "@/lib/crm/leads";

const HEADER_ALIASES: Record<string, string> = {
  prenom: "firstName",
  firstname: "firstName",
  "first name": "firstName",
  nom: "lastName",
  lastname: "lastName",
  "last name": "lastName",
  email: "email",
  mail: "email",
  tel: "phone",
  telephone: "phone",
  phone: "phone",
  societe: "company",
  société: "company",
  company: "company",
  entreprise: "company",
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const delimiter = (lines[0]?.includes(";") ? ";" : ",") as string;
  const headers = (lines[0] ?? "")
    .split(delimiter)
    .map((h) => HEADER_ALIASES[h.trim().toLowerCase()] ?? h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

export function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [count, setCount] = useState<number | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const rows = parseCsv(text);
      setCount(rows.length);
      start(async () => {
        const res = await importLeadsCsv(rows);
        if (res.ok) {
          toast.success(`${res.id} leads importés`);
          setOpen(false);
        } else {
          toast.error(res.error);
        }
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-1 size-4" /> Importer CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer des leads</DialogTitle>
          <DialogDescription>
            CSV avec colonnes : prénom, nom, email, téléphone, société (FR ou EN, séparateur
            «&nbsp;,&nbsp;» ou «&nbsp;;&nbsp;»). Le mapping est automatique.
          </DialogDescription>
        </DialogHeader>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          disabled={pending}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-white"
        />
        {pending && <p className="text-sm text-muted-foreground">Import de {count} lignes…</p>}
      </DialogContent>
    </Dialog>
  );
}
