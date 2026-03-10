import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminCreatorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("creator_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("LOAD CREATOR REQUESTS ERROR:", error);
      setRequests([]);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }

  async function approveRequest(application) {
    if (!application?.id || !application?.user_id) return;

    setBusyId(application.id);

    const { error: appError } = await supabase
      .from("creator_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (appError) {
      console.log("APP APPROVE ERROR:", appError);
      setBusyId(null);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        creator_status: "approved",
        is_verified: true,
        is_verified_creator: true,
      })
      .eq("id", application.user_id);

    if (profileError) {
      console.log("PROFILE APPROVE ERROR:", profileError);
      setBusyId(null);
      return;
    }

    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: application.user_id,
      title: "Creator request approved",
      body: "Congratulations! Your creator application has been approved. You can now create tours.",
      type: "creator_approved",
      seen: false,
      is_read: false,
      link: "/create-tour",
    });

    if (notifError) {
      console.log("APPROVE NOTIFICATION ERROR:", notifError);
    }

    await loadRequests();
    setBusyId(null);
  }

  async function rejectRequest(application) {
    if (!application?.id || !application?.user_id) return;

    setBusyId(application.id);

    const { error: appError } = await supabase
      .from("creator_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (appError) {
      console.log("APP REJECT ERROR:", appError);
      setBusyId(null);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        creator_status: "rejected",
        is_verified: false,
        is_verified_creator: false,
      })
      .eq("id", application.user_id);

    if (profileError) {
      console.log("PROFILE REJECT ERROR:", profileError);
      setBusyId(null);
      return;
    }

    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: application.user_id,
      title: "Creator request rejected",
      body: "Your creator application was not approved at this time.",
      type: "creator_rejected",
      seen: false,
      is_read: false,
      link: "/apply-creator",
    });

    if (notifError) {
      console.log("REJECT NOTIFICATION ERROR:", notifError);
    }

    await loadRequests();
    setBusyId(null);
  }

  const pageStyle = {
    minHeight: "100vh",
    padding: "28px 16px 50px",
    background:
      "radial-gradient(circle at top, #071d15 0%, #020806 50%, #000000 100%)",
    color: "white",
    boxSizing: "border-box",
  };

  const wrapStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headerCardStyle = {
    padding: 18,
    borderRadius: 18,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    marginBottom: 18,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  };

  const cardStyle = {
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
    backdropFilter: "blur(12px)",
  };

  const sectionTitleStyle = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(210,255,230,0.72)",
    marginBottom: 8,
    fontWeight: 700,
  };

  const rowStyle = {
    fontSize: 13,
    color: "rgba(255,255,255,0.86)",
    lineHeight: 1.55,
    marginBottom: 4,
    wordBreak: "break-word",
  };

  const statusPill = (status) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    background:
      status === "approved"
        ? "rgba(0,255,160,0.14)"
        : status === "rejected"
        ? "rgba(255,80,100,0.14)"
        : "rgba(255,211,107,0.14)",
    color:
      status === "approved"
        ? "#9cffd8"
        : status === "rejected"
        ? "#ffb3bf"
        : "#ffd36b",
    border:
      status === "approved"
        ? "1px solid rgba(0,255,160,0.35)"
        : status === "rejected"
        ? "1px solid rgba(255,80,100,0.35)"
        : "1px solid rgba(255,211,107,0.35)",
  });

  const linkBtnStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 700,
  };

  const approveBtnStyle = {
    padding: "10px 14px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #00ffb0, #00c97a)",
    color: "#032014",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 12,
  };

  const rejectBtnStyle = {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,120,120,0.35)",
    background: "rgba(255,80,100,0.14)",
    color: "#ffd5db",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 12,
  };

  const mutedStyle = {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
  };

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        <div style={headerCardStyle}>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(210,255,230,0.72)",
              marginBottom: 6,
              fontWeight: 800,
            }}
          >
            Admin
          </div>

          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
            Creator Requests
          </div>

          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 14 }}>
            Review creator applications, inspect documents, and approve or reject requests.
          </div>
        </div>

        {loading ? (
          <div style={mutedStyle}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={mutedStyle}>No creator applications yet.</div>
        ) : (
          <div style={gridStyle}>
            {requests.map((app) => (
              <div key={app.id} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>
                      {app.full_name || "Unnamed applicant"}
                    </div>
                    <div style={mutedStyle}>{app.email || "No email provided"}</div>
                  </div>

                  <div style={statusPill(app.status || "pending")}>
                    {app.status || "pending"}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Basic Info</div>
                  <div style={rowStyle}>📞 {app.phone || "—"}</div>
                  <div style={rowStyle}>
                    📍 {[app.city, app.country].filter(Boolean).join(", ") || "—"}
                  </div>
                  <div style={rowStyle}>🧭 Type: {app.creator_type || "—"}</div>
                  <div style={rowStyle}>🏷️ Brand: {app.brand_name || "—"}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Bio</div>
                  <div style={rowStyle}>{app.bio || "No bio provided."}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Experience</div>
                  <div style={rowStyle}>{app.experience_text || "No experience provided."}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Activities</div>
                  <div style={rowStyle}>
                    {Array.isArray(app.activities) && app.activities.length > 0
                      ? app.activities.join(", ")
                      : "No activities listed."}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Links</div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {app.instagram_url && (
                      <a
                        href={app.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                      >
                        Instagram
                      </a>
                    )}
                    {app.website_url && (
                      <a
                        href={app.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                      >
                        Website
                      </a>
                    )}
                    {app.tiktok_url && (
                      <a
                        href={app.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                      >
                        TikTok
                      </a>
                    )}
                    {app.youtube_url && (
                      <a
                        href={app.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                      >
                        YouTube
                      </a>
                    )}
                    {!app.instagram_url &&
                      !app.website_url &&
                      !app.tiktok_url &&
                      !app.youtube_url && <div style={mutedStyle}>No links provided.</div>}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Documents</div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {app.id_document_url && (
                      <a
                        href={app.id_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                      >
                        ID Document
                      </a>
                    )}
                    {app.selfie_document_url && (
                      <a
                        href={app.selfie_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                      >
                        Selfie + Document
                      </a>
                    )}
                    {app.company_document_url && (
                      <a
                        href={app.company_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                      >
                        Company Document
                      </a>
                    )}
                    {app.license_document_url && (
                      <a
                        href={app.license_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkBtnStyle}
                      >
                        License
                      </a>
                    )}
                    {!app.id_document_url &&
                      !app.selfie_document_url &&
                      !app.company_document_url &&
                      !app.license_document_url && (
                        <div style={mutedStyle}>No documents uploaded.</div>
                      )}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Safety</div>
                  <div style={rowStyle}>
                    ⛑️ First aid: {app.has_first_aid ? "Yes" : "No"}
                  </div>
                  <div style={rowStyle}>
                    🛡️ Insurance: {app.has_insurance ? "Yes" : "No"}
                  </div>
                  <div style={rowStyle}>
                    🚨 Emergency:{" "}
                    {[app.emergency_contact_name, app.emergency_contact_phone]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </div>
                  <div style={rowStyle}>📝 {app.safety_notes || "No safety notes."}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Meta</div>
                  <div style={rowStyle}>
                    Created:{" "}
                    {app.created_at
                      ? new Date(app.created_at).toLocaleString()
                      : "—"}
                  </div>
                  <div style={rowStyle}>
                    Reviewed:{" "}
                    {app.reviewed_at
                      ? new Date(app.reviewed_at).toLocaleString()
                      : "Not reviewed"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => approveRequest(app)}
                    disabled={busyId === app.id || app.status === "approved"}
                    style={{
                      ...approveBtnStyle,
                      opacity:
                        busyId === app.id || app.status === "approved" ? 0.6 : 1,
                      cursor:
                        busyId === app.id || app.status === "approved"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {busyId === app.id ? "Working..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={() => rejectRequest(app)}
                    disabled={busyId === app.id || app.status === "rejected"}
                    style={{
                      ...rejectBtnStyle,
                      opacity:
                        busyId === app.id || app.status === "rejected" ? 0.6 : 1,
                      cursor:
                        busyId === app.id || app.status === "rejected"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {busyId === app.id ? "Working..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}