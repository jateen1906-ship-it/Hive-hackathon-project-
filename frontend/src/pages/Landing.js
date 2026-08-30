import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  Route, 
  Gauge, 
  ClipboardCheck, 
  FileSearch, 
  MapPin, 
  AlertTriangle,
  FileText,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Zap,
  Activity,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/riskMeta";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-sky-500 selection:text-white relative overflow-hidden aurora-bg">
      {/* Floating Ambient Orbs */}
      <div className="cyber-orb-1" />
      <div className="cyber-orb-2" />
      <div className="cyber-orb-3" />

      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-xl px-4 py-4 sm:px-8 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white">TruckShield AI</div>
              <div className="text-[10px] uppercase tracking-widest bg-gradient-to-r from-sky-400 to-amber-300 bg-clip-text text-transparent font-bold">
                Compliance Telemetry
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/login")} 
              data-testid="landing-login"
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate("/pricing")} 
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors hidden sm:block"
            >
              Pricing
            </button>
            <Button 
              onClick={() => navigate("/register")} 
              data-testid="landing-register"
              className="btn-cyber-cyan font-bold text-xs rounded-xl h-10 px-5 shadow-lg"
            >
              Launch Console <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 border-b border-white/[0.08] z-10">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-extrabold mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" /> Pre-Dispatch Risk Engine for Indian Freight
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.1]">
              Plan The Route.<br />
              <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                Clear The Risk.
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed font-medium">
              Automated statutory E-Way checks, OCR optical verification, corridor intelligence, and explainable multi-factor scoring for fleet operators across India.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => navigate("/register")}
                data-testid="landing-cta-analyze"
                className="btn-cyber-cyan font-extrabold rounded-2xl h-13 px-8 text-sm shadow-2xl flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Launch Workspace <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-white/[0.12] hover:bg-white/[0.05] text-white font-bold rounded-2xl h-13 px-7 text-sm bg-white/[0.02]"
              >
                Use Demo Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 Step Flow */}
      <section className="py-20 border-b border-white/[0.08] bg-[#07090e]/60 z-10 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
              Deterministic Intelligence
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              From consignment entry to road-ready in 3 steps
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rich-card p-8 bg-[#0b101d] border-white/[0.08] hover:border-sky-500/40">
              <div className="text-4xl font-extrabold font-mono text-sky-400/40">01</div>
              <h3 className="mt-4 text-lg font-bold text-white">Input Trip & Consignment</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Declare origin, destination, invoice value, carrier registration, and cargo nature.
              </p>
            </div>

            <div className="rich-card p-8 bg-[#0b101d] border-white/[0.08] hover:border-sky-500/40">
              <div className="text-4xl font-extrabold font-mono text-sky-400/40">02</div>
              <h3 className="mt-4 text-lg font-bold text-white">Optical OCR Verification</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Upload tax invoices and E-Way bills for instant optical field extraction and statutory rule matching.
              </p>
            </div>

            <div className="rich-card p-8 bg-[#0b101d] border-white/[0.08] hover:border-sky-500/40">
              <div className="text-4xl font-extrabold font-mono text-sky-400/40">03</div>
              <h3 className="mt-4 text-lg font-bold text-white">Explainable Risk Score</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Receive factor-by-factor risk signals, live OSRM routing checks, and actionable driver checklists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 z-10 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
              Core Capabilities
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Engineered for real-world transport
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rich-card p-7 border-white/[0.08]">
              <Route className="h-6 w-6 text-sky-400 mb-3" />
              <h3 className="text-base font-bold text-white">Live OSRM Distance Engine</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Flags discrepancy between declared E-Way bill distance and actual highway routing.
              </p>
            </div>

            <div className="rich-card p-7 border-white/[0.08]">
              <FileSearch className="h-6 w-6 text-indigo-400 mb-3" />
              <h3 className="text-base font-bold text-white">Multi-Page PDF & Image OCR</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Extracts GSTIN, vehicle number, invoice value, and validity dates automatically.
              </p>
            </div>

            <div className="rich-card p-7 border-white/[0.08]">
              <MapPin className="h-6 w-6 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white">Corridor Incident Heatmaps</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Visualizes highway checkposts, past inspection patterns, and high-frequency stops.
              </p>
            </div>

            <div className="rich-card p-7 border-white/[0.08]">
              <AlertTriangle className="h-6 w-6 text-amber-400 mb-3" />
              <h3 className="text-base font-bold text-white">Hazchem & Cold-Chain Rules</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Criticality escalation when dangerous or temperature-sensitive goods lack certified carrier bodies.
              </p>
            </div>

            <div className="rich-card p-7 border-white/[0.08]">
              <Gauge className="h-6 w-6 text-sky-400 mb-3" />
              <h3 className="text-base font-bold text-white">Shareable Public Links</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Export branded PDF reports or generate read-only links for brokers and consignees.
              </p>
            </div>

            <div className="rich-card p-7 border-white/[0.08]">
              <Zap className="h-6 w-6 text-amber-400 mb-3" />
              <h3 className="text-base font-bold text-white">Developer API Access</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Integrate TruckShield directly into your existing ERP or TMS with secure API keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#05070c] py-12 text-slate-500 z-10 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
              <span className="font-bold text-white text-sm">TruckShield AI Compliance Intel</span>
            </div>
            <div className="text-xs text-slate-400">
              Demo credentials: <code className="rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 text-sky-300 font-mono">demo@truckshield.app</code> / <code className="rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 text-sky-300 font-mono">Demo@12345</code>
            </div>
          </div>
          <p className="mt-6 text-[11px] text-slate-500 max-w-3xl leading-relaxed">
            {DISCLAIMER}
          </p>
        </div>
      </footer>
    </div>
  );
}
