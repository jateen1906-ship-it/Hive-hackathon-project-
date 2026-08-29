import React from "react";
import { Card } from "@/components/ui/card";

export function KpiCard({ label, value, accent, hint, testId }) {
  return (
    <Card
      data-testid={testId}
      className="p-4 sm:p-5 border-l-4 transition-shadow hover:shadow-md"
      style={{ borderLeftColor: accent || "hsl(var(--border))" }}
    >
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl sm:text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
