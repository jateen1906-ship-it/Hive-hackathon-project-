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
    <div className="min-h-screen bg-[#f2fcfb] text-[#0c333a]">
      {/* Top Header */}
      <header className="border-b border-[#b3ebf2] bg-white px-4 py-4 sm:px-8 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#85d1db] text-[#05262c] font-bold shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[#0c333a]">TruckShield</div>
              <div className="text-[10px] uppercase tracking-wider text-[#507e86] font-semibold">Compliance Intel</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/login")} 
              data-testid="landing-login"
              className="text-xs font-semibold text-[#507e86] hover:text-[#0c333a] transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate("/pricing")} 
              className="text-xs font-semibold text-[#507e86] hover:text-[#0c333a] transition-colors hidden sm:block"
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
      <section className="bg-white border-b border-[#b3ebf2] py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c9fdf2] border border-[#85d1db] text-[#094751] text-xs font-bold mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[#094751]" /> Pre-Dispatch Risk Engine for Indian Freight
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-[#0c333a] sm:text-6xl md:text-7xl leading-[1.1]">
            Plan The Route.<br />
            <span className="text-[#094751] bg-[#c9fdf2]/80 px-2 py-0.5 rounded-lg">
              Clear The Risk.
            </span>
          </h1>
          
          <p className="mt-6 max-w-2xl mx-auto text-base text-[#507e86] sm:text-lg leading-relaxed font-medium">
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
              className="border-[#85d1db] hover:bg-[#c9fdf2] text-[#0c333a] font-semibold rounded-xl h-12 px-6 text-sm bg-white"
            >
              Use Demo Account
            </Button>
          </div>
        </div>
      </section>

      {/* 3 Step Flow */}
      <section className="py-20 border-b border-[#b3ebf2] bg-[#f2fcfb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#094751]">
              Deterministic Intelligence
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-[#0c333a] tracking-tight sm:text-4xl">
              From consignment entry to road-ready in 3 steps
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl p-8 border border-[#b3ebf2] shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#85d1db]">01</div>
              <h3 className="mt-4 text-lg font-bold text-[#0c333a]">Input Trip & Consignment</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
                Declare origin, destination, invoice value, carrier registration, and cargo nature.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-[#b3ebf2] shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#85d1db]">02</div>
              <h3 className="mt-4 text-lg font-bold text-[#0c333a]">Optical OCR Verification</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
                Upload tax invoices and E-Way bills for instant optical field extraction and statutory rule matching.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-[#b3ebf2] shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#85d1db]">03</div>
              <h3 className="mt-4 text-lg font-bold text-[#0c333a]">Explainable Risk Score</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
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
            <span className="text-xs font-bold uppercase tracking-widest text-[#094751]">
              Core Capabilities
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-[#0c333a] tracking-tight sm:text-4xl">
              Engineered for real-world transport
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-[#c9fdf2]/30 rounded-xl p-7 border border-[#b3ebf2]">
              <Route className="h-6 w-6 text-[#094751] mb-3" />
              <h3 className="text-base font-bold text-[#0c333a]">Live OSRM Distance Engine</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
                Flags discrepancy between declared E-Way bill distance and actual highway routing.
              </p>
            </div>

            <div className="bg-[#c9fdf2]/30 rounded-xl p-7 border border-[#b3ebf2]">
              <FileSearch className="h-6 w-6 text-[#094751] mb-3" />
              <h3 className="text-base font-bold text-[#0c333a]">Multi-Page PDF & Image OCR</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
                Extracts GSTIN, vehicle number, invoice value, and validity dates automatically.
              </p>
            </div>

            <div className="bg-[#b6f2d1]/30 rounded-xl p-7 border border-[#95e3b6]">
              <MapPin className="h-6 w-6 text-[#0d381e] mb-3" />
              <h3 className="text-base font-bold text-[#0c333a]">Corridor Incident Heatmaps</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
                Visualizes highway checkposts, past inspection patterns, and high-frequency stops.
              </p>
            </div>

            <div className="bg-[#c9fdf2]/30 rounded-xl p-7 border border-[#b3ebf2]">
              <AlertTriangle className="h-6 w-6 text-[#f43f5e] mb-3" />
              <h3 className="text-base font-bold text-[#0c333a]">Hazchem & Cold-Chain Rules</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
                Criticality escalation when dangerous or temperature-sensitive goods lack certified carrier bodies.
              </p>
            </div>

            <div className="bg-[#b3ebf2]/30 rounded-xl p-7 border border-[#85d1db]">
              <Gauge className="h-6 w-6 text-[#094751] mb-3" />
              <h3 className="text-base font-bold text-[#0c333a]">Shareable Public Links</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
                Export branded PDF reports or generate read-only links for brokers and consignees.
              </p>
            </div>

            <div className="bg-[#b6f2d1]/30 rounded-xl p-7 border border-[#95e3b6]">
              <Zap className="h-6 w-6 text-[#0d381e] mb-3" />
              <h3 className="text-base font-bold text-[#0c333a]">Developer API Access</h3>
              <p className="mt-2 text-xs text-[#507e86] leading-relaxed font-medium">
                Integrate TruckShield directly into your existing ERP or TMS with secure API keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#b3ebf2] bg-white py-12 text-[#507e86]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#85d1db]" />
              <span className="font-bold text-[#0c333a] text-sm">TruckShield Compliance Intel</span>
            </div>
            <div className="text-xs text-[#507e86]">
              Demo credentials: <code className="rounded bg-[#c9fdf2] border border-[#85d1db] px-2 py-0.5 text-[#0c333a] font-mono">demo@truckshield.app</code> / <code className="rounded bg-[#c9fdf2] border border-[#85d1db] px-2 py-0.5 text-[#0c333a] font-mono">Demo@12345</code>
            </div>
          </div>
          <p className="mt-6 text-[11px] text-[#507e86] max-w-3xl leading-relaxed">
            {DISCLAIMER}
          </p>
        </div>
      </footer>
    </div>
  );
}
