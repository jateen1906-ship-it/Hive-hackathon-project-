import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send, MapPin, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IncidentAPI, TripAPI } from "@/lib/apiClient";
import { PageHeader } from "@/components/common/PageHeader";

const TYPES = [
  { v: "document_check", l: "Document check" },
  { v: "distance_question", l: "Distance question" },
  { v: "vehicle_verification", l: "Vehicle verification" },
  { v: "route_check", l: "Route check" },
  { v: "tax_related_question", l: "Tax-related question" },
  { v: "other", l: "Other" },
];
const OUTCOMES = [
  { v: "released", l: "Released" },
  { v: "delayed", l: "Delayed" },
  { v: "further_review", l: "Further review" },
  { v: "penalty_reported", l: "Penalty reported" },
  { v: "unknown", l: "Unknown" },
];
const DOC_OPTIONS = ["E-way Bill", "Invoice", "RC", "Insurance", "Driving Licence", "Permit"];

export default function ReportIncident() {
  const navigate = useNavigate();
  const { data: trips } = useQuery({ queryKey: ["trips"], queryFn: TripAPI.list });
  const [form, setForm] = useState({
    location_name: "", incident_type: "document_check", reason: "",
    outcome: "released", notes: "", trip_id: "none",
  });
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));
  const toggleDoc = (d) => setDocs((arr) => arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.location_name.trim()) { toast.error("Please enter a location"); return; }
    setBusy(true);
    try {
      const payload = {
        location_name: form.location_name.trim(),
        incident_type: form.incident_type,
        reason: form.reason || null,
        outcome: form.outcome,
        notes: form.notes || null,
        documents_requested: docs,
        trip_id: form.trip_id !== "none" ? form.trip_id : null,
      };
      const inc = await IncidentAPI.create(payload);
      setCreated(inc);
      toast.success("Incident reported successfully");
    } catch (err) {
      toast.error(err.message || "Could not submit incident");
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="mx-auto max-w-md text-center pt-8">
        <Card className="rich-card p-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Incident Recorded</h1>
          <p className="mt-1.5 text-xs text-slate-400">Thank you. This data immediately feeds your corridor safety signals.</p>
          <div className="mt-4 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 font-mono text-xs text-sky-300" data-testid="incident-created-id">ID: {created.id}</div>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => navigate("/incidents")} data-testid="incident-view-all" className="btn-cyber-cyan text-xs font-bold rounded-xl">View Incidents</Button>
            <Button variant="outline" onClick={() => { setCreated(null); setDocs([]); setForm((f) => ({ ...f, location_name: "", reason: "", notes: "" })); }} className="border-white/[0.1] text-xs font-semibold text-white rounded-xl">Report Another</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Report Route Incident" subtitle="Quick to submit from the field — feeds real-time corridor intelligence." />
      <form onSubmit={submit} className="space-y-4">
        <Card className="rich-card space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="loc" className="text-xs text-slate-300 font-semibold">Location / Toll Plaza / Border</Label>
            <Input id="loc" value={form.location_name} onChange={set("location_name")} className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" data-testid="incident-location-input" placeholder="e.g. Surat → Indore Highway Checkpoint" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300 font-semibold">Incident Type</Label>
            <Select value={form.incident_type} onValueChange={(v) => setForm((f) => ({ ...f, incident_type: v }))}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" data-testid="incident-type-select"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/[0.1] text-white">{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs text-slate-300 font-semibold">Reason Provided by Authority</Label>
            <Input id="reason" value={form.reason} onChange={set("reason")} className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" data-testid="incident-reason-input" placeholder="e.g. E-way bill distance inspection" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-300 font-semibold">Documents Demanded</Label>
            <div className="grid grid-cols-2 gap-2">
              {DOC_OPTIONS.map((d) => (
                <label key={d} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-xs text-slate-300 cursor-pointer hover:bg-white/[0.05]">
                  <Checkbox checked={docs.includes(d)} onCheckedChange={() => toggleDoc(d)} data-testid={`incident-doc-${d}`} />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300 font-semibold">Inspection Outcome</Label>
            <Select value={form.outcome} onValueChange={(v) => setForm((f) => ({ ...f, outcome: v }))}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" data-testid="incident-outcome-select"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/[0.1] text-white">{OUTCOMES.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300 font-semibold">Link to Active Trip (Optional)</Label>
            <Select value={form.trip_id} onValueChange={(v) => setForm((f) => ({ ...f, trip_id: v }))}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" data-testid="incident-trip-select"><SelectValue placeholder="No trip" /></SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-white/[0.1] text-white">
                <SelectItem value="none">No trip</SelectItem>
                {(trips || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.origin} → {t.destination}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs text-slate-300 font-semibold">Additional Field Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={set("notes")} data-testid="incident-notes-input" rows={3} placeholder="Provide details regarding the officer, delay time, or challan number…" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" />
          </div>
        </Card>
        <Button type="submit" size="lg" className="btn-cyber-cyan w-full font-bold rounded-2xl h-12 shadow-lg text-sm" disabled={busy} data-testid="incident-submit-button">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : <><Send className="mr-2 h-4 w-4" />Submit Route Incident</>}
        </Button>
      </form>
    </div>
  );
}
