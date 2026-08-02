import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85";

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  fill = "none",
}) {
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

    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
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

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),

    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),

    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
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

    euro: (
      <>
        <path d="M18 7.5a6 6 0 1 0 0 9" />
        <path d="M5 10h9M5 14h8" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),

    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 15H6L5 6" />
      </>
    ),

    mountain: (
      <>
        <path d="m3 20 7-12 4 7 2-3 5 8" />
        <path d="m8.8 10 2.2 2 1.4-1.4" />
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
      fill={fill}
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
  if (!value) return "Datum nije izabran";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Datum nije izabran";
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "Besplatno";
  }

  return new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(number);
}

function FormField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  hint,
}) {
  return (
    <label className="createEventField">
      <span className="createEventLabel">
        {label}
        {required && <strong>*</strong>}
      </span>

      <span className="createEventInputWrapper">
        <span className="createEventInputIcon">
          <Icon name={icon} size={17} />
        </span>

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          step={step}
        />
      </span>

      {hint && <small className="createEventHint">{hint}</small>}
    </label>
  );
}

function LoadingState() {
  return (
    <>
      <CreateEventStyles />

      <main className="createEventStatePage">
        <div className="createEventStateCard">
          <span className="createEventLoader" />
          <h1>Pripremamo formu</h1>
          <p>Učitavamo tvoj host profil i podešavanja.</p>
        </div>
      </main>
    </>
  );
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user, profile, loading, isHost } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverFile, setCoverFile] = useState(null);

  const coverPreview = useMemo(() => {
    if (coverFile) {
      return URL.createObjectURL(coverFile);
    }

    return FALLBACK_COVER;
  }, [coverFile]);

  useEffect(() => {
    return () => {
      if (coverFile && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverFile, coverPreview]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (loading || saving) return;

    if (!user || !profile) {
      setError("Moraš biti ulogovan kao domaćin.");
      return;
    }

    if (!isHost) {
      setError("Samo domaćin može da kreira događaj.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanLocation = location.trim();
    const cleanCountry = country.trim();

    if (!cleanTitle) {
      setError("Naziv događaja je obavezan.");
      return;
    }

    if (Number(capacity || 1) < 1) {
      setError("Kapacitet mora biti najmanje 1.");
      return;
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate).getTime() <=
        new Date(startDate).getTime()
    ) {
      setError(
        "Datum završetka mora biti posle datuma početka."
      );
      return;
    }

    try {
      setSaving(true);

      let cover_url = null;

      if (coverFile) {
        const safeName = coverFile.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9.-]/g, "");

        const fileName = `${profile.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("event-covers")
            .upload(fileName, coverFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } =
          supabase.storage
            .from("event-covers")
            .getPublicUrl(fileName);

        cover_url = publicUrlData.publicUrl;
      }

      const { data, error: insertError } =
        await supabase
          .from("events")
          .insert({
            host_id: profile.id,
            title: cleanTitle,
            description: cleanDescription,
            location: cleanLocation,
            country: cleanCountry,
            cover_url,
            price: Number(price || 0),
            capacity: Number(capacity || 1),
            start_date: startDate || null,
            end_date: endDate || null,
            is_active: true,
          })
          .select("id")
          .single();

      if (insertError) {
        throw insertError;
      }

      navigate(`/event/${data.id}`);
    } catch (err) {
      console.error("Greška pri kreiranju događaja:", err);

      setError(
        err.message || "Greška pri kreiranju događaja."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate("/host-dashboard");
  }

  if (loading) {
    return <LoadingState />;
  }

  const displayLocation =
    [location.trim(), country.trim()]
      .filter(Boolean)
      .join(", ") || "Lokacija nije dodata";

  return (
    <>
      <CreateEventStyles />

      <main className="createEventPage">
        <div className="createEventShell">
          <aside className="eventPreviewPanel">
            <div className="eventPreviewImage">
              <img src={coverPreview} alt="" />

              <div className="eventPreviewOverlay" />

              <button
                type="button"
                className="previewBackButton"
                onClick={handleCancel}
              >
                <Icon name="arrowLeft" size={17} />
                Dashboard
              </button>

              <span className="previewBadge">
                <Icon name="calendar" size={15} />
                Novi događaj
              </span>

              <div className="previewImageBottom">
                <span>
                  <Icon name="clock" size={14} />
                  {formatDate(startDate)}
                </span>

                <span>
                  <Icon name="users" size={14} />
                  {capacity
                    ? `Do ${capacity} učesnika`
                    : "Kapacitet nije dodat"}
                </span>
              </div>
            </div>

            <div className="eventPreviewBody">
              <span className="previewKicker">
                Pregled događaja
              </span>

              <h2>{title.trim() || "Naziv tvog događaja"}</h2>

              <div className="previewLocation">
                <Icon name="mapPin" size={15} />
                {displayLocation}
              </div>

              <p className="previewDescription">
                {description.trim() ||
                  "Opis događaja će se prikazati ovde. Dodaj informacije o planu, mestu okupljanja i opremi koju učesnici treba da ponesu."}
              </p>

              <div className="previewDetails">
                <article>
                  <span>
                    <Icon name="calendar" size={17} />
                  </span>

                  <div>
                    <small>Početak</small>
                    <strong>{formatDate(startDate)}</strong>
                  </div>
                </article>

                <article>
                  <span>
                    <Icon name="clock" size={17} />
                  </span>

                  <div>
                    <small>Završetak</small>
                    <strong>{formatDate(endDate)}</strong>
                  </div>
                </article>

                <article>
                  <span>
                    <Icon name="euro" size={17} />
                  </span>

                  <div>
                    <small>Cena</small>
                    <strong>{formatPrice(price)}</strong>
                  </div>
                </article>

                <article>
                  <span>
                    <Icon name="users" size={17} />
                  </span>

                  <div>
                    <small>Kapacitet</small>
                    <strong>
                      {capacity
                        ? `${capacity} učesnika`
                        : "Nije navedeno"}
                    </strong>
                  </div>
                </article>
              </div>

              <div className="previewHost">
                <span>
                  <Icon name="shield" size={18} />
                </span>

                <div>
                  <small>Organizator</small>
                  <strong>
                    {profile?.full_name ||
                      profile?.username ||
                      "MeetOutdoors domaćin"}
                  </strong>
                </div>
              </div>

              <div className="previewNotice">
                <Icon name="info" size={17} />

                <p>
                  Ovo je približan pregled kartice događaja.
                  Objavljena stranica može sadržati dodatne
                  informacije.
                </p>
              </div>
            </div>
          </aside>

          <section className="createEventContent">
            <header className="createEventHeader">
              <div>
                <button
                  type="button"
                  className="mobileBackButton"
                  onClick={handleCancel}
                >
                  <Icon name="arrowLeft" size={17} />
                </button>

                <span className="createEventBrand">
                  <span>
                    <Icon name="compass" size={21} />
                  </span>

                  MeetOutdoors
                </span>

                <span className="createEventKicker">
                  Host alat
                </span>

                <h1>Kreiraj događaj.</h1>

                <p>
                  Objavi lokalnu outdoor avanturu koju ljudi
                  mogu da pronađu, prate i kojoj mogu da se
                  pridruže.
                </p>
              </div>

              <span className="draftBadge">
                <Icon name="edit" size={16} />
                Novi nacrt
              </span>
            </header>

            <form
              onSubmit={handleSubmit}
              className="createEventForm"
            >
              <section className="eventFormSection">
                <div className="eventFormHeading">
                  <span>
                    <Icon name="sparkle" size={20} />
                  </span>

                  <div>
                    <small>Osnovne informacije</small>
                    <h2>Predstavi događaj</h2>
                    <p>
                      Naziv i opis treba jasno da objasne šta
                      učesnici mogu da očekuju.
                    </p>
                  </div>
                </div>

                <FormField
                  label="Naziv događaja"
                  icon="mountain"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Na primer: Planinarenje uz zalazak sunca"
                  required
                  hint="Koristi jasan naziv koji opisuje aktivnost."
                />

                <label className="createEventField eventDescriptionField">
                  <span className="createEventLabel">
                    Opis događaja
                  </span>

                  <span className="createEventTextareaWrapper">
                    <span>
                      <Icon name="edit" size={17} />
                    </span>

                    <textarea
                      rows="7"
                      maxLength="2000"
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Opiši događaj, mesto okupljanja, plan, pravila i opremu koju učesnici treba da ponesu..."
                    />
                  </span>

                  <span className="descriptionCount">
                    {description.length}/2000
                  </span>
                </label>
              </section>

              <section className="eventFormSection">
                <div className="eventFormHeading">
                  <span>
                    <Icon name="mapPin" size={20} />
                  </span>

                  <div>
                    <small>Lokacija</small>
                    <h2>Gde se avantura održava?</h2>
                    <p>
                      Dodaj mesto okupljanja ili naziv područja
                      u kome se događaj održava.
                    </p>
                  </div>
                </div>

                <div className="eventFieldsGrid">
                  <FormField
                    label="Lokacija"
                    icon="mapPin"
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="Na primer: Niš, Čair"
                  />

                  <FormField
                    label="Država"
                    icon="globe"
                    value={country}
                    onChange={(event) =>
                      setCountry(event.target.value)
                    }
                    placeholder="Na primer: Srbija"
                  />
                </div>
              </section>

              <section className="eventFormSection">
                <div className="eventFormHeading">
                  <span>
                    <Icon name="calendar" size={20} />
                  </span>

                  <div>
                    <small>Vreme održavanja</small>
                    <h2>Datum i trajanje</h2>
                    <p>
                      Unesi početak i završetak događaja kako bi
                      učesnici mogli da planiraju dolazak.
                    </p>
                  </div>
                </div>

                <div className="eventFieldsGrid">
                  <FormField
                    label="Početak događaja"
                    icon="calendar"
                    type="datetime-local"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                  />

                  <FormField
                    label="Završetak događaja"
                    icon="clock"
                    type="datetime-local"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                    min={startDate || undefined}
                  />
                </div>
              </section>

              <section className="eventFormSection">
                <div className="eventFormHeading">
                  <span>
                    <Icon name="users" size={20} />
                  </span>

                  <div>
                    <small>Učešće</small>
                    <h2>Cena i kapacitet</h2>
                    <p>
                      Besplatan događaj može imati cenu 0.
                      Kapacitet određuje maksimalan broj učesnika.
                    </p>
                  </div>
                </div>

                <div className="eventFieldsGrid">
                  <FormField
                    label="Cena po osobi"
                    icon="euro"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    placeholder="0"
                    hint="Cena se čuva u evrima."
                  />

                  <FormField
                    label="Maksimalan broj učesnika"
                    icon="users"
                    type="number"
                    min="1"
                    step="1"
                    value={capacity}
                    onChange={(event) =>
                      setCapacity(event.target.value)
                    }
                    placeholder="30"
                  />
                </div>
              </section>

              <section className="eventFormSection">
                <div className="eventFormHeading">
                  <span>
                    <Icon name="image" size={20} />
                  </span>

                  <div>
                    <small>Naslovna fotografija</small>
                    <h2>Dodaj fotografiju događaja</h2>
                    <p>
                      Kvalitetna horizontalna fotografija pomaže
                      događaju da se izdvoji.
                    </p>
                  </div>
                </div>

                <label
                  className={
                    coverFile
                      ? "eventUpload selected"
                      : "eventUpload"
                  }
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setCoverFile(
                        event.target.files?.[0] || null
                      )
                    }
                  />

                  <span className="eventUploadIcon">
                    <Icon
                      name={coverFile ? "check" : "upload"}
                      size={22}
                    />
                  </span>

                  <span className="eventUploadCopy">
                    <strong>
                      {coverFile
                        ? coverFile.name
                        : "Izaberi naslovnu fotografiju"}
                    </strong>

                    <small>
                      {coverFile
                        ? `${(
                            coverFile.size /
                            1024 /
                            1024
                          ).toFixed(2)} MB`
                        : "JPG, PNG ili WEBP. Preporučena širina najmanje 1200 px."}
                    </small>
                  </span>

                  <span className="eventUploadAction">
                    {coverFile ? "Promeni" : "Izaberi"}
                  </span>
                </label>

                {coverFile && (
                  <button
                    type="button"
                    className="removeEventCover"
                    onClick={() => setCoverFile(null)}
                  >
                    <Icon name="trash" size={15} />
                    Ukloni fotografiju
                  </button>
                )}
              </section>

              {error && (
                <div
                  className="createEventError"
                  role="alert"
                >
                  <span>
                    <Icon name="alert" size={18} />
                  </span>

                  <p>{error}</p>

                  <button
                    type="button"
                    onClick={() => setError("")}
                    aria-label="Zatvori poruku"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              )}

              <div className="createEventActions">
                <button
                  type="button"
                  className="cancelEventButton"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Otkaži
                </button>

                <button
                  type="submit"
                  className="publishEventButton"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="publishLoader" />
                      Kreiranje događaja...
                    </>
                  ) : (
                    <>
                      Objavi događaj
                      <Icon name="arrowRight" size={17} />
                    </>
                  )}
                </button>
              </div>

              <div className="eventSecurityNotice">
                <Icon name="shield" size={17} />

                <p>
                  Događaj će odmah biti vidljiv korisnicima
                  nakon uspešnog objavljivanja.
                </p>
              </div>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

function CreateEventStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f1f3ec;
      }

      button,
      input,
      textarea {
        font: inherit;
      }

      button,
      label,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .createEventPage,
      .createEventStatePage {
        min-height: 100vh;
        color: #17271f;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .createEventPage {
        padding: 28px;
        background:
          radial-gradient(
            circle at 5% 0%,
            rgba(169, 203, 131, 0.18),
            transparent 25%
          ),
          radial-gradient(
            circle at 97% 30%,
            rgba(85, 129, 91, 0.1),
            transparent 24%
          ),
          #f1f3ec;
      }

      .createEventShell {
        width: min(1280px, 100%);
        min-height: calc(100vh - 56px);
        display: grid;
        grid-template-columns:
          minmax(340px, 0.75fr)
          minmax(0, 1.25fr);
        margin: 0 auto;
        overflow: hidden;
        border: 1px solid rgba(34, 55, 43, 0.1);
        border-radius: 34px;
        background: rgba(255, 255, 255, 0.82);
        box-shadow: 0 28px 85px rgba(27, 49, 35, 0.11);
      }

      .eventPreviewPanel {
        min-width: 0;
        background: #102b1c;
        color: white;
      }

      .eventPreviewImage {
        position: relative;
        height: 390px;
        overflow: hidden;
      }

      .eventPreviewImage > img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
      }

      .eventPreviewOverlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(5, 17, 10, 0.2),
            rgba(5, 17, 10, 0.12) 35%,
            rgba(7, 24, 14, 0.94)
          );
      }

      .previewBackButton,
      .previewBadge {
        position: absolute;
        top: 22px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 40px;
        padding: 0 12px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 9px;
        font-weight: 850;
        backdrop-filter: blur(13px);
      }

      .previewBackButton {
        left: 22px;
        cursor: pointer;
      }

      .previewBackButton:hover {
        background: rgba(255, 255, 255, 0.18);
      }

      .previewBadge {
        right: 22px;
        color: #d8f7aa;
      }

      .previewImageBottom {
        position: absolute;
        right: 22px;
        bottom: 22px;
        left: 22px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .previewImageBottom > span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 31px;
        padding: 0 10px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 999px;
        background: rgba(5, 20, 11, 0.5);
        color: rgba(255, 255, 255, 0.84);
        font-size: 8px;
        font-weight: 800;
        backdrop-filter: blur(11px);
      }

      .eventPreviewBody {
        padding: 28px 28px 36px;
      }

      .previewKicker {
        display: block;
        color: #c9f28c;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .eventPreviewBody h2 {
        margin: 10px 0 0;
        color: white;
        font-size: clamp(32px, 4vw, 48px);
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .previewLocation {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 15px;
        color: rgba(255, 255, 255, 0.68);
        font-size: 10px;
        font-weight: 750;
      }

      .previewLocation svg {
        color: #c9f28c;
      }

      .previewDescription {
        margin: 18px 0 0;
        color: rgba(255, 255, 255, 0.59);
        font-size: 10px;
        line-height: 1.72;
        white-space: pre-line;
      }

      .previewDetails {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
        margin-top: 22px;
      }

      .previewDetails article {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.06);
      }

      .previewDetails article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        border-radius: 11px;
        background: rgba(201, 242, 140, 0.09);
        color: #c9f28c;
      }

      .previewDetails small,
      .previewDetails strong {
        display: block;
      }

      .previewDetails small {
        color: rgba(255, 255, 255, 0.4);
        font-size: 7px;
      }

      .previewDetails strong {
        overflow: hidden;
        margin-top: 3px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 8px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .previewHost {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .previewHost > span {
        display: grid;
        place-items: center;
        width: 39px;
        height: 39px;
        border-radius: 12px;
        background: rgba(201, 242, 140, 0.1);
        color: #c9f28c;
      }

      .previewHost small,
      .previewHost strong {
        display: block;
      }

      .previewHost small {
        color: rgba(255, 255, 255, 0.39);
        font-size: 7px;
      }

      .previewHost strong {
        margin-top: 3px;
        color: rgba(255, 255, 255, 0.82);
        font-size: 9px;
      }

      .previewNotice {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        margin-top: 20px;
        padding: 13px;
        border: 1px solid rgba(201, 242, 140, 0.14);
        border-radius: 14px;
        background: rgba(201, 242, 140, 0.06);
        color: #c9f28c;
      }

      .previewNotice svg {
        flex: 0 0 auto;
      }

      .previewNotice p {
        margin: 0;
        color: rgba(255, 255, 255, 0.48);
        font-size: 8px;
        line-height: 1.55;
      }

      .createEventContent {
        min-width: 0;
        padding: 39px;
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(186, 211, 155, 0.11),
            transparent 26%
          ),
          #fafbf7;
      }

      .createEventHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 25px;
        margin-bottom: 30px;
      }

      .createEventBrand {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 36px;
        color: #263c2f;
        font-size: 14px;
        font-weight: 900;
        letter-spacing: -0.025em;
      }

      .createEventBrand > span {
        display: grid;
        place-items: center;
        width: 39px;
        height: 39px;
        border-radius: 13px;
        background: #183a27;
        color: #c9f28c;
      }

      .createEventKicker {
        display: block;
        color: #779556;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .createEventHeader h1 {
        margin: 10px 0 0;
        color: #20342a;
        font-size: clamp(43px, 5vw, 66px);
        line-height: 0.94;
        letter-spacing: -0.07em;
      }

      .createEventHeader p {
        max-width: 620px;
        margin: 17px 0 0;
        color: #7b877f;
        font-size: 12px;
        line-height: 1.65;
      }

      .draftBadge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 39px;
        padding: 0 12px;
        border: 1px solid #d7e1d2;
        border-radius: 12px;
        background: #f1f6eb;
        color: #597244;
        font-size: 9px;
        font-weight: 850;
      }

      .mobileBackButton {
        display: none;
      }

      .createEventForm {
        display: grid;
        gap: 20px;
      }

      .eventFormSection {
        padding: 25px;
        border: 1px solid #dce4d9;
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 12px 34px rgba(31, 51, 38, 0.045);
      }

      .eventFormHeading {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        margin-bottom: 23px;
      }

      .eventFormHeading > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 43px;
        height: 43px;
        border-radius: 14px;
        background: #e7f0dc;
        color: #5d7a43;
      }

      .eventFormHeading small {
        display: block;
        color: #7f9d5c;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .eventFormHeading h2 {
        margin: 6px 0 0;
        color: #2b4033;
        font-size: 22px;
        line-height: 1.05;
        letter-spacing: -0.04em;
      }

      .eventFormHeading p {
        margin: 7px 0 0;
        color: #89938c;
        font-size: 9px;
        line-height: 1.55;
      }

      .eventFieldsGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 15px;
      }

      .createEventField {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      .createEventLabel {
        color: #495c50;
        font-size: 9px;
        font-weight: 850;
      }

      .createEventLabel strong {
        margin-left: 3px;
        color: #9e453c;
      }

      .createEventInputWrapper,
      .createEventTextareaWrapper {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .createEventInputIcon,
      .createEventTextareaWrapper > span {
        position: absolute;
        left: 14px;
        z-index: 1;
        display: grid;
        place-items: center;
        color: #829078;
        pointer-events: none;
      }

      .createEventTextareaWrapper > span {
        top: 15px;
      }

      .createEventInputWrapper input,
      .createEventTextareaWrapper textarea {
        width: 100%;
        border: 1px solid #d9e1d6;
        outline: none;
        background: #f8faf6;
        color: #25382d;
        transition: 0.18s ease;
      }

      .createEventInputWrapper input {
        min-height: 51px;
        padding: 0 14px 0 43px;
        border-radius: 14px;
        font-size: 11px;
      }

      .createEventTextareaWrapper textarea {
        min-height: 165px;
        resize: vertical;
        padding: 14px 14px 14px 43px;
        border-radius: 15px;
        font-size: 11px;
        line-height: 1.65;
      }

      .createEventInputWrapper input:focus,
      .createEventTextareaWrapper textarea:focus {
        border-color: #86a36b;
        background: white;
        box-shadow: 0 0 0 4px rgba(134, 163, 107, 0.1);
      }

      .createEventInputWrapper input::placeholder,
      .createEventTextareaWrapper textarea::placeholder {
        color: #a2aaa4;
      }

      .createEventHint {
        color: #959e97;
        font-size: 8px;
        line-height: 1.5;
      }

      .eventDescriptionField {
        position: relative;
      }

      .descriptionCount {
        position: absolute;
        right: 12px;
        bottom: 10px;
        padding: 4px 7px;
        border-radius: 8px;
        background: rgba(248, 250, 246, 0.9);
        color: #939d95;
        font-size: 7px;
      }

      .eventUpload {
        display: flex;
        align-items: center;
        gap: 13px;
        min-height: 105px;
        padding: 15px;
        border: 1px dashed #bdc9b8;
        border-radius: 17px;
        background: #f9faf7;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .eventUpload:hover {
        border-color: #789a59;
        background: white;
      }

      .eventUpload.selected {
        border-style: solid;
        border-color: #97af83;
        background: #f0f6e9;
      }

      .eventUpload input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .eventUploadIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: #e7f0dc;
        color: #5c7842;
      }

      .eventUpload.selected .eventUploadIcon {
        background: #dceacd;
        color: #4c6c34;
      }

      .eventUploadCopy {
        min-width: 0;
        flex: 1;
      }

      .eventUploadCopy strong,
      .eventUploadCopy small {
        display: block;
      }

      .eventUploadCopy strong {
        overflow: hidden;
        color: #415448;
        font-size: 10px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .eventUploadCopy small {
        margin-top: 5px;
        color: #929b94;
        font-size: 8px;
        line-height: 1.5;
      }

      .eventUploadAction {
        flex: 0 0 auto;
        padding: 9px 11px;
        border: 1px solid #d6dfd2;
        border-radius: 10px;
        background: white;
        color: #53665a;
        font-size: 8px;
        font-weight: 850;
      }

      .removeEventCover {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        padding: 8px 10px;
        border: 0;
        border-radius: 9px;
        background: #fff0ee;
        color: #9a463c;
        cursor: pointer;
        font-size: 8px;
        font-weight: 800;
      }

      .createEventError {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        padding: 14px;
        border: 1px solid #efc7c2;
        border-radius: 16px;
        background: #fff0ee;
        color: #963f35;
      }

      .createEventError > span {
        display: grid;
        place-items: center;
        width: 33px;
        height: 33px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .createEventError p {
        margin: 0;
        font-size: 10px;
        line-height: 1.5;
      }

      .createEventError button {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }

      .createEventActions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
      }

      .cancelEventButton,
      .publishEventButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 14px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 900;
        transition: 0.18s ease;
      }

      .cancelEventButton {
        border: 1px solid #d6dfd3;
        background: white;
        color: #59685f;
      }

      .cancelEventButton:hover:not(:disabled) {
        border-color: #a3b09d;
      }

      .publishEventButton {
        min-width: 190px;
        border: 1px solid #183a27;
        background: #183a27;
        color: white;
        box-shadow: 0 12px 27px rgba(24, 58, 39, 0.17);
      }

      .publishEventButton:hover:not(:disabled) {
        gap: 12px;
        background: #234d35;
        transform: translateY(-2px);
      }

      .cancelEventButton:disabled,
      .publishEventButton:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .publishLoader {
        width: 15px;
        height: 15px;
        border: 2px solid rgba(255, 255, 255, 0.25);
        border-top-color: white;
        border-radius: 50%;
        animation: createEventSpin 0.75s linear infinite;
      }

      .eventSecurityNotice {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #89938c;
        font-size: 8px;
        text-align: center;
      }

      .eventSecurityNotice svg {
        color: #779357;
      }

      .eventSecurityNotice p {
        margin: 0;
      }

      .createEventStatePage {
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(
            circle at top left,
            rgba(166, 203, 126, 0.18),
            transparent 30%
          ),
          #f1f3ec;
      }

      .createEventStateCard {
        display: grid;
        place-items: center;
        width: min(500px, 100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.82);
        text-align: center;
        box-shadow: 0 20px 60px rgba(28, 48, 35, 0.08);
      }

      .createEventLoader {
        width: 37px;
        height: 37px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation: createEventSpin 0.8s linear infinite;
      }

      @keyframes createEventSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .createEventStateCard h1 {
        margin: 18px 0 0;
        color: #24372c;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .createEventStateCard p {
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
      }

      @media (max-width: 1000px) {
        .createEventShell {
          grid-template-columns:
            minmax(310px, 0.68fr)
            minmax(0, 1.32fr);
        }

        .previewDetails {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 850px) {
        .createEventPage {
          padding: 18px;
        }

        .createEventShell {
          display: block;
          min-height: auto;
        }

        .eventPreviewImage {
          height: 360px;
        }

        .previewDetails {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 680px) {
        .createEventPage {
          padding: 0;
        }

        .createEventShell {
          border: 0;
          border-radius: 0;
        }

        .eventPreviewPanel {
          display: none;
        }

        .createEventContent {
          padding: 27px 20px 45px;
        }

        .createEventHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .mobileBackButton {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          margin-bottom: 20px;
          padding: 0;
          border: 1px solid #d7dfd4;
          border-radius: 12px;
          background: white;
          color: #405449;
          cursor: pointer;
        }

        .createEventBrand {
          margin-bottom: 28px;
        }

        .eventFieldsGrid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 460px) {
        .createEventContent {
          padding: 24px 14px 40px;
        }

        .createEventHeader h1 {
          font-size: 43px;
        }

        .eventFormSection {
          padding: 19px;
          border-radius: 21px;
        }

        .eventUpload {
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .eventUploadCopy {
          width: calc(100% - 68px);
          flex: none;
        }

        .eventUploadAction {
          margin-left: 65px;
        }

        .createEventActions {
          align-items: stretch;
          flex-direction: column-reverse;
        }

        .cancelEventButton,
        .publishEventButton {
          width: 100%;
        }

        .eventSecurityNotice {
          align-items: flex-start;
          text-align: left;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation: none !important;
          scroll-behavior: auto !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}