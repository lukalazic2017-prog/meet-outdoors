import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
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
      if (
        data.account_status === "suspended" &&
        data.suspended_until &&
        new Date(data.suspended_until).getTime() <= Date.now()
      ) {
        const { error: restoreError } = await supabase.rpc(
          "restore_expired_suspensions"
        );

        if (!restoreError) {
          const { data: refreshedProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          setProfile(refreshedProfile || data);
        } else {
          setProfile(data);
        }
      } else {
        setProfile(data);
      }
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

  const accountStatus =
    profile?.account_status || "active";

  const isBanned =
    accountStatus === "banned";

  const isSuspended =
    accountStatus === "suspended";

  const hasAccess =
    !!user &&
    !!profile &&
    accountStatus === "active";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isLoggedIn: !!user,
        isHost:
          profile?.role === "host" &&
          accountStatus === "active",
        isUser:
          profile?.role === "user" &&
          accountStatus === "active",
        isAdmin:
          profile?.is_admin === true &&
          accountStatus === "active",
        accountStatus,
        isBanned,
        isSuspended,
        hasAccess,
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