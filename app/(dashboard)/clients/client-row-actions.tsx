"use client";

import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveClient, deleteClient, unarchiveClient } from "@/lib/crm/clients";
import type { Client } from "@/lib/db/schema";
import { ClientForm } from "./client-form";

interface Props {
  client: Client;
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
  /** If set, navigate to this URL after a successful delete (e.g. back to /clients). */
  onDeleteRedirectTo?: string;
}

export function ClientRowActions({ client, trigger, align = "end", onDeleteRedirectTo }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, start] = useTransition();
  const isArchived = client.status === "churned";

  function onArchive() {
    start(async () => {
      const res = isArchived ? await unarchiveClient(client.id) : await archiveClient(client.id);
      if (res.ok) {
        toast.success(isArchived ? "Client réactivé" : "Client archivé");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setArchiveOpen(false);
    });
  }

  function onDelete() {
    start(async () => {
      const res = await deleteClient(client.id);
      if (res.ok) {
        toast.success(`${client.name} supprimé définitivement`);
        setDeleteOpen(false);
        setConfirmText("");
        if (onDeleteRedirectTo) router.push(onDeleteRedirectTo);
        else router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-52">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" /> Éditer
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setArchiveOpen(true)}>
            {isArchived ? (
              <>
                <ArchiveRestore className="mr-2 size-4" /> Réactiver
              </>
            ) : (
              <>
                <Archive className="mr-2 size-4" /> Archiver
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setConfirmText("");
              setDeleteOpen(true);
            }}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" /> Supprimer définitivement
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Éditer {client.name}</DialogTitle>
            <DialogDescription>
              Les modifications sont reflétées partout (deals, sites, finance).
            </DialogDescription>
          </DialogHeader>
          <ClientForm client={client} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isArchived ? "Réactiver le client ?" : "Archiver le client ?"}
            </DialogTitle>
            <DialogDescription>
              {isArchived
                ? `${client.name} repassera en statut « Actif ». Aucune donnée n'est modifiée.`
                : `${client.name} sera déplacé dans l'onglet « Archivés ». Ses projets, sites et factures restent intacts.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setArchiveOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button onClick={onArchive} disabled={pending}>
              {pending ? "…" : isArchived ? "Réactiver" : "Archiver"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer {client.name} ?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  Cette action est <strong>irréversible</strong>. Seront supprimés en cascade :
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                  <li>Tous les contacts du client</li>
                  <li>Tous les projets, sites et audits associés</li>
                  <li>Toutes les factures et abonnements liés</li>
                </ul>
                <p className="text-muted-foreground">
                  Les deals, propositions et historique de communications conservent leurs données
                  mais perdent le lien client.
                </p>
                <p>
                  Pour confirmer, saisissez <code className="rounded bg-muted px-1">supprimer</code>{" "}
                  ci-dessous.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="supprimer"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/30"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmText("");
              }}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={pending || confirmText.trim().toLowerCase() !== "supprimer"}
            >
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
