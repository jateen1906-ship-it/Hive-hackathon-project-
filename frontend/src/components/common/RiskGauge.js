import React from "react";
import { motion } from "framer-motion";
import { riskMeta } from "@/lib/riskMeta";

// Semi-circle risk gauge (0-100) with colored threshold arc.
export function RiskGauge({ score = 0, level, size = 260 }) {
  const meta = riskMeta(level);
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const r = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half circle

  // segments for LOW/MED/HIGH/CRITICAL along the 180deg arc
  const segs = [
    { to: 30, color: "hsl(var(--risk-low))" },
    { to: 60, color: "hsl(var(--risk-medium))" },
    { to: 80, color: "hsl(var(--risk-high))" },
    { to: 100, color: "hsl(var(--risk-critical))" },
  ];
  let prev = 0;
  const arcs = segs.map((seg, i) => {
    const len = ((seg.to - prev) / 100) * circumference;
    const offset = (prev / 100) * circumference;
    prev = seg.to;
    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={12}
        strokeLinecap="butt"
        strokeDasharray={`${len} ${circumference * 2}`}
        strokeDashoffset={-offset}
        transform={`rotate(180 ${cx} ${cy})`}
        opacity={0.28}
      />
    );
  });

  const progressLen = (s / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 44 }}
         role="img" aria-label={`Trip risk score ${s.toFixed(0)} out of 100, ${meta.label} risk`}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={12}
                strokeDasharray={`${circumference} ${circumference * 2}`} transform={`rotate(180 ${cx} ${cy})`} />
        {arcs}
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none" stroke={meta.color} strokeWidth={12} strokeLinecap="round"
          transform={`rotate(180 ${cx} ${cy})`}
          initial={{ strokeDasharray: `0 ${circumference * 2}` }}
          animate={{ strokeDasharray: `${progressLen} ${circumference * 2}` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: size / 2 - 54 }}>
        <div className="font-mono text-4xl font-semibold tabular-nums" style={{ color: meta.color }}
             data-testid="risk-report-score">
          {s.toFixed(0)}
        </div>
        <div className="text-xs text-muted-foreground">/ 100</div>
        <div className="mt-1 text-sm font-semibold" style={{ color: meta.color }}>{meta.label} risk</div>
      </div>
    </div>
  );
}
