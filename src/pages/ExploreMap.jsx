import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
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

function makeMarker(place, active) {
  const count = Number(place.visitors_count || 0);

  return L.divIcon({
    className: "moMarkerShell",
    html: `
      <div class="moMarker ${active ? "active" : ""}">
        <div class="moMarkerInner">
          <span>●</span>
          ${count > 0 ? `<b>${count > 99 ? "99+" : count}</b>` : ""}
        </div>
      </div>
    `,
    iconSize: [54, 58],
    iconAnchor: [27, 50],
    popupAnchor: [0, -42],
  });
}

function FocusPlace({ place }) {
  const map = useMap();

  useEffect(() => {
    if (!place) return;

    map.flyTo(
      [Number(place.latitude), Number(place.longitude)],
      12.5,
      { duration: 0.8 }
    );
  }, [map, place]);

  return null;
}

function LocateUser({ requestId }) {
  const map = useMap();

  useEffect(() => {
    if (!requestId || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo(
          [position.coords.latitude, position.coords.longitude],
          13.5,
          { duration: 0.8 }
        );
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [map, requestId]);

  return null;
}

function formatNumber(value) {
  return new Intl.NumberFormat("sr-Latn-RS").format(
    Number(value || 0)
  );
}

export default function ExploreMap() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locateRequest, setLocateRequest] = useState(0);
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
      await Promise.all([loadPlaces(), loadCategories()]);
      if (active) setLoading(false);
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

  const filteredPlaces = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return places.filter((place) => {
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
    });
  }, [categoryId, places, query]);

  const selectedPlace = useMemo(
    () =>
      places.find((place) => place.id === selectedPlaceId) ||
      filteredPlaces[0] ||
      null,
    [filteredPlaces, places, selectedPlaceId]
  );

  const totals = useMemo(
    () =>
      places.reduce(
        (accumulator, place) => {
          accumulator.checkins += Number(
            place.checkins_count || 0
          );
          accumulator.photos += Number(place.photos_count || 0);
          return accumulator;
        },
        {
          checkins: 0,
          photos: 0,
        }
      ),
    [places]
  );

  if (loading) {
    return (
      <>
        <ExploreStyles />
        <main className="moLoading">
          <span />
          <strong>Budimo outdoor mapu...</strong>
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

            <FocusPlace place={selectedPlace} />
            <LocateUser requestId={locateRequest} />

            {filteredPlaces.map((place) => (
              <Marker
                key={place.id}
                position={[
                  Number(place.latitude),
                  Number(place.longitude),
                ]}
                icon={makeMarker(
                  place,
                  place.id === selectedPlace?.id
                )}
                eventHandlers={{
                  click: () => {
                    setSelectedPlaceId(place.id);
                    setDrawerOpen(true);
                  },
                }}
              >
                <Popup>
                  <div className="moPopup">
                    <strong>{place.name}</strong>
                    <small>
                      {formatNumber(place.visitors_count)} ljudi bilo
                      ovde
                    </small>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="moMapShade" />

          <header className="moMapHeader">
            <div className="moBrand">
              <span>
                <Icon name="compass" size={18} />
              </span>

              <div>
                <strong>EXPLORE SERBIA</strong>
                <small>Powered by MeetOutdoors</small>
              </div>
            </div>

            <div className="moHeaderActions">
              <button
                type="button"
                onClick={() =>
                  setLocateRequest((value) => value + 1)
                }
              >
                <Icon name="navigation" size={16} />
                Blizu mene
              </button>

              {profile ? (
                <Link to="/explore/add">
                  <Icon name="plus" size={16} />
                  Otkrij mesto
                </Link>
              ) : (
                <Link to="/login">
                  Prijavi se
                  <Icon name="arrow" size={15} />
                </Link>
              )}
            </div>
          </header>

          <aside className="moCommand">
            <div className="moCommandTop">
              <span className="moCommandKicker">
                <i />
                LIVE OUTDOOR MAPA
              </span>

              <h1>
                Gde ideš
                <br />
                sledeće?
              </h1>

              <p>
                Pronađi mesta koja su drugi stvarno obišli.
                Sačuvaj, istraži i ostavi svoj GPS trag.
              </p>
            </div>

            <label className="moSearch">
              <Icon name="search" size={17} />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Tara, jezero, vidikovac..."
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
                className={categoryId === "all" ? "active" : ""}
                onClick={() => setCategoryId("all")}
              >
                Sve
              </button>

              {categories.slice(0, 6).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={
                    categoryId === category.id ? "active" : ""
                  }
                  onClick={() =>
                    setCategoryId(category.id)
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="moCommandStats">
              <article>
                <strong>{formatNumber(places.length)}</strong>
                <span>mesta</span>
              </article>

              <article>
                <strong>{formatNumber(totals.checkins)}</strong>
                <span>check-inova</span>
              </article>

              <article>
                <strong>{formatNumber(totals.photos)}</strong>
                <span>fotografija</span>
              </article>
            </div>

            <button
              type="button"
              className="moListToggle"
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="layers" size={16} />
              Prikaži rezultate
              <span>{filteredPlaces.length}</span>
            </button>
          </aside>

          <aside className="moPassportHud">
            <Icon name="trophy" size={19} />

            <div>
              <span>OUTDOOR PASSPORT</span>
              <strong>
                {profile
                  ? "Tvoja Srbija tek počinje."
                  : "Prijavi se i otključavaj mapu."}
              </strong>
            </div>
          </aside>

          {selectedPlace && (
            <section className="moPlaceCard">
              <img
                src={selectedPlace.cover_url || FALLBACK_COVER}
                alt=""
              />

              <div className="moPlaceCardBody">
                <div className="moPlaceCardMeta">
                  <span>
                    {selectedPlace.place_categories?.name ||
                      "Outdoor mesto"}
                  </span>

                  {selectedPlace.location_precision !== "exact" && (
                    <em>Zaštićena lokacija</em>
                  )}
                </div>

                <h2>{selectedPlace.name}</h2>

                <p>
                  {[selectedPlace.locality, selectedPlace.region]
                    .filter(Boolean)
                    .join(" · ") || "Srbija"}
                </p>

                <div className="moPlaceCardStats">
                  <span>
                    <Icon name="users" size={13} />
                    {formatNumber(
                      selectedPlace.visitors_count
                    )}
                  </span>

                  <span>
                    <Icon name="camera" size={13} />
                    {formatNumber(
                      selectedPlace.photos_count
                    )}
                  </span>

                  <span>
                    <Icon name="heart" size={13} />
                    {formatNumber(
                      selectedPlace.saves_count
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/explore/${selectedPlace.id}`
                    )
                  }
                >
                  Otvori mesto
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            </section>
          )}

          <button
            type="button"
            className="moFloatingAdd"
            onClick={() =>
              navigate(profile ? "/explore/add" : "/login")
            }
          >
            <Icon name="plus" size={21} />
            <span>OTKRIJ MESTO</span>
          </button>
        </div>

        <div
          className={`moResultsDrawer ${
            drawerOpen ? "open" : ""
          }`}
        >
          <button
            type="button"
            className="moDrawerBackdrop"
            onClick={() => setDrawerOpen(false)}
            aria-label="Zatvori rezultate"
          />

          <section>
            <header>
              <div>
                <span>
                  <Icon name="filter" size={15} />
                  REZULTATI
                </span>
                <h2>
                  {filteredPlaces.length} mesta za otkrivanje
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
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
                    place.id === selectedPlace?.id
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setSelectedPlaceId(place.id);
                    setDrawerOpen(false);
                  }}
                >
                  <img
                    src={place.cover_url || FALLBACK_COVER}
                    alt=""
                  />

                  <div>
                    <span>
                      {place.place_categories?.name ||
                        "Outdoor mesto"}
                    </span>
                    <strong>{place.name}</strong>
                    <small>
                      {[place.locality, place.region]
                        .filter(Boolean)
                        .join(" · ") || "Srbija"}
                    </small>
                  </div>

                  <Icon name="arrow" size={16} />
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
      body{margin:0;background:#06100b}
      button,input{font:inherit}
      .moExplore{min-height:100vh;background:#06100b;color:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .moExplore a{color:inherit;text-decoration:none}
      .moMapStage{position:relative;height:100vh;min-height:720px;overflow:hidden}
      .moLeaflet{position:absolute;inset:0;z-index:1;width:100%;height:100%;background:#dfe7dc}
      .moMapShade{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(90deg,rgba(3,10,6,.74) 0%,rgba(3,10,6,.42) 26%,transparent 48%),linear-gradient(180deg,rgba(3,10,6,.62),transparent 22%,transparent 72%,rgba(3,10,6,.52))}
      .moMapHeader{position:absolute;top:106px;right:24px;left:24px;z-index:700;display:flex;align-items:center;justify-content:space-between;gap:18px}
      .moBrand{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(4,14,8,.58);backdrop-filter:blur(18px)}
      .moBrand>span{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#baff9e;color:#0e2717}
      .moBrand strong,.moBrand small{display:block}.moBrand strong{font-size:9px;letter-spacing:.12em}.moBrand small{margin-top:3px;color:rgba(255,255,255,.45);font-size:6px}
      .moHeaderActions{display:flex;gap:8px}.moHeaderActions button,.moHeaderActions a{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:43px;padding:0 13px;border:1px solid rgba(255,255,255,.14);border-radius:13px;background:rgba(4,14,8,.58);color:#fff;cursor:pointer;font-size:8px;font-weight:850;backdrop-filter:blur(18px)}.moHeaderActions a{border-color:#baff9e;background:#baff9e;color:#102619}
      .moCommand{position:absolute;top:176px;left:24px;z-index:650;width:min(410px,calc(100% - 48px));padding:22px;border:1px solid rgba(255,255,255,.12);border-radius:26px;background:linear-gradient(145deg,rgba(4,14,8,.84),rgba(10,29,17,.72));box-shadow:0 24px 60px rgba(0,0,0,.28);backdrop-filter:blur(24px)}
      .moCommandKicker{display:inline-flex;align-items:center;gap:7px;color:#baff9e;font-size:7px;font-weight:950;letter-spacing:.12em}.moCommandKicker i{width:7px;height:7px;border-radius:50%;background:#baff9e;box-shadow:0 0 0 5px rgba(186,255,158,.09)}
      .moCommand h1{margin:14px 0 0;font-size:clamp(44px,6vw,72px);line-height:.83;letter-spacing:-.075em}.moCommandTop p{margin:16px 0 0;color:rgba(255,255,255,.53);font-size:10px;line-height:1.65}
      .moSearch{display:flex;align-items:center;gap:8px;margin-top:20px;min-height:48px;padding:0 12px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.55)}
      .moSearch input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:9px}.moSearch button{display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:9px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
      .moQuickFilters{display:flex;gap:6px;margin-top:9px;overflow-x:auto;scrollbar-width:none}.moQuickFilters::-webkit-scrollbar{display:none}.moQuickFilters button{flex:0 0 auto;min-height:34px;padding:0 10px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.62);cursor:pointer;font-size:7px;font-weight:800}.moQuickFilters button.active{border-color:#baff9e;background:#baff9e;color:#102619}
      .moCommandStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:15px}.moCommandStats article{padding:11px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.04)}.moCommandStats strong,.moCommandStats span{display:block}.moCommandStats strong{font-size:15px}.moCommandStats span{margin-top:3px;color:rgba(255,255,255,.36);font-size:6px;text-transform:uppercase}
      .moListToggle{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:43px;margin-top:10px;padding:0 12px;border:1px solid rgba(186,255,158,.16);border-radius:12px;background:rgba(186,255,158,.08);color:#d7ffc6;cursor:pointer;font-size:8px;font-weight:850}.moListToggle span{display:grid;place-items:center;min-width:24px;height:24px;border-radius:999px;background:#baff9e;color:#102619}
      .moPassportHud{position:absolute;top:176px;right:24px;z-index:650;display:flex;align-items:center;gap:10px;max-width:280px;padding:13px 14px;border:1px solid rgba(255,255,255,.12);border-radius:15px;background:rgba(4,14,8,.66);color:#baff9e;backdrop-filter:blur(18px)}.moPassportHud span,.moPassportHud strong{display:block}.moPassportHud span{font-size:6px;font-weight:900;letter-spacing:.1em}.moPassportHud strong{margin-top:3px;color:#fff;font-size:8px;line-height:1.4}
      .moPlaceCard{position:absolute;right:24px;bottom:24px;z-index:650;display:grid;grid-template-columns:160px minmax(0,1fr);width:min(470px,calc(100% - 48px));overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:22px;background:rgba(5,16,9,.8);box-shadow:0 24px 60px rgba(0,0,0,.28);backdrop-filter:blur(20px)}.moPlaceCard>img{width:160px;height:100%;min-height:210px;object-fit:cover}.moPlaceCardBody{padding:16px}.moPlaceCardMeta{display:flex;align-items:center;justify-content:space-between;gap:8px}.moPlaceCardMeta span{color:#baff9e;font-size:7px;font-weight:900;text-transform:uppercase}.moPlaceCardMeta em{color:#e4d392;font-size:6px;font-style:normal}.moPlaceCard h2{margin:8px 0 0;font-size:22px;line-height:1.05;letter-spacing:-.045em}.moPlaceCardBody>p{margin:6px 0 0;color:rgba(255,255,255,.45);font-size:7px}.moPlaceCardStats{display:flex;gap:9px;margin-top:12px}.moPlaceCardStats span{display:inline-flex;align-items:center;gap:5px;color:rgba(255,255,255,.58);font-size:7px}.moPlaceCard button{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:41px;margin-top:13px;padding:0 11px;border:0;border-radius:11px;background:#baff9e;color:#102619;cursor:pointer;font-size:8px;font-weight:900}
      .moFloatingAdd{position:absolute;right:24px;bottom:260px;z-index:650;display:flex;align-items:center;gap:8px;min-height:46px;padding:0 14px;border:1px solid #baff9e;border-radius:999px;background:#baff9e;color:#102619;cursor:pointer;box-shadow:0 16px 34px rgba(33,85,49,.24);font-size:8px;font-weight:950;letter-spacing:.06em}
      .moMarkerShell{background:transparent!important;border:0!important}.moMarker{display:grid;place-items:center;width:48px;height:48px;border-radius:18px 18px 18px 4px;background:#173b27;box-shadow:0 12px 30px rgba(0,0,0,.28);transform:rotate(-45deg);transition:.18s ease}.moMarker.active{background:#baff9e;transform:rotate(-45deg) scale(1.14)}.moMarkerInner{position:relative;display:grid;place-items:center;width:100%;height:100%;color:#baff9e;transform:rotate(45deg)}.moMarker.active .moMarkerInner{color:#102619}.moMarkerInner>b{position:absolute;top:-9px;right:-9px;display:grid;place-items:center;min-width:22px;height:22px;padding:0 4px;border:2px solid #fff;border-radius:999px;background:#baff9e;color:#102619;font-size:6px}.leaflet-popup-content-wrapper{border-radius:14px!important;background:#0b1d12!important;color:#fff!important}.leaflet-popup-tip{background:#0b1d12!important}.moPopup{display:grid;gap:4px}.moPopup strong{font-size:11px}.moPopup small{color:rgba(255,255,255,.5);font-size:7px}
      .moResultsDrawer{position:fixed;inset:0;z-index:5000;pointer-events:none}.moResultsDrawer.open{pointer-events:auto}.moDrawerBackdrop{position:absolute;inset:0;border:0;background:rgba(0,0,0,.56);opacity:0;transition:.24s ease}.moResultsDrawer.open .moDrawerBackdrop{opacity:1}.moResultsDrawer>section{position:absolute;top:0;bottom:0;left:0;width:min(520px,92vw);padding:120px 18px 18px;background:#08140d;color:#fff;box-shadow:24px 0 70px rgba(0,0,0,.35);transform:translateX(-100%);transition:.28s ease}.moResultsDrawer.open>section{transform:translateX(0)}.moResultsDrawer header{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:0 4px 15px;border-bottom:1px solid rgba(255,255,255,.1)}.moResultsDrawer header span{display:inline-flex;align-items:center;gap:6px;color:#baff9e;font-size:7px;font-weight:900;letter-spacing:.1em}.moResultsDrawer header h2{margin:7px 0 0;font-size:27px;letter-spacing:-.05em}.moResultsDrawer header>button{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}.moDrawerList{display:grid;gap:8px;height:calc(100vh - 210px);margin-top:12px;overflow-y:auto}.moDrawerList>button{display:grid;grid-template-columns:90px minmax(0,1fr) auto;align-items:center;gap:11px;width:100%;padding:8px;border:1px solid rgba(255,255,255,.08);border-radius:15px;background:rgba(255,255,255,.04);color:#fff;text-align:left;cursor:pointer}.moDrawerList>button.active{border-color:rgba(186,255,158,.35);background:rgba(186,255,158,.08)}.moDrawerList img{width:90px;height:78px;border-radius:11px;object-fit:cover}.moDrawerList span,.moDrawerList strong,.moDrawerList small{display:block}.moDrawerList span{color:#baff9e;font-size:6px;font-weight:900;text-transform:uppercase}.moDrawerList strong{margin-top:4px;overflow:hidden;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.moDrawerList small{margin-top:3px;color:rgba(255,255,255,.4);font-size:6px}
      .moLoading{display:grid;place-items:center;align-content:center;gap:10px;min-height:100vh;background:#06100b;color:#fff;font-family:Inter,system-ui,sans-serif}.moLoading>span{width:38px;height:38px;border:3px solid rgba(255,255,255,.14);border-top-color:#baff9e;border-radius:50%;animation:moSpin .8s linear infinite}@keyframes moSpin{to{transform:rotate(360deg)}}.moLoading strong{font-size:15px}
      @media(max-width:900px){.moPassportHud{display:none}.moCommand{top:160px}.moPlaceCard{right:18px;bottom:18px}.moFloatingAdd{right:18px;bottom:245px}.moMapHeader{top:90px}}
      @media(max-width:700px){.moMapStage{min-height:100svh}.moMapHeader{top:82px;right:12px;left:12px}.moBrand small{display:none}.moHeaderActions button{display:none}.moCommand{top:145px;left:12px;width:calc(100% - 24px);padding:17px;border-radius:20px}.moCommand h1{font-size:48px}.moCommandTop p{font-size:9px}.moCommandStats{display:none}.moListToggle{margin-top:9px}.moPlaceCard{right:12px;bottom:12px;left:12px;grid-template-columns:105px minmax(0,1fr);width:auto}.moPlaceCard>img{width:105px;min-height:170px}.moPlaceCard h2{font-size:18px}.moFloatingAdd{right:12px;bottom:195px;min-height:43px;padding:0 12px}.moFloatingAdd span{display:none}.moResultsDrawer>section{padding-top:100px}.moDrawerList{height:calc(100vh - 190px)}}
      @media(max-width:430px){.moHeaderActions a{padding:0 11px}.moCommand{top:138px}.moCommand h1{font-size:42px}.moQuickFilters{margin-top:8px}.moPlaceCard{grid-template-columns:92px minmax(0,1fr)}.moPlaceCard>img{width:92px}.moPlaceCardStats{gap:6px}.moFloatingAdd{bottom:190px}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    `}</style>
  );
}
