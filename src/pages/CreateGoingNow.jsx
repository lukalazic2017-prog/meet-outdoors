import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const CATEGORY_OPTIONS = [
  { value: "outdoor", label: "Outdoor" },
  { value: "chill", label: "Chill" },
  { value: "night", label: "Night out" },
  { value: "sport", label: "Sport" },
  { value: "trip", label: "Mini trip" },
  { value: "activity", label: "Activity" },
];

const VIBE_OPTIONS = [
  { value: "chill", label: "Chill" },
  { value: "social", label: "Social" },
  { value: "active", label: "Active" },
  { value: "party", label: "Party" },
  { value: "adventurous", label: "Adventurous" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
];

function toLocalDatetimeValue(date) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function CreateGoingNow() {
  const navigate = useNavigate();

  const nowPlus30 = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return toLocalDatetimeValue(d);
  }, []);

  const nowPlus150 = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 150);
    return toLocalDatetimeValue(d);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [startsAt, setStartsAt] = useState(nowPlus30);
  const [expiresAt, setExpiresAt] = useState(nowPlus150);
  const [spotsTotal, setSpotsTotal] = useState(6);
  const [category, setCategory] = useState("chill");
  const [vibe, setVibe] = useState("social");
  const [difficulty, setDifficulty] = useState("easy");
  const [isPublic, setIsPublic] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const quickFill = (mode) => {
    const start = new Date();

    if (mode === "now") start.setMinutes(start.getMinutes() + 10);
    if (mode === "1h") start.setHours(start.getHours() + 1);
    if (mode === "tonight") {
      start.setHours(20, 0, 0, 0);
      if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
    }
    if (mode === "tomorrow") {
      start.setDate(start.getDate() + 1);
      start.setHours(18, 0, 0, 0);
    }

    const end = new Date(start);
    end.setHours(end.getHours() + 2);

    setStartsAt(toLocalDatetimeValue(start));
    setExpiresAt(toLocalDatetimeValue(end));
  };

  const canSubmit =
    title.trim().length >= 3 &&
    locationText.trim().length >= 2 &&
    startsAt &&
    expiresAt &&
    Number(spotsTotal) > 0 &&
    !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!canSubmit) return;

    const startDate = new Date(startsAt);
    const endDate = new Date(expiresAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setErrorMsg("Please enter valid dates.");
      return;
    }

    if (endDate <= startDate) {
      setErrorMsg("End time must be after start time.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const finalTitle =
        title.trim() ||
        `${CATEGORY_OPTIONS.find((x) => x.value === category)?.label || "Plan"} now`;

      const { data, error } = await supabase
        .from("going_now")
        .insert({
          user_id: user.id,
          title: finalTitle,
          description: description.trim() || null,
          location_text: locationText.trim(),
          starts_at: startDate.toISOString(),
          expires_at: endDate.toISOString(),
          spots_total: Number(spotsTotal),
          difficulty,
          vibe,
          status: "active",
          is_public: isPublic,
          category,
        })
        .select("id")
        .single();

      if (error) {
        console.error("create going now error:", error);
        setErrorMsg(error.message || "Could not create plan.");
        return;
      }

      navigate(`/going-now/${data.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => navigate(-1)} style={backBtn}>
          ← Back
        </button>

        <div style={topMiniPill}>⚡ Start live plan</div>
      </div>

      <div style={shellStyle}>
        <div style={headerStyle}>
          <div
            style={{
              position: "absolute",
              top: -90,
              right: -80,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(103,232,249,0.18), transparent 68%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: -90,
              left: -80,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(167,243,208,0.14), transparent 68%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative" }}>
            <div style={eyebrowStyle}>⚡ Start a plan</div>

            <div style={heroTitle}>Create your going now plan</div>

            <div style={heroSubtitle}>
              Create a fast real-life plan people can join right now or very soon.
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 16,
              }}
            >
              <HeroMiniStat label="Visibility" value={isPublic ? "Public" : "Private"} />
              <HeroMiniStat label="Spots" value={spotsTotal || 0} />
              <HeroMiniStat label="Vibe" value={vibe} />
            </div>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <div
            style={{
              ...glassCard,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <SectionLabel>Quick start</SectionLabel>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button type="button" onClick={() => quickFill("now")} style={quickBtn}>
                Start now
              </button>
              <button type="button" onClick={() => quickFill("1h")} style={quickBtn}>
                In 1 hour
              </button>
              <button type="button" onClick={() => quickFill("tonight")} style={quickBtn}>
                Tonight
              </button>
              <button type="button" onClick={() => quickFill("tomorrow")} style={quickBtn}>
                Tomorrow
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="create-going-layout">
              <div className="create-main-column">
                <div style={{ ...glassCard, padding: 16, marginBottom: 16 }}>
                  <SectionLabel>Core details</SectionLabel>

                  <div style={{ display: "grid", gap: 16 }}>
                    <Field label="Plan title">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Sunset walk, coffee run, basketball, quick hike..."
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Location">
                      <input
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        placeholder="Belgrade Waterfront, Ada, city center, Jastrebac..."
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Description">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short vibe, who should join, what's the plan..."
                        rows={6}
                        style={{ ...inputStyle, resize: "vertical", minHeight: 132 }}
                      />
                    </Field>
                  </div>
                </div>

                <div style={{ ...glassCard, padding: 16, marginBottom: 16 }}>
                  <SectionLabel>Timing</SectionLabel>

                  <div className="create-two-col">
                    <Field label="Starts at">
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Ends at">
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </div>

                <div className="mobile-preview-card">
                  <PreviewCard
                    title={title}
                    locationText={locationText}
                    category={category}
                    vibe={vibe}
                    difficulty={difficulty}
                    spotsTotal={spotsTotal}
                    description={description}
                    isPublic={isPublic}
                  />
                </div>

                <div style={{ ...glassCard, padding: 16, marginBottom: 16 }}>
                  <SectionLabel>Visibility</SectionLabel>

                  <label style={toggleRowStyle}>
                    <div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: "#f2fffd",
                          marginBottom: 4,
                        }}
                      >
                        Public plan
                      </div>

                      <div
                        style={{
                          color: "rgba(235,249,255,0.68)",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        Let other people discover and join this plan.
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      style={{ width: 18, height: 18 }}
                    />
                  </label>
                </div>

                {errorMsg ? <div style={errorStyle}>{errorMsg}</div> : null}

                <div
                  style={{
                    ...glassCard,
                    padding: 16,
                  }}
                >
                  <SectionLabel>Post plan</SectionLabel>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      style={{
                        ...primaryBtn,
                        background: canSubmit
                          ? "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)"
                          : "rgba(255,255,255,0.10)",
                        color: canSubmit ? "#06232c" : "rgba(255,255,255,0.58)",
                        cursor: canSubmit ? "pointer" : "not-allowed",
                        boxShadow: canSubmit
                          ? "0 18px 40px rgba(103,232,249,0.20)"
                          : "none",
                      }}
                    >
                      {saving ? "Posting..." : "Post plan"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/going-now")}
                      style={ghostBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div className="create-side-column">
                <div className="desktop-preview-card">
                  <PreviewCard
                    title={title}
                    locationText={locationText}
                    category={category}
                    vibe={vibe}
                    difficulty={difficulty}
                    spotsTotal={spotsTotal}
                    description={description}
                    isPublic={isPublic}
                  />
                </div>

                <div style={{ ...glassCard, padding: 16, marginTop: 16 }}>
                  <SectionLabel>Settings</SectionLabel>

                  <div style={{ display: "grid", gap: 14 }}>
                    <Field label="Category">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={inputStyle}
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ color: "#000" }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Vibe">
                      <select
                        value={vibe}
                        onChange={(e) => setVibe(e.target.value)}
                        style={inputStyle}
                      >
                        {VIBE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ color: "#000" }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Difficulty">
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        style={inputStyle}
                      >
                        {DIFFICULTY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ color: "#000" }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Spots">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={spotsTotal}
                        onChange={(e) => setSpotsTotal(e.target.value)}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .create-going-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
          gap: 16px;
          align-items: start;
        }

        .create-main-column,
        .create-side-column {
          min-width: 0;
        }

        .create-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .mobile-preview-card {
          display: none;
        }

        .desktop-preview-card {
          display: block;
        }

        @media (max-width: 980px) {
          .create-going-layout {
            grid-template-columns: 1fr;
          }

          .mobile-preview-card {
            display: block;
            margin-bottom: 16px;
          }

          .desktop-preview-card {
            display: none;
          }
        }

        @media (max-width: 700px) {
          .create-two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageShell>
  );
}

function PreviewCard({
  title,
  locationText,
  category,
  vibe,
  difficulty,
  spotsTotal,
  description,
  isPublic,
}) {
  return (
    <div
      style={{
        ...glassCard,
        padding: 16,
        position: "sticky",
        top: 18,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -90,
          right: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(103,232,249,0.18), transparent 68%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: -70,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(167,243,208,0.16), transparent 68%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <SectionLabel>Live preview</SectionLabel>

        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
            boxShadow:
              "0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              position: "relative",
              minHeight: 220,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background:
                "radial-gradient(circle at 78% 20%, rgba(103,232,249,0.24), transparent 20%), radial-gradient(circle at 24% 28%, rgba(167,243,208,0.18), transparent 18%), linear-gradient(to bottom, rgba(10,25,31,0.74), rgba(5,12,16,0.96))",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 13px",
                  borderRadius: 999,
                  background:
                    "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
                  color: "#06252e",
                  fontWeight: 950,
                  fontSize: 11,
                  letterSpacing: "0.03em",
                  boxShadow: "0 14px 34px rgba(103,232,249,0.22)",
                }}
              >
                🔥 Going now
              </div>

              <div style={statusPreviewPill}>Preview</div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <span style={chipStyle}>{category}</span>
                <span style={chipStyle}>{vibe}</span>
                <span style={chipStyle}>{difficulty}</span>
              </div>

              <div
                style={{
                  fontSize: 28,
                  lineHeight: 0.98,
                  fontWeight: 950,
                  letterSpacing: "-0.05em",
                  color: "#fff",
                  marginBottom: 10,
                  textShadow: "0 12px 28px rgba(0,0,0,0.36)",
                }}
              >
                {title.trim() || "Untitled plan"}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={metaPill}>📍 {locationText.trim() || "No location yet"}</div>
                <div style={metaPill}>👥 {spotsTotal || 0} spots</div>
              </div>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div
              style={{
                color: "rgba(238,250,245,0.86)",
                lineHeight: 1.65,
                fontWeight: 600,
                marginBottom: 14,
                fontSize: 14.5,
              }}
            >
              {(description || "No description yet. Add a short vibe and who should join.")
                .slice(0, 130)}
              {(description || "").length > 130 ? "..." : ""}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={smallStat}>⚡ {category}</div>
              <div style={smallStat}>✨ {vibe}</div>
              <div style={smallStat}>🌍 {isPublic ? "Public" : "Private"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(103,232,249,0.16), transparent 18%), radial-gradient(circle at 82% 16%, rgba(167,243,208,0.15), transparent 18%), radial-gradient(circle at 18% 72%, rgba(96,165,250,0.12), transparent 20%), linear-gradient(180deg, #031019 0%, #081b28 40%, #0b2330 100%)",
        color: "#fff",
        padding: "16px 12px 108px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={miniLabel}>{label}</div>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "rgba(225,247,255,0.58)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function HeroMiniStat({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(125,211,252,0.12)",
        minWidth: 100,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          color: "rgba(225,247,255,0.56)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          lineHeight: 1,
          fontWeight: 950,
          letterSpacing: "-0.04em",
          color: "#f2fffd",
          textTransform: "capitalize",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const glassPanel = {
  borderRadius: 30,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
  boxShadow:
    "0 26px 90px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const glassCard = {
  borderRadius: 24,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.045))",
  border: "1px solid rgba(157,229,219,0.14)",
  boxShadow:
    "0 20px 55px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const shellStyle = glassPanel;

const headerStyle = {
  position: "relative",
  padding: "24px 18px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const eyebrowStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, rgba(167,243,208,0.18), rgba(103,232,249,0.18))",
  border: "1px solid rgba(103,232,249,0.14)",
  color: "#dffeff",
  fontWeight: 900,
  fontSize: 11,
  marginBottom: 12,
  letterSpacing: "0.03em",
};

const heroTitle = {
  fontSize: "clamp(34px, 6vw, 56px)",
  lineHeight: 0.94,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  marginBottom: 12,
};

const heroSubtitle = {
  color: "rgba(235,249,255,0.74)",
  fontWeight: 600,
  lineHeight: 1.65,
  maxWidth: 760,
  fontSize: 15.5,
};

const inputStyle = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(125,211,252,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  padding: "14px 14px",
  outline: "none",
  fontSize: 15,
  boxSizing: "border-box",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const quickBtn = {
  border: "1px solid rgba(125,211,252,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  borderRadius: 999,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 850,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#ecfaf6",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "capitalize",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const metaPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 11px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ffffff",
  fontWeight: 800,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const smallStat = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 11px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(125,211,252,0.12)",
  color: "#eafbf5",
  fontWeight: 800,
};

const miniLabel = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.10em",
  color: "rgba(225,247,255,0.58)",
  marginBottom: 8,
};

const primaryBtn = {
  border: "none",
  borderRadius: 18,
  padding: "15px 22px",
  fontWeight: 950,
  fontSize: 15,
  width: "100%",
  maxWidth: 260,
};

const ghostBtn = {
  border: "1px solid rgba(125,211,252,0.14)",
  borderRadius: 18,
  padding: "15px 22px",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const backBtn = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  borderRadius: 999,
  padding: "11px 15px",
  cursor: "pointer",
  fontWeight: 900,
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};

const topMiniPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  fontWeight: 850,
  color: "#effffd",
};

const errorStyle = {
  marginBottom: 16,
  color: "#ffb4b4",
  background: "rgba(255,80,80,0.08)",
  border: "1px solid rgba(255,80,80,0.22)",
  padding: 12,
  borderRadius: 14,
  fontWeight: 700,
};

const toggleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(125,211,252,0.12)",
  cursor: "pointer",
};

const statusPreviewPill = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, rgba(167,243,208,0.94), rgba(103,232,249,0.94), rgba(96,165,250,0.94))",
  border: "1px solid rgba(103,232,249,0.16)",
  color: "#06252e",
  fontWeight: 900,
  fontSize: 11,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};