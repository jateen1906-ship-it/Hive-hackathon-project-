import React from "react";
import { ShieldAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/riskMeta";

export function Disclaimer({ className = "" }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2.5 text-xs text-muted-foreground ${className}`}
         data-testid="disclaimer">
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{DISCLAIMER}</span>
    </div>
  );
}

export function SyntheticBadge({ className = "" }) {
  return (
    <span
      data-testid="synthetic-data-badge"
      title="Demonstration data — not derived from live enforcement activity"
      className={`inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ${className}`}
    >
      Synthetic
    </span>
  );
}
