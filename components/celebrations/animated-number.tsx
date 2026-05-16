"use client";

import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
}

/** Counts up from 0 to `value` on mount. */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("fr-FR"),
  durationMs = 900,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [value, durationMs, format]);

  return <span ref={ref}>{format(0)}</span>;
}
