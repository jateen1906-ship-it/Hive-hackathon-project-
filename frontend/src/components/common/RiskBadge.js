import React from "react";
import { riskMeta } from "@/lib/riskMeta";

const BADGE_COLORS = {
  LOW: { text: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  MEDIUM: { text: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  HIGH: { text: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  CRITICAL: { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  const theme = BADGE_COLORS[(level || "").toUpperCase()] || { text: "#475569", bg: "#f1f5f9", border: "#cbd5e1" };

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
