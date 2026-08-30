import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Truck, FileText, AlertTriangle, BarChart3, Settings,
  Menu, LogOut, ShieldCheck, Plus, CreditCard, User, Sparkles, Zap, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard", badge: null },
  { to: "/trips", label: "Fleet Trips", icon: Truck, testId: "nav-trips", badge: "Live" },
  { to: "/documents", label: "OCR Documents", icon: FileText, testId: "nav-documents", badge: null },
  { to: "/incidents", label: "Incident Intel", icon: AlertTriangle, testId: "nav-incidents", badge: null },
  { to: "/analytics", label: "Corridor Map", icon: BarChart3, testId: "nav-analytics", badge: "Pro" },
  { to: "/pricing", label: "Subscriptions", icon: CreditCard, testId: "nav-pricing", badge: "Save 20%" },
  { to: "/settings", label: "Settings", icon: Settings, testId: "nav-settings", badge: null },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1.5 px-3">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          data-testid={item.testId}
          className={({ isActive }) =>
            `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 group ${
              isActive
                ? "nav-pill-active-cyber font-bold"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 hover:translate-x-1"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
              item.badge === "Live" 
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                : item.badge === "Pro" 
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" 
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}>
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.08] bg-white/[0.01]">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/30 via-indigo-500/20 to-blue-600/30 border border-sky-400/40 text-sky-300 shadow-lg shadow-sky-500/20">
          <ShieldCheck className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-sky-400 pulse-beacon-cyan" />
        </div>
        <div>
          <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
            <span>TruckShield</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest bg-gradient-to-r from-sky-400 to-amber-300 bg-clip-text text-transparent font-bold">
            Compliance AI Engine
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentNav = NAV.find((n) => n.to === location.pathname);
  const currentTitle = currentNav ? currentNav.label : "Dashboard";

  const SidebarInner = (
    <div className="flex h-full flex-col bg-[#0b101d] text-slate-100 border-r border-white/[0.08]">
      <Brand />
      
      {/* Live Engine Status Indicator */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-200">OSRM Highway Matrix</span>
        </div>
        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          ONLINE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto"><NavItems onNavigate={() => setOpen(false)} /></div>
      
      {/* User profile footer */}
      <div className="border-t border-white/[0.08] p-3.5 bg-[#080c16]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-sky-500/30 transition-all">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold shrink-0 shadow-md shadow-sky-500/30">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{user?.full_name || "Fleet Operator"}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.company_name || user?.email}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          data-testid="logout-button"
          className="mt-2 w-full justify-start text-xs text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg h-8 transition-colors"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex aurora-bg">
      {/* Animated Cyber Floating Orbs */}
      <div className="cyber-orb-1" />
      <div className="cyber-orb-2" />
      <div className="cyber-orb-3" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] lg:block z-40 shadow-2xl">
        {SidebarInner}
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen flex-1 relative overflow-x-hidden z-10">
        {/* Top Glass Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-xl px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-300 hover:bg-white/10" data-testid="app-shell-open-nav">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] border-0 p-0">{SidebarInner}</SheetContent>
            </Sheet>

            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">TruckShield AI /</span>
              <span className="font-extrabold text-white tracking-tight text-base sm:text-lg bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                {currentTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Indian Corridors Active</span>
            </div>

            <Button
              onClick={() => navigate("/trips/new")}
              data-testid="header-new-trip"
              size="sm"
              className="btn-cyber-cyan rounded-xl px-4 h-9 flex items-center gap-1.5 text-xs shadow-lg"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>New Dispatch</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-8 sm:px-8 max-w-7xl w-full mx-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
