import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import "@/App.css";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Pricing from "@/pages/Pricing";
import PublicReport from "@/pages/PublicReport";
import DriverSos from "@/pages/DriverSos";
import Dashboard from "@/pages/Dashboard";
import Trips from "@/pages/Trips";
import CreateTrip from "@/pages/CreateTrip";
import TripDetails from "@/pages/TripDetails";
import RiskReport from "@/pages/RiskReport";
import Documents from "@/pages/Documents";
import DocumentDetails from "@/pages/DocumentDetails";
import Incidents from "@/pages/Incidents";
import ReportIncident from "@/pages/ReportIncident";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";

const Shell = ({ children }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/r/:token" element={<PublicReport />} />
            <Route path="/driver/sos/:tripId" element={<DriverSos />} />
            <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
            <Route path="/trips" element={<Shell><Trips /></Shell>} />
            <Route path="/trips/new" element={<Shell><CreateTrip /></Shell>} />
            <Route path="/trips/:id" element={<Shell><TripDetails /></Shell>} />
            <Route path="/trips/:id/risk" element={<Shell><RiskReport /></Shell>} />
            <Route path="/documents" element={<Shell><Documents /></Shell>} />
            <Route path="/documents/:id" element={<Shell><DocumentDetails /></Shell>} />
            <Route path="/incidents" element={<Shell><Incidents /></Shell>} />
            <Route path="/incidents/new" element={<Shell><ReportIncident /></Shell>} />
            <Route path="/analytics" element={<Shell><Analytics /></Shell>} />
            <Route path="/settings" element={<Shell><Settings /></Shell>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
