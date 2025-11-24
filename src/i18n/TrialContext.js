import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const TrialContext = createContext();
export const useTrial = () => useContext(TrialContext);

export function TrialProvider({ children }) {
  const [trialInfo, setTrialInfo] = useState({
    isPremium: false,
    trialExpired: false,
    daysLeft: 0,
    loading: true,
  });

  useEffect(() => {
    checkTrialStatus();
  }, []);

  async function checkTrialStatus() {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      setTrialInfo({ loading: false });
      return;
    }

    const user = sessionData.session.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("trial_start, is_premium, trial_expired")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      setTrialInfo({ loading: false });
      return;
    }

    // Ako je premium — kraj
    if (profile.is_premium) {
      setTrialInfo({
        isPremium: true,
        trialExpired: false,
        daysLeft: 999,
        loading: false,
      });
      return;
    }

    // Računanje 7 dana triala
    const start = new Date(profile.trial_start);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));

    const expired = diff >= 7;
    const daysLeft = Math.max(0, 7 - diff);

    // Ako je istekao, upiši u bazu
    if (expired && !profile.trial_expired) {
      await supabase
        .from("profiles")
        .update({ trial_expired: true })
        .eq("user_id", user.id);
    }

    setTrialInfo({
      isPremium: false,
      trialExpired: expired,
      daysLeft,
      loading: false,
    });
  }

  return (
    <TrialContext.Provider value={trialInfo}>
      {children}
    </TrialContext.Provider>
  );
}