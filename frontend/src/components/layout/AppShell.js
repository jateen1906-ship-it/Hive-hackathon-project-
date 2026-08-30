import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Truck, FileText, AlertTriangle, BarChart3, Settings,
  Menu, LogOut, ShieldCheck, Plus, CreditCard, User, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/trips", label: "Trips", icon: Truck, testId: "nav-trips" },
  { to: "/documents", label: "Documents", icon: FileText, testId: "nav-documents" },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle, testId: "nav-incidents" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, testId: "nav-analytics" },
  { to: "/pricing", label: "Plans & Billing", icon: CreditCard, testId: "nav-pricing" },
  { to: "/settings", label: "Settings", icon: Settings, testId: "nav-settings" },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          data-testid={item.testId}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-white/10 text-white font-semibold shadow-xs"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
          <span>TruckShield</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Compliance Intel</div>
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
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-100">
      <Brand />
      <div className="mt-3 flex-1 overflow-y-auto"><NavItems onNavigate={() => setOpen(false)} /></div>
      
      {/* User profile footer */}
      <div className="border-t border-slate-800 p-3 bg-[#0b1329]">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white text-xs font-bold shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || "Fleet Operator"}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          data-testid="logout-button"
          className="mt-2 w-full justify-start text-xs text-slate-400 hover:bg-white/5 hover:text-rose-400 rounded-md h-8"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] lg:block z-40 shadow-md">
        {SidebarInner}
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[250px] flex flex-col min-h-screen flex-1 relative overflow-x-hidden bg-light-mesh">
        {/* Ambient Animated Floating Orbs */}
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />

        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-700 hover:bg-slate-100" data-testid="app-shell-open-nav">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] border-0 p-0">{SidebarInner}</SheetContent>
            </Sheet>

            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-slate-400 hidden sm:inline">TruckShield /</span>
              <span className="font-bold text-slate-900 tracking-tight text-base">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/trips/new")}
              data-testid="header-new-trip"
              size="sm"
              className="btn-executive-primary font-semibold rounded-lg px-4 h-9 flex items-center gap-1.5 text-xs shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New Trip</span>
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
