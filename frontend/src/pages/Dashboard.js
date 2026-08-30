import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Truck, AlertTriangle, ShieldAlert, Bell, ArrowRight, MapPin, 
  ShieldCheck, Activity, Zap, TrendingUp, ChevronRight
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
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Dashboard"
        subtitle="What should your fleet worry about today?"
        actions={
          <Button 
            onClick={() => navigate("/trips/new")} 
            data-testid="dashboard-new-trip"
            className="btn-sunset-orange font-semibold rounded-xl px-4 shadow-lg shadow-orange-950/40"
          >
            <Truck className="mr-2 h-4 w-4 stroke-[2.5]" />
            New Trip
          </Button>
        }
      />

      {isLoading && <LoadingState label="Loading fleet overview…" rows={4} />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }} 
          className="space-y-6"
        >
          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard 
              label="Active Trips" 
              value={data.kpis.active_trips} 
              testId="dashboard-kpi-active" 
              accent="#f97316" 
              hint={`${data.kpis.total_trips} total recorded`} 
            />
            <KpiCard 
              label="High Risk" 
              value={data.kpis.high} 
              testId="dashboard-kpi-high-risk" 
              accent="#ef4444" 
              hint="Immediate attention"
            />
            <KpiCard 
              label="Medium Risk" 
              value={data.kpis.medium} 
              testId="dashboard-kpi-medium-risk" 
              accent="#f59e0b" 
              hint="Check compliance"
            />
            <KpiCard 
              label="Low Risk" 
              value={data.kpis.low} 
              testId="dashboard-kpi-low-risk" 
              accent="#10b981" 
              hint="Standard transit"
            />
            <KpiCard 
              label="Incidents" 
              value={data.kpis.incidents} 
              testId="dashboard-kpi-incidents" 
              accent="#38bdf8" 
              hint="Reported on route"
            />
          </div>

          {/* Featured Fleet Master Card Banner (Alvero Inspired) */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="fleet-card-gold rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[190px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-200">TruckShield Fleet Pro</span>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300">
                  {billing.plan.toUpperCase()} ACTIVE
                </span>
              </div>
              <div>
                <div className="text-xs text-[#a8a29e] mb-1">Company Fleet Identifier</div>
                <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white">
                  TS-{user?.id ? String(user.id).slice(0, 8).toUpperCase() : "FLEET-001"}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-[#d6d3d1] border-t border-white/10 pt-3">
                <span>Fleet: {user?.company_name || "Logistics Network"}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Engine
                </span>
              </div>
            </div>

            {/* Compliance Health Widget */}
            <div className="alvero-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#9e958d]">Fleet Safety Rate</div>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-white">{safePercent}%</span>
                <span className="text-xs text-emerald-400 font-medium">compliant pre-checks</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-[#26201c] overflow-hidden flex">
                  <div style={{ width: `${(lowRisk / (totalTrips || 1)) * 100}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${(medRisk / (totalTrips || 1)) * 100}%` }} className="bg-amber-500 h-full" />
                  <div style={{ width: `${(highRisk / (totalTrips || 1)) * 100}%` }} className="bg-rose-500 h-full" />
                </div>
                <div className="flex justify-between text-[11px] text-[#9e958d]">
                  <span className="text-emerald-400">{lowRisk} Low</span>
                  <span className="text-amber-400">{medRisk} Med</span>
                  <span className="text-rose-400">{highRisk} High/Critical</span>
                </div>
              </div>
            </div>

            {/* Quick Actions / Status */}
            <div className="alvero-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#9e958d]">Quick Actions</div>
                <Zap className="h-4 w-4 text-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-2 my-2">
                <button 
                  onClick={() => navigate("/trips/new")}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.03] hover:bg-orange-500/10 border border-white/[0.06] hover:border-orange-500/30 transition-all text-xs font-medium text-[#f5f5f4]"
                >
                  <Truck className="h-4 w-4 mb-1 text-orange-400" />
                  <span>Analyze Trip</span>
                </button>
                <button 
                  onClick={() => navigate("/documents")}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.03] hover:bg-orange-500/10 border border-white/[0.06] hover:border-orange-500/30 transition-all text-xs font-medium text-[#f5f5f4]"
                >
                  <ShieldCheck className="h-4 w-4 mb-1 text-amber-400" />
                  <span>OCR Check</span>
                </button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/analytics")}
                className="w-full text-xs border-white/[0.08] hover:bg-white/[0.04] text-[#f5f5f4]"
              >
                View Corridor Intelligence <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Trips Table */}
            <Card className="alvero-card lg:col-span-2 overflow-hidden border-white/[0.07]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">Recent Fleet Trips</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/trips")}
                  className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 p-0 h-auto font-semibold"
                >
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>

              {data.recent_trips.length === 0 ? (
                <div className="p-8">
                  <EmptyState 
                    title="No trips recorded yet" 
                    description="Create your first dispatch pre-check to generate explainable risk scores."
                    action={
                      <Button onClick={() => navigate("/trips/new")} className="btn-sunset-orange font-semibold rounded-xl">
                        Create a trip
                      </Button>
                    } 
                  />
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {data.recent_trips.map((t) => (
                    <button 
                      key={t.id} 
                      data-testid={`dashboard-trip-${t.id}`}
                      onClick={() => navigate(`/trips/${t.id}`)}
                      className="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-white/[0.03] group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2.5">
                          <RouteStrip origin={t.origin} destination={t.destination} className="text-sm group-hover:text-orange-400 transition-colors" />
                          {t.is_demo && <SyntheticBadge />}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[#9e958d]">
                          <span>{fmtDate(t.travel_date)}</span>
                          {t.vehicle_number && <span className="font-mono text-[#d6d3d1]">{t.vehicle_number}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {t.risk_level ? (
                          <RiskBadge level={t.risk_level} score={t.risk_score} />
                        ) : (
                          <span className="text-xs text-[#9e958d] px-2.5 py-1 rounded-full bg-white/[0.04]">Unanalyzed</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-[#78716c] group-hover:text-white transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Route & Document Alerts */}
            <Card className="alvero-card overflow-hidden border-white/[0.07]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-4">
                <Bell className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">Route & Document Alerts</h2>
              </div>
              <div className="p-5">
                {data.alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-white">All Clear</p>
                    <p className="text-xs text-[#9e958d] mt-1">No active compliance or distance anomalies flagged.</p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {data.alerts.map((a, i) => (
                      <li 
                        key={i} 
                        className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-relaxed"
                      >
                        {a.type === "distance" ? (
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        ) : a.type === "document" ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                        ) : (
                          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                        )}
                        <span className="text-[#e7e5e4] font-medium">{a.message}</span>
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
