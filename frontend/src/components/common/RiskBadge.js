import React from "react";
import { riskMeta } from "@/lib/riskMeta";

const BADGE_COLORS = {
  LOW: { text: "#17421f", bg: "#eaf8eb", border: "#c2eec4" }, // Compliant Sage
  MEDIUM: { text: "#8a2b0e", bg: "#fff0e4", border: "#ffd3ac" }, // Tuscan Apricot/Sienna (#FFD3AC / #8A2B0E)
  HIGH: { text: "#ab321a", bg: "#fdeee9", border: "#fca566" },
  CRITICAL: { text: "#8a2b0e", bg: "#fae7e3", border: "#e35336" }, // Terracotta / Deep Sienna (#E35336)
};

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  const theme = BADGE_COLORS[(level || "").toUpperCase()] || { text: "#5c4d65", bg: "#f0ecf3", border: "#9988a1" };

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
