import React from "react";

export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-slate-500">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function RouteStrip({ origin, destination, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold text-slate-900 ${className}`}>
      <span>{origin}</span>
      <span className="text-sky-600 font-bold">→</span>
      <span>{destination}</span>
    </span>
  );
}
