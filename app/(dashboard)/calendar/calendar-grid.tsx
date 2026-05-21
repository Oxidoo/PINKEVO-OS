"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";

export interface CalEvent {
  id: string;
  title: string;
  provider: string;
  startAt: string;
  endAt: string;
  meetingUrl: string | null;
  linked: "lead" | "client" | null;
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];

export function CalendarGrid({ events }: { events: CalEvent[] }) {
  const today = new Date();
  const [selected, setSelected] = useState<Date>(today);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(today), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(today), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [today]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const key = format(new Date(e.startAt), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(format(selected, "yyyy-MM-dd")) ?? [];

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => new Date(e.startAt) >= today)
        .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
        .slice(0, 8),
    [events, today],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div>
        <div className="mb-2 text-sm font-medium capitalize">
          {format(today, "MMMM yyyy", { locale: fr })}
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border text-sm">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className="bg-muted px-1 py-1.5 text-center text-xs font-medium">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            </div>
          ))}
          {days.map((day) => {
            const dayEvents = eventsByDay.get(format(day, "yyyy-MM-dd")) ?? [];
            const isToday = isSameDay(day, today);
            const isSel = isSameDay(day, selected);
            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                className={`min-h-14 bg-card p-1 text-left align-top transition hover:bg-muted/50 sm:min-h-20 sm:p-1.5 ${
                  isSameMonth(day, today) ? "" : "text-muted-foreground/50"
                } ${isSel ? "ring-2 ring-brand-400 ring-inset" : ""}`}
              >
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full text-[11px] sm:size-6 sm:text-xs ${
                    isToday ? "bg-brand-500 font-semibold text-white" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <>
                    <div className="mt-1 hidden space-y-0.5 sm:block">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="truncate rounded bg-brand-100 px-1 py-0.5 text-[10px] text-brand-800"
                        >
                          {format(new Date(e.startAt), "HH:mm")} {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.id} className="size-1.5 rounded-full bg-brand-500" />
                      ))}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium capitalize">
            {format(selected, "EEEE d MMMM", { locale: fr })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement ce jour.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">À venir</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rien de prévu. Synchronisez Google ou recevez des bookings Cal.com.
          </p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} showDate />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event, showDate }: { event: CalEvent; showDate?: boolean }) {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{event.title}</p>
        <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
          {event.provider === "cal_com" ? "Cal.com" : "Google"}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {showDate
          ? format(new Date(event.startAt), "d MMM HH:mm", { locale: fr })
          : `${format(new Date(event.startAt), "HH:mm")} – ${format(new Date(event.endAt), "HH:mm")}`}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {event.linked && (
          <Badge variant="secondary" className="text-[10px]">
            {event.linked === "lead" ? "Lead lié" : "Client lié"}
          </Badge>
        )}
        {event.meetingUrl && (
          <a
            href={event.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-600 hover:underline"
          >
            Rejoindre
          </a>
        )}
      </div>
    </div>
  );
}
