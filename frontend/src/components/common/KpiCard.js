import React from "react";
import { Card } from "@/components/ui/card";

export function KpiCard({ label, value, accent, hint, testId }) {
  const accentColor = accent || "#cca25a";

  return (
    <Card
      data-testid={testId}
      className="p-4 sm:p-5 relative overflow-hidden bg-white border border-slate-200"
    >
      <div 
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
        <div 
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </div>
      <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-slate-400 font-medium">{hint}</div>}
    </Card>
  );
}
