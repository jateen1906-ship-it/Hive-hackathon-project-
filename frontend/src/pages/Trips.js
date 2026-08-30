import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Truck, ChevronRight } from "lucide-react";
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
    <div className="space-y-6">
      <PageHeader 
        title="Fleet Trips" 
        subtitle="Manage and analyze pre-dispatch routes, cargo suitability, and regulatory compliance."
        actions={
          <Button 
            onClick={() => navigate("/trips/new")} 
            data-testid="trips-new-button"
            className="btn-primary-blue text-xs h-9 px-4 font-semibold"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Trip
          </Button>
        } 
      />

      {isLoading && <LoadingState label="Loading fleet trips…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState 
          title="No trips recorded yet" 
          description="Create a trip to generate an explainable compliance-risk report."
          action={
            <Button onClick={() => navigate("/trips/new")} className="btn-primary-blue text-xs h-8 px-4 font-semibold">
              Create your first trip
            </Button>
          } 
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-3.5 pl-6">Route</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-3.5">Travel date</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-3.5">Vehicle</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-3.5">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-3.5 pr-6 text-right">Risk Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {data.map((t) => (
                  <TableRow 
                    key={t.id} 
                    className="cursor-pointer border-slate-100 hover:bg-slate-50/80 transition-colors" 
                    data-testid={`trip-row-${t.id}`} 
                    onClick={() => navigate(`/trips/${t.id}`)}
                  >
                    <TableCell className="py-3.5 pl-6">
                      <div className="flex items-center gap-2.5">
                        <RouteStrip origin={t.origin} destination={t.destination} className="text-sm font-semibold" />
                        {t.is_demo && <SyntheticBadge />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 py-3.5 font-medium">{fmtDate(t.travel_date)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-700 py-3.5">{t.vehicle_number || "—"}</TableCell>
                    <TableCell className="text-xs py-3.5">
                      <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                        {t.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3.5 pr-6">
                      {t.risk_level ? (
                        <RiskBadge level={t.risk_level} score={t.risk_score} />
                      ) : (
                        <span className="text-xs text-slate-400">Not analyzed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="divide-y divide-slate-100 md:hidden">
            {data.map((t) => (
              <button 
                key={t.id} 
                onClick={() => navigate(`/trips/${t.id}`)} 
                className="flex w-full flex-col gap-1.5 p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <RouteStrip origin={t.origin} destination={t.destination} className="text-sm font-semibold" />
                  {t.risk_level && <RiskBadge level={t.risk_level} score={t.risk_score} />}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{fmtDate(t.travel_date)}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-700">{t.vehicle_number || "no vehicle"}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
