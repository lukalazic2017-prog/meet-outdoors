import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

// Proverava samo obavezne podatke hosta; ne menja postojeću autorizaciju.
function getMissingHostFields(profile) {
  if (!profile || profile.role !== "host") return [];

  const filled = (value) => typeof value === "string" && value.trim().length > 0;
  const missing = [];

  if (!filled(profile.avatar_url)) missing.push("avatar");
  if (!filled(profile.cover_url)) missing.push("cover");
  if (!filled(profile.full_name)) missing.push("full_name");
  if (String(profile.bio || "").trim().length < 80) missing.push("bio");
  if (!filled(profile.city)) missing.push("city");
  if (!filled(profile.country)) missing.push("country");
  if (!filled(profile.public_location) ||
      !Number.isFinite(Number(profile.latitude)) ||
      !Number.isFinite(Number(profile.longitude)) ||
      profile.latitude == null || profile.longitude == null) {
    missing.push("public_location");
  }
  const purposes = Array.isArray(profile.host_purposes) ? profile.host_purposes : [];
  if (!purposes.length) missing.push("host_purposes");
  if (purposes.includes("adventures") &&
      (!Array.isArray(profile.activities) || !profile.activities.length)) {
    missing.push("activities");
  }
  if (!filled(profile.phone)) missing.push("phone");

  return missing;
}

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

  // Novi podaci samo za proveru kompletiranosti; ostala pravila ostaju ista.
  const missingHostFields = getMissingHostFields(profile);
  const needsHostProfileCompletion =
    profile?.role === "host" && missingHostFields.length > 0;

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
        missingHostFields,
        needsHostProfileCompletion,
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
