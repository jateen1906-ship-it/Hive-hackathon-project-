import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Building2, Mail, Cpu, CreditCard, KeyRound, Copy, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useBilling } from "@/hooks/useBilling";
import { BillingAPI } from "@/lib/apiClient";
import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { fmtDate } from "@/lib/riskMeta";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="w-32 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

const PLAN_LABEL = { free: "Free", growth: "Growth", pro: "Pro" };

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isDemo = user?.email === "demo@truckshield.app";
  const billing = useBilling();
  const ent = billing.entitlement;

  const cancel = useMutation({
    mutationFn: BillingAPI.cancel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing-me"] }); toast.success("Plan cancelled — moved to Free"); },
    onError: (e) => toast.error(e.message || "Cancel failed"),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Your account, plan and billing." />

      {/* Billing */}
      <Card className="mb-5">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-slate-600" /><h2 className="text-sm font-semibold">Plan & Billing</h2></div>
          {ent && <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold" data-testid="settings-current-plan">{PLAN_LABEL[ent.plan]} · {ent.status}</span>}
        </div>
        {billing.isLoading ? <div className="p-4 text-sm text-muted-foreground">Loading…</div> : ent && (
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div><div className="text-xs text-muted-foreground">Checks this month</div>
                <div className="font-mono text-lg">{ent.usage.checks_used}{ent.usage.checks_limit != null ? ` / ${ent.usage.checks_limit}` : " (unlimited)"}</div></div>
              <div><div className="text-xs text-muted-foreground">Active share links</div>
                <div className="font-mono text-lg">{ent.usage.active_share_links}{ent.usage.share_link_limit != null ? ` / ${ent.usage.share_link_limit}` : " (unlimited)"}</div></div>
              <div><div className="text-xs text-muted-foreground">Renews</div>
                <div className="text-sm">{ent.current_period_end ? fmtDate(ent.current_period_end) : "—"}</div></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate("/pricing")} data-testid="settings-upgrade">{ent.plan === "pro" ? "View plans" : "Upgrade"}</Button>
              {ent.plan !== "free" && (
                <Button variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending} data-testid="settings-cancel-plan">
                  {cancel.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling…</> : "Cancel plan"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* API keys (Pro) */}
      {billing.can.apiAccess && <ApiKeys />}

      {/* Profile */}
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
          Route/distance uses a live provider (OSRM) on paid plans, or a labelled "Estimated" demo
          provider on Free. Corridor intelligence is synthetic and clearly labelled.
        </div>
      </Card>

      <div className="mt-5"><Disclaimer /></div>
    </div>
  );
}

function ApiKeys() {
  const qc = useQueryClient();
  const { data: keys } = useQuery({ queryKey: ["api-keys"], queryFn: BillingAPI.listKeys });
  const [newKey, setNewKey] = useState(null);
  const create = useMutation({
    mutationFn: () => BillingAPI.createKey("Pro API key"),
    onSuccess: (d) => { setNewKey(d.api_key); qc.invalidateQueries({ queryKey: ["api-keys"] }); },
    onError: (e) => toast.error(e.message || "Could not create key"),
  });
  const revoke = useMutation({
    mutationFn: (id) => BillingAPI.revokeKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  return (
    <Card className="mb-5">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-slate-600" /><h2 className="text-sm font-semibold">API Access (Pro)</h2></div>
        <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending} data-testid="settings-create-apikey">
          {create.isPending ? "Generating…" : "Generate key"}
        </Button>
      </div>
      <div className="p-4">
        {newKey && (
          <div className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3">
            <div className="text-xs font-medium text-emerald-800">Copy this key now — it won't be shown again.</div>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs">{newKey}</code>
              <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied"); }}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
        {(keys || []).length === 0 ? <p className="text-sm text-muted-foreground">No API keys yet.</p> : (
          <div className="divide-y divide-border">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono">{k.key_prefix}••• {k.revoked && <span className="text-red-600">(revoked)</span>}</span>
                {!k.revoked && <Button size="icon" variant="ghost" onClick={() => revoke.mutate(k.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
