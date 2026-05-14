import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col bg-gradient-to-br from-brand-50 via-background to-accent">
      <header className="flex h-16 items-center px-6">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <span className="size-2.5 rounded-full bg-brand-500" />
          PINKEVO OS
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">{children}</main>
    </div>
  );
}
