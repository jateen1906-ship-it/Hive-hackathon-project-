import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
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
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#f8fafc] text-slate-900 relative overflow-hidden bg-light-mesh">
      {/* Ambient background orbs */}
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />

      {/* Left Hero Section */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex border-r border-slate-200/80 bg-white/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">TruckShield</span>
        </div>
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen Fleet Risk Engine
          </div>
          <h2 className="text-4xl font-extrabold leading-tight text-slate-900">
            Pre-departure compliance, in seconds.
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Instant explainable risk signals so your logistics fleet knows exact regulatory, route, and cargo checks before dispatch.
          </p>
        </div>
        <div className="text-xs text-slate-500 border-t border-slate-200 pt-4">
          Informational compliance pre-checks only — not legal advice.
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 z-10">
        <Card className="executive-card w-full max-w-md p-8 bg-white border-slate-200/90 shadow-md">
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900">TruckShield</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="mt-1 text-xs text-slate-500">Sign in to your fleet compliance dashboard.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
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
                  className="pl-10 bg-white border-slate-200 text-slate-900 rounded-lg h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
                <Link to="/forgot-password" className="text-xs text-sky-600 hover:text-sky-700 font-semibold">
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
                  className="pl-10 bg-white border-slate-200 text-slate-900 rounded-lg h-10 text-xs"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="btn-executive-primary w-full font-semibold rounded-lg h-10 text-xs shadow-xs" 
              disabled={loading} 
              data-testid="login-form-submit-button"
            >
              {loading ? "Signing in…" : "Sign in to TruckShield"}
            </Button>
          </form>

          <button 
            onClick={useDemo} 
            data-testid="login-demo-fill"
            type="button"
            className="mt-4 w-full rounded-lg border border-dashed border-sky-300 bg-sky-50/60 px-4 py-2.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Use Demo Account (demo@truckshield.app)</span>
          </button>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-sky-600 hover:underline">
              Create one now
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
