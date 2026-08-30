import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Gauge, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Download, 
  Share2, 
  Copy, 
  Trash2, 
  Lock, 
  ShieldCheck, 
  MapPin, 
  Truck,
  Zap,
  Check
} from "lucide-react";
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
import { DriverPassModal } from "@/components/trips/DriverPassModal";

function formatBullets(text) {
  if (!text) return [];
  // Split into scannable clean bullet points
  const clean = text.replace(/\(([^\)]+)\)/g, "\n$1");
  const parts = clean
    .split(/[\.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return parts.length > 0 ? parts : [text];
}

function FactorCard({ f }) {
  const sev = SEVERITY_META[f.severity] || SEVERITY_META.medium;
  const bullets = formatBullets(f.description);
  const isSafe = (f.severity || "").toLowerCase() === "low";

  return (
    <Card 
      className="p-5 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between bg-white shadow-2xs rounded-xl" 
      style={{ borderTop: `3px solid ${sev.color}` }}
      data-testid={`risk-factor-${f.factor_type}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-bold text-slate-900 leading-snug">{f.title}</div>
          <span 
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0" 
            style={{ color: sev.color, backgroundColor: sev.color + "15" }}
          >
            {isSafe ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {sev.label}
          </span>
        </div>

        <ul className="mt-3.5 space-y-2">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
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
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs bg-slate-50/60 p-2.5 rounded-lg">
          <span className="font-bold text-slate-900 shrink-0 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-[#cca25a]" />
            Action:
          </span>
          <span className="text-slate-600 font-medium">{f.recommendation}</span>
        </div>
      )}
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
        className="text-xs text-slate-500 hover:text-slate-900" 
        onClick={() => navigate(`/trips/${id}`)}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to trip details
      </Button>

      {!ev ? (
        <EmptyState 
          title="Trip Not Analyzed Yet" 
          description="Run the risk engine to generate an explainable multi-factor report."
          action={
            <Button onClick={() => analyze.mutate()} disabled={analyze.isPending} data-testid="risk-run-analysis" className="btn-primary-blue text-xs h-8 px-4 font-semibold">
              {analyze.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running Engine…</> : <><Gauge className="mr-2 h-4 w-4" />Analyze Now</>}
            </Button>
          } 
        />
      ) : (
        <div className="space-y-6">
          {/* Main Risk Gauge Card */}
          <Card className="p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#cca25a]" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Pre-Departure Risk Evaluation</span>
                {trip.is_demo && <SyntheticBadge />}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DriverPassModal trip={trip} />
                <ShareControls tripId={id} />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={exportPdf} 
                  disabled={exporting} 
                  data-testid="risk-export-pdf"
                  className="border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 h-8"
                >
                  {exporting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Exporting…</> : <><Download className="mr-1.5 h-3.5 w-3.5" />Export PDF</>}
                </Button>
              </div>
            </div>

            <div className="grid items-center gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <RouteStrip origin={trip.origin} destination={trip.destination} className="text-2xl font-extrabold" />
                <div className="text-xs text-slate-500 font-medium">Dispatch Date: <span className="text-slate-900 font-semibold">{fmtDate(trip.travel_date)}</span></div>
                <div className="font-mono text-xs text-slate-600">{trip.vehicle_number || "No vehicle registered"} · {trip.vehicle_type || "Commercial Truck"}</div>
                
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs">
                  <div>
                    <div className="text-slate-500 font-medium">Declared Distance</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{trip.declared_distance_km ? `${trip.declared_distance_km} km` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Estimated Route</div>
                    <div className="font-mono font-bold text-[#cca25a] text-sm mt-0.5">{trip.estimated_distance_km ? `${trip.estimated_distance_km} km` : "—"}</div>
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
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detailed Factor Risk Breakdown
              </h2>
              <span className="text-xs text-slate-400 font-medium">{(ev.factors || []).length} factors analyzed</span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {(ev.factors || []).map((f, i) => (
                <FactorCard key={i} f={f} />
              ))}
            </div>
          </div>

          {/* Action Checklist */}
          {ev.recommendations && ev.recommendations.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Pre-Dispatch Driver & Officer Checklist
              </h2>
              <ul className="space-y-2.5">
                {ev.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Disclaimer />
        </div>
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
      <Button size="sm" variant="outline" onClick={() => (window.location.href = "/pricing")} data-testid="risk-share-locked" className="border-slate-200 text-xs h-8">
        <Lock className="mr-1.5 h-3.5 w-3.5 text-slate-500" />Share (Upgrade)
      </Button>
    );
  }

  const shareUrl = (tok) => `${window.location.origin}/r/${tok}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid="risk-share-button" className="border-slate-200 text-xs h-8">
          <Share2 className="mr-1.5 h-3.5 w-3.5 text-slate-600" />Share
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white text-slate-900 border-slate-200">
        <DialogHeader><DialogTitle className="text-slate-900">Share Read-Only Report</DialogTitle></DialogHeader>
        <p className="text-xs text-slate-500">Anyone with this secure link can view this compliance assessment (no login needed).</p>
        <div className="flex items-end gap-2 mt-2">
          {isPro && (
            <div className="w-28">
              <label className="text-xs text-slate-500 font-medium">Expiry (days)</label>
              <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} data-testid="share-expiry-input" className="bg-white border-slate-200" />
            </div>
          )}
          <Button onClick={() => create.mutate()} disabled={create.isPending} data-testid="share-create-button" className="btn-primary-blue font-semibold text-xs h-9">
            {create.isPending ? "Creating…" : "Generate Link"}
          </Button>
        </div>
        <div className="mt-3 max-h-64 space-y-2 overflow-auto">
          {(links || []).filter((l) => l.active).length === 0 && <p className="text-xs text-slate-500">No active share links yet.</p>}
          {(links || []).map((l) => (
            <div key={l.id} className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 ${l.active ? "" : "opacity-40"}`}>
              <code className="flex-1 truncate text-xs text-slate-700 font-mono">{shareUrl(l.token)}</code>
              {l.active && <>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(shareUrl(l.token)); toast.success("Link copied"); }} data-testid="share-copy-button" className="h-7 w-7 text-slate-500 hover:text-slate-900"><Copy className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => revoke.mutate(l.id)} data-testid="share-revoke-button" className="h-7 w-7 text-red-600 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
              </>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
