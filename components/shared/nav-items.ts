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

export const NAV_ITEMS: readonly NavItem[] = [
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
