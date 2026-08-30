import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Truck, AlertTriangle, Bell, ArrowRight, MapPin, 
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
        title="Fleet Dashboard"
        subtitle="Real-time compliance monitoring, route clearance, and risk alerts."
        actions={
          <Button 
            onClick={() => navigate("/trips/new")} 
            data-testid="dashboard-new-trip"
            className="btn-primary-blue h-9 px-4 text-xs font-semibold"
          >
            <Truck className="mr-1.5 h-3.5 w-3.5" />
            <span>New Trip</span>
          </Button>
        }
      />

      {isLoading && <LoadingState label="Loading fleet overview…" rows={4} />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (
        <div className="space-y-6">
          {/* Top 5 KPI Cards - Balanced use of #85D1DB, #B6F2D1, #B3EBF2, #C9FDF2 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard 
              label="Active Trips" 
              value={data.kpis.active_trips} 
              testId="dashboard-kpi-active" 
              accent="#85d1db" 
              hint={`${data.kpis.total_trips} total recorded`} 
            />
            <KpiCard 
              label="High Risk" 
              value={data.kpis.high} 
              testId="dashboard-kpi-high-risk" 
              accent="#f43f5e" 
              hint="Requires attention"
            />
            <KpiCard 
              label="Medium Risk" 
              value={data.kpis.medium} 
              testId="dashboard-kpi-medium-risk" 
              accent="#85d1db" 
              hint="Check compliance"
            />
            <KpiCard 
              label="Low Risk" 
              value={data.kpis.low} 
              testId="dashboard-kpi-low-risk" 
              accent="#10b981" 
              hint="Cleared for dispatch"
            />
            <KpiCard 
              label="Incidents" 
              value={data.kpis.incidents} 
              testId="dashboard-kpi-incidents" 
              accent="#58b9c6" 
              hint="Reported on route"
            />
          </div>

          {/* Featured Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Master Fleet Card (#85D1DB, #B6F2D1, #C9FDF2) */}
            <div className="fleet-card-slate p-6 flex flex-col justify-between min-h-[190px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#85d1db] flex items-center justify-center text-[#093b44] font-bold">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#c9fdf2]">Fleet Intelligence</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#b6f2d1] text-[#0d381e] border border-[#95e3b6]">
                  {billing.plan.toUpperCase()} ACTIVE
                </span>
              </div>
              <div className="my-2">
                <div className="text-[11px] text-[#b3ebf2] font-medium mb-1">Company Fleet Identifier</div>
                <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white">
                  TS-{user?.id ? String(user.id).slice(0, 8).toUpperCase() : "FLEET-001"}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-[#c9fdf2] border-t border-[#1a5b67] pt-3">
                <span className="truncate max-w-[170px]">Fleet: {user?.company_name || "Logistics Network"}</span>
                <span className="text-[#b6f2d1] font-semibold text-xs">Live Engine Online</span>
              </div>
            </div>

            {/* Compliance Safety Rate Card (#B6F2D1 & #B3EBF2) */}
            <Card className="p-6 flex flex-col justify-between border-[#b3ebf2]">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-[#507e86]">Fleet Safety Rate</div>
                <TrendingUp className="h-4 w-4 text-[#0d381e]" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-[#0c333a]">{safePercent}%</span>
                <span className="text-xs text-[#0d381e] font-semibold">compliant pre-checks</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded-full bg-[#c9fdf2] overflow-hidden flex border border-[#b3ebf2]">
                  <div style={{ width: `${(lowRisk / (totalTrips || 1)) * 100}%` }} className="bg-[#b6f2d1] h-full" />
                  <div style={{ width: `${(medRisk / (totalTrips || 1)) * 100}%` }} className="bg-[#85d1db] h-full" />
                  <div style={{ width: `${(highRisk / (totalTrips || 1)) * 100}%` }} className="bg-[#f43f5e] h-full" />
                </div>
                <div className="flex justify-between text-[11px] text-[#507e86] font-medium">
                  <span className="text-[#0d381e] font-bold">{lowRisk} Low (#B6F2D1)</span>
                  <span className="text-[#094751] font-bold">{medRisk} Med (#85D1DB)</span>
                  <span className="text-[#881337] font-bold">{highRisk} High/Crit</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions Card (#C9FDF2, #B3EBF2, #85D1DB, #B6F2D1) */}
            <Card className="p-6 flex flex-col justify-between border-[#b3ebf2]">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-[#507e86]">Quick Actions</div>
                <Zap className="h-4 w-4 text-[#85d1db]" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 my-2">
                <button 
                  onClick={() => navigate("/trips/new")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#b3ebf2]/40 hover:bg-[#b3ebf2] border border-[#85d1db] transition-colors text-xs font-bold text-[#0c333a] hover:text-[#094751]"
                >
                  <Truck className="h-4 w-4 mb-1 text-[#094751]" />
                  <span>Analyze Trip</span>
                </button>
                <button 
                  onClick={() => navigate("/documents")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#b6f2d1]/40 hover:bg-[#b6f2d1] border border-[#95e3b6] transition-colors text-xs font-bold text-[#0c333a] hover:text-[#0d381e]"
                >
                  <ShieldCheck className="h-4 w-4 mb-1 text-[#0d381e]" />
                  <span>OCR Check</span>
                </button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/analytics")}
                className="w-full text-xs border-[#85d1db] text-[#0c333a] hover:bg-[#c9fdf2] h-8 font-semibold"
              >
                Corridor Intelligence <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Card>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Trips Table */}
            <Card className="lg:col-span-2 overflow-hidden border-[#b3ebf2]">
              <div className="flex items-center justify-between border-b border-[#b3ebf2] px-6 py-4 bg-[#c9fdf2]/50">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#094751]" />
                  <h2 className="text-sm font-bold text-[#0c333a]">Recent Fleet Trips</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/trips")}
                  className="text-xs text-[#094751] hover:text-[#05262c] p-0 h-auto font-bold"
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
                      <Button onClick={() => navigate("/trips/new")} className="btn-primary-blue text-xs h-8 px-4 font-semibold">
                        Create a trip
                      </Button>
                    } 
                  />
                </div>
              ) : (
                <div className="divide-y divide-[#b3ebf2]/40">
                  {data.recent_trips.map((t) => (
                    <button 
                      key={t.id} 
                      data-testid={`dashboard-trip-${t.id}`}
                      onClick={() => navigate(`/trips/${t.id}`)}
                      className="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-[#c9fdf2]/40 group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2.5">
                          <RouteStrip origin={t.origin} destination={t.destination} className="text-sm group-hover:text-[#094751] transition-colors" />
                          {t.is_demo && <SyntheticBadge />}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[#507e86] font-medium">
                          <span>{fmtDate(t.travel_date)}</span>
                          {t.vehicle_number && <span className="font-mono text-[#0c333a] bg-[#b3ebf2]/40 border border-[#b3ebf2] px-1.5 py-0.5 rounded text-[11px]">{t.vehicle_number}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {t.risk_level ? (
                          <RiskBadge level={t.risk_level} score={t.risk_score} />
                        ) : (
                          <span className="text-xs text-[#507e86] px-2 py-0.5 rounded bg-[#b3ebf2]/40">Unanalyzed</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-[#85d1db] group-hover:text-[#0c333a] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Route Alerts */}
            <Card className="overflow-hidden border-[#b3ebf2]">
              <div className="flex items-center gap-2 border-b border-[#b3ebf2] px-6 py-4 bg-[#c9fdf2]/50">
                <Bell className="h-4 w-4 text-[#094751]" />
                <h2 className="text-sm font-bold text-[#0c333a]">Route & Document Alerts</h2>
              </div>
              <div className="p-5">
                {data.alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="h-10 w-10 rounded-full bg-[#b6f2d1] flex items-center justify-center text-[#0d381e] mb-2 border border-[#95e3b6]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-[#0c333a]">All Clear</p>
                    <p className="text-xs text-[#507e86] mt-1">No active compliance or distance anomalies flagged.</p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {data.alerts.map((a, i) => (
                      <li 
                        key={i} 
                        className="flex items-start gap-3 rounded-lg border border-[#b3ebf2] bg-[#c9fdf2]/30 p-3 text-xs leading-relaxed"
                      >
                        {a.type === "distance" ? (
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#85d1db]" />
                        ) : a.type === "document" ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f43f5e]" />
                        ) : (
                          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#094751]" />
                        )}
                        <span className="text-[#0c333a] font-semibold">{a.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          <Disclaimer />
        </div>
      )}
    </div>
  );
}
