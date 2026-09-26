import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "../lib/authContext.js";
import { useProfile } from "../lib/queries.js";
import { Layout } from "./Layout.js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = true,
}) => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: profileData, isLoading: profileLoading, isError } = useProfile();
  const location = useLocation();
  const [showEscapeHatch, setShowEscapeHatch] = useState(false);

  useEffect(() => {
    // Show escape hatch button if loading takes more than 3 seconds
    const timer = setTimeout(() => setShowEscapeHatch(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-medium">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If profile is stuck loading or errored, offer a clear escape hatch so user is never trapped
  if (profileLoading && !profileData && showEscapeHatch) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Connecting to Murmur workspace...</p>
        <button
          onClick={() => {
            signOut();
            window.location.href = "/";
          }}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-2 border border-slate-700"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Exit Session & Go to Sign In</span>
        </button>
      </div>
    );
  }

  // If user hasn't finished onboarding and this route requires onboarding
  if (
    requireOnboarding &&
    profileData?.profile &&
    !profileData.profile.onboardingDone &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout>{children}</Layout>;
};
