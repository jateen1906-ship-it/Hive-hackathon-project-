import React from "react";

export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.04] pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#9e958d]">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function RouteStrip({ origin, destination, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold text-[#fafaf9] ${className}`}>
      <span>{origin}</span>
      <span className="text-orange-400 font-bold">→</span>
      <span>{destination}</span>
    </span>
  );
}
