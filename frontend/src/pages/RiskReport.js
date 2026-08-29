import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Gauge, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripAPI } from "@/lib/apiClient";
import { RiskGauge } from "@/components/common/RiskGauge";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { RouteStrip } from "@/components/common/PageHeader";
import { fmtDate, SEVERITY_META } from "@/lib/riskMeta";

const FACTOR_LABELS = {
  route_risk: "Route / corridor risk",
  distance_anomaly: "Distance anomaly",
  document_risk: "Document / compliance",
  historical_incidents: "Historical incidents",
  trip_vehicle: "Trip & vehicle",
};

function FactorCard({ f }) {
  const sev = SEVERITY_META[f.severity] || SEVERITY_META.medium;
  return (
    <Card className="border-l-4 p-4" style={{ borderLeftColor: sev.color }} data-testid={`risk-factor-${f.factor_type}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{f.title}</div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: sev.color, backgroundColor: sev.color + "1a" }}>{sev.label}</span>
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{FACTOR_LABELS[f.factor_type] || f.factor_type}</div>
      <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
        <span className="font-medium">Recommended:</span>
        <span className="text-muted-foreground">{f.recommendation}</span>
      </div>
    </Card>
  );
}

export default function RiskReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["risk", id], queryFn: () => TripAPI.risk(id),
  });

  const analyze = useMutation({
    mutationFn: () => TripAPI.analyze(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["risk", id] }); toast.success("Analysis complete"); },
    onError: (e) => toast.error(e.message || "Analysis failed"),
  });

  if (isLoading) return <LoadingState label="Loading risk report…" />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const trip = data.trip;
  const ev = data.evaluation;

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate(`/trips/${id}`)}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to trip</Button>

      {!ev ? (
        <EmptyState title="Not analyzed yet" description="Run the risk engine to generate an explainable report for this trip."
          action={<Button onClick={() => analyze.mutate()} disabled={analyze.isPending} data-testid="risk-run-analysis">
            {analyze.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</> : <><Gauge className="mr-2 h-4 w-4" />Analyze now</>}</Button>} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
          {/* Ticket + gauge */}
          <Card className="p-5 sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pre-departure risk report</span>
              {trip.is_demo && <SyntheticBadge />}
            </div>
            <div className="grid items-center gap-6 sm:grid-cols-2">
              <div>
                <RouteStrip origin={trip.origin} destination={trip.destination} className="text-xl" />
                <div className="mt-1 text-sm text-muted-foreground">Travel date: {fmtDate(trip.travel_date)}</div>
                <div className="mt-1 font-mono text-sm text-muted-foreground">{trip.vehicle_number || "No vehicle"}</div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Declared</div><div className="font-mono">{trip.declared_distance_km ? `${trip.declared_distance_km} km` : "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Estimated (demo)</div><div className="font-mono">{trip.estimated_distance_km ? `${trip.estimated_distance_km} km` : "—"}</div></div>
                </div>
              </div>
              <div className="flex justify-center"><RiskGauge score={Number(ev.score)} level={ev.level} /></div>
            </div>
          </Card>

          {/* Findings */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Why this score?</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(ev.factors || []).map((f, i) => <FactorCard key={i} f={f} />)}
            </div>
          </div>

          {/* Recommended actions */}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Recommended actions</h2>
            <ol className="space-y-2">
              {(ev.recommendations || []).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span>{r}</span>
                </li>
              ))}
            </ol>
          </Card>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Data source: {ev.engine_version} · route distance is demonstration data</span>
            <Button variant="outline" size="sm" onClick={() => analyze.mutate()} disabled={analyze.isPending} data-testid="risk-reanalyze">
              {analyze.isPending ? "Analyzing…" : "Re-run analysis"}
            </Button>
          </div>
          <Disclaimer />
        </motion.div>
      )}
    </div>
  );
}
