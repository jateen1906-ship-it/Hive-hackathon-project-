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
        <Card className="executive-card p-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Incident Recorded</h1>
          <p className="mt-1.5 text-xs text-slate-500">Thank you. This data immediately feeds your corridor safety signals.</p>
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 font-mono text-xs text-slate-700" data-testid="incident-created-id">ID: {created.id}</div>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => navigate("/incidents")} data-testid="incident-view-all" className="btn-executive-primary text-xs font-semibold">View Incidents</Button>
            <Button variant="outline" onClick={() => { setCreated(null); setDocs([]); setForm((f) => ({ ...f, location_name: "", reason: "", notes: "" })); }} className="border-slate-200 text-xs font-semibold text-slate-700">Report Another</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Report Route Incident" subtitle="Quick to submit from the field — updates corridor intelligence." />
      <form onSubmit={submit} className="space-y-4">
        <Card className="executive-card space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="loc" className="text-xs text-slate-700">Location / Toll Plaza / Border</Label>
            <Input id="loc" value={form.location_name} onChange={set("location_name")} className="bg-white border-slate-200 text-slate-900" data-testid="incident-location-input" placeholder="e.g. Surat → Indore Highway Checkpoint" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700">Incident Type</Label>
            <Select value={form.incident_type} onValueChange={(v) => setForm((f) => ({ ...f, incident_type: v }))}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-900" data-testid="incident-type-select"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs text-slate-700">Reason Provided by Authority</Label>
            <Input id="reason" value={form.reason} onChange={set("reason")} className="bg-white border-slate-200 text-slate-900" data-testid="incident-reason-input" placeholder="e.g. E-way bill distance inspection" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-700">Documents Demanded</Label>
            <div className="grid grid-cols-2 gap-2">
              {DOC_OPTIONS.map((d) => (
                <label key={d} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-100">
                  <Checkbox checked={docs.includes(d)} onCheckedChange={() => toggleDoc(d)} data-testid={`incident-doc-${d}`} />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700">Inspection Outcome</Label>
            <Select value={form.outcome} onValueChange={(v) => setForm((f) => ({ ...f, outcome: v }))}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-900" data-testid="incident-outcome-select"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">{OUTCOMES.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-700">Link to Active Trip (Optional)</Label>
            <Select value={form.trip_id} onValueChange={(v) => setForm((f) => ({ ...f, trip_id: v }))}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-900" data-testid="incident-trip-select"><SelectValue placeholder="No trip" /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="none">No trip</SelectItem>
                {(trips || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.origin} → {t.destination}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs text-slate-700">Additional Field Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={set("notes")} data-testid="incident-notes-input" rows={3} placeholder="Provide details regarding the officer, delay time, or challan number…" className="bg-white border-slate-200 text-slate-900" />
          </div>
        </Card>
        <Button type="submit" size="lg" className="btn-executive-primary w-full font-bold rounded-xl h-11 shadow-sm text-sm" disabled={busy} data-testid="incident-submit-button">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : <><Send className="mr-2 h-4 w-4" />Submit Incident</>}
        </Button>
      </form>
    </div>
  );
}
