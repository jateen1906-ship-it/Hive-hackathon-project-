import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Building2, Mail, Phone, Cpu, CreditCard, KeyRound, Copy, Loader2, Trash2, Pencil, Check, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useBilling } from "@/hooks/useBilling";
import { BillingAPI, AuthAPI } from "@/lib/apiClient";
import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { fmtDate } from "@/lib/riskMeta";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon className="h-4 w-4 text-orange-400" />
      <span className="w-32 text-xs text-[#9e958d]">{label}</span>
      <span className="text-xs font-semibold text-white">{value || "—"}</span>
    </div>
  );
}

function ProfileEdit({ user, isDemo }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", company_name: "", phone: "" });

  const startEdit = () => {
    setForm({
      full_name: user?.full_name || "",
      company_name: user?.company_name || "",
      phone: user?.phone || "",
    });
    setEditing(true);
  };

  const save = useMutation({
    mutationFn: () => AuthAPI.updateMe(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      window.location.reload();
    },
    onError: (e) => toast.error(e.message || "Failed to save profile"),
  });

  return (
    <Card className="alvero-card divide-y divide-white/[0.04] border-white/[0.08]">
      <div className="flex items-center justify-between p-5 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Operator Profile</h2>
          {isDemo && <SyntheticBadge />}
        </div>
        {!isDemo && (
          editing ? (
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending} className="btn-sunset-orange text-xs h-7">
                {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" />Save</>}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={save.isPending} className="h-7 text-[#a8a29e] hover:text-white">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit} className="border-white/[0.08] hover:bg-white/[0.04] text-xs h-7 text-[#d6d3d1]">
              <Pencil className="mr-1.5 h-3 w-3" />Edit Profile
            </Button>
          )
        )}
      </div>
      <div className="flex items-center gap-3 px-5 py-3.5">
        <Mail className="h-4 w-4 text-orange-400" />
        <span className="w-32 text-xs text-[#9e958d]">Email Address</span>
        <span className="text-xs font-mono font-semibold text-white">{user?.email || "—"}</span>
      </div>
      {editing ? (
        <div className="space-y-3.5 p-5">
          <div>
            <label className="text-xs text-[#9e958d]">Full Name</label>
            <Input className="mt-1 bg-[#12100e] border-white/[0.08] text-white text-xs" value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#9e958d]">Fleet / Company</label>
            <Input className="mt-1 bg-[#12100e] border-white/[0.08] text-white text-xs" value={form.company_name}
              onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#9e958d]">Phone Contact</label>
            <Input className="mt-1 bg-[#12100e] border-white/[0.08] text-white text-xs" value={form.phone} type="tel"
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>
      ) : (
        <>
          <Row icon={ShieldCheck} label="Full Name" value={user?.full_name} />
          <Row icon={Building2} label="Fleet / Company" value={user?.company_name} />
          <Row icon={Phone} label="Phone Contact" value={user?.phone} />
          <Row icon={ShieldCheck} label="Account Role" value={user?.role} />
        </>
      )}
    </Card>
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
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Workspace Settings" subtitle="Account credentials, plan subscriptions, and API tokens." />

      {/* Billing */}
      <Card className="alvero-card border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-orange-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Subscription & Entitlements</h2>
          </div>
          {ent && (
            <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-xs font-bold text-orange-400" data-testid="settings-current-plan">
              {PLAN_LABEL[ent.plan]} · {ent.status?.toUpperCase()}
            </span>
          )}
        </div>
        {billing.isLoading ? <div className="p-6 text-xs text-[#9e958d]">Loading plan parameters…</div> : ent && (
          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <div className="text-[11px] text-[#9e958d]">Monthly Checks</div>
                <div className="font-mono text-lg font-bold text-white mt-0.5">{ent.usage.checks_used}{ent.usage.checks_limit != null ? ` / ${ent.usage.checks_limit}` : " (unlimited)"}</div>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <div className="text-[11px] text-[#9e958d]">Active Share Links</div>
                <div className="font-mono text-lg font-bold text-white mt-0.5">{ent.usage.active_share_links}{ent.usage.share_link_limit != null ? ` / ${ent.usage.share_link_limit}` : " (unlimited)"}</div>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <div className="text-[11px] text-[#9e958d]">Renewal Cycle</div>
                <div className="text-xs font-semibold text-white mt-1.5">{ent.current_period_end ? fmtDate(ent.current_period_end) : "Permanent Active"}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button onClick={() => navigate("/pricing")} data-testid="settings-upgrade" className="btn-sunset-orange font-semibold text-xs rounded-xl">
                {ent.plan === "pro" ? "View Tiers" : "Upgrade Plan"}
              </Button>
              {ent.plan !== "free" && (
                <Button variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending} data-testid="settings-cancel-plan" className="border-white/[0.08] hover:bg-white/[0.04] text-xs font-semibold text-rose-400 hover:text-rose-300">
                  {cancel.isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Cancelling…</> : "Cancel subscription"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* API keys (Pro) */}
      {billing.can.apiAccess && <ApiKeys />}

      {/* Profile */}
      <ProfileEdit user={user} isDemo={isDemo} />

      <Card className="alvero-card divide-y divide-white/[0.04] border-white/[0.08]">
        <div className="p-5"><h2 className="text-xs font-bold uppercase tracking-wider text-white">Risk Engine Core</h2></div>
        <Row icon={Cpu} label="Core Version" value="risk-engine-core-v2.2 (explainable)" />
        <div className="px-5 py-3.5 text-xs text-[#9e958d] leading-relaxed">
          Route & distance matrix connects to live OSRM highway routing. Corridor intelligence calculates synthetic checkpost signals.
        </div>
      </Card>

      <Disclaimer />
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
    <Card className="alvero-card border-white/[0.08]">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-5 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-orange-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Developer API Access (Pro)</h2>
        </div>
        <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending} data-testid="settings-create-apikey" className="btn-sunset-orange font-semibold text-xs h-8">
          {create.isPending ? "Generating…" : "Generate Key"}
        </Button>
      </div>
      <div className="p-5">
        {newKey && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <div className="text-xs font-bold text-emerald-400">Copy this API token now — it will not be displayed again.</div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-[#12100e] border border-white/[0.08] px-2.5 py-1.5 text-xs text-emerald-300 font-mono">{newKey}</code>
              <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("API key copied"); }} className="h-8 w-8 border-white/[0.08]"><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
        {(keys || []).length === 0 ? <p className="text-xs text-[#9e958d]">No developer API tokens active.</p> : (
          <div className="divide-y divide-white/[0.04]">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between py-2.5 text-xs">
                <span className="font-mono text-white">{k.key_prefix}•••••••••••• {k.revoked && <span className="text-rose-400 font-sans">(revoked)</span>}</span>
                {!k.revoked && <Button size="icon" variant="ghost" onClick={() => revoke.mutate(k.id)} className="h-7 w-7 text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
