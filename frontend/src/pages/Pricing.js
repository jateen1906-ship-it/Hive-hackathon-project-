import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BillingAPI } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useBilling, startCheckout } from "@/hooks/useBilling";
import { LoadingState } from "@/components/common/StateViews";

const TIER_ACCENT = { free: "hsl(215 16% 47%)", growth: "hsl(199 89% 48%)", pro: "hsl(222 47% 30%)" };

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["public-plans"], queryFn: BillingAPI.plans });
  const billing = useBilling();
  const currentPlan = billing.plan;
  const [busy, setBusy] = React.useState(null);

  const choose = async (tier) => {
    if (!user) { navigate("/login"); return; }
    if (tier === "free") { navigate("/settings"); return; }
    setBusy(tier);
    await startCheckout({ tier, user, onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing-me"] });
      navigate("/dashboard");
    }});
    setBusy(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="ts-hero-gradient px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={() => navigate(user ? "/dashboard" : "/")} className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-5 w-5 text-sky-300" /><span className="font-bold">TruckShield</span>
          </button>
          {user ? <Button variant="ghost" className="text-slate-200 hover:bg-white/10" onClick={() => navigate("/dashboard")}>Dashboard</Button>
                : <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => navigate("/login")}>Sign in</Button>}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple, transparent pricing</h1>
          <p className="mt-2 text-muted-foreground">Choose the plan that fits your fleet. Upgrade or cancel anytime.</p>
        </div>

        {isLoading ? <div className="mx-auto mt-10 max-w-md"><LoadingState label="Loading plans…" /></div> : (
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {data?.plans?.map((p) => {
              const isCurrent = currentPlan === p.tier;
              const highlight = p.tier === "growth";
              return (
                <Card key={p.tier} data-testid={`pricing-card-${p.tier}`}
                      className={`relative flex flex-col p-6 ${highlight ? "ring-2 ring-sky-500" : ""}`}
                      style={{ borderTop: `4px solid ${TIER_ACCENT[p.tier]}` }}>
                  {highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-3 py-0.5 text-xs font-semibold text-white">Popular</span>}
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="font-mono text-3xl font-bold">{p.price_label}</span>
                    <span className="mb-1 text-sm text-muted-foreground">/month</span>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" variant={isCurrent ? "outline" : highlight ? "default" : "outline"}
                          disabled={isCurrent || busy === p.tier} onClick={() => choose(p.tier)}
                          data-testid={`pricing-cta-${p.tier}`}>
                    {busy === p.tier ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting…</>
                      : isCurrent ? "Current plan" : p.tier === "free" ? "Get started" : `Upgrade to ${p.name}`}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Payments processed securely by Razorpay (test mode). TruckShield provides informational
          compliance pre-checks and risk signals — not legal advice.
        </p>
      </div>
    </div>
  );
}
