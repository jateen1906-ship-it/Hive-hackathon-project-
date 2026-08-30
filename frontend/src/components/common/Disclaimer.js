import React from "react";
import { ShieldAlert } from "lucide-react";
import { DISCLAIMER } from "@/lib/riskMeta";

export function Disclaimer({ className = "" }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-[#1a1714] px-4 py-3 text-xs text-[#9e958d] ${className}`}
         data-testid="disclaimer">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
      <span className="leading-relaxed">{DISCLAIMER}</span>
    </div>
  );
}

export function SyntheticBadge({ className = "" }) {
  return (
    <span
      data-testid="synthetic-data-badge"
      title="Demonstration data — not derived from live enforcement activity"
      className={`inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 ${className}`}
    >
      Synthetic
    </span>
  );
}
