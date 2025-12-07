// src/pages/Settings.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {useAuth} from "../context/AuthContext"

export default function Settings() {
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  

  // SETTINGS STATE (što čuvamo u bazi)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [tourReminders, setTourReminders] = useState(true);

  const [showPublicProfile, setShowPublicProfile] = useState(true);
  const [allowMessagesFromStrangers, setAllowMessagesFromStrangers] =
    useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("dark");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // -------- LOAD USER + SETTINGS --------
  useEffect(() => {
  let ignore = false;

  async function load() {
    setLoading(true);
    setErrorMsg("");

    // 1) Sačekaj da auth state bude siguran
    const authRes = await supabase.auth.getUser();
    const user = authRes?.data?.user;

    // Ako user nije odmah spreman → probaj ponovo posle 200ms
    if (!user) {
      setTimeout(load, 200);
      return;
    }

    if (ignore) return;
    setAuthUser(user);

    // 2) Učitaj settings
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!ignore) {
      if (error && error.code !== "PGRST116") {
        console.error("Settings load error:", error);
        setErrorMsg("Could not load settings. Please try again.");
        setLoading(false);
        return;
      }

      if (data) {
        setEmailNotifications(data.email_notifications ?? true);
        setPushNotifications(data.push_notifications ?? true);
        setTourReminders(data.tour_reminders ?? true);

        setShowPublicProfile(data.show_public_profile ?? true);
        setAllowMessagesFromStrangers(
          data.allow_messages_from_strangers ?? true
        );
        setShowOnlineStatus(data.show_online_status ?? true);

        setLanguage(data.language || "en");
        setTheme(data.theme || "dark");
      }

      setLoading(false);
    }
  }

  load();
  return () => {
    ignore = true;
  };
}, [navigate]);

  // -------- SAVE SETTINGS --------
  async function handleSave(e) {
    e.preventDefault();
    if (!authUser) return;

    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);

    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: authUser.id,
            email_notifications: emailNotifications,
            push_notifications: pushNotifications,
            tour_reminders: tourReminders,
            show_public_profile: showPublicProfile,
            allow_messages_from_strangers: allowMessagesFromStrangers,
            show_online_status: showOnlineStatus,
            language,
            theme,
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;
      setSuccessMsg("Settings saved successfully ✅");
    } catch (err) {
      console.error("Settings save error:", err);
      setErrorMsg(
        err.message || "Could not save settings. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // -------- LOGOUT --------
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  // -------- UI STYLE --------
  const pageStyle = {
    minHeight: "100vh",
    padding: "24px 16px 60px",
    background:
      "radial-gradient(circle at top, #041e17 0%, #02070a 45%, #000000 100%)",
    color: "#ffffff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
  };

  const containerStyle = {
    maxWidth: 1100,
    margin: "0 auto",
  };

  const headerStyle = {
    marginBottom: 22,
  };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,160,0.6)",
    background:
      "linear-gradient(120deg, rgba(0,0,0,0.94), rgba(0,255,160,0.14))",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(210,255,230,0.9)",
  };

  const titleStyle = {
    fontSize: 30,
    fontWeight: 800,
    margin: "10px 0 4px",
  };

  const subtitleStyle = {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    maxWidth: 520,
  };

  const baseCard = {
    background: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 22px 60px rgba(0,0,0,0.9)",
    backdropFilter: "blur(16px)",
  };

  const sectionTitle = {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "rgba(210,255,230,0.85)",
    marginBottom: 12,
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const rowLabel = {
    fontSize: 14,
    fontWeight: 500,
  };

  const rowDesc = {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
  };

  const errorStyle = {
    marginTop: 12,
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(255,60,80,0.16)",
    border: "1px solid rgba(255,90,110,0.7)",
    color: "#ffd3d8",
  };

  const successStyle = {
    marginTop: 12,
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(0,255,150,0.1)",
    border: "1px solid rgba(0,255,150,0.6)",
    color: "#c9ffe8",
  };

  const saveBtnStyle = {
    marginTop: 18,
    width: "100%",
    padding: "11px 14px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00d1ff 40%, #ffffff 100%)",
    color: "#02140b",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "0 14px 40px rgba(0,255,165,0.55)",
  };

  const dangerCard = {
    ...baseCard,
    border: "1px solid rgba(255,90,110,0.7)",
    background:
      "linear-gradient(135deg, rgba(30,0,0,0.9), rgba(120,0,24,0.55))",
  };

  const dangerTitle = {
    ...sectionTitle,
    color: "rgba(255,205,210,0.95)",
  };

  const dangerBtn = {
    marginTop: 10,
    padding: "9px 13px",
    borderRadius: 999,
    border: "1px solid rgba(255,120,120,0.9)",
    background:
      "linear-gradient(135deg, #ff4b5c 0%, #b31217 100%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 28px rgba(255,75,92,0.65)",
  };

  const logoutBtn = {
    marginTop: 10,
    padding: "8px 13px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.5)",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

  const selectStyle = {
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.7)",
    color: "#ffffff",
    fontSize: 13,
    outline: "none",
  };

  // toggle stil
  const toggleTrack = (checked) => ({
    width: 42,
    height: 22,
    borderRadius: 999,
    background: checked
      ? "linear-gradient(135deg,#00ffb0,#00d1ff)"
      : "rgba(255,255,255,0.18)",
    border: checked
      ? "1px solid rgba(0,255,180,0.9)"
      : "1px solid rgba(255,255,255,0.35)",
    padding: 2,
    boxSizing: "border-box",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: checked ? "flex-end" : "flex-start",
    boxShadow: checked
      ? "0 0 12px rgba(0,255,180,0.8)"
      : "none",
    transition: "all 0.2s ease",
  });

  const toggleThumb = {
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#ffffff",
  };

  const isSmall =
    typeof window !== "undefined" && window.innerWidth < 900;
  const layoutStyle = useMemo(
    () => ({
      marginTop: 20,
      display: "grid",
      gridTemplateColumns: isSmall
        ? "1fr"
        : "minmax(0, 1.7fr) minmax(0, 1.3fr)",
      gap: 18,
      alignItems: "flex-start",
    }),
    [isSmall]
  );

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <div style={badgeStyle}>
            <span>⚙️ SETTINGS</span>
            <span style={{ opacity: 0.7 }}>· Control your world</span>
          </div>
          <h1 style={titleStyle}>Shape how Meet Outdoors feels.</h1>
          <p style={subtitleStyle}>
            Adjust notifications, privacy and appearance so every
            adventure – and every ping – radiates exactly how you like.
          </p>
        </div>

        <div style={layoutStyle}>
          {/* LEFT SIDE – MAIN SETTINGS */}
          <form onSubmit={handleSave} style={baseCard}>
            {/* ACCOUNT / APP */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitle}>App & account</div>

              <div style={rowStyle}>
                <div>
                  <div style={rowLabel}>Language</div>
                  <div style={rowDesc}>
                    Choose which language the app uses in the UI.
                  </div>
                </div>
                <select
                  style={selectStyle}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="sr">Srpski</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div style={{ ...rowStyle, borderBottom: "none" }}>
                <div>
                  <div style={rowLabel}>Theme</div>
                  <div style={rowDesc}>
                    Dark stays best for night rides and wild camping.
                  </div>
                </div>
                <select
                  style={selectStyle}
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="dark">Dark neon</option>
                  <option value="amoled">AMOLED black</option>
                  <option value="system">System default</option>
                </select>
              </div>
            </div>

            {/* NOTIFICATIONS */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitle}>Notifications</div>

              <div style={rowStyle}>
                <div>
                  <div style={rowLabel}>Email updates</div>
                  <div style={rowDesc}>
                    Get emails when someone joins your tour or follows you.
                  </div>
                </div>
                <div
                  style={toggleTrack(emailNotifications)}
                  onClick={() =>
                    setEmailNotifications((v) => !v)
                  }
                >
                  <div style={toggleThumb} />
                </div>
              </div>

              <div style={rowStyle}>
                <div>
                  <div style={rowLabel}>In-app notifications</div>
                  <div style={rowDesc}>
                    Show alerts in the app when something important
                    happens.
                  </div>
                </div>
                <div
                  style={toggleTrack(pushNotifications)}
                  onClick={() =>
                    setPushNotifications((v) => !v)
                  }
                >
                  <div style={toggleThumb} />
                </div>
              </div>

              <div style={{ ...rowStyle, borderBottom: "none" }}>
                <div>
                  <div style={rowLabel}>Tour reminders</div>
                  <div style={rowDesc}>
                    Short reminder before your upcoming adventures.
                  </div>
                </div>
                <div
                  style={toggleTrack(tourReminders)}
                  onClick={() =>
                    setTourReminders((v) => !v)
                  }
                >
                  <div style={toggleThumb} />
                </div>
              </div>
            </div>

            {/* PRIVACY */}
            <div>
              <div style={sectionTitle}>Privacy & safety</div>

              <div style={rowStyle}>
                <div>
                  <div style={rowLabel}>Public profile</div>
                  <div style={rowDesc}>
                    Allow other explorers to find and view your profile.
                  </div>
                </div>
                <div
                  style={toggleTrack(showPublicProfile)}
                  onClick={() =>
                    setShowPublicProfile((v) => !v)
                  }
                >
                  <div style={toggleThumb} />
                </div>
              </div>

              <div style={rowStyle}>
                <div>
                  <div style={rowLabel}>Messages from non-followers</div>
                  <div style={rowDesc}>
                    If off, only people you follow can start a chat with you.
                  </div>
                </div>
                <div
                  style={toggleTrack(allowMessagesFromStrangers)}
                  onClick={() =>
                    setAllowMessagesFromStrangers((v) => !v)
                  }
                >
                  <div style={toggleThumb} />
                </div>
              </div>

              <div style={{ ...rowStyle, borderBottom: "none" }}>
                <div>
                  <div style={rowLabel}>Show online status</div>
                  <div style={rowDesc}>
                    Let friends see when you&apos;re currently online.
                  </div>
                </div>
                <div
                  style={toggleTrack(showOnlineStatus)}
                  onClick={() =>
                    setShowOnlineStatus((v) => !v)
                  }
                >
                  <div style={toggleThumb} />
                </div>
              </div>
            </div>

            {/* ERRORS / SUCCESS */}
            {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
            {successMsg && (
              <div style={successStyle}>{successMsg}</div>
            )}

            {/* SAVE */}
            <button
              type="submit"
              style={saveBtnStyle}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </form>

          {/* RIGHT SIDE – DANGER ZONE & INFO */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* INFO CARD */}
            <div style={baseCard}>
              <div style={sectionTitle}>Profile snapshot</div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.6,
                }}
              >
                Your settings control how loudly Meet Outdoors talks
                to you and how visible you are to others.{" "}
                <span style={{ opacity: 0.8 }}>
                  Play with them until it feels like your perfect mix of
                  freedom and safety.
                </span>
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: 10,
                  borderRadius: 14,
                  background:
                    "radial-gradient(circle at top, rgba(0,255,160,0.16), rgba(0,0,0,0.9))",
                  border: "1px solid rgba(0,255,160,0.4)",
                  fontSize: 12,
                  color: "rgba(220,255,240,0.9)",
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  🌿 <strong>Tip:</strong> When you start selling tours
                  globally, strong notifications = more bookings.
                </div>
              </div>
            </div>

            {/* DANGER ZONE */}
            <div style={dangerCard}>
              <div style={dangerTitle}>Danger zone</div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,220,220,0.85)",
                  marginBottom: 10,
                }}
              >
                These actions are more serious. Be sure you know what
                you&apos;re doing before you tap them.
              </div>

              <button
                type="button"
                style={dangerBtn}
                onClick={() =>
                  alert(
                    "Account deletion will be implemented later. For now, contact support to remove your account."
                  )
                }
              >
                🧨 Delete account
              </button>

              <button
                type="button"
                style={logoutBtn}
                onClick={handleLogout}
              >
                🚪 Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}