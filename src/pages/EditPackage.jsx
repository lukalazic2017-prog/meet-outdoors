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
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
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
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    gallery: (
      <>
        <rect
          x="3"
          y="3"
          width="14"
          height="14"
          rx="2"
        />
        <path d="m7 13 3-3 4 4" />
        <path d="M8 7h.01" />
        <path d="M7 21h12a2 2 0 0 0 2-2V7" />
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

function LoadingState() {
  return (
    <>
      <EditPackageStyles />

      <main className="editPackageStatePage">
        <div className="editPackageStateCard">
          <span className="editPackageLoader" />

          <h1>Učitavanje paketa</h1>

          <p>
            Pripremamo podatke za uređivanje.
          </p>
        </div>
      </main>
    </>
  );
}

export default function EditPackage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    profile,
    isHost,
    loading: authLoading,
  } = useAuth();

  const [item, setItem] = useState(null);
  const [pageLoading, setPageLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    country: "",
    price: "",
    capacity: "",
    duration: "",
    includes: "",
    not_included: "",
    start_date: "",
    end_date: "",
    cover_url: "",
  });

  const loadPackage = useCallback(async () => {
    if (authLoading) return;

    if (!profile?.id || !id) {
      setItem(null);
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
        .from("packages")
        .select("*")
        .eq("id", id)
        .single();

      if (loadError) {
        throw loadError;
      }

      if (!data) {
        throw new Error(
          "Paket nije pronađen."
        );
      }

      if (data.host_id !== profile.id) {
        throw new Error(
          "Možeš da uređuješ samo svoje pakete."
        );
      }

      setItem(data);

      setForm({
        title: data.title || "",
        description:
          data.description || "",
        location: data.location || "",
        country: data.country || "",
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
        duration: data.duration || "",
        includes: data.includes || "",
        not_included:
          data.not_included || "",
        start_date: toLocalInputValue(
          data.start_date
        ),
        end_date: toLocalInputValue(
          data.end_date
        ),
        cover_url: data.cover_url || "",
      });
    } catch (loadError) {
      console.error(
        "Greška pri učitavanju paketa:",
        loadError
      );

      setItem(null);
      setError(
        loadError?.message ||
          "Paket trenutno nije moguće učitati."
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
    loadPackage();
  }, [loadPackage]);

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    if (
      !item?.id ||
      !profile?.id ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const title = form.title.trim();

      if (!title) {
        throw new Error(
          "Naziv paketa je obavezan."
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

      const {
        data: updatedPackage,
        error: updateError,
      } = await supabase
        .from("packages")
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
          duration:
            form.duration.trim(),
          includes:
            form.includes.trim(),
          not_included:
            form.not_included.trim(),
          start_date: startDate,
          end_date: endDate,
          cover_url:
            form.cover_url.trim(),
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("host_id", profile.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!updatedPackage) {
        throw new Error(
          "Paket nije ažuriran. Proveri dozvole i vlasništvo."
        );
      }

      navigate(`/package/${item.id}`);
    } catch (saveError) {
      console.error(
        "Greška pri čuvanju paketa:",
        saveError
      );

      setError(
        saveError?.message ||
          "Paket nije moguće ažurirati."
      );
    } finally {
      setSaving(false);
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

  if (authLoading || pageLoading) {
    return <LoadingState />;
  }

  if (!isHost) {
    return (
      <>
        <EditPackageStyles />

        <main className="editPackageStatePage">
          <div className="editPackageStateCard">
            <span className="editPackageStateIcon">
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
              uređuju pakete.
            </p>

            <Link
              to="/"
              className="editPackageStatePrimary"
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

  if (!item) {
    return (
      <>
        <EditPackageStyles />

        <main className="editPackageStatePage">
          <div className="editPackageStateCard">
            <span className="editPackageStateIcon danger">
              <Icon
                name="alert"
                size={28}
              />
            </span>

            <h1>
              Paket nije moguće urediti
            </h1>

            <p>
              {error ||
                "Paket ne postoji ili nemaš dozvolu da ga uređuješ."}
            </p>

            <div className="editPackageStateActions">
              <button
                type="button"
                onClick={loadPackage}
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
      <EditPackageStyles />

      <main className="editPackagePage">
        <section className="editPackageHero">
          <div className="editPackageHeroCopy">
            <span className="editPackageEyebrow">
              <span />
              Host uređivanje
            </span>

            <h1>
              Doradi detalje.
              <br />
              Zadrži doživljaj.
            </h1>

            <p>
              Ažuriraj sadržaj, cenu,
              termine i vizuelni identitet
              paketa bez menjanja njegove
              osnovne logike.
            </p>
          </div>

          <div className="editPackageHeroStats">
            <article>
              <strong>
                {form.title || "Paket"}
              </strong>
              <span>aktivni paket</span>
            </article>

            <article>
              <strong>
                €{form.price || 0}
              </strong>
              <span>trenutna cena</span>
            </article>

            <article>
              <strong>
                {form.capacity || 1}
              </strong>
              <span>kapacitet</span>
            </article>
          </div>
        </section>

        <section className="editPackageContent">
          <div className="editPackageToolbar">
            <div>
              <span className="editPackageSectionLabel">
                Uredi paket
              </span>

              <h2>
                Detalji koji oblikuju
                iskustvo.
              </h2>

              <p>
                Izmene se čuvaju direktno u
                postojećem paketu.
              </p>
            </div>

            <div className="editPackageToolbarActions">
              <Link
                to={`/edit-package/${id}/gallery`}
              >
                <Icon
                  name="gallery"
                  size={16}
                />
                Uredi galeriju
              </Link>

              <Link
                to={`/package/${id}`}
              >
                <Icon
                  name="image"
                  size={16}
                />
                Pogledaj paket
              </Link>
            </div>
          </div>

          <div className="editPackageLayout">
            <form
              onSubmit={handleSave}
              className="editPackageForm"
            >
              <section className="editPackagePanel">
                <div className="editPackagePanelHeader">
                  <span className="editPackagePanelIcon">
                    <Icon
                      name="edit"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Osnovne informacije
                    </small>

                    <h2>Naziv i opis.</h2>
                  </div>
                </div>

                <div className="editPackageFields">
                  <label className="editPackageField full">
                    <span>
                      Naziv paketa
                    </span>

                    <input
                      value={form.title}
                      onChange={(event) =>
                        updateField(
                          "title",
                          event.target.value
                        )
                      }
                      required
                    />
                  </label>

                  <label className="editPackageField full">
                    <span>Opis</span>

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(event) =>
                        updateField(
                          "description",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="editPackagePanel">
                <div className="editPackagePanelHeader">
                  <span className="editPackagePanelIcon">
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

                <div className="editPackageFields">
                  <label className="editPackageField">
                    <span>Lokacija</span>

                    <input
                      value={
                        form.location
                      }
                      onChange={(event) =>
                        updateField(
                          "location",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="editPackageField">
                    <span>Država</span>

                    <input
                      value={form.country}
                      onChange={(event) =>
                        updateField(
                          "country",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="editPackageField">
                    <span>Cena</span>

                    <div className="editPackageInputIcon">
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
                        onChange={(event) =>
                          updateField(
                            "price",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </label>

                  <label className="editPackageField">
                    <span>Kapacitet</span>

                    <div className="editPackageInputIcon">
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
                        onChange={(event) =>
                          updateField(
                            "capacity",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </label>

                  <label className="editPackageField full">
                    <span>Trajanje</span>

                    <div className="editPackageInputIcon">
                      <Icon
                        name="clock"
                        size={17}
                      />

                      <input
                        value={
                          form.duration
                        }
                        onChange={(event) =>
                          updateField(
                            "duration",
                            event.target.value
                          )
                        }
                        placeholder="Na primer: 3 dana / 2 noći"
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="editPackagePanel">
                <div className="editPackagePanelHeader">
                  <span className="editPackagePanelIcon">
                    <Icon
                      name="list"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Sadržaj paketa
                    </small>

                    <h2>
                      Šta je uključeno.
                    </h2>
                  </div>
                </div>

                <div className="editPackageFields">
                  <label className="editPackageField full">
                    <span>Uključeno</span>

                    <textarea
                      value={
                        form.includes
                      }
                      onChange={(event) =>
                        updateField(
                          "includes",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="editPackageField full">
                    <span>
                      Nije uključeno
                    </span>

                    <textarea
                      value={
                        form.not_included
                      }
                      onChange={(event) =>
                        updateField(
                          "not_included",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="editPackagePanel">
                <div className="editPackagePanelHeader">
                  <span className="editPackagePanelIcon">
                    <Icon
                      name="calendar"
                      size={19}
                    />
                  </span>

                  <div>
                    <small>
                      Termini i naslovna
                      fotografija
                    </small>

                    <h2>
                      Vreme i vizuelni
                      identitet.
                    </h2>
                  </div>
                </div>

                <div className="editPackageFields">
                  <label className="editPackageField">
                    <span>
                      Datum početka
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        form.start_date
                      }
                      onChange={(event) =>
                        updateField(
                          "start_date",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="editPackageField">
                    <span>
                      Datum završetka
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        form.end_date
                      }
                      onChange={(event) =>
                        updateField(
                          "end_date",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="editPackageField full">
                    <span>
                      URL naslovne fotografije
                    </span>

                    <div className="editPackageInputIcon">
                      <Icon
                        name="image"
                        size={17}
                      />

                      <input
                        type="url"
                        value={
                          form.cover_url
                        }
                        onChange={(event) =>
                          updateField(
                            "cover_url",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </label>
                </div>
              </section>

              {error && (
                <div
                  className="editPackageError"
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

              <div className="editPackageSubmitBar">
                <div>
                  <span>
                    Spremno za čuvanje
                  </span>

                  <p>
                    Izmene će odmah biti
                    vidljive na stranici
                    paketa.
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

            <aside className="editPackagePreview">
              <span className="editPackageSectionLabel">
                Pregled paketa
              </span>

              <article className="editPackagePreviewCard">
                <div className="editPackagePreviewImage">
                  <img
                    src={
                      form.cover_url ||
                      FALLBACK_COVER
                    }
                    alt={
                      form.title ||
                      "Pregled paketa"
                    }
                    onError={(event) => {
                      event.currentTarget.src =
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

                <div className="editPackagePreviewBody">
                  <small>
                    MeetOutdoors paket
                  </small>

                  <h2>
                    {form.title ||
                      "Naziv paketa"}
                  </h2>

                  <p className="editPackagePreviewLocation">
                    <Icon
                      name="mapPin"
                      size={15}
                    />
                    {previewLocation}
                  </p>

                  <div className="editPackagePreviewFacts">
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
                        Trajanje
                      </span>
                      <strong>
                        {form.duration ||
                          "Nije navedeno"}
                      </strong>
                    </article>
                  </div>
                </div>
              </article>

              <div className="editPackagePreviewHint">
                <Icon
                  name="check"
                  size={17}
                />

                <p>
                  Pregled se automatski
                  menja dok popunjavaš
                  formu.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function EditPackageStyles() {
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

      .editPackagePage,
      .editPackageStatePage {
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

      .editPackagePage {
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

      .editPackagePage a {
        color: inherit;
        text-decoration: none;
      }

      .editPackageHero {
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

      .editPackageHero::before {
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

      .editPackageHeroCopy {
        max-width: 860px;
        padding-top: 105px;
      }

      .editPackageEyebrow {
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

      .editPackageEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow:
          0 0 0 5px
          rgba(206, 243, 154, 0.12);
      }

      .editPackageHeroCopy h1 {
        margin: 24px 0 0;
        font-size:
          clamp(56px, 7.3vw, 94px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .editPackageHeroCopy p {
        max-width: 610px;
        margin: 25px 0 0;
        color:
          rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .editPackageHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .editPackageHeroStats article {
        padding: 17px;
        border:
          1px solid
          rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background:
          rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .editPackageHeroStats strong,
      .editPackageHeroStats span {
        display: block;
      }

      .editPackageHeroStats strong {
        overflow: hidden;
        font-size: 18px;
        letter-spacing: -0.03em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .editPackageHeroStats span {
        margin-top: 6px;
        color:
          rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .editPackageContent {
        width: min(1140px, 100%);
        margin: 0 auto;
      }

      .editPackageToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 50px 0 22px;
      }

      .editPackageSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .editPackageToolbar h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size:
          clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .editPackageToolbar p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
      }

      .editPackageToolbarActions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .editPackageToolbarActions a {
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

      .editPackageLayout {
        display: grid;
        grid-template-columns:
          minmax(0, 1.35fr)
          minmax(300px, 0.65fr);
        align-items: start;
        gap: 18px;
      }

      .editPackageForm {
        display: grid;
        gap: 18px;
      }

      .editPackagePanel {
        padding: 24px;
        border: 1px solid #dbe4d8;
        border-radius: 26px;
        background:
          rgba(255, 255, 255, 0.78);
        box-shadow:
          0 14px 38px
          rgba(31, 51, 38, 0.05);
      }

      .editPackagePanelHeader {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .editPackagePanelIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 45px;
        height: 45px;
        border-radius: 14px;
        background: #e7f0dc;
        color: #608047;
      }

      .editPackagePanelHeader small {
        display: block;
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .editPackagePanelHeader h2 {
        margin: 5px 0 0;
        color: #33483b;
        font-size: 23px;
        letter-spacing: -0.045em;
      }

      .editPackageFields {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .editPackageField {
        display: grid;
        gap: 7px;
      }

      .editPackageField.full {
        grid-column: 1 / -1;
      }

      .editPackageField > span {
        color: #5f6f65;
        font-size: 9px;
        font-weight: 850;
      }

      .editPackageField input,
      .editPackageField textarea {
        width: 100%;
        border: 1px solid #dbe4d8;
        border-radius: 14px;
        background: #f8faf6;
        color: #33483b;
        outline: none;
        transition: 0.2s ease;
      }

      .editPackageField input {
        min-height: 47px;
        padding: 0 13px;
      }

      .editPackageField textarea {
        min-height: 125px;
        padding: 13px;
        line-height: 1.65;
        resize: vertical;
      }

      .editPackageField input:focus,
      .editPackageField textarea:focus {
        border-color: #9db28f;
        background: white;
        box-shadow:
          0 0 0 4px
          rgba(126, 158, 92, 0.1);
      }

      .editPackageInputIcon {
        position: relative;
        color: #789456;
      }

      .editPackageInputIcon > svg {
        position: absolute;
        top: 50%;
        left: 13px;
        z-index: 1;
        transform: translateY(-50%);
      }

      .editPackageInputIcon input {
        padding-left: 40px;
      }

      .editPackageError {
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

      .editPackageError > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .editPackageError p {
        margin: 0;
        font-size: 10px;
      }

      .editPackageSubmitBar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 20px;
        border: 1px solid #cbd9c5;
        border-radius: 22px;
        background: #e9f1e2;
      }

      .editPackageSubmitBar span {
        color: #52733f;
        font-size: 10px;
        font-weight: 850;
      }

      .editPackageSubmitBar p {
        margin: 5px 0 0;
        color: #788674;
        font-size: 9px;
      }

      .editPackageSubmitBar button {
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

      .editPackageSubmitBar
        button:hover:not(:disabled) {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .editPackageSubmitBar
        button:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .editPackagePreview {
        position: sticky;
        top: 108px;
      }

      .editPackagePreviewCard {
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

      .editPackagePreviewImage {
        position: relative;
        height: 250px;
        overflow: hidden;
      }

      .editPackagePreviewImage::after {
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

      .editPackagePreviewImage img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .editPackagePreviewImage > span {
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

      .editPackagePreviewBody {
        padding: 19px;
      }

      .editPackagePreviewBody > small {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .editPackagePreviewBody h2 {
        margin: 8px 0 0;
        color: #304538;
        font-size: 25px;
        line-height: 1.05;
        letter-spacing: -0.05em;
      }

      .editPackagePreviewLocation {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 10px 0 0;
        color: #768279;
        font-size: 9px;
      }

      .editPackagePreviewFacts {
        display: grid;
        gap: 8px;
        margin-top: 16px;
      }

      .editPackagePreviewFacts article {
        padding: 12px;
        border: 1px solid #e0e7dd;
        border-radius: 14px;
        background: #f8faf6;
      }

      .editPackagePreviewFacts span,
      .editPackagePreviewFacts strong {
        display: block;
      }

      .editPackagePreviewFacts span {
        color: #8b958e;
        font-size: 8px;
      }

      .editPackagePreviewFacts strong {
        margin-top: 4px;
        color: #405347;
        font-size: 10px;
      }

      .editPackagePreviewHint {
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

      .editPackagePreviewHint p {
        margin: 0;
        color: #748174;
        font-size: 9px;
        line-height: 1.55;
      }

      .editPackageStatePage {
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

      .editPackageStateCard {
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

      .editPackageLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          editPackageSpin
          0.8s linear infinite;
      }

      @keyframes editPackageSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .editPackageStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .editPackageStateIcon.danger {
        background: #ffe9e5;
        color: #a85247;
      }

      .editPackageStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .editPackageStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      .editPackageStatePrimary,
      .editPackageStateActions button,
      .editPackageStateActions a {
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

      .editPackageStatePrimary {
        margin-top: 20px;
        background: #183a27;
        color: white !important;
      }

      .editPackageStateActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 9px;
        margin-top: 20px;
      }

      .editPackageStateActions button {
        border: 0;
        background: #183a27;
        color: white;
        cursor: pointer;
      }

      .editPackageStateActions a {
        border: 1px solid #d5ded2;
        background: white;
        color: #51665a;
      }

      @media (max-width: 980px) {
        .editPackageLayout {
          grid-template-columns: 1fr;
        }

        .editPackagePreview {
          position: static;
        }

        .editPackageHeroStats {
          grid-template-columns: 1fr;
        }

        .editPackageHero {
          min-height: 720px;
        }
      }

      @media (max-width: 700px) {
        .editPackagePage {
          padding: 84px 0 64px;
        }

        .editPackageStatePage {
          padding-top: 84px;
        }

        .editPackageHero {
          min-height: 750px;
          padding: 24px;
          border-radius:
            0 0 32px 32px;
        }

        .editPackageHeroCopy {
          padding-top: 110px;
        }

        .editPackageHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .editPackageContent {
          padding: 0 18px;
        }

        .editPackageToolbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .editPackageFields {
          grid-template-columns: 1fr;
        }

        .editPackageField.full {
          grid-column: auto;
        }

        .editPackageSubmitBar {
          align-items: flex-start;
          flex-direction: column;
        }

        .editPackageSubmitBar button {
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        .editPackageHero {
          min-height: 790px;
          padding: 19px;
        }

        .editPackageHeroCopy h1 {
          font-size: 47px;
        }

        .editPackageHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .editPackageContent {
          padding: 0 13px;
        }

        .editPackageToolbarActions {
          width: 100%;
        }

        .editPackageToolbarActions a {
          flex: 1;
          justify-content: center;
        }

        .editPackagePanel {
          padding: 20px;
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
