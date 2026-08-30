import React from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Loading…", rows = 3 }) {
  return (
    <div className="space-y-3" data-testid="loading-state">
      <div className="flex items-center gap-2 text-xs font-semibold text-sky-600">
        <Loader2 className="h-4 w-4 animate-spin" /> {label}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100 border border-slate-200/60" />
      ))}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", description, action, testId = "empty-state" }) {
  return (
    <div data-testid={testId} className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div data-testid="error-state" className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-6 py-12 text-center">
      <AlertTriangle className="mb-2 h-7 w-7 text-red-500" />
      <p className="max-w-md text-xs text-red-700 font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4 border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700" onClick={onRetry} data-testid="error-retry-button">
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}
