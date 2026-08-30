import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Gauge, MapPin, Truck, FileText, Sparkles } from "lucide-react";
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
  const [vehicleMode, setVehicleMode] = useState("new"); // new | existing
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
      toast.success("Trip created — running risk intelligence…");
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
        subtitle="Enter corridor and cargo parameters to run explainable statutory risk analysis." 
      />

      <form onSubmit={submit} className="space-y-6">
        {/* Route Card */}
        <Card className="alvero-card p-6 border-white/[0.07]">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="h-4 w-4 text-orange-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Route & Corridor</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="origin" className="text-xs text-[#d6d3d1]">Origin City / Hub *</Label>
              <Input id="origin" value={form.origin} onChange={set("origin")} data-testid="trip-form-origin-input" placeholder="e.g. Mumbai" className="bg-[#12100e] border-white/[0.08] text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-xs text-[#d6d3d1]">Destination City / Hub *</Label>
              <Input id="destination" value={form.destination} onChange={set("destination")} data-testid="trip-form-destination-input" placeholder="e.g. Delhi" className="bg-[#12100e] border-white/[0.08] text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="travel_date" className="text-xs text-[#d6d3d1]">Dispatch Date</Label>
              <Input id="travel_date" type="date" value={form.travel_date} onChange={set("travel_date")} data-testid="trip-form-date-input" className="bg-[#12100e] border-white/[0.08] text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="declared_distance_km" className="text-xs text-[#d6d3d1]">E-Way Declared Distance (km)</Label>
              <Input id="declared_distance_km" type="number" value={form.declared_distance_km} onChange={set("declared_distance_km")} data-testid="trip-form-distance-input" placeholder="e.g. 1420" className="bg-[#12100e] border-white/[0.08] text-white" />
            </div>
          </div>
        </Card>

        {/* Vehicle Card */}
        <Card className="alvero-card p-6 border-white/[0.07]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Assigned Fleet Vehicle</h2>
            </div>
            <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 text-xs">
              <button type="button" onClick={() => setVehicleMode("new")} data-testid="vehicle-mode-new"
                className={`rounded-lg px-3 py-1 font-medium transition-all ${vehicleMode === "new" ? "bg-orange-500 text-white shadow-sm" : "text-[#9e958d] hover:text-white"}`}>New Entry</button>
              <button type="button" onClick={() => setVehicleMode("existing")} data-testid="vehicle-mode-existing"
                className={`rounded-lg px-3 py-1 font-medium transition-all ${vehicleMode === "existing" ? "bg-orange-500 text-white shadow-sm" : "text-[#9e958d] hover:text-white"}`}>Saved Fleet</button>
            </div>
          </div>
          {vehicleMode === "existing" && (vehicles || []).length > 0 ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-[#d6d3d1]">Select fleet vehicle</Label>
              <Select value={existingId} onValueChange={onPickExisting}>
                <SelectTrigger data-testid="trip-form-vehicle-select" className="bg-[#12100e] border-white/[0.08] text-white"><SelectValue placeholder="Choose a registered vehicle" /></SelectTrigger>
                <SelectContent className="bg-[#1a1714] border-white/[0.08] text-white">
                  {(vehicles || []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vehicle_number} · {v.vehicle_type || "Commercial Carrier"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_number" className="text-xs text-[#d6d3d1]">Vehicle Registration (RTO)</Label>
                <Input id="vehicle_number" value={form.vehicle_number} onChange={set("vehicle_number")} data-testid="trip-form-vehicle-number-input" placeholder="e.g. MH04AB1234" className="bg-[#12100e] border-white/[0.08] text-white font-mono uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#d6d3d1]">Carrier Body Type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_type: v }))}>
                  <SelectTrigger data-testid="trip-form-vehicle-type-select" className="bg-[#12100e] border-white/[0.08] text-white"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1714] border-white/[0.08] text-white">
                    {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {vehicleMode === "existing" && (vehicles || []).length === 0 && (
            <p className="text-xs text-[#9e958d]">No saved vehicles in fleet yet. Switch to “New Entry”.</p>
          )}
        </Card>

        {/* Goods & Value */}
        <Card className="alvero-card p-6 border-white/[0.07]">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="h-4 w-4 text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Consignment & Value</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="goods_description" className="text-xs text-[#d6d3d1]">Cargo Nature & Description (detects Hazchem/Coldchain/Theft)</Label>
              <Textarea id="goods_description" value={form.goods_description} onChange={set("goods_description")} data-testid="trip-form-goods-input" placeholder="e.g. Industrial Chemicals / Electronics / Dairy Products" rows={2} className="bg-[#12100e] border-white/[0.08] text-white" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="invoice_value" className="text-xs text-[#d6d3d1]">Consignment Invoice Value (₹ - GST Rule 138 Check)</Label>
              <Input id="invoice_value" type="number" value={form.invoice_value} onChange={set("invoice_value")} data-testid="trip-form-invoice-input" placeholder="e.g. 850000" className="bg-[#12100e] border-white/[0.08] text-white" />
            </div>
          </div>
        </Card>

        <Disclaimer />

        <div className="sticky bottom-4 z-20">
          <Button 
            type="submit" 
            size="lg" 
            className="btn-sunset-orange w-full font-bold rounded-2xl h-12 text-sm shadow-xl shadow-orange-950/50" 
            disabled={submitting} 
            data-testid="trip-analyze-button"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Running Risk Engine…</>
            ) : (
              <><Gauge className="mr-2 h-5 w-5 stroke-[2.5]" />Create & Analyze Trip</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
