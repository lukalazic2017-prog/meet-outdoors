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
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const SERBIA_CENTER = [44.0165, 21.0059];

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
    navigation: <path d="m3 11 18-8-8 18-2-8-8-2Z" />,
    check: <path d="m5 12 4 4L19 6" />,
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

const markerIcon = L.divIcon({
  className: "discoverPinShell",
  html: `<div class="discoverPin"><span>+</span></div>`,
  iconSize: [50, 58],
  iconAnchor: [25, 52],
});

function MapStep({ point, onChange }) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return point ? (
    <Marker
      position={[point.latitude, point.longitude]}
      icon={markerIcon}
    />
  ) : null;
}

function GpsController({
  requestId,
  onLocation,
  onError,
}) {
  const map = useMap();

  useEffect(() => {
    if (!requestId) return;

    if (!navigator.geolocation) {
      onError("GPS nije dostupan na ovom uređaju.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        onLocation(result);

        map.flyTo(
          [result.latitude, result.longitude],
          15,
          { duration: 0.8 }
        );
      },
      (error) => {
        onError(
          error?.message ||
            "Lokaciju nije moguće očitati."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      }
    );
  }, [map, onError, onLocation, requestId]);

  return null;
}

export default function AddPlace() {
  const navigate = useNavigate();
  const {
    profile,
    loading: authLoading,
  } = useAuth();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [point, setPoint] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [protection, setProtection] = useState(null);
  const [gpsRequest, setGpsRequest] = useState(0);
  const [checking, setChecking] = useState(false);
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

  useEffect(() => {
    async function loadCategories() {
      const { data, error: categoryError } = await supabase
        .from("place_categories")
        .select("id, name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!categoryError) setCategories(data || []);
    }

    loadCategories();
  }, []);

  const inspectPoint = useCallback(async (location) => {
    if (!location) return;

    setChecking(true);
    setError("");

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
      setError(
        inspectError?.message ||
          "Lokaciju trenutno nije moguće proveriti."
      );
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    inspectPoint(point);
  }, [inspectPoint, point]);

  const canGoStep2 =
    Boolean(point) &&
    protection?.status !== "block" &&
    !checking;

  const canGoStep3 =
    form.name.trim().length >= 2 &&
    Boolean(form.category_id);

  const reviewItems = useMemo(
    () => [
      ["Naziv", form.name || "—"],
      [
        "Kategorija",
        categories.find(
          (category) =>
            category.id === form.category_id
        )?.name || "—",
      ],
      [
        "Lokacija",
        point
          ? `${point.latitude.toFixed(
              5
            )}, ${point.longitude.toFixed(5)}`
          : "—",
      ],
      [
        "Zaštita",
        protection?.status === "approximate"
          ? "Približna javna lokacija"
          : protection?.status === "block"
            ? "Blokirana"
            : "Dozvoljena",
      ],
      [
        "GPS radius",
        `${form.verification_radius_m || 200} m`,
      ],
    ],
    [
      categories,
      form.category_id,
      form.name,
      form.verification_radius_m,
      point,
      protection?.status,
    ]
  );

  async function createPlace() {
    if (!profile?.id || !point) return;

    try {
      setSaving(true);
      setError("");

      const { data, error: createError } = await supabase.rpc(
        "create_place",
        {
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
        }
      );

      if (createError) throw createError;

      navigate(`/explore/${data}`, {
        replace: true,
      });
    } catch (createPlaceError) {
      setError(
        createPlaceError?.message ||
          "Mesto trenutno nije moguće kreirati."
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return null;

  if (!profile?.id) {
    return (
      <>
        <AddPlaceStyles />
        <main className="discoverState">
          <Icon name="shield" size={30} />
          <h1>Prijavi se da ostaviš trag.</h1>
          <Link to="/login">Prijavi se</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <AddPlaceStyles />

      <main className="discoverPage">
        <section className="discoverHero">
          <Link to="/explore" className="discoverBack">
            <Icon name="arrowLeft" size={16} />
            Explore
          </Link>

          <div>
            <span className="discoverEyebrow">
              <i />
              OTKRIJ MESTO
            </span>

            <h1>
              Jedan pin.
              <br />
              Novi razlog da neko krene.
            </h1>

            <p>
              Bez komplikacije. Prvo lokacija, zatim osnovne
              informacije, pa finalna provera.
            </p>
          </div>
        </section>

        <section className="discoverContent">
          <div className="discoverSteps">
            {[1, 2, 3].map((item) => (
              <button
                key={item}
                type="button"
                className={
                  step === item
                    ? "active"
                    : step > item
                      ? "done"
                      : ""
                }
                onClick={() => {
                  if (item < step) setStep(item);
                }}
              >
                <span>
                  {step > item ? (
                    <Icon name="check" size={14} />
                  ) : (
                    item
                  )}
                </span>

                <div>
                  <strong>
                    {item === 1
                      ? "Lokacija"
                      : item === 2
                        ? "Detalji"
                        : "Objavi"}
                  </strong>
                  <small>
                    {item === 1
                      ? "Pin + GPS"
                      : item === 2
                        ? "Šta smo otkrili"
                        : "Finalna provera"}
                  </small>
                </div>
              </button>
            ))}
          </div>

          {step === 1 && (
            <section className="discoverStepCard">
              <header>
                <div>
                  <span>KORAK 01</span>
                  <h2>Postavi pin.</h2>
                  <p>
                    Klikni direktno na mapu ili koristi trenutni GPS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setGpsRequest((value) => value + 1)
                  }
                >
                  <Icon name="navigation" size={16} />
                  Moj GPS
                </button>
              </header>

              <div className="discoverMapWrap">
                <MapContainer
                  center={SERBIA_CENTER}
                  zoom={7}
                  scrollWheelZoom
                  className="discoverMap"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapStep
                    point={point}
                    onChange={setPoint}
                  />

                  <GpsController
                    requestId={gpsRequest}
                    onLocation={(location) => {
                      setPoint(location);
                      setError("");
                    }}
                    onError={setError}
                  />
                </MapContainer>

                <div className="discoverMapHint">
                  <Icon name="mapPin" size={14} />
                  Klikni na tačnu lokaciju
                </div>
              </div>

              <div className="discoverLocationMeta">
                <article>
                  <span>LAT</span>
                  <strong>
                    {point
                      ? point.latitude.toFixed(6)
                      : "—"}
                  </strong>
                </article>

                <article>
                  <span>LNG</span>
                  <strong>
                    {point
                      ? point.longitude.toFixed(6)
                      : "—"}
                  </strong>
                </article>

                <article>
                  <span>STATUS</span>
                  <strong>
                    {checking
                      ? "Provera..."
                      : protection?.status === "block"
                        ? "Blokirano"
                        : protection?.status === "approximate"
                          ? "Zaštićeno"
                          : point
                            ? "Dozvoljeno"
                            : "Čeka pin"}
                  </strong>
                </article>
              </div>

              {protection && (
                <div
                  className={`discoverProtection ${protection.status}`}
                >
                  <Icon
                    name={
                      protection.status === "block"
                        ? "alert"
                        : "shield"
                    }
                    size={18}
                  />

                  <div>
                    <strong>
                      {protection.status === "block"
                        ? "Ova zona ne može biti javno pinovana."
                        : protection.status === "approximate"
                          ? "Precizna lokacija će biti skrivena."
                          : "Lokacija može da postane deo mape."}
                    </strong>
                    <p>{protection.message}</p>
                  </div>
                </div>
              )}

              {nearby.length > 0 && (
                <div className="discoverDuplicates">
                  <div>
                    <Icon name="search" size={16} />
                    <span>
                      {nearby.length} mesta postoji u krugu od 500 m
                    </span>
                  </div>

                  {nearby.slice(0, 4).map((place) => (
                    <Link
                      key={place.id}
                      to={`/explore/${place.id}`}
                    >
                      <strong>{place.name}</strong>
                      <small>
                        {Math.round(place.distance_m)} m
                      </small>
                      <Icon name="arrowRight" size={14} />
                    </Link>
                  ))}
                </div>
              )}

              {error && (
                <div className="discoverError">
                  <Icon name="alert" size={16} />
                  {error}
                </div>
              )}

              <footer>
                <span />
                <button
                  type="button"
                  disabled={!canGoStep2}
                  onClick={() => setStep(2)}
                >
                  Nastavi
                  <Icon name="arrowRight" size={16} />
                </button>
              </footer>
            </section>
          )}

          {step === 2 && (
            <section className="discoverStepCard">
              <header>
                <div>
                  <span>KORAK 02</span>
                  <h2>Šta smo otkrili?</h2>
                  <p>
                    Samo ono što je korisno sledećem čoveku.
                  </p>
                </div>
              </header>

              <div className="discoverFields">
                <label className="wide">
                  <span>Naziv mesta *</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="npr. Vidikovac Molitva"
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
                    placeholder="Jedna dobra rečenica."
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
                    placeholder="Pristup, parking, šta očekivati..."
                  />
                </label>

                <label>
                  <span>Region</span>
                  <input
                    value={form.region}
                    onChange={(event) =>
                      updateField("region", event.target.value)
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
                    <option value="">Nije navedeno</option>
                    <option value="easy">Lako</option>
                    <option value="moderate">Srednje</option>
                    <option value="hard">Zahtevno</option>
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
                    <option value="">Nije navedeno</option>
                    <option value="car">Automobil</option>
                    <option value="walk">Peške</option>
                    <option value="4x4">4x4</option>
                    <option value="bike">Bicikl</option>
                    <option value="mixed">Kombinovano</option>
                  </select>
                </label>

                <label className="wide">
                  <span>GPS radius za check-in</span>
                  <input
                    type="number"
                    min="20"
                    max="10000"
                    value={form.verification_radius_m}
                    onChange={(event) =>
                      updateField(
                        "verification_radius_m",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              {error && (
                <div className="discoverError">
                  <Icon name="alert" size={16} />
                  {error}
                </div>
              )}

              <footer>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setStep(1)}
                >
                  <Icon name="arrowLeft" size={15} />
                  Nazad
                </button>

                <button
                  type="button"
                  disabled={!canGoStep3}
                  onClick={() => setStep(3)}
                >
                  Pregled
                  <Icon name="arrowRight" size={16} />
                </button>
              </footer>
            </section>
          )}

          {step === 3 && (
            <section className="discoverStepCard">
              <header>
                <div>
                  <span>KORAK 03</span>
                  <h2>Finalna provera.</h2>
                  <p>
                    Ako je sve tačno, ovaj trag ide u MeetOutdoors.
                  </p>
                </div>
              </header>

              <div className="discoverReview">
                {reviewItems.map(([label, value]) => (
                  <article key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>

              <div className="discoverFinalNote">
                <Icon name="sparkle" size={20} />
                <div>
                  <strong>Community pin</strong>
                  <p>
                    Novi pin kreće kao pending. Zaštićene lokacije
                    automatski čuvaju tačne GPS koordinate privatno.
                  </p>
                </div>
              </div>

              {error && (
                <div className="discoverError">
                  <Icon name="alert" size={16} />
                  {error}
                </div>
              )}

              <footer>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setStep(2)}
                >
                  <Icon name="arrowLeft" size={15} />
                  Nazad
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={createPlace}
                >
                  {saving
                    ? "Čuvamo trag..."
                    : "Objavi mesto"}
                  <Icon name="arrowRight" size={16} />
                </button>
              </footer>
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
      body{margin:0;background:#e8ece4}
      button,input,textarea,select{font:inherit}
      .discoverPage,.discoverState{min-height:100vh;color:#1f3127;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .discoverPage{padding:118px 24px 70px;background:radial-gradient(circle at 6% 0%,rgba(186,255,158,.14),transparent 26%),#e8ece4}
      .discoverPage a{color:inherit;text-decoration:none}
      .discoverHero{position:relative;isolation:isolate;width:min(1200px,100%);min-height:500px;margin:0 auto;padding:31px;overflow:hidden;border-radius:34px;background:radial-gradient(circle at 82% 20%,rgba(186,255,158,.16),transparent 24%),linear-gradient(135deg,#07140c,#123321 58%,#1d4b31);color:#fff;box-shadow:0 32px 80px rgba(23,54,36,.2)}
      .discoverBack{display:inline-flex;align-items:center;gap:7px;min-height:39px;padding:0 12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.06);color:#fff!important;font-size:8px;font-weight:850}
      .discoverHero>div{max-width:900px;padding-top:84px}.discoverEyebrow{display:inline-flex;align-items:center;gap:7px;color:#baff9e;font-size:8px;font-weight:950;letter-spacing:.12em}.discoverEyebrow i{width:7px;height:7px;border-radius:50%;background:#baff9e}
      .discoverHero h1{margin:18px 0 0;font-size:clamp(55px,7vw,92px);line-height:.85;letter-spacing:-.075em}.discoverHero p{max-width:600px;margin:21px 0 0;color:rgba(255,255,255,.56);font-size:12px;line-height:1.7}
      .discoverContent{width:min(1040px,100%);margin:18px auto 0}.discoverSteps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.discoverSteps button{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:10px;padding:12px;border:1px solid #d8e0d5;border-radius:15px;background:rgba(255,255,255,.7);color:#516257;text-align:left;cursor:default}.discoverSteps button.done{cursor:pointer}.discoverSteps button.active{border-color:#173b27;background:#173b27;color:#fff}.discoverSteps button>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#e8efe2;color:#5b7744;font-size:8px;font-weight:900}.discoverSteps button.active>span{background:#baff9e;color:#102619}.discoverSteps strong,.discoverSteps small{display:block}.discoverSteps strong{font-size:9px}.discoverSteps small{margin-top:3px;color:#8b958e;font-size:6px}.discoverSteps button.active small{color:rgba(255,255,255,.42)}
      .discoverStepCard{margin-top:12px;padding:21px;border:1px solid #d8e0d5;border-radius:24px;background:rgba(255,255,255,.86);box-shadow:0 16px 40px rgba(28,48,35,.06)}
      .discoverStepCard>header{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:15px}.discoverStepCard>header span{color:#789456;font-size:7px;font-weight:900;letter-spacing:.1em}.discoverStepCard>header h2{margin:5px 0 0;color:#293e31;font-size:31px;letter-spacing:-.055em}.discoverStepCard>header p{margin:6px 0 0;color:#89938c;font-size:8px}.discoverStepCard>header>button{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 12px;border:1px solid #173b27;border-radius:11px;background:#173b27;color:#fff;cursor:pointer;font-size:8px;font-weight:850}
      .discoverMapWrap{position:relative;height:500px;overflow:hidden;border:1px solid #d9e2d6;border-radius:18px}.discoverMap{width:100%;height:100%}.discoverMapHint{position:absolute;top:12px;left:50%;z-index:500;display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:999px;background:rgba(6,18,10,.76);color:#fff;font-size:7px;font-weight:850;transform:translateX(-50%);backdrop-filter:blur(12px)}
      .discoverPinShell{background:transparent!important;border:0!important}.discoverPin{display:grid;place-items:center;width:46px;height:46px;border:3px solid #fff;border-radius:16px 16px 16px 4px;background:#baff9e;color:#102619;box-shadow:0 14px 30px rgba(13,44,25,.32);transform:rotate(-45deg)}.discoverPin span{font-size:18px;font-weight:900;transform:rotate(45deg)}
      .discoverLocationMeta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}.discoverLocationMeta article{padding:10px;border:1px solid #e0e6dd;border-radius:12px;background:#f7f9f5}.discoverLocationMeta span,.discoverLocationMeta strong{display:block}.discoverLocationMeta span{color:#929b95;font-size:6px}.discoverLocationMeta strong{margin-top:4px;font-size:8px}
      .discoverProtection{display:flex;gap:9px;margin-top:9px;padding:12px;border:1px solid #d4e1ce;border-radius:13px;background:#eef7e8;color:#53733e}.discoverProtection.approximate{border-color:#ead9a4;background:#fff8df;color:#806a25}.discoverProtection.block{border-color:#efc3bd;background:#fff0ee;color:#98463c}.discoverProtection strong{display:block;font-size:8px}.discoverProtection p{margin:4px 0 0;font-size:7px;line-height:1.45;opacity:.75}
      .discoverDuplicates{margin-top:9px;padding:12px;border:1px solid #ead9a4;border-radius:13px;background:#fff9e7}.discoverDuplicates>div{display:flex;align-items:center;gap:7px;color:#806a25;font-size:8px;font-weight:850}.discoverDuplicates a{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:8px;margin-top:6px;padding:9px;border-radius:10px;background:rgba(255,255,255,.72)}.discoverDuplicates a strong{font-size:8px}.discoverDuplicates a small{color:#8c7a3c;font-size:7px}
      .discoverFields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.discoverFields label{display:grid;gap:6px}.discoverFields label.wide{grid-column:1/-1}.discoverFields label>span{color:#5e7164;font-size:7px;font-weight:850}.discoverFields input,.discoverFields textarea,.discoverFields select{width:100%;border:1px solid #d8e1d5;border-radius:11px;background:#f7f9f5;color:#31463a;outline:0;font-size:9px}.discoverFields input,.discoverFields select{min-height:43px;padding:0 11px}.discoverFields textarea{min-height:120px;padding:11px;line-height:1.6;resize:vertical}.discoverFields input:focus,.discoverFields textarea:focus,.discoverFields select:focus{border-color:#8ea982;background:#fff;box-shadow:0 0 0 3px rgba(119,155,85,.1)}
      .discoverReview{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.discoverReview article{padding:13px;border:1px solid #e0e6dd;border-radius:13px;background:#f7f9f5}.discoverReview span,.discoverReview strong{display:block}.discoverReview span{color:#929b95;font-size:6px;text-transform:uppercase}.discoverReview strong{margin-top:5px;color:#415549;font-size:9px}
      .discoverFinalNote{display:flex;gap:9px;margin-top:10px;padding:13px;border-radius:13px;background:#173b27;color:#baff9e}.discoverFinalNote strong{display:block;font-size:9px}.discoverFinalNote p{margin:4px 0 0;color:rgba(255,255,255,.49);font-size:7px;line-height:1.5}
      .discoverError{display:flex;align-items:center;gap:7px;margin-top:10px;padding:11px;border:1px solid #edc0ba;border-radius:11px;background:#fff0ee;color:#98463c;font-size:8px}
      .discoverStepCard>footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #e2e7e0}.discoverStepCard>footer>span{flex:1}.discoverStepCard>footer button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:43px;padding:0 14px;border:1px solid #173b27;border-radius:12px;background:#173b27;color:#fff;cursor:pointer;font-size:8px;font-weight:900}.discoverStepCard>footer button.secondary{border-color:#d6dfd2;background:#f7f9f5;color:#52665a}.discoverStepCard>footer button:disabled{cursor:not-allowed;opacity:.45}
      .discoverState{display:grid;place-items:center;align-content:center;gap:10px;background:#e8ece4;text-align:center}.discoverState h1{font-size:28px}.discoverState a{padding:11px 13px;border-radius:11px;background:#173b27;color:#fff;text-decoration:none;font-size:8px;font-weight:850}
      @media(max-width:700px){.discoverPage{padding:84px 0 55px}.discoverHero{min-height:560px;padding:20px;border-radius:0 0 30px 30px}.discoverHero>div{padding-top:95px}.discoverContent{padding:0 12px}.discoverSteps{grid-template-columns:1fr}.discoverStepCard{padding:17px}.discoverMapWrap{height:430px}}
      @media(max-width:480px){.discoverHero{min-height:590px;padding:17px}.discoverHero h1{font-size:50px}.discoverStepCard>header{align-items:flex-start;flex-direction:column}.discoverStepCard>header>button{width:100%;justify-content:center}.discoverLocationMeta,.discoverFields,.discoverReview{grid-template-columns:1fr}.discoverFields label.wide{grid-column:auto}.discoverMapWrap{height:390px}.discoverStepCard>footer{align-items:stretch;flex-direction:column}.discoverStepCard>footer>span{display:none}.discoverStepCard>footer button{width:100%}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    `}</style>
  );
}
