import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AuthAPI } from "@/lib/apiClient";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Reset token is missing from URL.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.resetPassword(token, password);
      setCompleted(true);
      toast.success("Password updated successfully");
    } catch (err) {
      toast.error(err.message || "Invalid or expired reset token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07090e] text-slate-100 p-6 relative overflow-hidden aurora-bg">
      <div className="cyber-orb-1" />
      <div className="cyber-orb-2" />

      <Card className="rich-card w-full max-w-md p-8 bg-[#0d1322]/90 border-white/[0.1] shadow-2xl relative z-10">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-white">TruckShield AI</span>
        </div>

        {completed ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Password reset complete</h2>
            <p className="text-xs text-slate-400">
              Your password has been updated. You can now sign in with your new credentials.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => navigate("/login")}
                className="btn-cyber-cyan w-full font-bold text-xs rounded-xl h-11"
              >
                Sign In Now
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Set new password</h1>
            <p className="mt-1 text-xs text-slate-400">
              Create a new secure password for your fleet account.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pass" className="text-xs font-bold text-slate-300">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="pass"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs font-bold text-slate-300">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="btn-cyber-cyan w-full font-bold rounded-xl h-11 text-xs shadow-lg"
                disabled={loading}
              >
                {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Updating password…</> : "Save New Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-xs text-slate-400 hover:text-white font-bold inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
