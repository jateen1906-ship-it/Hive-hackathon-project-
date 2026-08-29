// Risk level -> presentation metadata (color, label, tint)
export const RISK_META = {
  LOW: { label: "Low", color: "hsl(var(--risk-low))", bg: "hsl(var(--risk-low-bg))", ring: "142 71% 40%" },
  MEDIUM: { label: "Medium", color: "hsl(var(--risk-medium))", bg: "hsl(var(--risk-medium-bg))", ring: "38 92% 45%" },
  HIGH: { label: "High", color: "hsl(var(--risk-high))", bg: "hsl(var(--risk-high-bg))", ring: "0 84% 55%" },
  CRITICAL: { label: "Critical", color: "hsl(var(--risk-critical))", bg: "hsl(var(--risk-critical-bg))", ring: "0 74% 38%" },
};

export function riskMeta(level) {
  return RISK_META[(level || "").toUpperCase()] || {
    label: "Unrated", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", ring: "215 16% 47%",
  };
}

export function levelFromScore(score) {
  if (score == null) return null;
  if (score <= 30) return "LOW";
  if (score <= 60) return "MEDIUM";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

export const SEVERITY_META = {
  low: { label: "Low", color: "hsl(var(--risk-low))" },
  medium: { label: "Medium", color: "hsl(var(--risk-medium))" },
  high: { label: "High", color: "hsl(var(--risk-high))" },
  critical: { label: "Critical", color: "hsl(var(--risk-critical))" },
};

export const DISCLAIMER =
  "TruckShield provides informational compliance pre-checks and risk signals. Results do not constitute legal advice or guarantee enforcement outcomes.";

export function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(d);
  }
}

export function fmtCurrency(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return "\u20B9" + n.toLocaleString("en-IN");
}
