import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gauge, Upload, Loader2, Truck, Package, FileText, ArrowLeft } from "lucide-react";
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
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm ${mono ? "font-mono" : ""}`}>{value ?? "—"}</div>
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

  if (isLoading) return <LoadingState label="Loading trip…" />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const meta = riskMeta(trip.risk_level);

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/trips")}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to trips</Button>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5" style={{ background: `linear-gradient(90deg, ${meta.bg}, transparent)` }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <RouteStrip origin={trip.origin} destination={trip.destination} className="text-lg" />
                {trip.is_demo && <SyntheticBadge />}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Travel date: {fmtDate(trip.travel_date)}</div>
            </div>
            {trip.risk_level ? <RiskBadge level={trip.risk_level} score={trip.risk_score} /> :
              <span className="text-xs text-muted-foreground">Not analyzed yet</span>}
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Vehicle number" value={trip.vehicle_number} mono />
          <Field label="Vehicle type" value={trip.vehicle_type} />
          <Field label="Status" value={trip.status} />
          <Field label="Declared distance" value={trip.declared_distance_km ? `${trip.declared_distance_km} km` : null} mono />
          <Field label="Estimated distance" value={trip.estimated_distance_km ? `${trip.estimated_distance_km} km` : null} mono />
          <Field label="Invoice value" value={fmtCurrency(trip.invoice_value)} mono />
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Goods" value={trip.goods_description} /></div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border p-5">
          <Button onClick={() => navigate(`/trips/${id}/risk`)} data-testid="trip-view-risk"><Gauge className="mr-2 h-4 w-4" />View risk report</Button>
          <Button variant="outline" onClick={() => analyze.mutate()} disabled={analyze.isPending} data-testid="trip-reanalyze">
            {analyze.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</> : "Re-analyze"}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/documents?trip=${id}`)} data-testid="trip-upload-doc"><Upload className="mr-2 h-4 w-4" />Upload document</Button>
        </div>
      </Card>

      {/* Documents on this trip */}
      <Card className="mt-5">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <FileText className="h-4 w-4 text-slate-600" /><h2 className="text-sm font-semibold">Documents</h2>
        </div>
        {(!trip.documents || trip.documents.length === 0) ? (
          <p className="p-4 text-sm text-muted-foreground">No documents uploaded for this trip yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {trip.documents.map((d) => (
              <button key={d.id} onClick={() => navigate(`/documents/${d.id}`)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/50">
                <span className="text-sm">{d.file_name} <span className="text-muted-foreground">· {d.document_type}</span></span>
                <span className="text-xs capitalize text-muted-foreground">{d.status}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-5"><Disclaimer /></div>
    </div>
  );
}
