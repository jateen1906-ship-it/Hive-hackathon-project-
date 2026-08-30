import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Truck, AlertTriangle, ShieldAlert, Bell, ArrowRight, MapPin, 
  ShieldCheck, Activity, Zap, TrendingUp, ChevronRight, Sparkles, Navigation
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsAPI } from "@/lib/apiClient";
import { KpiCard } from "@/components/common/KpiCard";
import { RiskBadge } from "@/components/common/RiskBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { PageHeader, RouteStrip } from "@/components/common/PageHeader";
import { fmtDate } from "@/lib/riskMeta";
import { useAuth } from "@/context/AuthContext";
import { useBilling } from "@/hooks/useBilling";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const billing = useBilling();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: AnalyticsAPI.dashboard,
  });

  const totalTrips = data?.kpis?.total_trips || 0;
  const highRisk = (data?.kpis?.high || 0) + (data?.kpis?.critical || 0);
  const lowRisk = data?.kpis?.low || 0;
  const medRisk = data?.kpis?.medium || 0;
  const safePercent = totalTrips > 0 ? Math.round((lowRisk / totalTrips) * 100) : 100;

  return (
    <div className="space-y-7">
      {/* Top Header */}
      <PageHeader
        title="Fleet Intelligence Hub"
        subtitle="Real-time statutory pre-checks, corridor risk vectors, and optical document validation."
        actions={
          <Button 
            onClick={() => navigate("/trips/new")} 
            data-testid="dashboard-new-trip"
            className="btn-cyber-cyan rounded-xl px-5 h-10 shadow-lg text-xs flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            <span>Analyze New Route</span>
          </Button>
        }
      />

      {isLoading && <LoadingState label="Synthesizing fleet telemetry & corridor matrices…" rows={4} />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.35 }} 
          className="space-y-7"
        >
          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard 
              label="Active Dispatches" 
              value={data.kpis.active_trips} 
              testId="dashboard-kpi-active" 
              accent="#38bdf8" 
              hint={`${data.kpis.total_trips} total recorded`} 
            />
            <KpiCard 
              label="High Risk Routes" 
              value={data.kpis.high} 
              testId="dashboard-kpi-high-risk" 
              accent="#ef4444" 
              hint="Requires clearance"
            />
            <KpiCard 
              label="Medium Risk" 
              value={data.kpis.medium} 
              testId="dashboard-kpi-medium-risk" 
              accent="#f59e0b" 
              hint="Checkpost advisory"
            />
            <KpiCard 
              label="Clear & Compliant" 
              value={data.kpis.low} 
              testId="dashboard-kpi-low-risk" 
              accent="#10b981" 
              hint="Statutory verified"
            />
            <KpiCard 
              label="Corridor Incidents" 
              value={data.kpis.incidents} 
              testId="dashboard-kpi-incidents" 
              accent="#a855f7" 
              hint="Reported on highway"
            />
          </div>

          {/* Featured Master Hero Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cyber Master Card */}
            <div className="fleet-card-cyber rounded-2xl p-6 relative flex flex-col justify-between min-h-[200px] border border-sky-400/30">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-300 shadow-inner">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-white block">Fleet Authority Pass</span>
                    <span className="text-[10px] text-sky-200 font-mono">ENCRYPTED TELEMETRY</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-sky-400/20 border border-sky-300/40 text-sky-200 tracking-wider">
                  {billing.plan.toUpperCase()} TIER
                </span>
              </div>

              <div className="my-3 relative z-10">
                <div className="text-[11px] uppercase tracking-widest text-sky-200/70 font-semibold mb-1">Company Fleet Identifier</div>
                <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-white drop-shadow-md">
                  TS-{user?.id ? String(user.id).slice(0, 8).toUpperCase() : "FLEET-001"}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-200 border-t border-white/10 pt-3 relative z-10">
                <span className="font-medium truncate max-w-[160px]">{user?.company_name || "Logistics Network"}</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
            </div>

            {/* Fleet Safety Rate Card */}
            <Card className="rich-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Fleet Compliance Index</div>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>

              <div className="my-2 flex items-baseline gap-2.5">
                <span className="font-mono text-4xl font-extrabold text-white">{safePercent}%</span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Optimal Rating
                </span>
              </div>

              <div className="space-y-2">
                <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex p-0.5 border border-white/[0.08]">
                  <div style={{ width: `${(lowRisk / (totalTrips || 1)) * 100}%` }} className="bg-emerald-400 h-full rounded-full shadow-sm" />
                  <div style={{ width: `${(medRisk / (totalTrips || 1)) * 100}%` }} className="bg-amber-400 h-full rounded-full shadow-sm ml-0.5" />
                  <div style={{ width: `${(highRisk / (totalTrips || 1)) * 100}%` }} className="bg-red-500 h-full rounded-full shadow-sm ml-0.5" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span className="text-emerald-400 font-bold">{lowRisk} Clear</span>
                  <span className="text-amber-400 font-bold">{medRisk} Med</span>
                  <span className="text-rose-400 font-bold">{highRisk} High/Crit</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card className="rich-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Operations</div>
                <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Zap className="h-4 w-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 my-2">
                <button 
                  onClick={() => navigate("/trips/new")}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/[0.03] hover:bg-sky-500/10 border border-white/[0.06] hover:border-sky-500/40 transition-all text-xs font-bold text-slate-200 hover:text-sky-300 group"
                >
                  <Truck className="h-5 w-5 mb-1.5 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Dispatch Check</span>
                </button>
                <button 
                  onClick={() => navigate("/documents")}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/[0.06] hover:border-amber-500/40 transition-all text-xs font-bold text-slate-200 hover:text-amber-300 group"
                >
                  <ShieldCheck className="h-5 w-5 mb-1.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>OCR Verify</span>
                </button>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/analytics")}
                className="w-full text-xs border-white/[0.1] hover:bg-white/[0.05] text-slate-300 hover:text-white rounded-xl h-9 font-semibold"
              >
                Inspect Corridor Heatmap <ChevronRight className="ml-1 h-3.5 w-3.5 text-sky-400" />
              </Button>
            </Card>
          </div>

          {/* Main 2-Column Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Trips Table */}
            <Card className="rich-card lg:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <Activity className="h-4 w-4 text-sky-400" />
                  <h2 className="text-sm font-extrabold text-white tracking-tight">Active Dispatches & Compliance Stream</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/trips")}
                  className="text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 p-0 h-auto font-bold flex items-center gap-1"
                >
                  View All Fleet <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {data.recent_trips.length === 0 ? (
                <div className="p-8">
                  <EmptyState 
                    title="No dispatches recorded yet" 
                    description="Create your first consignment entry to run automated risk assessment."
                    action={
                      <Button onClick={() => navigate("/trips/new")} className="btn-cyber-cyan text-xs rounded-xl font-bold">
                        Create Dispatch Check
                      </Button>
                    } 
                  />
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {data.recent_trips.map((t) => (
                    <button 
                      key={t.id} 
                      data-testid={`dashboard-trip-${t.id}`}
                      onClick={() => navigate(`/trips/${t.id}`)}
                      className="flex w-full items-center justify-between px-6 py-4 text-left transition-all hover:bg-white/[0.04] group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-3">
                          <RouteStrip origin={t.origin} destination={t.destination} className="text-sm group-hover:text-sky-400 transition-colors" />
                          {t.is_demo && <SyntheticBadge />}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400 font-medium">
                          <span>{fmtDate(t.travel_date)}</span>
                          <span className="text-slate-600">•</span>
                          {t.vehicle_number && <span className="font-mono text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.05]">{t.vehicle_number}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {t.risk_level ? (
                          <RiskBadge level={t.risk_level} score={t.risk_score} />
                        ) : (
                          <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">Unanalyzed</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Route & Document Alerts */}
            <Card className="rich-card overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
                <Bell className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-extrabold text-white tracking-tight">Active Corridor Advisories</h2>
              </div>
              <div className="p-5">
                {data.alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/20">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-white">All Clear</p>
                    <p className="text-xs text-slate-400 mt-1">No active compliance or distance anomalies flagged.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.alerts.map((a, i) => (
                      <li 
                        key={i} 
                        className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-xs leading-relaxed"
                      >
                        {a.type === "distance" ? (
                          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                            <MapPin className="h-4 w-4" />
                          </div>
                        ) : a.type === "document" ? (
                          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                            <Truck className="h-4 w-4" />
                          </div>
                        )}
                        <span className="text-slate-200 font-medium">{a.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          <Disclaimer />
        </motion.div>
      )}
    </div>
  );
}
