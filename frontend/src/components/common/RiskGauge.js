import React from "react";
import { motion } from "framer-motion";
import { riskMeta } from "@/lib/riskMeta";

export function RiskGauge({ score = 0, level, size = 260 }) {
  const meta = riskMeta(level);
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const r = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r;

  const segs = [
    { to: 30, color: "#10b981" },
    { to: 60, color: "#f59e0b" },
    { to: 80, color: "#f97316" },
    { to: 100, color: "#ef4444" },
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
        opacity={0.25}
      />
    );
  });

  const progressLen = (s / 100) * circumference;
  const gaugeColor = segs.find(seg => s <= seg.to)?.color || "#ef4444";

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 44 }}
         role="img" aria-label={`Trip risk score ${s.toFixed(0)} out of 100, ${meta.label} risk`}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <defs>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255, 255, 255, 0.07)" strokeWidth={12}
                strokeDasharray={`${circumference} ${circumference * 2}`} transform={`rotate(180 ${cx} ${cy})`} />
        {arcs}
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none" stroke={gaugeColor} strokeWidth={12} strokeLinecap="round"
          filter="url(#gaugeGlow)"
          transform={`rotate(180 ${cx} ${cy})`}
          initial={{ strokeDasharray: `0 ${circumference * 2}` }}
          animate={{ strokeDasharray: `${progressLen} ${circumference * 2}` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: size / 2 - 54 }}>
        <div 
          className="font-mono text-5xl font-extrabold tabular-nums tracking-tight" 
          style={{ 
            color: gaugeColor,
            textShadow: `0 0 20px ${gaugeColor}60`
          }}
          data-testid="risk-report-score"
        >
          {s.toFixed(0)}
        </div>
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">/ 100 Risk Index</div>
        <div 
          className="mt-1 text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border" 
          style={{ 
            color: gaugeColor,
            backgroundColor: `${gaugeColor}15`,
            borderColor: `${gaugeColor}35`
          }}
        >
          {meta.label} Risk
        </div>
      </div>
    </div>
  );
}
