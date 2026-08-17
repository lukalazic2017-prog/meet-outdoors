import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
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
  "https://api.dicebear.com/8.x/initials/svg?seed=MeetOutdoors";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1800&auto=format&fit=crop";

function Icon({ name, size = 20, strokeWidth = 2 }) {
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
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
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
    verified: (
      <>
        <path d="M12 3l2.2 1.7 2.8-.2.9 2.7 2.3 1.6-1 2.6.7 2.7-2.4 1.4-.6 2.8-2.8-.1L12 20l-2.1-1.8-2.8.1-.6-2.8-2.4-1.4.7-2.7-1-2.6 2.3-1.6.9-2.7 2.8.2Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
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
  const image = place?.cover_url || FALLBACK_COVER;

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
      <UserProfileStyles />

      <main className="userPassportStatePage">
        <div className="userPassportStateCard">
          <span className="userPassportLoader" />
          <h1>Učitavanje profila</h1>
          <p>
            Pripremamo Outdoor Passport ovog člana.
          </p>
        </div>
      </main>
    </>
  );
}

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [checkins, setCheckins] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.warn(
          "Greška pri proveri korisnika:",
          authError
        );
      }

      setCurrentUserId(user?.id || null);

      const {
        data: userProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .eq("role", "user")
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(userProfile);

      const [
        checkinsResult,
        photosResult,
        savesResult,
      ] = await Promise.all([
        supabase
          .from("place_checkins")
          .select(`
            id,
            place_id,
            visited_at,
            created_at,
            is_gps_verified,
            visibility,
            places:place_id (
              id,
              name,
              latitude,
              longitude,
              locality,
              region,
              cover_url,
              is_active,
              place_categories:category_id (
                id,
                name,
                code
              )
            )
          `)
          .eq("user_id", userProfile.id)
          .eq("is_gps_verified", true)
          .eq("visibility", "public")
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
              name,
              cover_url,
              locality,
              region
            )
          `)
          .eq("user_id", userProfile.id)
          .eq("moderation_status", "approved")
          .order("created_at", {
            ascending: false,
          })
          .limit(100),

        supabase
          .from("place_saves")
          .select(`
            id,
            place_id,
            created_at,
            places:place_id (
              id,
              name,
              cover_url,
              locality,
              region,
              latitude,
              longitude,
              is_active,
              place_categories:category_id (
                id,
                name,
                code
              )
            )
          `)
          .eq("user_id", userProfile.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(100),
      ]);

      if (!checkinsResult.error) {
        setCheckins(
          (checkinsResult.data || []).filter(
            (item) => item.places
          )
        );
      } else {
        console.warn(
          "User checkins:",
          checkinsResult.error
        );
        setCheckins([]);
      }

      if (!photosResult.error) {
        setPhotos(photosResult.data || []);
      } else {
        console.warn(
          "User photos:",
          photosResult.error
        );
        setPhotos([]);
      }

      if (!savesResult.error) {
        setSavedPlaces(
          (savesResult.data || []).filter(
            (item) => item.places
          )
        );
      } else {
        console.warn(
          "User saves:",
          savesResult.error
        );
        setSavedPlaces([]);
      }
    } catch (err) {
      console.error(
        "Greška pri učitavanju profila:",
        err
      );

      setProfile(null);
      setCheckins([]);
      setPhotos([]);
      setSavedPlaces([]);

      setError(
        err.message ||
          "Korisnički profil trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isOwnProfile =
    currentUserId === profile?.id;

  const displayName =
    profile?.full_name ||
    "MeetOutdoors User";

  const location = [
    profile?.city,
    profile?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const activities = useMemo(
    () =>
      Array.isArray(profile?.activities)
        ? profile.activities
        : [],
    [profile?.activities]
  );

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

  const mapPlaces = useMemo(
    () =>
      visitedPlaces.filter(
        (place) =>
          Number.isFinite(
            Number(place.latitude)
          ) &&
          Number.isFinite(
            Number(place.longitude)
          )
      ),
    [visitedPlaces]
  );

  const mapCenter = useMemo(() => {
    if (mapPlaces.length === 0) {
      return SERBIA_CENTER;
    }

    return [
      Number(mapPlaces[0].latitude),
      Number(mapPlaces[0].longitude),
    ];
  }, [mapPlaces]);

  const recentCheckins = useMemo(
    () => checkins.slice(0, 8),
    [checkins]
  );

  const achievements = useMemo(() => {
    const items = [];

    if (checkins.length >= 1) {
      items.push({
        icon: "mapPin",
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

    if (savedPlaces.length >= 20) {
      items.push({
        icon: "heart",
        title: "Bucket list",
        text: "20 sačuvanih mesta",
      });
    }

    if (items.length === 0) {
      items.push({
        icon: "sparkle",
        title: "Početak",
        text: "Prvi bedž čeka prvi trag",
      });
    }

    return items.slice(0, 6);
  }, [
    checkins.length,
    photos.length,
    savedPlaces.length,
    visitedPlaces.length,
  ]);

  if (loading) {
    return <LoadingState />;
  }

  if (!profile) {
    return (
      <>
        <UserProfileStyles />

        <main className="userPassportStatePage">
          <div className="userPassportStateCard">
            <span className="userPassportStateIcon">
              <Icon name="alert" size={28} />
            </span>

            <h1>Profil nije pronađen</h1>

            <p>
              {error ||
                "Ovaj korisnički profil ne postoji ili više nije dostupan."}
            </p>

            <div className="userPassportStateActions">
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

              <Link to="/">
                <Icon
                  name="arrowLeft"
                  size={16}
                />
                Početna
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <UserProfileStyles />

      <main className="userPassportPage">
        <section
          className="userPassportHero"
          style={{
            backgroundImage: `linear-gradient(
              180deg,
              rgba(6,21,13,.12),
              rgba(6,21,13,.88)
            ), url(${profile.cover_url || FALLBACK_COVER})`,
          }}
        >
          <div className="userPassportHeroGlow" />

          <div className="userPassportHeroTop">
            <Link
              to="/explore"
              className="userPassportBrand"
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
              className="userPassportExploreLink"
            >
              Explore mapa
              <Icon
                name="arrowRight"
                size={15}
              />
            </Link>
          </div>

          <div className="userPassportHeroCopy">
            <span className="userPassportEyebrow">
              <span />
              Outdoor Passport
            </span>

            <h1>
              Tvoja mapa.
              <br />
              Tvoja priča.
            </h1>

            <p>
              GPS potvrđena mesta, fotografije,
              kolekcije i outdoor tragovi jednog
              MeetOutdoors člana.
            </p>
          </div>

          <div className="userPassportLevelStamp">
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

        <section className="userPassportContent">
          <article className="userPassportIdentityCard">
            <div className="userPassportIdentity">
              <div className="userPassportAvatarWrap">
                <img
                  src={
                    profile.avatar_url ||
                    FALLBACK_AVATAR
                  }
                  alt={displayName}
                  className="userPassportAvatar"
                />

                <span className="userPassportAvatarBadge">
                  <Icon
                    name="sparkle"
                    size={18}
                  />
                </span>
              </div>

              <div className="userPassportIdentityCopy">
                <div className="userPassportBadges">
                  <span className="memberBadge">
                    Outdoor member
                  </span>

                  <span className="levelBadge">
                    <Icon
                      name="trophy"
                      size={14}
                    />
                    {level.name}
                  </span>
                </div>

                <h2>{displayName}</h2>

                <p className="userPassportUsername">
                  @{profile.username}
                </p>

                <p className="userPassportLocation">
                  <Icon
                    name="mapPin"
                    size={16}
                  />
                  {location ||
                    "Lokacija još nije dodata"}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <Link
                to="/edit-profile"
                className="userPassportEdit"
              >
                <Icon
                  name="edit"
                  size={17}
                />
                Izmeni profil
              </Link>
            )}
          </article>

          <section className="userPassportStats">
            <article>
              <span className="statIcon green">
                <Icon
                  name="mapPin"
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
              <span className="statIcon dark">
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
              <span className="statIcon sand">
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
              <span className="statIcon rose">
                <Icon
                  name="heart"
                  size={19}
                />
              </span>

              <div>
                <strong>
                  {formatNumber(
                    savedPlaces.length
                  )}
                </strong>
                <span>
                  sačuvanih mesta
                </span>
              </div>
            </article>
          </section>

          <section className="userPassportLevel">
            <div>
              <span className="userPassportSectionLabel">
                Outdoor level
              </span>

              <h3>{level.name}</h3>

              <p>
                {level.next
                  ? `${Math.max(
                      0,
                      level.max -
                        visitedPlaces.length
                    )} novih mesta do nivoa ${level.next}.`
                  : "Najviši Outdoor Passport nivo je otključan."}
              </p>
            </div>

            <div className="levelProgress">
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

          <div className="userPassportGrid">
            <section className="userPassportPanel mapPanel">
              <div className="panelHeader">
                <div>
                  <span className="userPassportSectionLabel">
                    Moja mapa
                  </span>

                  <h3>
                    Mesta koja je stvarno obišao/la.
                  </h3>

                  <p>
                    Samo javni GPS potvrđeni
                    check-inovi.
                  </p>
                </div>

                <span className="panelIcon">
                  <Icon
                    name="layers"
                    size={21}
                  />
                </span>
              </div>

              <div className="userPassportMap">
                <MapContainer
                  center={mapCenter}
                  zoom={
                    mapPlaces.length > 0
                      ? 7
                      : 6
                  }
                  scrollWheelZoom={false}
                  className="userPassportLeaflet"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {mapPlaces.map((place) => (
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
                  ))}
                </MapContainer>

                <div className="userPassportMapHud">
                  <Icon
                    name="verified"
                    size={14}
                  />
                  GPS VERIFIED ONLY
                </div>
              </div>
            </section>

            <aside className="userPassportPanel aboutPanel">
              <div className="panelHeader">
                <div>
                  <span className="userPassportSectionLabel">
                    O članu
                  </span>

                  <h3>
                    Priča iza profila.
                  </h3>
                </div>

                <span className="panelIcon">
                  <Icon
                    name="user"
                    size={21}
                  />
                </span>
              </div>

              <p className="userPassportBio">
                {profile.bio ||
                  "Ovaj član još nije dodao biografiju. Avanture možda govore više od reči, ali dobar opis ipak pomaže."}
              </p>

              <div className="userPassportActivities">
                <span>
                  Omiljene aktivnosti
                </span>

                {activities.length > 0 ? (
                  <div className="activityChips">
                    {activities.map(
                      (activity) => (
                        <span
                          key={activity}
                        >
                          {activity}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <div className="miniEmpty">
                    Aktivnosti još nisu
                    dodate.
                  </div>
                )}
              </div>
            </aside>
          </div>

          <section className="userPassportPanel collectionsPanel">
            <div className="panelHeader">
              <div>
                <span className="userPassportSectionLabel">
                  Kolekcije
                </span>

                <h3>
                  Šta najviše istražuje.
                </h3>
              </div>

              <span className="panelIcon">
                <Icon
                  name="grid"
                  size={21}
                />
              </span>
            </div>

            {categoryCollections.length >
            0 ? (
              <div className="collectionsGrid">
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
                Kolekcije će se pojaviti
                nakon GPS check-inova.
              </div>
            )}
          </section>

          <section className="userPassportPanel badgesPanel">
            <div className="panelHeader">
              <div>
                <span className="userPassportSectionLabel">
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

            <div className="achievementsGrid">
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

          <section className="userPassportPanel galleryPanel">
            <div className="panelHeader">
              <div>
                <span className="userPassportSectionLabel">
                  Fotografije
                </span>

                <h3>
                  Mesta kroz njegov/njen objektiv.
                </h3>
              </div>

              <span className="galleryCount">
                {photos.length}
              </span>
            </div>

            {photos.length > 0 ? (
              <div className="userPassportGallery">
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
                        src={photo.image_url}
                        alt={
                          photo.places?.name ||
                          "Outdoor fotografija"
                        }
                      />

                      <div>
                        <strong>
                          {photo.places?.name ||
                            "Outdoor mesto"}
                        </strong>

                        <span>
                          {formatDate(
                            photo.created_at
                          )}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="passportEmpty galleryEmpty">
                <Icon
                  name="camera"
                  size={27}
                />

                <strong>
                  Još nema fotografija.
                </strong>

                <span>
                  Kada član doda fotografije
                  na Explore mestu, pojaviće se
                  ovde.
                </span>
              </div>
            )}
          </section>

          <section className="userPassportPanel savedPanel">
            <div className="panelHeader">
              <div>
                <span className="userPassportSectionLabel">
                  Želim da posetim
                </span>

                <h3>
                  Javni outdoor bucket list.
                </h3>
              </div>

              <span className="panelIcon">
                <Icon
                  name="heart"
                  size={21}
                />
              </span>
            </div>

            {savedPlaces.length > 0 ? (
              <div className="savedGrid">
                {savedPlaces
                  .slice(0, 8)
                  .map((item) => (
                    <Link
                      key={item.id}
                      to={`/explore/${item.place_id}`}
                    >
                      <img
                        src={
                          item.places?.cover_url ||
                          FALLBACK_COVER
                        }
                        alt=""
                      />

                      <div>
                        <span>
                          {item.places
                            ?.place_categories
                            ?.name ||
                            "Outdoor"}
                        </span>

                        <strong>
                          {item.places?.name ||
                            "Outdoor mesto"}
                        </strong>

                        <small>
                          {[
                            item.places
                              ?.locality,
                            item.places
                              ?.region,
                          ]
                            .filter(Boolean)
                            .join(" · ") ||
                            "Srbija"}
                        </small>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="passportEmpty">
                Nema sačuvanih mesta.
              </div>
            )}
          </section>

          <section className="timelineSection">
            <div className="timelineIntro">
              <span className="userPassportSectionLabel">
                Timeline
              </span>

              <h3>
                Poslednji outdoor tragovi.
              </h3>

              <p>
                Hronologija javnih GPS
                potvrđenih poseta.
              </p>
            </div>

            <div className="timelineList">
              {recentCheckins.length > 0 ? (
                recentCheckins.map(
                  (item, index) => (
                    <Link
                      to={`/explore/${item.place_id}`}
                      key={item.id}
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
                          {item.places?.name ||
                            "Outdoor mesto"}
                        </strong>

                        <p>
                          {[
                            item.places
                              ?.locality,
                            item.places
                              ?.region,
                          ]
                            .filter(Boolean)
                            .join(" · ") ||
                            "Srbija"}
                        </p>
                      </div>

                      <Icon
                        name="arrowRight"
                        size={17}
                      />
                    </Link>
                  )
                )
              ) : (
                <div className="passportEmpty">
                  Još nema javnih GPS
                  potvrđenih poseta.
                </div>
              )}
            </div>
          </section>

          <section className="communityCard">
            <div>
              <span className="userPassportSectionLabel">
                MeetOutdoors zajednica
              </span>

              <h3>
                Ne skupljamo samo lajkove.
                Skupljamo mesta.
              </h3>

              <p>
                Pogledaj Explore mapu i pronađi
                sledeće mesto koje vredi posetiti.
              </p>
            </div>

            <Link to="/explore">
              Istraži mapu
              <Icon
                name="arrowRight"
                size={16}
              />
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function UserProfileStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      html,body,#root{min-height:100%}
      body{margin:0;background:#e9eee6}
      button{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .userPassportPage,.userPassportStatePage{min-height:100vh;color:#203229;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .userPassportPage{padding:96px 28px 70px;background:radial-gradient(circle at 7% 0%,rgba(177,211,139,.18),transparent 27%),radial-gradient(circle at 94% 25%,rgba(64,106,75,.1),transparent 24%),#e9eee6}
      .userPassportPage a{color:inherit;text-decoration:none}
      .userPassportHero{position:relative;isolation:isolate;width:min(1240px,100%);min-height:620px;margin:0 auto;padding:34px;overflow:hidden;border-radius:38px;background-position:center;background-size:cover;color:white;box-shadow:0 38px 100px rgba(23,54,36,.22)}
      .userPassportHero::before{position:absolute;top:-170px;right:-140px;z-index:-1;width:550px;height:550px;border:1px solid rgba(255,255,255,.07);border-radius:50%;content:"";box-shadow:0 0 0 80px rgba(255,255,255,.02),0 0 0 160px rgba(255,255,255,.012)}
      .userPassportHeroGlow{position:absolute;bottom:-120px;left:-70px;width:420px;height:420px;border-radius:50%;background:rgba(186,255,158,.08);filter:blur(70px)}
      .userPassportHeroTop{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:20px}
      .userPassportBrand{display:inline-flex;align-items:center;gap:10px;color:white!important;font-weight:900;letter-spacing:-.03em}
      .userPassportBrand>span{display:grid;place-items:center;width:43px;height:43px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(255,255,255,.1);color:#cef39a;backdrop-filter:blur(14px)}
      .userPassportExploreLink{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 14px;border:1px solid rgba(255,255,255,.17);border-radius:13px;background:rgba(255,255,255,.1);color:white!important;font-size:10px;font-weight:850;backdrop-filter:blur(14px)}
      .userPassportHeroCopy{position:relative;z-index:2;max-width:800px;padding-top:132px}
      .userPassportEyebrow{display:inline-flex;align-items:center;gap:9px;padding:9px 13px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.76);font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .userPassportEyebrow>span{width:7px;height:7px;border-radius:50%;background:#cef39a;box-shadow:0 0 0 5px rgba(206,243,154,.12)}
      .userPassportHeroCopy h1{margin:24px 0 0;font-size:clamp(64px,8vw,106px);line-height:.87;letter-spacing:-.08em}
      .userPassportHeroCopy p{max-width:590px;margin:25px 0 0;color:rgba(255,255,255,.63);font-size:13px;line-height:1.75}
      .userPassportLevelStamp{position:absolute;right:34px;bottom:34px;z-index:2;display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid rgba(206,243,154,.18);border-radius:17px;background:rgba(5,18,10,.45);color:#cef39a;backdrop-filter:blur(18px)}
      .userPassportLevelStamp small,.userPassportLevelStamp strong{display:block}
      .userPassportLevelStamp small{font-size:6px;font-weight:900;letter-spacing:.11em}
      .userPassportLevelStamp strong{margin-top:3px;color:white;font-size:11px}
      .userPassportContent{position:relative;z-index:3;width:min(1140px,100%);margin:-74px auto 0}
      .userPassportIdentityCard{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;padding:26px;border:1px solid rgba(221,229,218,.9);border-radius:28px;background:rgba(255,255,255,.9);box-shadow:0 24px 60px rgba(28,49,35,.1);backdrop-filter:blur(22px)}
      .userPassportIdentity{display:flex;align-items:flex-end;gap:22px;min-width:0}
      .userPassportAvatarWrap{position:relative;flex:0 0 auto}
      .userPassportAvatar{display:block;width:150px;height:150px;border:5px solid white;border-radius:38px;object-fit:cover;box-shadow:0 18px 42px rgba(29,50,37,.16)}
      .userPassportAvatarBadge{position:absolute;right:-6px;bottom:7px;display:grid;place-items:center;width:42px;height:42px;border:4px solid white;border-radius:50%;background:#264f36;color:#d7f7a5}
      .userPassportIdentityCopy{min-width:0;padding-bottom:8px}
      .userPassportBadges{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
      .memberBadge,.levelBadge{display:inline-flex;align-items:center;gap:6px;min-height:29px;padding:0 10px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .memberBadge{background:#e7f0dc;color:#5b7840}
      .levelBadge{background:#173b27;color:#d8ffbf}
      .userPassportIdentityCopy h2{margin:13px 0 0;color:#263a2f;font-size:clamp(32px,5vw,50px);line-height:1;letter-spacing:-.06em}
      .userPassportUsername{margin:7px 0 0;color:#87928a;font-size:12px;font-weight:650}
      .userPassportLocation{display:flex;align-items:center;gap:7px;margin:12px 0 0;color:#627168;font-size:10px;font-weight:700}
      .userPassportEdit{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:45px;padding:0 16px;border:1px solid #244d34;border-radius:14px;background:#183a27;color:white!important;font-size:10px;font-weight:850}
      .userPassportStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
      .userPassportStats article{display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:11px;padding:13px;border:1px solid #dbe4d8;border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 12px 30px rgba(31,51,38,.045)}
      .statIcon{display:grid;place-items:center;width:48px;height:48px;border-radius:15px}
      .statIcon.green{background:#e7f2df;color:#557c3c}
      .statIcon.dark{background:#173b27;color:#baff9e}
      .statIcon.sand{background:#fff3d9;color:#987329}
      .statIcon.rose{background:#fdebea;color:#a45149}
      .userPassportStats strong,.userPassportStats span{display:block}
      .userPassportStats strong{font-size:22px;letter-spacing:-.04em}
      .userPassportStats article>div>span{margin-top:3px;color:#89938c;font-size:7px;font-weight:800;text-transform:uppercase}
      .userPassportLevel{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);align-items:center;gap:30px;margin-top:18px;padding:24px 26px;border-radius:24px;background:linear-gradient(145deg,#0f2d1c,#1d4c31);color:white;box-shadow:0 20px 45px rgba(23,58,39,.14)}
      .userPassportLevel h3{margin:7px 0 0;color:#baff9e;font-size:28px;letter-spacing:-.04em}
      .userPassportLevel p{margin:7px 0 0;color:rgba(255,255,255,.48);font-size:9px}
      .levelProgress>div{height:12px;padding:3px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06)}
      .levelProgress>div>span{display:block;height:100%;border-radius:999px;background:#baff9e}
      .levelProgress footer{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
      .levelProgress footer span{color:rgba(255,255,255,.45);font-size:7px}
      .levelProgress footer strong{color:#baff9e;font-size:7px;letter-spacing:.08em}
      .userPassportGrid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(320px,.7fr);gap:18px;margin-top:18px}
      .userPassportPanel,.communityCard,.timelineSection{border:1px solid #dbe4d8;border-radius:26px;background:rgba(255,255,255,.78);box-shadow:0 14px 38px rgba(31,51,38,.05)}
      .userPassportPanel{padding:27px}
      .panelHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
      .userPassportSectionLabel{color:#789456;font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
      .panelHeader h3,.communityCard h3,.timelineIntro h3{margin:8px 0 0;color:#2f4437;font-size:24px;line-height:1.08;letter-spacing:-.04em}
      .panelHeader p{margin:7px 0 0;color:#8b958e;font-size:8px}
      .panelIcon{display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;border-radius:14px;background:#e8f0de;color:#608046}
      .userPassportBio{margin:27px 0 0;color:#69766e;font-size:12px;line-height:1.8}
      .userPassportActivities{margin-top:29px;padding-top:22px;border-top:1px solid #e4e9e1}
      .userPassportActivities>span{display:block;margin-bottom:12px;color:#667369;font-size:8px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
      .activityChips{display:flex;flex-wrap:wrap;gap:8px}
      .activityChips span{padding:9px 12px;border:1px solid #d7e2d1;border-radius:999px;background:#f5f8f2;color:#506557;font-size:8px;font-weight:750}
      .miniEmpty{margin:0;color:#879289;font-size:9px}
      .userPassportMap{position:relative;height:390px;margin-top:18px;overflow:hidden;border-radius:20px}
      .userPassportLeaflet{width:100%;height:100%}
      .passportMarkerShell{background:transparent!important;border:0!important}
      .passportMarker{position:relative;width:42px;height:42px;padding:3px;border:3px solid white;border-radius:14px;background:#173b27;box-shadow:0 12px 26px rgba(20,48,31,.28)}
      .passportMarker img{width:100%;height:100%;border-radius:9px;object-fit:cover}
      .passportMarker span{position:absolute;bottom:-7px;left:50%;width:14px;height:14px;border-right:3px solid white;border-bottom:3px solid white;background:#173b27;transform:translateX(-50%) rotate(45deg);z-index:-1}
      .userPassportMapHud{position:absolute;right:11px;bottom:11px;z-index:500;display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(6,18,10,.72);color:#dfffd1;font-size:6px;font-weight:900;letter-spacing:.07em;backdrop-filter:blur(10px)}
      .collectionsPanel,.badgesPanel,.galleryPanel,.savedPanel{margin-top:18px}
      .collectionsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:18px}
      .collectionsGrid article{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:9px;padding:11px;border:1px solid #e0e7dd;border-radius:15px;background:#f8faf6}
      .collectionsGrid article>span{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#e9f1e3;color:#608046}
      .collectionsGrid strong,.collectionsGrid small{display:block}
      .collectionsGrid strong{font-size:8px}
      .collectionsGrid small{margin-top:3px;color:#929c95;font-size:6px}
      .achievementsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:18px}
      .achievementsGrid article{padding:15px;border:1px solid #dfe6dc;border-radius:17px;background:linear-gradient(145deg,#f9fbf7,#f3f7ef)}
      .achievementsGrid article>span{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#173b27;color:#baff9e}
      .achievementsGrid strong,.achievementsGrid small{display:block}
      .achievementsGrid strong{margin-top:12px;font-size:9px}
      .achievementsGrid small{margin-top:4px;color:#89938c;font-size:7px;line-height:1.4}
      .galleryCount{display:grid;place-items:center;min-width:38px;height:38px;border-radius:12px;background:#e8f0de;color:#608046;font-size:9px;font-weight:900}
      .userPassportGallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:18px}
      .userPassportGallery button{position:relative;height:220px;padding:0;overflow:hidden;border:0;border-radius:17px;background:#dce5d8;cursor:pointer}
      .userPassportGallery button.featured{grid-column:span 2;grid-row:span 2;height:449px}
      .userPassportGallery img{width:100%;height:100%;object-fit:cover}
      .userPassportGallery button>div{position:absolute;right:8px;bottom:8px;left:8px;padding:8px;border-radius:11px;background:rgba(5,17,10,.62);color:white;text-align:left;backdrop-filter:blur(10px)}
      .userPassportGallery strong,.userPassportGallery span{display:block}
      .userPassportGallery strong{overflow:hidden;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
      .userPassportGallery span{margin-top:3px;color:rgba(255,255,255,.48);font-size:5px}
      .savedGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
      .savedGrid a{overflow:hidden;border:1px solid #dfe6dc;border-radius:17px;background:#fafbf8}
      .savedGrid img{width:100%;height:135px;display:block;object-fit:cover}
      .savedGrid a>div{padding:11px}
      .savedGrid span,.savedGrid strong,.savedGrid small{display:block}
      .savedGrid span{color:#789456;font-size:5px;font-weight:900;text-transform:uppercase}
      .savedGrid strong{margin-top:3px;overflow:hidden;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
      .savedGrid small{margin-top:4px;color:#89938c;font-size:6px}
      .passportEmpty{display:grid;place-items:center;min-height:130px;margin-top:18px;padding:22px;border:1px dashed #ccd7c8;border-radius:18px;background:#f8faf6;color:#879289;font-size:9px;text-align:center}
      .galleryEmpty{gap:7px}
      .galleryEmpty strong{font-size:9px}
      .galleryEmpty span{font-size:7px}
      .timelineSection{display:grid;grid-template-columns:minmax(220px,.35fr) minmax(0,.65fr);gap:24px;margin-top:18px;padding:28px}
      .timelineIntro p{margin:10px 0 0;color:#88938b;font-size:9px;line-height:1.5}
      .timelineList{display:grid;gap:7px}
      .timelineList>a{display:grid;grid-template-columns:38px 1px minmax(0,1fr) auto;align-items:center;gap:11px;padding:10px;border:1px solid #e0e7dd;border-radius:14px;background:#f8faf6}
      .timelineIndex{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#173b27;color:#baff9e;font-size:7px;font-weight:900}
      .timelineLine{width:1px;height:31px;background:#d6dfd2}
      .timelineList small,.timelineList strong,.timelineList p{display:block}
      .timelineList small{color:#98a19a;font-size:5px;text-transform:uppercase}
      .timelineList strong{margin-top:3px;font-size:8px}
      .timelineList p{margin:3px 0 0;color:#7d8981;font-size:6px}
      .communityCard{display:flex;align-items:center;justify-content:space-between;gap:28px;margin-top:18px;padding:30px}
      .communityCard p{max-width:650px;margin:14px 0 0;color:#7d8981;font-size:10px;line-height:1.7}
      .communityCard>a{display:inline-flex;align-items:center;justify-content:center;gap:8px;flex:0 0 auto;min-height:45px;padding:0 16px;border-radius:14px;background:#183a27;color:white!important;font-size:10px;font-weight:850}
      .userPassportStatePage{display:grid;place-items:center;padding:118px 24px 24px;background:radial-gradient(circle at top left,rgba(166,203,126,.18),transparent 30%),#edf1e9}
      .userPassportStateCard{display:grid;place-items:center;width:min(500px,100%);padding:50px 30px;border:1px solid #dce3d9;border-radius:28px;background:rgba(255,255,255,.84);text-align:center;box-shadow:0 20px 60px rgba(28,48,35,.08)}
      .userPassportLoader{width:38px;height:38px;border:3px solid #dce5d7;border-top-color:#52783c;border-radius:50%;animation:userPassportSpin .8s linear infinite}
      @keyframes userPassportSpin{to{transform:rotate(360deg)}}
      .userPassportStateIcon{display:grid;place-items:center;width:62px;height:62px;border-radius:20px;background:#ffe9e5;color:#a85247}
      .userPassportStateCard h1{margin:18px 0 0;color:#263a2f;font-size:28px;letter-spacing:-.04em}
      .userPassportStateCard p{max-width:380px;margin:9px 0 0;color:#7e8981;font-size:11px;line-height:1.65}
      .userPassportStateActions{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin-top:20px}
      .userPassportStateActions button,.userPassportStateActions a{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 14px;border-radius:12px;cursor:pointer;font-size:10px;font-weight:850}
      .userPassportStateActions button{border:0;background:#183a27;color:white}
      .userPassportStateActions a{border:1px solid #d5ded2;background:white;color:#51665a;text-decoration:none}

      @media(max-width:980px){
        .userPassportIdentityCard{align-items:flex-start;flex-direction:column}
        .userPassportStats{grid-template-columns:repeat(2,minmax(0,1fr))}
        .userPassportGrid,.timelineSection{grid-template-columns:1fr}
        .collectionsGrid,.savedGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .achievementsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }

      @media(max-width:700px){
        .userPassportPage{padding:78px 0 56px}
        .userPassportHero{min-height:650px;padding:22px;border-radius:0 0 32px 32px}
        .userPassportHeroCopy{padding-top:140px}
        .userPassportLevelStamp{right:22px;bottom:22px}
        .userPassportContent{padding:0 12px}
        .userPassportIdentity{align-items:flex-start;flex-direction:column}
        .userPassportAvatar{width:132px;height:132px;border-radius:34px}
        .userPassportStats{grid-template-columns:1fr 1fr}
        .userPassportLevel{grid-template-columns:1fr}
        .userPassportGallery{grid-template-columns:repeat(2,minmax(0,1fr))}
        .userPassportGallery button.featured{grid-column:1/-1;grid-row:auto;height:320px}
        .communityCard{align-items:flex-start;flex-direction:column}
      }

      @media(max-width:480px){
        .userPassportHero{min-height:610px;padding:18px}
        .userPassportHeroCopy h1{font-size:52px}
        .userPassportExploreLink{width:42px;padding:0;justify-content:center;font-size:0}
        .userPassportLevelStamp{left:18px;right:auto}
        .userPassportContent{padding:0 9px}
        .userPassportIdentityCard,.userPassportPanel,.timelineSection,.communityCard{padding:18px}
        .userPassportEdit{width:100%}
        .userPassportStats{grid-template-columns:1fr}
        .collectionsGrid,.savedGrid,.achievementsGrid{grid-template-columns:1fr}
        .userPassportMap{height:300px}
        .userPassportGallery{grid-template-columns:1fr}
        .userPassportGallery button,.userPassportGallery button.featured{grid-column:auto;height:250px}
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
