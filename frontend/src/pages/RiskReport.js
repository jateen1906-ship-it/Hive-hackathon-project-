import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Gauge, Loader2, CheckCircle2, AlertTriangle, Download, Share2, Copy, Trash2, Lock, ShieldCheck, MapPin, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TripAPI, ShareAPI } from "@/lib/apiClient";
import { useBilling } from "@/hooks/useBilling";
import { RiskGauge } from "@/components/common/RiskGauge";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { RouteStrip } from "@/components/common/PageHeader";
import { fmtDate, SEVERITY_META } from "@/lib/riskMeta";

const FACTOR_LABELS = {
  route_risk: "Corridor & Checkpost Risk",
  distance_anomaly: "Distance & Transit Feasibility",
  schedule_validity: "Dispatch Timeline & E-Way Validity",
  invoice_compliance: "Invoice Value & GST Rule 138",
  cargo_suitability: "Cargo Sensitivity & Vehicle Match",
  trip_vehicle: "Vehicle Registration & Permit Check",
  document_risk: "Document OCR & Pre-Check",
  historical_incidents: "Historical Corridor Incidents",
};

function FactorCard({ f }) {
  const sev = SEVERITY_META[f.severity] || SEVERITY_META.medium;
  return (
    <Card 
      className="alvero-card p-5 border-l-4 transition-all hover:border-orange-500/40" 
      style={{ borderLeftColor: sev.color }} 
      data-testid={`risk-factor-${f.factor_type}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-white">{f.title}</div>
        <span 
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" 
          style={{ color: sev.color, backgroundColor: sev.color + "20" }}
        >
          {sev.label}
        </span>
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-orange-400/90 font-semibold">{FACTOR_LABELS[f.factor_type] || f.factor_type}</div>
      <p className="mt-2 text-xs text-[#d6d3d1] leading-relaxed">{f.description}</p>
      <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-xs">
        <span className="font-bold text-orange-400 shrink-0">Action:</span>
        <span className="text-[#a8a29e]">{f.recommendation}</span>
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

  const [exporting, setExporting] = React.useState(false);
  const exportPdf = async () => {
    setExporting(true);
    try {
      await TripAPI.reportPdf(id);
      toast.success("Report downloaded");
    } catch (e) {
      toast.error(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <LoadingState label="Loading risk intelligence report…" />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const trip = data.trip;
  const ev = data.evaluation;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs text-[#a8a29e] hover:text-white hover:bg-white/5" 
        onClick={() => navigate(`/trips/${id}`)}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to trip details
      </Button>

      {!ev ? (
        <EmptyState 
          title="Trip Not Analyzed Yet" 
          description="Run the risk engine to generate an explainable multi-factor report."
          action={
            <Button onClick={() => analyze.mutate()} disabled={analyze.isPending} data-testid="risk-run-analysis" className="btn-sunset-orange font-semibold rounded-xl">
              {analyze.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running Engine…</> : <><Gauge className="mr-2 h-4 w-4" />Analyze Now</>}
            </Button>
          } 
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* Main Risk Gauge Card */}
          <Card className="alvero-card p-6 sm:p-8 border-white/[0.08]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#9e958d]">Pre-Departure Risk Evaluation</span>
                {trip.is_demo && <SyntheticBadge />}
              </div>
              <div className="flex items-center gap-2">
                <ShareControls tripId={id} />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={exportPdf} 
                  disabled={exporting} 
                  data-testid="risk-export-pdf"
                  className="border-white/[0.08] hover:bg-white/[0.04] text-xs font-semibold"
                >
                  {exporting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Exporting…</> : <><Download className="mr-1.5 h-3.5 w-3.5" />Export PDF</>}
                </Button>
              </div>
            </div>

            <div className="grid items-center gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <RouteStrip origin={trip.origin} destination={trip.destination} className="text-2xl font-extrabold" />
                <div className="text-xs text-[#9e958d]">Dispatch Date: <span className="text-white font-medium">{fmtDate(trip.travel_date)}</span></div>
                <div className="font-mono text-xs text-[#d6d3d1]">{trip.vehicle_number || "No vehicle registered"} · {trip.vehicle_type || "Commercial Truck"}</div>
                
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-xs">
                  <div>
                    <div className="text-[#9e958d]">Declared Distance</div>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">{trip.declared_distance_km ? `${trip.declared_distance_km} km` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-[#9e958d]">Estimated Route</div>
                    <div className="font-mono font-bold text-orange-400 text-sm mt-0.5">{trip.estimated_distance_km ? `${trip.estimated_distance_km} km` : "—"}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <RiskGauge score={Number(ev.score)} level={ev.level} />
              </div>
            </div>
          </Card>

          {/* Detailed Findings */}
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9e958d]">
              Detailed Factor Risk Breakdown
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(ev.factors || []).map((f, i) => <FactorCard key={i} f={f} />)}
            </div>
          </div>

          {/* Recommendations Checklist */}
          <Card className="alvero-card p-6 border-white/[0.07]">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Actionable Pre-Departure Checklist
            </h2>
            <ol className="space-y-2.5">
              {(ev.recommendations || []).map((r, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-3 text-xs border border-white/[0.04]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-[#e7e5e4] leading-relaxed font-medium">{r}</span>
                </li>
              ))}
            </ol>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#9e958d] border-t border-white/[0.04] pt-4">
            <span>Engine: <code className="text-white font-mono">{ev.engine_version}</code> · Dynamic Corridor Intelligence</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => analyze.mutate()} 
              disabled={analyze.isPending} 
              data-testid="risk-reanalyze"
              className="border-white/[0.08] hover:bg-white/[0.04] text-xs font-semibold"
            >
              {analyze.isPending ? "Running Engine…" : "Re-evaluate Trip"}
            </Button>
          </div>

          <Disclaimer />
        </motion.div>
      )}
    </div>
  );
}

function ShareControls({ tripId }) {
  const billing = useBilling();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const canShare = billing.can.share;
  const isPro = billing.plan === "pro";
  const { data: links } = useQuery({ queryKey: ["shares", tripId], queryFn: () => ShareAPI.list(tripId), enabled: open && canShare });
  const [days, setDays] = React.useState(7);

  const create = useMutation({
    mutationFn: () => ShareAPI.create(tripId, isPro ? Number(days) : undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shares", tripId] }); qc.invalidateQueries({ queryKey: ["billing-me"] }); toast.success("Share link created"); },
    onError: (e) => toast.error(e.message || "Could not create link"),
  });
  const revoke = useMutation({
    mutationFn: (id) => ShareAPI.revoke(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shares", tripId] }); qc.invalidateQueries({ queryKey: ["billing-me"] }); },
  });

  if (!canShare) {
    return (
      <Button size="sm" variant="outline" onClick={() => (window.location.href = "/pricing")} data-testid="risk-share-locked" className="border-white/[0.08] hover:bg-white/[0.04] text-xs">
        <Lock className="mr-1.5 h-3.5 w-3.5 text-orange-400" />Share (Upgrade)
      </Button>
    );
  }

  const shareUrl = (tok) => `${window.location.origin}/r/${tok}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid="risk-share-button" className="border-white/[0.08] hover:bg-white/[0.04] text-xs">
          <Share2 className="mr-1.5 h-3.5 w-3.5 text-orange-400" />Share
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1714] border-white/[0.08] text-white">
        <DialogHeader><DialogTitle className="text-white">Share Read-Only Report</DialogTitle></DialogHeader>
        <p className="text-xs text-[#9e958d]">Anyone with this secure link can view this compliance assessment (no login needed).</p>
        <div className="flex items-end gap-2 mt-2">
          {isPro && (
            <div className="w-28">
              <label className="text-xs text-[#9e958d]">Expiry (days)</label>
              <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} data-testid="share-expiry-input" className="bg-[#12100e] border-white/[0.08] text-white" />
            </div>
          )}
          <Button onClick={() => create.mutate()} disabled={create.isPending} data-testid="share-create-button" className="btn-sunset-orange font-semibold text-xs">
            {create.isPending ? "Creating…" : "Generate Link"}
          </Button>
        </div>
        <div className="mt-3 max-h-64 space-y-2 overflow-auto">
          {(links || []).filter((l) => l.active).length === 0 && <p className="text-xs text-[#9e958d]">No active share links yet.</p>}
          {(links || []).map((l) => (
            <div key={l.id} className={`flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 ${l.active ? "" : "opacity-40"}`}>
              <code className="flex-1 truncate text-xs text-orange-300 font-mono">{shareUrl(l.token)}</code>
              {l.active && <>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(shareUrl(l.token)); toast.success("Link copied"); }} data-testid="share-copy-button" className="h-7 w-7 text-[#9e958d] hover:text-white"><Copy className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => revoke.mutate(l.id)} data-testid="share-revoke-button" className="h-7 w-7 text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></Button>
              </>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
