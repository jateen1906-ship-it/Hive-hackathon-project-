import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";
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
  { v: "invoice", l: "Invoice" },
  { v: "eway_bill", l: "E-way Bill" },
  { v: "transport_document", l: "Transport Document" },
  { v: "other", l: "Other" },
];

const STATUS_STYLE = {
  processed: "text-emerald-700 bg-emerald-50",
  uploaded: "text-slate-600 bg-slate-100",
  ocr_failed: "text-red-700 bg-red-50",
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
        <Button data-testid="documents-upload-button"><Upload className="mr-2 h-4 w-4" />Upload Document</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload a document</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>File (image or PDF)</Label>
            <Input type="file" accept="image/*,application/pdf" data-testid="document-file-input"
                   onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground">Max 10 MB. Fields are extracted with AI and treated as a pre-check.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger data-testid="document-type-select"><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Link to trip (optional)</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger data-testid="document-trip-select"><SelectValue placeholder="No trip" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No trip</SelectItem>
                {(trips || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.origin} → {t.destination}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy} data-testid="document-upload-submit">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting…</> : "Upload & extract"}
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
    <div>
      <PageHeader title="Documents" subtitle="Upload invoices and e-way bills for an AI-assisted compliance pre-check."
        actions={<UploadDialog presetTrip={presetTrip} onDone={onDone} />} />

      {isLoading && <LoadingState label="Loading documents…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState title="No documents yet" description="Upload an invoice or e-way bill to run a document pre-check."
          action={<UploadDialog presetTrip={presetTrip} onDone={onDone} />} />
      ) : (
        <Card className="divide-y divide-border">
          {data.map((d) => {
            const issues = d.validation_result?.issues?.length || 0;
            return (
              <button key={d.id} onClick={() => navigate(`/documents/${d.id}`)} data-testid={`document-row-${d.id}`}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-500" />
                  <div>
                    <div className="text-sm font-medium">{d.file_name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{d.document_type?.replace("_", " ")} · {fmtDate(d.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {issues > 0 && <span className="text-xs font-medium text-amber-700">{issues} to review</span>}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[d.status] || "bg-slate-100 text-slate-600"}`}>{d.status?.replace("_", " ")}</span>
                </div>
              </button>
            );
          })}
        </Card>
      ))}
      <div className="mt-5"><Disclaimer /></div>
    </div>
  );
}
