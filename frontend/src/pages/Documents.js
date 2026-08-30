import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, Loader2, ChevronRight } from "lucide-react";
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
  processed: "text-emerald-700 bg-emerald-50 border-emerald-200",
  uploaded: "text-slate-600 bg-slate-100 border-slate-200",
  ocr_failed: "text-red-700 bg-red-50 border-red-200",
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
        <Button data-testid="documents-upload-button" className="btn-primary-blue text-xs h-9 px-4 font-semibold">
          <Upload className="mr-1.5 h-3.5 w-3.5" />Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-slate-200 text-slate-900">
        <DialogHeader><DialogTitle className="text-slate-900">Upload Freight Document</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700 font-medium">Document File (Image or PDF)</Label>
            <Input type="file" accept="image/*,application/pdf" data-testid="document-file-input"
                   onChange={(e) => setFile(e.target.files?.[0] || null)} 
                   className="bg-white border-slate-200 text-xs file:bg-slate-900 file:text-white file:border-0 file:rounded-md file:mr-2 file:font-semibold" />
            <p className="text-[11px] text-slate-500">Max 10 MB. Multi-page PDFs supported with optical extraction.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700 font-medium">Document Classification</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger data-testid="document-type-select" className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                {DOC_TYPES.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700 font-medium">Link to Trip (Optional)</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger data-testid="document-trip-select" className="bg-white border-slate-200"><SelectValue placeholder="No trip assigned" /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="none">No trip assigned</SelectItem>
                {(trips || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.origin} → {t.destination}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={submit} disabled={busy} data-testid="document-upload-submit" className="btn-primary-blue text-xs font-semibold w-full sm:w-auto h-9">
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
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data.map((d) => {
              const issues = d.validation_result?.issues?.length || 0;
              return (
                <button 
                  key={d.id} 
                  onClick={() => navigate(`/documents/${d.id}`)} 
                  data-testid={`document-row-${d.id}`}
                  className="flex w-full items-center justify-between p-4 sm:px-6 text-left hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{d.file_name}</div>
                      <div className="text-xs text-slate-500 capitalize mt-0.5">{d.document_type?.replace("_", " ")} · {fmtDate(d.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {issues > 0 && (
                      <span className="text-xs font-bold text-amber-700 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                        {issues} issues
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${STATUS_STYLE[d.status] || "bg-slate-100 text-slate-600"}`}>
                      {d.status?.replace("_", " ")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
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
