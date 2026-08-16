import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_CAMERA_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&auto=format&fit=crop";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    arrowLeft: (
      <>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),
    flip: (
      <>
        <path d="M4 7h7M8 3l3 4-3 4" />
        <path d="M20 17h-7M16 13l-3 4 3 4" />
      </>
    ),
    navigation: <path d="m3 11 18-8-8 18-2-8-8-2Z" />,
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function blobFromCanvas(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/jpeg",
      0.9
    );
  });
}

export default function AddPlace() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const galleryInputRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");

  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");

  const [gpsStatus, setGpsStatus] = useState("locating");
  const [point, setPoint] = useState(null);
  const [protection, setProtection] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [checkingLocation, setCheckingLocation] = useState(false);

  const [categories, setCategories] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [hostSearch, setHostSearch] = useState("");
  const [selectedHost, setSelectedHost] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    short_description: "",
    description: "",
    region: "",
    locality: "",
    difficulty: "",
    access_type: "",
    verification_radius_m: "200",
  });

  const updateField = useCallback((name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks?.().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Kamera nije dostupna u browseru. Izaberi fotografiju iz galerije."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: facingMode,
          },
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setCameraReady(true);
      }
    } catch (cameraStartError) {
      console.error("Kamera:", cameraStartError);

      setCameraError(
        "Ne možemo da otvorimo kameru. Možeš da izabereš fotografiju iz galerije."
      );
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (!authLoading && profile?.id && !photoUrl) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [
    authLoading,
    photoUrl,
    profile?.id,
    startCamera,
    stopCamera,
  ]);

  useEffect(() => {
    if (!profile?.id) return;

    async function loadCategories() {
      const { data, error: categoryError } = await supabase
        .from("place_categories")
        .select("id, name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!categoryError) {
        setCategories(data || []);
      }
    }

    loadCategories();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    let active = true;

    async function loadHosts() {
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("role", "host")
        .limit(12);

      if (hostSearch.trim()) {
        query = query.or(
          `username.ilike.%${hostSearch.trim()}%,full_name.ilike.%${hostSearch.trim()}%`
        );
      }

      const { data, error: hostsError } = await query;

      if (!active || hostsError) return;

      setHosts(data || []);
    }

    const timeout = window.setTimeout(loadHosts, 220);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [hostSearch, profile?.id]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setError("GPS nije dostupan na ovom uređaju.");
      return;
    }

    setGpsStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
        });

        setGpsStatus("found");
      },
      (gpsError) => {
        console.error("GPS:", gpsError);

        setGpsStatus("error");
        setError(
          gpsError?.message ||
            "Lokaciju trenutno nije moguće pronaći."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000,
      }
    );
  }, []);

  useEffect(() => {
    if (!authLoading && profile?.id) {
      locateUser();
    }
  }, [authLoading, locateUser, profile?.id]);

  const inspectLocation = useCallback(async (location) => {
    if (!location) return;

    setCheckingLocation(true);

    try {
      const [nearbyResult, protectionResult] =
        await Promise.all([
          supabase.rpc("find_nearby_places", {
            p_latitude: location.latitude,
            p_longitude: location.longitude,
            p_radius_m: 500,
          }),
          supabase.rpc("preview_place_protection", {
            p_latitude: location.latitude,
            p_longitude: location.longitude,
          }),
        ]);

      if (nearbyResult.error) throw nearbyResult.error;
      if (protectionResult.error) throw protectionResult.error;

      setNearby(nearbyResult.data || []);
      setProtection(protectionResult.data?.[0] || null);
    } catch (inspectError) {
      console.error("Location check:", inspectError);
    } finally {
      setCheckingLocation(false);
    }
  }, []);

  useEffect(() => {
    inspectLocation(point);
  }, [inspectLocation, point]);

  useEffect(() => {
    return () => {
      if (photoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  async function takePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.drawImage(video, 0, 0, width, height);

    const blob = await blobFromCanvas(canvas);

    if (!blob) {
      setError("Fotografiju trenutno nije moguće napraviti.");
      return;
    }

    const url = URL.createObjectURL(blob);

    setPhotoBlob(blob);
    setPhotoUrl(url);
    setDetailsOpen(true);
    stopCamera();
  }

  function chooseGalleryPhoto(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const url = URL.createObjectURL(file);

    setPhotoBlob(file);
    setPhotoUrl(url);
    setDetailsOpen(true);
    stopCamera();
  }

  async function retakePhoto() {
    if (photoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoUrl);
    }

    setPhotoBlob(null);
    setPhotoUrl("");
    setDetailsOpen(false);

    await startCamera();
  }

  const canPublish = useMemo(
    () =>
      Boolean(
        photoBlob &&
          point &&
          form.name.trim().length >= 2 &&
          form.category_id &&
          protection?.status !== "block" &&
          !saving
      ),
    [
      form.category_id,
      form.name,
      photoBlob,
      point,
      protection?.status,
      saving,
    ]
  );

  async function createPlace() {
    if (!canPublish || !profile?.id || !point || !photoBlob) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { data: placeId, error: createError } =
        await supabase.rpc("create_place", {
          p_name: form.name.trim(),
          p_category_id: form.category_id,
          p_latitude: point.latitude,
          p_longitude: point.longitude,
          p_short_description:
            form.short_description.trim() || null,
          p_description: form.description.trim() || null,
          p_country_code: "RS",
          p_country_name: "Srbija",
          p_region: form.region.trim() || null,
          p_municipality: null,
          p_locality: form.locality.trim() || null,
          p_location_precision: "exact",
          p_verification_radius_m: Number(
            form.verification_radius_m || 200
          ),
          p_difficulty: form.difficulty || null,
          p_estimated_visit_minutes: null,
          p_access_type: form.access_type || null,
          p_child_friendly: null,
          p_pet_friendly: null,
          p_best_seasons: [],
          p_recommended_gear: [],
        });

      if (createError) throw createError;

      const extension =
        photoBlob.type === "image/png" ? "png" : "jpg";

      const storagePath = `${profile.id}/${placeId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("place-media")
        .upload(storagePath, photoBlob, {
          upsert: false,
          cacheControl: "3600",
          contentType:
            photoBlob.type || "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("place-media")
        .getPublicUrl(storagePath);

      const { error: photoError } = await supabase
        .from("place_photos")
        .insert({
          place_id: placeId,
          user_id: profile.id,
          storage_path: storagePath,
          image_url: publicData.publicUrl,
          mime_type:
            photoBlob.type || "image/jpeg",
          file_size: photoBlob.size || null,
        });

      if (photoError) throw photoError;

      await supabase
        .from("places")
        .update({
          cover_url: publicData.publicUrl,
        })
        .eq("id", placeId)
        .eq("created_by", profile.id);

      if (selectedHost?.id) {
       const { error: tagError } = await supabase
  .from("place_host_tags")
  .insert({
    place_id: placeId,
    user_id: profile.id,
    host_id: selectedHost.id,
    status: "pending",
  });

        if (tagError) {
          console.warn(
            "Host tag nije sačuvan:",
            tagError
          );
        }
      }

      navigate(`/explore/${placeId}`, {
        replace: true,
      });
    } catch (createPlaceError) {
      console.error("Create place:", createPlaceError);

      setError(
        createPlaceError?.message ||
          "Mesto trenutno nije moguće objaviti."
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return null;
  }

  if (!profile?.id) {
    return (
      <>
        <AddPlaceStyles />

        <main className="captureState">
          <Icon name="shield" size={30} />
          <h1>Prijavi se da ostaviš trag.</h1>

          <Link to="/login">
            Prijavi se
            <Icon name="arrowRight" size={16} />
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <AddPlaceStyles />

      <main className="capturePage">
        <section className="captureStage">
          <div className="captureMedia">
            {!photoUrl ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="captureVideo"
                />

                {!cameraReady && (
                  <div className="captureCameraFallback">
                    <img
                      src={FALLBACK_CAMERA_IMAGE}
                      alt=""
                    />

                    <div />

                    <span>
                      <Icon name="camera" size={30} />
                    </span>

                    <strong>
                      {cameraError
                        ? "Kamera nije dostupna"
                        : "Pokrećemo kameru..."}
                    </strong>

                    <p>
                      {cameraError ||
                        "Dozvoli pristup kameri ako browser zatraži."}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        galleryInputRef.current?.click()
                      }
                    >
                      <Icon name="image" size={16} />
                      Izaberi iz galerije
                    </button>
                  </div>
                )}
              </>
            ) : (
              <img
                src={photoUrl}
                alt="Novo outdoor otkriće"
                className="capturePreview"
              />
            )}

            <div className="captureShade" />

            <header className="captureHeader">
              <Link to="/explore">
                <Icon name="arrowLeft" size={17} />
                <span>Mapa</span>
              </Link>

              <div className="captureGpsPill">
                <span
                  className={`captureGpsDot ${gpsStatus}`}
                />

                <div>
                  <small>GPS</small>
                  <strong>
                    {gpsStatus === "found"
                      ? "Lokacija sačuvana"
                      : gpsStatus === "locating"
                        ? "Pronalazimo te..."
                        : "GPS nije dostupan"}
                  </strong>
                </div>
              </div>
            </header>

            {!photoUrl && (
              <div className="captureIntro">
                <span className="captureEyebrow">
                  <i />
                  NOVO OTKRIĆE
                </span>

                <h1>
                  Slikaj.
                  <br />
                  Mi pamtimo gde.
                </h1>

                <p>
                  Fotografija i GPS su dovoljni za početak.
                  Ostalo dodaš na istoj slici.
                </p>
              </div>
            )}

            {!photoUrl && (
              <div className="captureControls">
                <button
                  type="button"
                  className="captureGallery"
                  onClick={() =>
                    galleryInputRef.current?.click()
                  }
                  aria-label="Izaberi iz galerije"
                >
                  <Icon name="image" size={19} />
                </button>

                <button
                  type="button"
                  className="captureShutter"
                  onClick={takePhoto}
                  disabled={!cameraReady}
                  aria-label="Fotografiši"
                >
                  <span />
                </button>

                <button
                  type="button"
                  className="captureFlip"
                  onClick={() =>
                    setFacingMode((value) =>
                      value === "environment"
                        ? "user"
                        : "environment"
                    )
                  }
                  aria-label="Promeni kameru"
                >
                  <Icon name="flip" size={20} />
                </button>
              </div>
            )}

            {photoUrl && (
              <div className="capturePreviewActions">
                <button
                  type="button"
                  onClick={retakePhoto}
                >
                  <Icon name="camera" size={16} />
                  Snimi ponovo
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDetailsOpen((value) => !value)
                  }
                >
                  <Icon name="sparkle" size={16} />
                  {detailsOpen
                    ? "Sakrij detalje"
                    : "Dodaj detalje"}
                </button>
              </div>
            )}

            <input
              ref={galleryInputRef}
              hidden
              type="file"
              accept="image/*"
              capture="environment"
              onChange={chooseGalleryPhoto}
            />

            <canvas
              ref={canvasRef}
              hidden
            />
          </div>

          {photoUrl && (
            <section
              className={`captureDetails ${
                detailsOpen ? "open" : ""
              }`}
            >
              <div className="captureDetailsHandle" />

              <header>
                <div>
                  <span>OSTAVI TRAG</span>
                  <h2>Šta smo pronašli?</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                >
                  <Icon name="close" size={18} />
                </button>
              </header>

              <div className="captureStatusRow">
                <article>
                  <Icon
                    name="navigation"
                    size={16}
                  />

                  <div>
                    <span>GPS</span>
                    <strong>
                      {point
                        ? `${point.latitude.toFixed(
                            5
                          )}, ${point.longitude.toFixed(5)}`
                        : "Čeka lokaciju"}
                    </strong>
                  </div>
                </article>

                <article>
                  <Icon
                    name={
                      protection?.status === "block"
                        ? "alert"
                        : "shield"
                    }
                    size={16}
                  />

                  <div>
                    <span>ZAŠTITA</span>
                    <strong>
                      {checkingLocation
                        ? "Provera..."
                        : protection?.status === "block"
                          ? "Blokirano"
                          : protection?.status === "approximate"
                            ? "Precizna lokacija skrivena"
                            : "Dozvoljeno"}
                    </strong>
                  </div>
                </article>
              </div>

              {protection?.status === "block" && (
                <div className="captureWarning">
                  <Icon name="alert" size={18} />

                  <div>
                    <strong>
                      Ovo mesto ne može da bude javno pinovano.
                    </strong>

                    <p>{protection.message}</p>
                  </div>
                </div>
              )}

              {nearby.length > 0 && (
                <div className="captureNearby">
                  <div>
                    <Icon name="search" size={15} />
                    <strong>
                      Proveri da li već postoji
                    </strong>

                    <span>
                      {nearby.length} u krugu 500 m
                    </span>
                  </div>

                  <div>
                    {nearby.slice(0, 3).map((place) => (
                      <Link
                        key={place.id}
                        to={`/explore/${place.id}`}
                      >
                        <span>
                          {Math.round(
                            place.distance_m
                          )}{" "}
                          m
                        </span>

                        <strong>{place.name}</strong>

                        <Icon
                          name="arrowRight"
                          size={13}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="captureFields">
                <label className="wide">
                  <span>Naziv *</span>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Kako zovemo ovo mesto?"
                  />
                </label>

                <label className="wide">
                  <span>Kategorija *</span>

                  <select
                    value={form.category_id}
                    onChange={(event) =>
                      updateField(
                        "category_id",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Izaberi kategoriju
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="wide">
                  <span>Kratak opis</span>

                  <input
                    value={form.short_description}
                    onChange={(event) =>
                      updateField(
                        "short_description",
                        event.target.value
                      )
                    }
                    placeholder="Jedna korisna rečenica."
                  />
                </label>

                <label className="wide">
                  <span>Detalji</span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Pristup, parking, staza, šta očekivati..."
                  />
                </label>

                <label>
                  <span>Region</span>

                  <input
                    value={form.region}
                    onChange={(event) =>
                      updateField(
                        "region",
                        event.target.value
                      )
                    }
                    placeholder="Zapadna Srbija"
                  />
                </label>

                <label>
                  <span>Mesto</span>

                  <input
                    value={form.locality}
                    onChange={(event) =>
                      updateField(
                        "locality",
                        event.target.value
                      )
                    }
                    placeholder="Uvac"
                  />
                </label>

                <label>
                  <span>Težina</span>

                  <select
                    value={form.difficulty}
                    onChange={(event) =>
                      updateField(
                        "difficulty",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Nije navedeno
                    </option>
                    <option value="easy">
                      Lako
                    </option>
                    <option value="moderate">
                      Srednje
                    </option>
                    <option value="hard">
                      Zahtevno
                    </option>
                  </select>
                </label>

                <label>
                  <span>Pristup</span>

                  <select
                    value={form.access_type}
                    onChange={(event) =>
                      updateField(
                        "access_type",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Nije navedeno
                    </option>
                    <option value="car">
                      Automobil
                    </option>
                    <option value="walk">
                      Peške
                    </option>
                    <option value="4x4">
                      4x4
                    </option>
                    <option value="bike">
                      Bicikl
                    </option>
                    <option value="mixed">
                      Kombinovano
                    </option>
                  </select>
                </label>
              </div>

              <section className="captureHostTag">
                <div className="captureHostTagHead">
                  <div>
                    <span>DOMAĆIN</span>
                    <strong>
                      Bio/la si kod nekoga?
                    </strong>
                    <small>
                      Opciono. Tag možeš ukloniti pre objave.
                    </small>
                  </div>

                  {selectedHost && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedHost(null)
                      }
                    >
                      <Icon
                        name="trash"
                        size={14}
                      />
                      Ukloni tag
                    </button>
                  )}
                </div>

                {selectedHost ? (
                  <div className="captureSelectedHost">
                    {selectedHost.avatar_url ? (
                      <img
                        src={selectedHost.avatar_url}
                        alt=""
                      />
                    ) : (
                      <span>
                        <Icon
                          name="user"
                          size={18}
                        />
                      </span>
                    )}

                    <div>
                      <small>
                        TAGOVAN DOMAĆIN
                      </small>
                      <strong>
                        {selectedHost.full_name ||
                          selectedHost.username}
                      </strong>
                      <em>
                        @{selectedHost.username}
                      </em>
                    </div>

                    <Icon
                      name="check"
                      size={17}
                    />
                  </div>
                ) : (
                  <>
                    <label className="captureHostSearch">
                      <Icon
                        name="search"
                        size={16}
                      />

                      <input
                        value={hostSearch}
                        onChange={(event) =>
                          setHostSearch(
                            event.target.value
                          )
                        }
                        placeholder="Pronađi domaćina..."
                      />
                    </label>

                    <div className="captureHostResults">
                      {hosts.map((host) => (
                        <button
                          key={host.id}
                          type="button"
                          onClick={() =>
                            setSelectedHost(host)
                          }
                        >
                          {host.avatar_url ? (
                            <img
                              src={host.avatar_url}
                              alt=""
                            />
                          ) : (
                            <span>
                              <Icon
                                name="user"
                                size={16}
                              />
                            </span>
                          )}

                          <div>
                            <strong>
                              {host.full_name ||
                                host.username}
                            </strong>

                            <small>
                              @{host.username}
                            </small>
                          </div>

                          <Icon
                            name="plus"
                            size={15}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {error && (
                <div className="captureError">
                  <Icon name="alert" size={17} />
                  {error}
                </div>
              )}

              <div className="capturePublishBar">
                <div>
                  <span>
                    <Icon
                      name="sparkle"
                      size={16}
                    />
                  </span>

                  <div>
                    <small>
                      COMMUNITY PIN
                    </small>
                    <strong>
                      Fotografija + GPS + trag
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canPublish}
                  onClick={createPlace}
                >
                  {saving
                    ? "Objavljujemo..."
                    : "Objavi mesto"}

                  <Icon
                    name="arrowRight"
                    size={16}
                  />
                </button>
              </div>
            </section>
          )}
        </section>
      </main>
    </>
  );
}

function AddPlaceStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      html,body,#root{min-height:100%}
      body{margin:0;background:#041009}
      button,input,textarea,select{font:inherit}
      .capturePage,.captureState{min-height:100vh;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .capturePage{background:#041009;color:#fff}
      .capturePage a{color:inherit;text-decoration:none}
      .captureStage{position:relative;min-height:100vh;overflow:hidden;background:#06110b}
      .captureMedia{position:fixed;inset:0;background:#0c1811}
      .captureVideo,.capturePreview{width:100%;height:100%;object-fit:cover}
      .captureVideo{transform:scaleX(1)}
      .capturePreview{display:block}
      .captureShade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(2,9,5,.62),transparent 25%,transparent 56%,rgba(2,9,5,.82)),linear-gradient(90deg,rgba(2,9,5,.22),transparent 42%)}
      .captureHeader{position:absolute;top:104px;right:20px;left:20px;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .captureHeader>a{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 12px;border:1px solid rgba(255,255,255,.15);border-radius:14px;background:rgba(3,12,6,.52);color:#fff!important;font-size:8px;font-weight:850;backdrop-filter:blur(18px)}
      .captureGpsPill{display:flex;align-items:center;gap:8px;padding:9px 11px;border:1px solid rgba(255,255,255,.13);border-radius:14px;background:rgba(3,12,6,.54);backdrop-filter:blur(18px)}
      .captureGpsDot{width:9px;height:9px;border-radius:50%;background:#89948c}
      .captureGpsDot.locating{background:#f1d17f;box-shadow:0 0 0 5px rgba(241,209,127,.1);animation:capturePulse 1.4s ease-in-out infinite}
      .captureGpsDot.found{background:#baff9e;box-shadow:0 0 0 5px rgba(186,255,158,.12)}
      .captureGpsDot.error{background:#ff9588;box-shadow:0 0 0 5px rgba(255,149,136,.1)}
      .captureGpsPill small,.captureGpsPill strong{display:block}
      .captureGpsPill small{color:rgba(255,255,255,.38);font-size:5px;font-weight:900;letter-spacing:.12em}
      .captureGpsPill strong{margin-top:2px;font-size:7px}
      .captureIntro{position:absolute;left:5vw;bottom:130px;z-index:12;max-width:650px}
      .captureEyebrow{display:inline-flex;align-items:center;gap:7px;color:#baff9e;font-size:8px;font-weight:950;letter-spacing:.12em}
      .captureEyebrow i{width:7px;height:7px;border-radius:50%;background:#baff9e;box-shadow:0 0 0 5px rgba(186,255,158,.1)}
      .captureIntro h1{margin:15px 0 0;font-size:clamp(58px,8vw,108px);line-height:.83;letter-spacing:-.08em}
      .captureIntro p{max-width:480px;margin:18px 0 0;color:rgba(255,255,255,.55);font-size:11px;line-height:1.7}
      .captureControls{position:absolute;right:0;bottom:24px;left:0;z-index:20;display:grid;grid-template-columns:52px 82px 52px;align-items:center;justify-content:center;gap:20px}
      .captureGallery,.captureFlip{display:grid;place-items:center;width:52px;height:52px;border:1px solid rgba(255,255,255,.16);border-radius:17px;background:rgba(3,12,6,.55);color:#fff;cursor:pointer;backdrop-filter:blur(18px)}
      .captureShutter{display:grid;place-items:center;width:82px;height:82px;border:4px solid rgba(255,255,255,.92);border-radius:50%;background:transparent;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.26)}
      .captureShutter>span{width:62px;height:62px;border-radius:50%;background:#fff;transition:.16s ease}
      .captureShutter:hover>span{transform:scale(.9)}
      .captureShutter:disabled{cursor:not-allowed;opacity:.4}
      .captureCameraFallback{position:absolute;inset:0;z-index:8;display:grid;place-items:center;align-content:center;padding:24px;text-align:center}
      .captureCameraFallback>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(10px);transform:scale(1.05)}
      .captureCameraFallback>div{position:absolute;inset:0;background:rgba(3,12,6,.8)}
      .captureCameraFallback>span,.captureCameraFallback>strong,.captureCameraFallback>p,.captureCameraFallback>button{position:relative;z-index:2}
      .captureCameraFallback>span{display:grid;place-items:center;width:72px;height:72px;border-radius:22px;background:rgba(186,255,158,.12);color:#baff9e}
      .captureCameraFallback>strong{margin-top:16px;font-size:22px}
      .captureCameraFallback>p{max-width:420px;margin:7px 0 0;color:rgba(255,255,255,.48);font-size:9px;line-height:1.55}
      .captureCameraFallback>button{display:inline-flex;align-items:center;gap:7px;justify-self:center;margin-top:16px;min-height:42px;padding:0 13px;border:1px solid rgba(186,255,158,.25);border-radius:12px;background:rgba(186,255,158,.1);color:#dfffd1;cursor:pointer;font-size:8px;font-weight:850}
      .capturePreviewActions{position:absolute;right:20px;bottom:20px;z-index:20;display:flex;gap:7px}
      .capturePreviewActions button{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:0 12px;border:1px solid rgba(255,255,255,.14);border-radius:13px;background:rgba(3,12,6,.6);color:#fff;cursor:pointer;font-size:8px;font-weight:850;backdrop-filter:blur(18px)}
      .capturePreviewActions button:last-child{border-color:#baff9e;background:#baff9e;color:#102619}
      .captureDetails{position:fixed;top:0;right:0;bottom:0;z-index:40;width:min(520px,94vw);padding:116px 18px 18px;overflow-y:auto;background:linear-gradient(180deg,rgba(7,20,12,.97),rgba(7,20,12,.995));box-shadow:-24px 0 70px rgba(0,0,0,.35);transform:translateX(100%);transition:.28s ease;backdrop-filter:blur(24px)}
      .captureDetails.open{transform:translateX(0)}
      .captureDetailsHandle{display:none}
      .captureDetails>header{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.09)}
      .captureDetails>header span{color:#baff9e;font-size:6px;font-weight:900;letter-spacing:.11em}
      .captureDetails>header h2{margin:5px 0 0;font-size:27px;letter-spacing:-.05em}
      .captureDetails>header>button{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.05);color:#fff;cursor:pointer}
      .captureStatusRow{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}
      .captureStatusRow article{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.04);color:#baff9e}
      .captureStatusRow span,.captureStatusRow strong{display:block}
      .captureStatusRow span{color:rgba(255,255,255,.34);font-size:5px;font-weight:900}
      .captureStatusRow strong{margin-top:3px;color:#fff;font-size:7px}
      .captureWarning{display:flex;gap:9px;margin-top:9px;padding:11px;border:1px solid rgba(255,148,130,.22);border-radius:12px;background:rgba(255,90,70,.08);color:#ffb2a8}
      .captureWarning strong{display:block;font-size:8px}
      .captureWarning p{margin:4px 0 0;color:rgba(255,255,255,.48);font-size:7px;line-height:1.45}
      .captureNearby{margin-top:9px;padding:11px;border:1px solid rgba(241,209,127,.18);border-radius:12px;background:rgba(241,209,127,.06)}
      .captureNearby>div:first-child{display:flex;align-items:center;gap:6px;color:#f1d17f}
      .captureNearby>div:first-child strong{font-size:7px}
      .captureNearby>div:first-child span{margin-left:auto;color:rgba(255,255,255,.4);font-size:6px}
      .captureNearby>div:last-child{display:grid;gap:5px;margin-top:8px}
      .captureNearby a{display:grid;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:7px;padding:8px;border-radius:9px;background:rgba(255,255,255,.045)}
      .captureNearby a>span{color:#f1d17f;font-size:6px;font-weight:850}
      .captureNearby a>strong{overflow:hidden;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
      .captureFields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
      .captureFields label{display:grid;gap:5px}
      .captureFields label.wide{grid-column:1/-1}
      .captureFields label>span{color:rgba(255,255,255,.45);font-size:6px;font-weight:850}
      .captureFields input,.captureFields textarea,.captureFields select{width:100%;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.055);color:#fff;outline:0;font-size:8px}
      .captureFields input,.captureFields select{min-height:42px;padding:0 10px}
      .captureFields textarea{min-height:92px;padding:10px;resize:vertical;line-height:1.55}
      .captureFields select option{color:#111}
      .captureFields input:focus,.captureFields textarea:focus,.captureFields select:focus{border-color:rgba(186,255,158,.45);box-shadow:0 0 0 3px rgba(186,255,158,.07)}
      .captureHostTag{margin-top:12px;padding:12px;border:1px solid rgba(186,255,158,.12);border-radius:14px;background:rgba(186,255,158,.045)}
      .captureHostTagHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .captureHostTagHead span,.captureHostTagHead strong,.captureHostTagHead small{display:block}
      .captureHostTagHead span{color:#baff9e;font-size:6px;font-weight:900;letter-spacing:.1em}
      .captureHostTagHead strong{margin-top:4px;font-size:9px}
      .captureHostTagHead small{margin-top:3px;color:rgba(255,255,255,.36);font-size:6px}
      .captureHostTagHead>button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#ffaaa0;cursor:pointer;font-size:6px;font-weight:850}
      .captureHostSearch{display:flex;align-items:center;gap:7px;margin-top:10px;min-height:40px;padding:0 10px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.42)}
      .captureHostSearch input{width:100%;border:0;outline:0;background:transparent;color:#fff;font-size:7px}
      .captureHostResults{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}
      .captureHostResults>button{display:grid;grid-template-columns:35px minmax(0,1fr) auto;align-items:center;gap:7px;padding:6px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:rgba(255,255,255,.035);color:#fff;text-align:left;cursor:pointer}
      .captureHostResults img,.captureHostResults>button>span{width:35px;height:35px;border-radius:9px}
      .captureHostResults img{object-fit:cover}
      .captureHostResults>button>span{display:grid;place-items:center;background:rgba(186,255,158,.08);color:#baff9e}
      .captureHostResults strong,.captureHostResults small{display:block}
      .captureHostResults strong{overflow:hidden;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
      .captureHostResults small{margin-top:2px;color:rgba(255,255,255,.34);font-size:5px}
      .captureSelectedHost{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:8px;margin-top:10px;padding:8px;border:1px solid rgba(186,255,158,.18);border-radius:11px;background:rgba(186,255,158,.07);color:#baff9e}
      .captureSelectedHost>img,.captureSelectedHost>span{width:42px;height:42px;border-radius:10px}
      .captureSelectedHost>img{object-fit:cover}
      .captureSelectedHost>span{display:grid;place-items:center;background:rgba(186,255,158,.09)}
      .captureSelectedHost small,.captureSelectedHost strong,.captureSelectedHost em{display:block}
      .captureSelectedHost small{color:#baff9e;font-size:5px;font-weight:900}
      .captureSelectedHost strong{margin-top:2px;color:#fff;font-size:8px}
      .captureSelectedHost em{margin-top:2px;color:rgba(255,255,255,.35);font-size:6px;font-style:normal}
      .captureError{display:flex;align-items:flex-start;gap:7px;margin-top:10px;padding:10px;border:1px solid rgba(255,148,130,.2);border-radius:11px;background:rgba(255,90,70,.08);color:#ffb2a8;font-size:7px;line-height:1.45}
      .capturePublishBar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}
      .capturePublishBar>div{display:flex;align-items:center;gap:8px}
      .capturePublishBar>div>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:rgba(186,255,158,.09);color:#baff9e}
      .capturePublishBar small,.capturePublishBar strong{display:block}
      .capturePublishBar small{color:#baff9e;font-size:5px;font-weight:900;letter-spacing:.08em}
      .capturePublishBar strong{margin-top:2px;font-size:7px}
      .capturePublishBar>button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 13px;border:0;border-radius:11px;background:#baff9e;color:#102619;cursor:pointer;font-size:8px;font-weight:900}
      .capturePublishBar>button:disabled{cursor:not-allowed;opacity:.4}
      .captureState{display:grid;place-items:center;align-content:center;gap:10px;padding:24px;background:#e8ece4;color:#1f3127;text-align:center}
      .captureState h1{font-size:28px}
      .captureState a{display:inline-flex;align-items:center;gap:6px;padding:11px 13px;border-radius:11px;background:#173b27;color:#fff;text-decoration:none;font-size:8px;font-weight:850}

      @keyframes capturePulse{
        0%,100%{opacity:.45;transform:scale(.95)}
        50%{opacity:1;transform:scale(1.05)}
      }

      @media(max-width:700px){
        .captureHeader{top:80px;right:10px;left:10px}
        .captureHeader>a span{display:none}
        .captureIntro{right:18px;bottom:132px;left:18px}
        .captureIntro h1{font-size:54px}
        .captureIntro p{font-size:9px}
        .captureControls{bottom:20px}
        .capturePreviewActions{right:10px;bottom:10px;left:10px}
        .capturePreviewActions button{flex:1;justify-content:center}
        .captureDetails{top:auto;right:0;bottom:0;left:0;width:100%;max-height:78vh;padding:14px 12px 12px;border-radius:24px 24px 0 0;box-shadow:0 -24px 70px rgba(0,0,0,.36);transform:translateY(100%)}
        .captureDetails.open{transform:translateY(0)}
        .captureDetailsHandle{display:block;width:42px;height:4px;margin:0 auto 11px;border-radius:999px;background:rgba(255,255,255,.22)}
        .captureDetails>header{position:sticky;top:-14px;z-index:4;padding-top:5px;background:#07140c}
        .captureHostResults{grid-template-columns:1fr}
        .capturePublishBar{position:sticky;bottom:-12px;z-index:5;margin-right:-12px;margin-left:-12px;padding:10px 12px 12px;background:linear-gradient(180deg,rgba(7,20,12,.82),#07140c 34%)}
      }

      @media(max-width:470px){
        .captureGpsPill{padding:7px 8px}
        .captureGpsPill strong{font-size:6px}
        .captureIntro h1{font-size:48px}
        .captureFields{grid-template-columns:1fr}
        .captureFields label.wide{grid-column:auto}
        .captureStatusRow{grid-template-columns:1fr}
        .capturePublishBar{align-items:stretch;flex-direction:column}
        .capturePublishBar>button{width:100%}
      }

      @media(prefers-reduced-motion:reduce){
        *,*::before,*::after{
          animation:none!important;
          transition:none!important;
          scroll-behavior:auto!important
        }
      }
    `}</style>
  );
}
