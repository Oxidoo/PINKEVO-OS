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
import { Building2, CheckSquare, Sparkles, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  bulkDeleteLeads,
  convertLeadToClient,
  deleteLead,
  enrichLead,
  updateLeadStatus,
} from "@/lib/crm/leads";
import type { Lead } from "@/lib/db/schema";
import { LeadSheet } from "./lead-sheet";
import { DEFAULT_FILTERS, type LeadFilters, LeadsFilterBar } from "./leads-filters";

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

function applyFilters(leads: Lead[], filters: LeadFilters): Lead[] {
  let out = leads;
  if (filters.query) {
    const q = filters.query.toLowerCase();
    out = out.filter(
      (l) =>
        leadName(l).toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q),
    );
  }
  if (filters.category !== "all") out = out.filter((l) => l.category === filters.category);
  if (filters.sector !== "all") out = out.filter((l) => l.sector === filters.sector);
  if (filters.zone) {
    const z = filters.zone.toLowerCase();
    out = out.filter((l) => l.zone?.toLowerCase().includes(z));
  }
  if (filters.sort === "score") out = [...out].sort((a, b) => b.score - a.score);
  else if (filters.sort === "name")
    out = [...out].sort((a, b) => leadName(a).localeCompare(leadName(b), "fr"));
  return out;
}

function LeadCard({
  lead,
  selected,
  selectionMode,
  onOpen,
  onSelect,
  onDelete,
}: {
  lead: Lead;
  selected: boolean;
  selectionMode: boolean;
  onOpen: (lead: Lead) => void;
  onSelect: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: selectionMode,
  });
  const [pending, start] = useTransition();

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors ${
        isDragging ? "opacity-50" : ""
      } ${selected ? "border-brand-400 bg-brand-50/30" : ""}`}
    >
      <div className="flex items-start gap-2">
        {selectionMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(lead.id, e.target.checked)}
            className="mt-0.5 shrink-0 accent-pink-500"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              className={`cursor-grab text-left font-medium hover:text-primary ${selectionMode ? "cursor-default" : ""}`}
              onClick={() => (selectionMode ? onSelect(lead.id, !selected) : onOpen(lead))}
              {...(!selectionMode ? { ...listeners, ...attributes } : {})}
            >
              {leadName(lead)}
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="outline" className="text-[10px] capitalize">
                {lead.source}
              </Badge>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!confirm(`Supprimer "${leadName(lead)}" ?`)) return;
                  onDelete(lead.id);
                }}
                className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                aria-label="Supprimer"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          {lead.company && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="size-3" /> {lead.company}
            </p>
          )}
          {lead.score > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Score : {lead.score}/100</p>
          )}
          {(lead.category || lead.sector || lead.zone) && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {lead.category && (
                <Badge variant="secondary" className="text-[10px]">
                  {lead.category}
                </Badge>
              )}
              {lead.sector && (
                <Badge variant="outline" className="text-[10px]">
                  {lead.sector}
                </Badge>
              )}
              {lead.zone && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  📍 {lead.zone}
                </Badge>
              )}
            </div>
          )}
          {!selectionMode && (
            <div className="mt-2 flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await enrichLead(lead.id);
                    if (r.ok) {
                      toast.success("Lead enrichi (Pappers)");
                      router.refresh();
                    } else {
                      toast.error(r.error);
                    }
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
                      if (r.ok) {
                        toast.success("Converti en client");
                        router.refresh();
                      } else {
                        toast.error(r.error);
                      }
                    })
                  }
                >
                  <UserPlus className="mr-1 size-3" /> Convertir
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  id,
  label,
  leads,
  selected,
  selectionMode,
  onOpen,
  onSelect,
  onDelete,
}: {
  id: string;
  label: string;
  leads: Lead[];
  selected: Set<string>;
  selectionMode: boolean;
  onOpen: (lead: Lead) => void;
  onSelect: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="group flex min-w-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[35vh] flex-col gap-2 rounded-xl border border-dashed p-2 transition sm:min-h-[60vh] ${
          isOver ? "border-brand-400 bg-brand-50/50" : ""
        }`}
      >
        {leads.map((l) => (
          <LeadCard
            key={l.id}
            lead={l}
            selected={selected.has(l.id)}
            selectionMode={selectionMode}
            onOpen={onOpen}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export function LeadsBoard({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [items, setItems] = useState(leads);
  useEffect(() => {
    setItems(leads);
  }, [leads]);
  const [optimistic, setOptimistic] = useOptimistic(items);
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [pending, start] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const filtered = applyFilters(optimistic, filters);

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
      if (r.ok) router.refresh();
      else toast.error(r.error);
    });
  }

  function handleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((l) => l.id !== id));
    start(async () => {
      const r = await deleteLead(id);
      if (r.ok) {
        router.refresh();
      } else {
        toast.error(r.error);
        setItems(items); // rollback
      }
    });
  }

  function handleBulkDelete() {
    const ids = [...selected];
    if (
      !confirm(
        `Supprimer ${ids.length} lead${ids.length > 1 ? "s" : ""} sélectionné${ids.length > 1 ? "s" : ""} ?`,
      )
    )
      return;
    setItems((prev) => prev.filter((l) => !ids.includes(l.id)));
    setSelected(new Set());
    setSelectionMode(false);
    start(async () => {
      const r = await bulkDeleteLeads(ids);
      if (r.ok) {
        toast.success(
          `${r.id} lead${Number(r.id) > 1 ? "s" : ""} supprimé${Number(r.id) > 1 ? "s" : ""}`,
        );
        router.refresh();
      } else {
        toast.error(r.error);
        setItems(items); // rollback
      }
    });
  }

  function toggleSelectionMode() {
    setSelectionMode((v) => !v);
    setSelected(new Set());
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1">
          <LeadsFilterBar filters={filters} onChange={setFilters} />
        </div>
        <Button
          variant={selectionMode ? "secondary" : "outline"}
          size="sm"
          onClick={toggleSelectionMode}
          className="shrink-0"
        >
          <CheckSquare className="mr-1 size-4" />
          {selectionMode ? "Annuler" : "Sélectionner"}
        </Button>
      </div>

      {selectionMode && selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selected.size} lead{selected.size > 1 ? "s" : ""} sélectionné
            {selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Tout désélectionner
            </Button>
            <Button size="sm" variant="destructive" disabled={pending} onClick={handleBulkDelete}>
              <Trash2 className="mr-1 size-4" />
              Supprimer ({selected.size})
            </Button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 xl:grid-cols-6">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              leads={filtered.filter((l) => l.status === col.id)}
              selected={selected}
              selectionMode={selectionMode}
              onOpen={setSelectedLead}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>

      <LeadSheet lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} />
    </>
  );
}
