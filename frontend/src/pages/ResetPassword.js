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
    <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] text-slate-900 p-6">
      <Card className="w-full max-w-md p-8 bg-white border border-slate-200 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">TruckShield</span>
        </div>

        {completed ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Password reset complete</h2>
            <p className="text-xs text-slate-500">
              Your password has been updated. You can now sign in with your new credentials.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => navigate("/login")}
                className="btn-primary-blue w-full font-semibold text-xs rounded-lg h-9"
              >
                Sign In Now
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Set new password</h1>
            <p className="mt-1 text-xs text-slate-500">
              Create a new secure password for your fleet account.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pass" className="text-xs font-semibold text-slate-700">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="pass"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="pl-10 bg-white border-slate-200 text-slate-900 rounded-lg h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs font-semibold text-slate-700">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10 bg-white border-slate-200 text-slate-900 rounded-lg h-10 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="btn-primary-blue w-full font-semibold rounded-lg h-10 text-xs shadow-2xs"
                disabled={loading}
              >
                {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Updating password…</> : "Save New Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-xs text-slate-500 hover:text-slate-900 font-semibold inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
