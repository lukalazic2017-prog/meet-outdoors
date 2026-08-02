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
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&auto=format&fit=crop";

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
}) {
  const icons = {
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    euro: (
      <>
        <path d="M18 7.5A6 6 0 1 0 18 16.5" />
        <path d="M5 10h8M5 14h8" />
      </>
    ),
    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    image: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
        />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 15H6L5 6" />
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

function toLocalInputValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16);
}

function toIsoValue(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function formatPreviewDate(value) {
  if (!value) return "Nije postavljeno";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Nije postavljeno";
  }

  return new Intl.DateTimeFormat(
    "sr-Latn-RS",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function getFileExtension(file) {
  const fromName = file?.name
    ?.split(".")
    .pop()
    ?.toLowerCase();

  if (fromName) {
    return fromName;
  }

  const fromType = file?.type
    ?.split("/")
    .pop()
    ?.toLowerCase();

  return fromType || "jpg";
}

function LoadingState() {
  return (
    <>
      <EditEventStyles />

      <main className="editEventStatePage">
        <div className="editEventStateCard">
          <span className="editEventLoader" />

          <h1>Učitavanje događaja</h1>

          <p>
            Pripremamo podatke za
            uređivanje.
          </p>
        </div>
      </main>
    </>
  );
}

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    profile,
    isHost,
    loading: authLoading,
  } = useAuth();

  const [event, setEvent] =
    useState(null);
  const [pageLoading, setPageLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [coverFile, setCoverFile] =
    useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    country: "",
    price: "",
    capacity: "",
    start_date: "",
    end_date: "",
  });

  const loadEvent = useCallback(async () => {
    if (authLoading) return;

    if (!profile?.id || !id) {
      setEvent(null);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setError("");

    try {
      const {
        data,
        error: loadError,
      } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (loadError) {
        throw loadError;
      }

      if (!data) {
        throw new Error(
          "Događaj nije pronađen."
        );
      }

      if (data.host_id !== profile.id) {
        throw new Error(
          "Možeš da uređuješ samo svoje događaje."
        );
      }

      setEvent(data);
      setCoverFile(null);

      setForm({
        title: data.title || "",
        description:
          data.description || "",
        location:
          data.location || "",
        country:
          data.country || "",
        price:
          data.price === null ||
          data.price === undefined
            ? ""
            : String(data.price),
        capacity:
          data.capacity === null ||
          data.capacity === undefined
            ? ""
            : String(data.capacity),
        start_date: toLocalInputValue(
          data.start_date
        ),
        end_date: toLocalInputValue(
          data.end_date
        ),
      });
    } catch (loadError) {
      console.error(
        "Greška pri učitavanju događaja:",
        loadError
      );

      setEvent(null);
      setError(
        loadError?.message ||
          "Događaj trenutno nije moguće učitati."
      );
    } finally {
      setPageLoading(false);
    }
  }, [
    authLoading,
    id,
    profile?.id,
  ]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  const previewLocation = useMemo(
    () =>
      [form.location, form.country]
        .filter(Boolean)
        .join(", ") ||
      "Lokacija nije navedena",
    [form.location, form.country]
  );

  const previewCover = useMemo(() => {
    if (coverFile) {
      return URL.createObjectURL(
        coverFile
      );
    }

    return (
      event?.cover_url ||
      FALLBACK_COVER
    );
  }, [
    coverFile,
    event?.cover_url,
  ]);

  useEffect(() => {
    return () => {
      if (
        coverFile &&
        previewCover.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          previewCover
        );
      }
    };
  }, [
    coverFile,
    previewCover,
  ]);

  async function uploadCover() {
    if (
      !coverFile ||
      !profile?.id ||
      !event?.id
    ) {
      return event?.cover_url || "";
    }

    const extension =
      getFileExtension(coverFile);

    const filePath = [
      profile.id,
      event.id,
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`,
    ].join("/");

    const {
      error: uploadError,
    } = await supabase.storage
      .from("event-covers")
      .upload(filePath, coverFile, {
        cacheControl: "3600",
        upsert: false,
        contentType:
          coverFile.type ||
          undefined,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from("event-covers")
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(
        "Nije moguće dobiti URL nove fotografije."
      );
    }

    return data.publicUrl;
  }

  async function handleSave(eventSubmit) {
    eventSubmit.preventDefault();

    if (
      !event?.id ||
      !profile?.id ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const title =
        form.title.trim();

      if (!title) {
        throw new Error(
          "Naziv događaja je obavezan."
        );
      }

      const price = Number(
        form.price || 0
      );
      const capacity = Number(
        form.capacity || 1
      );

      if (
        Number.isNaN(price) ||
        price < 0
      ) {
        throw new Error(
          "Cena mora biti pozitivan broj."
        );
      }

      if (
        Number.isNaN(capacity) ||
        capacity < 1
      ) {
        throw new Error(
          "Kapacitet mora biti najmanje 1."
        );
      }

      const startDate = toIsoValue(
        form.start_date
      );
      const endDate = toIsoValue(
        form.end_date
      );

      if (
        startDate &&
        endDate &&
        new Date(endDate).getTime() <
          new Date(startDate).getTime()
      ) {
        throw new Error(
          "Datum završetka ne može biti pre datuma početka."
        );
      }

      const coverUrl =
        await uploadCover();

      const {
        data: updatedEvent,
        error: updateError,
      } = await supabase
        .from("events")
        .update({
          title,
          description:
            form.description.trim(),
          location:
            form.location.trim(),
          country:
            form.country.trim(),
          price,
          capacity,
          start_date: startDate,
          end_date: endDate,
          cover_url: coverUrl,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", event.id)
        .eq("host_id", profile.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!updatedEvent) {
        throw new Error(
          "Događaj nije ažuriran. Proveri dozvole i vlasništvo."
        );
      }

      navigate(`/event/${event.id}`);
    } catch (saveError) {
      console.error(
        "Greška pri čuvanju događaja:",
        saveError
      );

      setError(
        saveError?.message ||
          "Događaj nije moguće ažurirati."
      );
    } finally {
      setSaving(false);
    }
  }

  if (
    authLoading ||
    pageLoading
  ) {
    return <LoadingState />;
  }

  if (!isHost) {
    return (
      <>
        <EditEventStyles />

        <main className="editEventStatePage">
          <div className="editEventStateCard">
            <span className="editEventStateIcon">
              <Icon
                name="shield"
                size={28}
              />
            </span>

            <h1>
              Pristup je namenjen hostovima
            </h1>

            <p>
              Samo host profili mogu da
              uređuju događaje.
            </p>

            <Link
              to="/"
              className="editEventStatePrimary"
            >
              Nazad na početnu

              <Icon
                name="arrowRight"
                size={16}
              />
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <EditEventStyles />

        <main className="editEventStatePage">
          <div className="editEventStateCard">
            <span className="editEventStateIcon danger">
              <Icon
                name="alert"
                size={28}
              />
            </span>

            <h1>
              Događaj nije moguće urediti
            </h1>

            <p>
              {error ||
                "Događaj ne postoji ili nemaš dozvolu da ga uređuješ."}
            </p>

            <div className="editEventStateActions">
              <button
                type="button"
                onClick={loadEvent}
              >
                <Icon
                  name="refresh"
                  size={16}
                />
                Pokušaj ponovo
              </button>

              <Link to="/dashboard">
                Otvori dashboard

                <Icon
                  name="arrowRight"
                  size={16}
                />
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <EditEventStyles />

      <main className="editEventPage">
        <section className="editEventHero">
          <div className="editEventHeroCopy">
            <span className="editEventEyebrow">
              <span />
              Host uređivanje
            </span>

            <h1>
              Uredi događaj.
              <br />
              Sačuvaj atmosferu.
            </h1>

            <p>
              Ažuriraj sadržaj, lokaciju,
              termine, cenu i naslovnu
              fotografiju bez menjanja
              postojeće poslovne logike.
            </p>
          </div>

          <div className="editEventHeroStats">
            <article>
              <strong>
                {form.title ||
                  "Događaj"}
              </strong>
              <span>
                aktivni događaj
              </span>
            </article>

            <article>
              <strong>
                €{form.price || 0}
              </strong>
              <span>
                trenutna cena
              </span>
            </article>

            <article>
              <strong>
                {form.capacity || 1}
              </strong>
              <span>kapacitet</span>
            </article>
          </div>
        </section>

        <section className="editEventContent">
          <div className="editEventToolbar">
            <div>
              <span className="editEventSectionLabel">
                Uredi događaj
              </span>

              <h2>
                Detalji koji vode
                iskustvo.
              </h2>

              <p>
                Izmene se čuvaju direktno
                u postojećem događaju.
              </p>
            </div>

            <Link
              to={`/event/${id}`}
            >
              <Icon
                name="image"
                size={16}
              />
              Pogledaj događaj
            </Link>
          </div>

          <div className="editEventLayout">
            <form
              onSubmit={handleSave}
              className="editEventForm"
            >
              <section className="editEventPanel">
                <div className="editEventPanelHeader">
                  <span className="editEventPanelIcon">
                    <Icon
                      name="edit"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Osnovne informacije
                    </small>

                    <h2>
                      Naziv i opis.
                    </h2>
                  </div>
                </div>

                <div className="editEventFields">
                  <label className="editEventField full">
                    <span>
                      Naziv događaja
                    </span>

                    <input
                      value={form.title}
                      onChange={(changeEvent) =>
                        updateField(
                          "title",
                          changeEvent
                            .target.value
                        )
                      }
                      required
                    />
                  </label>

                  <label className="editEventField full">
                    <span>Opis</span>

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(changeEvent) =>
                        updateField(
                          "description",
                          changeEvent
                            .target.value
                        )
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="editEventPanel">
                <div className="editEventPanelHeader">
                  <span className="editEventPanelIcon">
                    <Icon
                      name="mapPin"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Lokacija i kapacitet
                    </small>

                    <h2>
                      Gde i za koliko ljudi.
                    </h2>
                  </div>
                </div>

                <div className="editEventFields">
                  <label className="editEventField">
                    <span>
                      Lokacija
                    </span>

                    <input
                      value={
                        form.location
                      }
                      onChange={(changeEvent) =>
                        updateField(
                          "location",
                          changeEvent
                            .target.value
                        )
                      }
                    />
                  </label>

                  <label className="editEventField">
                    <span>Država</span>

                    <input
                      value={
                        form.country
                      }
                      onChange={(changeEvent) =>
                        updateField(
                          "country",
                          changeEvent
                            .target.value
                        )
                      }
                    />
                  </label>

                  <label className="editEventField">
                    <span>Cena</span>

                    <div className="editEventInputIcon">
                      <Icon
                        name="euro"
                        size={17}
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.price
                        }
                        onChange={(changeEvent) =>
                          updateField(
                            "price",
                            changeEvent
                              .target.value
                          )
                        }
                      />
                    </div>
                  </label>

                  <label className="editEventField">
                    <span>
                      Kapacitet
                    </span>

                    <div className="editEventInputIcon">
                      <Icon
                        name="users"
                        size={17}
                      />

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          form.capacity
                        }
                        onChange={(changeEvent) =>
                          updateField(
                            "capacity",
                            changeEvent
                              .target.value
                          )
                        }
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="editEventPanel">
                <div className="editEventPanelHeader">
                  <span className="editEventPanelIcon">
                    <Icon
                      name="calendar"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Termin događaja
                    </small>

                    <h2>
                      Početak i završetak.
                    </h2>
                  </div>
                </div>

                <div className="editEventFields">
                  <label className="editEventField">
                    <span>
                      Datum početka
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        form.start_date
                      }
                      onChange={(changeEvent) =>
                        updateField(
                          "start_date",
                          changeEvent
                            .target.value
                        )
                      }
                    />
                  </label>

                  <label className="editEventField">
                    <span>
                      Datum završetka
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        form.end_date
                      }
                      onChange={(changeEvent) =>
                        updateField(
                          "end_date",
                          changeEvent
                            .target.value
                        )
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="editEventPanel">
                <div className="editEventPanelHeader">
                  <span className="editEventPanelIcon">
                    <Icon
                      name="image"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Naslovna fotografija
                    </small>

                    <h2>
                      Osveži vizuelni identitet.
                    </h2>
                  </div>
                </div>

                <label className="editEventUpload">
                  <span className="editEventUploadIcon">
                    <Icon
                      name="upload"
                      size={22}
                    />
                  </span>

                  <div>
                    <strong>
                      {coverFile
                        ? coverFile.name
                        : "Izaberi novu fotografiju"}
                    </strong>

                    <p>
                      Trenutna fotografija
                      ostaje ako ne izabereš
                      novu.
                    </p>
                  </div>

                  <span className="editEventUploadAction">
                    Izaberi fajl
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(changeEvent) =>
                      setCoverFile(
                        changeEvent
                          .target.files?.[0] ||
                          null
                      )
                    }
                  />
                </label>

                {coverFile && (
                  <button
                    type="button"
                    className="editEventRemoveCover"
                    onClick={() =>
                      setCoverFile(null)
                    }
                  >
                    <Icon
                      name="trash"
                      size={14}
                    />
                    Ukloni izabranu fotografiju
                  </button>
                )}
              </section>

              {error && (
                <div
                  className="editEventError"
                  role="alert"
                >
                  <span>
                    <Icon
                      name="alert"
                      size={18}
                    />
                  </span>

                  <p>{error}</p>
                </div>
              )}

              <div className="editEventSubmitBar">
                <div>
                  <span>
                    Spremno za čuvanje
                  </span>

                  <p>
                    Izmene će odmah biti
                    vidljive na stranici
                    događaja.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                >
                  <Icon
                    name="check"
                    size={17}
                  />

                  {saving
                    ? "Čuvanje..."
                    : "Sačuvaj izmene"}
                </button>
              </div>
            </form>

            <aside className="editEventPreview">
              <span className="editEventSectionLabel">
                Pregled događaja
              </span>

              <article className="editEventPreviewCard">
                <div className="editEventPreviewImage">
                  <img
                    src={previewCover}
                    alt={
                      form.title ||
                      "Pregled događaja"
                    }
                    onError={(imageEvent) => {
                      imageEvent.currentTarget.src =
                        FALLBACK_COVER;
                    }}
                  />

                  <span>
                    <Icon
                      name="edit"
                      size={14}
                    />
                    Live preview
                  </span>
                </div>

                <div className="editEventPreviewBody">
                  <small>
                    MeetOutdoors događaj
                  </small>

                  <h2>
                    {form.title ||
                      "Naziv događaja"}
                  </h2>

                  <p className="editEventPreviewLocation">
                    <Icon
                      name="mapPin"
                      size={15}
                    />
                    {previewLocation}
                  </p>

                  <div className="editEventPreviewFacts">
                    <article>
                      <span>Cena</span>
                      <strong>
                        €{form.price || 0}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Kapacitet
                      </span>
                      <strong>
                        {form.capacity ||
                          1}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Početak
                      </span>
                      <strong>
                        {formatPreviewDate(
                          form.start_date
                        )}
                      </strong>
                    </article>
                  </div>
                </div>
              </article>

              <div className="editEventPreviewHint">
                <Icon
                  name="clock"
                  size={17}
                />

                <p>
                  Pregled se automatski
                  menja dok uređuješ formu.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function EditEventStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #edf1e9;
      }

      button,
      input,
      textarea {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .editEventPage,
      .editEventStatePage {
        min-height: 100vh;
        color: #203229;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .editEventPage {
        padding: 118px 28px 70px;
        background:
          radial-gradient(
            circle at 7% 0%,
            rgba(177, 211, 139, 0.18),
            transparent 27%
          ),
          radial-gradient(
            circle at 94% 25%,
            rgba(64, 106, 75, 0.1),
            transparent 24%
          ),
          #edf1e9;
      }

      .editEventPage a {
        color: inherit;
        text-decoration: none;
      }

      .editEventHero {
        position: relative;
        isolation: isolate;
        width: min(1200px, 100%);
        min-height: 600px;
        margin: 0 auto;
        padding: 34px;
        overflow: hidden;
        border-radius: 36px;
        background:
          radial-gradient(
            circle at 84% 17%,
            rgba(202, 241, 148, 0.14),
            transparent 27%
          ),
          linear-gradient(
            135deg,
            #0d2a1a,
            #173f28 58%,
            #28563a
          );
        color: white;
        box-shadow:
          0 34px 90px
          rgba(23, 54, 36, 0.18);
      }

      .editEventHero::before {
        position: absolute;
        top: -170px;
        right: -140px;
        z-index: -1;
        width: 550px;
        height: 550px;
        border:
          1px solid
          rgba(255, 255, 255, 0.07);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 80px
            rgba(255, 255, 255, 0.02),
          0 0 0 160px
            rgba(255, 255, 255, 0.012);
      }

      .editEventHeroCopy {
        max-width: 860px;
        padding-top: 105px;
      }

      .editEventEyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border:
          1px solid
          rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background:
          rgba(255, 255, 255, 0.07);
        color:
          rgba(255, 255, 255, 0.76);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        backdrop-filter: blur(13px);
      }

      .editEventEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow:
          0 0 0 5px
          rgba(206, 243, 154, 0.12);
      }

      .editEventHeroCopy h1 {
        margin: 24px 0 0;
        font-size:
          clamp(56px, 7.3vw, 94px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .editEventHeroCopy p {
        max-width: 610px;
        margin: 25px 0 0;
        color:
          rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .editEventHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .editEventHeroStats article {
        padding: 17px;
        border:
          1px solid
          rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background:
          rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .editEventHeroStats strong,
      .editEventHeroStats span {
        display: block;
      }

      .editEventHeroStats strong {
        overflow: hidden;
        font-size: 18px;
        letter-spacing: -0.03em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .editEventHeroStats span {
        margin-top: 6px;
        color:
          rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .editEventContent {
        width: min(1140px, 100%);
        margin: 0 auto;
      }

      .editEventToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 50px 0 22px;
      }

      .editEventSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .editEventToolbar h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size:
          clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .editEventToolbar p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
      }

      .editEventToolbar > a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 43px;
        padding: 0 15px;
        border: 1px solid #d5dfd1;
        border-radius: 13px;
        background:
          rgba(255, 255, 255, 0.8);
        color: #4c6255;
        font-size: 9px;
        font-weight: 850;
      }

      .editEventLayout {
        display: grid;
        grid-template-columns:
          minmax(0, 1.35fr)
          minmax(300px, 0.65fr);
        align-items: start;
        gap: 18px;
      }

      .editEventForm {
        display: grid;
        gap: 18px;
      }

      .editEventPanel {
        padding: 24px;
        border: 1px solid #dbe4d8;
        border-radius: 26px;
        background:
          rgba(255, 255, 255, 0.78);
        box-shadow:
          0 14px 38px
          rgba(31, 51, 38, 0.05);
      }

      .editEventPanelHeader {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .editEventPanelIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 45px;
        height: 45px;
        border-radius: 14px;
        background: #e7f0dc;
        color: #608047;
      }

      .editEventPanelHeader small {
        display: block;
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .editEventPanelHeader h2 {
        margin: 5px 0 0;
        color: #33483b;
        font-size: 23px;
        letter-spacing: -0.045em;
      }

      .editEventFields {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .editEventField {
        display: grid;
        gap: 7px;
      }

      .editEventField.full {
        grid-column: 1 / -1;
      }

      .editEventField > span {
        color: #5f6f65;
        font-size: 9px;
        font-weight: 850;
      }

      .editEventField input,
      .editEventField textarea {
        width: 100%;
        border: 1px solid #dbe4d8;
        border-radius: 14px;
        background: #f8faf6;
        color: #33483b;
        outline: none;
        transition: 0.2s ease;
      }

      .editEventField input {
        min-height: 47px;
        padding: 0 13px;
      }

      .editEventField textarea {
        min-height: 125px;
        padding: 13px;
        line-height: 1.65;
        resize: vertical;
      }

      .editEventField input:focus,
      .editEventField textarea:focus {
        border-color: #9db28f;
        background: white;
        box-shadow:
          0 0 0 4px
          rgba(126, 158, 92, 0.1);
      }

      .editEventInputIcon {
        position: relative;
        color: #789456;
      }

      .editEventInputIcon > svg {
        position: absolute;
        top: 50%;
        left: 13px;
        z-index: 1;
        transform: translateY(-50%);
      }

      .editEventInputIcon input {
        padding-left: 40px;
      }

      .editEventUpload {
        position: relative;
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 13px;
        padding: 16px;
        overflow: hidden;
        border: 1px dashed #c7d4c3;
        border-radius: 17px;
        background: #f8faf6;
        cursor: pointer;
      }

      .editEventUploadIcon {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: #e7f0dc;
        color: #608047;
      }

      .editEventUpload strong,
      .editEventUpload p {
        display: block;
      }

      .editEventUpload strong {
        color: #3d5144;
        font-size: 10px;
      }

      .editEventUpload p {
        margin: 4px 0 0;
        color: #8b958e;
        font-size: 8px;
      }

      .editEventUploadAction {
        min-height: 36px;
        padding: 0 12px;
        border-radius: 11px;
        background: #183a27;
        color: white;
        font-size: 9px;
        font-weight: 850;
        line-height: 36px;
      }

      .editEventUpload input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .editEventRemoveCover {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        padding: 8px 10px;
        border: 0;
        border-radius: 10px;
        background: #fff0ee;
        color: #9a463c;
        cursor: pointer;
        font-size: 8px;
        font-weight: 800;
      }

      .editEventError {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr);
        align-items: center;
        gap: 11px;
        padding: 14px;
        border: 1px solid #efc7c2;
        border-radius: 16px;
        background: #fff0ee;
        color: #963f35;
      }

      .editEventError > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .editEventError p {
        margin: 0;
        font-size: 10px;
      }

      .editEventSubmitBar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 20px;
        border: 1px solid #cbd9c5;
        border-radius: 22px;
        background: #e9f1e2;
      }

      .editEventSubmitBar span {
        color: #52733f;
        font-size: 10px;
        font-weight: 850;
      }

      .editEventSubmitBar p {
        margin: 5px 0 0;
        color: #788674;
        font-size: 9px;
      }

      .editEventSubmitBar button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 0 0 auto;
        min-height: 46px;
        padding: 0 17px;
        border: 0;
        border-radius: 14px;
        background: #183a27;
        color: white;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
        transition: 0.2s ease;
      }

      .editEventSubmitBar
        button:hover:not(:disabled) {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .editEventSubmitBar
        button:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .editEventPreview {
        position: sticky;
        top: 108px;
      }

      .editEventPreviewCard {
        margin-top: 12px;
        overflow: hidden;
        border: 1px solid #dbe4d8;
        border-radius: 25px;
        background:
          rgba(255, 255, 255, 0.8);
        box-shadow:
          0 16px 42px
          rgba(31, 51, 38, 0.06);
      }

      .editEventPreviewImage {
        position: relative;
        height: 250px;
        overflow: hidden;
      }

      .editEventPreviewImage::after {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            transparent 50%,
            rgba(11, 29, 18, 0.46)
          );
        content: "";
      }

      .editEventPreviewImage img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .editEventPreviewImage > span {
        position: absolute;
        top: 14px;
        left: 14px;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 31px;
        padding: 0 10px;
        border:
          1px solid
          rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background:
          rgba(17, 44, 27, 0.44);
        color: white;
        font-size: 8px;
        font-weight: 850;
        backdrop-filter: blur(12px);
      }

      .editEventPreviewBody {
        padding: 19px;
      }

      .editEventPreviewBody > small {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .editEventPreviewBody h2 {
        margin: 8px 0 0;
        color: #304538;
        font-size: 25px;
        line-height: 1.05;
        letter-spacing: -0.05em;
      }

      .editEventPreviewLocation {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 10px 0 0;
        color: #768279;
        font-size: 9px;
      }

      .editEventPreviewFacts {
        display: grid;
        gap: 8px;
        margin-top: 16px;
      }

      .editEventPreviewFacts article {
        padding: 12px;
        border: 1px solid #e0e7dd;
        border-radius: 14px;
        background: #f8faf6;
      }

      .editEventPreviewFacts span,
      .editEventPreviewFacts strong {
        display: block;
      }

      .editEventPreviewFacts span {
        color: #8b958e;
        font-size: 8px;
      }

      .editEventPreviewFacts strong {
        margin-top: 4px;
        color: #405347;
        font-size: 10px;
        line-height: 1.4;
      }

      .editEventPreviewHint {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 12px;
        padding: 14px;
        border: 1px solid #d6e0d2;
        border-radius: 16px;
        background:
          rgba(255, 255, 255, 0.66);
        color: #608047;
      }

      .editEventPreviewHint p {
        margin: 0;
        color: #748174;
        font-size: 9px;
        line-height: 1.55;
      }

      .editEventStatePage {
        display: grid;
        place-items: center;
        padding: 118px 24px 24px;
        background:
          radial-gradient(
            circle at top left,
            rgba(166, 203, 126, 0.18),
            transparent 30%
          ),
          #edf1e9;
      }

      .editEventStateCard {
        display: grid;
        place-items: center;
        width: min(500px, 100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background:
          rgba(255, 255, 255, 0.84);
        text-align: center;
        box-shadow:
          0 20px 60px
          rgba(28, 48, 35, 0.08);
      }

      .editEventLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          editEventSpin
          0.8s linear infinite;
      }

      @keyframes editEventSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .editEventStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .editEventStateIcon.danger {
        background: #ffe9e5;
        color: #a85247;
      }

      .editEventStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .editEventStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      .editEventStatePrimary,
      .editEventStateActions button,
      .editEventStateActions a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 850;
        text-decoration: none;
      }

      .editEventStatePrimary {
        margin-top: 20px;
        background: #183a27;
        color: white !important;
      }

      .editEventStateActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 9px;
        margin-top: 20px;
      }

      .editEventStateActions button {
        border: 0;
        background: #183a27;
        color: white;
        cursor: pointer;
      }

      .editEventStateActions a {
        border: 1px solid #d5ded2;
        background: white;
        color: #51665a;
      }

      @media (max-width: 980px) {
        .editEventLayout {
          grid-template-columns: 1fr;
        }

        .editEventPreview {
          position: static;
        }

        .editEventHeroStats {
          grid-template-columns: 1fr;
        }

        .editEventHero {
          min-height: 720px;
        }
      }

      @media (max-width: 700px) {
        .editEventPage {
          padding: 84px 0 64px;
        }

        .editEventStatePage {
          padding-top: 84px;
        }

        .editEventHero {
          min-height: 750px;
          padding: 24px;
          border-radius:
            0 0 32px 32px;
        }

        .editEventHeroCopy {
          padding-top: 110px;
        }

        .editEventHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .editEventContent {
          padding: 0 18px;
        }

        .editEventToolbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .editEventFields {
          grid-template-columns: 1fr;
        }

        .editEventField.full {
          grid-column: auto;
        }

        .editEventSubmitBar {
          align-items: flex-start;
          flex-direction: column;
        }

        .editEventSubmitBar button {
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        .editEventHero {
          min-height: 790px;
          padding: 19px;
        }

        .editEventHeroCopy h1 {
          font-size: 47px;
        }

        .editEventHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .editEventContent {
          padding: 0 13px;
        }

        .editEventPanel {
          padding: 20px;
        }

        .editEventUpload {
          grid-template-columns:
            auto minmax(0, 1fr);
        }

        .editEventUploadAction {
          grid-column: 1 / -1;
          text-align: center;
        }
      }

      @media (
        prefers-reduced-motion: reduce
      ) {
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
