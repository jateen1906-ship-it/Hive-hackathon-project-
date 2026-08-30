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
    <div className="min-h-screen bg-[#fff8f9] text-[#26161b]">
      {/* Top Header */}
      <header className="border-b border-[#f2c7c7] bg-white px-4 py-4 sm:px-8 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f46a85] text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[#26161b]">TruckShield</div>
              <div className="text-[10px] uppercase tracking-wider text-[#916b75] font-semibold">Compliance Intel</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/login")} 
              data-testid="landing-login"
              className="text-xs font-semibold text-[#6b4f57] hover:text-[#26161b] transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate("/pricing")} 
              className="text-xs font-semibold text-[#6b4f57] hover:text-[#26161b] transition-colors hidden sm:block"
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
      <section className="bg-white border-b border-[#f2c7c7] py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffebf0] border border-[#f2c7c7] text-[#c93252] text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Pre-Dispatch Risk Engine for Indian Freight
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-[#26161b] sm:text-6xl md:text-7xl leading-[1.1]">
            Plan The Route.<br />
            <span className="text-[#f46a85]">
              Clear The Risk.
            </span>
          </h1>
          
          <p className="mt-6 max-w-2xl mx-auto text-base text-[#6b4f57] sm:text-lg leading-relaxed">
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
              className="border-[#f2c7c7] hover:bg-[#fff0f3] text-[#26161b] font-semibold rounded-xl h-12 px-6 text-sm bg-white"
            >
              Use Demo Account
            </Button>
          </div>
        </div>
      </section>

      {/* 3 Step Flow */}
      <section className="py-20 border-b border-[#f2c7c7] bg-[#fff8f9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f46a85]">
              Deterministic Intelligence
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-[#26161b] tracking-tight sm:text-4xl">
              From consignment entry to road-ready in 3 steps
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl p-8 border border-[#f2c7c7] shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#f46a85]/30">01</div>
              <h3 className="mt-4 text-lg font-bold text-[#26161b]">Input Trip & Consignment</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
                Declare origin, destination, invoice value, carrier registration, and cargo nature.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-[#f2c7c7] shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#f46a85]/30">02</div>
              <h3 className="mt-4 text-lg font-bold text-[#26161b]">Optical OCR Verification</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
                Upload tax invoices and E-Way bills for instant optical field extraction and statutory rule matching.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-[#f2c7c7] shadow-2xs">
              <div className="text-4xl font-extrabold font-mono text-[#f46a85]/30">03</div>
              <h3 className="mt-4 text-lg font-bold text-[#26161b]">Explainable Risk Score</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
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
            <span className="text-xs font-bold uppercase tracking-widest text-[#f46a85]">
              Core Capabilities
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-[#26161b] tracking-tight sm:text-4xl">
              Engineered for real-world transport
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-[#fff8f9] rounded-xl p-7 border border-[#f2c7c7]">
              <Route className="h-6 w-6 text-[#f46a85] mb-3" />
              <h3 className="text-base font-bold text-[#26161b]">Live OSRM Distance Engine</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
                Flags discrepancy between declared E-Way bill distance and actual highway routing.
              </p>
            </div>

            <div className="bg-[#fff8f9] rounded-xl p-7 border border-[#f2c7c7]">
              <FileSearch className="h-6 w-6 text-[#d946ef] mb-3" />
              <h3 className="text-base font-bold text-[#26161b]">Multi-Page PDF & Image OCR</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
                Extracts GSTIN, vehicle number, invoice value, and validity dates automatically.
              </p>
            </div>

            <div className="bg-[#fff8f9] rounded-xl p-7 border border-[#f2c7c7]">
              <MapPin className="h-6 w-6 text-[#059669] mb-3" />
              <h3 className="text-base font-bold text-[#26161b]">Corridor Incident Heatmaps</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
                Visualizes highway checkposts, past inspection patterns, and high-frequency stops.
              </p>
            </div>

            <div className="bg-[#fff8f9] rounded-xl p-7 border border-[#f2c7c7]">
              <AlertTriangle className="h-6 w-6 text-[#f59e0b] mb-3" />
              <h3 className="text-base font-bold text-[#26161b]">Hazchem & Cold-Chain Rules</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
                Criticality escalation when dangerous or temperature-sensitive goods lack certified carrier bodies.
              </p>
            </div>

            <div className="bg-[#fff8f9] rounded-xl p-7 border border-[#f2c7c7]">
              <Gauge className="h-6 w-6 text-[#f46a85] mb-3" />
              <h3 className="text-base font-bold text-[#26161b]">Shareable Public Links</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
                Export branded PDF reports or generate read-only links for brokers and consignees.
              </p>
            </div>

            <div className="bg-[#fff8f9] rounded-xl p-7 border border-[#f2c7c7]">
              <Zap className="h-6 w-6 text-[#d946ef] mb-3" />
              <h3 className="text-base font-bold text-[#26161b]">Developer API Access</h3>
              <p className="mt-2 text-xs text-[#6b4f57] leading-relaxed">
                Integrate TruckShield directly into your existing ERP or TMS with secure API keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#f2c7c7] bg-white py-12 text-[#916b75]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#f46a85]" />
              <span className="font-bold text-[#26161b] text-sm">TruckShield Compliance Intel</span>
            </div>
            <div className="text-xs text-[#7d656c]">
              Demo credentials: <code className="rounded bg-[#ffebf0] border border-[#f2c7c7] px-2 py-0.5 text-[#26161b] font-mono">demo@truckshield.app</code> / <code className="rounded bg-[#ffebf0] border border-[#f2c7c7] px-2 py-0.5 text-[#26161b] font-mono">Demo@12345</code>
            </div>
          </div>
          <p className="mt-6 text-[11px] text-[#916b75] max-w-3xl leading-relaxed">
            {DISCLAIMER}
          </p>
        </div>
      </footer>
    </div>
  );
}
