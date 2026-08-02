import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
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

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=MeetOutdoors";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85";

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  fill = "none",
  className = "",
}) {
  const icons = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    building: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M16 9h2a2 2 0 0 1 2 2v10" />
        <path d="M8 7h4M8 11h4M8 15h4" />
        <path d="M9 21v-3h2v3" />
      </>
    ),

    at: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" />
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

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),

    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    ),

    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle
          cx="17.5"
          cy="6.5"
          r="0.8"
          fill="currentColor"
          stroke="none"
        />
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

    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),

    save: (
      <>
        <path d="M5 3h12l2 2v16H5Z" />
        <path d="M8 3v6h8V3" />
        <path d="M8 21v-7h8v7" />
      </>
    ),

    activity: (
      <>
        <path d="m3 20 7-12 4 7 2-3 5 8" />
        <path d="M3 20h18" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),

    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 15H6L5 6" />
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

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  required = false,
  hint,
  autoComplete,
}) {
  return (
    <label className="editField">
      <span className="editFieldLabel">
        {label}
        {required && <strong>*</strong>}
      </span>

      <span className="editInputWrapper">
        {icon && (
          <span className="editInputIcon">
            <Icon name={icon} size={17} />
          </span>
        )}

        <input
          name={name}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(name, event.target.value)
          }
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
      </span>

      {hint && (
        <small className="fieldHint">
          {hint}
        </small>
      )}
    </label>
  );
}

