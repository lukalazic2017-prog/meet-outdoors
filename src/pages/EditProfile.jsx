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

const HOST_PURPOSES = [
  {
    value: "adventures",
    title: "Avanture",
    description: "Organizujem outdoor avanture i događaje.",
    icon: "activity",
  },
  {
    value: "accommodation",
    title: "Smeštaj",
    description: "Nudim smeštaj gostima i učesnicima.",
    icon: "building",
  },
  {
    value: "service",
    title: "Usluge",
    description: "Nudim vodiče, prevoz, instrukcije ili druge usluge.",
    icon: "shield",
  },
  {
    value: "rental",
    title: "Iznajmljivanje",
    description: "Iznajmljujem opremu, vozila ili outdoor rekvizite.",
    icon: "save",
  },
];

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=MeetOutdoors";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85";

async function geocodePublicLocation(value, country = "") {
  const cleanValue = String(value || "").trim();
  const cleanCountry = String(country || "").trim();

  if (!cleanValue) return null;

  const query = [cleanValue, cleanCountry]
    .filter(Boolean)
    .join(", ");

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    "accept-language": "sr,en",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Lokacija trenutno ne može da se proveri. Pokušaj ponovo."
    );
  }

  const results = await response.json();
  const match = Array.isArray(results) ? results[0] : null;

  if (!match?.lat || !match?.lon) {
    throw new Error(
      "Nismo pronašli ovu lokaciju. Unesi grad ili precizniju adresu."
    );
  }

  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon),
  };
}

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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
    public_location: "",
    avatar_url: "",
    cover_url: "",
    bio: "",
    phone: "",
    instagram_url: "",
    website_url: "",
    promo_video_url: "",
    activities: [],
    host_purposes: [],
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
        public_location: profile.public_location || "",
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
        host_purposes: Array.isArray(profile.host_purposes)
          ? profile.host_purposes
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

  function toggleHostPurpose(purpose) {
    setForm((current) => {
      const currentPurposes = Array.isArray(current.host_purposes)
        ? current.host_purposes
        : [];

      const exists = currentPurposes.includes(purpose);

      return {
        ...current,
        host_purposes: exists
          ? currentPurposes.filter((item) => item !== purpose)
          : [...currentPurposes, purpose],
      };
    });

    if (error) {
      setError("");
    }
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

      let publicLocationData = null;
      const cleanPublicLocation = form.public_location.trim();

      if (isHost && cleanPublicLocation) {
        const locationChanged =
          cleanPublicLocation !==
            String(profile?.public_location || "").trim() ||
          profile?.latitude == null ||
          profile?.longitude == null;

        publicLocationData = locationChanged
          ? await geocodePublicLocation(
              cleanPublicLocation,
              form.country
            )
          : {
              latitude: Number(profile.latitude),
              longitude: Number(profile.longitude),
            };
      }

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
        updatePayload.public_location =
          cleanPublicLocation || null;
        updatePayload.latitude =
          publicLocationData?.latitude ?? null;
        updatePayload.longitude =
          publicLocationData?.longitude ?? null;
        updatePayload.host_purposes = Array.isArray(form.host_purposes)
          ? form.host_purposes
          : [];
      }

      const { error: updateError } =
        await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      if (isHost) {
        const capabilityMap = {
          adventures: "adventure",
          accommodation: "accommodation",
          service: "service",
          rental: "rental",
        };

        const declaredCapabilities = (form.host_purposes || [])
          .map((purpose) => capabilityMap[purpose])
          .filter(Boolean);

        const serviceAreas = [
          form.city.trim(),
          form.country.trim(),
          cleanPublicLocation,
        ].filter(Boolean);

        const { error: capabilityError } = await supabase
          .from("host_agent_capabilities")
          .upsert(
            {
              host_id: userId,
              capabilities: declaredCapabilities,
              activities: form.activities,
              service_areas: [...new Set(serviceAreas)],
              accepts_custom_requests: true,
            },
            { onConflict: "host_id" }
          );

        if (capabilityError) {
          throw capabilityError;
        }
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

  async function handleDeleteAccount() {
    if (deletingAccount || deleteConfirmation !== "OBRIŠI") return;

    setDeletingAccount(true);
    setDeleteError("");

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke("delete-account", { body: {} });

      if (functionError) throw functionError;

      if (!data?.success) {
        throw new Error(data?.error || "Brisanje naloga nije uspelo.");
      }

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (signOutError) {
        console.warn("Lokalna odjava nakon brisanja naloga:", signOutError);
      }

      navigate("/", { replace: true });
    } catch (accountDeleteError) {
      console.error("Greška pri brisanju naloga:", accountDeleteError);
      setDeleteError(
        accountDeleteError?.message ||
          "Brisanje naloga nije uspelo. Pokušaj ponovo."
      );
    } finally {
      setDeletingAccount(false);
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
                <section className="formSection hostPurposeSection">
                  <div className="formSectionHeading">
                    <span>
                      <Icon name="activity" size={19} />
                    </span>

                    <div>
                      <small>Ponuda domaćina</small>
                      <h2>Šta nudiš?</h2>
                      <p>
                        Izaberi sve kategorije koje tvoj profil može da ponudi.
                        Na osnovu ovoga gradi se tvoj Host profil i Agent zna za
                        koje zahteve može da te pronađe.
                      </p>
                    </div>
                  </div>

                  <div className="hostPurposeGrid">
                    {HOST_PURPOSES.map((purpose) => {
                      const selected = form.host_purposes.includes(purpose.value);

                      return (
                        <button
                          key={purpose.value}
                          type="button"
                          className={
                            selected
                              ? "hostPurposeCard selected"
                              : "hostPurposeCard"
                          }
                          onClick={() => toggleHostPurpose(purpose.value)}
                          aria-pressed={selected}
                        >
                          <span className="hostPurposeIcon">
                            <Icon name={purpose.icon} size={20} />
                          </span>

                          <span className="hostPurposeCopy">
                            <strong>{purpose.title}</strong>
                            <small>{purpose.description}</small>
                          </span>

                          <span className="hostPurposeCheck">
                            {selected && <Icon name="check" size={15} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="hostPurposeHint">
                    Možeš izabrati jednu ili više opcija i promeniti ih kasnije.
                  </p>
                </section>
              )}

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

                  <div className="mapLocationBox">
                    <div className="mapLocationBoxIcon">
                      <Icon name="mapPin" size={19} />
                    </div>

                    <div className="mapLocationBoxContent">
                      <FormField
                        label="Javna lokacija na mapi"
                        name="public_location"
                        value={form.public_location}
                        onChange={updateField}
                        placeholder="npr. Prokuplje ili Jug Bogdanova 15, Prokuplje"
                        icon="mapPin"
                        autoComplete="street-address"
                        hint="Opciono. Unesite lokaciju ako želite da se vaš profil pojavi na MeetOutdoors mapi. Što preciznije unesete lokaciju, preciznije će biti prikazan marker. Lokacija koju unesete biće javno vidljiva."
                      />
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

              <section className="dangerZone">
                <div className="dangerZoneCopy">
                  <span className="dangerZoneIcon">
                    <Icon name="trash" size={18} />
                  </span>
                  <div>
                    <small>Opasna zona</small>
                    <h3>Obriši nalog</h3>
                    <p>
                      Trajno briše tvoj MeetOutdoors nalog i podatke
                      povezane sa njim. Ovu radnju nije moguće poništiti.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="deleteAccountButton"
                  onClick={() => {
                    setDeleteConfirmation("");
                    setDeleteError("");
                    setDeleteModalOpen(true);
                  }}
                  disabled={saving || deletingAccount}
                >
                  <Icon name="trash" size={16} />
                  Obriši nalog
                </button>
              </section>
            </form>
          </section>
        </div>
      </main>

      {deleteModalOpen && (
        <div
          className="deleteAccountBackdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingAccount) {
              setDeleteModalOpen(false);
            }
          }}
        >
          <div
            className="deleteAccountModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <button
              type="button"
              className="deleteModalClose"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deletingAccount}
              aria-label="Zatvori"
            >
              <Icon name="close" size={18} />
            </button>

            <span className="deleteModalIcon">
              <Icon name="trash" size={23} />
            </span>

            <small>Trajno brisanje</small>
            <h2 id="delete-account-title">
              Da li sigurno želiš da obrišeš nalog?
            </h2>

            <p className="deleteModalText">
              Biće trajno obrisan tvoj MeetOutdoors nalog i podaci
              povezani sa njim. Ovu radnju nije moguće poništiti.
            </p>

            <label className="deleteConfirmationField">
              <span>
                Za potvrdu upiši <strong>OBRIŠI</strong>
              </span>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(event) => {
                  setDeleteConfirmation(event.target.value);
                  if (deleteError) setDeleteError("");
                }}
                placeholder="OBRIŠI"
                autoComplete="off"
                disabled={deletingAccount}
              />
            </label>

            {deleteError && (
              <div className="deleteModalError" role="alert">
                <Icon name="alert" size={17} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="deleteModalActions">
              <button
                type="button"
                className="deleteModalCancel"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingAccount}
              >
                Odustani
              </button>

              <button
                type="button"
                className="deleteModalConfirm"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmation !== "OBRIŠI"}
              >
                {deletingAccount ? "Brisanje..." : "Trajno obriši nalog"}
              </button>
            </div>
          </div>
        </div>
      )}
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

      .mapLocationBox {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        margin-bottom: 18px;
        padding: 14px;
        border: 1px solid rgba(95, 194, 120, 0.22);
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(95, 194, 120, 0.08), rgba(255,255,255,0.5));
      }

      .mapLocationBoxIcon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: #2f6b43;
        background: rgba(95, 194, 120, 0.12);
        border: 1px solid rgba(95, 194, 120, 0.2);
      }

      .mapLocationBoxContent {
        min-width: 0;
      }

      .mapLocationBoxContent .editField {
        margin: 0;
      }

      .hostPurposeSection {
        background:
          linear-gradient(
            145deg,
            rgba(242, 248, 235, 0.96),
            rgba(255, 255, 255, 0.84)
          );
      }

      .hostPurposeGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .hostPurposeCard {
        position: relative;
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 28px;
        align-items: center;
        gap: 11px;
        min-width: 0;
        min-height: 92px;
        padding: 14px;
        border: 1px solid #d9e3d4;
        border-radius: 18px;
        background: #fbfcf9;
        color: #304438;
        text-align: left;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .hostPurposeCard:hover {
        border-color: #a8bd94;
        background: #f7faf3;
        transform: translateY(-1px);
      }

      .hostPurposeCard.selected {
        border-color: #779b5c;
        background:
          linear-gradient(145deg, #eef6e6, #f9fcf6);
        box-shadow: 0 8px 24px rgba(77, 111, 60, 0.08);
      }

      .hostPurposeIcon,
      .hostPurposeCheck {
        display: grid;
        place-items: center;
      }

      .hostPurposeIcon {
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #e7f0dc;
        color: #5b7842;
      }

      .hostPurposeCard.selected .hostPurposeIcon {
        background: #dceccb;
        color: #45682f;
      }

      .hostPurposeCopy {
        min-width: 0;
      }

      .hostPurposeCopy strong,
      .hostPurposeCopy small {
        display: block;
      }

      .hostPurposeCopy strong {
        font-size: 11px;
        color: #31473a;
      }

      .hostPurposeCopy small {
        margin-top: 5px;
        color: #89948c;
        font-size: 8px;
        line-height: 1.45;
      }

      .hostPurposeCheck {
        width: 27px;
        height: 27px;
        border: 1px solid #d8e2d3;
        border-radius: 9px;
        background: white;
        color: #4f7337;
      }

      .hostPurposeCard.selected .hostPurposeCheck {
        border-color: #8faa77;
        background: #dff0cf;
      }

      .hostPurposeHint {
        margin: 12px 0 0;
        color: #8a958d;
        font-size: 8px;
        line-height: 1.5;
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


      /* ===== MeetOutdoors Premium UI refresh ===== */
      .editProfilePage{
        padding:112px 24px 70px;
        background:
          radial-gradient(circle at 8% 5%,rgba(190,226,144,.28),transparent 25%),
          radial-gradient(circle at 94% 25%,rgba(70,118,79,.12),transparent 24%),
          linear-gradient(145deg,#edf3e9,#f7f9f5 52%,#e8efe6);
      }

      .editProfileShell{
        width:min(1240px,100%);
        grid-template-columns:330px minmax(0,1fr);
        gap:18px;
        overflow:visible;
        border:0;
        border-radius:0;
        background:transparent;
        box-shadow:none;
        align-items:start;
      }

      .profilePreview{
        position:sticky;
        top:104px;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.16);
        border-radius:28px;
        background:#0e2b1b;
        box-shadow:0 26px 70px rgba(23,49,31,.18);
      }

      .previewCover{height:225px}
      .previewRoleBadge{
        top:15px;right:15px;min-height:32px;padding:0 10px;
        border-radius:999px;font-size:7px;background:rgba(8,29,18,.28)
      }
      .previewContent{padding:0 22px 24px}
      .previewAvatar{
        width:92px;height:92px;margin-top:-46px;
        border:4px solid #0e2b1b;border-radius:25px
      }
      .previewKicker{margin-top:15px;font-size:7px}
      .previewContent h2{margin-top:7px;font-size:30px}
      .previewUsername{margin-top:6px;font-size:9px}
      .previewLocation{margin-top:14px;font-size:9px}
      .previewBio{
        display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;
        overflow:hidden;margin-top:14px;font-size:9px;line-height:1.65
      }
      .previewActivities{gap:6px;margin-top:15px}
      .previewActivities span{min-height:26px;padding:0 8px;font-size:7px}
      .previewNotice{margin-top:18px;padding:11px;border-radius:14px}
      .previewNotice > span{width:29px;height:29px}
      .previewNotice p{font-size:7.5px}

      .editProfileContent{
        padding:30px;
        border:1px solid rgba(45,73,53,.08);
        border-radius:28px;
        background:rgba(255,255,255,.80);
        box-shadow:0 26px 70px rgba(33,57,41,.09);
        backdrop-filter:blur(20px);
      }

      .editProfileHeader{margin-bottom:22px;padding:4px 4px 0}
      .editKicker{font-size:8px}
      .editProfileHeader h1{margin-top:8px;font-size:clamp(38px,4.5vw,58px)}
      .editProfileHeader p{margin-top:12px;font-size:10px}
      .accountType{min-height:36px;border-radius:999px;font-size:8px}

      .editProfileForm{gap:14px}
      .formSection{
        padding:20px;border-radius:21px;
        background:rgba(255,255,255,.88);
        box-shadow:0 9px 28px rgba(27,54,35,.035)
      }
      .hostFormSection{
        border-color:#d5e3cd;
        background:
          radial-gradient(circle at 100% 0%,rgba(205,238,160,.17),transparent 28%),
          linear-gradient(145deg,#f6faf2,#fff)
      }
      .formSectionHeading{gap:11px;margin-bottom:16px}
      .formSectionHeading > span{width:36px;height:36px;border-radius:11px}
      .formSectionHeading small{font-size:7px}
      .formSectionHeading h2{font-size:18px}
      .formSectionHeading p{font-size:8px}

      .editFieldsGrid,.uploadGrid{gap:11px}
      .editField{gap:6px}
      .fullWidthField{margin-top:11px}
      .editFieldLabel{font-size:8px}
      .editInputWrapper input{min-height:47px;border-radius:13px;font-size:10px}
      .editTextareaWrapper textarea{min-height:112px;border-radius:14px;font-size:10px}
      .fieldHint{font-size:7px}
      .characterCount{font-size:6px}

      .uploadField{padding:12px;border-radius:16px}
      .uploadFieldHeader{margin-bottom:9px}
      .uploadFieldIcon{width:32px;height:32px;border-radius:10px}
      .uploadFieldHeader strong{font-size:9px}
      .uploadFieldHeader small{font-size:7px}
      .uploadDropzone{min-height:70px;padding:10px;border-radius:13px}
      .uploadCircle{width:36px;height:36px;border-radius:11px}
      .uploadCopy strong{font-size:8px}
      .uploadCopy small{font-size:6.5px}
      .removeUpload{font-size:7px}
      .singleUpload{max-width:430px;margin-top:11px}

      .activityGrid{gap:7px}
      .activityButton{min-height:39px;padding:0 9px;border-radius:11px;font-size:8px}
      .activityCheck{width:18px;height:18px}
      .selectedActivitiesCount{font-size:7px}

      .formActions{
        position:sticky;z-index:10;bottom:12px;
        padding:10px;border:1px solid rgba(213,224,209,.84);border-radius:17px;
        background:rgba(251,253,249,.90);
        box-shadow:0 14px 38px rgba(27,52,35,.13);
        backdrop-filter:blur(18px)
      }
      .cancelButton,.saveButton{min-height:44px;border-radius:12px;font-size:9px}
      .saveButton{background:linear-gradient(180deg,#204b34,#173a27)}

      @media(max-width:860px){
        .editProfilePage{padding:94px 16px 60px}
        .editProfileShell{display:block}
        .profilePreview{
          position:relative;top:auto;display:grid;
          grid-template-columns:240px minmax(0,1fr);
          margin-bottom:14px;border-radius:24px
        }
        .previewCover{height:100%;min-height:245px}
        .previewContent{padding:23px}
        .previewAvatar{
          width:78px;height:78px;margin-top:0;
          border:3px solid rgba(255,255,255,.12);border-radius:21px
        }
        .previewNotice{display:none}
      }

      @media(max-width:680px){
        .editProfilePage{padding:76px 0 92px;background:#f1f5ee}
        .editProfileShell{width:100%}
        .profilePreview{
          display:block;margin:0 12px 12px;border-radius:23px;
          box-shadow:0 17px 45px rgba(23,49,31,.14)
        }
        .previewCover{height:142px;min-height:0}
        .previewRoleBadge{top:10px;right:10px;min-height:27px;font-size:6px}
        .previewContent{
          display:grid;grid-template-columns:64px minmax(0,1fr);
          column-gap:12px;padding:0 14px 15px
        }
        .previewAvatar{
          grid-row:1 / span 5;width:64px;height:64px;margin-top:-31px;
          border:3px solid #0e2b1b;border-radius:18px
        }
        .previewKicker{margin-top:10px;font-size:5.5px}
        .previewContent h2{margin-top:4px;font-size:22px}
        .previewUsername{margin-top:3px;font-size:7px}
        .previewLocation{margin-top:7px;font-size:7px}
        .previewBio,.previewActivities,.previewNotice{display:none}

        .editProfileContent{
          padding:18px 12px 28px;border:0;border-radius:0;
          background:transparent;box-shadow:none;backdrop-filter:none
        }
        .editProfileHeader{margin-bottom:14px;padding:0 2px}
        .editProfileHeader h1{font-size:37px}
        .editProfileHeader p{max-width:320px;margin-top:9px;font-size:8px}
        .accountType{display:none}
        .editProfileForm{gap:10px}
        .formSection{padding:15px;border-radius:18px}
        .formSectionHeading{gap:9px;margin-bottom:12px}
        .formSectionHeading > span{width:32px;height:32px;border-radius:10px}
        .formSectionHeading h2{font-size:16px}
        .formSectionHeading p{font-size:7px}

        .editFieldsGrid,.uploadGrid{grid-template-columns:1fr;gap:9px}
        .editInputWrapper input{min-height:45px;font-size:9.5px}
        .editTextareaWrapper textarea{min-height:100px;font-size:9.5px}
        .uploadDropzone{min-height:62px}
        .activityGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        .activityButton{min-height:38px;font-size:7.5px}

        .formActions{
          position:fixed;left:10px;right:10px;
          bottom:calc(10px + env(safe-area-inset-bottom));
          z-index:50;padding:8px;border-radius:15px
        }
        .cancelButton{flex:0 0 92px}
        .saveButton{flex:1;min-width:0}
      }

      @media(max-width:420px){
        .profilePreview{margin-left:8px;margin-right:8px}
        .editProfileContent{padding-left:9px;padding-right:9px}
        .editProfileHeader h1{font-size:33px}
        .formSection{padding:13px;border-radius:17px}
        .cancelButton{flex-basis:82px;padding:0 11px}
        .saveButton{padding:0 12px;font-size:8px}
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
      @media (max-width: 760px) {
        .hostPurposeGrid {
          grid-template-columns: 1fr;
        }

        .hostPurposeCard {
          min-height: 82px;
          padding: 12px;
        }

      }


      .dangerZone {
        display:flex;align-items:center;justify-content:space-between;gap:18px;
        margin-bottom: 96px;
        padding:19px;border:1px solid rgba(170,67,58,.18);
        border-radius:20px;background:#fff9f8;
      }
      .dangerZoneCopy{display:flex;align-items:flex-start;gap:12px;min-width:0}
      .dangerZoneIcon{
        width:42px;height:42px;display:grid;place-items:center;flex:0 0 auto;
        border-radius:13px;background:#fbe8e5;color:#9c3d35
      }
      .dangerZoneCopy small{
        display:block;color:#a65a52;font-size:8px;font-weight:900;
        letter-spacing:.11em;text-transform:uppercase
      }
      .dangerZoneCopy h3{margin:5px 0 0;color:#5a2d29;font-size:15px}
      .dangerZoneCopy p{
        max-width:500px;margin:6px 0 0;color:#8c7773;font-size:9px;line-height:1.55
      }
      .deleteAccountButton{
        min-height:42px;display:inline-flex;align-items:center;justify-content:center;
        gap:8px;flex:0 0 auto;padding:0 15px;border:1px solid #e6b9b4;
        border-radius:13px;background:#fff;color:#9c3d35;font-size:9px;
        font-weight:850;cursor:pointer
      }
      .deleteAccountBackdrop{
        position:fixed;inset:0;z-index:9999;display:grid;place-items:center;
        padding:22px;background:rgba(8,18,12,.66);backdrop-filter:blur(9px)
      }
      .deleteAccountModal{
        position:relative;width:min(470px,100%);padding:30px;border-radius:27px;
        background:#fffdfa;box-shadow:0 30px 90px rgba(0,0,0,.28)
      }
      .deleteModalClose{
        position:absolute;top:17px;right:17px;width:38px;height:38px;
        display:grid;place-items:center;border:1px solid #e6e8e3;border-radius:12px;
        background:#fff;color:#7c8580;cursor:pointer
      }
      .deleteModalIcon{
        width:54px;height:54px;display:grid;place-items:center;margin-bottom:19px;
        border-radius:17px;background:#fbe7e5;color:#a43d35
      }
      .deleteAccountModal>small{
        display:block;color:#a5544d;font-size:8px;font-weight:900;
        letter-spacing:.13em;text-transform:uppercase
      }
      .deleteAccountModal h2{
        margin:8px 45px 0 0;color:#2f342f;font-size:26px;line-height:1.08;
        letter-spacing:-.045em
      }
      .deleteModalText{margin:13px 0 0;color:#7d837e;font-size:10px;line-height:1.65}
      .deleteConfirmationField{display:grid;gap:8px;margin-top:22px}
      .deleteConfirmationField span{color:#5f6862;font-size:9px;font-weight:700}
      .deleteConfirmationField input{
        width:100%;height:48px;padding:0 14px;border:1px solid #dddeda;
        border-radius:14px;outline:none;background:#fff;color:#27332c;
        font-size:11px;font-weight:800
      }
      .deleteModalError{
        display:flex;gap:8px;margin-top:13px;padding:11px 12px;
        border:1px solid #efc3be;border-radius:13px;background:#fff3f1;
        color:#923f37;font-size:9px
      }
      .deleteModalActions{
        display:grid;grid-template-columns:1fr 1.35fr;gap:10px;margin-top:22px
      }
      .deleteModalCancel,.deleteModalConfirm{
        min-height:47px;border-radius:14px;font-size:9px;font-weight:850;cursor:pointer
      }
      .deleteModalCancel{border:1px solid #dfe3dd;background:#f8faf6;color:#66716a}
      .deleteModalConfirm{border:1px solid #9c3c34;background:#9c3c34;color:#fff}
      .deleteModalConfirm:disabled,.deleteModalCancel:disabled,
      .deleteModalClose:disabled,.deleteAccountButton:disabled{
        cursor:not-allowed;opacity:.52
      }

      @media(max-width:760px){
        .dangerZone{align-items:stretch;flex-direction:column;padding:17px;margin-bottom:118px}
        .deleteAccountButton{width:100%}
        .deleteAccountModal{padding:24px 19px 19px;border-radius:23px}
        .deleteAccountModal h2{font-size:23px}
        .deleteModalActions{grid-template-columns:1fr}
      }

    `}</style>
  );
}
