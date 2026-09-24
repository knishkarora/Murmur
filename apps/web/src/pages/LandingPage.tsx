import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, CheckCircle2, Shield, Zap, Compass, AlertCircle } from "lucide-react";
import { useAuth } from "../lib/authContext.js";
import { toast } from "sonner";

export const LandingPage: React.FC = () => {
  const { user, signIn, signUp, enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
          toast.error(error.message);
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setErrorMsg(error.message);
          toast.error(error.message);
        } else {
          toast.success("Account created! Welcome to Murmur.");
          navigate("/onboarding");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    enterDemoMode();
    toast.success("Entering Local Demo Session");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 py-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white">Murmur</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              AI Progress Companion
            </span>
          </div>
        </div>
        <button
          onClick={handleDemoLogin}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          Quick Demo Mode
        </button>
      </header>

      {/* Hero Content */}
      <div className="max-w-7xl w-full mx-auto px-6 py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Brand Story & Value */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inspired by the physics of starling murmurations</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Turn tiny daily micro-actions into{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              massive career direction.
            </span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
            No endless backlogs. No guilt-inducing missed streak counters. Just an intelligent,
            context-aware companion delivering one focused morning micro-action every single day
            right to your Telegram and Web Workspace.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <Zap className="w-5 h-5 text-indigo-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">Zero Decision Fatigue</h3>
              <p className="text-xs text-slate-400 mt-1">
                One action every morning based on your unique goals.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <Compass className="w-5 h-5 text-purple-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">Long-Term Memory</h3>
              <p className="text-xs text-slate-400 mt-1">
                Remembers projects, setbacks, and strengths via semantic vector recall.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <Shield className="w-5 h-5 text-pink-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">Sunday Reflections</h3>
              <p className="text-xs text-slate-400 mt-1">
                Compiles weekly accomplishments into reassuring progress reports.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Tabs */}
            <div className="flex bg-slate-800/60 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  isLogin
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  !isLogin
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition disabled:opacity-60"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{isLogin ? "Sign In to Workspace" : "Get Started"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Offline / Demo Quick Login */}
            <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400 mb-3">Testing without cloud Supabase credentials?</p>
              <button
                onClick={handleDemoLogin}
                type="button"
                className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Launch Instant Demo Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 Murmur Companion. Built for intentional, stress-free career progression.</p>
      </footer>
    </div>
  );
};
