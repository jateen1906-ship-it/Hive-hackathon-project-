import React from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";

export function KpiCard({ label, value, accent, hint, testId }) {
  const accentColor = accent || "#38bdf8";

  return (
    <Card
      data-testid={testId}
      className="p-5 relative overflow-hidden bg-gradient-to-b from-[#111827]/90 to-[#0b0f19]/90 border border-white/[0.08] hover:border-sky-500/40 transition-all duration-300 group"
    >
      {/* Top glowing neon accent highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 group-hover:h-[4px]"
        style={{ 
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
          boxShadow: `0 0 12px ${accentColor}80` 
        }}
      />

      <div className="flex items-center justify-between">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
        <div 
          className="h-2.5 w-2.5 rounded-full shadow-sm"
          style={{ 
            backgroundColor: accentColor,
            boxShadow: `0 0 8px ${accentColor}`
          }}
        />
      </div>

      <div className="mt-3 font-mono text-3xl sm:text-4xl font-extrabold tabular-nums text-white tracking-tight flex items-baseline gap-1">
        <span>{value}</span>
      </div>

      {hint && (
        <div className="mt-2 text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <span className="inline-block h-1 w-1 rounded-full bg-slate-500" />
          <span>{hint}</span>
        </div>
      )}
    </Card>
  );
}
