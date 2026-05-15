"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Building2, Sparkles, UserPlus } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { convertLeadToClient, enrichLead, updateLeadStatus } from "@/lib/crm/leads";
import type { Lead } from "@/lib/db/schema";

const COLUMNS = [
  { id: "new", label: "Nouveau" },
  { id: "enriched", label: "Enrichi" },
  { id: "contacted", label: "Contacté" },
  { id: "qualified", label: "Qualifié" },
  { id: "converted", label: "Converti" },
  { id: "lost", label: "Perdu" },
] as const;

function leadName(lead: Lead) {
  const n = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
  return n || lead.company || lead.email || "Lead sans nom";
}

function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const [pending, start] = useTransition();

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-3 text-sm shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="cursor-grab text-left font-medium"
          {...listeners}
          {...attributes}
        >
          {leadName(lead)}
        </button>
        <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
          {lead.source}
        </Badge>
      </div>
      {lead.company && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="size-3" /> {lead.company}
        </p>
      )}
      {lead.score > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Score : {lead.score}/100</p>
      )}
      <div className="mt-2 flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await enrichLead(lead.id);
              r.ok ? toast.success("Lead enrichi (Pappers)") : toast.error(r.error);
            })
          }
        >
          <Sparkles className="mr-1 size-3" /> Enrichir
        </Button>
        {lead.status !== "converted" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await convertLeadToClient(lead.id);
                r.ok ? toast.success("Converti en client") : toast.error(r.error);
              })
            }
          >
            <UserPlus className="mr-1 size-3" /> Convertir
          </Button>
        )}
      </div>
    </div>
  );
}

function Column({ id, label, leads }: { id: string; label: string; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[60vh] flex-col gap-2 rounded-xl border border-dashed p-2 transition ${
          isOver ? "border-brand-400 bg-brand-50/50" : ""
        }`}
      >
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} />
        ))}
      </div>
    </div>
  );
}

export function LeadsBoard({ leads }: { leads: Lead[] }) {
  const [items, setItems] = useState(leads);
  const [optimistic, setOptimistic] = useOptimistic(items);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(e: DragEndEvent) {
    const leadId = String(e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target) return;
    const lead = items.find((l) => l.id === leadId);
    if (!lead || lead.status === target) return;

    setOptimistic((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: target as Lead["status"] } : l)),
    );
    setItems((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: target as Lead["status"] } : l)),
    );
    updateLeadStatus(leadId, target).then((r) => {
      if (!r.ok) toast.error(r.error);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            leads={optimistic.filter((l) => l.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
