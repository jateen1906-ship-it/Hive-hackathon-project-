import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ShareAPI } from "@/lib/apiClient";
import { RiskGauge } from "@/components/common/RiskGauge";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import { Disclaimer } from "@/components/common/Disclaimer";
import { RouteStrip } from "@/components/common/PageHeader";
import { fmtDate, SEVERITY_META } from "@/lib/riskMeta";

export default function PublicReport() {
  const { token } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-report", token], queryFn: () => ShareAPI.publicReport(token), retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="ts-hero-gradient px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-2 text-white">
          <ShieldCheck className="h-5 w-5 text-sky-300" /><span className="font-bold">TruckShield</span>
          <span className="ml-2 text-xs text-slate-300">Shared risk report (read-only)</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {isLoading && <LoadingState label="Loading shared report…" />}
        {isError && <ErrorState message={error?.message || "This link is invalid or expired."} />}
        {data?.evaluation && (
          <div className="space-y-5">
            <Card className="p-6">
              <div className="grid items-center gap-6 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pre-departure risk report</span>
                  <div className="mt-2"><RouteStrip origin={data.trip.origin} destination={data.trip.destination} className="text-xl" /></div>
                  <div className="mt-1 text-sm text-muted-foreground">Travel date: {fmtDate(data.trip.travel_date)}</div>
                  <div className="mt-1 font-mono text-sm text-muted-foreground">{data.trip.vehicle_number || "No vehicle"}</div>
                </div>
                <div className="flex justify-center"><RiskGauge score={Number(data.evaluation.score)} level={data.evaluation.level} /></div>
              </div>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              {(data.evaluation.factors || []).map((f, i) => {
                const sev = SEVERITY_META[f.severity] || SEVERITY_META.medium;
                return (
                  <Card key={i} className="border-l-4 p-4" style={{ borderLeftColor: sev.color }}>
                    <div className="text-sm font-semibold">{f.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                  </Card>
                );
              })}
            </div>
            <Disclaimer />
          </div>
        )}
      </div>
    </div>
  );
}
