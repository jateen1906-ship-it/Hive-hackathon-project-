import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowRight, Lock, Mail, Sparkles, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const useDemo = () => {
    setEmail("demo@truckshield.app");
    setPassword("Demo@12345");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#07090e] text-slate-100 relative overflow-hidden aurora-bg">
      <div className="cyber-orb-1" />
      <div className="cyber-orb-2" />

      {/* Left Hero */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex border-r border-white/[0.08] bg-[#0b101d]/60 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">TruckShield AI</span>
        </div>
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-extrabold mb-5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Deterministic Risk & Highway Telemetry
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight text-white tracking-tight">
            Pre-dispatch intelligence, in seconds.
          </h2>
          <p className="mt-5 text-base text-slate-300 leading-relaxed">
            Automated statutory E-Way bill checks, optical OCR invoice validation, and live OSRM routing checks for Indian commercial fleets.
          </p>
        </div>
        <div className="text-xs text-slate-500 border-t border-white/[0.08] pt-4">
          Informational compliance pre-checks only — not legal advice.
        </div>
      </div>

      {/* Right Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 z-10">
        <Card className="rich-card w-full max-w-md p-8 bg-[#0d1322]/90 border-white/[0.1] shadow-2xl">
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">TruckShield AI</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
            <p className="mt-1 text-xs text-slate-400">Access your fleet compliance control panel.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={email} 
                  data-testid="login-email-input"
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="operator@fleet.in"
                  className="pl-10 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-300">Password</Label>
                <Link to="/forgot-password" className="text-xs text-sky-400 hover:text-sky-300 font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password} 
                  data-testid="login-password-input"
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="pl-10 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="btn-cyber-cyan w-full font-bold rounded-xl h-11 text-xs shadow-lg mt-2" 
              disabled={loading} 
              data-testid="login-form-submit-button"
            >
              {loading ? "Signing in…" : "Sign In to Workspace"}
            </Button>
          </form>

          <button 
            onClick={useDemo} 
            data-testid="login-demo-fill"
            type="button"
            className="mt-4 w-full rounded-xl border border-dashed border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Use Demo Account (demo@truckshield.app)</span>
          </button>

          <p className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-sky-400 hover:underline">
              Create one now
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
