"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/celebrations/animated-number";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: number;
  currency?: boolean;
}

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export function KpiCard({ label, value, currency }: KpiCardProps) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.005 }} transition={{ duration: 0.15 }}>
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
            <AnimatedNumber
              value={value}
              format={currency ? eur : (n) => Math.round(n).toLocaleString("fr-FR")}
            />
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
