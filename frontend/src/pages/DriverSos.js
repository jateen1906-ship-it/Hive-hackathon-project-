import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Truck, 
  MapPin, 
  ShieldAlert, 
  AlertTriangle, 
  Wrench, 
  Camera, 
  CheckCircle2, 
  Loader2, 
  Navigation,
  FileCheck,
  Send,
  PhoneCall
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DriverSosAPI } from "@/lib/apiClient";

const INCIDENT_TYPES = [
  {
    id: "checkpost_stop",
    label: "Routine Checkpost",
    subtitle: "RTO / Police / Sales Tax check",
    icon: ShieldAlert,
    color: "#cca25a",
    border: "border-[#cca25a]",
    bg: "bg-[#fffde6]",
    text: "text-[#715113]"
  },
  {
    id: "detention",
    label: "Detention / Fine",
    subtitle: "Challan issued or papers held",
    icon: AlertTriangle,
    color: "#ef4444",
    border: "border-red-400",
    bg: "bg-red-50",
    text: "text-red-700"
  },
  {
    id: "breakdown",
    label: "Breakdown / Delay",
    subtitle: "Tire puncture or engine fault",
    icon: Wrench,
    color: "#f59e0b",
    border: "border-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-800"
  }
];

const COMMON_DOCS = [
  "E-Way Part-B",
  "Tax Invoice",
  "RC / Permit",
  "PUC / Pollution",
  "Driver License",
  "Insurance"
];

