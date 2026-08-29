import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingState } from "@/components/common/StateViews";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="mx-auto max-w-md p-10"><LoadingState label="Checking your session…" /></div>;
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
