"use client";

import {
  addMonths,
  addWeeks,
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
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCalendarEvents } from "@/lib/calendar/actions";

export interface CalEvent {
  id: string;
  title: string;
  provider: string;
  startAt: string;
  endAt: string;
  meetingUrl: string | null;
  linked: "lead" | "client" | null;
}

type View = "month" | "week" | "agenda";
type ProviderFilter = "all" | "google" | "cal_com";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2000, i, 1), "MMM", { locale: fr }),
);

/** Maps a raw DB calendar event (from the server action) to the client shape. */
type RawEvent = {
  id: string;
  title: string;
  provider: string;
  startAt: string | Date;
  endAt: string | Date;
  meetingUrl: string | null;
  leadId: string | null;
  clientId: string | null;
};

function toCalEvent(e: RawEvent): CalEvent {
  return {
    id: e.id,
    title: e.title,
    provider: e.provider,
    startAt: new Date(e.startAt).toISOString(),
    endAt: new Date(e.endAt).toISOString(),
    meetingUrl: e.meetingUrl,
    linked: e.leadId ? "lead" : e.clientId ? "client" : null,
  };
}

/** Computes the fetch/display range for a given view anchored on `viewDate`. */
function rangeFor(view: View, viewDate: Date): { from: Date; to: Date } {
  if (view === "week") {
    return {
      from: startOfWeek(viewDate, { weekStartsOn: 1 }),
      to: endOfWeek(viewDate, { weekStartsOn: 1 }),
    };
  }
  if (view === "month") {
    return {
      from: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 }),
      to: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 }),
    };
  }
  // agenda
  return { from: startOfMonth(viewDate), to: endOfMonth(viewDate) };
}

