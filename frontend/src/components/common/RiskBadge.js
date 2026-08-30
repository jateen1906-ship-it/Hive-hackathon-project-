import React from "react";
import { riskMeta } from "@/lib/riskMeta";

const BADGE_COLORS = {
  LOW: { text: "#0d381e", bg: "#b6f2d1", border: "#95e3b6" }, // Seafoam Mint (#B6F2D1)
  MEDIUM: { text: "#094751", bg: "#c9fdf2", border: "#85d1db" }, // Aqua Ice & Sea Teal (#C9FDF2 / #85D1DB)
  HIGH: { text: "#881337", bg: "#ffe4e9", border: "#fecdd3" },
  CRITICAL: { text: "#7f1d1d", bg: "#fee2e2", border: "#fca5a5" },
};

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  const theme = BADGE_COLORS[(level || "").toUpperCase()] || { text: "#094751", bg: "#b3ebf2", border: "#85d1db" };

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
