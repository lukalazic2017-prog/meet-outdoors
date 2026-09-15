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
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import ShareSheet from "../components/ShareSheet";
import SeoHead from "../seo/SeoHead";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=Host";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=90";

const SERBIA_CENTER = [44.0165, 21.0059];

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
    arrowLeft: (
      <>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    verified: (
      <>
        <path d="m12 3 2 1.4 2.4-.2.8 2.2 2 1.4-.8 2.3.8 2.3-2 1.4-.8 2.2-2.4-.2-2 1.4-2-1.4-2.4.2-.8-2.2-2-1.4.8-2.3-.8-2.3 2-1.4.8-2.2 2.4.2L12 3Z" />
        <path d="m9.5 12 1.7 1.7 3.5-3.7" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle
          cx="17.5"
          cy="6.5"
          r="0.8"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18" />
        <path d="M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="5" width="13" height="14" rx="2" />
        <path d="m16 10 5-3v10l-5-3" />
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

    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6" />
        <path d="M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6" />
        <path d="m20 4-9 9" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
        <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
        <path d="M12 13v4M8 21h8M9 17h6" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m6 7 1 13h10l1-13" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
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

function normalizeExternalUrl(value) {
  if (!value) return "";
  if (/^(https?:\/\/|tel:|mailto:)/i.test(value)) return value;
  return `https://${value}`;
}

function ContactItem({
  icon,
  title,
  value,
  href,
  mutedText,
}) {
  const normalizedHref =
    href && !href.startsWith("tel:")
      ? normalizeExternalUrl(href)
      : href;

  const content = (
    <>
      <span className="contactIcon">
        <Icon name={icon} size={18} />
      </span>

      <span className="contactText">
        <small>{title}</small>
        <strong>{value || mutedText}</strong>
      </span>

      {normalizedHref && (
        <span className="contactArrow">
          <Icon name="external" size={15} />
        </span>
      )}
    </>
  );

  if (normalizedHref) {
    return (
      <a
        href={normalizedHref}
        target={
          normalizedHref.startsWith("tel:")
            ? undefined
            : "_blank"
        }
        rel={
          normalizedHref.startsWith("tel:")
            ? undefined
            : "noreferrer"
        }
        className="contactItem active"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="contactItem disabled">
      {content}
    </div>
  );
}


function DirectContactModal({ open, profile, onClose }) {
  if (!open || !profile) return null;

  const phoneHref = profile.phone
    ? `tel:${String(profile.phone).replace(/\s/g, "")}`
    : "";

  const contacts = [
    phoneHref
      ? {
          key: "phone",
          icon: "phone",
          label: "Pozovi",
          value: profile.phone,
          href: phoneHref,
        }
      : null,
    profile.instagram_url
      ? {
          key: "instagram",
          icon: "instagram",
          label: "Instagram",
          value: "Otvori Instagram",
          href: normalizeExternalUrl(profile.instagram_url),
        }
      : null,
    profile.website_url
      ? {
          key: "website",
          icon: "globe",
          label: "Web-sajt",
          value: "Poseti sajt",
          href: normalizeExternalUrl(profile.website_url),
        }
      : null,
  ].filter(Boolean);

  return (
    <div
      className="directContactBackdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="directContactSheet"
        role="dialog"
        aria-modal="true"
        aria-label="Kontaktiraj domaćina"
      >
        <div className="directContactHead">
          <div>
            <small>DIREKTAN KONTAKT</small>
            <h3>Kontaktiraj domaćina</h3>
            <p>
              Dogovor nastavljate direktno sa domaćinom, van MeetOutdoors-a.
            </p>
          </div>

          <button
            type="button"
            className="directContactClose"
            onClick={onClose}
            aria-label="Zatvori"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {contacts.length > 0 ? (
          <div className="directContactOptions">
            {contacts.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target={item.href.startsWith("tel:") ? undefined : "_blank"}
                rel={item.href.startsWith("tel:") ? undefined : "noreferrer"}
              >
                <span>
                  <Icon name={item.icon} size={19} />
                </span>
                <div>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
                <Icon name="external" size={15} />
              </a>
            ))}
          </div>
        ) : (
          <div className="directContactEmpty">
            Domaćin još nije dodao javne kontakt podatke.
          </div>
        )}
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <HostProfileStyles />

      <main className="hostProfilePage">
        <div className="stateCard">
          <span className="stateLoader" />
          <h1>Učitavanje profila</h1>
          <p>
            Pripremamo host profil, avanture i community tragove.
          </p>
        </div>
      </main>
    </>
  );
}

function NotFoundState() {
  return (
    <>
      <HostProfileStyles />

      <main className="hostProfilePage">
        <div className="stateCard">
          <span className="stateIcon">
            <Icon name="alert" size={25} />
          </span>

          <h1>Host profil nije pronađen.</h1>

          <p>
            Profil možda više nije dostupan ili je korisničko ime
            promenjeno.
          </p>

          <Link to="/" className="stateButton">
            <Icon name="arrowLeft" size={17} />
            Nazad na početnu
          </Link>
        </div>
      </main>
    </>
  );
}

function formatDate(value) {
  if (!value) return "Termin po dogovoru";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Termin po dogovoru";
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number) || number <= 0) {
    return "Besplatno";
  }

  return new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(number);
}

function EventCard({
  event,
  completed = false,
  isOwner = false,
  onDelete,
}) {
  const location =
    [event.location, event.country]
      .filter(Boolean)
      .join(", ") || "Lokacija nije navedena";

  const dateLabel = completed
    ? event.completed_at
      ? `Održano ${formatDate(event.completed_at)}`
      : "Održana avantura"
    : formatDate(event.start_date);

  return (
    <article className={`hostListingCard adventureSwipeCard ${completed ? "completedAdventureCard" : ""}`}>
      <Link to={`/event/${event.id}`} className="adventureCardLink">
        <div className="hostListingImage adventureCardImage">
          <img
            src={event.cover_url || FALLBACK_COVER}
            alt={event.title || "Avantura"}
          />
          <div className="listingImageShade adventureImageShade" />

          <span className={`hostListingType ${completed ? "completedType" : ""}`}>
            <Icon name={completed ? "trophy" : "calendar"} size={14} />
            {completed ? "Održano" : "Aktuelno"}
          </span>

          <span className="listingDateBadge">{dateLabel}</span>

          <div className="adventureCardImageCopy">
            <span className="adventureCardLocation">
              <Icon name="mapPin" size={13} />
              {location}
            </span>
            <h3>{event.title || "Outdoor avantura"}</h3>
          </div>
        </div>

        <div className="hostListingBody adventureCardBody">
          {event.description && (
            <p className="hostListingDescription adventureCardDescription">
              {event.description}
            </p>
          )}

          <div className="adventureCardMeta">
            <span>
              <Icon name="users" size={14} />
              {event.capacity > 0 ? `${event.capacity} mesta` : "Otvorena grupa"}
            </span>
            <strong>{formatPrice(event.price)}</strong>
          </div>

          <div className="hostListingFooter adventureCardFooter">
            <span className="adventureCardState">
              {completed ? "Sačuvano u portfoliju" : "Ponuda domaćina"}
            </span>
            <span className="adventureCardOpen">
              Pogledaj
              <Icon name="arrowRight" size={15} />
            </span>
          </div>
        </div>
      </Link>

      {isOwner && (
        <button
          type="button"
          className="ownerDeleteButton adventureDeleteButton"
          onClick={() => onDelete?.(event)}
        >
          <Icon name="trash" size={14} />
          Obriši avanturu
        </button>
      )}
    </article>
  );
}

const SERVICE_CATEGORIES = [
  "Vodič",
  "Instruktor",
  "Prevoz / transfer",
  "Fotografija / video",
  "Organizacija / team building",
  "Servis / podrška",
  "Ostalo",
];

const MAX_STAY_PHOTOS = 12;
const MAX_OFFER_PHOTOS = 7;

const ACCOMMODATION_TYPES = [
  "Vikendica",
  "Apartman",
  "Brvnara",
  "Kuća",
  "Soba",
  "Kamp",
  "Glamping",
  "Planinarski dom",
  "Etno domaćinstvo",
  "Ostalo",
];

const RENTAL_CATEGORIES = [
  "Bicikli / e-bike",
  "Kajak / SUP",
  "Čamac",
  "Quad / ATV",
  "Ski / snowboard oprema",
  "Kamp oprema",
  "Planinarska oprema",
  "Penjačka / via ferrata oprema",
  "Ostalo",
];

const LEGACY_ADVENTURE_CATEGORIES = new Set([
  "Planinarenje",
  "Rafting",
  "Kajak / SUP",
  "Biciklizam / MTB",
  "Off-road",
  "Kampovanje",
  "Penjanje / Via ferrata",
  "Speleologija",
]);

function inferOfferType(item) {
  if (item?.offer_type) return item.offer_type;

  const category = String(item?.category || "").trim();

  if (category === "Iznajmljivanje opreme") return "rental";
  if (LEGACY_ADVENTURE_CATEGORIES.has(category)) return "adventure";
  return "service";
}

function getOfferDetailsPath(item) {
  const type = inferOfferType(item);

  if (type === "rental") return `/rental/${item.id}`;
  if (type === "service") return `/service/${item.id}`;
  return null;
}

function getOfferCategories(type) {
  if (type === "rental") return RENTAL_CATEGORIES;
  if (type === "service") return SERVICE_CATEGORIES;
  return [];
}

