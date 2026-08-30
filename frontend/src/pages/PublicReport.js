import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Truck, MapPin, Calendar, AlertTriangle, CheckCircle2, FileText, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareAPI } from "@/lib/apiClient";
import { RiskGauge } from "@/components/common/RiskGauge";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import { RouteStrip } from "@/components/common/PageHeader";
import { fmtDate, SEVERITY_META } from "@/lib/riskMeta";

function formatBullets(text) {
  if (!text) return [];
  const clean = text.replace(/\(([^\)]+)\)/g, "\n$1");
  const parts = clean
    .split(/[\.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return parts.length > 0 ? parts : [text];
}

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cca25a] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">TruckShield</span>
          </div>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs text-slate-600 font-semibold">
            Shared Report — Read Only
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {isLoading && <LoadingState label="Loading shared report…" />}
        {isError && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Report Unavailable</h2>
            <p className="mt-2 text-xs text-slate-500">
              {error?.message || "This shared report link is either invalid, revoked, or expired."}
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Top overview card */}
            <Card className="p-6 sm:p-8 border-slate-200">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Dispatch Date: {fmtDate(trip?.travel_date)}</span>
                  </div>
                  <RouteStrip origin={trip?.origin} destination={trip?.destination} className="text-2xl font-extrabold" />
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">{trip?.vehicle_number || "No vehicle declared"}</span>
                  </div>
                </div>
                <div className="flex justify-center">
                  <RiskGauge score={score} level={level} />
                </div>
              </div>
            </Card>

            {/* Evaluated Factors in scannable bullet layout */}
            {(data.evaluation.factors || []).length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Evaluated Risk Factors
                </h2>
                <div className="grid gap-3.5 md:grid-cols-2">
                  {(data.evaluation.factors || []).map((f, i) => {
                    const sev = SEVERITY_META[f.severity] || SEVERITY_META.medium;
                    const bullets = formatBullets(f.description);
                    const isSafe = (f.severity || "").toLowerCase() === "low";
                    return (
                      <Card 
                        key={i} 
                        className="p-5 border border-slate-200 bg-white shadow-2xs rounded-xl flex flex-col justify-between" 
                        style={{ borderTop: `3px solid ${sev.color}` }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-bold text-slate-900">{f.title}</div>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase inline-flex items-center gap-1"
                              style={{ backgroundColor: `${sev.color}15`, color: sev.color }}
                            >
                              {isSafe ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                              {sev.label}
                            </span>
                          </div>
                          <ul className="mt-3 space-y-1.5">
                            {bullets.map((bullet, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                <span 
                                  className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: sev.color }} 
                                />
                                <span className="font-medium">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {f.recommendation && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                            <span className="font-bold text-slate-900 shrink-0">Action:</span>
                            <span>{f.recommendation}</span>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {(data.evaluation.recommendations || []).length > 0 && (
              <Card className="p-6 border-slate-200">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Pre-Departure Recommendations
                </h2>
                <ul className="space-y-2.5">
                  {data.evaluation.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Footer */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500">
              <p>
                This compliance assessment was generated by{" "}
                <strong className="text-slate-900">TruckShield</strong> — pre-departure compliance & risk intelligence.
              </p>
              <p className="mt-1 text-[11px]">
                Informational purposes only — not legal advice. Risk signals are calculated deterministically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
