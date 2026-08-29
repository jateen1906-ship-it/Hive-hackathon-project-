import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentAPI } from "@/lib/apiClient";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import { Disclaimer } from "@/components/common/Disclaimer";
import { SEVERITY_META } from "@/lib/riskMeta";

const FIELD_LABELS = {
  gstin: "GSTIN", invoice_number: "Invoice number", invoice_date: "Invoice date",
  vehicle_number: "Vehicle number", supplier: "Supplier", recipient: "Recipient",
  origin: "Origin", destination: "Destination", goods: "Goods", quantity: "Quantity",
  taxable_value: "Taxable value", invoice_value: "Invoice value",
  declared_distance: "Declared distance", eway_bill_number: "E-way bill number", validity: "Validity",
};

const STATUS_TEXT = {
  looks_ok: "Looks OK", review_recommended: "Review recommended", attention_needed: "Attention needed",
};

export default function DocumentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: doc, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["document", id], queryFn: () => DocumentAPI.get(id),
  });

  const validate = useMutation({
    mutationFn: () => DocumentAPI.validate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["document", id] }); toast.success("Re-checked"); },
    onError: (e) => toast.error(e.message || "Validation failed"),
  });

  if (isLoading) return <LoadingState label="Loading document…" />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const fields = doc.extracted_data?.fields || {};
  const val = doc.validation_result;
  const ocrError = doc.extracted_data?.error;
  const pages = doc.extracted_data?.pages || [];
  const pageCount = doc.extracted_data?.page_count || pages.length || 1;

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/documents")}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to documents</Button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{doc.file_name}</h1>
          <p className="text-sm capitalize text-muted-foreground">{doc.document_type?.replace("_", " ")} · {doc.provider || doc.extracted_data?.provider || "AI"} extraction · {pageCount} page{pageCount > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => DocumentAPI.download(id, doc.file_name)} data-testid="document-download"><Download className="mr-2 h-4 w-4" />Download</Button>
          {!ocrError && (
            <Button variant="outline" onClick={() => validate.mutate()} disabled={validate.isPending} data-testid="document-revalidate">
              {validate.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Re-checking…</> : <><RefreshCw className="mr-2 h-4 w-4" />Re-run pre-check</>}
            </Button>
          )}
        </div>
      </div>

      {ocrError && <ErrorState message={"Field extraction failed: " + ocrError} />}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Extracted fields */}
        <Card>
          <div className="border-b border-border p-4"><h2 className="text-sm font-semibold">Extracted fields</h2></div>
          <div className="divide-y divide-border">
            {Object.keys(FIELD_LABELS).map((k) => {
              const f = fields[k] || {};
              const conf = f.confidence != null ? Math.round(f.confidence * 100) : null;
              return (
                <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">{FIELD_LABELS[k]}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{f.value || "—"}</span>
                    {conf != null && f.value && (
                      <span data-testid="document-ocr-confidence-pill" className="rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{conf}%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Validation */}
        <div className="space-y-4">
          {val && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Pre-check result</h2>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{STATUS_TEXT[val.status] || val.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{val.notice}</p>
            </Card>
          )}
          {val?.issues?.length > 0 && (
            <div className="space-y-3">
              {val.issues.map((iss, i) => {
                const sev = SEVERITY_META[iss.severity] || SEVERITY_META.medium;
                return (
                  <Card key={i} className="border-l-4 p-4" style={{ borderLeftColor: sev.color }} data-testid={`document-issue-${iss.code}`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" style={{ color: sev.color }} />
                      <span className="text-sm font-semibold">{iss.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{iss.description}</p>
                    <p className="mt-2 text-sm"><span className="font-medium">Suggested: </span><span className="text-muted-foreground">{iss.recommendation}</span></p>
                  </Card>
                );
              })}
            </div>
          )}
          {val?.positives?.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">Passed checks</h3>
              <ul className="space-y-1.5">
                {val.positives.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{p}</li>
                ))}
              </ul>
            </Card>
          )}
          {!val && !ocrError && <Card className="p-4 text-sm text-muted-foreground">No pre-check run yet.</Card>}
        </div>
      </div>
      {pageCount > 1 && (
        <div className="mt-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700" data-testid="document-pages-breakdown">Page-by-page extraction</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pages.map((p) => {
              const pf = p.fields || {};
              const detected = Object.keys(FIELD_LABELS).filter((k) => pf[k]?.value);
              return (
                <Card key={p.page} className="p-4" data-testid={`document-page-${p.page}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Page {p.page}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{detected.length} field{detected.length !== 1 ? "s" : ""}</span>
                  </div>
                  {detected.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No fields detected on this page.</p>
                  ) : (
                    <div className="space-y-1">
                      {detected.map((k) => (
                        <div key={k} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{FIELD_LABELS[k]}</span>
                          <span className="font-mono">{pf[k].value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5"><Disclaimer /></div>
    </div>
  );
}