export default function DriverSos() {
  const { tripId } = useParams();

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ["driver-trip", tripId],
    queryFn: () => DriverSosAPI.getTripInfo(tripId),
    retry: 1
  });

  const [selectedType, setSelectedType] = useState("checkpost_stop");
  const [gps, setGps] = useState({ lat: null, lng: null, accuracy: null, status: "idle" });
  const [locationName, setLocationName] = useState("");
  const [reason, setReason] = useState("");
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [fineAmount, setFineAmount] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Auto-fetch GPS on load
  useEffect(() => {
    fetchGps();
  }, []);

  const fetchGps = () => {
    if (!navigator.geolocation) {
      setGps({ lat: null, lng: null, accuracy: null, status: "unsupported" });
      return;
    }
    setGps(prev => ({ ...prev, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          status: "success"
        });
      },
      (err) => {
        setGps({ lat: null, lng: null, accuracy: null, status: "denied" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleDoc = (doc) => {
    setSelectedDocs(prev => 
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload = {
        latitude: gps.lat,
        longitude: gps.lng,
        location_name: locationName.trim() || (gps.lat ? `Highway GPS (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})` : `${trip?.origin || "Highway"} Checkpoint`),
        incident_type: selectedType,
        reason: reason.trim() || `Driver flagged ${selectedType.replace('_', ' ')} on corridor`,
        documents_requested: selectedDocs,
        notes: fineAmount ? `Challan / Fine Demand: ₹${fineAmount}` : "",
        outcome: selectedType === "detention" ? "delayed" : "in_progress"
      };
      return DriverSosAPI.reportIncident(tripId, payload);
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-800">
        <Loader2 className="h-8 w-8 text-[#cca25a] animate-spin mb-3" />
        <p className="text-sm font-semibold">Connecting to TruckShield Fleet Link…</p>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Trip Link Expired or Not Found</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Please check the link provided by your fleet manager or dispatch office.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6 flex flex-col justify-between max-w-md mx-auto">
        <div className="pt-12 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4 border-2 border-emerald-300">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dispatch Notified!</h1>
          <p className="text-sm text-slate-600 mt-2">
            Your incident report and highway location have been transmitted to your fleet management dashboard.
          </p>

          <Card className="mt-6 p-4 bg-white border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Vehicle:</span>
              <span className="font-bold text-slate-900 font-mono">{trip.vehicle_number || "Declared Truck"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Route:</span>
              <span className="font-semibold text-slate-800">{trip.origin} → {trip.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Incident:</span>
              <span className="font-bold text-[#cca25a] uppercase">{selectedType.replace('_', ' ')}</span>
            </div>
            {gps.lat && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">GPS Locked:</span>
                <span className="font-mono text-emerald-700 font-semibold">{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</span>
              </div>
            )}
          </Card>
        </div>

        <div className="pb-6">
          <Button 
            onClick={() => { setSubmitted(false); }} 
            variant="outline" 
            className="w-full text-xs border-slate-300 text-slate-700 h-11 font-semibold"
          >
            Submit Another Update
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-12">
      {/* Mobile Top Header */}
      <header className="bg-[#0b0f19] text-white px-5 py-4 border-b border-slate-800 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#cca25a] flex items-center justify-center text-slate-950 font-bold">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold tracking-wider text-white">
                {trip.vehicle_number || "TRUCK"}
              </div>
              <div className="text-[11px] text-slate-400">
                {trip.origin} → {trip.destination}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#cca25a]/20 text-[#cca25a] border border-[#cca25a]/30">
            DRIVER SOS
          </span>
        </div>
      </header>

      {/* Main Action Container */}
      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* GPS Status Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              gps.status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}>
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {gps.status === "success" ? "📍 Highway GPS Locked" : "Location Pending"}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {gps.lat ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)} (±${gps.accuracy}m)` : "Tap to detect highway position"}
              </div>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchGps} 
            disabled={gps.status === "loading"}
            className="h-7 text-[11px] border-slate-200 px-2.5 font-semibold"
          >
            {gps.status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {/* 1. Select Incident Type (3 Big Buttons) */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
            1. What happened?
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {INCIDENT_TYPES.map((t) => {
              const active = selectedType === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl border-2 text-left transition-all ${
                    active 
                      ? `${t.border} ${t.bg} shadow-xs scale-[1.01]` 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${active ? t.bg : "bg-slate-100"}`} style={{ color: t.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold ${active ? t.text : "text-slate-900"}`}>{t.label}</div>
                    <div className="text-xs text-slate-500">{t.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Location Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            2. Checkpoint / Highway Name
          </label>
          <Input 
            placeholder="e.g. Panvel RTO, Walayar Border, NH48 Toll" 
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="bg-white border-slate-200 text-xs h-10 rounded-lg"
          />
        </div>

        {/* 3. Demanded Papers (Quick Toggle Pills) */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
            3. Documents Demanded by Officers
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_DOCS.map((doc) => {
              const selected = selectedDocs.includes(doc);
              return (
                <button
                  key={doc}
                  type="button"
                  onClick={() => toggleDoc(doc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    selected 
                      ? "bg-[#cca25a] text-white border-[#cca25a]" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {selected ? `✓ ${doc}` : `+ ${doc}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Fine / Challan Amount if detention */}
        {selectedType === "detention" && (
          <div className="space-y-1.5 bg-red-50/70 border border-red-200 rounded-xl p-3.5">
            <label className="text-xs font-bold text-red-800 block">
              Fine / Demand Amount (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">₹</span>
              <Input 
                type="number"
                placeholder="5000"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                className="pl-7 bg-white border-red-200 text-xs h-10 rounded-lg font-mono font-bold"
              />
            </div>
          </div>
        )}

        {/* 5. Photo Snap of Challan / Slip */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
            4. Photo of Challan / RTO Slip (Optional)
          </label>
          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-colors">
            {photoPreview ? (
              <div className="space-y-2 text-center">
                <img src={photoPreview} alt="Receipt preview" className="max-h-36 rounded-lg object-contain mx-auto" />
                <span className="text-xs text-emerald-700 font-semibold block">✓ Photo Attached</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-600">
                <Camera className="h-5 w-5 text-[#cca25a]" />
                <span className="text-xs font-semibold">Take Photo with Camera</span>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>

        {/* 6. Quick Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            5. Additional Note
          </label>
          <Textarea 
            placeholder="e.g. Officer asking for Part-B renewal, truck parked on siding"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="bg-white border-slate-200 text-xs rounded-lg resize-none"
          />
        </div>

        {/* Big Submit Button */}
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
          className="btn-primary-blue w-full h-12 rounded-xl text-sm font-bold shadow-md text-white flex items-center justify-center gap-2"
        >
          {submitMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Dispatching Alert…</>
          ) : (
            <><Send className="h-4 w-4" /> Send Alert to Fleet Dispatch</>
          )}
        </Button>
      </div>
    </div>
  );
}
