import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gauge, Upload, Loader2, Truck, Package, FileText, ArrowLeft, ShieldCheck, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripAPI } from "@/lib/apiClient";
import { RiskBadge } from "@/components/common/RiskBadge";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { RouteStrip } from "@/components/common/PageHeader";
import { fmtDate, fmtCurrency, riskMeta } from "@/lib/riskMeta";

function Field({ label, value, mono }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</div>
      <div className={`mt-1.5 text-sm font-bold text-white ${mono ? "font-mono text-sky-300" : ""}`}>{value ?? "—"}</div>
    </div>
  );
}

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: trip, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["trip", id], queryFn: () => TripAPI.get(id),
  });

  const analyze = useMutation({
    mutationFn: () => TripAPI.analyze(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trip", id] });
      toast.success("Risk analysis updated");
      navigate(`/trips/${id}/risk`);
    },
    onError: (e) => toast.error(e.message || "Analysis failed"),
  });

  if (isLoading) return <LoadingState label="Loading trip telemetry & cargo profiles…" />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs text-slate-400 hover:text-white" 
        onClick={() => navigate("/trips")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to dispatches
      </Button>

      <Card className="rich-card overflow-hidden">
        <div className="border-b border-white/[0.08] p-6 bg-white/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <RouteStrip origin={trip.origin} destination={trip.destination} className="text-xl font-extrabold" />
                {trip.is_demo && <SyntheticBadge />}
              </div>
              <div className="mt-1 text-xs text-slate-400">Dispatch Date: <span className="text-white font-semibold">{fmtDate(trip.travel_date)}</span></div>
            </div>
            {trip.risk_level ? (
              <RiskBadge level={trip.risk_level} score={trip.risk_score} />
            ) : (
              <span className="text-xs text-slate-500 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">Not analyzed yet</span>
            )}
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Vehicle Registration (RTO)" value={trip.vehicle_number} mono />
          <Field label="Carrier Body Type" value={trip.vehicle_type} />
          <Field label="Dispatch Status" value={trip.status} />
          <Field label="Declared Distance" value={trip.declared_distance_km ? `${trip.declared_distance_km} km` : null} mono />
          <Field label="Estimated Route Distance" value={trip.estimated_distance_km ? `${trip.estimated_distance_km} km` : null} mono />
          <Field label="Declared Invoice Value" value={fmtCurrency(trip.invoice_value)} mono />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Cargo Nature & Goods Description" value={trip.goods_description} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-white/[0.08] p-6 bg-white/[0.01]">
          <Button 
            onClick={() => navigate(`/trips/${id}/risk`)} 
            data-testid="trip-view-risk"
            className="btn-cyber-cyan font-bold text-xs rounded-xl px-5"
          >
            <Gauge className="mr-2 h-4 w-4" />View Full Risk Report
          </Button>
          <Button 
            variant="outline" 
            onClick={() => analyze.mutate()} 
            disabled={analyze.isPending} 
            data-testid="trip-reanalyze"
            className="border-white/[0.1] hover:bg-white/[0.05] text-xs font-semibold text-white rounded-xl"
          >
            {analyze.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</> : "Re-evaluate Dispatch"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/documents?trip=${id}`)} 
            data-testid="trip-upload-doc"
            className="border-white/[0.1] hover:bg-white/[0.05] text-xs font-semibold text-white rounded-xl"
          >
            <Upload className="mr-2 h-4 w-4" />Attach Document
          </Button>
        </div>
      </Card>

      {/* Associated Documents */}
      <Card className="rich-card">
        <div className="flex items-center gap-2 border-b border-white/[0.08] p-5 bg-white/[0.02]">
          <FileText className="h-4 w-4 text-sky-400" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">Associated OCR Documents</h2>
        </div>
        {(!trip.documents || trip.documents.length === 0) ? (
          <p className="p-6 text-xs text-slate-400">No OCR documents uploaded for this trip yet.</p>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {trip.documents.map((d) => (
              <button 
                key={d.id} 
                onClick={() => navigate(`/documents/${d.id}`)} 
                className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-white group-hover:text-sky-300">{d.file_name}</span>
                  <span className="text-xs text-slate-400 capitalize">· {d.document_type}</span>
                </div>
                <span className="text-xs capitalize px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">{d.status}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Disclaimer />
    </div>
  );
}
