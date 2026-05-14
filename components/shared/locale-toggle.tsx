"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/config";

export function LocaleToggle() {
  const current = useLocale();
  const [, startTransition] = useTransition();

  const change = (locale: Locale) => {
    startTransition(() => {
      void setLocale(locale);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Changer la langue">
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change("fr")} disabled={current === "fr"}>
          🇫🇷 Français
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("en")} disabled={current === "en"}>
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
