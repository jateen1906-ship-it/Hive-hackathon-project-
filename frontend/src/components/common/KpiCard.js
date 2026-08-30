import React from "react";
import { Card } from "@/components/ui/card";

export function KpiCard({ label, value, accent, hint, testId }) {
  const accentColor = accent || "#f46a85";

  return (
    <Card
      data-testid={testId}
      className="p-4 sm:p-5 relative overflow-hidden bg-white border border-[#f2c7c7]"
    >
      <div 
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#7d656c]">{label}</div>
        <div 
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </div>
      <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-[#26161b] tracking-tight">
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-[#916b75] font-medium">{hint}</div>}
    </Card>
  );
}
