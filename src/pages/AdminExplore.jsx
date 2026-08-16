import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  Navigate,
} from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&auto=format&fit=crop";
const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=Explorer";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    navigation: <path d="m3 11 18-8-8 18-2-8-8-2Z" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    flag: (
      <>
        <path d="M5 21V4" />
        <path d="M5 5h11l-2 4 2 4H5" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7h-5V2" />
        <path d="M20 7a8 8 0 0 0-13.5-2M4 17h5v5" />
        <path d="M4 17a8 8 0 0 0 13.5 2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    wifiOff: (
      <>
        <path d="M3 3l18 18" />
        <path d="M8.5 8.5A7.8 7.8 0 0 1 12 7c3.2 0 6 1.7 7.5 4.2" />
        <path d="M5 11.5A11 11 0 0 1 7 9.7" />
        <path d="M10.3 14.3A2.8 2.8 0 0 1 12 13.8c1.4 0 2.6.8 3.2 1.9" />
        <path d="M12 19h.01" />
      </>
    ),
    activity: (
      <>
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </>
    ),
    log: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    menu: (
      <>
        <path d="M5 8h14" />
        <path d="M5 16h14" />
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
  if (!value) return "—";

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDelay(seconds) {
  const value = Number(seconds || 0);

  if (!value) return "0 min";

  if (value < 3600) {
    return `${Math.max(1, Math.round(value / 60))} min`;
  }

  if (value < 86400) {
    return `${(value / 3600).toFixed(value < 10800 ? 1 : 0)} h`;
  }

  return `${(value / 86400).toFixed(1)} dana`;
}

function moderationLabel(status) {
  const labels = {
    pending: "Čeka pregled",
    approved: "Odobreno",
    rejected: "Odbijeno",
    flagged: "Flagovano",
    review: "Potreban pregled",
  };

  return labels[status] || status || "—";
}

function UserBadge({ user }) {
  const url =
    user?.role === "host"
      ? `/h/${user.username}`
      : `/u/${user?.username}`;

  return (
    <Link
      to={url}
      className="adminUserBadge"
    >
      <img
        src={user?.avatar_url || FALLBACK_AVATAR}
        alt=""
      />

      <div>
        <strong>
          {user?.full_name ||
            user?.username ||
            "Nepoznat korisnik"}
        </strong>
        <span>
          @{user?.username || "unknown"}
        </span>
      </div>
    </Link>
  );
}

function ReasonModal({
  open,
  title,
  description,
  actionLabel,
  destructive = false,
  onClose,
  onConfirm,
  busy,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="adminModal">
      <button
        type="button"
        className="adminModalBackdrop"
        onClick={onClose}
        aria-label="Zatvori"
      />

      <section>
        <header>
          <div>
            <span>
              {destructive ? "KRITIČNA AKCIJA" : "ADMIN AKCIJA"}
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <label>
          <span>Razlog</span>

          <textarea
            autoFocus
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Napiši jasan razlog. Ostaće zabeležen u audit logu."
          />
        </label>

        <footer>
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Otkaži
          </button>

          <button
            type="button"
            className={destructive ? "danger" : "primary"}
            disabled={busy || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy ? "Čuvamo..." : actionLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function AdminExplore() {
  const { profile, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [places, setPlaces] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [reasonModal, setReasonModal] = useState({
    open: false,
    type: null,
    entity: null,
  });

  const loadPlaces = useCallback(async () => {
    const { data, error: placesError } = await supabase
      .from("places")
      .select(`
        id,
        name,
        short_description,
        region,
        locality,
        latitude,
        longitude,
        cover_url,
        moderation_status,
        is_active,
        is_sensitive,
        created_at,
        updated_at,
        created_by,
        visitors_count,
        checkins_count,
        photos_count,
        saves_count,
        location_precision,
        place_categories:category_id (
          id,
          name
        ),
        creator:created_by (
          id,
          username,
          full_name,
          avatar_url,
          role
        )
      `)
      .in("moderation_status", [
        "pending",
        "flagged",
        "rejected",
        "approved",
      ])
      .order("created_at", {
        ascending: false,
      })
      .limit(300);

    if (placesError) throw placesError;

    setPlaces(data || []);
  }, []);

  const loadCheckins = useCallback(async () => {
    const { data, error: checkinsError } = await supabase
      .from("place_checkins")
      .select(`
        id,
        place_id,
        user_id,
        visited_at,
        created_at,
        checkin_source,
        review_status,
        review_reason,
        is_gps_verified,
        verification_method,
        visibility,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          role
        ),
        places:place_id (
          id,
          name,
          locality,
          region,
          cover_url,
          location_precision
        ),
        place_checkin_verifications (
          id,
          accuracy_m,
          distance_from_place_m,
          allowed_radius_m,
          device_timestamp,
          submitted_at,
          is_offline,
          offline_delay_seconds,
          review_status,
          review_reason
        )
      `)
      .in("review_status", [
        "review",
        "rejected",
        "approved",
      ])
      .order("created_at", {
        ascending: false,
      })
      .limit(300);

    if (checkinsError) throw checkinsError;

    setCheckins(data || []);
  }, []);

  const loadLogs = useCallback(async () => {
    const { data, error: logsError } = await supabase
      .from("explore_admin_log")
      .select(`
        id,
        admin_id,
        action,
        entity_type,
        entity_id,
        reason,
        metadata,
        created_at,
        admin:admin_id (
          id,
          username,
          full_name,
          avatar_url,
          role
        )
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(200);

    if (logsError) throw logsError;

    setLogs(data || []);
  }, []);

  const loadReports = useCallback(async () => {
    const { data, error: reportsError } = await supabase
      .from("place_reports")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(200);

    if (!reportsError) {
      setReports(data || []);
    }
  }, []);

  const loadAll = useCallback(async () => {
    if (profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadPlaces(),
        loadCheckins(),
        loadLogs(),
        loadReports(),
      ]);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError?.message ||
          "Admin podaci trenutno nisu dostupni."
      );
    } finally {
      setLoading(false);
    }
  }, [
    loadCheckins,
    loadLogs,
    loadPlaces,
    loadReports,
    profile?.role,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (profile?.role !== "admin") return;

    const channel = supabase
      .channel("admin-explore-live")
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
        loadCheckins
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "explore_admin_log",
        },
        loadLogs
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    loadCheckins,
    loadLogs,
    loadPlaces,
    profile?.role,
  ]);

  const stats = useMemo(() => {
    const pendingPlaces = places.filter(
      (place) =>
        place.moderation_status === "pending"
    ).length;

    const flaggedPlaces = places.filter(
      (place) =>
        place.moderation_status === "flagged"
    ).length;

    const reviewCheckins = checkins.filter(
      (checkin) =>
        checkin.review_status === "review"
    ).length;

    const offlineReview = checkins.filter(
      (checkin) =>
        checkin.review_status === "review" &&
        checkin.checkin_source === "offline"
    ).length;

    return {
      pendingPlaces,
      flaggedPlaces,
      reviewCheckins,
      offlineReview,
      reports: reports.length,
    };
  }, [checkins, places, reports.length]);

  const filteredPlaces = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return places.filter((place) => {
      if (!needle) return true;

      return [
        place.name,
        place.locality,
        place.region,
        place.creator?.username,
        place.creator?.full_name,
        place.place_categories?.name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        );
    });
  }, [places, query]);

  const filteredCheckins = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return checkins.filter((checkin) => {
      if (!needle) return true;

      return [
        checkin.places?.name,
        checkin.places?.locality,
        checkin.places?.region,
        checkin.profiles?.username,
        checkin.profiles?.full_name,
        checkin.review_reason,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        );
    });
  }, [checkins, query]);

  const pendingPlaces = filteredPlaces.filter(
    (place) =>
      place.moderation_status === "pending"
  );

  const flaggedPlaces = filteredPlaces.filter(
    (place) =>
      place.moderation_status === "flagged"
  );

  const reviewCheckins = filteredCheckins.filter(
    (checkin) =>
      checkin.review_status === "review"
  );

  async function runAction({
    id,
    rpc,
    params,
    successMessage,
  }) {
    setWorkingId(id);
    setError("");
    setNotice("");

    try {
      const { error: actionError } =
        await supabase.rpc(rpc, params);

      if (actionError) throw actionError;

      setNotice(successMessage);

      await Promise.all([
        loadPlaces(),
        loadCheckins(),
        loadLogs(),
      ]);
    } catch (actionError) {
      setError(
        actionError?.message ||
          "Admin akcija nije uspela."
      );
    } finally {
      setWorkingId(null);
    }
  }

  function openReason(type, entity) {
    setReasonModal({
      open: true,
      type,
      entity,
    });
  }

  async function confirmReason(reason) {
    const { type, entity } = reasonModal;

    if (!entity) return;

    if (type === "reject-place") {
      await runAction({
        id: entity.id,
        rpc: "admin_reject_place",
        params: {
          p_place_id: entity.id,
          p_reason: reason,
        },
        successMessage:
          "Lokacija je odbijena i uklonjena sa javne mape.",
      });
    }

    if (type === "flag-place") {
      await runAction({
        id: entity.id,
        rpc: "admin_flag_place",
        params: {
          p_place_id: entity.id,
          p_reason: reason,
        },
        successMessage:
          "Lokacija je označena za dodatni pregled.",
      });
    }

    if (type === "remove-checkin") {
      await runAction({
        id: entity.id,
        rpc: "admin_remove_checkin",
        params: {
          p_checkin_id: entity.id,
          p_reason: reason,
        },
        successMessage:
          "Check-in je uklonjen iz validnih poseta, a razlog je zabeležen.",
      });
    }

    setReasonModal({
      open: false,
      type: null,
      entity: null,
    });
  }

  if (authLoading) return null;

  if (profile?.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (loading) {
    return (
      <>
        <AdminStyles />

        <main className="adminLoading">
          <span />
          <strong>
            Učitavamo Explore kontrolni centar...
          </strong>
        </main>
      </>
    );
  }

  const tabs = [
    {
      id: "overview",
      label: "Pregled",
      icon: "activity",
    },
    {
      id: "places",
      label: "Novi pinovi",
      icon: "pin",
      count: stats.pendingPlaces,
    },
    {
      id: "flagged",
      label: "Flagovane lokacije",
      icon: "flag",
      count: stats.flaggedPlaces,
    },
    {
      id: "checkins",
      label: "Check-in review",
      icon: "navigation",
      count: stats.reviewCheckins,
    },
    {
      id: "log",
      label: "Admin log",
      icon: "log",
    },
  ];

  return (
    <>
      <AdminStyles />

      <main className="adminExplore">
        <header className="adminHero">
          <div className="adminHeroNoise" />

          <div className="adminHeroTop">
            <div className="adminBrand">
              <span>
                <Icon
                  name="shield"
                  size={22}
                />
              </span>

              <div>
                <small>
                  MEETOUTDOORS
                </small>
                <strong>
                  Explore Control
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="adminRefresh"
              onClick={loadAll}
            >
              <Icon
                name="refresh"
                size={16}
              />
              Osveži podatke
            </button>
          </div>

          <div className="adminHeroCopy">
            <span className="adminEyebrow">
              <i />
              LIVE MODERATION SYSTEM
            </span>

            <h1>
              Sve vidiš.
              <br />
              Ništa ne prolazi neprimećeno.
            </h1>

            <p>
              Novi pinovi, sumnjivi GPS check-inovi,
              offline anomalije i svaka administratorska
              odluka — na jednom mestu.
            </p>
          </div>

          <div className="adminHeroStats">
            <article>
              <span>
                Novi pinovi
              </span>
              <strong>
                {stats.pendingPlaces}
              </strong>
              <small>
                čeka odobrenje
              </small>
            </article>

            <article>
              <span>
                Check-in review
              </span>
              <strong>
                {stats.reviewCheckins}
              </strong>
              <small>
                treba proveriti
              </small>
            </article>

            <article>
              <span>
                Offline review
              </span>
              <strong>
                {stats.offlineReview}
              </strong>
              <small>
                kasna sinhronizacija
              </small>
            </article>

            <article>
              <span>
                Flagovane lokacije
              </span>
              <strong>
                {stats.flaggedPlaces}
              </strong>
              <small>
                dodatna provera
              </small>
            </article>
          </div>
        </header>

        <section className="adminWorkspace">
          <aside className="adminSidebar">
            <div className="adminSidebarTitle">
              <span>
                CONTROL CENTER
              </span>
              <strong>
                Moderacija
              </strong>
            </div>

            <nav>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={
                    activeTab === tab.id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                >
                  <span>
                    <Icon
                      name={tab.icon}
                      size={17}
                    />
                  </span>

                  <strong>
                    {tab.label}
                  </strong>

                  {typeof tab.count ===
                    "number" && (
                    <b>{tab.count}</b>
                  )}
                </button>
              ))}
            </nav>

            <div className="adminSidebarHealth">
              <div>
                <span />
                LIVE
              </div>

              <strong>
                Realtime moderacija aktivna
              </strong>

              <small>
                Promene iz Supabase baze se automatski
                osvežavaju u panelu.
              </small>
            </div>
          </aside>

          <section className="adminMain">
            <header className="adminMainHeader">
              <div>
                <span>
                  {activeTab === "overview"
                    ? "OPERATIVNI PREGLED"
                    : activeTab === "places"
                      ? "NOVI PINOVI"
                      : activeTab === "flagged"
                        ? "FLAGOVANE LOKACIJE"
                        : activeTab === "checkins"
                          ? "GPS CHECK-IN REVIEW"
                          : "AUDIT TRAIL"}
                </span>

                <h2>
                  {activeTab === "overview"
                    ? "Šta zahteva tvoju pažnju?"
                    : activeTab === "places"
                      ? `${pendingPlaces.length} novih lokacija`
                      : activeTab === "flagged"
                        ? `${flaggedPlaces.length} flagovanih lokacija`
                        : activeTab === "checkins"
                          ? `${reviewCheckins.length} check-inova za proveru`
                          : `${logs.length} poslednjih admin akcija`}
                </h2>
              </div>

              {activeTab !== "log" && (
                <label className="adminSearch">
                  <Icon
                    name="search"
                    size={16}
                  />

                  <input
                    value={query}
                    onChange={(event) =>
                      setQuery(
                        event.target.value
                      )
                    }
                    placeholder="Mesto, korisnik, region..."
                  />

                  {query && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuery("")
                      }
                    >
                      <Icon
                        name="close"
                        size={13}
                      />
                    </button>
                  )}
                </label>
              )}
            </header>

            {error && (
              <div className="adminMessage error">
                <Icon
                  name="alert"
                  size={17}
                />
                {error}
              </div>
            )}

            {notice && (
              <div className="adminMessage success">
                <Icon
                  name="check"
                  size={17}
                />
                {notice}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="adminOverview">
                <section className="adminPriority">
                  <header>
                    <div>
                      <span>
                        PRIORITET
                      </span>
                      <h3>
                        Zahteva pregled sada
                      </h3>
                    </div>

                    <b>
                      {stats.pendingPlaces +
                        stats.flaggedPlaces +
                        stats.reviewCheckins}
                    </b>
                  </header>

                  <div className="adminPriorityGrid">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("places")
                      }
                    >
                      <span className="green">
                        <Icon
                          name="pin"
                          size={20}
                        />
                      </span>

                      <div>
                        <small>
                          NOVI PINOVI
                        </small>
                        <strong>
                          {stats.pendingPlaces}
                        </strong>
                        <p>
                          Lokacije koje još nisu izašle na
                          javnu mapu.
                        </p>
                      </div>

                      <Icon
                        name="arrow"
                        size={18}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("checkins")
                      }
                    >
                      <span className="amber">
                        <Icon
                          name="navigation"
                          size={20}
                        />
                      </span>

                      <div>
                        <small>
                          GPS REVIEW
                        </small>
                        <strong>
                          {stats.reviewCheckins}
                        </strong>
                        <p>
                          Offline ili GPS anomalije koje
                          nisu automatski odobrene.
                        </p>
                      </div>

                      <Icon
                        name="arrow"
                        size={18}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("flagged")
                      }
                    >
                      <span className="red">
                        <Icon
                          name="flag"
                          size={20}
                        />
                      </span>

                      <div>
                        <small>
                          FLAGOVANO
                        </small>
                        <strong>
                          {stats.flaggedPlaces}
                        </strong>
                        <p>
                          Lokacije koje zahtevaju dodatnu
                          moderatorsku odluku.
                        </p>
                      </div>

                      <Icon
                        name="arrow"
                        size={18}
                      />
                    </button>
                  </div>
                </section>

                <section className="adminPulse">
                  <div className="adminPulseHead">
                    <div>
                      <span>
                        POSLEDNJE AKCIJE
                      </span>
                      <h3>
                        Šta se upravo dešavalo
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("log")
                      }
                    >
                      Ceo log
                      <Icon
                        name="arrow"
                        size={14}
                      />
                    </button>
                  </div>

                  <div className="adminLogList compact">
                    {logs
                      .slice(0, 7)
                      .map((log) => (
                        <article key={log.id}>
                          <span
                            className={`adminLogIcon ${log.action}`}
                          >
                            <Icon
                              name={
                                log.action ===
                                "approve"
                                  ? "check"
                                  : log.action ===
                                      "remove"
                                    ? "trash"
                                    : log.action ===
                                        "flag"
                                      ? "flag"
                                      : "alert"
                              }
                              size={15}
                            />
                          </span>

                          <div>
                            <strong>
                              {log.admin?.full_name ||
                                log.admin?.username ||
                                "Admin"}
                            </strong>

                            <p>
                              {log.action} ·{" "}
                              {log.entity_type}
                            </p>
                          </div>

                          <small>
                            {formatDate(
                              log.created_at
                            )}
                          </small>
                        </article>
                      ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "places" && (
              <div className="adminCards">
                {pendingPlaces.length === 0 ? (
                  <EmptyState
                    icon="check"
                    title="Nema novih pinova."
                    text="Inbox je čist. Novi community pinovi će se pojaviti ovde."
                  />
                ) : (
                  pendingPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      working={
                        workingId === place.id
                      }
                      onApprove={() =>
                        runAction({
                          id: place.id,
                          rpc: "admin_approve_place",
                          params: {
                            p_place_id:
                              place.id,
                          },
                          successMessage:
                            "Lokacija je odobrena i aktivirana.",
                        })
                      }
                      onReject={() =>
                        openReason(
                          "reject-place",
                          place
                        )
                      }
                      onFlag={() =>
                        openReason(
                          "flag-place",
                          place
                        )
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "flagged" && (
              <div className="adminCards">
                {flaggedPlaces.length === 0 ? (
                  <EmptyState
                    icon="shield"
                    title="Nema flagovanih lokacija."
                    text="Sve lokacije trenutno imaju čist status."
                  />
                ) : (
                  flaggedPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      working={
                        workingId === place.id
                      }
                      onApprove={() =>
                        runAction({
                          id: place.id,
                          rpc: "admin_approve_place",
                          params: {
                            p_place_id:
                              place.id,
                          },
                          successMessage:
                            "Flagovana lokacija je odobrena.",
                        })
                      }
                      onReject={() =>
                        openReason(
                          "reject-place",
                          place
                        )
                      }
                      onFlag={null}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "checkins" && (
              <div className="adminCards">
                {reviewCheckins.length === 0 ? (
                  <EmptyState
                    icon="check"
                    title="Nema check-inova za review."
                    text="GPS engine trenutno nema anomalije koje zahtevaju administratora."
                  />
                ) : (
                  reviewCheckins.map(
                    (checkin) => (
                      <CheckinCard
                        key={checkin.id}
                        checkin={checkin}
                        working={
                          workingId ===
                          checkin.id
                        }
                        onApprove={() =>
                          runAction({
                            id: checkin.id,
                            rpc: "admin_approve_checkin",
                            params: {
                              p_checkin_id:
                                checkin.id,
                            },
                            successMessage:
                              "Check-in je potvrđen.",
                          })
                        }
                        onRemove={() =>
                          openReason(
                            "remove-checkin",
                            checkin
                          )
                        }
                      />
                    )
                  )
                )}
              </div>
            )}

            {activeTab === "log" && (
              <div className="adminLogList">
                {logs.map((log) => (
                  <article key={log.id}>
                    <span
                      className={`adminLogIcon ${log.action}`}
                    >
                      <Icon
                        name={
                          log.action === "approve"
                            ? "check"
                            : log.action ===
                                "remove"
                              ? "trash"
                              : log.action ===
                                  "flag"
                                ? "flag"
                                : "alert"
                        }
                        size={16}
                      />
                    </span>

                    <div>
                      <strong>
                        {log.admin?.full_name ||
                          log.admin?.username ||
                          "Admin"}
                      </strong>

                      <p>
                        <b>{log.action}</b>{" "}
                        {log.entity_type} ·{" "}
                        {log.entity_id}
                      </p>

                      {log.reason && (
                        <em>
                          “{log.reason}”
                        </em>
                      )}
                    </div>

                    <small>
                      {formatDate(
                        log.created_at
                      )}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        <ReasonModal
          open={reasonModal.open}
          title={
            reasonModal.type ===
            "remove-checkin"
              ? "Ukloni check-in"
              : reasonModal.type ===
                  "reject-place"
                ? "Odbij lokaciju"
                : "Flaguj lokaciju"
          }
          description={
            reasonModal.type ===
            "remove-checkin"
              ? "Check-in neće biti fizički obrisan. Postaće rejected, a razlog i admin koji je izvršio akciju ostaju u audit logu."
              : reasonModal.type ===
                  "reject-place"
                ? "Lokacija će biti odbijena i isključena sa javne mape."
                : "Lokacija ostaje u sistemu, ali prelazi u flagged status za dodatni pregled."
          }
          actionLabel={
            reasonModal.type ===
            "remove-checkin"
              ? "Ukloni check-in"
              : reasonModal.type ===
                  "reject-place"
                ? "Odbij lokaciju"
                : "Flaguj"
          }
          destructive={
            reasonModal.type ===
              "remove-checkin" ||
            reasonModal.type ===
              "reject-place"
          }
          busy={
            workingId ===
            reasonModal.entity?.id
          }
          onClose={() =>
            setReasonModal({
              open: false,
              type: null,
              entity: null,
            })
          }
          onConfirm={confirmReason}
        />
      </main>
    </>
  );
}

function PlaceCard({
  place,
  onApprove,
  onReject,
  onFlag,
  working,
}) {
  return (
    <article className="adminPlaceCard">
      <div className="adminPlaceImage">
        <img
          src={
            place.cover_url ||
            FALLBACK_COVER
          }
          alt=""
        />

        <span
          className={`status ${place.moderation_status}`}
        >
          {moderationLabel(
            place.moderation_status
          )}
        </span>

        {place.location_precision !==
          "exact" && (
          <b>
            <Icon
              name="shield"
              size={13}
            />
            Zaštićena lokacija
          </b>
        )}
      </div>

      <div className="adminPlaceBody">
        <header>
          <div>
            <span>
              {place.place_categories
                ?.name ||
                "Outdoor mesto"}
            </span>

            <h3>{place.name}</h3>

            <p>
              <Icon
                name="pin"
                size={13}
              />
              {[place.locality, place.region]
                .filter(Boolean)
                .join(" · ") ||
                "Srbija"}
            </p>
          </div>

          <Link
            to={`/explore/${place.id}`}
          >
            Otvori
            <Icon
              name="arrow"
              size={14}
            />
          </Link>
        </header>

        <UserBadge user={place.creator} />

        <div className="adminPlaceMeta">
          <article>
            <span>
              Kreirano
            </span>
            <strong>
              {formatDate(
                place.created_at
              )}
            </strong>
          </article>

          <article>
            <span>
              GPS
            </span>
            <strong>
              {Number(
                place.latitude
              ).toFixed(5)}
              ,{" "}
              {Number(
                place.longitude
              ).toFixed(5)}
            </strong>
          </article>

          <article>
            <span>
              Aktivno
            </span>
            <strong>
              {place.is_active
                ? "Da"
                : "Ne"}
            </strong>
          </article>

          <article>
            <span>
              Sensitive
            </span>
            <strong>
              {place.is_sensitive
                ? "Da"
                : "Ne"}
            </strong>
          </article>
        </div>

        {place.short_description && (
          <p className="adminPlaceDescription">
            {place.short_description}
          </p>
        )}

        <footer>
          <button
            type="button"
            className="approve"
            disabled={working}
            onClick={onApprove}
          >
            <Icon
              name="check"
              size={15}
            />
            Odobri
          </button>

          {onFlag && (
            <button
              type="button"
              className="flag"
              disabled={working}
              onClick={onFlag}
            >
              <Icon
                name="flag"
                size={15}
              />
              Flaguj
            </button>
          )}

          <button
            type="button"
            className="reject"
            disabled={working}
            onClick={onReject}
          >
            <Icon
              name="close"
              size={15}
            />
            Odbij
          </button>
        </footer>
      </div>
    </article>
  );
}

function CheckinCard({
  checkin,
  onApprove,
  onRemove,
  working,
}) {
  const verification =
    Array.isArray(
      checkin.place_checkin_verifications
    )
      ? checkin
          .place_checkin_verifications[0]
      : checkin.place_checkin_verifications;

  return (
    <article className="adminCheckinCard">
      <div className="adminCheckinTop">
        <div className="adminCheckinPlace">
          <img
            src={
              checkin.places?.cover_url ||
              FALLBACK_COVER
            }
            alt=""
          />

          <div>
            <span>
              GPS CHECK-IN REVIEW
            </span>
            <h3>
              {checkin.places?.name ||
                "Outdoor mesto"}
            </h3>
            <p>
              {[checkin.places?.locality,
                checkin.places?.region]
                .filter(Boolean)
                .join(" · ") ||
                "Srbija"}
            </p>
          </div>
        </div>

        <span
          className={`adminSource ${checkin.checkin_source}`}
        >
          <Icon
            name={
              checkin.checkin_source ===
              "offline"
                ? "wifiOff"
                : "navigation"
            }
            size={14}
          />
          {checkin.checkin_source ===
          "offline"
            ? "OFFLINE"
            : "ONLINE"}
        </span>
      </div>

      <UserBadge
        user={checkin.profiles}
      />

      <div className="adminRiskGrid">
        <article>
          <span>
            UDALJENOST
          </span>
          <strong>
            {verification?.distance_from_place_m !=
            null
              ? `${Math.round(
                  verification.distance_from_place_m
                )} m`
              : "—"}
          </strong>
          <small>
            dozvoljeno{" "}
            {verification?.allowed_radius_m !=
            null
              ? `${Math.round(
                  verification.allowed_radius_m
                )} m`
              : "—"}
          </small>
        </article>

        <article>
          <span>
            GPS ACCURACY
          </span>
          <strong>
            {verification?.accuracy_m !=
            null
              ? `${Math.round(
                  verification.accuracy_m
                )} m`
              : "—"}
          </strong>
          <small>
            što manje, to bolje
          </small>
        </article>

        <article>
          <span>
            OFFLINE DELAY
          </span>
          <strong>
            {formatDelay(
              verification?.offline_delay_seconds
            )}
          </strong>
          <small>
            između posete i sync-a
          </small>
        </article>

        <article>
          <span>
            POSETA
          </span>
          <strong>
            {formatDate(
              checkin.visited_at
            )}
          </strong>
          <small>
            server:{" "}
            {formatDate(
              checkin.created_at
            )}
          </small>
        </article>
      </div>

      <div className="adminRiskReason">
        <Icon
          name="alert"
          size={17}
        />

        <div>
          <span>
            ZAŠTO JE OVDE?
          </span>
          <strong>
            {checkin.review_reason ||
              verification?.review_reason ||
              "Sistem ga je označio za ručnu proveru."}
          </strong>
        </div>
      </div>

      <footer>
        <Link
          to={`/explore/${checkin.place_id}`}
        >
          Otvori lokaciju
          <Icon
            name="arrow"
            size={14}
          />
        </Link>

        <div>
          <button
            type="button"
            className="approve"
            disabled={working}
            onClick={onApprove}
          >
            <Icon
              name="check"
              size={15}
            />
            Odobri
          </button>

          <button
            type="button"
            className="remove"
            disabled={working}
            onClick={onRemove}
          >
            <Icon
              name="trash"
              size={15}
            />
            Ukloni check-in
          </button>
        </div>
      </footer>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  text,
}) {
  return (
    <div className="adminEmpty">
      <span>
        <Icon
          name={icon}
          size={28}
        />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function AdminStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      body{margin:0;background:#07110b}
      button,input,textarea{font:inherit}
      .adminExplore,.adminLoading{min-height:100vh;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .adminExplore{padding:112px 20px 70px;background:radial-gradient(circle at 8% 0%,rgba(186,255,158,.08),transparent 23%),#07110b;color:#fff}
      .adminExplore a{color:inherit;text-decoration:none}
      .adminHero{position:relative;isolation:isolate;width:min(1440px,100%);min-height:540px;margin:0 auto;padding:28px;overflow:hidden;border:1px solid rgba(255,255,255,.09);border-radius:34px;background:radial-gradient(circle at 85% 16%,rgba(186,255,158,.15),transparent 25%),radial-gradient(circle at 68% 90%,rgba(68,120,255,.08),transparent 28%),linear-gradient(135deg,#06110a,#0d2818 58%,#163b25);box-shadow:0 32px 90px rgba(0,0,0,.32)}
      .adminHeroNoise{position:absolute;inset:0;z-index:-1;opacity:.06;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E")}
      .adminHeroTop{display:flex;align-items:center;justify-content:space-between;gap:14px}
      .adminBrand{display:flex;align-items:center;gap:10px}
      .adminBrand>span{display:grid;place-items:center;width:46px;height:46px;border:1px solid rgba(186,255,158,.2);border-radius:15px;background:rgba(186,255,158,.1);color:#baff9e}
      .adminBrand small,.adminBrand strong{display:block}
      .adminBrand small{color:#baff9e;font-size:6px;font-weight:900;letter-spacing:.13em}
      .adminBrand strong{margin-top:3px;font-size:10px}
      .adminRefresh{display:inline-flex;align-items:center;gap:7px;min-height:41px;padding:0 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.055);color:#fff;cursor:pointer;font-size:7px;font-weight:850}
      .adminHeroCopy{max-width:980px;padding-top:82px}
      .adminEyebrow{display:inline-flex;align-items:center;gap:7px;color:#baff9e;font-size:7px;font-weight:950;letter-spacing:.12em}
      .adminEyebrow i{width:7px;height:7px;border-radius:50%;background:#baff9e;box-shadow:0 0 0 5px rgba(186,255,158,.09)}
      .adminHeroCopy h1{margin:15px 0 0;font-size:clamp(56px,7vw,104px);line-height:.83;letter-spacing:-.08em}
      .adminHeroCopy p{max-width:620px;margin:19px 0 0;color:rgba(255,255,255,.49);font-size:10px;line-height:1.7}
      .adminHeroStats{position:absolute;right:28px;bottom:28px;left:28px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .adminHeroStats article{padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(3,12,6,.37);backdrop-filter:blur(18px)}
      .adminHeroStats span,.adminHeroStats strong,.adminHeroStats small{display:block}
      .adminHeroStats span{color:rgba(255,255,255,.42);font-size:6px;font-weight:850;text-transform:uppercase}
      .adminHeroStats strong{margin-top:5px;font-size:24px}
      .adminHeroStats small{margin-top:3px;color:#baff9e;font-size:6px}
      .adminWorkspace{display:grid;grid-template-columns:245px minmax(0,1fr);gap:14px;width:min(1440px,100%);margin:14px auto 0}
      .adminSidebar{position:sticky;top:94px;align-self:start;padding:16px;border:1px solid rgba(255,255,255,.08);border-radius:22px;background:linear-gradient(180deg,rgba(13,32,20,.96),rgba(8,21,13,.96));box-shadow:0 20px 60px rgba(0,0,0,.2)}
      .adminSidebarTitle{padding:5px 5px 14px;border-bottom:1px solid rgba(255,255,255,.07)}
      .adminSidebarTitle span,.adminSidebarTitle strong{display:block}
      .adminSidebarTitle span{color:#baff9e;font-size:6px;font-weight:900;letter-spacing:.11em}
      .adminSidebarTitle strong{margin-top:4px;font-size:15px}
      .adminSidebar nav{display:grid;gap:5px;margin-top:11px}
      .adminSidebar nav button{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:8px;width:100%;min-height:47px;padding:6px;border:1px solid transparent;border-radius:12px;background:transparent;color:rgba(255,255,255,.56);text-align:left;cursor:pointer}
      .adminSidebar nav button>span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.045)}
      .adminSidebar nav button strong{font-size:7px}
      .adminSidebar nav button b{display:grid;place-items:center;min-width:23px;height:23px;padding:0 5px;border-radius:999px;background:rgba(255,255,255,.07);font-size:6px}
      .adminSidebar nav button.active{border-color:rgba(186,255,158,.16);background:rgba(186,255,158,.08);color:#fff}
      .adminSidebar nav button.active>span{background:#baff9e;color:#102619}
      .adminSidebar nav button.active b{background:#baff9e;color:#102619}
      .adminSidebarHealth{margin-top:15px;padding:11px;border:1px solid rgba(186,255,158,.1);border-radius:13px;background:rgba(186,255,158,.045)}
      .adminSidebarHealth>div{display:flex;align-items:center;gap:6px;color:#baff9e;font-size:6px;font-weight:900}
      .adminSidebarHealth>div span{width:7px;height:7px;border-radius:50%;background:#baff9e;box-shadow:0 0 0 4px rgba(186,255,158,.08)}
      .adminSidebarHealth strong,.adminSidebarHealth small{display:block}
      .adminSidebarHealth strong{margin-top:7px;font-size:7px}
      .adminSidebarHealth small{margin-top:4px;color:rgba(255,255,255,.34);font-size:6px;line-height:1.5}
      .adminMain{min-width:0;padding:19px;border:1px solid rgba(255,255,255,.08);border-radius:23px;background:#0b1810;box-shadow:0 20px 60px rgba(0,0,0,.18)}
      .adminMainHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding-bottom:15px;border-bottom:1px solid rgba(255,255,255,.07)}
      .adminMainHeader>div>span{color:#baff9e;font-size:6px;font-weight:900;letter-spacing:.11em}
      .adminMainHeader h2{margin:5px 0 0;font-size:27px;letter-spacing:-.05em}
      .adminSearch{display:flex;align-items:center;gap:7px;width:min(330px,100%);min-height:41px;padding:0 10px;border:1px solid rgba(255,255,255,.08);border-radius:11px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.35)}
      .adminSearch input{width:100%;border:0;outline:0;background:transparent;color:#fff;font-size:7px}
      .adminSearch button{display:grid;place-items:center;width:25px;height:25px;border:0;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}
      .adminMessage{display:flex;align-items:center;gap:7px;margin-top:10px;padding:10px 11px;border-radius:11px;font-size:7px}
      .adminMessage.error{border:1px solid rgba(255,128,110,.22);background:rgba(255,75,55,.08);color:#ffb4aa}
      .adminMessage.success{border:1px solid rgba(186,255,158,.18);background:rgba(186,255,158,.07);color:#d9ffca}
      .adminOverview{display:grid;gap:12px;margin-top:14px}
      .adminPriority,.adminPulse{padding:15px;border:1px solid rgba(255,255,255,.07);border-radius:17px;background:rgba(255,255,255,.025)}
      .adminPriority>header,.adminPulseHead{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .adminPriority>header span,.adminPulseHead span{color:#baff9e;font-size:6px;font-weight:900;letter-spacing:.1em}
      .adminPriority>header h3,.adminPulseHead h3{margin:4px 0 0;font-size:18px;letter-spacing:-.035em}
      .adminPriority>header>b{display:grid;place-items:center;min-width:42px;height:42px;border-radius:13px;background:#baff9e;color:#102619;font-size:12px}
      .adminPriorityGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}
      .adminPriorityGrid>button{display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:9px;padding:11px;border:1px solid rgba(255,255,255,.065);border-radius:14px;background:rgba(255,255,255,.025);color:#fff;text-align:left;cursor:pointer}
      .adminPriorityGrid>button>span{display:grid;place-items:center;width:44px;height:44px;border-radius:13px}
      .adminPriorityGrid>button>span.green{background:rgba(186,255,158,.09);color:#baff9e}
      .adminPriorityGrid>button>span.amber{background:rgba(255,211,116,.09);color:#ffd374}
      .adminPriorityGrid>button>span.red{background:rgba(255,108,93,.09);color:#ff8c80}
      .adminPriorityGrid small,.adminPriorityGrid strong,.adminPriorityGrid p{display:block}
      .adminPriorityGrid small{color:rgba(255,255,255,.35);font-size:5px;font-weight:900}
      .adminPriorityGrid strong{margin-top:3px;font-size:18px}
      .adminPriorityGrid p{margin:3px 0 0;color:rgba(255,255,255,.34);font-size:6px;line-height:1.4}
      .adminPulseHead>button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#baff9e;cursor:pointer;font-size:6px;font-weight:850}
      .adminCards{display:grid;gap:10px;margin-top:14px}
      .adminPlaceCard{display:grid;grid-template-columns:245px minmax(0,1fr);overflow:hidden;border:1px solid rgba(255,255,255,.07);border-radius:18px;background:rgba(255,255,255,.025)}
      .adminPlaceImage{position:relative;min-height:275px}
      .adminPlaceImage>img{width:100%;height:100%;object-fit:cover}
      .adminPlaceImage:after{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,15,9,.06),rgba(5,15,9,.55));content:""}
      .adminPlaceImage .status{position:absolute;top:10px;left:10px;z-index:2;padding:7px 8px;border-radius:999px;background:rgba(3,11,6,.72);font-size:6px;font-weight:900;backdrop-filter:blur(12px)}
      .adminPlaceImage .status.pending{color:#ffd374}
      .adminPlaceImage .status.flagged{color:#ff9b90}
      .adminPlaceImage>b{position:absolute;right:10px;bottom:10px;left:10px;z-index:2;display:flex;align-items:center;gap:6px;padding:8px;border-radius:9px;background:rgba(3,11,6,.7);color:#f1d17f;font-size:6px}
      .adminPlaceBody{padding:14px}
      .adminPlaceBody>header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
      .adminPlaceBody>header span{color:#baff9e;font-size:6px;font-weight:900;text-transform:uppercase}
      .adminPlaceBody>header h3{margin:4px 0 0;font-size:22px;letter-spacing:-.045em}
      .adminPlaceBody>header p{display:flex;align-items:center;gap:5px;margin:5px 0 0;color:rgba(255,255,255,.38);font-size:6px}
      .adminPlaceBody>header>a{display:inline-flex;align-items:center;gap:5px;min-height:33px;padding:0 9px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.035);font-size:6px;font-weight:850}
      .adminUserBadge{display:flex;align-items:center;gap:8px;width:max-content;max-width:100%;margin-top:12px}
      .adminUserBadge img{width:38px;height:38px;border-radius:11px;object-fit:cover}
      .adminUserBadge strong,.adminUserBadge span{display:block}
      .adminUserBadge strong{font-size:7px}
      .adminUserBadge span{margin-top:2px;color:rgba(255,255,255,.35);font-size:6px}
      .adminPlaceMeta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:12px}
      .adminPlaceMeta article{padding:8px;border:1px solid rgba(255,255,255,.055);border-radius:10px;background:rgba(255,255,255,.025)}
      .adminPlaceMeta span,.adminPlaceMeta strong{display:block}
      .adminPlaceMeta span{color:rgba(255,255,255,.3);font-size:5px;text-transform:uppercase}
      .adminPlaceMeta strong{margin-top:3px;overflow:hidden;font-size:6px;text-overflow:ellipsis;white-space:nowrap}
      .adminPlaceDescription{margin:10px 0 0;color:rgba(255,255,255,.43);font-size:7px;line-height:1.5}
      .adminPlaceBody>footer{display:flex;justify-content:flex-end;gap:6px;margin-top:13px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)}
      .adminPlaceBody>footer button,.adminCheckinCard footer button{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 10px;border-radius:10px;cursor:pointer;font-size:6px;font-weight:900}
      button.approve{border:1px solid rgba(186,255,158,.2);background:rgba(186,255,158,.09);color:#d8ffc7}
      button.flag{border:1px solid rgba(255,211,116,.18);background:rgba(255,211,116,.07);color:#ffd374}
      button.reject,button.remove{border:1px solid rgba(255,121,108,.2);background:rgba(255,76,57,.08);color:#ffaaa1}
      .adminCheckinCard{padding:14px;border:1px solid rgba(255,255,255,.07);border-radius:18px;background:rgba(255,255,255,.025)}
      .adminCheckinTop{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .adminCheckinPlace{display:flex;align-items:center;gap:10px;min-width:0}
      .adminCheckinPlace>img{width:72px;height:72px;border-radius:14px;object-fit:cover}
      .adminCheckinPlace span,.adminCheckinPlace h3,.adminCheckinPlace p{display:block}
      .adminCheckinPlace span{color:#ffd374;font-size:5px;font-weight:900;letter-spacing:.09em}
      .adminCheckinPlace h3{margin:4px 0 0;font-size:16px}
      .adminCheckinPlace p{margin:3px 0 0;color:rgba(255,255,255,.34);font-size:6px}
      .adminSource{display:inline-flex;align-items:center;gap:5px;padding:7px 8px;border-radius:999px;font-size:6px;font-weight:900}
      .adminSource.offline{background:rgba(255,211,116,.09);color:#ffd374}
      .adminSource.online{background:rgba(186,255,158,.08);color:#baff9e}
      .adminRiskGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:12px}
      .adminRiskGrid article{padding:10px;border:1px solid rgba(255,255,255,.055);border-radius:11px;background:rgba(255,255,255,.025)}
      .adminRiskGrid span,.adminRiskGrid strong,.adminRiskGrid small{display:block}
      .adminRiskGrid span{color:rgba(255,255,255,.3);font-size:5px;font-weight:900}
      .adminRiskGrid strong{margin-top:4px;font-size:9px}
      .adminRiskGrid small{margin-top:3px;color:rgba(255,255,255,.28);font-size:5px}
      .adminRiskReason{display:flex;align-items:flex-start;gap:8px;margin-top:9px;padding:10px;border:1px solid rgba(255,211,116,.14);border-radius:11px;background:rgba(255,211,116,.055);color:#ffd374}
      .adminRiskReason span,.adminRiskReason strong{display:block}
      .adminRiskReason span{font-size:5px;font-weight:900}
      .adminRiskReason strong{margin-top:3px;color:#fff;font-size:7px;line-height:1.45}
      .adminCheckinCard>footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)}
      .adminCheckinCard>footer>a{display:inline-flex;align-items:center;gap:5px;color:#baff9e;font-size:6px;font-weight:850}
      .adminCheckinCard>footer>div{display:flex;gap:6px}
      .adminLogList{display:grid;gap:6px;margin-top:14px}
      .adminLogList.compact{margin-top:10px}
      .adminLogList>article{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px;border:1px solid rgba(255,255,255,.05);border-radius:11px;background:rgba(255,255,255,.02)}
      .adminLogIcon{display:grid;place-items:center;width:36px;height:36px;border-radius:10px}
      .adminLogIcon.approve{background:rgba(186,255,158,.08);color:#baff9e}
      .adminLogIcon.remove,.adminLogIcon.reject{background:rgba(255,108,93,.08);color:#ff8c80}
      .adminLogIcon.flag{background:rgba(255,211,116,.08);color:#ffd374}
      .adminLogList strong{font-size:7px}
      .adminLogList p{margin:3px 0 0;color:rgba(255,255,255,.34);font-size:6px}
      .adminLogList p b{color:#fff}
      .adminLogList em{display:block;margin-top:4px;color:#ffd374;font-size:6px;font-style:normal}
      .adminLogList>article>small{color:rgba(255,255,255,.28);font-size:5px}
      .adminEmpty{display:grid;place-items:center;padding:70px 20px;border:1px dashed rgba(255,255,255,.09);border-radius:18px;background:rgba(255,255,255,.015);text-align:center}
      .adminEmpty>span{display:grid;place-items:center;width:62px;height:62px;border-radius:19px;background:rgba(186,255,158,.07);color:#baff9e}
      .adminEmpty strong{margin-top:13px;font-size:14px}
      .adminEmpty p{max-width:380px;margin:6px 0 0;color:rgba(255,255,255,.36);font-size:7px;line-height:1.5}
      .adminModal{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;padding:18px}
      .adminModalBackdrop{position:absolute;inset:0;border:0;background:rgba(0,0,0,.7);backdrop-filter:blur(10px)}
      .adminModal>section{position:relative;z-index:2;width:min(500px,100%);padding:17px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:#0c1c12;box-shadow:0 30px 100px rgba(0,0,0,.5)}
      .adminModal header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .adminModal header span{color:#ffb2a8;font-size:6px;font-weight:900;letter-spacing:.1em}
      .adminModal header h2{margin:5px 0 0;font-size:23px}
      .adminModal header p{margin:5px 0 0;color:rgba(255,255,255,.38);font-size:7px;line-height:1.5}
      .adminModal header>button{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.04);color:#fff;cursor:pointer}
      .adminModal label{display:grid;gap:6px;margin-top:13px}
      .adminModal label>span{color:rgba(255,255,255,.42);font-size:6px;font-weight:850}
      .adminModal textarea{min-height:120px;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.045);color:#fff;outline:0;resize:vertical;font-size:8px;line-height:1.5}
      .adminModal footer{display:flex;justify-content:flex-end;gap:7px;margin-top:12px}
      .adminModal footer button{min-height:39px;padding:0 11px;border-radius:10px;cursor:pointer;font-size:7px;font-weight:850}
      .adminModal footer .secondary{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#fff}
      .adminModal footer .primary{border:0;background:#baff9e;color:#102619}
      .adminModal footer .danger{border:0;background:#ff8578;color:#2a0906}
      .adminModal footer button:disabled{cursor:not-allowed;opacity:.45}
      .adminLoading{display:grid;place-items:center;align-content:center;gap:10px;background:#07110b;color:#fff}
      .adminLoading>span{width:38px;height:38px;border:3px solid rgba(255,255,255,.12);border-top-color:#baff9e;border-radius:50%;animation:adminSpin .8s linear infinite}
      @keyframes adminSpin{to{transform:rotate(360deg)}}
      .adminLoading strong{font-size:12px}

      @media(max-width:1100px){
        .adminWorkspace{grid-template-columns:1fr}
        .adminSidebar{position:static}
        .adminSidebar nav{grid-template-columns:repeat(5,minmax(0,1fr))}
        .adminSidebar nav button{grid-template-columns:34px minmax(0,1fr)}
        .adminSidebar nav button b{display:none}
        .adminSidebarHealth{display:none}
      }

      @media(max-width:850px){
        .adminHero{min-height:650px}
        .adminHeroStats{grid-template-columns:repeat(2,minmax(0,1fr))}
        .adminPriorityGrid{grid-template-columns:1fr}
        .adminPlaceCard{grid-template-columns:1fr}
        .adminPlaceImage{height:270px;min-height:0}
        .adminRiskGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .adminPlaceMeta{grid-template-columns:repeat(2,minmax(0,1fr))}
      }

      @media(max-width:700px){
        .adminExplore{padding:82px 9px 50px}
        .adminHero{min-height:690px;padding:18px;border-radius:0 0 28px 28px}
        .adminHeroCopy{padding-top:88px}
        .adminHeroCopy h1{font-size:52px}
        .adminHeroStats{right:18px;bottom:18px;left:18px}
        .adminRefresh{width:40px;padding:0;justify-content:center}
        .adminRefresh{font-size:0}
        .adminSidebar{padding:8px;overflow-x:auto}
        .adminSidebarTitle{display:none}
        .adminSidebar nav{display:flex;margin:0;min-width:max-content}
        .adminSidebar nav button{grid-template-columns:32px auto;min-width:max-content;padding-right:10px}
        .adminMain{padding:13px}
        .adminMainHeader{align-items:stretch;flex-direction:column}
        .adminSearch{width:100%}
      }

      @media(max-width:500px){
        .adminHeroCopy h1{font-size:44px}
        .adminHeroStats{gap:5px}
        .adminHeroStats article{padding:10px}
        .adminPlaceBody>header{flex-direction:column}
        .adminPlaceBody>footer{display:grid;grid-template-columns:1fr 1fr}
        .adminPlaceBody>footer button{justify-content:center}
        .adminPlaceBody>footer .reject{grid-column:1/-1}
        .adminCheckinTop{align-items:flex-start;flex-direction:column}
        .adminRiskGrid{grid-template-columns:1fr 1fr}
        .adminCheckinCard>footer{align-items:stretch;flex-direction:column}
        .adminCheckinCard>footer>div{display:grid;grid-template-columns:1fr}
        .adminCheckinCard>footer button{justify-content:center;width:100%}
        .adminLogList>article{grid-template-columns:36px minmax(0,1fr)}
        .adminLogList>article>small{grid-column:2}
      }

      @media(prefers-reduced-motion:reduce){
        *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
      }
    `}</style>
  );
}
