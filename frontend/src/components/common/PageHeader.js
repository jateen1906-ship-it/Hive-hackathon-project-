import React from "react";

export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function RouteStrip({ origin, destination, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-medium ${className}`}>
      <span>{origin}</span>
      <span className="text-muted-foreground">→</span>
      <span>{destination}</span>
    </span>
  );
}
