import React from "react";
import { riskMeta } from "@/lib/riskMeta";

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border shadow-2xs ${className}`}
      style={{ 
        color: meta.color, 
        backgroundColor: meta.bg,
        borderColor: `${meta.color}30`
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      <span>{meta.label}</span>
      {score != null && (
        <span className="font-mono tabular-nums font-bold opacity-90">{Number(score).toFixed(0)}/100</span>
      )}
    </span>
  );
}
