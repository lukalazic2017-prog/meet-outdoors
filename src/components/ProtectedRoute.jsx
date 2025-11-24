import { Navigate } from "react-router-dom";
import { useTrial } from "../i18n/TrialContext";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children }) {
  const { trialExpired, isPremium, loading } = useTrial();

  if (loading) return null;

  // ako je premium → sve dopušteno
  if (isPremium) return children;

  // ako je trial istekao → blokiraj
  if (trialExpired) return <Navigate to="/upgrade" />;

  return children;
}