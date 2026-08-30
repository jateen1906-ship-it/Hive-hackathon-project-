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
            className="btn-sunset-orange font-semibold rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4 stroke-[2.5]" />
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
            <Button onClick={() => navigate("/trips/new")} className="btn-sunset-orange font-semibold rounded-xl">
              Create your first trip
            </Button>
          } 
        />
      ) : (
        <Card className="alvero-card overflow-hidden border-white/[0.07]">
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/[0.06]">
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-[#9e958d] py-4 pl-6">Route</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-[#9e958d] py-4">Travel date</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-[#9e958d] py-4">Vehicle</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-[#9e958d] py-4">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-[#9e958d] py-4 pr-6 text-right">Risk Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/[0.04]">
                {data.map((t) => (
                  <TableRow 
                    key={t.id} 
                    className="cursor-pointer border-white/[0.04] hover:bg-white/[0.03] transition-colors" 
                    data-testid={`trip-row-${t.id}`} 
                    onClick={() => navigate(`/trips/${t.id}`)}
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <RouteStrip origin={t.origin} destination={t.destination} className="text-sm font-semibold" />
                        {t.is_demo && <SyntheticBadge />}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#9e958d] py-4">{fmtDate(t.travel_date)}</TableCell>
                    <TableCell className="font-mono text-xs text-[#d6d3d1] py-4">{t.vehicle_number || "—"}</TableCell>
                    <TableCell className="text-sm py-4">
                      <span className="capitalize px-2.5 py-1 rounded-full bg-white/[0.04] text-xs font-medium text-[#d6d3d1]">
                        {t.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      {t.risk_level ? (
                        <RiskBadge level={t.risk_level} score={t.risk_score} />
                      ) : (
                        <span className="text-xs text-[#9e958d]">Not analyzed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list view */}
          <div className="divide-y divide-white/[0.04] md:hidden">
            {data.map((t) => (
              <button 
                key={t.id} 
                onClick={() => navigate(`/trips/${t.id}`)} 
                className="flex w-full flex-col gap-1.5 p-4 text-left hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <RouteStrip origin={t.origin} destination={t.destination} className="text-sm font-semibold" />
                  {t.risk_level && <RiskBadge level={t.risk_level} score={t.risk_score} />}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9e958d]">
                  <span>{fmtDate(t.travel_date)}</span>
                  <span>•</span>
                  <span className="font-mono text-[#d6d3d1]">{t.vehicle_number || "no vehicle"}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
