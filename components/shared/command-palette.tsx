"use client";

import { Briefcase, Loader2, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { globalSearch, type SearchResult } from "@/lib/search/actions";

const KIND_ICON = {
  lead: Sparkles,
  client: Users,
  deal: Briefcase,
} as const;

const KIND_LABEL = {
  lead: "Leads",
  client: "Clients",
  deal: "Deals",
} as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K keyboard shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const search = useCallback((q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch(q);
        setResults(res);
      });
    }, 180);
  }, []);

  function handleChange(v: string) {
    setQuery(v);
    if (v.length >= 2) search(v);
    else setResults([]);
  }

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href as Parameters<typeof router.push>[0]);
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setQuery("");
      setResults([]);
    }
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const list = acc[r.kind];
    if (list) {
      list.push(r);
    } else {
      acc[r.kind] = [r];
    }
    return acc;
  }, {});

  return (
    <>
      {/* Trigger button — rendered in place (header); dialog portals to body. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-ring hover:text-foreground sm:flex"
        aria-label="Recherche globale (⌘K)"
      >
        <span>Recherche…</span>
        <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Recherche globale"
        description="Cherche un lead, client ou deal"
      >
        <CommandInput
          placeholder="Chercher un lead, client, deal…"
          value={query}
          onValueChange={handleChange}
        />
        <CommandList>
          {isPending && (
            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
              <Loader2 className="mr-2 size-3 animate-spin" /> Recherche…
            </div>
          )}
          {!isPending && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Aucun résultat pour « {query} »</CommandEmpty>
          )}
          {!isPending && query.length < 2 && (
            <CommandEmpty className="text-muted-foreground">
              Tape au moins 2 caractères…
            </CommandEmpty>
          )}
          {(["lead", "client", "deal"] as const).map((kind, i) => {
            const group = grouped[kind];
            if (!group?.length) return null;
            const Icon = KIND_ICON[kind];
            return (
              <span key={kind}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={KIND_LABEL[kind]}>
                  {group.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={`${r.id}-${r.label}`}
                      onSelect={() => handleSelect(r.href)}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{r.label}</span>
                      {r.sub && (
                        <span className="truncate text-xs text-muted-foreground">{r.sub}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </span>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
