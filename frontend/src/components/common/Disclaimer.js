import React from "react";
import { ShieldAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/riskMeta";

export function Disclaimer({ className = "" }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-500 ${className}`}
         data-testid="disclaimer">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <span className="leading-relaxed">{DISCLAIMER}</span>
    </div>
  );
}

export function SyntheticBadge({ className = "" }) {
  return (
    <span
      data-testid="synthetic-data-badge"
      title="Demonstration data — not derived from live enforcement activity"
      className={`inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ${className}`}
    >
      Synthetic
    </span>
  );
}
