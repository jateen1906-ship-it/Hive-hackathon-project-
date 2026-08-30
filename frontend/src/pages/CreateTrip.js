import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Gauge, MapPin, Truck, FileText } from "lucide-react";
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
      toast.success("Trip created — running risk analysis…");
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
        subtitle="Enter corridor and cargo parameters to run statutory compliance risk analysis." 
      />

      <form onSubmit={submit} className="space-y-6">
        {/* Route Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <MapPin className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Route & Corridor</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="origin" className="text-xs text-slate-700 font-medium">Origin City / Hub *</Label>
              <Input id="origin" value={form.origin} onChange={set("origin")} data-testid="trip-form-origin-input" placeholder="e.g. Mumbai" className="bg-white border-slate-200 text-slate-900" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-xs text-slate-700 font-medium">Destination City / Hub *</Label>
              <Input id="destination" value={form.destination} onChange={set("destination")} data-testid="trip-form-destination-input" placeholder="e.g. Delhi" className="bg-white border-slate-200 text-slate-900" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="travel_date" className="text-xs text-slate-700 font-medium">Dispatch Date</Label>
              <Input id="travel_date" type="date" value={form.travel_date} onChange={set("travel_date")} data-testid="trip-form-date-input" className="bg-white border-slate-200 text-slate-900" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="declared_distance_km" className="text-xs text-slate-700 font-medium">E-Way Declared Distance (km)</Label>
              <Input id="declared_distance_km" type="number" value={form.declared_distance_km} onChange={set("declared_distance_km")} data-testid="trip-form-distance-input" placeholder="e.g. 1420" className="bg-white border-slate-200 text-slate-900" />
            </div>
          </div>
        </Card>

        {/* Vehicle Card */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Assigned Fleet Vehicle</h2>
            </div>
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button type="button" onClick={() => setVehicleMode("new")} data-testid="vehicle-mode-new"
                className={`rounded-md px-3 py-1 font-medium transition-colors ${vehicleMode === "new" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500"}`}>New Entry</button>
              <button type="button" onClick={() => setVehicleMode("existing")} data-testid="vehicle-mode-existing"
                className={`rounded-md px-3 py-1 font-medium transition-colors ${vehicleMode === "existing" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500"}`}>Saved Fleet</button>
            </div>
          </div>
          {vehicleMode === "existing" && (vehicles || []).length > 0 ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700 font-medium">Select fleet vehicle</Label>
              <Select value={existingId} onValueChange={onPickExisting}>
                <SelectTrigger data-testid="trip-form-vehicle-select" className="bg-white border-slate-200 text-slate-900"><SelectValue placeholder="Choose a registered vehicle" /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {(vehicles || []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vehicle_number} · {v.vehicle_type || "Commercial Carrier"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_number" className="text-xs text-slate-700 font-medium">Vehicle Registration (RTO)</Label>
                <Input id="vehicle_number" value={form.vehicle_number} onChange={set("vehicle_number")} data-testid="trip-form-vehicle-number-input" placeholder="e.g. MH04AB1234" className="bg-white border-slate-200 text-slate-900 font-mono uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 font-medium">Carrier Body Type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_type: v }))}>
                  <SelectTrigger data-testid="trip-form-vehicle-type-select" className="bg-white border-slate-200 text-slate-900"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {vehicleMode === "existing" && (vehicles || []).length === 0 && (
            <p className="text-xs text-slate-500">No saved vehicles in fleet yet. Switch to “New Entry”.</p>
          )}
        </Card>

        {/* Goods & Value */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <FileText className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Consignment & Value</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="goods_description" className="text-xs text-slate-700 font-medium">Cargo Nature & Description (detects Hazchem/Coldchain/Theft)</Label>
              <Textarea id="goods_description" value={form.goods_description} onChange={set("goods_description")} data-testid="trip-form-goods-input" placeholder="e.g. Industrial Chemicals / Electronics / Dairy Products" rows={2} className="bg-white border-slate-200 text-slate-900" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="invoice_value" className="text-xs text-slate-700 font-medium">Consignment Invoice Value (₹ - GST Rule 138 Check)</Label>
              <Input id="invoice_value" type="number" value={form.invoice_value} onChange={set("invoice_value")} data-testid="trip-form-invoice-input" placeholder="e.g. 850000" className="bg-white border-slate-200 text-slate-900" />
            </div>
          </div>
        </Card>

        <Disclaimer />

        <div>
          <Button 
            type="submit" 
            size="lg" 
            className="btn-primary-blue w-full font-semibold rounded-lg h-11 text-sm shadow-xs" 
            disabled={submitting} 
            data-testid="trip-analyze-button"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running Risk Engine…</>
            ) : (
              <><Gauge className="mr-2 h-4 w-4" />Create & Analyze Trip</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
