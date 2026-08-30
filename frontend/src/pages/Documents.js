import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
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
  processed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  uploaded: "text-[#d6d3d1] bg-white/[0.04] border-white/[0.08]",
  ocr_failed: "text-rose-400 bg-rose-500/10 border-rose-500/30",
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
      toast.success("Uploaded — extraction complete");
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
        <Button data-testid="documents-upload-button" className="btn-sunset-orange font-semibold rounded-xl text-xs">
          <Upload className="mr-2 h-4 w-4 stroke-[2.5]" />Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1714] border-white/[0.08] text-white">
        <DialogHeader><DialogTitle className="text-white">Upload Freight Document</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[#d6d3d1]">Document File (Image or PDF)</Label>
            <Input type="file" accept="image/*,application/pdf" data-testid="document-file-input"
                   onChange={(e) => setFile(e.target.files?.[0] || null)} 
                   className="bg-[#12100e] border-white/[0.08] text-white text-xs file:bg-orange-500 file:text-white file:border-0 file:rounded-md file:mr-2" />
            <p className="text-[11px] text-[#9e958d]">Max 10 MB. Multi-page PDFs supported with native optical extraction.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#d6d3d1]">Document Classification</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger data-testid="document-type-select" className="bg-[#12100e] border-white/[0.08] text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#1a1714] border-white/[0.08] text-white">
                {DOC_TYPES.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#d6d3d1]">Link to Trip (Optional)</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger data-testid="document-trip-select" className="bg-[#12100e] border-white/[0.08] text-white"><SelectValue placeholder="No trip assigned" /></SelectTrigger>
              <SelectContent className="bg-[#1a1714] border-white/[0.08] text-white">
                <SelectItem value="none">No trip assigned</SelectItem>
                {(trips || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.origin} → {t.destination}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={submit} disabled={busy} data-testid="document-upload-submit" className="btn-sunset-orange font-semibold text-xs w-full sm:w-auto">
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

      {isLoading && <LoadingState label="Loading documents…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState 
          title="No documents uploaded yet" 
          description="Upload an invoice or e-way bill to run an automated optical compliance pre-check."
          action={<UploadDialog presetTrip={presetTrip} onDone={onDone} />} 
        />
      ) : (
        <Card className="alvero-card overflow-hidden border-white/[0.07]">
          <div className="divide-y divide-white/[0.04]">
            {data.map((d) => {
              const issues = d.validation_result?.issues?.length || 0;
              return (
                <button 
                  key={d.id} 
                  onClick={() => navigate(`/documents/${d.id}`)} 
                  data-testid={`document-row-${d.id}`}
                  className="flex w-full items-center justify-between p-4 sm:px-6 text-left hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">{d.file_name}</div>
                      <div className="text-xs text-[#9e958d] capitalize mt-0.5">{d.document_type?.replace("_", " ")} · {fmtDate(d.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {issues > 0 && (
                      <span className="text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                        {issues} issues
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${STATUS_STYLE[d.status] || "bg-white/[0.04] text-[#d6d3d1]"}`}>
                      {d.status?.replace("_", " ")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#78716c] group-hover:text-white transition-colors" />
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
