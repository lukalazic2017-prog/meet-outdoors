import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const TrialContext = createContext();
export const useTrial = () => useContext(TrialContext);

export function TrialProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        setLoading(false);
        return;
      }

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      if (!p) {
        setLoading(false);
        return;
      }

      setIsPremium(p.is_premium);

      if (p.trial_end) {
        const now = new Date();
        const end = new Date(p.trial_end);

        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        setDaysLeft(diff);

        if (diff <= 0) setTrialExpired(true);
      }

      setLoading(false);
    }

    check();
  }, []);

  return (
    <TrialContext.Provider
      value={{ isPremium, trialExpired, daysLeft, loading }}
    >
      {children}
    </TrialContext.Provider>
  );
}