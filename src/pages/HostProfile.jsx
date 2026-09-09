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

function EventCard({ event, completed = false }) {
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
    <Link
      to={`/event/${event.id}`}
      className={`hostListingCard adventureSwipeCard ${completed ? "completedAdventureCard" : ""}`}
    >
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

        <span className="listingDateBadge">
          {dateLabel}
        </span>

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
            {completed ? "Sačuvano u portfoliju" : "Prijave otvorene"}
          </span>

          <span className="adventureCardOpen">
            Pogledaj
            <Icon name="arrowRight" size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}


const OFFER_CATEGORIES = [
  "Planinarenje",
  "Rafting",
  "Kajak / SUP",
  "Biciklizam / MTB",
  "Off-road",
  "Kampovanje",
  "Penjanje / Via ferrata",
  "Speleologija",
  "Vodič",
  "Iznajmljivanje opreme",
  "Prevoz",
  "Team building",
  "Ostalo",
];

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
  onInquiry,
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
          {item.category || "Outdoor"}
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

          {!isOwner ? (
            <button
              type="button"
              className="offerInquiryButton"
              onClick={() => onInquiry?.(item)}
            >
              Pošalji upit
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
  imagePreview,
  onImageChange,
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
              Kratko predstavi uslugu koju ljudi mogu da zatraže direktno od tebe.
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
              >
                <option value="">Izaberi kategoriju</option>
                {OFFER_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

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

          <label className="offerImagePicker">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onImageChange}
            />
            <div className="offerImagePreview">
              {imagePreview ? (
                <img src={imagePreview} alt="Pregled fotografije ponude" />
              ) : (
                <span>
                  <Icon name="camera" size={24} />
                </span>
              )}
              <div>
                <strong>
                  {imagePreview ? "Promeni fotografiju" : "Dodaj fotografiju"}
                </strong>
                <small>JPG, PNG ili WEBP · do 8 MB</small>
              </div>
            </div>
          </label>

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

function InquiryModal({
  open,
  offer,
  form,
  setForm,
  onClose,
  onSubmit,
  sending,
  error,
  success,
}) {
  if (!open || !offer) return null;

  return (
    <div className="offerModalBackdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="offerModal inquiryModal"
        role="dialog"
        aria-modal="true"
        aria-label="Pošalji upit"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="offerModalHeader">
          <div>
            <span>POŠALJI UPIT</span>
            <h2>{offer.title}</h2>
            <p>Ostavi kontakt i domaćin može direktno da ti se javi.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Zatvori">×</button>
        </div>

        {success ? (
          <div className="inquirySuccess">
            <span><Icon name="check" size={24} /></span>
            <h3>Upit je poslat.</h3>
            <p>Domaćin je dobio tvoje podatke i može da te kontaktira.</p>
            <button type="button" onClick={onClose}>Zatvori</button>
          </div>
        ) : (
          <form className="offerForm" onSubmit={onSubmit}>
            <label className="offerField">
              <span>Ime i prezime *</span>
              <input
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, full_name: event.target.value }))
                }
                maxLength={100}
                required
              />
            </label>

            <div className="offerFormGrid">
              <label className="offerField">
                <span>Telefon *</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  maxLength={40}
                  placeholder="+381..."
                  required
                />
              </label>

              <label className="offerField">
                <span>Broj osoba</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.people_count}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      people_count: event.target.value,
                    }))
                  }
                  placeholder="2"
                />
              </label>
            </div>

            <label className="offerField">
              <span>Poruka</span>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                maxLength={700}
                rows={4}
                placeholder="Npr. zanima nas sledeći vikend..."
              />
            </label>

            {error && <div className="offerFormError">{error}</div>}

            <div className="offerModalActions">
              <button type="button" className="secondary" onClick={onClose}>
                Odustani
              </button>
              <button type="submit" className="primary" disabled={sending}>
                {sending ? "Slanje..." : "Pošalji upit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


const ACCOMMODATION_TYPES = [
  "Brvnara",
  "Vikendica",
  "Planinska kuća",
  "Kamp",
  "Glamping",
  "Etno domaćinstvo",
  "Bungalov",
  "Planinarski dom",
  "Ostalo",
];

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

function AccommodationCard({
  item,
  isOwner = false,
  onEdit,
  onDelete,
  onInquiry,
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

        {!isOwner ? (
          <button
            type="button"
            className="stayInquiryButton"
            onClick={() => onInquiry?.(item)}
          >
            Pošalji upit
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
  imagePreview,
  onImageChange,
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

          <label className="offerImagePicker">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onImageChange}
            />
            <div className="offerImagePreview">
              {imagePreview ? (
                <img src={imagePreview} alt="Pregled smeštaja" />
              ) : (
                <span><Icon name="camera" size={24} /></span>
              )}
              <div>
                <strong>{imagePreview ? "Promeni fotografiju" : "Dodaj fotografiju"}</strong>
                <small>JPG, PNG ili WEBP · do 8 MB</small>
              </div>
            </div>
          </label>

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

function StayInquiryModal({
  open,
  stay,
  form,
  setForm,
  onClose,
  onSubmit,
  sending,
  error,
  success,
}) {
  if (!open || !stay) return null;

  return (
    <div className="offerModalBackdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="offerModal inquiryModal"
        role="dialog"
        aria-modal="true"
        aria-label="Pošalji upit za smeštaj"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="offerModalHeader">
          <div>
            <span>UPIT ZA SMEŠTAJ</span>
            <h2>{stay.title}</h2>
            <p>Pošalji željeni termin i kontakt. Domaćin ti se javlja direktno.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Zatvori">×</button>
        </div>

        {success ? (
          <div className="inquirySuccess">
            <span><Icon name="check" size={24} /></span>
            <h3>Upit je poslat.</h3>
            <p>Domaćin je dobio termin i tvoje kontakt podatke.</p>
            <button type="button" onClick={onClose}>Zatvori</button>
          </div>
        ) : (
          <form className="offerForm" onSubmit={onSubmit}>
            <label className="offerField">
              <span>Ime i prezime *</span>
              <input
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, full_name: event.target.value }))
                }
                maxLength={100}
                required
              />
            </label>

            <div className="offerFormGrid">
              <label className="offerField">
                <span>Telefon *</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  maxLength={40}
                  placeholder="+381..."
                  required
                />
              </label>

              <label className="offerField">
                <span>Broj gostiju</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.people_count}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, people_count: event.target.value }))
                  }
                  placeholder="2"
                />
              </label>
            </div>

            <div className="offerFormGrid">
              <label className="offerField">
                <span>Dolazak</span>
                <input
                  type="date"
                  value={form.check_in}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, check_in: event.target.value }))
                  }
                />
              </label>
              <label className="offerField">
                <span>Odlazak</span>
                <input
                  type="date"
                  value={form.check_out}
                  min={form.check_in || undefined}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, check_out: event.target.value }))
                  }
                />
              </label>
            </div>

            <label className="offerField">
              <span>Poruka</span>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                maxLength={700}
                rows={3}
                placeholder="Npr. dolazimo sa detetom, zanima nas parking..."
              />
            </label>

            {error && <div className="offerFormError">{error}</div>}

            <div className="offerModalActions">
              <button type="button" className="secondary" onClick={onClose}>Odustani</button>
              <button type="submit" className="primary" disabled={sending}>
                {sending ? "Slanje..." : "Pošalji upit"}
              </button>
            </div>
          </form>
        )}
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
  const [offerInquiries, setOfferInquiries] = useState([]);
  const [inquiryActionLoading, setInquiryActionLoading] = useState(null);

  const [accommodations, setAccommodations] = useState([]);
  const [stayInquiries, setStayInquiries] = useState([]);
  const [stayInquiryActionLoading, setStayInquiryActionLoading] = useState(null);

  const [hostPhotos, setHostPhotos] = useState([]);
  const [hostCheckins, setHostCheckins] = useState([]);
  const [taggedPlaces, setTaggedPlaces] = useState([]);

  const [loading, setLoading] = useState(true);

  const emptyOfferForm = {
    title: "",
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
  const [offerImageFile, setOfferImageFile] = useState(null);
  const [offerImagePreview, setOfferImagePreview] = useState("");
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerError, setOfferError] = useState("");

  const emptyInquiryForm = {
    full_name: "",
    phone: "",
    people_count: "",
    message: "",
  };

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryOffer, setInquiryOffer] = useState(null);
  const [inquiryForm, setInquiryForm] = useState(emptyInquiryForm);
  const [inquirySending, setInquirySending] = useState(false);
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState(false);

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
  const [stayImageFile, setStayImageFile] = useState(null);
  const [stayImagePreview, setStayImagePreview] = useState("");
  const [staySaving, setStaySaving] = useState(false);
  const [stayError, setStayError] = useState("");

  const emptyStayInquiryForm = {
    full_name: "",
    phone: "",
    people_count: "",
    check_in: "",
    check_out: "",
    message: "",
  };

  const [stayInquiryModalOpen, setStayInquiryModalOpen] = useState(false);
  const [inquiryStay, setInquiryStay] = useState(null);
  const [stayInquiryForm, setStayInquiryForm] = useState(emptyStayInquiryForm);
  const [stayInquirySending, setStayInquirySending] = useState(false);
  const [stayInquiryError, setStayInquiryError] = useState("");
  const [stayInquirySuccess, setStayInquirySuccess] = useState(false);

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

      if (user?.id === hostData.id) {
        const { data: inquiryRows, error: inquiryRowsError } = await supabase
          .from("host_offer_inquiries")
          .select(`
            id,
            offer_id,
            host_id,
            user_id,
            full_name,
            phone,
            people_count,
            message,
            status,
            created_at,
            host_offers:offer_id (
              id,
              title,
              category
            )
          `)
          .eq("host_id", hostData.id)
          .order("created_at", { ascending: false });

        if (!inquiryRowsError) {
          setOfferInquiries(inquiryRows || []);
        } else {
          console.warn("Host offer inquiries:", inquiryRowsError);
          setOfferInquiries([]);
        }

        const { data: stayInquiryRows, error: stayInquiryRowsError } = await supabase
          .from("host_accommodation_inquiries")
          .select(`
            id,
            accommodation_id,
            host_id,
            user_id,
            full_name,
            phone,
            people_count,
            check_in,
            check_out,
            message,
            status,
            created_at,
            host_accommodations:accommodation_id (
              id,
              title,
              type
            )
          `)
          .eq("host_id", hostData.id)
          .order("created_at", { ascending: false });

        if (!stayInquiryRowsError) {
          setStayInquiries(stayInquiryRows || []);
        } else {
          console.warn("Host accommodation inquiries:", stayInquiryRowsError);
          setStayInquiries([]);
        }
      } else {
        setOfferInquiries([]);
        setStayInquiries([]);
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
      setOfferInquiries([]);
      setAccommodations([]);
      setStayInquiries([]);
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
          table: "host_offer_inquiries",
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "host_accommodation_inquiries",
        },
        loadProfile
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProfile, username]);


  const resetOfferEditor = () => {
    setOfferForm(emptyOfferForm);
    setEditingOffer(null);
    setOfferImageFile(null);
    setOfferImagePreview("");
    setOfferError("");
    setOfferModalMode("create");
  };

  const openCreateOffer = () => {
    resetOfferEditor();
    setOfferModalOpen(true);
  };

  const openEditOffer = (item) => {
    setEditingOffer(item);
    setOfferModalMode("edit");
    setOfferForm({
      title: item.title || "",
      category: item.category || "",
      description: item.description || "",
      location: item.location || "",
      price_from:
        item.price_from !== null && item.price_from !== undefined
          ? String(item.price_from)
          : "",
      price_on_request: Boolean(item.price_on_request),
    });
    setOfferImageFile(null);
    setOfferImagePreview(item.cover_url || "");
    setOfferError("");
    setOfferModalOpen(true);
  };

  const closeOfferModal = () => {
    if (offerSaving) return;
    setOfferModalOpen(false);
    resetOfferEditor();
  };

  const handleOfferImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setOfferError("Fotografija mora biti JPG, PNG ili WEBP.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setOfferError("Fotografija može imati najviše 8 MB.");
      return;
    }

    setOfferError("");
    setOfferImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setOfferImagePreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return previewUrl;
    });
  };

  const uploadOfferCover = async (file, hostId) => {
    if (!file) return null;

    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg");

    const path = `${hostId}/offer-${Date.now()}-${Math.random()
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

    return {
      url: data?.publicUrl || "",
      path,
    };
  };

  const submitOffer = async (event) => {
    event.preventDefault();

    if (!profile?.id || currentUserId !== profile.id) {
      setOfferError("Samo vlasnik profila može da upravlja ponudama.");
      return;
    }

    const title = offerForm.title.trim();
    const category = offerForm.category.trim();
    const description = offerForm.description.trim();
    const location = offerForm.location.trim();

    if (!title || !category || !description || !location) {
      setOfferError("Popuni naziv, kategoriju, lokaciju i opis.");
      return;
    }

    setOfferSaving(true);
    setOfferError("");

    let uploaded = null;

    try {
      if (offerImageFile) {
        uploaded = await uploadOfferCover(offerImageFile, profile.id);
      }

      const payload = {
        host_id: profile.id,
        title,
        category,
        description,
        location,
        price_from: offerForm.price_on_request
          ? null
          : offerForm.price_from
            ? Number(offerForm.price_from)
            : null,
        price_on_request: Boolean(offerForm.price_on_request),
        cover_url:
          uploaded?.url ||
          editingOffer?.cover_url ||
          null,
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

      if (uploaded?.path) {
        await supabase.storage
          .from("host-offers")
          .remove([uploaded.path])
          .catch(() => {});
      }

      setOfferError(
        error?.message || "Ponuda trenutno ne može da se sačuva."
      );
    } finally {
      setOfferSaving(false);
    }
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

  const openInquiry = (item) => {
    setInquiryOffer(item);
    setInquiryForm(emptyInquiryForm);
    setInquiryError("");
    setInquirySuccess(false);
    setInquiryModalOpen(true);
  };

  const closeInquiryModal = () => {
    if (inquirySending) return;
    setInquiryModalOpen(false);
    setInquiryOffer(null);
    setInquiryForm(emptyInquiryForm);
    setInquiryError("");
    setInquirySuccess(false);
  };

  const submitInquiry = async (event) => {
    event.preventDefault();

    if (!inquiryOffer?.id || !profile?.id) return;

    const fullName = inquiryForm.full_name.trim();
    const phone = inquiryForm.phone.trim();

    if (!fullName || !phone) {
      setInquiryError("Unesi ime i prezime i broj telefona.");
      return;
    }

    setInquirySending(true);
    setInquiryError("");

    try {
      const { data: authData } = await supabase.auth.getUser();

      const payload = {
        offer_id: inquiryOffer.id,
        host_id: profile.id,
        user_id: authData?.user?.id || null,
        full_name: fullName,
        phone,
        people_count: inquiryForm.people_count
          ? Number(inquiryForm.people_count)
          : null,
        message: inquiryForm.message.trim() || null,
      };

      const { error } = await supabase
        .from("host_offer_inquiries")
        .insert(payload);

      if (error) throw error;

      setInquirySuccess(true);
    } catch (error) {
      console.error("Host offer inquiry:", error);
      setInquiryError(
        error?.message || "Upit trenutno ne može da se pošalje."
      );
    } finally {
      setInquirySending(false);
    }
  };


  const inquiryStats = useMemo(() => {
    const newCount = offerInquiries.filter(
      (item) => (item.status || "new") === "new"
    ).length;

    const contactedCount = offerInquiries.filter(
      (item) => item.status === "contacted"
    ).length;

    return {
      total: offerInquiries.length,
      newCount,
      contactedCount,
    };
  }, [offerInquiries]);

  const markInquiryStatus = async (inquiryId, nextStatus) => {
    if (!profile?.id || currentUserId !== profile.id || !inquiryId) return;

    setInquiryActionLoading(inquiryId);

    try {
      const { data, error } = await supabase
        .from("host_offer_inquiries")
        .update({ status: nextStatus })
        .eq("id", inquiryId)
        .eq("host_id", profile.id)
        .select("*")
        .single();

      if (error) throw error;

      setOfferInquiries((current) =>
        current.map((item) =>
          item.id === inquiryId
            ? { ...item, status: data.status }
            : item
        )
      );
    } catch (error) {
      console.error("Host inquiry status:", error);
      window.alert(
        error?.message || "Status upita trenutno ne može da se promeni."
      );
    } finally {
      setInquiryActionLoading(null);
    }
  };


  const resetStayEditor = () => {
    setStayForm(emptyStayForm);
    setEditingStay(null);
    setStayImageFile(null);
    setStayImagePreview("");
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
    setStayImageFile(null);
    setStayImagePreview(item.cover_url || "");
    setStayError("");
    setStayModalOpen(true);
  };

  const closeStayModal = () => {
    if (staySaving) return;
    setStayModalOpen(false);
    resetStayEditor();
  };

  const handleStayImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStayError("Fotografija mora biti JPG, PNG ili WEBP.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setStayError("Fotografija može imati najviše 8 MB.");
      return;
    }

    setStayError("");
    setStayImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setStayImagePreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return previewUrl;
    });
  };

  const uploadStayCover = async (file, hostId) => {
    if (!file) return null;

    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg");

    const path = `${hostId}/stay-${Date.now()}-${Math.random()
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

    return { url: data?.publicUrl || "", path };
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
    let uploaded = null;

    try {
      if (stayImageFile) {
        uploaded = await uploadStayCover(stayImageFile, profile.id);
      }

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
        cover_url: uploaded?.url || editingStay?.cover_url || null,
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

      if (uploaded?.path) {
        await supabase.storage
          .from("host-accommodations")
          .remove([uploaded.path])
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

  const openStayInquiry = (item) => {
    setInquiryStay(item);
    setStayInquiryForm(emptyStayInquiryForm);
    setStayInquiryError("");
    setStayInquirySuccess(false);
    setStayInquiryModalOpen(true);
  };

  const closeStayInquiryModal = () => {
    if (stayInquirySending) return;
    setStayInquiryModalOpen(false);
    setInquiryStay(null);
    setStayInquiryForm(emptyStayInquiryForm);
    setStayInquiryError("");
    setStayInquirySuccess(false);
  };

  const submitStayInquiry = async (event) => {
    event.preventDefault();
    if (!inquiryStay?.id || !profile?.id) return;

    const fullName = stayInquiryForm.full_name.trim();
    const phone = stayInquiryForm.phone.trim();

    if (!fullName || !phone) {
      setStayInquiryError("Unesi ime i prezime i broj telefona.");
      return;
    }

    if (
      stayInquiryForm.check_in &&
      stayInquiryForm.check_out &&
      stayInquiryForm.check_out < stayInquiryForm.check_in
    ) {
      setStayInquiryError("Datum odlaska ne može biti pre datuma dolaska.");
      return;
    }

    setStayInquirySending(true);
    setStayInquiryError("");

    try {
      const { data: authData } = await supabase.auth.getUser();

      const payload = {
        accommodation_id: inquiryStay.id,
        host_id: profile.id,
        user_id: authData?.user?.id || null,
        full_name: fullName,
        phone,
        people_count: stayInquiryForm.people_count
          ? Number(stayInquiryForm.people_count)
          : null,
        check_in: stayInquiryForm.check_in || null,
        check_out: stayInquiryForm.check_out || null,
        message: stayInquiryForm.message.trim() || null,
      };

      const { error } = await supabase
        .from("host_accommodation_inquiries")
        .insert(payload);

      if (error) throw error;
      setStayInquirySuccess(true);
    } catch (error) {
      console.error("Accommodation inquiry:", error);
      setStayInquiryError(
        error?.message || "Upit trenutno ne može da se pošalje."
      );
    } finally {
      setStayInquirySending(false);
    }
  };

  const stayInquiryStats = useMemo(() => {
    return {
      total: stayInquiries.length,
      newCount: stayInquiries.filter(
        (item) => (item.status || "new") === "new"
      ).length,
    };
  }, [stayInquiries]);

  const markStayInquiryStatus = async (inquiryId, nextStatus) => {
    if (!profile?.id || currentUserId !== profile.id || !inquiryId) return;

    setStayInquiryActionLoading(inquiryId);

    try {
      const { data, error } = await supabase
        .from("host_accommodation_inquiries")
        .update({ status: nextStatus })
        .eq("id", inquiryId)
        .eq("host_id", profile.id)
        .select("*")
        .single();

      if (error) throw error;

      setStayInquiries((current) =>
        current.map((item) =>
          item.id === inquiryId ? { ...item, status: data.status } : item
        )
      );
    } catch (error) {
      console.error("Accommodation inquiry status:", error);
      window.alert(error?.message || "Status upita trenutno ne može da se promeni.");
    } finally {
      setStayInquiryActionLoading(null);
    }
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

  const activeEvents = events.filter(
    (item) =>
      item.status !== "completed" &&
      item.status !== "cancelled" &&
      item.is_active !== false
  );

  const completedEvents = events.filter(
    (item) =>
      item.status === "completed" &&
      item.show_on_profile !== false
  );

  const displayName =
    profile.full_name ||
    profile.username ||
    "Outdoor Host";

  const completedAdventureCount =
    completedEvents.length +
    0;

  const contactHref =
    profile.phone
      ? `tel:${profile.phone.replace(
          /\s/g,
          ""
        )}`
      : profile.instagram_url
        ? normalizeExternalUrl(
            profile.instagram_url
          )
        : "";

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

            <div className="heroTopline">
              <Link
                to="/explore"
                className="heroExploreLink"
              >
                <Icon
                  name="compass"
                  size={16}
                />
                Explore
              </Link>

              {isOwnProfile && (
                <Link
                  to="/edit-profile"
                  className="heroEditButton"
                >
                  <Icon
                    name="edit"
                    size={16}
                  />
                  Uredi profil
                </Link>
              )}
            </div>

            <div className="heroProfileInfo">
              <img
                src={
                  profile.avatar_url ||
                  FALLBACK_AVATAR
                }
                alt={displayName}
                className="profileAvatar"
              />

              <div className="heroText">
                <div className="hostBadgeRow">
                  <span
                    className={
                      profile.is_verified
                        ? "hostBadge verified"
                        : "hostBadge"
                    }
                  >
                    <Icon
                      name={
                        profile.is_verified
                          ? "verified"
                          : "shield"
                      }
                      size={15}
                    />

                    {profile.is_verified
                      ? "MeetOutdoors verifikovani domaćin"
                      : "MeetOutdoors domaćin"}
                  </span>

                  {isAccommodationHost && (
                    <span className="heroLevelBadge stayHeroBadge">
                      <Icon name="home" size={14} />
                      Domaćin smeštaja
                    </span>
                  )}
                </div>

                <h1>{displayName}</h1>

                <div className="profileMeta">
                  <span>
                    @{profile.username}
                  </span>

                  <span className="metaDivider" />

                  <span>
                    <Icon
                      name="mapPin"
                      size={15}
                    />
                    {location}
                  </span>
                </div>

                <div className="heroActivityBadges">
                  {activities
                    .slice(0, 5)
                    .map((activity) => (
                      <span key={activity}>
                        <Icon
                          name="check"
                          size={12}
                        />
                        {activity}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="heroTrustStrip">
              <article>
                <strong>
                  {isAccommodationHost ? accommodations.length : activeEvents.length}
                </strong>
                <span>
                  {isAccommodationHost ? "smeštaja" : "aktivnih avantura"}
                </span>
              </article>

              <article>
                <strong>
                  {offers.length}
                </strong>
                <span>
                  ponuda
                </span>
              </article>

              <article>
                  <strong>{completedEvents.length}</strong>
                  <span>održanih avantura</span>
                </article>

              <article>
                <strong>
                  {visitedPlaces.length}
                </strong>
                <span>
                  GPS mesta
                </span>
              </article>
            </div>
          </div>

          <div className="profileContent">
            <section className="hostActionBar">
              {isAccommodationHost && (
                <a
                  href="#accommodation"
                  className="hostAction primary"
                >
                  <Icon name="home" size={17} />
                  <div>
                    <small>POGLEDAJ</small>
                    <strong>Smeštaj</strong>
                  </div>
                </a>
              )}

              <a
                href="#offers"
                className={`hostAction ${!isAccommodationHost ? "primary" : ""}`}
              >
                <Icon
                  name="sparkle"
                  size={17}
                />
                <div>
                  <small>
                    POGLEDAJ
                  </small>
                  <strong>
                    Šta nudimo
                  </strong>
                </div>
              </a>

              {isAdventureHost && (
                <a href="#events" className="hostAction">
                  <Icon name="calendar" size={17} />
                  <div>
                    <small>POGLEDAJ</small>
                    <strong>Avanture</strong>
                  </div>
                </a>
              )}

              <a
                href="#host-map"
                className="hostAction"
              >
                <Icon
                  name="mapPin"
                  size={17}
                />
                <div>
                  <small>
                    ISTRAŽI
                  </small>
                  <strong>
                    Moje lokacije
                  </strong>
                </div>
              </a>

              {contactHref && (
                <a
                  href={contactHref}
                  target={
                    contactHref.startsWith(
                      "http"
                    )
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    contactHref.startsWith(
                      "http"
                    )
                      ? "noreferrer"
                      : undefined
                  }
                  className="hostAction"
                >
                  <Icon
                    name="phone"
                    size={17}
                  />
                  <div>
                    <small>
                      DIREKTNO
                    </small>
                    <strong>
                      Kontakt
                    </strong>
                  </div>
                </a>
              )}

              {isOwnProfile && (
                <a
                  href="#offer-inquiries"
                  className="hostAction inquiryHostAction"
                >
                  <Icon
                    name="message"
                    size={17}
                  />
                  <div>
                    <small>
                      UPITI
                    </small>
                    <strong>
                      {inquiryStats.newCount > 0
                        ? `${inquiryStats.newCount} novih`
                        : "Ponude"}
                    </strong>
                  </div>
                </a>
              )}

              <ShareSheet
                type="host"
                title={displayName}
                image={
                  profile.cover_url ||
                  FALLBACK_COVER
                }
                avatar={
                  profile.avatar_url ||
                  FALLBACK_AVATAR
                }
                location={location}
                url={`https://www.meetoutdoors.app/h/${profile.username}`}
                triggerClassName="hostAction hostShareAction"
                triggerEyebrow="PODELI"
                triggerLabel="Profil"
              />
            </section>

            <section className="hostStats">
              <article>
                <span>
                  <Icon
                    name="calendar"
                    size={19}
                  />
                </span>

                <div>
                  <strong>
                    {activeEvents.length}
                  </strong>
                  <small>
                    Aktivnih avantura
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon
                    name="home"
                    size={19}
                  />
                </span>

                <div>
                  <strong>
                    {accommodations.length}
                  </strong>
                  <small>
                    Smeštaja
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon
                    name="camera"
                    size={19}
                  />
                </span>

                <div>
                  <strong>
                    {hostPhotos.length}
                  </strong>
                  <small>
                    Community fotografija
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon
                    name="route"
                    size={19}
                  />
                </span>

                <div>
                  <strong>
                    {mapPlaces.length}
                  </strong>
                  <small>
                    Outdoor lokacija
                  </small>
                </div>
              </article>
            </section>

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

                  <div className="hostStoryStats">
                    <article>
                      <span>
                        {completedAdventureCount}
                      </span>
                      <small>
                        održanih avantura
                      </small>
                    </article>

                    <article>
                      <span>
                        {hostCheckins.length}
                      </span>
                      <small>
                        GPS check-inova
                      </small>
                    </article>

                    <article>
                      <span>{offers.length}</span>
                      <small>aktivnih ponuda</small>
                    </article>
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
                        Upoznaj organizatora,
                        njegove lokacije,
                        iskustva i utiske drugih
                        učesnika pre rezervacije.
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
                      Upoznaj domaćina pre
                      rezervacije.
                    </h3>

                    <p>
                      Profil spaja aktivnosti,
                      avanture, mesta,
                      fotografije i iskustva
                      drugih učesnika.
                    </p>
                  </div>
                </section>
              </aside>
            </div>

            <section
              id="host-map"
              className="hostMapSection"
            >
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">
                    Mapa avantura
                  </span>

                  <h2>
                    Istraži lokacije ovog domaćina
                  </h2>

                  <p>
                    GPS potvrđena mesta i odobrene
                    lokacije na kojima je domaćin
                    tagovan.
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
                  center={mapCenter}
                  zoom={
                    mapPlaces.length > 0
                      ? 7
                      : 6
                  }
                  scrollWheelZoom={false}
                  className="hostLeaflet"
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
                      eventHandlers={{
                        click: () =>
                          navigate(
                            `/explore/${place.id}`
                          ),
                      }}
                    />
                  ))}
                </MapContainer>

                {mapPlaces.length === 0 && (
                  <div className="hostMapEmpty">
                    <Icon
                      name="mapPin"
                      size={28}
                    />

                    <strong>
                      Još nema povezanih mesta.
                    </strong>

                    <span>
                      Kada domaćin napravi GPS
                      check-in ili prihvati tag,
                      mesto će se pojaviti ovde.
                    </span>
                  </div>
                )}

                <div className="hostMapLegend">
                  <Icon
                    name="verified"
                    size={13}
                  />

                  COMMUNITY + GPS LOKACIJE
                </div>
              </div>
            </section>

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


            {(isAccommodationHost || accommodations.length > 0) && (
              <section
                id="accommodation"
                className="listingSection accommodationSection"
              >
                <div className="listingHeader">
                  <div>
                    <span className="sectionKicker">Smeštaj u prirodi</span>
                    <h2>Odmor koji počinje napolju</h2>
                    <p>
                      Izaberi smeštaj i pošalji upit domaćinu za termin i detalje.
                    </p>
                  </div>

                  {isOwnProfile && isAccommodationHost && (
                    <button
                      type="button"
                      className="sectionAction"
                      onClick={openCreateStay}
                    >
                      <Icon name="plus" size={16} />
                      Dodaj smeštaj
                    </button>
                  )}
                </div>

                {accommodations.length > 0 ? (
                  <div className="stayRailShell">
                    <div className="staySwipeRail" aria-label="Smeštaj domaćina">
                      {accommodations.map((item) => (
                        <AccommodationCard
                          key={item.id}
                          item={item}
                          isOwner={isOwnProfile}
                          onEdit={openEditStay}
                          onDelete={deleteStay}
                          onInquiry={openStayInquiry}
                        />
                      ))}
                    </div>

                    {accommodations.length > 1 && (
                      <div className="adventureSwipeHint">
                        <span>Prevuci za još smeštaja</span>
                        <Icon name="arrowRight" size={14} />
                      </div>
                    )}
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

            {(isOwnProfile || offers.length > 0) && (
            <section
              id="offers"
              className="listingSection offersSection"
            >
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">
                    Šta nudimo
                  </span>

                  <h2>
                    Usluge i iskustva po dogovoru
                  </h2>

                  <p>
                    Ponude domaćina koje nisu vezane za jedan datum — pošalji upit i dogovori detalje direktno.
                  </p>
                </div>

                {isOwnProfile && (
                  <button
                    type="button"
                    className="sectionAction offerAddButton"
                    onClick={openCreateOffer}
                  >
                    <Icon name="plus" size={16} />
                    Dodaj ponudu
                  </button>
                )}
              </div>

              {offers.length > 0 ? (
                <div className="offerRailShell">
                  <div className="offerSwipeRail" aria-label="Ponude domaćina">
                    {offers.map((item) => (
                      <OfferCard
                        key={item.id}
                        item={item}
                        isOwner={isOwnProfile}
                        onEdit={openEditOffer}
                        onDelete={deleteOffer}
                        onInquiry={openInquiry}
                      />
                    ))}
                  </div>

                  {offers.length > 1 && (
                    <div className="adventureSwipeHint">
                      <span>Prevuci za još ponuda</span>
                      <Icon name="arrowRight" size={14} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="emptyListing offerEmptyState">
                  <span>
                    <Icon name="sparkle" size={27} />
                  </span>

                  <h3>
                    {isOwnProfile
                      ? "Dodaj šta nudiš gostima."
                      : "Domaćin još nije dodao ponude."}
                  </h3>

                  <p>
                    {isOwnProfile
                      ? "Rafting, vođene ture, iznajmljivanje opreme, prevoz, team building i druge usluge koje mogu da se dogovore direktno."
                      : "Kada domaćin doda usluge koje nudi po dogovoru, pojaviće se ovde."}
                  </p>

                  {isOwnProfile && (
                    <button type="button" onClick={openCreateOffer}>
                      <Icon name="plus" size={15} />
                      Dodaj prvu ponudu
                    </button>
                  )}
                </div>
              )}
            </section>
            )}


            {isOwnProfile && (
              <section
                id="offer-inquiries"
                className="listingSection hostInquirySection"
              >
                <div className="listingHeader inquiryListingHeader">
                  <div>
                    <span className="sectionKicker">
                      Upiti za ponude
                    </span>

                    <h2>
                      Ljudi koji žele da se dogovore
                    </h2>

                    <p>
                      Privatni podaci su vidljivi samo tebi kao vlasniku profila.
                    </p>
                  </div>

                  <div className="inquirySummary">
                    <span>
                      <strong>{inquiryStats.newCount}</strong>
                      novih
                    </span>
                    <span>
                      <strong>{inquiryStats.total}</strong>
                      ukupno
                    </span>
                  </div>
                </div>

                {offerInquiries.length > 0 ? (
                  <div className="hostInquiryList">
                    {offerInquiries.map((item) => {
                      const status = item.status || "new";
                      const phoneHref = item.phone
                        ? `tel:${String(item.phone).replace(/\s/g, "")}`
                        : "";

                      return (
                        <article
                          key={item.id}
                          className={`hostInquiryCard inquiry-${status}`}
                        >
                          <div className="hostInquiryTop">
                            <div className="hostInquiryIdentity">
                              <span className="hostInquiryAvatar">
                                {String(item.full_name || "?")
                                  .trim()
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </span>

                              <div>
                                <strong>
                                  {item.full_name || "MeetOutdoors korisnik"}
                                </strong>
                                <small>
                                  {item.host_offers?.title || "Ponuda domaćina"}
                                </small>
                              </div>
                            </div>

                            <span className={`inquiryStatusBadge ${status}`}>
                              {status === "contacted"
                                ? "Kontaktiran"
                                : status === "closed"
                                  ? "Zatvoreno"
                                  : "Novo"}
                            </span>
                          </div>

                          <div className="hostInquiryMeta">
                            {item.phone && (
                              <span>
                                <Icon name="phone" size={14} />
                                {item.phone}
                              </span>
                            )}

                            {Number(item.people_count) > 0 && (
                              <span>
                                <Icon name="users" size={14} />
                                {item.people_count} osoba
                              </span>
                            )}

                            <span>
                              <Icon name="calendar" size={14} />
                              {formatDate(item.created_at)}
                            </span>
                          </div>

                          {item.message && (
                            <p className="hostInquiryMessage">
                              {item.message}
                            </p>
                          )}

                          <div className="hostInquiryActions">
                            {phoneHref && (
                              <a href={phoneHref} className="callInquiryButton">
                                <Icon name="phone" size={14} />
                                Pozovi
                              </a>
                            )}

                            {status === "new" && (
                              <button
                                type="button"
                                onClick={() =>
                                  markInquiryStatus(item.id, "contacted")
                                }
                                disabled={inquiryActionLoading === item.id}
                              >
                                <Icon name="check" size={14} />
                                {inquiryActionLoading === item.id
                                  ? "Čuvanje..."
                                  : "Označi kontaktirano"}
                              </button>
                            )}

                            {status !== "closed" && (
                              <button
                                type="button"
                                className="quiet"
                                onClick={() =>
                                  markInquiryStatus(item.id, "closed")
                                }
                                disabled={inquiryActionLoading === item.id}
                              >
                                Zatvori
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="emptyListing compactEmpty">
                    <span>
                      <Icon name="message" size={27} />
                    </span>
                    <h3>Još nema upita za ponude.</h3>
                    <p>
                      Kada neko pošalje upit preko kartice „Šta nudimo“,
                      pojaviće se ovde sa kontakt podacima.
                    </p>
                  </div>
                )}
              </section>
            )}

            {isOwnProfile && isAccommodationHost && (
              <section
                id="stay-inquiries"
                className="listingSection hostInquirySection stayInquirySection"
              >
                <div className="listingHeader inquiryListingHeader">
                  <div>
                    <span className="sectionKicker">Upiti za smeštaj</span>
                    <h2>Termini i kontakti na jednom mestu</h2>
                    <p>Privatni podaci su vidljivi samo tebi kao vlasniku profila.</p>
                  </div>

                  <div className="inquirySummary">
                    <span>
                      <strong>{stayInquiryStats.newCount}</strong>
                      novih
                    </span>
                    <span>
                      <strong>{stayInquiryStats.total}</strong>
                      ukupno
                    </span>
                  </div>
                </div>

                {stayInquiries.length > 0 ? (
                  <div className="hostInquiryList">
                    {stayInquiries.map((item) => {
                      const status = item.status || "new";
                      const phoneHref = item.phone
                        ? `tel:${String(item.phone).replace(/\s/g, "")}`
                        : "";

                      return (
                        <article key={item.id} className={`hostInquiryCard inquiry-${status}`}>
                          <div className="hostInquiryTop">
                            <div className="hostInquiryIdentity">
                              <span className="hostInquiryAvatar">
                                {String(item.full_name || "?").trim().slice(0, 1).toUpperCase()}
                              </span>
                              <div>
                                <strong>{item.full_name || "MeetOutdoors korisnik"}</strong>
                                <small>{item.host_accommodations?.title || "Smeštaj"}</small>
                              </div>
                            </div>

                            <span className={`inquiryStatusBadge ${status}`}>
                              {status === "contacted"
                                ? "Kontaktiran"
                                : status === "closed"
                                  ? "Zatvoren"
                                  : "Nov"}
                            </span>
                          </div>

                          <div className="hostInquiryMeta">
                            {item.people_count && (
                              <span><Icon name="users" size={12} /> {item.people_count} gostiju</span>
                            )}
                            {(item.check_in || item.check_out) && (
                              <span>
                                <Icon name="calendar" size={12} />
                                {item.check_in || "?"} → {item.check_out || "?"}
                              </span>
                            )}
                          </div>

                          {item.message && <p className="hostInquiryMessage">{item.message}</p>}

                          <div className="hostInquiryActions">
                            {phoneHref && (
                              <a className="callInquiryButton" href={phoneHref}>
                                <Icon name="phone" size={13} />
                                Pozovi
                              </a>
                            )}
                            {status === "new" && (
                              <button
                                type="button"
                                disabled={stayInquiryActionLoading === item.id}
                                onClick={() => markStayInquiryStatus(item.id, "contacted")}
                              >
                                Kontaktirano
                              </button>
                            )}
                            {status !== "closed" && (
                              <button
                                type="button"
                                className="quiet"
                                disabled={stayInquiryActionLoading === item.id}
                                onClick={() => markStayInquiryStatus(item.id, "closed")}
                              >
                                Zatvori
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="emptyListing compactEmpty">
                    <span><Icon name="message" size={27} /></span>
                    <h3>Još nema upita za smeštaj.</h3>
                    <p>Kada neko pošalje upit sa kartice smeštaja, pojaviće se ovde.</p>
                  </div>
                )}
              </section>
            )}

            {isAdventureHost && (
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

                {isOwnProfile && (
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
                      />
                    ))}
                  </div>
                  <div className="adventureSwipeHint">
                    <span>Prevuci za još</span>
                    <Icon name="arrowRight" size={14} />
                  </div>
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

            {isAdventureHost && completedEvents.length > 0 && (
              <section
                id="completed-adventures"
                className="listingSection completedAdventureSection adventureRailSection"
              >
                <div className="listingHeader">
                  <div>
                    <span className="sectionKicker">
                      Održane avanture
                    </span>

                    <h2>
                      Iskustva koja ostaju iza domaćina
                    </h2>

                    <p>
                      Završene avanture čuvaju istoriju, iskustvo i portfolio organizatora.
                    </p>
                  </div>

                  <div className="completedAdventureCount">
                    <Icon name="trophy" size={16} />
                    {completedEvents.length}
                  </div>
                </div>

                <div className="adventureRailShell">
                  <div className="adventureSwipeRail" aria-label="Održane avanture">
                    {completedEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        completed
                      />
                    ))}
                  </div>
                  <div className="adventureSwipeHint">
                    <span>Prevuci kroz portfolio</span>
                    <Icon name="arrowRight" size={14} />
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>

        {!isOwnProfile && (
          <div className="mobileHostDock">
            {isAccommodationHost && accommodations.length > 0 && (
              <a href="#accommodation">
                <Icon name="home" size={17} />
                Smeštaj
              </a>
            )}

            {isAdventureHost && activeEvents.length > 0 && (
              <a href="#events">
                <Icon name="calendar" size={17} />
                Avanture
              </a>
            )}

            {offers.length > 0 && (
              <a href="#offers">
                <Icon name="sparkle" size={17} />
                Ponude
              </a>
            )}

            <a href="#host-map">
              <Icon
                name="mapPin"
                size={17}
              />
              Mapa
            </a>

            {contactHref && (
              <a href={contactHref}>
                <Icon
                  name="phone"
                  size={17}
                />
                Kontakt
              </a>
            )}
          </div>
        )}

        <OfferModal
          open={offerModalOpen}
          mode={offerModalMode}
          form={offerForm}
          setForm={setOfferForm}
          imagePreview={offerImagePreview}
          onImageChange={handleOfferImageChange}
          onClose={closeOfferModal}
          onSubmit={submitOffer}
          saving={offerSaving}
          error={offerError}
        />

        <InquiryModal
          open={inquiryModalOpen}
          offer={inquiryOffer}
          form={inquiryForm}
          setForm={setInquiryForm}
          onClose={closeInquiryModal}
          onSubmit={submitInquiry}
          sending={inquirySending}
          error={inquiryError}
          success={inquirySuccess}
        />

        <AccommodationModal
          open={stayModalOpen}
          mode={stayModalMode}
          form={stayForm}
          setForm={setStayForm}
          imagePreview={stayImagePreview}
          onImageChange={handleStayImageChange}
          onClose={closeStayModal}
          onSubmit={submitStay}
          saving={staySaving}
          error={stayError}
        />

        <StayInquiryModal
          open={stayInquiryModalOpen}
          stay={inquiryStay}
          form={stayInquiryForm}
          setForm={setStayInquiryForm}
          onClose={closeStayInquiryModal}
          onSubmit={submitStayInquiry}
          sending={stayInquirySending}
          error={stayInquiryError}
          success={stayInquirySuccess}
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
      .offerInquiryButton{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border:0;border-radius:11px;background:#c9f28c;color:#173f2a;font-size:8px;font-weight:900;cursor:pointer}
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
      .offerFormError{padding:10px 12px;border:1px solid #efd1cc;border-radius:12px;background:#fff1ee;color:#9b3d32;font-size:9px;font-weight:800}
      .offerModalActions{display:flex;justify-content:flex-end;gap:9px;padding-top:3px}
      .offerModalActions button{min-height:42px;padding:0 15px;border-radius:12px;font-size:8px;font-weight:900;cursor:pointer}
      .offerModalActions .secondary{border:1px solid #d7dfd4;background:#fff;color:#516258}
      .offerModalActions .primary{border:0;background:#173f2a;color:#fff;box-shadow:0 10px 20px rgba(23,63,42,.16)}
      .offerModalActions button:disabled{opacity:.55;cursor:not-allowed}
      .inquirySuccess{display:grid;place-items:center;padding:34px 22px 30px;text-align:center}
      .inquirySuccess>span{display:grid;place-items:center;width:54px;height:54px;border-radius:17px;background:#dff3c0;color:#234d30}
      .inquirySuccess h3{margin:14px 0 0;font-size:22px}
      .inquirySuccess p{max-width:390px;margin:7px 0 0;color:#748178;font-size:10px;line-height:1.5}
      .inquirySuccess button{margin-top:18px;min-height:40px;padding:0 16px;border:0;border-radius:11px;background:#173f2a;color:#fff;font-size:8px;font-weight:900;cursor:pointer}


      .inquiryHostAction{position:relative}
      .inquirySummary{display:flex;gap:8px;flex-wrap:wrap}
      .inquirySummary>span{display:grid;min-width:78px;padding:10px 12px;border:1px solid #dce4d9;border-radius:14px;background:#fff;color:#77857c;font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      .inquirySummary strong{color:#173f2a;font-size:17px;letter-spacing:-.04em}
      .hostInquiryList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
      .hostInquiryCard{padding:16px;border:1px solid #dce4d9;border-radius:19px;background:#fff;box-shadow:0 8px 24px rgba(31,51,38,.045)}
      .hostInquiryCard.inquiry-new{border-color:#bdd49f;background:linear-gradient(180deg,#fbfff7,#fff)}
      .hostInquiryTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .hostInquiryIdentity{display:flex;align-items:center;gap:10px;min-width:0}
      .hostInquiryAvatar{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:13px;background:#173f2a;color:#fff;font-size:13px;font-weight:900}
      .hostInquiryIdentity>div{display:grid;gap:3px;min-width:0}
      .hostInquiryIdentity strong{overflow:hidden;color:#17271f;font-size:11px;text-overflow:ellipsis;white-space:nowrap}
      .hostInquiryIdentity small{overflow:hidden;color:#7c8a81;font-size:8px;text-overflow:ellipsis;white-space:nowrap}
      .inquiryStatusBadge{flex:0 0 auto;padding:6px 8px;border-radius:999px;background:#eef2ec;color:#67756c;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}
      .inquiryStatusBadge.new{background:#dff3c0;color:#275131}
      .inquiryStatusBadge.contacted{background:#edf0f7;color:#45536a}
      .inquiryStatusBadge.closed{background:#f0f0f0;color:#7b7b7b}
      .hostInquiryMeta{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}
      .hostInquiryMeta span{display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border-radius:9px;background:#f3f6f1;color:#607067;font-size:8px;font-weight:800}
      .hostInquiryMessage{margin:12px 0 0;padding:11px 12px;border-left:3px solid #c9f28c;border-radius:0 10px 10px 0;background:#f7faf5;color:#5b6a61;font-size:9px;line-height:1.5}
      .hostInquiryActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px;padding-top:12px;border-top:1px solid #edf1eb}
      .hostInquiryActions a,.hostInquiryActions button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 10px;border:1px solid #d7dfd4;border-radius:10px;background:#fff;color:#405249;font-size:7px;font-weight:900;text-decoration:none;cursor:pointer}
      .hostInquiryActions .callInquiryButton{border-color:#173f2a;background:#173f2a;color:#fff}
      .hostInquiryActions button:not(.quiet){border-color:#bed39f;background:#ecf8dc;color:#2b5332}
      .hostInquiryActions .quiet{margin-left:auto;color:#7e8982}
      .hostInquiryActions button:disabled{opacity:.5;cursor:not-allowed}

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
      .stayInquiryButton{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:39px;margin-top:11px;padding:0 12px;border:0;border-radius:12px;background:#183a27;color:#fff;font-size:8px;font-weight:900;cursor:pointer}
      .stayOwnerHint{display:block;margin-top:11px;color:#7e8c82;font-size:8px;font-weight:800;text-align:right}
      .compactStayCheck{margin-top:0}
      .stayInquirySection{background:linear-gradient(145deg,#f7faf4,#fff)}
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
        .hostInquiryList{grid-template-columns:1fr}
        .inquiryListingHeader{align-items:flex-start}
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
        .hostInquiryCard{padding:13px;border-radius:16px}
        .hostInquiryTop{gap:8px}
        .hostInquiryActions{gap:6px}
        .hostInquiryActions a,.hostInquiryActions button{flex:1 1 auto}
        .hostInquiryActions .quiet{margin-left:0}
        .offerSwipeRail{gap:9px;margin-right:-8px;padding-right:18px;padding-bottom:6px}
        .offerCard{flex-basis:82vw;max-width:330px;border-radius:18px}
        .offerCardMedia{height:185px}
        .offerCardHeroCopy h3{font-size:17px}
        .offerCardBody{padding:11px}
        .offerCardBody>p{min-height:34px;font-size:8px}
        .offerCardBottom{margin-top:8px;padding-top:8px}
        .offerInquiryButton{min-height:32px;padding:0 9px;font-size:7px}
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

      .stayInquiryButton,
      .offerInquiryButton{
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

    `}</style>
  );
}
