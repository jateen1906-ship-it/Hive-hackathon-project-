import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Gauge, MapPin, Truck, FileText, Sparkles, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripAPI, VehicleAPI } from "@/lib/apiClient";
import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";

const VEHICLE_TYPES = ["LCV", "Container Truck", "Trailer", "Tanker", "Tipper", "Refrigerated", "Other"];

export default function CreateTrip() {
  const navigate = useNavigate();
  const { data: vehicles } = useQuery({ queryKey: ["vehicles"], queryFn: VehicleAPI.list });
  const [form, setForm] = useState({
    origin: "", destination: "", travel_date: "", goods_description: "",
    invoice_value: "", declared_distance_km: "", vehicle_number: "", vehicle_type: "",
  });
  const [vehicleMode, setVehicleMode] = useState("new");
  const [existingId, setExistingId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPickExisting = (id) => {
    setExistingId(id);
    const v = (vehicles || []).find((x) => x.id === id);
    if (v) setForm((f) => ({ ...f, vehicle_number: v.vehicle_number, vehicle_type: v.vehicle_type || "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.origin || !form.destination) { toast.error("Origin and destination are required"); return; }
    setSubmitting(true);
    try {
      const payload = {
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        travel_date: form.travel_date || null,
        goods_description: form.goods_description || null,
        invoice_value: form.invoice_value ? Number(form.invoice_value) : null,
        declared_distance_km: form.declared_distance_km ? Number(form.declared_distance_km) : null,
        vehicle_number: form.vehicle_number || null,
        vehicle_type: form.vehicle_type || null,
        vehicle_id: vehicleMode === "existing" ? existingId || null : null,
      };
      const trip = await TripAPI.create(payload);
      toast.success("Dispatch created — running AI risk intelligence…");
      await TripAPI.analyze(trip.id);
      navigate(`/trips/${trip.id}/risk`);
    } catch (err) {
      toast.error(err.message || "Could not create trip");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader 
        title="Dispatch Pre-Check" 
        subtitle="Declare route corridor and cargo parameters to trigger deterministic statutory risk analysis." 
      />

      <form onSubmit={submit} className="space-y-6">
        {/* Route Card */}
        <Card className="rich-card p-6">
          <div className="flex items-center gap-2.5 mb-5 border-b border-white/[0.08] pb-3">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <MapPin className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">Corridor & Highway Parameters</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="origin" className="text-xs text-slate-300 font-semibold">Origin City / Hub *</Label>
              <Input id="origin" value={form.origin} onChange={set("origin")} data-testid="trip-form-origin-input" placeholder="e.g. Mumbai" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-xs text-slate-300 font-semibold">Destination City / Hub *</Label>
              <Input id="destination" value={form.destination} onChange={set("destination")} data-testid="trip-form-destination-input" placeholder="e.g. Delhi" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="travel_date" className="text-xs text-slate-300 font-semibold">Dispatch Date</Label>
              <Input id="travel_date" type="date" value={form.travel_date} onChange={set("travel_date")} data-testid="trip-form-date-input" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="declared_distance_km" className="text-xs text-slate-300 font-semibold">E-Way Declared Distance (km)</Label>
              <Input id="declared_distance_km" type="number" value={form.declared_distance_km} onChange={set("declared_distance_km")} data-testid="trip-form-distance-input" placeholder="e.g. 1420" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" />
            </div>
          </div>
        </Card>

        {/* Vehicle Card */}
        <Card className="rich-card p-6">
          <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Truck className="h-4 w-4" />
              </div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">Assigned Fleet Carrier</h2>
            </div>
            <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 text-xs">
              <button type="button" onClick={() => setVehicleMode("new")} data-testid="vehicle-mode-new"
                className={`rounded-lg px-3 py-1 font-bold transition-all ${vehicleMode === "new" ? "bg-sky-500 text-white shadow-md font-bold" : "text-slate-400 hover:text-white"}`}>New Entry</button>
              <button type="button" onClick={() => setVehicleMode("existing")} data-testid="vehicle-mode-existing"
                className={`rounded-lg px-3 py-1 font-bold transition-all ${vehicleMode === "existing" ? "bg-sky-500 text-white shadow-md font-bold" : "text-slate-400 hover:text-white"}`}>Saved Fleet</button>
            </div>
          </div>
          {vehicleMode === "existing" && (vehicles || []).length > 0 ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300 font-semibold">Select fleet vehicle</Label>
              <Select value={existingId} onValueChange={onPickExisting}>
                <SelectTrigger data-testid="trip-form-vehicle-select" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl"><SelectValue placeholder="Choose a registered vehicle" /></SelectTrigger>
                <SelectContent className="bg-[#0f172a] border-white/[0.1] text-white">
                  {(vehicles || []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vehicle_number} · {v.vehicle_type || "Commercial Carrier"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_number" className="text-xs text-slate-300 font-semibold">Vehicle Registration (RTO)</Label>
                <Input id="vehicle_number" value={form.vehicle_number} onChange={set("vehicle_number")} data-testid="trip-form-vehicle-number-input" placeholder="e.g. MH04AB1234" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl font-mono uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-semibold">Carrier Body Type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_type: v }))}>
                  <SelectTrigger data-testid="trip-form-vehicle-type-select" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-white/[0.1] text-white">
                    {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {vehicleMode === "existing" && (vehicles || []).length === 0 && (
            <p className="text-xs text-slate-400">No saved vehicles in fleet yet. Switch to “New Entry”.</p>
          )}
        </Card>

        {/* Consignment & Invoice */}
        <Card className="rich-card p-6">
          <div className="flex items-center gap-2.5 mb-5 border-b border-white/[0.08] pb-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">Consignment & Value</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="goods_description" className="text-xs text-slate-300 font-semibold">Cargo Nature & Description (detects Hazchem/Coldchain/Theft)</Label>
              <Textarea id="goods_description" value={form.goods_description} onChange={set("goods_description")} data-testid="trip-form-goods-input" placeholder="e.g. Industrial Chemicals / Electronics / Dairy Products" rows={2} className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="invoice_value" className="text-xs text-slate-300 font-semibold">Consignment Invoice Value (₹ - GST Rule 138 Check)</Label>
              <Input id="invoice_value" type="number" value={form.invoice_value} onChange={set("invoice_value")} data-testid="trip-form-invoice-input" placeholder="e.g. 850000" className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl" />
            </div>
          </div>
        </Card>

        <Disclaimer />

        <div className="sticky bottom-4 z-20">
          <Button 
            type="submit" 
            size="lg" 
            className="btn-cyber-cyan w-full font-extrabold rounded-2xl h-12 text-sm shadow-xl flex items-center justify-center gap-2" 
            disabled={submitting} 
            data-testid="trip-analyze-button"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Executing AI Risk Engine…</>
            ) : (
              <><Navigation className="h-4 w-4" />Create & Evaluate Dispatch Risk</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
