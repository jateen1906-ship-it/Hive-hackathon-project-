import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
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
      toast.success("Incident reported");
    } catch (err) {
      toast.error(err.message || "Could not submit");
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="mx-auto max-w-md text-center">
        <Card className="p-8">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
          <h1 className="text-xl font-semibold">Incident recorded</h1>
          <p className="mt-1 text-sm text-muted-foreground">Thanks — this feeds your corridor intelligence.</p>
          <div className="mt-4 rounded-lg bg-secondary px-3 py-2 font-mono text-xs" data-testid="incident-created-id">ID: {created.id}</div>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => navigate("/incidents")} data-testid="incident-view-all">View incidents</Button>
            <Button variant="outline" onClick={() => { setCreated(null); setDocs([]); setForm((f) => ({ ...f, location_name: "", reason: "", notes: "" })); }}>Report another</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Report Incident" subtitle="Quick to fill — built for the road." />
      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="loc">Location</Label>
            <Input id="loc" value={form.location_name} onChange={set("location_name")} className="min-h-11" data-testid="incident-location-input" placeholder="Ahmedabad → Udaipur corridor" />
          </div>
          <div className="space-y-1.5">
            <Label>Incident type</Label>
            <Select value={form.incident_type} onValueChange={(v) => setForm((f) => ({ ...f, incident_type: v }))}>
              <SelectTrigger className="min-h-11" data-testid="incident-type-select"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" value={form.reason} onChange={set("reason")} className="min-h-11" data-testid="incident-reason-input" placeholder="Distance discrepancy" />
          </div>
          <div className="space-y-2">
            <Label>Documents requested</Label>
            <div className="grid grid-cols-2 gap-2">
              {DOC_OPTIONS.map((d) => (
                <label key={d} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <Checkbox checked={docs.includes(d)} onCheckedChange={() => toggleDoc(d)} data-testid={`incident-doc-${d}`} />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Select value={form.outcome} onValueChange={(v) => setForm((f) => ({ ...f, outcome: v }))}>
              <SelectTrigger className="min-h-11" data-testid="incident-outcome-select"><SelectValue /></SelectTrigger>
              <SelectContent>{OUTCOMES.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Link to trip (optional)</Label>
            <Select value={form.trip_id} onValueChange={(v) => setForm((f) => ({ ...f, trip_id: v }))}>
              <SelectTrigger className="min-h-11" data-testid="incident-trip-select"><SelectValue placeholder="No trip" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No trip</SelectItem>
                {(trips || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.origin} → {t.destination}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={set("notes")} data-testid="incident-notes-input" rows={3} placeholder="Any extra detail…" />
          </div>
        </Card>
        <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="incident-submit-button">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : <><Send className="mr-2 h-4 w-4" />Submit incident</>}
        </Button>
      </form>
    </div>
  );
}
