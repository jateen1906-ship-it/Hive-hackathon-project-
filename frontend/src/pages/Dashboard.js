import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, AlertTriangle, ShieldAlert, Bell, ArrowRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsAPI } from "@/lib/apiClient";
import { KpiCard } from "@/components/common/KpiCard";
import { RiskBadge } from "@/components/common/RiskBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { PageHeader, RouteStrip } from "@/components/common/PageHeader";
import { fmtDate } from "@/lib/riskMeta";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: AnalyticsAPI.dashboard,
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="What should your fleet worry about today?"
        actions={<Button onClick={() => navigate("/trips/new")} data-testid="dashboard-new-trip"><Truck className="mr-2 h-4 w-4" />New Trip</Button>}
      />

      {isLoading && <LoadingState label="Loading fleet overview…" rows={4} />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard label="Active Trips" value={data.kpis.active_trips} testId="dashboard-kpi-active" accent="hsl(var(--chart-1))" hint={`${data.kpis.total_trips} total`} />
            <KpiCard label="High Risk" value={data.kpis.high} testId="dashboard-kpi-high-risk" accent="hsl(var(--risk-high))" />
            <KpiCard label="Medium Risk" value={data.kpis.medium} testId="dashboard-kpi-medium-risk" accent="hsl(var(--risk-medium))" />
            <KpiCard label="Low Risk" value={data.kpis.low} testId="dashboard-kpi-low-risk" accent="hsl(var(--risk-low))" />
            <KpiCard label="Incidents" value={data.kpis.incidents} testId="dashboard-kpi-incidents" accent="hsl(var(--chart-2))" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent trips */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-sm font-semibold">Recent Trips</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate("/trips")}>View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
              </div>
              {data.recent_trips.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No trips yet" description="Create your first trip to see its risk analysis."
                    action={<Button onClick={() => navigate("/trips/new")}>Create a trip</Button>} />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {data.recent_trips.map((t) => (
                    <button key={t.id} data-testid={`dashboard-trip-${t.id}`}
                            onClick={() => navigate(`/trips/${t.id}`)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <RouteStrip origin={t.origin} destination={t.destination} className="text-sm" />
                          {t.is_demo && <SyntheticBadge />}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(t.travel_date)}</div>
                      </div>
                      {t.risk_level ? <RiskBadge level={t.risk_level} score={t.risk_score} /> :
                        <span className="text-xs text-muted-foreground">Not analyzed</span>}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Alerts */}
            <Card>
              <div className="flex items-center gap-2 border-b border-border p-4">
                <Bell className="h-4 w-4 text-slate-600" />
                <h2 className="text-sm font-semibold">Route & Document Alerts</h2>
              </div>
              <div className="p-4">
                {data.alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <ShieldAlert className="mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No alerts right now.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {data.alerts.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
                        {a.type === "distance" ? <MapPin className="mt-0.5 h-4 w-4 text-amber-600" /> :
                          a.type === "document" ? <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" /> :
                          <Truck className="mt-0.5 h-4 w-4 text-slate-600" />}
                        <span>{a.message}</span>
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