function UploadField({
  title,
  description,
  accept,
  file,
  onChange,
  onClear,
  icon = "upload",
}) {
  return (
    <div className="uploadField">
      <div className="uploadFieldHeader">
        <span className="uploadFieldIcon">
          <Icon name={icon} size={20} />
        </span>

        <div>
          <strong>{title}</strong>
          <small>{description}</small>
        </div>
      </div>

      <label
        className={
          file
            ? "uploadDropzone selected"
            : "uploadDropzone"
        }
      >
        <input
          type="file"
          accept={accept}
          onChange={(event) =>
            onChange(
              event.target.files?.[0] || null
            )
          }
        />

        <span className="uploadCircle">
          <Icon
            name={file ? "check" : "upload"}
            size={19}
          />
        </span>

        <span className="uploadCopy">
          <strong>
            {file
              ? file.name
              : "Izaberi novi fajl"}
          </strong>

          <small>
            {file
              ? `${(
                  file.size /
                  1024 /
                  1024
                ).toFixed(2)} MB`
              : "Klikni ovde da izabereš fajl sa uređaja."}
          </small>
        </span>
      </label>

      {file && (
        <button
          type="button"
          className="removeUpload"
          onClick={onClear}
        >
          <Icon name="trash" size={14} />
          Ukloni izabrani fajl
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <EditProfileStyles />

      <main className="editProfileStatePage">
        <div className="editProfileStateCard">
          <span className="editProfileLoader" />
          <h1>Učitavanje profila</h1>
          <p>
            Pripremamo tvoje podatke za uređivanje.
          </p>
        </div>
      </main>
    </>
  );
}

export default function EditProfile() {
  const navigate = useNavigate();
  const {
    profile,
    loading: authLoading,
    reloadAuth,
  } = useAuth();

  const [userId, setUserId] = useState(null);
  const [pageLoading, setPageLoading] =
    useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [avatarFile, setAvatarFile] =
    useState(null);
  const [coverFile, setCoverFile] =
    useState(null);
  const [videoFile, setVideoFile] =
    useState(null);

  const [form, setForm] = useState({
    role: "user",
    full_name: "",
    username: "",
    city: "",
    country: "",
    avatar_url: "",
    cover_url: "",
    bio: "",
    phone: "",
    instagram_url: "",
    website_url: "",
    promo_video_url: "",
    activities: [],
  });

  const loadProfileFromContext =
    useCallback(() => {
      if (authLoading) return;

      if (!profile?.id) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setUserId(profile.id);

      setForm({
        role: profile.role || "user",
        full_name: profile.full_name || "",
        username: profile.username || "",
        city: profile.city || "",
        country: profile.country || "",
        avatar_url: profile.avatar_url || "",
        cover_url: profile.cover_url || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        instagram_url:
          profile.instagram_url || "",
        website_url:
          profile.website_url || "",
        promo_video_url:
          profile.promo_video_url || "",
        activities: Array.isArray(
          profile.activities
        )
          ? profile.activities
          : [],
      });

      setPageLoading(false);
    }, [authLoading, navigate, profile]);

  useEffect(() => {
    loadProfileFromContext();
  }, [loadProfileFromContext]);

  const avatarPreview = useMemo(() => {
    if (!avatarFile) {
      return form.avatar_url || FALLBACK_AVATAR;
    }

    return URL.createObjectURL(avatarFile);
  }, [avatarFile, form.avatar_url]);

  const coverPreview = useMemo(() => {
    if (!coverFile) {
      return form.cover_url || FALLBACK_COVER;
    }

    return URL.createObjectURL(coverFile);
  }, [coverFile, form.cover_url]);

  useEffect(() => {
    if (
      !avatarFile ||
      !avatarPreview.startsWith("blob:")
    ) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarFile, avatarPreview]);

  useEffect(() => {
    if (
      !coverFile ||
      !coverPreview.startsWith("blob:")
    ) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(coverPreview);
    };
  }, [coverFile, coverPreview]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function toggleActivity(activity) {
    setForm((current) => {
      const currentActivities =
        Array.isArray(current.activities)
          ? current.activities
          : [];

      const exists =
        currentActivities.includes(activity);

      return {
        ...current,
        activities: exists
          ? currentActivities.filter(
              (item) => item !== activity
            )
          : [...currentActivities, activity],
      };
    });
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!userId || saving) return;

    setSaving(true);
    setError("");

    try {
      const cleanUsername = form.username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      if (!cleanUsername) {
        throw new Error(
          "Korisničko ime je obavezno."
        );
      }

      if (cleanUsername.length < 3) {
        throw new Error(
          "Korisničko ime mora imati najmanje 3 karaktera."
        );
      }

      const {
        data: existingUsername,
        error: usernameError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .neq("id", userId)
        .maybeSingle();

      if (usernameError) {
        throw usernameError;
      }

      if (existingUsername) {
        throw new Error(
          "Ovo korisničko ime je već zauzeto."
        );
      }

      const avatarUrl = avatarFile
        ? await uploadProfileFile({
            bucket: "avatars",
            userId,
            file: avatarFile,
            folder: "avatar",
          })
        : form.avatar_url;

      const coverUrl = coverFile
        ? await uploadProfileFile({
            bucket: "covers",
            userId,
            file: coverFile,
            folder: "cover",
          })
        : form.cover_url;

      const uploadedVideoUrl = videoFile
        ? await uploadProfileFile({
            bucket: "profile-videos",
            userId,
            file: videoFile,
            folder: "video",
          })
        : "";

      const isHost = form.role === "host";

      const updatePayload = {
        full_name: form.full_name.trim(),
        username: cleanUsername,
        city: form.city.trim(),
        country: form.country.trim(),
        bio: form.bio.trim(),
        activities: form.activities,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      };

      if (isHost) {
        updatePayload.phone =
          form.phone.trim();
        updatePayload.instagram_url =
          form.instagram_url.trim();
        updatePayload.website_url =
          form.website_url.trim();
        updatePayload.promo_video_url =
          uploadedVideoUrl ||
          form.promo_video_url.trim();
      }

      const { error: updateError } =
        await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      await reloadAuth();

      navigate(
        isHost
          ? `/h/${cleanUsername}`
          : `/u/${cleanUsername}`,
        {
          replace: true,
        }
      );
    } catch (saveError) {
      console.error(
        "Greška pri čuvanju profila:",
        saveError
      );

      setError(
        saveError?.message ||
          "Greška pri čuvanju profila."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    const username =
      profile?.username || form.username;

    if (username) {
      navigate(
        form.role === "host"
          ? `/h/${username}`
          : `/u/${username}`
      );
      return;
    }

    navigate("/");
  }

  if (authLoading || pageLoading) {
    return <LoadingState />;
  }

  const isHost = form.role === "host";

  const displayName =
    form.full_name ||
    form.username ||
    (isHost
      ? "Outdoor domaćin"
      : "MeetOutdoors korisnik");

  const profileLocation =
    [form.city, form.country]
      .filter(Boolean)
      .join(", ") ||
    "Lokacija nije dodata";

  return (
    <>
      <EditProfileStyles />

      <main className="editProfilePage">
        <div className="editProfileShell">
          <aside className="profilePreview">
            <div className="previewCover">
              <img
                src={coverPreview}
                alt=""
                className="previewCoverImage"
              />

              <div className="previewCoverOverlay" />

              <span className="previewRoleBadge">
                <Icon
                  name={
                    isHost
                      ? "shield"
                      : "user"
                  }
                  size={15}
                />

                {isHost
                  ? "Profil domaćina"
                  : "Korisnički profil"}
              </span>
            </div>

            <div className="previewContent">
              <img
                src={avatarPreview}
                alt={displayName}
                className="previewAvatar"
              />

              <span className="previewKicker">
                Pregled profila
              </span>

              <h2>{displayName}</h2>

              <p className="previewUsername">
                @{form.username || "username"}
              </p>

              <p className="previewLocation">
                <Icon name="mapPin" size={15} />
                {profileLocation}
              </p>

              <p className="previewBio">
                {form.bio ||
                  "Tvoj opis će se prikazati ovde dok uređuješ profil."}
              </p>

              <div className="previewActivities">
                {form.activities.length > 0 ? (
                  form.activities
                    .slice(0, 5)
                    .map((activity) => (
                      <span key={activity}>
                        {activity}
                      </span>
                    ))
                ) : (
                  <span>
                    Izaberi aktivnosti
                  </span>
                )}

                {form.activities.length > 5 && (
                  <span>
                    +
                    {form.activities.length - 5}
                  </span>
                )}
              </div>

              <div className="previewNotice">
                <span>
                  <Icon name="info" size={17} />
                </span>

                <p>
                  Ovo je približan pregled.
                  Pravi javni profil može
                  sadržati dodatne sekcije i
                  podatke.
                </p>
              </div>
            </div>
          </aside>

          <section className="editProfileContent">
            <div className="editProfileHeader">
              <div>
                <span className="editKicker">
                  Podešavanja profila
                </span>

                <h1>Uredi svoj profil.</h1>

                <p>
                  Ažuriraj osnovne podatke,
                  fotografije, aktivnosti i
                  javne kontakt informacije.
                </p>
              </div>

              <span className="accountType">
                <Icon
                  name={
                    isHost
                      ? "building"
                      : "user"
                  }
                  size={17}
                />

                {isHost
                  ? "Host nalog"
                  : "Korisnički nalog"}
              </span>
            </div>

            <form
              onSubmit={saveProfile}
              className="editProfileForm"
            >
              <section className="formSection">
                <div className="formSectionHeading">
                  <span>
                    <Icon
                      name="user"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Osnovni podaci
                    </small>
                    <h2>
                      Identitet profila
                    </h2>
                    <p>
                      Ovi podaci biće
                      vidljivi drugim
                      korisnicima na tvom
                      javnom profilu.
                    </p>
                  </div>
                </div>

                <div className="editFieldsGrid">
                  <FormField
                    label={
                      isHost
                        ? "Naziv organizatora"
                        : "Ime i prezime"
                    }
                    name="full_name"
                    value={form.full_name}
                    onChange={updateField}
                    placeholder={
                      isHost
                        ? "Na primer: Tara Adventure"
                        : "Unesi ime i prezime"
                    }
                    icon={
                      isHost
                        ? "building"
                        : "user"
                    }
                    autoComplete="name"
                  />

                  <FormField
                    label="Korisničko ime"
                    name="username"
                    value={form.username}
                    onChange={updateField}
                    placeholder="username"
                    icon="at"
                    required
                    autoComplete="username"
                    hint="Dozvoljena su mala slova, brojevi i donja crta."
                  />

                  <FormField
                    label="Grad"
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    placeholder="Na primer: Beograd"
                    icon="mapPin"
                    autoComplete="address-level2"
                  />

                  <FormField
                    label="Država"
                    name="country"
                    value={form.country}
                    onChange={updateField}
                    placeholder="Na primer: Srbija"
                    icon="globe"
                    autoComplete="country-name"
                  />
                </div>

                <label className="editField fullWidthField">
                  <span className="editFieldLabel">
                    Biografija
                  </span>

                  <span className="editTextareaWrapper">
                    <span className="editTextareaIcon">
                      <Icon
                        name="edit"
                        size={17}
                      />
                    </span>

                    <textarea
                      rows={6}
                      maxLength={1000}
                      value={form.bio}
                      onChange={(event) =>
                        updateField(
                          "bio",
                          event.target.value
                        )
                      }
                      placeholder={
                        isHost
                          ? "Predstavi svoje iskustvo, način organizacije i avanture koje nudiš..."
                          : "Napiši nešto o sebi i aktivnostima koje voliš..."
                      }
                    />
                  </span>

                  <span className="characterCount">
                    {form.bio.length}/1000
                  </span>
                </label>
              </section>

              <section className="formSection">
                <div className="formSectionHeading">
                  <span>
                    <Icon
                      name="image"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Vizuelni identitet
                    </small>
                    <h2>
                      Fotografije profila
                    </h2>
                    <p>
                      Nova fotografija biće
                      postavljena tek kada
                      sačuvaš promene.
                    </p>
                  </div>
                </div>

                <div className="uploadGrid">
                  <UploadField
                    title={
                      isHost
                        ? "Avatar ili logo"
                        : "Profilna fotografija"
                    }
                    description="Preporučeni format JPG, PNG ili WEBP."
                    accept="image/*"
                    file={avatarFile}
                    onChange={setAvatarFile}
                    onClear={() =>
                      setAvatarFile(null)
                    }
                    icon="user"
                  />

                  <UploadField
                    title="Naslovna fotografija"
                    description="Najbolje izgleda horizontalna fotografija."
                    accept="image/*"
                    file={coverFile}
                    onChange={setCoverFile}
                    onClear={() =>
                      setCoverFile(null)
                    }
                    icon="image"
                  />
                </div>
              </section>

              {isHost && (
                <section className="formSection hostFormSection">
                  <div className="formSectionHeading">
                    <span>
                      <Icon
                        name="building"
                        size={19}
                      />
                    </span>

                    <div>
                      <small>
                        Host informacije
                      </small>
                      <h2>
                        Kontakt i promocija
                      </h2>
                      <p>
                        Dodaj načine na koje
                        učesnici mogu da
                        saznaju više o tvojoj
                        organizaciji.
                      </p>
                    </div>
                  </div>

                  <div className="editFieldsGrid">
                    <FormField
                      label="Telefon"
                      name="phone"
                      value={form.phone}
                      onChange={updateField}
                      placeholder="+381 60 123 4567"
                      icon="phone"
                      type="tel"
                      autoComplete="tel"
                    />

                    <FormField
                      label="Instagram URL"
                      name="instagram_url"
                      value={
                        form.instagram_url
                      }
                      onChange={updateField}
                      placeholder="https://instagram.com/..."
                      icon="instagram"
                      type="url"
                    />

                    <FormField
                      label="Web-sajt"
                      name="website_url"
                      value={
                        form.website_url
                      }
                      onChange={updateField}
                      placeholder="https://tvoj-sajt.com"
                      icon="globe"
                      type="url"
                    />

                    <FormField
                      label="Link promo videa"
                      name="promo_video_url"
                      value={
                        form.promo_video_url
                      }
                      onChange={updateField}
                      placeholder="YouTube, Vimeo ili direktan link"
                      icon="video"
                      type="url"
                    />
                  </div>

                  <div className="singleUpload">
                    <UploadField
                      title="Novi promo video"
                      description="Izabrani video će zameniti trenutni video link nakon čuvanja."
                      accept="video/*"
                      file={videoFile}
                      onChange={setVideoFile}
                      onClear={() =>
                        setVideoFile(null)
                      }
                      icon="video"
                    />
                  </div>
                </section>
              )}

              <section className="formSection">
                <div className="formSectionHeading">
                  <span>
                    <Icon
                      name="activity"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Interesovanja
                    </small>
                    <h2>
                      Outdoor aktivnosti
                    </h2>
                    <p>
                      Izaberi aktivnosti koje
                      voliš ili koje
                      organizuješ.
                    </p>
                  </div>
                </div>

                <div className="activityGrid">
                  {ACTIVITIES.map(
                    (activity) => {
                      const selected =
                        form.activities.includes(
                          activity
                        );

                      return (
                        <button
                          key={activity}
                          type="button"
                          className={
                            selected
                              ? "activityButton selected"
                              : "activityButton"
                          }
                          onClick={() =>
                            toggleActivity(
                              activity
                            )
                          }
                          aria-pressed={
                            selected
                          }
                        >
                          <span className="activityCheck">
                            {selected && (
                              <Icon
                                name="check"
                                size={14}
                              />
                            )}
                          </span>

                          {activity}
                        </button>
                      );
                    }
                  )}
                </div>

                <p className="selectedActivitiesCount">
                  Izabrano aktivnosti:{" "}
                  <strong>
                    {
                      form.activities
                        .length
                    }
                  </strong>
                </p>
              </section>

              {error && (
                <div
                  className="editProfileError"
                  role="alert"
                >
                  <span>
                    <Icon
                      name="alert"
                      size={18}
                    />
                  </span>

                  <p>{error}</p>

                  <button
                    type="button"
                    onClick={() =>
                      setError("")
                    }
                    aria-label="Zatvori poruku"
                  >
                    <Icon
                      name="close"
                      size={16}
                    />
                  </button>
                </div>
              )}

              <div className="formActions">
                <button
                  type="button"
                  className="cancelButton"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Otkaži
                </button>

                <button
                  type="submit"
                  className="saveButton"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="buttonLoader" />
                      Čuvanje profila...
                    </>
                  ) : (
                    <>
                      <Icon
                        name="save"
                        size={17}
                      />
                      Sačuvaj promene
                    </>
                  )}
                </button>
              </div>

              <div className="securityNotice">
                <span>
                  <Icon
                    name="shield"
                    size={18}
                  />
                </span>

                <p>
                  Promena korisničkog imena
                  menja i adresu tvog javnog
                  profila.
                </p>
              </div>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

function EditProfileStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f1f3ec;
      }

      button,
      input,
      textarea,
      select {
        font: inherit;
      }

      button,
      a,
      label {
        -webkit-tap-highlight-color: transparent;
      }

      .editProfilePage,
      .editProfileStatePage {
        min-height: 100vh;
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

      .editProfilePage {
        padding: 118px 28px 70px;
        background:
          radial-gradient(
            circle at 5% 0%,
            rgba(169, 203, 131, 0.17),
            transparent 25%
          ),
          radial-gradient(
            circle at 97% 30%,
            rgba(85, 129, 91, 0.1),
            transparent 24%
          ),
          #f1f3ec;
      }

      .editProfilePage a,
      .editProfileStatePage a {
        color: inherit;
        text-decoration: none;
      }

      .editProfileShell {
        width: min(1280px, 100%);
        min-height:
          calc(100vh - 188px);
        display: grid;
        grid-template-columns:
          minmax(330px, 0.72fr)
          minmax(0, 1.28fr);
        margin: 0 auto;
        overflow: hidden;
        border:
          1px solid rgba(34, 55, 43, 0.1);
        border-radius: 34px;
        background:
          rgba(255, 255, 255, 0.8);
        box-shadow:
          0 28px 85px rgba(27, 49, 35, 0.11);
      }

      .profilePreview {
        position: relative;
        min-width: 0;
        background: #102b1c;
        color: white;
      }

      .previewCover {
        position: relative;
        height: 340px;
        overflow: hidden;
      }

      .previewCoverImage {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
      }

      .previewCoverOverlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(5, 17, 10, 0.27),
            rgba(5, 17, 10, 0.17) 32%,
            rgba(7, 24, 14, 0.92)
          );
      }

      .previewRoleBadge {
        position: absolute;
        top: 22px;
        right: 22px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 40px;
        padding: 0 12px;
        border:
          1px solid rgba(255, 255, 255, 0.18);
        border-radius: 13px;
        background:
          rgba(255, 255, 255, 0.1);
        color: #d8f7aa;
        font-size: 9px;
        font-weight: 850;
        backdrop-filter: blur(13px);
      }

      .previewContent {
        position: relative;
        padding: 0 28px 35px;
      }

      .previewAvatar {
        width: 126px;
        height: 126px;
        display: block;
        margin-top: -63px;
        border: 5px solid #102b1c;
        border-radius: 31px;
        object-fit: cover;
        background: #e7eee2;
        box-shadow:
          0 17px 40px rgba(0, 0, 0, 0.27);
      }

      .previewKicker {
        display: block;
        margin-top: 20px;
        color: #c9f28c;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .previewContent h2 {
        margin: 9px 0 0;
        color: white;
        font-size:
          clamp(31px, 4vw, 46px);
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .previewUsername {
        margin: 8px 0 0;
        color:
          rgba(255, 255, 255, 0.52);
        font-size: 11px;
        font-weight: 750;
      }

      .previewLocation {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 18px 0 0;
        color:
          rgba(255, 255, 255, 0.7);
        font-size: 10px;
        font-weight: 750;
      }

      .previewLocation svg {
        color: #c9f28c;
      }

      .previewBio {
        margin: 18px 0 0;
        color:
          rgba(255, 255, 255, 0.62);
        font-size: 11px;
        line-height: 1.72;
        white-space: pre-line;
      }

      .previewActivities {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 19px;
      }

      .previewActivities span {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border:
          1px solid rgba(255, 255, 255, 0.13);
        border-radius: 999px;
        background:
          rgba(255, 255, 255, 0.07);
        color:
          rgba(255, 255, 255, 0.74);
        font-size: 8px;
        font-weight: 800;
      }

      .previewNotice {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 26px;
        padding: 14px;
        border:
          1px solid rgba(201, 242, 140, 0.15);
        border-radius: 16px;
        background:
          rgba(201, 242, 140, 0.07);
      }

      .previewNotice > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        border-radius: 11px;
        background:
          rgba(201, 242, 140, 0.1);
        color: #c9f28c;
      }

      .previewNotice p {
        margin: 0;
        color:
          rgba(255, 255, 255, 0.53);
        font-size: 9px;
        line-height: 1.6;
      }

      .editProfileContent {
        min-width: 0;
        padding: 39px;
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(186, 211, 155, 0.11),
            transparent 26%
          ),
          #fafbf7;
      }

      .editProfileHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 25px;
        margin-bottom: 30px;
      }

      .editKicker {
        display: block;
        color: #779556;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .editProfileHeader h1 {
        margin: 10px 0 0;
        color: #20342a;
        font-size:
          clamp(42px, 5vw, 64px);
        line-height: 0.94;
        letter-spacing: -0.07em;
      }

      .editProfileHeader p {
        max-width: 620px;
        margin: 17px 0 0;
        color: #7b877f;
        font-size: 12px;
        line-height: 1.65;
      }

      .accountType {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 39px;
        padding: 0 12px;
        border: 1px solid #d7e1d2;
        border-radius: 12px;
        background: #f1f6eb;
        color: #597244;
        font-size: 9px;
        font-weight: 850;
      }

      .editProfileForm {
        display: grid;
        gap: 20px;
      }

      .formSection {
        padding: 25px;
        border: 1px solid #dce4d9;
        border-radius: 25px;
        background:
          rgba(255, 255, 255, 0.79);
        box-shadow:
          0 12px 34px rgba(31, 51, 38, 0.045);
      }

      .hostFormSection {
        background:
          linear-gradient(
            145deg,
            rgba(239, 246, 232, 0.92),
            rgba(255, 255, 255, 0.8)
          );
      }

      .formSectionHeading {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        margin-bottom: 23px;
      }

      .formSectionHeading > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 43px;
        height: 43px;
        border-radius: 14px;
        background: #e7f0dc;
        color: #5d7a43;
      }

      .formSectionHeading small {
        display: block;
        color: #7f9d5c;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .formSectionHeading h2 {
        margin: 6px 0 0;
        color: #2b4033;
        font-size: 22px;
        line-height: 1.05;
        letter-spacing: -0.04em;
      }

      .formSectionHeading p {
        margin: 7px 0 0;
        color: #89938c;
        font-size: 9px;
        line-height: 1.55;
      }

      .editFieldsGrid,
      .uploadGrid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 15px;
      }

      .editField {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      .fullWidthField {
        position: relative;
        margin-top: 15px;
      }

      .editFieldLabel {
        color: #495c50;
        font-size: 9px;
        font-weight: 850;
      }

      .editFieldLabel strong {
        margin-left: 3px;
        color: #9e453c;
      }

      .editInputWrapper,
      .editTextareaWrapper {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .editInputIcon,
      .editTextareaIcon {
        position: absolute;
        left: 14px;
        z-index: 1;
        display: grid;
        place-items: center;
        color: #829078;
        pointer-events: none;
      }

      .editTextareaIcon {
        top: 15px;
      }

      .editInputWrapper input,
      .editTextareaWrapper textarea {
        width: 100%;
        border: 1px solid #d9e1d6;
        outline: none;
        background: #f8faf6;
        color: #25382d;
        transition: 0.18s ease;
      }

      .editInputWrapper input {
        min-height: 51px;
        padding: 0 14px 0 43px;
        border-radius: 14px;
        font-size: 11px;
      }

      .editTextareaWrapper textarea {
        min-height: 135px;
        resize: vertical;
        padding: 14px 14px 14px 43px;
        border-radius: 15px;
        font-size: 11px;
        line-height: 1.65;
      }

      .editInputWrapper input:focus,
      .editTextareaWrapper textarea:focus {
        border-color: #86a36b;
        background: white;
        box-shadow:
          0 0 0 4px rgba(134, 163, 107, 0.1);
      }

      .editInputWrapper input::placeholder,
      .editTextareaWrapper textarea::placeholder {
        color: #a2aaa4;
      }

      .fieldHint {
        color: #959e97;
        font-size: 8px;
        line-height: 1.5;
      }

      .characterCount {
        position: absolute;
        right: 12px;
        bottom: 10px;
        padding: 4px 7px;
        border-radius: 8px;
        background:
          rgba(248, 250, 246, 0.88);
        color: #939d95;
        font-size: 7px;
      }

      .uploadField {
        display: grid;
        align-content: start;
        min-width: 0;
        padding: 15px;
        border: 1px solid #dce3d9;
        border-radius: 18px;
        background: #f9faf7;
      }

      .uploadFieldHeader {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 13px;
      }

      .uploadFieldIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 37px;
        height: 37px;
        border-radius: 11px;
        background: #e7f0dc;
        color: #5c7842;
      }

      .uploadFieldHeader strong,
      .uploadFieldHeader small {
        display: block;
      }

      .uploadFieldHeader strong {
        color: #405247;
        font-size: 10px;
      }

      .uploadFieldHeader small {
        margin-top: 4px;
        color: #919a93;
        font-size: 8px;
        line-height: 1.45;
      }

      .uploadDropzone {
        display: flex;
        align-items: center;
        gap: 11px;
        min-height: 89px;
        padding: 13px;
        border: 1px dashed #bdc9b8;
        border-radius: 15px;
        background: white;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .uploadDropzone:hover {
        border-color: #789a59;
        background: #fbfcf9;
      }

      .uploadDropzone.selected {
        border-style: solid;
        border-color: #96ad85;
        background: #f1f7eb;
      }

      .uploadDropzone input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .uploadCircle {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 43px;
        height: 43px;
        border-radius: 14px;
        background: #eaf2e1;
        color: #5d7844;
      }

      .selected .uploadCircle {
        background: #dceacd;
        color: #4c6c34;
      }

      .uploadCopy {
        min-width: 0;
      }

      .uploadCopy strong,
      .uploadCopy small {
        display: block;
      }

      .uploadCopy strong {
        overflow: hidden;
        color: #43564a;
        font-size: 9px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .uploadCopy small {
        margin-top: 5px;
        color: #929b94;
        font-size: 7px;
        line-height: 1.45;
      }

      .removeUpload {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        justify-self: start;
        margin-top: 10px;
        padding: 7px 9px;
        border: 0;
        border-radius: 9px;
        background: #fff0ee;
        color: #9a463c;
        cursor: pointer;
        font-size: 8px;
        font-weight: 800;
      }

      .singleUpload {
        max-width: 470px;
        margin-top: 15px;
      }

      .activityGrid {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 9px;
      }

      .activityButton {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 44px;
        padding: 0 12px;
        border: 1px solid #dce3d9;
        border-radius: 13px;
        background: #f8faf6;
        color: #53645a;
        cursor: pointer;
        font-size: 9px;
        font-weight: 800;
        text-align: left;
        transition: 0.17s ease;
      }

      .activityButton:hover {
        border-color: #98aa8e;
        background: white;
      }

      .activityButton.selected {
        border-color: #9cb580;
        background: #eaf3df;
        color: #3f5c2f;
      }

      .activityCheck {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 21px;
        height: 21px;
        border: 1px solid #ccd6c8;
        border-radius: 7px;
        background: white;
        color: #183a27;
      }

      .activityButton.selected
        .activityCheck {
        border-color: #c9f28c;
        background: #c9f28c;
      }

      .selectedActivitiesCount {
        margin: 13px 0 0;
        color: #8b958e;
        font-size: 8px;
      }

      .selectedActivitiesCount strong {
        color: #506943;
      }

      .editProfileError {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        padding: 14px;
        border: 1px solid #efc7c2;
        border-radius: 16px;
        background: #fff0ee;
        color: #963f35;
      }

      .editProfileError > span {
        display: grid;
        place-items: center;
        width: 33px;
        height: 33px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .editProfileError p {
        margin: 0;
        font-size: 10px;
        line-height: 1.5;
      }

      .editProfileError button {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }

      .formActions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 3px;
      }

      .cancelButton,
      .saveButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 14px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 900;
        transition: 0.18s ease;
      }

      .cancelButton {
        border: 1px solid #d6dfd3;
        background: white;
        color: #59685f;
      }

      .cancelButton:hover:not(:disabled) {
        border-color: #a3b09d;
      }

      .saveButton {
        min-width: 175px;
        border: 1px solid #183a27;
        background: #183a27;
        color: white;
        box-shadow:
          0 12px 27px rgba(24, 58, 39, 0.17);
      }

      .saveButton:hover:not(:disabled) {
        background: #234d35;
        transform: translateY(-2px);
      }

      .cancelButton:disabled,
      .saveButton:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .buttonLoader {
        width: 15px;
        height: 15px;
        border:
          2px solid rgba(255, 255, 255, 0.25);
        border-top-color: white;
        border-radius: 50%;
        animation:
          editProfileSpin 0.75s linear infinite;
      }

      .securityNotice {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #89938c;
        font-size: 8px;
        text-align: center;
      }

      .securityNotice svg {
        color: #779357;
      }

      .securityNotice p {
        margin: 0;
      }

      .editProfileStatePage {
        display: grid;
        place-items: center;
        padding: 118px 24px 24px;
        background:
          radial-gradient(
            circle at top left,
            rgba(166, 203, 126, 0.18),
            transparent 30%
          ),
          #f1f3ec;
      }

      .editProfileStateCard {
        display: grid;
        place-items: center;
        width: min(500px, 100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background:
          rgba(255, 255, 255, 0.82);
        text-align: center;
        box-shadow:
          0 20px 60px rgba(28, 48, 35, 0.08);
      }

      .editProfileLoader {
        width: 37px;
        height: 37px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          editProfileSpin 0.8s linear infinite;
      }

      @keyframes editProfileSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .editProfileStateCard h1 {
        margin: 18px 0 0;
        color: #24372c;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .editProfileStateCard p {
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
      }

      @media (max-width: 1100px) {
        .editProfileShell {
          grid-template-columns:
            minmax(300px, 0.65fr)
            minmax(0, 1.35fr);
        }

        .activityGrid {
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 880px) {
        .editProfilePage {
          padding:
            100px 18px 60px;
        }

        .editProfileShell {
          display: block;
          min-height: auto;
        }

        .profilePreview {
          min-height: auto;
        }

        .previewCover {
          height: 310px;
        }

        .previewContent {
          padding-bottom: 30px;
        }

        .previewBio,
        .previewActivities,
        .previewNotice {
          max-width: 650px;
        }
      }

      @media (max-width: 680px) {
        .editProfilePage {
          padding: 84px 0 64px;
        }

        .editProfileStatePage {
          padding-top: 84px;
        }

        .editProfileShell {
          border: 0;
          border-radius: 0;
        }

        .previewCover {
          height: 285px;
        }

        .editProfileContent {
          padding: 27px 20px 45px;
        }

        .editProfileHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .editFieldsGrid,
        .uploadGrid {
          grid-template-columns: 1fr;
        }

        .activityGrid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 460px) {
        .previewCover {
          height: 250px;
        }

        .previewRoleBadge {
          top: 16px;
          right: 16px;
          font-size: 8px;
        }

        .previewContent {
          padding-right: 19px;
          padding-left: 19px;
        }

        .previewAvatar {
          width: 105px;
          height: 105px;
          margin-top: -52px;
          border-radius: 26px;
        }

        .editProfileContent {
          padding: 24px 14px 40px;
        }

        .editProfileHeader h1 {
          font-size: 43px;
        }

        .formSection {
          padding: 19px;
          border-radius: 21px;
        }

        .formSectionHeading {
          align-items: flex-start;
        }

        .activityGrid {
          grid-template-columns: 1fr;
        }

        .formActions {
          align-items: stretch;
          flex-direction: column-reverse;
        }

        .cancelButton,
        .saveButton {
          width: 100%;
        }

        .securityNotice {
          align-items: flex-start;
          text-align: left;
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
