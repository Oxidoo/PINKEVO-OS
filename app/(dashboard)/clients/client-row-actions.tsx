"use client";

import { Archive, ArchiveRestore, Pencil } from "lucide-react";
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
import { archiveClient, unarchiveClient } from "@/lib/crm/clients";
import type { Client } from "@/lib/db/schema";
import { ClientForm } from "./client-form";

interface Props {
  client: Client;
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function ClientRowActions({ client, trigger, align = "end" }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-44">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" /> Éditer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isArchived ? "Réactiver le client ?" : "Archiver le client ?"}
            </DialogTitle>
            <DialogDescription>
              {isArchived
                ? `${client.name} repassera en statut « Actif ». Aucune donnée n'est modifiée.`
                : `${client.name} passera en statut « Churned ». Ses projets, sites et factures restent intacts.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button onClick={onArchive} disabled={pending}>
              {pending ? "…" : isArchived ? "Réactiver" : "Archiver"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
