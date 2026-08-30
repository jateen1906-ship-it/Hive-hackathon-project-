import React from "react";

export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function RouteStrip({ origin, destination, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-white ${className}`}>
      <span>{origin}</span>
      <span className="text-sky-400 font-extrabold animate-pulse">→</span>
      <span>{destination}</span>
    </span>
  );
}
