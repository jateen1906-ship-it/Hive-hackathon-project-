import React from "react";
import { riskMeta } from "@/lib/riskMeta";

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border backdrop-blur-md shadow-sm ${className}`}
      style={{ 
        color: meta.color, 
        backgroundColor: meta.bg,
        borderColor: `${meta.color}35`
      }}
    >
      <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
      <span>{meta.label}</span>
      {score != null && (
        <span className="font-mono tabular-nums font-bold opacity-90">{Number(score).toFixed(0)}/100</span>
      )}
    </span>
  );
}
