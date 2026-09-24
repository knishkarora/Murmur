import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase.js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  app_metadata: {},
  user_metadata: { full_name: "Demo Explorer" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "demo@murmur.app",
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // 1. Check local storage for demo mode
    const demoActive = localStorage.getItem("murmur_demo_token");
    if (demoActive) {
      setUser(DEMO_USER);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }

    // 2. Otherwise load Supabase session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err) => {
        console.warn("Supabase session initialization warning:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 3. Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem("murmur_demo_token")) {
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      localStorage.removeItem("murmur_demo_token");
      setIsDemo(false);
      return { error: null };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      localStorage.removeItem("murmur_demo_token");
      setIsDemo(false);
      return { error: null };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("murmur_demo_token");
    setIsDemo(false);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signout network errors
    }
  };

  const enterDemoMode = () => {
    localStorage.setItem("murmur_demo_token", "demo-token-local");
    setUser(DEMO_USER);
    setIsDemo(true);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isDemo,
        signIn,
        signUp,
        signOut,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
