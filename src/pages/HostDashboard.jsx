import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
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
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.65 2.62a2 2 0 0 1-.45 2.11L8.03 9.73a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.84.31 1.72.53 2.62.65A2 2 0 0 1 22 16.92Z" />
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.1 3.4L16.5 7.5l-3.4 1.1L12 12l-1.1-3.4-3.4-1.1 3.4-1.1L12 3Z" />
        <path d="m18 13 .7 2.3L21 16l-2.3.7L18 19l-.7-2.3L15 16l2.3-.7L18 13Z" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 15-4-4-8 8" />
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
  if (!value) return "Bez termina";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function offerType(item) {
  const type = String(item?.offer_type || "").toLowerCase();

  if (type === "rental") return "rental";
  if (type === "service") return "service";

  return "service";
}

function ratingFromProfile(profile) {
  const candidates = [
    profile?.average_rating,
    profile?.rating_average,
    profile?.rating,
    profile?.avg_rating,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return value;
  }

  return 0;
}

function reviewCountFromProfile(profile) {
  const candidates = [
    profile?.reviews_count,
    profile?.rating_count,
    profile?.ratings_count,
    profile?.review_count,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value >= 0) return value;
  }

  return 0;
}

function DashboardLoading() {
  return (
    <>
      <DashboardStyles />
      <main className="hdState">
        <span className="hdLoader" />
        <strong>Učitavanje Host Dashboard-a...</strong>
        <p>Pripremamo tvoje ponude i profil.</p>
      </main>
    </>
  );
}

function UnauthorizedState() {
  return (
    <>
      <DashboardStyles />
      <main className="hdState">
        <span className="hdStateIcon">
          <Icon name="shield" size={26} />
        </span>
        <strong>Dashboard je namenjen hostovima.</strong>
        <p>Prijavi se na host nalog da upravljaš ponudama.</p>
        <Link to="/">Nazad na početnu</Link>
      </main>
    </>
  );
}

