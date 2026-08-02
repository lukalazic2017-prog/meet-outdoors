import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { uploadProfileFile } from "../utils/profileUpload";

const ACTIVITIES = [
  "Hiking",
  "Camping",
  "Rafting",
  "Cycling",
  "Running",
  "Basketball",
  "Tennis",
  "Fishing",
  "Quad",
  "Paragliding",
  "Skiing",
  "Boat rides",
];

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  fill = "none",
  className = "",
}) {
  const icons = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    arrowLeft: (
      <>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    host: (
      <>
        <path d="M4 20h16" />
        <path d="m6 20 2-10h8l2 10" />
        <path d="M9 10V6a3 3 0 0 1 6 0v4" />
        <path d="M10 15h4" />
      </>
    ),

    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),

    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
        <path d="M9.4 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-2.1 3.1" />
        <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.8" />
      </>
    ),

    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),

    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18" />
        <path d="M12 3a15 15 0 0 0 0 18" />
      </>
    ),

    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    ),

    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      </>
    ),

    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1" />
      </>
    ),

    video: (
      <>
        <rect x="3" y="5" width="13" height="14" rx="2" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),

    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),

    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),

    sparkles: (
      <>
        <path d="m12 3 1.1 3.4L16.5 8l-3.4 1.6L12 13l-1.1-3.4L7.5 8l3.4-1.6L12 3Z" />
        <path d="m19 14 .7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14Z" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function FileUpload({
  label,
  description,
  accept,
  file,
  onChange,
  icon = "image",
}) {
  const previewUrl = useMemo(() => {
    if (!file || !file.type?.startsWith("image/")) return "";
    return URL.createObjectURL(file);
  }, [file]);

  return (
    <label className={`fileUpload ${file ? "hasFile" : ""}`}>
      <input
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />

      {previewUrl ? (
        <img className="filePreview" src={previewUrl} alt="" />
      ) : (
        <span className="fileIcon">
          <Icon name={icon} size={23} />
        </span>
      )}

      <span className="fileText">
        <strong>{file ? file.name : label}</strong>
        <small>
          {file
            ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
            : description}
        </small>
      </span>

      <span className="fileAction">
        <Icon name={file ? "check" : "upload"} size={18} />
      </span>
    </label>
  );
}

export default function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    username: "",
    city: "",
    country: "",
    bio: "",
    phone: "",
    instagram_url: "",
    website_url: "",
    promo_video_url: "",
    activities: [],
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function handleRoleChange(nextRole) {
    setRole(nextRole);
    setError("");
  }

  function toggleActivity(activity) {
    setForm((prev) => {
      const exists = prev.activities.includes(activity);

      return {
        ...prev,
        activities: exists
          ? prev.activities.filter((item) => item !== activity)
          : [...prev.activities, activity],
      };
    });
  }

  async function handleSignup(event) {
    event.preventDefault();

    if (form.activities.length === 0) {
      setError("Izaberi najmanje jednu aktivnost.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const username = form.username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      if (username.length < 3) {
        throw new Error("Korisničko ime mora imati najmanje 3 karaktera.");
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            role,
            full_name: form.full_name.trim(),
            username,
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      const userId = data.user?.id;

      if (!userId) {
        throw new Error(
          "Registracija je uspela, ali korisnički ID nije pronađen."
        );
      }

      const avatar_url = await uploadProfileFile({
        bucket: "avatars",
        userId,
        file: avatarFile,
        folder: "avatar",
      });

      const cover_url = await uploadProfileFile({
        bucket: "covers",
        userId,
        file: coverFile,
        folder: "cover",
      });

      const uploadedVideoUrl =
        role === "host"
          ? await uploadProfileFile({
              bucket: "profile-videos",
              userId,
              file: videoFile,
              folder: "video",
            })
          : null;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role,
          full_name: form.full_name.trim(),
          username,
          city: form.city.trim(),
          country: form.country.trim(),
          bio: form.bio.trim(),
          phone: role === "host" ? form.phone.trim() : "",
          instagram_url:
            role === "host" ? form.instagram_url.trim() : "",
          website_url: role === "host" ? form.website_url.trim() : "",
          promo_video_url:
            role === "host"
              ? uploadedVideoUrl || form.promo_video_url.trim()
              : "",
          activities: form.activities,
          avatar_url,
          cover_url,
        })
        .eq("id", userId);

      if (profileError) {
        throw profileError;
      }

      navigate("/profile");
    } catch (err) {
      setError(err.message || "Došlo je do greške prilikom registracije.");
    } finally {
      setLoading(false);
    }
  }

  const roleContent =
    role === "host"
      ? {
          kicker: "Host nalog",
          title: "Pretvori svoju strast u iskustvo.",
          text: "Kreiraj outdoor događaje, prihvataj rezervacije i izgradi zajednicu ljudi koji žele da istražuju.",
          image:
            "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=90",
        }
      : {
          kicker: "Korisnički nalog",
          title: "Pronađi ljude koji biraju prirodu.",
          text: "Otkrij događaje, rezerviši mesto i pronađi avanture koje ćeš dugo pamtiti.",
          image:
            "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=90",
        };

  return (
    <>
      <SignupStyles />

      <main className={`signupPage ${role}`}>
        <section
          className="signupVisual"
          style={{
            "--signup-image": `url("${roleContent.image}")`,
          }}
        >
          <div className="visualOverlay" />


          <div className="visualContent">
            <span className="visualKicker">
              <span />
              {roleContent.kicker}
            </span>

            <h1>{roleContent.title}</h1>

            <p>{roleContent.text}</p>

            <div className="visualBenefits">
              <div>
                <span>
                  <Icon name="check" size={15} />
                </span>

                <div>
                  <strong>Proverena zajednica</strong>
                  <small>Ljudi koji dele tvoju energiju.</small>
                </div>
              </div>

              <div>
                <span>
                  <Icon name="shield" size={16} />
                </span>

                <div>
                  <strong>Sigurne rezervacije</strong>
                  <small>Jednostavno i pregledno iskustvo.</small>
                </div>
              </div>

              <div>
                <span>
                  <Icon name="sparkles" size={16} />
                </span>

                <div>
                  <strong>Avanture po tvojoj meri</strong>
                  <small>Od planina do vode i snega.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="visualBottom">
            <span>Prave avanture.</span>
            <span>Pravi ljudi.</span>
          </div>
        </section>

        <section className="signupFormSection">
          <div className="signupFormContainer">
            <Link to="/" className="mobileBack">
              <Icon name="arrowLeft" size={17} />
              Nazad na početnu
            </Link>

            <div className="formHeader">
              <span className="formKicker">Kreiraj nalog</span>

              <h2>Dobrodošao u MeetOutdoors.</h2>

              <p>
                Izaberi kako želiš da koristiš platformu i popuni svoj
                profil.
              </p>
            </div>

            <div className="roleSwitch">
              <button
                type="button"
                className={role === "user" ? "active" : ""}
                onClick={() => handleRoleChange("user")}
              >
                <span className="roleSwitchIcon">
                  <Icon name="user" size={21} />
                </span>

                <span className="roleSwitchText">
                  <strong>Pridruži se avanturama</strong>
                  <small>Korisnik</small>
                </span>

                <span className="roleCheck">
                  <Icon name="check" size={14} />
                </span>
              </button>

              <button
                type="button"
                className={role === "host" ? "active" : ""}
                onClick={() => handleRoleChange("host")}
              >
                <span className="roleSwitchIcon">
                  <Icon name="host" size={21} />
                </span>

                <span className="roleSwitchText">
                  <strong>Kreiraj avanture</strong>
                  <small>Domaćin</small>
                </span>

                <span className="roleCheck">
                  <Icon name="check" size={14} />
                </span>
              </button>
            </div>

            <form className="signupForm" onSubmit={handleSignup}>
              <div className="formSection">
                <div className="formSectionHeading">
                  <span>01</span>

                  <div>
                    <strong>Osnovni podaci</strong>
                    <small>Podaci koje koristiš za svoj nalog.</small>
                  </div>
                </div>

                <div className="formGrid">
                  <label className="inputGroup">
                    <span>Email adresa</span>

                    <div className="inputWrapper">
                      <Icon name="mail" size={18} />

                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        placeholder="ime@email.com"
                        autoComplete="email"
                      />
                    </div>
                  </label>

                  <label className="inputGroup">
                    <span>Lozinka</span>

                    <div className="inputWrapper">
                      <Icon name="lock" size={18} />

                      <input
                        required
                        minLength={6}
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) =>
                          updateField("password", event.target.value)
                        }
                        placeholder="Najmanje 6 karaktera"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        className="passwordToggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword
                            ? "Sakrij lozinku"
                            : "Prikaži lozinku"
                        }
                      >
                        <Icon
                          name={showPassword ? "eyeOff" : "eye"}
                          size={18}
                        />
                      </button>
                    </div>
                  </label>

                  <label className="inputGroup">
                    <span>
                      {role === "host"
                        ? "Naziv organizatora"
                        : "Ime i prezime"}
                    </span>

                    <div className="inputWrapper">
                      <Icon name={role === "host" ? "host" : "user"} size={18} />

                      <input
                        required
                        value={form.full_name}
                        onChange={(event) =>
                          updateField("full_name", event.target.value)
                        }
                        placeholder={
                          role === "host"
                            ? "Mountain Crew"
                            : "Luka Petrović"
                        }
                      />
                    </div>
                  </label>

                  <label className="inputGroup">
                    <span>Korisničko ime</span>

                    <div className="inputWrapper usernameInput">
                      <span className="atSymbol">@</span>

                      <input
                        required
                        value={form.username}
                        onChange={(event) =>
                          updateField("username", event.target.value)
                        }
                        placeholder="luka_outdoors"
                      />
                    </div>
                  </label>

                  <label className="inputGroup">
                    <span>Grad</span>

                    <div className="inputWrapper">
                      <Icon name="mapPin" size={18} />

                      <input
                        value={form.city}
                        onChange={(event) =>
                          updateField("city", event.target.value)
                        }
                        placeholder="Beograd"
                      />
                    </div>
                  </label>

                  <label className="inputGroup">
                    <span>Država</span>

                    <div className="inputWrapper">
                      <Icon name="globe" size={18} />

                      <input
                        value={form.country}
                        onChange={(event) =>
                          updateField("country", event.target.value)
                        }
                        placeholder="Srbija"
                      />
                    </div>
                  </label>
                </div>

                <label className="inputGroup">
                  <span>
                    {role === "host"
                      ? "Opiši svoja iskustva"
                      : "Napiši nešto o sebi"}
                  </span>

                  <textarea
                    rows="5"
                    value={form.bio}
                    onChange={(event) =>
                      updateField("bio", event.target.value)
                    }
                    placeholder={
                      role === "host"
                        ? "Opiši kakve avanture organizuješ, svoje iskustvo i šta gosti mogu da očekuju."
                        : "Reci zajednici šta voliš da istražuješ i kakve avanture tražiš."
                    }
                  />

                  <small className="fieldHint">
                    Dobar opis pomaže ljudima da te bolje upoznaju.
                  </small>
                </label>
              </div>

              <div className="formSection">
                <div className="formSectionHeading">
                  <span>02</span>

                  <div>
                    <strong>Fotografije profila</strong>
                    <small>
                      Dodaj avatar i fotografiju koja predstavlja tvoj profil.
                    </small>
                  </div>
                </div>

                <div className="uploadGrid">
                  <FileUpload
                    label={
                      role === "host"
                        ? "Dodaj logo ili avatar"
                        : "Dodaj profilnu fotografiju"
                    }
                    description="JPG, PNG ili WEBP"
                    accept="image/*"
                    file={avatarFile}
                    onChange={setAvatarFile}
                    icon="user"
                  />

                  <FileUpload
                    label="Dodaj cover fotografiju"
                    description="Preporučeno 1600 × 600 px"
                    accept="image/*"
                    file={coverFile}
                    onChange={setCoverFile}
                    icon="image"
                  />
                </div>
              </div>

              {role === "host" && (
                <div className="formSection hostDetailsSection">
                  <div className="formSectionHeading">
                    <span>03</span>

                    <div>
                      <strong>Podaci domaćina</strong>
                      <small>
                        Omogući gostima da saznaju više o tvom radu.
                      </small>
                    </div>
                  </div>

                  <div className="formGrid">
                    <label className="inputGroup">
                      <span>Telefon</span>

                      <div className="inputWrapper">
                        <Icon name="phone" size={18} />

                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(event) =>
                            updateField("phone", event.target.value)
                          }
                          placeholder="+381 60 123 4567"
                        />
                      </div>
                    </label>

                    <label className="inputGroup">
                      <span>Instagram profil</span>

                      <div className="inputWrapper">
                        <Icon name="instagram" size={18} />

                        <input
                          type="url"
                          value={form.instagram_url}
                          onChange={(event) =>
                            updateField(
                              "instagram_url",
                              event.target.value
                            )
                          }
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                    </label>

                    <label className="inputGroup">
                      <span>Web-sajt</span>

                      <div className="inputWrapper">
                        <Icon name="link" size={18} />

                        <input
                          type="url"
                          value={form.website_url}
                          onChange={(event) =>
                            updateField("website_url", event.target.value)
                          }
                          placeholder="https://..."
                        />
                      </div>
                    </label>

                    <label className="inputGroup">
                      <span>Link promo videa</span>

                      <div className="inputWrapper">
                        <Icon name="video" size={18} />

                        <input
                          type="url"
                          value={form.promo_video_url}
                          onChange={(event) =>
                            updateField(
                              "promo_video_url",
                              event.target.value
                            )
                          }
                          placeholder="YouTube, Instagram ili TikTok"
                        />
                      </div>
                    </label>
                  </div>

                  <FileUpload
                    label="Ili otpremi promo video"
                    description="MP4, MOV ili WEBM format"
                    accept="video/*"
                    file={videoFile}
                    onChange={setVideoFile}
                    icon="video"
                  />
                </div>
              )}

              <div className="formSection">
                <div className="formSectionHeading">
                  <span>{role === "host" ? "04" : "03"}</span>

                  <div>
                    <strong>
                      {role === "host"
                        ? "Aktivnosti koje organizuješ"
                        : "Aktivnosti koje voliš"}
                    </strong>

                    <small>
                      Izaberi najmanje jednu. Možeš ih promeniti kasnije.
                    </small>
                  </div>
                </div>

                <div className="activityChips">
                  {ACTIVITIES.map((activity) => {
                    const selected =
                      form.activities.includes(activity);

                    return (
                      <button
                        key={activity}
                        type="button"
                        className={selected ? "selected" : ""}
                        onClick={() => toggleActivity(activity)}
                      >
                        {selected && <Icon name="check" size={14} />}
                        {activity}
                      </button>
                    );
                  })}
                </div>

                <div className="selectedCount">
                  <span>{form.activities.length}</span>
                  izabranih aktivnosti
                </div>
              </div>

              {error && (
                <div className="signupError" role="alert">
                  <span>
                    <Icon name="close" size={17} />
                  </span>

                  <p>{error}</p>
                </div>
              )}

              <button
                className="submitButton"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="buttonLoader" />
                    Kreiranje naloga...
                  </>
                ) : (
                  <>
                    {role === "host"
                      ? "Kreiraj host nalog"
                      : "Kreiraj korisnički nalog"}

                    <Icon name="arrowRight" size={19} />
                  </>
                )}
              </button>

              <p className="termsText">
                Kreiranjem naloga prihvataš uslove korišćenja i politiku
                privatnosti MeetOutdoors platforme.
              </p>
            </form>

            <p className="loginPrompt">
              Već imaš nalog?
              <Link to="/login">
                Prijavi se
                <Icon name="arrowRight" size={16} />
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function SignupStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f4f5ef;
      }

      button,
      input,
      textarea {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .signupPage {
        min-height: 100vh;
        display: grid;
        grid-template-columns: minmax(420px, 0.85fr) minmax(600px, 1.15fr);
        background: #f4f5ef;
        color: #17271f;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .signupPage a {
        color: inherit;
        text-decoration: none;
      }

      .signupVisual {
        position: sticky;
        top: 0;
        isolation: isolate;
        min-height: 100vh;
        height: 100vh;
        display: flex;
        flex-direction: column;
        padding: 42px;
        overflow: hidden;
        background-image: var(--signup-image);
        background-position: center;
        background-size: cover;
        color: white;
      }

      .signupVisual::before {
        position: absolute;
        inset: 0;
        z-index: -2;
        content: "";
        background-image: var(--signup-image);
        background-position: center;
        background-size: cover;
        transition: background-image 0.35s ease;
      }

      .visualOverlay {
        position: absolute;
        inset: 0;
        z-index: -1;
        background:
          linear-gradient(
            180deg,
            rgba(5, 16, 10, 0.38),
            rgba(5, 17, 10, 0.7) 58%,
            rgba(4, 14, 8, 0.95)
          ),
          linear-gradient(
            90deg,
            rgba(5, 15, 9, 0.55),
            transparent 70%
          );
      }

      .signupLogo {
        display: inline-flex;
        align-items: center;
        gap: 11px;
        align-self: flex-start;
        font-size: 17px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .signupLogo > span {
        display: grid;
        place-items: center;
        width: 43px;
        height: 43px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.1);
        color: #caf28f;
        backdrop-filter: blur(14px);
      }

      .visualContent {
        max-width: 620px;
        margin-top: auto;
        padding: 80px 0 50px;
      }

      .visualKicker {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.83);
        font-size: 11px;
        font-weight: 850;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        backdrop-filter: blur(12px);
      }

      .visualKicker > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #c9f28c;
        box-shadow: 0 0 0 5px rgba(201, 242, 140, 0.12);
      }

      .visualContent h1 {
        max-width: 650px;
        margin: 24px 0 0;
        font-size: clamp(49px, 5.1vw, 78px);
        line-height: 0.98;
        letter-spacing: -0.07em;
      }

      .visualContent > p {
        max-width: 570px;
        margin: 25px 0 0;
        color: rgba(255, 255, 255, 0.68);
        font-size: 16px;
        line-height: 1.72;
      }

      .visualBenefits {
        display: grid;
        gap: 11px;
        margin-top: 35px;
      }

      .visualBenefits > div {
        display: flex;
        align-items: center;
        gap: 13px;
      }

      .visualBenefits > div > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        border: 1px solid rgba(255, 255, 255, 0.17);
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.09);
        color: #c9f28c;
      }

      .visualBenefits strong,
      .visualBenefits small {
        display: block;
      }

      .visualBenefits strong {
        font-size: 13px;
      }

      .visualBenefits small {
        margin-top: 3px;
        color: rgba(255, 255, 255, 0.52);
        font-size: 11px;
      }

      .visualBottom {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.13);
        color: rgba(255, 255, 255, 0.46);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .signupFormSection {
        min-width: 0;
        padding: 60px 30px 90px;
      }

      .signupFormContainer {
        width: min(760px, 100%);
        margin-inline: auto;
      }

      .mobileBack {
        display: none;
      }

      .formHeader {
        margin-bottom: 31px;
      }

      .formKicker {
        display: block;
        margin-bottom: 12px;
        color: #769553;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .formHeader h2 {
        margin: 0;
        font-size: clamp(38px, 4vw, 52px);
        line-height: 1.02;
        letter-spacing: -0.06em;
      }

      .formHeader p {
        max-width: 590px;
        margin: 15px 0 0;
        color: #748077;
        font-size: 14px;
        line-height: 1.65;
      }

      .roleSwitch {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 27px;
      }

      .roleSwitch > button {
        position: relative;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 13px;
        min-height: 83px;
        padding: 14px;
        border: 1px solid #d9e0d7;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.68);
        color: #26372e;
        cursor: pointer;
        text-align: left;
        transition: 0.2s ease;
      }

      .roleSwitch > button:hover {
        border-color: #aab9a0;
        transform: translateY(-2px);
      }

      .roleSwitch > button.active {
        border-color: #183a27;
        background: #183a27;
        color: white;
        box-shadow: 0 14px 35px rgba(24, 58, 39, 0.17);
      }

      .roleSwitchIcon {
        display: grid;
        place-items: center;
        width: 47px;
        height: 47px;
        border-radius: 15px;
        background: #e9f2de;
        color: #527135;
      }

      .roleSwitch > button.active .roleSwitchIcon {
        background: rgba(201, 242, 140, 0.14);
        color: #c9f28c;
      }

      .roleSwitchText strong,
      .roleSwitchText small {
        display: block;
      }

      .roleSwitchText strong {
        font-size: 13px;
      }

      .roleSwitchText small {
        margin-top: 4px;
        color: #879189;
        font-size: 11px;
      }

      .roleSwitch > button.active .roleSwitchText small {
        color: rgba(255, 255, 255, 0.55);
      }

      .roleCheck {
        display: grid;
        place-items: center;
        width: 23px;
        height: 23px;
        border: 1px solid #d5ddd2;
        border-radius: 50%;
        color: transparent;
      }

      .roleSwitch > button.active .roleCheck {
        border-color: #c9f28c;
        background: #c9f28c;
        color: #183a27;
      }

      .signupForm {
        display: grid;
        gap: 18px;
      }

      .formSection {
        padding: 27px;
        border: 1px solid #dce2da;
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.76);
        box-shadow: 0 13px 36px rgba(34, 53, 42, 0.055);
        backdrop-filter: blur(14px);
      }

      .hostDetailsSection {
        border-color: #cfddc4;
        background:
          linear-gradient(
            145deg,
            rgba(238, 247, 228, 0.95),
            rgba(255, 255, 255, 0.84)
          );
      }

      .formSectionHeading {
        display: flex;
        align-items: center;
        gap: 13px;
        margin-bottom: 24px;
      }

      .formSectionHeading > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: #e8f1dd;
        color: #58743e;
        font-size: 11px;
        font-weight: 900;
      }

      .formSectionHeading strong,
      .formSectionHeading small {
        display: block;
      }

      .formSectionHeading strong {
        font-size: 15px;
      }

      .formSectionHeading small {
        margin-top: 4px;
        color: #859087;
        font-size: 11px;
      }

      .formGrid,
      .uploadGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 17px;
      }

      .formGrid + .inputGroup {
        margin-top: 17px;
      }

      .inputGroup {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      .inputGroup > span {
        color: #46554c;
        font-size: 11px;
        font-weight: 800;
      }

      .inputWrapper {
        display: flex;
        align-items: center;
        gap: 11px;
        min-height: 54px;
        padding: 0 15px;
        border: 1px solid #d8dfd6;
        border-radius: 15px;
        background: #fbfcf9;
        color: #7b877f;
        transition: 0.18s ease;
      }

      .inputWrapper:focus-within {
        border-color: #779656;
        background: white;
        box-shadow: 0 0 0 4px rgba(119, 150, 86, 0.11);
      }

      .inputWrapper input {
        width: 100%;
        min-width: 0;
        min-height: 52px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #192a21;
        font-size: 13px;
      }

      .inputWrapper input::placeholder,
      .inputGroup textarea::placeholder {
        color: #a2aba4;
      }

      .passwordToggle {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 33px;
        height: 33px;
        padding: 0;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: #78847c;
        cursor: pointer;
      }

      .passwordToggle:hover {
        background: #edf1eb;
        color: #32493a;
      }

      .usernameInput {
        gap: 5px;
      }

      .atSymbol {
        color: #587040;
        font-size: 14px;
        font-weight: 900;
      }

      .inputGroup textarea {
        width: 100%;
        min-height: 128px;
        padding: 15px;
        resize: vertical;
        border: 1px solid #d8dfd6;
        border-radius: 15px;
        outline: 0;
        background: #fbfcf9;
        color: #192a21;
        font-size: 13px;
        line-height: 1.65;
        transition: 0.18s ease;
      }

      .inputGroup textarea:focus {
        border-color: #779656;
        background: white;
        box-shadow: 0 0 0 4px rgba(119, 150, 86, 0.11);
      }

      .fieldHint {
        color: #939c95;
        font-size: 10px;
      }

      .fileUpload {
        position: relative;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 13px;
        min-height: 87px;
        padding: 13px;
        overflow: hidden;
        border: 1px dashed #bac5b6;
        border-radius: 18px;
        background: #fafbf8;
        cursor: pointer;
        transition: 0.2s ease;
      }

      .fileUpload:hover {
        border-color: #789a55;
        background: #f4f8ef;
      }

      .fileUpload.hasFile {
        border-style: solid;
        border-color: #9db68a;
        background: #f1f7ea;
      }

      .fileUpload > input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .fileIcon,
      .filePreview {
        width: 55px;
        height: 55px;
        border-radius: 15px;
      }

      .fileIcon {
        display: grid;
        place-items: center;
        background: #e8f1dd;
        color: #58733f;
      }

      .filePreview {
        object-fit: cover;
      }

      .fileText {
        min-width: 0;
      }

      .fileText strong,
      .fileText small {
        display: block;
      }

      .fileText strong {
        overflow: hidden;
        color: #304037;
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .fileText small {
        margin-top: 5px;
        color: #8a948d;
        font-size: 10px;
      }

      .fileAction {
        display: grid;
        place-items: center;
        width: 33px;
        height: 33px;
        border-radius: 10px;
        background: white;
        color: #648347;
        box-shadow: 0 5px 14px rgba(34, 54, 42, 0.08);
      }

      .activityChips {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
      }

      .activityChips button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 39px;
        padding: 0 13px;
        border: 1px solid #d5ddd3;
        border-radius: 999px;
        background: #fafbf8;
        color: #637068;
        cursor: pointer;
        font-size: 11px;
        font-weight: 750;
        transition: 0.18s ease;
      }

      .activityChips button:hover {
        border-color: #93a687;
        color: #33493a;
      }

      .activityChips button.selected {
        border-color: #183a27;
        background: #183a27;
        color: #c9f28c;
        box-shadow: 0 8px 20px rgba(24, 58, 39, 0.12);
      }

      .selectedCount {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 17px;
        color: #7d8981;
        font-size: 10px;
      }

      .selectedCount span {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: #e8f1dd;
        color: #527039;
        font-size: 11px;
        font-weight: 900;
      }

      .signupError {
        display: flex;
        align-items: flex-start;
        gap: 11px;
        padding: 15px;
        border: 1px solid #f0c8c3;
        border-radius: 16px;
        background: #fff2f0;
        color: #9a3c31;
      }

      .signupError > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 28px;
        height: 28px;
        border-radius: 9px;
        background: #f7d8d4;
      }

      .signupError p {
        margin: 4px 0 0;
        font-size: 12px;
        line-height: 1.5;
      }

      .submitButton {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        width: 100%;
        min-height: 60px;
        padding: 0 22px;
        border: 0;
        border-radius: 17px;
        background: #183a27;
        color: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 900;
        box-shadow: 0 16px 35px rgba(24, 58, 39, 0.19);
        transition: 0.2s ease;
      }

      .submitButton:hover:not(:disabled) {
        gap: 16px;
        transform: translateY(-2px);
        background: #214c34;
      }

      .submitButton:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .buttonLoader {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.28);
        border-top-color: white;
        border-radius: 50%;
        animation: signupSpin 0.8s linear infinite;
      }

      @keyframes signupSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .termsText {
        max-width: 570px;
        margin: -5px auto 0;
        color: #909991;
        font-size: 10px;
        line-height: 1.55;
        text-align: center;
      }

      .loginPrompt {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin: 28px 0 0;
        color: #78847c;
        font-size: 12px;
      }

      .loginPrompt a {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #385640;
        font-weight: 900;
      }

      @media (max-width: 1050px) {
        .signupPage {
          grid-template-columns: 390px minmax(0, 1fr);
        }

        .signupVisual {
          padding: 30px;
        }

        .visualContent h1 {
          font-size: 52px;
        }

        .signupFormSection {
          padding-inline: 25px;
        }
      }

      @media (max-width: 850px) {
        .signupPage {
          display: block;
        }

        .signupVisual {
          position: relative;
          min-height: 590px;
          height: auto;
          padding: 28px;
        }

        .visualContent {
          max-width: 650px;
          padding-top: 130px;
        }

        .visualContent h1 {
          max-width: 620px;
          font-size: clamp(48px, 9vw, 67px);
        }

        .visualBenefits {
          grid-template-columns: repeat(3, 1fr);
        }

        .visualBenefits > div {
          align-items: flex-start;
        }

        .signupFormSection {
          padding: 65px 24px 85px;
        }

        .mobileBack {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 30px;
          color: #65736a;
          font-size: 11px;
          font-weight: 800;
        }
      }

      @media (max-width: 650px) {
        .signupVisual {
          min-height: 600px;
        }

        .visualContent {
          padding-bottom: 30px;
        }

        .visualContent h1 {
          font-size: 49px;
        }

        .visualBenefits {
          grid-template-columns: 1fr;
        }

        .visualBottom {
          display: none;
        }

        .formHeader h2 {
          font-size: 40px;
        }

        .roleSwitch,
        .formGrid,
        .uploadGrid {
          grid-template-columns: 1fr;
        }

        .roleSwitch > button {
          min-height: 75px;
        }

        .formSection {
          padding: 21px;
          border-radius: 21px;
        }
      }

      @media (max-width: 430px) {
        .signupVisual {
          min-height: 560px;
          padding: 22px;
        }

        .signupLogo {
          font-size: 15px;
        }

        .visualContent h1 {
          font-size: 43px;
        }

        .visualContent > p {
          font-size: 14px;
        }

        .signupFormSection {
          padding: 50px 16px 70px;
        }

        .formHeader h2 {
          font-size: 36px;
        }

        .formSection {
          padding: 18px;
        }

        .formSectionHeading {
          align-items: flex-start;
        }

        .fileUpload {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .fileAction {
          display: none;
        }

        .loginPrompt {
          flex-wrap: wrap;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation: none !important;
          scroll-behavior: auto !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}