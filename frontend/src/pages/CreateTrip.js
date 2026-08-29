import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Gauge } from "lucide-react";
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
      toast.success("Trip created — analyzing…");
      await TripAPI.analyze(trip.id);
      navigate(`/trips/${trip.id}/risk`);
    } catch (err) {
      toast.error(err.message || "Could not create trip");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Create Trip" subtitle="Enter trip details to generate a compliance-risk report." />
      <form onSubmit={submit} className="space-y-5">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700">Route</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="origin">Origin *</Label>
              <Input id="origin" value={form.origin} onChange={set("origin")} data-testid="trip-form-origin-input" placeholder="Surat" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination *</Label>
              <Input id="destination" value={form.destination} onChange={set("destination")} data-testid="trip-form-destination-input" placeholder="Indore" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="travel_date">Travel date</Label>
              <Input id="travel_date" type="date" value={form.travel_date} onChange={set("travel_date")} data-testid="trip-form-date-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="declared_distance_km">Declared distance (km)</Label>
              <Input id="declared_distance_km" type="number" value={form.declared_distance_km} onChange={set("declared_distance_km")} data-testid="trip-form-distance-input" placeholder="380" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Vehicle</h2>
            <div className="flex gap-1 rounded-lg border border-border p-0.5 text-xs">
              <button type="button" onClick={() => setVehicleMode("new")} data-testid="vehicle-mode-new"
                className={`rounded-md px-2.5 py-1 ${vehicleMode === "new" ? "bg-secondary font-medium" : "text-muted-foreground"}`}>New</button>
              <button type="button" onClick={() => setVehicleMode("existing")} data-testid="vehicle-mode-existing"
                className={`rounded-md px-2.5 py-1 ${vehicleMode === "existing" ? "bg-secondary font-medium" : "text-muted-foreground"}`}>Existing</button>
            </div>
          </div>
          {vehicleMode === "existing" && (vehicles || []).length > 0 ? (
            <div className="space-y-1.5">
              <Label>Select vehicle</Label>
              <Select value={existingId} onValueChange={onPickExisting}>
                <SelectTrigger data-testid="trip-form-vehicle-select"><SelectValue placeholder="Choose a vehicle" /></SelectTrigger>
                <SelectContent>
                  {(vehicles || []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vehicle_number} · {v.vehicle_type || "—"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle_number">Vehicle number</Label>
                <Input id="vehicle_number" value={form.vehicle_number} onChange={set("vehicle_number")} data-testid="trip-form-vehicle-number-input" placeholder="GJ05AB1234" />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_type: v }))}>
                  <SelectTrigger data-testid="trip-form-vehicle-type-select"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {vehicleMode === "existing" && (vehicles || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No saved vehicles yet. Switch to “New” to enter one.</p>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700">Goods & Invoice</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="goods_description">Goods description</Label>
              <Textarea id="goods_description" value={form.goods_description} onChange={set("goods_description")} data-testid="trip-form-goods-input" placeholder="Cotton fabric rolls" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice_value">Invoice value (₹)</Label>
              <Input id="invoice_value" type="number" value={form.invoice_value} onChange={set("invoice_value")} data-testid="trip-form-invoice-input" placeholder="448400" />
            </div>
          </div>
        </Card>

        <Disclaimer />

        <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4">
          <Button type="submit" size="lg" className="w-full" disabled={submitting} data-testid="trip-analyze-button">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing trip…</> : <><Gauge className="mr-2 h-4 w-4" />Create & Analyze Trip</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
