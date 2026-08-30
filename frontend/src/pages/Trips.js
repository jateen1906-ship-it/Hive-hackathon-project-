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
        title="Fleet Dispatches" 
        subtitle="Manage pre-dispatch routes, cargo suitability, and statutory compliance status."
        actions={
          <Button 
            onClick={() => navigate("/trips/new")} 
            data-testid="trips-new-button"
            className="btn-cyber-cyan font-bold rounded-xl text-xs px-4"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[3]" />
            New Dispatch
          </Button>
        } 
      />

      {isLoading && <LoadingState label="Loading fleet dispatches…" />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {data && (data.length === 0 ? (
        <EmptyState 
          title="No dispatches recorded yet" 
          description="Create a dispatch entry to generate an explainable compliance-risk report."
          action={
            <Button onClick={() => navigate("/trips/new")} className="btn-cyber-cyan font-bold rounded-xl text-xs">
              Create your first dispatch
            </Button>
          } 
        />
      ) : (
        <Card className="rich-card overflow-hidden">
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/[0.08]">
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4 pl-6">Corridor Route</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Dispatch Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Assigned Fleet</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4 pr-6 text-right">Risk Assessment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/[0.06]">
                {data.map((t) => (
                  <TableRow 
                    key={t.id} 
                    className="cursor-pointer border-white/[0.06] hover:bg-white/[0.04] transition-all" 
                    data-testid={`trip-row-${t.id}`} 
                    onClick={() => navigate(`/trips/${t.id}`)}
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <RouteStrip origin={t.origin} destination={t.destination} className="text-sm font-bold" />
                        {t.is_demo && <SyntheticBadge />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-medium py-4">{fmtDate(t.travel_date)}</TableCell>
                    <TableCell className="font-mono text-xs text-sky-300 py-4">{t.vehicle_number || "—"}</TableCell>
                    <TableCell className="text-xs py-4">
                      <span className="capitalize px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-slate-200">
                        {t.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      {t.risk_level ? (
                        <RiskBadge level={t.risk_level} score={t.risk_score} />
                      ) : (
                        <span className="text-xs text-slate-500">Not evaluated</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list view */}
          <div className="divide-y divide-white/[0.06] md:hidden">
            {data.map((t) => (
              <button 
                key={t.id} 
                onClick={() => navigate(`/trips/${t.id}`)} 
                className="flex w-full flex-col gap-2 p-4 text-left hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <RouteStrip origin={t.origin} destination={t.destination} className="text-sm font-bold" />
                  {t.risk_level && <RiskBadge level={t.risk_level} score={t.risk_score} />}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{fmtDate(t.travel_date)}</span>
                  <span>•</span>
                  <span className="font-mono text-sky-300">{t.vehicle_number || "no vehicle"}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
