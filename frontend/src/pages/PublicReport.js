import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Truck, MapPin, Calendar, AlertTriangle, CheckCircle, FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareAPI } from "@/lib/apiClient";
import { RiskGauge } from "@/components/common/RiskGauge";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import { RouteStrip } from "@/components/common/PageHeader";
import { fmtDate, SEVERITY_META } from "@/lib/riskMeta";

const LEVEL_COLOR = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

const LEVEL_BG = {
  LOW: "rgba(16, 185, 129, 0.12)",
  MEDIUM: "rgba(245, 158, 11, 0.12)",
  HIGH: "rgba(249, 115, 22, 0.14)",
  CRITICAL: "rgba(239, 68, 68, 0.14)",
};

export default function PublicReport() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-report", token], queryFn: () => ShareAPI.publicReport(token), retry: false,
  });

  const level = data?.evaluation?.level;
  const score = data?.evaluation?.score ? Number(data.evaluation.score) : null;
  const trip = data?.trip;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 relative overflow-hidden aurora-bg">
      <div className="cyber-orb-1" />
      <div className="cyber-orb-2" />

      {/* Header */}
      <header className="border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-xl px-4 py-4 sm:px-8 relative z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">TruckShield AI</span>
          </div>
          <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3.5 py-1 text-xs text-sky-300 font-bold">
            Shared Report — Read Only
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 relative z-10">
        {isLoading && <LoadingState label="Loading verified shared report…" />}
        {isError && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Report Unavailable</h2>
            <p className="mt-2 text-xs text-slate-400">
              {error?.message || "This link is invalid or has expired."}
            </p>
          </div>
        )}

        {data?.evaluation && trip && (
          <div className="space-y-6">
            {/* Risk Level Banner */}
            {level && (
              <div
                className="rounded-2xl border px-5 py-3.5 text-xs font-bold flex items-center gap-2.5"
                style={{
                  backgroundColor: LEVEL_BG[level] || LEVEL_BG.MEDIUM,
                  borderColor: `${LEVEL_COLOR[level] || LEVEL_COLOR.MEDIUM}40`,
                  color: LEVEL_COLOR[level] || LEVEL_COLOR.MEDIUM,
                }}
              >
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: LEVEL_COLOR[level] || LEVEL_COLOR.MEDIUM }} />
                <span>Pre-departure risk assessment: <strong>{level}</strong> risk ({score}/100)</span>
              </div>
            )}

            {/* Trip Overview Card */}
            <Card className="rich-card overflow-hidden">
              <div className="border-b border-white/[0.08] bg-white/[0.02] px-6 py-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Statutory Pre-Departure Compliance Assessment
                </span>
              </div>
              <div className="grid items-center gap-6 p-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <RouteStrip origin={trip.origin} destination={trip.destination} className="text-2xl font-extrabold" />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    {trip.travel_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-sky-400" />
                        <span className="text-white font-medium">{fmtDate(trip.travel_date)}</span>
                      </div>
                    )}
                    {trip.vehicle_number && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono text-sky-300 font-bold">{trip.vehicle_number}</span>
                      </div>
                    )}
                    {trip.vehicle_type && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>{trip.vehicle_type}</span>
                      </div>
                    )}
                    {trip.goods_description && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px]">{trip.goods_description}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-center">
                  <RiskGauge score={score} level={level} />
                </div>
              </div>
            </Card>

            {/* Risk Factors */}
            {(data.evaluation.factors || []).length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Evaluated Factors ({data.evaluation.factors.length})
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {(data.evaluation.factors || []).map((f, i) => {
                    const sev = SEVERITY_META[f.severity] || SEVERITY_META.medium;
                    return (
                      <Card key={i} className="rich-card border-l-4 p-4 border-white/[0.06]" style={{ borderLeftColor: sev.color }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-bold text-white">{f.title}</div>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                            style={{ backgroundColor: `${sev.color}20`, color: sev.color }}
                          >
                            {f.severity}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{f.description}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {(data.evaluation.recommendations || []).length > 0 && (
              <Card className="rich-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-white">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Pre-Departure Recommendations
                </h2>
                <ul className="space-y-2.5">
                  {data.evaluation.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Footer */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-center text-xs text-slate-500">
              <p>
                This compliance assessment was generated by{" "}
                <strong className="text-white">TruckShield AI</strong> — pre-departure compliance & risk intelligence.
              </p>
              <p className="mt-1 text-[11px]">
                Informational purposes only — not legal advice. Risk signals are calculated deterministically.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 border-white/[0.1] hover:bg-white/[0.05] text-xs font-semibold text-white rounded-xl"
                onClick={() => navigate("/")}
              >
                Explore TruckShield Platform →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
