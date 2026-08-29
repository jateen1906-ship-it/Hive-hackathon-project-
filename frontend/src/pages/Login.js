import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
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
      toast.success("Signed in");
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="ts-hero-gradient relative hidden flex-col justify-between p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-sky-300" />
          <span className="text-lg font-bold">TruckShield</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Pre-departure compliance, in seconds.</h2>
          <p className="mt-3 max-w-md text-slate-300">Explainable risk signals so your fleet knows what to check before dispatch.</p>
        </div>
        <div className="text-xs text-slate-400">Informational pre-checks only — not legal advice.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your TruckShield account.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} data-testid="login-email-input"
                     onChange={(e) => setEmail(e.target.value)} placeholder="you@fleet.in" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} data-testid="login-password-input"
                     onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="login-form-submit-button">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <button onClick={useDemo} data-testid="login-demo-fill"
                  className="mt-3 w-full rounded-lg border border-dashed border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
            Use demo account (demo@truckshield.app)
          </button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account? <Link to="/register" className="font-medium text-foreground underline">Create one</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
