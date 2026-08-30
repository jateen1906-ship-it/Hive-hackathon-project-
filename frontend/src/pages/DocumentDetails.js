import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Pencil, Save, X, FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState({});
  const save = useMutation({
    mutationFn: () => DocumentAPI.correctFields(id, edits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document", id] });
      toast.success("Fields corrected & pre-check re-run");
      setEditing(false); setEdits({});
    },
    onError: (e) => toast.error(e.message || "Could not save corrections"),
  });

  if (isLoading) return <LoadingState label="Extracting optical fields & statutory matches…" />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const fields = doc.extracted_data?.fields || {};
  const val = doc.validation_result;
  const ocrError = doc.extracted_data?.error;
  const pages = doc.extracted_data?.pages || [];
  const pageCount = doc.extracted_data?.page_count || pages.length || 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs text-slate-400 hover:text-white" 
        onClick={() => navigate("/documents")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to documents
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{doc.file_name}</h1>
          <p className="text-xs capitalize text-slate-400 mt-0.5">{doc.document_type?.replace("_", " ")} · {doc.provider || doc.extracted_data?.provider || "AI"} Optical Model · {pageCount} page{pageCount > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => DocumentAPI.download(id, doc.file_name)} data-testid="document-download" className="border-white/[0.1] hover:bg-white/[0.05] text-xs font-semibold text-white rounded-xl">
            <Download className="mr-1.5 h-3.5 w-3.5" />Download File
          </Button>
          {!ocrError && (
            <Button variant="outline" onClick={() => validate.mutate()} disabled={validate.isPending} data-testid="document-revalidate" className="border-white/[0.1] hover:bg-white/[0.05] text-xs font-semibold text-white rounded-xl">
              {validate.isPending ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Checking…</> : <><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Re-evaluate Checks</>}
            </Button>
          )}
        </div>
      </div>

      {ocrError && <ErrorState message={"Field extraction failed: " + ocrError} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Extracted fields */}
        <Card className="rich-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] p-4 bg-white/[0.02]">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">Extracted Document Fields</h2>
            {!ocrError && (editing ? (
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || Object.keys(edits).length === 0} data-testid="document-fields-save" className="btn-cyber-cyan text-xs h-7 rounded-lg">
                  {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="mr-1 h-3 w-3" />Save</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEdits({}); }} className="h-7 text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="document-fields-edit" className="border-white/[0.1] hover:bg-white/[0.05] text-xs h-7 text-white rounded-lg">
                <Pencil className="mr-1 h-3 w-3" />Edit Fields
              </Button>
            ))}
          </div>
          <div className="divide-y divide-white/[0.06]">
            {Object.keys(FIELD_LABELS).map((k) => {
              const f = fields[k] || {};
              const conf = f.confidence != null ? Math.round(f.confidence * 100) : null;
              const low = conf != null && conf < 60 && !f.corrected;
              const curVal = edits[k] !== undefined ? edits[k] : (f.value || "");
              return (
                <div key={k} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${low ? "bg-amber-500/10" : ""}`}>
                  <span className="text-xs text-slate-400 font-medium">{FIELD_LABELS[k]}</span>
                  {editing ? (
                    <Input value={curVal} onChange={(e) => setEdits((p) => ({ ...p, [k]: e.target.value }))}
                           className="h-8 w-48 text-xs bg-white/[0.04] border-white/[0.1] text-white rounded-lg" data-testid={`document-field-input-${k}`} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white font-semibold">{f.value || "—"}</span>
                      {f.corrected && <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300" data-testid={`document-field-corrected-${k}`}>Corrected</span>}
                      {conf != null && f.value && !f.corrected && (
                        <span data-testid="document-ocr-confidence-pill" className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] font-bold border ${low ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-sky-500/20 text-sky-300 border-sky-500/30"}`}>{conf}%</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Validation */}
        <div className="space-y-4">
          {val && (
            <Card className="rich-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">Pre-Check Result</h2>
                <span className="rounded-full bg-white/[0.04] border border-white/[0.1] px-3 py-1 text-xs font-bold text-sky-300">{STATUS_TEXT[val.status] || val.status}</span>
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">{val.notice}</p>
            </Card>
          )}
          {val?.issues?.length > 0 && (
            <div className="space-y-3">
              {val.issues.map((iss, i) => {
                const sev = SEVERITY_META[iss.severity] || SEVERITY_META.medium;
                return (
                  <Card key={i} className="rich-card border-l-4 p-4" style={{ borderLeftColor: sev.color }} data-testid={`document-issue-${iss.code}`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" style={{ color: sev.color }} />
                      <span className="text-xs font-bold text-white">{iss.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">{iss.description}</p>
                    <p className="mt-2 text-xs text-slate-200"><span className="font-bold text-sky-400">Recommendation: </span>{iss.recommendation}</p>
                  </Card>
                );
              })}
            </div>
          )}
          {val?.positives?.length > 0 && (
            <Card className="rich-card p-5">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-emerald-400">Passed Statutory Checks</h3>
              <ul className="space-y-2">
                {val.positives.map((p, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />{p}</li>
                ))}
              </ul>
            </Card>
          )}
          {!val && !ocrError && <Card className="rich-card p-5 text-xs text-slate-400">No pre-check evaluated yet.</Card>}
        </div>
      </div>

      {pageCount > 1 && (
        <div>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400" data-testid="document-pages-breakdown">Page-By-Page Breakdown</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pages.map((p) => {
              const pf = p.fields || {};
              const detected = Object.keys(FIELD_LABELS).filter((k) => pf[k]?.value);
              return (
                <Card key={p.page} className="rich-card p-4" data-testid={`document-page-${p.page}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Page {p.page}</span>
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-sky-300 font-bold border border-white/[0.08]">{detected.length} field{detected.length !== 1 ? "s" : ""}</span>
                  </div>
                  {detected.length === 0 ? (
                    <p className="text-xs text-slate-500">No fields detected on this page.</p>
                  ) : (
                    <div className="space-y-1">
                      {detected.map((k) => (
                        <div key={k} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{FIELD_LABELS[k]}</span>
                          <span className="font-mono text-white font-bold">{pf[k].value}</span>
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

      <Disclaimer />
    </div>
  );
}
