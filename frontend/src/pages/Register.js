import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
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
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="ts-hero-gradient relative hidden flex-col justify-between p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-sky-300" />
          <span className="text-lg font-bold">TruckShield</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Start protecting every dispatch.</h2>
          <p className="mt-3 max-w-md text-slate-300">Create trips, run document pre-checks and build corridor intelligence from your own incident reports.</p>
        </div>
        <div className="text-xs text-slate-400">Informational pre-checks only — not legal advice.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Set up your fleet workspace.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={form.full_name} onChange={set("full_name")} data-testid="register-name-input" placeholder="Ravi Kumar" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_name">Company</Label>
                <Input id="company_name" value={form.company_name} onChange={set("company_name")} data-testid="register-company-input" placeholder="Bharat Freight" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={set("email")} data-testid="register-email-input" placeholder="you@fleet.in" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={form.password} onChange={set("password")} data-testid="register-password-input" placeholder="min 6 chars" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={form.phone} onChange={set("phone")} data-testid="register-phone-input" placeholder="+91…" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="register-form-submit-button">
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-foreground underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
