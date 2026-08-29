import React from "react";
import { ShieldCheck, Building2, Mail, Cpu } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="w-32 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const isDemo = user?.email === "demo@truckshield.app";
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Your account and product information." />
      <Card className="divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-semibold">Profile</h2>
          {isDemo && <SyntheticBadge />}
        </div>
        <Row icon={Mail} label="Email" value={user?.email} />
        <Row icon={Building2} label="Company" value={user?.company_name} />
        <Row icon={ShieldCheck} label="Role" value={user?.role} />
      </Card>

      <Card className="mt-5 divide-y divide-border">
        <div className="p-4"><h2 className="text-sm font-semibold">About the risk engine</h2></div>
        <Row icon={Cpu} label="Engine" value="risk-engine-1.0 (deterministic)" />
        <div className="px-4 py-3 text-sm text-muted-foreground">
          Route/distance estimates use a demonstration provider and corridor intelligence is
          synthetic — clearly labelled and not derived from live enforcement activity.
        </div>
      </Card>

      <div className="mt-5"><Disclaimer /></div>
    </div>
  );
}
