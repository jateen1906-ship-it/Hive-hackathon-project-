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
    <nav className="flex flex-col gap-1.5 px-3">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          data-testid={item.testId}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "nav-pill-active font-semibold shadow-md"
                : "text-[#a8a29e] hover:bg-white/[0.04] hover:text-[#f5f5f4]"
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
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 text-orange-400 shadow-inner">
        <ShieldCheck className="h-5 w-5 text-orange-400" />
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
          <span>TruckShield</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-orange-400/80 font-semibold">Compliance Intel</div>
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

  // Get current section name
  const currentNav = NAV.find((n) => n.to === location.pathname);
  const currentTitle = currentNav ? currentNav.label : "Home";

  const SidebarInner = (
    <div className="flex h-full flex-col bg-[#161311] border-r border-white/[0.06]">
      <Brand />
      <div className="mt-4 flex-1 overflow-y-auto"><NavItems onNavigate={() => setOpen(false)} /></div>
      
      {/* User profile footer */}
      <div className="border-t border-white/[0.06] p-3 bg-[#13110f]/70">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white text-xs font-bold shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-[#f5f5f4] truncate">{user?.full_name || "Fleet Operator"}</div>
            <div className="text-[11px] text-[#9c948a] truncate">{user?.email}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          data-testid="logout-button"
          className="mt-2 w-full justify-start text-xs text-[#9c948a] hover:bg-white/[0.04] hover:text-rose-400 rounded-lg h-8"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#12100e] text-[#f5f5f4]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] lg:block z-40">{SidebarInner}</aside>

      {/* Main Content Area */}
      <div className="lg:pl-[250px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#12100e]/85 backdrop-blur-xl px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-[#f5f5f4] hover:bg-white/5" data-testid="app-shell-open-nav">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] border-0 p-0">{SidebarInner}</SheetContent>
            </Sheet>

            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-white tracking-tight text-base">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/trips/new")}
              data-testid="header-new-trip"
              size="sm"
              className="btn-sunset-orange font-semibold rounded-xl px-4 h-9 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Trip</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-8 sm:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
