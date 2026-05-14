"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
