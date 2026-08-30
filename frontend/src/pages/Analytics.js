import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { MapPin, Lock, BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnalyticsAPI } from "@/lib/apiClient";
import { KpiCard } from "@/components/common/KpiCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { CorridorMap } from "@/components/dashboard/CorridorMap";
import { RiskBadge } from "@/components/common/RiskBadge";
import { useBilling } from "@/hooks/useBilling";

const RISK_COLORS = {
  LOW: "#10b981", 
  MEDIUM: "#f59e0b", 
  HIGH: "#f97316", 
  CRITICAL: "#ef4444",
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
            Corridor & Risk Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">Risk density distributions and geospatial checkpost telemetry across India.</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 text-xs">
          <button
            className={`rounded-lg px-3.5 py-1.5 font-bold transition-all ${period === "all" ? "bg-sky-500 text-white shadow-md font-bold" : "text-slate-400 hover:text-white"}`}
            onClick={() => setPeriod("all")}
          >All Time</button>
          <button
            className={`rounded-lg px-3.5 py-1.5 font-bold transition-all ${period === "month" ? "bg-sky-500 text-white shadow-md font-bold" : "text-slate-400 hover:text-white"}`}
            onClick={() => setPeriod("month")}
          >This Month</button>
        </div>
      </div>

      {isLoading && <LoadingState label="Computing corridor risk indices…" rows={3} />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Dispatches" value={data.kpis.total_trips} accent="#38bdf8" />
            <KpiCard label="Fleet Mean Risk" value={data.kpis.avg_risk_score} accent="#f59e0b" hint="out of 100" />
            <KpiCard label="High + Critical Risk" value={data.kpis.high + data.kpis.critical} accent="#ef4444" />
            <KpiCard label="Highway Incidents" value={data.kpis.incidents} accent="#a855f7" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Donut chart */}
            <Card className="rich-card p-6">
              <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-white">Risk Tier Breakdown</h2>
              {data.kpis.total_trips === 0 ? (
                <EmptyState title="No trips yet" description="Analyze dispatches to generate risk spread." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.risk_distribution.filter((d) => d.count > 0)} dataKey="count" nameKey="level"
                         cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4}>
                      {data.risk_distribution.map((d) => <Cell key={d.level} fill={RISK_COLORS[d.level]} stroke="#07090e" strokeWidth={3} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#f8fafc" }} />
                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Bar chart */}
            <Card className="rich-card p-6">
              <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-white">Trips By Severity Tier</h2>
              {data.kpis.total_trips === 0 ? (
                <EmptyState title="No trips yet" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.risk_distribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="level" tick={{ fontSize: 12, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#f8fafc" }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {data.risk_distribution.map((d) => <Cell key={d.level} fill={RISK_COLORS[d.level]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Corridor risk heatmap */}
          <Card className="rich-card p-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">National Corridor Risk Matrix</h2>
              </div>
              <SyntheticBadge />
            </div>
            <p className="mb-4 text-xs text-slate-400">
              Corridor density points represent checkpost frequency. Line color indicates evaluated corridor risk index.
              {billing.can.corridorDrilldown ? " Click any corridor to drill down." : ""}
            </p>
            {!billing.can.corridorView ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-14 text-center" data-testid="corridor-locked">
                <Lock className="mb-3 h-8 w-8 text-amber-400" />
                <h3 className="text-base font-bold text-white">Corridor Intelligence is Locked</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-400">Upgrade to Growth or Pro to view live corridor safety heatmaps and checkpost drill-down.</p>
                <Button className="btn-cyber-cyan mt-5 font-bold text-xs rounded-xl px-5" onClick={() => navigate("/pricing")} data-testid="corridor-upgrade">View Growth & Pro Plans</Button>
              </div>
            ) : corridorData && corridorData.corridors?.length > 0 ? (
              <CorridorMap corridors={corridorData.corridors} incidentPoints={corridorData.incident_points || []}
                onCorridorClick={billing.can.corridorDrilldown ? openDrill : undefined} />
            ) : (
              <EmptyState title="No corridor data recorded" description="Corridor signals populate dynamically as trips and checks accumulate." />
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400 border-t border-white/[0.08] pt-4">
              {[["Low Risk", "#10b981"], ["Medium Risk", "#f59e0b"], ["High Risk", "#f97316"], ["Critical Risk", "#ef4444"]].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5 font-bold text-slate-300">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }} />{l}
                </span>
              ))}
            </div>
          </Card>

          <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
            <DialogContent className="max-w-2xl bg-[#0f172a] border-white/[0.1] text-slate-100 rounded-2xl">
              <DialogHeader><DialogTitle className="text-white">{detail?.corridor?.corridor_name || "Corridor Detail"}</DialogTitle></DialogHeader>
              {detailLoading && <LoadingState label="Loading corridor detail…" rows={2} />}
              {detail?.data && (
                <div className="max-h-[60vh] space-y-4 overflow-auto">
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-400">Trips on this corridor ({detail.data.trips.length})</h4>
                    {detail.data.trips.length === 0 ? <p className="text-xs text-slate-500">No trips recorded.</p> : (
                      <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-white/[0.02]">
                        {detail.data.trips.map((t) => (
                          <button key={t.id} onClick={() => navigate(`/trips/${t.id}`)} className="flex w-full items-center justify-between p-3 text-left text-xs hover:bg-white/[0.04]" data-testid={`drill-trip-${t.id}`}>
                            <span className="font-bold text-white">{t.origin} → {t.destination}</span>
                            {t.risk_level ? <RiskBadge level={t.risk_level} score={t.risk_score} /> : <span className="text-xs text-slate-500">Not analyzed</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">Incidents Logged ({detail.data.incidents.length})</h4>
                    {detail.data.incidents.length === 0 ? <p className="text-xs text-slate-500">No incidents recorded.</p> : (
                      <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-white/[0.02]">
                        {detail.data.incidents.map((i) => (
                          <div key={i.id} className="p-3 text-xs">
                            <span className="font-bold text-white capitalize">{(i.incident_type || "").replace(/_/g, " ")}</span>
                            <span className="text-slate-400"> · {(i.outcome || "").replace(/_/g, " ")}</span>
                            {i.reason ? <span className="text-slate-300"> · {i.reason}</span> : null}
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
