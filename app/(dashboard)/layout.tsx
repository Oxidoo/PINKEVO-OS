import {
  Bot,
  Briefcase,
  CalendarDays,
  FileSignature,
  FileText,
  Globe,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { MobileNav, type MobileNavItem } from "@/components/shared/mobile-nav";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { getUser, requireUser } from "@/lib/auth/server";

const navItems: readonly MobileNavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/leads", label: "Leads", icon: Sparkles },
  { href: "/deals", label: "Deals", icon: Briefcase },
  { href: "/campaigns", label: "Communication", icon: Mail },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/websites", label: "Sites", icon: Globe },
  { href: "/agents", label: "Agents IA", icon: Bot },
  { href: "/automations", label: "Automatisations", icon: Workflow },
  { href: "/proposals", label: "Propositions", icon: FileSignature },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireUser();
  const user = await getUser();

  return (
    <div className="flex min-h-screen flex-1 bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <span className="inline-block size-2.5 rounded-full bg-brand-500" />
          <span className="font-semibold tracking-tight">PINKEVO OS</span>
        </div>
        <SidebarNav items={navItems} />
        <div className="border-t p-3 text-xs text-muted-foreground">v0.1 · phase 1</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-2 border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <MobileNav items={navItems} />
            <span className="flex items-center gap-2 font-semibold tracking-tight md:hidden">
              <span className="inline-block size-2.5 rounded-full bg-brand-500" />
              <span className="text-sm">PINKEVO OS</span>
            </span>
            <h1 className="hidden text-sm font-medium text-muted-foreground md:block">
              Cockpit agence
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
            <div className="mx-1 h-6 w-px bg-border" />
            <UserMenu
              name={profile.fullName}
              email={user?.email ?? ""}
              avatarUrl={profile.avatarUrl}
              role={profile.role}
            />
          </div>
        </header>
        <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
