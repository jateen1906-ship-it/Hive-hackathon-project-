import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BillingAPI } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useBilling, startCheckout } from "@/hooks/useBilling";
import { LoadingState } from "@/components/common/StateViews";

const TIER_ACCENT = { 
  free: "#64748b", 
  growth: "#0284c7", 
  pro: "#0f172a" 
};

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={() => navigate(user ? "/dashboard" : "/")} className="flex items-center gap-2.5 text-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">TruckShield</span>
          </button>
          {user ? (
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-xs font-semibold" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
            </Button>
          ) : (
            <Button className="btn-executive-primary font-semibold text-xs" onClick={() => navigate("/login")}>Sign in</Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Simple, Transparent Pricing
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Choose the right tier for your fleet
          </h1>
          <p className="mt-4 text-base text-slate-500">
            Full pre-dispatch intelligence, live OSRM distance engine, and verified statutory checks. Upgrade or cancel anytime.
          </p>
        </div>

        {isLoading ? (
          <div className="mx-auto mt-12 max-w-md"><LoadingState label="Loading available tiers…" /></div>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-3 items-stretch">
            {data?.plans?.map((p) => {
              const isCurrent = currentPlan === p.tier;
              const highlight = p.tier === "growth";
              return (
                <Card 
                  key={p.tier} 
                  data-testid={`pricing-card-${p.tier}`}
                  className={`executive-card relative flex flex-col p-7 transition-all duration-200 ${
                    highlight 
                      ? "ring-2 ring-sky-600 shadow-md bg-white" 
                      : "bg-white"
                  }`}
                  style={{ borderTop: `4px solid ${TIER_ACCENT[p.tier]}` }}
                >
                  {highlight && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-3.5 py-0.5 text-xs font-bold text-white shadow-xs">
                      Most Popular
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-slate-900">{p.name}</div>
                    <div 
                      className="h-2.5 w-2.5 rounded-full" 
                      style={{ backgroundColor: TIER_ACCENT[p.tier] }} 
                    />
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5 border-b border-slate-100 pb-5">
                    <span className="font-mono text-4xl font-extrabold text-slate-900">{p.price_label}</span>
                    <span className="text-sm font-medium text-slate-500">/month</span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <div className="h-4 w-4 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mt-0.5 shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`mt-8 w-full font-semibold rounded-lg h-10 ${
                      isCurrent 
                        ? "border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-100 cursor-default" 
                        : highlight 
                          ? "btn-executive-blue text-white" 
                          : "btn-executive-primary text-white"
                    }`}
                    disabled={isCurrent || busy === p.tier} 
                    onClick={() => choose(p.tier)}
                    data-testid={`pricing-cta-${p.tier}`}
                  >
                    {busy === p.tier ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Initiating…</>
                    ) : isCurrent ? (
                      "Current active plan"
                    ) : p.tier === "free" ? (
                      "Get started free"
                    ) : (
                      `Upgrade to ${p.name}`
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center text-xs text-slate-500 max-w-xl mx-auto border-t border-slate-200/80 pt-6">
          Payments processed securely via Razorpay. TruckShield provides informational
          compliance pre-checks and risk signals — not legal advice.
        </div>
      </div>
    </div>
  );
}
