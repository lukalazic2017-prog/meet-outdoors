import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser?.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error) {
      console.error("Profile load error:", error);
      setProfile(null);
      return null;
    }

    let finalProfile = data;

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

        if (refreshedProfile) {
          finalProfile = refreshedProfile;
        }
      }
    }

    setProfile(finalProfile);
    return finalProfile;
  }, []);

  const loadAuth = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session load error:", error);
      }

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        return;
      }

      await loadProfile(currentUser);
    } catch (error) {
      console.error("Auth load error:", error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      setLoading(true);

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Initial session error:", error);
        }

        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          return;
        }

        await loadProfile(currentUser);
      } catch (error) {
        console.error("Auth initialization error:", error);

        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (event === "SIGNED_OUT" || !currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setLoading(true);

        setTimeout(async () => {
          if (!mounted) return;

          try {
            await loadProfile(currentUser);
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    setUser(null);
    setProfile(null);
  }

  const accountStatus = profile?.account_status || "active";

  const isBanned = accountStatus === "banned";
  const isSuspended = accountStatus === "suspended";

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