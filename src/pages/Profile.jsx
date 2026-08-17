import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  MapContainer,
  Marker,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";

const SERBIA_CENTER = [44.0165, 21.0059];

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1800&auto=format&fit=crop";

function Icon({ name, size = 20 }) {
  const icons = {
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    verified: (
      <>
        <path d="M12 3l2.2 1.7 2.8-.2.9 2.7 2.3 1.6-1 2.6.7 2.7-2.4 1.4-.6 2.8-2.8-.1L12 20l-2.1-1.8-2.8.1-.6-2.8-2.4-1.4.7-2.7-1-2.6 2.3-1.6.9-2.7 2.8.2Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 2 2.3Z" />
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
    play: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m10 8 6 4-6 4Z" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
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
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
        <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
        <path d="M12 13v4M8 21h8M9 17h6" />
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
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function externalUrl(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;
}

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("sr-Latn-RS").format(
    Number(value || 0)
  );
}

function getLevel(visitedCount) {
  const count = Number(visitedCount || 0);

  if (count >= 150) {
    return {
      name: "Legend",
      next: null,
      min: 150,
      max: 150,
    };
  }

  if (count >= 71) {
    return {
      name: "Nomad",
      next: "Legend",
      min: 71,
      max: 150,
    };
  }

  if (count >= 31) {
    return {
      name: "Pathfinder",
      next: "Nomad",
      min: 31,
      max: 71,
    };
  }

  if (count >= 11) {
    return {
      name: "Adventurer",
      next: "Pathfinder",
      min: 11,
      max: 31,
    };
  }

  return {
    name: "Explorer",
    next: "Adventurer",
    min: 0,
    max: 11,
  };
}

function makePassportMarker(place) {
  const image =
    place?.cover_url || FALLBACK_COVER;

  return L.divIcon({
    className: "passportMarkerShell",
    html: `
      <div class="passportMarker">
        <img src="${image}" alt="" />
        <span></span>
      </div>
    `,
    iconSize: [46, 54],
    iconAnchor: [23, 48],
  });
}

function LoadingState() {
  return (
    <>
      <ProfileStyles />

      <main className="statePage">
        <div className="stateCard">
          <span className="loader" />
          <h1>Učitavanje profila</h1>
          <p>
            Pripremamo tvoj MeetOutdoors pasoš.
          </p>
        </div>
      </main>
    </>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [savedCount, setSavedCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;

      if (!user) {
        navigate("/login");
        return;
      }

      const [
        profileResult,
        checkinsResult,
        photosResult,
        savesResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single(),

        supabase
          .from("place_checkins")
          .select(`
            id,
            place_id,
            visited_at,
            created_at,
            is_gps_verified,
            places:place_id (
              id,
              name,
              latitude,
              longitude,
              locality,
              region,
              cover_url,
              place_categories:category_id (
                id,
                name,
                code
              )
            )
          `)
          .eq("user_id", user.id)
          .eq("is_gps_verified", true)
          .order("created_at", {
            ascending: false,
          })
          .limit(500),

        supabase
          .from("place_photos")
          .select(`
            id,
            place_id,
            image_url,
            caption,
            created_at,
            moderation_status,
            places:place_id (
              id,
              name
            )
          `)
          .eq("user_id", user.id)
          .eq("moderation_status", "approved")
          .order("created_at", {
            ascending: false,
          })
          .limit(100),

        supabase
          .from("place_saves")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id),
      ]);

      if (profileResult.error) {
        throw profileResult.error;
      }

      setProfile(profileResult.data);

      if (!checkinsResult.error) {
        setCheckins(
          (checkinsResult.data || []).filter(
            (item) => item.places
          )
        );
      }

      if (!photosResult.error) {
        setPhotos(photosResult.data || []);
      }

      if (!savesResult.error) {
        setSavedCount(
          savesResult.count || 0
        );
      }
    } catch (err) {
      console.error(
        "Greška pri učitavanju profila:",
        err
      );

      setProfile(null);

      setError(
        err.message ||
          "Profil trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    setError("");

    try {
      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      navigate("/login");
    } catch (err) {
      console.error(
        "Greška pri odjavljivanju:",
        err
      );

      setError(
        err.message ||
          "Odjavljivanje trenutno nije uspelo."
      );

      setLoggingOut(false);
    }
  }

  const name =
    profile?.full_name ||
    "Unnamed profile";

  const username =
    profile?.username
      ? `@${profile.username}`
      : "@meetoutdoors";

  const location = [
    profile?.city,
    profile?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const activities =
    Array.isArray(profile?.activities)
      ? profile.activities
      : [];

  const roleLabel = useMemo(() => {
    if (!profile?.role) return "Member";

    return (
      profile.role.charAt(0).toUpperCase() +
      profile.role.slice(1)
    );
  }, [profile?.role]);

  const hostLinks = [
    profile?.phone && {
      icon: "phone",
      label: "Telefon",
      value: profile.phone,
      href: `tel:${profile.phone}`,
    },
    profile?.instagram_url && {
      icon: "instagram",
      label: "Instagram",
      value: "Otvori profil",
      href: externalUrl(
        profile.instagram_url
      ),
    },
    profile?.website_url && {
      icon: "globe",
      label: "Website",
      value: "Poseti sajt",
      href: externalUrl(
        profile.website_url
      ),
    },
    profile?.promo_video_url && {
      icon: "play",
      label: "Promo video",
      value: "Pogledaj video",
      href: externalUrl(
        profile.promo_video_url
      ),
    },
  ].filter(Boolean);

  const visitedPlaces = useMemo(() => {
    const unique = new Map();

    checkins.forEach((checkin) => {
      const place = checkin.places;

      if (
        place?.id &&
        !unique.has(place.id)
      ) {
        unique.set(place.id, {
          ...place,
          latest_visit:
            checkin.visited_at ||
            checkin.created_at,
        });
      }
    });

    return Array.from(unique.values());
  }, [checkins]);

  const categoryCollections = useMemo(() => {
    const map = new Map();

    visitedPlaces.forEach((place) => {
      const category =
        place.place_categories?.name ||
        "Outdoor";

      map.set(
        category,
        (map.get(category) || 0) + 1
      );
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort(
        (a, b) => b.count - a.count
      );
  }, [visitedPlaces]);

  const level = useMemo(
    () => getLevel(visitedPlaces.length),
    [visitedPlaces.length]
  );

  const levelProgress = useMemo(() => {
    if (!level.next) return 100;

    const range =
      level.max - level.min;

    const progressed =
      visitedPlaces.length - level.min;

    return Math.max(
      0,
      Math.min(
        100,
        (progressed / range) * 100
      )
    );
  }, [
    level.max,
    level.min,
    level.next,
    visitedPlaces.length,
  ]);

  const mapCenter = useMemo(() => {
    const first = visitedPlaces.find(
      (place) =>
        Number.isFinite(
          Number(place.latitude)
        ) &&
        Number.isFinite(
          Number(place.longitude)
        )
    );

    if (!first) return SERBIA_CENTER;

    return [
      Number(first.latitude),
      Number(first.longitude),
    ];
  }, [visitedPlaces]);

  const recentCheckins = useMemo(
    () => checkins.slice(0, 8),
    [checkins]
  );

  const achievements = useMemo(() => {
    const items = [];

    if (checkins.length >= 1) {
      items.push({
        icon: "pin",
        title: "Prvi trag",
        text: "Prvi GPS check-in",
      });
    }

    if (photos.length >= 1) {
      items.push({
        icon: "camera",
        title: "Prvi kadar",
        text: "Prva community fotografija",
      });
    }

    if (visitedPlaces.length >= 10) {
      items.push({
        icon: "route",
        title: "10 mesta",
        text: "Počinje ozbiljna mapa",
      });
    }

    if (visitedPlaces.length >= 25) {
      items.push({
        icon: "compass",
        title: "Pathfinder",
        text: "25 različitih mesta",
      });
    }

    if (checkins.length >= 50) {
      items.push({
        icon: "verified",
        title: "GPS veteran",
        text: "50 potvrđenih check-inova",
      });
    }

    if (items.length === 0) {
      items.push({
        icon: "sparkle",
        title: "Početak",
        text: "Prvi bedž te čeka",
      });
    }

    return items.slice(0, 6);
  }, [
    checkins.length,
    photos.length,
    visitedPlaces.length,
  ]);

  if (loading) {
    return <LoadingState />;
  }

  if (!profile) {
    return (
      <>
        <ProfileStyles />

        <main className="statePage">
          <div className="stateCard">
            <span className="stateIcon">
              <Icon
                name="alert"
                size={27}
              />
            </span>

            <h1>
              Profil nije pronađen
            </h1>

            <p>
              {error ||
                "Nismo uspeli da pronađemo podatke za ovaj profil."}
            </p>

            <button
              type="button"
              onClick={loadProfile}
            >
              <Icon
                name="refresh"
                size={16}
              />
              Pokušaj ponovo
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ProfileStyles />

      <main className="profilePage">
        <section
          className="hero"
          style={
            profile.cover_url
              ? {
                  backgroundImage: `linear-gradient(180deg,rgba(5,19,12,.12),rgba(5,19,12,.88)),url(${profile.cover_url})`,
                }
              : undefined
          }
        >
          <div className="heroGlow" />

          <div className="heroTop">
            <Link
              to="/explore"
              className="brand"
            >
              <span>
                <Icon
                  name="compass"
                  size={21}
                />
              </span>

              MeetOutdoors
            </Link>

            <Link
              to="/explore"
              className="homeLink"
            >
              Explore mapa
              <Icon
                name="arrow"
                size={15}
              />
            </Link>
          </div>

          <div className="heroCopy">
            <span className="eyebrow">
              <span />
              Outdoor Passport
            </span>

            <h1>
              Tvoja mapa.
              <br />
              Tvoja priča.
            </h1>

            <p>
              Svaki GPS potvrđen trag,
              fotografija i mesto koje si
              obišao postaju deo tvog
              MeetOutdoors identiteta.
            </p>
          </div>

          <div className="heroPassportStamp">
            <Icon
              name="trophy"
              size={22}
            />

            <div>
              <small>
                CURRENT LEVEL
              </small>

              <strong>
                {level.name}
              </strong>
            </div>
          </div>
        </section>

        <section className="content">
          {error && (
            <div
              className="errorBox"
              role="alert"
            >
              <Icon
                name="alert"
                size={18}
              />

              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
              >
                Zatvori
              </button>
            </div>
          )}

          <article className="mainCard">
            <div className="identity">
              <div className="avatarWrap">
                <img
                  className="avatar"
                  src={
                    profile.avatar_url ||
                    FALLBACK_AVATAR
                  }
                  alt={name}
                />

                {profile.is_verified && (
                  <span className="verifiedMark">
                    <Icon
                      name="verified"
                      size={22}
                    />
                  </span>
                )}
              </div>

              <div className="identityCopy">
                <div className="badges">
                  <span className="roleBadge">
                    {roleLabel}
                  </span>

                  <span className="passportBadge">
                    <Icon
                      name="trophy"
                      size={14}
                    />
                    {level.name}
                  </span>

                  {profile.is_verified && (
                    <span className="verifiedBadge">
                      <Icon
                        name="verified"
                        size={15}
                      />
                      Verified
                    </span>
                  )}
                </div>

                <h2>{name}</h2>

                <p className="username">
                  {username}
                </p>

                {location && (
                  <p className="location">
                    <Icon
                      name="pin"
                      size={16}
                    />
                    {location}
                  </p>
                )}
              </div>
            </div>

            <div className="actions">
              <Link
                to="/edit-profile"
                className="editButton"
              >
                <Icon
                  name="edit"
                  size={17}
                />
                Izmeni profil
              </Link>

              <button
                type="button"
                className="logoutButton"
                onClick={logout}
                disabled={loggingOut}
              >
                <Icon
                  name="logout"
                  size={17}
                />

                {loggingOut
                  ? "Odjavljivanje..."
                  : "Odjavi se"}
              </button>
            </div>
          </article>

          <section className="passportStats">
            <article>
              <span className="passportStatIcon green">
                <Icon
                  name="pin"
                  size={19}
                />
              </span>

              <div>
                <strong>
                  {formatNumber(
                    visitedPlaces.length
                  )}
                </strong>
                <span>
                  posećenih mesta
                </span>
              </div>
            </article>

            <article>
              <span className="passportStatIcon dark">
                <Icon
                  name="verified"
                  size={19}
                />
              </span>

              <div>
                <strong>
                  {formatNumber(
                    checkins.length
                  )}
                </strong>
                <span>
                  GPS check-inova
                </span>
              </div>
            </article>

            <article>
              <span className="passportStatIcon sand">
                <Icon
                  name="camera"
                  size={19}
                />
              </span>

              <div>
                <strong>
                  {formatNumber(
                    photos.length
                  )}
                </strong>
                <span>
                  fotografija
                </span>
              </div>
            </article>

            <article>
              <span className="passportStatIcon rose">
                <Icon
                  name="heart"
                  size={19}
                />
              </span>

              <div>
                <strong>
                  {formatNumber(
                    savedCount
                  )}
                </strong>
                <span>
                  sačuvanih mesta
                </span>
              </div>
            </article>
          </section>

          <section className="passportLevel">
            <div className="passportLevelCopy">
              <span className="sectionLabel">
                Outdoor level
              </span>

              <h3>
                {level.name}
              </h3>

              <p>
                {level.next
                  ? `${Math.max(
                      0,
                      level.max -
                        visitedPlaces.length
                    )} novih mesta do nivoa ${level.next}.`
                  : "Otključao/la si najviši nivo."}
              </p>
            </div>

            <div className="passportProgress">
              <div>
                <span
                  style={{
                    width: `${levelProgress}%`,
                  }}
                />
              </div>

              <footer>
                <span>
                  {visitedPlaces.length} mesta
                </span>

                <strong>
                  {level.next ||
                    "LEGEND"}
                </strong>
              </footer>
            </div>
          </section>

          <div className="profileGrid">
            <section className="panel passportMapPanel">
              <div className="panelHeader">
                <div>
                  <span className="sectionLabel">
                    Moja mapa
                  </span>

                  <h3>
                    Srbija koju si stvarno obišao/la.
                  </h3>

                  <p className="panelLead">
                    Samo GPS potvrđena mesta.
                  </p>
                </div>

                <span className="panelIcon">
                  <Icon
                    name="layers"
                    size={21}
                  />
                </span>
              </div>

              <div className="passportMap">
                <MapContainer
                  center={mapCenter}
                  zoom={
                    visitedPlaces.length > 0
                      ? 7
                      : 6
                  }
                  scrollWheelZoom={false}
                  className="passportLeaflet"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {visitedPlaces.map(
                    (place) => (
                      <Marker
                        key={place.id}
                        position={[
                          Number(
                            place.latitude
                          ),
                          Number(
                            place.longitude
                          ),
                        ]}
                        icon={makePassportMarker(
                          place
                        )}
                        eventHandlers={{
                          click: () =>
                            navigate(
                              `/explore/${place.id}`
                            ),
                        }}
                      />
                    )
                  )}
                </MapContainer>

                <div className="passportMapHud">
                  <Icon
                    name="verified"
                    size={14}
                  />

                  GPS VERIFIED ONLY
                </div>
              </div>
            </section>

            <aside className="panel aboutPanel">
              <div className="panelHeader">
                <div>
                  <span className="sectionLabel">
                    O meni
                  </span>

                  <h3>
                    Više od običnog profila.
                  </h3>
                </div>

                <span className="panelIcon">
                  <Icon
                    name="user"
                    size={21}
                  />
                </span>
              </div>

              <p className="bio">
                {profile.bio ||
                  "Ovaj korisnik još nije dodao opis profila."}
              </p>

              <div className="activities">
                <span>
                  Omiljene aktivnosti
                </span>

                {activities.length > 0 ? (
                  <div className="chips">
                    {activities.map(
                      (item) => (
                        <span
                          className="chip"
                          key={item}
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="miniEmpty">
                    Aktivnosti još nisu dodate.
                  </p>
                )}
              </div>
            </aside>
          </div>

          <section className="panel collectionsPanel">
            <div className="panelHeader">
              <div>
                <span className="sectionLabel">
                  Kolekcije
                </span>

                <h3>
                  Šta najviše istražuješ.
                </h3>
              </div>

              <span className="panelIcon">
                <Icon
                  name="compass"
                  size={21}
                />
              </span>
            </div>

            {categoryCollections.length >
            0 ? (
              <div className="collections">
                {categoryCollections
                  .slice(0, 8)
                  .map((item) => (
                    <article key={item.name}>
                      <span>
                        <Icon
                          name="mapPin"
                          size={17}
                        />
                      </span>

                      <div>
                        <strong>
                          {item.name}
                        </strong>

                        <small>
                          {item.count}{" "}
                          {item.count === 1
                            ? "mesto"
                            : "mesta"}
                        </small>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="passportEmpty">
                Prve kolekcije će se
                pojaviti nakon GPS
                check-ina.
              </div>
            )}
          </section>

          <section className="panel badgesPanel">
            <div className="panelHeader">
              <div>
                <span className="sectionLabel">
                  Bedževi
                </span>

                <h3>
                  Mali dokazi velikih tragova.
                </h3>
              </div>

              <span className="panelIcon">
                <Icon
                  name="trophy"
                  size={21}
                />
              </span>
            </div>

            <div className="achievementGrid">
              {achievements.map(
                (item) => (
                  <article key={item.title}>
                    <span>
                      <Icon
                        name={item.icon}
                        size={20}
                      />
                    </span>

                    <strong>
                      {item.title}
                    </strong>

                    <small>
                      {item.text}
                    </small>
                  </article>
                )
              )}
            </div>
          </section>

          <section className="panel galleryPanel">
            <div className="panelHeader">
              <div>
                <span className="sectionLabel">
                  Moje fotografije
                </span>

                <h3>
                  Mesta kroz tvoj objektiv.
                </h3>
              </div>

              <span className="galleryCount">
                {photos.length}
              </span>
            </div>

            {photos.length > 0 ? (
              <div className="profileGallery">
                {photos
                  .slice(0, 12)
                  .map((photo, index) => (
                    <button
                      type="button"
                      key={photo.id}
                      className={
                        index === 0
                          ? "featured"
                          : ""
                      }
                      onClick={() =>
                        photo.place_id &&
                        navigate(
                          `/explore/${photo.place_id}`
                        )
                      }
                    >
                      <img
                        src={
                          photo.image_url
                        }
                        alt={
                          photo.places
                            ?.name ||
                          "Outdoor fotografija"
                        }
                      />

                      <div>
                        <span>
                          {photo.places
                            ?.name ||
                            "Outdoor mesto"}
                        </span>

                        <small>
                          {formatDate(
                            photo.created_at
                          )}
                        </small>
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="passportEmpty gallery">
                <Icon
                  name="camera"
                  size={26}
                />

                <strong>
                  Još nema fotografija.
                </strong>

                <span>
                  Posle GPS check-ina
                  možeš dodati svoj prvi
                  kadar.
                </span>
              </div>
            )}
          </section>

          <section className="timelineSection">
            <div className="timelineIntro">
              <span className="sectionLabel">
                Timeline
              </span>

              <h3>
                Tvoji poslednji tragovi.
              </h3>

              <p>
                Hronologija GPS
                potvrđenih poseta.
              </p>
            </div>

            <div className="timeline">
              {recentCheckins.length > 0 ? (
                recentCheckins.map(
                  (item, index) => (
                    <Link
                      to={`/explore/${item.place_id}`}
                      key={item.id}
                      className="timelineItem"
                    >
                      <span className="timelineIndex">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <span className="timelineLine" />

                      <div>
                        <small>
                          {formatDate(
                            item.visited_at ||
                              item.created_at
                          )}
                        </small>

                        <strong>
                          {item.places
                            ?.name ||
                            "Outdoor mesto"}
                        </strong>

                        <p>
                          {[
                            item.places
                              ?.locality,
                            item.places
                              ?.region,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " · "
                            ) ||
                            "Srbija"}
                        </p>
                      </div>

                      <Icon
                        name="arrow"
                        size={17}
                      />
                    </Link>
                  )
                )
              ) : (
                <div className="passportEmpty">
                  Još nema GPS
                  potvrđenih poseta.
                </div>
              )}
            </div>
          </section>

          {profile.role === "host" && (
            <section className="hostSection">
              <div className="hostIntro">
                <span className="sectionLabel">
                  Host kontakt
                </span>

                <h3>
                  Poveži se direktno sa
                  organizatorom.
                </h3>

                <p>
                  Kontakt podaci i
                  dodatni kanali na jednom
                  mestu.
                </p>
              </div>

              {hostLinks.length > 0 ? (
                <div className="hostLinks">
                  {hostLinks.map(
                    (item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target={
                          item.href.startsWith(
                            "http"
                          )
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          item.href.startsWith(
                            "http"
                          )
                            ? "noreferrer"
                            : undefined
                        }
                        className="hostLink"
                      >
                        <span className="linkIcon">
                          <Icon
                            name={
                              item.icon
                            }
                            size={20}
                          />
                        </span>

                        <span className="linkCopy">
                          <small>
                            {item.label}
                          </small>

                          <strong>
                            {item.value}
                          </strong>
                        </span>

                        <Icon
                          name="arrow"
                          size={17}
                        />
                      </a>
                    )
                  )}
                </div>
              ) : (
                <div className="hostEmpty">
                  Kontakt podaci još nisu
                  dodati.
                </div>
              )}
            </section>
          )}
        </section>
      </main>
    </>
  );
}

function ProfileStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      html,body,#root{min-height:100%}
      body{margin:0;background:#e9eee6}
      button{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .profilePage,.statePage{min-height:100vh;color:#203229;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .profilePage{padding:96px 28px 70px;background:radial-gradient(circle at 7% 0%,rgba(177,211,139,.18),transparent 27%),radial-gradient(circle at 94% 25%,rgba(64,106,75,.1),transparent 24%),#e9eee6}
      .profilePage a{color:inherit;text-decoration:none}
      .hero{position:relative;isolation:isolate;width:min(1240px,100%);min-height:620px;margin:0 auto;padding:34px;overflow:hidden;border-radius:38px;background:radial-gradient(circle at 85% 15%,rgba(202,241,148,.14),transparent 27%),linear-gradient(135deg,#0d2a1a,#173f28 58%,#28563a);background-position:center;background-size:cover;color:white;box-shadow:0 38px 100px rgba(23,54,36,.22)}
      .hero:before{position:absolute;top:-170px;right:-140px;z-index:-1;width:550px;height:550px;border:1px solid rgba(255,255,255,.07);border-radius:50%;content:"";box-shadow:0 0 0 80px rgba(255,255,255,.02),0 0 0 160px rgba(255,255,255,.012)}
      .heroGlow{position:absolute;bottom:-120px;left:-70px;width:420px;height:420px;border-radius:50%;background:rgba(186,255,158,.08);filter:blur(70px)}
      .heroTop{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:20px}
      .brand{display:inline-flex;align-items:center;gap:10px;color:white!important;font-weight:900;letter-spacing:-.03em}
      .brand>span{display:grid;place-items:center;width:43px;height:43px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(255,255,255,.1);color:#cef39a;backdrop-filter:blur(14px)}
      .homeLink{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 14px;border:1px solid rgba(255,255,255,.17);border-radius:13px;background:rgba(255,255,255,.1);color:white!important;font-size:10px;font-weight:850;backdrop-filter:blur(14px)}
      .heroCopy{position:relative;z-index:2;max-width:800px;padding-top:132px}
      .eyebrow{display:inline-flex;align-items:center;gap:9px;padding:9px 13px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.76);font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .eyebrow>span{width:7px;height:7px;border-radius:50%;background:#cef39a;box-shadow:0 0 0 5px rgba(206,243,154,.12)}
      .heroCopy h1{margin:24px 0 0;font-size:clamp(64px,8vw,106px);line-height:.87;letter-spacing:-.08em}
      .heroCopy p{max-width:590px;margin:25px 0 0;color:rgba(255,255,255,.63);font-size:13px;line-height:1.75}
      .heroPassportStamp{position:absolute;right:34px;bottom:34px;z-index:2;display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid rgba(206,243,154,.18);border-radius:17px;background:rgba(5,18,10,.45);color:#cef39a;backdrop-filter:blur(18px)}
      .heroPassportStamp small,.heroPassportStamp strong{display:block}
      .heroPassportStamp small{font-size:6px;font-weight:900;letter-spacing:.11em}
      .heroPassportStamp strong{margin-top:3px;color:white;font-size:11px}
      .content{position:relative;z-index:3;width:min(1140px,100%);margin:-74px auto 0}
      .mainCard{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;padding:26px;border:1px solid rgba(221,229,218,.9);border-radius:28px;background:rgba(255,255,255,.9);box-shadow:0 24px 60px rgba(28,49,35,.1);backdrop-filter:blur(22px)}
      .identity{display:flex;align-items:flex-end;gap:22px;min-width:0}
      .avatarWrap{position:relative;flex:0 0 auto}
      .avatar{display:block;width:150px;height:150px;border:5px solid white;border-radius:38px;object-fit:cover;box-shadow:0 18px 42px rgba(29,50,37,.16)}
      .verifiedMark{position:absolute;right:-6px;bottom:7px;display:grid;place-items:center;width:42px;height:42px;border:4px solid white;border-radius:50%;background:#264f36;color:#d7f7a5}
      .identityCopy{min-width:0;padding-bottom:8px}
      .badges{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
      .roleBadge,.verifiedBadge,.passportBadge{display:inline-flex;align-items:center;gap:6px;min-height:29px;padding:0 10px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .roleBadge{background:#e7f0dc;color:#5b7840}
      .passportBadge{background:#173b27;color:#d8ffbf}
      .verifiedBadge{background:#e8eef5;color:#52708e}
      .identityCopy h2{margin:13px 0 0;color:#263a2f;font-size:clamp(32px,5vw,50px);line-height:1;letter-spacing:-.06em}
      .username{margin:7px 0 0;color:#87928a;font-size:12px;font-weight:650}
      .location{display:flex;align-items:center;gap:7px;margin:12px 0 0;color:#627168;font-size:10px;font-weight:700}
      .actions{display:flex;align-items:center;gap:10px;flex:0 0 auto}
      .editButton,.logoutButton{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:45px;padding:0 16px;border-radius:14px;cursor:pointer;font-size:10px;font-weight:850}
      .editButton{border:1px solid #244d34;background:#183a27;color:white!important}
      .logoutButton{border:1px solid #efd1cc;background:#fff3f1;color:#a54c42}
      .logoutButton:disabled{cursor:wait;opacity:.65}
      .passportStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
      .passportStats article{display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:11px;padding:13px;border:1px solid #dbe4d8;border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 12px 30px rgba(31,51,38,.045)}
      .passportStatIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:15px}
      .passportStatIcon.green{background:#e7f2df;color:#557c3c}
      .passportStatIcon.dark{background:#173b27;color:#baff9e}
      .passportStatIcon.sand{background:#fff3d9;color:#987329}
      .passportStatIcon.rose{background:#fdebea;color:#a45149}
      .passportStats strong,.passportStats span{display:block}
      .passportStats strong{font-size:22px;letter-spacing:-.04em}
      .passportStats article>div>span{margin-top:3px;color:#89938c;font-size:7px;font-weight:800;text-transform:uppercase}
      .passportLevel{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);align-items:center;gap:30px;margin-top:18px;padding:24px 26px;border-radius:24px;background:linear-gradient(145deg,#0f2d1c,#1d4c31);color:white;box-shadow:0 20px 45px rgba(23,58,39,.14)}
      .passportLevelCopy h3{margin:7px 0 0;color:#baff9e;font-size:28px;letter-spacing:-.04em}
      .passportLevelCopy p{margin:7px 0 0;color:rgba(255,255,255,.48);font-size:9px}
      .passportProgress>div{height:12px;padding:3px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06)}
      .passportProgress>div>span{display:block;height:100%;border-radius:999px;background:#baff9e}
      .passportProgress footer{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
      .passportProgress footer span{color:rgba(255,255,255,.45);font-size:7px}
      .passportProgress footer strong{color:#baff9e;font-size:7px;letter-spacing:.08em}
      .profileGrid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(320px,.7fr);gap:18px;margin-top:18px}
      .panel,.hostSection{border:1px solid #dbe4d8;border-radius:26px;background:rgba(255,255,255,.78);box-shadow:0 14px 38px rgba(31,51,38,.05)}
      .panel{padding:27px}
      .panelHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
      .sectionLabel{color:#789456;font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
      .panelHeader h3,.hostIntro h3,.timelineIntro h3{margin:8px 0 0;color:#2f4437;font-size:24px;line-height:1.08;letter-spacing:-.04em}
      .panelLead{margin:7px 0 0;color:#8b958e;font-size:8px}
      .panelIcon{display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;border-radius:14px;background:#e8f0de;color:#608046}
      .bio{margin:27px 0 0;color:#69766e;font-size:12px;line-height:1.8}
      .activities{margin-top:29px;padding-top:22px;border-top:1px solid #e4e9e1}
      .activities>span{display:block;margin-bottom:12px;color:#667369;font-size:8px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
      .chips{display:flex;flex-wrap:wrap;gap:8px}
      .chip{padding:9px 12px;border:1px solid #d7e2d1;border-radius:999px;background:#f5f8f2;color:#506557;font-size:8px;font-weight:750}
      .miniEmpty{margin:0;color:#879289;font-size:9px}
      .passportMap{position:relative;height:390px;margin-top:18px;overflow:hidden;border-radius:20px}
      .passportLeaflet{width:100%;height:100%}
      .passportMarkerShell{background:transparent!important;border:0!important}
      .passportMarker{position:relative;width:42px;height:42px;padding:3px;border:3px solid white;border-radius:14px;background:#173b27;box-shadow:0 12px 26px rgba(20,48,31,.28)}
      .passportMarker img{width:100%;height:100%;border-radius:9px;object-fit:cover}
      .passportMarker span{position:absolute;bottom:-7px;left:50%;width:14px;height:14px;border-right:3px solid white;border-bottom:3px solid white;background:#173b27;transform:translateX(-50%) rotate(45deg);z-index:-1}
      .passportMapHud{position:absolute;right:11px;bottom:11px;z-index:500;display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(6,18,10,.72);color:#dfffd1;font-size:6px;font-weight:900;letter-spacing:.07em;backdrop-filter:blur(10px)}
      .collectionsPanel,.badgesPanel,.galleryPanel{margin-top:18px}
      .collections{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:18px}
      .collections article{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:9px;padding:11px;border:1px solid #e0e7dd;border-radius:15px;background:#f8faf6}
      .collections article>span{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#e9f1e3;color:#608046}
      .collections strong,.collections small{display:block}
      .collections strong{font-size:8px}
      .collections small{margin-top:3px;color:#929c95;font-size:6px}
      .achievementGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:18px}
      .achievementGrid article{padding:15px;border:1px solid #dfe6dc;border-radius:17px;background:linear-gradient(145deg,#f9fbf7,#f3f7ef)}
      .achievementGrid article>span{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#173b27;color:#baff9e}
      .achievementGrid strong,.achievementGrid small{display:block}
      .achievementGrid strong{margin-top:12px;font-size:9px}
      .achievementGrid small{margin-top:4px;color:#89938c;font-size:7px;line-height:1.4}
      .galleryCount{display:grid;place-items:center;min-width:38px;height:38px;border-radius:12px;background:#e8f0de;color:#608046;font-size:9px;font-weight:900}
      .profileGallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:18px}
      .profileGallery button{position:relative;height:220px;padding:0;overflow:hidden;border:0;border-radius:17px;background:#dce5d8;cursor:pointer}
      .profileGallery button.featured{grid-column:span 2;grid-row:span 2;height:449px}
      .profileGallery img{width:100%;height:100%;object-fit:cover}
      .profileGallery button>div{position:absolute;right:8px;bottom:8px;left:8px;padding:8px;border-radius:11px;background:rgba(5,17,10,.62);color:white;text-align:left;backdrop-filter:blur(10px)}
      .profileGallery button>div span,.profileGallery button>div small{display:block}
      .profileGallery button>div span{overflow:hidden;font-size:7px;font-weight:850;text-overflow:ellipsis;white-space:nowrap}
      .profileGallery button>div small{margin-top:3px;color:rgba(255,255,255,.48);font-size:5px}
      .passportEmpty{display:grid;place-items:center;min-height:130px;margin-top:18px;padding:22px;border:1px dashed #ccd7c8;border-radius:18px;background:#f8faf6;color:#879289;font-size:9px;text-align:center}
      .passportEmpty.gallery{gap:7px}
      .passportEmpty.gallery strong{font-size:9px}
      .passportEmpty.gallery span{font-size:7px}
      .timelineSection{display:grid;grid-template-columns:minmax(220px,.35fr) minmax(0,.65fr);gap:24px;margin-top:18px;padding:28px;border:1px solid #dbe4d8;border-radius:26px;background:rgba(255,255,255,.78);box-shadow:0 14px 38px rgba(31,51,38,.05)}
      .timelineIntro p{margin:10px 0 0;color:#88938b;font-size:9px;line-height:1.5}
      .timeline{display:grid;gap:7px}
      .timelineItem{display:grid;grid-template-columns:38px 1px minmax(0,1fr) auto;align-items:center;gap:11px;padding:10px;border:1px solid #e0e7dd;border-radius:14px;background:#f8faf6}
      .timelineIndex{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#173b27;color:#baff9e;font-size:7px;font-weight:900}
      .timelineLine{width:1px;height:31px;background:#d6dfd2}
      .timelineItem small,.timelineItem strong,.timelineItem p{display:block}
      .timelineItem small{color:#98a19a;font-size:5px;text-transform:uppercase}
      .timelineItem strong{margin-top:3px;font-size:8px}
      .timelineItem p{margin:3px 0 0;color:#7d8981;font-size:6px}
      .hostSection{display:grid;grid-template-columns:minmax(0,.65fr) minmax(500px,1.35fr);gap:30px;margin-top:18px;padding:30px}
      .hostIntro p{max-width:430px;margin:14px 0 0;color:#7d8981;font-size:10px;line-height:1.7}
      .hostLinks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .hostLink{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;min-width:0;padding:14px;border:1px solid #dfe6dc;border-radius:17px;background:#f8faf6}
      .linkIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#e7f0dc;color:#5d7d43}
      .linkCopy{min-width:0}
      .linkCopy small,.linkCopy strong{display:block}
      .linkCopy small{color:#929c95;font-size:7px}
      .linkCopy strong{margin-top:4px;overflow:hidden;color:#405347;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
      .hostEmpty{display:grid;place-items:center;min-height:130px;border:1px dashed #ccd7c8;border-radius:18px;color:#879289;font-size:9px}
      .errorBox{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;margin-bottom:16px;padding:14px;border:1px solid #efc7c2;border-radius:16px;background:#fff0ee;color:#963f35}
      .errorBox p{margin:0;font-size:9px}
      .errorBox button{border:0;background:transparent;color:inherit;cursor:pointer;font-size:8px;font-weight:850}
      .statePage{display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top left,rgba(166,203,126,.18),transparent 30%),#edf1e9}
      .stateCard{display:grid;place-items:center;width:min(500px,100%);padding:50px 30px;border:1px solid #dce3d9;border-radius:28px;background:rgba(255,255,255,.84);text-align:center;box-shadow:0 20px 60px rgba(28,48,35,.08)}
      .loader{width:38px;height:38px;border:3px solid #dce5d7;border-top-color:#52783c;border-radius:50%;animation:spin .8s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      .stateIcon{display:grid;place-items:center;width:62px;height:62px;border-radius:20px;background:#ffe9e5;color:#a85247}
      .stateCard h1{margin:18px 0 0;color:#263a2f;font-size:28px;letter-spacing:-.04em}
      .stateCard p{max-width:380px;margin:9px 0 0;color:#7e8981;font-size:11px;line-height:1.65}
      .stateCard button{display:inline-flex;align-items:center;gap:7px;margin-top:20px;padding:12px 15px;border:0;border-radius:12px;background:#183a27;color:white;cursor:pointer;font-size:10px;font-weight:850}

      @media(max-width:980px){
        .mainCard{align-items:flex-start;flex-direction:column}
        .passportStats{grid-template-columns:repeat(2,minmax(0,1fr))}
        .profileGrid,.timelineSection,.hostSection{grid-template-columns:1fr}
        .collections{grid-template-columns:repeat(2,minmax(0,1fr))}
        .achievementGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }

      @media(max-width:700px){
        .profilePage{padding:78px 0 56px}
        .hero{min-height:650px;padding:22px;border-radius:0 0 32px 32px}
        .heroCopy{padding-top:140px}
        .heroPassportStamp{right:22px;bottom:22px}
        .content{padding:0 12px}
        .identity{align-items:flex-start;flex-direction:column}
        .avatar{width:132px;height:132px;border-radius:34px}
        .passportStats{grid-template-columns:1fr 1fr}
        .passportLevel{grid-template-columns:1fr}
        .profileGallery{grid-template-columns:repeat(2,minmax(0,1fr))}
        .profileGallery button.featured{grid-column:1/-1;grid-row:auto;height:320px}
        .hostLinks{grid-template-columns:1fr}
      }

      @media(max-width:480px){
        .hero{min-height:610px;padding:18px}
        .heroCopy h1{font-size:52px}
        .homeLink{width:42px;padding:0;justify-content:center;font-size:0}
        .heroPassportStamp{left:18px;right:auto}
        .content{padding:0 9px}
        .mainCard,.panel,.hostSection,.timelineSection{padding:18px}
        .actions{width:100%;align-items:stretch;flex-direction:column}
        .editButton,.logoutButton{width:100%}
        .passportStats{grid-template-columns:1fr}
        .collections,.achievementGrid{grid-template-columns:1fr}
        .passportMap{height:300px}
        .profileGallery{grid-template-columns:1fr}
        .profileGallery button,.profileGallery button.featured{grid-column:auto;height:250px}
      }

      @media(prefers-reduced-motion:reduce){
        *,*:before,*:after{
          animation:none!important;
          transition:none!important;
          scroll-behavior:auto!important
        }
      }
    `}</style>
  );
}
