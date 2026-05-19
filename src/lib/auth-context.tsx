"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "buyer" | "chercheur" | "proprietaire" | "owner" | "agent" | "agence" | "agency" | "admin";
  account_type: "chercheur" | "proprietaire" | "agent" | "agence" | null;
  agency_name: string | null;
  agency_logo_url: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_verified_pro: boolean;
  bio: string | null;
  website: string | null;
  total_listings: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const loadingRef = useRef(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Mock session for dev without Supabase
      const cookie = document.cookie.includes("GuImmo-auth=mock-session");
      if (cookie) {
        setUser({ id: "mock-user", email: "demo@GuImmo.gn" } as User);
      }
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    // Safety timeout: if loading is still true after 3s (getSession hung or
    // onAuthStateChange never fired), force it false so the page can redirect.
    const safetyTimer = setTimeout(() => {
      if (loadingRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }, 3000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
      })
      .catch(() => {
        // getSession rejected (network error, bad token, etc.) — treat as no session
        setUser(null);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        // Mark loading done on first event (covers INITIAL_SESSION with null session)
        if (loadingRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    document.cookie = "GuImmo-auth=; path=/; max-age=0";
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
