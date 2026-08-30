import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IncidentAPI } from "@/lib/apiClient";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { SyntheticBadge, Disclaimer } from "@/components/common/Disclaimer";
import { PageHeader } from "@/components/common/PageHeader";
import { fmtDate } from "@/lib/riskMeta";

const OUTCOME_STYLE = {
  released: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  delayed: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  further_review: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  penalty_reported: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  unknown: "text-slate-400 bg-white/[0.04] border-white/[0.08]",
};

export default function Incidents() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["incidents"], queryFn: IncidentAPI.list });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Incident Intelligence" 
        subtitle="Log enforcement stops, RTO checks, and route delays to feed corridor safety signals."
        actions={
          <Button 
            onClick={() => navigate("/incidents/new")} 
            data-testid="incidents-new-button"
            className="btn-cyber-cyan font-bold rounded-xl text-xs px-4"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />Report Incident
          </Button>
        } 
      />

      {isLoading && <LoadingState label="Loading corridor incident intelligence…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState 
          title="No incidents recorded" 
          description="Report a stop or document check to start building corridor intelligence."
          action={
            <Button onClick={() => navigate("/incidents/new")} className="btn-cyber-cyan font-bold rounded-xl text-xs">
              Report an incident
            </Button>
          } 
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((i) => (
            <Card key={i.id} className="rich-card p-5" data-testid={`incident-card-${i.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-white">{i.location_name || "Transit Corridor"}</span>
                </div>
                {i.is_demo && <SyntheticBadge />}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 capitalize text-slate-300 font-medium">{(i.incident_type || "").replace(/_/g, " ")}</span>
                <span className={`rounded-full px-2.5 py-0.5 capitalize border font-bold ${OUTCOME_STYLE[i.outcome] || "bg-white/[0.04] text-slate-300"}`}>{(i.outcome || "").replace(/_/g, " ")}</span>
                <span className="text-slate-500 text-[11px] ml-auto font-medium">{fmtDate(i.occurred_at)}</span>
              </div>
              {i.reason && <p className="mt-3 text-xs text-slate-300 leading-relaxed"><span className="font-bold text-slate-400">Reason: </span>{i.reason}</p>}
              {i.notes && <p className="mt-2 text-xs text-slate-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">{i.notes}</p>}
            </Card>
          ))}
        </div>
      ))}
      <Disclaimer />
    </div>
  );
}
