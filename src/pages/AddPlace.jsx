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
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1800&auto=format&fit=crop";

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
    wand: (
      <>
        <path d="m15 4 5 5" />
        <path d="M13 6 4 15l5 5 9-9" />
        <path d="m6 3 .6 1.8L8 5.4 6.6 6 6 8l-.6-2L4 5.4l1.4-.6L6 3Z" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
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
      0.92
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
          <span className="captureStateIcon">
            <Icon name="shield" size={30} />
          </span>

          <span className="captureStateKicker">
            MEETOUTDOORS
          </span>

          <h1>Prijavi se da ostaviš trag.</h1>

          <p>
            Fotografija, GPS i tvoj community trag postaju deo mape.
          </p>

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

                    <span className="captureFallbackIcon">
                      <Icon name="camera" size={30} />
                    </span>

                    <span className="captureFallbackKicker">
                      CAMERA MODE
                    </span>

                    <strong>
                      {cameraError
                        ? "Kamera nije dostupna"
                        : "Pokrećemo kameru..."}
                    </strong>

                    <p>
                      {cameraError ||
                        "Dozvoli pristup kameri ako browser zatraži. Ako ne želiš, koristi fotografiju iz galerije."}
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
            <div className="captureVignette" />

            <header className="captureHeader">
              <Link to="/explore" className="captureBack">
                <span className="captureHeaderIcon">
                  <Icon name="arrowLeft" size={17} />
                </span>

                <div>
                  <small>NAZAD</small>
                  <strong>Explore mapa</strong>
                </div>
              </Link>

              <div className="captureTopStatus">
                <div className="captureGpsPill">
                  <span
                    className={`captureGpsDot ${gpsStatus}`}
                  />

                  <div>
                    <small>GPS SIGNAL</small>

                    <strong>
                      {gpsStatus === "found"
                        ? "Lokacija sačuvana"
                        : gpsStatus === "locating"
                          ? "Pronalazimo te..."
                          : "GPS nije dostupan"}
                    </strong>
                  </div>
                </div>

                {photoUrl && (
                  <div className="capturePhotoReady">
                    <Icon name="check" size={14} />
                    Fotografija spremna
                  </div>
                )}
              </div>
            </header>

            {!photoUrl && (
              <div className="captureIntro">
                <div className="captureEyebrow">
                  <span>
                    <Icon name="sparkle" size={13} />
                  </span>

                  <div>
                    <small>NOVO OTKRIĆE</small>
                    <strong>Capture + GPS</strong>
                  </div>
                </div>

                <h1>
                  Slikaj.
                  <br />
                  <em>Mi pamtimo gde.</em>
                </h1>

                <p>
                  Jedna fotografija pokreće sve. GPS čuva lokaciju, a ti samo dodaš ono što sledećem čoveku stvarno znači.
                </p>

                <div className="captureIntroMeta">
                  <span>
                    <Icon name="navigation" size={14} />
                    GPS automatski
                  </span>

                  <span>
                    <Icon name="shield" size={14} />
                    Sensitive zone zaštita
                  </span>

                  <span>
                    <Icon name="layers" size={14} />
                    Community moderation
                  </span>
                </div>
              </div>
            )}

            {!photoUrl && (
              <div className="captureControls">
                <div className="captureControlLabel">
                  <small>01</small>
                  <span>FOTOGRAFIJA</span>
                </div>

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
                  <i />
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

                <div className="captureControlLabel right">
                  <small>02</small>
                  <span>DETALJI</span>
                </div>
              </div>
            )}

            {photoUrl && (
              <div className="capturePreviewActions">
                <button
                  type="button"
                  onClick={retakePhoto}
                >
                  <span>
                    <Icon name="camera" size={16} />
                  </span>

                  <div>
                    <small>FOTOGRAFIJA</small>
                    <strong>Snimi ponovo</strong>
                  </div>
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    setDetailsOpen((value) => !value)
                  }
                >
                  <span>
                    <Icon name="wand" size={16} />
                  </span>

                  <div>
                    <small>SLEDEĆI KORAK</small>
                    <strong>
                      {detailsOpen
                        ? "Sakrij detalje"
                        : "Dodaj detalje"}
                    </strong>
                  </div>
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

            <canvas ref={canvasRef} hidden />
          </div>

          {photoUrl && (
            <section
              className={`captureDetails ${
                detailsOpen ? "open" : ""
              }`}
            >
              <div className="captureDetailsGlow" />
              <div className="captureDetailsHandle" />

              <header>
                <div>
                  <span className="captureDetailsEyebrow">
                    <Icon name="sparkle" size={13} />
                    OSTAVI TRAG
                  </span>

                  <h2>Šta smo pronašli?</h2>

                  <p>
                    Minimum podataka, maksimum korisnosti za sledećeg ko dolazi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                >
                  <Icon name="close" size={18} />
                </button>
              </header>

              <div className="captureStatusRow">
                <article className="gps">
                  <span className="captureStatusIcon">
                    <Icon
                      name="navigation"
                      size={17}
                    />
                  </span>

                  <div>
                    <span>GPS</span>

                    <strong>
                      {point
                        ? `${point.latitude.toFixed(
                            5
                          )}, ${point.longitude.toFixed(5)}`
                        : "Čeka lokaciju"}
                    </strong>

                    <small>
                      {point?.accuracy
                        ? `Preciznost ±${Math.round(
                            point.accuracy
                          )} m`
                        : "Čekamo preciznost"}
                    </small>
                  </div>
                </article>

                <article
                  className={
                    protection?.status === "block"
                      ? "blocked"
                      : protection?.status === "approximate"
                        ? "protected"
                        : "safe"
                  }
                >
                  <span className="captureStatusIcon">
                    <Icon
                      name={
                        protection?.status === "block"
                          ? "alert"
                          : "shield"
                      }
                      size={17}
                    />
                  </span>

                  <div>
                    <span>ZAŠTITA</span>

                    <strong>
                      {checkingLocation
                        ? "Provera..."
                        : protection?.status === "block"
                          ? "Blokirano"
                          : protection?.status === "approximate"
                            ? "Lokacija zaštićena"
                            : "Dozvoljeno"}
                    </strong>

                    <small>
                      {protection?.status === "approximate"
                        ? "Precizna GPS tačka ostaje privatna"
                        : "Automatska security provera"}
                    </small>
                  </div>
                </article>
              </div>

              {protection?.status === "block" && (
                <div className="captureWarning">
                  <span>
                    <Icon name="alert" size={18} />
                  </span>

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
                  <div className="captureNearbyHead">
                    <div>
                      <span>
                        <Icon name="search" size={15} />
                      </span>

                      <div>
                        <small>DUPLICATE CHECK</small>
                        <strong>
                          Da li ovo mesto već postoji?
                        </strong>
                      </div>
                    </div>

                    <b>
                      {nearby.length} u 500 m
                    </b>
                  </div>

                  <div className="captureNearbyList">
                    {nearby.slice(0, 3).map((place) => (
                      <Link
                        key={place.id}
                        to={`/explore/${place.id}`}
                      >
                        <span>
                          {Math.round(place.distance_m)} m
                        </span>

                        <strong>{place.name}</strong>

                        <i>
                          <Icon
                            name="arrowRight"
                            size={13}
                          />
                        </i>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <section className="captureFormSection">
                <div className="captureSectionHead">
                  <div>
                    <span>01</span>

                    <div>
                      <small>OSNOVNO</small>
                      <strong>Identitet mesta</strong>
                    </div>
                  </div>

                  <em>2 obavezna polja</em>
                </div>

                <div className="captureFields">
                  <label className="wide">
                    <span>
                      Naziv
                      <b>*</b>
                    </span>

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
                    <span>
                      Kategorija
                      <b>*</b>
                    </span>

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
                </div>
              </section>

              <section className="captureFormSection compact">
                <div className="captureSectionHead">
                  <div>
                    <span>02</span>

                    <div>
                      <small>KORISNO</small>
                      <strong>Brzi kontekst</strong>
                    </div>
                  </div>

                  <em>opciono</em>
                </div>

                <div className="captureFields">
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
              </section>

              <section className="captureHostTag">
                <div className="captureHostTagHead">
                  <div>
                    <span className="captureHostIcon">
                      <Icon name="user" size={17} />
                    </span>

                    <div>
                      <small>03 · DOMAĆIN</small>

                      <strong>
                        Bio/la si kod nekoga?
                      </strong>

                      <p>
                        Opciono. Tag možeš ukloniti pre objave.
                      </p>
                    </div>
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
                      Ukloni
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

                    <span className="captureHostCheck">
                      <Icon
                        name="check"
                        size={17}
                      />
                    </span>
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

                          <i>
                            <Icon
                              name="plus"
                              size={15}
                            />
                          </i>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {error && (
                <div className="captureError">
                  <span>
                    <Icon name="alert" size={17} />
                  </span>

                  <div>
                    <strong>Nešto treba proveriti</strong>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <div className="capturePublishBar">
                <div className="capturePublishMeta">
                  <span>
                    <Icon name="sparkle" size={16} />
                  </span>

                  <div>
                    <small>COMMUNITY PIN</small>

                    <strong>
                      Fotografija + GPS + trag
                    </strong>

                    <em>
                      {canPublish
                        ? "Spremno za objavu"
                        : "Dodaj naziv i kategoriju"}
                    </em>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canPublish}
                  onClick={createPlace}
                >
                  <span>
                    {saving
                      ? "Objavljujemo..."
                      : "Objavi mesto"}
                  </span>

                  <i>
                    <Icon
                      name="arrowRight"
                      size={16}
                    />
                  </i>
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
      .captureShade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(2,9,5,.7),transparent 22%,transparent 54%,rgba(2,9,5,.88)),linear-gradient(90deg,rgba(2,9,5,.38),transparent 42%)}
      .captureVignette{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 130px rgba(2,9,5,.35)}
      .captureHeader{position:absolute;top:104px;right:20px;left:20px;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:14px}
      .captureBack{display:flex!important;align-items:center;gap:9px;min-height:46px;padding:6px 11px 6px 7px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:linear-gradient(145deg,rgba(3,12,6,.68),rgba(10,27,16,.52));color:#fff!important;box-shadow:0 14px 34px rgba(0,0,0,.18);backdrop-filter:blur(24px)}
      .captureHeaderIcon{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(255,255,255,.06)}
      .captureBack small,.captureBack strong{display:block}
      .captureBack small{color:rgba(255,255,255,.34);font-size:5px;font-weight:900;letter-spacing:.11em}
      .captureBack strong{margin-top:2px;font-size:7px}
      .captureTopStatus{display:flex;align-items:center;gap:7px}
      .captureGpsPill{display:flex;align-items:center;gap:9px;padding:9px 12px;border:1px solid rgba(255,255,255,.13);border-radius:15px;background:linear-gradient(145deg,rgba(3,12,6,.68),rgba(10,27,16,.5));box-shadow:0 14px 34px rgba(0,0,0,.16);backdrop-filter:blur(24px)}
      .captureGpsDot{width:9px;height:9px;border-radius:50%;background:#89948c}
      .captureGpsDot.locating{background:#f1d17f;box-shadow:0 0 0 5px rgba(241,209,127,.1);animation:capturePulse 1.4s ease-in-out infinite}
      .captureGpsDot.found{background:#baff9e;box-shadow:0 0 0 5px rgba(186,255,158,.12)}
      .captureGpsDot.error{background:#ff9588;box-shadow:0 0 0 5px rgba(255,149,136,.1)}
      .captureGpsPill small,.captureGpsPill strong{display:block}
      .captureGpsPill small{color:rgba(255,255,255,.34);font-size:5px;font-weight:900;letter-spacing:.1em}
      .captureGpsPill strong{margin-top:2px;font-size:7px}
      .capturePhotoReady{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 10px;border:1px solid rgba(186,255,158,.18);border-radius:13px;background:rgba(186,255,158,.08);color:#dfffd1;font-size:6px;font-weight:850;backdrop-filter:blur(20px)}
      .captureIntro{position:absolute;left:5vw;bottom:138px;z-index:12;max-width:720px}
      .captureEyebrow{display:inline-flex;align-items:center;gap:9px}
      .captureEyebrow>span{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(186,255,158,.16);border-radius:11px;background:rgba(186,255,158,.08);color:#baff9e}
      .captureEyebrow small,.captureEyebrow strong{display:block}
      .captureEyebrow small{color:#baff9e;font-size:6px;font-weight:950;letter-spacing:.12em}
      .captureEyebrow strong{margin-top:2px;color:rgba(255,255,255,.58);font-size:6px}
      .captureIntro h1{margin:16px 0 0;font-size:clamp(62px,8.3vw,112px);line-height:.82;letter-spacing:-.082em}
      .captureIntro h1 em{color:#baff9e;font-style:normal}
      .captureIntro p{max-width:560px;margin:20px 0 0;color:rgba(255,255,255,.56);font-size:11px;line-height:1.72}
      .captureIntroMeta{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}
      .captureIntroMeta span{display:inline-flex;align-items:center;gap:6px;min-height:31px;padding:0 9px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(3,12,6,.42);color:rgba(255,255,255,.66);font-size:6px;font-weight:800;backdrop-filter:blur(14px)}
      .captureControls{position:absolute;right:0;bottom:24px;left:0;z-index:20;display:grid;grid-template-columns:auto 54px 86px 54px auto;align-items:center;justify-content:center;gap:18px}
      .captureControlLabel{display:grid;justify-items:end;gap:2px;color:rgba(255,255,255,.5)}
      .captureControlLabel.right{justify-items:start}
      .captureControlLabel small{color:#baff9e;font-size:5px;font-weight:900}
      .captureControlLabel span{font-size:5px;font-weight:850;letter-spacing:.08em}
      .captureGallery,.captureFlip{display:grid;place-items:center;width:54px;height:54px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:linear-gradient(145deg,rgba(3,12,6,.66),rgba(11,30,17,.54));color:#fff;cursor:pointer;box-shadow:0 14px 32px rgba(0,0,0,.2);backdrop-filter:blur(22px);transition:transform .18s ease,border-color .18s ease}
      .captureGallery:hover,.captureFlip:hover{transform:translateY(-2px);border-color:rgba(186,255,158,.28)}
      .captureShutter{position:relative;display:grid;place-items:center;width:86px;height:86px;border:4px solid rgba(255,255,255,.94);border-radius:50%;background:rgba(3,12,6,.22);cursor:pointer;box-shadow:0 15px 38px rgba(0,0,0,.3);backdrop-filter:blur(12px)}
      .captureShutter>span{width:64px;height:64px;border-radius:50%;background:#fff;transition:.16s ease}
      .captureShutter>i{position:absolute;inset:-10px;border:1px solid rgba(186,255,158,.2);border-radius:50%;animation:captureShutterHalo 2s ease-in-out infinite}
      .captureShutter:hover>span{transform:scale(.9)}
      .captureShutter:disabled{cursor:not-allowed;opacity:.4}
      @keyframes captureShutterHalo{0%,100%{opacity:.25;transform:scale(.95)}50%{opacity:.8;transform:scale(1.04)}}
      .captureCameraFallback{position:absolute;inset:0;z-index:8;display:grid;place-items:center;align-content:center;padding:24px;text-align:center}
      .captureCameraFallback>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(12px) saturate(.8);transform:scale(1.06)}
      .captureCameraFallback>div{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,rgba(30,81,48,.16),transparent 26%),rgba(3,12,6,.84)}
      .captureFallbackIcon,.captureFallbackKicker,.captureCameraFallback>strong,.captureCameraFallback>p,.captureCameraFallback>button{position:relative;z-index:2}
      .captureFallbackIcon{display:grid;place-items:center;width:74px;height:74px;border:1px solid rgba(186,255,158,.16);border-radius:23px;background:rgba(186,255,158,.09);color:#baff9e;box-shadow:0 18px 46px rgba(0,0,0,.16)}
      .captureFallbackKicker{margin-top:15px;color:#baff9e;font-size:6px;font-weight:950;letter-spacing:.12em}
      .captureCameraFallback>strong{margin-top:7px;font-size:24px;letter-spacing:-.04em}
      .captureCameraFallback>p{max-width:470px;margin:8px 0 0;color:rgba(255,255,255,.48);font-size:9px;line-height:1.6}
      .captureCameraFallback>button{display:inline-flex;align-items:center;gap:7px;justify-self:center;margin-top:17px;min-height:43px;padding:0 14px;border:1px solid rgba(186,255,158,.26);border-radius:13px;background:rgba(186,255,158,.1);color:#dfffd1;cursor:pointer;font-size:8px;font-weight:850}
      .capturePreviewActions{position:absolute;right:20px;bottom:20px;z-index:20;display:flex;gap:8px}
      .capturePreviewActions button{display:grid;grid-template-columns:34px auto;align-items:center;gap:8px;min-height:48px;padding:6px 12px 6px 7px;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:linear-gradient(145deg,rgba(3,12,6,.68),rgba(11,30,17,.56));color:#fff;cursor:pointer;box-shadow:0 16px 36px rgba(0,0,0,.22);backdrop-filter:blur(22px)}
      .capturePreviewActions button>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(255,255,255,.06)}
      .capturePreviewActions button small,.capturePreviewActions button strong{display:block;text-align:left}
      .capturePreviewActions button small{color:rgba(255,255,255,.32);font-size:5px;font-weight:900;letter-spacing:.08em}
      .capturePreviewActions button strong{margin-top:2px;font-size:7px}
      .capturePreviewActions .primary{border-color:#baff9e;background:#baff9e;color:#102619}
      .capturePreviewActions .primary>span{background:rgba(16,38,25,.08)}
      .captureDetails{position:fixed;top:0;right:0;bottom:0;z-index:40;width:min(560px,95vw);padding:116px 20px 20px;overflow-y:auto;background:linear-gradient(180deg,rgba(6,19,11,.975),rgba(7,20,12,.997));box-shadow:-32px 0 90px rgba(0,0,0,.42);transform:translateX(100%);transition:.3s cubic-bezier(.2,.72,.2,1);backdrop-filter:blur(30px) saturate(145%)}
      .captureDetails.open{transform:translateX(0)}
      .captureDetailsGlow{position:absolute;top:-120px;left:-80px;width:280px;height:280px;border-radius:50%;background:rgba(186,255,158,.07);filter:blur(70px);pointer-events:none}
      .captureDetailsHandle{display:none}
      .captureDetails>header{position:relative;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.085)}
      .captureDetailsEyebrow{display:inline-flex!important;align-items:center;gap:6px;color:#baff9e!important;font-size:6px!important;font-weight:900!important;letter-spacing:.11em}
      .captureDetails>header h2{margin:7px 0 0;font-size:31px;letter-spacing:-.055em}
      .captureDetails>header p{max-width:380px;margin:6px 0 0;color:rgba(255,255,255,.38);font-size:7px;line-height:1.5}
      .captureDetails>header>button{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.05);color:#fff;cursor:pointer}
      .captureStatusRow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
      .captureStatusRow article{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:9px;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.035)}
      .captureStatusRow article.gps{color:#baff9e}
      .captureStatusRow article.safe{color:#baff9e}
      .captureStatusRow article.protected{color:#f1d17f}
      .captureStatusRow article.blocked{color:#ff9d91}
      .captureStatusIcon{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:currentColor;color:#102619}
      .captureStatusRow article>div>span,.captureStatusRow article>div>strong,.captureStatusRow article>div>small{display:block}
      .captureStatusRow article>div>span{color:rgba(255,255,255,.3);font-size:5px;font-weight:900;letter-spacing:.08em}
      .captureStatusRow article>div>strong{margin-top:3px;overflow:hidden;color:#fff;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
      .captureStatusRow article>div>small{margin-top:3px;color:rgba(255,255,255,.34);font-size:5px}
      .captureWarning{display:grid;grid-template-columns:40px minmax(0,1fr);gap:9px;margin-top:10px;padding:11px;border:1px solid rgba(255,148,130,.22);border-radius:13px;background:rgba(255,90,70,.08);color:#ffb2a8}
      .captureWarning>span{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:rgba(255,90,70,.12)}
      .captureWarning strong{display:block;font-size:8px}
      .captureWarning p{margin:4px 0 0;color:rgba(255,255,255,.46);font-size:7px;line-height:1.45}
      .captureNearby{margin-top:10px;padding:12px;border:1px solid rgba(241,209,127,.16);border-radius:14px;background:rgba(241,209,127,.055)}
      .captureNearbyHead{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .captureNearbyHead>div{display:flex;align-items:center;gap:8px}
      .captureNearbyHead>div>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:rgba(241,209,127,.09);color:#f1d17f}
      .captureNearbyHead small,.captureNearbyHead strong{display:block}
      .captureNearbyHead small{color:#f1d17f;font-size:5px;font-weight:900;letter-spacing:.08em}
      .captureNearbyHead strong{margin-top:2px;font-size:7px}
      .captureNearbyHead>b{padding:6px 8px;border-radius:999px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.43);font-size:5px}
      .captureNearbyList{display:grid;gap:6px;margin-top:9px}
      .captureNearbyList a{display:grid;grid-template-columns:48px minmax(0,1fr) 28px;align-items:center;gap:8px;padding:8px;border:1px solid rgba(255,255,255,.05);border-radius:11px;background:rgba(255,255,255,.035)}
      .captureNearbyList a>span{color:#f1d17f;font-size:6px;font-weight:850}
      .captureNearbyList a>strong{overflow:hidden;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
      .captureNearbyList a>i{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,.04);color:#f1d17f}
      .captureFormSection{margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,.075);border-radius:15px;background:rgba(255,255,255,.025)}
      .captureFormSection.compact{margin-top:9px}
      .captureSectionHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      .captureSectionHead>div{display:flex;align-items:center;gap:8px}
      .captureSectionHead>div>span{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:rgba(186,255,158,.08);color:#baff9e;font-size:6px;font-weight:900}
      .captureSectionHead small,.captureSectionHead strong{display:block}
      .captureSectionHead small{color:rgba(255,255,255,.3);font-size:5px;font-weight:900;letter-spacing:.08em}
      .captureSectionHead strong{margin-top:2px;font-size:8px}
      .captureSectionHead em{color:rgba(255,255,255,.28);font-size:5px;font-style:normal}
      .captureFields{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .captureFields label{display:grid;gap:6px;min-width:0}
      .captureFields label.wide{grid-column:1/-1}
      .captureFields label>span{display:flex;align-items:center;gap:4px;color:rgba(255,255,255,.47);font-size:6px;font-weight:850}
      .captureFields label>span b{color:#baff9e}
      .captureFields input,.captureFields textarea,.captureFields select{width:100%;min-width:0;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.05);color:#fff;outline:0;font-size:8px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}
      .captureFields input,.captureFields select{min-height:44px;padding:0 11px}
      .captureFields textarea{min-height:104px;padding:11px;resize:vertical;line-height:1.58}
      .captureFields select option{color:#111}
      .captureFields input::placeholder,.captureFields textarea::placeholder{color:rgba(255,255,255,.23)}
      .captureFields input:focus,.captureFields textarea:focus,.captureFields select:focus{border-color:rgba(186,255,158,.46);background:rgba(255,255,255,.065);box-shadow:0 0 0 3px rgba(186,255,158,.07)}
      .captureHostTag{margin-top:10px;padding:12px;border:1px solid rgba(186,255,158,.12);border-radius:15px;background:linear-gradient(145deg,rgba(186,255,158,.05),rgba(255,255,255,.02))}
      .captureHostTagHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .captureHostTagHead>div:first-child{display:flex;align-items:flex-start;gap:9px}
      .captureHostIcon{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:12px;background:rgba(186,255,158,.08);color:#baff9e}
      .captureHostTagHead small,.captureHostTagHead strong,.captureHostTagHead p{display:block}
      .captureHostTagHead small{color:#baff9e;font-size:5px;font-weight:900;letter-spacing:.08em}
      .captureHostTagHead strong{margin-top:3px;font-size:9px}
      .captureHostTagHead p{margin:3px 0 0;color:rgba(255,255,255,.34);font-size:6px}
      .captureHostTagHead>button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#ffaaa0;cursor:pointer;font-size:6px;font-weight:850}
      .captureHostSearch{display:flex;align-items:center;gap:7px;margin-top:11px;min-height:42px;padding:0 10px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.42)}
      .captureHostSearch input{width:100%;border:0;outline:0;background:transparent;color:#fff;font-size:7px}
      .captureHostResults{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}
      .captureHostResults>button{display:grid;grid-template-columns:38px minmax(0,1fr) 28px;align-items:center;gap:8px;padding:7px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.035);color:#fff;text-align:left;cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease}
      .captureHostResults>button:hover{transform:translateY(-1px);border-color:rgba(186,255,158,.2);background:rgba(186,255,158,.055)}
      .captureHostResults img,.captureHostResults>button>span{width:38px;height:38px;border-radius:10px}
      .captureHostResults img{object-fit:cover}
      .captureHostResults>button>span{display:grid;place-items:center;background:rgba(186,255,158,.08);color:#baff9e}
      .captureHostResults strong,.captureHostResults small{display:block}
      .captureHostResults strong{overflow:hidden;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
      .captureHostResults small{margin-top:2px;color:rgba(255,255,255,.34);font-size:5px}
      .captureHostResults i{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,.04);color:#baff9e}
      .captureSelectedHost{display:grid;grid-template-columns:44px minmax(0,1fr) 32px;align-items:center;gap:9px;margin-top:11px;padding:9px;border:1px solid rgba(186,255,158,.18);border-radius:12px;background:rgba(186,255,158,.07)}
      .captureSelectedHost>img,.captureSelectedHost>span{width:44px;height:44px;border-radius:11px}
      .captureSelectedHost>img{object-fit:cover}
      .captureSelectedHost>span{display:grid;place-items:center;background:rgba(186,255,158,.09);color:#baff9e}
      .captureSelectedHost small,.captureSelectedHost strong,.captureSelectedHost em{display:block}
      .captureSelectedHost small{color:#baff9e;font-size:5px;font-weight:900}
      .captureSelectedHost strong{margin-top:2px;color:#fff;font-size:8px}
      .captureSelectedHost em{margin-top:2px;color:rgba(255,255,255,.35);font-size:6px;font-style:normal}
      .captureHostCheck{display:grid!important;place-items:center!important;width:32px!important;height:32px!important;border-radius:10px!important;background:#baff9e!important;color:#102619!important}
      .captureError{display:grid;grid-template-columns:38px minmax(0,1fr);gap:9px;margin-top:10px;padding:10px;border:1px solid rgba(255,148,130,.2);border-radius:12px;background:rgba(255,90,70,.08);color:#ffb2a8}
      .captureError>span{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:rgba(255,90,70,.1)}
      .captureError strong,.captureError p{display:block}
      .captureError strong{font-size:7px}
      .captureError p{margin:3px 0 0;color:rgba(255,255,255,.46);font-size:6px;line-height:1.45}
      .capturePublishBar{position:sticky;bottom:-20px;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:13px -20px -20px;padding:13px 20px 18px;border-top:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(7,20,12,.78),#07140c 28%)}
      .capturePublishMeta{display:flex;align-items:center;gap:9px;min-width:0}
      .capturePublishMeta>span{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:12px;background:rgba(186,255,158,.09);color:#baff9e}
      .capturePublishMeta small,.capturePublishMeta strong,.capturePublishMeta em{display:block}
      .capturePublishMeta small{color:#baff9e;font-size:5px;font-weight:900;letter-spacing:.08em}
      .capturePublishMeta strong{margin-top:2px;font-size:7px}
      .capturePublishMeta em{margin-top:2px;color:rgba(255,255,255,.3);font-size:5px;font-style:normal}
      .capturePublishBar>button{display:grid;grid-template-columns:1fr 32px;align-items:center;gap:9px;min-height:44px;padding:0 7px 0 13px;border:0;border-radius:12px;background:#baff9e;color:#102619;cursor:pointer;font-size:8px;font-weight:900;box-shadow:0 16px 34px rgba(87,172,68,.15)}
      .capturePublishBar>button i{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:rgba(16,38,25,.08)}
      .capturePublishBar>button:disabled{cursor:not-allowed;opacity:.38;box-shadow:none}
      .captureState{display:grid;place-items:center;align-content:center;gap:9px;padding:24px;background:radial-gradient(circle at 50% 42%,rgba(186,255,158,.1),transparent 19%),#e8ece4;color:#1f3127;text-align:center}
      .captureStateIcon{display:grid;place-items:center;width:68px;height:68px;border-radius:21px;background:#173b27;color:#baff9e}
      .captureStateKicker{color:#5c7948;font-size:7px;font-weight:900;letter-spacing:.12em}
      .captureState h1{margin:4px 0 0;font-size:31px;letter-spacing:-.05em}
      .captureState p{max-width:420px;margin:0;color:#738078;font-size:9px;line-height:1.55}
      .captureState a{display:inline-flex;align-items:center;gap:6px;margin-top:5px;padding:12px 14px;border-radius:12px;background:#173b27;color:#fff;text-decoration:none;font-size:8px;font-weight:850}

      @keyframes capturePulse{
        0%,100%{opacity:.45;transform:scale(.95)}
        50%{opacity:1;transform:scale(1.05)}
      }

      @media(max-width:760px){
        .captureHeader{top:80px;right:10px;left:10px}
        .captureBack{width:42px;height:42px;min-height:42px;padding:0;display:grid!important;place-items:center}
        .captureBack .captureHeaderIcon{width:auto;height:auto;background:transparent}
        .captureBack>div{display:none}
        .captureTopStatus{margin-left:auto}
        .capturePhotoReady{display:none}
        .captureIntro{right:18px;bottom:142px;left:18px}
        .captureIntro h1{font-size:56px}
        .captureIntro p{font-size:9px}
        .captureIntroMeta{display:none}
        .captureControls{grid-template-columns:52px 84px 52px;gap:18px}
        .captureControlLabel{display:none}
        .capturePreviewActions{right:10px;bottom:10px;left:10px}
        .capturePreviewActions button{flex:1}
        .captureDetails{top:auto;right:0;bottom:0;left:0;width:100%;max-height:82vh;padding:14px 12px 12px;border-radius:26px 26px 0 0;box-shadow:0 -28px 80px rgba(0,0,0,.4);transform:translateY(100%)}
        .captureDetails.open{transform:translateY(0)}
        .captureDetailsHandle{display:block;width:44px;height:4px;margin:0 auto 12px;border-radius:999px;background:rgba(255,255,255,.2)}
        .captureDetails>header{position:sticky;top:-14px;z-index:6;padding-top:5px;background:#07140c}
        .capturePublishBar{bottom:-12px;margin-right:-12px;margin-left:-12px;padding:11px 12px 13px}
        .captureHostResults{grid-template-columns:1fr}
      }

      @media(max-width:500px){
        .captureGpsPill{padding:8px 9px}
        .captureGpsPill strong{font-size:6px}
        .captureIntro{bottom:138px}
        .captureIntro h1{font-size:49px}
        .captureEyebrow strong{display:none}
        .captureControls{grid-template-columns:50px 80px 50px;gap:15px}
        .captureGallery,.captureFlip{width:50px;height:50px}
        .captureShutter{width:80px;height:80px}
        .captureShutter>span{width:58px;height:58px}
        .captureStatusRow{grid-template-columns:1fr}
        .captureFields{grid-template-columns:1fr}
        .captureFields label.wide{grid-column:auto}
        .captureNearbyHead{align-items:flex-start}
        .captureNearbyHead>b{white-space:nowrap}
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