function MetricCard({ icon, label, value, detail, tone = "light" }) {
  return (
    <article className={`hdMetric ${tone}`}>
      <span className="hdMetricIcon">
        <Icon name={icon} size={19} />
      </span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function InventoryCard({
  image,
  eyebrow,
  title,
  meta,
  detailsUrl,
  editUrl,
  status,
}) {
  return (
    <article className="hdInventoryCard">
      <Link to={detailsUrl} className="hdInventoryImage">
        <img src={image || FALLBACK_IMAGE} alt={title || ""} />
        <span className={`hdStatus ${status ? "active" : "hidden"}`}>
          <span />
          {status ? "Aktivno" : "Sakriveno"}
        </span>
      </Link>

      <div className="hdInventoryBody">
        <small>{eyebrow}</small>
        <h3>{title || "Ponuda bez naziva"}</h3>

        <p>
          <Icon name="mapPin" size={13} />
          {meta || "Lokacija nije uneta"}
        </p>

        <div className="hdInventoryActions">
          <Link to={detailsUrl}>
            <Icon name="eye" size={15} />
            Pogledaj
          </Link>

          {editUrl && (
            <Link to={editUrl}>
              <Icon name="edit" size={15} />
              Uredi
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyInventory({
  icon,
  title,
  text,
  action,
  to,
}) {
  return (
    <div className="hdEmpty">
      <span>
        <Icon name={icon} size={24} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>

      {to && action && (
        <Link to={to}>
          <Icon name="plus" size={15} />
          {action}
        </Link>
      )}
    </div>
  );
}

export default function HostDashboard() {
  const { profile, isHost, loading } = useAuth();

  const [events, setEvents] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!profile?.id || !isHost) {
        setEvents([]);
        setAccommodations([]);
        setOffers([]);
        setDashboardLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setDashboardLoading(true);
      }

      setError("");

      try {
        const [
          eventsResult,
          accommodationsResult,
          offersResult,
        ] = await Promise.all([
          supabase
            .from("events")
            .select(
              "id, title, cover_url, location, country, start_date, created_at, is_active"
            )
            .eq("host_id", profile.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("host_accommodations")
            .select("*")
            .eq("host_id", profile.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("host_offers")
            .select("*")
            .eq("host_id", profile.id)
            .order("created_at", { ascending: false }),
        ]);

        if (eventsResult.error) throw eventsResult.error;

        setEvents(eventsResult.data || []);

        if (accommodationsResult.error) {
          console.warn(
            "Host accommodations dashboard:",
            accommodationsResult.error
          );
          setAccommodations([]);
        } else {
          setAccommodations(accommodationsResult.data || []);
        }

        if (offersResult.error) {
          console.warn(
            "Host offers dashboard:",
            offersResult.error
          );
          setOffers([]);
        } else {
          setOffers(offersResult.data || []);
        }
      } catch (loadError) {
        console.error("Host dashboard:", loadError);
        setError(
          loadError?.message ||
            "Dashboard trenutno nije moguće učitati."
        );
      } finally {
        setDashboardLoading(false);
        setRefreshing(false);
      }
    },
    [isHost, profile?.id]
  );

  useEffect(() => {
    if (!loading) {
      loadDashboard();
    }
  }, [loadDashboard, loading]);

  const services = useMemo(
    () => offers.filter((item) => offerType(item) === "service"),
    [offers]
  );

  const rentals = useMemo(
    () => offers.filter((item) => offerType(item) === "rental"),
    [offers]
  );

  const activeEvents = useMemo(
    () => events.filter((item) => item.is_active !== false),
    [events]
  );

  const activeAccommodations = useMemo(
    () =>
      accommodations.filter((item) => item.is_active !== false),
    [accommodations]
  );

  const activeServices = useMemo(
    () => services.filter((item) => item.is_active !== false),
    [services]
  );

  const activeRentals = useMemo(
    () => rentals.filter((item) => item.is_active !== false),
    [rentals]
  );

  const totalActive =
    activeEvents.length +
    activeAccommodations.length +
    activeServices.length +
    activeRentals.length;

  const rating = ratingFromProfile(profile);
  const reviewCount = reviewCountFromProfile(profile);

  const hasPublicLocation =
    Boolean(profile?.public_location) &&
    Number.isFinite(Number(profile?.latitude)) &&
    Number.isFinite(Number(profile?.longitude));

  const profileChecklist = [
    {
      label: "Profilna fotografija",
      done: Boolean(profile?.avatar_url),
    },
    {
      label: "Cover fotografija",
      done: Boolean(profile?.cover_url),
    },
    {
      label: "Opis hosta",
      done: Boolean(String(profile?.bio || "").trim()),
    },
    {
      label: "Javna lokacija na mapi",
      done: hasPublicLocation,
    },
    {
      label: "Kontakt telefon",
      done: Boolean(String(profile?.phone || "").trim()),
    },
    {
      label: "Najmanje jedna aktivna ponuda",
      done: totalActive > 0,
    },
  ];

  const completedProfileSteps =
    profileChecklist.filter((item) => item.done).length;

  const profilePercent = Math.round(
    (completedProfileSteps / profileChecklist.length) * 100
  );

  if (loading || dashboardLoading) {
    return <DashboardLoading />;
  }

  if (!profile?.id || !isHost) {
    return <UnauthorizedState />;
  }

  const displayName =
    profile.full_name ||
    profile.username ||
    "MeetOutdoors Host";

  return (
    <>
      <DashboardStyles />

      <main className="hdPage">
        <section className="hdHero">
          <div className="hdHeroCopy">
            <span className="hdKicker">
              <Icon name="sparkles" size={14} />
              HOST DASHBOARD
            </span>

            <h1>
              Dobrodošao,
              <br />
              {displayName}.
            </h1>

            <p>
              Upravljaj svojim outdoor ponudama, profilom i reputacijom
              sa jednog mesta.
            </p>

            <div className="hdHeroActions">
              <Link to="/create-event" className="primary">
                <Icon name="plus" size={17} />
                Kreiraj avanturu
              </Link>

              <Link
                to={`/h/${profile.username}`}
                className="secondary"
              >
                <Icon name="eye" size={17} />
                Javni profil
              </Link>
            </div>
          </div>

          <div className="hdHeroCard">
            <div className="hdHeroProfile">
              <img
                src={profile.avatar_url || FALLBACK_IMAGE}
                alt={displayName}
              />

              <div>
                <small>MEETOUTDOORS HOST</small>
                <strong>{displayName}</strong>
                <span>
                  {[profile.city, profile.country]
                    .filter(Boolean)
                    .join(", ") || "Lokacija nije uneta"}
                </span>
              </div>
            </div>

            <div className="hdProfileProgress">
              <div>
                <span>Spremnost profila</span>
                <strong>{profilePercent}%</strong>
              </div>

              <div className="hdProgressTrack">
                <span
                  style={{
                    width: `${profilePercent}%`,
                  }}
                />
              </div>
            </div>

            <div className="hdHeroCardActions">
              <Link to="/edit-profile">
                <Icon name="edit" size={15} />
                Uredi profil
              </Link>

              <button
                type="button"
                onClick={() => loadDashboard({ silent: true })}
                disabled={refreshing}
              >
                <Icon name="refresh" size={15} />
                {refreshing ? "Osvežavanje..." : "Osveži"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="hdError">
            <Icon name="alert" size={17} />
            <span>{error}</span>
          </div>
        )}

        <section className="hdMetrics">
          <MetricCard
            icon="package"
            label="Aktivne ponude"
            value={totalActive}
            detail="Sve javno dostupne ponude"
            tone="dark"
          />

          <MetricCard
            icon="calendar"
            label="Avanture"
            value={activeEvents.length}
            detail="Aktivne outdoor ponude"
          />

          <MetricCard
            icon="home"
            label="Smeštaj"
            value={activeAccommodations.length}
            detail="Objavljeni smeštaji"
          />

          <MetricCard
            icon="briefcase"
            label="Usluge + rental"
            value={activeServices.length + activeRentals.length}
            detail={`${activeServices.length} usluga · ${activeRentals.length} iznajmljivanja`}
          />

          <MetricCard
            icon="star"
            label="Reputacija"
            value={rating > 0 ? rating.toFixed(1) : "—"}
            detail={
              reviewCount > 0
                ? `${reviewCount} ${
                    reviewCount === 1 ? "review" : "reviews"
                  }`
                : "Još nema ocena"
            }
            tone="warm"
          />
        </section>

        <section className="hdMainGrid">
          <div className="hdMainColumn">
            <section className="hdSection">
              <div className="hdSectionHead">
                <div>
                  <span className="hdKicker">PONUDE</span>
                  <h2>Tvoj katalog.</h2>
                  <p>
                    Samo ono što korisnici trenutno mogu da pronađu i
                    kontaktiraju.
                  </p>
                </div>

                <Link to="/create-event">
                  <Icon name="plus" size={15} />
                  Nova avantura
                </Link>
              </div>

              <div className="hdInventoryGroup">
                <div className="hdInventoryTitle">
                  <div>
                    <span className="hdInventoryTypeIcon">
                      <Icon name="calendar" size={17} />
                    </span>
                    <div>
                      <small>AVANTURE</small>
                      <strong>{events.length} ukupno</strong>
                    </div>
                  </div>
                </div>

                {events.length === 0 ? (
                  <EmptyInventory
                    icon="calendar"
                    title="Još nema avantura."
                    text="Kreiraj prvu outdoor ponudu i pojavi se u Explore katalogu."
                    action="Kreiraj avanturu"
                    to="/create-event"
                  />
                ) : (
                  <div className="hdInventoryGrid">
                    {events.slice(0, 6).map((event) => (
                      <InventoryCard
                        key={event.id}
                        image={event.cover_url}
                        eyebrow="Avantura"
                        title={event.title}
                        meta={
                          [
                            event.location,
                            event.country,
                            event.start_date
                              ? formatDate(event.start_date)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        }
                        detailsUrl={`/event/${event.id}`}
                        editUrl={`/event/${event.id}/edit`}
                        status={event.is_active !== false}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="hdInventoryGroup">
                <div className="hdInventoryTitle">
                  <div>
                    <span className="hdInventoryTypeIcon">
                      <Icon name="home" size={17} />
                    </span>
                    <div>
                      <small>SMEŠTAJ</small>
                      <strong>
                        {accommodations.length} ukupno
                      </strong>
                    </div>
                  </div>
                </div>

                {accommodations.length === 0 ? (
                  <EmptyInventory
                    icon="home"
                    title="Nema dodatog smeštaja."
                    text="Smeštajem trenutno upravljaš sa svog host profila."
                    action="Otvori host profil"
                    to={`/h/${profile.username}`}
                  />
                ) : (
                  <div className="hdInventoryGrid">
                    {accommodations.slice(0, 6).map((item) => (
                      <InventoryCard
                        key={item.id}
                        image={item.cover_url}
                        eyebrow="Smeštaj"
                        title={item.title}
                        meta={
                          [
                            item.location,
                            item.city,
                            item.country,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        }
                        detailsUrl={`/accommodation/${item.id}`}
                        status={item.is_active !== false}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="hdOfferColumns">
                <section className="hdCompactOfferSection">
                  <div className="hdInventoryTitle">
                    <div>
                      <span className="hdInventoryTypeIcon">
                        <Icon name="briefcase" size={17} />
                      </span>
                      <div>
                        <small>USLUGE</small>
                        <strong>{services.length} ukupno</strong>
                      </div>
                    </div>
                  </div>

                  {services.length === 0 ? (
                    <EmptyInventory
                      icon="briefcase"
                      title="Nema usluga."
                      text="Dodaj vodiča, prevoz, instruktora ili drugu outdoor uslugu sa host profila."
                      action="Upravljaj ponudama"
                      to={`/h/${profile.username}`}
                    />
                  ) : (
                    <div className="hdMiniList">
                      {services.slice(0, 5).map((item) => (
                        <Link
                          key={item.id}
                          to={`/service/${item.id}`}
                        >
                          <img
                            src={
                              item.cover_url ||
                              item.image_url ||
                              FALLBACK_IMAGE
                            }
                            alt=""
                          />

                          <div>
                            <small>USLUGA</small>
                            <strong>
                              {item.title || "Usluga"}
                            </strong>
                            <span>
                              {item.location ||
                                item.category ||
                                "Outdoor usluga"}
                            </span>
                          </div>

                          <Icon
                            name="arrowRight"
                            size={15}
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section className="hdCompactOfferSection">
                  <div className="hdInventoryTitle">
                    <div>
                      <span className="hdInventoryTypeIcon">
                        <Icon name="package" size={17} />
                      </span>
                      <div>
                        <small>IZNAJMLJIVANJE</small>
                        <strong>{rentals.length} ukupno</strong>
                      </div>
                    </div>
                  </div>

                  {rentals.length === 0 ? (
                    <EmptyInventory
                      icon="package"
                      title="Nema rental ponuda."
                      text="Dodaj opremu, bicikle, kajake ili drugo iznajmljivanje sa host profila."
                      action="Upravljaj ponudama"
                      to={`/h/${profile.username}`}
                    />
                  ) : (
                    <div className="hdMiniList">
                      {rentals.slice(0, 5).map((item) => (
                        <Link
                          key={item.id}
                          to={`/rental/${item.id}`}
                        >
                          <img
                            src={
                              item.cover_url ||
                              item.image_url ||
                              FALLBACK_IMAGE
                            }
                            alt=""
                          />

                          <div>
                            <small>RENTAL</small>
                            <strong>
                              {item.title ||
                                "Iznajmljivanje"}
                            </strong>
                            <span>
                              {item.location ||
                                item.category ||
                                "Outdoor rental"}
                            </span>
                          </div>

                          <Icon
                            name="arrowRight"
                            size={15}
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </section>
          </div>

          <aside className="hdSideColumn">
            <section className="hdSideCard">
              <div className="hdSideHead">
                <span>
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <small>HOST PROFIL</small>
                  <h3>Spremnost profila</h3>
                </div>
              </div>

              <div className="hdChecklist">
                {profileChecklist.map((item) => (
                  <div
                    key={item.label}
                    className={item.done ? "done" : ""}
                  >
                    <span>
                      <Icon
                        name={item.done ? "check" : "alert"}
                        size={13}
                      />
                    </span>
                    <strong>{item.label}</strong>
                  </div>
                ))}
              </div>

              <Link
                to="/edit-profile"
                className="hdSideAction"
              >
                Uredi profil
                <Icon name="arrowRight" size={15} />
              </Link>
            </section>

            <section className="hdSideCard hdMapCard">
              <span className="hdSideVisual">
                <Icon name="mapPin" size={23} />
              </span>

              <small>EXPLORE MAPA</small>
              <h3>
                {hasPublicLocation
                  ? "Tvoj host je na mapi."
                  : "Dodaj javnu lokaciju."}
              </h3>

              <p>
                {hasPublicLocation
                  ? profile.public_location
                  : "Host bez javne lokacije neće imati marker na Explore mapi."}
              </p>

              <Link
                to={hasPublicLocation ? "/explore" : "/edit-profile"}
                className="hdSideAction"
              >
                {hasPublicLocation
                  ? "Pogledaj mapu"
                  : "Dodaj lokaciju"}
                <Icon name="arrowRight" size={15} />
              </Link>
            </section>

            <section className="hdSideCard hdContactCard">
              <span className="hdSideVisual">
                <Icon name="phone" size={23} />
              </span>

              <small>DIREKTAN KONTAKT</small>
              <h3>Korisnik kontaktira tebe.</h3>
              <p>
                MeetOutdoors trenutno ne vodi booking ni razgovore.
                Proveri da su telefon, Instagram i sajt ažurni.
              </p>

              <Link
                to="/edit-profile"
                className="hdSideAction"
              >
                Proveri kontakte
                <Icon name="arrowRight" size={15} />
              </Link>
            </section>

            <section className="hdSideCard hdNotificationCard">
              <div className="hdSideHead">
                <span>
                  <Icon name="bell" size={18} />
                </span>
                <div>
                  <small>NOTIFICATIONS</small>
                  <h3>Obaveštenja ostaju.</h3>
                </div>
              </div>

              <p>
                Reviews, važna sistemska obaveštenja i budući korisni
                signali ostaju deo MeetOutdoors-a. Booking i chat
                obaveštenja više nisu deo novog toka.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      body{margin:0;background:#edf1ea}
      .hdPage,.hdState{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#203329}
      .hdPage{min-height:100vh;padding:116px 24px 72px;background:radial-gradient(circle at 7% 0%,rgba(198,239,158,.24),transparent 24%),radial-gradient(circle at 92% 15%,rgba(67,107,77,.11),transparent 21%),#edf1ea}
      .hdPage a{text-decoration:none;color:inherit}
      .hdHero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr);gap:18px;width:min(1260px,100%);margin:0 auto;padding:34px;border-radius:32px;background:linear-gradient(135deg,#173d29,#244f37 58%,#315c42);color:#fff;box-shadow:0 35px 85px rgba(24,57,37,.2);overflow:hidden;position:relative}
      .hdHero:after{content:"";position:absolute;width:420px;height:420px;right:-160px;top:-190px;border-radius:50%;background:radial-gradient(circle,rgba(206,255,157,.22),transparent 68%);pointer-events:none}
      .hdHeroCopy{position:relative;z-index:2;max-width:720px;padding:18px 8px}
      .hdKicker{display:inline-flex;align-items:center;gap:7px;color:#bfe79a;font-size:7px;font-weight:950;letter-spacing:.13em}
      .hdHero h1{max-width:800px;margin:18px 0 0;font-size:clamp(48px,6vw,76px);line-height:.9;letter-spacing:-.065em}
      .hdHeroCopy>p{max-width:610px;margin:20px 0 0;color:rgba(255,255,255,.62);font-size:11px;line-height:1.65}
      .hdHeroActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}
      .hdHeroActions a{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 15px;border-radius:14px;font-size:8px;font-weight:900}
      .hdHeroActions .primary{background:#c9f28c;color:#173d29}
      .hdHeroActions .secondary{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff}
      .hdHeroCard{position:relative;z-index:2;align-self:stretch;padding:17px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:rgba(7,30,18,.28);backdrop-filter:blur(18px)}
      .hdHeroProfile{display:grid;grid-template-columns:54px minmax(0,1fr);gap:12px;align-items:center}
      .hdHeroProfile img{width:54px;height:54px;object-fit:cover;border:2px solid rgba(255,255,255,.15);border-radius:17px}
      .hdHeroProfile small,.hdHeroProfile strong,.hdHeroProfile span{display:block}
      .hdHeroProfile small{color:#bfe79a;font-size:5.5px;font-weight:950;letter-spacing:.1em}
      .hdHeroProfile strong{margin-top:4px;color:#fff;font-size:14px}
      .hdHeroProfile span{margin-top:3px;color:rgba(255,255,255,.48);font-size:7px}
      .hdProfileProgress{margin-top:22px}
      .hdProfileProgress>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:12px;color:rgba(255,255,255,.66);font-size:7px}
      .hdProfileProgress strong{color:#fff;font-size:11px}
      .hdProgressTrack{height:7px;margin-top:9px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
      .hdProgressTrack span{display:block;height:100%;border-radius:inherit;background:#c9f28c}
      .hdHeroCardActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:18px}
      .hdHeroCardActions a,.hdHeroCardActions button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:40px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:7px;font-weight:850;cursor:pointer}
      .hdHeroCardActions button:disabled{opacity:.55;cursor:default}
      .hdError{display:flex;align-items:center;gap:9px;width:min(1260px,100%);margin:12px auto 0;padding:12px 14px;border:1px solid #ead4cf;border-radius:15px;background:#fff5f2;color:#8d4438;font-size:8px;font-weight:800}
      .hdMetrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;width:min(1260px,100%);margin:14px auto 0}
      .hdMetric{display:grid;grid-template-columns:43px minmax(0,1fr);gap:11px;align-items:start;padding:15px;border:1px solid #dde5db;border-radius:18px;background:rgba(255,255,255,.86);box-shadow:0 10px 30px rgba(29,49,36,.045)}
      .hdMetricIcon{display:grid;place-items:center;width:43px;height:43px;border-radius:13px;background:#edf3e8;color:#567447}
      .hdMetric small,.hdMetric strong,.hdMetric p{display:block}
      .hdMetric small{color:#8b978f;font-size:6px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}
      .hdMetric strong{margin-top:5px;color:#273d30;font-size:23px;line-height:1}
      .hdMetric p{margin:5px 0 0;color:#939d96;font-size:7px;line-height:1.4}
      .hdMetric.dark{border-color:#173d29;background:#173d29;color:#fff}
      .hdMetric.dark .hdMetricIcon{background:rgba(255,255,255,.09);color:#c9f28c}
      .hdMetric.dark small,.hdMetric.dark p{color:rgba(255,255,255,.47)}
      .hdMetric.dark strong{color:#fff}
      .hdMetric.warm .hdMetricIcon{background:#fff6db;color:#b18628}
      .hdMainGrid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px;width:min(1260px,100%);margin:14px auto 0}
      .hdMainColumn,.hdSideColumn{min-width:0}
      .hdSection{padding:20px;border:1px solid #dce4da;border-radius:24px;background:rgba(255,255,255,.78);box-shadow:0 14px 42px rgba(28,48,34,.05)}
      .hdSectionHead{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding-bottom:16px;border-bottom:1px solid #e5ebe3}
      .hdSectionHead h2{margin:6px 0 0;color:#23372b;font-size:29px;line-height:1;letter-spacing:-.05em}
      .hdSectionHead p{max-width:650px;margin:7px 0 0;color:#859189;font-size:8px;line-height:1.5}
      .hdSectionHead>a{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;min-height:39px;padding:0 12px;border-radius:12px;background:#173d29;color:#fff;font-size:7px;font-weight:900}
      .hdInventoryGroup{margin-top:18px}
      .hdInventoryTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
      .hdInventoryTitle>div{display:flex;align-items:center;gap:9px}
      .hdInventoryTypeIcon{display:grid;place-items:center;width:37px;height:37px;border-radius:11px;background:#edf3e8;color:#59764a}
      .hdInventoryTitle small,.hdInventoryTitle strong{display:block}
      .hdInventoryTitle small{color:#8b978f;font-size:5.5px;font-weight:950;letter-spacing:.09em}
      .hdInventoryTitle strong{margin-top:3px;color:#33483a;font-size:9px}
      .hdInventoryGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .hdInventoryCard{overflow:hidden;border:1px solid #dfe6dd;border-radius:17px;background:#fff}
      .hdInventoryImage{position:relative;display:block;height:142px;overflow:hidden;background:#dfe7dc}
      .hdInventoryImage img{width:100%;height:100%;object-fit:cover;transition:.3s}
      .hdInventoryCard:hover .hdInventoryImage img{transform:scale(1.025)}
      .hdStatus{position:absolute;top:9px;left:9px;display:inline-flex;align-items:center;gap:5px;min-height:25px;padding:0 8px;border-radius:999px;background:rgba(12,37,22,.74);color:#fff;font-size:6px;font-weight:900;backdrop-filter:blur(12px)}
      .hdStatus>span{width:5px;height:5px;border-radius:50%;background:#bff28f}
      .hdStatus.hidden>span{background:#f2cc8f}
      .hdInventoryBody{padding:12px}
      .hdInventoryBody>small{color:#789456;font-size:5.5px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}
      .hdInventoryBody h3{overflow:hidden;margin:5px 0 0;color:#293e31;font-size:13px;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}
      .hdInventoryBody>p{display:flex;align-items:center;gap:5px;overflow:hidden;margin:7px 0 0;color:#8b968f;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
      .hdInventoryActions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px;padding-top:10px;border-top:1px solid #eef1ed}
      .hdInventoryActions a{display:flex;align-items:center;justify-content:center;gap:5px;min-height:34px;border-radius:10px;background:#f2f5f1;color:#56685c;font-size:7px;font-weight:850}
      .hdEmpty{display:grid;grid-template-columns:43px minmax(0,1fr) auto;align-items:center;gap:11px;padding:13px;border:1px dashed #d3ded1;border-radius:16px;background:#f8faf7}
      .hdEmpty>span{display:grid;place-items:center;width:43px;height:43px;border-radius:13px;background:#edf3e8;color:#617a50}
      .hdEmpty strong{display:block;color:#33473a;font-size:9px}
      .hdEmpty p{margin:4px 0 0;color:#89948c;font-size:7px;line-height:1.45}
      .hdEmpty>a{display:inline-flex;align-items:center;gap:6px;min-height:35px;padding:0 10px;border-radius:10px;background:#173d29;color:#fff;font-size:7px;font-weight:850}
      .hdOfferColumns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
      .hdCompactOfferSection{min-width:0;padding:14px;border:1px solid #e0e6de;border-radius:18px;background:#fafbf9}
      .hdMiniList{display:grid;gap:6px}
      .hdMiniList>a{display:grid;grid-template-columns:47px minmax(0,1fr) 28px;align-items:center;gap:9px;padding:7px;border:1px solid #e4e9e2;border-radius:12px;background:#fff;transition:.18s}
      .hdMiniList>a:hover{transform:translateY(-1px);border-color:#c9d6c5}
      .hdMiniList img{width:47px;height:47px;object-fit:cover;border-radius:10px}
      .hdMiniList small,.hdMiniList strong,.hdMiniList span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .hdMiniList small{color:#7e955e;font-size:5px;font-weight:950;letter-spacing:.07em}
      .hdMiniList strong{margin-top:3px;color:#32473a;font-size:8px}
      .hdMiniList span{margin-top:3px;color:#949d97;font-size:6.5px}
      .hdMiniList>a>svg{color:#829086}
      .hdSideColumn{display:grid;align-content:start;gap:10px}
      .hdSideCard{padding:15px;border:1px solid #dde5dc;border-radius:19px;background:rgba(255,255,255,.84);box-shadow:0 10px 30px rgba(29,49,36,.04)}
      .hdSideHead{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:9px}
      .hdSideHead>span,.hdSideVisual{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#edf3e8;color:#59764a}
      .hdSideHead small,.hdSideCard>small{color:#839370;font-size:5.5px;font-weight:950;letter-spacing:.09em}
      .hdSideHead h3{margin:3px 0 0;color:#2f4436;font-size:12px}
      .hdChecklist{display:grid;gap:6px;margin-top:13px}
      .hdChecklist>div{display:grid;grid-template-columns:25px minmax(0,1fr);align-items:center;gap:7px;padding:7px;border-radius:10px;background:#f6f8f5;color:#7a857e}
      .hdChecklist>div>span{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:#ecefeb;color:#9b7a4b}
      .hdChecklist>div.done{color:#405448}
      .hdChecklist>div.done>span{background:#e7f3e4;color:#52803d}
      .hdChecklist strong{font-size:7px}
      .hdSideAction{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:38px;margin-top:12px;padding:0 11px;border-radius:11px;background:#173d29;color:#fff!important;font-size:7px;font-weight:900}
      .hdMapCard,.hdContactCard{background:linear-gradient(145deg,#fff,#f7faf5)}
      .hdSideCard>h3{margin:10px 0 0;color:#2d4335;font-size:16px;line-height:1.1;letter-spacing:-.03em}
      .hdSideCard>p{margin:7px 0 0;color:#829087;font-size:7.5px;line-height:1.55}
      .hdNotificationCard{border-color:#dbe6cc;background:#f8fbf2}
      .hdState{display:grid;place-items:center;align-content:center;min-height:100vh;padding:24px;text-align:center;background:#edf1ea}
      .hdLoader{width:36px;height:36px;border:3px solid #d9e3d6;border-top-color:#315b40;border-radius:50%;animation:hdSpin .8s linear infinite}
      .hdStateIcon{display:grid;place-items:center;width:52px;height:52px;border-radius:17px;background:#173d29;color:#c9f28c}
      .hdState strong{margin-top:14px;color:#263c2f;font-size:18px}
      .hdState p{max-width:420px;margin:7px 0 0;color:#869188;font-size:9px}
      .hdState a{margin-top:14px;padding:10px 13px;border-radius:11px;background:#173d29;color:#fff;text-decoration:none;font-size:8px;font-weight:850}
      @keyframes hdSpin{to{transform:rotate(360deg)}}
      @media(max-width:1080px){
        .hdHero{grid-template-columns:1fr}
        .hdHeroCard{max-width:560px}
        .hdMetrics{grid-template-columns:repeat(3,minmax(0,1fr))}
        .hdMainGrid{grid-template-columns:1fr}
        .hdSideColumn{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:760px){
        .hdPage{padding:92px 10px 42px}
        .hdHero{padding:18px;border-radius:22px}
        .hdHeroCopy{padding:5px 1px}
        .hdHero h1{font-size:42px}
        .hdHeroCopy>p{font-size:9px}
        .hdMetrics{grid-template-columns:1fr 1fr;gap:7px}
        .hdMetric{grid-template-columns:37px minmax(0,1fr);gap:8px;padding:11px;border-radius:15px}
        .hdMetricIcon{width:37px;height:37px;border-radius:11px}
        .hdMetric strong{font-size:19px}
        .hdSection{padding:12px;border-radius:19px}
        .hdSectionHead{align-items:flex-start;flex-direction:column}
        .hdInventoryGrid{grid-template-columns:1fr 1fr}
        .hdOfferColumns{grid-template-columns:1fr}
        .hdSideColumn{grid-template-columns:1fr}
        .hdEmpty{grid-template-columns:38px minmax(0,1fr)}
        .hdEmpty>span{width:38px;height:38px}
        .hdEmpty>a{grid-column:1 / -1;justify-content:center}
      }
      @media(max-width:480px){
        .hdHeroActions{display:grid;grid-template-columns:1fr 1fr}
        .hdHeroActions a{justify-content:center;padding:0 8px}
        .hdHeroCardActions{grid-template-columns:1fr}
        .hdMetrics{grid-template-columns:1fr 1fr}
        .hdMetric:last-child{grid-column:1 / -1}
        .hdInventoryGrid{grid-template-columns:1fr}
        .hdInventoryImage{height:165px}
      }
    `}</style>
  );
}
