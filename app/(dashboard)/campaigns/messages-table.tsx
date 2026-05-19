"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EmailMessage } from "@/lib/db/schema/communications";
import { MessageViewSheet } from "./message-view-sheet";

interface Props {
  messages: EmailMessage[];
}

export function MessagesTable({ messages }: Props) {
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);

  return (
    <>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destinataire</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Ouvert</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((m) => (
              <TableRow
                key={m.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedMessage(m)}
              >
                <TableCell className="font-medium">{m.toEmail}</TableCell>
                <TableCell className="text-muted-foreground">{m.subject}</TableCell>
                <TableCell>
                  <Badge variant="outline">{m.status}</Badge>
                </TableCell>
                <TableCell>{m.openedAt ? "✓" : "—"}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {format(m.createdAt, "d MMM HH:mm", { locale: fr })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MessageViewSheet
        message={selectedMessage}
        open={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </>
  );
}
