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
  free: "#7d656c", 
  growth: "#f46a85", 
  pro: "#591929" 
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
    <div className="min-h-screen bg-[#fff8f9] text-[#26161b]">
      <header className="border-b border-[#f2c7c7] bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button onClick={() => navigate(user ? "/dashboard" : "/")} className="flex items-center gap-2.5 text-[#26161b]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f46a85] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">TruckShield</span>
          </button>
          {user ? (
            <Button variant="outline" className="border-[#f2c7c7] hover:bg-[#fff0f3] text-xs font-semibold h-8.5" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
            </Button>
          ) : (
            <Button className="btn-primary-blue text-xs font-semibold h-8.5 px-4" onClick={() => navigate("/login")}>Sign in</Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffebf0] border border-[#f2c7c7] text-[#c93252] text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Simple, Transparent Pricing
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#26161b] sm:text-5xl">
            Choose the right tier for your fleet
          </h1>
          <p className="mt-4 text-base text-[#6b4f57]">
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
                  className={`relative flex flex-col p-7 transition-shadow bg-white border-[#f2c7c7] ${
                    highlight 
                      ? "ring-2 ring-[#f46a85] shadow-md" 
                      : "shadow-2xs"
                  }`}
                  style={{ borderTop: `4px solid ${TIER_ACCENT[p.tier]}` }}
                >
                  {highlight && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#f46a85] px-3.5 py-0.5 text-xs font-bold text-white shadow-xs">
                      Most Popular
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-[#26161b]">{p.name}</div>
                    <div 
                      className="h-2.5 w-2.5 rounded-full" 
                      style={{ backgroundColor: TIER_ACCENT[p.tier] }} 
                    />
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5 border-b border-[#f8e5e8] pb-5">
                    <span className="font-mono text-4xl font-extrabold text-[#26161b]">{p.price_label}</span>
                    <span className="text-sm font-medium text-[#916b75]">/month</span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#26161b]">
                        <div className="h-4 w-4 rounded-full bg-[#d5f3d8] flex items-center justify-center text-[#17421f] mt-0.5 shrink-0 border border-[#bceac1]">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`mt-8 w-full font-semibold rounded-lg h-10 ${
                      isCurrent 
                        ? "border border-[#f2c7c7] bg-[#faf0f2] text-[#7d656c] hover:bg-[#faf0f2] cursor-default" 
                        : highlight 
                          ? "btn-primary-blue text-white" 
                          : "bg-[#26161b] text-white hover:bg-[#380d17]"
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

        <div className="mt-12 text-center text-xs text-[#916b75] max-w-xl mx-auto border-t border-[#f2c7c7] pt-6">
          Payments processed securely via Razorpay. TruckShield provides informational
          compliance pre-checks and risk signals — not legal advice.
        </div>
      </div>
    </div>
  );
}
