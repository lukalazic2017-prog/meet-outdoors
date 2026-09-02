import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&auto=format&fit=crop";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
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
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
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
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 15H6L5 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
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
    arrowLeft: (
      <>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
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

function createSlug(value = "") {
  const transliteration = {
    č: "c",
    ć: "c",
    š: "s",
    ž: "z",
    đ: "dj",
    Č: "c",
    Ć: "c",
    Š: "s",
    Ž: "z",
    Đ: "dj",
  };

  return value
    .split("")
    .map((char) => transliteration[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function createUniquePackageSlug(title) {
  const baseSlug = createSlug(title) || `paket-${Date.now()}`;
  let candidate = baseSlug;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await supabase
      .from("packages")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;

    candidate = `${baseSlug}-${attempt + 2}`;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

export default function CreatePackage() {
  const navigate = useNavigate();
  const { profile, isHost } = useAuth();

  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState(null);

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
  });

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

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!profile?.id) return;

    try {
      setSaving(true);

      let cover_url = null;

      if (coverFile) {
        const safeName = coverFile.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9.-]/g, "");

        const fileName = `${profile.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("package-covers")
          .upload(fileName, coverFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("package-covers")
          .getPublicUrl(fileName);

        cover_url = publicUrlData.publicUrl;
      }

      const slug = await createUniquePackageSlug(form.title);

      const { data: createdPackage, error } = await supabase
        .from("packages")
        .insert({
          host_id: profile.id,
          title: form.title,
          slug,
          description: form.description,
          location: form.location,
          country: form.country,
          price: Number(form.price || 0),
          capacity: Number(form.capacity || 1),
          duration: form.duration,
          includes: form.includes,
          not_included: form.not_included,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          cover_url,
        })
        .select("id, slug")
        .single();

      if (error) throw error;

      navigate(
        createdPackage?.slug
          ? `/paketi/${createdPackage.slug}`
          : `/package/${createdPackage.id}`
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const previewLocation = useMemo(
    () =>
      [form.location, form.country].filter(Boolean).join(", ") ||
      "Lokacija nije navedena",
    [form.location, form.country]
  );

  if (!isHost) {
    return (
      <>
        <CreatePackageStyles />

        <main className="createPackageStatePage">
          <div className="createPackageStateCard">
            <span className="createPackageStateIcon">
              <Icon name="shield" size={28} />
            </span>

            <h1>Pristup je namenjen hostovima</h1>

            <p>
              Samo host profili mogu da kreiraju nove pakete.
            </p>

            <Link to="/" className="createPackageStatePrimary">
              Nazad na početnu
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <CreatePackageStyles />

      <main className="createPackagePage">
        <section className="createPackageHero">
          <div className="createPackageHeroTop">
            <Link to="/" className="createPackageBrand">
              <span>
                <Icon name="compass" size={21} />
              </span>

              MeetOutdoors
            </Link>

            <Link
              to="/dashboard"
              className="createPackageBackLink"
            >
              <Icon name="arrowLeft" size={16} />
              Dashboard
            </Link>
          </div>

          <div className="createPackageHeroCopy">
            <span className="createPackageEyebrow">
              <span />
              Novi host paket
            </span>

            <h1>
              Pretvori ideju
              <br />
              u iskustvo.
            </h1>

            <p>
              Kreiraj paket sa jasnim detaljima, terminima,
              sadržajem i vizuelnim identitetom koji gostima odmah
              prenosi atmosferu.
            </p>
          </div>

          <div className="createPackageHeroStats">
            <article>
              <strong>{form.title || "Novi paket"}</strong>
              <span>radni naziv</span>
            </article>

            <article>
              <strong>€{form.price || 0}</strong>
              <span>planirana cena</span>
            </article>

            <article>
              <strong>{form.capacity || 1}</strong>
              <span>kapacitet</span>
            </article>
          </div>
        </section>

        <section className="createPackageContent">
          <div className="createPackageToolbar">
            <div>
              <span className="createPackageSectionLabel">
                Kreiranje paketa
              </span>

              <h2>Postavi temelje iskustva.</h2>

              <p>
                Popuni detalje i objavi paket u postojećem
                Supabase toku.
              </p>
            </div>

            <Link to="/packages">
              <Icon name="image" size={16} />
              Svi paketi
            </Link>
          </div>

          <div className="createPackageLayout">
            <form
              onSubmit={handleSubmit}
              className="createPackageForm"
            >
              <section className="createPackagePanel">
                <div className="createPackagePanelHeader">
                  <span className="createPackagePanelIcon">
                    <Icon name="sparkle" size={19} />
                  </span>

                  <div>
                    <small>Osnovne informacije</small>
                    <h2>Naziv i priča paketa.</h2>
                  </div>
                </div>

                <div className="createPackageFields">
                  <label className="createPackageField full">
                    <span>Naziv paketa</span>

                    <input
                      placeholder="Na primer: Vikend u planinama"
                      value={form.title}
                      onChange={(e) =>
                        updateField("title", e.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="createPackageField full">
                    <span>Opis</span>

                    <textarea
                      placeholder="Opiši doživljaj, atmosferu i ono što paket čini posebnim..."
                      value={form.description}
                      onChange={(e) =>
                        updateField(
                          "description",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="createPackagePanel">
                <div className="createPackagePanelHeader">
                  <span className="createPackagePanelIcon">
                    <Icon name="mapPin" size={19} />
                  </span>

                  <div>
                    <small>Lokacija i kapacitet</small>
                    <h2>Gde, koliko i po kojoj ceni.</h2>
                  </div>
                </div>

                <div className="createPackageFields">
                  <label className="createPackageField">
                    <span>Lokacija</span>

                    <input
                      placeholder="Grad, planina, jezero..."
                      value={form.location}
                      onChange={(e) =>
                        updateField(
                          "location",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label className="createPackageField">
                    <span>Država</span>

                    <input
                      placeholder="Država"
                      value={form.country}
                      onChange={(e) =>
                        updateField(
                          "country",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label className="createPackageField">
                    <span>Cena</span>

                    <div className="createPackageInputIcon">
                      <Icon name="euro" size={17} />

                      <input
                        type="number"
                        placeholder="0"
                        value={form.price}
                        onChange={(e) =>
                          updateField(
                            "price",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </label>

                  <label className="createPackageField">
                    <span>Kapacitet</span>

                    <div className="createPackageInputIcon">
                      <Icon name="users" size={17} />

                      <input
                        type="number"
                        placeholder="1"
                        value={form.capacity}
                        onChange={(e) =>
                          updateField(
                            "capacity",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </label>

                  <label className="createPackageField full">
                    <span>Trajanje</span>

                    <div className="createPackageInputIcon">
                      <Icon name="clock" size={17} />

                      <input
                        placeholder="3 dana, vikend, 5 noći..."
                        value={form.duration}
                        onChange={(e) =>
                          updateField(
                            "duration",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="createPackagePanel">
                <div className="createPackagePanelHeader">
                  <span className="createPackagePanelIcon">
                    <Icon name="list" size={19} />
                  </span>

                  <div>
                    <small>Sadržaj paketa</small>
                    <h2>Šta gost dobija.</h2>
                  </div>
                </div>

                <div className="createPackageFields">
                  <label className="createPackageField full">
                    <span>Uključeno</span>

                    <textarea
                      placeholder="Smeštaj, obroci, vodič, prevoz..."
                      value={form.includes}
                      onChange={(e) =>
                        updateField(
                          "includes",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label className="createPackageField full">
                    <span>Nije uključeno</span>

                    <textarea
                      placeholder="Lična oprema, dodatni troškovi..."
                      value={form.not_included}
                      onChange={(e) =>
                        updateField(
                          "not_included",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="createPackagePanel">
                <div className="createPackagePanelHeader">
                  <span className="createPackagePanelIcon">
                    <Icon name="calendar" size={19} />
                  </span>

                  <div>
                    <small>Termini i naslovna fotografija</small>
                    <h2>Vreme i vizuelni identitet.</h2>
                  </div>
                </div>

                <div className="createPackageFields">
                  <label className="createPackageField">
                    <span>Datum početka</span>

                    <input
                      type="datetime-local"
                      value={form.start_date}
                      onChange={(e) =>
                        updateField(
                          "start_date",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label className="createPackageField">
                    <span>Datum završetka</span>

                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(e) =>
                        updateField(
                          "end_date",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <div className="createPackageField full">
                    <span>Naslovna fotografija</span>

                    <label
                      className={
                        coverFile
                          ? "createPackageUpload selected"
                          : "createPackageUpload"
                      }
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setCoverFile(
                            e.target.files?.[0] || null
                          )
                        }
                      />

                      <span className="createPackageUploadPreview">
                        <img src={coverPreview} alt="" />
                      </span>

                      <span className="createPackageUploadCopy">
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
                            : "JPG, PNG ili WEBP. Fotografiju možeš izabrati sa telefona ili računara."}
                        </small>
                      </span>

                      <span className="createPackageUploadAction">
                        <Icon
                          name={coverFile ? "check" : "upload"}
                          size={17}
                        />
                        {coverFile ? "Promeni" : "Izaberi"}
                      </span>
                    </label>

                    {coverFile && (
                      <button
                        type="button"
                        className="removePackageCover"
                        onClick={() => setCoverFile(null)}
                      >
                        <Icon name="trash" size={15} />
                        Ukloni fotografiju
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <div className="createPackageSubmitBar">
                <div>
                  <span>Spremno za objavu</span>
                  <p>
                    Paket će nakon kreiranja biti dostupan na
                    stranici svih paketa.
                  </p>
                </div>

                <button type="submit" disabled={saving}>
                  <Icon name="plus" size={17} />
                  {saving
                    ? "Kreiranje..."
                    : "Kreiraj paket"}
                </button>
              </div>
            </form>

            <aside className="createPackagePreview">
              <span className="createPackageSectionLabel">
                Pregled paketa
              </span>

              <article className="createPackagePreviewCard">
                <div className="createPackagePreviewImage">
                  <img
                    src={coverPreview}
                    alt={form.title || "Package preview"}
                  />

                  <span>
                    <Icon name="sparkle" size={14} />
                    Live preview
                  </span>
                </div>

                <div className="createPackagePreviewBody">
                  <small>MeetOutdoors paket</small>

                  <h2>{form.title || "Naziv paketa"}</h2>

                  <p className="createPackagePreviewLocation">
                    <Icon name="mapPin" size={15} />
                    {previewLocation}
                  </p>

                  <div className="createPackagePreviewFacts">
                    <article>
                      <span>Cena</span>
                      <strong>€{form.price || 0}</strong>
                    </article>

                    <article>
                      <span>Kapacitet</span>
                      <strong>{form.capacity || 1}</strong>
                    </article>

                    <article>
                      <span>Trajanje</span>
                      <strong>
                        {form.duration || "Nije navedeno"}
                      </strong>
                    </article>
                  </div>
                </div>
              </article>

              <div className="createPackagePreviewHint">
                <Icon name="check" size={17} />

                <p>
                  Pregled se automatski menja dok popunjavaš
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

function CreatePackageStyles() {
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

      .createPackagePage,
      .createPackageStatePage {
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

      .createPackagePage {
        padding: 28px;
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

      .createPackagePage a {
        color: inherit;
        text-decoration: none;
      }

      .createPackageHero {
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
        box-shadow: 0 34px 90px rgba(23, 54, 36, 0.18);
      }

      .createPackageHero::before {
        position: absolute;
        top: -170px;
        right: -140px;
        z-index: -1;
        width: 550px;
        height: 550px;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 80px rgba(255, 255, 255, 0.02),
          0 0 0 160px rgba(255, 255, 255, 0.012);
      }

      .createPackageHeroTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }

      .createPackageBrand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: white !important;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .createPackageBrand > span {
        display: grid;
        place-items: center;
        width: 43px;
        height: 43px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.1);
        color: #cef39a;
        backdrop-filter: blur(14px);
      }

      .createPackageBackLink {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 14px;
        border: 1px solid rgba(255, 255, 255, 0.17);
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.1);
        color: white !important;
        font-size: 10px;
        font-weight: 850;
        backdrop-filter: blur(14px);
        transition: 0.2s ease;
      }

      .createPackageBackLink:hover {
        gap: 11px;
        background: rgba(255, 255, 255, 0.17);
      }

      .createPackageHeroCopy {
        max-width: 860px;
        padding-top: 105px;
      }

      .createPackageEyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.07);
        color: rgba(255, 255, 255, 0.76);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        backdrop-filter: blur(13px);
      }

      .createPackageEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow: 0 0 0 5px rgba(206, 243, 154, 0.12);
      }

      .createPackageHeroCopy h1 {
        margin: 24px 0 0;
        font-size: clamp(56px, 7.3vw, 94px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .createPackageHeroCopy p {
        max-width: 610px;
        margin: 25px 0 0;
        color: rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .createPackageHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .createPackageHeroStats article {
        padding: 17px;
        border: 1px solid rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background: rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .createPackageHeroStats strong,
      .createPackageHeroStats span {
        display: block;
      }

      .createPackageHeroStats strong {
        overflow: hidden;
        font-size: 18px;
        letter-spacing: -0.03em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .createPackageHeroStats span {
        margin-top: 6px;
        color: rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .createPackageContent {
        width: min(1140px, 100%);
        margin: 0 auto;
      }

      .createPackageToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 50px 0 22px;
      }

      .createPackageSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .createPackageToolbar h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size: clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .createPackageToolbar p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
      }

      .createPackageToolbar > a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 43px;
        padding: 0 15px;
        border: 1px solid #d5dfd1;
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.8);
        color: #4c6255;
        font-size: 9px;
        font-weight: 850;
      }

      .createPackageLayout {
        display: grid;
        grid-template-columns:
          minmax(0, 1.35fr)
          minmax(300px, 0.65fr);
        align-items: start;
        gap: 18px;
      }

      .createPackageForm {
        display: grid;
        gap: 18px;
      }

      .createPackagePanel {
        padding: 24px;
        border: 1px solid #dbe4d8;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.78);
        box-shadow: 0 14px 38px rgba(31, 51, 38, 0.05);
      }

      .createPackagePanelHeader {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .createPackagePanelIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 45px;
        height: 45px;
        border-radius: 14px;
        background: #e7f0dc;
        color: #608047;
      }

      .createPackagePanelHeader small {
        display: block;
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .createPackagePanelHeader h2 {
        margin: 5px 0 0;
        color: #33483b;
        font-size: 23px;
        letter-spacing: -0.045em;
      }

      .createPackageFields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .createPackageField {
        display: grid;
        gap: 7px;
      }

      .createPackageField.full {
        grid-column: 1 / -1;
      }

      .createPackageField > span {
        color: #5f6f65;
        font-size: 9px;
        font-weight: 850;
      }

      .createPackageField input,
      .createPackageField textarea {
        width: 100%;
        border: 1px solid #dbe4d8;
        border-radius: 14px;
        background: #f8faf6;
        color: #33483b;
        outline: none;
        transition: 0.2s ease;
      }

      .createPackageField input {
        min-height: 47px;
        padding: 0 13px;
      }

      .createPackageField textarea {
        min-height: 125px;
        padding: 13px;
        line-height: 1.65;
        resize: vertical;
      }

      .createPackageField input:focus,
      .createPackageField textarea:focus {
        border-color: #9db28f;
        background: white;
        box-shadow: 0 0 0 4px rgba(126, 158, 92, 0.1);
      }

      .createPackageInputIcon {
        position: relative;
        color: #789456;
      }

      .createPackageInputIcon > svg {
        position: absolute;
        top: 50%;
        left: 13px;
        z-index: 1;
        transform: translateY(-50%);
      }

      .createPackageInputIcon input {
        padding-left: 40px;
      }

      .createPackageUpload {
        position: relative;
        display: grid;
        grid-template-columns:
          92px minmax(0, 1fr) auto;
        align-items: center;
        gap: 14px;
        min-height: 112px;
        padding: 12px;
        overflow: hidden;
        border: 1px dashed #bac8b5;
        border-radius: 18px;
        background: #f8faf6;
        cursor: pointer;
        transition: 0.2s ease;
      }

      .createPackageUpload:hover {
        border-color: #86a36b;
        background: white;
      }

      .createPackageUpload.selected {
        border-style: solid;
        border-color: #9db28f;
        background: #f0f6e9;
      }

      .createPackageUpload > input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .createPackageUploadPreview {
        width: 92px;
        height: 82px;
        overflow: hidden;
        border-radius: 14px;
        background: #e5ebdf;
      }

      .createPackageUploadPreview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .createPackageUploadCopy {
        min-width: 0;
      }

      .createPackageUploadCopy strong,
      .createPackageUploadCopy small {
        display: block;
      }

      .createPackageUploadCopy strong {
        overflow: hidden;
        color: #3e5345;
        font-size: 10px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .createPackageUploadCopy small {
        margin-top: 6px;
        color: #8c978f;
        font-size: 8px;
        line-height: 1.55;
      }

      .createPackageUploadAction {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 39px;
        padding: 0 12px;
        border: 1px solid #d6dfd2;
        border-radius: 11px;
        background: white;
        color: #587143;
        font-size: 8px;
        font-weight: 850;
      }

      .removePackageCover {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        justify-self: start;
        margin-top: 9px;
        padding: 8px 10px;
        border: 0;
        border-radius: 9px;
        background: #fff0ee;
        color: #9a463c;
        cursor: pointer;
        font-size: 8px;
        font-weight: 800;
      }

      .createPackageSubmitBar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 20px;
        border: 1px solid #cbd9c5;
        border-radius: 22px;
        background: #e9f1e2;
      }

      .createPackageSubmitBar span {
        color: #52733f;
        font-size: 10px;
        font-weight: 850;
      }

      .createPackageSubmitBar p {
        margin: 5px 0 0;
        color: #788674;
        font-size: 9px;
      }

      .createPackageSubmitBar button {
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

      .createPackageSubmitBar button:hover:not(:disabled) {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .createPackageSubmitBar button:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .createPackagePreview {
        position: sticky;
        top: 18px;
      }

      .createPackagePreviewCard {
        margin-top: 12px;
        overflow: hidden;
        border: 1px solid #dbe4d8;
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 16px 42px rgba(31, 51, 38, 0.06);
      }

      .createPackagePreviewImage {
        position: relative;
        height: 250px;
        overflow: hidden;
      }

      .createPackagePreviewImage::after {
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

      .createPackagePreviewImage img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .createPackagePreviewImage > span {
        position: absolute;
        top: 14px;
        left: 14px;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 31px;
        padding: 0 10px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background: rgba(17, 44, 27, 0.44);
        color: white;
        font-size: 8px;
        font-weight: 850;
        backdrop-filter: blur(12px);
      }

      .createPackagePreviewBody {
        padding: 19px;
      }

      .createPackagePreviewBody > small {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .createPackagePreviewBody h2 {
        margin: 8px 0 0;
        color: #304538;
        font-size: 25px;
        line-height: 1.05;
        letter-spacing: -0.05em;
      }

      .createPackagePreviewLocation {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 10px 0 0;
        color: #768279;
        font-size: 9px;
      }

      .createPackagePreviewFacts {
        display: grid;
        gap: 8px;
        margin-top: 16px;
      }

      .createPackagePreviewFacts article {
        padding: 12px;
        border: 1px solid #e0e7dd;
        border-radius: 14px;
        background: #f8faf6;
      }

      .createPackagePreviewFacts span,
      .createPackagePreviewFacts strong {
        display: block;
      }

      .createPackagePreviewFacts span {
        color: #8b958e;
        font-size: 8px;
      }

      .createPackagePreviewFacts strong {
        margin-top: 4px;
        color: #405347;
        font-size: 10px;
      }

      .createPackagePreviewHint {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 12px;
        padding: 14px;
        border: 1px solid #d6e0d2;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.66);
        color: #608047;
      }

      .createPackagePreviewHint p {
        margin: 0;
        color: #748174;
        font-size: 9px;
        line-height: 1.55;
      }

      .createPackageStatePage {
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(
            circle at top left,
            rgba(166, 203, 126, 0.18),
            transparent 30%
          ),
          #edf1e9;
      }

      .createPackageStateCard {
        display: grid;
        place-items: center;
        width: min(500px, 100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.84);
        text-align: center;
        box-shadow: 0 20px 60px rgba(28, 48, 35, 0.08);
      }

      .createPackageStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .createPackageStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .createPackageStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      .createPackageStatePrimary {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 20px;
        padding: 12px 15px;
        border-radius: 12px;
        background: #183a27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
        text-decoration: none;
      }

      @media (max-width: 980px) {
        .createPackageLayout {
          grid-template-columns: 1fr;
        }

        .createPackagePreview {
          position: static;
        }

        .createPackageHeroStats {
          grid-template-columns: 1fr;
        }

        .createPackageHero {
          min-height: 720px;
        }
      }

      @media (max-width: 700px) {
        .createPackagePage {
          padding: 0 0 64px;
        }

        .createPackageHero {
          min-height: 750px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .createPackageHeroCopy {
          padding-top: 110px;
        }

        .createPackageHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .createPackageContent {
          padding: 0 18px;
        }

        .createPackageToolbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .createPackageFields {
          grid-template-columns: 1fr;
        }

        .createPackageField.full {
          grid-column: auto;
        }

        .createPackageSubmitBar {
          align-items: flex-start;
          flex-direction: column;
        }

        .createPackageSubmitBar button {
          width: 100%;
        }
      }

      @media (max-width: 520px) {
        .createPackageUpload {
          grid-template-columns: 76px minmax(0, 1fr);
        }

        .createPackageUploadPreview {
          width: 76px;
          height: 72px;
        }

        .createPackageUploadAction {
          grid-column: 1 / -1;
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        .createPackageHero {
          min-height: 790px;
          padding: 19px;
        }

        .createPackageHeroCopy h1 {
          font-size: 47px;
        }

        .createPackageBackLink {
          width: 42px;
          padding: 0;
          justify-content: center;
          font-size: 0;
        }

        .createPackageHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .createPackageContent {
          padding: 0 13px;
        }

        .createPackagePanel {
          padding: 20px;
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
