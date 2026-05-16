"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Trash2, Upload } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteDocument, getDocumentUrl, uploadDocument } from "@/lib/documents/actions";

interface Doc {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

function humanSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

export function DocumentsClient({ documents }: { documents: Doc[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const r = await uploadDocument(fd);
      if (r.ok) toast.success("Document uploadé");
      else toast.error(r.error);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function open(id: string) {
    start(async () => {
      const r = await getDocumentUrl(id);
      if (r.ok && r.id) window.open(r.id, "_blank", "noopener");
      else toast.error(r.ok ? "URL indisponible" : r.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      const r = await deleteDocument(id);
      if (r.ok) toast.success("Document supprimé");
      else toast.error(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <input ref={inputRef} type="file" className="hidden" onChange={onFile} disabled={pending} />
        <Button onClick={() => inputRef.current?.click()} disabled={pending}>
          <Upload className="mr-1 size-4" />
          {pending ? "Traitement…" : "Uploader un document"}
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Aucun document. Uploadez contrats, briefs, assets, rapports.
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-right">Taille</TableHead>
                <TableHead className="hidden md:table-cell">Ajouté</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {d.mimeType ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {humanSize(d.sizeBytes)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {format(new Date(d.createdAt), "d MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => open(d.id)}
                      aria-label="Ouvrir"
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(d.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
