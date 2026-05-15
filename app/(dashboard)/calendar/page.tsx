import { endOfMonth, startOfMonth } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/server";
import { getCalendarEvents, googleConnectionStatus } from "@/lib/calendar/actions";
import { CalendarGrid } from "./calendar-grid";
import { SyncButton } from "./sync-button";

export const metadata = { title: "Calendrier" };

export default async function CalendarPage() {
  await requireUser();
  const now = new Date();
  const from = startOfMonth(now);
  from.setDate(from.getDate() - 7);
  const to = endOfMonth(now);
  to.setDate(to.getDate() + 45);

  const [events, connected] = await Promise.all([
    getCalendarEvents(from, to),
    googleConnectionStatus(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendrier"
        description="Google Calendar + bookings Cal.com · matching auto leads/clients"
        action={<SyncButton connected={connected} />}
      />
      <CalendarGrid
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          provider: e.provider,
          startAt: e.startAt.toISOString(),
          endAt: e.endAt.toISOString(),
          meetingUrl: e.meetingUrl,
          linked: e.leadId ? "lead" : e.clientId ? "client" : null,
        }))}
      />
    </div>
  );
}
