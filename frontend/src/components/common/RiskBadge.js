import React from "react";
import { riskMeta } from "@/lib/riskMeta";

const GLOW_COLORS = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export function RiskBadge({ level, score, className = "", testId }) {
  const meta = riskMeta(level);
  const color = GLOW_COLORS[(level || "").toUpperCase()] || "#94a3b8";

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border transition-all duration-200 ${className}`}
      style={{ 
        color: color, 
        backgroundColor: `${color}18`,
        borderColor: `${color}40`,
        boxShadow: `0 0 10px -2px ${color}30`
      }}
    >
      <span 
        className="h-1.5 w-1.5 rounded-full animate-pulse" 
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`
        }} 
      />
      <span>{meta.label}</span>
      {score != null && (
        <span className="font-mono tabular-nums font-extrabold opacity-95">
          {Number(score).toFixed(0)}/100
        </span>
      )}
    </span>
  );
}
