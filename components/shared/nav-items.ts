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
import type { Route } from "next";
import type { ComponentType } from "react";

export interface NavItem {
  href: Route;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export interface NavGroup {
  label: string | null;
  items: readonly NavItem[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    label: "CRM",
    items: [
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/leads", label: "Leads", icon: Sparkles },
      { href: "/deals", label: "Deals", icon: Briefcase },
    ],
  },
  {
    label: "Opérations",
    items: [
      { href: "/campaigns", label: "Communication", icon: Mail },
      { href: "/calendar", label: "Calendrier", icon: CalendarDays },
      { href: "/websites", label: "Sites", icon: Globe },
      { href: "/agents", label: "Agents IA", icon: Bot },
      { href: "/automations", label: "Automatisations", icon: Workflow },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/proposals", label: "Propositions", icon: FileSignature },
      { href: "/documents", label: "Documents", icon: FileText },
      { href: "/finance", label: "Finance", icon: Wallet },
    ],
  },
  {
    label: null,
    items: [{ href: "/settings", label: "Paramètres", icon: Settings }],
  },
] as const;

// Flat list kept for backward-compat (mobile nav, etc.)
export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
