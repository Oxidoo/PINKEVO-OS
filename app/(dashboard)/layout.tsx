import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Briefcase,
  CalendarDays,
  Globe,
  Bot,
  Workflow,
  FileText,
  Wallet,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/leads", label: "Leads", icon: Sparkles },
  { href: "/deals", label: "Deals", icon: Briefcase },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/websites", label: "Sites", icon: Globe },
  { href: "/agents", label: "Agents IA", icon: Bot },
  { href: "/automations", label: "Automatisations", icon: Workflow },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <span className="inline-block size-2.5 rounded-full bg-brand-500" />
          <span className="font-semibold tracking-tight">PINKEVO OS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground">v0.1 · scaffolding</div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-background px-6">
          <h1 className="text-sm font-medium text-muted-foreground">Cockpit agence</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Bienvenue</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>
      </div>
    </div>
  );
}
