import React from "react";
import { riskMeta } from "@/lib/riskMeta";

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
      {score != null && (
        <span className="font-mono tabular-nums opacity-80">{Number(score).toFixed(0)}/100</span>
      )}
    </span>
  );
}
