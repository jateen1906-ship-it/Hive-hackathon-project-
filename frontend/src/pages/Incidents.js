import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IncidentAPI } from "@/lib/apiClient";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { SyntheticBadge, Disclaimer } from "@/components/common/Disclaimer";
import { PageHeader } from "@/components/common/PageHeader";
import { fmtDate } from "@/lib/riskMeta";

const OUTCOME_STYLE = {
  released: "text-emerald-700 bg-emerald-50",
  delayed: "text-amber-700 bg-amber-50",
  further_review: "text-sky-700 bg-sky-50",
  penalty_reported: "text-red-700 bg-red-50",
  unknown: "text-slate-600 bg-slate-100",
};

export default function Incidents() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["incidents"], queryFn: IncidentAPI.list });

  return (
    <div>
      <PageHeader title="Incidents" subtitle="Reported stops and checks. These build your corridor intelligence over time."
        actions={<Button onClick={() => navigate("/incidents/new")} data-testid="incidents-new-button"><Plus className="mr-2 h-4 w-4" />Report Incident</Button>} />

      {isLoading && <LoadingState label="Loading incidents…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState title="No incidents reported" description="Report a stop or document check to start building corridor intelligence."
          action={<Button onClick={() => navigate("/incidents/new")}>Report an incident</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((i) => (
            <Card key={i.id} className="p-4" data-testid={`incident-card-${i.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium">{i.location_name || "Unknown location"}</span>
                </div>
                {i.is_demo && <SyntheticBadge />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-secondary px-2 py-0.5 capitalize">{(i.incident_type || "").replace(/_/g, " ")}</span>
                <span className={`rounded-md px-2 py-0.5 capitalize ${OUTCOME_STYLE[i.outcome] || "bg-slate-100"}`}>{(i.outcome || "").replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">{fmtDate(i.occurred_at)}</span>
              </div>
              {i.reason && <p className="mt-2 text-sm text-muted-foreground">{i.reason}</p>}
              {i.notes && <p className="mt-1 text-xs text-muted-foreground">{i.notes}</p>}
            </Card>
          ))}
        </div>
      ))}
      <div className="mt-5"><Disclaimer /></div>
    </div>
  );
}
