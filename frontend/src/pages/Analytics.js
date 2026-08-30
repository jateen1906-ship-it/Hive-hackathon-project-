import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { MapPin, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnalyticsAPI } from "@/lib/apiClient";
import { KpiCard } from "@/components/common/KpiCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { CorridorMap } from "@/components/dashboard/CorridorMap";
import { RiskBadge } from "@/components/common/RiskBadge";
import { useBilling } from "@/hooks/useBilling";

const RISK_COLORS = {
  LOW: "#10b981", 
  MEDIUM: "#f59e0b", 
  HIGH: "#ea580c", 
  CRITICAL: "#dc2626",
};

export default function Analytics() {
  const navigate = useNavigate();
  const billing = useBilling();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: AnalyticsAPI.dashboard });
  const { data: corridorData } = useQuery({ queryKey: ["corridors"], queryFn: AnalyticsAPI.corridors, enabled: billing.can.corridorView });
  const [detail, setDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [period, setPeriod] = React.useState("all");

  const thisMonth = new Date().toISOString().slice(0, 7);
  const filteredTrips = React.useMemo(() => {
    if (!data?.recent_trips) return [];
    if (period === "month") {
      return data.recent_trips.filter(t => (t.travel_date || t.created_at || "").startsWith(thisMonth));
    }
    return data.recent_trips;
  }, [data, period, thisMonth]);

  const openDrill = async (c) => {
    setDetailLoading(true);
    setDetail({ corridor: c, data: null });
    try {
      const d = await AnalyticsAPI.corridorDetail(c.origin, c.destination);
      setDetail({ corridor: c, data: d });
    } catch (e) {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Fleet Analytics</h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">Risk distribution and incident heatmap across national corridors.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs">
          <button
            className={`rounded-md px-3.5 py-1.5 font-semibold transition-colors ${period === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
            onClick={() => setPeriod("all")}
          >All Time</button>
          <button
            className={`rounded-md px-3.5 py-1.5 font-semibold transition-colors ${period === "month" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
            onClick={() => setPeriod("month")}
          >This Month</button>
        </div>
      </div>

      {isLoading && <LoadingState label="Loading analytics…" rows={3} />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Trips" value={data.kpis.total_trips} accent="#2563eb" />
            <KpiCard label="Avg Risk Score" value={data.kpis.avg_risk_score} accent="#0284c7" hint="out of 100" />
            <KpiCard label="High + Critical" value={data.kpis.high + data.kpis.critical} accent="#ef4444" />
            <KpiCard label="Total Incidents" value={data.kpis.incidents} accent="#6366f1" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Risk distribution donut */}
            <Card className="p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800">Risk Distribution Ratio</h2>
              {data.kpis.total_trips === 0 ? (
                <EmptyState title="No trips yet" description="Analyze trips to see their risk spread." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.risk_distribution.filter((d) => d.count > 0)} dataKey="count" nameKey="level"
                         cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4}>
                      {data.risk_distribution.map((d) => <Cell key={d.level} fill={RISK_COLORS[d.level]} stroke="#ffffff" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "0.5rem", color: "#0f172a" }} />
                    <Legend wrapperStyle={{ color: "#64748b", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Bar chart */}
            <Card className="p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800">Trips By Severity Tier</h2>
              {data.kpis.total_trips === 0 ? (
                <EmptyState title="No trips yet" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.risk_distribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="level" tick={{ fontSize: 12, fill: "#64748b" }} stroke="#e2e8f0" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} stroke="#e2e8f0" />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "0.5rem", color: "#0f172a" }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {data.risk_distribution.map((d) => <Cell key={d.level} fill={RISK_COLORS[d.level]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Corridor risk heatmap */}
          <Card className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Corridor Risk Intelligence</h2>
              </div>
              <SyntheticBadge />
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Corridor density circles represent checkpost frequency. Line color indicates evaluated corridor risk index.
              {billing.can.corridorDrilldown ? " Click any corridor to drill down." : ""}
            </p>
            {!billing.can.corridorView ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center" data-testid="corridor-locked">
                <Lock className="mb-2.5 h-8 w-8 text-slate-400" />
                <h3 className="text-base font-bold text-slate-900">Corridor Intelligence is Locked</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500">Upgrade to Growth or Pro to view live corridor safety heatmaps and checkpost drill-down.</p>
                <Button className="btn-primary-blue mt-4 font-semibold text-xs rounded-lg h-9 px-4" onClick={() => navigate("/pricing")} data-testid="corridor-upgrade">View Growth & Pro Plans</Button>
              </div>
            ) : corridorData && corridorData.corridors?.length > 0 ? (
              <CorridorMap corridors={corridorData.corridors} incidentPoints={corridorData.incident_points || []}
                onCorridorClick={billing.can.corridorDrilldown ? openDrill : undefined} />
            ) : (
              <EmptyState title="No corridor data recorded" description="Corridor signals populate dynamically as trips and checks accumulate." />
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 border-t border-slate-100 pt-4">
              {[["Low Risk", "#10b981"], ["Medium Risk", "#f59e0b"], ["High Risk", "#ea580c"], ["Critical Risk", "#dc2626"]].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />{l}
                </span>
              ))}
            </div>
          </Card>

          <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
            <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900">
              <DialogHeader><DialogTitle className="text-slate-900">{detail?.corridor?.corridor_name || "Corridor Detail"}</DialogTitle></DialogHeader>
              {detailLoading && <LoadingState label="Loading corridor detail…" rows={2} />}
              {detail?.data && (
                <div className="max-h-[60vh] space-y-4 overflow-auto">
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-700">Trips on this corridor ({detail.data.trips.length})</h4>
                    {detail.data.trips.length === 0 ? <p className="text-xs text-slate-400">No trips recorded.</p> : (
                      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50">
                        {detail.data.trips.map((t) => (
                          <button key={t.id} onClick={() => navigate(`/trips/${t.id}`)} className="flex w-full items-center justify-between p-3 text-left text-xs hover:bg-slate-100" data-testid={`drill-trip-${t.id}`}>
                            <span className="font-semibold text-slate-900">{t.origin} → {t.destination}</span>
                            {t.risk_level ? <RiskBadge level={t.risk_level} score={t.risk_score} /> : <span className="text-xs text-slate-400">Not analyzed</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Incidents Logged ({detail.data.incidents.length})</h4>
                    {detail.data.incidents.length === 0 ? <p className="text-xs text-slate-400">No incidents recorded.</p> : (
                      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50">
                        {detail.data.incidents.map((i) => (
                          <div key={i.id} className="p-3 text-xs">
                            <span className="font-semibold text-slate-900 capitalize">{(i.incident_type || "").replace(/_/g, " ")}</span>
                            <span className="text-slate-500"> · {(i.outcome || "").replace(/_/g, " ")}</span>
                            {i.reason ? <span className="text-slate-600"> · {i.reason}</span> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Disclaimer />
        </div>
      )}
    </div>
  );
}
