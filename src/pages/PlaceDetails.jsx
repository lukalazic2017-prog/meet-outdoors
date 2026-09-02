import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  MapContainer,
  Marker,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import SeoHead from "../seo/SeoHead";
import {
  getPendingCheckins,
  queueOfflineCheckin,
  syncPendingCheckins,
} from "../utils/offlineCheckins";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1800&auto=format&fit=crop";
const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=Explorer";

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
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    navigation: <path d="m3 11 18-8-8 18-2-8-8-2Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
        <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
        <path d="M12 13v4M8 21h8M9 17h6" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
      </>
    ),
    offline: (
      <>
        <path d="M3 3l18 18" />
        <path d="M8.5 8.5A7.8 7.8 0 0 1 12 7c3.2 0 6 1.7 7.5 4.2" />
        <path d="M5 11.5A11 11 0 0 1 7 9.7M4 7.8A14 14 0 0 1 5.7 6.5M10.3 14.3A2.8 2.8 0 0 1 12 13.8c1.4 0 2.6.8 3.2 1.9" />
        <path d="M12 19h.01" />
      </>
    ),
    sync: (
      <>
        <path d="M20 7h-5V2" />
        <path d="M20 7a8 8 0 0 0-13.5-2M4 17h5v5" />
        <path d="M4 17a8 8 0 0 0 13.5 2" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
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

const markerIcon = L.divIcon({
  className: "detailPinShell",
  html: `<div class="detailPin"><span>●</span><i></i></div>`,
  iconSize: [54, 64],
  iconAnchor: [27, 58],
});

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PlaceDetails() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const fileRef = useRef(null);
  const syncInFlightRef = useRef(false);

  const [place, setPlace] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [comments, setComments] = useState([]);
  const [saved, setSaved] = useState(false);
  const [myCheckin, setMyCheckin] = useState(null);
  const [pendingHere, setPendingHere] = useState(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );
  const [syncing, setSyncing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [removingPlace, setRemovingPlace] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPlace = useCallback(async () => {
    let query = supabase
      .from("places")
      .select(`
        *,
        place_categories:category_id (
          id,
          name,
          code
        )
      `);

    if (slug) {
      query = query.eq("slug", slug);
    } else {
      query = query.eq("id", id);
    }

    const { data, error: placeError } = await query.single();

    if (placeError) throw placeError;

    setPlace(data);
    return data;
  }, [id, slug]);

  const loadCommunity = useCallback(async (targetPlaceId) => {
    if (!targetPlaceId) return;

    const [
      checkinsResult,
      photosResult,
      commentsResult,
    ] = await Promise.all([
      supabase
        .from("place_checkins")
        .select(`
          id,
          user_id,
          caption,
          visited_at,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("place_id", targetPlaceId)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("place_photos")
        .select(`
          id,
          image_url,
          caption,
          user_id,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("place_id", targetPlaceId)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("place_comments")
        .select(`
          id,
          body,
          created_at,
          user_id,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("place_id", targetPlaceId)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (!checkinsResult.error) setCheckins(checkinsResult.data || []);
    if (!photosResult.error) setPhotos(photosResult.data || []);
    if (!commentsResult.error) setComments(commentsResult.data || []);
  }, []);

  const loadMine = useCallback(async (targetPlaceId) => {
    if (!profile?.id || !targetPlaceId) {
      setSaved(false);
      setMyCheckin(null);
      return;
    }

    const [saveResult, checkinResult] = await Promise.all([
      supabase
        .from("place_saves")
        .select("id")
        .eq("place_id", targetPlaceId)
        .eq("user_id", profile.id)
        .maybeSingle(),

      supabase
        .from("place_checkins")
        .select("id, created_at")
        .eq("place_id", targetPlaceId)
        .eq("user_id", profile.id)
        .eq("is_gps_verified", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!saveResult.error) setSaved(Boolean(saveResult.data));
    if (!checkinResult.error) setMyCheckin(checkinResult.data || null);
  }, [profile?.id]);

  const refreshPending = useCallback(async (targetPlaceId) => {
    if (!profile?.id || !targetPlaceId) {
      setPendingHere(null);
      setPendingTotal(0);
      return;
    }

    try {
      const items = await getPendingCheckins(profile.id);
      setPendingTotal(items.length);
      setPendingHere(
        items.find((item) => item.place_id === targetPlaceId) || null
      );
    } catch (pendingError) {
      console.warn("Offline queue:", pendingError);
    }
  }, [profile?.id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const loadedPlace = await loadPlace();
      const targetPlaceId = loadedPlace?.id;

      await Promise.all([
        loadCommunity(targetPlaceId),
        loadMine(targetPlaceId),
        refreshPending(targetPlaceId),
      ]);
    } catch (loadError) {
      setPlace(null);
      setError(
        loadError?.message ||
          "Mesto trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }, [
    loadCommunity,
    loadMine,
    loadPlace,
    refreshPending,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const syncOffline = useCallback(
    async ({ silent = false } = {}) => {
      const targetPlaceId = place?.id;

      if (
        !profile?.id ||
        !targetPlaceId ||
        !navigator.onLine ||
        syncInFlightRef.current
      ) {
        return;
      }

      syncInFlightRef.current = true;
      setSyncing(true);

      try {
        const result = await syncPendingCheckins(profile.id);

        await refreshPending(targetPlaceId);

        if (result.synced > 0) {
          await Promise.all([
            loadPlace(),
            loadCommunity(targetPlaceId),
            loadMine(targetPlaceId),
          ]);

          setNotice(
            result.synced === 1
              ? "Offline check-in je automatski sinhronizovan ✓"
              : `${result.synced} offline check-ina su sinhronizovana ✓`
          );
        } else if (result.failed > 0 && !silent) {
          setError(
            "Internet se vratio, ali jedan offline check-in još nije mogao da se potvrdi."
          );
        }
      } catch (syncError) {
        if (!silent) {
          setError(
            syncError?.message ||
              "Offline check-in trenutno nije moguće sinhronizovati."
          );
        }
      } finally {
        syncInFlightRef.current = false;
        setSyncing(false);
      }
    },
    [
      loadCommunity,
      loadMine,
      loadPlace,
      place?.id,
      profile?.id,
      refreshPending,
    ]
  );

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      syncOffline();
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncOffline]);

  useEffect(() => {
    if (profile?.id && navigator.onLine) {
      syncOffline({ silent: true });
    }
  }, [profile?.id, syncOffline]);

  async function removeOwnPlace() {
    if (!profile?.id || !place?.id) return;

    if (place.created_by !== profile.id) {
      setError("Samo autor može da ukloni ovo mesto.");
      return;
    }

    const confirmed = window.confirm(
      "Da li sigurno želiš da ukloniš ovo mesto sa MeetOutdoors mape? Mesto neće biti trajno obrisano i ostaje sačuvano u sistemu."
    );

    if (!confirmed) return;

    try {
      setRemovingPlace(true);
      setError("");
      setNotice("");

      const { error: removeError } = await supabase.rpc(
        "remove_own_place",
        {
          p_place_id: place.id,
        }
      );

      if (removeError) throw removeError;

      navigate("/explore", {
        replace: true,
      });
    } catch (removeError) {
      console.error("Remove place:", removeError);

      setError(
        removeError?.message ||
          "Mesto trenutno nije moguće ukloniti."
      );
    } finally {
      setRemovingPlace(false);
    }
  }

  async function toggleSave() {
    if (!profile?.id) {
      setError("Prijavi se da sačuvaš mesto.");
      return;
    }

    if (saved) {
      const { error: removeError } = await supabase
        .from("place_saves")
        .delete()
        .eq("place_id", place.id)
        .eq("user_id", profile.id);

      if (!removeError) setSaved(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("place_saves")
      .insert({
        place_id: place.id,
        user_id: profile.id,
      });

    if (!saveError) setSaved(true);
  }

  function checkIn() {
    if (!profile?.id) {
      setError("Prijavi se da napraviš GPS check-in.");
      return;
    }

    if (!navigator.geolocation) {
      setError("GPS nije dostupan.");
      return;
    }

    if (pendingHere) {
      setNotice(
        "Ovaj check-in je već sačuvan offline i čeka internet."
      );
      return;
    }

    setCheckingIn(true);
    setError("");
    setNotice("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const deviceTimestamp = new Date().toISOString();

        const payload = {
          userId: profile.id,
          placeId: place.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          deviceTimestamp,
          caption: null,
          visibility: "public",
        };

        if (!navigator.onLine) {
          try {
            const queued = await queueOfflineCheckin(payload);

            setPendingHere(queued);
            await refreshPending(place.id);

            setNotice(
              "Nema signala — GPS check-in je sačuvan na telefonu i biće poslat automatski čim se internet vrati."
            );
          } catch (queueError) {
            setError(
              queueError?.message ||
                "Offline check-in nije moguće sačuvati."
            );
          } finally {
            setCheckingIn(false);
          }

          return;
        }

        try {
          const { data, error: rpcError } = await supabase.rpc(
            "create_verified_checkin",
            {
              p_place_id: place.id,
              p_latitude: payload.latitude,
              p_longitude: payload.longitude,
              p_accuracy_m: payload.accuracy,
              p_caption: null,
              p_visibility: "public",
              p_device_timestamp: deviceTimestamp,
            }
          );

          if (rpcError) {
            const looksLikeNetworkProblem =
              !navigator.onLine ||
              /fetch|network|failed to fetch/i.test(
                rpcError?.message || ""
              );

            if (looksLikeNetworkProblem) {
              const queued = await queueOfflineCheckin(payload);

              setPendingHere(queued);
              await refreshPending(place.id);

              setNotice(
                "Veza je nestala — check-in smo sačuvali offline. Poslaćemo ga automatski kada se internet vrati."
              );

              return;
            }

            throw rpcError;
          }

          const result = data?.[0];

          setMyCheckin({
            id: result?.checkin_id,
            created_at: deviceTimestamp,
          });

          setNotice(
            `GPS VERIFIED ✓ ${Math.round(
              result?.distance_m || 0
            )} m od lokacije.`
          );

          await Promise.all([
            loadPlace(),
            loadCommunity(place.id),
          ]);
        } catch (checkinError) {
          setError(
            checkinError?.message ||
              "GPS check-in nije uspeo."
          );
        } finally {
          setCheckingIn(false);
        }
      },
      (geoError) => {
        setCheckingIn(false);
        setError(
          geoError?.message ||
            "Lokaciju nije moguće očitati."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !profile?.id || !place) return;

    if (
      !myCheckin &&
      !pendingHere &&
      place.created_by !== profile.id
    ) {
      setError(
        "Fotografiju možeš dodati nakon GPS check-ina."
      );
      return;
    }

    if (!navigator.onLine) {
      setError(
        "Fotografiju ćemo u sledećem koraku dodati u offline red. Za sada je offline podržan GPS check-in."
      );
      return;
    }

    setUploading(true);
    setError("");

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const path = `${profile.id}/${place.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("place-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            file.type || undefined,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } =
        supabase.storage
          .from("place-media")
          .getPublicUrl(path);

      const { error: photoError } =
        await supabase
          .from("place_photos")
          .insert({
            place_id: place.id,
            user_id: profile.id,
            checkin_id:
              myCheckin?.id || null,
            storage_path: path,
            image_url:
              publicData.publicUrl,
            mime_type:
              file.type || null,
            file_size:
              file.size || null,
          });

      if (photoError) {
        await supabase.storage
          .from("place-media")
          .remove([path]);

        throw photoError;
      }

      setNotice("Fotografija je dodata.");

      await Promise.all([
        loadCommunity(place.id),
        loadPlace(),
      ]);
    } catch (uploadPhotoError) {
      setError(
        uploadPhotoError?.message ||
          "Fotografiju nije moguće dodati."
      );
    } finally {
      setUploading(false);
    }
  }

  async function submitComment() {
    const body = comment.trim();

    if (!profile?.id || !body) return;

    if (!navigator.onLine) {
      setError(
        "Komentari trenutno zahtevaju internet."
      );
      return;
    }

    setCommenting(true);

    const { error: commentError } =
      await supabase
        .from("place_comments")
        .insert({
          place_id: place.id,
          user_id: profile.id,
          body,
        });

    setCommenting(false);

    if (commentError) {
      setError(commentError.message);
      return;
    }

    setComment("");
    await loadCommunity(place.id);
  }

  const visitors = useMemo(() => {
    const unique = new Map();

    checkins.forEach((checkin) => {
      if (checkin.profiles?.id) {
        unique.set(
          checkin.profiles.id,
          checkin.profiles
        );
      }
    });

    return Array.from(unique.values());
  }, [checkins]);

  if (loading) {
    return (
      <>
      <SeoHead
  title={`${place.name}${place.region ? ` – ${place.region}` : ""}`}
  description={
    place.short_description ||
    place.description?.slice(0, 155) ||
    `Istraži ${place.name} na MeetOutdoors. Pogledaj lokaciju, pristup, fotografije, savete i informacije za posetu.`
  }
  canonicalPath={`/mesta/${place.slug}`}
  image={photos[0]?.image_url || place.cover_url || FALLBACK_COVER}
  type="article"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.name,
    description:
      place.short_description ||
      place.description ||
      undefined,
    image:
      photos[0]?.image_url ||
      place.cover_url ||
      undefined,
    url: `https://www.meetoutdoors.app/mesta/${place.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality:
        place.locality || place.municipality || undefined,
      addressRegion: place.region || undefined,
      addressCountry: place.country_code || "RS",
    },
    geo:
      place.location_precision === "exact" &&
      place.latitude &&
      place.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: Number(place.latitude),
            longitude: Number(place.longitude),
          }
        : undefined,
  }}
/>

<DetailsStyles />

        <DetailsStyles />

        <main className="detailState">
          <span className="detailStateOrb">
            <Icon name="compass" size={28} />
          </span>

          <small>MEETOUTDOORS</small>
          <strong>Učitavanje mesta...</strong>
          <p>Fotografije, tragovi i community podaci stižu.</p>
        </main>
      </>
    );
  }

  if (!place) {
    return (
      <>
        <DetailsStyles />

        <main className="detailState">
          <span className="detailStateOrb error">
            <Icon name="alert" size={28} />
          </span>

          <small>EXPLORE</small>
          <strong>Mesto nije pronađeno.</strong>

          <Link to="/explore">
            Nazad na mapu
          </Link>
        </main>
      </>
    );
  }

  const heroImage =
    photos[0]?.image_url ||
    place.cover_url ||
    FALLBACK_COVER;

  return (
    <>
      <DetailsStyles />

      <main className="detailPage">
        {!online && (
          <div className="detailOfflineBar">
            <span className="detailOfflineIcon">
              <Icon name="offline" size={15} />
            </span>

            <div>
              <span>OFFLINE MODE</span>
              <strong>GPS check-in i dalje radi.</strong>
            </div>
          </div>
        )}

        {pendingTotal > 0 && (
          <button
            type="button"
            className="detailPendingSync"
            disabled={!online || syncing}
            onClick={() => syncOffline()}
          >
            <span>
              <Icon name="sync" size={15} />
            </span>

            <div>
              <small>OFFLINE QUEUE</small>

              <strong>
                {syncing
                  ? "Sinhronizacija..."
                  : `${pendingTotal} offline ${
                      pendingTotal === 1
                        ? "check-in"
                        : "check-ina"
                    }`}
              </strong>
            </div>
          </button>
        )}

        <section
          className="detailHero"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(5,17,10,.06),rgba(5,17,10,.96)),url(${heroImage})`,
          }}
        >
          <div className="detailHeroNoise" />

          <div className="detailHeroTop">
            <Link
              to="/explore"
              className="detailBack"
            >
              <span>
                <Icon
                  name="arrowLeft"
                  size={16}
                />
              </span>

              <div>
                <small>NAZAD</small>
                <strong>Explore mapa</strong>
              </div>
            </Link>

            <div className="detailHeroStatus">
              <span>
                <Icon
                  name={
                    place.location_precision === "exact"
                      ? "navigation"
                      : "shield"
                  }
                  size={15}
                />
              </span>

              <div>
                <small>LOKACIJA</small>

                <strong>
                  {place.location_precision === "exact"
                    ? "GPS tačka"
                    : "Zaštićena tačka"}
                </strong>
              </div>
            </div>
          </div>

          <div className="detailHeroCopy">
            <div className="detailHeroEyebrow">
              <span>
                <Icon name="sparkle" size={13} />
              </span>

              <div>
                <small>MEETOUTDOORS PLACE</small>

                <strong>
                  {place.place_categories?.name ||
                    "Outdoor mesto"}
                </strong>
              </div>
            </div>

            <h1>{place.name}</h1>

            <p>
              <Icon
                name="mapPin"
                size={16}
              />

              {[place.locality, place.region]
                .filter(Boolean)
                .join(" · ") || "Srbija"}
            </p>
          </div>

          <div className="detailHeroStats">
            <article>
              <span className="detailHeroStatIcon">
                <Icon name="users" size={17} />
              </span>

              <div>
                <strong>
                  {place.visitors_count || 0}
                </strong>
                <span>ljudi bilo ovde</span>
              </div>
            </article>

            <article>
              <span className="detailHeroStatIcon">
                <Icon name="navigation" size={17} />
              </span>

              <div>
                <strong>
                  {place.checkins_count || 0}
                </strong>
                <span>GPS check-inova</span>
              </div>
            </article>

            <article>
              <span className="detailHeroStatIcon">
                <Icon name="camera" size={17} />
              </span>

              <div>
                <strong>
                  {place.photos_count || 0}
                </strong>
                <span>fotografija</span>
              </div>
            </article>

            <article>
              <span className="detailHeroStatIcon">
                <Icon name="heart" size={17} />
              </span>

              <div>
                <strong>
                  {place.saves_count || 0}
                </strong>
                <span>želi da poseti</span>
              </div>
            </article>
          </div>
        </section>

        <section className="detailContent">
          <section
            className={`detailActionDock ${
              pendingHere ? "hasPending" : ""
            }`}
          >
            <div className="detailActionLead">
              <span className="detailActionIcon">
                <Icon
                  name={
                    pendingHere
                      ? "offline"
                      : "navigation"
                  }
                  size={19}
                />
              </span>

              <div>
                <small>
                  {pendingHere
                    ? "OFFLINE GPS SAČUVAN"
                    : "GPS VERIFIED VISIT"}
                </small>

                <strong>
                  {pendingHere
                    ? `Zabeleženo ${formatDate(
                        pendingHere.device_timestamp
                      )}. Poslaćemo automatski čim se internet vrati.`
                    : myCheckin
                      ? `Poslednji check-in ${formatDate(
                          myCheckin.created_at
                        )}`
                      : "Dođi na lokaciju i potvrdi da si stvarno bio/la ovde."}
                </strong>
              </div>
            </div>

            <div className="detailActionButtons">
              <button
                type="button"
                className="light"
                onClick={toggleSave}
              >
                <span>
                  <Icon
                    name="heart"
                    size={17}
                  />
                </span>

                <div>
                  <small>LISTA</small>
                  <strong>
                    {saved
                      ? "Sačuvano"
                      : "Želim da idem"}
                  </strong>
                </div>
              </button>

              <button
                type="button"
                className={
                  pendingHere
                    ? "offlinePrimary"
                    : "primary"
                }
                disabled={checkingIn}
                onClick={checkIn}
              >
                <span>
                  <Icon
                    name={
                      pendingHere
                        ? "offline"
                        : "navigation"
                    }
                    size={17}
                  />
                </span>

                <div>
                  <small>GPS VISIT</small>

                  <strong>
                    {checkingIn
                      ? "GPS provera..."
                      : pendingHere
                        ? "Čeka internet"
                        : online
                          ? "Čekiraj se"
                          : "Offline check-in"}
                  </strong>
                </div>
              </button>

              <button
                type="button"
                className="accent"
                disabled={uploading}
                onClick={() =>
                  fileRef.current?.click()
                }
              >
                <span>
                  <Icon
                    name="camera"
                    size={17}
                  />
                </span>

                <div>
                  <small>COMMUNITY</small>

                  <strong>
                    {uploading
                      ? "Upload..."
                      : "Dodaj sliku"}
                  </strong>
                </div>
              </button>

              {place.created_by === profile?.id && (
                <button
                  type="button"
                  className="danger"
                  disabled={removingPlace}
                  onClick={removeOwnPlace}
                >
                  <span>
                    <Icon
                      name="trash"
                      size={17}
                    />
                  </span>

                  <div>
                    <small>MOJE MESTO</small>

                    <strong>
                      {removingPlace
                        ? "Uklanjamo..."
                        : "Ukloni"}
                    </strong>
                  </div>
                </button>
              )}

              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/*"
                onChange={uploadPhoto}
              />
            </div>
          </section>

          {error && (
            <div className="detailMessage error">
              <span>
                <Icon
                  name="alert"
                  size={16}
                />
              </span>

              <div>
                <strong>Nešto treba proveriti</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {notice && (
            <div className="detailMessage success">
              <span>
                <Icon
                  name={
                    pendingHere
                      ? "offline"
                      : "check"
                  }
                  size={16}
                />
              </span>

              <div>
                <strong>Gotovo</strong>
                <p>{notice}</p>
              </div>
            </div>
          )}

          <div className="detailGrid">
            <div className="detailMain">
              <section className="detailPanel detailStoryPanel">
                <div className="detailSectionHead story">
                  <div>
                    <span className="detailKicker">
                      01 · O MESTU
                    </span>

                    <h2>
                      Ovo je razlog da skreneš sa puta.
                    </h2>
                  </div>

                  <span className="detailSectionIcon">
                    <Icon name="route" size={20} />
                  </span>
                </div>

                <p className="detailDescription">
                  {place.description ||
                    place.short_description ||
                    "Zajednica još nije dodala detaljan opis ovog mesta."}
                </p>

                <div className="detailFacts">
                  <article>
                    <span>Težina</span>
                    <strong>
                      {place.difficulty || "—"}
                    </strong>
                  </article>

                  <article>
                    <span>Pristup</span>
                    <strong>
                      {place.access_type || "—"}
                    </strong>
                  </article>

                  <article>
                    <span>Deca</span>
                    <strong>
                      {place.child_friendly === true
                        ? "Da"
                        : place.child_friendly === false
                          ? "Ne"
                          : "—"}
                    </strong>
                  </article>

                  <article>
                    <span>GPS zaštita</span>
                    <strong>
                      {place.location_precision === "exact"
                        ? "Tačna"
                        : "Zaštićena"}
                    </strong>
                  </article>
                </div>
              </section>

              <section className="detailPanel detailGalleryPanel">
                <div className="detailSectionHead">
                  <div>
                    <span className="detailKicker">
                      02 · COMMUNITY GALERIJA
                    </span>

                    <h2>
                      Kako mesto stvarno izgleda.
                    </h2>
                  </div>

                  <small>
                    {photos.length}
                  </small>
                </div>

                {photos.length === 0 ? (
                  <div className="detailEmpty">
                    <span>
                      <Icon
                        name="camera"
                        size={28}
                      />
                    </span>

                    <strong>
                      Još nema fotografija.
                    </strong>

                    <p>
                      Budi prvi koji će pokazati kako ovo mesto izgleda uživo.
                    </p>
                  </div>
                ) : (
                  <div className="detailGallery">
                    {photos.map(
                      (photo, index) => (
                        <article
                          key={photo.id}
                          className={
                            index === 0
                              ? "featured"
                              : ""
                          }
                        >
                          <img
                            src={photo.image_url}
                            alt={place.name}
                          />

                          <div className="detailGalleryShade" />

                          <footer>
                            <img
                              src={
                                photo
                                  .profiles
                                  ?.avatar_url ||
                                FALLBACK_AVATAR
                              }
                              alt=""
                            />

                            <div>
                              <small>FOTO</small>

                              <span>
                                {photo
                                  .profiles
                                  ?.full_name ||
                                  photo
                                    .profiles
                                    ?.username ||
                                  "Explorer"}
                              </span>
                            </div>
                          </footer>
                        </article>
                      )
                    )}
                  </div>
                )}
              </section>

              <section className="detailPanel">
                <div className="detailSectionHead">
                  <div>
                    <span className="detailKicker">
                      03 · RAZGOVOR
                    </span>

                    <h2>
                      Korisne stvari, bez buke.
                    </h2>
                  </div>

                  <small>
                    {comments.length}
                  </small>
                </div>

                <div className="detailCommentForm">
                  <textarea
                    value={comment}
                    onChange={(event) =>
                      setComment(
                        event.target.value
                      )
                    }
                    placeholder="Put, parking, stanje staze, savet..."
                  />

                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={
                      commenting ||
                      !comment.trim()
                    }
                  >
                    <span>
                      <Icon
                        name="message"
                        size={16}
                      />
                    </span>

                    <div>
                      <small>COMMUNITY NOTE</small>

                      <strong>
                        {commenting
                          ? "Objavljivanje..."
                          : "Objavi savet"}
                      </strong>
                    </div>
                  </button>
                </div>

                <div className="detailComments">
                  {comments.map((item) => {
                    const user = item.profiles;

                    const userUrl =
                      user?.role === "host"
                        ? `/h/${user.username}`
                        : `/u/${user?.username}`;

                    return (
                      <article key={item.id}>
                        <Link to={userUrl}>
                          <img
                            src={
                              user?.avatar_url ||
                              FALLBACK_AVATAR
                            }
                            alt=""
                          />
                        </Link>

                        <div>
                          <div>
                            <Link to={userUrl}>
                              {user?.full_name ||
                                user?.username ||
                                "Explorer"}
                            </Link>

                            <small>
                              {formatDate(
                                item.created_at
                              )}
                            </small>
                          </div>

                          <p>{item.body}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="detailSide">
              <section className="detailPanel detailMapPanel">
                <div className="detailSectionHead compact">
                  <div>
                    <span className="detailKicker">
                      LOKACIJA
                    </span>

                    <h2>Pronađi trag.</h2>
                  </div>

                  <span className="detailSectionIcon">
                    <Icon
                      name="navigation"
                      size={19}
                    />
                  </span>
                </div>

                <div className="detailMiniMap">
                  <MapContainer
                    center={[
                      Number(place.latitude),
                      Number(place.longitude),
                    ]}
                    zoom={
                      place.location_precision === "exact"
                        ? 13
                        : 10
                    }
                    scrollWheelZoom={false}
                    dragging={false}
                    className="detailLeaflet"
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker
                      position={[
                        Number(place.latitude),
                        Number(place.longitude),
                      ]}
                      icon={markerIcon}
                    />
                  </MapContainer>

                  <div className="detailMapBadge">
                    <Icon
                      name={
                        place.location_precision === "exact"
                          ? "navigation"
                          : "shield"
                      }
                      size={13}
                    />

                    {place.location_precision === "exact"
                      ? "GPS lokacija"
                      : "Zaštićena lokacija"}
                  </div>
                </div>

                {place.location_precision !== "exact" && (
                  <div className="detailProtected">
                    <span>
                      <Icon
                        name="shield"
                        size={16}
                      />
                    </span>

                    <div>
                      <strong>
                        Sensitive location
                      </strong>

                      <p>
                        Javna tačka je namerno približna.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="detailPanel">
                <div className="detailSectionHead compact">
                  <div>
                    <span className="detailKicker">
                      BILI SU OVDE
                    </span>

                    <h2>
                      {visitors.length} ljudi
                    </h2>
                  </div>

                  <small>
                    {visitors.length}
                  </small>
                </div>

                {visitors.length > 0 ? (
                  <div className="detailVisitors">
                    {visitors
                      .slice(0, 20)
                      .map((user) => (
                        <Link
                          key={user.id}
                          to={
                            user.role === "host"
                              ? `/h/${user.username}`
                              : `/u/${user.username}`
                          }
                          title={
                            user.full_name ||
                            user.username
                          }
                        >
                          <img
                            src={
                              user.avatar_url ||
                              FALLBACK_AVATAR
                            }
                            alt=""
                          />
                        </Link>
                      ))}
                  </div>
                ) : (
                  <div className="detailVisitorsEmpty">
                    Prvi GPS check-in još čeka.
                  </div>
                )}
              </section>

              <section className="detailPassport">
                <span className="detailPassportIcon">
                  <Icon
                    name="trophy"
                    size={24}
                  />
                </span>

                <span>
                  OUTDOOR PASSPORT
                </span>

                <h3>
                  Ne skupljaš lajkove.
                  <br />
                  Skupljaš mesta.
                </h3>

                <p>
                  GPS potvrđena lokacija ulazi u tvoj Explore identitet.
                </p>

                <div>
                  <Icon name="sparkle" size={14} />
                  VERIFIED OUTDOOR MEMORY
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function DetailsStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      html,body,#root{min-height:100%}
      body{margin:0;background:#e7ece5}
      button,textarea{font:inherit}
      .detailPage,.detailState{min-height:100vh;color:#1b3023;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .detailPage{position:relative;padding:118px 24px 76px;background:radial-gradient(circle at 5% 0%,rgba(186,255,158,.18),transparent 23%),radial-gradient(circle at 95% 18%,rgba(90,131,96,.11),transparent 20%),#e7ece5}
      .detailPage a{color:inherit;text-decoration:none}
      .detailOfflineBar{position:fixed;top:88px;left:50%;z-index:3200;display:flex;align-items:center;gap:9px;padding:7px 11px 7px 7px;border:1px solid rgba(255,202,116,.35);border-radius:16px;background:linear-gradient(145deg,rgba(48,38,16,.96),rgba(62,48,18,.92));color:#ffdb93;box-shadow:0 18px 42px rgba(0,0,0,.22);transform:translateX(-50%);backdrop-filter:blur(18px)}
      .detailOfflineIcon{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:rgba(255,219,147,.1)}
      .detailOfflineBar div span,.detailOfflineBar div strong{display:block}
      .detailOfflineBar div span{font-size:5px;font-weight:950;letter-spacing:.1em}
      .detailOfflineBar div strong{margin-top:2px;color:#fff;font-size:7px}
      .detailPendingSync{position:fixed;right:18px;bottom:18px;z-index:3200;display:flex;align-items:center;gap:8px;min-height:46px;padding:6px 11px 6px 7px;border:1px solid rgba(186,255,158,.28);border-radius:15px;background:linear-gradient(145deg,rgba(14,42,26,.96),rgba(18,55,32,.92));color:#dfffd1;box-shadow:0 20px 48px rgba(0,0,0,.24);cursor:pointer;backdrop-filter:blur(18px)}
      .detailPendingSync>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(186,255,158,.09)}
      .detailPendingSync small,.detailPendingSync strong{display:block;text-align:left}
      .detailPendingSync small{color:#baff9e;font-size:5px;font-weight:900;letter-spacing:.08em}
      .detailPendingSync strong{margin-top:2px;font-size:7px}
      .detailPendingSync:disabled{cursor:default;opacity:.65}
      .detailHero{position:relative;isolation:isolate;width:min(1320px,100%);min-height:720px;margin:0 auto;padding:34px;overflow:hidden;border-radius:40px;background-position:center;background-size:cover;color:#fff;box-shadow:0 42px 110px rgba(24,55,36,.28)}
      .detailHero::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(110deg,rgba(3,11,6,.52),transparent 48%),linear-gradient(180deg,rgba(4,14,8,.12),transparent 35%,rgba(4,14,8,.2) 55%,rgba(4,14,8,.92) 100%)}
      .detailHeroNoise{position:absolute;inset:0;pointer-events:none;opacity:.2;background-image:radial-gradient(rgba(255,255,255,.16) .55px,transparent .55px);background-size:4px 4px;mix-blend-mode:soft-light}
      .detailHeroTop{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .detailBack,.detailHeroStatus{display:flex;align-items:center;gap:9px;min-height:46px;padding:6px 11px 6px 7px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:linear-gradient(145deg,rgba(4,14,8,.42),rgba(8,24,14,.32));color:#fff!important;box-shadow:0 16px 38px rgba(0,0,0,.16);backdrop-filter:blur(20px)}
      .detailBack>span,.detailHeroStatus>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(255,255,255,.06)}
      .detailBack small,.detailBack strong,.detailHeroStatus small,.detailHeroStatus strong{display:block}
      .detailBack small,.detailHeroStatus small{color:rgba(255,255,255,.34);font-size:5px;font-weight:900;letter-spacing:.09em}
      .detailBack strong,.detailHeroStatus strong{margin-top:2px;font-size:7px}
      .detailHeroCopy{position:relative;z-index:2;max-width:980px;padding-top:146px}
      .detailHeroEyebrow{display:inline-flex;align-items:center;gap:9px}
      .detailHeroEyebrow>span{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(186,255,158,.15);border-radius:11px;background:rgba(186,255,158,.08);color:#baff9e}
      .detailHeroEyebrow small,.detailHeroEyebrow strong{display:block}
      .detailHeroEyebrow small{color:#baff9e;font-size:6px;font-weight:950;letter-spacing:.12em}
      .detailHeroEyebrow strong{margin-top:2px;color:rgba(255,255,255,.68);font-size:6px}
      .detailHero h1{margin:20px 0 0;font-size:clamp(64px,8.3vw,116px);line-height:.82;letter-spacing:-.082em;text-wrap:balance}
      .detailHeroCopy>p{display:flex;align-items:center;gap:7px;margin:20px 0 0;color:rgba(255,255,255,.66);font-size:9px}
      .detailHeroStats{position:absolute;right:34px;bottom:34px;left:34px;z-index:3;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
      .detailHeroStats article{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:10px;padding:11px;border:1px solid rgba(255,255,255,.11);border-radius:17px;background:linear-gradient(145deg,rgba(4,14,8,.47),rgba(8,24,14,.33));box-shadow:inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:blur(18px)}
      .detailHeroStatIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:rgba(186,255,158,.08);color:#baff9e}
      .detailHeroStats strong,.detailHeroStats span{display:block}
      .detailHeroStats strong{font-size:20px}
      .detailHeroStats article>div>span{margin-top:3px;color:rgba(255,255,255,.42);font-size:6px;font-weight:850;text-transform:uppercase}
      .detailContent{width:min(1220px,100%);margin:18px auto 0}
      .detailActionDock{display:grid;grid-template-columns:minmax(260px,.9fr) minmax(0,1.1fr);align-items:center;gap:15px;padding:12px;border:1px solid #d6dfd3;border-radius:22px;background:rgba(255,255,255,.88);box-shadow:0 18px 44px rgba(28,48,35,.07),inset 0 1px 0 rgba(255,255,255,.8);backdrop-filter:blur(18px)}
      .detailActionDock.hasPending{border-color:#e3cf98;background:linear-gradient(135deg,#fff,#fff9e6)}
      .detailActionLead{display:grid;grid-template-columns:44px minmax(0,1fr);align-items:center;gap:10px;padding:5px 8px}
      .detailActionIcon{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#173b27;color:#baff9e}
      .detailActionDock.hasPending .detailActionIcon{background:#fff3cc;color:#80651e}
      .detailActionLead small,.detailActionLead strong{display:block}
      .detailActionLead small{color:#789456;font-size:6px;font-weight:900;letter-spacing:.1em}
      .detailActionDock.hasPending .detailActionLead small{color:#a47f23}
      .detailActionLead strong{margin-top:4px;color:#465b4e;font-size:8px;line-height:1.45}
      .detailActionButtons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
      .detailActionButtons button{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:7px;min-height:50px;padding:7px;border-radius:14px;cursor:pointer;text-align:left}
      .detailActionButtons button>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px}
      .detailActionButtons small,.detailActionButtons strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .detailActionButtons small{font-size:5px;font-weight:900;letter-spacing:.07em}
      .detailActionButtons strong{margin-top:2px;font-size:7px}
      .detailActionButtons .light{border:1px solid #d6dfd2;background:#f7f9f5;color:#53675a}
      .detailActionButtons .light>span{background:#edf2ea}
      .detailActionButtons .primary{border:1px solid #173b27;background:#173b27;color:#fff}
      .detailActionButtons .primary>span{background:rgba(186,255,158,.1);color:#baff9e}
      .detailActionButtons .offlinePrimary{border:1px solid #d9bd6e;background:#fff3cc;color:#80651e}
      .detailActionButtons .offlinePrimary>span{background:rgba(128,101,30,.08)}
      .detailActionButtons .accent{border:1px solid #c8e5b6;background:#eaf7df;color:#4d7138}
      .detailActionButtons .accent>span{background:#dff0d2}
      .detailActionButtons .danger{border:1px solid #edc4be;background:#fff0ee;color:#9a4b42}
      .detailActionButtons .danger>span{background:#ffe2de}
      .detailActionButtons button:disabled{cursor:not-allowed;opacity:.5}
      .detailMessage{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:9px;margin-top:10px;padding:10px;border-radius:13px}
      .detailMessage>span{display:grid;place-items:center;width:38px;height:38px;border-radius:11px}
      .detailMessage strong,.detailMessage p{display:block}
      .detailMessage strong{font-size:7px}
      .detailMessage p{margin:3px 0 0;font-size:7px;line-height:1.45}
      .detailMessage.error{border:1px solid #efc2bc;background:#fff0ee;color:#98463c}
      .detailMessage.error>span{background:#ffe0dc}
      .detailMessage.success{border:1px solid #cbe0c1;background:#eef8e8;color:#4f733b}
      .detailMessage.success>span{background:#e0f0d7}
      .detailGrid{display:grid;grid-template-columns:minmax(0,1.42fr) minmax(320px,.58fr);gap:16px;margin-top:16px}
      .detailMain,.detailSide{display:grid;align-content:start;gap:16px}
      .detailPanel{padding:24px;border:1px solid #d7e0d4;border-radius:26px;background:rgba(255,255,255,.86);box-shadow:0 16px 40px rgba(28,48,35,.05),inset 0 1px 0 rgba(255,255,255,.75);backdrop-filter:blur(14px)}
      .detailKicker{color:#789456;font-size:7px;font-weight:900;letter-spacing:.11em}
      .detailPanel>h2,.detailSectionHead h2{margin:7px 0 0;color:#293e31;font-size:31px;line-height:1.03;letter-spacing:-.052em;text-wrap:balance}
      .detailSectionHead{display:flex;align-items:flex-end;justify-content:space-between;gap:15px;margin-bottom:15px}
      .detailSectionHead.story{align-items:flex-start}
      .detailSectionHead.compact{margin-bottom:11px}
      .detailSectionHead>small{display:grid;place-items:center;min-width:34px;height:34px;border-radius:11px;background:#eaf2e2;color:#5b7842;font-size:8px;font-weight:900}
      .detailSectionIcon{display:grid!important;place-items:center;flex:0 0 auto;width:42px;height:42px;border-radius:13px;background:#eef5e9;color:#5c7d47}
      .detailDescription{margin:17px 0 0;color:#66756b;font-size:10px;line-height:1.86;white-space:pre-wrap}
      .detailFacts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:18px}
      .detailFacts article{padding:11px;border:1px solid #e0e6dd;border-radius:13px;background:#f7f9f5}
      .detailFacts span,.detailFacts strong{display:block}
      .detailFacts span{color:#929b95;font-size:6px}
      .detailFacts strong{margin-top:4px;color:#415549;font-size:8px}
      .detailGallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .detailGallery article{position:relative;height:250px;overflow:hidden;border-radius:17px;background:#dce5d8;box-shadow:0 12px 28px rgba(26,54,34,.08)}
      .detailGallery article.featured{grid-column:1/-1;height:380px}
      .detailGallery>article>img{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
      .detailGallery>article:hover>img{transform:scale(1.025)}
      .detailGalleryShade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(5,17,10,.72))}
      .detailGallery footer{position:absolute;right:10px;bottom:10px;left:10px;display:flex;align-items:center;gap:7px;padding:7px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(5,17,10,.52);color:#fff;backdrop-filter:blur(12px)}
      .detailGallery footer img{width:30px;height:30px;border-radius:9px;object-fit:cover}
      .detailGallery footer small,.detailGallery footer span{display:block}
      .detailGallery footer small{color:#baff9e;font-size:5px;font-weight:900}
      .detailGallery footer span{margin-top:2px;font-size:7px;font-weight:800}
      .detailEmpty{display:grid;place-items:center;padding:52px 20px;border:1px dashed #ccd6c8;border-radius:18px;background:#f8faf6;color:#718276;text-align:center}
      .detailEmpty>span{display:grid;place-items:center;width:58px;height:58px;border-radius:18px;background:#edf4e9;color:#688453}
      .detailEmpty strong{margin-top:10px;font-size:9px}
      .detailEmpty p{max-width:330px;margin:5px 0 0;color:#98a29b;font-size:7px;line-height:1.5}
      .detailCommentForm{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end}
      .detailCommentForm textarea{min-height:102px;padding:12px;border:1px solid #d9e2d6;border-radius:13px;background:#f7f9f5;color:#33483b;outline:0;resize:vertical;font-size:9px;line-height:1.6}
      .detailCommentForm textarea:focus{border-color:#9ab88c;box-shadow:0 0 0 3px rgba(119,155,85,.09)}
      .detailCommentForm button{display:grid;grid-template-columns:34px auto;align-items:center;gap:7px;min-height:50px;padding:7px 11px 7px 7px;border:0;border-radius:13px;background:#173b27;color:#fff;cursor:pointer}
      .detailCommentForm button>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(186,255,158,.1);color:#baff9e}
      .detailCommentForm button small,.detailCommentForm button strong{display:block;text-align:left}
      .detailCommentForm button small{color:rgba(255,255,255,.34);font-size:5px;font-weight:900}
      .detailCommentForm button strong{margin-top:2px;font-size:7px}
      .detailComments{display:grid;gap:8px;margin-top:14px}
      .detailComments>article{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;padding:11px;border:1px solid #e0e6dd;border-radius:13px;background:#f8faf6}
      .detailComments>article>a img{width:42px;height:42px;border-radius:12px;object-fit:cover}
      .detailComments>article>div>div{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .detailComments a{font-size:8px;font-weight:850}
      .detailComments small{color:#929b95;font-size:6px}
      .detailComments p{margin:5px 0 0;color:#6f7b73;font-size:8px;line-height:1.55}
      .detailMapPanel{overflow:hidden}
      .detailMiniMap{position:relative;height:300px;margin-top:14px;overflow:hidden;border-radius:18px;box-shadow:inset 0 0 0 1px rgba(23,59,39,.06)}
      .detailLeaflet{width:100%;height:100%}
      .detailMapBadge{position:absolute;right:10px;bottom:10px;z-index:500;display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(6,18,10,.7);color:#dfffd1;font-size:6px;font-weight:850;backdrop-filter:blur(10px)}
      .detailPinShell{background:transparent!important;border:0!important}
      .detailPin{position:relative;display:grid;place-items:center;width:48px;height:48px;border:3px solid #fff;border-radius:16px 16px 16px 4px;background:#173b27;color:#baff9e;box-shadow:0 14px 30px rgba(9,31,17,.34);transform:rotate(-45deg)}
      .detailPin span{transform:rotate(45deg)}
      .detailPin i{position:absolute;inset:-8px;border:1px solid rgba(186,255,158,.28);border-radius:22px 22px 22px 7px;animation:detailPinPulse 1.8s ease-out infinite}
      @keyframes detailPinPulse{0%{opacity:.7;transform:scale(.84)}100%{opacity:0;transform:scale(1.28)}}
      .detailProtected{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:8px;margin-top:10px;padding:10px;border:1px solid #eadca6;border-radius:12px;background:#fff8df;color:#806a25}
      .detailProtected>span{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#fff0b8}
      .detailProtected strong,.detailProtected p{display:block}
      .detailProtected strong{font-size:7px}
      .detailProtected p{margin:3px 0 0;font-size:6px;line-height:1.45}
      .detailVisitors{display:flex;flex-wrap:wrap;gap:7px}
      .detailVisitors a{display:block;width:48px;height:48px;padding:2px;border:1px solid #d4dfd0;border-radius:15px;background:#fff;box-shadow:0 8px 18px rgba(29,50,35,.06);transition:transform .16s ease}
      .detailVisitors a:hover{transform:translateY(-2px)}
      .detailVisitors img{width:100%;height:100%;border-radius:12px;object-fit:cover}
      .detailVisitorsEmpty{padding:18px;border:1px dashed #d3ddd0;border-radius:13px;background:#f7f9f5;color:#88938b;font-size:7px;text-align:center}
      .detailPassport{position:relative;overflow:hidden;padding:24px;border-radius:26px;background:radial-gradient(circle at 85% 10%,rgba(186,255,158,.14),transparent 24%),linear-gradient(145deg,#0c2718,#1c4a30);color:#baff9e;box-shadow:0 22px 48px rgba(23,58,39,.18)}
      .detailPassport::after{content:"";position:absolute;right:-45px;bottom:-50px;width:150px;height:150px;border:1px solid rgba(186,255,158,.12);border-radius:50%}
      .detailPassportIcon{display:grid!important;place-items:center;width:46px;height:46px;border-radius:14px;background:rgba(186,255,158,.1)}
      .detailPassport>span{display:block;margin-top:13px;font-size:7px;font-weight:900;letter-spacing:.11em}
      .detailPassport h3{margin:8px 0 0;color:#fff;font-size:25px;line-height:1.03;letter-spacing:-.045em}
      .detailPassport p{margin:10px 0 0;color:rgba(255,255,255,.5);font-size:8px;line-height:1.58}
      .detailPassport>div{display:inline-flex;align-items:center;gap:6px;margin-top:13px;padding:7px 9px;border:1px solid rgba(186,255,158,.14);border-radius:999px;background:rgba(186,255,158,.06);font-size:5px;font-weight:900;letter-spacing:.07em}
      .detailState{display:grid;place-items:center;align-content:center;gap:8px;padding:24px;background:radial-gradient(circle at 50% 42%,rgba(186,255,158,.13),transparent 20%),#e7ece5;text-align:center}
      .detailStateOrb{display:grid;place-items:center;width:68px;height:68px;border-radius:21px;background:#173b27;color:#baff9e;box-shadow:0 18px 42px rgba(28,56,37,.16);animation:detailStatePulse 1.5s ease-in-out infinite}
      .detailStateOrb.error{background:#8f443b;color:#fff}
      .detailState>small{margin-top:5px;color:#789456;font-size:6px;font-weight:900;letter-spacing:.12em}
      .detailState>strong{font-size:17px}
      .detailState>p{margin:0;color:#7c8780;font-size:8px}
      .detailState a{margin-top:4px;padding:11px 13px;border-radius:11px;background:#173b27;color:#fff;text-decoration:none;font-size:8px;font-weight:850}
      @keyframes detailStatePulse{0%,100%{transform:scale(.97);opacity:.72}50%{transform:scale(1.04);opacity:1}}

      @media(max-width:1080px){
        .detailActionDock{grid-template-columns:1fr}
        .detailActionButtons{grid-template-columns:repeat(4,minmax(0,1fr))}
      }

      @media(max-width:960px){
        .detailGrid{grid-template-columns:1fr}
        .detailHeroStats{grid-template-columns:repeat(2,minmax(0,1fr))}
        .detailHero{min-height:790px}
        .detailHeroCopy{padding-top:135px}
      }

      @media(max-width:720px){
        .detailPage{padding:84px 0 58px}
        .detailOfflineBar{top:70px;max-width:calc(100% - 20px)}
        .detailHero{min-height:830px;padding:20px;border-radius:0 0 32px 32px}
        .detailHeroTop{align-items:flex-start}
        .detailHeroStatus{display:none}
        .detailBack{width:44px;height:44px;min-height:44px;padding:0;display:grid;place-items:center}
        .detailBack>span{width:auto;height:auto;background:transparent}
        .detailBack>div{display:none}
        .detailHeroCopy{padding-top:132px}
        .detailHero h1{font-size:58px}
        .detailHeroStats{right:20px;bottom:20px;left:20px}
        .detailContent{padding:0 11px}
        .detailActionDock{padding:10px}
        .detailActionButtons{grid-template-columns:1fr 1fr}
        .detailPanel{padding:20px}
        .detailGallery article.featured{height:310px}
        .detailPendingSync{right:10px;bottom:10px}
      }

      @media(max-width:520px){
        .detailHero{min-height:870px;padding:17px}
        .detailHeroCopy{padding-top:126px}
        .detailHero h1{font-size:50px}
        .detailHeroStats{right:17px;bottom:17px;left:17px;gap:7px}
        .detailHeroStats article{grid-template-columns:36px minmax(0,1fr);gap:7px;padding:8px}
        .detailHeroStatIcon{width:36px;height:36px}
        .detailHeroStats strong{font-size:16px}
        .detailContent{padding:0 8px}
        .detailActionButtons{grid-template-columns:1fr}
        .detailActionLead{grid-template-columns:40px minmax(0,1fr)}
        .detailActionIcon{width:40px;height:40px}
        .detailPanel{padding:17px;border-radius:21px}
        .detailPanel>h2,.detailSectionHead h2{font-size:26px}
        .detailFacts{grid-template-columns:repeat(2,minmax(0,1fr))}
        .detailGallery{grid-template-columns:1fr}
        .detailGallery article.featured{grid-column:auto;height:280px}
        .detailGallery article{height:250px}
        .detailCommentForm{grid-template-columns:1fr}
        .detailCommentForm button{width:100%}
        .detailMiniMap{height:260px}
        .detailOfflineBar strong{display:none}
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
