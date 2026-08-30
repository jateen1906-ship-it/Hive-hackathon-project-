import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AuthAPI } from "@/lib/apiClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter your email address"); return; }
    setLoading(true);
    try {
      const res = await AuthAPI.forgotPassword(email.trim());
      setSubmitted(true);
      if (res?.dev_reset_token) {
        setDevToken(res.dev_reset_token);
      }
      toast.success("Password reset request processed");
    } catch (err) {
      toast.error(err.message || "Failed to process password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] text-slate-900 p-6">
      <Card className="w-full max-w-md p-8 bg-white border border-slate-200 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">TruckShield</span>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              If an account with <strong className="text-slate-900">{email}</strong> exists, we've sent password reset instructions.
            </p>
            {devToken && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-left">
                <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Dev Reset Link</div>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="mt-1 block text-xs text-blue-600 font-mono underline break-all"
                >
                  /reset-password?token={devToken}
                </Link>
              </div>
            )}
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full border-slate-200 text-xs font-semibold text-slate-700 h-9">
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset password</h1>
            <p className="mt-1 text-xs text-slate-500">
              Enter the email address associated with your fleet account.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@fleet.in"
                    className="pl-10 bg-white border-slate-200 text-slate-900 rounded-lg h-10 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="btn-primary-blue w-full font-semibold rounded-lg h-10 text-xs shadow-2xs"
                disabled={loading}
              >
                {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Sending instructions…</> : "Send Reset Link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Remembered your password?{" "}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
