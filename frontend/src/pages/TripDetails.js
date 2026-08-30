import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Gauge, 
  Upload, 
  FileText, 
  Loader2, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  Printer, 
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripAPI } from "@/lib/apiClient";
import { RiskBadge } from "@/components/common/RiskBadge";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { RouteStrip } from "@/components/common/PageHeader";
import { fmtDate, fmtCurrency } from "@/lib/riskMeta";
import { DriverPassModal } from "@/components/trips/DriverPassModal";

function Field({ label, value, mono = false }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: trip, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => TripAPI.get(id),
  });

  const analyze = useMutation({
    mutationFn: () => TripAPI.analyze(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trip", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Risk analysis complete");
      navigate(`/trips/${id}/risk`);
    },
    onError: (e) => toast.error(e.message || "Analysis failed"),
  });

  if (isLoading) return <LoadingState label="Loading trip record…" />;
  if (isError || !trip) return <ErrorState message={error?.message || "Trip not found"} onRetry={refetch} />;

  const driverUrl = `${window.location.origin}/driver/sos/${trip.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(driverUrl)}&margin=8`;

  const copyLink = () => {
    const text = `TruckShield Driver Fast-Pass for ${trip.vehicle_number || "Truck"} (${trip.origin} → ${trip.destination}): ${driverUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Driver Fast-Pass link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = `TruckShield Driver Fast-Pass for ${trip.vehicle_number || "Truck"} (${trip.origin} → ${trip.destination}):\n${driverUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const printPass = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Driver Dispatch Slip - ${trip.vehicle_number || "TruckShield"}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; text-align: center; color: #0f172a; }
            .card { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; max-width: 400px; margin: auto; }
            .logo { font-weight: bold; font-size: 20px; color: #b88e44; margin-bottom: 4px; }
            .truck { font-size: 24px; font-weight: 800; font-family: monospace; letter-spacing: 2px; margin: 12px 0 6px; }
            .route { font-size: 16px; font-weight: bold; color: #475569; margin-bottom: 16px; }
            .qr { width: 180px; height: 180px; margin: 12px auto; display: block; }
            .instructions { font-size: 12px; color: #64748b; margin-top: 12px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">TruckShield Fleet Dispatch</div>
            <div style="font-size: 12px; text-transform: uppercase; color: #64748b;">Driver Fast-Pass Slip</div>
            <div class="truck">${trip.vehicle_number || "DECLARED VEHICLE"}</div>
            <div class="route">${trip.origin} → ${trip.destination}</div>
            <img class="qr" src="${qrUrl}" alt="Driver QR" />
            <div class="instructions">
              <strong>Scan with Phone Camera if stopped by RTO / Checkpost.</strong><br />
              1-Tap Highway GPS & Memo Capture (No App or Login Needed).
            </div>
          </div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        data-testid="trip-back"
        className="text-xs text-slate-500 hover:text-slate-900" 
        onClick={() => navigate("/trips")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to trips
      </Button>

      {/* Main Trip Card */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-6 bg-slate-50/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <RouteStrip origin={trip.origin} destination={trip.destination} className="text-xl font-bold" />
                {trip.is_demo && <SyntheticBadge />}
              </div>
              <div className="mt-1 text-xs text-slate-500 font-medium">Dispatch Date: <span className="text-slate-900 font-semibold">{fmtDate(trip.travel_date)}</span></div>
            </div>
            {trip.risk_level ? (
              <RiskBadge level={trip.risk_level} score={trip.risk_score} />
            ) : (
              <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-slate-100 font-medium">Not analyzed yet</span>
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

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 p-6 bg-slate-50/30">
          <Button 
            onClick={() => navigate(`/trips/${id}/risk`)} 
            data-testid="trip-view-risk"
            className="btn-primary-blue text-xs h-8 px-4 font-semibold"
          >
            <Gauge className="mr-1.5 h-3.5 w-3.5" />View risk report
          </Button>
          <Button 
            variant="outline" 
            onClick={() => analyze.mutate()} 
            disabled={analyze.isPending} 
            data-testid="trip-reanalyze"
            className="border-slate-200 text-xs font-semibold text-slate-700 h-8"
          >
            {analyze.isPending ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Analyzing…</> : "Re-run analysis"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/documents?trip=${id}`)} 
            data-testid="trip-upload-doc"
            className="border-slate-200 text-xs font-semibold text-slate-700 h-8"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />Upload document
          </Button>
          <DriverPassModal trip={trip} />
        </div>
      </Card>

      {/* 🚀 Dedicated Driver 1-Tap Fast-Pass & QR Section */}
      <Card className="p-6 border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fffde6] text-[#715113] border border-[#cca25a]/40 text-[11px] font-bold uppercase tracking-wider">
              <Smartphone className="h-3.5 w-3.5 text-[#cca25a]" />
              Driver 1-Tap Fast-Pass (No App, No Login)
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Live Highway SOS & Checkpost Reporting
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Give your driver instant 1-tap incident reporting. When stopped at an RTO checkpost, the driver opens this link (or scans the QR) to broadcast their <strong>GPS coordinates</strong>, flag <strong>detentions / fines</strong>, and upload <strong>memos / challans</strong> with zero login.
            </p>
            
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Button 
                onClick={shareWhatsApp} 
                className="btn-primary-blue text-xs h-9 px-4 font-semibold text-white flex items-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                Send on WhatsApp
              </Button>
              <Button 
                onClick={copyLink} 
                variant="outline" 
                className="border-slate-200 text-xs h-9 px-3.5 font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Link Copied!" : "Copy SMS Link"}
              </Button>
              <Button 
                onClick={printPass} 
                variant="ghost" 
                className="text-xs h-9 text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                Print Slip
              </Button>
              <a 
                href={driverUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-[#8a6522] hover:underline font-semibold flex items-center gap-1 ml-1"
              >
                Open Mobile View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* QR Code Box */}
          <div className="flex flex-col items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs shrink-0 self-center md:self-auto">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <img src={qrUrl} alt="Driver QR Code" className="w-32 h-32 object-contain" />
            </div>
            <span className="mt-2 text-[11px] font-mono font-bold text-slate-700">
              {trip.vehicle_number || "DRIVER FAST-PASS"}
            </span>
          </div>
        </div>
      </Card>

      {/* Documents on this trip */}
      <Card>
        <div className="flex items-center gap-2 border-b border-slate-100 p-5 bg-slate-50/50">
          <FileText className="h-4 w-4 text-blue-600" />
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
                <span className="text-xs capitalize px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{d.status}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Disclaimer />
    </div>
  );
}
