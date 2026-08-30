import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles, User, Building2, Mail, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", company_name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim() });
      toast.success("Account created successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#f2fcfb] text-[#0c333a]">
      {/* Left Hero - Dark / Black Background */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex bg-[#090d16] text-white border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#85d1db] text-[#05262c] font-bold shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TruckShield</span>
        </div>
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#85d1db]/20 border border-[#85d1db]/40 text-[#85d1db] text-xs font-bold mb-5">
            <Sparkles className="h-3.5 w-3.5" /> Fleet Pre-Dispatch Intelligence
          </div>
          <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Protect every dispatch across India.
          </h2>
          <p className="mt-5 text-base text-slate-300 leading-relaxed font-medium">
            Automate statutory E-Way bill pre-checks, route anomalies, and cargo compliance in one unified portal.
          </p>
        </div>
        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
          Informational compliance pre-checks only — not legal advice.
        </div>
      </div>

      {/* Right Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-lg p-8 bg-white border border-[#b3ebf2] shadow-sm">
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#85d1db] text-[#05262c] font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-[#0c333a]">TruckShield</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0c333a] tracking-tight">Create your account</h1>
            <p className="mt-1 text-xs text-[#507e86]">Set up your fleet workspace in seconds.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs font-semibold text-[#0c333a]">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#507e86]" />
                  <Input 
                    id="full_name" 
                    value={form.full_name} 
                    onChange={set("full_name")} 
                    data-testid="register-name-input" 
                    placeholder="Ravi Kumar"
                    className="pl-10 bg-white border-[#b3ebf2] text-[#0c333a] rounded-lg h-10 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_name" className="text-xs font-semibold text-[#0c333a]">Company</Label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#507e86]" />
                  <Input 
                    id="company_name" 
                    value={form.company_name} 
                    onChange={set("company_name")} 
                    data-testid="register-company-input" 
                    placeholder="Bharat Logistics"
                    className="pl-10 bg-white border-[#b3ebf2] text-[#0c333a] rounded-lg h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#0c333a]">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#507e86]" />
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={form.email} 
                  onChange={set("email")} 
                  data-testid="register-email-input" 
                  placeholder="operator@fleet.in"
                  className="pl-10 bg-white border-[#b3ebf2] text-[#0c333a] rounded-lg h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#0c333a]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#507e86]" />
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={form.password} 
                    onChange={set("password")} 
                    data-testid="register-password-input" 
                    placeholder="Min. 6 chars"
                    className="pl-10 bg-white border-[#b3ebf2] text-[#0c333a] rounded-lg h-10 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-[#0c333a]">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#507e86]" />
                  <Input 
                    id="phone" 
                    value={form.phone} 
                    onChange={set("phone")} 
                    data-testid="register-phone-input" 
                    placeholder="+91 98765…"
                    className="pl-10 bg-white border-[#b3ebf2] text-[#0c333a] rounded-lg h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="btn-primary-blue w-full font-bold rounded-lg h-10 text-xs shadow-2xs mt-2 text-[#05262c]" 
              disabled={loading} 
              data-testid="register-form-submit-button"
            >
              {loading ? "Creating workspace…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[#507e86]">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#094751] hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