export function CalendarGrid({ events: initialEvents }: { events: CalEvent[] }) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<View>("month");
  const [viewDate, setViewDate] = useState<Date>(today);
  const [selected, setSelected] = useState<Date>(today);
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [events, setEvents] = useState<CalEvent[]>(initialEvents);
  const [loading, startFetch] = useTransition();

  // Reflect fresh server data (manual sync or 30s auto-refresh) when we're on
  // the default current-month view that the server prop covers.
  useEffect(() => {
    if (view === "month" && isSameMonth(viewDate, today)) setEvents(initialEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEvents]);

  const { from, to } = useMemo(() => rangeFor(view, viewDate), [view, viewDate]);
  const rangeKey = `${from.toISOString()}_${to.toISOString()}`;

  // Refetch when the visible range changes. Skip the very first run since the
  // server already provided events for the current month.
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    let cancelled = false;
    startFetch(async () => {
      const rows = (await getCalendarEvents(from, to)) as RawEvent[];
      if (!cancelled) setEvents(rows.map(toCalEvent));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const visibleEvents = useMemo(
    () =>
      providerFilter === "all"
        ? events
        : events.filter((e) => e.provider === providerFilter),
    [events, providerFilter],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of visibleEvents) {
      const key = format(new Date(e.startAt), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [visibleEvents]);

  const upcoming = useMemo(
    () =>
      visibleEvents
        .filter((e) => new Date(e.startAt) >= today)
        .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
        .slice(0, 8),
    [visibleEvents, today],
  );

  function navigate(dir: -1 | 1) {
    setViewDate((d) => (view === "week" ? addWeeks(d, dir) : addMonths(d, dir)));
  }
  function goToday() {
    setViewDate(today);
    setSelected(today);
  }

  const title =
    view === "week"
      ? `${format(from, "d", { locale: fr })} – ${format(to, "d MMM yyyy", { locale: fr })}`
      : format(viewDate, "MMMM yyyy", { locale: fr });

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate(-1)}
            aria-label={view === "week" ? "Semaine précédente" : "Mois précédent"}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <MonthYearPicker
            viewDate={viewDate}
            label={title}
            onPick={(d) => {
              setViewDate(d);
            }}
          />
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate(1)}
            aria-label={view === "week" ? "Semaine suivante" : "Mois suivant"}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="ml-1" onClick={goToday}>
            Aujourd&apos;hui
          </Button>
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={providerFilter}
            onValueChange={(v) => setProviderFilter(v as ProviderFilter)}
          >
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes sources</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="cal_com">Cal.com</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="month">Mois</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "agenda" ? (
        <AgendaView
          events={visibleEvents}
          today={today}
          monthLabel={format(viewDate, "MMMM yyyy", { locale: fr })}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            {view === "month" ? (
              <MonthView
                viewDate={viewDate}
                today={today}
                selected={selected}
                eventsByDay={eventsByDay}
                onSelect={setSelected}
              />
            ) : (
              <WeekView
                from={from}
                today={today}
                selected={selected}
                eventsByDay={eventsByDay}
                onSelect={setSelected}
              />
            )}

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium capitalize">
                {format(selected, "EEEE d MMMM", { locale: fr })}
              </h3>
              {(eventsByDay.get(format(selected, "yyyy-MM-dd")) ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun événement ce jour.</p>
              ) : (
                <div className="space-y-2">
                  {(eventsByDay.get(format(selected, "yyyy-MM-dd")) ?? []).map((e) => (
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
      )}
    </div>
  );
}

function MonthView({
  viewDate,
  today,
  selected,
  eventsByDay,
  onSelect,
}: {
  viewDate: Date;
  today: Date;
  selected: Date;
  eventsByDay: Map<string, CalEvent[]>;
  onSelect: (d: Date) => void;
}) {
  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewDate]);

  return (
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
            onClick={() => onSelect(day)}
            className={`min-h-14 bg-card p-1 text-left align-top transition hover:bg-muted/50 sm:min-h-20 sm:p-1.5 ${
              isSameMonth(day, viewDate) ? "" : "text-muted-foreground/50"
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
                    <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</div>
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
  );
}

function WeekView({
  from,
  today,
  selected,
  eventsByDay,
  onSelect,
}: {
  from: Date;
  today: Date;
  selected: Date;
  eventsByDay: Map<string, CalEvent[]>;
  onSelect: (d: Date) => void;
}) {
  const days = useMemo(
    () => eachDayOfInterval({ start: from, end: endOfWeek(from, { weekStartsOn: 1 }) }),
    [from],
  );

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border text-sm">
      {days.map((day, i) => {
        const isToday = isSameDay(day, today);
        const isSel = isSameDay(day, selected);
        return (
          <div key={day.toISOString()} className="flex flex-col bg-card">
            <button
              type="button"
              onClick={() => onSelect(day)}
              className={`flex flex-col items-center gap-0.5 border-b px-1 py-1.5 transition hover:bg-muted/50 ${
                isSel ? "bg-brand-50" : ""
              }`}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {WEEKDAYS[i]}
              </span>
              <span
                className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-brand-500 font-semibold text-white" : ""
                }`}
              >
                {format(day, "d")}
              </span>
            </button>
            <div className="flex min-h-32 flex-col gap-1 p-1 sm:min-h-64">
              {(eventsByDay.get(format(day, "yyyy-MM-dd")) ?? []).map((e) => (
                <button
                  type="button"
                  key={e.id}
                  onClick={() => onSelect(day)}
                  className="truncate rounded bg-brand-100 px-1 py-0.5 text-left text-[10px] text-brand-800 hover:bg-brand-200"
                >
                  {format(new Date(e.startAt), "HH:mm")} {e.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgendaView({
  events,
  today,
  monthLabel,
}: {
  events: CalEvent[];
  today: Date;
  monthLabel: string;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of [...events].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))) {
      const key = format(new Date(e.startAt), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [events]);

  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
        Aucun événement en <span className="capitalize">{monthLabel}</span>.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([key, dayEvents]) => {
        const date = new Date(`${key}T00:00:00`);
        const isToday = isSameDay(date, today);
        return (
          <div key={key} className="flex gap-3">
            <div className="w-14 shrink-0 text-right">
              <div className="text-xs text-muted-foreground capitalize">
                {format(date, "EEE", { locale: fr })}
              </div>
              <div
                className={`text-lg font-semibold ${isToday ? "text-brand-600" : ""}`}
              >
                {format(date, "d")}
              </div>
            </div>
            <div className="flex-1 space-y-2 border-l pl-3">
              {dayEvents.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthYearPicker({
  viewDate,
  label,
  onPick,
}: {
  viewDate: Date;
  label: string;
  onPick: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(viewDate.getFullYear());

  // Resync the year shown in the popover whenever it (re)opens.
  useEffect(() => {
    if (open) setPickerYear(viewDate.getFullYear());
  }, [open, viewDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="min-w-32 gap-1.5 font-medium capitalize">
          <CalendarDays className="size-4 text-muted-foreground" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPickerYear((y) => y - 1)}
            aria-label="Année précédente"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-semibold">{pickerYear}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPickerYear((y) => y + 1)}
            aria-label="Année suivante"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m, i) => {
            const isCurrent =
              viewDate.getFullYear() === pickerYear && viewDate.getMonth() === i;
            return (
              <Button
                key={m}
                variant={isCurrent ? "default" : "ghost"}
                size="sm"
                className="capitalize"
                onClick={() => {
                  onPick(new Date(pickerYear, i, 1));
                  setOpen(false);
                }}
              >
                {m}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
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
