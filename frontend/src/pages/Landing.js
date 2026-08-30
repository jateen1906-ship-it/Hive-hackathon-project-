import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  ArrowRight, 
  Route, 
  Gauge, 
  FileSearch, 
  MapPin, 
  AlertTriangle,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/riskMeta";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#cca25a] text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900">TruckShield</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Compliance Intel</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/login")} 
              data-testid="landing-login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate("/pricing")} 
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              Pricing
            </button>
            <Button 
              onClick={() => navigate("/register")} 
              data-testid="landing-register"
              className="btn-primary-blue font-semibold text-xs rounded-lg h-9 px-4 shadow-2xs"
            >
              Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fef9ee] border border-[#cca25a]/30 text-[#8a6522] text-xs font-bold mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[#cca25a]" /> Pre-Dispatch Risk Engine for Indian Freight
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-[1.1]">
            Plan The Route.<br />
            <span className="text-[#cca25a]">
              Clear The Risk.
            </span>
          </h1>
          
          <p className="mt-6 max-w-2xl mx-auto text-base text-slate-600 sm:text-lg leading-relaxed font-medium">
            Automated statutory E-Way checks, OCR optical verification, corridor intelligence, and explainable multi-factor scoring for fleet operators across India.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => navigate("/register")}
              data-testid="landing-cta-analyze"
              className="btn-primary-blue font-bold rounded-xl h-12 px-8 text-sm shadow-sm"
            >
              Launch Workspace <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl h-12 px-6 text-sm bg-white"
            >
              Use Demo Account
            </Button>
          </div>
        </div>
      </section>

      {/* 3 Step Flow */}
      <section className="py-20 border-b border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#cca25a]">
              Deterministic Intelligence
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              From consignment entry to road-ready in 3 steps
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#cca25a]/40">01</div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Input Trip & Consignment</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Declare origin, destination, invoice value, carrier registration, and cargo nature.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#cca25a]/40">02</div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Optical OCR Verification</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Upload tax invoices and E-Way bills for instant optical field extraction and statutory rule matching.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#cca25a]/40">03</div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Explainable Risk Score</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Receive factor-by-factor risk signals, live OSRM routing checks, and actionable driver checklists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#cca25a]">
              Core Capabilities
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Engineered for real-world transport
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-[#f8fafc] rounded-xl p-7 border border-slate-200">
              <Route className="h-6 w-6 text-[#cca25a] mb-3" />
              <h3 className="text-base font-bold text-slate-900">Live OSRM Distance Engine</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Flags discrepancy between declared E-Way bill distance and actual highway routing.
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-xl p-7 border border-slate-200">
              <FileSearch className="h-6 w-6 text-[#cca25a] mb-3" />
              <h3 className="text-base font-bold text-slate-900">Multi-Page PDF & Image OCR</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Extracts GSTIN, vehicle number, invoice value, and validity dates automatically.
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-xl p-7 border border-slate-200">
              <MapPin className="h-6 w-6 text-emerald-600 mb-3" />
              <h3 className="text-base font-bold text-slate-900">Corridor Incident Heatmaps</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Visualizes highway checkposts, past inspection patterns, and high-frequency stops.
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-xl p-7 border border-slate-200">
              <AlertTriangle className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-base font-bold text-slate-900">Hazchem & Cold-Chain Rules</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Criticality escalation when dangerous or temperature-sensitive goods lack certified carrier bodies.
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-xl p-7 border border-slate-200">
              <Gauge className="h-6 w-6 text-[#cca25a] mb-3" />
              <h3 className="text-base font-bold text-slate-900">Shareable Public Links</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Export branded PDF reports or generate read-only links for brokers and consignees.
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-xl p-7 border border-slate-200">
              <Zap className="h-6 w-6 text-indigo-600 mb-3" />
              <h3 className="text-base font-bold text-slate-900">Developer API Access</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                Integrate TruckShield directly into your existing ERP or TMS with secure API keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#cca25a]" />
              <span className="font-bold text-slate-900 text-sm">TruckShield Compliance Intel</span>
            </div>
            <div className="text-xs text-slate-500">
              Demo credentials: <code className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-mono">demo@truckshield.app</code> / <code className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-mono">Demo@12345</code>
            </div>
          </div>
          <p className="mt-6 text-[11px] text-slate-400 max-w-3xl leading-relaxed">
            {DISCLAIMER}
          </p>
        </div>
      </footer>
    </div>
  );
}
