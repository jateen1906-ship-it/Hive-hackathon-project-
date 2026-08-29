import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, FileSearch, Route, ClipboardCheck, ArrowRight, Gauge, MapPin, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DISCLAIMER } from "@/lib/riskMeta";
import { SyntheticBadge } from "@/components/common/Disclaimer";
import { RiskGauge } from "@/components/common/RiskGauge";

const STEPS = [
  { icon: Route, title: "Enter the trip", desc: "Origin, destination, vehicle, goods, invoice value and declared distance." },
  { icon: Gauge, title: "Analyze risk", desc: "A deterministic engine scores five factors and explains each one." },
  { icon: ClipboardCheck, title: "Act before dispatch", desc: "Review potential issues and recommended actions like a pre-departure check." },
];

const CHECKS = [
  { icon: Route, title: "Route & corridor risk", desc: "Signals from demonstration corridor intelligence." },
  { icon: MapPin, title: "Distance anomaly", desc: "Declared vs estimated route distance." },
  { icon: FileSearch, title: "Document pre-check", desc: "AI extraction of invoice / e-way bill fields." },
  { icon: AlertTriangle, title: "Incident history", desc: "Your own reported stops feed corridor intelligence." },
];

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="ts-hero-gradient relative overflow-hidden">
        <div className="ts-grid-lines absolute inset-0 opacity-60" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20">
                <ShieldCheck className="h-5 w-5 text-sky-300" />
              </div>
              <span className="text-lg font-bold text-white">TruckShield</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-slate-200 hover:bg-white/10 hover:text-white"
                      onClick={() => navigate("/login")} data-testid="landing-login">Sign in</Button>
              <Button onClick={() => navigate("/register")} data-testid="landing-register"
                      className="bg-white text-slate-900 hover:bg-slate-100">Get started</Button>
            </div>
          </header>

          <div className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">
                Built for Indian road-freight dispatch
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Catch compliance risks <span className="text-sky-300">before</span> the truck rolls out.
              </h1>
              <p className="mt-5 max-w-xl text-base text-slate-300">
                TruckShield turns a trip's details and documents into an explainable
                compliance-risk score — with the factors, potential issues and recommended
                actions laid out like a pre-departure inspection report.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => navigate("/register")} data-testid="landing-cta-analyze"
                        className="bg-sky-500 text-white hover:bg-sky-400">
                  Analyze a trip <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/login")}
                        className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  Sign in
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Explainable factors", "OCR pre-check", "Dispatch-ready checklist"].map((t) => (
                  <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">{t}</span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <Card className="mx-auto max-w-md p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">Sample risk report</div>
                  <SyntheticBadge />
                </div>
                <div className="mb-1 text-xs text-muted-foreground">Surat → Indore · Container Truck</div>
                <div className="flex justify-center"><RiskGauge score={59} level="MEDIUM" size={240} /></div>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center gap-2 rounded-lg border-l-4 bg-secondary/50 px-3 py-2" style={{ borderLeftColor: "hsl(var(--risk-high))" }}>
                    <span className="text-muted-foreground">Distance anomaly: declared below estimated route.</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border-l-4 bg-secondary/50 px-3 py-2" style={{ borderLeftColor: "hsl(var(--risk-low))" }}>
                    <span className="text-muted-foreground">Vehicle number format valid.</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">How it works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={i} className="p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <s.icon className="h-5 w-5 text-slate-700" />
              </div>
              <div className="text-base font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* What we check */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">What we check</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CHECKS.map((c, i) => (
              <Card key={i} className="p-5">
                <c.icon className="mb-3 h-5 w-5 text-slate-700" />
                <div className="text-sm font-semibold">{c.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-700" />
            <span className="font-semibold">TruckShield</span>
          </div>
          <p className="mt-4 max-w-3xl text-xs text-muted-foreground">{DISCLAIMER}</p>
          <p className="mt-2 text-xs text-muted-foreground">Demonstration data shown in the product is synthetic and not derived from live enforcement activity.</p>
        </div>
      </footer>
    </div>
  );
}
