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
          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard 
              label="Active Trips" 
              value={data.kpis.active_trips} 
              testId="dashboard-kpi-active" 
              accent="#e35336" 
              hint={`${data.kpis.total_trips} total recorded`} 
            />
            <KpiCard 
              label="High Risk" 
              value={data.kpis.high} 
              testId="dashboard-kpi-high-risk" 
              accent="#8a2b0e" 
              hint="Requires attention"
            />
            <KpiCard 
              label="Medium Risk" 
              value={data.kpis.medium} 
              testId="dashboard-kpi-medium-risk" 
              accent="#fca566" 
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
              accent="#9988a1" 
              hint="Reported on route"
            />
          </div>

          {/* Featured Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Fleet Master Card */}
            <div className="fleet-card-slate p-6 flex flex-col justify-between min-h-[190px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#e35336] flex items-center justify-center text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ffd3ac]">Fleet Intelligence</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#ffd3ac] text-[#8a2b0e] border border-[#ffd3ac]/50">
                  {billing.plan.toUpperCase()} ACTIVE
                </span>
              </div>
              <div className="my-2">
                <div className="text-[11px] text-[#ffd3ac]/90 font-medium mb-1">Company Fleet Identifier</div>
                <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white">
                  TS-{user?.id ? String(user.id).slice(0, 8).toUpperCase() : "FLEET-001"}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-[#ffd3ac]/90 border-t border-[#b8421b] pt-3">
                <span className="truncate max-w-[170px]">Fleet: {user?.company_name || "Logistics Network"}</span>
                <span className="text-[#ffd3ac] font-semibold text-xs">Live Engine Online</span>
              </div>
            </div>

            {/* Compliance Safety Rate Card */}
            <Card className="p-6 flex flex-col justify-between border-[#ffd3ac]">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-[#7b6d82]">Fleet Safety Rate</div>
                <TrendingUp className="h-4 w-4 text-[#10b981]" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-[#2c1810]">{safePercent}%</span>
                <span className="text-xs text-[#10b981] font-semibold">compliant pre-checks</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-[#fdf2e9] overflow-hidden flex border border-[#ffd3ac]">
                  <div style={{ width: `${(lowRisk / (totalTrips || 1)) * 100}%` }} className="bg-[#10b981] h-full" />
                  <div style={{ width: `${(medRisk / (totalTrips || 1)) * 100}%` }} className="bg-[#fca566] h-full" />
                  <div style={{ width: `${(highRisk / (totalTrips || 1)) * 100}%` }} className="bg-[#e35336] h-full" />
                </div>
                <div className="flex justify-between text-[11px] text-[#7b6d82] font-medium">
                  <span className="text-[#10b981] font-semibold">{lowRisk} Low</span>
                  <span className="text-[#e35336] font-semibold">{medRisk} Med</span>
                  <span className="text-[#8a2b0e] font-semibold">{highRisk} High/Crit</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card className="p-6 flex flex-col justify-between border-[#ffd3ac]">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-[#7b6d82]">Quick Actions</div>
                <Zap className="h-4 w-4 text-[#e35336]" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 my-2">
                <button 
                  onClick={() => navigate("/trips/new")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#fdf8f4] hover:bg-[#fff0e4] border border-[#ffd3ac] transition-colors text-xs font-semibold text-[#2c1810] hover:text-[#8a2b0e]"
                >
                  <Truck className="h-4 w-4 mb-1 text-[#e35336]" />
                  <span>Analyze Trip</span>
                </button>
                <button 
                  onClick={() => navigate("/documents")}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#fdf8f4] hover:bg-[#f0ecf3] border border-[#ffd3ac] transition-colors text-xs font-semibold text-[#2c1810] hover:text-[#5c4d65]"
                >
                  <ShieldCheck className="h-4 w-4 mb-1 text-[#9988a1]" />
                  <span>OCR Check</span>
                </button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/analytics")}
                className="w-full text-xs border-[#ffd3ac] text-[#2c1810] hover:bg-[#fff0e4] h-8 font-medium"
              >
                Corridor Intelligence <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Card>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Trips Table */}
            <Card className="lg:col-span-2 overflow-hidden border-[#ffd3ac]">
              <div className="flex items-center justify-between border-b border-[#ffd3ac] px-6 py-4 bg-[#fdf8f4]">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#e35336]" />
                  <h2 className="text-sm font-bold text-[#2c1810]">Recent Fleet Trips</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/trips")}
                  className="text-xs text-[#8a2b0e] hover:text-[#e35336] p-0 h-auto font-semibold"
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
                <div className="divide-y divide-[#faede3]">
                  {data.recent_trips.map((t) => (
                    <button 
                      key={t.id} 
                      data-testid={`dashboard-trip-${t.id}`}
                      onClick={() => navigate(`/trips/${t.id}`)}
                      className="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-[#fff8f3] group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2.5">
                          <RouteStrip origin={t.origin} destination={t.destination} className="text-sm group-hover:text-[#8a2b0e] transition-colors" />
                          {t.is_demo && <SyntheticBadge />}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[#7b6d82] font-medium">
                          <span>{fmtDate(t.travel_date)}</span>
                          {t.vehicle_number && <span className="font-mono text-[#2c1810] bg-[#faede3] px-1.5 py-0.5 rounded text-[11px]">{t.vehicle_number}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {t.risk_level ? (
                          <RiskBadge level={t.risk_level} score={t.risk_score} />
                        ) : (
                          <span className="text-xs text-[#7b6d82] px-2 py-0.5 rounded bg-[#faede3]">Unanalyzed</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-[#9988a1] group-hover:text-[#2c1810] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Route Alerts */}
            <Card className="overflow-hidden border-[#ffd3ac]">
              <div className="flex items-center gap-2 border-b border-[#ffd3ac] px-6 py-4 bg-[#fdf8f4]">
                <Bell className="h-4 w-4 text-[#e35336]" />
                <h2 className="text-sm font-bold text-[#2c1810]">Route & Document Alerts</h2>
              </div>
              <div className="p-5">
                {data.alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="h-10 w-10 rounded-full bg-[#fff0e4] flex items-center justify-center text-[#8a2b0e] mb-2 border border-[#ffd3ac]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-[#2c1810]">All Clear</p>
                    <p className="text-xs text-[#7b6d82] mt-1">No active compliance or distance anomalies flagged.</p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {data.alerts.map((a, i) => (
                      <li 
                        key={i} 
                        className="flex items-start gap-3 rounded-lg border border-[#ffd3ac] bg-[#fdf8f4] p-3 text-xs leading-relaxed"
                      >
                        {a.type === "distance" ? (
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#e35336]" />
                        ) : a.type === "document" ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8a2b0e]" />
                        ) : (
                          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#9988a1]" />
                        )}
                        <span className="text-[#2c1810] font-medium">{a.message}</span>
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
