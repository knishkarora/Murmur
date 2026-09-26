import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Send,
  CheckCircle2,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { useAuth } from "../lib/authContext.js";
import { useProfile } from "../lib/queries.js";
import { useRealtimeSync } from "../lib/realtime.js";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut, isDemo } = useAuth();
  const { data: profileData } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize background Realtime sync
  useRealtimeSync();

  const isTelegramLinked = profileData?.telegramLinked;
  const userName = profileData?.profile?.name || user?.email?.split("@")[0] || "Explorer";

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Conversations", path: "/conversations", icon: MessageSquare },
    { label: "Weekly Insights", path: "/insights", icon: BarChart3 },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Murmur
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-slate-900/95 border-r border-slate-800/80 p-5 shrink-0 z-40 fixed md:static inset-y-0 left-0 transition-all`}
      >
        {/* Brand */}
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">Murmur</h1>
            <p className="text-xs text-slate-400 font-medium">Daily Progress Companion</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Telegram Status Pill */}
        <div className="mt-auto pt-4 border-t border-slate-800/80 space-y-3">
          <div
            className={`p-3 rounded-xl border text-xs ${
              isTelegramLinked
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                : "bg-amber-950/30 border-amber-800/50 text-amber-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Telegram Bot
              </span>
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isTelegramLinked ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
            </div>
            <p className="text-slate-400 text-[11px] leading-tight">
              {isTelegramLinked
                ? "Syncing real-time updates"
                : "Connect bot for morning micro-actions"}
            </p>
            {!isTelegramLinked && (
              <Link
                to="/onboarding"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:underline"
              >
                Connect Telegram <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{userName}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {isDemo ? "Demo Mode" : user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Workspace Top Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/50 border-b border-slate-800/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Murmur Workspace</span>
            <span>/</span>
            <span className="capitalize text-slate-200 font-medium">
              {location.pathname.replace("/", "") || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
              <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span>Realtime Active</span>
            </div>
            {isDemo && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Demo Session
              </span>
            )}
          </div>
        </header>

        {isDemo && (
          <div className="bg-indigo-950/70 border-b border-indigo-800/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Local Demo Mode is active. To connect your real Telegram bot, create a free live account.</span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shrink-0 shadow-sm"
            >
              Sign Out & Go to Login
            </button>
          </div>
        )}

        {/* View Content */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
};
