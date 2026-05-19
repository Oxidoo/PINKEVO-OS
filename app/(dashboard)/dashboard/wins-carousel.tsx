"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface Win {
  kind: string;
  label: string;
  value: number;
}

export function WinsCarousel({ wins }: { wins: Win[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (wins.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % wins.length), 4000);
    return () => clearInterval(t);
  }, [wins.length]);

  if (wins.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Pas encore de win ce mois-ci — ça arrive vite. 🚀
      </div>
    );
  }

  const win = wins[idx];
  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-brand-50 to-accent p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand-500 text-white">
          <Trophy className="size-5" />
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="font-semibold">{win?.label}</p>
            {win && win.value > 0 && (
              <p className="text-sm text-muted-foreground">{win.value.toLocaleString("fr-FR")} €</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {wins.length > 1 && (
        <div className="mt-4 flex gap-1">
          {wins.map((w, i) => (
            <span
              key={w.label}
              className={`h-1 flex-1 rounded-full ${i === idx ? "bg-brand-500" : "bg-brand-200"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
