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
            className="btn-executive-primary font-semibold rounded-lg px-4 shadow-sm text-xs"
          >
            <Truck className="mr-2 h-3.5 w-3.5" />
            New Trip
          </Button>
        }
      />

      {isLoading && <LoadingState label="Loading fleet overview…" rows={4} />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (
        <motion.div 
          initial={{ opacity: 0, y: 6 }} 
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
              accent="#2563eb" 
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
              accent="#0284c7" 
              hint="Reported on route"
            />
          </div>

          {/* Featured Fleet Master Card Banner */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="fleet-card-executive rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">TruckShield Fleet Intelligence</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300">
                  {billing.plan.toUpperCase()} ACTIVE
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Company Fleet Identifier</div>
                <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white">
                  TS-{user?.id ? String(user.id).slice(0, 8).toUpperCase() : "FLEET-001"}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-700/80 pt-3">
                <span>Fleet: {user?.company_name || "Logistics Network"}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Engine
                </span>
              </div>
            </div>

            {/* Compliance Health Widget */}
            <Card className="executive-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Safety Rate</div>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-slate-900">{safePercent}%</span>
                <span className="text-xs text-emerald-600 font-semibold">compliant pre-checks</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                  <div style={{ width: `${(lowRisk / (totalTrips || 1)) * 100}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${(medRisk / (totalTrips || 1)) * 100}%` }} className="bg-amber-500 h-full" />
                  <div style={{ width: `${(highRisk / (totalTrips || 1)) * 100}%` }} className="bg-red-500 h-full" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span className="text-emerald-700">{lowRisk} Low</span>
                  <span className="text-amber-700">{medRisk} Med</span>
                  <span className="text-red-700">{highRisk} High/Critical</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="executive-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Actions</div>
                <Zap className="h-4 w-4 text-sky-600" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 my-2">
                <button 
                  onClick={() => navigate("/trips/new")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 transition-all text-xs font-semibold text-slate-700 hover:text-sky-700"
                >
                  <Truck className="h-4 w-4 mb-1 text-sky-600" />
                  <span>Analyze Trip</span>
                </button>
                <button 
                  onClick={() => navigate("/documents")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 transition-all text-xs font-semibold text-slate-700 hover:text-sky-700"
                >
                  <ShieldCheck className="h-4 w-4 mb-1 text-emerald-600" />
                  <span>OCR Check</span>
                </button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/analytics")}
                className="w-full text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Corridor Intelligence <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Card>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Trips Table */}
            <Card className="executive-card lg:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-sky-600" />
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Fleet Trips</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/trips")}
                  className="text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 p-0 h-auto font-semibold"
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
                      <Button onClick={() => navigate("/trips/new")} className="btn-executive-primary font-semibold rounded-lg text-xs">
                        Create a trip
                      </Button>
                    } 
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.recent_trips.map((t) => (
                    <button 
                      key={t.id} 
                      data-testid={`dashboard-trip-${t.id}`}
                      onClick={() => navigate(`/trips/${t.id}`)}
                      className="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-slate-50/80 group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2.5">
                          <RouteStrip origin={t.origin} destination={t.destination} className="text-sm group-hover:text-sky-600 transition-colors" />
                          {t.is_demo && <SyntheticBadge />}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span>{fmtDate(t.travel_date)}</span>
                          {t.vehicle_number && <span className="font-mono text-slate-600">{t.vehicle_number}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {t.risk_level ? (
                          <RiskBadge level={t.risk_level} score={t.risk_score} />
                        ) : (
                          <span className="text-xs text-slate-400 px-2.5 py-1 rounded-full bg-slate-100">Unanalyzed</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Route & Document Alerts */}
            <Card className="executive-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <Bell className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Route & Document Alerts</h2>
              </div>
              <div className="p-5">
                {data.alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2 border border-emerald-200">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">All Clear</p>
                    <p className="text-xs text-slate-500 mt-1">No active compliance or distance anomalies flagged.</p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {data.alerts.map((a, i) => (
                      <li 
                        key={i} 
                        className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed"
                      >
                        {a.type === "distance" ? (
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        ) : a.type === "document" ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        ) : (
                          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                        )}
                        <span className="text-slate-800 font-medium">{a.message}</span>
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
