import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AuthAPI } from "@/lib/apiClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await AuthAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setSent(true);
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
            <Sparkles className="h-3.5 w-3.5" /> Secure Account Recovery
          </div>
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            Reset your password.
          </h2>
          <p className="mt-4 text-base text-[#a8a29e] leading-relaxed">
            Enter your fleet account email to receive an instant secure reset link.
          </p>
        </div>
        <div className="text-xs text-[#78716c] border-t border-white/[0.06] pt-4">
          Informational compliance pre-checks only — not legal advice.
        </div>
      </div>

      {/* Right Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="alvero-card w-full max-w-md p-8 bg-[#181512] border-white/[0.08]">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Check your email</h1>
              <p className="mt-2 text-sm text-[#9e958d]">
                If an account exists for <strong className="text-white">{email}</strong>, a password reset link has been dispatched.
              </p>
              <p className="mt-3 text-xs text-[#78716c]">
                Please check your inbox and spam folder.
              </p>
              <Button className="mt-6 w-full border-white/[0.08] hover:bg-white/[0.04]" variant="outline" onClick={() => setSent(false)}>
                Try another email
              </Button>
              <p className="mt-6 text-center text-sm text-[#9e958d]">
                <Link to="/login" className="flex items-center justify-center gap-1.5 text-orange-400 hover:text-orange-300 font-semibold">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">Forgot password?</h1>
                <p className="mt-1 text-sm text-[#9e958d]">
                  Enter your registered email address to receive recovery instructions.
                </p>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-[#d6d3d1]">Account Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716c]" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@fleet.in"
                      className="pl-10 bg-[#12100e] border-white/[0.08] text-white focus:border-orange-500 rounded-xl h-11"
                    />
                  </div>
                </div>
                <Button type="submit" className="btn-sunset-orange w-full font-semibold rounded-xl h-11 text-sm shadow-md" disabled={loading}>
                  {loading ? "Sending link…" : "Send reset link"}
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
