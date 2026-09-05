import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85";

const FALLBACK_PACKAGE_IMAGE =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85";

const EMPTY_DEMAND_INTELLIGENCE = {
  total_open_demands: 0,
  new_demands_7d: 0,
  pending_demands: 0,
  demands: [],
};

const EMPTY_HOST_ANALYTICS = {
  period_days: 30,
  overview: { demands_30d: 0, people_30d: 0, open_demands: 0, new_demands_7d: 0 },
  response_performance: { received_demands: 0, responded_demands: 0, unanswered_demands: 0, response_rate: 0, average_response_hours: 0 },
  offer_performance: { total_offers: 0, accepted_offers: 0, pending_offers: 0, rejected_offers: 0, withdrawn_offers: 0, conversion_rate: 0 },
  demand_series: [],
  top_activities: [],
  top_locations: [],
  budget_by_activity: [],
};

const EMPTY_SUMMARY = {
  total_packages: 0,
  total_events: 0,
  total_bookings: 0,
  pending_bookings: 0,
  approved_bookings: 0,
  completed_bookings: 0,
  gross_revenue: 0,
  total_expenses: 0,
  average_rating: 0,
};

const BOOKING_STATUS = {
  pending: {
    label: "Na čekanju",
    className: "pending",
  },
  approved: {
    label: "Odobreno",
    className: "approved",
  },
  rejected: {
    label: "Odbijeno",
    className: "rejected",
  },
  cancelled: {
    label: "Otkazano",
    className: "cancelled",
  },
  completed: {
    label: "Završeno",
    className: "completed",
  },
};

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  fill = "none",
  className = "",
}) {
  const icons = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
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
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6" />
        <path d="M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    booking: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 9h18" />
        <path d="m8 14 2 2 5-5" />
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
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 15H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    trend: (
      <>
        <path d="m3 17 6-6 4 4 7-8" />
        <path d="M14 7h6v6" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
    gallery: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="m21 16-4-4-7 7" />
      </>
    ),
    interested: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M18 8v6M15 11h6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
        <path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" />
      </>
    ),
    money: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M16 8.5c-.7-.9-1.8-1.5-3.3-1.5-2 0-3.2 1-3.2 2.4 0 1.6 1.4 2.1 3.5 2.6 2.2.5 3.5 1.2 3.5 2.8 0 1.5-1.3 2.7-3.6 2.7-1.7 0-3.1-.6-4-1.8" />
        <path d="M12 5.5v13" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 4h16l2 10v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5L4 4Z" />
        <path d="M2 14h5l2 3h6l2-3h5" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.1 3.4L16.5 7.5l-3.4 1.1L12 12l-1.1-3.4-3.4-1.1 3.4-1.1L12 3Z" />
        <path d="m18 13 .7 2.3L21 16l-2.3.7L18 19l-.7-2.3L15 16l2.3-.7L18 13Z" />
        <path d="m5 13 .6 1.9 1.9.6-1.9.6L5 18l-.6-1.9-1.9-.6 1.9-.6L5 13Z" />
      </>
    ),
    car: (
      <>
        <path d="M5 17h14l-1-6-2-4H8l-2 4-1 6Z" />
        <path d="M7 17v2M17 17v2M6 12h12" />
        <circle cx="8" cy="15" r="1" />
        <circle cx="16" cy="15" r="1" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function formatDate(value, includeTime = false) {
  if (!value) return "Datum nije dodat";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

function formatMoney(value, currency = "EUR") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function numberValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDemandDate(startDate, endDate) {
  if (!startDate) return "Termin nije naveden";

  const start = formatDate(startDate);
  if (!endDate || endDate === startDate) return start;

  return `${start} – ${formatDate(endDate)}`;
}

function humanizeActivity(value) {
  if (!value) return "Outdoor aktivnost";

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function demandAgeHours(value) {
  const createdAt = new Date(value || 0).getTime();
  if (!Number.isFinite(createdAt) || createdAt <= 0) return Number.POSITIVE_INFINITY;
  return Math.max((Date.now() - createdAt) / 36e5, 0);
}

function demandPriority(demand) {
  if (demand?.responded) {
    return { label: "Obrađeno", tone: "done", rank: 99 };
  }

  const ageHours = demandAgeHours(demand?.created_at);
  const people = Math.max(numberValue(demand?.people_count), 1);
  const hasBudget = demand?.budget_per_person !== null && demand?.budget_per_person !== undefined;

  if (ageHours <= 24 || people >= 4 || hasBudget) {
    return { label: "Odgovori prvo", tone: "high", rank: 0 };
  }

  if (ageHours <= 72) {
    return { label: "Sveža prilika", tone: "medium", rank: 1 };
  }

  return { label: "Čeka odgovor", tone: "normal", rank: 2 };
}

function demandGroupBudget(demand) {
  if (demand?.budget_per_person === null || demand?.budget_per_person === undefined) return null;
  const budget = numberValue(demand.budget_per_person);
  const people = Math.max(numberValue(demand.people_count), 1);
  return budget * people;
}

function DashboardLoading() {
  return (
    <>
      <DashboardStyles />

      <main className="dashboardStatePage">
        <div className="dashboardStateCard">
          <span className="dashboardLoader" />
          <h1>Učitavanje kontrolnog centra</h1>
          <p>
            Pripremamo rezervacije, finansije, događaje i pakete.
          </p>
        </div>
      </main>
    </>
  );
}

function UnauthorizedState() {
  return (
    <>
      <DashboardStyles />

      <main className="dashboardStatePage">
        <div className="dashboardStateCard">
          <span className="stateIcon">
            <Icon name="shield" size={26} />
          </span>

          <h1>Samo organizatori imaju pristup.</h1>

          <p>
            Ovaj kontrolni centar namenjen je host profilima koji
            upravljaju događajima, turama i rezervacijama.
          </p>

          <Link to="/" className="stateLink">
            Nazad na početnu
            <Icon name="arrowRight" size={17} />
          </Link>
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  accent = "green",
}) {
  return (
    <article className={`statCard ${accent}`}>
      <div className="statCardTop">
        <span className="statIcon">
          <Icon name={icon} size={20} />
        </span>

        <span className="statTrend">
          <Icon name="trend" size={14} />
        </span>
      </div>

      <strong>{value}</strong>
      <span className="statLabel">{label}</span>
      <small>{description}</small>
    </article>
  );
}

function StatusBadge({ status }) {
  const config = BOOKING_STATUS[status] || {
    label: status || "Nepoznato",
    className: "unknown",
  };

  return (
    <span className={`statusBadge ${config.className}`}>
      {config.label}
    </span>
  );
}

function DashboardItemCard({
  type,
  item,
  interestedCount,
  deleting,
  onDelete,
}) {
  const isEvent = type === "event";

  const detailsUrl = isEvent
    ? `/event/${item.id}`
    : `/package/${item.id}`;

  const editUrl = isEvent
    ? `/edit-event/${item.id}`
    : `/edit-package/${item.id}`;

  const imageUrl =
    item.cover_url ||
    item.image_url ||
    (isEvent
      ? FALLBACK_EVENT_IMAGE
      : FALLBACK_PACKAGE_IMAGE);

  const location =
    [item.location, item.country].filter(Boolean).join(", ") ||
    "Lokacija nije dodata";

  const dateValue =
    item.start_date ||
    item.event_date ||
    item.date ||
    item.created_at;

  return (
    <article className="dashboardItemCard">
      <div className="itemImageWrapper">
        <img
          src={imageUrl}
          alt={item.title || "Outdoor ponuda"}
          className="itemImage"
        />

        <div className="itemImageOverlay" />

        <span className="itemTypeBadge">
          <Icon
            name={isEvent ? "calendar" : "package"}
            size={14}
          />
          {isEvent ? "Događaj" : "Paket"}
        </span>

        <span className="interestBadge">
          <Icon name="heart" size={13} />
          {interestedCount}
        </span>
      </div>

      <div className="itemBody">
        <div className="itemHeading">
          <span className="itemKicker">
            {isEvent ? "Outdoor događaj" : "Outdoor paket"}
          </span>

          <h3>{item.title || "Bez naziva"}</h3>
        </div>

        <div className="itemMeta">
          <span>
            <Icon name="mapPin" size={14} />
            {location}
          </span>

          <span>
            <Icon name="clock" size={14} />
            {formatDate(dateValue)}
          </span>
        </div>

        <div className="interestSummary">
          <span>
            <Icon name="users" size={17} />
          </span>

          <div>
            <strong>{interestedCount}</strong>
            <small>
              {interestedCount === 1
                ? "zainteresovana osoba"
                : "zainteresovanih osoba"}
            </small>
          </div>
        </div>

        <div className="itemActions">
          <Link to={detailsUrl} className="itemAction">
            <Icon name="eye" size={16} />
            Pogledaj
          </Link>

          <Link to={editUrl} className="itemAction">
            <Icon name="edit" size={16} />
            Uredi
          </Link>

          {isEvent ? (
            <Link
              to={`/event/${item.id}/interested`}
              className="itemAction"
            >
              <Icon name="interested" size={16} />
              Interesovanje
            </Link>
          ) : (
            <Link
              to={`/edit-package/${item.id}/gallery`}
              className="itemAction"
            >
              <Icon name="gallery" size={16} />
              Galerija
            </Link>
          )}

          <button
            type="button"
            className="deleteAction"
            onClick={() => onDelete(item.id)}
            disabled={deleting}
          >
            {deleting ? (
              <span className="smallLoader" />
            ) : (
              <Icon name="trash" size={16} />
            )}

            {deleting ? "Brisanje" : "Obriši"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptySection({
  type,
  title,
  description,
  buttonText,
  buttonUrl,
}) {
  return (
    <div className="emptySection">
      <span className="emptyIcon">
        <Icon
          name={type === "event" ? "calendar" : "package"}
          size={28}
        />
      </span>

      <h3>{title}</h3>
      <p>{description}</p>

      <Link to={buttonUrl}>
        <Icon name="plus" size={16} />
        {buttonText}
      </Link>
    </div>
  );
}

function BookingRow({ booking }) {
  const packageData = booking.package || booking.packages || null;
  const title =
    packageData?.title ||
    booking.package_title ||
    "Rezervacija paketa";

  const amount =
    booking.total_amount ??
    (packageData?.price
      ? numberValue(packageData.price) *
        Math.max(numberValue(booking.guests), 1)
      : 0);

  const currency =
    booking.currency ||
    packageData?.currency ||
    "EUR";

  return (
    <article className="bookingRow">
      <div className="bookingIdentity">
        <span className="bookingIcon">
          <Icon name="booking" size={18} />
        </span>

        <div>
          <strong>{title}</strong>
          <small>
            {formatDate(booking.created_at, true)}
            {" · "}
            {Math.max(numberValue(booking.guests), 1)}
            {Math.max(numberValue(booking.guests), 1) === 1
              ? " gost"
              : " gosta"}
          </small>
        </div>
      </div>

      <div className="bookingAmount">
        <strong>{formatMoney(amount, currency)}</strong>
        <small>
          {booking.payment_status === "paid"
            ? "Plaćeno"
            : "Nije plaćeno"}
        </small>
      </div>

      <StatusBadge status={booking.status} />
    </article>
  );
}

function DemandCard({ demand, featured = false, rejecting = false, onReject }) {
  const responded = Boolean(demand.responded);
  const peopleCount = Math.max(numberValue(demand.people_count), 1);
  const hasBudget = demand.budget_per_person !== null && demand.budget_per_person !== undefined;
  const groupBudget = demandGroupBudget(demand);
  const priority = demandPriority(demand);

  return (
    <article className={`demandCard ${responded ? "responded" : "waiting"} ${featured ? "featured" : ""}`}>
      <div className="demandCardTop">
        <div className="demandActivityIdentity">
          <span className="demandActivityIcon">
            <Icon name="trend" size={18} />
          </span>

          <div>
            <div className="demandEyebrowRow">
              <span className="demandEyebrow">Traži se</span>
              {!responded && (
                <span className={`priorityPill ${priority.tone}`}>{priority.label}</span>
              )}
            </div>
            <h3>{humanizeActivity(demand.activity)}</h3>
          </div>
        </div>

        <span className={`demandStatus ${responded ? "done" : "new"}`}>
          <span />
          {responded ? "Odgovoreno" : "Čeka odgovor"}
        </span>
      </div>

      <div className="demandLocation">
        <Icon name="mapPin" size={16} />
        <strong>{demand.location_text || "Lokacija nije precizirana"}</strong>
      </div>

      <div className="demandFacts">
        <div>
          <span className="demandFactIcon"><Icon name="calendar" size={15} /></span>
          <p><small>Termin</small><strong>{formatDemandDate(demand.start_date, demand.end_date)}</strong></p>
        </div>
        <div>
          <span className="demandFactIcon"><Icon name="users" size={15} /></span>
          <p><small>Grupa</small><strong>{peopleCount} osoba</strong></p>
        </div>
        <div>
          <span className="demandFactIcon"><Icon name="money" size={15} /></span>
          <p><small>Budžet / osoba</small><strong>{hasBudget ? formatMoney(demand.budget_per_person, demand.currency || "EUR") : "Nije naveden"}</strong></p>
        </div>
        <div>
          <span className="demandFactIcon"><Icon name="car" size={15} /></span>
          <p><small>Prevoz</small><strong>{demand.has_car === true ? "Ima auto" : demand.has_car === false ? "Bez auta" : "Nije navedeno"}</strong></p>
        </div>
      </div>

      {groupBudget !== null && (
        <div className="groupBudgetSignal">
          <span>
            <Icon name="wallet" size={16} />
          </span>
          <div>
            <small>Signal budžeta cele grupe</small>
            <strong>{formatMoney(groupBudget, demand.currency || "EUR")}</strong>
          </div>
          <em>Nije garantovan prihod</em>
        </div>
      )}

      <div className="demandCardFooter">
        <span>
          <Icon name="clock" size={14} />
          Zahtev stigao {formatDate(demand.created_at, true)}
        </span>

        {demand.difficulty && (
          <span className="difficultyTag">{humanizeActivity(demand.difficulty)}</span>
        )}
      </div>

      <div className="demandCardActions">
        <Link
          to={`/host/demand/${demand.id}`}
          className={`demandPrimaryAction ${responded ? "secondary" : ""}`}
        >
          <span>
            <Icon name={responded ? "eye" : "sparkles"} size={17} />
            {responded ? "Pogledaj" : "Otvori zahtev"}
          </span>
          <Icon name="arrowRight" size={17} />
        </Link>

        {!responded && onReject && (
          <button
            type="button"
            className="demandRejectAction"
            onClick={() => onReject(demand)}
            disabled={rejecting}
          >
            {rejecting ? (
              <span className="smallLoader" />
            ) : (
              <Icon name="x" size={16} />
            )}
            {rejecting ? "Odbijam..." : "Odbij"}
          </button>
        )}
      </div>
    </article>
  );
}

function AnalyticsKpi({ label, value, hint }) {
  return (
    <article className="analyticsKpi">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}

function DemandTrendChart({ series }) {
  const rows = Array.isArray(series) ? series : [];
  const maxValue = Math.max(...rows.map((item) => numberValue(item?.demand_count)), 1);
  const visibleLabels = new Set([0, 6, 13, 20, 29]);

  return (
    <div className="trendChart" aria-label="Potražnja u poslednjih 30 dana">
      <div className="trendBars">
        {rows.map((item, index) => {
          const count = numberValue(item?.demand_count);
          const height = Math.max((count / maxValue) * 100, count > 0 ? 8 : 2);
          return (
            <div className="trendBarColumn" key={`${item?.date || index}-${index}`}>
              <div className="trendBarTrack" title={`${item?.date || ""}: ${count} zahteva`}>
                <span className={count > 0 ? "active" : ""} style={{ height: `${height}%` }} />
              </div>
              <small>{visibleLabels.has(index) ? String(item?.date || "").slice(5) : ""}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankedList({ items, type }) {
  const rows = Array.isArray(items) ? items : [];
  const max = Math.max(...rows.map((item) => numberValue(item?.demand_count)), 1);
  if (!rows.length) return <div className="analyticsEmpty">Još nema dovoljno podataka za rangiranje.</div>;

  return (
    <div className="rankedList">
      {rows.slice(0, 6).map((item, index) => {
        const label = type === "activity" ? humanizeActivity(item?.activity) : item?.location || "Nepoznata lokacija";
        const count = numberValue(item?.demand_count);
        const people = numberValue(item?.people_count);
        return (
          <div className="rankedRow" key={`${label}-${index}`}>
            <span className="rankNumber">{String(index + 1).padStart(2, "0")}</span>
            <div className="rankMain">
              <div className="rankTopline"><strong>{label}</strong><span>{count} zahteva</span></div>
              <div className="rankBar"><span style={{ width: `${Math.max((count / max) * 100, 5)}%` }} /></div>
              <small>{people} potencijalnih učesnika</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BudgetSignals({ rows }) {
  const items = Array.isArray(rows) ? rows : [];
  if (!items.length) return <div className="analyticsEmpty">Budžetski signali će se pojaviti kada korisnici unesu budžet.</div>;

  return (
    <div className="budgetSignalList">
      {items.slice(0, 6).map((item, index) => (
        <article className="budgetSignalRow" key={`${item?.activity}-${item?.currency}-${index}`}>
          <div><strong>{humanizeActivity(item?.activity)}</strong><small>{numberValue(item?.demand_count)} zahteva · {item?.currency || "RSD"}</small></div>
          <div className="budgetSignalValue"><small>Prosek / osoba</small><strong>{formatMoney(item?.average_budget_per_person, item?.currency || "RSD")}</strong></div>
        </article>
      ))}
    </div>
  );
}


function buildAgentInsights(analytics) {
  const overview = { ...EMPTY_HOST_ANALYTICS.overview, ...(analytics?.overview || {}) };
  const response = { ...EMPTY_HOST_ANALYTICS.response_performance, ...(analytics?.response_performance || {}) };
  const offers = { ...EMPTY_HOST_ANALYTICS.offer_performance, ...(analytics?.offer_performance || {}) };
  const activities = Array.isArray(analytics?.top_activities) ? analytics.top_activities : [];
  const locations = Array.isArray(analytics?.top_locations) ? analytics.top_locations : [];

  const demandCount = numberValue(overview.demands_30d);
  const unanswered = numberValue(response.unanswered_demands);
  const responseRate = numberValue(response.response_rate);
  const responseHours = numberValue(response.average_response_hours);
  const totalOffers = numberValue(offers.total_offers);
  const acceptedOffers = numberValue(offers.accepted_offers);
  const conversion = numberValue(offers.conversion_rate);
  const topActivity = activities[0];
  const topLocation = locations[0];
  const insights = [];

  if (unanswered > 0) {
    insights.push({
      tone: "priority",
      icon: "alert",
      eyebrow: "Prioritet sada",
      title: `${unanswered} ${unanswered === 1 ? "potražnja čeka" : "potražnje čekaju"} tvoj odgovor`,
      text: "Odgovori prvo na sveže zahteve dok je namera korisnika još jaka.",
      metric: `${responseRate.toFixed(1)}% response rate`,
      to: "/host-dashboard#demand-inbox",
      action: "Otvori Demand Inbox",
    });
  } else if (demandCount > 0) {
    insights.push({
      tone: "positive",
      icon: "check",
      eyebrow: "Inbox pod kontrolom",
      title: "Nema neodgovorenih potražnji",
      text: "Sve trenutno relevantne prilike imaju tvoj odgovor. Nastavi da reaguješ brzo na nove zahteve.",
      metric: `${responseRate.toFixed(1)}% response rate`,
    });
  }

  if (topActivity && numberValue(topActivity.demand_count) > 0) {
    const count = numberValue(topActivity.demand_count);
    const people = numberValue(topActivity.people_count);
    insights.push({
      tone: "market",
      icon: "sparkles",
      eyebrow: "Signal potražnje",
      title: `${humanizeActivity(topActivity.activity)} je trenutno tvoja #1 aktivnost`,
      text: `${count} ${count === 1 ? "zahtev" : "zahteva"} u poslednjih 30 dana${people > 0 ? ` predstavljaju ${people} potencijalnih učesnika` : ""}.`,
      metric: `${count} / 30d`,
    });
  }

  if (topLocation && numberValue(topLocation.demand_count) > 0) {
    const count = numberValue(topLocation.demand_count);
    insights.push({
      tone: "location",
      icon: "mapPin",
      eyebrow: "Lokacijski signal",
      title: `${topLocation.location || "Lokacija"} privlači najviše interesa`,
      text: `Najviše relevantnih zahteva koje si dobio u ovom periodu vezano je za ovu lokaciju.`,
      metric: `${count} ${count === 1 ? "zahtev" : "zahteva"}`,
    });
  }

  if (demandCount > 0 && responseHours > 0) {
    if (responseHours <= 6) {
      insights.push({
        tone: "positive",
        icon: "clock",
        eyebrow: "Brzina odgovora",
        title: `Prosečno odgovaraš za ${responseHours.toFixed(1)} h`,
        text: "To je jak operativni signal. Zadrži brzinu, posebno kod novih potražnji.",
        metric: "Brza reakcija",
      });
    } else if (responseHours >= 24) {
      insights.push({
        tone: "priority",
        icon: "clock",
        eyebrow: "Prostor za napredak",
        title: `Prosečan odgovor je ${responseHours.toFixed(1)} h`,
        text: "Kraće vreme do prve ponude može ti pomoći da stigneš do korisnika dok još aktivno bira opciju.",
        metric: "Cilj: brže",
      });
    }
  }

  if (totalOffers >= 3) {
    insights.push({
      tone: conversion >= 30 ? "positive" : "market",
      icon: conversion >= 30 ? "check" : "sparkles",
      eyebrow: "Učinak ponuda",
      title: `${conversion.toFixed(1)}% ponuda završava prihvatanjem`,
      text: `${acceptedOffers} od ${totalOffers} ponuda u poslednjih 30 dana je prihvaćeno. Ovo je tvoj stvarni conversion, ne procena.`,
      metric: `${acceptedOffers}/${totalOffers} prihvaćeno`,
    });
  }

  if (!insights.length) {
    insights.push({
      tone: "neutral",
      icon: "sparkles",
      eyebrow: "Agent Insights",
      title: "Čekamo dovoljno realnih signala",
      text: "Čim stignu potražnje i odgovori, ovde će se automatski pojaviti konkretni zaključci za tvoj host profil.",
      metric: "Live podaci",
    });
  }

  return insights.slice(0, 4);
}

function AgentInsights({ analytics }) {
  const insights = buildAgentInsights(analytics);

  return (
    <section className="agentInsightsPanel">
      <div className="agentInsightsHeader">
        <div className="agentInsightsTitle">
          <span className="agentInsightsIcon"><Icon name="sparkles" size={20} /></span>
          <div>
            <span className="sectionKicker">MeetOutdoors Agent</span>
            <h3>Šta bih uradio sledeće.</h3>
            <p>Automatski zaključci iz tvojih stvarnih potražnji i ponuda u poslednjih 30 dana.</p>
          </div>
        </div>
        <span className="agentDataBadge"><Icon name="shield" size={14} /> Bez demo podataka</span>
      </div>

      <div className="agentInsightsGrid">
        {insights.map((insight, index) => (
          <article className={`agentInsightCard ${insight.tone || "neutral"}`} key={`${insight.title}-${index}`}>
            <div className="agentInsightTop">
              <span className="agentInsightCardIcon"><Icon name={insight.icon || "sparkles"} size={17} /></span>
              <span className="agentInsightMetric">{insight.metric}</span>
            </div>
            <small>{insight.eyebrow}</small>
            <strong>{insight.title}</strong>
            <p>{insight.text}</p>
            {insight.to && (
              <a href="#demand-inbox" className="agentInsightAction">
                {insight.action || "Pogledaj"}
                <Icon name="arrowRight" size={15} />
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}


function buildAgentRecommendation(analytics) {
  const activities = Array.isArray(analytics?.top_activities) ? analytics.top_activities : [];
  const locations = Array.isArray(analytics?.top_locations) ? analytics.top_locations : [];
  const budgets = Array.isArray(analytics?.budget_by_activity) ? analytics.budget_by_activity : [];
  const topActivity = activities[0];
  const topLocation = locations[0];

  if (!topActivity || numberValue(topActivity?.demand_count) <= 0) return null;

  const activity = humanizeActivity(topActivity.activity);
  const location = topLocation?.location || "";
  const people = Math.max(numberValue(topActivity.people_count), 1);
  const budget = budgets.find((row) => row?.activity === topActivity.activity && String(row?.currency || "").toUpperCase() === "EUR") || null;
  const suggestedPrice = budget ? Math.round(numberValue(budget.average_budget_per_person)) : null;
  const baseTitle = location ? `${activity} · ${location}` : activity;
  const description = location
    ? `Predlog kreiran iz realne MeetOutdoors potražnje za ${activity.toLowerCase()} na lokaciji ${location}. Prilagodi detalje svom iskustvu i usluzi.`
    : `Predlog kreiran iz realne MeetOutdoors potražnje za ${activity.toLowerCase()}. Prilagodi detalje svom iskustvu i usluzi.`;

  const params = new URLSearchParams();
  params.set("source", "agent");
  params.set("title", baseTitle);
  params.set("description", description);
  if (location) params.set("location", location);
  if (people > 0) params.set("capacity", String(people));
  if (suggestedPrice && suggestedPrice > 0) params.set("price", String(suggestedPrice));

  return {
    activity,
    location,
    demandCount: numberValue(topActivity.demand_count),
    people,
    suggestedPrice,
    packageUrl: `/create-package?${params.toString()}`,
    eventUrl: `/create-event?${params.toString()}`,
  };
}

function AgentRecommendation({ analytics }) {
  const recommendation = buildAgentRecommendation(analytics);
  if (!recommendation) return null;

  return (
    <section className="agentRecommendation">
      <div className="agentRecommendationCopy">
        <span className="sectionKicker">Agent Recommendation</span>
        <h3>Pretvori potražnju u novu ponudu.</h3>
        <p>
          Najjači signal trenutno je <strong>{recommendation.activity}</strong>
          {recommendation.location ? <> na lokaciji <strong>{recommendation.location}</strong></> : null}.
          Imaš {recommendation.demandCount} relevantnih zahteva i {recommendation.people} potencijalnih učesnika u poslednjih 30 dana.
        </p>
        <div className="agentRecommendationSignals">
          <span><Icon name="trend" size={15} /> {recommendation.demandCount} zahteva</span>
          <span><Icon name="users" size={15} /> {recommendation.people} ljudi</span>
          {recommendation.suggestedPrice ? <span><Icon name="wallet" size={15} /> oko {formatMoney(recommendation.suggestedPrice, "EUR")} / osoba</span> : null}
        </div>
      </div>
      <div className="agentRecommendationActions">
        <Link to={recommendation.packageUrl} className="agentRecommendationPrimary">
          <Icon name="package" size={17} /> Kreiraj paket
        </Link>
        <Link to={recommendation.eventUrl} className="agentRecommendationSecondary">
          <Icon name="calendar" size={17} /> Kreiraj event
        </Link>
        <small>Forma će dobiti predlog naziva, lokacije, kapaciteta i cenu kada postoji EUR budžetski signal.</small>
      </div>
    </section>
  );
}


function IntelligenceCommandCenter({ analytics, intelligence }) {
  const overview = { ...EMPTY_HOST_ANALYTICS.overview, ...(analytics?.overview || {}) };
  const response = { ...EMPTY_HOST_ANALYTICS.response_performance, ...(analytics?.response_performance || {}) };
  const offers = { ...EMPTY_HOST_ANALYTICS.offer_performance, ...(analytics?.offer_performance || {}) };
  const demands = Array.isArray(intelligence?.demands)
    ? [...intelligence.demands].sort((a, b) => {
        const priorityDifference = demandPriority(a).rank - demandPriority(b).rank;
        if (priorityDifference !== 0) return priorityDifference;
        return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
      })
    : [];

  const nextDemand = demands.find((item) => !item?.responded) || null;
  const topActivity = Array.isArray(analytics?.top_activities) ? analytics.top_activities[0] : null;
  const topLocation = Array.isArray(analytics?.top_locations) ? analytics.top_locations[0] : null;
  const demandCount = numberValue(overview.demands_30d);
  const peopleCount = numberValue(overview.people_30d);
  const responseRate = numberValue(response.response_rate);
  const responseHours = numberValue(response.average_response_hours);
  const conversion = numberValue(offers.conversion_rate);
  const unanswered = numberValue(response.unanswered_demands);

  return (
    <section className="intelligenceCommandCenter">
      <div className="commandCenterTop">
        <div>
          <span className="sectionKicker">Intelligence Command Center</span>
          <h3>Jedan pogled. Jedna odluka. Sledeći potez.</h3>
          <p>Najvažniji signal iz potražnje, tržišta i tvog učinka — bez procena i bez demo brojeva.</p>
        </div>
        <span className="commandCenterStatus"><span /> 30d operativni pregled</span>
      </div>

      <div className="commandCenterGrid">
        <article className={`commandDecisionCard ${nextDemand ? "urgent" : "clear"}`}>
          <div className="commandCardTop">
            <span className="commandCardIcon"><Icon name={nextDemand ? "bolt" : "check"} size={18} /></span>
            <small>Sledeća akcija</small>
          </div>
          {nextDemand ? (
            <>
              <strong>Odgovori na {humanizeActivity(nextDemand.activity)}</strong>
              <p>
                {nextDemand.location_text || "Lokacija nije navedena"}
                {numberValue(nextDemand.people_count) > 0 ? ` · ${numberValue(nextDemand.people_count)} ljudi` : ""}
              </p>
              <Link to={`/host/demand/${nextDemand.id}`} className="commandPrimaryAction">
                Otvori zahtev <Icon name="arrowRight" size={16} />
              </Link>
            </>
          ) : (
            <>
              <strong>Inbox je pod kontrolom</strong>
              <p>Trenutno nema prosleđene potražnje koja čeka tvoj odgovor.</p>
              <a href="#demand-inbox" className="commandSecondaryAction">
                Pogledaj Demand Inbox <Icon name="arrowRight" size={16} />
              </a>
            </>
          )}
        </article>

        <article className="commandMarketCard">
          <div className="commandCardTop">
            <span className="commandCardIcon market"><Icon name="trend" size={18} /></span>
            <small>Najjači tržišni signal</small>
          </div>
          <strong>{topActivity ? humanizeActivity(topActivity.activity) : "Čekamo tržišne signale"}</strong>
          <p>
            {topLocation?.location
              ? `${topLocation.location} · ${numberValue(topActivity?.demand_count)} zahteva`
              : demandCount > 0
                ? `${demandCount} zahteva u poslednjih 30 dana`
                : "Još nema dovoljno podataka za rangiranje."}
          </p>
          <div className="commandMiniStats">
            <span><b>{demandCount}</b><small>zahteva</small></span>
            <span><b>{peopleCount}</b><small>ljudi</small></span>
          </div>
        </article>

        <article className="commandPerformanceCard">
          <div className="commandCardTop">
            <span className="commandCardIcon performance"><Icon name="pulse" size={18} /></span>
            <small>Operativni puls</small>
          </div>
          <div className="commandPerformanceRows">
            <div><span>Response rate</span><strong>{responseRate.toFixed(1)}%</strong></div>
            <div><span>Vreme odgovora</span><strong>{responseHours.toFixed(1)} h</strong></div>
            <div><span>Offer conversion</span><strong>{conversion.toFixed(1)}%</strong></div>
          </div>
          <p className={unanswered > 0 ? "commandAttention" : "commandGood"}>
            {unanswered > 0
              ? `${unanswered} ${unanswered === 1 ? "zahtev čeka" : "zahteva čekaju"} odgovor.`
              : demandCount > 0
                ? "Sve evidentirane potražnje imaju odgovor."
                : "Performance će se pojaviti sa prvim potražnjama."}
          </p>
        </article>
      </div>
    </section>
  );
}

function HostAnalyticsSection({ analytics, intelligence, error }) {
  const overview = { ...EMPTY_HOST_ANALYTICS.overview, ...(analytics?.overview || {}) };
  const response = { ...EMPTY_HOST_ANALYTICS.response_performance, ...(analytics?.response_performance || {}) };
  const offers = { ...EMPTY_HOST_ANALYTICS.offer_performance, ...(analytics?.offer_performance || {}) };
  const rate = numberValue(response.response_rate);
  const conversion = numberValue(offers.conversion_rate);
  const responseHours = numberValue(response.average_response_hours);

  return (
    <section className="analyticsShell">
      <div className="analyticsHeader">
        <div>
          <span className="sectionKicker">Intelligence · poslednjih 30 dana</span>
          <h2>Šta tržište traži i kako ti odgovaraš.</h2>
          <p>Istorija relevantnih potražnji, brzina reakcije i učinak ponuda — samo iz stvarnih MeetOutdoors podataka.</p>
        </div>
        <span className="analyticsLiveBadge"><span /> Live podaci</span>
      </div>

      {error ? (
        <div className="analyticsError"><Icon name="alert" size={18} /><span>{error}</span></div>
      ) : (
        <>
          <IntelligenceCommandCenter analytics={analytics} intelligence={intelligence} />
          <AgentInsights analytics={analytics} />
          <AgentRecommendation analytics={analytics} />

          <div className="analyticsKpiGrid">
            <AnalyticsKpi label="Potražnje · 30d" value={numberValue(overview.demands_30d)} hint={`${numberValue(overview.people_30d)} potencijalnih učesnika`} />
            <AnalyticsKpi label="Stopa odgovora" value={`${rate.toFixed(1)}%`} hint={`${numberValue(response.unanswered_demands)} neodgovorenih`} />
            <AnalyticsKpi label="Prosečno vreme odgovora" value={`${responseHours.toFixed(1)} h`} hint="Od zahteva do prve ponude" />
            <AnalyticsKpi label="Offer conversion" value={`${conversion.toFixed(1)}%`} hint={`${numberValue(offers.accepted_offers)} prihvaćenih od ${numberValue(offers.total_offers)}`} />
          </div>

          <div className="analyticsMainGrid">
            <article className="analyticsPanel analyticsTrendPanel">
              <div className="analyticsPanelHeader"><div><span className="sectionKicker">Demand trend</span><h3>Potražnja kroz vreme</h3></div><div className="trendSummary"><strong>{numberValue(overview.demands_30d)}</strong><small>zahteva / 30d</small></div></div>
              <DemandTrendChart series={analytics?.demand_series} />
            </article>
            <article className="analyticsPanel performancePanel">
              <div className="analyticsPanelHeader"><div><span className="sectionKicker">Performance</span><h3>Ponude i odgovori</h3></div></div>
              <div className="performanceRows">
                <div><span>Odgovoreno</span><strong>{numberValue(response.responded_demands)}</strong></div>
                <div><span>Čeka odgovor</span><strong>{numberValue(response.unanswered_demands)}</strong></div>
                <div><span>Prihvaćene ponude</span><strong>{numberValue(offers.accepted_offers)}</strong></div>
                <div><span>Na čekanju</span><strong>{numberValue(offers.pending_offers)}</strong></div>
                <div><span>Odbijene</span><strong>{numberValue(offers.rejected_offers)}</strong></div>
              </div>
            </article>
          </div>

          <div className="analyticsInsightGrid">
            <article className="analyticsPanel"><div className="analyticsPanelHeader"><div><span className="sectionKicker">Top aktivnosti</span><h3>Šta se najviše traži</h3></div></div><RankedList items={analytics?.top_activities} type="activity" /></article>
            <article className="analyticsPanel"><div className="analyticsPanelHeader"><div><span className="sectionKicker">Top lokacije</span><h3>Gde postoji tražnja</h3></div></div><RankedList items={analytics?.top_locations} type="location" /></article>
            <article className="analyticsPanel budgetPanel"><div className="analyticsPanelHeader"><div><span className="sectionKicker">Budget intelligence</span><h3>Koliko korisnici planiraju</h3></div></div><BudgetSignals rows={analytics?.budget_by_activity} /><small className="budgetDisclaimer">Valute se ne mešaju. Budžet je signal korisnika, ne garantovan prihod.</small></article>
          </div>
        </>
      )}
    </section>
  );
}

function DemandIntelligenceSection({
  intelligence,
  error,
  rejectingDemandId,
  onRejectDemand,
}) {
  const demands = Array.isArray(intelligence?.demands)
    ? [...intelligence.demands]
        .filter((item) => !item?.responded)
        .sort((a, b) => {
          const priorityDifference =
            demandPriority(a).rank - demandPriority(b).rank;

          if (priorityDifference !== 0) {
            return priorityDifference;
          }

          return (
            new Date(b?.created_at || 0) -
            new Date(a?.created_at || 0)
          );
        })
    : [];

  const fresh = numberValue(intelligence?.new_demands_7d);

  return (
    <section className="intelligenceShell compactDemandInbox">
      <div className="intelligenceHeader">
        <div className="intelligenceTitleWrap">
          <span className="intelligenceLogo">
            <Icon name="inbox" size={21} />
          </span>

          <div>
            <span className="sectionKicker">Potražnje</span>
            <h2>Zahtevi koji čekaju tvoju odluku.</h2>
            <p>
              Ovde su samo aktivne prilike. Odgovori na zahtev ili ga
              odbij — odbijeni zahtevi odmah nestaju sa dashboarda.
            </p>
          </div>
        </div>

        <div className="intelligenceSignal">
          <span className="signalDot" />
          <div>
            <strong>
              {demands.length > 0
                ? `${demands.length} ${
                    demands.length === 1 ? "zahtev čeka" : "zahteva čekaju"
                  }`
                : "Sve je obrađeno"}
            </strong>
            <small>{fresh} novih u poslednjih 7 dana</small>
          </div>
        </div>
      </div>

      <div className="demandInboxPanel compactInboxPanel">
        {error ? (
          <div className="demandInlineState error">
            <span>
              <Icon name="alert" size={21} />
            </span>
            <div>
              <strong>Potražnje trenutno nisu dostupne.</strong>
              <small>{error}</small>
            </div>
          </div>
        ) : demands.length === 0 ? (
          <div className="demandInlineState">
            <span>
              <Icon name="check" size={23} />
            </span>
            <div>
              <strong>Nema zahteva koji čekaju tvoju odluku.</strong>
              <small>
                Kada stigne nova relevantna potražnja, pojaviće se ovde.
              </small>
            </div>
          </div>
        ) : (
          <div className="demandCardsGrid">
            {demands.slice(0, 6).map((demand, index) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                featured={index === 0}
                rejecting={rejectingDemandId === demand.id}
                onReject={onRejectDemand}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function HostDashboard() {
  const { profile, isHost, loading } = useAuth();

  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [demandIntelligence, setDemandIntelligence] = useState(EMPTY_DEMAND_INTELLIGENCE);
  const [demandError, setDemandError] = useState("");
  const [hostAnalytics, setHostAnalytics] = useState(EMPTY_HOST_ANALYTICS);
  const [analyticsError, setAnalyticsError] = useState("");
  const [eventCounts, setEventCounts] = useState({});
  const [packageCounts, setPackageCounts] = useState({});
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingItem, setDeletingItem] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [rejectingDemandId, setRejectingDemandId] = useState("");

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!profile?.id || !isHost) {
        setEvents([]);
        setPackages([]);
        setBookings([]);
        setSummary(EMPTY_SUMMARY);
        setDemandIntelligence(EMPTY_DEMAND_INTELLIGENCE);
        setDemandError("");
        setHostAnalytics(EMPTY_HOST_ANALYTICS);
        setAnalyticsError("");
        setEventCounts({});
        setPackageCounts({});
        setDashboardLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setDashboardLoading(true);
      }

      setMessage("");

      try {
        const [
          eventsResult,
          packagesResult,
          bookingsResult,
          summaryResult,
          demandResult,
          analyticsResult,
        ] = await Promise.all([
          supabase
            .from("events")
            .select(
              "id, title, cover_url, location, country, start_date, created_at, is_active"
            )
            .eq("host_id", profile.id)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("packages")
            .select(
              "id, title, cover_url, image_url, location, country, start_date, created_at, price, currency, is_active"
            )
            .eq("host_id", profile.id)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("bookings")
            .select(`
              id,
              status,
              payment_status,
              guests,
              total_amount,
              currency,
              created_at,
              package:package_id (
                id,
                title,
                price,
                currency
              )
            `)
            .eq("host_id", profile.id)
            .order("created_at", {
              ascending: false,
            })
            .limit(6),

          supabase
            .from("host_dashboard_summary")
            .select("*")
            .eq("host_id", profile.id)
            .maybeSingle(),

          supabase.rpc("get_host_demand_intelligence"),
          supabase.rpc("get_host_intelligence_analytics"),
        ]);

        if (eventsResult.error) {
          throw eventsResult.error;
        }

        if (packagesResult.error) {
          throw packagesResult.error;
        }

        if (bookingsResult.error) {
          throw bookingsResult.error;
        }

        const loadedEvents = eventsResult.data || [];
        const loadedPackages = packagesResult.data || [];

        setEvents(loadedEvents);
        setPackages(loadedPackages);
        setBookings(bookingsResult.data || []);

        if (summaryResult.error) {
          console.error(
            "Summary view error:",
            summaryResult.error
          );
        }

        setSummary({
          ...EMPTY_SUMMARY,
          ...(summaryResult.data || {}),
        });

        if (demandResult.error) {
          console.error("Demand intelligence error:", demandResult.error);
          setDemandIntelligence(EMPTY_DEMAND_INTELLIGENCE);
          setDemandError(
            demandResult.error?.message ||
              "MeetOutdoors Intelligence trenutno nije moguće učitati."
          );
        } else {
          setDemandIntelligence({
            ...EMPTY_DEMAND_INTELLIGENCE,
            ...(demandResult.data || {}),
            demands: Array.isArray(demandResult.data?.demands)
              ? demandResult.data.demands
              : [],
          });
          setDemandError("");
        }

        if (analyticsResult.error) {
          console.error("Host analytics error:", analyticsResult.error);
          setHostAnalytics(EMPTY_HOST_ANALYTICS);
          setAnalyticsError(analyticsResult.error?.message || "Intelligence analitiku trenutno nije moguće učitati.");
        } else {
          const payload = analyticsResult.data || {};
          setHostAnalytics({
            ...EMPTY_HOST_ANALYTICS,
            ...payload,
            overview: { ...EMPTY_HOST_ANALYTICS.overview, ...(payload.overview || {}) },
            response_performance: { ...EMPTY_HOST_ANALYTICS.response_performance, ...(payload.response_performance || {}) },
            offer_performance: { ...EMPTY_HOST_ANALYTICS.offer_performance, ...(payload.offer_performance || {}) },
            demand_series: Array.isArray(payload.demand_series) ? payload.demand_series : [],
            top_activities: Array.isArray(payload.top_activities) ? payload.top_activities : [],
            top_locations: Array.isArray(payload.top_locations) ? payload.top_locations : [],
            budget_by_activity: Array.isArray(payload.budget_by_activity) ? payload.budget_by_activity : [],
          });
          setAnalyticsError("");
        }

        const eventIds = loadedEvents.map((item) => item.id);
        const packageIds = loadedPackages.map((item) => item.id);

        const [
          eventInterestResult,
          packageInterestResult,
        ] = await Promise.all([
          eventIds.length > 0
            ? supabase
                .from("event_interested")
                .select("event_id")
                .in("event_id", eventIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),

          packageIds.length > 0
            ? supabase
                .from("package_interested")
                .select("package_id")
                .in("package_id", packageIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),
        ]);

        if (eventInterestResult.error) {
          console.error(
            "Event interest error:",
            eventInterestResult.error
          );
        }

        if (packageInterestResult.error) {
          console.error(
            "Package interest error:",
            packageInterestResult.error
          );
        }

        const nextEventCounts = (
          eventInterestResult.data || []
        ).reduce((accumulator, row) => {
          accumulator[row.event_id] =
            numberValue(accumulator[row.event_id]) + 1;

          return accumulator;
        }, {});

        const nextPackageCounts = (
          packageInterestResult.data || []
        ).reduce((accumulator, row) => {
          accumulator[row.package_id] =
            numberValue(accumulator[row.package_id]) + 1;

          return accumulator;
        }, {});

        setEventCounts(nextEventCounts);
        setPackageCounts(nextPackageCounts);
      } catch (error) {
        console.error(
          "Greška pri učitavanju dashboarda:",
          error
        );

        setMessage(
          error?.message ||
            "Kontrolni centar trenutno nije moguće učitati."
        );
      } finally {
        setDashboardLoading(false);
        setRefreshing(false);
      }
    },
    [isHost, profile?.id]
  );

  useEffect(() => {
    if (loading) return;

    loadDashboard();
  }, [loading, loadDashboard]);

  const rejectDemand = useCallback(
    async (demand) => {
      if (!demand?.id || rejectingDemandId) return;

      const confirmed = window.confirm(
        `Odbiti zahtev za ${humanizeActivity(demand.activity)}? Ovaj zahtev će nestati sa tvog dashboarda.`
      );

      if (!confirmed) return;

      setRejectingDemandId(demand.id);
      setMessage("");

      try {
        const { error } = await supabase.rpc(
          "reject_adventure_demand",
          {
            p_intent_id: demand.id,
          }
        );

        if (error) throw error;

        setDemandIntelligence((current) => {
          const currentDemands = Array.isArray(current?.demands)
            ? current.demands
            : [];

          return {
            ...current,
            pending_demands: Math.max(
              numberValue(current?.pending_demands) - 1,
              0
            ),
            demands: currentDemands.filter(
              (item) => item?.id !== demand.id
            ),
          };
        });

        setHostAnalytics((current) => ({
          ...current,
          response_performance: {
            ...current.response_performance,
            responded_demands:
              numberValue(
                current.response_performance?.responded_demands
              ) + 1,
            unanswered_demands: Math.max(
              numberValue(
                current.response_performance?.unanswered_demands
              ) - 1,
              0
            ),
          },
        }));
      } catch (rejectError) {
        console.error("Reject adventure demand error:", rejectError);
        setMessage(
          rejectError?.message ||
            "Zahtev trenutno nije moguće odbiti."
        );
      } finally {
        setRejectingDemandId("");
      }
    },
    [rejectingDemandId]
  );

  const deleteEvent = useCallback(async (id) => {
    const confirmed = window.confirm(
      "Da li sigurno želiš da obrišeš ovaj događaj?"
    );

    if (!confirmed) return;

    setDeletingItem(`event-${id}`);
    setMessage("");

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEvents((current) =>
        current.filter((event) => event.id !== id)
      );

      setEventCounts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setSummary((current) => ({
        ...current,
        total_events: Math.max(
          numberValue(current.total_events) - 1,
          0
        ),
      }));
    } catch (error) {
      setMessage(
        error?.message ||
          "Događaj nije moguće obrisati."
      );
    } finally {
      setDeletingItem("");
    }
  }, []);

  const deletePackage = useCallback(async (id) => {
    const confirmed = window.confirm(
      "Da li sigurno želiš da obrišeš ovaj paket?"
    );

    if (!confirmed) return;

    setDeletingItem(`package-${id}`);
    setMessage("");

    try {
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPackages((current) =>
        current.filter((item) => item.id !== id)
      );

      setPackageCounts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setSummary((current) => ({
        ...current,
        total_packages: Math.max(
          numberValue(current.total_packages) - 1,
          0
        ),
      }));
    } catch (error) {
      setMessage(
        error?.message ||
          "Paket nije moguće obrisati."
      );
    } finally {
      setDeletingItem("");
    }
  }, []);

  const totalEventInterested = useMemo(
    () =>
      Object.values(eventCounts).reduce(
        (sum, count) => sum + numberValue(count),
        0
      ),
    [eventCounts]
  );

  const totalPackageInterested = useMemo(
    () =>
      Object.values(packageCounts).reduce(
        (sum, count) => sum + numberValue(count),
        0
      ),
    [packageCounts]
  );

  const totalInterest =
    totalEventInterested + totalPackageInterested;

  const grossRevenue = numberValue(summary.gross_revenue);
  const totalExpenses = numberValue(summary.total_expenses);
  const netRevenue = grossRevenue - totalExpenses;
  const pendingBookings = numberValue(
    summary.pending_bookings
  );
  const totalBookings = numberValue(summary.total_bookings);
  const averageRating = numberValue(summary.average_rating);

  if (loading || dashboardLoading) {
    return <DashboardLoading />;
  }

  if (!isHost) {
    return <UnauthorizedState />;
  }

  const hostName =
    profile?.full_name ||
    profile?.username ||
    "domaćine";

  return (
    <>
      <DashboardStyles />

      <main className="hostDashboardPage">
        <div className="dashboardContainer">
          <section className="dashboardHero">
            <div className="heroDecoration heroDecorationOne" />
            <div className="heroDecoration heroDecorationTwo" />

            <div className="heroTopbar">
              <span className="heroTopbarBadge">
                <Icon name="dashboard" size={15} />
                Creator OS
              </span>

              <button
                type="button"
                className="refreshButton"
                onClick={() =>
                  loadDashboard({ silent: true })
                }
                disabled={refreshing}
              >
                {refreshing ? (
                  <span className="smallLoader light" />
                ) : (
                  <Icon name="refresh" size={16} />
                )}

                {refreshing ? "Osvežavanje" : "Osveži"}
              </button>
            </div>

            <div className="heroMain">
              <div className="heroCopy">
                <span className="heroKicker">
                  Kontrolni centar organizatora
                </span>

                <h1>
                  Dobrodošao,
                  <br />
                  {hostName}.
                </h1>

                <p>
                  Rezervacije, prihod, interesovanje i sav sadržaj
                  sada su na jednom mestu. Bez tabela sa strane i
                  bez ručnog sabiranja.
                </p>

                <div className="heroPulse">
                  <span className="heroPulseDot" />

                  <div>
                    <strong>
                      {pendingBookings > 0
                        ? `${pendingBookings} novih zahteva čeka odgovor`
                        : "Sve rezervacije su obrađene"}
                    </strong>

                    <small>
                      {totalBookings} ukupno evidentiranih rezervacija
                    </small>
                  </div>
                </div>
              </div>

              <div className="heroActions">
                <Link
                  to="/host-bookings"
                  className="heroPrimaryAction"
                >
                  <span>
                    <Icon name="booking" size={20} />
                  </span>

                  <div>
                    <strong>Otvori rezervacije</strong>
                    <small>
                      Odobri, odbij ili završi zahteve.
                    </small>
                  </div>

                  <Icon name="arrowRight" size={18} />
                </Link>

                <div className="heroActionPair">
                  <Link
                    to="/create-event"
                    className="heroMiniAction"
                  >
                    <Icon name="calendar" size={18} />
                    Novi događaj
                  </Link>

                  <Link
                    to="/create-package"
                    className="heroMiniAction"
                  >
                    <Icon name="package" size={18} />
                    Novi paket
                  </Link>
                </div>
              </div>
            </div>

            <div className="heroBottom">
              <div className="heroBottomMetric">
                <span>Bruto prihod</span>
                <strong>
                  {formatMoney(grossRevenue, "EUR")}
                </strong>
              </div>

              <div className="heroBottomMetric">
                <span>Prosečna ocena</span>
                <strong>
                  {averageRating.toFixed(1)} / 5
                </strong>
              </div>

              <div className="heroBottomLinks">
                {profile?.username && (
                  <Link to={`/h/${profile.username}`}>
                    <Icon name="eye" size={17} />
                    Javni profil
                  </Link>
                )}

                <Link to="/host-bookings">
                  Sve rezervacije
                  <Icon name="arrowRight" size={16} />
                </Link>
              </div>
            </div>
          </section>

          {message && (
            <div
              className="dashboardMessage"
              role="alert"
            >
              <span>
                <Icon name="alert" size={18} />
              </span>

              <p>{message}</p>

              <button
                type="button"
                onClick={() => setMessage("")}
                aria-label="Zatvori poruku"
              >
                <Icon name="close" size={17} />
              </button>
            </div>
          )}

          <section className="statsGrid">
            <StatCard
              icon="money"
              label="Bruto prihod"
              value={formatMoney(grossRevenue, "EUR")}
              description="Odobrene i završene rezervacije."
              accent="dark"
            />

            <StatCard
              icon="booking"
              label="Na čekanju"
              value={pendingBookings}
              description="Zahtevi koji čekaju tvoju odluku."
              accent="amber"
            />

            <StatCard
              icon="star"
              label="Prosečna ocena"
              value={averageRating.toFixed(1)}
              description="Ocene svih objavljenih paketa."
              accent="gold"
            />

            <StatCard
              icon="heart"
              label="Interesovanje"
              value={totalInterest}
              description="Sačuvani događaji i paketi."
              accent="green"
            />
          </section>

          <section className="operationsGrid">
            <article className="financePanel">
              <div className="panelHeader">
                <div>
                  <span className="sectionKicker">
                    Finansije
                  </span>
                  <h2>Poslovni rezultat</h2>
                </div>

                <span className="panelIcon">
                  <Icon name="wallet" size={21} />
                </span>
              </div>

              <div className="financeHero">
                <span>Procena neto rezultata</span>
                <strong>
                  {formatMoney(netRevenue, "EUR")}
                </strong>
                <small>
                  Bruto prihod umanjen za evidentirane troškove.
                </small>
              </div>

              <div className="financeBreakdown">
                <div>
                  <span>Prihod</span>
                  <strong>
                    {formatMoney(grossRevenue, "EUR")}
                  </strong>
                </div>

                <div>
                  <span>Troškovi</span>
                  <strong>
                    {formatMoney(totalExpenses, "EUR")}
                  </strong>
                </div>

                <div>
                  <span>Završene ture</span>
                  <strong>
                    {numberValue(summary.completed_bookings)}
                  </strong>
                </div>
              </div>
            </article>

            <article className="bookingPanel">
              <div className="panelHeader">
                <div>
                  <span className="sectionKicker">
                    Poslednje aktivnosti
                  </span>
                  <h2>Nove rezervacije</h2>
                </div>

                <Link to="/host-bookings" className="panelLink">
                  Sve rezervacije
                  <Icon name="arrowRight" size={15} />
                </Link>
              </div>

              <div className="bookingList">
                {bookings.length === 0 ? (
                  <div className="compactEmpty">
                    <span>
                      <Icon name="booking" size={24} />
                    </span>

                    <div>
                      <strong>Još nema rezervacija.</strong>
                      <small>
                        Novi zahtevi će se pojaviti ovde.
                      </small>
                    </div>
                  </div>
                ) : (
                  bookings.slice(0, 4).map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                    />
                  ))
                )}
              </div>
            </article>
          </section>

          <section className="dashboardQuickActions">
            <div className="quickActionsHeading">
              <div>
                <span className="sectionKicker">
                  Brze akcije
                </span>
                <h2>Najvažnije, bez lutanja.</h2>
              </div>
            </div>

            <div className="quickActionGrid">
              <Link
                to="/create-event"
                className="quickActionCard"
              >
                <span>
                  <Icon name="plus" size={21} />
                </span>

                <div>
                  <strong>Novi događaj</strong>
                  <small>
                    Objavi jednodnevnu avanturu.
                  </small>
                </div>

                <Icon name="arrowRight" size={17} />
              </Link>

              <Link
                to="/create-package"
                className="quickActionCard"
              >
                <span>
                  <Icon name="package" size={21} />
                </span>

                <div>
                  <strong>Novi paket</strong>
                  <small>
                    Kreiraj turu ili višednevno iskustvo.
                  </small>
                </div>

                <Icon name="arrowRight" size={17} />
              </Link>

              <Link
                to="/host-bookings"
                className="quickActionCard"
              >
                <span>
                  <Icon name="booking" size={21} />
                </span>

                <div>
                  <strong>Rezervacije</strong>
                  <small>
                    Upravljaj svim zahtevima gostiju.
                  </small>
                </div>

                <Icon name="arrowRight" size={17} />
              </Link>

              {profile?.username && (
                <Link
                  to={`/h/${profile.username}`}
                  className="quickActionCard"
                >
                  <span>
                    <Icon name="eye" size={21} />
                  </span>

                  <div>
                    <strong>Javni profil</strong>
                    <small>
                      Proveri kako te vide korisnici.
                    </small>
                  </div>

                  <Icon name="arrowRight" size={17} />
                </Link>
              )}
            </div>
          </section>

          <DemandIntelligenceSection
            intelligence={demandIntelligence}
            error={demandError}
            rejectingDemandId={rejectingDemandId}
            onRejectDemand={rejectDemand}
          />

          <HostAnalyticsSection
            analytics={hostAnalytics}
            intelligence={demandIntelligence}
            error={analyticsError}
          />

          <section className="inventoryHeader">
            <div>
              <span className="sectionKicker">
                Ponuda
              </span>
              <h2>Sadržaj koji prodaješ.</h2>
              <p>
                Uredi, proveri interesovanje ili otvori javni prikaz
                svake ponude.
              </p>
            </div>

            <div className="inventorySummary">
              <span>
                {events.length + packages.length}
              </span>
              <small>ukupno aktivnih stavki</small>
            </div>
          </section>

          <section className="dashboardSection">
            <div className="dashboardSectionHeader">
              <div>
                <span className="sectionKicker">
                  Događaji
                </span>
                <h2>Moji događaji</h2>

                <p>
                  Jednodnevna okupljanja, aktivnosti i avanture.
                </p>
              </div>

              <Link
                to="/create-event"
                className="sectionButton"
              >
                <Icon name="plus" size={16} />
                Novi događaj
              </Link>
            </div>

            {events.length === 0 ? (
              <EmptySection
                type="event"
                title="Još nemaš objavljene događaje."
                description="Kreiraj prvu outdoor avanturu i počni da okupljaš zajednicu."
                buttonText="Kreiraj prvi događaj"
                buttonUrl="/create-event"
              />
            ) : (
              <div className="dashboardItemsGrid">
                {events.map((event) => (
                  <DashboardItemCard
                    key={event.id}
                    type="event"
                    item={event}
                    interestedCount={
                      eventCounts[event.id] || 0
                    }
                    deleting={
                      deletingItem ===
                      `event-${event.id}`
                    }
                    onDelete={deleteEvent}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="dashboardSection packagesDashboardSection">
            <div className="dashboardSectionHeader">
              <div>
                <span className="sectionKicker">
                  Paketi i ture
                </span>
                <h2>Moji paketi</h2>

                <p>
                  Višednevna iskustva, ture i kompletne outdoor ponude.
                </p>
              </div>

              <Link
                to="/create-package"
                className="sectionButton"
              >
                <Icon name="plus" size={16} />
                Novi paket
              </Link>
            </div>

            {packages.length === 0 ? (
              <EmptySection
                type="package"
                title="Još nemaš objavljene pakete."
                description="Kreiraj turu ili kompletno iskustvo sa aktivnostima, rasporedom i cenom."
                buttonText="Kreiraj prvi paket"
                buttonUrl="/create-package"
              />
            ) : (
              <div className="dashboardItemsGrid">
                {packages.map((item) => (
                  <DashboardItemCard
                    key={item.id}
                    type="package"
                    item={item}
                    interestedCount={
                      packageCounts[item.id] || 0
                    }
                    deleting={
                      deletingItem ===
                      `package-${item.id}`
                    }
                    onDelete={deletePackage}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      body{margin:0;background:#edf1e9}
      button,input,textarea{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .hostDashboardPage,.dashboardStatePage{min-height:100vh;color:#17271f;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .hostDashboardPage{padding:128px 24px 96px;background:radial-gradient(circle at 8% 0%,rgba(173,211,132,.2),transparent 25%),radial-gradient(circle at 96% 18%,rgba(67,111,77,.11),transparent 27%),#edf1e9}
      .hostDashboardPage a,.dashboardStatePage a{color:inherit;text-decoration:none}
      .dashboardContainer{width:min(1280px,100%);margin:0 auto}
      .dashboardHero{position:relative;isolation:isolate;min-height:610px;padding:32px;overflow:hidden;border-radius:38px;color:#fff;box-shadow:0 34px 90px rgba(19,49,31,.21)}
      .dashboardHero:before{position:absolute;inset:0;z-index:-2;content:"";background:linear-gradient(105deg,rgba(3,18,9,.98),rgba(15,50,29,.9) 53%,rgba(18,41,28,.68)),url("https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=88") center/cover}
      .dashboardHero:after{position:absolute;inset:0;z-index:-1;content:"";background:radial-gradient(circle at 74% 35%,rgba(201,242,140,.12),transparent 25%)}
      .heroDecoration{position:absolute;z-index:-1;border:1px solid rgba(255,255,255,.07);border-radius:50%}
      .heroDecorationOne{right:-190px;bottom:-245px;width:560px;height:560px;box-shadow:0 0 0 85px rgba(255,255,255,.018),0 0 0 170px rgba(255,255,255,.01)}
      .heroDecorationTwo{top:-120px;right:25%;width:240px;height:240px}
      .heroTopbar{display:flex;align-items:center;justify-content:space-between;gap:16px}
      .heroTopbarBadge,.refreshButton{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 13px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.78);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(12px)}
      .refreshButton{cursor:pointer;letter-spacing:0;text-transform:none;transition:.18s}
      .refreshButton:hover:not(:disabled){background:rgba(255,255,255,.13);color:#fff}
      .refreshButton:disabled{cursor:wait;opacity:.7}
      .heroMain{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(340px,.62fr);align-items:end;gap:56px;margin-top:96px}
      .heroKicker,.sectionKicker{display:block;color:#7f9f5d;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
      .heroKicker{color:#c9f28c}
      .heroCopy h1{max-width:820px;margin:16px 0 0;font-size:clamp(58px,7.4vw,98px);line-height:.89;letter-spacing:-.078em}
      .heroCopy p{max-width:620px;margin:24px 0 0;color:rgba(255,255,255,.64);font-size:14px;line-height:1.75}
      .heroPulse{display:flex;align-items:center;gap:12px;width:fit-content;margin-top:28px;padding:12px 15px;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:rgba(255,255,255,.06);backdrop-filter:blur(11px)}
      .heroPulseDot{width:9px;height:9px;border-radius:50%;background:#c9f28c;box-shadow:0 0 0 6px rgba(201,242,140,.11)}
      .heroPulse strong,.heroPulse small{display:block}
      .heroPulse strong{font-size:10px}
      .heroPulse small{margin-top:3px;color:rgba(255,255,255,.48);font-size:8px}
      .heroActions{display:grid;gap:12px}
      .heroPrimaryAction{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;min-height:92px;padding:16px;border-radius:21px;background:#c9f28c;color:#183a27!important;box-shadow:0 18px 42px rgba(3,17,8,.25);transition:.2s}
      .heroPrimaryAction:hover{transform:translateY(-3px)}
      .heroPrimaryAction>span{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:rgba(24,58,39,.11)}
      .heroPrimaryAction strong,.heroPrimaryAction small{display:block}
      .heroPrimaryAction strong{font-size:12px}
      .heroPrimaryAction small{margin-top:4px;opacity:.65;font-size:9px}
      .heroActionPair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .heroMiniAction{display:flex;align-items:center;justify-content:center;gap:8px;min-height:55px;padding:0 12px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(255,255,255,.08);color:#fff!important;font-size:9px;font-weight:850;backdrop-filter:blur(12px);transition:.18s}
      .heroMiniAction:hover{background:rgba(255,255,255,.14);transform:translateY(-2px)}
      .heroBottom{display:grid;grid-template-columns:auto auto minmax(0,1fr);align-items:end;gap:42px;margin-top:58px;padding-top:22px;border-top:1px solid rgba(255,255,255,.1)}
      .heroBottomMetric span,.heroBottomMetric strong{display:block}
      .heroBottomMetric span{color:rgba(255,255,255,.45);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      .heroBottomMetric strong{margin-top:5px;font-size:18px}
      .heroBottomLinks{display:flex;justify-content:flex-end;gap:18px}
      .heroBottomLinks a{display:inline-flex;align-items:center;gap:7px;color:rgba(255,255,255,.65);font-size:9px;font-weight:800;transition:.18s}
      .heroBottomLinks a:hover{gap:10px;color:#fff}
      .dashboardMessage{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;margin-top:20px;padding:14px;border:1px solid #efc6c1;border-radius:16px;background:#fff0ee;color:#963e34}
      .dashboardMessage>span{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#f7d7d3}
      .dashboardMessage p{margin:0;font-size:11px;line-height:1.5}
      .dashboardMessage button{display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:9px;background:transparent;color:inherit;cursor:pointer}
      .intelligenceShell{position:relative;margin-top:24px;padding:28px;border:1px solid rgba(48,78,58,.14);border-radius:30px;background:linear-gradient(145deg,rgba(255,255,255,.94),rgba(244,248,239,.88));box-shadow:0 20px 52px rgba(31,52,39,.07);overflow:hidden}
      .intelligenceShell:before{position:absolute;top:-120px;right:-80px;width:360px;height:360px;border-radius:50%;content:"";background:radial-gradient(circle,rgba(201,242,140,.2),transparent 68%);pointer-events:none}
      .intelligenceHeader{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:26px}
      .intelligenceTitleWrap{display:flex;align-items:flex-start;gap:15px;min-width:0}
      .intelligenceLogo{display:grid;place-items:center;flex:0 0 auto;width:49px;height:49px;border-radius:16px;background:#173625;color:#c9f28c;box-shadow:0 13px 28px rgba(23,54,37,.16)}
      .intelligenceHeader h2{max-width:760px;margin:7px 0 0;color:#1d3326;font-size:clamp(28px,4vw,43px);line-height:1;letter-spacing:-.055em}
      .intelligenceHeader p{max-width:720px;margin:12px 0 0;color:#77857b;font-size:11px;line-height:1.65}
      .intelligenceSignal{display:flex;align-items:center;gap:11px;flex:0 0 auto;min-width:220px;padding:13px 15px;border:1px solid #dbe5d6;border-radius:17px;background:rgba(255,255,255,.78)}
      .signalDot{width:9px;height:9px;border-radius:50%;background:#7cad4c;box-shadow:0 0 0 6px rgba(124,173,76,.12)}
      .intelligenceSignal strong,.intelligenceSignal small{display:block}
      .intelligenceSignal strong{color:#31473a;font-size:10px}
      .intelligenceSignal small{margin-top:3px;color:#8a958d;font-size:8px}
      .demandMetricsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-top:24px}
      .demandMetric{display:flex;align-items:flex-start;gap:12px;min-width:0;padding:16px;border:1px solid #dee6db;border-radius:19px;background:rgba(255,255,255,.78)}
      .demandMetric.dark{border-color:#193a28;background:#193a28;color:#fff}
      .demandMetric.fresh{background:#f3f9e9;border-color:#dbe9c7}
      .demandMetric.attention{background:#fff8eb;border-color:#f0dfbd}
      .demandMetricIcon{display:grid;place-items:center;flex:0 0 auto;width:39px;height:39px;border-radius:12px;background:#e9f1e2;color:#5a7745}
      .demandMetric.dark .demandMetricIcon{background:rgba(255,255,255,.1);color:#c9f28c}
      .demandMetric.attention .demandMetricIcon{background:#fff0d7;color:#a26a24}
      .demandMetricCopy{min-width:0}
      .demandMetricCopy>span,.demandMetricCopy>strong,.demandMetricCopy>small{display:block}
      .demandMetricCopy>span{color:#7e8b82;font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}
      .demandMetric.dark .demandMetricCopy>span{color:rgba(255,255,255,.52)}
      .demandMetricCopy>strong{margin-top:6px;color:#263c2f;font-size:25px;line-height:1;letter-spacing:-.04em}
      .demandMetric.dark .demandMetricCopy>strong{color:#fff}
      .demandMetricCopy>small{margin-top:5px;color:#929c95;font-size:7.5px;line-height:1.4}
      .demandMetric.dark .demandMetricCopy>small{color:rgba(255,255,255,.42)}
      .nextActionPanel{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:18px;margin-top:16px;padding:18px;border:1px solid #bfd2b4;border-radius:22px;background:linear-gradient(135deg,#f7fbf2,#edf6e5);box-shadow:0 14px 34px rgba(42,75,48,.06)}
      .nextActionBadge{display:inline-flex;align-items:center;gap:6px;color:#63814c;font-size:7px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .nextActionCopy h3{margin:7px 0 0;color:#294332;font-size:22px;line-height:1;letter-spacing:-.045em}
      .nextActionCopy p{margin:7px 0 0;color:#7e8d82;font-size:8px;line-height:1.5}
      .nextActionValue{min-width:150px;padding:11px 13px;border-left:1px solid #d8e4d2}
      .nextActionValue small,.nextActionValue strong{display:block}
      .nextActionValue small{color:#8b998e;font-size:7px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}
      .nextActionValue strong{margin-top:5px;color:#31533a;font-size:18px;letter-spacing:-.035em}
      .nextActionButton{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:45px;padding:0 16px;border-radius:14px;background:#173c28;color:#fff!important;font-size:9px;font-weight:900;box-shadow:0 12px 26px rgba(25,63,42,.16);transition:.18s}
      .nextActionButton:hover{transform:translateY(-2px);background:#204b34}
      .demandInboxPanel{position:relative;margin-top:16px;padding:20px;border:1px solid #dce5d9;border-radius:23px;background:rgba(250,252,248,.84)}
      .demandInboxHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:14px}
      .demandInboxHeader h3{margin:6px 0 0;color:#253a2d;font-size:24px;line-height:1;letter-spacing:-.045em}
      .demandInboxHeader>div>small{display:block;margin-top:7px;color:#8b978f;font-size:7px;line-height:1.45}
      .privacyBadge{display:inline-flex;align-items:center;gap:6px;min-height:31px;padding:0 10px;border-radius:999px;background:#eaf2e3;color:#587540;font-size:8px;font-weight:850}
      .demandCardsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
      .demandCard{min-width:0;padding:17px;border:1px solid #dfe7dc;border-radius:19px;background:#fff;box-shadow:0 8px 24px rgba(33,53,40,.035);transition:.18s}
      .demandCard:hover{border-color:#b8c9af;transform:translateY(-2px);box-shadow:0 13px 31px rgba(33,53,40,.07)}
      .demandCard.waiting{border-left:4px solid #9bbf67}
      .demandCard.responded{opacity:.78}
      .demandCard.featured{border-color:#a9c394;box-shadow:0 15px 34px rgba(64,95,56,.09)}
      .demandCardTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .demandActivityIdentity{display:flex;align-items:center;gap:10px;min-width:0}
      .demandActivityIcon{display:grid;place-items:center;flex:0 0 auto;width:39px;height:39px;border-radius:12px;background:#edf4e5;color:#5c7b42}
      .demandEyebrow{display:block;color:#8b978f;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.09em}
      .demandEyebrowRow{display:flex;align-items:center;gap:7px;min-width:0}
      .priorityPill{display:inline-flex;align-items:center;min-height:20px;padding:0 7px;border-radius:999px;font-size:6px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}
      .priorityPill.high{background:#173d29;color:#d8f5ad}
      .priorityPill.medium{background:#eef6df;color:#638240}
      .priorityPill.normal{background:#f3f4f1;color:#7d877f}
      .demandActivityIdentity h3{overflow:hidden;margin:4px 0 0;color:#2e4436;font-size:15px;line-height:1.15;text-overflow:ellipsis;white-space:nowrap}
      .demandStatus{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;min-height:27px;padding:0 9px;border-radius:999px;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
      .demandStatus>span{width:6px;height:6px;border-radius:50%;background:currentColor}
      .demandStatus.new{background:#eef7df;color:#60843d}
      .demandStatus.done{background:#edf0ed;color:#78827b}
      .demandLocation{display:flex;align-items:center;gap:7px;margin-top:14px;padding:10px 11px;border-radius:12px;background:#f6f8f4;color:#53665a}
      .demandLocation svg{flex:0 0 auto;color:#79955a}
      .demandLocation strong{overflow:hidden;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
      .demandFacts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}
      .demandFacts>div{display:flex;align-items:center;gap:8px;min-width:0;padding:9px;border:1px solid #e5eae3;border-radius:12px}
      .demandFactIcon{display:grid;place-items:center;flex:0 0 auto;width:29px;height:29px;border-radius:9px;background:#edf3e8;color:#607a4c}
      .demandFacts p{min-width:0;margin:0}
      .demandFacts small,.demandFacts strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .demandFacts small{color:#929b94;font-size:6.5px}
      .demandFacts strong{margin-top:3px;color:#405448;font-size:8.5px}
      .groupBudgetSignal{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:9px;margin-top:9px;padding:10px 11px;border:1px solid #dce7d6;border-radius:13px;background:#f3f8ef}
      .groupBudgetSignal>span{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:#e5efdd;color:#587946}
      .groupBudgetSignal small,.groupBudgetSignal strong{display:block}
      .groupBudgetSignal small{color:#879488;font-size:6.5px;text-transform:uppercase;letter-spacing:.04em}
      .groupBudgetSignal strong{margin-top:3px;color:#315239;font-size:11px}
      .groupBudgetSignal em{color:#9aa39c;font-size:6px;font-style:normal;text-align:right}
      .demandCardFooter{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:11px;padding-top:10px;border-top:1px solid #edf0ec;color:#919b94;font-size:7px}
      .demandCardFooter>span:first-child{display:flex;align-items:center;gap:5px;min-width:0}
      .demandPrimaryAction{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:43px;margin-top:11px;padding:0 12px;border-radius:13px;background:#173d29;color:#fff!important;font-size:8px;font-weight:900;transition:.18s}
      .demandPrimaryAction>span{display:inline-flex;align-items:center;gap:7px}
      .demandPrimaryAction:hover{transform:translateY(-1px);background:#214c35}
      .demandPrimaryAction.secondary{border:1px solid #dce4da;background:#f6f8f5;color:#52665a!important}
      .demandPrimaryAction.secondary:hover{background:#eef2ec}
      .difficultyTag{flex:0 0 auto;padding:5px 7px;border-radius:8px;background:#f1f4ef;color:#6d796f;font-weight:800}
      .demandInlineState{display:flex;align-items:center;gap:12px;padding:25px;border:1px dashed #cfd9cc;border-radius:17px;background:#fff}
      .demandInlineState>span{display:grid;place-items:center;width:45px;height:45px;border-radius:14px;background:#eaf2e3;color:#5b7842}
      .demandInlineState strong,.demandInlineState small{display:block}
      .demandInlineState strong{color:#34483b;font-size:10px}
      .demandInlineState small{margin-top:4px;color:#8d9790;font-size:8px;line-height:1.5}
      .demandInlineState.error{border-color:#efcfc9;background:#fff9f8}
      .demandInlineState.error>span{background:#fbe6e2;color:#a24b3f}
      .agentInsightsPanel{margin-bottom:18px;padding:22px;border:1px solid #d7e3d1;border-radius:24px;background:linear-gradient(135deg,#102f20,#1d4a31 58%,#315f43);color:#fff;box-shadow:0 20px 45px rgba(23,58,39,.12)}
      .agentInsightsHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
      .agentInsightsTitle{display:flex;align-items:flex-start;gap:13px;min-width:0}
      .agentInsightsIcon{display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.08);color:#d7f2ac}
      .agentInsightsTitle .sectionKicker{color:#c5e994}
      .agentInsightsTitle h3{margin:5px 0 0;color:#fff;font-size:25px;line-height:1;letter-spacing:-.045em}
      .agentInsightsTitle p{max-width:650px;margin:8px 0 0;color:rgba(255,255,255,.52);font-size:9px;line-height:1.55}
      .agentDataBadge{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:8px 10px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.65);font-size:8px;font-weight:850}
      .agentInsightsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:18px}
      .agentInsightCard{display:flex;flex-direction:column;min-width:0;min-height:190px;padding:15px;border:1px solid rgba(255,255,255,.09);border-radius:17px;background:rgba(255,255,255,.06)}
      .agentInsightCard.priority{background:linear-gradient(180deg,rgba(234,196,111,.12),rgba(255,255,255,.055));border-color:rgba(234,206,139,.18)}
      .agentInsightCard.positive{background:linear-gradient(180deg,rgba(186,232,142,.10),rgba(255,255,255,.055))}
      .agentInsightCard.market,.agentInsightCard.location{background:linear-gradient(180deg,rgba(166,206,219,.08),rgba(255,255,255,.055))}
      .agentInsightTop{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .agentInsightCardIcon{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(255,255,255,.08);color:#d6efac}
      .agentInsightMetric{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(255,255,255,.52);font-size:7.5px;font-weight:850}
      .agentInsightCard>small{display:block;margin-top:18px;color:#b9da8d;font-size:7px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .agentInsightCard>strong{display:block;margin-top:6px;color:#fff;font-size:13px;line-height:1.25;letter-spacing:-.02em}
      .agentInsightCard>p{margin:7px 0 0;color:rgba(255,255,255,.50);font-size:8px;line-height:1.55}
      .agentInsightAction{display:inline-flex;align-items:center;gap:6px;margin-top:auto;padding-top:13px;color:#d9f3b3!important;font-size:8px;font-weight:900}
      .agentInsightAction:hover{gap:9px}

      .agentRecommendation{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(270px,.65fr);gap:18px;margin-top:12px;padding:20px;border:1px solid #dce6d8;border-radius:22px;background:linear-gradient(135deg,#f5faef,#eef5e8)}
      .agentRecommendationCopy h3{margin:6px 0 0;color:#24422f;font-size:24px;line-height:1;letter-spacing:-.04em}.agentRecommendationCopy p{max-width:720px;margin:10px 0 0;color:#6f7f74;font-size:10px;line-height:1.65}.agentRecommendationCopy p strong{color:#36573e}.agentRecommendationSignals{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.agentRecommendationSignals span{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #d9e5d3;border-radius:999px;background:rgba(255,255,255,.72);color:#58705d;font-size:8px;font-weight:850}.agentRecommendationActions{display:flex;flex-direction:column;justify-content:center;gap:8px}.agentRecommendationActions a{display:flex;align-items:center;justify-content:center;gap:8px;min-height:45px;border-radius:13px;font-size:9px;font-weight:900}.agentRecommendationPrimary{background:linear-gradient(135deg,#163b28,#2f6846);color:#fff!important;box-shadow:0 12px 25px rgba(31,75,50,.14)}.agentRecommendationSecondary{border:1px solid #cfddc8;background:#fff;color:#476052!important}.agentRecommendationActions small{color:#8b978f;font-size:7px;line-height:1.45;text-align:center}
      .analyticsShell{margin-top:18px;padding:28px;border:1px solid #d9e2d6;border-radius:30px;background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(248,250,246,.88));box-shadow:0 22px 58px rgba(27,51,35,.065)}
      .analyticsHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}.analyticsHeader h2{margin:8px 0 0;color:#1f3829;font-size:clamp(32px,4vw,48px);line-height:.96;letter-spacing:-.055em}.analyticsHeader p{max-width:760px;margin:12px 0 0;color:#7b8a80;font-size:11px;line-height:1.7}.analyticsLiveBadge{display:inline-flex;align-items:center;gap:8px;flex:0 0 auto;padding:9px 12px;border:1px solid #d8e6d2;border-radius:999px;background:#eef6e9;color:#5d7652;font-size:8px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.analyticsLiveBadge>span{width:7px;height:7px;border-radius:50%;background:#7ba85c;box-shadow:0 0 0 5px rgba(123,168,92,.1)}
      .analyticsError{display:flex;align-items:center;gap:10px;margin-top:20px;padding:14px 16px;border:1px solid #efc9c3;border-radius:15px;background:#fff1ee;color:#944a3f;font-size:10px;font-weight:750}.analyticsKpiGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:22px}.analyticsKpi{min-width:0;padding:18px;border:1px solid #e0e7dd;border-radius:19px;background:#fbfcfa}.analyticsKpi small,.analyticsKpi span{display:block}.analyticsKpi small{color:#8b978f;font-size:8px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.analyticsKpi strong{display:block;margin-top:8px;color:#244430;font-size:30px;letter-spacing:-.05em}.analyticsKpi span{margin-top:5px;color:#8b978f;font-size:8px;line-height:1.45}
      .analyticsMainGrid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(270px,.65fr);gap:12px;margin-top:12px}.analyticsInsightGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}.analyticsPanel{min-width:0;padding:20px;border:1px solid #e0e7dd;border-radius:21px;background:#fbfcfa}.analyticsPanelHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.analyticsPanelHeader h3{margin:6px 0 0;color:#2b4935;font-size:20px;line-height:1;letter-spacing:-.04em}.trendSummary{text-align:right}.trendSummary strong,.trendSummary small{display:block}.trendSummary strong{color:#31543d;font-size:22px}.trendSummary small{margin-top:2px;color:#96a099;font-size:7px;text-transform:uppercase}
      .trendChart{margin-top:22px;padding-top:4px}.trendBars{display:grid;grid-template-columns:repeat(30,minmax(3px,1fr));align-items:end;gap:4px;height:155px}.trendBarColumn{display:grid;grid-template-rows:130px 16px;gap:5px;align-items:end;min-width:0}.trendBarTrack{position:relative;height:130px;border-radius:5px;background:#edf2ea;overflow:hidden}.trendBarTrack>span{position:absolute;left:0;right:0;bottom:0;border-radius:5px 5px 3px 3px;background:#b8c8ae;transition:.2s ease}.trendBarTrack>span.active{background:linear-gradient(180deg,#83a66d,#456f4e)}.trendBarColumn small{overflow:visible;color:#9ca59f;font-size:6px;text-align:center;white-space:nowrap}
      .performanceRows{display:grid;gap:8px;margin-top:16px}.performanceRows>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid #e5eae2;border-radius:13px;background:white}.performanceRows span{color:#718077;font-size:9px}.performanceRows strong{color:#2e5039;font-size:14px}.rankedList{display:grid;gap:12px;margin-top:17px}.rankedRow{display:flex;align-items:flex-start;gap:10px}.rankNumber{flex:0 0 24px;color:#9eaa9f;font-size:8px;font-weight:900}.rankMain{min-width:0;flex:1}.rankTopline{display:flex;align-items:center;justify-content:space-between;gap:10px}.rankTopline strong{overflow:hidden;color:#40564a;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.rankTopline span{flex:0 0 auto;color:#829087;font-size:8px}.rankBar{height:5px;margin-top:7px;border-radius:999px;background:#edf1eb;overflow:hidden}.rankBar>span{display:block;height:100%;border-radius:inherit;background:#789568}.rankMain>small{display:block;margin-top:5px;color:#98a19b;font-size:7px}
      .budgetSignalList{display:grid;gap:8px;margin-top:16px}.budgetSignalRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid #e5eae2;border-radius:13px;background:white}.budgetSignalRow strong,.budgetSignalRow small{display:block}.budgetSignalRow>div:first-child strong{color:#40564a;font-size:10px}.budgetSignalRow>div:first-child small{margin-top:4px;color:#98a29b;font-size:7px}.budgetSignalValue{text-align:right}.budgetSignalValue small{color:#98a29b;font-size:7px;text-transform:uppercase}.budgetSignalValue strong{margin-top:4px;color:#355940;font-size:11px}.budgetDisclaimer{display:block;margin-top:12px;color:#96a099;font-size:7px;line-height:1.5}.analyticsEmpty{margin-top:16px;padding:18px;border:1px dashed #dfe6dc;border-radius:14px;color:#8a978e;font-size:9px;text-align:center}
      .statsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:22px}
      .statCard{min-width:0;padding:21px;border:1px solid #d9e1d6;border-radius:23px;background:rgba(255,255,255,.8);box-shadow:0 14px 36px rgba(34,53,41,.05)}
      .statCard.dark{background:#173625;color:#fff;border-color:#173625}
      .statCardTop{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:24px}
      .statIcon,.statTrend{display:grid;place-items:center;border-radius:13px}
      .statIcon{width:45px;height:45px;background:#e8f1dd;color:#58763e}
      .statCard.dark .statIcon{background:rgba(255,255,255,.1);color:#c9f28c}
      .statCard.amber .statIcon{background:#fff0dc;color:#aa6a22}
      .statCard.gold .statIcon{background:#fff6d8;color:#a67c14}
      .statTrend{width:29px;height:29px;background:#f0f4eb;color:#87987b}
      .statCard.dark .statTrend{background:rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
      .statCard>strong{display:block;color:#20342a;font-size:clamp(25px,3vw,35px);line-height:1;letter-spacing:-.05em;overflow-wrap:anywhere}
      .statCard.dark>strong{color:#fff}
      .statLabel{display:block;margin-top:10px;color:#47584e;font-size:11px;font-weight:850}
      .statCard.dark .statLabel{color:rgba(255,255,255,.8)}
      .statCard>small{display:block;margin-top:6px;color:#929b94;font-size:9px;line-height:1.5}
      .statCard.dark>small{color:rgba(255,255,255,.42)}
      .operationsGrid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:16px;margin-top:22px}
      .financePanel,.bookingPanel{padding:25px;border:1px solid #d9e1d6;border-radius:27px;background:rgba(255,255,255,.78);box-shadow:0 15px 40px rgba(31,51,38,.05)}
      .panelHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
      .panelHeader h2{margin:7px 0 0;font-size:28px;line-height:1;letter-spacing:-.05em}
      .panelIcon{display:grid;place-items:center;width:47px;height:47px;border-radius:15px;background:#e7f0dc;color:#5c7943}
      .panelLink{display:inline-flex;align-items:center;gap:6px;color:#5b6d61!important;font-size:9px;font-weight:850}
      .financeHero{margin-top:27px;padding:23px;border-radius:21px;background:linear-gradient(135deg,#183a27,#274f38);color:#fff}
      .financeHero span,.financeHero strong,.financeHero small{display:block}
      .financeHero span{color:rgba(255,255,255,.48);font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.08em}
      .financeHero strong{margin-top:9px;font-size:38px;line-height:1;letter-spacing:-.05em}
      .financeHero small{margin-top:8px;color:rgba(255,255,255,.46);font-size:8px;line-height:1.5}
      .financeBreakdown{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}
      .financeBreakdown div{padding:13px;border:1px solid #e0e6dd;border-radius:15px;background:#f8faf6}
      .financeBreakdown span,.financeBreakdown strong{display:block}
      .financeBreakdown span{color:#8c968f;font-size:8px}
      .financeBreakdown strong{margin-top:5px;color:#34483b;font-size:12px}
      .bookingList{display:grid;gap:9px;margin-top:20px}
      .bookingRow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:13px;padding:12px;border:1px solid #e0e6dd;border-radius:16px;background:#f8faf6}
      .bookingIdentity{display:flex;align-items:center;gap:11px;min-width:0}
      .bookingIcon{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:12px;background:#e6efd9;color:#5c7843}
      .bookingIdentity div{min-width:0}
      .bookingIdentity strong,.bookingIdentity small,.bookingAmount strong,.bookingAmount small{display:block}
      .bookingIdentity strong{overflow:hidden;color:#34483b;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
      .bookingIdentity small{margin-top:4px;color:#929b94;font-size:7px}
      .bookingAmount{text-align:right}
      .bookingAmount strong{font-size:10px}
      .bookingAmount small{margin-top:3px;color:#929b94;font-size:7px}
      .statusBadge{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
      .statusBadge.pending{background:#fff0dc;color:#9c611f}
      .statusBadge.approved{background:#e4f2dc;color:#4e7835}
      .statusBadge.rejected,.statusBadge.cancelled{background:#ffe9e6;color:#9e453a}
      .statusBadge.completed{background:#e4edf8;color:#3d638d}
      .statusBadge.unknown{background:#ecefeb;color:#6c776f}
      .compactEmpty{display:flex;align-items:center;gap:12px;padding:22px;border:1px dashed #cdd7ca;border-radius:17px;background:#f8faf6}
      .compactEmpty>span{display:grid;place-items:center;width:46px;height:46px;border-radius:15px;background:#e7f0dc;color:#5b7841}
      .compactEmpty strong,.compactEmpty small{display:block}
      .compactEmpty strong{font-size:10px}
      .compactEmpty small{margin-top:4px;color:#8c968f;font-size:8px}
      .dashboardQuickActions,.dashboardSection,.inventoryHeader{margin-top:34px}
      .quickActionsHeading,.dashboardSectionHeader,.inventoryHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:17px}
      .quickActionsHeading h2,.dashboardSectionHeader h2,.inventoryHeader h2{margin:7px 0 0;color:#20342a;font-size:clamp(29px,4vw,41px);line-height:1;letter-spacing:-.055em}
      .dashboardSectionHeader p,.inventoryHeader p{max-width:600px;margin:11px 0 0;color:#7e8981;font-size:11px;line-height:1.6}
      .inventorySummary{display:flex;align-items:center;gap:10px;padding:12px 15px;border:1px solid #d9e1d6;border-radius:16px;background:rgba(255,255,255,.7)}
      .inventorySummary span{font-size:24px;font-weight:900}
      .inventorySummary small{max-width:90px;color:#89938c;font-size:8px;line-height:1.35}
      .quickActionGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}
      .quickActionCard{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;min-height:87px;padding:14px;border:1px solid #d9e1d6;border-radius:20px;background:rgba(255,255,255,.75);transition:.2s}
      .quickActionCard:hover{border-color:#9caf91;background:#fff;transform:translateY(-3px);box-shadow:0 14px 32px rgba(35,53,42,.07)}
      .quickActionCard>span{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:#e8f1dd;color:#59763f}
      .quickActionCard strong,.quickActionCard small{display:block}
      .quickActionCard strong{color:#34483b;font-size:11px}
      .quickActionCard small{margin-top:4px;color:#909992;font-size:8px;line-height:1.45}
      .quickActionCard>svg{color:#8c978f}
      .dashboardSection{padding:27px;border:1px solid #d9e1d6;border-radius:28px;background:rgba(255,255,255,.6);box-shadow:0 15px 43px rgba(32,51,39,.045)}
      .packagesDashboardSection{background:linear-gradient(145deg,rgba(238,245,231,.9),rgba(255,255,255,.68))}
      .sectionButton{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;min-height:43px;padding:0 15px;border-radius:13px;background:#183a27;color:#fff!important;font-size:10px;font-weight:850;box-shadow:0 11px 25px rgba(24,58,39,.15);transition:.18s}
      .sectionButton:hover{gap:11px;background:#224c34;transform:translateY(-2px)}
      .dashboardItemsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}
      .dashboardItemCard{min-width:0;overflow:hidden;border:1px solid #dce2d9;border-radius:23px;background:#fff;transition:.2s}
      .dashboardItemCard:hover{transform:translateY(-4px);box-shadow:0 18px 42px rgba(32,51,39,.09)}
      .itemImageWrapper{position:relative;height:205px;overflow:hidden}
      .itemImage{display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s}
      .dashboardItemCard:hover .itemImage{transform:scale(1.04)}
      .itemImageOverlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,14,8,.08),rgba(4,14,8,.58))}
      .itemTypeBadge,.interestBadge{position:absolute;top:13px;display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid rgba(255,255,255,.17);border-radius:999px;background:rgba(5,20,11,.55);color:#fff;font-size:9px;font-weight:850;backdrop-filter:blur(11px)}
      .itemTypeBadge{left:13px}
      .interestBadge{right:13px;color:#d8f6aa}
      .itemBody{padding:18px}
      .itemKicker{color:#7a9958;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .itemHeading h3{margin:7px 0 0;color:#23362b;font-size:21px;line-height:1.12;letter-spacing:-.035em}
      .itemMeta{display:grid;gap:7px;margin-top:14px}
      .itemMeta>span{display:flex;align-items:center;gap:7px;color:#7b877f;font-size:9px;line-height:1.4}
      .itemMeta svg{flex:0 0 auto;color:#789258}
      .interestSummary{display:flex;align-items:center;gap:10px;margin-top:15px;padding:12px;border-radius:14px;background:#f3f7ee}
      .interestSummary>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#e5efd9;color:#5d7b42}
      .interestSummary strong,.interestSummary small{display:block}
      .interestSummary strong{color:#354a3c;font-size:14px}
      .interestSummary small{margin-top:2px;color:#879188;font-size:8px}
      .itemActions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:15px}
      .itemAction,.deleteAction{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:39px;padding:0 9px;border-radius:11px;cursor:pointer;font-size:9px;font-weight:800;transition:.17s}
      .itemAction{border:1px solid #dbe2d8;background:#f8faf6;color:#475b4e!important}
      .itemAction:hover{border-color:#94aa88;background:#fff}
      .deleteAction{border:1px solid #efcfca;background:#fff2f0;color:#9a4439}
      .deleteAction:hover:not(:disabled){border-color:#df9d94;background:#ffe9e6}
      .deleteAction:disabled{cursor:not-allowed;opacity:.65}
      .smallLoader{width:14px;height:14px;border:2px solid rgba(154,68,57,.2);border-top-color:currentColor;border-radius:50%;animation:dashboardSpin .75s linear infinite}
      .smallLoader.light{border-color:rgba(255,255,255,.22);border-top-color:#fff}
      .emptySection{display:grid;place-items:center;padding:55px 20px;border:1px dashed #cfd8cc;border-radius:21px;background:linear-gradient(145deg,rgba(241,246,235,.8),rgba(250,251,248,.8));text-align:center}
      .emptyIcon{display:grid;place-items:center;width:61px;height:61px;border-radius:19px;background:#e6efd9;color:#607f45}
      .emptySection h3{margin:17px 0 0;color:#34483b;font-size:18px;letter-spacing:-.025em}
      .emptySection p{max-width:510px;margin:9px auto 0;color:#879189;font-size:10px;line-height:1.6}
      .emptySection a{display:inline-flex;align-items:center;gap:7px;margin-top:18px;padding:12px 15px;border-radius:12px;background:#183a27;color:#fff!important;font-size:10px;font-weight:850}
      .dashboardStatePage{display:grid;place-items:center;padding:118px 24px 24px;background:radial-gradient(circle at top left,rgba(166,203,126,.18),transparent 30%),#edf1e9}
      .dashboardStateCard{display:grid;place-items:center;width:min(520px,100%);padding:50px 30px;border:1px solid #dce3d9;border-radius:28px;background:rgba(255,255,255,.82);text-align:center;box-shadow:0 20px 60px rgba(28,48,35,.08)}
      .dashboardLoader{width:37px;height:37px;border:3px solid #dce5d7;border-top-color:#52783c;border-radius:50%;animation:dashboardSpin .8s linear infinite}
      @keyframes dashboardSpin{to{transform:rotate(360deg)}}
      .stateIcon{display:grid;place-items:center;width:60px;height:60px;border-radius:19px;background:#e7f0dc;color:#5b7841}
      .dashboardStateCard h1{margin:19px 0 0;color:#24372c;font-size:29px;letter-spacing:-.045em}
      .dashboardStateCard p{max-width:390px;margin:10px auto 0;color:#7e8981;font-size:11px;line-height:1.6}
      .stateLink{display:inline-flex;align-items:center;gap:7px;margin-top:21px;padding:12px 15px;border-radius:13px;background:#183a27;color:#fff!important;font-size:10px;font-weight:850}

      .intelligenceCommandCenter{margin:22px 0 0;padding:20px;border:1px solid rgba(47,78,57,.12);border-radius:24px;background:radial-gradient(circle at 90% 0%,rgba(199,235,153,.16),transparent 30%),linear-gradient(145deg,#102c1d,#183d29 62%,#214a33);color:#fff;box-shadow:0 18px 45px rgba(18,48,31,.14)}
      .commandCenterTop{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}
      .commandCenterTop h3{max-width:720px;margin:7px 0 0;font-size:clamp(26px,3vw,38px);line-height:1;letter-spacing:-.055em}
      .commandCenterTop p{max-width:650px;margin:11px 0 0;color:rgba(255,255,255,.62);font-size:10px;line-height:1.65}
      .commandCenterStatus{display:inline-flex;align-items:center;gap:8px;flex:0 0 auto;padding:9px 11px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.76);font-size:9px;font-weight:850}
      .commandCenterStatus>span{width:7px;height:7px;border-radius:50%;background:#cef39a;box-shadow:0 0 0 5px rgba(206,243,154,.1)}
      .commandCenterGrid{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px;margin-top:18px}
      .commandCenterGrid>article{min-width:0;padding:18px;border:1px solid rgba(255,255,255,.11);border-radius:19px;background:rgba(255,255,255,.065);backdrop-filter:blur(16px)}
      .commandDecisionCard.urgent{background:linear-gradient(145deg,rgba(206,243,154,.14),rgba(255,255,255,.055));border-color:rgba(206,243,154,.24)}
      .commandCardTop{display:flex;align-items:center;gap:9px;margin-bottom:16px}
      .commandCardTop small{color:rgba(255,255,255,.58);font-size:8px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}
      .commandCardIcon{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(206,243,154,.13);color:#cef39a}
      .commandCardIcon.market{background:rgba(142,196,255,.11);color:#b8d9ff}.commandCardIcon.performance{background:rgba(255,210,125,.11);color:#ffe0a1}
      .commandCenterGrid article>strong{display:block;overflow-wrap:anywhere;font-size:17px;line-height:1.18;letter-spacing:-.035em}
      .commandCenterGrid article>p{margin:8px 0 0;color:rgba(255,255,255,.6);font-size:9px;line-height:1.55}
      .commandPrimaryAction,.commandSecondaryAction{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:39px;margin-top:15px;padding:0 13px;border-radius:11px;font-size:9px;font-weight:900;text-decoration:none!important;transition:.18s ease}
      .commandPrimaryAction{background:#cef39a;color:#17331f!important}.commandSecondaryAction{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff!important}
      .commandPrimaryAction:hover,.commandSecondaryAction:hover{transform:translateY(-1px)}
      .commandMiniStats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:15px}.commandMiniStats>span{padding:10px;border-radius:12px;background:rgba(0,0,0,.13)}
      .commandMiniStats b{display:block;font-size:18px;letter-spacing:-.04em}.commandMiniStats small{display:block;margin-top:2px;color:rgba(255,255,255,.5);font-size:8px}
      .commandPerformanceRows{display:grid;gap:8px}.commandPerformanceRows>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08)}
      .commandPerformanceRows span{color:rgba(255,255,255,.58);font-size:9px}.commandPerformanceRows strong{font-size:13px;white-space:nowrap}
      .commandAttention,.commandGood{margin-top:12px!important;padding:9px 10px;border-radius:10px}.commandAttention{background:rgba(255,190,96,.09);color:#ffe0a1!important}.commandGood{background:rgba(206,243,154,.08);color:#dfffb7!important}

      @media(max-width:1100px){.commandCenterGrid{grid-template-columns:1fr 1fr}.commandPerformanceCard{grid-column:1/-1}.agentInsightsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.analyticsKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.analyticsInsightGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.budgetPanel{grid-column:1/-1}}
      @media(max-width:1080px){
        .heroMain{grid-template-columns:minmax(0,1fr) 340px}
        .demandMetricsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .demandCardsGrid{grid-template-columns:1fr}
        .nextActionPanel{grid-template-columns:minmax(0,1fr) auto}
        .nextActionButton{grid-column:1/-1}
        .statsGrid,.quickActionGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .operationsGrid{grid-template-columns:1fr}
        .dashboardItemsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:760px){
        .commandCenterTop{flex-direction:column}.commandCenterStatus{align-self:flex-start}.commandCenterGrid{grid-template-columns:1fr}.commandPerformanceCard{grid-column:auto}.intelligenceCommandCenter{padding:17px;border-radius:20px}
        .analyticsShell{margin-right:18px;margin-left:18px;padding:20px;border-radius:24px}.agentInsightsHeader{flex-direction:column}.agentDataBadge{align-self:flex-start}.analyticsHeader{flex-direction:column}.analyticsMainGrid,.analyticsInsightGrid{grid-template-columns:1fr}.budgetPanel{grid-column:auto}.analyticsKpiGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.trendBars{gap:2px}
        .hostDashboardPage{padding:92px 0 72px}
        .dashboardStatePage{padding-top:92px}
        .dashboardHero{min-height:auto;padding:24px;border-radius:0 0 32px 32px}
        .heroMain{grid-template-columns:1fr;margin-top:78px}
        .heroCopy h1{font-size:clamp(49px,11vw,72px)}
        .heroBottom{grid-template-columns:repeat(2,minmax(0,1fr))}
        .heroBottomLinks{grid-column:1/-1;justify-content:flex-start}
        .intelligenceShell,.statsGrid,.operationsGrid,.dashboardQuickActions,.inventoryHeader,.dashboardSection,.dashboardMessage{margin-right:18px;margin-left:18px}
        .intelligenceShell{padding:22px}
        .intelligenceHeader{flex-direction:column}
        .intelligenceSignal{width:100%}
        .dashboardSectionHeader,.inventoryHeader{align-items:flex-start;flex-direction:column}
        .inventorySummary{width:100%;justify-content:center}
      }
      @media(max-width:590px){
        .agentRecommendationActions{grid-template-columns:1fr}
        .agentInsightsGrid{grid-template-columns:1fr}.agentInsightCard{min-height:0}.analyticsKpiGrid{grid-template-columns:1fr}.analyticsPanel{padding:17px}.analyticsHeader h2{font-size:32px}.trendBars{height:135px}.trendBarColumn{grid-template-rows:110px 16px}.trendBarTrack{height:110px}
        .heroTopbarBadge{display:none}
        .heroMain{margin-top:62px}
        .heroCopy h1{font-size:46px}
        .heroActionPair,.demandMetricsGrid,.statsGrid,.quickActionGrid,.dashboardItemsGrid{grid-template-columns:1fr}
        .demandInboxHeader{align-items:flex-start;flex-direction:column}
        .demandFacts{grid-template-columns:1fr}
        .nextActionPanel{grid-template-columns:1fr}
        .nextActionValue{padding:10px 0;border-left:0;border-top:1px solid #d8e4d2}
        .nextActionButton{grid-column:auto;width:100%}
        .groupBudgetSignal{grid-template-columns:auto minmax(0,1fr)}
        .groupBudgetSignal em{grid-column:1/-1;text-align:left}
        .heroBottom{gap:20px}
        .financeBreakdown{grid-template-columns:1fr}
        .bookingRow{grid-template-columns:minmax(0,1fr) auto}
        .bookingAmount{display:none}
        .dashboardSection{padding:19px;border-radius:22px}
      }

      @media(max-width:520px){
        .demandCardActions{
          grid-template-columns:1fr;
        }

        .demandRejectAction{
          width:100%;
          min-height:40px;
        }
      }

      @media(max-width:430px){
        .dashboardHero{padding:20px 17px 25px}
        .heroCopy h1{font-size:41px}
        .heroCopy p{font-size:12px}
        .heroPulse{width:100%}
        .heroBottom{grid-template-columns:1fr}
        .heroBottomLinks{grid-column:auto;flex-direction:column}
        .intelligenceShell,.statsGrid,.operationsGrid,.dashboardQuickActions,.inventoryHeader,.dashboardSection,.dashboardMessage{margin-right:13px;margin-left:13px}
        .intelligenceShell{padding:17px;border-radius:23px}
        .intelligenceTitleWrap{gap:11px}
        .intelligenceLogo{width:43px;height:43px;border-radius:14px}
        .intelligenceHeader h2{font-size:31px}
        .demandCardTop{align-items:flex-start;flex-direction:column}
        .quickActionsHeading h2,.dashboardSectionHeader h2,.inventoryHeader h2{font-size:31px}
        .itemActions{grid-template-columns:1fr}
        .financeHero strong{font-size:31px}
        .bookingRow{grid-template-columns:1fr}
        .statusBadge{justify-self:start}
      }


      /* Demand inbox — one clear job: answer or dismiss */
      .compactDemandInbox{
        padding-bottom:18px;
      }

      .compactInboxPanel{
        margin-top:16px;
      }

      .demandCardActions{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:8px;
        margin-top:13px;
      }

      .demandCardActions .demandPrimaryAction{
        margin-top:0;
      }

      .demandRejectAction{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:7px;
        min-width:104px;
        min-height:43px;
        padding:0 13px;
        border:1px solid #e5d4cf;
        border-radius:13px;
        background:#fff8f6;
        color:#9b4c40;
        font-size:9px;
        font-weight:900;
        cursor:pointer;
        transition:.18s ease;
      }

      .demandRejectAction:hover{
        border-color:#d8aaa1;
        background:#fff0ed;
        transform:translateY(-1px);
      }

      .demandRejectAction:disabled{
        opacity:.58;
        cursor:not-allowed;
        transform:none;
      }

      /* =========================================================
         HOST DASHBOARD — PREMIUM MOBILE UX OVERRIDE
         ========================================================= */

      .dashboardContainer,
      .dashboardHero,
      .analyticsShell,
      .intelligenceShell,
      .dashboardSection,
      .financePanel,
      .bookingPanel,
      .statCard,
      .quickActionCard,
      .dashboardItemCard,
      .demandCard,
      .analyticsPanel,
      .agentInsightCard {
        min-width: 0;
      }

      .dashboardItemCard *,
      .demandCard *,
      .analyticsPanel *,
      .agentInsightCard *,
      .quickActionCard *,
      .statCard * {
        min-width: 0;
      }

      .dashboardItemCard h3,
      .demandCard h3,
      .agentInsightCard strong,
      .analyticsPanel h3,
      .quickActionCard strong,
      .bookingIdentity strong {
        overflow-wrap: anywhere;
        word-break: normal;
      }

      @media(max-width:760px){
        .hostDashboardPage{
          padding:74px 0 56px;
          overflow-x:hidden;
          background:
            radial-gradient(circle at 12% 0%,rgba(173,211,132,.16),transparent 22%),
            #edf1e9;
        }

        .dashboardContainer{
          width:100%;
          overflow:visible;
        }

        .dashboardHero{
          min-height:0;
          padding:22px 16px 18px;
          border-radius:0 0 26px 26px;
          box-shadow:0 18px 48px rgba(19,49,31,.17);
        }

        .heroTopbar{gap:10px}
        .heroTopbarBadge{
          display:inline-flex;
          min-height:32px;
          padding:0 10px;
          font-size:8px;
        }

        .refreshButton{
          min-height:34px;
          padding:0 11px;
          font-size:8px;
        }

        .heroMain{
          grid-template-columns:1fr;
          gap:20px;
          margin-top:36px;
        }

        .heroCopy h1{
          max-width:100%;
          margin-top:10px;
          font-size:clamp(38px,11vw,54px);
          line-height:.95;
          letter-spacing:-.062em;
        }

        .heroCopy p{
          max-width:100%;
          margin-top:14px;
          font-size:11px;
          line-height:1.58;
        }

        .heroPulse{
          width:100%;
          margin-top:16px;
          padding:10px 12px;
          border-radius:14px;
        }

        .heroActions{gap:9px}

        .heroPrimaryAction{
          min-height:68px;
          padding:11px;
          border-radius:16px;
        }

        .heroPrimaryAction>span{
          width:42px;
          height:42px;
          border-radius:13px;
        }

        .heroPrimaryAction strong{font-size:11px}
        .heroPrimaryAction small{font-size:8px}

        .heroActionPair{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:8px;
        }

        .heroMiniAction{
          min-height:44px;
          padding:0 10px;
          border-radius:13px;
          font-size:9px;
          white-space:normal;
          text-align:center;
        }

        .heroBottom{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:8px;
          margin-top:17px;
          padding-top:15px;
        }

        .heroBottomMetric{
          min-width:0;
          padding:10px 11px;
          border-radius:13px;
          background:rgba(255,255,255,.055);
        }

        .heroBottomMetric span{font-size:7px}
        .heroBottomMetric strong{
          margin-top:4px;
          font-size:15px;
          overflow-wrap:anywhere;
        }

        .heroBottomLinks{
          grid-column:1/-1;
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          width:100%;
          gap:8px;
        }

        .heroBottomLinks a{
          justify-content:center;
          min-height:39px;
          padding:0 9px;
          border:1px solid rgba(255,255,255,.10);
          border-radius:12px;
          background:rgba(255,255,255,.055);
          font-size:8px;
        }

        .dashboardMessage,
        .statsGrid,
        .operationsGrid,
        .dashboardQuickActions,
        .intelligenceShell,
        .analyticsShell,
        .inventoryHeader,
        .dashboardSection{
          margin-right:12px;
          margin-left:12px;
        }

        .statsGrid{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:8px;
          margin-top:14px;
        }

        .statCard{
          min-height:126px;
          padding:13px;
          border-radius:17px;
        }

        .statCardTop{margin-bottom:12px}

        .statIcon{
          width:36px;
          height:36px;
          border-radius:11px;
        }

        .statTrend{display:none}

        .statCard>strong{
          font-size:23px;
          line-height:1;
          letter-spacing:-.045em;
          overflow-wrap:anywhere;
        }

        .statLabel{
          margin-top:6px;
          font-size:8px;
        }

        .statCard>small{
          margin-top:5px;
          font-size:7px;
          line-height:1.35;
        }

        .dashboardQuickActions{margin-top:20px}
        .quickActionsHeading{margin-bottom:10px}

        .quickActionsHeading h2,
        .dashboardSectionHeader h2,
        .inventoryHeader h2{
          margin-top:5px;
          font-size:27px;
          line-height:1.02;
        }

        .quickActionGrid{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:8px;
        }

        .quickActionCard{
          display:flex;
          flex-direction:column;
          align-items:flex-start;
          gap:8px;
          min-height:124px;
          padding:12px;
          border-radius:17px;
        }

        .quickActionCard>span{
          width:38px;
          height:38px;
          border-radius:12px;
        }

        .quickActionCard>div{width:100%}

        .quickActionCard strong{
          font-size:10px;
          line-height:1.2;
        }

        .quickActionCard small{
          margin-top:4px;
          font-size:7px;
          line-height:1.35;
        }

        .quickActionCard>svg{display:none}

        .intelligenceShell{
          margin-top:20px;
          padding:15px;
          border-radius:20px;
        }

        .intelligenceHeader{gap:13px}

        .intelligenceTitleWrap{
          align-items:flex-start;
          gap:10px;
        }

        .intelligenceLogo{
          flex:0 0 auto;
          width:40px;
          height:40px;
          border-radius:12px;
        }

        .intelligenceHeader h2{
          margin-top:5px;
          font-size:27px;
          line-height:1.02;
        }

        .intelligenceHeader p{
          margin-top:7px;
          font-size:9px;
          line-height:1.45;
        }

        .intelligenceSignal{
          width:100%;
          padding:10px 11px;
          border-radius:13px;
        }

        .demandMetricsGrid{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:7px;
          margin-top:12px;
        }

        .demandMetric{
          min-height:108px;
          padding:11px;
          border-radius:15px;
        }

        .demandMetricIcon{
          width:34px;
          height:34px;
          border-radius:10px;
        }

        .demandMetricCopy strong{
          margin-top:3px;
          font-size:20px;
        }

        .demandMetricCopy span,
        .demandMetricCopy small{font-size:7px}

        .nextActionPanel{
          grid-template-columns:1fr;
          gap:10px;
          padding:13px;
          border-radius:16px;
        }

        .nextActionCopy h3{
          margin-top:7px;
          font-size:20px;
          overflow-wrap:anywhere;
        }

        .nextActionCopy p{
          font-size:8px;
          line-height:1.45;
        }

        .nextActionValue{
          padding:10px 0;
          border-top:1px solid #d8e4d2;
          border-left:0;
        }

        .nextActionButton{
          width:100%;
          min-height:41px;
          justify-content:center;
        }

        .demandInboxPanel{
          padding:13px;
          border-radius:17px;
        }

        .demandInboxHeader{
          align-items:flex-start;
          flex-direction:column;
          gap:10px;
        }

        .privacyBadge{
          align-self:flex-start;
          max-width:100%;
        }

        .demandCardsGrid{
          grid-template-columns:1fr;
          gap:9px;
        }

        .demandCard{
          padding:13px;
          border-radius:17px;
        }

        .demandCardTop{
          align-items:flex-start;
          gap:10px;
        }

        .demandActivityIdentity{min-width:0}

        .demandActivityIdentity h3{
          font-size:18px;
          line-height:1.08;
        }

        .demandStatus{
          flex:0 0 auto;
          white-space:nowrap;
          font-size:7px;
        }

        .demandFacts{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:7px;
        }

        .demandFacts>div{
          min-width:0;
          padding:9px;
          border-radius:12px;
        }

        .demandFacts strong{
          overflow-wrap:anywhere;
          font-size:8px;
          line-height:1.3;
        }

        .groupBudgetSignal{
          grid-template-columns:auto minmax(0,1fr);
          gap:9px;
          padding:10px;
        }

        .groupBudgetSignal em{
          grid-column:1/-1;
          text-align:left;
        }

        .demandCardFooter{
          align-items:flex-start;
          flex-direction:column;
          gap:7px;
        }

        .demandPrimaryAction{
          min-height:41px;
          padding:0 12px;
          border-radius:12px;
        }

        .operationsGrid{
          gap:10px;
          margin-top:20px;
        }

        .financePanel,
        .bookingPanel{
          padding:15px;
          border-radius:19px;
        }

        .panelHeader{gap:12px}
        .panelHeader h2{font-size:24px}

        .financeHero{
          margin-top:15px;
          padding:15px;
          border-radius:16px;
        }

        .financeHero strong{
          margin-top:7px;
          font-size:29px;
          overflow-wrap:anywhere;
        }

        .financeBreakdown{
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:6px;
          margin-top:8px;
        }

        .financeBreakdown div{
          min-width:0;
          padding:9px;
          border-radius:12px;
        }

        .financeBreakdown span{font-size:7px}

        .financeBreakdown strong{
          font-size:9px;
          overflow-wrap:anywhere;
        }

        .bookingList{
          gap:7px;
          margin-top:13px;
        }

        .bookingRow{
          grid-template-columns:minmax(0,1fr) auto;
          gap:9px;
          padding:10px;
          border-radius:13px;
        }

        .bookingIdentity{gap:8px}

        .bookingIcon{
          width:34px;
          height:34px;
          border-radius:10px;
        }

        .bookingIdentity strong{
          font-size:9px;
          line-height:1.25;
          white-space:normal;
        }

        .bookingIdentity small{
          font-size:7px;
          line-height:1.35;
        }

        .bookingAmount{display:none}

        .statusBadge{
          min-height:25px;
          padding:0 7px;
          font-size:6.5px;
          white-space:nowrap;
        }

        .analyticsShell{
          margin-top:20px;
          padding:15px;
          border-radius:20px;
        }

        .analyticsHeader{gap:10px}

        .analyticsHeader h2{
          margin-top:6px;
          font-size:27px;
          line-height:1.03;
        }

        .analyticsHeader p{
          margin-top:7px;
          font-size:9px;
          line-height:1.45;
        }

        .analyticsLiveBadge{align-self:flex-start}

        .intelligenceCommandCenter{
          margin-top:13px;
          padding:13px;
          border-radius:17px;
        }

        .commandCenterTop{gap:10px}

        .commandCenterTop h3{
          font-size:22px;
          line-height:1.03;
        }

        .commandCenterTop p{
          font-size:8px;
          line-height:1.45;
        }

        .commandCenterGrid{
          grid-template-columns:1fr;
          gap:8px;
          margin-top:12px;
        }

        .commandCenterGrid>article{
          padding:12px;
          border-radius:14px;
          backdrop-filter:none;
        }

        .commandPerformanceCard{grid-column:auto}

        .agentInsightsPanel{
          padding:13px;
          border-radius:17px;
        }

        .agentInsightsHeader{gap:10px}
        .agentInsightsTitle{gap:9px}
        .agentInsightsTitle h3{font-size:22px}

        .agentInsightsTitle p{
          font-size:8px;
          line-height:1.45;
        }

        .agentInsightsGrid{
          display:grid;
          grid-template-columns:1fr;
          gap:8px;
        }

        .agentInsightCard{
          min-height:0;
          padding:12px;
          border-radius:14px;
        }

        .agentInsightCard>strong{
          font-size:14px;
          line-height:1.18;
        }

        .agentInsightCard p{
          font-size:8px;
          line-height:1.45;
        }

        .agentRecommendation{
          grid-template-columns:1fr;
          gap:12px;
          padding:14px;
          border-radius:17px;
        }

        .agentRecommendationCopy h3{font-size:22px}

        .agentRecommendationCopy p{
          font-size:8px;
          line-height:1.5;
        }

        .agentRecommendationSignals{
          display:flex;
          flex-wrap:wrap;
          gap:6px;
        }

        .agentRecommendationSignals span{
          min-width:0;
          max-width:100%;
          white-space:normal;
        }

        .agentRecommendationActions{
          grid-template-columns:1fr 1fr;
          gap:7px;
        }

        .agentRecommendationActions small{grid-column:1/-1}

        .analyticsKpiGrid{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:7px;
        }

        .analyticsKpi{
          min-height:105px;
          padding:11px;
          border-radius:14px;
        }

        .analyticsKpi strong{
          font-size:21px;
          overflow-wrap:anywhere;
        }

        .analyticsKpi small,
        .analyticsKpi span{font-size:7px}

        .analyticsMainGrid,
        .analyticsInsightGrid{
          grid-template-columns:1fr;
          gap:8px;
        }

        .analyticsPanel{
          padding:13px;
          border-radius:16px;
          overflow:hidden;
        }

        .analyticsPanelHeader{
          align-items:flex-start;
          gap:10px;
        }

        .analyticsPanelHeader h3{
          font-size:18px;
          line-height:1.08;
        }

        .trendChart{
          overflow-x:auto;
          overscroll-behavior-x:contain;
        }

        .trendBars{
          min-width:520px;
          height:130px;
        }

        .rankedRow{min-width:0}

        .rankTopline{
          min-width:0;
          gap:8px;
        }

        .rankTopline strong{overflow-wrap:anywhere}

        .budgetSignalRow{
          grid-template-columns:minmax(0,1fr) auto;
          gap:10px;
        }

        .budgetSignalRow>div:first-child{min-width:0}
        .budgetSignalRow strong{overflow-wrap:anywhere}

        .inventoryHeader{
          margin-top:22px;
          align-items:flex-start;
          flex-direction:column;
          gap:10px;
        }

        .inventoryHeader p{
          margin-top:7px;
          font-size:9px;
          line-height:1.45;
        }

        .inventorySummary{
          width:100%;
          justify-content:space-between;
          padding:10px 12px;
          border-radius:13px;
        }

        .inventorySummary span{font-size:21px}

        .inventorySummary small{
          max-width:none;
          text-align:right;
        }

        .dashboardSection{
          margin-top:12px;
          padding:14px;
          border-radius:19px;
        }

        .dashboardSectionHeader{
          align-items:flex-start;
          flex-direction:column;
          gap:10px;
          margin-bottom:12px;
        }

        .dashboardSectionHeader p{
          margin-top:6px;
          font-size:9px;
          line-height:1.45;
        }

        .sectionButton{
          width:100%;
          min-height:40px;
          justify-content:center;
        }

        .dashboardItemsGrid{
          grid-template-columns:1fr;
          gap:10px;
        }

        .dashboardItemCard{
          display:grid;
          grid-template-columns:112px minmax(0,1fr);
          overflow:hidden;
          border-radius:16px;
        }

        .itemImageWrapper{
          height:100%;
          min-height:180px;
        }

        .itemTypeBadge{
          top:8px;
          left:8px;
          min-height:24px;
          padding:0 7px;
          font-size:7px;
        }

        .interestBadge{
          top:auto;
          right:auto;
          bottom:8px;
          left:8px;
          min-height:24px;
          padding:0 7px;
          font-size:7px;
        }

        .itemBody{
          min-width:0;
          padding:12px;
        }

        .itemHeading h3{
          margin-top:4px;
          font-size:16px;
          line-height:1.08;
        }

        .itemKicker{font-size:7px}

        .itemMeta{
          gap:5px;
          margin-top:9px;
        }

        .itemMeta>span{
          min-width:0;
          align-items:flex-start;
          font-size:7.5px;
          line-height:1.3;
          overflow-wrap:anywhere;
        }

        .interestSummary{
          gap:7px;
          margin-top:9px;
          padding:8px;
          border-radius:11px;
        }

        .interestSummary>span{
          width:28px;
          height:28px;
          border-radius:9px;
        }

        .interestSummary strong{font-size:11px}
        .interestSummary small{font-size:7px}

        .itemActions{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:6px;
          margin-top:9px;
        }

        .itemAction,
        .deleteAction{
          min-width:0;
          min-height:34px;
          padding:0 6px;
          border-radius:9px;
          font-size:7.5px;
          white-space:normal;
          text-align:center;
        }

        .emptySection{
          padding:34px 15px;
          border-radius:16px;
        }
      }

      @media(max-width:430px){
        .heroTopbarBadge{display:none}

        .dashboardHero{
          padding:18px 12px 16px;
        }

        .heroMain{margin-top:28px}
        .heroCopy h1{font-size:38px}

        .dashboardMessage,
        .statsGrid,
        .operationsGrid,
        .dashboardQuickActions,
        .intelligenceShell,
        .analyticsShell,
        .inventoryHeader,
        .dashboardSection{
          margin-right:9px;
          margin-left:9px;
        }

        .statsGrid,
        .quickActionGrid,
        .demandMetricsGrid,
        .analyticsKpiGrid{
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .statCard{
          min-height:118px;
          padding:11px;
        }

        .quickActionCard{
          min-height:116px;
          padding:10px;
        }

        .demandCardTop{flex-direction:column}
        .demandStatus{align-self:flex-start}

        .demandFacts{
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .financeBreakdown{
          grid-template-columns:repeat(3,minmax(0,1fr));
        }

        .dashboardItemCard{
          grid-template-columns:96px minmax(0,1fr);
        }

        .itemImageWrapper{min-height:190px}

        .itemActions{
          grid-template-columns:1fr 1fr;
        }

        .agentRecommendationActions{
          grid-template-columns:1fr;
        }
      }

      @media(max-width:355px){
        .statsGrid,
        .quickActionGrid,
        .demandMetricsGrid,
        .analyticsKpiGrid{
          grid-template-columns:1fr;
        }

        .financeBreakdown{
          grid-template-columns:1fr;
        }

        .dashboardItemCard{
          grid-template-columns:1fr;
        }

        .itemImageWrapper{
          min-height:150px;
          height:150px;
        }
      }

      @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;scroll-behavior:auto!important;transition:none!important}}
    `}</style>
  );
}
