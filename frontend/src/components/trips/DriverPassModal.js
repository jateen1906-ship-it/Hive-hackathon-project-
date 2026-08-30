import React, { useState } from "react";
import { toast } from "sonner";
import { QrCode, Copy, Check, ExternalLink, Smartphone, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DriverPassModal({ trip }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!trip?.id) return null;

  const driverUrl = `${window.location.origin}/driver/sos/${trip.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(driverUrl)}&margin=10`;

  const copyLink = () => {
    const text = `TruckShield Driver Fast-Pass for ${trip.vehicle_number || "Truck"} (${trip.origin} → ${trip.destination}): ${driverUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Driver Fast-Pass link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = `TruckShield Driver Fast-Pass for ${trip.vehicle_number || "Truck"} (${trip.origin} → ${trip.destination}):\n${driverUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const printPass = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Driver Dispatch Slip - ${trip.vehicle_number || "TruckShield"}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; text-align: center; color: #0f172a; }
            .card { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; max-width: 400px; margin: auto; }
            .logo { font-weight: bold; font-size: 20px; color: #b88e44; margin-bottom: 4px; }
            .truck { font-size: 24px; font-weight: 800; font-family: monospace; letter-spacing: 2px; margin: 12px 0 6px; }
            .route { font-size: 16px; font-weight: bold; color: #475569; margin-bottom: 16px; }
            .qr { width: 200px; height: 200px; margin: 12px auto; display: block; }
            .instructions { font-size: 12px; color: #64748b; margin-top: 12px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">TruckShield Fleet Dispatch</div>
            <div style="font-size: 12px; text-transform: uppercase; color: #64748b;">Driver Fast-Pass Slip</div>
            <div class="truck">${trip.vehicle_number || "DECLARED VEHICLE"}</div>
            <div class="route">${trip.origin} → ${trip.destination}</div>
            <img class="qr" src="${qrUrl}" alt="Driver QR" />
            <div class="instructions">
              <strong>Scan with Phone Camera if stopped by RTO/Checkpost.</strong><br />
              1-Tap GPS & Instant Memo Capture (No App or Login Needed).
            </div>
          </div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          data-testid="trip-driver-qr-btn"
          className="border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 h-8 flex items-center gap-1.5"
        >
          <QrCode className="h-3.5 w-3.5 text-[#cca25a]" />
          <span>Driver Fast-Pass QR</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#cca25a]" />
            Driver 1-Tap Fast-Pass & SOS
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-slate-500 leading-relaxed">
          The driver can scan this QR code or click the SMS/WhatsApp link on their phone to report checkposts, fines, or breakdowns with <strong>zero login or app required</strong>.
        </p>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-slate-200 bg-slate-50/60 my-2">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <img 
              src={qrUrl} 
              alt="Driver Fast-Pass QR" 
              className="w-44 h-44 object-contain rounded"
            />
          </div>
          <div className="mt-3 text-center">
            <div className="font-mono text-sm font-bold text-slate-900">
              {trip.vehicle_number || "Assigned Vehicle"}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {trip.origin} → {trip.destination}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Button 
            onClick={copyLink} 
            variant="outline" 
            className="text-xs border-slate-200 text-slate-700 h-9 font-semibold flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Link Copied!" : "Copy SMS Link"}</span>
          </Button>

          <Button 
            onClick={shareWhatsApp} 
            className="btn-primary-blue text-xs h-9 font-semibold flex items-center justify-center gap-1.5 text-white"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Send on WhatsApp</span>
          </Button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <button 
            onClick={printPass}
            className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" /> Print Dispatch Slip
          </button>
          <a 
            href={driverUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#8a6522] hover:underline font-semibold flex items-center gap-1"
          >
            Preview Mobile View <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
