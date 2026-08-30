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
  released: "text-emerald-700 bg-emerald-50 border-emerald-200",
  delayed: "text-amber-700 bg-amber-50 border-amber-200",
  further_review: "text-sky-700 bg-sky-50 border-sky-200",
  penalty_reported: "text-red-700 bg-red-50 border-red-200",
  unknown: "text-slate-600 bg-slate-100 border-slate-200",
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
            className="btn-executive-primary font-semibold rounded-lg text-xs"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />Report Incident
          </Button>
        } 
      />

      {isLoading && <LoadingState label="Loading recorded incidents…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState 
          title="No incidents recorded" 
          description="Report a stop or document check to start building corridor intelligence."
          action={
            <Button onClick={() => navigate("/incidents/new")} className="btn-executive-primary font-semibold rounded-lg text-xs">
              Report an incident
            </Button>
          } 
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((i) => (
            <Card key={i.id} className="executive-card p-5" data-testid={`incident-card-${i.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">{i.location_name || "Transit Corridor"}</span>
                </div>
                {i.is_demo && <SyntheticBadge />}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 capitalize text-slate-700 font-medium">{(i.incident_type || "").replace(/_/g, " ")}</span>
                <span className={`rounded-full px-2.5 py-0.5 capitalize border font-medium ${OUTCOME_STYLE[i.outcome] || "bg-slate-100 text-slate-600"}`}>{(i.outcome || "").replace(/_/g, " ")}</span>
                <span className="text-slate-500 text-[11px] ml-auto">{fmtDate(i.occurred_at)}</span>
              </div>
              {i.reason && <p className="mt-3 text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-700">Reason: </span>{i.reason}</p>}
              {i.notes && <p className="mt-1.5 text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{i.notes}</p>}
            </Card>
          ))}
        </div>
      ))}
      <Disclaimer />
    </div>
  );
}
