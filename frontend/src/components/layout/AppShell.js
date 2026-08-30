import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Truck, FileText, AlertTriangle, BarChart3, Settings,
  Menu, LogOut, ShieldCheck, Plus, CreditCard, User
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
  { to: "/pricing", label: "Pricing & Plans", icon: CreditCard, testId: "nav-pricing" },
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
            `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              isActive
                ? "bg-[#fff8cb] text-[#614612] font-bold border border-[#cbbd93] shadow-2xs"
                : "text-[#6b6052] hover:bg-[#faf5ec] hover:text-[#221d17]"
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
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e4dbca] bg-white">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cca25a] text-white shadow-xs">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight text-[#221d17]">TruckShield</div>
        <div className="text-[10px] uppercase tracking-wider text-[#968772] font-semibold">Compliance Engine</div>
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
    <div className="flex h-full flex-col bg-white text-[#221d17] border-r border-[#e4dbca]">
      <Brand />
      <div className="mt-3 flex-1 overflow-y-auto bg-white"><NavItems onNavigate={() => setOpen(false)} /></div>
      
      {/* User profile footer */}
      <div className="border-t border-[#e4dbca] p-3.5 bg-[#faf8f5]">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#e4dbca] shadow-2xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffb16e] text-[#542807] text-xs font-bold shrink-0 border border-[#ffb16e]/40">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-[#221d17] truncate">{user?.full_name || "Fleet Operator"}</div>
            <div className="text-[11px] text-[#756a5c] truncate">{user?.company_name || user?.email}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          data-testid="logout-button"
          className="mt-2 w-full justify-start text-xs text-[#756a5c] hover:bg-[#faf5ec] hover:text-[#cca25a] rounded-lg h-8 font-medium"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#221d17] flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[240px] lg:block z-40 shadow-xs border-r border-[#e4dbca]">
        {SidebarInner}
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[240px] flex flex-col min-h-screen flex-1">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e4dbca] bg-white px-4 sm:px-8 shadow-2xs">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-[#221d17] hover:bg-[#faf5ec]" data-testid="app-shell-open-nav">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] border-0 p-0 bg-white">{SidebarInner}</SheetContent>
            </Sheet>

            {/* Title Header */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#968772] hidden sm:inline">TruckShield /</span>
              <span className="font-bold text-[#221d17] text-sm sm:text-base">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/trips/new")}
              data-testid="header-new-trip"
              size="sm"
              className="btn-primary-blue rounded-lg px-3.5 h-8.5 flex items-center gap-1.5 text-xs shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Trip</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 sm:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
