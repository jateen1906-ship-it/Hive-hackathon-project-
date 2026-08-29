import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TripAPI } from "@/lib/apiClient";
import { RiskBadge } from "@/components/common/RiskBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { SyntheticBadge } from "@/components/common/Disclaimer";
import { PageHeader, RouteStrip } from "@/components/common/PageHeader";
import { fmtDate } from "@/lib/riskMeta";

export default function Trips() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["trips"], queryFn: TripAPI.list });

  return (
    <div>
      <PageHeader title="Trips" subtitle="All planned and analyzed trips."
        actions={<Button onClick={() => navigate("/trips/new")} data-testid="trips-new-button"><Plus className="mr-2 h-4 w-4" />New Trip</Button>} />

      {isLoading && <LoadingState label="Loading trips…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState title="No trips yet" description="Create a trip to generate an explainable compliance-risk report."
          action={<Button onClick={() => navigate("/trips/new")}>Create your first trip</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Travel date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" data-testid={`trip-row-${t.id}`} onClick={() => navigate(`/trips/${t.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RouteStrip origin={t.origin} destination={t.destination} />
                        {t.is_demo && <SyntheticBadge />}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(t.travel_date)}</TableCell>
                    <TableCell className="font-mono text-xs">{t.vehicle_number || "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{t.status}</TableCell>
                    <TableCell className="text-right">
                      {t.risk_level ? <RiskBadge level={t.risk_level} score={t.risk_score} /> : <span className="text-xs text-muted-foreground">Not analyzed</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="divide-y divide-border md:hidden">
            {data.map((t) => (
              <button key={t.id} onClick={() => navigate(`/trips/${t.id}`)} className="flex w-full flex-col gap-1 px-4 py-3 text-left">
                <div className="flex items-center justify-between">
                  <RouteStrip origin={t.origin} destination={t.destination} className="text-sm" />
                  {t.risk_level && <RiskBadge level={t.risk_level} score={t.risk_score} />}
                </div>
                <div className="text-xs text-muted-foreground">{fmtDate(t.travel_date)} · {t.vehicle_number || "no vehicle"}</div>
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
