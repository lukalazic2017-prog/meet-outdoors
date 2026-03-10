import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ApplyCreator() {
  const [user, setUser] = useState(null);
  const [existingApplicationId, setExistingApplicationId] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    creator_type: "individual",
    brand_name: "",
    bio: "",
    experience_text: "",
    activities_raw: "",
    instagram_url: "",
    website_url: "",
    tiktok_url: "",
    youtube_url: "",
    safety_notes: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    has_first_aid: false,
    has_insurance: false,
  });

  const [idDoc, setIdDoc] = useState(null);
  const [selfieDoc, setSelfieDoc] = useState(null);
  const [companyDoc, setCompanyDoc] = useState(null);
  const [licenseDoc, setLicenseDoc] = useState(null);

  const [existingFiles, setExistingFiles] = useState({
    id_document_url: "",
    selfie_document_url: "",
    company_document_url: "",
    license_document_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadUserAndApplication();
  }, []);

  async function loadUserAndApplication() {
    setPageLoading(true);

    const { data } = await supabase.auth.getUser();
    const authUser = data?.user || null;
    setUser(authUser);

    if (!authUser) {
      setPageLoading(false);
      return;
    }

    const { data: existingApp, error } = await supabase
      .from("creator_applications")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (error) {
      console.log("LOAD CREATOR APPLICATION ERROR:", error);
      setPageLoading(false);
      return;
    }

    if (existingApp) {
      setExistingApplicationId(existingApp.id);

      setForm((prev) => ({
        ...prev,
        full_name: existingApp.full_name || "",
        email: existingApp.email || authUser.email || "",
        phone: existingApp.phone || "",
        country: existingApp.country || "",
        city: existingApp.city || "",
        creator_type: existingApp.creator_type || "individual",
        brand_name: existingApp.brand_name || "",
        bio: existingApp.bio || "",
        experience_text: existingApp.experience_text || "",
        activities_raw: Array.isArray(existingApp.activities)
          ? existingApp.activities.join(", ")
          : "",
        instagram_url: existingApp.instagram_url || "",
        website_url: existingApp.website_url || "",
        tiktok_url: existingApp.tiktok_url || "",
        youtube_url: existingApp.youtube_url || "",
        safety_notes: existingApp.safety_notes || "",
        emergency_contact_name: existingApp.emergency_contact_name || "",
        emergency_contact_phone: existingApp.emergency_contact_phone || "",
        has_first_aid: !!existingApp.has_first_aid,
        has_insurance: !!existingApp.has_insurance,
      }));

      setExistingFiles({
        id_document_url: existingApp.id_document_url || "",
        selfie_document_url: existingApp.selfie_document_url || "",
        company_document_url: existingApp.company_document_url || "",
        license_document_url: existingApp.license_document_url || "",
      });
    } else {
      setForm((prev) => ({
        ...prev,
        email: authUser.email || "",
      }));
    }

    setPageLoading(false);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function uploadFile(file, label) {
    if (!file || !user) return null;

    const ext = file.name.split(".").pop() || "file";
    const path = `${user.id}/${Date.now()}-${label}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("creator-documents")
      .upload(path, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("creator-documents")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  function parseActivities(raw) {
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccess(false);

    if (!user) {
      setErrorMsg("You must be logged in.");
      return;
    }

    if (!form.full_name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      setErrorMsg("Email is required.");
      return;
    }

    if (!form.phone.trim()) {
      setErrorMsg("Phone is required.");
      return;
    }

    setLoading(true);

    try {
      const id_document_url = idDoc
        ? await uploadFile(idDoc, "id-document")
        : existingFiles.id_document_url || null;

      const selfie_document_url = selfieDoc
        ? await uploadFile(selfieDoc, "selfie-document")
        : existingFiles.selfie_document_url || null;

      const company_document_url = companyDoc
        ? await uploadFile(companyDoc, "company-document")
        : existingFiles.company_document_url || null;

      const license_document_url = licenseDoc
        ? await uploadFile(licenseDoc, "license-document")
        : existingFiles.license_document_url || null;

      const payload = {
        user_id: user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        city: form.city,
        creator_type: form.creator_type,
        brand_name: form.brand_name,
        bio: form.bio,
        experience_text: form.experience_text,
        activities: parseActivities(form.activities_raw),
        instagram_url: form.instagram_url,
        website_url: form.website_url,
        tiktok_url: form.tiktok_url,
        youtube_url: form.youtube_url,
        id_document_url,
        selfie_document_url,
        company_document_url,
        license_document_url,
        safety_notes: form.safety_notes,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        has_first_aid: form.has_first_aid,
        has_insurance: form.has_insurance,
        status: "pending",
      };

      let error = null;

      if (existingApplicationId) {
        const result = await supabase
          .from("creator_applications")
          .update(payload)
          .eq("id", existingApplicationId);

        error = result.error;
      } else {
        const result = await supabase
          .from("creator_applications")
          .insert([payload])
          .select()
          .single();

        error = result.error;

        if (!error && result.data?.id) {
          setExistingApplicationId(result.data.id);
        }
      }

      if (error) throw error;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          creator_status: "pending",
          creator_requested_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
  console.log("PROFILE UPDATE ERROR:", profileError);
      }
      setSuccess(true);
      await loadUserAndApplication();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  }

  const pageStyle = {
    minHeight: "100vh",
    padding: "28px 16px 60px",
    background:
      "radial-gradient(circle at top, #062a1d 0%, #030b08 55%, #020605 100%)",
    color: "#ffffff",
    boxSizing: "border-box",
  };

  const wrapStyle = {
    maxWidth: 860,
    margin: "0 auto",
  };

  const cardStyle = {
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
    backdropFilter: "blur(12px)",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.55)",
    color: "#ffffff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 13,
    marginBottom: 6,
    color: "rgba(255,255,255,0.84)",
  };

  const sectionTitleStyle = {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "rgba(210,255,230,0.85)",
  };

  const hintStyle = {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
  };

  const errorStyle = {
    marginTop: 12,
    fontSize: 13,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,60,80,0.16)",
    border: "1px solid rgba(255,90,110,0.7)",
    color: "#ffd3d8",
    lineHeight: 1.45,
  };

  const successStyle = {
    marginTop: 12,
    fontSize: 13,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(0,255,150,0.1)",
    border: "1px solid rgba(0,255,150,0.45)",
    color: "#c9ffe8",
    lineHeight: 1.45,
  };

  const submitBtnStyle = {
    marginTop: 18,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00cf7c 40%, #02a45d 100%)",
    color: "#02140b",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.05em",
    cursor: "pointer",
    boxShadow: "0 14px 40px rgba(0,255,165,0.35)",
  };

  if (pageLoading) {
    return (
      <div style={pageStyle}>
        <div style={wrapStyle}>
          <div style={cardStyle}>Loading application form...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={pageStyle}>
        <div style={wrapStyle}>
          <div style={cardStyle}>
            You must be logged in to apply as a creator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        <div style={{ ...cardStyle, marginBottom: 18 }}>
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
            Creator Verification
          </div>

          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
            Apply to become a verified creator
          </div>

          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 14 }}>
            Send your public info, experience, and documents for review.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <div style={sectionTitleStyle}>Basic Info</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={labelStyle}>Full name *</div>
                <input
                  style={inputStyle}
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Full name"
                />
              </div>

              <div>
                <div style={labelStyle}>Email *</div>
                <input
                  style={inputStyle}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
              </div>

              <div>
                <div style={labelStyle}>Phone *</div>
                <input
                  style={inputStyle}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                />
              </div>

              <div>
                <div style={labelStyle}>Creator type</div>
                <select
                  style={inputStyle}
                  name="creator_type"
                  value={form.creator_type}
                  onChange={handleChange}
                >
                  <option value="individual">Individual</option>
                  <option value="guide">Guide</option>
                  <option value="company">Company</option>
                  <option value="agency">Agency</option>
                  <option value="club">Club</option>
                </select>
              </div>

              <div>
                <div style={labelStyle}>Country</div>
                <input
                  style={inputStyle}
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </div>

              <div>
                <div style={labelStyle}>City</div>
                <input
                  style={inputStyle}
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={sectionTitleStyle}>Creator Profile</div>

            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Brand name</div>
              <input
                style={inputStyle}
                name="brand_name"
                value={form.brand_name}
                onChange={handleChange}
                placeholder="Brand / organization name"
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Bio</div>
              <textarea
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Experience</div>
              <textarea
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                name="experience_text"
                value={form.experience_text}
                onChange={handleChange}
                placeholder="Describe your experience organizing tours"
              />
            </div>

            <div>
              <div style={labelStyle}>Activities</div>
              <input
                style={inputStyle}
                name="activities_raw"
                value={form.activities_raw}
                onChange={handleChange}
                placeholder="Hiking, Cycling, Fishing..."
              />
              <div style={hintStyle}>Separate activities with commas.</div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={sectionTitleStyle}>Links</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                style={inputStyle}
                name="instagram_url"
                value={form.instagram_url}
                onChange={handleChange}
                placeholder="Instagram URL"
              />
              <input
                style={inputStyle}
                name="website_url"
                value={form.website_url}
                onChange={handleChange}
                placeholder="Website URL"
              />
              <input
                style={inputStyle}
                name="tiktok_url"
                value={form.tiktok_url}
                onChange={handleChange}
                placeholder="TikTok URL"
              />
              <input
                style={inputStyle}
                name="youtube_url"
                value={form.youtube_url}
                onChange={handleChange}
                placeholder="YouTube URL"
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={sectionTitleStyle}>Safety</div>

            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Safety notes</div>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                name="safety_notes"
                value={form.safety_notes}
                onChange={handleChange}
                placeholder="First aid, mountain safety, weather handling..."
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                style={inputStyle}
                name="emergency_contact_name"
                value={form.emergency_contact_name}
                onChange={handleChange}
                placeholder="Emergency contact name"
              />
              <input
                style={inputStyle}
                name="emergency_contact_phone"
                value={form.emergency_contact_phone}
                onChange={handleChange}
                placeholder="Emergency contact phone"
              />
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              <label style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  name="has_first_aid"
                  checked={form.has_first_aid}
                  onChange={handleChange}
                  style={{ marginRight: 8 }}
                />
                Has first aid knowledge
              </label>

              <label style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  name="has_insurance"
                  checked={form.has_insurance}
                  onChange={handleChange}
                  style={{ marginRight: 8 }}
                />
                Has insurance
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={sectionTitleStyle}>Documents</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={labelStyle}>ID document</div>
                <input type="file" onChange={(e) => setIdDoc(e.target.files?.[0] || null)} />
                {existingFiles.id_document_url && (
                  <div style={hintStyle}>Existing file already uploaded</div>
                )}
              </div>

              <div>
                <div style={labelStyle}>Selfie with document</div>
                <input type="file" onChange={(e) => setSelfieDoc(e.target.files?.[0] || null)} />
                {existingFiles.selfie_document_url && (
                  <div style={hintStyle}>Existing file already uploaded</div>
                )}
              </div>

              <div>
                <div style={labelStyle}>Company document</div>
                <input type="file" onChange={(e) => setCompanyDoc(e.target.files?.[0] || null)} />
                {existingFiles.company_document_url && (
                  <div style={hintStyle}>Existing file already uploaded</div>
                )}
              </div>

              <div>
                <div style={labelStyle}>License document</div>
                <input type="file" onChange={(e) => setLicenseDoc(e.target.files?.[0] || null)} />
                {existingFiles.license_document_url && (
                  <div style={hintStyle}>Existing file already uploaded</div>
                )}
              </div>
            </div>
          </div>

          {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
          {success && (
            <div style={successStyle}>
              Application sent successfully. Your creator request is now under review.
            </div>
          )}

          <button type="submit" disabled={loading} style={submitBtnStyle}>
            {loading ? "Submitting..." : "Submit creator application"}
          </button>
        </form>
      </div>
    </div>
  );
}