function formatOfferPrice(item) {
  if (item?.price_on_request) return "Cena na upit";
  const value = Number(item?.price_from || 0);
  if (!Number.isFinite(value) || value <= 0) return "Cena na upit";
  return `Od ${new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function OfferCard({
  item,
  isOwner = false,
  onEdit,
  onDelete,
  onContact,
}) {
  const location = item.location || "Lokacija po dogovoru";

  return (
    <article className="offerCard">
      <div className="offerCardMedia">
        <img
          src={item.cover_url || FALLBACK_COVER}
          alt={item.title || "Ponuda domaćina"}
        />
        <div className="offerCardShade" />

        <span className="offerCategoryBadge">
          <Icon name="sparkle" size={13} />
          {inferOfferType(item) === "rental"
            ? `Iznajmljivanje · ${item.category || "Oprema"}`
            : inferOfferType(item) === "service"
              ? `Usluga · ${item.category || "Ostalo"}`
              : item.category || "Avantura"}
        </span>

        {isOwner && (
          <div className="offerOwnerActions">
            <button
              type="button"
              onClick={() => onEdit?.(item)}
              aria-label="Izmeni ponudu"
            >
              <Icon name="edit" size={14} />
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => onDelete?.(item)}
              aria-label="Obriši ponudu"
            >
              <Icon name="trash" size={14} />
              <span>Obriši</span>
            </button>
          </div>
        )}

        <div className="offerCardHeroCopy">
          <span>
            <Icon name="mapPin" size={13} />
            {location}
          </span>
          <h3>{item.title || "Outdoor ponuda"}</h3>
        </div>
      </div>

      <div className="offerCardBody">
        {item.description && <p>{item.description}</p>}

        <div className="offerCardBottom">
          <strong>{formatOfferPrice(item)}</strong>

          {getOfferDetailsPath(item) && (
            <Link
              to={getOfferDetailsPath(item)}
              className="offerDetailsLink"
            >
              Pogledaj detalje
              <Icon name="arrowRight" size={14} />
            </Link>
          )}

          {!isOwner ? (
            <button
              type="button"
              className="offerContactButton"
              onClick={() => onContact?.()}
            >
              Kontaktiraj domaćina
              <Icon name="arrowRight" size={15} />
            </button>
          ) : (
            <span className="offerOwnerHint">Vidljivo na profilu</span>
          )}
        </div>
      </div>
    </article>
  );
}

function OfferModal({
  open,
  mode = "create",
  form,
  setForm,
  photoItems,
  coverIndex,
  onPhotoChange,
  onRemovePhoto,
  onSetCover,
  onClose,
  onSubmit,
  saving,
  error,
}) {
  if (!open) return null;

  return (
    <div className="offerModalBackdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="offerModal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "Izmeni ponudu" : "Dodaj ponudu"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="offerModalHeader">
          <div>
            <span>ŠTA NUDIMO</span>
            <h2>{mode === "edit" ? "Izmeni ponudu" : "Dodaj novu ponudu"}</h2>
            <p>
              Dodaj uslugu ili opremu za iznajmljivanje koju ljudi mogu da pronađu preko tvog profila.
            </p>
          </div>

          <button type="button" onClick={onClose} aria-label="Zatvori">
            ×
          </button>
        </div>

        <form className="offerForm" onSubmit={onSubmit}>
          <label className="offerField">
            <span>Naziv ponude *</span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              maxLength={90}
              placeholder="npr. Rafting Tarom"
              required
            />
          </label>

          <div className="offerFormGrid">
            <label className="offerField">
              <span>Tip ponude *</span>
              <select
                value={form.offer_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    offer_type: event.target.value,
                    category: "",
                  }))
                }
                required
              >
                {form.offer_type === "adventure" && (
                  <option value="adventure">
                    Avantura — postojeća stara ponuda
                  </option>
                )}
                <option value="service">Usluga</option>
                <option value="rental">Iznajmljivanje</option>
              </select>
            </label>

            <label className="offerField">
              <span>Kategorija *</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                required
                disabled={form.offer_type === "adventure"}
              >
                {form.offer_type === "adventure" ? (
                  <option value={form.category}>
                    {form.category || "Stara kategorija avanture"}
                  </option>
                ) : (
                  <>
                    <option value="">Izaberi kategoriju</option>
                    {getOfferCategories(form.offer_type).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </label>
          </div>

          <div className="offerFormGrid">
            <label className="offerField">
              <span>Lokacija *</span>
              <input
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                maxLength={120}
                placeholder="npr. Tara, Srbija"
                required
              />
            </label>
          </div>

          <label className="offerField">
            <span>Kratak opis *</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              maxLength={700}
              rows={5}
              placeholder="Šta nudite, kome je namenjeno i šta učesnik može da očekuje?"
              required
            />
            <small>{form.description.length}/700</small>
          </label>

          <div className="offerFormGrid priceGrid">
            <label className="offerField">
              <span>Cena od (€)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.price_from}
                disabled={form.price_on_request}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price_from: event.target.value,
                  }))
                }
                placeholder="40"
              />
            </label>

            <label className="offerCheckField">
              <input
                type="checkbox"
                checked={form.price_on_request}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price_on_request: event.target.checked,
                    price_from: event.target.checked ? "" : current.price_from,
                  }))
                }
              />
              <span>
                <strong>Cena na upit</strong>
                <small>Ne prikazuj fiksnu početnu cenu.</small>
              </span>
            </label>
          </div>

          <div className="stayGalleryEditor offerGalleryEditor">
            <div className="stayGalleryEditorHead">
              <div>
                <span>Fotografije ponude</span>
                <strong>Dodaj do {MAX_OFFER_PHOTOS} fotografija sa telefona ili računara</strong>
                <small>
                  Prva/naslovna fotografija predstavlja ponudu na Host profilu.
                </small>
              </div>
              <span className="stayGalleryCount">
                {photoItems.length} / {MAX_OFFER_PHOTOS}
              </span>
            </div>

            <label
              className={
                photoItems.length
                  ? "offerImagePicker stayMultiPicker selected"
                  : "offerImagePicker stayMultiPicker"
              }
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={onPhotoChange}
                aria-label="Izaberi fotografije sa telefona ili računara"
              />
              <div className="offerImagePreview stayMultiUpload">
                <span>
                  <Icon name={photoItems.length ? "plus" : "camera"} size={24} />
                </span>
                <div>
                  <strong>
                    {photoItems.length
                      ? "Dodaj još sa uređaja"
                      : "Izaberi sa uređaja"}
                  </strong>
                  <small>
                    Sa telefona ili računara · JPG, PNG ili WEBP · do 8 MB · maksimalno {MAX_OFFER_PHOTOS}
                  </small>
                </div>
              </div>
            </label>

            {photoItems.length > 0 && (
              <div className="stayPhotoGrid offerPhotoGrid">
                {photoItems.map((photo, index) => (
                  <article
                    key={photo.id}
                    className={
                      coverIndex === index
                        ? "stayPhotoItem cover"
                        : "stayPhotoItem"
                    }
                  >
                    <img
                      src={photo.url}
                      alt={`Fotografija ponude ${index + 1}`}
                    />

                    {coverIndex === index && (
                      <span className="stayPhotoCoverBadge">
                        <Icon name="check" size={12} />
                        Naslovna
                      </span>
                    )}

                    <div className="stayPhotoActions">
                      {coverIndex !== index && (
                        <button
                          type="button"
                          className="setCover"
                          onClick={() => onSetCover(index)}
                        >
                          Postavi naslovnu
                        </button>
                      )}

                      <button
                        type="button"
                        className="removePhoto"
                        onClick={() => onRemovePhoto(index)}
                        aria-label={`Ukloni fotografiju ponude ${index + 1}`}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {error && <div className="offerFormError">{error}</div>}

          <div className="offerModalActions">
            <button type="button" className="secondary" onClick={onClose}>
              Odustani
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving
                ? "Čuvanje..."
                : mode === "edit"
                  ? "Sačuvaj izmene"
                  : "Objavi ponudu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatStayPrice(item) {
  if (item?.price_on_request) return "Cena na upit";
  const value = Number(item?.price_per_night || 0);
  if (!Number.isFinite(value) || value <= 0) return "Cena na upit";
  return `${new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)} / noć`;
}


function SingleAccommodationFeature({
  item,
  isOwner = false,
  onEdit,
  onDelete,
  onContact,
}) {
  const photos = [
    item.cover_url,
    ...(Array.isArray(item.gallery_urls) ? item.gallery_urls : []),
  ].filter(Boolean);
  const sidePhotos = photos.slice(1, 3);

  return (
    <article className="singleFeature singleStayFeature">
      <div className="singleFeatureVisual">
        <img
          className="singleFeatureMainImage"
          src={photos[0] || FALLBACK_COVER}
          alt={item.title || "Smeštaj"}
        />
        <div className="singleFeatureShade" />

        <span className="singleFeatureBadge">
          <Icon name="home" size={13} />
          {item.type || "Smeštaj"}
        </span>

        {photos.length > 1 && (
          <span className="singleFeaturePhotoCount">
            <Icon name="camera" size={12} />
            {photos.length} fotografija
          </span>
        )}

        {isOwner && (
          <div className="offerOwnerActions singleFeatureOwnerActions">
            <button type="button" onClick={() => onEdit?.(item)} aria-label="Izmeni smeštaj">
              <Icon name="edit" size={14} />
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => onDelete?.(item)}
              aria-label="Obriši smeštaj"
            >
              <Icon name="trash" size={14} />
              <span>Obriši</span>
            </button>
          </div>
        )}

        <div className="singleFeatureImageCopy">
          <span>
            <Icon name="mapPin" size={13} />
            {item.location || "Lokacija nije navedena"}
          </span>
          <h3>{item.title || "Smeštaj u prirodi"}</h3>
        </div>
      </div>

      <div className="singleFeatureContent">
        <div className="singleFeatureTopline">
          <span className="singleFeatureEyebrow">ISTAKNUT SMEŠTAJ</span>
          <strong>{formatStayPrice(item)}</strong>
        </div>

        {item.description && <p>{item.description}</p>}

        <div className="singleFeatureFacts">
          <span>
            <Icon name="users" size={15} />
            <b>
              {Number(item.max_guests || 0) > 0
                ? `Do ${item.max_guests} gostiju`
                : "Broj gostiju po dogovoru"}
            </b>
          </span>
          <span>
            <Icon name="mapPin" size={15} />
            <b>{item.location || "Lokacija po dogovoru"}</b>
          </span>
        </div>

        {sidePhotos.length > 0 && (
          <div className={`singleFeatureMiniGallery count-${sidePhotos.length}`}>
            {sidePhotos.map((photo, index) => (
              <img
                key={`${photo}-${index}`}
                src={photo}
                alt={`${item.title || "Smeštaj"} ${index + 2}`}
              />
            ))}
          </div>
        )}

        <Link
          to={`/accommodation/${item.id}`}
          className="singleFeatureDetailsLink"
        >
          Pogledaj smeštaj
          <Icon name="arrowRight" size={15} />
        </Link>

        {!isOwner ? (
          <button type="button" className="singleFeatureCta" onClick={() => onContact?.()}>
            Kontaktiraj domaćina
            <Icon name="arrowRight" size={15} />
          </button>
        ) : (
          <div className="singleFeatureOwnerNote">
            <Icon name="check" size={14} />
            Ovaj smeštaj je javno prikazan na profilu.
          </div>
        )}
      </div>
    </article>
  );
}

function SingleOfferFeature({
  item,
  isOwner = false,
  onEdit,
  onDelete,
  onContact,
}) {
  const offerPhotos = [
    item.cover_url,
    ...(Array.isArray(item.gallery_urls) ? item.gallery_urls : []),
  ].filter(Boolean);
  const offerSidePhotos = offerPhotos.slice(1, 3);

  const type = inferOfferType(item);
  const typeLabel =
    type === "rental"
      ? "Iznajmljivanje"
      : type === "service"
        ? "Usluga"
        : "Ponuda";

  return (
    <article className="singleFeature singleOfferFeature">
      <div className="singleFeatureVisual">
        <img
          className="singleFeatureMainImage"
          src={offerPhotos[0] || FALLBACK_COVER}
          alt={item.title || "Ponuda domaćina"}
        />
        <div className="singleFeatureShade" />

        <span className="singleFeatureBadge">
          <Icon name="sparkle" size={13} />
          {typeLabel}{item.category ? ` · ${item.category}` : ""}
        </span>

        {isOwner && (
          <div className="offerOwnerActions singleFeatureOwnerActions">
            <button type="button" onClick={() => onEdit?.(item)} aria-label="Izmeni ponudu">
              <Icon name="edit" size={14} />
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => onDelete?.(item)}
              aria-label="Obriši ponudu"
            >
              <Icon name="trash" size={14} />
              <span>Obriši</span>
            </button>
          </div>
        )}

        <div className="singleFeatureImageCopy">
          <span>
            <Icon name="mapPin" size={13} />
            {item.location || "Lokacija po dogovoru"}
          </span>
          <h3>{item.title || "Outdoor ponuda"}</h3>
        </div>
      </div>

      <div className="singleFeatureContent">
        <div className="singleFeatureTopline">
          <span className="singleFeatureEyebrow">
            {type === "rental" ? "IZNAJMLJIVANJE" : "USLUGA DOMAĆINA"}
          </span>
          <strong>{formatOfferPrice(item)}</strong>
        </div>

        {item.description && <p>{item.description}</p>}

        <div className="singleFeatureFacts">
          <span>
            <Icon name="sparkle" size={15} />
            <b>{item.category || typeLabel}</b>
          </span>
          <span>
            <Icon name="mapPin" size={15} />
            <b>{item.location || "Lokacija po dogovoru"}</b>
          </span>
        </div>

        {offerSidePhotos.length > 0 && (
          <div className={`singleFeatureMiniGallery count-${offerSidePhotos.length}`}>
            {offerSidePhotos.map((photo, index) => (
              <img
                key={`${photo}-${index}`}
                src={photo}
                alt={`${item.title || "Ponuda"} ${index + 2}`}
              />
            ))}
          </div>
        )}

        {getOfferDetailsPath(item) && (
          <Link
            to={getOfferDetailsPath(item)}
            className="singleFeatureDetailsLink"
          >
            Pogledaj detalje
            <Icon name="arrowRight" size={15} />
          </Link>
        )}

        {!isOwner ? (
          <button type="button" className="singleFeatureCta" onClick={() => onContact?.()}>
            Kontaktiraj domaćina
            <Icon name="arrowRight" size={15} />
          </button>
        ) : (
          <div className="singleFeatureOwnerNote">
            <Icon name="check" size={14} />
            Ova ponuda je javno prikazana na profilu.
          </div>
        )}
      </div>
    </article>
  );
}

function AccommodationCard({
  item,
  isOwner = false,
  onEdit,
  onDelete,
  onContact,
}) {
  return (
    <article className="stayCard">
      <div className="stayCardMedia">
        <img src={item.cover_url || FALLBACK_COVER} alt={item.title || "Smeštaj"} />
        <div className="stayCardShade" />

        <span className="stayTypeBadge">
          <Icon name="home" size={13} />
          {item.type || "Smeštaj"}
        </span>

        {Array.isArray(item.gallery_urls) && item.gallery_urls.length > 0 && (
          <span className="stayPhotoCountBadge">
            <Icon name="camera" size={12} />
            {Math.min(item.gallery_urls.length + (item.cover_url ? 1 : 0), MAX_STAY_PHOTOS)} fotografija
          </span>
        )}

        {isOwner && (
          <div className="offerOwnerActions">
            <button type="button" onClick={() => onEdit?.(item)} aria-label="Izmeni smeštaj">
              <Icon name="edit" size={14} />
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => onDelete?.(item)}
              aria-label="Obriši smeštaj"
            >
              <Icon name="trash" size={14} />
              <span>Obriši</span>
            </button>
          </div>
        )}

        <div className="stayHeroCopy">
          <span>
            <Icon name="mapPin" size={13} />
            {item.location || "Lokacija nije navedena"}
          </span>
          <h3>{item.title || "Smeštaj u prirodi"}</h3>
        </div>
      </div>

      <div className="stayCardBody">
        {item.description && <p>{item.description}</p>}

        <div className="stayMeta">
          <span>
            <Icon name="users" size={14} />
            {Number(item.max_guests || 0) > 0
              ? `Do ${item.max_guests} gostiju`
              : "Broj gostiju po dogovoru"}
          </span>
          <strong>{formatStayPrice(item)}</strong>
        </div>

        <Link
          to={`/accommodation/${item.id}`}
          className="stayDetailsLink"
        >
          Pogledaj detalje
          <Icon name="arrowRight" size={14} />
        </Link>

        {!isOwner ? (
          <button
            type="button"
            className="stayContactButton"
            onClick={() => onContact?.()}
          >
            Kontaktiraj domaćina
            <Icon name="arrowRight" size={15} />
          </button>
        ) : (
          <span className="stayOwnerHint">Vidljivo na profilu</span>
        )}
      </div>
    </article>
  );
}

function AccommodationModal({
  open,
  mode,
  form,
  setForm,
  photoItems,
  coverIndex,
  onPhotoChange,
  onRemovePhoto,
  onSetCover,
  onClose,
  onSubmit,
  saving,
  error,
}) {
  if (!open) return null;

  return (
    <div className="offerModalBackdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="offerModal stayModal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "Izmeni smeštaj" : "Dodaj smeštaj"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="offerModalHeader">
          <div>
            <span>SMEŠTAJ U PRIRODI</span>
            <h2>{mode === "edit" ? "Izmeni smeštaj" : "Dodaj smeštaj"}</h2>
            <p>Kratko, jasno i dovoljno da gost odmah zna šta nudite.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Zatvori">×</button>
        </div>

        <form className="offerForm" onSubmit={onSubmit}>
          <label className="offerField">
            <span>Naziv smeštaja *</span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              maxLength={100}
              placeholder="npr. Brvnara Javor"
              required
            />
          </label>

          <div className="offerFormGrid">
            <label className="offerField">
              <span>Tip *</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
                required
              >
                <option value="">Izaberi tip</option>
                {ACCOMMODATION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="offerField">
              <span>Lokacija *</span>
              <input
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({ ...current, location: event.target.value }))
                }
                maxLength={120}
                placeholder="npr. Tara, Srbija"
                required
              />
            </label>
          </div>

          <label className="offerField">
            <span>Kratak opis *</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              maxLength={700}
              rows={4}
              placeholder="Šta gost dobija, kakav je ambijent i kome je smeštaj namenjen?"
              required
            />
            <small>{form.description.length}/700</small>
          </label>

          <div className="offerFormGrid stayNumbersGrid">
            <label className="offerField">
              <span>Maks. gostiju</span>
              <input
                type="number"
                min="1"
                max="100"
                value={form.max_guests}
                onChange={(event) =>
                  setForm((current) => ({ ...current, max_guests: event.target.value }))
                }
                placeholder="4"
              />
            </label>

            <label className="offerField">
              <span>Cena po noći (€)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.price_per_night}
                disabled={form.price_on_request}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price_per_night: event.target.value }))
                }
                placeholder="70"
              />
            </label>
          </div>

          <label className="offerCheckField compactStayCheck">
            <input
              type="checkbox"
              checked={form.price_on_request}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price_on_request: event.target.checked,
                  price_per_night: event.target.checked ? "" : current.price_per_night,
                }))
              }
            />
            <span>
              <strong>Cena na upit</strong>
              <small>Ne prikazuj cenu po noći.</small>
            </span>
          </label>

          <div className="stayGalleryEditor">
            <div className="stayGalleryEditorHead">
              <div>
                <span>Fotografije smeštaja</span>
                <strong>Dodaj do {MAX_STAY_PHOTOS} fotografija sa telefona ili računara</strong>
                <small>Izaberi naslovnu fotografiju koja će se prikazivati na kartici smeštaja.</small>
              </div>
              <span className="stayGalleryCount">{photoItems.length} / {MAX_STAY_PHOTOS}</span>
            </div>

            <label className={photoItems.length ? "offerImagePicker stayMultiPicker selected" : "offerImagePicker stayMultiPicker"}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={onPhotoChange}
                aria-label="Izaberi fotografije sa telefona ili računara"
              />
              <div className="offerImagePreview stayMultiUpload">
                <span><Icon name={photoItems.length ? "plus" : "camera"} size={24} /></span>
                <div>
                  <strong>{photoItems.length ? "Dodaj još fotografija" : "Dodaj fotografije"}</strong>
                  <small>Sa telefona ili računara · JPG, PNG ili WEBP · do 8 MB · maksimalno {MAX_STAY_PHOTOS}</small>
                </div>
              </div>
            </label>

            {photoItems.length > 0 && (
              <div className="stayPhotoGrid">
                {photoItems.map((photo, index) => (
                  <article
                    key={photo.id}
                    className={coverIndex === index ? "stayPhotoItem cover" : "stayPhotoItem"}
                  >
                    <img src={photo.url} alt={`Fotografija smeštaja ${index + 1}`} />

                    {coverIndex === index && (
                      <span className="stayPhotoCoverBadge">
                        <Icon name="check" size={12} />
                        Naslovna
                      </span>
                    )}

                    <div className="stayPhotoActions">
                      {coverIndex !== index && (
                        <button
                          type="button"
                          className="setCover"
                          onClick={() => onSetCover(index)}
                        >
                          Postavi naslovnu
                        </button>
                      )}

                      <button
                        type="button"
                        className="removePhoto"
                        onClick={() => onRemovePhoto(index)}
                        aria-label={`Ukloni fotografiju ${index + 1}`}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {error && <div className="offerFormError">{error}</div>}

          <div className="offerModalActions">
            <button type="button" className="secondary" onClick={onClose}>Odustani</button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "Čuvanje..." : mode === "edit" ? "Sačuvaj izmene" : "Objavi smeštaj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



export default function HostProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] =
    useState(null);

  const [events, setEvents] = useState([]);
  const [offers, setOffers] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [hostPhotos, setHostPhotos] = useState([]);
  const [hostCheckins, setHostCheckins] = useState([]);
  const [taggedPlaces, setTaggedPlaces] = useState([]);

  const [loading, setLoading] = useState(true);

  const emptyOfferForm = {
    title: "",
    offer_type: "service",
    category: "",
    description: "",
    location: "",
    price_from: "",
    price_on_request: false,
  };

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerModalMode, setOfferModalMode] = useState("create");
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [offerPhotoItems, setOfferPhotoItems] = useState([]);
  const [offerCoverIndex, setOfferCoverIndex] = useState(0);
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerError, setOfferError] = useState("");

  const [contactModalOpen, setContactModalOpen] = useState(false);

  const emptyStayForm = {
    title: "",
    type: "",
    location: "",
    description: "",
    max_guests: "",
    price_per_night: "",
    price_on_request: false,
  };

  const [stayModalOpen, setStayModalOpen] = useState(false);
  const [stayModalMode, setStayModalMode] = useState("create");
  const [editingStay, setEditingStay] = useState(null);
  const [stayForm, setStayForm] = useState(emptyStayForm);
  const [stayPhotoItems, setStayPhotoItems] = useState([]);
  const [stayCoverIndex, setStayCoverIndex] = useState(0);
  const [staySaving, setStaySaving] = useState(false);
  const [stayError, setStayError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);

      const {
        data: hostData,
        error: hostError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .eq("role", "host")
        .single();

      if (hostError) {
        throw hostError;
      }

      setProfile(hostData);

      const [
        eventsResult,
        offersResult,
        accommodationsResult,
        photosResult,
        checkinsResult,
        tagResult,
      ] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("host_id", hostData.id)
          .order("created_at", { ascending: false }),


        supabase
          .from("host_offers")
          .select("*")
          .eq("host_id", hostData.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),

        supabase
          .from("host_accommodations")
          .select("*")
          .eq("host_id", hostData.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),

        supabase
          .from("place_photos")
          .select(`
            id,
            place_id,
            checkin_id,
            image_url,
            caption,
            created_at,
            moderation_status,
            places:place_id!inner (
              id,
              name,
              cover_url,
              latitude,
              longitude,
              locality,
              region,
              is_active
            ),
            place_checkins:checkin_id (
              id,
              review_status,
              visibility,
              is_gps_verified
            )
          `)
          .eq("user_id", hostData.id)
          .eq("moderation_status", "approved")
          .eq("places.is_active", true)
          .order("created_at", { ascending: false })
          .limit(30),

        supabase
          .from("place_checkins")
          .select(`
            id,
            place_id,
            visited_at,
            created_at,
            is_gps_verified,
            visibility,
            review_status,
            places:place_id!inner (
              id,
              name,
              cover_url,
              latitude,
              longitude,
              locality,
              region,
              is_active
            )
          `)
          .eq("user_id", hostData.id)
          .eq("is_gps_verified", true)
          .eq("visibility", "public")
          .eq("review_status", "approved")
          .eq("places.is_active", true)
          .order("created_at", { ascending: false })
          .limit(300),

        supabase
          .from("place_host_tags")
          .select(`
            place_id,
            status
          `)
          .eq("host_id", hostData.id)
          .eq("status", "approved"),
      ]);

      const cleanEvents =
        eventsResult.data || [];

      setEvents(cleanEvents);

      if (!offersResult.error) {
        setOffers(offersResult.data || []);
      } else {
        console.warn("Host offers:", offersResult.error);
        setOffers([]);
      }

      if (!accommodationsResult.error) {
        setAccommodations(accommodationsResult.data || []);
      } else {
        console.warn("Host accommodations:", accommodationsResult.error);
        setAccommodations([]);
      }

      if (!photosResult.error) {
        const visibleHostPhotos = (photosResult.data || []).filter(
          (photo) => {
            if (!photo.places?.is_active) return false;

            if (!photo.checkin_id) return true;

            return Boolean(
              photo.place_checkins &&
                photo.place_checkins.review_status === "approved" &&
                photo.place_checkins.visibility === "public" &&
                photo.place_checkins.is_gps_verified === true
            );
          }
        );

        setHostPhotos(visibleHostPhotos);
      } else {
        console.warn(
          "Host place photos:",
          photosResult.error
        );
        setHostPhotos([]);
      }

      if (!checkinsResult.error) {
        setHostCheckins(
          (checkinsResult.data || []).filter(
            (item) => item.places
          )
        );
      } else {
        console.warn(
          "Host place checkins:",
          checkinsResult.error
        );
        setHostCheckins([]);
      }

      if (
        !tagResult.error &&
        (tagResult.data || []).length > 0
      ) {
        const placeIds = [
          ...new Set(
            tagResult.data
              .map((item) => item.place_id)
              .filter(Boolean)
          ),
        ];

        const {
          data: taggedPlaceRows,
          error: taggedPlacesError,
        } = await supabase
          .from("places")
          .select(`
            id,
            name,
            cover_url,
            latitude,
            longitude,
            locality,
            region,
            is_active
          `)
          .in("id", placeIds)
          .eq("is_active", true);

        if (!taggedPlacesError) {
          setTaggedPlaces(
            taggedPlaceRows || []
          );
        } else {
          console.warn(
            "Tagged places:",
            taggedPlacesError
          );
          setTaggedPlaces([]);
        }
      } else {
        if (tagResult.error) {
          console.warn(
            "Host tags:",
            tagResult.error
          );
        }

        setTaggedPlaces([]);
      }

    } catch (error) {
      console.error(
        "Greška pri učitavanju host profila:",
        error
      );

      setProfile(null);
      setEvents([]);
      setOffers([]);
      setAccommodations([]);
      setHostPhotos([]);
      setHostCheckins([]);
      setTaggedPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const channel = supabase
      .channel(`host-profile-live-${username}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "places",
        },
        loadProfile
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "place_checkins",
        },
        loadProfile
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "place_photos",
        },
        loadProfile
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "place_host_tags",
        },
        loadProfile
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "host_offers",
        },
        loadProfile
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "host_accommodations",
        },
        loadProfile
      )
      .subscribe();

  
  return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProfile, username]);


  const revokeOfferBlobUrls = (items = []) => {
    items.forEach((item) => {
      if (item?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
    });
  };

  const resetOfferEditor = () => {
    setOfferForm(emptyOfferForm);
    setEditingOffer(null);
    setOfferPhotoItems((current) => {
      revokeOfferBlobUrls(current);
      return [];
    });
    setOfferCoverIndex(0);
    setOfferError("");
    setOfferModalMode("create");
  };

  const openCreateOffer = (offerType = "service") => {
    resetOfferEditor();
    setOfferForm((current) => ({
      ...current,
      offer_type: offerType === "rental" ? "rental" : "service",
      category: "",
    }));
    setOfferModalOpen(true);
  };

  const openEditOffer = (item) => {
    setEditingOffer(item);
    setOfferModalMode("edit");
    setOfferForm({
      title: item.title || "",
      offer_type: inferOfferType(item),
      category: item.category || "",
      description: item.description || "",
      location: item.location || "",
      price_from:
        item.price_from !== null && item.price_from !== undefined
          ? String(item.price_from)
          : "",
      price_on_request: Boolean(item.price_on_request),
    });

    const existingUrls = [
      item.cover_url,
      ...(Array.isArray(item.gallery_urls) ? item.gallery_urls : []),
    ].filter(Boolean);

    const uniqueUrls = [...new Set(existingUrls)].slice(0, MAX_OFFER_PHOTOS);

    setOfferPhotoItems((current) => {
      revokeOfferBlobUrls(current);
      return uniqueUrls.map((url, index) => ({
        id: `existing-offer-${item.id}-${index}-${url}`,
        url,
        file: null,
        existing: true,
      }));
    });
    setOfferCoverIndex(0);
    setOfferError("");
    setOfferModalOpen(true);
  };

  const closeOfferModal = () => {
    if (offerSaving) return;
    setOfferModalOpen(false);
    resetOfferEditor();
  };

  const handleOfferPhotosChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selected.length) return;

    const invalid = selected.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (invalid) {
      setOfferError("Fotografije moraju biti JPG, PNG ili WEBP.");
      return;
    }

    const tooLarge = selected.find((file) => file.size > 8 * 1024 * 1024);

    if (tooLarge) {
      setOfferError("Svaka fotografija može imati najviše 8 MB.");
      return;
    }

    setOfferPhotoItems((current) => {
      const remaining = Math.max(MAX_OFFER_PHOTOS - current.length, 0);

      if (remaining === 0) {
        setOfferError(
          `Možeš dodati najviše ${MAX_OFFER_PHOTOS} fotografija.`
        );
        return current;
      }

      const accepted = selected.slice(0, remaining);
      const created = accepted.map((file, index) => ({
        id: `new-offer-${Date.now()}-${index}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        url: URL.createObjectURL(file),
        file,
        existing: false,
      }));

      if (selected.length > remaining) {
        setOfferError(
          `Dodato je prvih ${remaining} fotografija. Maksimum je ${MAX_OFFER_PHOTOS}.`
        );
      } else {
        setOfferError("");
      }

      return [...current, ...created];
    });
  };

  const removeOfferPhoto = (index) => {
    setOfferPhotoItems((current) => {
      const target = current[index];
      if (target?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((_, itemIndex) => itemIndex !== index);
    });

    setOfferCoverIndex((currentCover) => {
      if (index < currentCover) return Math.max(currentCover - 1, 0);
      if (index === currentCover) return 0;
      return currentCover;
    });

    if (offerError) setOfferError("");
  };

  const uploadOfferPhoto = async (file, hostId, index = 0) => {
    if (!file) return null;

    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg");

    const path = `${hostId}/offer-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("host-offers")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("host-offers")
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("Nije moguće dobiti URL fotografije ponude.");
    }

    return { url: data.publicUrl, path };
  };

  const submitOffer = async (event) => {
    event.preventDefault();

    if (!profile?.id || currentUserId !== profile.id) {
      setOfferError("Samo vlasnik profila može da upravlja ponudama.");
      return;
    }

    const title = offerForm.title.trim();
    const offerType = offerForm.offer_type.trim();
    const category = offerForm.category.trim();
    const description = offerForm.description.trim();
    const location = offerForm.location.trim();

    if (!title || !offerType || !category || !description || !location) {
      setOfferError("Popuni tip ponude, naziv, kategoriju, lokaciju i opis.");
      return;
    }

    if (!["service", "rental", "adventure"].includes(offerType)) {
      setOfferError("Izaberi ispravan tip ponude.");
      return;
    }

    setOfferSaving(true);
    setOfferError("");

    const uploadedPaths = [];

    try {
      const resolvedPhotos = [];

      for (let index = 0; index < offerPhotoItems.length; index += 1) {
        const photo = offerPhotoItems[index];

        if (photo.existing && !photo.file) {
          resolvedPhotos.push(photo.url);
          continue;
        }

        if (photo.file) {
          const uploaded = await uploadOfferPhoto(photo.file, profile.id, index);
          uploadedPaths.push(uploaded.path);
          resolvedPhotos.push(uploaded.url);
        }
      }

      if (!resolvedPhotos.length) {
        setOfferError("Dodaj bar jednu fotografiju ponude.");
        setOfferSaving(false);
        return;
      }

      const safeCoverIndex = Math.min(
        offerCoverIndex,
        resolvedPhotos.length - 1
      );
      const coverUrl = resolvedPhotos[safeCoverIndex];
      const galleryUrls = resolvedPhotos
        .filter((_, index) => index !== safeCoverIndex)
        .slice(0, MAX_OFFER_PHOTOS - 1);

      const payload = {
        host_id: profile.id,
        title,
        offer_type: offerType,
        category,
        description,
        location,
        price_from: offerForm.price_on_request
          ? null
          : offerForm.price_from
            ? Number(offerForm.price_from)
            : null,
        price_on_request: Boolean(offerForm.price_on_request),
        cover_url: coverUrl,
        gallery_urls: galleryUrls,
        updated_at: new Date().toISOString(),
      };

      if (offerModalMode === "edit" && editingOffer?.id) {
        const { data, error } = await supabase
          .from("host_offers")
          .update(payload)
          .eq("id", editingOffer.id)
          .eq("host_id", profile.id)
          .select("*")
          .single();

        if (error) throw error;

        setOffers((current) =>
          current.map((item) => (item.id === data.id ? data : item))
        );
      } else {
        const { data, error } = await supabase
          .from("host_offers")
          .insert(payload)
          .select("*")
          .single();

        if (error) throw error;

        setOffers((current) => [data, ...current]);
      }

      setOfferModalOpen(false);
      resetOfferEditor();
    } catch (error) {
      console.error("Host offer save:", error);

      if (uploadedPaths.length) {
        await supabase.storage
          .from("host-offers")
          .remove(uploadedPaths)
          .catch(() => {});
      }

      setOfferError(
        error?.message || "Ponuda trenutno ne može da se sačuva."
      );
    } finally {
      setOfferSaving(false);
    }
  };

  const deleteEvent = async (item) => {
    if (!item?.id || !profile?.id || currentUserId !== profile.id) return;

    const confirmed = window.confirm(
      `Obriši avanturu "${item.title}"? Ova radnja ne može da se poništi.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", item.id)
      .eq("host_id", profile.id);

    if (error) {
      window.alert(error.message || "Avantura nije obrisana.");
      return;
    }

    setEvents((current) => current.filter((event) => event.id !== item.id));
  };

  const deleteOffer = async (item) => {
    if (!item?.id || !profile?.id || currentUserId !== profile.id) return;

    const confirmed = window.confirm(
      `Obriši ponudu "${item.title}"? Ova radnja ne može da se poništi.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("host_offers")
      .delete()
      .eq("id", item.id)
      .eq("host_id", profile.id);

    if (error) {
      window.alert(error.message || "Ponuda nije obrisana.");
      return;
    }

    setOffers((current) => current.filter((offer) => offer.id !== item.id));
  };

  const revokeStayBlobUrls = (items = []) => {
    items.forEach((item) => {
      if (item?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
    });
  };

  const resetStayEditor = () => {
    setStayForm(emptyStayForm);
    setEditingStay(null);
    setStayPhotoItems((current) => {
      revokeStayBlobUrls(current);
      return [];
    });
    setStayCoverIndex(0);
    setStayError("");
    setStayModalMode("create");
  };

  const openCreateStay = () => {
    resetStayEditor();
    setStayModalOpen(true);
  };

  const openEditStay = (item) => {
    setEditingStay(item);
    setStayModalMode("edit");
    setStayForm({
      title: item.title || "",
      type: item.type || "",
      location: item.location || "",
      description: item.description || "",
      max_guests: item.max_guests ? String(item.max_guests) : "",
      price_per_night:
        item.price_per_night !== null && item.price_per_night !== undefined
          ? String(item.price_per_night)
          : "",
      price_on_request: Boolean(item.price_on_request),
    });

    const existingUrls = [
      item.cover_url,
      ...(Array.isArray(item.gallery_urls) ? item.gallery_urls : []),
    ].filter(Boolean);

    const uniqueUrls = [...new Set(existingUrls)].slice(0, MAX_STAY_PHOTOS);

    setStayPhotoItems((current) => {
      revokeStayBlobUrls(current);
      return uniqueUrls.map((url, index) => ({
        id: `existing-${item.id}-${index}-${url}`,
        url,
        file: null,
        existing: true,
      }));
    });
    setStayCoverIndex(0);
    setStayError("");
    setStayModalOpen(true);
  };

  const closeStayModal = () => {
    if (staySaving) return;
    setStayModalOpen(false);
    resetStayEditor();
  };

  const handleStayPhotosChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selected.length) return;

    const invalid = selected.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (invalid) {
      setStayError("Fotografije moraju biti JPG, PNG ili WEBP.");
      return;
    }

    const tooLarge = selected.find((file) => file.size > 8 * 1024 * 1024);

    if (tooLarge) {
      setStayError("Svaka fotografija može imati najviše 8 MB.");
      return;
    }

    setStayPhotoItems((current) => {
      const remaining = Math.max(MAX_STAY_PHOTOS - current.length, 0);

      if (remaining === 0) {
        setStayError(`Možeš dodati najviše ${MAX_STAY_PHOTOS} fotografija.`);
        return current;
      }

      const accepted = selected.slice(0, remaining);
      const created = accepted.map((file, index) => ({
        id: `new-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        url: URL.createObjectURL(file),
        file,
        existing: false,
      }));

      if (selected.length > remaining) {
        setStayError(`Dodato je prvih ${remaining} fotografija. Maksimum je ${MAX_STAY_PHOTOS}.`);
      } else {
        setStayError("");
      }

      return [...current, ...created];
    });
  };

  const removeStayPhoto = (index) => {
    setStayPhotoItems((current) => {
      const target = current[index];
      if (target?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((_, itemIndex) => itemIndex !== index);
    });

    setStayCoverIndex((currentCover) => {
      if (index < currentCover) return Math.max(currentCover - 1, 0);
      if (index === currentCover) return 0;
      return currentCover;
    });

    if (stayError) setStayError("");
  };

  const uploadStayPhoto = async (file, hostId, index = 0) => {
    if (!file) return null;

    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg");

    const path = `${hostId}/stay-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("host-accommodations")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("host-accommodations")
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("Nije moguće dobiti URL fotografije smeštaja.");
    }

    return { url: data.publicUrl, path };
  };

  const submitStay = async (event) => {
    event.preventDefault();

    if (!profile?.id || currentUserId !== profile.id) {
      setStayError("Samo vlasnik profila može da upravlja smeštajem.");
      return;
    }

    const title = stayForm.title.trim();
    const type = stayForm.type.trim();
    const location = stayForm.location.trim();
    const description = stayForm.description.trim();

    if (!title || !type || !location || !description) {
      setStayError("Popuni naziv, tip, lokaciju i opis.");
      return;
    }

    setStaySaving(true);
    setStayError("");
    const uploadedPaths = [];

    try {
      const resolvedPhotos = [];

      for (let index = 0; index < stayPhotoItems.length; index += 1) {
        const photo = stayPhotoItems[index];

        if (photo.existing && !photo.file) {
          resolvedPhotos.push(photo.url);
          continue;
        }

        if (photo.file) {
          const uploaded = await uploadStayPhoto(photo.file, profile.id, index);
          uploadedPaths.push(uploaded.path);
          resolvedPhotos.push(uploaded.url);
        }
      }

      if (!resolvedPhotos.length) {
        setStayError("Dodaj bar jednu fotografiju smeštaja.");
        setStaySaving(false);
        return;
      }

      const safeCoverIndex =
        resolvedPhotos.length > 0
          ? Math.min(stayCoverIndex, resolvedPhotos.length - 1)
          : 0;

      const coverUrl =
        resolvedPhotos.length > 0 ? resolvedPhotos[safeCoverIndex] : null;

      const galleryUrls = resolvedPhotos
        .filter((_, index) => index !== safeCoverIndex)
        .slice(0, MAX_STAY_PHOTOS - 1);

      const payload = {
        host_id: profile.id,
        title,
        type,
        location,
        description,
        max_guests: stayForm.max_guests ? Number(stayForm.max_guests) : null,
        price_per_night: stayForm.price_on_request
          ? null
          : stayForm.price_per_night
            ? Number(stayForm.price_per_night)
            : null,
        price_on_request: Boolean(stayForm.price_on_request),
        cover_url: coverUrl,
        gallery_urls: galleryUrls,
        updated_at: new Date().toISOString(),
      };

      if (stayModalMode === "edit" && editingStay?.id) {
        const { data, error } = await supabase
          .from("host_accommodations")
          .update(payload)
          .eq("id", editingStay.id)
          .eq("host_id", profile.id)
          .select("*")
          .single();

        if (error) throw error;

        setAccommodations((current) =>
          current.map((item) => (item.id === data.id ? data : item))
        );
      } else {
        const { data, error } = await supabase
          .from("host_accommodations")
          .insert(payload)
          .select("*")
          .single();

        if (error) throw error;
        setAccommodations((current) => [data, ...current]);
      }

      setStayModalOpen(false);
      resetStayEditor();
    } catch (error) {
      console.error("Host accommodation save:", error);

      if (uploadedPaths.length) {
        await supabase.storage
          .from("host-accommodations")
          .remove(uploadedPaths)
          .catch(() => {});
      }

      setStayError(error?.message || "Smeštaj trenutno ne može da se sačuva.");
    } finally {
      setStaySaving(false);
    }
  };

  const deleteStay = async (item) => {
    if (!item?.id || !profile?.id || currentUserId !== profile.id) return;

    const confirmed = window.confirm(
      `Obriši smeštaj "${item.title}"? Ova radnja ne može da se poništi.`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("host_accommodations")
      .delete()
      .eq("id", item.id)
      .eq("host_id", profile.id);

    if (error) {
      window.alert(error.message || "Smeštaj nije obrisan.");
      return;
    }

    setAccommodations((current) => current.filter((stay) => stay.id !== item.id));
  };

  const visitedPlaces = useMemo(() => {
    const unique = new Map();

    hostCheckins.forEach((item) => {
      if (
        item.places?.id &&
        !unique.has(item.places.id)
      ) {
        unique.set(
          item.places.id,
          item.places
        );
      }
    });

    return Array.from(unique.values());
  }, [hostCheckins]);

  const mapPlaces = useMemo(() => {
    const unique = new Map();

    [...taggedPlaces, ...visitedPlaces].forEach(
      (place) => {
        if (
          place?.id &&
          Number.isFinite(
            Number(place.latitude)
          ) &&
          Number.isFinite(
            Number(place.longitude)
          )
        ) {
          unique.set(place.id, place);
        }
      }
    );

    return Array.from(unique.values());
  }, [taggedPlaces, visitedPlaces]);

  const mapCenter = useMemo(() => {
    if (mapPlaces.length === 0) {
      return SERBIA_CENTER;
    }

    return [
      Number(mapPlaces[0].latitude),
      Number(mapPlaces[0].longitude),
    ];
  }, [mapPlaces]);

  if (loading) {
    return <LoadingState />;
  }

  if (!profile) {
    return <NotFoundState />;
  }

  const isOwnProfile =
    currentUserId === profile.id;

  const location =
    [profile.city, profile.country]
      .filter(Boolean)
      .join(", ") ||
    "Lokacija još nije dodata";

  const activities = Array.isArray(
    profile.activities
  )
    ? profile.activities
    : [];

  const hostPurposes = Array.isArray(profile.host_purposes)
    ? profile.host_purposes
    : [];

  // Prazna lista = stari host nalog, pa zadržavamo postojeće ponašanje.
  const isLegacyHost = hostPurposes.length === 0;
  const isAdventureHost = isLegacyHost || hostPurposes.includes("adventures");
  const isAccommodationHost = hostPurposes.includes("accommodation");
  const isServiceHost = hostPurposes.includes("service");
  const isRentalHost = hostPurposes.includes("rental");

  const activeEvents = events.filter(
    (item) =>
      item.status !== "completed" &&
      item.status !== "cancelled" &&
      item.is_active !== false
  );


  const displayName =
    profile.full_name ||
    profile.username ||
    "Outdoor Host";

  const hasAccommodation = accommodations.length > 0;
  const hasOffers = offers.length > 0;
  const hasAdventures = activeEvents.length > 0;
  const hasGallery = hostPhotos.length > 0;

  const hostLatitude = Number(profile.latitude);
  const hostLongitude = Number(profile.longitude);
  const hasPublicMapLocation =
    Boolean(profile.public_location) &&
    Number.isFinite(hostLatitude) &&
    Number.isFinite(hostLongitude);

  const hasMapContent =
    hasPublicMapLocation || mapPlaces.length > 0;

  const visibleMapCenter = hasPublicMapLocation
    ? [hostLatitude, hostLongitude]
    : mapCenter;

  const serviceOffers = offers.filter(
    (item) => inferOfferType(item) === "service"
  );
  const rentalOffers = offers.filter(
    (item) => inferOfferType(item) === "rental"
  );

  const allContentTabs = [
    {
      id: "adventures",
      purpose: "adventures",
      label: "Avanture",
      eyebrow: "DOŽIVLJAJI",
      icon: "route",
      count: activeEvents.length,
      actionLabel: "Dodaj avanturu",
      image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
    },
    {
      id: "accommodation",
      purpose: "accommodation",
      label: "Smeštaj",
      eyebrow: "BORAVAK",
      icon: "home",
      count: accommodations.length,
      actionLabel: "Dodaj smeštaj",
      image:
        "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=85",
    },
    {
      id: "services",
      purpose: "service",
      label: "Usluge",
      eyebrow: "PODRŠKA",
      icon: "sparkle",
      count: serviceOffers.length,
      actionLabel: "Dodaj uslugu",
      image:
        "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85",
    },
    {
      id: "rentals",
      purpose: "rental",
      label: "Iznajmljivanje",
      eyebrow: "OPREMA",
      icon: "package",
      count: rentalOffers.length,
      actionLabel: "Dodaj iznajmljivanje",
      image:
        "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&w=1200&q=85",
    },
  ];

  const declaredContentTabs = allContentTabs.filter((tab) => {
    if (isLegacyHost) {
      return tab.id === "adventures" || tab.count > 0;
    }

    return hostPurposes.includes(tab.purpose);
  });

  const publicContentTabs = allContentTabs.filter((tab) => tab.count > 0);

  // Vlasnik vidi ono što je označio da nudi, posetilac samo stvarno objavljen sadržaj.
  const contentTabs = isOwnProfile ? declaredContentTabs : publicContentTabs;

  const hasMultipleContentSections = contentTabs.length > 1;
  const singleContentSection =
    contentTabs.length === 1 ? contentTabs[0].id : null;

  // Kartice iznad služe kao direktne akcije / prečice.
  // Sadržaj ispod se više NE menja klikom na karticu:
  // prikazujemo sve kategorije koje host stvarno nudi / ima objavljene.
  const showOverview = true;
  const showAdventures = contentTabs.some((tab) => tab.id === "adventures");
  const showAccommodation = contentTabs.some((tab) => tab.id === "accommodation");
  const showServices = contentTabs.some((tab) => tab.id === "services");
  const showRentals = contentTabs.some((tab) => tab.id === "rentals");

  const handleCategoryCardClick = (tab) => {
    if (!tab) return;

    // Vlasnik: kartica je direktna prečica za kreiranje nove ponude.
    if (isOwnProfile) {
      if (tab.id === "adventures") {
        navigate("/create-event");
        return;
      }

      if (tab.id === "accommodation") {
        openCreateStay();
        return;
      }

      if (tab.id === "services") {
        openCreateOffer("service");
        return;
      }

      if (tab.id === "rentals") {
        openCreateOffer("rental");
      }

      return;
    }

    // Posetilac: kartica otvara prvu javnu stavku te kategorije.
    if (tab.id === "adventures" && activeEvents[0]?.id) {
      navigate(`/event/${activeEvents[0].id}`);
      return;
    }

    if (tab.id === "accommodation" && accommodations[0]?.id) {
      navigate(`/accommodation/${accommodations[0].id}`);
      return;
    }

    if (tab.id === "services" && serviceOffers[0]?.id) {
      navigate(`/service/${serviceOffers[0].id}`);
      return;
    }

    if (tab.id === "rentals" && rentalOffers[0]?.id) {
      navigate(`/rental/${rentalOffers[0].id}`);
    }
  };

  return (
    <>
      <SeoHead
        title={`${displayName}${profile.city ? ` – ${profile.city}` : ""}`}
        description={
          profile.bio?.replace(/\s+/g, " ").trim().slice(0, 155) ||
          `${displayName} je outdoor domaćin na MeetOutdoors. Pogledaj avanture, aktivnosti, lokacije i iskustva domaćina.`
        }
        canonicalPath={`/h/${profile.username}`}
        image={profile.cover_url || profile.avatar_url || FALLBACK_COVER}
        type="profile"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: `https://www.meetoutdoors.app/h/${profile.username}`,
          mainEntity: {
            "@type": "Person",
            name: displayName,
            alternateName: profile.username
              ? `@${profile.username}`
              : undefined,
            description: profile.bio || undefined,
            image:
              profile.avatar_url ||
              profile.cover_url ||
              undefined,
            url: `https://www.meetoutdoors.app/h/${profile.username}`,
            homeLocation:
              profile.city || profile.country
                ? {
                    "@type": "Place",
                    name: [profile.city, profile.country]
                      .filter(Boolean)
                      .join(", "),
                  }
                : undefined,
            knowsAbout:
              activities.length > 0
                ? activities
                : undefined,
            sameAs: [
              profile.instagram_url
                ? normalizeExternalUrl(profile.instagram_url)
                : null,
              profile.website_url
                ? normalizeExternalUrl(profile.website_url)
                : null,
            ].filter(Boolean),
          },
        }}
      />

      <HostProfileStyles />

      <main className="hostProfilePage">

        <section className="profileShell">
          <div className="profileHero">
            <img
              src={
                profile.cover_url ||
                FALLBACK_COVER
              }
              alt=""
              className="coverImage"
            />

            <div className="coverOverlay" />
            <div className="heroGlow" />

            {isOwnProfile && (
              <Link
                to="/edit-profile"
                className="heroEditButton heroEditFloating"
              >
                <Icon name="edit" size={15} />
                Uredi profil
              </Link>
            )}



          </div>

        <section className="profileIdentityCard">
          <div className="identityMain">
            <img
              src={profile.avatar_url || FALLBACK_AVATAR}
              alt={displayName}
              className="identityAvatar"
            />

            <div className="identityCopy">
              <div className="identityEyebrow">
                <span className="identityVerified">
                  <Icon name={profile.is_verified ? "verified" : "shield"} size={13} />
                  {profile.is_verified
                    ? "Verifikovani MeetOutdoors domaćin"
                    : "MeetOutdoors domaćin"}
                </span>

                {hasAccommodation && (
                  <span className="identityType">
                    <Icon name="home" size={12} />
                    Smeštaj
                  </span>
                )}

                {hasAdventures && (
                  <span className="identityType">
                    <Icon name="calendar" size={12} />
                    Avanture
                  </span>
                )}

                {serviceOffers.length > 0 && (
                  <span className="identityType">
                    <Icon name="sparkle" size={12} />
                    Usluge
                  </span>
                )}

                {rentalOffers.length > 0 && (
                  <span className="identityType">
                    <Icon name="package" size={12} />
                    Iznajmljivanje
                  </span>
                )}
              </div>

              <h1>{displayName}</h1>

              <div className="identityMeta">
                {profile.username && <span>@{profile.username}</span>}
                {location && (
                  <>
                    <span className="identityDot">•</span>
                    <span>
                      <Icon name="mapPin" size={13} />
                      {location}
                    </span>
                  </>
                )}
              </div>

              {activities.length > 0 && (
                <div className="identityActivities">
                  {activities.slice(0, 6).map((activity) => (
                    <span key={activity}>{activity}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="identityActions">
            {!isOwnProfile && (
              <button
                type="button"
                className="identityContactButton"
                onClick={() => setContactModalOpen(true)}
              >
                <Icon name="phone" size={16} />
                Kontaktiraj domaćina
              </button>
            )}

            <ShareSheet
              type="host"
              title={displayName}
              image={profile.cover_url || FALLBACK_COVER}
              avatar={profile.avatar_url || FALLBACK_AVATAR}
              location={location}
              url={`https://www.meetoutdoors.app/h/${profile.username}`}
              triggerClassName="identityShareButton"
              triggerEyebrow=""
              triggerLabel="Podeli"
            />
          </div>
        </section>

        {hasMultipleContentSections && (
          <section className="hostCategoryShowcase" aria-label="Šta domaćin nudi">
            <div className="hostCategoryShowcaseHead">
              <div>
                <span>{isOwnProfile ? "UPRAVLJAJ PONUDOM" : "ŠTA OVAJ DOMAĆIN NUDI"}</span>
                <h2>{isOwnProfile ? "Dodaj novu ponudu" : "Izaberi deo ponude"}</h2>
              </div>
              <p>
                {isOwnProfile
                  ? "Izaberi kategoriju i odmah započni kreiranje."
                  : "Prevuci kartice horizontalno i otvori ono što te zanima."}
              </p>
            </div>

            <div className="hostCategoryRail">
              {contentTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className="hostCategoryCard"
                  onClick={() => handleCategoryCardClick(tab)}
                  aria-label={
                    isOwnProfile
                      ? tab.actionLabel
                      : `Otvori ${tab.label.toLowerCase()}`
                  }
                >
                  <img src={tab.image} alt="" />
                  <span className="hostCategoryShade" />

                  <span className="hostCategoryIcon">
                    <Icon name={tab.icon} size={18} />
                  </span>

                  <span className="hostCategoryCopy">
                    <small>{tab.eyebrow}</small>
                    <strong>{tab.label}</strong>
                    <em>
                      {isOwnProfile
                        ? tab.actionLabel
                        : tab.count > 0
                          ? `${tab.count} ${tab.count === 1 ? "ponuda" : "ponude"}`
                          : ""}
                    </em>
                  </span>

                  <span className="hostCategoryArrow">
                    <Icon name="arrowRight" size={16} />
                  </span>
                </button>
              ))}
            </div>

            <div className="hostCategorySwipeHint">
              <span>
                {isOwnProfile
                  ? "Prevuci i izaberi šta želiš da dodaš"
                  : "Prevuci za ostale kategorije"}
              </span>
              <Icon name="arrowRight" size={14} />
            </div>
          </section>
        )}

          <div className={`profileContent ${singleContentSection ? "singlePurposeProfile" : ""}`}>
            <section className="hostOffersPriority">
              <div className="priorityHeading">
                <span>GLAVNA PONUDA</span>
                <h2>Šta domaćin nudi</h2>
                <p>Avanture, smeštaj, usluge i iznajmljivanje — sve najvažnije odmah na početku profila.</p>
              </div>
            </section>

            {showAdventures && (hasAdventures || (isOwnProfile && isAdventureHost)) && (
            <section
              id="events"
              className="listingSection adventureRailSection"
            >
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">
                    Aktuelne avanture
                  </span>

                  <h2>
                    Izaberi sledeće iskustvo
                  </h2>

                  <p>
                    Prevuci kartice horizontalno i pogledaj šta ovaj domaćin trenutno organizuje.
                  </p>
                </div>

                {isOwnProfile && isAdventureHost && (
                  <Link
                    to="/create-event"
                    className="sectionAction"
                  >
                    Kreiraj avanturu
                    <Icon
                      name="arrowRight"
                      size={17}
                    />
                  </Link>
                )}
              </div>

              {activeEvents.length > 0 ? (
                <div className="adventureRailShell">
                  <div className="adventureSwipeRail" aria-label="Aktuelne avanture">
                    {activeEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isOwner={isOwnProfile}
                        onDelete={deleteEvent}
                      />
                    ))}
                  </div>
                  {activeEvents.length > 1 && (
                    <div className="adventureSwipeHint">
                      <span>Prevuci za još</span>
                      <Icon name="arrowRight" size={14} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="emptyListing">
                  <span>
                    <Icon
                      name="calendar"
                      size={27}
                    />
                  </span>

                  <h3>
                    Trenutno nema aktuelnih avantura.
                  </h3>

                  <p>
                    Kada domaćin objavi novu avanturu, pojaviće se ovde.
                  </p>

                  {isOwnProfile && (
                    <Link to="/create-event">
                      Objavi prvu avanturu
                      <Icon
                        name="arrowRight"
                        size={16}
                      />
                    </Link>
                  )}
                </div>
              )}
            </section>
            )}

            {showOverview && (
              <>

            {showAccommodation && (hasAccommodation || (isOwnProfile && isAccommodationHost)) && (
              <section
                id="accommodation"
                className="listingSection accommodationSection"
              >
                <div className="listingHeader">
                  <div>
                    <span className="sectionKicker">Smeštaj u prirodi</span>
                    <h2>Odmor koji počinje napolju</h2>
                    <p>
                      Pronađi smeštaj i kontaktiraj domaćina direktno za termin i detalje.
                    </p>
                  </div>

                  {isOwnProfile && isAccommodationHost && (
                    accommodations.length === 1 ? (
                      <button
                        type="button"
                        className="sectionAction"
                        onClick={() => openEditStay(accommodations[0])}
                      >
                        <Icon name="edit" size={16} />
                        Uredi smeštaj
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="sectionAction"
                        onClick={openCreateStay}
                      >
                        <Icon name="plus" size={16} />
                        Dodaj smeštaj
                      </button>
                    )
                  )}
                </div>

                {accommodations.length === 1 ? (
                  <SingleAccommodationFeature
                    item={accommodations[0]}
                    isOwner={isOwnProfile}
                    onEdit={openEditStay}
                    onDelete={deleteStay}
                    onContact={() => setContactModalOpen(true)}
                  />
                ) : accommodations.length > 1 ? (
                  <div className="stayRailShell">
                    <div className="staySwipeRail" aria-label="Smeštaj domaćina">
                      {accommodations.map((item) => (
                        <AccommodationCard
                          key={item.id}
                          item={item}
                          isOwner={isOwnProfile}
                          onEdit={openEditStay}
                          onDelete={deleteStay}
                          onContact={() => setContactModalOpen(true)}
                        />
                      ))}
                    </div>

                    <div className="adventureSwipeHint">
                      <span>Prevuci za još smeštaja</span>
                      <Icon name="arrowRight" size={14} />
                    </div>
                  </div>
                ) : (
                  isOwnProfile && isAccommodationHost ? (
                    <div className="emptyListing compactEmpty">
                      <span><Icon name="home" size={27} /></span>
                      <h3>Dodaj prvi smeštaj.</h3>
                      <p>
                        Jedna dobra fotografija, kratak opis, broj gostiju i cena — dovoljno za početak.
                      </p>
                      <button type="button" onClick={openCreateStay}>
                        <Icon name="plus" size={15} />
                        Dodaj smeštaj
                      </button>
                    </div>
                  ) : null
                )}
              </section>
            )}

            {showServices && (serviceOffers.length > 0 || (isOwnProfile && isServiceHost)) && (
              <section
                id="services"
                className="listingSection offersSection"
              >
                <div className="listingHeader">
                  <div>
                    <span className="sectionKicker">Usluge</span>
                    <h2>Usluge ovog domaćina</h2>
                    <p>
                      Pogledaj usluge koje domaćin nudi i dogovori detalje direktno.
                    </p>
                  </div>

                  {isOwnProfile && isServiceHost && (
                    <button
                      type="button"
                      className="sectionAction offerAddButton"
                      onClick={() => openCreateOffer("service")}
                    >
                      <Icon name="plus" size={16} />
                      Dodaj uslugu
                    </button>
                  )}
                </div>

                {serviceOffers.length === 1 ? (
                  <SingleOfferFeature
                    item={serviceOffers[0]}
                    isOwner={isOwnProfile}
                    onEdit={openEditOffer}
                    onDelete={deleteOffer}
                    onContact={() => setContactModalOpen(true)}
                  />
                ) : serviceOffers.length > 1 ? (
                  <div className="offerRailShell">
                    <div className="offerSwipeRail" aria-label="Usluge domaćina">
                      {serviceOffers.map((item) => (
                        <OfferCard
                          key={item.id}
                          item={item}
                          isOwner={isOwnProfile}
                          onEdit={openEditOffer}
                          onDelete={deleteOffer}
                          onContact={() => setContactModalOpen(true)}
                        />
                      ))}
                    </div>

                    <div className="adventureSwipeHint">
                      <span>Prevuci za još usluga</span>
                      <Icon name="arrowRight" size={14} />
                    </div>
                  </div>
                ) : isOwnProfile && isServiceHost ? (
                  <div className="emptyListing compactEmpty">
                    <span><Icon name="sparkle" size={27} /></span>
                    <h3>Dodaj prvu uslugu.</h3>
                    <p>Predstavi uslugu koju ljudi mogu direktno da dogovore sa tobom.</p>
                    <button type="button" onClick={() => openCreateOffer("service")}>
                      <Icon name="plus" size={15} />
                      Dodaj uslugu
                    </button>
                  </div>
                ) : null}
              </section>
            )}

            {showRentals && (rentalOffers.length > 0 || (isOwnProfile && isRentalHost)) && (
              <section
                id="rentals"
                className="listingSection offersSection"
              >
                <div className="listingHeader">
                  <div>
                    <span className="sectionKicker">Iznajmljivanje</span>
                    <h2>Oprema i vozila za iznajmljivanje</h2>
                    <p>
                      Pogledaj šta možeš da iznajmiš i kontaktiraj domaćina direktno.
                    </p>
                  </div>

                  {isOwnProfile && isRentalHost && (
                    <button
                      type="button"
                      className="sectionAction offerAddButton"
                      onClick={() => openCreateOffer("rental")}
                    >
                      <Icon name="plus" size={16} />
                      Dodaj iznajmljivanje
                    </button>
                  )}
                </div>

                {rentalOffers.length === 1 ? (
                  <SingleOfferFeature
                    item={rentalOffers[0]}
                    isOwner={isOwnProfile}
                    onEdit={openEditOffer}
                    onDelete={deleteOffer}
                    onContact={() => setContactModalOpen(true)}
                  />
                ) : rentalOffers.length > 1 ? (
                  <div className="offerRailShell">
                    <div className="offerSwipeRail" aria-label="Iznajmljivanje domaćina">
                      {rentalOffers.map((item) => (
                        <OfferCard
                          key={item.id}
                          item={item}
                          isOwner={isOwnProfile}
                          onEdit={openEditOffer}
                          onDelete={deleteOffer}
                          onContact={() => setContactModalOpen(true)}
                        />
                      ))}
                    </div>

                    <div className="adventureSwipeHint">
                      <span>Prevuci za još ponuda</span>
                      <Icon name="arrowRight" size={14} />
                    </div>
                  </div>
                ) : isOwnProfile && isRentalHost ? (
                  <div className="emptyListing compactEmpty">
                    <span><Icon name="package" size={27} /></span>
                    <h3>Dodaj prvo iznajmljivanje.</h3>
                    <p>Dodaj opremu ili vozilo koje korisnici mogu direktno da iznajme od tebe.</p>
                    <button type="button" onClick={() => openCreateOffer("rental")}>
                      <Icon name="plus" size={15} />
                      Dodaj iznajmljivanje
                    </button>
                  </div>
                ) : null}
              </section>
            )}

            <div className="mainGrid">
              <div className="mainColumn">
                <section className="contentCard aboutCard">
                  <div className="sectionHeading">
                    <div>
                      <span className="sectionKicker">
                        O domaćinu
                      </span>

                      <h2>
                        Iskustvo iza avanture.
                      </h2>
                    </div>

                    <span className="sectionIcon">
                      <Icon
                        name="compass"
                        size={21}
                      />
                    </span>
                  </div>

                  <p className="hostBio">
                    {profile.bio ||
                      "Ovaj domaćin još nije dodao opis. Uskoro će ovde biti više informacija o iskustvu, pristupu organizaciji i avanturama koje nudi."}
                  </p>

                  {(hasAdventures || hostCheckins.length > 0 || hasOffers) && (
                    <div className="hostStoryStats">
                      {hasAdventures && (
                        <article>
                          <span>{activeEvents.length}</span>
                          <small>avantura</small>
                        </article>
                      )}

                      {hostCheckins.length > 0 && (
                        <article>
                          <span>{hostCheckins.length}</span>
                          <small>GPS check-inova</small>
                        </article>
                      )}

                      {hasOffers && (
                        <article>
                          <span>{offers.length}</span>
                          <small>aktivnih ponuda</small>
                        </article>
                      )}
                    </div>
                  )}

                  <div className="profilePresence">
                    <span className="profilePresenceDot" />
                    <span>
                      {hasAdventures || hasAccommodation || hasOffers
                        ? "Aktivan MeetOutdoors domaćin"
                        : "MeetOutdoors profil domaćina"}
                    </span>
                  </div>

                  <div className="trustMessage">
                    <span>
                      <Icon
                        name="shield"
                        size={18}
                      />
                    </span>

                    <div>
                      <strong>
                        Profil domaćina
                      </strong>

                      <p>
                        Upoznaj domaćina, njegove ponude, lokacije i utiske zajednice pre nego što ga kontaktiraš.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="contentCard">
                  <div className="sectionHeading">
                    <div>
                      <span className="sectionKicker">
                        Outdoor aktivnosti
                      </span>

                      <h2>
                        Avanture koje organizuje.
                      </h2>
                    </div>
                  </div>

                  <div className="activityList">
                    {activities.length > 0 ? (
                      activities.map(
                        (activity) => (
                          <span
                            key={activity}
                            className="activityChip"
                          >
                            <Icon
                              name="check"
                              size={14}
                            />
                            {activity}
                          </span>
                        )
                      )
                    ) : (
                      <div className="emptyInline">
                        Aktivnosti još nisu dodate.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <aside className="sideColumn">
                <section className="contentCard contactCard">
                  <div className="sectionHeading compact">
                    <div>
                      <span className="sectionKicker">
                        Kontakt
                      </span>

                      <h2>
                        Poveži se sa domaćinom.
                      </h2>
                    </div>
                  </div>

                  <div className="contactList">
                    <ContactItem
                      icon="phone"
                      title="Telefon"
                      value={profile.phone}
                      href={
                        profile.phone
                          ? `tel:${profile.phone.replace(
                              /\s/g,
                              ""
                            )}`
                          : ""
                      }
                      mutedText="Telefon nije dodat"
                    />

                    <ContactItem
                      icon="instagram"
                      title="Instagram"
                      value={
                        profile.instagram_url
                          ? "Otvori Instagram profil"
                          : ""
                      }
                      href={
                        profile.instagram_url
                      }
                      mutedText="Instagram nije dodat"
                    />

                    <ContactItem
                      icon="globe"
                      title="Web-sajt"
                      value={
                        profile.website_url
                          ? "Poseti web-sajt"
                          : ""
                      }
                      href={
                        profile.website_url
                      }
                      mutedText="Web-sajt nije dodat"
                    />

                    <ContactItem
                      icon="video"
                      title="Promo video"
                      value={
                        profile.promo_video_url
                          ? "Pogledaj promo video"
                          : ""
                      }
                      href={
                        profile.promo_video_url
                      }
                      mutedText="Promo video nije dodat"
                    />
                  </div>
                </section>

                <section className="verifiedCard">
                  <span className="verifiedIcon">
                    <Icon
                      name="shield"
                      size={23}
                    />
                  </span>

                  <div>
                    <span className="verifiedLabel">
                      MeetOutdoors sigurnost
                    </span>

                    <h3>
                      Upoznaj domaćina pre kontakta.
                    </h3>

                    <p>
                      Na jednom mestu vidiš šta domaćin nudi,
                      gde se nalazi i kako da ga
                      kontaktiraš direktno.
                    </p>
                  </div>
                </section>
              </aside>
            </div>



            {hasGallery && (
            <section className="hostGallerySection">
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">
                    Galerija
                  </span>

                  <h2>
                    Avanture kroz stvarne kadrove
                  </h2>

                  <p>
                    Fotografije koje je domaćin
                    dodao na MeetOutdoors mestima.
                  </p>
                </div>

                <span className="galleryCount">
                  {hostPhotos.length}
                </span>
              </div>

              {hostPhotos.length > 0 ? (
                <div className="hostGalleryGrid">
                  {hostPhotos
                    .slice(0, 8)
                    .map((photo, index) => (
                      <button
                        key={photo.id}
                        type="button"
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
                <div className="emptyListing compactEmpty">
                  <span>
                    <Icon
                      name="camera"
                      size={27}
                    />
                  </span>

                  <h3>
                    Još nema community fotografija.
                  </h3>

                  <p>
                    Fotografije će se automatski
                    pojaviti ovde kada ih domaćin
                    doda na Explore mesta.
                  </p>
                </div>
              )}
            </section>


            )}

              </>
            )}



            {hasMapContent && (
            <section
              id="host-map"
              className="hostMapSection"
            >
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">
                    Lokacija domaćina
                  </span>

                  <h2>
                    Istraži lokacije ovog domaćina
                  </h2>

                  <p>
                    Javna lokacija domaćina i mesta povezana
                    sa njegovim MeetOutdoors profilom.
                  </p>
                </div>

                <Link
                  to="/explore"
                  className="sectionAction"
                >
                  Otvori Explore
                  <Icon
                    name="arrowRight"
                    size={17}
                  />
                </Link>
              </div>

              <div className="hostMapFrame">
                <MapContainer
                  center={visibleMapCenter}
                  zoom={hasPublicMapLocation ? 12 : 7}
                  scrollWheelZoom={false}
                  className="hostLeaflet"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {hasPublicMapLocation && (
                    <Marker
                      position={[hostLatitude, hostLongitude]}
                    />
                  )}

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
                      eventHandlers={{
                        click: () =>
                          navigate(
                            `/explore/${place.id}`
                          ),
                      }}
                    />
                  ))}
                </MapContainer>

                <div className="hostMapLegend">
                  <Icon
                    name="verified"
                    size={13}
                  />

                  JAVNA + COMMUNITY LOKACIJE
                </div>
              </div>
            </section>
            )}

          </div>
        </section>

        <OfferModal
          open={offerModalOpen}
          mode={offerModalMode}
          form={offerForm}
          setForm={setOfferForm}
          photoItems={offerPhotoItems}
          coverIndex={offerCoverIndex}
          onPhotoChange={handleOfferPhotosChange}
          onRemovePhoto={removeOfferPhoto}
          onSetCover={setOfferCoverIndex}
          onClose={closeOfferModal}
          onSubmit={submitOffer}
          saving={offerSaving}
          error={offerError}
        />

        <AccommodationModal
          open={stayModalOpen}
          mode={stayModalMode}
          form={stayForm}
          setForm={setStayForm}
          photoItems={stayPhotoItems}
          coverIndex={stayCoverIndex}
          onPhotoChange={handleStayPhotosChange}
          onRemovePhoto={removeStayPhoto}
          onSetCover={setStayCoverIndex}
          onClose={closeStayModal}
          onSubmit={submitStay}
          saving={staySaving}
          error={stayError}
        />

        <DirectContactModal
          open={contactModalOpen}
          profile={profile}
          onClose={() => setContactModalOpen(false)}
        />
      </main>
    </>
  );
}

function HostProfileStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      html,body,#root{min-height:100%}
      body{margin:0;background:#eef2eb}
      button,input,textarea{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .hostProfilePage{min-height:100vh;padding:118px 30px 50px;background:radial-gradient(circle at 8% 0%,rgba(178,212,145,.18),transparent 27%),radial-gradient(circle at 94% 18%,rgba(67,108,76,.1),transparent 24%),#eef2eb;color:#17271f;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .hostProfilePage a{color:inherit;text-decoration:none}
      .hostActionButton{border:0;font:inherit;text-align:left;cursor:pointer}
      .mobileHostDock button{border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}
      .directContactBackdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:end center;padding:20px;background:rgba(9,18,13,.55);backdrop-filter:blur(8px)}
      .directContactSheet{width:min(520px,100%);padding:22px;border:1px solid rgba(255,255,255,.14);border-radius:26px;background:#f8faf5;box-shadow:0 28px 90px rgba(8,20,12,.28);color:#17271f}
      .directContactHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
      .directContactHead small{display:block;color:#79906d;font-size:9px;font-weight:900;letter-spacing:.12em}
      .directContactHead h3{margin:5px 0 0;font-size:25px;letter-spacing:-.04em}
      .directContactHead p{margin:7px 0 0;color:#718078;font-size:12px;line-height:1.55}
      .directContactClose{display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border:1px solid #dbe3d8;border-radius:13px;background:white;color:#314638;cursor:pointer}
      .directContactOptions{display:grid;gap:10px;margin-top:20px}
      .directContactOptions>a{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;min-height:66px;padding:11px 13px;border:1px solid #dce5d9;border-radius:17px;background:white;transition:transform .18s ease,border-color .18s ease}
      .directContactOptions>a:hover{transform:translateY(-1px);border-color:#a9c59a}
      .directContactOptions>a>span{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#e8f2df;color:#456435}
      .directContactOptions small,.directContactOptions strong{display:block}
      .directContactOptions small{color:#8a968e;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      .directContactOptions strong{margin-top:4px;color:#203329;font-size:12px}
      .directContactEmpty{margin-top:18px;padding:18px;border:1px dashed #cfd9cb;border-radius:16px;color:#718078;text-align:center;font-size:12px}
      .profileShell{width:min(1260px,100%);margin:0 auto;overflow:hidden;border:1px solid rgba(34,55,43,.1);border-radius:36px;background:rgba(250,251,247,.91);box-shadow:0 34px 100px rgba(30,50,37,.12)}
      .profileHero{position:relative;isolation:isolate;min-height:670px;display:flex;flex-direction:column;justify-content:flex-end;padding:34px;overflow:hidden;color:white}
      .coverImage,.coverOverlay{position:absolute;inset:0;width:100%;height:100%}
      .coverImage{z-index:-4;object-fit:cover;transition:transform .8s ease}
      .profileHero:hover .coverImage{transform:scale(1.018)}
      .coverOverlay{z-index:-3;background:linear-gradient(180deg,rgba(5,16,10,.38),rgba(5,16,10,.14) 26%,rgba(4,14,8,.62) 65%,rgba(4,14,8,.97)),linear-gradient(90deg,rgba(4,14,8,.44),transparent 66%)}
      .heroGlow{position:absolute;right:-90px;bottom:-170px;z-index:-2;width:520px;height:520px;border-radius:50%;background:rgba(201,242,140,.1);filter:blur(76px)}
      .heroTopline{position:absolute;top:28px;right:28px;left:28px;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .heroExploreLink,.heroEditButton{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 13px;border:1px solid rgba(255,255,255,.16);border-radius:13px;background:rgba(4,14,8,.38);color:#fff!important;font-size:9px;font-weight:850;backdrop-filter:blur(15px)}
      .heroEditButton{border-color:#c9f28c;background:#c9f28c;color:#183a27!important}
      .heroProfileInfo{display:flex;align-items:flex-end;gap:25px;padding-bottom:120px}
      .profileAvatar{flex:0 0 auto;width:156px;height:156px;border:5px solid rgba(255,255,255,.94);border-radius:39px;object-fit:cover;background:#1a2e23;box-shadow:0 18px 45px rgba(0,0,0,.28)}
      .heroText{min-width:0;padding-bottom:5px}
      .hostBadgeRow{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
      .hostBadge,.heroRatingBadge,.heroLevelBadge{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.86);font-size:9px;font-weight:850;letter-spacing:.03em;backdrop-filter:blur(12px)}
      .hostBadge.verified{border-color:rgba(201,242,140,.34);background:rgba(201,242,140,.13);color:#d9f7ae}
      .heroLevelBadge{border-color:rgba(186,255,158,.22);background:rgba(186,255,158,.09);color:#d9ffca}
      .heroRatingBadge{border-color:rgba(255,225,138,.28);background:rgba(255,211,92,.12);color:#ffe28a}
      .heroRatingBadge small{color:rgba(255,255,255,.62);font-size:7px}
      .heroText h1{max-width:860px;margin:0;font-size:clamp(54px,7vw,96px);line-height:.92;letter-spacing:-.075em}
      .profileMeta{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:16px;color:rgba(255,255,255,.66);font-size:11px;font-weight:750}
      .profileMeta>span{display:inline-flex;align-items:center;gap:6px}
      .metaDivider{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.34)}
      .heroActivityBadges{display:flex;flex-wrap:wrap;gap:6px;margin-top:15px}
      .heroActivityBadges span{display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.72);font-size:7px;font-weight:800;backdrop-filter:blur(8px)}
      .heroTrustStrip{position:absolute;right:34px;bottom:30px;left:34px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .heroTrustStrip article{padding:13px 14px;border:1px solid rgba(255,255,255,.12);border-radius:15px;background:rgba(4,14,8,.42);backdrop-filter:blur(14px)}
      .heroTrustStrip strong,.heroTrustStrip span{display:block}
      .heroTrustStrip strong{font-size:21px;letter-spacing:-.04em}
      .heroTrustStrip span{margin-top:4px;color:rgba(255,255,255,.42);font-size:6px;font-weight:850;text-transform:uppercase}
      .profileContent{position:relative;padding:30px}
      .hostActionBar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin-bottom:18px}
      .hostAction{display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:9px;min-height:64px;padding:9px;border:1px solid #dce4d9;border-radius:17px;background:#fff;color:inherit;text-align:left;cursor:pointer}
      .hostAction>svg{justify-self:center;color:#5b7741}
      .hostAction small,.hostAction strong{display:block}
      .hostAction small{color:#9aa39d;font-size:5px;font-weight:900;letter-spacing:.08em}
      .hostAction strong{margin-top:2px;font-size:8px}
      .hostAction.primary{border-color:#173b27;background:#173b27;color:white}
      .hostAction.primary>svg{color:#baff9e}
      .hostShareAction{border-color:#cfe0c3;background:linear-gradient(145deg,#f7fbf3,#eef6e8)}
      .hostShareAction>svg{color:#173b27!important}
      .hostStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px}
      .hostStats article{display:flex;align-items:center;gap:12px;min-width:0;padding:16px;border:1px solid #dfe5dc;border-radius:18px;background:rgba(255,255,255,.75)}
      .hostStats article>span{display:grid;place-items:center;flex:0 0 auto;width:42px;height:42px;border-radius:13px;background:#e9f2de;color:#58743f}
      .hostStats strong,.hostStats small{display:block}
      .hostStats strong{color:#23362a;font-size:19px}
      .hostStats small{margin-top:3px;color:#869087;font-size:8px;line-height:1.35}
      .mainGrid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(290px,.75fr);gap:20px}
      .mainColumn,.sideColumn{display:grid;align-content:start;gap:20px}
      .contentCard,.listingSection,.reviewsSection,.reviewFeedSection,.hostMapSection,.hostGallerySection{border:1px solid #dde4da;border-radius:25px;background:rgba(255,255,255,.78);box-shadow:0 12px 35px rgba(33,52,40,.045)}
      .contentCard{padding:25px}
      .sectionHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px}
      .sectionHeading.compact{margin-bottom:17px}
      .sectionKicker{display:block;margin-bottom:8px;color:#759253;font-size:8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .sectionHeading h2,.listingHeader h2,.reviewsIntro h2{margin:0;color:#21342a;font-size:clamp(24px,3vw,34px);line-height:1.05;letter-spacing:-.045em}
      .sectionIcon{display:grid;place-items:center;flex:0 0 auto;width:43px;height:43px;border-radius:14px;background:#e9f2de;color:#5d7843}
      .hostBio{margin:0;color:#647169;font-size:13px;line-height:1.8}
      .hostStoryStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:20px}
      .hostStoryStats article{padding:12px;border:1px solid #e0e7dd;border-radius:14px;background:#f8faf6}
      .hostStoryStats span,.hostStoryStats small{display:block}
      .hostStoryStats span{font-size:17px;font-weight:900}
      .hostStoryStats small{margin-top:3px;color:#8c968f;font-size:6px;text-transform:uppercase}
      .trustMessage{display:flex;gap:12px;margin-top:20px;padding:15px;border:1px solid #dbe7d2;border-radius:17px;background:#f3f8ed}
      .trustMessage>span{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:12px;background:#e2efd7;color:#587640}
      .trustMessage strong{display:block;color:#304438;font-size:11px}
      .trustMessage p{margin:4px 0 0;color:#7d8981;font-size:9px;line-height:1.5}
      .activityList{display:flex;flex-wrap:wrap;gap:8px}
      .activityChip{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border:1px solid #d4ded0;border-radius:999px;background:#f7f9f4;color:#526359;font-size:9px;font-weight:800}
      .activityChip svg{color:#6d9050}
      .emptyInline{width:100%;padding:15px;border-radius:14px;background:#f5f7f2;color:#8a958d;font-size:10px}
      .contactList{display:grid;gap:9px}
      .contactItem{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;min-height:64px;padding:10px;border:1px solid #dee4dc;border-radius:15px;background:#f9faf7}
      .contactItem.disabled{opacity:.62}
      .contactIcon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#e9f2de;color:#5b7741}
      .contactText{min-width:0}
      .contactText small,.contactText strong{display:block}
      .contactText small{color:#929b94;font-size:7px}
      .contactText strong{overflow:hidden;margin-top:4px;color:#3c4d42;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
      .contactArrow{color:#89938c}
      .verifiedCard{display:flex;align-items:flex-start;gap:14px;padding:22px;border-radius:24px;background:linear-gradient(145deg,#173b27,#234f36);color:white;box-shadow:0 18px 40px rgba(24,58,39,.16)}
      .verifiedIcon{display:grid;place-items:center;flex:0 0 auto;width:48px;height:48px;border:1px solid rgba(201,242,140,.22);border-radius:15px;background:rgba(201,242,140,.12);color:#c9f28c}
      .verifiedLabel{color:#c9f28c;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .verifiedCard h3{margin:8px 0 0;font-size:18px;line-height:1.2;letter-spacing:-.03em}
      .verifiedCard p{margin:10px 0 0;color:rgba(255,255,255,.58);font-size:9px;line-height:1.6}

      .offerAddButton{border:0;background:#173f2a;color:#fff!important;cursor:pointer;box-shadow:0 10px 24px rgba(23,63,42,.14)}
      .offerRailShell{position:relative;margin-top:18px}
      .offerSwipeRail{display:flex;gap:16px;overflow-x:auto;padding:2px 2px 14px;scroll-snap-type:x mandatory;scroll-padding-inline:2px;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}
      .offerSwipeRail::-webkit-scrollbar{display:none}
      .offerCard{position:relative;flex:0 0 342px;scroll-snap-align:start;overflow:hidden;border:1px solid #dce4d9;border-radius:23px;background:#fff;box-shadow:0 10px 30px rgba(31,51,38,.055);transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
      .offerCard:hover{transform:translateY(-4px);border-color:#a8bb9c;box-shadow:0 22px 46px rgba(31,51,38,.11)}
      .offerCardMedia{position:relative;height:224px;overflow:hidden;background:#dce5d9}
      .offerCardMedia img{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
      .offerCard:hover .offerCardMedia img{transform:scale(1.045)}
      .offerCardShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,16,10,.08),rgba(5,16,10,.18) 44%,rgba(5,16,10,.88))}
      .offerCategoryBadge{position:absolute;top:12px;left:12px;display:inline-flex;align-items:center;gap:6px;min-height:29px;padding:0 10px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(8,27,16,.54);color:#fff;font-size:8px;font-weight:900;backdrop-filter:blur(12px)}
      .offerOwnerActions{position:absolute;top:10px;right:10px;display:flex;gap:6px}
      .offerOwnerActions button{display:grid;place-items:center;width:31px;height:31px;border:1px solid rgba(255,255,255,.24);border-radius:10px;background:rgba(8,27,16,.58);color:#fff;cursor:pointer;backdrop-filter:blur(12px)}
      .offerOwnerActions button.danger:hover{background:#7d2b2b}
      .offerCardHeroCopy{position:absolute;right:15px;bottom:14px;left:15px;color:#fff}
      .offerCardHeroCopy>span{display:inline-flex;align-items:center;gap:5px;color:rgba(255,255,255,.74);font-size:8px;font-weight:800}
      .offerCardHeroCopy h3{margin:6px 0 0;font-size:22px;line-height:1.02;letter-spacing:-.04em}
      .offerCardBody{padding:15px}
      .offerCardBody>p{min-height:48px;margin:0;color:#627168;font-size:10px;line-height:1.52;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
      .offerCardBottom{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:13px;padding-top:12px;border-top:1px solid #edf1eb}
      .offerCardBottom>strong{color:#173f2a;font-size:12px}
      .offerContactButton{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border:0;border-radius:11px;background:#c9f28c;color:#173f2a;font-size:8px;font-weight:900;cursor:pointer}
      .offerOwnerHint{color:#819086;font-size:8px;font-weight:800}
      .offerEmptyState button{display:inline-flex;align-items:center;gap:7px;margin-top:14px;padding:10px 14px;border:0;border-radius:12px;background:#173f2a;color:#fff;font-size:8px;font-weight:900;cursor:pointer}
      .offerModalBackdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(6,18,11,.72);backdrop-filter:blur(10px)}
      .offerModal{width:min(720px,100%);max-height:min(90vh,900px);overflow:auto;border:1px solid rgba(255,255,255,.16);border-radius:25px;background:#f8faf6;box-shadow:0 30px 90px rgba(0,0,0,.3)}
      .offerModalHeader{position:sticky;top:0;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 22px 18px;border-bottom:1px solid #e1e7de;background:rgba(248,250,246,.94);backdrop-filter:blur(14px)}
      .offerModalHeader span{color:#6f7f74;font-size:8px;font-weight:950;letter-spacing:.16em}
      .offerModalHeader h2{margin:5px 0 0;color:#17271f;font-size:27px;letter-spacing:-.045em}
      .offerModalHeader p{max-width:520px;margin:7px 0 0;color:#718077;font-size:10px;line-height:1.45}
      .offerModalHeader>button{flex:0 0 auto;width:36px;height:36px;border:1px solid #dbe3d8;border-radius:11px;background:#fff;color:#264131;font-size:23px;line-height:1;cursor:pointer}
      .offerForm{display:grid;gap:15px;padding:21px 22px 24px}
      .offerFormGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .offerField{display:grid;gap:7px}
      .offerField>span{color:#4d6254;font-size:8px;font-weight:900}
      .offerField input,.offerField textarea,.offerField select{width:100%;border:1px solid #d8e0d5;border-radius:13px;background:#fff;color:#17271f;outline:none;transition:border-color .2s ease,box-shadow .2s ease}
      .offerField input,.offerField select{height:45px;padding:0 13px}
      .offerField textarea{resize:vertical;min-height:120px;padding:12px 13px;line-height:1.5}
      .offerField input:focus,.offerField textarea:focus,.offerField select:focus{border-color:#7fa06f;box-shadow:0 0 0 3px rgba(127,160,111,.12)}
      .offerField>small{justify-self:end;color:#9aa59d;font-size:7px}
      .offerCheckField{display:flex;align-items:center;gap:10px;min-height:45px;padding:9px 11px;border:1px solid #d8e0d5;border-radius:13px;background:#fff;cursor:pointer}
      .offerCheckField input{width:17px;height:17px;accent-color:#173f2a}
      .offerCheckField span{display:grid;gap:2px}
      .offerCheckField strong{font-size:9px}
      .offerCheckField small{color:#849188;font-size:7px}
      .offerImagePicker{cursor:pointer}
      .offerImagePicker>input{display:none}
      .offerImagePreview{display:flex;align-items:center;gap:13px;min-height:102px;padding:10px;border:1px dashed #becab9;border-radius:16px;background:#f1f5ee}
      .offerImagePreview img{width:118px;height:82px;border-radius:12px;object-fit:cover}
      .offerImagePreview>span{display:grid;place-items:center;width:58px;height:58px;border-radius:15px;background:#fff;color:#41624c}
      .offerImagePreview>div{display:grid;gap:4px}
      .offerImagePreview strong{font-size:10px}
      .offerImagePreview small{color:#87938b;font-size:8px}
      .stayGalleryEditor{display:grid;gap:12px;padding:15px;border:1px solid #dce4d9;border-radius:18px;background:#f8faf6}
      .stayGalleryEditorHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
      .stayGalleryEditorHead>div{display:grid;gap:3px}
      .stayGalleryEditorHead>div>span{color:#78905f;font-size:8px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
      .stayGalleryEditorHead>div>strong{color:#263d30;font-size:14px;letter-spacing:-.025em}
      .stayGalleryEditorHead>div>small{max-width:520px;color:#87938b;font-size:8px;line-height:1.5}
      .stayGalleryCount{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;min-width:52px;height:28px;padding:0 9px;border:1px solid #d5dfd1;border-radius:999px;background:#fff;color:#5d735f;font-size:8px;font-weight:900}
      .stayMultiPicker{display:block}
      .stayMultiUpload{min-height:82px}
      .stayMultiPicker.selected .offerImagePreview{border-color:#a9bea2;background:#eef4ea}
      .stayPhotoGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .stayPhotoItem{position:relative;min-width:0;aspect-ratio:1.35/1;overflow:hidden;border:1px solid #d9e1d6;border-radius:14px;background:#e9eee7}
      .stayPhotoItem.cover{border-color:#789b69;box-shadow:0 0 0 3px rgba(120,155,105,.10)}
      .stayPhotoItem>img{width:100%;height:100%;display:block;object-fit:cover}
      .stayPhotoItem::after{content:"";position:absolute;inset:45% 0 0;background:linear-gradient(180deg,transparent,rgba(7,24,14,.78));pointer-events:none}
      .stayPhotoCoverBadge{position:absolute;top:8px;left:8px;z-index:2;display:inline-flex;align-items:center;gap:4px;min-height:25px;padding:0 8px;border-radius:999px;background:rgba(239,255,231,.95);color:#31533a;font-size:7px;font-weight:900;box-shadow:0 5px 15px rgba(0,0,0,.12)}
      .stayPhotoActions{position:absolute;right:7px;bottom:7px;left:7px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:6px}
      .stayPhotoActions button{min-height:29px;border:0;border-radius:9px;cursor:pointer;font-size:7px;font-weight:900}
      .stayPhotoActions .setCover{padding:0 9px;background:rgba(255,255,255,.94);color:#294334}
      .stayPhotoActions .removePhoto{display:grid;place-items:center;width:31px;flex:0 0 31px;background:rgba(89,25,25,.86);color:#fff}
      .stayPhotoCountBadge{position:absolute;right:12px;bottom:12px;z-index:3;display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:0 8px;border:1px solid rgba(255,255,255,.23);border-radius:999px;background:rgba(7,20,12,.58);color:#fff;font-size:7px;font-weight:900;backdrop-filter:blur(9px)}
      @media(max-width:680px){
        .stayPhotoGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .stayGalleryEditor{padding:12px}
      }
      .offerFormError{padding:10px 12px;border:1px solid #efd1cc;border-radius:12px;background:#fff1ee;color:#9b3d32;font-size:9px;font-weight:800}
      .offerModalActions{display:flex;justify-content:flex-end;gap:9px;padding-top:3px}
      .offerModalActions button{min-height:42px;padding:0 15px;border-radius:12px;font-size:8px;font-weight:900;cursor:pointer}
      .offerModalActions .secondary{border:1px solid #d7dfd4;background:#fff;color:#516258}
      .offerModalActions .primary{border:0;background:#173f2a;color:#fff;box-shadow:0 10px 20px rgba(23,63,42,.16)}
      .offerModalActions button:disabled{opacity:.55;cursor:not-allowed}



      .hostMapSection,.hostGallerySection,.listingSection,.reviewFeedSection{margin-top:20px;padding:28px}
      .listingHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}
      .listingHeader p,.reviewsIntro p{margin:12px 0 0;color:#7c8880;font-size:10px;line-height:1.6}
      .sectionAction{display:inline-flex;align-items:center;gap:8px;flex:0 0 auto;min-height:42px;padding:0 14px;border:1px solid #d6dfd2;border-radius:13px;background:white;color:#37513f!important;font-size:9px;font-weight:850}
      .hostMapFrame{position:relative;height:430px;margin-top:22px;overflow:hidden;border-radius:21px;background:#dfe7dc}
      .hostLeaflet{width:100%;height:100%}
      .hostMapMarkerShell{background:transparent!important;border:0!important}
      .hostMapMarker{position:relative;width:44px;height:44px;padding:3px;border:3px solid white;border-radius:14px;background:#173b27;box-shadow:0 13px 27px rgba(20,48,31,.28)}
      .hostMapMarker img{width:100%;height:100%;border-radius:9px;object-fit:cover}
      .hostMapMarker span{position:absolute;bottom:-7px;left:50%;width:14px;height:14px;border-right:3px solid white;border-bottom:3px solid white;background:#173b27;transform:translateX(-50%) rotate(45deg);z-index:-1}
      .hostMapLegend{position:absolute;right:12px;bottom:12px;z-index:500;display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(5,17,10,.7);color:#dfffd1;font-size:6px;font-weight:900;letter-spacing:.07em;backdrop-filter:blur(10px)}
      .hostMapEmpty{position:absolute;inset:0;z-index:450;display:grid;place-items:center;align-content:center;gap:7px;padding:20px;background:rgba(239,243,236,.9);color:#718076;text-align:center}
      .hostMapEmpty strong{font-size:10px}
      .hostMapEmpty span{max-width:370px;color:#8a958d;font-size:8px;line-height:1.5}
      .galleryCount{display:grid;place-items:center;min-width:38px;height:38px;border-radius:12px;background:#e8f0de;color:#608046;font-size:9px;font-weight:900}
      .hostGalleryGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:22px}
      .hostGalleryGrid button{position:relative;height:190px;padding:0;overflow:hidden;border:0;border-radius:16px;background:#dce5d8;cursor:pointer}
      .hostGalleryGrid button.featured{grid-column:span 2;grid-row:span 2;height:388px}
      .hostGalleryGrid img{width:100%;height:100%;object-fit:cover}
      .hostGalleryGrid button>div{position:absolute;right:7px;bottom:7px;left:7px;padding:8px;border-radius:10px;background:rgba(5,17,10,.64);color:white;text-align:left;backdrop-filter:blur(9px)}
      .hostGalleryGrid strong,.hostGalleryGrid span{display:block}
      .hostGalleryGrid strong{overflow:hidden;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
      .hostGalleryGrid span{margin-top:2px;color:rgba(255,255,255,.46);font-size:5px}
      .emptyListing{display:grid;place-items:center;margin-top:24px;padding:55px 20px;border:1px dashed #cfd8cc;border-radius:20px;background:linear-gradient(145deg,rgba(241,246,235,.8),rgba(250,251,248,.8));text-align:center}
      .emptyListing.compactEmpty{padding:38px 20px}
      .emptyListing>span{display:grid;place-items:center;width:60px;height:60px;border-radius:19px;background:#e5efdb;color:#607d46}
      .emptyListing h3{margin:18px 0 0;color:#34483b;font-size:17px}
      .emptyListing p{max-width:500px;margin:9px auto 0;color:#89938c;font-size:10px;line-height:1.6}
      .emptyListing a{display:inline-flex;align-items:center;gap:7px;margin-top:18px;padding:11px 14px;border-radius:12px;background:#183a27;color:white!important;font-size:9px;font-weight:850}
      .adventureRailSection{overflow:hidden;background:linear-gradient(145deg,rgba(255,255,255,.94),rgba(244,248,241,.9))}
      .completedAdventureSection{background:linear-gradient(145deg,rgba(235,242,229,.96),rgba(249,251,247,.94))}
      .adventureRailShell{position:relative;margin-top:22px}
      .adventureSwipeRail{display:flex;gap:16px;overflow-x:auto;padding:2px 2px 14px;scroll-snap-type:x mandatory;scroll-padding-inline:2px;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}
      .adventureSwipeRail::-webkit-scrollbar{display:none}
      .adventureSwipeCard{flex:0 0 clamp(290px,31vw,365px);scroll-snap-align:start;scroll-snap-stop:always;border-radius:24px;background:#fff}
      .adventureCardImage{height:225px}
      .adventureImageShade{background:linear-gradient(180deg,rgba(8,24,14,.04) 15%,rgba(6,21,12,.2) 46%,rgba(6,21,12,.86) 100%)}
      .adventureCardImageCopy{position:absolute;right:16px;bottom:16px;left:16px;z-index:2;color:#fff}
      .adventureCardImageCopy h3{display:-webkit-box;margin:8px 0 0;overflow:hidden;font-size:20px;line-height:1.08;letter-spacing:-.025em;-webkit-box-orient:vertical;-webkit-line-clamp:2}
      .adventureCardLocation{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.76);font-size:8px;font-weight:800}
      .completedType{background:rgba(54,76,43,.76)!important;color:#e8ffd9!important}
      .adventureCardBody{padding:16px}
      .adventureCardDescription{display:-webkit-box;min-height:38px;margin:0;color:#77847b;font-size:9px;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
      .adventureCardMeta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding:10px 11px;border-radius:13px;background:#f3f6f0}
      .adventureCardMeta span{display:flex;align-items:center;gap:6px;color:#65746a;font-size:8px;font-weight:800}
      .adventureCardMeta strong{color:#294333;font-size:11px}
      .adventureCardFooter{margin-top:12px;padding-top:12px}
      .adventureCardState{color:#7d8b81!important;font-size:7px!important;font-weight:800!important}
      .adventureCardOpen{display:flex!important;align-items:center;gap:5px;color:#395c43!important;font-size:8px!important;font-weight:900!important}
      .completedAdventureCard{border-color:#cbd8c6;background:linear-gradient(180deg,#fff,#f8faf6)}
      .completedAdventureCard .adventureCardMeta{background:#edf3e8}
      .completedAdventureCount{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:48px;height:42px;padding:0 13px;border:1px solid #cad8c4;border-radius:13px;background:#edf5e8;color:#557744;font-size:10px;font-weight:950}
      .adventureSwipeHint{display:flex;align-items:center;justify-content:flex-end;gap:5px;margin-top:2px;color:#87928b;font-size:7px;font-weight:850;letter-spacing:.03em}
      .accommodationSection{overflow:hidden;background:linear-gradient(145deg,rgba(246,250,241,.98),rgba(255,255,255,.94))}
      .stayHeroBadge{border-color:rgba(201,242,140,.28);color:#eaffd4}
      .stayRailShell{position:relative;margin-top:20px}
      .staySwipeRail{display:flex;gap:14px;overflow-x:auto;padding:2px 2px 12px;scroll-snap-type:x mandatory;scroll-padding-inline:2px;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}
      .staySwipeRail::-webkit-scrollbar{display:none}
      .stayCard{flex:0 0 clamp(280px,29vw,345px);overflow:hidden;scroll-snap-align:start;border:1px solid #dce4d9;border-radius:22px;background:#fff;box-shadow:0 10px 28px rgba(31,51,38,.055)}
      .stayCardMedia{position:relative;height:205px;overflow:hidden;background:#e2e9de}
      .stayCardMedia>img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .5s ease}
      .stayCard:hover .stayCardMedia>img{transform:scale(1.035)}
      .stayCardShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,14,8,.04),rgba(4,14,8,.06) 38%,rgba(4,14,8,.82))}
      .stayTypeBadge{position:absolute;top:12px;left:12px;display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(8,27,15,.62);color:#eaffd7;font-size:8px;font-weight:900;backdrop-filter:blur(10px)}
      .stayHeroCopy{position:absolute;right:14px;bottom:14px;left:14px;color:#fff}
      .stayHeroCopy>span{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.72);font-size:8px;font-weight:800}
      .stayHeroCopy h3{display:-webkit-box;margin:7px 0 0;overflow:hidden;font-size:19px;line-height:1.08;letter-spacing:-.03em;-webkit-box-orient:vertical;-webkit-line-clamp:2}
      .stayCardBody{padding:15px}
      .stayCardBody>p{display:-webkit-box;min-height:36px;margin:0;overflow:hidden;color:#77847b;font-size:9px;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:2}
      .stayMeta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:13px;padding:10px 11px;border-radius:13px;background:#f3f6f0}
      .stayMeta span{display:flex;align-items:center;gap:6px;color:#67756c;font-size:8px;font-weight:800}
      .stayMeta strong{color:#294333;font-size:10px;white-space:nowrap}
      .stayContactButton{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:39px;margin-top:11px;padding:0 12px;border:0;border-radius:12px;background:#183a27;color:#fff;font-size:8px;font-weight:900;cursor:pointer}
      .stayOwnerHint{display:block;margin-top:11px;color:#7e8c82;font-size:8px;font-weight:800;text-align:right}
      .compactStayCheck{margin-top:0}
      .emptyListing button{display:inline-flex;align-items:center;gap:7px;margin-top:18px;padding:11px 14px;border:0;border-radius:12px;background:#183a27;color:#fff;font-size:9px;font-weight:850;cursor:pointer}
      .hostListingsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:24px}
      .hostListingCard{min-width:0;overflow:hidden;border:1px solid #dce4d9;border-radius:22px;background:#fff;box-shadow:0 10px 30px rgba(31,51,38,.05);transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
      .hostListingCard:hover{transform:translateY(-5px);border-color:#a8bb9c;box-shadow:0 22px 46px rgba(31,51,38,.11)}
      .hostListingImage{position:relative;height:190px;overflow:hidden;background:#e4eadf}
      .hostListingImage img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .55s ease}
      .hostListingCard:hover .hostListingImage img{transform:scale(1.05)}
      .listingImageShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,14,8,.08),transparent 45%,rgba(4,14,8,.55))}
      .hostListingType,.listingDateBadge,.listingRatingBadge{position:absolute;top:12px;display:inline-flex;align-items:center;gap:6px;min-height:31px;padding:0 10px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(9,28,16,.6);color:white;font-size:8px;font-weight:900;backdrop-filter:blur(12px)}
      .hostListingType{left:12px}
      .listingDateBadge,.listingRatingBadge{right:12px}
      .listingRatingBadge{color:#ffe28a}
      .hostListingBody{padding:17px}
      .hostListingBody h3{margin:0;color:#293d31;font-size:18px;line-height:1.15;letter-spacing:-.035em}
      .hostListingLocation{display:flex;align-items:center;gap:6px;margin-top:10px;color:#748078;font-size:8px;font-weight:750}
      .hostListingLocation svg{flex:0 0 auto;color:#719252}
      .hostListingDescription{display:-webkit-box;min-height:30px;margin:12px 0 0;overflow:hidden;color:#7a867e;font-size:9px;line-height:1.6;-webkit-box-orient:vertical;-webkit-line-clamp:2}
      .hostListingFooter{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:15px;padding-top:14px;border-top:1px solid #e5eae3}
      .hostListingFooter strong{color:#233d2d;font-size:13px}
      .hostListingFooter span{display:inline-flex;align-items:center;gap:5px;color:#638047;font-size:8px;font-weight:850}
      .reviewsSection{display:grid;grid-template-columns:minmax(0,.8fr) minmax(350px,1.2fr);gap:30px;margin-top:20px;padding:28px}
      .overallRating{display:flex;align-items:center;gap:14px;margin-top:20px}
      .overallRating>strong{color:#24392d;font-size:42px;line-height:1;letter-spacing:-.06em}
      .overallRating>div{display:grid;gap:5px}
      .overallStars{display:flex;gap:3px;color:#d7a52f}
      .overallRating small{color:#8a958d;font-size:9px}
      .reviewsPlaceholder{display:grid;grid-template-columns:minmax(150px,.55fr) minmax(230px,1fr);gap:25px;align-items:center;padding:21px;border:1px solid #e0e5de;border-radius:20px;background:#f8faf6}
      .ratingBlock{display:grid;place-items:center;text-align:center}
      .ratingBlock>span{display:grid;place-items:center;width:53px;height:53px;border-radius:17px;background:#e9f2de;color:#d3a12c}
      .ratingBlock strong{margin-top:12px;color:#35483d;font-size:13px}
      .ratingBlock small{margin-top:5px;color:#909992;font-size:9px}
      .reviewBars{display:grid;gap:8px}
      .reviewBars>div{display:grid;grid-template-columns:12px 13px 1fr 18px;align-items:center;gap:6px;color:#859087;font-size:9px}
      .reviewBars>div>svg{color:#d3a12c}
      .reviewBars>div>div{height:6px;overflow:hidden;border-radius:999px;background:#e1e7df}
      .reviewBars>div>div>span{display:block;height:100%;border-radius:inherit;background:#88a66b}
      .reviewBars>div>small{color:#9aa39c;font-size:8px;text-align:right}
      .reviewFeedGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:22px}
      .reviewCard{padding:18px;border:1px solid #dfe6dc;border-radius:19px;background:#fafbf8}
      .reviewCardTop{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}
      .reviewerIdentity{display:flex;align-items:center;gap:10px;min-width:0}
      .reviewerIdentity img{width:42px;height:42px;flex:0 0 auto;border-radius:13px;object-fit:cover;background:#e5ebdf}
      .reviewerIdentity>div{min-width:0}
      .reviewerIdentity strong,.reviewerIdentity small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .reviewerIdentity strong{color:#34483b;font-size:10px}
      .reviewerIdentity small{margin-top:4px;color:#8c968f;font-size:8px}
      .reviewDate{flex:0 0 auto;color:#9aa39d;font-size:8px}
      .reviewVerified{display:inline-flex;align-items:center;gap:5px;margin-top:12px;padding:5px 7px;border-radius:999px;background:#eaf3e2;color:#5a7b41;font-size:6px;font-weight:900}
      .reviewStars{display:flex;gap:3px;margin-top:12px;color:#d3a12c}
      .reviewCard>p{margin:12px 0 0;color:#6f7c74;font-size:10px;line-height:1.65}
      .mobileHostDock{display:none}
      .stateCard{display:grid;place-items:center;width:min(520px,100%);margin:20px auto 110px;padding:50px 30px;border:1px solid #dce3d9;border-radius:28px;background:rgba(255,255,255,.8);text-align:center;box-shadow:0 20px 60px rgba(28,48,35,.08)}
      .stateLoader{width:36px;height:36px;border:3px solid #dce5d7;border-top-color:#52783c;border-radius:50%;animation:profileSpin .8s linear infinite}
      @keyframes profileSpin{to{transform:rotate(360deg)}}
      .stateIcon{display:grid;place-items:center;width:58px;height:58px;border-radius:18px;background:#f3dfdc;color:#98463c}
      .stateCard h1{margin:18px 0 0;font-size:28px;letter-spacing:-.04em}
      .stateCard p{max-width:380px;margin:10px auto 0;color:#7e8981;font-size:12px;line-height:1.6}
      .stateButton{display:inline-flex;align-items:center;gap:7px;margin-top:22px;padding:12px 15px;border-radius:13px;background:#183a27;color:white!important;font-size:11px;font-weight:850}

      @media(max-width:1000px){
        .hostActionBar,.hostStats{grid-template-columns:repeat(2,minmax(0,1fr))}
        .mainGrid{grid-template-columns:1fr}
        .sideColumn{grid-template-columns:repeat(2,minmax(0,1fr))}
        .reviewsSection{grid-template-columns:1fr}
        .hostListingsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .hostGalleryGrid{grid-template-columns:repeat(3,minmax(0,1fr))}
      }

      @media(max-width:760px){
        .hostProfilePage{padding:84px 0 78px}
        .profileShell{border:0;border-radius:0}
        .profileHero{min-height:690px;padding:22px}
        .heroTopline{top:18px;right:18px;left:18px}
        .heroProfileInfo{align-items:flex-start;flex-direction:column;gap:17px;padding-bottom:150px}
        .profileAvatar{width:120px;height:120px;border-radius:28px}
        .heroText h1{font-size:clamp(46px,12vw,68px)}
        .heroTrustStrip{right:22px;bottom:22px;left:22px;grid-template-columns:repeat(2,minmax(0,1fr))}
        .profileContent{padding:22px}
        .sideColumn{grid-template-columns:1fr}
        .listingHeader{align-items:flex-start;flex-direction:column}
        .reviewsPlaceholder{grid-template-columns:1fr}
        .reviewFeedGrid{grid-template-columns:1fr}
        .hostMapFrame{height:360px}
        .hostGalleryGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .hostGalleryGrid button.featured{grid-column:1/-1;grid-row:auto;height:300px}
        .mobileHostDock{position:fixed;right:10px;bottom:10px;left:10px;z-index:5000;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:6px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(7,23,13,.93);box-shadow:0 18px 50px rgba(0,0,0,.28);backdrop-filter:blur(18px)}
        .mobileHostDock a{display:flex;align-items:center;justify-content:center;gap:5px;min-height:44px;border-radius:12px;color:#fff!important;font-size:6px;font-weight:850}
        .mobileHostDock a:first-child{background:#baff9e;color:#102619!important}
      }

      @media(max-width:560px){
        .hostListingsGrid{grid-template-columns:1fr}
        .hostListingImage{height:220px}
        .hostActionBar{grid-template-columns:1fr 1fr}
      }

      @media(max-width:520px){
        .profileHero{min-height:700px;padding:18px}
        .profileAvatar{width:105px;height:105px;border-radius:25px}
        .heroText h1{font-size:43px}
        .profileMeta{align-items:flex-start;flex-direction:column;gap:7px}
        .metaDivider{display:none!important}
        .profileContent{padding:14px}
        .heroTrustStrip{right:18px;left:18px}
        .hostStats{grid-template-columns:1fr}
        .contentCard,.listingSection,.reviewsSection,.reviewFeedSection,.hostMapSection,.hostGallerySection{padding:19px;border-radius:21px}
        .sectionHeading h2,.listingHeader h2,.reviewsIntro h2{font-size:27px}
        .sectionIcon{display:none}
        .contactItem{grid-template-columns:auto minmax(0,1fr)}
        .contactArrow{display:none}
        .overallRating>strong{font-size:36px}
        .hostGalleryGrid{grid-template-columns:1fr}
        .hostGalleryGrid button,.hostGalleryGrid button.featured{grid-column:auto;height:245px}
        .hostStoryStats{grid-template-columns:1fr}
      }


      /* =========================================================
         HOST PROFILE — ULTRA COMPACT
         Samo UI/UX sabijanje. Backend, upiti, rute i logika ostaju isti.
         ========================================================= */

      .hostProfilePage{padding-top:88px;padding-bottom:42px}
      .profileShell{max-width:1380px}

      .profileHero{min-height:470px}
      .heroProfileInfo{gap:18px;padding-bottom:105px}
      .profileAvatar{width:112px;height:112px;border-radius:26px}
      .heroText h1{font-size:clamp(42px,5.6vw,72px);line-height:.92}
      .profileMeta{gap:9px;margin-top:10px;font-size:9px}
      .heroActivityBadges{gap:5px;margin-top:10px}
      .heroActivityBadges span{padding:5px 7px;font-size:6.5px}
      .heroTrustStrip{right:26px;bottom:22px;left:26px;gap:6px}
      .heroTrustStrip article{padding:9px 11px;border-radius:12px}
      .heroTrustStrip strong{font-size:17px}
      .heroTrustStrip span{margin-top:2px;font-size:5.5px}

      .profileContent{padding:18px}
      .hostActionBar{gap:6px;margin-bottom:10px}
      .hostAction{grid-template-columns:32px minmax(0,1fr);gap:6px;min-height:50px;padding:7px;border-radius:13px}
      .hostAction small{font-size:4.5px}
      .hostAction strong{font-size:7.5px}

      .hostStats{gap:7px;margin-bottom:10px}
      .hostStats article{gap:8px;padding:10px;border-radius:13px}
      .hostStats article>span{width:34px;height:34px;border-radius:10px}
      .hostStats strong{font-size:16px}
      .hostStats small{margin-top:2px;font-size:6.5px}

      .mainGrid{gap:10px}
      .mainColumn,.sideColumn{gap:10px}
      .contentCard,.listingSection,.reviewsSection,.reviewFeedSection,.hostMapSection,.hostGallerySection{border-radius:17px}
      .contentCard{padding:15px}
      .sectionHeading{gap:12px;margin-bottom:10px}
      .sectionHeading.compact{margin-bottom:9px}
      .sectionKicker{margin-bottom:4px;font-size:6.5px}
      .sectionHeading h2,.listingHeader h2,.reviewsIntro h2{font-size:clamp(20px,2.4vw,28px)}
      .sectionIcon{width:35px;height:35px;border-radius:10px}
      .hostBio{font-size:10px;line-height:1.55}

      .hostStoryStats{gap:5px;margin-top:10px}
      .hostStoryStats article{padding:8px;border-radius:10px}
      .hostStoryStats span{font-size:14px}
      .hostStoryStats small{font-size:5.5px}
      .trustMessage{gap:8px;margin-top:10px;padding:10px;border-radius:12px}
      .trustMessage>span{width:32px;height:32px;border-radius:9px}
      .trustMessage strong{font-size:9px}
      .trustMessage p{margin-top:2px;font-size:7.5px;line-height:1.4}

      .activityList{gap:5px}
      .activityChip{min-height:29px;padding:0 9px;font-size:7.5px}

      .contactList{gap:5px}
      .contactItem{gap:7px;min-height:50px;padding:7px;border-radius:11px}
      .contactIcon{width:32px;height:32px;border-radius:9px}
      .contactText small{font-size:6px}
      .contactText strong{margin-top:2px;font-size:8px}

      .verifiedCard{gap:10px;padding:14px;border-radius:17px}
      .verifiedIcon{width:38px;height:38px;border-radius:11px}
      .verifiedLabel{font-size:6.5px}
      .verifiedCard h3{margin-top:5px;font-size:14px}
      .verifiedCard p{margin-top:5px;font-size:7.5px;line-height:1.4}

      .hostMapSection,.hostGallerySection,.listingSection,.reviewFeedSection{margin-top:10px;padding:16px}
      .listingHeader{gap:14px}
      .listingHeader p,.reviewsIntro p{margin-top:5px;font-size:8px;line-height:1.4}
      .sectionAction{min-height:34px;padding:0 10px;border-radius:10px;font-size:7.5px}

      .hostMapFrame{height:300px;margin-top:10px;border-radius:15px}
      .hostMapLegend{right:8px;bottom:8px;padding:6px 8px}
      .galleryCount{min-width:32px;height:32px;border-radius:9px;font-size:8px}

      .hostGalleryGrid{grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin-top:10px}
      .hostGalleryGrid button{height:135px;border-radius:11px}
      .hostGalleryGrid button.featured{grid-column:span 2;grid-row:span 2;height:275px}
      .hostGalleryGrid button>div{right:5px;bottom:5px;left:5px;padding:6px;border-radius:8px}

      .emptyListing{margin-top:10px;padding:28px 14px;border-radius:14px}
      .emptyListing.compactEmpty{padding:22px 14px}
      .emptyListing>span{width:44px;height:44px;border-radius:13px}
      .emptyListing h3{margin-top:10px;font-size:13px}
      .emptyListing p{margin-top:5px;font-size:8px;line-height:1.4}
      .emptyListing a{margin-top:10px;padding:8px 10px;font-size:7.5px}

      .hostListingsGrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
      .hostListingCard{border-radius:14px}
      .hostListingImage{height:130px}
      .hostListingType,.listingDateBadge,.listingRatingBadge{top:7px;min-height:24px;padding:0 7px;font-size:6.5px}
      .hostListingType{left:7px}
      .listingDateBadge,.listingRatingBadge{right:7px}
      .hostListingBody{padding:10px}
      .hostListingBody h3{font-size:14px}
      .hostListingLocation{gap:4px;margin-top:6px;font-size:7px}
      .hostListingDescription{min-height:22px;margin-top:6px;font-size:7.5px;line-height:1.4}
      .hostListingFooter{gap:6px;margin-top:8px;padding-top:7px}
      .hostListingFooter strong{font-size:10px}
      .hostListingFooter span{font-size:6.5px}

      .reviewsSection{grid-template-columns:minmax(0,.7fr) minmax(320px,1.3fr);gap:14px;margin-top:10px;padding:16px}
      .overallRating{gap:9px;margin-top:10px}
      .overallRating>strong{font-size:34px}
      .reviewsPlaceholder{gap:12px;padding:12px;border-radius:13px}
      .ratingBlock>span{width:42px;height:42px;border-radius:12px}
      .ratingBlock strong{margin-top:7px;font-size:10px}
      .ratingBlock small{margin-top:3px;font-size:7px}
      .reviewBars{gap:5px}
      .reviewBars>div{gap:4px;font-size:7px}
      .reviewFeedGrid{gap:7px;margin-top:10px}
      .reviewCard{padding:11px;border-radius:13px}
      .reviewCardTop{gap:8px}
      .reviewerIdentity{gap:7px}
      .reviewerIdentity img{width:34px;height:34px;border-radius:10px}
      .reviewerIdentity strong{font-size:8.5px}
      .reviewerIdentity small,.reviewDate{font-size:6.5px}
      .reviewVerified{margin-top:7px;padding:4px 6px}
      .reviewStars{margin-top:7px}
      .reviewCard>p{margin-top:7px;font-size:8px;line-height:1.45}

      @media(max-width:1180px){
        .hostListingsGrid{grid-template-columns:repeat(3,minmax(0,1fr))}
        .hostGalleryGrid{grid-template-columns:repeat(4,minmax(0,1fr))}
      }

      @media(max-width:760px){
        .offerCard{flex-basis:310px}
        .offerCardMedia{height:190px}
        .offerFormGrid{grid-template-columns:1fr}
        .offerModalBackdrop{padding:10px}
        .offerModal{border-radius:20px}
        .offerModalHeader{padding:17px}
        .offerModalHeader h2{font-size:22px}
        .offerForm{padding:17px;gap:12px}
        .hostProfilePage{padding:72px 0 68px}
        .profileHero{min-height:500px;padding:14px}
        .heroTopline{top:12px;right:12px;left:12px}
        .heroProfileInfo{gap:10px;padding-bottom:108px}
        .profileAvatar{width:82px;height:82px;border-radius:20px}
        .heroText h1{font-size:38px}
        .profileMeta{gap:5px;margin-top:6px;font-size:8px}
        .heroActivityBadges{margin-top:7px}
        .heroTrustStrip{right:12px;bottom:12px;left:12px;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
        .heroTrustStrip article{padding:7px 5px;text-align:center}
        .heroTrustStrip strong{font-size:13px}
        .heroTrustStrip span{font-size:4.5px}

        .profileContent{padding:8px}
        .hostActionBar{grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;margin-bottom:6px}
        .hostAction{display:flex;align-items:center;justify-content:center;min-height:42px;padding:5px}
        .hostAction>svg{width:15px;height:15px}
        .hostAction div{display:none}

        .hostStats{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-bottom:6px}
        .hostStats article{display:block;padding:7px;text-align:center}
        .hostStats article>span{width:28px;height:28px;margin:0 auto 4px}
        .hostStats strong{font-size:13px}
        .hostStats small{font-size:5.5px}

        .mainGrid{gap:6px}
        .mainColumn,.sideColumn{gap:6px}
        .sideColumn{grid-template-columns:1fr 1fr}
        .contentCard{padding:10px}
        .sectionHeading{margin-bottom:7px}
        .sectionHeading h2,.listingHeader h2,.reviewsIntro h2{font-size:19px}
        .hostBio{font-size:8.5px;line-height:1.45}
        .hostStoryStats{margin-top:7px}
        .trustMessage{margin-top:7px;padding:8px}
        .trustMessage p{display:none}
        .activityChip{min-height:26px;padding:0 7px;font-size:6.5px}

        .contactItem{min-height:43px;padding:5px}
        .contactIcon{width:28px;height:28px}
        .contactText strong{font-size:7px}
        .verifiedCard{padding:10px}
        .verifiedCard p{display:none}
        .verifiedCard h3{font-size:11px}

        .hostMapSection,.hostGallerySection,.listingSection,.reviewFeedSection{margin-top:6px;padding:10px}
        .adventureRailSection{padding-right:10px}
        .adventureSwipeCard{flex-basis:300px}
        .listingHeader{align-items:center;flex-direction:row;gap:8px}
        .listingHeader p{display:none}
        .sectionAction{min-height:30px;padding:0 8px;font-size:6.5px}
        .hostMapFrame{height:230px;margin-top:7px}

        .hostGalleryGrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-top:7px}
        .hostGalleryGrid button{height:90px}
        .hostGalleryGrid button.featured{grid-column:span 2;grid-row:span 2;height:184px}

        .hostListingsGrid{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:5px;
          margin-top:7px;
          max-height:440px;
          overflow:auto;
          overscroll-behavior:contain;
        }
        .hostListingImage{height:105px}
        .hostListingBody{padding:7px}
        .hostListingBody h3{font-size:11px}
        .hostListingDescription{display:none}
        .hostListingFooter{margin-top:5px;padding-top:5px}
        .hostListingFooter span{font-size:0}
        .hostListingFooter span svg{width:13px;height:13px}

        .reviewsSection{grid-template-columns:1fr;gap:7px;margin-top:6px;padding:10px}
        .reviewsIntro p{display:none}
        .overallRating{margin-top:7px}
        .reviewsPlaceholder{grid-template-columns:110px minmax(0,1fr);gap:8px;padding:8px}
        .reviewFeedGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-top:7px}
        .reviewCard{padding:8px}
      }

      @media(max-width:520px){
        .offerSwipeRail{gap:9px;margin-right:-8px;padding-right:18px;padding-bottom:6px}
        .offerCard{flex-basis:82vw;max-width:330px;border-radius:18px}
        .offerCardMedia{height:185px}
        .offerCardHeroCopy h3{font-size:17px}
        .offerCardBody{padding:11px}
        .offerCardBody>p{min-height:34px;font-size:8px}
        .offerCardBottom{margin-top:8px;padding-top:8px}
        .offerContactButton{min-height:32px;padding:0 9px;font-size:7px}
        .offerModalBackdrop{align-items:end;padding:0}
        .offerModal{width:100%;max-height:92vh;border-radius:22px 22px 0 0}
        .offerModalHeader{padding:15px}
        .offerForm{padding:15px}
        .offerModalActions{position:sticky;bottom:0;padding-top:10px;background:#f8faf6}
        .profileHero{min-height:470px;padding:12px}
        .profileAvatar{width:72px;height:72px;border-radius:18px}
        .heroText h1{font-size:34px}
        .heroProfileInfo{padding-bottom:100px}
        .profileMeta{flex-direction:row;flex-wrap:wrap}
        .metaDivider{display:block!important}

        .profileContent{padding:6px}
        .contentCard,.listingSection,.reviewsSection,.reviewFeedSection,.hostMapSection,.hostGallerySection{padding:8px;border-radius:13px}

        .hostStats{grid-template-columns:repeat(4,minmax(0,1fr))}
        .hostStats article>span{display:none}
        .hostStats article{padding:6px 3px}
        .hostStats small{line-height:1.15}

        .sideColumn{grid-template-columns:1fr}
        .hostStoryStats{grid-template-columns:repeat(3,minmax(0,1fr))}
        .hostStoryStats article{padding:6px}

        .hostGalleryGrid{
          display:flex;
          gap:4px;
          overflow-x:auto;
          scroll-snap-type:x proximity;
        }
        .hostGalleryGrid button,
        .hostGalleryGrid button.featured{
          flex:0 0 150px;
          height:105px;
          grid-column:auto;
          grid-row:auto;
          scroll-snap-align:start;
        }

        .adventureRailShell{margin-top:9px}
        .adventureSwipeRail{gap:9px;margin-right:-8px;padding-right:18px;padding-bottom:6px}
        .adventureSwipeCard{flex-basis:82vw;max-width:330px;border-radius:18px}
        .adventureCardImage{height:185px}
        .adventureCardImageCopy{right:11px;bottom:11px;left:11px}
        .adventureCardImageCopy h3{font-size:17px}
        .adventureCardBody{padding:11px}
        .adventureCardDescription{min-height:34px;font-size:8px}
        .adventureCardMeta{margin-top:9px;padding:8px}
        .adventureCardFooter{margin-top:8px;padding-top:8px}
        .adventureSwipeHint{display:none}
        .completedAdventureCount{height:31px;min-width:38px;padding:0 9px;font-size:8px}
        .hostListingsGrid{grid-template-columns:1fr 1fr;max-height:390px}
        .hostListingImage{height:92px}
        .hostListingType,.listingDateBadge,.listingRatingBadge{top:5px;min-height:20px;padding:0 5px;font-size:5.5px}
        .hostListingType{left:5px}
        .listingDateBadge,.listingRatingBadge{right:5px}
        .hostListingBody h3{font-size:10px}
        .hostListingLocation{font-size:6px}
        .hostListingFooter strong{font-size:8.5px}

        .reviewFeedGrid{grid-template-columns:1fr;max-height:390px;overflow:auto}
        .mobileHostDock{right:6px;bottom:6px;left:6px;padding:4px;border-radius:14px}
        .mobileHostDock a{min-height:38px}
      }

      @media(prefers-reduced-motion:reduce){
        *,*::before,*::after{animation:none!important;scroll-behavior:auto!important;transition:none!important}
      }


      .hostActionBar{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
      @media (max-width:760px){
        .stayCard{flex-basis:min(84vw,320px)}
        .stayCardMedia{height:190px}
        .stayNumbersGrid{grid-template-columns:1fr 1fr}
      }

      /* =========================================================
         HOST PROFILE V3 — PREMIUM COMPACT + SWIPE
         Final overrides only: current data/actions/backend preserved.
         ========================================================= */

      .hostProfilePage{
        padding-top:76px;
        padding-bottom:34px;
      }

      .profileShell{
        width:min(1420px,calc(100% - 28px));
        border-radius:28px;
      }

      .profileHero{
        min-height:390px;
        padding:24px;
      }

      .heroTopline{
        top:18px;
        right:18px;
        left:18px;
      }

      .heroProfileInfo{
        gap:16px;
        padding-bottom:88px;
      }

      .profileAvatar{
        width:96px;
        height:96px;
        border-radius:24px;
      }

      .heroText h1{
        max-width:900px;
        font-size:clamp(38px,4.8vw,64px);
        line-height:.94;
        letter-spacing:-.065em;
      }

      .hostBadge,.heroRatingBadge,.heroLevelBadge{
        padding:6px 9px;
        font-size:7.5px;
      }

      .profileMeta{
        margin-top:8px;
        font-size:8px;
      }

      .heroActivityBadges{
        margin-top:8px;
      }

      .heroTrustStrip{
        right:20px;
        bottom:18px;
        left:20px;
        gap:6px;
      }

      .heroTrustStrip article{
        padding:8px 10px;
        border-radius:12px;
      }

      .heroTrustStrip strong{font-size:16px}
      .heroTrustStrip span{font-size:5.2px}

      .profileContent{padding:14px}

      .hostActionBar{
        display:flex;
        gap:6px;
        overflow-x:auto;
        margin-bottom:8px;
        padding:1px 1px 4px;
        scroll-snap-type:x proximity;
        scrollbar-width:none;
      }
      .hostActionBar::-webkit-scrollbar{display:none}

      .hostAction{
        flex:1 0 145px;
        min-height:46px;
        padding:6px 8px;
        border-radius:12px;
        scroll-snap-align:start;
      }

      .hostStats{
        gap:6px;
        margin-bottom:8px;
      }

      .hostStats article{
        padding:8px;
        border-radius:12px;
      }

      .mainGrid,
      .mainColumn,
      .sideColumn{gap:8px}

      .contentCard{
        padding:13px;
        border-radius:15px;
      }

      .hostMapSection,
      .hostGallerySection,
      .listingSection,
      .reviewsSection,
      .reviewFeedSection{
        margin-top:8px;
        padding:13px;
        border-radius:15px;
      }

      .listingHeader{
        gap:10px;
      }

      .listingHeader h2,
      .sectionHeading h2,
      .reviewsIntro h2{
        font-size:clamp(19px,2vw,25px);
      }

      .listingHeader p,
      .reviewsIntro p{
        max-width:650px;
        margin-top:4px;
        font-size:7.5px;
      }

      .sectionAction{
        min-height:32px;
        padding:0 9px;
        border-radius:9px;
      }

      /* All primary host content behaves like a premium horizontal shelf. */
      .staySwipeRail,
      .offerSwipeRail,
      .adventureSwipeRail{
        gap:10px;
        padding:2px 2px 7px;
        scroll-snap-type:x mandatory;
      }

      .stayCard,
      .offerCard,
      .adventureSwipeCard{
        flex:0 0 clamp(245px,23vw,300px);
        max-width:300px;
        border-radius:17px;
        scroll-snap-align:start;
      }

      .stayCardMedia,
      .offerCardMedia,
      .adventureCardImage{
        height:155px;
      }

      .stayCardBody,
      .offerCardBody,
      .adventureCardBody{
        padding:10px;
      }

      .stayHeroCopy,
      .offerCardHeroCopy,
      .adventureCardImageCopy{
        right:10px;
        bottom:10px;
        left:10px;
      }

      .stayHeroCopy h3,
      .offerCardHeroCopy h3,
      .adventureCardImageCopy h3{
        font-size:15px;
        line-height:1.08;
      }

      .stayCardBody>p,
      .offerCardBody>p,
      .adventureCardDescription{
        display:-webkit-box;
        min-height:30px;
        margin-top:7px;
        overflow:hidden;
        font-size:7.5px;
        line-height:1.4;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:2;
      }

      .stayMeta,
      .offerCardBottom,
      .adventureCardMeta{
        margin-top:7px;
        padding-top:7px;
      }

      .stayContactButton,
      .offerContactButton{
        min-height:31px;
        padding:0 9px;
      }

      .adventureCardFooter{
        margin-top:7px;
        padding-top:7px;
      }

      .adventureSwipeHint{
        margin-top:3px;
        font-size:6px;
      }

      .hostMapFrame{
        height:260px;
        margin-top:8px;
      }

      .hostGalleryGrid{
        display:flex;
        gap:7px;
        overflow-x:auto;
        margin-top:8px;
        padding-bottom:4px;
        scroll-snap-type:x mandatory;
        scrollbar-width:none;
      }
      .hostGalleryGrid::-webkit-scrollbar{display:none}

      .hostGalleryGrid button,
      .hostGalleryGrid button.featured{
        flex:0 0 190px;
        width:190px;
        height:125px;
        grid-column:auto;
        grid-row:auto;
        border-radius:12px;
        scroll-snap-align:start;
      }

      .reviewsSection{
        gap:10px;
      }

      @media(max-width:760px){
        .hostProfilePage{
          padding:64px 0 58px;
        }

        .profileShell{
          width:100%;
        }

        .profileHero{
          min-height:390px;
          padding:12px;
        }

        .heroTopline{
          top:10px;
          right:10px;
          left:10px;
        }

        .heroProfileInfo{
          gap:9px;
          padding-bottom:88px;
        }

        .profileAvatar{
          width:68px;
          height:68px;
          border-radius:17px;
        }

        .heroText h1{
          font-size:32px;
        }

        .hostBadgeRow{
          gap:4px;
        }

        .hostBadge,.heroRatingBadge,.heroLevelBadge{
          padding:5px 7px;
          font-size:6px;
        }

        .heroActivityBadges span:nth-child(n+4){
          display:none;
        }

        .heroTrustStrip{
          right:10px;
          bottom:10px;
          left:10px;
        }

        .profileContent{padding:6px}

        .hostActionBar{
          display:flex;
          gap:5px;
          margin-bottom:5px;
          padding-right:10px;
        }

        .hostAction{
          flex:0 0 52px;
          min-height:42px;
        }

        .hostStats{
          overflow-x:auto;
          grid-template-columns:none;
          display:flex;
          scrollbar-width:none;
        }
        .hostStats::-webkit-scrollbar{display:none}

        .hostStats article{
          flex:0 0 92px;
        }

        .contentCard,
        .hostMapSection,
        .hostGallerySection,
        .listingSection,
        .reviewsSection,
        .reviewFeedSection{
          padding:9px;
          border-radius:13px;
        }

        .listingHeader h2,
        .sectionHeading h2,
        .reviewsIntro h2{
          font-size:18px;
        }

        .staySwipeRail,
        .offerSwipeRail,
        .adventureSwipeRail{
          gap:8px;
          margin-right:-9px;
          padding-right:18px;
        }

        .stayCard,
        .offerCard,
        .adventureSwipeCard{
          flex-basis:78vw;
          max-width:305px;
          border-radius:16px;
        }

        .stayCardMedia,
        .offerCardMedia,
        .adventureCardImage{
          height:165px;
        }

        .hostMapFrame{
          height:220px;
        }

        .hostGalleryGrid{
          margin-right:-9px;
          padding-right:18px;
        }

        .hostGalleryGrid button,
        .hostGalleryGrid button.featured{
          flex-basis:64vw;
          width:64vw;
          max-width:245px;
          height:145px;
        }
      }

      @media(max-width:420px){
        .profileHero{
          min-height:370px;
        }

        .heroText h1{
          font-size:29px;
        }

        .heroTrustStrip article{
          padding:6px 3px;
        }

        .heroTrustStrip strong{
          font-size:12px;
        }

        .stayCard,
        .offerCard,
        .adventureSwipeCard{
          flex-basis:82vw;
        }
      }


      /* =========================================================
         HOST PROFILE / PREMIUM LAYER
         ========================================================= */
      .hostProfilePage{
        --p-ink:#142019;
        --p-muted:#718078;
        --p-line:rgba(28,59,38,.10);
        --p-green:#173d28;
        --p-green2:#2b5f40;
        --p-card:rgba(255,255,255,.90);
        --p-shadow:0 18px 55px rgba(18,45,28,.08);
        background:
          radial-gradient(circle at 8% 0%,rgba(143,178,118,.12),transparent 30rem),
          linear-gradient(180deg,#f9fbf7 0%,#f3f6f1 100%);
        color:var(--p-ink);
      }

      .hostProfilePage *{box-sizing:border-box}
      .hostProfilePage{scroll-behavior:smooth}

      .profileHero{
        position:relative;
        overflow:hidden;
        min-height:470px;
        border-radius:0 0 36px 36px;
        box-shadow:0 26px 72px rgba(8,25,15,.15);
        isolation:isolate;
      }

      .profileHero::after{
        content:"";
        position:absolute;
        inset:0;
        z-index:1;
        pointer-events:none;
        background:
          linear-gradient(180deg,rgba(4,15,8,.02),rgba(4,15,8,.11) 34%,rgba(4,15,8,.84)),
          linear-gradient(90deg,rgba(6,22,12,.34),transparent 58%);
      }

      .heroInner,
      .heroTrustStrip{position:relative;z-index:2}

      .heroInner{
        width:min(1180px,calc(100% - 44px));
        margin:0 auto;
      }

      .heroAvatar{
        width:116px;
        height:116px;
        border:4px solid rgba(255,255,255,.94);
        box-shadow:0 16px 42px rgba(0,0,0,.20);
      }

      .heroText h1{
        font-size:clamp(36px,5.3vw,62px);
        line-height:.95;
        letter-spacing:-.055em;
        text-wrap:balance;
      }

      .heroBadges span,
      .heroLevelBadge,
      .heroActivityBadges span{
        border:1px solid rgba(255,255,255,.17);
        background:rgba(18,42,26,.45);
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
      }

      .heroTrustStrip{
        width:min(1180px,calc(100% - 44px));
        margin:0 auto 20px;
        padding:8px;
        gap:7px;
        border:1px solid rgba(255,255,255,.16);
        border-radius:19px;
        background:rgba(12,31,19,.42);
        backdrop-filter:blur(18px);
        -webkit-backdrop-filter:blur(18px);
      }

      .heroTrustStrip article{
        flex:1 1 120px;
        min-width:105px;
        padding:12px 14px;
        border:0;
        border-radius:13px;
        background:rgba(255,255,255,.07);
      }

      .heroTrustStrip strong{color:#fff;font-size:18px;letter-spacing:-.03em}
      .heroTrustStrip span{
        margin-top:2px;
        color:rgba(255,255,255,.62);
        font-size:8px;
        font-weight:900;
        letter-spacing:.08em;
        text-transform:uppercase;
      }

      .profileContent{
        width:min(1180px,calc(100% - 32px));
        margin:-15px auto 0;
        padding-bottom:110px;
        position:relative;
        z-index:5;
      }

      .hostActionBar{
        position:sticky;
        top:12px;
        z-index:60;
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(145px,1fr));
        gap:8px;
        padding:9px;
        margin-bottom:18px;
        border:1px solid rgba(255,255,255,.76);
        border-radius:22px;
        background:rgba(250,252,248,.89);
        box-shadow:0 18px 55px rgba(22,48,31,.12);
        backdrop-filter:blur(24px);
        -webkit-backdrop-filter:blur(24px);
      }

      .hostAction{
        min-height:58px;
        padding:10px 13px;
        border:1px solid transparent;
        border-radius:15px;
        background:transparent;
        transition:.18s ease;
      }

      .hostAction:hover{
        transform:translateY(-1px);
        border-color:var(--p-line);
        background:#fff;
        box-shadow:0 8px 22px rgba(26,52,34,.07);
      }

      .hostAction.primary{
        border-color:transparent;
        background:linear-gradient(135deg,var(--p-green),var(--p-green2));
        color:#fff;
        box-shadow:0 10px 25px rgba(23,61,40,.18);
      }

      .hostAction small{font-size:7px;letter-spacing:.13em;opacity:.56}
      .hostAction strong{font-size:11px;letter-spacing:-.015em}

      .hostStats{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
        gap:10px;
        margin-bottom:22px;
      }

      .hostStats article{
        min-height:82px;
        padding:15px 16px;
        border:1px solid var(--p-line);
        border-radius:18px;
        background:var(--p-card);
        box-shadow:0 12px 36px rgba(21,47,29,.055);
      }

      .hostStats article>span{
        width:38px;
        height:38px;
        border-radius:12px;
        background:#edf4e9;
        color:#45683b;
      }

      .hostStats strong{font-size:20px;letter-spacing:-.04em}
      .hostStats small{color:#829087;font-size:9px}

      .mainGrid{gap:18px;align-items:start}

      .aboutCard,
      .contactCard,
      .trustCard,
      .hostMapSection,
      .hostGallerySection,
      .listingSection{
        border:1px solid var(--p-line);
        border-radius:27px;
        background:var(--p-card);
        box-shadow:var(--p-shadow);
      }

      .aboutCard{padding:25px}
      .aboutCard h2,
      .listingHeader h2{letter-spacing:-.045em;text-wrap:balance}
      .aboutCard p{color:var(--p-muted);line-height:1.76}

      .contactCard{padding:12px}
      .contactItem{
        min-height:62px;
        margin-top:6px;
        border:1px solid transparent;
        border-radius:15px;
        transition:.18s ease;
      }
      .contactItem.active{background:#fafcf8}
      .contactItem.active:hover{
        transform:translateY(-1px);
        border-color:#dce7d7;
        background:#fff;
        box-shadow:0 8px 22px rgba(27,54,35,.06);
      }
      .contactIcon{border-radius:12px;background:#edf4e9;color:#47683c}

      .trustCard{
        padding:21px;
        background:linear-gradient(145deg,#173d28,#214c34);
        color:#fff;
      }
      .trustCard p{color:rgba(255,255,255,.67)}

      .listingSection,
      .hostGallerySection,
      .hostMapSection{
        margin-top:19px;
        padding:25px;
      }

      .listingHeader{
        gap:20px;
        align-items:flex-end;
        margin-bottom:19px;
      }

      .listingHeader>div:first-child{max-width:690px}
      .sectionKicker{
        color:#71905f;
        font-size:9px;
        font-weight:950;
        letter-spacing:.14em;
      }
      .listingHeader h2{
        margin-top:5px;
        font-size:clamp(25px,3.1vw,37px);
        line-height:1.05;
      }
      .listingHeader p{
        max-width:650px;
        margin-top:8px;
        color:#78867d;
        font-size:12px;
        line-height:1.66;
      }

      .sectionAction{
        min-height:43px;
        padding:0 15px;
        border:1px solid #dce5d9;
        border-radius:13px;
        background:#fff;
        box-shadow:0 6px 18px rgba(29,55,37,.05);
        transition:.18s ease;
      }
      .sectionAction:hover{
        transform:translateY(-1px);
        border-color:#bad0b1;
        box-shadow:0 10px 24px rgba(29,55,37,.08);
      }

      .staySwipeRail,
      .offerSwipeRail,
      .adventureSwipeRail{
        gap:14px;
        padding:2px 2px 10px;
        scroll-snap-type:x mandatory;
        scrollbar-width:none;
      }
      .staySwipeRail::-webkit-scrollbar,
      .offerSwipeRail::-webkit-scrollbar,
      .adventureSwipeRail::-webkit-scrollbar{display:none}

      .stayCard,
      .offerCard,
      .adventureSwipeCard{
        scroll-snap-align:start;
        overflow:hidden;
        border:1px solid #e1e8de;
        border-radius:22px;
        background:#fff;
        box-shadow:0 12px 32px rgba(24,50,32,.07);
        transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease;
      }

      .stayCard:hover,
      .offerCard:hover,
      .adventureSwipeCard:hover{
        transform:translateY(-4px);
        border-color:#cbdac5;
        box-shadow:0 20px 45px rgba(24,50,32,.12);
      }

      .stayCardMedia img,
      .offerCardMedia img,
      .adventureCardImage img{transition:transform .55s cubic-bezier(.2,.7,.2,1)}
      .stayCard:hover .stayCardMedia img,
      .offerCard:hover .offerCardMedia img,
      .adventureSwipeCard:hover .adventureCardImage img{transform:scale(1.045)}

      .stayContactButton,
      .offerContactButton{
        min-height:42px;
        border:0;
        border-radius:12px;
        background:linear-gradient(135deg,#173d28,#2c6041);
        color:#fff;
        font-weight:850;
        box-shadow:0 8px 20px rgba(23,61,40,.17);
        transition:.18s ease;
      }
      .stayContactButton:hover,
      .offerContactButton:hover{
        transform:translateY(-1px);
        box-shadow:0 12px 26px rgba(23,61,40,.22);
      }

      .offerCategoryBadge,
      .stayTypeBadge,
      .hostListingType{
        border:1px solid rgba(255,255,255,.18);
        background:rgba(13,29,19,.60);
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
      }

      .hostMapFrame{
        overflow:hidden;
        border:1px solid #dfe8dc;
        border-radius:22px;
        box-shadow:0 10px 28px rgba(25,51,33,.055);
      }
      .hostLeaflet{min-height:390px}
      .hostMapLegend{
        left:14px;
        bottom:14px;
        padding:10px 12px;
        border:1px solid rgba(255,255,255,.52);
        border-radius:12px;
        background:rgba(19,48,31,.90);
        color:#fff;
        box-shadow:0 8px 25px rgba(10,29,18,.16);
        backdrop-filter:blur(14px);
      }

      .hostGalleryItem{
        overflow:hidden;
        border-radius:18px;
        box-shadow:0 8px 24px rgba(28,53,35,.08);
      }
      .hostGalleryItem img{transition:transform .5s ease}
      .hostGalleryItem:hover img{transform:scale(1.045)}

      .emptyListing{
        padding:34px 24px;
        border:1px dashed #d5e0d1;
        border-radius:20px;
        background:
          radial-gradient(circle at top left,rgba(145,176,123,.10),transparent 18rem),
          #fbfcfa;
      }

      .directContactBackdrop{
        background:rgba(6,18,11,.64);
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
      }
      .directContactSheet{
        border:1px solid rgba(255,255,255,.72);
        border-radius:28px;
        background:
          radial-gradient(circle at 100% 0%,rgba(153,186,130,.15),transparent 14rem),
          #f9fbf7;
        box-shadow:0 32px 100px rgba(7,25,14,.28);
      }

      .mobileHostDock{
        border:1px solid rgba(255,255,255,.74);
        background:rgba(249,251,247,.94);
        box-shadow:0 -8px 34px rgba(22,48,31,.12);
        backdrop-filter:blur(22px);
        -webkit-backdrop-filter:blur(22px);
      }

      @media(max-width:820px){
        .profileHero{min-height:430px;border-radius:0 0 28px 28px}
        .heroInner,.heroTrustStrip{width:calc(100% - 28px)}
        .profileContent{width:calc(100% - 20px);margin-top:-11px;padding-bottom:94px}
        .heroAvatar{width:86px;height:86px;border-width:3px}
        .heroText h1{font-size:clamp(30px,9vw,44px)}
        .hostActionBar{
          position:relative;
          top:auto;
          grid-template-columns:repeat(2,minmax(0,1fr));
          padding:7px;
          border-radius:19px;
        }
        .hostStats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .listingSection,.hostGallerySection,.hostMapSection{padding:18px;border-radius:22px}
        .listingHeader{align-items:flex-start;flex-direction:column}
        .listingHeader h2{font-size:27px}
        .sectionAction{width:100%;justify-content:center}
        .hostLeaflet{min-height:300px}
        .stayCard,.offerCard,.adventureSwipeCard{border-radius:19px}
      }

      @media(max-width:520px){
        .profileHero{min-height:405px}
        .heroAvatar{width:74px;height:74px}
        .heroText h1{font-size:32px}
        .heroActivityBadges{
          max-width:100%;
          overflow-x:auto;
          flex-wrap:nowrap;
          scrollbar-width:none;
        }
        .heroActivityBadges::-webkit-scrollbar{display:none}
        .heroActivityBadges span{flex:0 0 auto}
        .hostStats{
          display:flex;
          overflow-x:auto;
          gap:8px;
          padding-bottom:4px;
          scrollbar-width:none;
        }
        .hostStats::-webkit-scrollbar{display:none}
        .hostStats article{min-width:145px}
        .listingSection,.hostGallerySection,.hostMapSection{padding:15px;border-radius:19px}
        .listingHeader h2{font-size:24px}
        .directContactBackdrop{padding:10px}
        .directContactSheet{border-radius:24px}
      }


      /* =========================================================
         HOST PROFILE V4 — DENSE PREMIUM SYSTEM
         Purpose: less empty space, smaller cards, better rhythm.
         ========================================================= */

      .hostProfilePage{
        background:#f5f7f3;
      }

      .profileHero{
        min-height:360px !important;
        border-radius:0 0 26px 26px !important;
        box-shadow:0 18px 44px rgba(11,30,18,.13) !important;
      }

      .heroInner{
        width:min(1120px,calc(100% - 32px)) !important;
      }

      .heroContent{
        padding-bottom:18px !important;
      }

      .heroAvatar{
        width:88px !important;
        height:88px !important;
        border-width:3px !important;
      }

      .heroText h1{
        font-size:clamp(32px,4.8vw,50px) !important;
        line-height:.98 !important;
        letter-spacing:-.05em !important;
        margin:6px 0 4px !important;
      }

      .heroMeta{
        gap:8px !important;
        font-size:11px !important;
      }

      .heroActivityBadges{
        margin-top:10px !important;
        gap:6px !important;
      }

      .heroActivityBadges span{
        padding:6px 9px !important;
        border-radius:999px !important;
        font-size:8px !important;
      }

      .heroTrustStrip{
        width:min(1120px,calc(100% - 32px)) !important;
        margin:0 auto 14px !important;
        padding:6px !important;
        gap:6px !important;
        border-radius:15px !important;
      }

      .heroTrustStrip article{
        min-width:90px !important;
        min-height:54px !important;
        padding:9px 11px !important;
        border-radius:10px !important;
      }

      .heroTrustStrip strong{
        font-size:16px !important;
      }

      .heroTrustStrip span{
        font-size:7px !important;
      }

      .profileContent{
        width:min(1120px,calc(100% - 24px)) !important;
        margin:-8px auto 0 !important;
        padding-bottom:88px !important;
      }

      /* Navigation becomes a compact command bar, not giant tiles */
      .hostActionBar{
        position:sticky !important;
        top:8px !important;
        z-index:60 !important;
        display:flex !important;
        align-items:center !important;
        gap:6px !important;
        padding:6px !important;
        margin:0 0 12px !important;
        border-radius:16px !important;
        background:rgba(250,252,248,.94) !important;
        border:1px solid rgba(35,66,44,.08) !important;
        box-shadow:0 10px 28px rgba(20,46,28,.09) !important;
        overflow-x:auto !important;
        scrollbar-width:none !important;
      }

      .hostActionBar::-webkit-scrollbar{display:none}

      .hostAction{
        flex:0 0 auto !important;
        min-height:42px !important;
        padding:8px 11px !important;
        border-radius:11px !important;
        gap:8px !important;
      }

      .hostAction svg{
        width:15px !important;
        height:15px !important;
      }

      .hostAction small{
        display:none !important;
      }

      .hostAction strong{
        font-size:10px !important;
        white-space:nowrap !important;
      }

      .hostAction.primary{
        padding-inline:14px !important;
      }

      /* Main content */
      .mainGrid{
        display:grid !important;
        grid-template-columns:minmax(0,1.35fr) minmax(290px,.65fr) !important;
        gap:12px !important;
        margin:0 0 12px !important;
      }

      .aboutCard,
      .contactCard,
      .trustCard{
        border-radius:18px !important;
        box-shadow:0 8px 26px rgba(22,48,31,.055) !important;
      }

      .aboutCard{
        padding:18px !important;
      }

      .aboutCard h2{
        font-size:21px !important;
        margin-bottom:8px !important;
      }

      .aboutCard p{
        font-size:11px !important;
        line-height:1.62 !important;
      }

      .hostStoryStats{
        display:flex !important;
        gap:8px !important;
        margin-top:14px !important;
      }

      .hostStoryStats article{
        min-width:0 !important;
        flex:1 1 0 !important;
        padding:9px 10px !important;
        border-radius:11px !important;
      }

      .hostStoryStats span{
        font-size:16px !important;
      }

      .hostStoryStats small{
        font-size:7px !important;
      }

      .sideColumn{
        gap:10px !important;
      }

      .contactCard{
        padding:9px !important;
      }

      .contactCardHeader{
        padding:7px 8px 8px !important;
      }

      .contactCardHeader h3{
        font-size:17px !important;
      }

      .contactItem{
        min-height:48px !important;
        margin-top:4px !important;
        padding:7px 8px !important;
        border-radius:11px !important;
      }

      .contactIcon{
        width:34px !important;
        height:34px !important;
        border-radius:10px !important;
      }

      .contactText small{
        font-size:7px !important;
      }

      .contactText strong{
        font-size:10px !important;
      }

      .trustCard{
        padding:16px !important;
        min-height:0 !important;
      }

      .trustCard h3{
        font-size:16px !important;
      }

      .trustCard p{
        margin-top:5px !important;
        font-size:10px !important;
        line-height:1.5 !important;
      }

      /* Catalog sections */
      .listingSection,
      .hostGallerySection,
      .hostMapSection{
        margin-top:12px !important;
        padding:18px !important;
        border-radius:20px !important;
        box-shadow:0 8px 28px rgba(21,46,29,.055) !important;
      }

      .listingHeader{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:14px !important;
        margin-bottom:13px !important;
      }

      .sectionKicker{
        font-size:7px !important;
        letter-spacing:.16em !important;
      }

      .listingHeader h2{
        margin-top:3px !important;
        font-size:23px !important;
        line-height:1.08 !important;
      }

      .listingHeader p{
        margin-top:5px !important;
        font-size:10px !important;
        line-height:1.5 !important;
      }

      .sectionAction{
        flex:0 0 auto !important;
        width:auto !important;
        min-height:36px !important;
        padding:0 12px !important;
        border-radius:10px !important;
        font-size:9px !important;
      }

      .staySwipeRail,
      .offerSwipeRail,
      .adventureSwipeRail{
        gap:10px !important;
        padding-bottom:4px !important;
      }

      .stayCard,
      .offerCard,
      .adventureSwipeCard{
        border-radius:16px !important;
        box-shadow:0 7px 22px rgba(22,48,31,.06) !important;
      }

      .stayCardMedia,
      .offerCardMedia,
      .adventureCardImage{
        min-height:0 !important;
        height:170px !important;
      }

      .stayCardBody,
      .offerCardBody,
      .adventureCardBody{
        padding:12px !important;
      }

      .stayHeroCopy h3,
      .offerCardHeroCopy h3,
      .adventureCardImageCopy h3{
        font-size:18px !important;
        line-height:1.08 !important;
      }

      .stayCardBody>p,
      .offerCardBody>p,
      .adventureCardDescription{
        font-size:10px !important;
        line-height:1.55 !important;
        display:-webkit-box !important;
        -webkit-line-clamp:2 !important;
        -webkit-box-orient:vertical !important;
        overflow:hidden !important;
      }

      .stayMeta,
      .offerCardBottom,
      .adventureCardMeta{
        margin-top:10px !important;
        padding-top:10px !important;
      }

      .stayMeta span,
      .adventureCardMeta span{
        font-size:9px !important;
      }

      .stayMeta strong,
      .offerCardBottom>strong,
      .adventureCardMeta strong{
        font-size:12px !important;
      }

      .stayContactButton,
      .offerContactButton{
        min-height:36px !important;
        padding:0 11px !important;
        border-radius:10px !important;
        font-size:9px !important;
      }

      /* Activity chips: much more compact */
      .activitySection{
        padding:16px !important;
        border-radius:18px !important;
        margin-top:12px !important;
      }

      .activityGrid{
        gap:6px !important;
      }

      .activityChip{
        min-height:30px !important;
        padding:6px 9px !important;
        border-radius:999px !important;
        font-size:8px !important;
      }

      /* Map should not dominate profile */
      .hostLeaflet{
        min-height:280px !important;
      }

      .hostMapFrame{
        border-radius:16px !important;
      }

      /* Gallery */
      .hostGalleryGrid{
        gap:7px !important;
      }

      .hostGalleryItem{
        border-radius:12px !important;
      }

      /* Contact modal */
      .directContactSheet{
        width:min(460px,100%) !important;
        padding:18px !important;
        border-radius:21px !important;
      }

      .directContactHead h3{
        font-size:21px !important;
      }

      .directContactOptions{
        gap:7px !important;
        margin-top:14px !important;
      }

      .directContactOptions>a{
        min-height:54px !important;
        border-radius:13px !important;
      }

      /* Mobile: one coherent stack, no oversized empty boxes */
      @media(max-width:900px){
        .mainGrid{
          grid-template-columns:1fr !important;
        }

        .sideColumn{
          display:grid !important;
          grid-template-columns:1fr 1fr !important;
        }
      }

      @media(max-width:640px){
        .profileHero{
          min-height:330px !important;
          border-radius:0 0 22px 22px !important;
        }

        .heroInner{
          width:calc(100% - 22px) !important;
        }

        .heroAvatar{
          width:68px !important;
          height:68px !important;
        }

        .heroText h1{
          font-size:31px !important;
        }

        .heroTrustStrip{
          width:calc(100% - 22px) !important;
          margin-bottom:10px !important;
        }

        .heroTrustStrip article{
          min-width:76px !important;
          min-height:48px !important;
          padding:7px 9px !important;
        }

        .profileContent{
          width:calc(100% - 14px) !important;
          margin-top:-6px !important;
        }

        .hostActionBar{
          top:6px !important;
          margin-bottom:9px !important;
          border-radius:14px !important;
        }

        .hostAction{
          min-height:39px !important;
          padding:7px 10px !important;
        }

        .mainGrid{
          gap:8px !important;
          margin-bottom:8px !important;
        }

        .sideColumn{
          display:grid !important;
          grid-template-columns:1fr !important;
          gap:8px !important;
        }

        .aboutCard{
          padding:15px !important;
        }

        .contactCard{
          padding:7px !important;
        }

        .trustCard{
          padding:14px !important;
        }

        .listingSection,
        .hostGallerySection,
        .hostMapSection,
        .activitySection{
          margin-top:8px !important;
          padding:14px !important;
          border-radius:16px !important;
        }

        .listingHeader{
          align-items:flex-start !important;
          margin-bottom:10px !important;
        }

        .listingHeader h2{
          font-size:20px !important;
        }

        .listingHeader p{
          max-width:100% !important;
        }

        .sectionAction{
          min-height:32px !important;
          padding:0 9px !important;
        }

        .stayCardMedia,
        .offerCardMedia,
        .adventureCardImage{
          height:150px !important;
        }

        .hostLeaflet{
          min-height:230px !important;
        }

        .mobileHostDock{
          min-height:58px !important;
          padding:6px !important;
        }

        .mobileHostDock a,
        .mobileHostDock button{
          min-height:44px !important;
          font-size:9px !important;
        }
      }

      @media(max-width:420px){
        .heroTrustStrip{
          flex-wrap:nowrap !important;
          overflow-x:auto !important;
          scrollbar-width:none !important;
        }

        .heroTrustStrip::-webkit-scrollbar{display:none}

        .listingHeader{
          flex-direction:column !important;
          gap:8px !important;
        }

        .sectionAction{
          width:100% !important;
        }
      }


      /* =========================================================
         HOST PROFILE V5 — QUIET LUXURY / PREMIUM EMPTY STATE
         ========================================================= */

      .hostProfilePage{
        background:
          radial-gradient(circle at 12% -8%, rgba(141,175,118,.08), transparent 26rem),
          #f6f8f4 !important;
      }

      .profileShell{
        width:min(1180px,100%) !important;
      }

      .profileHero{
        min-height:430px !important;
        padding:24px 28px 28px !important;
        border-radius:0 0 30px 30px !important;
        box-shadow:0 18px 52px rgba(12,34,20,.12) !important;
        justify-content:flex-end !important;
      }

      .coverImage{
        filter:saturate(.94) brightness(1.08) !important;
      }

      .coverOverlay{
        background:
          linear-gradient(180deg,rgba(8,18,11,.04) 0%,rgba(8,18,11,.10) 30%,rgba(7,18,10,.62) 100%),
          linear-gradient(90deg,rgba(6,18,10,.24) 0%,rgba(6,18,10,.03) 62%,rgba(6,18,10,.10) 100%) !important;
      }

      .heroGlow{
        opacity:.28 !important;
      }

      .heroEditFloating{
        position:absolute !important;
        top:22px !important;
        right:22px !important;
        z-index:5 !important;
        min-height:38px !important;
        padding:0 12px !important;
        border:1px solid rgba(255,255,255,.36) !important;
        border-radius:12px !important;
        background:rgba(255,255,255,.16) !important;
        color:#fff !important;
        box-shadow:0 8px 24px rgba(0,0,0,.09) !important;
        backdrop-filter:blur(12px) !important;
        -webkit-backdrop-filter:blur(12px) !important;
      }

      .heroProfileInfo{
        align-items:flex-end !important;
        gap:16px !important;
        max-width:860px !important;
      }

      .profileAvatar{
        width:78px !important;
        height:78px !important;
        border:3px solid rgba(255,255,255,.92) !important;
        border-radius:22px !important;
        box-shadow:0 12px 28px rgba(0,0,0,.16) !important;
      }

      .heroText{
        min-width:0 !important;
      }

      .hostBadgeRow{
        gap:6px !important;
      }

      .hostBadge,
      .heroLevelBadge{
        padding:6px 9px !important;
        border-radius:999px !important;
        background:rgba(14,31,20,.34) !important;
        border-color:rgba(255,255,255,.19) !important;
        color:rgba(255,255,255,.91) !important;
        font-size:8px !important;
        box-shadow:none !important;
      }

      .heroText h1{
        margin:8px 0 5px !important;
        max-width:760px !important;
        font-size:clamp(34px,5vw,54px) !important;
        line-height:.98 !important;
        letter-spacing:-.052em !important;
        color:#fff !important;
        text-shadow:0 2px 18px rgba(0,0,0,.12) !important;
      }

      .profileMeta{
        color:rgba(255,255,255,.78) !important;
        font-size:10px !important;
        gap:8px !important;
      }

      .heroActivityBadges{
        margin-top:11px !important;
        gap:6px !important;
      }

      .heroActivityBadges span{
        padding:6px 9px !important;
        border:1px solid rgba(255,255,255,.16) !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.09) !important;
        color:rgba(255,255,255,.90) !important;
        font-size:8px !important;
        backdrop-filter:blur(10px) !important;
      }

      .heroPrimaryActions{
        display:flex !important;
        flex-wrap:wrap !important;
        gap:8px !important;
        margin-top:14px !important;
      }

      .heroContactButton,
      .heroShareButton{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:7px !important;
        min-height:40px !important;
        padding:0 13px !important;
        border-radius:12px !important;
        font:inherit !important;
        font-size:9px !important;
        font-weight:850 !important;
        cursor:pointer !important;
        transition:.18s ease !important;
      }

      .heroContactButton{
        border:1px solid rgba(190,255,161,.30) !important;
        background:#baff9e !important;
        color:#15341f !important;
        box-shadow:0 8px 20px rgba(76,130,62,.18) !important;
      }

      .heroShareButton{
        border:1px solid rgba(255,255,255,.22) !important;
        background:rgba(255,255,255,.11) !important;
        color:#fff !important;
        backdrop-filter:blur(12px) !important;
      }

      .heroContactButton:hover,
      .heroShareButton:hover{
        transform:translateY(-1px) !important;
      }

      .profileContent{
        width:min(1120px,calc(100% - 24px)) !important;
        margin:14px auto 0 !important;
        padding-bottom:70px !important;
      }

      .mainGrid{
        display:grid !important;
        grid-template-columns:minmax(0,1.45fr) minmax(280px,.72fr) !important;
        gap:12px !important;
        align-items:start !important;
        margin-bottom:12px !important;
      }

      .contentCard,
      .aboutCard,
      .contactCard,
      .trustCard,
      .listingSection,
      .hostGallerySection,
      .hostMapSection{
        border:1px solid rgba(31,60,40,.08) !important;
        box-shadow:0 10px 30px rgba(18,45,28,.055) !important;
      }

      .aboutCard{
        min-height:0 !important;
        padding:20px !important;
        border-radius:20px !important;
        background:linear-gradient(180deg,#fff 0%,#fbfcfa 100%) !important;
      }

      .sectionHeading{
        margin-bottom:10px !important;
      }

      .sectionHeading h2{
        font-size:22px !important;
        line-height:1.08 !important;
      }

      .aboutCard p{
        margin:0 !important;
        color:#6f7d74 !important;
        font-size:11px !important;
        line-height:1.68 !important;
      }

      .profilePresence{
        display:inline-flex !important;
        align-items:center !important;
        gap:7px !important;
        margin-top:13px !important;
        padding:7px 9px !important;
        border:1px solid #e1e8de !important;
        border-radius:999px !important;
        background:#f6f9f3 !important;
        color:#607268 !important;
        font-size:8px !important;
        font-weight:800 !important;
      }

      .profilePresenceDot{
        width:7px !important;
        height:7px !important;
        border-radius:50% !important;
        background:#79a663 !important;
        box-shadow:0 0 0 4px rgba(121,166,99,.11) !important;
      }

      .hostStoryStats{
        display:flex !important;
        gap:7px !important;
        margin-top:12px !important;
      }

      .hostStoryStats article{
        flex:0 1 auto !important;
        min-width:92px !important;
        padding:8px 10px !important;
        border:1px solid #e4ebe1 !important;
        border-radius:11px !important;
        background:#fff !important;
      }

      .hostStoryStats span{
        font-size:15px !important;
      }

      .hostStoryStats small{
        font-size:7px !important;
      }

      .sideColumn{
        gap:9px !important;
      }

      .contactCard{
        padding:9px !important;
        border-radius:18px !important;
        background:#fff !important;
      }

      .contactCardHeader{
        padding:8px !important;
      }

      .contactCardHeader h3{
        font-size:17px !important;
      }

      .contactItem{
        min-height:48px !important;
        padding:7px 8px !important;
        margin-top:4px !important;
        border-radius:11px !important;
      }

      .contactIcon{
        width:34px !important;
        height:34px !important;
        border-radius:10px !important;
      }

      .trustCard{
        min-height:0 !important;
        padding:15px !important;
        border-radius:18px !important;
        background:
          radial-gradient(circle at 85% 0%,rgba(186,255,158,.12),transparent 10rem),
          linear-gradient(145deg,#173d28,#204a33) !important;
      }

      .trustCard h3{
        font-size:15px !important;
      }

      .trustCard p{
        margin-top:4px !important;
        font-size:9px !important;
        line-height:1.5 !important;
      }

      .listingSection,
      .hostGallerySection,
      .hostMapSection{
        margin-top:11px !important;
        padding:17px !important;
        border-radius:19px !important;
        background:#fff !important;
      }

      .listingHeader{
        margin-bottom:12px !important;
      }

      .listingHeader h2{
        font-size:22px !important;
      }

      .listingHeader p{
        font-size:10px !important;
        line-height:1.5 !important;
      }

      .stayCard,
      .offerCard,
      .adventureSwipeCard{
        border-radius:15px !important;
        box-shadow:0 7px 22px rgba(21,47,29,.055) !important;
      }

      .stayCardMedia,
      .offerCardMedia,
      .adventureCardImage{
        height:165px !important;
      }

      .hostLeaflet{
        min-height:260px !important;
      }

      .mobileHostDock,
      .hostActionBar,
      .heroTrustStrip,
      .heroTopline,
      .heroExploreLink{
        display:none !important;
      }

      @media(max-width:900px){
        .mainGrid{
          grid-template-columns:1fr !important;
        }

        .sideColumn{
          display:grid !important;
          grid-template-columns:1fr 1fr !important;
        }
      }

      @media(max-width:640px){
        .profileHero{
          min-height:390px !important;
          padding:18px 16px 20px !important;
          border-radius:0 0 24px 24px !important;
        }

        .coverImage{
          object-position:center center !important;
        }

        .profileAvatar{
          width:64px !important;
          height:64px !important;
          border-radius:18px !important;
        }

        .heroProfileInfo{
          gap:11px !important;
          align-items:flex-end !important;
        }

        .heroText h1{
          font-size:31px !important;
          margin-top:6px !important;
        }

        .hostBadge{
          font-size:7px !important;
          padding:5px 7px !important;
        }

        .heroLevelBadge{
          display:none !important;
        }

        .heroActivityBadges{
          max-width:100% !important;
          overflow-x:auto !important;
          flex-wrap:nowrap !important;
          scrollbar-width:none !important;
        }

        .heroActivityBadges::-webkit-scrollbar{display:none}

        .heroActivityBadges span{
          flex:0 0 auto !important;
        }

        .heroPrimaryActions{
          margin-top:11px !important;
        }

        .heroContactButton,
        .heroShareButton{
          min-height:38px !important;
          padding:0 11px !important;
          border-radius:11px !important;
        }

        .profileContent{
          width:calc(100% - 14px) !important;
          margin-top:8px !important;
          padding-bottom:24px !important;
        }

        .mainGrid{
          gap:8px !important;
        }

        .sideColumn{
          grid-template-columns:1fr !important;
          gap:8px !important;
        }

        .aboutCard{
          padding:15px !important;
          border-radius:16px !important;
        }

        .contactCard,
        .trustCard{
          border-radius:16px !important;
        }

        .listingSection,
        .hostGallerySection,
        .hostMapSection{
          margin-top:8px !important;
          padding:14px !important;
          border-radius:16px !important;
        }

        .stayCardMedia,
        .offerCardMedia,
        .adventureCardImage{
          height:150px !important;
        }

        .hostLeaflet{
          min-height:220px !important;
        }
      }

      @media(max-width:420px){
        .profileHero{
          min-height:370px !important;
        }

        .heroText h1{
          font-size:28px !important;
        }

        .heroPrimaryActions{
          width:100% !important;
        }

        .heroContactButton{
          flex:1 1 auto !important;
        }
      }


      /* =========================================================
         HOST PROFILE V6 — CLEAN COVER + IDENTITY CARD
         ========================================================= */
      .profileHero{
        min-height:300px !important;
        padding:0 !important;
        border-radius:0 0 24px 24px !important;
        overflow:hidden !important;
        box-shadow:0 14px 36px rgba(13,34,20,.10) !important;
      }

      .coverImage{
        width:100% !important;
        height:100% !important;
        object-fit:cover !important;
        filter:saturate(.98) brightness(1.12) !important;
      }

      .coverOverlay{
        background:
          linear-gradient(180deg,rgba(6,18,10,.02),rgba(6,18,10,.06) 55%,rgba(6,18,10,.22)) !important;
      }

      .heroGlow,
      .heroProfileInfo,
      .heroPrimaryActions{
        display:none !important;
      }

      .profileIdentityCard{
        width:min(1120px,calc(100% - 24px));
        margin:-34px auto 0;
        position:relative;
        z-index:8;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:20px;
        padding:17px 18px;
        border:1px solid rgba(28,58,38,.08);
        border-radius:20px;
        background:rgba(255,255,255,.98);
        box-shadow:0 18px 48px rgba(19,45,28,.09);
      }

      .identityMain{
        display:flex;
        align-items:center;
        gap:15px;
        min-width:0;
      }

      .identityAvatar{
        width:78px;
        height:78px;
        flex:0 0 auto;
        border-radius:19px;
        object-fit:cover;
        border:3px solid #fff;
        background:#eef2eb;
        box-shadow:0 10px 22px rgba(20,46,29,.12);
      }

      .identityCopy{min-width:0}

      .identityEyebrow{
        display:flex;
        flex-wrap:wrap;
        gap:5px;
        margin-bottom:6px;
      }

      .identityVerified,
      .identityType{
        display:inline-flex;
        align-items:center;
        gap:5px;
        min-height:24px;
        padding:0 8px;
        border-radius:999px;
        font-size:8px;
        font-weight:800;
      }

      .identityVerified{
        color:#356044;
        background:#edf5e9;
        border:1px solid #dde9d8;
      }

      .identityType{
        color:#6a776f;
        background:#f7f9f6;
        border:1px solid #e8ede5;
      }

      .identityCopy h1{
        margin:0;
        color:#17251c;
        font-size:clamp(27px,3.7vw,39px);
        line-height:1;
        letter-spacing:-.043em;
      }

      .identityMeta{
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:6px;
        margin-top:6px;
        color:#77847b;
        font-size:10px;
        font-weight:650;
      }

      .identityMeta span{
        display:inline-flex;
        align-items:center;
        gap:4px;
      }

      .identityDot{opacity:.4}

      .identityActivities{
        display:flex;
        flex-wrap:wrap;
        gap:5px;
        margin-top:8px;
      }

      .identityActivities span{
        padding:5px 8px;
        border-radius:999px;
        background:#f5f7f3;
        border:1px solid #e7ece4;
        color:#66766b;
        font-size:8px;
        font-weight:740;
      }

      .identityActions{
        flex:0 0 auto;
        display:flex;
        align-items:center;
        gap:7px;
      }

      .identityContactButton,
      .identityShareButton{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:7px !important;
        min-height:40px !important;
        padding:0 12px !important;
        border-radius:11px !important;
        font:inherit !important;
        font-size:9px !important;
        font-weight:850 !important;
        cursor:pointer !important;
      }

      .identityContactButton{
        border:1px solid #214832 !important;
        background:#173d28 !important;
        color:#fff !important;
      }

      .identityShareButton{
        border:1px solid #dde5da !important;
        background:#fff !important;
        color:#435149 !important;
      }

      .profileContent{
        margin:12px auto 0 !important;
      }

      @media(max-width:760px){
        .profileHero{min-height:245px !important}

        .profileIdentityCard{
          width:calc(100% - 14px);
          margin:-22px auto 0;
          padding:13px;
          border-radius:17px;
          flex-direction:column;
          align-items:stretch;
          gap:11px;
        }

        .identityMain{
          align-items:flex-start;
          gap:11px;
        }

        .identityAvatar{
          width:62px;
          height:62px;
          border-radius:16px;
        }

        .identityCopy h1{
          font-size:27px;
        }

        .identityType{display:none}

        .identityActivities{
          max-width:100%;
          overflow-x:auto;
          flex-wrap:nowrap;
          scrollbar-width:none;
        }

        .identityActivities::-webkit-scrollbar{display:none}
        .identityActivities span{flex:0 0 auto}

        .identityActions{width:100%}
        .identityContactButton{flex:1 1 auto}
      }


      /* =========================================================
         HOST PROFILE V7 — ADAPTIVE CONTENT
         0 = hidden, 1 = premium feature, 2+ = catalog cards
         ========================================================= */
      .singleFeature{
        display:grid;
        grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);
        min-height:330px;
        overflow:hidden;
        border:1px solid rgba(29,58,39,.08);
        border-radius:19px;
        background:#fff;
        box-shadow:0 12px 34px rgba(20,46,29,.065);
      }

      .singleFeatureVisual{
        position:relative;
        min-height:330px;
        overflow:hidden;
        background:#dfe7dc;
      }

      .singleFeatureMainImage{
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        object-fit:cover;
        transition:transform .35s ease;
      }

      .singleFeature:hover .singleFeatureMainImage{
        transform:scale(1.015);
      }

      .singleFeatureShade{
        position:absolute;
        inset:0;
        background:
          linear-gradient(180deg,rgba(7,19,11,.04),rgba(7,19,11,.10) 45%,rgba(7,19,11,.70)),
          linear-gradient(90deg,rgba(7,19,11,.10),transparent 65%);
      }

      .singleFeatureBadge,
      .singleFeaturePhotoCount{
        position:absolute;
        top:14px;
        z-index:2;
        display:inline-flex;
        align-items:center;
        gap:6px;
        min-height:29px;
        padding:0 9px;
        border:1px solid rgba(255,255,255,.22);
        border-radius:999px;
        background:rgba(16,34,22,.48);
        color:#fff;
        font-size:8px;
        font-weight:850;
        backdrop-filter:blur(10px);
      }

      .singleFeatureBadge{left:14px}
      .singleFeaturePhotoCount{right:14px}

      .singleFeatureOwnerActions{
        top:52px !important;
        right:14px !important;
      }

      .singleFeatureImageCopy{
        position:absolute;
        z-index:2;
        left:18px;
        right:18px;
        bottom:17px;
        color:#fff;
      }

      .singleFeatureImageCopy>span{
        display:flex;
        align-items:center;
        gap:5px;
        margin-bottom:5px;
        color:rgba(255,255,255,.82);
        font-size:9px;
        font-weight:750;
      }

      .singleFeatureImageCopy h3{
        margin:0;
        max-width:650px;
        color:#fff;
        font-size:clamp(25px,3.2vw,38px);
        line-height:1;
        letter-spacing:-.04em;
      }

      .singleFeatureContent{
        display:flex;
        flex-direction:column;
        justify-content:center;
        padding:22px;
        min-width:0;
      }

      .singleFeatureTopline{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
        padding-bottom:12px;
        border-bottom:1px solid #edf1eb;
      }

      .singleFeatureEyebrow{
        color:#78906f;
        font-size:7px;
        font-weight:900;
        letter-spacing:.16em;
      }

      .singleFeatureTopline strong{
        color:#1d3324;
        font-size:14px;
        white-space:nowrap;
      }

      .singleFeatureContent>p{
        margin:14px 0 0;
        color:#68776d;
        font-size:10px;
        line-height:1.65;
        display:-webkit-box;
        -webkit-line-clamp:4;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }

      .singleFeatureFacts{
        display:grid;
        grid-template-columns:1fr;
        gap:7px;
        margin-top:14px;
      }

      .singleFeatureFacts>span{
        display:flex;
        align-items:center;
        gap:8px;
        min-width:0;
        padding:9px 10px;
        border:1px solid #e7ece4;
        border-radius:11px;
        background:#f8faf7;
        color:#526159;
      }

      .singleFeatureFacts b{
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        font-size:9px;
      }

      .singleFeatureMiniGallery{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:6px;
        margin-top:12px;
      }

      .singleFeatureMiniGallery.count-1{
        grid-template-columns:1fr;
      }

      .singleFeatureMiniGallery img{
        width:100%;
        height:72px;
        object-fit:cover;
        border-radius:10px;
      }

      .singleFeatureCta{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:7px;
        width:100%;
        min-height:42px;
        margin-top:14px;
        padding:0 12px;
        border:1px solid #214832;
        border-radius:11px;
        background:#173d28;
        color:#fff;
        font:inherit;
        font-size:9px;
        font-weight:850;
        cursor:pointer;
      }

      .singleFeatureOwnerNote{
        display:flex;
        align-items:center;
        gap:7px;
        margin-top:14px;
        color:#728078;
        font-size:8px;
        font-weight:750;
      }

      @media(max-width:820px){
        .singleFeature{
          grid-template-columns:1fr;
          min-height:0;
        }

        .singleFeatureVisual{
          min-height:250px;
        }

        .singleFeatureContent{
          padding:16px;
        }

        .singleFeatureMiniGallery img{
          height:88px;
        }
      }

      @media(max-width:520px){
        .singleFeature{
          border-radius:15px;
        }

        .singleFeatureVisual{
          min-height:215px;
        }

        .singleFeatureBadge,
        .singleFeaturePhotoCount{
          top:10px;
          min-height:26px;
          padding:0 8px;
          font-size:7px;
        }

        .singleFeatureBadge{left:10px}
        .singleFeaturePhotoCount{right:10px}

        .singleFeatureImageCopy{
          left:13px;
          right:13px;
          bottom:13px;
        }

        .singleFeatureImageCopy h3{
          font-size:25px;
        }

        .singleFeatureContent{
          padding:14px;
        }

        .singleFeatureTopline{
          align-items:center;
        }

        .singleFeatureContent>p{
          -webkit-line-clamp:3;
        }

        .singleFeatureMiniGallery img{
          height:72px;
        }
      }


      /* V8 creation flow — richer photo editors */
      .offerGalleryEditor{
        margin-top:2px;
      }

      .offerPhotoGrid .stayPhotoItem{
        aspect-ratio:1.45/1;
      }

      @media(max-width:640px){
        .offerPhotoGrid,
        .stayPhotoGrid{
          grid-template-columns:repeat(2,minmax(0,1fr)) !important;
        }
      }


        .hostProfileTabs {
          position: relative;
          z-index: 4;
          margin: 0;
          background: rgba(250,251,247,.98);
          border-top: 1px solid rgba(15,23,42,.07);
          border-bottom: 1px solid rgba(15,23,42,.08);
        }

        .hostProfileTabsInner {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          justify-content: center;
          display: flex;
          align-items: stretch;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .hostProfileTabsInner::-webkit-scrollbar { display: none; }

        .hostProfileTab {
          position: relative;
          flex: 0 0 auto;
          min-width: 92px;
          min-height: 64px;
          padding: 10px 14px 9px;
          border: 0;
          background: transparent;
          color: #64748b;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: color .18s ease, background .18s ease;
        }

        .hostProfileTab::after {
          content: "";
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 0;
          height: 2px;
          border-radius: 999px 999px 0 0;
          background: currentColor;
          opacity: 0;
          transform: scaleX(.5);
          transition: opacity .18s ease, transform .18s ease;
        }

        .hostProfileTab:hover {
          color: #0f172a;
          background: rgba(15,23,42,.025);
        }

        .hostProfileTab.active {
          color: #0f172a;
        }

        .hostProfileTab.active::after {
          opacity: 1;
          transform: scaleX(1);
        }

        @media (max-width: 680px) {
          .hostProfileTabs {
            margin: 0;
          }

          .hostProfileTabsInner {
            width: 100%;
            padding: 0 8px;
          }

          .hostProfileTab {
            min-width: 68px;
            min-height: 56px;
            padding: 8px 10px 7px;
            font-size: 10px;
          }

          .hostProfileTab svg {
            width: 19px;
            height: 19px;
          }
        }


      /* =========================================================
         HOST PROFILE — WORLDCLASS FINAL VISUAL LAYER
         Public profile = premium host portfolio, not dashboard.
         ========================================================= */

      .hostProfilePage{
        background:
          radial-gradient(circle at 8% 0%,rgba(44,91,62,.08),transparent 30rem),
          radial-gradient(circle at 96% 18%,rgba(185,163,111,.08),transparent 28rem),
          #f5f6f2 !important;
        color:#14251a;
      }

      .profileShell{
        width:min(1280px,calc(100% - 36px)) !important;
        margin:0 auto 72px !important;
        overflow:visible !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }

      /* Cover: photographic, clean, intentionally not overloaded. */
      .profileHero{
        min-height:0 !important;
        height:clamp(270px,32vw,410px) !important;
        margin-top:18px !important;
        padding:0 !important;
        overflow:hidden !important;
        border-radius:34px !important;
        background:#dce3dd !important;
        box-shadow:0 28px 78px rgba(23,48,32,.13) !important;
      }

      .coverImage{
        position:absolute !important;
        inset:0 !important;
        width:100% !important;
        height:100% !important;
        object-fit:cover !important;
        transform:none !important;
        filter:none !important;
      }

      .profileHero:hover .coverImage{transform:scale(1.012) !important}

      .coverOverlay{
        background:
          linear-gradient(180deg,rgba(8,18,12,.10),transparent 44%,rgba(8,18,12,.20)) !important;
      }

      .heroGlow{display:none !important}

      .heroEditFloating{
        top:18px !important;
        right:18px !important;
        bottom:auto !important;
        left:auto !important;
        z-index:5 !important;
        min-height:42px !important;
        padding:0 15px !important;
        border:1px solid rgba(255,255,255,.42) !important;
        border-radius:999px !important;
        background:rgba(18,31,22,.38) !important;
        color:white !important;
        box-shadow:none !important;
        backdrop-filter:blur(16px) !important;
      }

      /* Identity is the only floating card. */
      .profileIdentityCard{
        position:relative !important;
        z-index:10 !important;
        width:calc(100% - 64px) !important;
        margin:-58px auto 0 !important;
        padding:26px 28px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:24px !important;
        border:1px solid rgba(31,65,44,.09) !important;
        border-radius:28px !important;
        background:rgba(255,255,255,.96) !important;
        box-shadow:0 24px 70px rgba(24,48,31,.12) !important;
        backdrop-filter:blur(20px) !important;
      }

      .identityMain{
        min-width:0 !important;
        display:flex !important;
        align-items:center !important;
        gap:22px !important;
      }

      .identityAvatar{
        flex:0 0 auto !important;
        width:112px !important;
        height:112px !important;
        border:5px solid #fff !important;
        border-radius:28px !important;
        object-fit:cover !important;
        box-shadow:0 13px 34px rgba(19,43,28,.16) !important;
      }

      .identityCopy{min-width:0 !important}

      .identityEyebrow{
        display:flex !important;
        flex-wrap:wrap !important;
        gap:7px !important;
        margin:0 0 8px !important;
      }

      .identityVerified,
      .identityType{
        min-height:27px !important;
        display:inline-flex !important;
        align-items:center !important;
        gap:6px !important;
        padding:0 9px !important;
        border:1px solid #e1e8e2 !important;
        border-radius:999px !important;
        background:#f7f9f6 !important;
        color:#365442 !important;
        font-size:9px !important;
        font-weight:900 !important;
        letter-spacing:.035em !important;
      }

      .identityVerified{
        border-color:#d4e4d8 !important;
        background:#edf5ef !important;
        color:#174b31 !important;
      }

      .identityCopy h1{
        margin:0 !important;
        color:#102b1d !important;
        font-size:clamp(32px,4vw,50px) !important;
        line-height:.98 !important;
        letter-spacing:-.05em !important;
      }

      .identityMeta{
        display:flex !important;
        align-items:center !important;
        flex-wrap:wrap !important;
        gap:7px !important;
        margin-top:8px !important;
        color:#6e7c73 !important;
        font-size:12px !important;
        font-weight:750 !important;
      }

      .identityMeta span{
        display:inline-flex !important;
        align-items:center !important;
        gap:4px !important;
      }

      .identityActivities{
        display:flex !important;
        flex-wrap:wrap !important;
        gap:6px !important;
        margin-top:11px !important;
      }

      .identityActivities span{
        padding:6px 9px !important;
        border:0 !important;
        border-radius:999px !important;
        background:#f0f3ef !important;
        color:#53645a !important;
        font-size:10px !important;
        font-weight:800 !important;
      }

      .identityActions{
        flex:0 0 auto !important;
        display:flex !important;
        align-items:center !important;
        gap:8px !important;
      }

      .identityContactButton{
        min-height:48px !important;
        padding:0 18px !important;
        border:0 !important;
        border-radius:15px !important;
        background:#173f2c !important;
        color:#fff !important;
        font-size:12px !important;
        font-weight:900 !important;
        box-shadow:0 12px 28px rgba(23,63,44,.18) !important;
      }

      .identityShareButton{
        min-height:48px !important;
        border-radius:15px !important;
        box-shadow:none !important;
      }

      /* Tabs behave like a quiet editorial navigation, never a dashboard. */
      .hostProfileTabs{
        position:static !important;
        margin:22px auto 0 !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }

      .hostProfileTabsInner{
        width:calc(100% - 64px) !important;
        margin:0 auto !important;
        padding:0 !important;
        display:flex !important;
        gap:6px !important;
        overflow-x:auto !important;
        scrollbar-width:none !important;
      }
      .hostProfileTabsInner::-webkit-scrollbar{display:none}

      .hostProfileTab{
        flex:0 0 auto !important;
        min-width:auto !important;
        min-height:40px !important;
        padding:0 13px !important;
        display:inline-flex !important;
        flex-direction:row !important;
        align-items:center !important;
        gap:7px !important;
        border:1px solid #e0e6e1 !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.68) !important;
        color:#69786f !important;
        font-size:11px !important;
        font-weight:850 !important;
      }

      .hostProfileTab::after{display:none !important}

      .hostProfileTab.active{
        border-color:#173f2c !important;
        background:#173f2c !important;
        color:#fff !important;
      }

      .profileContent{
        width:calc(100% - 64px) !important;
        margin:0 auto !important;
        padding:30px 0 0 !important;
      }

      /* Overview: editorial, low-card-density. */
      .mainGrid{
        grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr) !important;
        gap:48px !important;
        align-items:start !important;
      }

      .mainColumn,.sideColumn{gap:18px !important}

      .contentCard{
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }

      .aboutCard{
        padding-bottom:28px !important;
        border-bottom:1px solid rgba(29,59,40,.12) !important;
      }

      .sectionHeading{margin-bottom:14px !important}
      .sectionHeading .sectionIcon{display:none !important}

      .sectionKicker{
        color:#748178 !important;
        font-size:9px !important;
        font-weight:950 !important;
        letter-spacing:.17em !important;
      }

      .sectionHeading h2,
      .listingHeader h2{
        margin-top:5px !important;
        color:#173a29 !important;
        font-size:clamp(25px,3vw,38px) !important;
        line-height:1 !important;
        letter-spacing:-.045em !important;
      }

      .hostBio{
        max-width:760px !important;
        color:#4e5e54 !important;
        font-size:15px !important;
        line-height:1.78 !important;
      }

      .hostStoryStats{
        display:flex !important;
        gap:22px !important;
        margin:20px 0 0 !important;
        padding:16px 0 0 !important;
        border-top:1px solid rgba(29,59,40,.10) !important;
      }

      .hostStoryStats article{
        min-width:0 !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }

      .hostStoryStats span{font-size:22px !important}
      .hostStoryStats small{font-size:9px !important}

      .profilePresence{
        margin-top:17px !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
        color:#54705e !important;
      }

      .trustMessage{display:none !important}

      .activityList{gap:7px !important}
      .activityChip{
        padding:8px 10px !important;
        border:1px solid #e1e7e2 !important;
        border-radius:999px !important;
        background:#fff !important;
        box-shadow:none !important;
      }

      .contactCard{
        position:static !important;
        padding:21px !important;
        border:1px solid rgba(29,59,40,.09) !important;
        border-radius:22px !important;
        background:#fff !important;
        box-shadow:0 16px 42px rgba(24,48,31,.07) !important;
      }

      .verifiedCard{
        padding:18px !important;
        border:0 !important;
        border-radius:20px !important;
        background:#eaf1eb !important;
        box-shadow:none !important;
      }

      .verifiedCard h3{
        margin:4px 0 6px !important;
        font-size:17px !important;
      }

      /* All content sections breathe, without giant white containers. */
      .hostMapSection,
      .hostGallerySection,
      .listingSection,
      .reviewsSection,
      .reviewFeedSection{
        margin-top:46px !important;
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }

      .listingHeader{
        margin-bottom:18px !important;
        align-items:end !important;
      }

      .listingHeader p{
        max-width:650px !important;
        margin-top:8px !important;
        color:#6b786f !important;
        font-size:13px !important;
        line-height:1.6 !important;
      }

      .sectionAction{
        min-height:40px !important;
        padding:0 12px !important;
        border:1px solid #dce4de !important;
        border-radius:12px !important;
        background:#fff !important;
        color:#244d37 !important;
        box-shadow:none !important;
      }

      /* Premium listing cards: image-led and compact. */
      .singleFeature{
        grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr) !important;
        min-height:390px !important;
        overflow:hidden !important;
        border:1px solid rgba(29,59,40,.08) !important;
        border-radius:27px !important;
        background:#fff !important;
        box-shadow:0 18px 52px rgba(24,48,31,.08) !important;
      }

      .singleFeatureVisual{min-height:390px !important}
      .singleFeatureContent{padding:28px !important}
      .singleFeatureContent > p{
        display:-webkit-box !important;
        overflow:hidden !important;
        -webkit-line-clamp:4 !important;
        -webkit-box-orient:vertical !important;
      }

      .singleFeatureMiniGallery{
        max-height:88px !important;
        overflow:hidden !important;
      }

      .singleFeatureDetailsLink,
      .singleFeatureCta{
        min-height:44px !important;
        border-radius:13px !important;
      }

      .adventureSwipeRail,
      .staySwipeRail,
      .offerSwipeRail{
        gap:14px !important;
        padding:2px 2px 12px !important;
      }

      .hostListingCard,
      .stayCard,
      .offerCard{
        border:1px solid rgba(29,59,40,.08) !important;
        border-radius:22px !important;
        background:#fff !important;
        box-shadow:0 12px 36px rgba(24,48,31,.06) !important;
      }

      .adventureSwipeCard,
      .stayCard,
      .offerCard{
        flex-basis:clamp(290px,31vw,370px) !important;
      }

      .hostListingImage,
      .stayCardMedia,
      .offerCardMedia{
        height:245px !important;
      }

      .hostListingBody,
      .stayCardBody,
      .offerCardBody{
        padding:16px !important;
      }

      .hostListingDescription,
      .stayCardBody > p,
      .offerCardBody > p{
        display:-webkit-box !important;
        overflow:hidden !important;
        -webkit-line-clamp:3 !important;
        -webkit-box-orient:vertical !important;
      }

      .hostMapFrame{
        overflow:hidden !important;
        border:1px solid rgba(29,59,40,.08) !important;
        border-radius:26px !important;
        box-shadow:0 16px 46px rgba(24,48,31,.07) !important;
      }

      .hostLeaflet{height:410px !important}

      .hostGalleryGrid{
        gap:10px !important;
      }

      .hostGalleryGrid button{
        border-radius:18px !important;
      }

      @media(max-width:900px){
        .profileIdentityCard{
          width:calc(100% - 32px) !important;
          align-items:flex-start !important;
          flex-direction:column !important;
        }

        .identityActions{width:100% !important}
        .identityContactButton{flex:1 !important}

        .hostProfileTabsInner,
        .profileContent{width:calc(100% - 32px) !important}

        .mainGrid{grid-template-columns:1fr !important;gap:28px !important}

        .singleFeature{
          grid-template-columns:1fr !important;
        }

        .singleFeatureVisual{min-height:330px !important}
      }

      @media(max-width:680px){
        .profileShell{
          width:100% !important;
          margin-bottom:42px !important;
        }

        .profileHero{
          height:245px !important;
          margin-top:0 !important;
          border-radius:0 0 26px 26px !important;
        }

        .heroEditFloating{
          top:12px !important;
          right:12px !important;
        }

        .profileIdentityCard{
          width:calc(100% - 20px) !important;
          margin:-34px auto 0 !important;
          padding:17px !important;
          gap:16px !important;
          border-radius:22px !important;
        }

        .identityMain{
          width:100% !important;
          align-items:flex-start !important;
          gap:13px !important;
        }

        .identityAvatar{
          width:76px !important;
          height:76px !important;
          border-width:4px !important;
          border-radius:21px !important;
        }

        .identityCopy h1{
          font-size:29px !important;
        }

        .identityEyebrow{
          gap:5px !important;
        }

        .identityVerified,
        .identityType{
          min-height:23px !important;
          padding:0 7px !important;
          font-size:7.5px !important;
        }

        .identityActivities{
          width:calc(100vw - 54px) !important;
          margin-left:calc(-76px - 13px) !important;
          padding-top:11px !important;
        }

        .identityActions{
          display:grid !important;
          grid-template-columns:1fr auto !important;
        }

        .identityContactButton,
        .identityShareButton{
          min-height:44px !important;
        }

        .hostProfileTabs{
          margin-top:14px !important;
        }

        .hostProfileTabsInner{
          width:100% !important;
          padding:0 10px !important;
        }

        .hostProfileTab{
          min-height:38px !important;
          padding:0 11px !important;
          font-size:10px !important;
        }

        .profileContent{
          width:calc(100% - 20px) !important;
          padding-top:22px !important;
        }

        .mainGrid{gap:22px !important}

        .sectionHeading h2,
        .listingHeader h2{
          font-size:27px !important;
        }

        .hostStoryStats{
          gap:15px !important;
          overflow-x:auto !important;
        }

        .contactCard{
          padding:16px !important;
          border-radius:18px !important;
        }

        .hostMapSection,
        .hostGallerySection,
        .listingSection,
        .reviewsSection,
        .reviewFeedSection{
          margin-top:34px !important;
        }

        .listingHeader{
          align-items:flex-start !important;
          gap:12px !important;
        }

        .singleFeature{
          min-height:0 !important;
          border-radius:22px !important;
        }

        .singleFeatureVisual{
          min-height:280px !important;
        }

        .singleFeatureContent{
          padding:18px !important;
        }

        .singleFeatureMiniGallery{
          display:none !important;
        }

        .adventureSwipeCard,
        .stayCard,
        .offerCard{
          flex-basis:min(84vw,330px) !important;
        }

        .hostListingImage,
        .stayCardMedia,
        .offerCardMedia{
          height:220px !important;
        }

        .hostLeaflet{height:330px !important}
      }


      .hostCategoryShowcase {
        width: min(1240px, calc(100% - 40px));
        margin: 22px auto 0;
      }

      .hostCategoryShowcaseHead {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 14px;
      }

      .hostCategoryShowcaseHead > div > span {
        display: block;
        color: #7d965f;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .14em;
      }

      .hostCategoryShowcaseHead h2 {
        margin: 6px 0 0;
        color: #1f3429;
        font-size: clamp(25px, 3vw, 38px);
        line-height: 1;
        letter-spacing: -.045em;
      }

      .hostCategoryShowcaseHead p {
        max-width: 420px;
        margin: 0;
        color: #7f8a83;
        font-size: 10px;
        line-height: 1.55;
        text-align: right;
      }

      .hostCategoryRail {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 2px 2px 8px;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        overscroll-behavior-x: contain;
        -webkit-overflow-scrolling: touch;
      }

      .hostCategoryRail::-webkit-scrollbar {
        display: none;
      }

      .hostCategoryCard {
        position: relative;
        flex: 0 0 min(360px, 32vw);
        min-width: 280px;
        height: 180px;
        overflow: hidden;
        padding: 0;
        border: 1px solid rgba(30, 55, 41, .10);
        border-radius: 23px;
        background: #173426;
        color: white;
        text-align: left;
        cursor: pointer;
        scroll-snap-align: start;
        box-shadow: 0 13px 35px rgba(25, 49, 34, .08);
        transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
      }

      .hostCategoryCard:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 42px rgba(25, 49, 34, .13);
      }

      .hostCategoryCard > img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hostCategoryShade {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(90deg, rgba(7, 25, 14, .88), rgba(7, 25, 14, .32) 72%, rgba(7, 25, 14, .18)),
          linear-gradient(180deg, rgba(0,0,0,.02), rgba(5,20,11,.45));
      }

      .hostCategoryIcon {
        position: absolute;
        top: 14px;
        left: 14px;
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 1px solid rgba(255,255,255,.17);
        border-radius: 12px;
        background: rgba(255,255,255,.10);
        color: #d8f3b0;
        backdrop-filter: blur(10px);
      }

      .hostCategoryCopy {
        position: absolute;
        left: 16px;
        right: 48px;
        bottom: 15px;
        display: block;
      }

      .hostCategoryCopy small,
      .hostCategoryCopy strong,
      .hostCategoryCopy em {
        display: block;
      }

      .hostCategoryCopy small {
        color: rgba(225, 244, 216, .64);
        font-size: 7px;
        font-weight: 900;
        letter-spacing: .13em;
      }

      .hostCategoryCopy strong {
        margin-top: 4px;
        color: white;
        font-size: 24px;
        line-height: 1;
        letter-spacing: -.045em;
      }

      .hostCategoryCopy em {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        margin-top: 8px;
        padding: 5px 8px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 999px;
        background: rgba(255,255,255,.09);
        color: rgba(255,255,255,.82);
        font-size: 8px;
        font-style: normal;
        font-weight: 800;
        backdrop-filter: blur(8px);
      }

      .hostCategoryArrow {
        position: absolute;
        right: 14px;
        bottom: 15px;
        display: grid;
        place-items: center;
        width: 31px;
        height: 31px;
        border-radius: 10px;
        background: rgba(216, 243, 176, .13);
        color: #d8f3b0;
      }

      .hostCategorySwipeHint {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        margin-top: 6px;
        color: #8a958d;
        font-size: 8px;
        font-weight: 800;
      }

      .singlePurposeProfile .listingSection {
        margin-top: 24px;
      }

      .singlePurposeProfile .singleFeature {
        min-height: 470px;
      }

      .singlePurposeProfile .singleFeatureVisual {
        min-height: 470px;
      }

      .singlePurposeProfile .singleFeatureContent {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: clamp(24px, 4vw, 46px);
      }

      @media (max-width: 760px) {
        .hostCategoryShowcase {
          width: 100%;
          margin-top: 16px;
          padding-left: 16px;
        }

        .hostCategoryShowcaseHead {
          align-items: flex-start;
          padding-right: 16px;
          margin-bottom: 10px;
        }

        .hostCategoryShowcaseHead h2 {
          font-size: 24px;
        }

        .hostCategoryShowcaseHead p {
          display: none;
        }

        .hostCategoryRail {
          gap: 9px;
          padding-right: 16px;
        }

        .hostCategoryCard {
          flex-basis: 78vw;
          min-width: 250px;
          max-width: 330px;
          height: 150px;
          border-radius: 18px;
        }

        .hostCategoryCopy strong {
          font-size: 21px;
        }

        .hostCategorySwipeHint {
          justify-content: flex-start;
          padding-right: 16px;
        }

        .singlePurposeProfile .singleFeature,
        .singlePurposeProfile .singleFeatureVisual {
          min-height: 0;
        }
      }


      /* ===== Compact host profile / offer-first layout ===== */

      .profileContent {
        padding-top: 18px !important;
      }

      .hostOffersPriority {
        width: min(1180px, 100%);
        margin: 0 auto 8px;
      }

      .priorityHeading {
        padding: 4px 2px 8px;
      }

      .priorityHeading > span {
        display: block;
        color: #78945b;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .14em;
      }

      .priorityHeading h2 {
        margin: 5px 0 0;
        color: #21382c;
        font-size: clamp(27px, 3.3vw, 40px);
        line-height: .98;
        letter-spacing: -.055em;
      }

      .priorityHeading p {
        max-width: 680px;
        margin: 8px 0 0;
        color: #7d8981;
        font-size: 10px;
        line-height: 1.55;
      }

      .listingSection {
        margin-top: 16px !important;
        padding-top: 0 !important;
      }

      .listingHeader {
        margin-bottom: 12px !important;
      }

      .listingHeader h2 {
        margin-top: 5px !important;
        font-size: clamp(23px, 3vw, 34px) !important;
      }

      .listingHeader p {
        margin-top: 6px !important;
        font-size: 9px !important;
        line-height: 1.5 !important;
      }

      .singleFeature {
        min-height: 340px !important;
        border-radius: 22px !important;
      }

      .singleFeatureVisual {
        min-height: 340px !important;
      }

      .singleFeatureContent {
        padding: 25px !important;
      }

      .stayCard,
      .offerCard,
      .hostListingCard {
        border-radius: 20px !important;
      }

      .stayCardMedia,
      .offerCardMedia,
      .hostListingImage {
        min-height: 185px !important;
      }

      .mainGrid {
        margin-top: 30px !important;
        gap: 14px !important;
      }

      .mainColumn {
        gap: 14px !important;
      }

      .contentCard,
      .verifiedCard {
        padding: 20px !important;
        border-radius: 21px !important;
      }

      .sectionHeading {
        margin-bottom: 13px !important;
      }

      .sectionHeading h2 {
        font-size: 22px !important;
      }

      .hostBio {
        font-size: 10px !important;
        line-height: 1.65 !important;
      }

      .hostStoryStats {
        margin-top: 15px !important;
        gap: 8px !important;
      }

      .hostStoryStats article {
        min-height: 66px !important;
        padding: 10px !important;
      }

      .profilePresence,
      .trustMessage {
        margin-top: 13px !important;
      }

      .hostGallerySection {
        margin-top: 24px !important;
      }

      .hostGalleryGrid {
        gap: 8px !important;
      }

      .hostGalleryGrid button {
        min-height: 160px !important;
        border-radius: 17px !important;
      }

      .hostMapSection {
        margin-top: 30px !important;
        padding-top: 22px !important;
        border-top: 1px solid rgba(34, 55, 43, .10);
      }

      .hostMapFrame {
        border-radius: 21px !important;
        overflow: hidden;
      }

      .hostLeaflet {
        height: 300px !important;
      }

      @media (max-width: 760px) {
        .profileContent {
          padding-top: 10px !important;
        }

        .hostOffersPriority {
          margin-bottom: 2px;
        }

        .priorityHeading {
          padding: 2px 0 5px;
          text-align: center;
        }

        .priorityHeading h2 {
          font-size: 26px;
        }

        .priorityHeading p {
          margin: 7px auto 0;
          max-width: 310px;
          font-size: 9px;
        }

        .listingSection {
          margin-top: 12px !important;
        }

        .listingHeader {
          gap: 10px !important;
        }

        .listingHeader h2 {
          font-size: 22px !important;
        }

        .listingHeader p {
          display: none;
        }

        .sectionAction {
          min-height: 38px !important;
          padding: 0 11px !important;
          font-size: 8px !important;
        }

        .singleFeature {
          min-height: 0 !important;
          border-radius: 18px !important;
        }

        .singleFeatureVisual {
          min-height: 220px !important;
        }

        .singleFeatureContent {
          padding: 17px !important;
        }

        .mainGrid {
          margin-top: 22px !important;
          gap: 11px !important;
        }

        .contentCard,
        .verifiedCard {
          padding: 16px !important;
          border-radius: 18px !important;
        }

        .hostGallerySection {
          margin-top: 19px !important;
        }

        .hostMapSection {
          margin-top: 24px !important;
          padding-top: 18px !important;
        }

        .hostLeaflet {
          height: 240px !important;
        }
      }

      /* ===== Unified premium offer cards ===== */

      .adventureSwipeRail,
      .staySwipeRail,
      .offerSwipeRail {
        display: flex !important;
        gap: 14px !important;
        overflow-x: auto !important;
        padding: 3px 2px 14px !important;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }

      .adventureSwipeRail::-webkit-scrollbar,
      .staySwipeRail::-webkit-scrollbar,
      .offerSwipeRail::-webkit-scrollbar {
        display: none;
      }

      .adventureSwipeCard,
      .stayCard,
      .offerCard {
        flex: 0 0 clamp(320px, 31vw, 370px) !important;
        width: clamp(320px, 31vw, 370px) !important;
        min-width: 320px !important;
        overflow: hidden !important;
        border: 1px solid rgba(42, 66, 50, .10) !important;
        border-radius: 24px !important;
        background: #fff !important;
        box-shadow:
          0 10px 26px rgba(28, 50, 36, .055),
          0 2px 6px rgba(28, 50, 36, .025) !important;
        scroll-snap-align: start;
        transition:
          transform .22s ease,
          box-shadow .22s ease,
          border-color .22s ease !important;
      }

      .adventureSwipeCard:hover,
      .stayCard:hover,
      .offerCard:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(112, 145, 88, .35) !important;
        box-shadow:
          0 20px 44px rgba(28, 50, 36, .11),
          0 3px 9px rgba(28, 50, 36, .04) !important;
      }

      .adventureCardImage,
      .stayCardMedia,
      .offerCardMedia {
        height: 225px !important;
        min-height: 225px !important;
      }

      .adventureSwipeCard:hover .adventureCardImage > img,
      .stayCard:hover .stayCardMedia > img,
      .offerCard:hover .offerCardMedia > img {
        transform: scale(1.045) !important;
      }

      .adventureCardImage > img,
      .stayCardMedia > img,
      .offerCardMedia > img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        transition: transform .45s ease !important;
      }

      .adventureCardImageCopy h3,
      .stayHeroCopy h3,
      .offerCardHeroCopy h3 {
        margin-top: 7px !important;
        color: #fff !important;
        font-size: 20px !important;
        line-height: 1.07 !important;
        letter-spacing: -.035em !important;
      }

      .adventureCardBody,
      .stayCardBody,
      .offerCardBody {
        padding: 16px !important;
      }

      .adventureCardDescription,
      .stayCardBody > p,
      .offerCardBody > p {
        min-height: 38px !important;
        color: #748179 !important;
        font-size: 9px !important;
        line-height: 1.55 !important;
      }

      .adventureCardMeta,
      .stayMeta,
      .offerCardBottom {
        margin-top: 13px !important;
        padding: 10px 11px !important;
        border-radius: 13px !important;
        background: #f3f6f0 !important;
      }

      .adventureRailSection {
        margin-top: 10px !important;
      }

      .adventureRailSection .listingHeader h2 {
        font-size: clamp(25px, 3.2vw, 36px) !important;
      }

      .adventureRailSection .sectionKicker {
        color: #6e8d50 !important;
      }

      @media (max-width: 760px) {
        .adventureSwipeRail,
        .staySwipeRail,
        .offerSwipeRail {
          gap: 10px !important;
          padding-bottom: 12px !important;
        }

        .adventureSwipeCard,
        .stayCard,
        .offerCard {
          flex-basis: 82vw !important;
          width: 82vw !important;
          min-width: 82vw !important;
          max-width: 340px !important;
          border-radius: 20px !important;
        }

        .adventureCardImage,
        .stayCardMedia,
        .offerCardMedia {
          height: 205px !important;
          min-height: 205px !important;
        }

        .adventureCardImageCopy h3,
        .stayHeroCopy h3,
        .offerCardHeroCopy h3 {
          font-size: 19px !important;
        }

        .adventureCardBody,
        .stayCardBody,
        .offerCardBody {
          padding: 14px !important;
        }
      }

      .adventureCardLink {
        display: block;
        color: inherit;
        text-decoration: none;
      }

      .ownerDeleteButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 35px;
        margin: 0 14px 14px;
        padding: 0 11px;
        border: 1px solid #f0cbc5;
        border-radius: 11px;
        background: #fff3f1;
        color: #a34339;
        font-size: 8px;
        font-weight: 900;
        cursor: pointer;
      }

      .adventureDeleteButton {
        width: calc(100% - 28px);
      }

      .offerOwnerActions button.danger {
        width: auto !important;
        min-width: 31px;
        padding: 0 8px !important;
        gap: 5px;
        background: rgba(125,39,31,.84) !important;
      }

      .offerOwnerActions button.danger span {
        display: inline;
        font-size: 7px;
        font-weight: 900;
      }

      @media (max-width: 760px) {
        .offerOwnerActions button.danger span {
          display: none;
        }
      }

    `}
</style>
  );
}
