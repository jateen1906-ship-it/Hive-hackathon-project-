import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Truck, MapPin, Calendar, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareAPI } from "@/lib/apiClient";
import { RiskGauge } from "@/components/common/RiskGauge";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import { RouteStrip } from "@/components/common/PageHeader";
import { fmtDate, SEVERITY_META } from "@/lib/riskMeta";

const LEVEL_COLOR = {
  LOW: "#059669",
  MEDIUM: "#d97706",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

const LEVEL_BG = {
  LOW: "#ecfdf5",
  MEDIUM: "#fffbeb",
  HIGH: "#fff7ed",
  CRITICAL: "#fef2f2",
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
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
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
              {error?.message || "This link is invalid or has expired."}
            </p>
          </div>
        )}

        {data?.evaluation && trip && (
          <div className="space-y-6">
            {/* Risk Level Banner */}
            {level && (
              <div
                className="rounded-xl border px-5 py-3.5 text-xs font-semibold flex items-center gap-2"
                style={{
                  backgroundColor: LEVEL_BG[level] || LEVEL_BG.MEDIUM,
                  borderColor: `${LEVEL_COLOR[level] || LEVEL_COLOR.MEDIUM}40`,
                  color: LEVEL_COLOR[level] || LEVEL_COLOR.MEDIUM,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLOR[level] || LEVEL_COLOR.MEDIUM }} />
                <span>Pre-departure risk assessment: <strong>{level}</strong> risk ({score}/100)</span>
              </div>
            )}

            {/* Trip Overview Card */}
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Statutory Pre-Departure Report
                </span>
              </div>
              <div className="grid items-center gap-6 p-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <RouteStrip origin={trip.origin} destination={trip.destination} className="text-2xl font-bold" />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                    {trip.travel_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-slate-900 font-medium">{fmtDate(trip.travel_date)}</span>
                      </div>
                    )}
                    {trip.vehicle_number && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-mono text-slate-900 font-semibold">{trip.vehicle_number}</span>
                      </div>
                    )}
                    {trip.vehicle_type && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>{trip.vehicle_type}</span>
                      </div>
                    )}
                    {trip.goods_description && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
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
                <h2 className="mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Evaluated Factors
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {(data.evaluation.factors || []).map((f, i) => {
                    const sev = SEVERITY_META[f.severity] || SEVERITY_META.medium;
                    return (
                      <Card key={i} className="border-l-4 p-4" style={{ borderLeftColor: sev.color }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-bold text-slate-900">{f.title}</div>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                            style={{ backgroundColor: `${sev.color}15`, color: sev.color }}
                          >
                            {f.severity}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{f.description}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {(data.evaluation.recommendations || []).length > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
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
              <Button
                size="sm"
                variant="outline"
                className="mt-4 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
