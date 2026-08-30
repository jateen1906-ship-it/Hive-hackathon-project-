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
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className={`mt-1 text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{value ?? "—"}</div>
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

  if (isLoading) return <LoadingState label="Loading trip parameters…" />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const meta = riskMeta(trip.risk_level);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs text-slate-500 hover:text-slate-900" 
        onClick={() => navigate("/trips")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to trips
      </Button>

      <Card className="executive-card overflow-hidden">
        <div className="border-b border-slate-100 p-6 bg-slate-50/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <RouteStrip origin={trip.origin} destination={trip.destination} className="text-xl font-bold" />
                {trip.is_demo && <SyntheticBadge />}
              </div>
              <div className="mt-1 text-xs text-slate-500">Dispatch Date: <span className="text-slate-900 font-medium">{fmtDate(trip.travel_date)}</span></div>
            </div>
            {trip.risk_level ? (
              <RiskBadge level={trip.risk_level} score={trip.risk_score} />
            ) : (
              <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-slate-100">Not analyzed yet</span>
            )}
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Vehicle registration" value={trip.vehicle_number} mono />
          <Field label="Carrier body type" value={trip.vehicle_type} />
          <Field label="Dispatch status" value={trip.status} />
          <Field label="Declared distance" value={trip.declared_distance_km ? `${trip.declared_distance_km} km` : null} mono />
          <Field label="Estimated route distance" value={trip.estimated_distance_km ? `${trip.estimated_distance_km} km` : null} mono />
          <Field label="Declared invoice value" value={fmtCurrency(trip.invoice_value)} mono />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Cargo nature & goods description" value={trip.goods_description} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-100 p-6 bg-slate-50/30">
          <Button 
            onClick={() => navigate(`/trips/${id}/risk`)} 
            data-testid="trip-view-risk"
            className="btn-executive-primary font-semibold text-xs"
          >
            <Gauge className="mr-2 h-4 w-4" />View risk report
          </Button>
          <Button 
            variant="outline" 
            onClick={() => analyze.mutate()} 
            disabled={analyze.isPending} 
            data-testid="trip-reanalyze"
            className="border-slate-200 text-xs font-semibold text-slate-700"
          >
            {analyze.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</> : "Re-run analysis"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/documents?trip=${id}`)} 
            data-testid="trip-upload-doc"
            className="border-slate-200 text-xs font-semibold text-slate-700"
          >
            <Upload className="mr-2 h-4 w-4" />Upload document
          </Button>
        </div>
      </Card>

      {/* Documents on this trip */}
      <Card className="executive-card">
        <div className="flex items-center gap-2 border-b border-slate-100 p-5 bg-slate-50/50">
          <FileText className="h-4 w-4 text-sky-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Associated Freight Documents</h2>
        </div>
        {(!trip.documents || trip.documents.length === 0) ? (
          <p className="p-6 text-xs text-slate-500">No OCR documents uploaded for this trip yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {trip.documents.map((d) => (
              <button 
                key={d.id} 
                onClick={() => navigate(`/documents/${d.id}`)} 
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-900">{d.file_name}</span>
                  <span className="text-xs text-slate-500">· {d.document_type}</span>
                </div>
                <span className="text-xs capitalize px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{d.status}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Disclaimer />
    </div>
  );
}
