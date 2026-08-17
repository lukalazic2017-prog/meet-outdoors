import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const SERBIA_CENTER = [44.0165, 21.0059];

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&auto=format&fit=crop";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    navigation: <path d="m3 11 18-8-8 18-2-8-8-2Z" />,
    layers: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
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
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
        <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
        <path d="M12 13v4M8 21h8M9 17h6" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
    chevronUp: <path d="m6 15 6-6 6 6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    locate: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4" />
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makePhotoMarker(place, active) {
  const count = Number(place.visitors_count || 0);
  const image = escapeHtml(place.cover_url || FALLBACK_COVER);
  const name = escapeHtml(place.name || "Outdoor mesto");
  const category = escapeHtml(
    place.place_categories?.name || "Outdoor"
  );

  return L.divIcon({
    className: "moPhotoMarkerShell",
    html: `
      <div class="moPhotoMarker ${active ? "active" : ""}">
        <div class="moPhotoMarkerHalo"></div>
        <div class="moPhotoMarkerCard">
          <img src="${image}" alt="" />
          <div class="moPhotoMarkerShade"></div>
          <div class="moPhotoMarkerTop">
            <span>${category}</span>
            ${count > 0 ? `<b>${count > 99 ? "99+" : count}</b>` : ""}
          </div>
          <div class="moPhotoMarkerBottom">
            <strong>${name}</strong>
          </div>
        </div>
        <span class="moPhotoMarkerTip"></span>
      </div>
    `,
    iconSize: active ? [116, 126] : [82, 94],
    iconAnchor: active ? [58, 118] : [41, 87],
  });
}

