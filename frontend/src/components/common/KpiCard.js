import React from "react";
import { Card } from "@/components/ui/card";

export function KpiCard({ label, value, accent, hint, testId }) {
  return (
    <Card
      data-testid={testId}
      className="alvero-card p-4 sm:p-5 relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300"
    >
      {/* Top accent glow line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2.5px] opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accent || "hsl(var(--primary))" }}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9e958d]">{label}</div>
        <div 
          className="h-2 w-2 rounded-full opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all"
          style={{ backgroundColor: accent || "hsl(var(--primary))" }}
        />
      </div>
      <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-white tracking-tight">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-[#9e958d] font-medium">{hint}</div>}
    </Card>
  );
}
