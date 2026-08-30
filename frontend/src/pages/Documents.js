import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentAPI, TripAPI } from "@/lib/apiClient";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { fmtDate } from "@/lib/riskMeta";

const DOC_TYPES = [
  { v: "invoice", l: "Tax Invoice" },
  { v: "eway_bill", l: "E-Way Bill" },
  { v: "transport_document", l: "Lorry Receipt / Consignment Note" },
  { v: "other", l: "Other Supporting Document" },
];

const STATUS_STYLE = {
  processed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  uploaded: "text-slate-400 bg-white/[0.04] border-white/[0.08]",
  ocr_failed: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

function UploadDialog({ presetTrip, onDone }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("invoice");
  const [tripId, setTripId] = useState(presetTrip || "none");
  const [busy, setBusy] = useState(false);
  const { data: trips } = useQuery({ queryKey: ["trips"], queryFn: TripAPI.list });

  const submit = async () => {
    if (!file) { toast.error("Choose a file first"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", docType);
      if (tripId && tripId !== "none") fd.append("trip_id", tripId);
      const doc = await DocumentAPI.upload(fd);
      toast.success("Uploaded — optical extraction complete");
      setOpen(false);
      setFile(null);
      onDone(doc);
    } catch (e) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="documents-upload-button" className="btn-cyber-cyan font-bold rounded-xl text-xs px-4">
          <Upload className="mr-2 h-3.5 w-3.5" />Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f172a] border-white/[0.1] text-slate-100 rounded-2xl">
        <DialogHeader><DialogTitle className="text-white">Upload Freight Document</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300 font-semibold">Document File (Image or PDF)</Label>
            <Input type="file" accept="image/*,application/pdf" data-testid="document-file-input"
                   onChange={(e) => setFile(e.target.files?.[0] || null)} 
                   className="bg-white/[0.04] border-white/[0.08] text-xs file:bg-sky-500 file:text-white file:border-0 file:rounded-lg file:mr-2 file:font-semibold" />
            <p className="text-[11px] text-slate-400">Max 10 MB. Multi-page PDFs supported with native optical extraction.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300 font-semibold">Document Classification</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger data-testid="document-type-select" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/[0.1] text-white">
                {DOC_TYPES.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300 font-semibold">Link to Trip (Optional)</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger data-testid="document-trip-select" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl"><SelectValue placeholder="No trip assigned" /></SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/[0.1] text-white">
                <SelectItem value="none">No trip assigned</SelectItem>
                {(trips || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.origin} → {t.destination}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={submit} disabled={busy} data-testid="document-upload-submit" className="btn-cyber-cyan font-bold text-xs w-full sm:w-auto rounded-xl">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting Fields…</> : "Upload & Extract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Documents() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const presetTrip = params.get("trip");
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["documents"], queryFn: DocumentAPI.list });

  const onDone = (doc) => {
    qc.invalidateQueries({ queryKey: ["documents"] });
    if (doc?.id) navigate(`/documents/${doc.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Freight Documents" 
        subtitle="Upload tax invoices and E-Way bills for automated OCR field extraction and anomaly checks."
        actions={<UploadDialog presetTrip={presetTrip} onDone={onDone} />} 
      />

      {isLoading && <LoadingState label="Loading documents & OCR telemetry…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState 
          title="No documents uploaded yet" 
          description="Upload an invoice or e-way bill to run an automated optical compliance pre-check."
          action={<UploadDialog presetTrip={presetTrip} onDone={onDone} />} 
        />
      ) : (
        <Card className="rich-card overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {data.map((d) => {
              const issues = d.validation_result?.issues?.length || 0;
              return (
                <button 
                  key={d.id} 
                  onClick={() => navigate(`/documents/${d.id}`)} 
                  data-testid={`document-row-${d.id}`}
                  className="flex w-full items-center justify-between p-4 sm:px-6 text-left hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">{d.file_name}</div>
                      <div className="text-xs text-slate-400 capitalize mt-0.5">{d.document_type?.replace("_", " ")} · {fmtDate(d.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {issues > 0 && (
                      <span className="text-xs font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        {issues} issues
                      </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize border ${STATUS_STYLE[d.status] || "bg-white/[0.04] text-slate-300"}`}>
                      {d.status?.replace("_", " ")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      <Disclaimer />
    </div>
  );
}
