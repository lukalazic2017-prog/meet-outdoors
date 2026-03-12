

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
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 820 : false
  );

  useEffect(() => {
    loadUserAndApplication();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
    padding: isMobile ? "16px 12px 40px" : "28px 16px 70px",
    background:
      "radial-gradient(1000px 480px at 0% 0%, rgba(0,255,170,0.10), transparent 55%), radial-gradient(900px 420px at 100% 0%, rgba(0,180,255,0.10), transparent 55%), linear-gradient(180deg, #041812 0%, #020907 45%, #010403 100%)",
    color: "#ffffff",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const wrapStyle = {
    maxWidth: 1100,
    margin: "0 auto",
  };

  const glassCard = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,0.42)",
    backdropFilter: "blur(18px)",
  };

  const heroStyle = {
    ...glassCard,
    padding: isMobile ? 18 : 26,
    marginBottom: 18,
    overflow: "hidden",
    position: "relative",
  };

  const formCardStyle = {
    ...glassCard,
    padding: isMobile ? 14 : 22,
  };

  const sectionCard = {
    borderRadius: 20,
    padding: isMobile ? 14 : 16,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
    marginBottom: 16,
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.32)",
    color: "#ffffff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "0.2s ease",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: 100,
    resize: "vertical",
  };

  const labelStyle = {
    fontSize: 13,
    marginBottom: 7,
    color: "rgba(255,255,255,0.88)",
    fontWeight: 700,
  };

  const sectionTitleStyle = {
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "rgba(190,255,225,0.86)",
  };

  const hintStyle = {
    fontSize: 11,
    color: "rgba(255,255,255,0.58)",
    marginTop: 6,
    lineHeight: 1.45,
  };

  const errorStyle = {
    marginTop: 14,
    fontSize: 13,
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(255,60,80,0.12)",
    border: "1px solid rgba(255,90,110,0.45)",
    color: "#ffd3d8",
    lineHeight: 1.5,
    fontWeight: 700,
  };

  const successStyle = {
    marginTop: 14,
    fontSize: 13,
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(0,255,150,0.10)",
    border: "1px solid rgba(0,255,150,0.32)",
    color: "#d9fff0",
    lineHeight: 1.5,
    fontWeight: 700,
  };

  const submitBtnStyle = {
    marginTop: 18,
    width: "100%",
    padding: "15px 16px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00d68b 38%, #00b8ff 100%)",
    color: "#03140d",
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: "0.06em",
    cursor: "pointer",
    boxShadow: "0 18px 45px rgba(0,255,165,0.24)",
  };

  const grid2 = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 12,
  };

  const fileBox = {
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const miniBadge = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.88)",
    whiteSpace: "nowrap",
  };

  if (pageLoading) {
    return (
      <div style={pageStyle}>
        <div style={wrapStyle}>
          <div style={{ ...glassCard, padding: 22 }}>Loading application form...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={pageStyle}>
        <div style={wrapStyle}>
          <div style={{ ...glassCard, padding: 22 }}>
            You must be logged in to apply as a creator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        <div style={heroStyle}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top right, rgba(0,255,170,0.12), transparent 28%), radial-gradient(circle at bottom left, rgba(0,180,255,0.08), transparent 25%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(210,255,230,0.75)",
                marginBottom: 8,
                fontWeight: 900,
              }}
            >
              MeetOutdoors • Creator Verification
            </div>

            <div
              style={{
                fontSize: isMobile ? 30 : 42,
                fontWeight: 950,
                lineHeight: 1.03,
                marginBottom: 10,
              }}
            >
              Apply to become a verified creator
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.74)",
                fontSize: isMobile ? 14 : 15,
                lineHeight: 1.7,
                maxWidth: 760,
              }}
            >
              Share your public profile, experience, safety information and supporting
              documents. Once submitted, your application will be reviewed by the admin team.
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={miniBadge}>✅ Manual review</div>
              <div style={miniBadge}>🛡️ Verification process</div>
              <div style={miniBadge}>📄 Secure document submission</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={formCardStyle}>
          <div style={sectionCard}>
            <div style={sectionTitleStyle}>Basic Info</div>

            <div style={grid2}>
              <div>
                <div style={labelStyle}>Full name *</div>
                <input
                  style={inputStyle}
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <div style={labelStyle}>Email *</div>
                <input
                  style={inputStyle}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <div style={labelStyle}>Phone *</div>
                <input
                  style={inputStyle}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
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

          <div style={sectionCard}>
            <div style={sectionTitleStyle}>Creator Profile</div>

            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Brand name</div>
              <input
                style={inputStyle}
                name="brand_name"
                value={form.brand_name}
                onChange={handleChange}
                placeholder="Brand / organization name"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Bio</div>
              <textarea
                style={textareaStyle}
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us who you are, what kind of creator you are, and what people can expect from you"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Experience</div>
              <textarea
                style={textareaStyle}
                name="experience_text"
                value={form.experience_text}
                onChange={handleChange}
                placeholder="Describe your experience with events, guiding people, tours, adventure or outdoor organization"
              />
            </div>

            <div>
              <div style={labelStyle}>Activities</div>
              <input
                style={inputStyle}
                name="activities_raw"
                value={form.activities_raw}
                onChange={handleChange}
                placeholder="Hiking, Cycling, Fishing, Kayaking..."
              />
              <div style={hintStyle}>Separate activities with commas.</div>
            </div>
          </div>

          <div style={sectionCard}>
            <div style={sectionTitleStyle}>Links & Social Presence</div>

            <div style={grid2}>
              <div>
                <div style={labelStyle}>Instagram URL</div>
                <input
                  style={inputStyle}
                  name="instagram_url"
                  value={form.instagram_url}
                  onChange={handleChange}
                  placeholder="Instagram URL"
                />
              </div>

              <div>
                <div style={labelStyle}>Website URL</div>
                <input
                  style={inputStyle}
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  placeholder="Website URL"
                />
              </div>

              <div>
                <div style={labelStyle}>TikTok URL</div>
                <input
                  style={inputStyle}
                  name="tiktok_url"
                  value={form.tiktok_url}
                  onChange={handleChange}
                  placeholder="TikTok URL"
                />
              </div>

              <div>
                <div style={labelStyle}>YouTube URL</div>
                <input
                  style={inputStyle}
                  name="youtube_url"
                  value={form.youtube_url}
                  onChange={handleChange}
                  placeholder="YouTube URL"
                />
              </div>
            </div>
          </div>

          <div style={sectionCard}>
            <div style={sectionTitleStyle}>Safety & Responsibility</div>

            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Safety notes</div>
              <textarea
                style={{ ...textareaStyle, minHeight: 90 }}
                name="safety_notes"
                value={form.safety_notes}
                onChange={handleChange}
                placeholder="Mention first aid, route planning, weather awareness, participant safety, emergency actions..."
              />
            </div>

            <div style={grid2}>
              <div>
                <div style={labelStyle}>Emergency contact name</div>
                <input
                  style={inputStyle}
                  name="emergency_contact_name"
                  value={form.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <div style={labelStyle}>Emergency contact phone</div>
                <input
                  style={inputStyle}
                  name="emergency_contact_phone"
                  value={form.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <input
                  type="checkbox"
                  name="has_first_aid"
                  checked={form.has_first_aid}
                  onChange={handleChange}
                />
                Has first aid knowledge
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <input
                  type="checkbox"
                  name="has_insurance"
                  checked={form.has_insurance}
                  onChange={handleChange}
                />
                Has insurance
              </label>
            </div>
          </div>

          <div style={sectionCard}>
            <div style={sectionTitleStyle}>Documents</div>

            <div style={grid2}>
              <div style={fileBox}>
                <div style={labelStyle}>ID document</div>
                <input
                  type="file"
                  onChange={(e) => setIdDoc(e.target.files?.[0] || null)}
                />
                {existingFiles.id_document_url && (
                  <div style={hintStyle}>Existing file already uploaded.</div>
                )}
              </div>

              <div style={fileBox}>
                <div style={labelStyle}>Selfie with document</div>
                <input
                  type="file"
                  onChange={(e) => setSelfieDoc(e.target.files?.[0] || null)}
                />
                {existingFiles.selfie_document_url && (
                  <div style={hintStyle}>Existing file already uploaded.</div>
                )}
              </div>

              <div style={fileBox}>
                <div style={labelStyle}>Company document</div>
                <input
                  type="file"
                  onChange={(e) => setCompanyDoc(e.target.files?.[0] || null)}
                />
                {existingFiles.company_document_url && (
                  <div style={hintStyle}>Existing file already uploaded.</div>
                )}
              </div>

              <div style={fileBox}>
                <div style={labelStyle}>License document</div>
                <input
                  type="file"
                  onChange={(e) => setLicenseDoc(e.target.files?.[0] || null)}
                />
                {existingFiles.license_document_url && (
                  <div style={hintStyle}>Existing file already uploaded.</div>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: "14px 16px",
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, rgba(0,255,170,0.08), rgba(0,180,255,0.06))",
                border: "1px solid rgba(120,255,220,0.16)",
                color: "rgba(235,255,248,0.88)",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              🔒 Your submitted information and documents are handled with care and used only
              for verification and safety review. Sensitive data stays protected and is not
              publicly displayed on your creator profile.
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