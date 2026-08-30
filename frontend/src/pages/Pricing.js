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
  free: "#94a3b8", 
  growth: "#38bdf8", 
  pro: "#f59e0b" 
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 relative overflow-hidden aurora-bg">
      <div className="cyber-orb-1" />
      <div className="cyber-orb-2" />

      <header className="border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-xl px-4 py-4 sm:px-8 relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={() => navigate(user ? "/dashboard" : "/")} className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">TruckShield AI</span>
          </button>
          {user ? (
            <Button variant="outline" className="border-white/[0.1] hover:bg-white/[0.05] text-xs font-semibold text-white rounded-xl" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
            </Button>
          ) : (
            <Button className="btn-cyber-cyan font-bold text-xs rounded-xl" onClick={() => navigate("/login")}>Sign in</Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-4 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Scalable Fleet Intelligence
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Transparent, Enterprise Tiers
          </h1>
          <p className="mt-4 text-base text-slate-400">
            Full pre-dispatch intelligence, live OSRM distance engine, and verified statutory checks. Upgrade or cancel anytime.
          </p>
        </div>

        {isLoading ? (
          <div className="mx-auto mt-12 max-w-md"><LoadingState label="Loading subscription tiers…" /></div>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-3 items-stretch">
            {data?.plans?.map((p) => {
              const isCurrent = currentPlan === p.tier;
              const highlight = p.tier === "growth";
              return (
                <Card 
                  key={p.tier} 
                  data-testid={`pricing-card-${p.tier}`}
                  className={`rich-card relative flex flex-col p-7 transition-all duration-300 ${
                    highlight 
                      ? "border-sky-500/50 shadow-2xl shadow-sky-500/20 bg-gradient-to-b from-[#111827] to-[#0b0f19]" 
                      : "bg-[#0b0f19]"
                  }`}
                  style={{ borderTop: `4px solid ${TIER_ACCENT[p.tier]}` }}
                >
                  {highlight && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                      Most Popular
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-extrabold text-white">{p.name}</div>
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ 
                        backgroundColor: TIER_ACCENT[p.tier],
                        boxShadow: `0 0 10px ${TIER_ACCENT[p.tier]}` 
                      }} 
                    />
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5 border-b border-white/[0.08] pb-5">
                    <span className="font-mono text-4xl font-extrabold text-white">{p.price_label}</span>
                    <span className="text-xs font-semibold text-slate-400">/month</span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0 border border-emerald-500/30">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`mt-8 w-full font-bold rounded-xl h-11 text-xs ${
                      isCurrent 
                        ? "border border-white/[0.1] bg-white/[0.04] text-slate-400 hover:bg-white/[0.04] cursor-default" 
                        : highlight 
                          ? "btn-cyber-cyan text-white" 
                          : "btn-cyber-amber text-slate-900"
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

        <div className="mt-12 text-center text-xs text-slate-500 max-w-xl mx-auto border-t border-white/[0.08] pt-6">
          Payments processed securely via Razorpay. TruckShield provides informational
          compliance pre-checks and risk signals — not legal advice.
        </div>
      </div>
    </div>
  );
}
