import type { ReactNode } from "react";
import { CommandPalette } from "@/components/shared/command-palette";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { MobileNav } from "@/components/shared/mobile-nav";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { getUser, requireUser } from "@/lib/auth/server";

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
        <SidebarNav />
        <div className="border-t p-3 text-xs text-muted-foreground">v0.1 · phase 1</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-2 border-b bg-background px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <MobileNav />
            <span className="flex items-center gap-2 font-semibold tracking-tight md:hidden">
              <span className="inline-block size-2.5 rounded-full bg-brand-500" />
              <span className="text-sm">PINKEVO OS</span>
            </span>
            <h1 className="hidden text-sm font-medium text-muted-foreground md:block">
              Cockpit agence
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
              }}
              className="hidden items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-ring hover:text-foreground sm:flex"
              aria-label="Recherche globale (⌘K)"
            >
              <span>Recherche…</span>
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </button>
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
        <CommandPalette />
      </div>
    </div>
  );
}