const USER_MARKER = L.divIcon({
  className: "moUserMarkerShell",
  html: `
    <div class="moUserMarker">
      <span></span>
      <i></i>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function AutoLocateController({
  requestId,
  onStart,
  onSuccess,
  onError,
}) {
  const map = useMap();

  useEffect(() => {
    if (!requestId) return;

    onStart();

    if (!navigator.geolocation) {
      onError("GPS nije dostupan na ovom uređaju.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
        };

        map.flyTo(
          [result.latitude, result.longitude],
          14,
          {
            duration: 1.35,
            easeLinearity: 0.25,
          }
        );

        onSuccess(result);
      },
      (error) => {
        const messages = {
          1: "Lokacija nije dozvoljena.",
          2: "Lokacija trenutno nije dostupna.",
          3: "GPS je predugo čekao odgovor.",
        };

        onError(
          messages[error?.code] ||
            "Nismo uspeli da pronađemo tvoju lokaciju."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  }, [map, onError, onStart, onSuccess, requestId]);

  return null;
}

function FocusPlace({ place }) {
  const map = useMap();

  useEffect(() => {
    if (!place) return;

    map.flyTo(
      [Number(place.latitude), Number(place.longitude)],
      13.5,
      {
        duration: 0.8,
        easeLinearity: 0.22,
      }
    );
  }, [map, place]);

  return null;
}

function formatNumber(value) {
  return new Intl.NumberFormat("sr-Latn-RS").format(
    Number(value || 0)
  );
}

function distanceKm(from, place) {
  if (!from || !place) return null;

  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (Number(place.latitude) * Math.PI) / 180;
  const dLat =
    ((Number(place.latitude) - from.latitude) * Math.PI) / 180;
  const dLon =
    ((Number(place.longitude) - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(value) {
  if (value == null) return "";

  if (value < 1) {
    return `${Math.max(1, Math.round(value * 1000))} m`;
  }

  if (value < 10) {
    return `${value.toFixed(1)} km`;
  }

  return `${Math.round(value)} km`;
}

export default function ExploreMap() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [locateRequest, setLocateRequest] = useState(1);
  const [locateStatus, setLocateStatus] = useState("idle");
  const [locateMessage, setLocateMessage] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlaces = useCallback(async () => {
    const { data, error } = await supabase
      .from("places")
      .select(`
        id,
        name,
        short_description,
        country_name,
        region,
        municipality,
        locality,
        latitude,
        longitude,
        cover_url,
        visitors_count,
        checkins_count,
        photos_count,
        saves_count,
        location_precision,
        created_at,
        place_categories:category_id (
          id,
          code,
          name,
          icon
        )
      `)
      .eq("is_active", true)
      .order("visitors_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!error) {
      setPlaces(data || []);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("place_categories")
      .select("id, name, code, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error) setCategories(data || []);
  }, []);

  useEffect(() => {
    let active = true;

    async function boot() {
      setLoading(true);

      await Promise.all([
        loadPlaces(),
        loadCategories(),
      ]);

      if (active) {
        setLoading(false);
      }
    }

    boot();

    return () => {
      active = false;
    };
  }, [loadCategories, loadPlaces]);

  useEffect(() => {
    const channel = supabase
      .channel("explore-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "places",
        },
        loadPlaces
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "place_checkins",
        },
        loadPlaces
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPlaces]);

  const handleLocateStart = useCallback(() => {
    setLocateStatus("locating");
    setLocateMessage("Pronalazimo te...");
  }, []);

  const handleLocateSuccess = useCallback((location) => {
    setUserLocation(location);
    setLocateStatus("found");
    setLocateMessage("Tu si.");

    window.setTimeout(() => {
      setLocateStatus("idle");
    }, 1500);
  }, []);

  const handleLocateError = useCallback((message) => {
    setLocateStatus("error");
    setLocateMessage(message);

    window.setTimeout(() => {
      setLocateStatus("idle");
    }, 3000);
  }, []);

  const filteredPlaces = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return places
      .filter((place) => {
        if (
          categoryId !== "all" &&
          place.place_categories?.id !== categoryId
        ) {
          return false;
        }

        if (!needle) return true;

        return [
          place.name,
          place.region,
          place.locality,
          place.municipality,
          place.place_categories?.name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(needle)
          );
      })
      .map((place) => ({
        ...place,
        distanceKm: distanceKm(userLocation, place),
      }))
      .sort((a, b) => {
        if (userLocation) {
          return (
            (a.distanceKm ?? Number.POSITIVE_INFINITY) -
            (b.distanceKm ?? Number.POSITIVE_INFINITY)
          );
        }

        return (
          Number(b.visitors_count || 0) -
          Number(a.visitors_count || 0)
        );
      });
  }, [categoryId, places, query, userLocation]);

  const selectedPlace = useMemo(
    () =>
      places.find((place) => place.id === selectedPlaceId) ||
      null,
    [places, selectedPlaceId]
  );

  const selectedDistance = useMemo(
    () =>
      selectedPlace
        ? distanceKm(userLocation, selectedPlace)
        : null,
    [selectedPlace, userLocation]
  );

  const totals = useMemo(
    () =>
      places.reduce(
        (accumulator, place) => {
          accumulator.checkins += Number(
            place.checkins_count || 0
          );

          accumulator.photos += Number(
            place.photos_count || 0
          );

          return accumulator;
        },
        {
          checkins: 0,
          photos: 0,
        }
      ),
    [places]
  );

  const nearestPlaces = useMemo(
    () => filteredPlaces.slice(0, 4),
    [filteredPlaces]
  );

  if (loading) {
    return (
      <>
        <ExploreStyles />

        <main className="moLoading">
          <div className="moLoadingOrb">
            <Icon name="compass" size={24} />
          </div>

          <strong>Budimo outdoor mapu...</strong>
          <span>Pronalazimo mesta, fotografije i tragove.</span>
        </main>
      </>
    );
  }

  return (
    <>
      <ExploreStyles />

      <main className="moExplore">
        <div className="moMapStage">
          <MapContainer
            center={SERBIA_CENTER}
            zoom={7}
            minZoom={5}
            scrollWheelZoom
            className="moLeaflet"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <AutoLocateController
              requestId={locateRequest}
              onStart={handleLocateStart}
              onSuccess={handleLocateSuccess}
              onError={handleLocateError}
            />

            <FocusPlace place={selectedPlace} />

            {userLocation && (
              <>
                <Circle
                  center={[
                    userLocation.latitude,
                    userLocation.longitude,
                  ]}
                  radius={Math.max(
                    25,
                    Math.min(
                      userLocation.accuracy || 50,
                      250
                    )
                  )}
                  pathOptions={{
                    color: "#9fff72",
                    fillColor: "#9fff72",
                    fillOpacity: 0.07,
                    opacity: 0.3,
                    weight: 1,
                  }}
                />

                <Marker
                  position={[
                    userLocation.latitude,
                    userLocation.longitude,
                  ]}
                  icon={USER_MARKER}
                />
              </>
            )}

            {filteredPlaces.map((place) => (
              <Marker
                key={place.id}
                position={[
                  Number(place.latitude),
                  Number(place.longitude),
                ]}
                icon={makePhotoMarker(
                  place,
                  place.id === selectedPlaceId
                )}
                zIndexOffset={
                  place.id === selectedPlaceId ? 1000 : 0
                }
                eventHandlers={{
                  click: () => {
                    setSelectedPlaceId(place.id);
                    setResultsOpen(false);
                  },
                }}
              />
            ))}
          </MapContainer>

          <div className="moMapShade" />
          <div className="moMapVignette" />

          <header className="moMapHeader">
            <div className="moBrand">
              <span>
                <Icon name="compass" size={18} />
              </span>

              <div>
                <strong>EXPLORE</strong>
                <small>
                  {userLocation
                    ? "Mapa oko tebe"
                    : "MeetOutdoors mapa"}
                </small>
              </div>
            </div>

            <div className="moHeaderActions">
              <button
                type="button"
                className="moLocateButton"
                onClick={() =>
                  setLocateRequest((value) => value + 1)
                }
              >
                <Icon name="locate" size={16} />

                <span>
                  {userLocation
                    ? "Moja lokacija"
                    : "Pronađi me"}
                </span>
              </button>

              <Link
                to={profile ? "/explore/add" : "/login"}
                className="moHeaderDiscover"
              >
                <Icon name="camera" size={16} />
                <span>Otkrij mesto</span>
              </Link>
            </div>
          </header>

          <section
            className={`moCommand ${
              controlsOpen ? "open" : "collapsed"
            }`}
          >
            <div className="moCommandGlow" />

            <button
              type="button"
              className="moCommandCollapse"
              onClick={() =>
                setControlsOpen((value) => !value)
              }
              aria-label={
                controlsOpen
                  ? "Sakrij kontrole"
                  : "Prikaži kontrole"
              }
            >
              <Icon
                name={
                  controlsOpen
                    ? "chevronUp"
                    : "chevronDown"
                }
                size={17}
              />
            </button>

            <div className="moCommandIntro">
              <div className="moCommandBadge">
                <Icon name="sparkle" size={13} />

                <span>
                  {userLocation
                    ? "PRONAŠLI SMO TE"
                    : "LIVE OUTDOOR MAPA"}
                </span>
              </div>

              <h1>
                {userLocation ? (
                  <>
                    Šta je
                    <br />
                    <em>oko tebe?</em>
                  </>
                ) : (
                  <>
                    Istraži
                    <br />
                    <em>Srbiju.</em>
                  </>
                )}
              </h1>

              <p>
                {userLocation
                  ? "Najbliža mesta, fotografije i stvarni community tragovi — sortirani oko tvoje pozicije."
                  : "Dozvoli lokaciju i pretvori mapu u lični outdoor radar."}
              </p>
            </div>

            <label className="moSearch">
              <span className="moSearchIcon">
                <Icon name="search" size={17} />
              </span>

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Tara, Uvac, jezero, vidikovac..."
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </label>

            <div className="moQuickFilters">
              <button
                type="button"
                className={
                  categoryId === "all" ? "active" : ""
                }
                onClick={() => setCategoryId("all")}
              >
                Sve
              </button>

              {categories.slice(0, 7).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={
                    categoryId === category.id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCategoryId(category.id)
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="moNearMe">
              <div className="moNearMeHead">
                <div>
                  <span>
                    {userLocation
                      ? "NAJBLIŽE TEBI"
                      : "POPULARNO SADA"}
                  </span>

                  <small>
                    {userLocation
                      ? "po udaljenosti"
                      : "community izbor"}
                  </small>
                </div>

                <button
                  type="button"
                  onClick={() => setResultsOpen(true)}
                >
                  Sva mesta
                  <Icon name="arrow" size={13} />
                </button>
              </div>

              <div className="moNearMeList">
                {nearestPlaces.length === 0 ? (
                  <div className="moEmptyNearby">
                    Nema rezultata za ovaj filter.
                  </div>
                ) : (
                  nearestPlaces.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      className={
                        selectedPlaceId === place.id
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setSelectedPlaceId(place.id)
                      }
                    >
                      <span className="moNearbyImage">
                        <img
                          src={
                            place.cover_url ||
                            FALLBACK_COVER
                          }
                          alt=""
                        />
                      </span>

                      <div>
                        <span>
                          {place.place_categories?.name ||
                            "Outdoor"}
                        </span>

                        <strong>{place.name}</strong>

                        <small>
                          {userLocation
                            ? formatDistance(
                                place.distanceKm
                              )
                            : `${formatNumber(
                                place.visitors_count
                              )} poseta`}
                        </small>
                      </div>

                      <span className="moNearArrow">
                        <Icon name="arrow" size={14} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="moCommandFooter">
              <div>
                <strong>{formatNumber(places.length)}</strong>
                <span>mesta</span>
              </div>

              <div>
                <strong>
                  {formatNumber(totals.checkins)}
                </strong>
                <span>check-inova</span>
              </div>

              <button
                type="button"
                onClick={() => setResultsOpen(true)}
              >
                <Icon name="grid" size={15} />

                <span>Rezultati</span>

                <b>{filteredPlaces.length}</b>
              </button>
            </div>
          </section>

          <aside className="moPassportHud">
            <span className="moPassportIcon">
              <Icon name="trophy" size={19} />
            </span>

            <div>
              <span>OUTDOOR PASSPORT</span>

              <strong>
                {profile
                  ? "Ne skupljaš lajkove. Skupljaš mesta."
                  : "Prijavi se i počni da otključavaš Srbiju."}
              </strong>
            </div>
          </aside>

          {selectedPlace && (
            <section className="moPlaceSheet">
              <button
                type="button"
                className="moPlaceSheetClose"
                onClick={() =>
                  setSelectedPlaceId(null)
                }
              >
                <Icon name="close" size={15} />
              </button>

              <div className="moPlaceSheetVisual">
                <img
                  src={
                    selectedPlace.cover_url ||
                    FALLBACK_COVER
                  }
                  alt=""
                />

                <div className="moPlaceSheetVisualShade" />

                <span>
                  {selectedPlace.place_categories?.name ||
                    "Outdoor mesto"}
                </span>
              </div>

              <div className="moPlaceSheetBody">
                <div className="moPlaceSheetMeta">
                  <span>
                    <Icon name="mapPin" size={11} />

                    {[selectedPlace.locality,
                      selectedPlace.region]
                      .filter(Boolean)
                      .join(" · ") || "Srbija"}
                  </span>

                  {selectedDistance != null && (
                    <em>
                      <Icon
                        name="navigation"
                        size={11}
                      />
                      {formatDistance(
                        selectedDistance
                      )}
                    </em>
                  )}
                </div>

                <h2>{selectedPlace.name}</h2>

                {selectedPlace.short_description && (
                  <p className="moPlaceSheetDescription">
                    {selectedPlace.short_description}
                  </p>
                )}

                <div className="moPlaceSheetStats">
                  <span>
                    <Icon name="users" size={13} />
                    {formatNumber(
                      selectedPlace.visitors_count
                    )}
                    <small>poseta</small>
                  </span>

                  <span>
                    <Icon name="camera" size={13} />
                    {formatNumber(
                      selectedPlace.photos_count
                    )}
                    <small>slika</small>
                  </span>

                  <span>
                    <Icon name="heart" size={13} />
                    {formatNumber(
                      selectedPlace.saves_count
                    )}
                    <small>sačuvano</small>
                  </span>
                </div>

                {selectedPlace.location_precision !==
                  "exact" && (
                  <div className="moProtectedNote">
                    Precizna lokacija je zaštićena.
                  </div>
                )}

                <button
                  type="button"
                  className="moOpenPlace"
                  onClick={() =>
                    navigate(
                      `/explore/${selectedPlace.id}`
                    )
                  }
                >
                  <span>Otvori mesto</span>

                  <span className="moOpenPlaceArrow">
                    <Icon name="arrow" size={15} />
                  </span>
                </button>
              </div>
            </section>
          )}

          <button
            type="button"
            className="moFloatingDiscover"
            onClick={() =>
              navigate(
                profile
                  ? "/explore/add"
                  : "/login"
              )
            }
          >
            <span className="moFloatingDiscoverIcon">
              <Icon name="camera" size={21} />
            </span>

            <span className="moFloatingDiscoverCopy">
              <small>NAŠAO SI NEŠTO?</small>
              <strong>Otkrij mesto</strong>
            </span>

            <span className="moFloatingDiscoverArrow">
              <Icon name="arrow" size={17} />
            </span>
          </button>

          {locateStatus !== "idle" && (
            <div
              className={`moLocateOverlay ${locateStatus}`}
            >
              <div className="moLocateRadar">
                <span />
                <i />
                <b />
                <Icon
                  name="navigation"
                  size={22}
                />
              </div>

              <div>
                <small>MEETOUTDOORS GPS</small>
                <strong>{locateMessage}</strong>

                <p>
                  {locateStatus === "locating" &&
                    "Tražimo tvoju poziciju i približavamo mapu."}

                  {locateStatus === "found" &&
                    "Mapa je sada centrirana na tvoju lokaciju."}

                  {locateStatus === "error" &&
                    "Mapa ostaje dostupna. GPS možeš pokušati ponovo."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div
          className={`moResultsDrawer ${
            resultsOpen ? "open" : ""
          }`}
        >
          <button
            type="button"
            className="moDrawerBackdrop"
            onClick={() =>
              setResultsOpen(false)
            }
            aria-label="Zatvori rezultate"
          />

          <section>
            <header>
              <div>
                <span>
                  <Icon name="filter" size={15} />

                  {userLocation
                    ? "SORTIRANO PO UDALJENOSTI"
                    : "REZULTATI"}
                </span>

                <h2>
                  {filteredPlaces.length} mesta
                </h2>

                <p>
                  Klikni na mesto i mapa će te odmah odvesti do njega.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setResultsOpen(false)
                }
              >
                <Icon name="close" size={18} />
              </button>
            </header>

            <div className="moDrawerList">
              {filteredPlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className={
                    place.id === selectedPlaceId
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setSelectedPlaceId(place.id);
                    setResultsOpen(false);
                  }}
                >
                  <span className="moDrawerImage">
                    <img
                      src={
                        place.cover_url ||
                        FALLBACK_COVER
                      }
                      alt=""
                    />
                  </span>

                  <div>
                    <span>
                      {place.place_categories?.name ||
                        "Outdoor mesto"}
                    </span>

                    <strong>{place.name}</strong>

                    <small>
                      {userLocation
                        ? formatDistance(
                            place.distanceKm
                          )
                        : [place.locality,
                            place.region]
                            .filter(Boolean)
                            .join(" · ") ||
                          "Srbija"}
                    </small>
                  </div>

                  <span className="moDrawerArrow">
                    <Icon name="arrow" size={16} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function ExploreStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      html,body,#root{min-height:100%}
      body{margin:0;background:#07110b}
      button,input{font:inherit}
      .moExplore{min-height:100vh;background:#07110b;color:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .moExplore a{color:inherit;text-decoration:none}
      .moMapStage{position:relative;height:100vh;min-height:720px;overflow:hidden;background:#dfe7dc}
      .moLeaflet{position:absolute;inset:0;z-index:1;width:100%;height:100%;background:#dfe7dc}
      .moMapShade{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(90deg,rgba(3,10,6,.82) 0%,rgba(3,10,6,.56) 24%,rgba(3,10,6,.1) 54%,transparent 75%),linear-gradient(180deg,rgba(3,10,6,.68),transparent 24%,transparent 67%,rgba(3,10,6,.54))}
      .moMapVignette{position:absolute;inset:0;z-index:2;pointer-events:none;box-shadow:inset 0 0 110px rgba(3,10,6,.26)}
      .moMapHeader{position:absolute;top:102px;right:22px;left:22px;z-index:700;display:flex;align-items:center;justify-content:space-between;gap:18px}
      .moBrand{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid rgba(255,255,255,.14);border-radius:17px;background:linear-gradient(145deg,rgba(4,14,8,.78),rgba(10,28,17,.62));box-shadow:0 16px 42px rgba(0,0,0,.22);backdrop-filter:blur(24px) saturate(140%)}
      .moBrand>span{display:grid;place-items:center;width:39px;height:39px;border:1px solid rgba(255,255,255,.35);border-radius:12px;background:#baff9e;color:#0e2717;box-shadow:0 10px 24px rgba(126,255,101,.14)}
      .moBrand strong,.moBrand small{display:block}
      .moBrand strong{font-size:9px;letter-spacing:.14em}
      .moBrand small{margin-top:3px;color:rgba(255,255,255,.45);font-size:6px}
      .moHeaderActions{display:flex;gap:7px}
      .moHeaderActions button,.moHeaderActions a{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:43px;padding:0 13px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:linear-gradient(145deg,rgba(4,14,8,.74),rgba(12,30,19,.6));color:#fff;cursor:pointer;font-size:8px;font-weight:850;box-shadow:0 14px 34px rgba(0,0,0,.18);backdrop-filter:blur(22px);transition:transform .18s ease,border-color .18s ease,background .18s ease}
      .moHeaderActions button:hover{transform:translateY(-2px);border-color:rgba(186,255,158,.26)}
      .moHeaderActions .moHeaderDiscover{border-color:#baff9e;background:#baff9e;color:#102619;box-shadow:0 16px 34px rgba(87,172,68,.18)}
      .moCommand{position:absolute;top:166px;left:22px;z-index:650;width:min(404px,calc(100% - 44px));padding:20px;overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:linear-gradient(145deg,rgba(4,14,8,.92),rgba(10,31,18,.81));box-shadow:0 32px 80px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.05);backdrop-filter:blur(30px) saturate(145%);transition:transform .22s ease,opacity .22s ease}
      .moCommandGlow{position:absolute;top:-90px;left:-70px;width:220px;height:220px;border-radius:50%;background:rgba(186,255,158,.08);filter:blur(54px);pointer-events:none}
      .moCommandCollapse{position:absolute;top:12px;right:12px;z-index:2;display:grid;place-items:center;width:33px;height:33px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer;transition:background .18s ease}
      .moCommandCollapse:hover{background:rgba(255,255,255,.1)}
      .moCommandBadge{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid rgba(186,255,158,.14);border-radius:999px;background:rgba(186,255,158,.06);color:#baff9e}
      .moCommandBadge span{font-size:6px;font-weight:950;letter-spacing:.12em}
      .moCommand h1{margin:14px 0 0;font-size:clamp(44px,5.6vw,66px);line-height:.83;letter-spacing:-.075em}
      .moCommand h1 em{color:#baff9e;font-style:normal}
      .moCommandIntro p{max-width:330px;margin:14px 0 0;color:rgba(255,255,255,.5);font-size:9px;line-height:1.62}
      .moSearch{display:flex;align-items:center;gap:8px;margin-top:18px;min-height:47px;padding:0 10px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(255,255,255,.065);color:rgba(255,255,255,.56);box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}
      .moSearchIcon{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,.05)}
      .moSearch input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:9px}
      .moSearch input::placeholder{color:rgba(255,255,255,.32)}
      .moSearch button{display:grid;place-items:center;width:27px;height:27px;border:0;border-radius:9px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
      .moQuickFilters{display:flex;gap:6px;margin-top:9px;overflow-x:auto;scrollbar-width:none}
      .moQuickFilters::-webkit-scrollbar{display:none}
      .moQuickFilters button{flex:0 0 auto;min-height:33px;padding:0 10px;border:1px solid rgba(255,255,255,.09);border-radius:999px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.6);cursor:pointer;font-size:7px;font-weight:800;transition:background .16s ease,color .16s ease,border-color .16s ease}
      .moQuickFilters button:hover{border-color:rgba(186,255,158,.2);color:#fff}
      .moQuickFilters button.active{border-color:#baff9e;background:#baff9e;color:#102619}
      .moNearMe{margin-top:14px}
      .moNearMeHead{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}
      .moNearMeHead>div>span,.moNearMeHead>div>small{display:block}
      .moNearMeHead>div>span{color:#fff;font-size:6px;font-weight:900;letter-spacing:.11em}
      .moNearMeHead>div>small{margin-top:2px;color:rgba(255,255,255,.28);font-size:5px}
      .moNearMeHead>button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#baff9e;cursor:pointer;font-size:7px;font-weight:850}
      .moNearMeList{display:grid;gap:6px;margin-top:8px}
      .moNearMeList>button{display:grid;grid-template-columns:48px minmax(0,1fr) 30px;align-items:center;gap:9px;width:100%;padding:6px;border:1px solid rgba(255,255,255,.045);border-radius:14px;background:rgba(255,255,255,.03);color:#fff;text-align:left;cursor:pointer;transition:transform .18s ease,border-color .18s ease,background .18s ease}
      .moNearMeList>button:hover,.moNearMeList>button.active{border-color:rgba(186,255,158,.18);background:linear-gradient(90deg,rgba(186,255,158,.08),rgba(255,255,255,.035));transform:translateX(3px)}
      .moNearbyImage{display:block;width:48px;height:48px;padding:2px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.04)}
      .moNearMeList img{width:100%;height:100%;border-radius:9px;object-fit:cover}
      .moNearMeList span,.moNearMeList strong,.moNearMeList small{display:block}
      .moNearMeList>button>div>span{color:#baff9e;font-size:5px;font-weight:900;text-transform:uppercase}
      .moNearMeList strong{margin-top:2px;overflow:hidden;font-size:8px;text-overflow:ellipsis;white-space:nowrap}
      .moNearMeList small{margin-top:2px;color:rgba(255,255,255,.39);font-size:6px}
      .moNearArrow{display:grid!important;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.55)}
      .moEmptyNearby{padding:14px;border:1px dashed rgba(255,255,255,.1);border-radius:12px;color:rgba(255,255,255,.4);font-size:7px;text-align:center}
      .moCommandFooter{display:grid;grid-template-columns:auto auto minmax(0,1fr);align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}
      .moCommandFooter>div{min-width:66px}
      .moCommandFooter strong,.moCommandFooter span{display:block}
      .moCommandFooter strong{font-size:12px}
      .moCommandFooter>div span{margin-top:2px;color:rgba(255,255,255,.3);font-size:5px;text-transform:uppercase}
      .moCommandFooter>button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:38px;border:1px solid rgba(186,255,158,.15);border-radius:11px;background:rgba(186,255,158,.075);color:#d9ffca;cursor:pointer;font-size:7px;font-weight:850}
      .moCommandFooter>button b{display:grid;place-items:center;min-width:22px;height:22px;padding:0 5px;border-radius:999px;background:#baff9e;color:#102619;font-size:6px}
      .moPassportHud{position:absolute;top:166px;right:22px;z-index:650;display:flex;align-items:center;gap:10px;max-width:290px;padding:11px 13px 11px 10px;border:1px solid rgba(255,255,255,.12);border-radius:17px;background:linear-gradient(145deg,rgba(4,14,8,.76),rgba(12,30,18,.62));color:#baff9e;box-shadow:0 18px 46px rgba(0,0,0,.2);backdrop-filter:blur(22px)}
      .moPassportIcon{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:12px;background:rgba(186,255,158,.09)}
      .moPassportHud span,.moPassportHud strong{display:block}
      .moPassportHud>div>span{font-size:6px;font-weight:900;letter-spacing:.1em}
      .moPassportHud strong{margin-top:3px;color:#fff;font-size:8px;line-height:1.35}
      .moPlaceSheet{position:absolute;right:22px;bottom:22px;z-index:650;display:grid;grid-template-columns:180px minmax(0,1fr);width:min(520px,calc(100% - 44px));overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:25px;background:linear-gradient(145deg,rgba(5,16,9,.93),rgba(12,31,18,.87));box-shadow:0 34px 90px rgba(0,0,0,.38);backdrop-filter:blur(28px);animation:moSheetIn .25s ease both}
      @keyframes moSheetIn{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      .moPlaceSheetVisual{position:relative;min-height:224px;overflow:hidden}
      .moPlaceSheetVisual>img{width:100%;height:100%;object-fit:cover}
      .moPlaceSheetVisualShade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 44%,rgba(5,16,9,.78))}
      .moPlaceSheetVisual>span{position:absolute;right:10px;bottom:10px;left:10px;padding:7px 8px;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(5,16,9,.52);color:#baff9e;font-size:6px;font-weight:900;text-transform:uppercase;backdrop-filter:blur(10px)}
      .moPlaceSheetBody{padding:16px}
      .moPlaceSheetClose{position:absolute;top:9px;right:9px;z-index:3;display:grid;place-items:center;width:31px;height:31px;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(3,10,6,.62);color:#fff;cursor:pointer;backdrop-filter:blur(10px)}
      .moPlaceSheetMeta{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-right:27px}
      .moPlaceSheetMeta>span{display:inline-flex;align-items:center;gap:4px;max-width:70%;overflow:hidden;color:rgba(255,255,255,.46);font-size:6px;text-overflow:ellipsis;white-space:nowrap}
      .moPlaceSheetMeta em{display:inline-flex;align-items:center;gap:4px;color:#d7ffc6;font-size:6px;font-style:normal}
      .moPlaceSheet h2{margin:9px 0 0;font-size:24px;line-height:1.02;letter-spacing:-.05em}
      .moPlaceSheetDescription{display:-webkit-box;margin:8px 0 0;overflow:hidden;color:rgba(255,255,255,.48);font-size:7px;line-height:1.5;-webkit-line-clamp:2;-webkit-box-orient:vertical}
      .moPlaceSheetStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:12px}
      .moPlaceSheetStats>span{display:grid;grid-template-columns:auto 1fr;align-items:center;column-gap:5px;padding:8px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:rgba(255,255,255,.035);color:#fff;font-size:7px}
      .moPlaceSheetStats small{grid-column:2;color:rgba(255,255,255,.3);font-size:5px}
      .moProtectedNote{margin-top:9px;padding:8px 9px;border:1px solid rgba(229,211,146,.12);border-radius:10px;background:rgba(229,211,146,.08);color:#e8da9f;font-size:6px}
      .moOpenPlace{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;width:100%;min-height:42px;margin-top:11px;padding:0 8px 0 12px;border:0;border-radius:12px;background:#baff9e;color:#102619;cursor:pointer;font-size:8px;font-weight:900;box-shadow:0 14px 30px rgba(87,172,68,.14)}
      .moOpenPlaceArrow{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:rgba(16,38,25,.08)}
      .moFloatingDiscover{position:absolute;right:22px;bottom:270px;z-index:650;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;min-width:220px;min-height:58px;padding:6px 9px 6px 7px;border:1px solid rgba(186,255,158,.28);border-radius:19px;background:linear-gradient(145deg,rgba(8,28,15,.94),rgba(15,45,26,.9));color:#fff;cursor:pointer;box-shadow:0 24px 60px rgba(0,0,0,.3);backdrop-filter:blur(22px);transition:transform .18s ease,border-color .18s ease}
      .moFloatingDiscover:hover{transform:translateY(-3px);border-color:rgba(186,255,158,.5)}
      .moFloatingDiscoverIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#baff9e;color:#102619}
      .moFloatingDiscoverCopy small,.moFloatingDiscoverCopy strong{display:block;text-align:left}
      .moFloatingDiscoverCopy small{color:#baff9e;font-size:5px;font-weight:900;letter-spacing:.08em}
      .moFloatingDiscoverCopy strong{margin-top:2px;font-size:8px}
      .moFloatingDiscoverArrow{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:rgba(255,255,255,.05);color:#baff9e}
      .moPhotoMarkerShell{background:transparent!important;border:0!important}
      .moPhotoMarker{position:relative;display:grid;place-items:center;width:82px;height:94px;filter:drop-shadow(0 14px 20px rgba(0,0,0,.28));transform-origin:50% 100%;transition:filter .18s ease}
      .moPhotoMarker.active{width:116px;height:126px;filter:drop-shadow(0 20px 30px rgba(0,0,0,.36));z-index:20}
      .moPhotoMarkerHalo{position:absolute;inset:8px 8px 18px;border:1px solid rgba(186,255,158,.3);border-radius:22px;opacity:0;transform:scale(.82);transition:.18s ease}
      .moPhotoMarker.active .moPhotoMarkerHalo{opacity:1;transform:scale(1.08);box-shadow:0 0 0 7px rgba(186,255,158,.06)}
      .moPhotoMarkerCard{position:relative;width:74px;height:74px;overflow:hidden;border:3px solid rgba(255,255,255,.95);border-radius:22px;background:#173b27;box-shadow:0 12px 30px rgba(0,0,0,.3);transition:width .18s ease,height .18s ease,border-radius .18s ease,transform .18s ease}
      .moPhotoMarker.active .moPhotoMarkerCard{width:108px;height:100px;border-color:#baff9e;border-radius:24px;transform:translateY(-4px)}
      .moPhotoMarkerCard>img{width:100%;height:100%;object-fit:cover}
      .moPhotoMarkerShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,16,9,.08),rgba(5,16,9,.06) 42%,rgba(5,16,9,.8))}
      .moPhotoMarkerTop{position:absolute;top:5px;right:5px;left:5px;display:flex;align-items:center;justify-content:space-between;gap:4px}
      .moPhotoMarkerTop>span{max-width:58px;padding:4px 5px;overflow:hidden;border-radius:999px;background:rgba(5,16,9,.58);color:#dfffd2;font-size:4px;font-weight:950;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;backdrop-filter:blur(8px)}
      .moPhotoMarker.active .moPhotoMarkerTop>span{max-width:74px;font-size:5px}
      .moPhotoMarkerTop>b{display:grid;place-items:center;min-width:20px;height:20px;padding:0 4px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:#baff9e;color:#102619;font-size:5px}
      .moPhotoMarkerBottom{position:absolute;right:6px;bottom:6px;left:6px}
      .moPhotoMarkerBottom strong{display:block;overflow:hidden;color:#fff;font-size:6px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,.7);text-overflow:ellipsis;white-space:nowrap}
      .moPhotoMarker.active .moPhotoMarkerBottom strong{font-size:7px}
      .moPhotoMarkerTip{position:absolute;bottom:3px;width:20px;height:20px;border-right:3px solid rgba(255,255,255,.95);border-bottom:3px solid rgba(255,255,255,.95);background:#173b27;transform:rotate(45deg);z-index:-1}
      .moPhotoMarker.active .moPhotoMarkerTip{bottom:5px;width:23px;height:23px;border-color:#baff9e;background:#173b27}
      .moUserMarkerShell{background:transparent!important;border:0!important}
      .moUserMarker{position:relative;display:grid;place-items:center;width:34px;height:34px}
      .moUserMarker>span{position:absolute;inset:8px;border:3px solid #fff;border-radius:50%;background:#8fff68;box-shadow:0 0 0 4px rgba(143,255,104,.24),0 6px 20px rgba(0,0,0,.28)}
      .moUserMarker>i{position:absolute;inset:0;border:1px solid rgba(143,255,104,.75);border-radius:50%;animation:moUserPulse 1.8s ease-out infinite}
      @keyframes moUserPulse{0%{opacity:.9;transform:scale(.5)}100%{opacity:0;transform:scale(1.45)}}
      .moLocateOverlay{position:absolute;top:50%;left:50%;z-index:1500;display:flex;align-items:center;gap:15px;width:min(380px,calc(100% - 34px));padding:16px;border:1px solid rgba(255,255,255,.13);border-radius:22px;background:linear-gradient(145deg,rgba(4,14,8,.94),rgba(12,33,19,.92));box-shadow:0 32px 80px rgba(0,0,0,.42);transform:translate(-50%,-50%);backdrop-filter:blur(28px);animation:moLocateIn .22s ease both}
      @keyframes moLocateIn{from{opacity:0;transform:translate(-50%,-47%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      .moLocateOverlay>div:last-child{min-width:0}
      .moLocateOverlay small,.moLocateOverlay strong{display:block}
      .moLocateOverlay small{color:#baff9e;font-size:6px;font-weight:900;letter-spacing:.11em}
      .moLocateOverlay strong{margin-top:4px;font-size:16px}
      .moLocateOverlay p{margin:5px 0 0;color:rgba(255,255,255,.44);font-size:7px;line-height:1.45}
      .moLocateOverlay.error small{color:#ffd09d}
      .moLocateRadar{position:relative;display:grid;place-items:center;flex:0 0 auto;width:66px;height:66px;border-radius:20px;background:rgba(186,255,158,.08);color:#baff9e}
      .moLocateRadar>span,.moLocateRadar>i,.moLocateRadar>b{position:absolute;border:1px solid rgba(186,255,158,.24);border-radius:50%;animation:moRadar 1.8s ease-out infinite}
      .moLocateRadar>span{inset:10px}
      .moLocateRadar>i{inset:4px;animation-delay:.35s}
      .moLocateRadar>b{inset:-2px;animation-delay:.7s}
      @keyframes moRadar{0%{opacity:.7;transform:scale(.55)}100%{opacity:0;transform:scale(1.15)}}
      .moResultsDrawer{position:fixed;inset:0;z-index:5000;pointer-events:none}
      .moResultsDrawer.open{pointer-events:auto}
      .moDrawerBackdrop{position:absolute;inset:0;border:0;background:rgba(0,0,0,.62);opacity:0;transition:.24s ease;backdrop-filter:blur(4px)}
      .moResultsDrawer.open .moDrawerBackdrop{opacity:1}
      .moResultsDrawer>section{position:absolute;top:0;bottom:0;left:0;width:min(520px,94vw);padding:116px 18px 18px;background:linear-gradient(180deg,#08140d,#0b1d12);color:#fff;box-shadow:28px 0 80px rgba(0,0,0,.4);transform:translateX(-100%);transition:.3s cubic-bezier(.2,.7,.2,1)}
      .moResultsDrawer.open>section{transform:translateX(0)}
      .moResultsDrawer header{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding:0 4px 15px;border-bottom:1px solid rgba(255,255,255,.1)}
      .moResultsDrawer header span{display:inline-flex;align-items:center;gap:6px;color:#baff9e;font-size:7px;font-weight:900;letter-spacing:.1em}
      .moResultsDrawer header h2{margin:7px 0 0;font-size:28px;letter-spacing:-.05em}
      .moResultsDrawer header p{max-width:360px;margin:5px 0 0;color:rgba(255,255,255,.36);font-size:7px;line-height:1.45}
      .moResultsDrawer header>button{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}
      .moDrawerList{display:grid;gap:8px;height:calc(100vh - 220px);margin-top:12px;overflow-y:auto;padding-right:2px}
      .moDrawerList>button{display:grid;grid-template-columns:82px minmax(0,1fr) 34px;align-items:center;gap:11px;width:100%;padding:7px;border:1px solid rgba(255,255,255,.075);border-radius:16px;background:rgba(255,255,255,.035);color:#fff;text-align:left;cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease}
      .moDrawerList>button:hover,.moDrawerList>button.active{border-color:rgba(186,255,158,.28);background:linear-gradient(90deg,rgba(186,255,158,.08),rgba(255,255,255,.04));transform:translateX(3px)}
      .moDrawerImage{display:block;width:82px;height:72px;padding:2px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.03)}
      .moDrawerList img{width:100%;height:100%;border-radius:9px;object-fit:cover}
      .moDrawerList span,.moDrawerList strong,.moDrawerList small{display:block}
      .moDrawerList>button>div>span{color:#baff9e;font-size:5px;font-weight:900;text-transform:uppercase}
      .moDrawerList strong{margin-top:3px;overflow:hidden;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
      .moDrawerList small{margin-top:3px;color:rgba(255,255,255,.4);font-size:6px}
      .moDrawerArrow{display:grid!important;place-items:center;width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.04);color:#baff9e}
      .moLoading{display:grid;place-items:center;align-content:center;gap:10px;min-height:100vh;background:radial-gradient(circle at 50% 42%,rgba(186,255,158,.08),transparent 20%),#07110b;color:#fff;font-family:Inter,system-ui,sans-serif;text-align:center}
      .moLoadingOrb{display:grid;place-items:center;width:62px;height:62px;border:1px solid rgba(186,255,158,.16);border-radius:20px;background:rgba(186,255,158,.07);color:#baff9e;animation:moLoadPulse 1.5s ease-in-out infinite}
      @keyframes moLoadPulse{0%,100%{transform:scale(.96);opacity:.6}50%{transform:scale(1.04);opacity:1}}
      .moLoading strong{font-size:15px}
      .moLoading>span{color:rgba(255,255,255,.38);font-size:8px}

      @media(max-width:900px){
        .moPassportHud{display:none}
        .moCommand{top:156px}
        .moMapHeader{top:88px}
      }

      @media(max-width:700px){
        .moMapStage{height:100svh;min-height:650px}
        .moMapHeader{top:78px;right:10px;left:10px}
        .moBrand{padding:7px 8px;border-radius:14px}
        .moBrand>span{width:34px;height:34px}
        .moBrand small{display:none}
        .moHeaderActions{gap:5px}
        .moHeaderActions button,.moHeaderActions a{width:40px;min-height:40px;padding:0;border-radius:12px}
        .moHeaderActions span{display:none}
        .moCommand{top:auto;right:10px;bottom:10px;left:10px;width:auto;max-height:60vh;padding:16px;border-radius:22px;overflow-y:auto;transition:.22s ease}
        .moCommand.collapsed{right:auto;bottom:12px;width:178px;max-height:none;padding:12px}
        .moCommand.collapsed .moCommandIntro p,
        .moCommand.collapsed .moSearch,
        .moCommand.collapsed .moQuickFilters,
        .moCommand.collapsed .moNearMe,
        .moCommand.collapsed .moCommandFooter{display:none}
        .moCommand.collapsed .moCommandIntro h1{margin-top:8px;font-size:27px;line-height:.9}
        .moCommand.collapsed .moCommandBadge span{font-size:5px}
        .moCommand h1{font-size:39px}
        .moCommandIntro p{font-size:8px}
        .moNearMeList{grid-template-columns:repeat(2,minmax(0,1fr))}
        .moNearMeList>button{grid-template-columns:44px minmax(0,1fr)}
        .moNearArrow{display:none!important}
        .moNearbyImage{width:44px;height:44px}
        .moFloatingDiscover{right:10px;bottom:auto;top:130px;min-width:0;min-height:49px;padding:5px;border-radius:16px}
        .moFloatingDiscoverCopy,.moFloatingDiscoverArrow{display:none}
        .moFloatingDiscoverIcon{width:39px;height:39px}
        .moPlaceSheet{right:10px;bottom:10px;left:10px;grid-template-columns:118px minmax(0,1fr);width:auto;border-radius:20px}
        .moPlaceSheetVisual{min-height:190px}
        .moPlaceSheet h2{font-size:18px}
        .moPlaceSheetBody{padding:12px}
        .moPlaceSheetDescription{display:none}
        .moPlaceSheetStats{gap:4px}
        .moPlaceSheetStats>span{padding:6px}
        .moPlaceSheet+.moFloatingDiscover{display:none}
        .moResultsDrawer>section{padding-top:96px}
        .moDrawerList{height:calc(100vh - 195px)}
        .moPhotoMarker{width:72px;height:84px}
        .moPhotoMarkerCard{width:64px;height:64px;border-radius:19px}
        .moPhotoMarker.active{width:102px;height:112px}
        .moPhotoMarker.active .moPhotoMarkerCard{width:94px;height:88px;border-radius:22px}
      }

      @media(max-width:470px){
        .moBrand strong{font-size:8px}
        .moCommand{max-height:64vh}
        .moNearMeList{grid-template-columns:1fr}
        .moCommandFooter{grid-template-columns:auto auto minmax(106px,1fr)}
        .moPlaceSheet{grid-template-columns:104px minmax(0,1fr)}
        .moPlaceSheetVisual{min-height:182px}
        .moPlaceSheetStats small{display:none}
        .moPlaceSheetStats>span{grid-template-columns:auto 1fr}
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
