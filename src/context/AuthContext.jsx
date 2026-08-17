import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAuth() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user || null;
    setUser(currentUser);

    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error) {
      console.error("Profile load error:", error);
      setProfile(null);
    } else {
      setProfile(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
  value={{
    user,
    profile,
    loading,
    isLoggedIn: !!user,
    isHost: profile?.role === "host",
    isUser: profile?.role === "user",
    isAdmin: profile?.is_admin === true,
    logout,
    reloadAuth: loadAuth,
  }}
>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}