import React from "react";
import { riskMeta } from "@/lib/riskMeta";

const BADGE_COLORS = {
  LOW: { text: "#17421f", bg: "#d5f3d8", border: "#bceac1" }, // Mint blossom (#D5F3D8)
  MEDIUM: { text: "#9a4907", bg: "#fef3c7", border: "#fde68a" },
  HIGH: { text: "#9f1239", bg: "#ffe4e9", border: "#fecdd3" },
  CRITICAL: { text: "#881337", bg: "#ffebf0", border: "#f2c7c7" },
};

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  const theme = BADGE_COLORS[(level || "").toUpperCase()] || { text: "#6b4f57", bg: "#faf0f2", border: "#f2c7c7" };

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
