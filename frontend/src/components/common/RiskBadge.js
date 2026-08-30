import React from "react";
import { riskMeta } from "@/lib/riskMeta";

const BADGE_COLORS = {
  LOW: { text: "#17421f", bg: "#eaf8eb", border: "#c2eec4" }, // Compliant Emerald
  MEDIUM: { text: "#783506", bg: "#fff3e6", border: "#ffb16e" }, // Warm Apricot (#FFB16E)
  HIGH: { text: "#614612", bg: "#fff8cb", border: "#cca25a" }, // Buttercream & Golden Siltstone (#FFF5B8 / #CCA25A)
  CRITICAL: { text: "#7f1d1d", bg: "#fee2e2", border: "#fca5a5" },
};

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  const theme = BADGE_COLORS[(level || "").toUpperCase()] || { text: "#614612", bg: "#fff8cb", border: "#cbbd93" };

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${className}`}
      style={{ 
        color: theme.text, 
        backgroundColor: theme.bg,
        borderColor: theme.border
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.text }} />
      <span>{meta.label}</span>
      {score != null && (
        <span className="font-mono tabular-nums font-bold opacity-90">{Number(score).toFixed(0)}/100</span>
      )}
    </span>
  );
}
