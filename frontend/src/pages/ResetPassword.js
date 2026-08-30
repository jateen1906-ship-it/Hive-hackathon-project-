import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AuthAPI } from "@/lib/apiClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new reset link.");
      return;
    }
    setLoading(true);
    try {
      await AuthAPI.resetPassword(token, password);
      setDone(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#12100e] text-[#f5f5f4]">
      {/* Left Hero */}
      <div className="ts-hero-gradient relative hidden flex-col justify-between p-12 lg:flex border-r border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TruckShield</span>
        </div>
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Fleet Account Security
          </div>
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            Create a new password.
          </h2>
          <p className="mt-4 text-base text-[#a8a29e] leading-relaxed">
            Choose a strong password to ensure uninterrupted access to your fleet dashboard.
          </p>
        </div>
        <div className="text-xs text-[#78716c] border-t border-white/[0.06] pt-4">
          Informational compliance pre-checks only — not legal advice.
        </div>
      </div>

      {/* Right Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="alvero-card w-full max-w-md p-8 bg-[#181512] border-white/[0.08]">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Password updated!</h1>
              <p className="mt-2 text-sm text-[#9e958d]">
                Your password has been reset successfully. You can now sign in with your updated credentials.
              </p>
              <Button className="btn-sunset-orange mt-6 w-full font-semibold rounded-xl h-11" onClick={() => navigate("/login")}>
                Sign in now
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Set new password</h1>
                <p className="mt-1 text-sm text-[#9e958d]">
                  Enter and confirm your new password below.
                </p>
              </div>

              {!token && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                  No reset token found in URL. Please use the link from your email or{" "}
                  <Link to="/forgot-password" className="underline font-semibold">request a new one</Link>.
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-[#d6d3d1]">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pr-10 bg-[#12100e] border-white/[0.08] text-white focus:border-orange-500 rounded-xl h-11"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-white"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-xs font-semibold text-[#d6d3d1]">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type={showPw ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="bg-[#12100e] border-white/[0.08] text-white focus:border-orange-500 rounded-xl h-11"
                  />
                  {confirm && password !== confirm && (
                    <p className="text-xs text-rose-400">Passwords do not match</p>
                  )}
                </div>

                <Button type="submit" className="btn-sunset-orange w-full font-semibold rounded-xl h-11 text-sm shadow-md" disabled={loading || !token}>
                  {loading ? "Updating password…" : "Reset password"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[#9e958d]">
                <Link to="/login" className="flex items-center justify-center gap-1.5 text-orange-400 hover:text-orange-300 font-semibold">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
