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
import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer, SyntheticBadge } from "@/components/common/Disclaimer";
import { CorridorMap } from "@/components/dashboard/CorridorMap";
import { RiskBadge } from "@/components/common/RiskBadge";
import { useBilling } from "@/hooks/useBilling";

const RISK_COLORS = {
  LOW: "hsl(142 71% 40%)", MEDIUM: "hsl(38 92% 45%)", HIGH: "hsl(0 84% 55%)", CRITICAL: "hsl(0 74% 38%)",
};

export default function Analytics() {
  const navigate = useNavigate();
  const billing = useBilling();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: AnalyticsAPI.dashboard });
  const { data: corridorData } = useQuery({ queryKey: ["corridors"], queryFn: AnalyticsAPI.corridors, enabled: billing.can.corridorView });
  const [detail, setDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

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
    <div>
      <PageHeader title="Analytics" subtitle="Risk distribution and incident overview across your fleet." />
      {isLoading && <LoadingState label="Loading analytics…" rows={3} />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Trips" value={data.kpis.total_trips} accent="hsl(var(--chart-1))" />
            <KpiCard label="Avg Risk Score" value={data.kpis.avg_risk_score} accent="hsl(var(--chart-2))" hint="out of 100" />
            <KpiCard label="High + Critical" value={data.kpis.high + data.kpis.critical} accent="hsl(var(--risk-high))" />
            <KpiCard label="Incidents" value={data.kpis.incidents} accent="hsl(var(--chart-4))" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Risk distribution</h2>
              {data.kpis.total_trips === 0 ? (
                <EmptyState title="No trips yet" description="Analyze trips to see their risk spread." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.risk_distribution.filter((d) => d.count > 0)} dataKey="count" nameKey="level"
                         cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {data.risk_distribution.map((d) => <Cell key={d.level} fill={RISK_COLORS[d.level]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Trips by risk level</h2>
              {data.kpis.total_trips === 0 ? (
                <EmptyState title="No trips yet" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.risk_distribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {data.risk_distribution.map((d) => <Cell key={d.level} fill={RISK_COLORS[d.level]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-600" />
                <h2 className="text-sm font-semibold">Corridor risk heatmap</h2>
              </div>
              <SyntheticBadge />
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Larger circles = more checks/incidents on that corridor. Line colour reflects the corridor risk score.
              {billing.can.corridorDrilldown ? " Click a corridor to drill down." : ""}
              {" "}Demonstration data — not derived from live enforcement activity.
            </p>
            {!billing.can.corridorView ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-14 text-center" data-testid="corridor-locked">
                <Lock className="mb-2 h-7 w-7 text-muted-foreground" />
                <h3 className="text-base font-semibold">Corridor heatmap is a paid feature</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Upgrade to Growth to view corridor intelligence, or Pro for full drill-down.</p>
                <Button className="mt-4" onClick={() => navigate("/pricing")} data-testid="corridor-upgrade">View plans</Button>
              </div>
            ) : corridorData && corridorData.corridors?.length > 0 ? (
              <CorridorMap corridors={corridorData.corridors} incidentPoints={corridorData.incident_points || []}
                onCorridorClick={billing.can.corridorDrilldown ? openDrill : undefined} />
            ) : (
              <EmptyState title="No corridor data yet" description="Corridor intelligence appears here as trips and incidents accumulate." />
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {[["Low", "#16a34a"], ["Medium", "#d97706"], ["High", "#dc2626"], ["Critical", "#991b1b"]].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />{l}
                </span>
              ))}
            </div>
          </Card>

          <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{detail?.corridor?.corridor_name || "Corridor detail"}</DialogTitle></DialogHeader>
              {detailLoading && <LoadingState label="Loading corridor detail…" rows={2} />}
              {detail?.data && (
                <div className="max-h-[60vh] space-y-4 overflow-auto">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Trips on this corridor ({detail.data.trips.length})</h4>
                    {detail.data.trips.length === 0 ? <p className="text-sm text-muted-foreground">No trips yet.</p> : (
                      <div className="divide-y divide-border rounded-lg border border-border">
                        {detail.data.trips.map((t) => (
                          <button key={t.id} onClick={() => navigate(`/trips/${t.id}`)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary/50" data-testid={`drill-trip-${t.id}`}>
                            <span>{t.origin} → {t.destination}</span>
                            {t.risk_level ? <RiskBadge level={t.risk_level} score={t.risk_score} /> : <span className="text-xs text-muted-foreground">Not analyzed</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Incidents ({detail.data.incidents.length})</h4>
                    {detail.data.incidents.length === 0 ? <p className="text-sm text-muted-foreground">No incidents recorded.</p> : (
                      <div className="divide-y divide-border rounded-lg border border-border">
                        {detail.data.incidents.map((i) => (
                          <div key={i.id} className="px-3 py-2 text-sm">
                            <span className="capitalize">{(i.incident_type || "").replace(/_/g, " ")}</span>
                            <span className="text-muted-foreground"> · {(i.outcome || "").replace(/_/g, " ")}</span>
                            {i.reason ? <span className="text-muted-foreground"> · {i.reason}</span> : null}
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
