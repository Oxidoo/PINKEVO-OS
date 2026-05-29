"use client";

export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      className="hidden items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-ring hover:text-foreground sm:flex"
      aria-label="Recherche globale (⌘K)"
    >
      <span>Recherche…</span>
      <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}
