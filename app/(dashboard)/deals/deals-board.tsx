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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { updateDealStage } from "@/lib/crm/deals";
import type { Deal } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/format";

const COLUMNS = [
  { id: "discovery", label: "Découverte" },
  { id: "proposal", label: "Proposition" },
  { id: "negotiation", label: "Négociation" },
  { id: "won", label: "Gagné" },
  { id: "lost", label: "Perdu" },
] as const;

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border bg-card p-3 text-sm shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="font-medium">{deal.title}</p>
      <p className="mt-1 font-semibold tabular-nums">{formatCurrency(deal.value)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{deal.probability}% de proba.</p>
    </div>
  );
}

function Column({ id, label, deals }: { id: string; label: string; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const total = deals.reduce((s, d) => s + Number(d.value), 0);
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary" className="tabular-nums">
          {formatCurrency(total)}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[55vh] flex-col gap-2 rounded-xl border border-dashed p-2 transition ${
          isOver ? "border-brand-400 bg-brand-50/50" : ""
        }`}
      >
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </div>
  );
}

export function DealsBoard({ deals }: { deals: Deal[] }) {
  const [items, setItems] = useState(deals);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const forecast = useMemo(() => {
    const open = items.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const weighted = open.reduce((s, d) => s + (Number(d.value) * d.probability) / 100, 0);
    const won = items.filter((d) => d.stage === "won").reduce((s, d) => s + Number(d.value), 0);
    return { weighted, won, pipeline: open.reduce((s, d) => s + Number(d.value), 0) };
  }, [items]);

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target) return;
    const deal = items.find((d) => d.id === id);
    if (!deal || deal.stage === target) return;
    setItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage: target as Deal["stage"] } : d)),
    );
    updateDealStage(id, target).then((r) => {
      if (!r.ok) toast.error(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Pipeline ouvert</p>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(forecast.pipeline)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Forecast pondéré</p>
          <p className="text-xl font-semibold tabular-nums text-brand-600">
            {formatCurrency(forecast.weighted)}
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Gagné</p>
          <p className="text-xl font-semibold tabular-nums text-success">
            {formatCurrency(forecast.won)}
          </p>
        </div>
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              deals={items.filter((d) => d.stage === col.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
