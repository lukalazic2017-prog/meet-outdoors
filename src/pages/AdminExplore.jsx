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
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [placeComments, setPlaceComments] = useState([]);
  const [eventComments, setEventComments] = useState([]);
  const [packageComments, setPackageComments] = useState([]);
  const [hostDocuments, setHostDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
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

  const [suspendModal, setSuspendModal] = useState({
    open: false,
    entity: null,
  });

  const loadProfiles = useCallback(async () => {
    const { data, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        role,
        full_name,
        username,
        city,
        country,
        avatar_url,
        phone,
        is_verified,
        is_admin,
        account_status,
        ban_reason,
        banned_at,
        suspended_until,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (profilesError) throw profilesError;
    setProfiles(data || []);
  }, []);

  const loadEvents = useCallback(async () => {
    const { data, error: eventsError } = await supabase
      .from("events")
      .select(`
        id,
        host_id,
        title,
        description,
        location,
        country,
        cover_url,
        price,
        capacity,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at,
        place_id,
        host:host_id (
          id,
          username,
          full_name,
          avatar_url,
          role,
          account_status
        )
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    if (eventsError) throw eventsError;
    setEvents(data || []);
  }, []);

  const loadPackages = useCallback(async () => {
    const { data, error: packagesError } = await supabase
      .from("packages")
      .select(`
        id,
        host_id,
        title,
        description,
        activity,
        city,
        country,
        location_text,
        price,
        currency,
        image_url,
        cover_url,
        duration,
        duration_text,
        capacity,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at,
        place_id,
        host:host_id (
          id,
          username,
          full_name,
          avatar_url,
          role,
          account_status
        )
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    if (packagesError) throw packagesError;
    setPackages(data || []);
  }, []);

  const loadBookings = useCallback(async () => {
    const { data, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        package_id,
        user_id,
        host_id,
        guests,
        note,
        status,
        payment_status,
        paid_at,
        approved_at,
        rejected_at,
        cancelled_at,
        completed_at,
        host_note,
        total_amount,
        currency,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        updated_at,
        user:user_id (
          id,
          username,
          full_name,
          avatar_url,
          role,
          account_status
        ),
        host:host_id (
          id,
          username,
          full_name,
          avatar_url,
          role,
          account_status
        ),
        package:package_id (
          id,
          title,
          cover_url,
          image_url
        )
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (bookingsError) throw bookingsError;
    setBookings(data || []);
  }, []);

  const loadPhotos = useCallback(async () => {
    const { data, error: photosError } = await supabase
      .from("place_photos")
      .select(`
        id,
        place_id,
        user_id,
        checkin_id,
        storage_path,
        image_url,
        caption,
        width,
        height,
        file_size,
        mime_type,
        moderation_status,
        is_cover_candidate,
        created_at,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          role,
          account_status
        ),
        places:place_id (
          id,
          name,
          locality,
          region,
          is_active
        )
      `)
      .order("created_at", { ascending: false })
      .limit(400);

    if (photosError) throw photosError;
    setPhotos(data || []);
  }, []);

  const loadComments = useCallback(async () => {
    const [placeResult, eventResult, packageResult] = await Promise.all([
      supabase
        .from("place_comments")
        .select(`
          id,
          place_id,
          user_id,
          body,
          parent_id,
          moderation_status,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          ),
          places:place_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(250),
      supabase
        .from("event_comments")
        .select(`
          id,
          event_id,
          user_id,
          body,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          ),
          events:event_id (
            id,
            title
          )
        `)
        .order("created_at", { ascending: false })
        .limit(250),
      supabase
        .from("package_comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(250),
    ]);

    if (placeResult.error) throw placeResult.error;
    if (eventResult.error) throw eventResult.error;
    if (packageResult.error) throw packageResult.error;

    setPlaceComments(placeResult.data || []);
    setEventComments(eventResult.data || []);
    setPackageComments(packageResult.data || []);
  }, []);

  const loadHostDocuments = useCallback(async () => {
    const { data, error: documentsError } = await supabase
      .from("host_documents")
      .select(`
        id,
        host_id,
        document_type,
        title,
        file_url,
        issued_at,
        expires_at,
        notes,
        created_at,
        updated_at,
        host:host_id (
          id,
          username,
          full_name,
          avatar_url,
          role,
          account_status,
          is_verified
        )
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    if (documentsError) throw documentsError;
    setHostDocuments(data || []);
  }, []);

  const loadNotifications = useCallback(async () => {
    const { data, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(400);

    if (notificationsError) throw notificationsError;
    setNotifications(data || []);
  }, []);

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
          checkin_id,
          user_id,
          place_id,
          latitude,
          longitude,
          accuracy_m,
          distance_from_place_m,
          allowed_radius_m,
          device_timestamp
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
    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadProfiles(),
        loadEvents(),
        loadPackages(),
        loadBookings(),
        loadPlaces(),
        loadCheckins(),
        loadPhotos(),
        loadComments(),
        loadReports(),
        loadHostDocuments(),
        loadNotifications(),
        loadLogs(),
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
    loadBookings,
    loadCheckins,
    loadComments,
    loadEvents,
    loadHostDocuments,
    loadLogs,
    loadNotifications,
    loadPackages,
    loadPhotos,
    loadPlaces,
    loadProfiles,
    loadReports,
    profile?.is_admin,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!profile?.is_admin) return;

    const channel = supabase
      .channel("admin-explore-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        loadProfiles
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        loadEvents
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "packages" },
        loadPackages
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        loadBookings
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        loadPlaces
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "place_checkins" },
        loadCheckins
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "place_photos" },
        loadPhotos
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "place_comments" },
        loadComments
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_comments" },
        loadComments
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "package_comments" },
        loadComments
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "place_reports" },
        loadReports
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "host_documents" },
        loadHostDocuments
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        loadNotifications
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "explore_admin_log" },
        loadLogs
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    loadBookings,
    loadCheckins,
    loadComments,
    loadEvents,
    loadHostDocuments,
    loadLogs,
    loadNotifications,
    loadPackages,
    loadPhotos,
    loadPlaces,
    loadProfiles,
    loadReports,
    profile?.is_admin,
  ]);

  const stats = useMemo(() => {
    const pendingPlaces = places.filter(
      (place) => place.moderation_status === "pending"
    ).length;

    const flaggedPlaces = places.filter(
      (place) => place.moderation_status === "flagged"
    ).length;

    const reviewCheckins = checkins.filter(
      (checkin) => checkin.review_status === "review"
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
      openReports: reports.filter(
        (report) => report.status !== "resolved"
      ).length,
      users: profiles.filter((item) => item.role === "user").length,
      hosts: profiles.filter((item) => item.role === "host").length,
      banned: profiles.filter(
        (item) => item.account_status === "banned"
      ).length,
      suspended: profiles.filter(
        (item) => item.account_status === "suspended"
      ).length,
      events: events.length,
      activeEvents: events.filter((item) => item.is_active).length,
      packages: packages.length,
      activePackages: packages.filter((item) => item.is_active).length,
      bookings: bookings.length,
      pendingBookings: bookings.filter((item) =>
        ["pending", "requested"].includes(item.status)
      ).length,
      photos: photos.length,
      pendingPhotos: photos.filter(
        (item) => item.moderation_status === "pending"
      ).length,
      comments:
        placeComments.length +
        eventComments.length +
        packageComments.length,
      documents: hostDocuments.length,
      notifications: notifications.length,
    };
  }, [
    bookings,
    checkins,
    eventComments.length,
    events,
    hostDocuments.length,
    notifications.length,
    packageComments.length,
    packages,
    photos,
    placeComments.length,
    places,
    profiles,
    reports,
  ]);

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

  const filteredProfiles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return profiles;

    return profiles.filter((item) =>
      [
        item.full_name,
        item.username,
        item.city,
        item.country,
        item.role,
        item.account_status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [profiles, query]);

  const filteredEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return events;

    return events.filter((item) =>
      [
        item.title,
        item.location,
        item.country,
        item.host?.full_name,
        item.host?.username,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [events, query]);

  const filteredPackages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return packages;

    return packages.filter((item) =>
      [
        item.title,
        item.activity,
        item.city,
        item.country,
        item.location_text,
        item.host?.full_name,
        item.host?.username,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [packages, query]);

  const filteredBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return bookings;

    return bookings.filter((item) =>
      [
        item.package?.title,
        item.user?.full_name,
        item.user?.username,
        item.host?.full_name,
        item.host?.username,
        item.first_name,
        item.last_name,
        item.email,
        item.phone,
        item.status,
        item.payment_status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [bookings, query]);

  const filteredPhotos = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return photos;

    return photos.filter((item) =>
      [
        item.places?.name,
        item.profiles?.full_name,
        item.profiles?.username,
        item.caption,
        item.moderation_status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [photos, query]);

  const allComments = useMemo(() => {
    const placeItems = placeComments.map((item) => ({
      ...item,
      source: "place",
      sourceTitle: item.places?.name || "Explore lokacija",
      author: item.profiles || null,
    }));

    const eventItems = eventComments.map((item) => ({
      ...item,
      source: "event",
      sourceTitle: item.events?.title || "Događaj",
      author: item.profiles || null,
    }));

    const packageItems = packageComments.map((item) => ({
      ...item,
      source: "package",
      sourceTitle: "Paket",
      author: null,
      body:
        item.body ||
        item.comment ||
        item.message ||
        item.text ||
        "Komentar bez tekstualnog polja",
    }));

    return [...placeItems, ...eventItems, ...packageItems].sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  }, [eventComments, packageComments, placeComments]);

  const filteredComments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allComments;

    return allComments.filter((item) =>
      [
        item.body,
        item.source,
        item.sourceTitle,
        item.author?.full_name,
        item.author?.username,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [allComments, query]);

  const filteredReports = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return reports;

    return reports.filter((item) =>
      [
        item.entity_type,
        item.reason,
        item.details,
        item.status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [query, reports]);

  const filteredDocuments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return hostDocuments;

    return hostDocuments.filter((item) =>
      [
        item.title,
        item.document_type,
        item.host?.full_name,
        item.host?.username,
        item.notes,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [hostDocuments, query]);

  const filteredNotifications = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notifications;

    return notifications.filter((item) =>
      [item.type, item.title, item.message, item.user_id]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        )
    );
  }, [notifications, query]);

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

  async function updateRow({
    id,
    table,
    values,
    successMessage,
    reload,
  }) {
    setWorkingId(id);
    setError("");
    setNotice("");

    try {
      const { error: updateError } = await supabase
        .from(table)
        .update(values)
        .eq("id", id);

      if (updateError) throw updateError;

      setNotice(successMessage);
      await Promise.all([
        reload?.(),
        loadLogs(),
      ].filter(Boolean));
    } catch (actionError) {
      setError(
        actionError?.message ||
          "Admin akcija nije uspela. Proveri admin RLS politike."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteRow({
    id,
    table,
    successMessage,
    reload,
  }) {
    const confirmed = window.confirm(
      "Da li sigurno želiš da ukloniš ovaj sadržaj?"
    );

    if (!confirmed) return;

    setWorkingId(id);
    setError("");
    setNotice("");

    try {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setNotice(successMessage);
      await reload?.();
    } catch (actionError) {
      setError(
        actionError?.message ||
          "Sadržaj trenutno nije moguće ukloniti."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function restoreAccount(entity) {
    await runAction({
      id: entity.id,
      rpc: "admin_restore_user",
      params: {
        p_user_id: entity.id,
        p_reason: "Nalog vraćen iz MeetOutdoors admin panela.",
      },
      successMessage: "Nalog je ponovo aktivan.",
    });

    await loadProfiles();
  }

  async function confirmSuspend({ reason, until }) {
    const entity = suspendModal.entity;
    if (!entity) return;

    await runAction({
      id: entity.id,
      rpc: "admin_suspend_user",
      params: {
        p_user_id: entity.id,
        p_until: until,
        p_reason: reason,
      },
      successMessage: "Nalog je suspendovan.",
    });

    await loadProfiles();
    setSuspendModal({ open: false, entity: null });
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

    if (type === "ban-account") {
      await runAction({
        id: entity.id,
        rpc: "admin_ban_user",
        params: {
          p_user_id: entity.id,
          p_reason: reason,
        },
        successMessage: "Nalog je banovan.",
      });

      await loadProfiles();
    }

    setReasonModal({
      open: false,
      type: null,
      entity: null,
    });
  }

  if (authLoading || !profile) {
  return (
    <>
      <AdminStyles />

      <main className="adminLoading">
        <span />
        <strong>
          Proveravamo admin pristup...
        </strong>
      </main>
    </>
  );
}

if (!profile.is_admin) {
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
      eyebrow: "OPERATIVNI PREGLED",
      title: "Cela aplikacija na jednom mestu",
    },
    {
      id: "users",
      label: "Korisnici",
      icon: "user",
      count: stats.users,
      eyebrow: "COMMUNITY CONTROL",
      title: `${stats.users} korisnika`,
    },
    {
      id: "hosts",
      label: "Hostovi",
      icon: "shield",
      count: stats.hosts,
      eyebrow: "HOST NETWORK",
      title: `${stats.hosts} hostova`,
    },
    {
      id: "events",
      label: "Događaji",
      icon: "activity",
      count: stats.events,
      eyebrow: "EVENT OPERATIONS",
      title: `${stats.events} događaja`,
    },
    {
      id: "packages",
      label: "Paketi",
      icon: "grid",
      count: stats.packages,
      eyebrow: "PACKAGE OPERATIONS",
      title: `${stats.packages} paketa`,
    },
    {
      id: "bookings",
      label: "Rezervacije",
      icon: "clock",
      count: stats.pendingBookings,
      eyebrow: "BOOKING CONTROL",
      title: `${stats.bookings} rezervacija`,
    },
    {
      id: "allplaces",
      label: "Sve lokacije",
      icon: "pin",
      count: places.length,
      eyebrow: "EXPLORE MAP CONTROL",
      title: `${places.length} lokacija u sistemu`,
    },
    {
      id: "places",
      label: "Novi pinovi",
      icon: "pin",
      count: stats.pendingPlaces,
      eyebrow: "NOVI PINOVI",
      title: `${pendingPlaces.length} novih lokacija`,
    },
    {
      id: "flagged",
      label: "Flagovane",
      icon: "flag",
      count: stats.flaggedPlaces,
      eyebrow: "FLAGOVANE LOKACIJE",
      title: `${flaggedPlaces.length} flagovanih lokacija`,
    },
    {
      id: "checkins",
      label: "Check-in review",
      icon: "navigation",
      count: stats.reviewCheckins,
      eyebrow: "GPS CHECK-IN REVIEW",
      title: `${reviewCheckins.length} check-inova za proveru`,
    },
    {
      id: "photos",
      label: "Fotografije",
      icon: "camera",
      count: stats.pendingPhotos,
      eyebrow: "MEDIA MODERATION",
      title: `${stats.photos} fotografija`,
    },
    {
      id: "comments",
      label: "Komentari",
      icon: "menu",
      count: stats.comments,
      eyebrow: "COMMUNITY CONTENT",
      title: `${stats.comments} komentara`,
    },
    {
      id: "reports",
      label: "Prijave",
      icon: "alert",
      count: stats.openReports,
      eyebrow: "REPORT CENTER",
      title: `${stats.openReports} otvorenih prijava`,
    },
    {
      id: "documents",
      label: "Host dokumenta",
      icon: "shield",
      count: stats.documents,
      eyebrow: "HOST DOCUMENTS",
      title: `${stats.documents} dokumenata`,
    },
    {
      id: "notifications",
      label: "Notifikacije",
      icon: "menu",
      count: stats.notifications,
      eyebrow: "SYSTEM NOTIFICATIONS",
      title: `${stats.notifications} notifikacija`,
    },
    {
      id: "log",
      label: "Admin log",
      icon: "log",
      eyebrow: "AUDIT TRAIL",
      title: `${logs.length} poslednjih admin akcija`,
    },
  ];

  const activeTabInfo =
    tabs.find((tab) => tab.id === activeTab) || tabs[0];

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
                  Control Center
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
              LIVE APPLICATION CONTROL
            </span>

            <h1>
              Sve vidiš.
              <br />
              Ništa ne prolazi neprimećeno.
            </h1>

            <p>
              Korisnici, hostovi, događaji, paketi, rezervacije,
              Explore mapa, sadržaj i svaka moderatorska odluka —
              kompletna MeetOutdoors aplikacija pod jednom kontrolom.
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
                Aplikacija
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
                <span>{activeTabInfo.eyebrow}</span>

                <h2>{activeTabInfo.title}</h2>
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
                <section className="adminGlobalOverview">
                  <header>
                    <div>
                      <span>MEETOUTDOORS PULSE</span>
                      <h3>Kompletan sistem, uživo.</h3>
                    </div>

                    <small>
                      {stats.banned} banovanih · {stats.suspended} suspendovanih
                    </small>
                  </header>

                  <div className="adminGlobalGrid">
                    <button type="button" onClick={() => setActiveTab("users")}>
                      <span><Icon name="user" size={19} /></span>
                      <strong>{stats.users}</strong>
                      <small>Korisnika</small>
                    </button>
                    <button type="button" onClick={() => setActiveTab("hosts")}>
                      <span><Icon name="shield" size={19} /></span>
                      <strong>{stats.hosts}</strong>
                      <small>Hostova</small>
                    </button>
                    <button type="button" onClick={() => setActiveTab("events")}>
                      <span><Icon name="activity" size={19} /></span>
                      <strong>{stats.activeEvents}</strong>
                      <small>Aktivnih događaja</small>
                    </button>
                    <button type="button" onClick={() => setActiveTab("packages")}>
                      <span><Icon name="grid" size={19} /></span>
                      <strong>{stats.activePackages}</strong>
                      <small>Aktivnih paketa</small>
                    </button>
                    <button type="button" onClick={() => setActiveTab("bookings")}>
                      <span><Icon name="clock" size={19} /></span>
                      <strong>{stats.bookings}</strong>
                      <small>Rezervacija</small>
                    </button>
                    <button type="button" onClick={() => setActiveTab("allplaces")}>
                      <span><Icon name="pin" size={19} /></span>
                      <strong>{places.length}</strong>
                      <small>Lokacija</small>
                    </button>
                    <button type="button" onClick={() => setActiveTab("photos")}>
                      <span><Icon name="camera" size={19} /></span>
                      <strong>{stats.photos}</strong>
                      <small>Fotografija</small>
                    </button>
                    <button type="button" onClick={() => setActiveTab("reports")}>
                      <span><Icon name="alert" size={19} /></span>
                      <strong>{stats.openReports}</strong>
                      <small>Otvorenih prijava</small>
                    </button>
                  </div>
                </section>

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

            {activeTab === "users" && (
              <div className="adminEntityGrid">
                {filteredProfiles.filter((item) => item.role === "user").length === 0 ? (
                  <EmptyState icon="user" title="Nema korisnika." text="Nijedan korisnik ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredProfiles
                    .filter((item) => item.role === "user")
                    .map((item) => (
                      <AccountCard
                        key={item.id}
                        account={item}
                        working={workingId === item.id}
                        onBan={() => openReason("ban-account", item)}
                        onSuspend={() => setSuspendModal({ open: true, entity: item })}
                        onRestore={() => restoreAccount(item)}
                        onVerify={() =>
                          updateRow({
                            id: item.id,
                            table: "profiles",
                            values: { is_verified: !item.is_verified },
                            successMessage: item.is_verified
                              ? "Verifikacija korisnika je uklonjena."
                              : "Korisnik je verifikovan.",
                            reload: loadProfiles,
                          })
                        }
                      />
                    ))
                )}
              </div>
            )}

            {activeTab === "hosts" && (
              <div className="adminEntityGrid">
                {filteredProfiles.filter((item) => item.role === "host").length === 0 ? (
                  <EmptyState icon="shield" title="Nema hostova." text="Nijedan host ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredProfiles
                    .filter((item) => item.role === "host")
                    .map((item) => (
                      <AccountCard
                        key={item.id}
                        account={item}
                        host
                        working={workingId === item.id}
                        onBan={() => openReason("ban-account", item)}
                        onSuspend={() => setSuspendModal({ open: true, entity: item })}
                        onRestore={() => restoreAccount(item)}
                        onVerify={() =>
                          updateRow({
                            id: item.id,
                            table: "profiles",
                            values: { is_verified: !item.is_verified },
                            successMessage: item.is_verified
                              ? "Host više nije verifikovan."
                              : "Host je verifikovan.",
                            reload: loadProfiles,
                          })
                        }
                      />
                    ))
                )}
              </div>
            )}

            {activeTab === "events" && (
              <div className="adminEntityGrid wide">
                {filteredEvents.length === 0 ? (
                  <EmptyState icon="activity" title="Nema događaja." text="Nijedan događaj ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredEvents.map((item) => (
                    <EventAdminCard
                      key={item.id}
                      event={item}
                      working={workingId === item.id}
                      onToggle={() =>
                        updateRow({
                          id: item.id,
                          table: "events",
                          values: { is_active: !item.is_active },
                          successMessage: item.is_active
                            ? "Događaj je deaktiviran."
                            : "Događaj je ponovo aktivan.",
                          reload: loadEvents,
                        })
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "packages" && (
              <div className="adminEntityGrid wide">
                {filteredPackages.length === 0 ? (
                  <EmptyState icon="grid" title="Nema paketa." text="Nijedan paket ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredPackages.map((item) => (
                    <PackageAdminCard
                      key={item.id}
                      item={item}
                      working={workingId === item.id}
                      onToggle={() =>
                        updateRow({
                          id: item.id,
                          table: "packages",
                          values: { is_active: !item.is_active },
                          successMessage: item.is_active
                            ? "Paket je deaktiviran."
                            : "Paket je ponovo aktivan.",
                          reload: loadPackages,
                        })
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="adminEntityGrid wide">
                {filteredBookings.length === 0 ? (
                  <EmptyState icon="clock" title="Nema rezervacija." text="Nijedna rezervacija ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredBookings.map((item) => (
                    <BookingAdminCard
                      key={item.id}
                      booking={item}
                      working={workingId === item.id}
                      onStatus={(status) =>
                        updateRow({
                          id: item.id,
                          table: "bookings",
                          values: {
                            status,
                            ...(status === "approved" ? { approved_at: new Date().toISOString() } : {}),
                            ...(status === "rejected" ? { rejected_at: new Date().toISOString() } : {}),
                            ...(status === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}),
                            ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
                          },
                          successMessage: `Rezervacija je postavljena na ${status}.`,
                          reload: loadBookings,
                        })
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "allplaces" && (
              <div className="adminEntityGrid wide">
                {filteredPlaces.length === 0 ? (
                  <EmptyState icon="pin" title="Nema lokacija." text="Nijedna lokacija ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredPlaces.map((place) => (
                    <AllPlaceCard
                      key={place.id}
                      place={place}
                      working={workingId === place.id}
                      onToggle={() =>
                        updateRow({
                          id: place.id,
                          table: "places",
                          values: { is_active: !place.is_active },
                          successMessage: place.is_active
                            ? "Lokacija je sakrivena sa javne mape."
                            : "Lokacija je vraćena na javnu mapu.",
                          reload: loadPlaces,
                        })
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "photos" && (
              <div className="adminPhotoGrid">
                {filteredPhotos.length === 0 ? (
                  <EmptyState icon="camera" title="Nema fotografija." text="Nijedna fotografija ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredPhotos.map((photo) => (
                    <PhotoAdminCard
                      key={photo.id}
                      photo={photo}
                      working={workingId === photo.id}
                      onModerate={(status) =>
                        updateRow({
                          id: photo.id,
                          table: "place_photos",
                          values: { moderation_status: status },
                          successMessage: `Fotografija je označena kao ${status}.`,
                          reload: loadPhotos,
                        })
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="adminCommentList">
                {filteredComments.length === 0 ? (
                  <EmptyState icon="menu" title="Nema komentara." text="Nijedan komentar ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredComments.map((item) => (
                    <CommentAdminRow
                      key={`${item.source}-${item.id}`}
                      item={item}
                      working={workingId === item.id}
                      onReject={
                        item.source === "place"
                          ? () =>
                              updateRow({
                                id: item.id,
                                table: "place_comments",
                                values: { moderation_status: "rejected" },
                                successMessage: "Komentar je uklonjen iz javnog prikaza.",
                                reload: loadComments,
                              })
                          : null
                      }
                      onDelete={
                        item.source === "event"
                          ? () =>
                              deleteRow({
                                id: item.id,
                                table: "event_comments",
                                successMessage: "Komentar događaja je uklonjen.",
                                reload: loadComments,
                              })
                          : item.source === "package"
                            ? () =>
                                deleteRow({
                                  id: item.id,
                                  table: "package_comments",
                                  successMessage: "Komentar paketa je uklonjen.",
                                  reload: loadComments,
                                })
                            : null
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "reports" && (
              <div className="adminEntityGrid wide">
                {filteredReports.length === 0 ? (
                  <EmptyState icon="check" title="Nema prijava." text="Report centar je trenutno čist." />
                ) : (
                  filteredReports.map((report) => (
                    <ReportAdminCard
                      key={report.id}
                      report={report}
                      working={workingId === report.id}
                      onResolve={() =>
                        updateRow({
                          id: report.id,
                          table: "place_reports",
                          values: {
                            status: "resolved",
                            resolved_at: new Date().toISOString(),
                          },
                          successMessage: "Prijava je označena kao rešena.",
                          reload: loadReports,
                        })
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="adminEntityGrid wide">
                {filteredDocuments.length === 0 ? (
                  <EmptyState icon="shield" title="Nema host dokumenata." text="Nijedan dokument ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredDocuments.map((document) => (
                    <DocumentAdminCard key={document.id} document={document} />
                  ))
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="adminNotificationList">
                {filteredNotifications.length === 0 ? (
                  <EmptyState icon="menu" title="Nema notifikacija." text="Nijedna notifikacija ne odgovara trenutnoj pretrazi." />
                ) : (
                  filteredNotifications.map((item) => (
                    <NotificationAdminRow key={item.id} item={item} />
                  ))
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
            reasonModal.type === "remove-checkin"
              ? "Ukloni check-in"
              : reasonModal.type === "reject-place"
                ? "Odbij lokaciju"
                : reasonModal.type === "ban-account"
                  ? "Banuj nalog"
                  : "Flaguj lokaciju"
          }
          description={
            reasonModal.type === "remove-checkin"
              ? "Check-in neće biti fizički obrisan. Postaće rejected, a razlog i admin koji je izvršio akciju ostaju u audit logu."
              : reasonModal.type === "reject-place"
                ? "Lokacija će biti odbijena i isključena sa javne mape."
                : reasonModal.type === "ban-account"
                  ? "Nalog će izgubiti pristup MeetOutdoors aplikaciji. Razlog ostaje u audit logu."
                  : "Lokacija ostaje u sistemu, ali prelazi u flagged status za dodatni pregled."
          }
          actionLabel={
            reasonModal.type === "remove-checkin"
              ? "Ukloni check-in"
              : reasonModal.type === "reject-place"
                ? "Odbij lokaciju"
                : reasonModal.type === "ban-account"
                  ? "Banuj nalog"
                  : "Flaguj"
          }
          destructive={
            reasonModal.type === "remove-checkin" ||
            reasonModal.type === "reject-place" ||
            reasonModal.type === "ban-account"
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

        <SuspendModal
          open={suspendModal.open}
          account={suspendModal.entity}
          busy={workingId === suspendModal.entity?.id}
          onClose={() => setSuspendModal({ open: false, entity: null })}
          onConfirm={confirmSuspend}
        />
      </main>
    </>
  );
}

function SuspendModal({
  open,
  account,
  busy,
  onClose,
  onConfirm,
}) {
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setDays("7");
      setReason("");
    }
  }, [open]);

  if (!open || !account) return null;

  const submit = () => {
    const until = new Date(
      Date.now() + Number(days) * 24 * 60 * 60 * 1000
    ).toISOString();

    onConfirm({
      reason: reason.trim(),
      until,
    });
  };

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
            <span>PRIVREMENA SUSPENZIJA</span>
            <h2>Suspenduj nalog</h2>
            <p>
              @{account.username || "unknown"} će privremeno izgubiti
              pristup aplikaciji.
            </p>
          </div>

          <button type="button" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </header>

        <label>
          <span>Trajanje</span>
          <select value={days} onChange={(event) => setDays(event.target.value)}>
            <option value="1">1 dan</option>
            <option value="3">3 dana</option>
            <option value="7">7 dana</option>
            <option value="14">14 dana</option>
            <option value="30">30 dana</option>
            <option value="90">90 dana</option>
          </select>
        </label>

        <label>
          <span>Razlog</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Razlog suspenzije ostaje zabeležen u audit logu."
          />
        </label>

        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Otkaži
          </button>
          <button
            type="button"
            className="danger"
            disabled={busy || !reason.trim()}
            onClick={submit}
          >
            {busy ? "Čuvamo..." : "Suspenduj"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function AccountCard({
  account,
  host = false,
  working,
  onBan,
  onSuspend,
  onRestore,
  onVerify,
}) {
  const blocked = ["banned", "suspended"].includes(account.account_status);
  const profileUrl = host
    ? `/h/${account.username}`
    : `/u/${account.username}`;

  return (
    <article className="adminAccountCard">
      <div className="adminAccountIdentity">
        <img src={account.avatar_url || FALLBACK_AVATAR} alt="" />
        <div>
          <div className="adminAccountBadges">
            <span className={`accountState ${account.account_status || "active"}`}>
              {account.account_status || "active"}
            </span>
            {account.is_verified && <span className="verifiedState">VERIFIED</span>}
            {account.is_admin && <span className="adminState">ADMIN</span>}
          </div>
          <h3>{account.full_name || account.username || "Bez imena"}</h3>
          <p>@{account.username || "unknown"}</p>
        </div>
      </div>

      <div className="adminAccountMeta">
        <article><span>Uloga</span><strong>{host ? "Host" : "User"}</strong></article>
        <article><span>Lokacija</span><strong>{[account.city, account.country].filter(Boolean).join(" · ") || "—"}</strong></article>
        <article><span>Kreiran</span><strong>{formatDate(account.created_at)}</strong></article>
        <article><span>Status</span><strong>{account.account_status || "active"}</strong></article>
      </div>

      {account.ban_reason && (
        <div className="adminAccountReason">
          <Icon name="alert" size={15} />
          <span>{account.ban_reason}</span>
        </div>
      )}

      {account.account_status === "suspended" && account.suspended_until && (
        <div className="adminAccountReason warning">
          <Icon name="clock" size={15} />
          <span>Do {formatDate(account.suspended_until)}</span>
        </div>
      )}

      <footer>
        <Link to={profileUrl}>Otvori profil <Icon name="arrow" size={14} /></Link>
        <div>
          <button type="button" className="neutral" disabled={working} onClick={onVerify}>
            {account.is_verified ? "Ukloni verifikaciju" : "Verifikuj"}
          </button>
          {blocked ? (
            <button type="button" className="approve" disabled={working} onClick={onRestore}>
              <Icon name="refresh" size={14} /> Vrati nalog
            </button>
          ) : (
            <>
              <button type="button" className="flag" disabled={working || account.is_admin} onClick={onSuspend}>
                <Icon name="clock" size={14} /> Suspenduj
              </button>
              <button type="button" className="reject" disabled={working || account.is_admin} onClick={onBan}>
                <Icon name="alert" size={14} /> Banuj
              </button>
            </>
          )}
        </div>
      </footer>
    </article>
  );
}

function EventAdminCard({ event, working, onToggle }) {
  return (
    <article className="adminContentCard">
      <img src={event.cover_url || FALLBACK_COVER} alt="" />
      <div>
        <header>
          <div>
            <span className={`miniStatus ${event.is_active ? "active" : "inactive"}`}>
              {event.is_active ? "AKTIVAN" : "NEAKTIVAN"}
            </span>
            <h3>{event.title}</h3>
            <p>{[event.location, event.country].filter(Boolean).join(" · ") || "Lokacija nije uneta"}</p>
          </div>
          <Link to={`/event/${event.id}`}>Otvori <Icon name="arrow" size={14} /></Link>
        </header>
        <UserBadge user={event.host} />
        <div className="adminContentMeta">
          <article><span>Početak</span><strong>{formatDate(event.start_date)}</strong></article>
          <article><span>Kapacitet</span><strong>{event.capacity ?? "—"}</strong></article>
          <article><span>Cena</span><strong>{event.price != null ? `${event.price}` : "—"}</strong></article>
        </div>
        <footer>
          <button type="button" className={event.is_active ? "reject" : "approve"} disabled={working} onClick={onToggle}>
            {event.is_active ? "Deaktiviraj" : "Aktiviraj"}
          </button>
        </footer>
      </div>
    </article>
  );
}

function PackageAdminCard({ item, working, onToggle }) {
  return (
    <article className="adminContentCard">
      <img src={item.cover_url || item.image_url || FALLBACK_COVER} alt="" />
      <div>
        <header>
          <div>
            <span className={`miniStatus ${item.is_active ? "active" : "inactive"}`}>
              {item.is_active ? "AKTIVAN" : "NEAKTIVAN"}
            </span>
            <h3>{item.title}</h3>
            <p>{[item.city, item.country].filter(Boolean).join(" · ") || item.location_text || "Lokacija nije uneta"}</p>
          </div>
          <Link to={`/package/${item.id}`}>Otvori <Icon name="arrow" size={14} /></Link>
        </header>
        <UserBadge user={item.host} />
        <div className="adminContentMeta">
          <article><span>Aktivnost</span><strong>{String(item.activity || "—")}</strong></article>
          <article><span>Kapacitet</span><strong>{item.capacity ?? "—"}</strong></article>
          <article><span>Cena</span><strong>{item.price != null ? `${item.price} ${item.currency || ""}` : "—"}</strong></article>
        </div>
        <footer>
          <button type="button" className={item.is_active ? "reject" : "approve"} disabled={working} onClick={onToggle}>
            {item.is_active ? "Deaktiviraj" : "Aktiviraj"}
          </button>
        </footer>
      </div>
    </article>
  );
}

function BookingAdminCard({ booking, working, onStatus }) {
  return (
    <article className="adminBookingCard">
      <header>
        <div>
          <span className={`bookingStatus ${booking.status || "pending"}`}>{booking.status || "pending"}</span>
          <h3>{booking.package?.title || "Paket"}</h3>
          <p>{formatDate(booking.created_at)}</p>
        </div>
        <strong>{booking.total_amount != null ? `${booking.total_amount} ${booking.currency || ""}` : "—"}</strong>
      </header>

      <div className="adminBookingPeople">
        <div><span>KORISNIK</span><UserBadge user={booking.user} /></div>
        <div><span>HOST</span><UserBadge user={booking.host} /></div>
      </div>

      <div className="adminContentMeta four">
        <article><span>Gosti</span><strong>{booking.guests ?? "—"}</strong></article>
        <article><span>Plaćanje</span><strong>{booking.payment_status || "—"}</strong></article>
        <article><span>Email</span><strong>{booking.email || "—"}</strong></article>
        <article><span>Telefon</span><strong>{booking.phone || "—"}</strong></article>
      </div>

      <footer>
        <button type="button" className="approve" disabled={working} onClick={() => onStatus("approved")}>Odobri</button>
        <button type="button" className="flag" disabled={working} onClick={() => onStatus("completed")}>Završi</button>
        <button type="button" className="neutral" disabled={working} onClick={() => onStatus("cancelled")}>Otkaži</button>
        <button type="button" className="reject" disabled={working} onClick={() => onStatus("rejected")}>Odbij</button>
      </footer>
    </article>
  );
}

function AllPlaceCard({ place, working, onToggle }) {
  return (
    <article className="adminCompactPlace">
      <img src={place.cover_url || FALLBACK_COVER} alt="" />
      <div>
        <span>{place.place_categories?.name || "Outdoor"}</span>
        <h3>{place.name}</h3>
        <p>{[place.locality, place.region].filter(Boolean).join(" · ") || "Srbija"}</p>
        <div className="adminCompactStats">
          <small>{place.checkins_count || 0} check-in</small>
          <small>{place.photos_count || 0} slika</small>
          <small>{place.visitors_count || 0} poseta</small>
        </div>
      </div>
      <footer>
        <Link to={`/explore/${place.id}`}>Otvori</Link>
        <button type="button" className={place.is_active ? "reject" : "approve"} disabled={working} onClick={onToggle}>
          {place.is_active ? "Sakrij" : "Aktiviraj"}
        </button>
      </footer>
    </article>
  );
}

function PhotoAdminCard({ photo, working, onModerate }) {
  return (
    <article className="adminPhotoCard">
      <div className="adminPhotoVisual">
        <img src={photo.image_url} alt="" />
        <span className={`status ${photo.moderation_status}`}>{moderationLabel(photo.moderation_status)}</span>
      </div>
      <div>
        <h3>{photo.places?.name || "Outdoor mesto"}</h3>
        <p>{photo.caption || "Bez opisa"}</p>
        <UserBadge user={photo.profiles} />
        <small>{formatDate(photo.created_at)}</small>
        <footer>
          <button type="button" className="approve" disabled={working} onClick={() => onModerate("approved")}>Odobri</button>
          <button type="button" className="reject" disabled={working} onClick={() => onModerate("rejected")}>Odbij</button>
        </footer>
      </div>
    </article>
  );
}

function CommentAdminRow({ item, working, onReject, onDelete }) {
  return (
    <article className="adminCommentRow">
      <span className={`commentSource ${item.source}`}>{item.source}</span>
      <div>
        <div className="adminCommentHead">
          <strong>{item.author?.full_name || item.author?.username || "Korisnik"}</strong>
          <small>{formatDate(item.created_at)}</small>
        </div>
        <p>{item.body}</p>
        <span>{item.sourceTitle}</span>
      </div>
      <div className="adminCommentActions">
        {onReject && <button type="button" className="reject" disabled={working} onClick={onReject}>Sakrij</button>}
        {onDelete && <button type="button" className="reject" disabled={working} onClick={onDelete}>Obriši</button>}
      </div>
    </article>
  );
}

function ReportAdminCard({ report, working, onResolve }) {
  return (
    <article className="adminReportCard">
      <header>
        <span className={`reportStatus ${report.status}`}>{report.status}</span>
        <small>{formatDate(report.created_at)}</small>
      </header>
      <h3>{report.reason}</h3>
      <p>{report.details || "Nema dodatnog opisa."}</p>
      <div className="adminContentMeta">
        <article><span>Tip</span><strong>{report.entity_type}</strong></article>
        <article><span>Entity ID</span><strong>{report.entity_id || "—"}</strong></article>
        <article><span>Place ID</span><strong>{report.place_id || "—"}</strong></article>
      </div>
      {report.status !== "resolved" && (
        <footer><button type="button" className="approve" disabled={working} onClick={onResolve}>Označi rešeno</button></footer>
      )}
    </article>
  );
}

function DocumentAdminCard({ document }) {
  const expired = document.expires_at && new Date(document.expires_at).getTime() < Date.now();
  const expiresSoon = document.expires_at && !expired && new Date(document.expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <article className="adminDocumentCard">
      <div className={`documentIcon ${expired ? "expired" : expiresSoon ? "warning" : "ok"}`}>
        <Icon name="shield" size={22} />
      </div>
      <div>
        <span>{document.document_type}</span>
        <h3>{document.title}</h3>
        <UserBadge user={document.host} />
        <p>{document.notes || "Bez napomene."}</p>
        <div className="adminDocumentDates">
          <small>Izdat: {document.issued_at || "—"}</small>
          <small>Ističe: {document.expires_at || "—"}</small>
        </div>
      </div>
      {document.file_url && (
        <a href={document.file_url} target="_blank" rel="noreferrer">Otvori dokument <Icon name="arrow" size={14} /></a>
      )}
    </article>
  );
}

function NotificationAdminRow({ item }) {
  return (
    <article className="adminNotificationRow">
      <span><Icon name="menu" size={16} /></span>
      <div>
        <small>{item.type || "notification"}</small>
        <strong>{item.title}</strong>
        <p>{item.message || "Bez poruke."}</p>
      </div>
      <div>
        <small>{item.is_read ? "PROČITANO" : "NOVO"}</small>
        <span>{formatDate(item.created_at)}</span>
      </div>
    </article>
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
      :root{--admin-bg:#07110b;--admin-surface:#0b1810;--admin-surface-2:#0f2116;--admin-line:rgba(255,255,255,.08);--admin-text:#f7fbf7;--admin-muted:rgba(255,255,255,.46);--admin-accent:#baff9e;--admin-accent-2:#83d96d;--admin-warn:#ffd374;--admin-danger:#ff8c80;--admin-radius:24px}
      body{margin:0;background:var(--admin-bg)}
      button,input,textarea{font:inherit}
      button{touch-action:manipulation}
      .adminExplore,.adminLoading{min-height:100vh;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .adminExplore{padding:116px 24px 84px;background:radial-gradient(circle at 10% 0%,rgba(186,255,158,.10),transparent 24%),radial-gradient(circle at 88% 16%,rgba(99,141,255,.07),transparent 22%),linear-gradient(180deg,#07110b 0%,#08130d 38%,#06100a 100%);color:var(--admin-text)}
      .adminExplore a{color:inherit;text-decoration:none}
      .adminExplore h1,.adminExplore h2,.adminExplore h3,.adminExplore p,.adminExplore strong,.adminExplore span,.adminExplore small,.adminExplore em,.adminExplore b{overflow-wrap:anywhere}
      .adminExplore img{display:block;max-width:100%}

      .adminHero{position:relative;isolation:isolate;width:min(1480px,100%);min-height:560px;margin:0 auto;padding:30px;overflow:hidden;border:1px solid rgba(255,255,255,.10);border-radius:36px;background:radial-gradient(circle at 86% 14%,rgba(186,255,158,.17),transparent 24%),radial-gradient(circle at 70% 88%,rgba(88,125,255,.09),transparent 26%),linear-gradient(135deg,#06110a,#0d2818 56%,#173d26);box-shadow:0 36px 100px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
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
      .adminHeroCopy h1{max-width:1080px;margin:16px 0 0;font-size:clamp(58px,7.2vw,108px);line-height:.86;letter-spacing:-.075em;text-wrap:balance}
      .adminHeroCopy p{max-width:680px;margin:20px 0 0;color:rgba(255,255,255,.52);font-size:11px;line-height:1.75}
      .adminHeroStats{position:absolute;right:28px;bottom:28px;left:28px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .adminHeroStats article{min-width:0;padding:16px;border:1px solid rgba(255,255,255,.10);border-radius:17px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));backdrop-filter:blur(18px);box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
      .adminHeroStats span,.adminHeroStats strong,.adminHeroStats small{display:block}
      .adminHeroStats span{color:rgba(255,255,255,.42);font-size:6px;font-weight:850;text-transform:uppercase}
      .adminHeroStats strong{margin-top:5px;font-size:24px}
      .adminHeroStats small{margin-top:3px;color:#baff9e;font-size:6px}
      .adminWorkspace{display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px;width:min(1480px,100%);margin:16px auto 0}
      .adminSidebar{position:sticky;top:94px;align-self:start;padding:16px;border:1px solid rgba(255,255,255,.085);border-radius:24px;background:linear-gradient(180deg,rgba(14,34,21,.98),rgba(8,21,13,.98));box-shadow:0 24px 70px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.035)}
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
      .adminMain{min-width:0;padding:22px;border:1px solid rgba(255,255,255,.085);border-radius:26px;background:linear-gradient(180deg,rgba(14,31,20,.98),rgba(9,21,14,.98));box-shadow:0 24px 70px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.025)}
      .adminMainHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding-bottom:15px;border-bottom:1px solid rgba(255,255,255,.07)}
      .adminMainHeader>div>span{color:#baff9e;font-size:6px;font-weight:900;letter-spacing:.11em}
      .adminMainHeader h2{margin:5px 0 0;font-size:30px;line-height:1.1;letter-spacing:-.045em;text-wrap:balance}
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
      .adminPriorityGrid>button{display:grid;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:11px;min-width:0;padding:13px;border:1px solid rgba(255,255,255,.07);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.032),rgba(255,255,255,.018));color:#fff;text-align:left;cursor:pointer;transition:transform .18s ease,border-color .18s ease,background .18s ease}
      .adminPriorityGrid>button>span{display:grid;place-items:center;width:44px;height:44px;border-radius:13px}
      .adminPriorityGrid>button>span.green{background:rgba(186,255,158,.09);color:#baff9e}
      .adminPriorityGrid>button>span.amber{background:rgba(255,211,116,.09);color:#ffd374}
      .adminPriorityGrid>button>span.red{background:rgba(255,108,93,.09);color:#ff8c80}
      .adminPriorityGrid small,.adminPriorityGrid strong,.adminPriorityGrid p{display:block}
      .adminPriorityGrid small{color:rgba(255,255,255,.35);font-size:5px;font-weight:900}
      .adminPriorityGrid strong{margin-top:3px;font-size:18px}
      .adminPriorityGrid p{margin:4px 0 0;color:rgba(255,255,255,.38);font-size:7px;line-height:1.45}
      .adminPulseHead>button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#baff9e;cursor:pointer;font-size:6px;font-weight:850}
      .adminCards{display:grid;gap:10px;margin-top:14px}
      .adminPlaceCard{display:grid;grid-template-columns:minmax(240px,300px) minmax(0,1fr);overflow:hidden;border:1px solid rgba(255,255,255,.075);border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.018));box-shadow:0 14px 36px rgba(0,0,0,.14)}
      .adminPlaceImage{position:relative;min-height:275px}
      .adminPlaceImage>img{width:100%;height:100%;object-fit:cover}
      .adminPlaceImage:after{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,15,9,.06),rgba(5,15,9,.55));content:""}
      .adminPlaceImage .status{position:absolute;top:10px;left:10px;z-index:2;padding:7px 8px;border-radius:999px;background:rgba(3,11,6,.72);font-size:6px;font-weight:900;backdrop-filter:blur(12px)}
      .adminPlaceImage .status.pending{color:#ffd374}
      .adminPlaceImage .status.flagged{color:#ff9b90}
      .adminPlaceImage>b{position:absolute;right:10px;bottom:10px;left:10px;z-index:2;display:flex;align-items:center;gap:6px;padding:8px;border-radius:9px;background:rgba(3,11,6,.7);color:#f1d17f;font-size:6px}
      .adminPlaceBody{min-width:0;padding:17px}
      .adminPlaceBody>header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
      .adminPlaceBody>header span{color:#baff9e;font-size:6px;font-weight:900;text-transform:uppercase}
      .adminPlaceBody>header h3{margin:5px 0 0;font-size:24px;line-height:1.08;letter-spacing:-.04em;text-wrap:balance}
      .adminPlaceBody>header p{display:flex;align-items:center;gap:5px;margin:5px 0 0;color:rgba(255,255,255,.38);font-size:6px}
      .adminPlaceBody>header>a{display:inline-flex;align-items:center;gap:5px;min-height:33px;padding:0 9px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.035);font-size:6px;font-weight:850}
      .adminUserBadge{display:flex;align-items:center;gap:8px;width:max-content;max-width:100%;margin-top:12px}
      .adminUserBadge img{width:38px;height:38px;border-radius:11px;object-fit:cover}
      .adminUserBadge strong,.adminUserBadge span{display:block}
      .adminUserBadge strong{font-size:7px}
      .adminUserBadge span{margin-top:2px;color:rgba(255,255,255,.35);font-size:6px}
      .adminPlaceMeta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:14px}
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
      .adminCheckinCard{min-width:0;padding:17px;border:1px solid rgba(255,255,255,.075);border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.018));box-shadow:0 14px 36px rgba(0,0,0,.14)}
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
      .adminRiskGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}
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
      .adminLogList>article{display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:10px;min-width:0;padding:11px;border:1px solid rgba(255,255,255,.055);border-radius:13px;background:rgba(255,255,255,.022)}
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
      .adminRefresh,.adminSidebar nav button,.adminPriorityGrid>button,.adminPlaceBody>footer button,.adminCheckinCard footer button,.adminModal footer button,.adminSearch button{transition:transform .18s ease,border-color .18s ease,background .18s ease,opacity .18s ease}
      .adminRefresh:hover,.adminPriorityGrid>button:hover,.adminPlaceBody>footer button:hover,.adminCheckinCard footer button:hover{transform:translateY(-1px)}
      .adminPriorityGrid>button:hover{border-color:rgba(186,255,158,.16);background:rgba(186,255,158,.035)}
      .adminSidebar nav button:hover{background:rgba(255,255,255,.035);color:#fff}
      .adminSearch:focus-within{border-color:rgba(186,255,158,.28);box-shadow:0 0 0 3px rgba(186,255,158,.05)}
      .adminPlaceMeta strong,.adminRiskGrid strong,.adminLogList strong,.adminUserBadge strong{min-width:0;overflow:hidden;text-overflow:ellipsis}
      .adminPlaceDescription,.adminRiskReason strong,.adminLogList p,.adminLogList em{word-break:break-word}
      .adminMainHeader>div,.adminPlaceBody>header>div,.adminCheckinPlace>div,.adminUserBadge>div,.adminPulseHead>div{min-width:0}

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
        .adminHeroCopy h1{font-size:50px;line-height:.9}
        .adminHeroStats{right:18px;bottom:18px;left:18px}
        .adminRefresh{width:40px;padding:0;justify-content:center}
        .adminRefresh{font-size:0}
        .adminSidebar{padding:8px;overflow-x:auto}
        .adminSidebarTitle{display:none}
        .adminSidebar nav{display:flex;margin:0;min-width:max-content}
        .adminSidebar nav button{grid-template-columns:32px auto;min-width:max-content;padding-right:10px}
        .adminMain{padding:14px;border-radius:20px}
        .adminMainHeader{align-items:stretch;flex-direction:column}
        .adminSearch{width:100%}
      }

      @media(max-width:500px){
        .adminHeroCopy h1{font-size:42px;line-height:.92}
        .adminHeroStats{gap:5px}
        .adminHeroStats article{padding:10px}
        .adminPlaceBody>header{flex-direction:column}
        .adminPlaceBody>footer{display:grid;grid-template-columns:1fr 1fr;gap:8px}
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

      /* ===== PREMIUM ADMIN UX OVERRIDES ===== */
      :root{
        --admin-bg:#061009;
        --admin-panel:#0b1810;
        --admin-panel-2:#0f2016;
        --admin-line:rgba(255,255,255,.085);
        --admin-line-strong:rgba(255,255,255,.14);
        --admin-muted:rgba(255,255,255,.52);
        --admin-soft:rgba(255,255,255,.34);
        --admin-green:#baff9e;
        --admin-amber:#ffd374;
        --admin-red:#ff9488;
      }

      .adminExplore{
        padding:104px 24px 80px;
        background:
          radial-gradient(circle at 12% -5%,rgba(186,255,158,.10),transparent 25%),
          radial-gradient(circle at 92% 14%,rgba(74,140,255,.06),transparent 24%),
          linear-gradient(180deg,#061009 0%,#07120b 58%,#061009 100%);
      }

      .adminHero{
        min-height:470px;
        padding:30px 32px;
        border-radius:30px;
        border-color:rgba(255,255,255,.10);
        background:
          radial-gradient(circle at 88% 12%,rgba(186,255,158,.17),transparent 23%),
          radial-gradient(circle at 70% 94%,rgba(63,111,255,.08),transparent 28%),
          linear-gradient(135deg,#07130c 0%,#0e2b1a 58%,#163e27 100%);
      }

      .adminHeroTop{position:relative;z-index:2}
      .adminBrand>span{width:50px;height:50px;border-radius:16px}
      .adminBrand small{font-size:7px;letter-spacing:.16em}
      .adminBrand strong{font-size:13px;letter-spacing:-.02em}
      .adminRefresh{min-height:44px;padding:0 14px;border-radius:13px;font-size:8px;transition:.18s ease}
      .adminRefresh:hover{transform:translateY(-1px);border-color:rgba(186,255,158,.25);background:rgba(186,255,158,.08)}

      .adminHeroCopy{max-width:900px;padding-top:64px}
      .adminEyebrow{font-size:8px;letter-spacing:.14em}
      .adminHeroCopy h1{max-width:980px;margin-top:17px;font-size:clamp(52px,6.8vw,96px);line-height:.86;letter-spacing:-.072em;text-wrap:balance}
      .adminHeroCopy p{max-width:680px;margin-top:20px;font-size:12px;line-height:1.72;color:rgba(255,255,255,.58)}

      .adminHeroStats{right:32px;bottom:28px;left:32px;gap:10px}
      .adminHeroStats article{min-height:92px;padding:15px 16px;border-radius:16px;background:rgba(2,10,5,.42)}
      .adminHeroStats span{font-size:7px;letter-spacing:.05em}
      .adminHeroStats strong{font-size:28px;line-height:1}
      .adminHeroStats small{font-size:7px;line-height:1.35}

      .adminWorkspace{grid-template-columns:260px minmax(0,1fr);gap:16px;margin-top:16px}
      .adminSidebar{top:92px;padding:14px;border-radius:20px;background:linear-gradient(180deg,rgba(13,31,20,.98),rgba(8,19,12,.98));box-shadow:0 22px 70px rgba(0,0,0,.22)}
      .adminSidebarTitle{padding:7px 7px 16px}
      .adminSidebarTitle span{font-size:7px}
      .adminSidebarTitle strong{font-size:18px;letter-spacing:-.03em}
      .adminSidebar nav{gap:6px;margin-top:12px}
      .adminSidebar nav button{grid-template-columns:38px minmax(0,1fr) auto;gap:10px;min-height:52px;padding:7px 8px;border-radius:13px;transition:.18s ease}
      .adminSidebar nav button:hover{background:rgba(255,255,255,.045);color:#fff}
      .adminSidebar nav button>span{width:38px;height:38px;border-radius:11px}
      .adminSidebar nav button strong{min-width:0;font-size:8px;line-height:1.3;white-space:normal;overflow-wrap:anywhere}
      .adminSidebar nav button b{min-width:25px;height:25px;font-size:7px}
      .adminSidebarHealth{padding:13px;border-radius:14px}
      .adminSidebarHealth strong{font-size:8px;line-height:1.4}
      .adminSidebarHealth small{font-size:7px;line-height:1.55}

      .adminMain{padding:22px;border-radius:22px;background:linear-gradient(180deg,#0b1910,#09160e);box-shadow:0 22px 70px rgba(0,0,0,.19)}
      .adminMainHeader{align-items:center;gap:16px;padding-bottom:18px}
      .adminMainHeader>div{min-width:0}
      .adminMainHeader>div>span{font-size:7px;letter-spacing:.13em}
      .adminMainHeader h2{margin-top:6px;font-size:clamp(23px,3vw,34px);line-height:1.08;text-wrap:balance}
      .adminSearch{width:min(360px,100%);min-height:46px;padding:0 12px;border-radius:13px}
      .adminSearch input{font-size:8px}

      .adminMessage{padding:12px 14px;border-radius:13px;font-size:8px;line-height:1.5}
      .adminOverview{gap:14px;margin-top:16px}
      .adminPriority,.adminPulse{padding:18px;border-radius:18px}
      .adminPriority>header h3,.adminPulseHead h3{font-size:21px}
      .adminPriority>header>b{min-width:46px;height:46px;font-size:14px}
      .adminPriorityGrid{gap:10px;margin-top:14px}
      .adminPriorityGrid>button{grid-template-columns:48px minmax(0,1fr) auto;gap:11px;min-height:108px;padding:14px;border-radius:15px;transition:.18s ease}
      .adminPriorityGrid>button:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.045)}
      .adminPriorityGrid>button>span{width:48px;height:48px;border-radius:14px}
      .adminPriorityGrid small{font-size:6px}
      .adminPriorityGrid strong{font-size:22px}
      .adminPriorityGrid p{font-size:7px;line-height:1.5;white-space:normal;overflow-wrap:anywhere}

      .adminCards{gap:12px;margin-top:16px}
      .adminPlaceCard{grid-template-columns:minmax(220px,30%) minmax(0,1fr);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.018));box-shadow:0 12px 34px rgba(0,0,0,.10)}
      .adminPlaceImage{min-height:310px}
      .adminPlaceImage .status{top:12px;left:12px;padding:8px 10px;font-size:7px}
      .adminPlaceImage>b{right:12px;bottom:12px;left:12px;padding:9px 10px;font-size:7px;line-height:1.35}
      .adminPlaceBody{min-width:0;padding:18px}
      .adminPlaceBody>header{gap:16px}
      .adminPlaceBody>header>div{min-width:0}
      .adminPlaceBody>header span{font-size:7px}
      .adminPlaceBody>header h3{max-width:100%;margin-top:5px;font-size:clamp(22px,2.4vw,31px);line-height:1.04;letter-spacing:-.045em;overflow-wrap:anywhere;text-wrap:balance}
      .adminPlaceBody>header p{font-size:7px;line-height:1.4;white-space:normal}
      .adminPlaceBody>header>a{flex:0 0 auto;min-height:38px;padding:0 11px;border-radius:10px;font-size:7px}
      .adminUserBadge{margin-top:14px;min-width:0}
      .adminUserBadge img{width:42px;height:42px;border-radius:12px}
      .adminUserBadge>div{min-width:0}
      .adminUserBadge strong{max-width:250px;font-size:8px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .adminUserBadge span{font-size:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .adminPlaceMeta{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}
      .adminPlaceMeta article{min-width:0;padding:10px;border-radius:11px}
      .adminPlaceMeta span{font-size:6px;letter-spacing:.04em}
      .adminPlaceMeta strong{margin-top:4px;font-size:7px;line-height:1.35;white-space:normal;overflow-wrap:anywhere}
      .adminPlaceDescription{margin-top:12px;font-size:8px;line-height:1.65}
      .adminPlaceBody>footer{flex-wrap:wrap;gap:8px;margin-top:15px;padding-top:14px}
      .adminPlaceBody>footer button,.adminCheckinCard footer button{min-height:42px;padding:0 12px;border-radius:11px;font-size:7px}

      .adminCheckinCard{padding:18px;border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.018))}
      .adminCheckinTop{gap:14px}
      .adminCheckinPlace{min-width:0}
      .adminCheckinPlace>img{flex:0 0 auto;width:82px;height:82px;border-radius:15px}
      .adminCheckinPlace>div{min-width:0}
      .adminCheckinPlace span{font-size:6px}
      .adminCheckinPlace h3{max-width:100%;margin-top:5px;font-size:20px;line-height:1.1;overflow-wrap:anywhere}
      .adminCheckinPlace p{font-size:7px;line-height:1.4;white-space:normal}
      .adminSource{flex:0 0 auto;padding:8px 10px;font-size:7px}
      .adminRiskGrid{gap:8px;margin-top:14px}
      .adminRiskGrid article{min-width:0;padding:12px;border-radius:12px}
      .adminRiskGrid span{font-size:6px}
      .adminRiskGrid strong{font-size:11px;line-height:1.3;overflow-wrap:anywhere}
      .adminRiskGrid small{font-size:6px;line-height:1.4;white-space:normal}
      .adminRiskReason{margin-top:10px;padding:12px;border-radius:12px}
      .adminRiskReason span{font-size:6px}
      .adminRiskReason strong{font-size:8px;line-height:1.55;overflow-wrap:anywhere}
      .adminCheckinCard>footer{flex-wrap:wrap;gap:10px;margin-top:14px;padding-top:14px}
      .adminCheckinCard>footer>a{font-size:7px}

      .adminLogList{gap:8px;margin-top:16px}
      .adminLogList>article{grid-template-columns:40px minmax(0,1fr) auto;gap:10px;padding:11px 12px;border-radius:12px}
      .adminLogIcon{width:40px;height:40px;border-radius:11px}
      .adminLogList>article>div{min-width:0}
      .adminLogList strong{font-size:8px}
      .adminLogList p{font-size:7px;line-height:1.45;overflow-wrap:anywhere}
      .adminLogList em{font-size:7px;line-height:1.45}
      .adminLogList>article>small{font-size:6px;white-space:nowrap}

      .adminEmpty{padding:76px 24px;border-radius:20px}
      .adminEmpty>span{width:66px;height:66px;border-radius:20px}
      .adminEmpty strong{font-size:16px}
      .adminEmpty p{font-size:8px;line-height:1.6}

      .adminModal>section{padding:20px;border-radius:22px}
      .adminModal header h2{font-size:26px;line-height:1.08}
      .adminModal header p{font-size:8px;line-height:1.6}
      .adminModal label>span{font-size:7px}
      .adminModal textarea{min-height:135px;padding:12px;border-radius:12px;font-size:9px;line-height:1.55}
      .adminModal footer button{min-height:42px;padding:0 13px;font-size:8px}

      /* Global anti-overlap rules for admin UI */
      .adminExplore *{min-width:0}
      .adminExplore h1,.adminExplore h2,.adminExplore h3,.adminExplore p,.adminExplore strong,.adminExplore small,.adminExplore span{overflow-wrap:anywhere}
      .adminExplore button{line-height:1.2}
      .adminExplore img{max-width:100%}


      /* =========================================================
         FULL APP CONTROL CENTER
         ========================================================= */
      .adminSidebar{max-height:calc(100vh - 116px);overflow:hidden}
      .adminSidebar nav{max-height:calc(100vh - 310px);overflow-y:auto;padding-right:3px;scrollbar-width:thin;scrollbar-color:rgba(186,255,158,.22) transparent}
      .adminSidebar nav::-webkit-scrollbar{width:5px}.adminSidebar nav::-webkit-scrollbar-thumb{border-radius:999px;background:rgba(186,255,158,.2)}
      .adminGlobalOverview{padding:18px;border:1px solid rgba(186,255,158,.11);border-radius:20px;background:radial-gradient(circle at 92% 0%,rgba(186,255,158,.1),transparent 25%),linear-gradient(145deg,rgba(13,38,23,.94),rgba(8,23,14,.94));box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
      .adminGlobalOverview>header{display:flex;align-items:flex-end;justify-content:space-between;gap:15px}
      .adminGlobalOverview>header span{color:#baff9e;font-size:6px;font-weight:950;letter-spacing:.12em}.adminGlobalOverview>header h3{margin:5px 0 0;font-size:22px;letter-spacing:-.04em}.adminGlobalOverview>header small{color:rgba(255,255,255,.38);font-size:6px}
      .adminGlobalGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:15px}
      .adminGlobalGrid button{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;column-gap:9px;min-height:82px;padding:10px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.035);color:#fff;text-align:left;cursor:pointer;transition:.18s ease}
      .adminGlobalGrid button:hover{transform:translateY(-2px);border-color:rgba(186,255,158,.2);background:rgba(186,255,158,.06)}
      .adminGlobalGrid button>span{grid-row:1/3;display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:rgba(186,255,158,.08);color:#baff9e}.adminGlobalGrid button>strong{font-size:20px;line-height:1}.adminGlobalGrid button>small{color:rgba(255,255,255,.38);font-size:6px;text-transform:uppercase}

      .adminEntityGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}.adminEntityGrid.wide{grid-template-columns:1fr}
      .adminAccountCard,.adminBookingCard,.adminReportCard,.adminDocumentCard,.adminCompactPlace,.adminContentCard{border:1px solid rgba(255,255,255,.08);border-radius:18px;background:linear-gradient(145deg,rgba(15,34,22,.96),rgba(9,23,14,.96));box-shadow:0 18px 42px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.025)}
      .adminAccountCard{padding:15px}.adminAccountIdentity{display:flex;align-items:center;gap:11px}.adminAccountIdentity>img{width:58px;height:58px;border:2px solid rgba(255,255,255,.12);border-radius:17px;object-fit:cover}.adminAccountIdentity h3{margin:5px 0 0;font-size:15px;letter-spacing:-.03em}.adminAccountIdentity p{margin:3px 0 0;color:rgba(255,255,255,.36);font-size:7px}.adminAccountBadges{display:flex;flex-wrap:wrap;gap:5px}.adminAccountBadges span{padding:4px 6px;border-radius:999px;font-size:5px;font-weight:950;letter-spacing:.06em;text-transform:uppercase}.accountState.active{background:rgba(186,255,158,.1);color:#baff9e}.accountState.banned{background:rgba(255,140,128,.12);color:#ff9f95}.accountState.suspended{background:rgba(255,211,116,.11);color:#ffd374}.verifiedState{background:rgba(117,172,255,.12);color:#a9c9ff}.adminState{background:#baff9e;color:#102619}
      .adminAccountMeta,.adminContentMeta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:12px}.adminAccountMeta{grid-template-columns:repeat(2,minmax(0,1fr))}.adminContentMeta.four{grid-template-columns:repeat(4,minmax(0,1fr))}.adminAccountMeta article,.adminContentMeta article{padding:9px;border:1px solid rgba(255,255,255,.055);border-radius:10px;background:rgba(255,255,255,.025)}.adminAccountMeta span,.adminContentMeta span{display:block;color:rgba(255,255,255,.29);font-size:5px;text-transform:uppercase}.adminAccountMeta strong,.adminContentMeta strong{display:block;margin-top:3px;color:#fff;font-size:7px;line-height:1.35}
      .adminAccountReason{display:flex;align-items:flex-start;gap:7px;margin-top:10px;padding:9px;border:1px solid rgba(255,140,128,.12);border-radius:10px;background:rgba(255,140,128,.055);color:#ffaaa1;font-size:7px;line-height:1.45}.adminAccountReason.warning{border-color:rgba(255,211,116,.12);background:rgba(255,211,116,.055);color:#ffd374}.adminAccountCard>footer,.adminContentCard footer,.adminBookingCard>footer,.adminReportCard>footer{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)}.adminAccountCard>footer>a,.adminContentCard header>a{display:inline-flex;align-items:center;gap:5px;color:#baff9e;font-size:7px;font-weight:850}.adminAccountCard>footer>div{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}
      .adminAccountCard button,.adminContentCard button,.adminBookingCard button,.adminReportCard button,.adminCommentRow button,.adminCompactPlace button,.adminPhotoCard button{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:34px;padding:0 9px;border-radius:9px;cursor:pointer;font-size:6px;font-weight:850}.adminAccountCard button:disabled,.adminContentCard button:disabled,.adminBookingCard button:disabled,.adminReportCard button:disabled,.adminCommentRow button:disabled,.adminCompactPlace button:disabled,.adminPhotoCard button:disabled{opacity:.45;cursor:default}.neutral{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);color:#fff}.approve{border:1px solid rgba(186,255,158,.18)!important;background:rgba(186,255,158,.09)!important;color:#cfffbd!important}.flag{border:1px solid rgba(255,211,116,.16)!important;background:rgba(255,211,116,.08)!important;color:#ffd374!important}.reject{border:1px solid rgba(255,140,128,.16)!important;background:rgba(255,140,128,.08)!important;color:#ff9f95!important}

      .adminContentCard{display:grid;grid-template-columns:170px minmax(0,1fr);overflow:hidden}.adminContentCard>img{width:100%;height:100%;min-height:220px;object-fit:cover}.adminContentCard>div{padding:15px}.adminContentCard header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.adminContentCard h3{margin:6px 0 0;font-size:18px;letter-spacing:-.04em}.adminContentCard header p{margin:4px 0 0;color:rgba(255,255,255,.36);font-size:7px}.miniStatus,.bookingStatus,.reportStatus{display:inline-flex;padding:4px 6px;border-radius:999px;font-size:5px;font-weight:950;letter-spacing:.07em;text-transform:uppercase}.miniStatus.active{background:rgba(186,255,158,.1);color:#baff9e}.miniStatus.inactive{background:rgba(255,140,128,.1);color:#ff9f95}

      .adminBookingCard{padding:16px}.adminBookingCard>header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.adminBookingCard>header h3{margin:7px 0 0;font-size:17px}.adminBookingCard>header p{margin:3px 0 0;color:rgba(255,255,255,.33);font-size:6px}.adminBookingCard>header>strong{font-size:18px;color:#baff9e}.bookingStatus{background:rgba(255,211,116,.08);color:#ffd374}.bookingStatus.approved,.bookingStatus.completed{background:rgba(186,255,158,.09);color:#baff9e}.bookingStatus.rejected,.bookingStatus.cancelled{background:rgba(255,140,128,.09);color:#ff9f95}.adminBookingPeople{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px}.adminBookingPeople>div{padding:9px;border:1px solid rgba(255,255,255,.055);border-radius:11px;background:rgba(255,255,255,.025)}.adminBookingPeople>div>span{display:block;margin-bottom:7px;color:rgba(255,255,255,.28);font-size:5px;font-weight:900}

      .adminCompactPlace{display:grid;grid-template-columns:105px minmax(0,1fr) auto;align-items:center;gap:12px;padding:9px}.adminCompactPlace>img{width:105px;height:90px;border-radius:12px;object-fit:cover}.adminCompactPlace>div>span{color:#baff9e;font-size:5px;font-weight:900;text-transform:uppercase}.adminCompactPlace h3{margin:4px 0 0;font-size:14px}.adminCompactPlace p{margin:3px 0 0;color:rgba(255,255,255,.34);font-size:6px}.adminCompactStats{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.adminCompactStats small{padding:4px 6px;border-radius:999px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.42);font-size:5px}.adminCompactPlace>footer{display:grid;gap:6px}.adminCompactPlace>footer>a{display:grid;place-items:center;min-height:34px;padding:0 9px;border-radius:9px;background:rgba(255,255,255,.05);color:#baff9e;font-size:6px;font-weight:850}

      .adminPhotoGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:16px}.adminPhotoCard{overflow:hidden;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:linear-gradient(145deg,rgba(15,34,22,.96),rgba(9,23,14,.96))}.adminPhotoVisual{position:relative;height:220px}.adminPhotoVisual>img{width:100%;height:100%;object-fit:cover}.adminPhotoVisual>.status{position:absolute;top:8px;left:8px}.adminPhotoCard>div:last-child{padding:12px}.adminPhotoCard h3{margin:0;font-size:12px}.adminPhotoCard p{display:-webkit-box;margin:5px 0 9px;overflow:hidden;color:rgba(255,255,255,.38);font-size:7px;line-height:1.45;-webkit-line-clamp:2;-webkit-box-orient:vertical}.adminPhotoCard>div:last-child>small{display:block;margin-top:8px;color:rgba(255,255,255,.25);font-size:5px}.adminPhotoCard footer{display:flex;gap:6px;margin-top:9px}

      .adminCommentList,.adminNotificationList{display:grid;gap:7px;margin-top:16px}.adminCommentRow{display:grid;grid-template-columns:70px minmax(0,1fr) auto;align-items:center;gap:11px;padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.025)}.commentSource{display:grid;place-items:center;min-height:32px;border-radius:9px;background:rgba(186,255,158,.07);color:#baff9e;font-size:5px;font-weight:950;text-transform:uppercase}.commentSource.event{background:rgba(117,172,255,.08);color:#a9c9ff}.commentSource.package{background:rgba(255,211,116,.08);color:#ffd374}.adminCommentHead{display:flex;align-items:center;justify-content:space-between;gap:10px}.adminCommentHead strong{font-size:8px}.adminCommentHead small{color:rgba(255,255,255,.28);font-size:5px}.adminCommentRow p{margin:5px 0 0;color:rgba(255,255,255,.55);font-size:8px;line-height:1.5}.adminCommentRow>div>span{display:block;margin-top:5px;color:#baff9e;font-size:5px}.adminCommentActions{display:flex;gap:5px}

      .adminReportCard{padding:15px}.adminReportCard>header{display:flex;align-items:center;justify-content:space-between;gap:10px}.adminReportCard>header>small{color:rgba(255,255,255,.28);font-size:5px}.reportStatus{background:rgba(255,211,116,.08);color:#ffd374}.reportStatus.resolved{background:rgba(186,255,158,.08);color:#baff9e}.adminReportCard h3{margin:10px 0 0;font-size:15px}.adminReportCard>p{margin:6px 0 0;color:rgba(255,255,255,.43);font-size:8px;line-height:1.55}

      .adminDocumentCard{display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;gap:12px;padding:14px}.documentIcon{display:grid;place-items:center;width:52px;height:52px;border-radius:15px}.documentIcon.ok{background:rgba(186,255,158,.09);color:#baff9e}.documentIcon.warning{background:rgba(255,211,116,.09);color:#ffd374}.documentIcon.expired{background:rgba(255,140,128,.09);color:#ff9f95}.adminDocumentCard>div:nth-child(2)>span{color:#baff9e;font-size:5px;font-weight:900;text-transform:uppercase}.adminDocumentCard h3{margin:4px 0 8px;font-size:13px}.adminDocumentCard p{margin:8px 0 0;color:rgba(255,255,255,.36);font-size:7px}.adminDocumentDates{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.adminDocumentDates small{color:rgba(255,255,255,.3);font-size:5px}.adminDocumentCard>a{display:inline-flex;align-items:center;gap:5px;padding:9px;border-radius:9px;background:rgba(186,255,158,.08);color:#baff9e;font-size:6px;font-weight:850}

      .adminNotificationRow{display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:rgba(255,255,255,.025)}.adminNotificationRow>span{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:rgba(186,255,158,.07);color:#baff9e}.adminNotificationRow>div:nth-child(2)>small{color:#baff9e;font-size:5px;font-weight:900;text-transform:uppercase}.adminNotificationRow strong{display:block;margin-top:3px;font-size:8px}.adminNotificationRow p{margin:4px 0 0;color:rgba(255,255,255,.38);font-size:7px}.adminNotificationRow>div:last-child{text-align:right}.adminNotificationRow>div:last-child small,.adminNotificationRow>div:last-child span{display:block}.adminNotificationRow>div:last-child small{color:#baff9e;font-size:5px}.adminNotificationRow>div:last-child span{margin-top:4px;color:rgba(255,255,255,.27);font-size:5px}

      .adminModal select{width:100%;min-height:44px;margin-top:7px;padding:0 11px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:#102219;color:#fff;outline:0;font-size:9px}

      @media(max-width:1180px){
        .adminGlobalGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .adminPhotoGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .adminWorkspace{grid-template-columns:220px minmax(0,1fr)}
        .adminPriorityGrid{grid-template-columns:1fr}
        .adminPlaceMeta{grid-template-columns:repeat(2,minmax(0,1fr))}
      }

      @media(max-width:980px){
        .adminEntityGrid{grid-template-columns:1fr}
        .adminSidebar nav{max-height:none;overflow-y:visible}
        .adminExplore{padding-inline:14px}
        .adminWorkspace{grid-template-columns:1fr}
        .adminSidebar{position:static;overflow-x:auto;padding:9px}
        .adminSidebarTitle,.adminSidebarHealth{display:none}
        .adminSidebar nav{display:flex;min-width:max-content;margin:0}
        .adminSidebar nav button{grid-template-columns:36px auto auto;min-width:max-content;padding-right:12px}
        .adminSidebar nav button strong{white-space:nowrap}
        .adminPlaceCard{grid-template-columns:1fr}
        .adminPlaceImage{height:320px;min-height:0}
        .adminRiskGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }

      @media(max-width:760px){
        .adminGlobalOverview>header{align-items:flex-start;flex-direction:column}
        .adminContentCard{grid-template-columns:120px minmax(0,1fr)}
        .adminPhotoGrid{grid-template-columns:1fr 1fr}
        .adminCommentRow{grid-template-columns:58px minmax(0,1fr)}
        .adminCommentActions{grid-column:2}
        .adminDocumentCard{grid-template-columns:48px minmax(0,1fr)}
        .adminDocumentCard>a{grid-column:2;justify-self:start}
        .adminExplore{padding:82px 8px 50px}
        .adminHero{min-height:620px;padding:18px;border-radius:0 0 28px 28px}
        .adminHeroCopy{padding-top:74px}
        .adminHeroCopy h1{font-size:clamp(44px,13vw,64px)}
        .adminHeroCopy p{font-size:10px}
        .adminHeroStats{right:18px;bottom:18px;left:18px;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
        .adminHeroStats article{min-height:82px;padding:12px}
        .adminHeroStats strong{font-size:23px}
        .adminRefresh{width:44px;padding:0;justify-content:center;font-size:0}
        .adminMain{padding:14px}
        .adminMainHeader{align-items:stretch;flex-direction:column}
        .adminSearch{width:100%}
        .adminPlaceBody{padding:15px}
        .adminPlaceBody>header{flex-direction:column}
        .adminPlaceBody>header>a{align-self:flex-start}
        .adminCheckinTop{align-items:flex-start;flex-direction:column}
        .adminSource{align-self:flex-start}
      }

      @media(max-width:520px){
        .adminGlobalGrid{grid-template-columns:1fr 1fr}
        .adminGlobalGrid button{grid-template-columns:34px minmax(0,1fr);min-height:72px}
        .adminGlobalGrid button>span{width:34px;height:34px}
        .adminContentCard{grid-template-columns:1fr}.adminContentCard>img{height:190px;min-height:190px}
        .adminBookingPeople,.adminContentMeta.four{grid-template-columns:1fr}
        .adminCompactPlace{grid-template-columns:82px minmax(0,1fr)}.adminCompactPlace>img{width:82px;height:78px}.adminCompactPlace>footer{grid-column:1/-1;grid-template-columns:1fr 1fr}
        .adminPhotoGrid{grid-template-columns:1fr}.adminPhotoVisual{height:260px}
        .adminCommentRow{grid-template-columns:1fr}.adminCommentActions{grid-column:auto}.commentSource{justify-self:start;min-width:70px;padding:0 9px}
        .adminNotificationRow{grid-template-columns:38px minmax(0,1fr)}.adminNotificationRow>div:last-child{grid-column:2;text-align:left}
        .adminHero{min-height:660px}
        .adminHeroTop{align-items:flex-start}
        .adminBrand strong{font-size:11px}
        .adminHeroCopy{padding-top:78px}
        .adminHeroCopy h1{font-size:46px}
        .adminHeroStats{grid-template-columns:1fr 1fr}
        .adminHeroStats span{font-size:6px}
        .adminHeroStats strong{font-size:21px}
        .adminWorkspace{margin-top:10px}
        .adminMain{border-radius:18px}
        .adminMainHeader h2{font-size:24px}
        .adminPlaceImage{height:250px}
        .adminPlaceMeta{grid-template-columns:1fr 1fr}
        .adminPlaceBody>footer{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .adminPlaceBody>footer button{justify-content:center;width:100%}
        .adminPlaceBody>footer .reject{grid-column:1/-1}
        .adminRiskGrid{grid-template-columns:1fr 1fr}
        .adminCheckinCard>footer{align-items:stretch;flex-direction:column}
        .adminCheckinCard>footer>div{display:grid;grid-template-columns:1fr;width:100%}
        .adminCheckinCard>footer button{justify-content:center;width:100%}
        .adminLogList>article{grid-template-columns:40px minmax(0,1fr)}
        .adminLogList>article>small{grid-column:2;white-space:normal}
      }

      @media(prefers-reduced-motion:reduce){
        *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
      }
    `}</style>
  );
}
