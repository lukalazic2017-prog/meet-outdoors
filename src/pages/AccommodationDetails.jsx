import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SeoHead from "../seo/SeoHead";

const FALLBACK =
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1800&q=88";

const MAX_UNIT_PHOTOS = 6;

function money(value, suffix = "") {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return "Cena na upit";
  return `${new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(number)}${suffix}`;
}

function normalizeUrl(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function ContactPanel({ profile }) {
  const phone = profile?.phone
    ? `tel:${String(profile.phone).replace(/\s/g, "")}`
    : "";
  const instagram = normalizeUrl(profile?.instagram_url);
  const website = normalizeUrl(profile?.website_url);

  return (
    <aside className="contactPanel">
      <span className="eyebrow">DOMAĆIN</span>
      <h3 className="contactTitle">Kontaktiraj domaćina</h3>
      <div className="hostRow">
        <img src={profile?.avatar_url || FALLBACK} alt={profile?.full_name || "Domaćin"} />
        <div>
          <strong>{profile?.full_name || profile?.username || "MeetOutdoors host"}</strong>
          <small>{[profile?.city, profile?.country].filter(Boolean).join(", ")}</small>
        </div>
      </div>

      <div className="contactActions">
        {phone && <a href={phone}>Pozovi</a>}
        {instagram && <a href={instagram} target="_blank" rel="noreferrer">Instagram</a>}
        {website && <a href={website} target="_blank" rel="noreferrer">Web-sajt</a>}
      </div>

      {profile?.username && (
        <Link to={`/h/${profile.username}`} className="hostProfileLink">
          Pogledaj profil domaćina →
        </Link>
      )}
    </aside>
  );
}

function UnitEditor({ open, unit, hostId, accommodationId, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    max_guests: "",
    price_per_night: "",
    price_on_request: false,
  });
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      title: unit?.title || "",
      description: unit?.description || "",
      max_guests: unit?.max_guests ? String(unit.max_guests) : "",
      price_per_night:
        unit?.price_per_night !== null && unit?.price_per_night !== undefined
          ? String(unit.price_per_night)
          : "",
      price_on_request: Boolean(unit?.price_on_request),
    });
    const urls = [
      unit?.cover_url,
      ...(Array.isArray(unit?.gallery_urls) ? unit.gallery_urls : []),
    ].filter(Boolean);
    setPhotos(urls.map((url, index) => ({
      id: `existing-${index}-${url}`,
      url,
      file: null,
    })));
    setError("");
  }, [open, unit]);

  if (!open) return null;

  const addPhotos = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const invalid = files.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );
    if (invalid) {
      setError("Fotografije moraju biti JPG, PNG ili WEBP.");
      return;
    }
    const tooLarge = files.find((file) => file.size > 8 * 1024 * 1024);
    if (tooLarge) {
      setError("Svaka fotografija može imati najviše 8 MB.");
      return;
    }
    setPhotos((current) => {
      const room = Math.max(MAX_UNIT_PHOTOS - current.length, 0);
      return [
        ...current,
        ...files.slice(0, room).map((file, index) => ({
          id: `new-${Date.now()}-${index}`,
          url: URL.createObjectURL(file),
          file,
        })),
      ];
    });
  };

  const removePhoto = (index) => {
    setPhotos((current) => {
      const target = current[index];
      if (target?.file && target.url?.startsWith("blob:")) URL.revokeObjectURL(target.url);
      return current.filter((_, i) => i !== index);
    });
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Unesi naziv jedinice.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const urls = [];
      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        if (!photo.file) {
          urls.push(photo.url);
          continue;
        }

        const ext =
          photo.file.name.split(".").pop()?.toLowerCase() ||
          (photo.file.type === "image/png"
            ? "png"
            : photo.file.type === "image/webp"
              ? "webp"
              : "jpg");

        const path = `${hostId}/units/${accommodationId}/${Date.now()}-${i}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("host-accommodations")
          .upload(path, photo.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.file.type,
          });

        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("host-accommodations").getPublicUrl(path);
        urls.push(data.publicUrl);
      }

      const payload = {
        accommodation_id: accommodationId,
        host_id: hostId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        max_guests: form.max_guests ? Number(form.max_guests) : null,
        price_per_night: form.price_on_request
          ? null
          : form.price_per_night
            ? Number(form.price_per_night)
            : null,
        price_on_request: Boolean(form.price_on_request),
        cover_url: urls[0] || null,
        gallery_urls: urls.slice(1, MAX_UNIT_PHOTOS),
        updated_at: new Date().toISOString(),
      };

      let result;
      if (unit?.id) {
        result = await supabase
          .from("accommodation_units")
          .update(payload)
          .eq("id", unit.id)
          .eq("host_id", hostId)
          .select("*")
          .single();
      } else {
        result = await supabase
          .from("accommodation_units")
          .insert(payload)
          .select("*")
          .single();
      }

      if (result.error) throw result.error;
      onSaved(result.data);
      onClose();
    } catch (err) {
      setError(err?.message || "Jedinica nije sačuvana.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modalHead">
          <div>
            <span className="eyebrow">SMEŠTAJNA JEDINICA</span>
            <h2>{unit ? "Izmeni jedinicu" : "Dodaj jedinicu"}</h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={save}>
          <label>
            Naziv *
            <input
              value={form.title}
              onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
              placeholder="npr. Bungalov Deluxe"
              required
            />
          </label>

          <label>
            Opis
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
            />
          </label>

          <div className="formGrid">
            <label>
              Maks. gostiju
              <input
                type="number"
                min="1"
                value={form.max_guests}
                onChange={(e) => setForm((v) => ({ ...v, max_guests: e.target.value }))}
              />
            </label>
            <label>
              Cena / noć (€)
              <input
                type="number"
                min="0"
                value={form.price_per_night}
                disabled={form.price_on_request}
                onChange={(e) => setForm((v) => ({ ...v, price_per_night: e.target.value }))}
              />
            </label>
          </div>

          <label className="checkboxRow">
            <input
              type="checkbox"
              checked={form.price_on_request}
              onChange={(e) =>
                setForm((v) => ({ ...v, price_on_request: e.target.checked }))
              }
            />
            Cena na upit
          </label>

          <div className="photoEditor">
            <div className="photoEditorHead">
              <strong>Fotografije jedinice</strong>
              <span>{photos.length}/{MAX_UNIT_PHOTOS}</span>
            </div>
            <label className="uploadBox">
              Dodaj fotografije
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={addPhotos}
              />
            </label>
            {photos.length > 0 && (
              <div className="photoGrid">
                {photos.map((photo, index) => (
                  <div key={photo.id}>
                    <img src={photo.url} alt="" />
                    <button type="button" onClick={() => removePhoto(index)}>Ukloni</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="errorBox">{error}</div>}

          <div className="modalActions">
            <button type="button" className="secondary" onClick={onClose}>Odustani</button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "Čuvanje..." : "Sačuvaj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccommodationDetails() {
  const { id } = useParams();
  const [accommodation, setAccommodation] = useState(null);
  const [profile, setProfile] = useState(null);
  const [units, setUnits] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const { data: stay, error: stayError } = await supabase
        .from("host_accommodations")
        .select("*")
        .eq("id", id)
        .single();

      if (stayError) throw stayError;
      setAccommodation(stay);

      const [{ data: host }, { data: unitRows, error: unitsError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", stay.host_id).single(),
        supabase
          .from("accommodation_units")
          .select("*")
          .eq("accommodation_id", stay.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (unitsError) throw unitsError;
      setProfile(host || null);
      setUnits(unitRows || []);
    } catch (err) {
      console.error("Accommodation details:", err);
      setAccommodation(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const photos = useMemo(
    () =>
      Array.from(
        new Set(
          [
            accommodation?.cover_url,
            ...(Array.isArray(accommodation?.gallery_urls)
              ? accommodation.gallery_urls
              : []),
          ].filter(Boolean)
        )
      ),
    [accommodation]
  );

  const galleryPhotos = photos.length ? photos : [FALLBACK];

  useEffect(() => {
    // Osigurava da prethodni modal/lightbox ili HMR ne ostavi stranicu zaključanu.
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
    document.body.style.overflowX = "hidden";

    return () => {
      document.documentElement.style.overflowY = "";
      document.body.style.overflowY = "";
      document.body.style.overflowX = "";
    };
  }, []);

  useEffect(() => {
    setActivePhotoIndex(0);
    setLightboxOpen(false);
    setDescriptionExpanded(false);
  }, [accommodation?.id]);

  const showPreviousPhoto = () => {
    setActivePhotoIndex((current) =>
      (current - 1 + galleryPhotos.length) % galleryPhotos.length
    );
  };

  const showNextPhoto = () => {
    setActivePhotoIndex((current) =>
      (current + 1) % galleryPhotos.length
    );
  };

  if (loading) {
    return <main className="detailsState">Učitavanje smeštaja...</main>;
  }

  if (!accommodation) {
    return <main className="detailsState">Smeštaj nije pronađen.</main>;
  }

  const isOwner = userId === accommodation.host_id;

  const deleteUnit = async (unit) => {
    if (!isOwner || !window.confirm(`Obriši jedinicu "${unit.title}"?`)) return;
    const { error } = await supabase
      .from("accommodation_units")
      .delete()
      .eq("id", unit.id)
      .eq("host_id", accommodation.host_id);
    if (error) {
      window.alert(error.message);
      return;
    }
    setUnits((current) => current.filter((item) => item.id !== unit.id));
  };

  return (
    <>
      <SeoHead
        title={`${accommodation.title || "Smeštaj"} | MeetOutdoors`}
        description={accommodation.description || "Outdoor smeštaj na MeetOutdoors-u."}
      />

      <main className="detailsPage">
        <div className="detailsShell">
          <Link to={profile?.username ? `/h/${profile.username}` : "/"} className="backLink">
            ← Nazad na domaćina
          </Link>

          <section className="stayHero">
            <div className="stayHeroVisual">
              <button
                type="button"
                className="stayHeroImageButton"
                onClick={() => setLightboxOpen(true)}
                aria-label="Otvori galeriju smeštaja"
              >
                <img
                  src={galleryPhotos[activePhotoIndex]}
                  alt={accommodation.title || "Smeštaj"}
                />
              </button>

              <div className="stayHeroShade" />

              <div className="stayHeroTop">
                <span className="stayHeroBadge">
                  {accommodation.type || "Outdoor smeštaj"}
                </span>

                {galleryPhotos.length > 1 && (
                  <button
                    type="button"
                    className="stayHeroAll"
                    onClick={() => setLightboxOpen(true)}
                  >
                    Sve fotografije · {galleryPhotos.length}
                  </button>
                )}
              </div>

              <div className="stayHeroCopy">
                <div className="stayHeroLocation">
                  {accommodation.location || "Lokacija po dogovoru"}
                </div>
                <h1>{accommodation.title}</h1>
                <div className="stayHeroMeta">
                  <span>
                    {Number(accommodation.max_guests || 0) > 0
                      ? `Do ${accommodation.max_guests} gostiju`
                      : "Kapacitet po dogovoru"}
                  </span>
                  <i />
                  <strong>
                    {accommodation.price_on_request
                      ? "Cena na upit"
                      : money(accommodation.price_per_night, " / noć")}
                  </strong>
                </div>
              </div>

              {galleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="stayHeroArrow stayHeroArrowLeft"
                    onClick={showPreviousPhoto}
                    aria-label="Prethodna fotografija"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="stayHeroArrow stayHeroArrowRight"
                    onClick={showNextPhoto}
                    aria-label="Sledeća fotografija"
                  >
                    ›
                  </button>
                </>
              )}

              <div className="stayHeroCounter">
                {activePhotoIndex + 1} / {galleryPhotos.length}
              </div>
            </div>

            {galleryPhotos.length > 1 && (
              <div className="stayThumbRail" aria-label="Fotografije smeštaja">
                {galleryPhotos.map((photo, index) => (
                  <button
                    type="button"
                    key={`${photo}-${index}`}
                    className={`stayThumb ${index === activePhotoIndex ? "isActive" : ""}`}
                    onClick={() => setActivePhotoIndex(index)}
                    aria-label={`Prikaži fotografiju ${index + 1}`}
                  >
                    <img src={photo} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="detailsGrid">
            <section className="detailsContent">
              <div className="stayFacts">
                <div className="stayFact">
                  <span>Kapacitet</span>
                  <strong>
                    {Number(accommodation.max_guests || 0) > 0
                      ? `Do ${accommodation.max_guests} gostiju`
                      : "Po dogovoru"}
                  </strong>
                </div>

                <div className="stayFact">
                  <span>Cena</span>
                  <strong>
                    {accommodation.price_on_request
                      ? "Cena na upit"
                      : money(accommodation.price_per_night, " / noć")}
                  </strong>
                </div>

                <div className="stayFact">
                  <span>Smeštajne jedinice</span>
                  <strong>{units.length > 0 ? units.length : "1"}</strong>
                </div>
              </div>

              {accommodation.description && (
                <section className="infoBlock">
                  <span className="eyebrow">O SMEŠTAJU</span>
                  <h2>Prostor, atmosfera i boravak</h2>

                  <div
                    className={`descriptionWrap ${
                      descriptionExpanded ? "isExpanded" : ""
                    }`}
                  >
                    <p>{accommodation.description}</p>
                  </div>

                  {String(accommodation.description).trim().length > 260 && (
                    <button
                      type="button"
                      className="descriptionToggle"
                      onClick={() =>
                        setDescriptionExpanded((current) => !current)
                      }
                    >
                      {descriptionExpanded ? "Prikaži manje" : "Prikaži više"}
                      <span aria-hidden="true">
                        {descriptionExpanded ? "↑" : "↓"}
                      </span>
                    </button>
                  )}
                </section>
              )}


              {(units.length > 0 || isOwner) && (
                <>
                  <section className="unitsSection">
                <div className="sectionHead">
                  <div>
                    <span className="eyebrow">JEDINICE</span>
                    <h2>
                      {units.length > 0
                        ? "Izaberi smeštajnu jedinicu"
                        : "Dodaj smeštajne jedinice"}
                    </h2>
                    <p>
                      Jedinice su opcione. Vikendica može ostati jedan smeštaj, dok kompleks
                      može imati više bungalova, apartmana ili soba.
                    </p>
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      className="ownerButton"
                      onClick={() => {
                        setEditingUnit(null);
                        setEditorOpen(true);
                      }}
                    >
                      + Dodaj jedinicu
                    </button>
                  )}
                </div>

                {units.length > 0 && (
                  <div className="unitGrid">
                    {units.map((unit) => {
                      const unitPhotos = [
                        unit.cover_url,
                        ...(Array.isArray(unit.gallery_urls) ? unit.gallery_urls : []),
                      ].filter(Boolean);

                      return (
                        <article className="unitCard" key={unit.id}>
                          <img src={unitPhotos[0] || accommodation.cover_url || FALLBACK} alt={unit.title} />
                          <div className="unitBody">
                            <div className="unitTop">
                              <h3>{unit.title}</h3>
                              <strong>
                                {unit.price_on_request
                                  ? "Cena na upit"
                                  : money(unit.price_per_night, " / noć")}
                              </strong>
                            </div>
                            {unit.description && <p>{unit.description}</p>}
                            <small>
                              {unit.max_guests ? `Do ${unit.max_guests} gostiju` : "Kapacitet po dogovoru"}
                            </small>

                            {isOwner && (
                              <div className="ownerUnitActions">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUnit(unit);
                                    setEditorOpen(true);
                                  }}
                                >
                                  Izmeni
                                </button>
                                <button type="button" onClick={() => deleteUnit(unit)}>
                                  Obriši
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
                  </section>
                </>
              )}
            </section>

            <ContactPanel profile={profile} />
          </div>
        </div>
      </main>

      {lightboxOpen && (
        <div
          className="stayLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Galerija smeštaja"
          onMouseDown={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="lightboxClose"
            onClick={() => setLightboxOpen(false)}
            aria-label="Zatvori galeriju"
          >
            ×
          </button>

          {galleryPhotos.length > 1 && (
            <button
              type="button"
              className="lightboxNav lightboxPrev"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousPhoto();
              }}
              aria-label="Prethodna fotografija"
            >
              ‹
            </button>
          )}

          <div
            className="lightboxStage"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <img
              src={galleryPhotos[activePhotoIndex]}
              alt={`${accommodation.title || "Smeštaj"} - fotografija ${activePhotoIndex + 1}`}
            />
            <div className="lightboxCaption">
              <span>{accommodation.title}</span>
              <strong>{activePhotoIndex + 1} / {galleryPhotos.length}</strong>
            </div>
          </div>

          {galleryPhotos.length > 1 && (
            <button
              type="button"
              className="lightboxNav lightboxNext"
              onClick={(event) => {
                event.stopPropagation();
                showNextPhoto();
              }}
              aria-label="Sledeća fotografija"
            >
              ›
            </button>
          )}
        </div>
      )}

      <UnitEditor
        open={editorOpen}
        unit={editingUnit}
        hostId={accommodation.host_id}
        accommodationId={accommodation.id}
        onClose={() => {
          setEditorOpen(false);
          setEditingUnit(null);
        }}
        onSaved={(saved) => {
          setUnits((current) => {
            const exists = current.some((item) => item.id === saved.id);
            return exists
              ? current.map((item) => (item.id === saved.id ? saved : item))
              : [...current, saved];
          });
        }}
      />

      <style>{`
        * { box-sizing: border-box; }

        html {
          overflow-y: auto !important;
          overflow-x: hidden;
        }

        body {
          margin: 0;
          overflow-y: auto !important;
          overflow-x: hidden;
        }

        .detailsPage {
          min-height: 100vh;
          padding: 22px 0 84px;
          color: #122218;
          background:
            radial-gradient(circle at 10% 0%, rgba(55, 99, 67, .08), transparent 32rem),
            radial-gradient(circle at 92% 18%, rgba(211, 195, 151, .10), transparent 24rem),
            #f4f5f0;
        }

        .detailsShell {
          width: min(1240px, calc(100% - 36px));
          margin: 0 auto;
        }

        .backLink {
          display: inline-flex;
          align-items: center;
          margin: 2px 0 16px;
          color: #485c50;
          text-decoration: none;
          font-size: 14px;
          font-weight: 850;
          transition: transform .18s ease, color .18s ease;
        }

        .backLink:hover {
          transform: translateX(-3px);
          color: #173f2c;
        }

        /* HERO */
        .stayHero {
          margin-bottom: 22px;
        }

        .stayHeroVisual {
          position: relative;
          height: clamp(470px, 60vw, 670px);
          overflow: hidden;
          border-radius: 34px;
          background: #dfe5df;
          box-shadow: 0 30px 78px rgba(20, 43, 29, .16);
          isolation: isolate;
        }

        .stayHeroImageButton {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          padding: 0;
          background: transparent;
          cursor: zoom-in;
        }

        .stayHeroImageButton img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transform: scale(1.002);
          transition: transform .75s cubic-bezier(.2,.7,.2,1);
        }

        .stayHeroVisual:hover .stayHeroImageButton img {
          transform: scale(1.017);
        }

        .stayHeroShade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(6,13,9,.20) 0%, rgba(6,13,9,.02) 30%, rgba(6,13,9,.08) 52%, rgba(6,13,9,.82) 100%),
            linear-gradient(90deg, rgba(6,13,9,.22), transparent 46%);
        }

        .stayHeroTop {
          position: absolute;
          z-index: 3;
          top: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .stayHeroBadge,
        .stayHeroAll {
          border: 1px solid rgba(255,255,255,.42);
          background: rgba(17,31,22,.34);
          color: #fff;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .stayHeroBadge {
          padding: 9px 12px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .stayHeroAll {
          border-radius: 999px;
          padding: 10px 13px;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .stayHeroCopy {
          position: absolute;
          z-index: 3;
          left: clamp(24px, 4vw, 52px);
          right: clamp(24px, 4vw, 52px);
          bottom: clamp(28px, 4vw, 50px);
          max-width: 870px;
          color: #fff;
          text-shadow: 0 2px 26px rgba(0,0,0,.20);
        }

        .stayHeroLocation {
          margin-bottom: 10px;
          color: rgba(255,255,255,.86);
          font-size: 14px;
          font-weight: 850;
        }

        .stayHeroCopy h1 {
          margin: 0;
          max-width: 900px;
          font-size: clamp(44px, 6vw, 80px);
          line-height: .93;
          letter-spacing: -.055em;
          text-wrap: balance;
        }

        .stayHeroMeta {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 17px;
          color: rgba(255,255,255,.92);
          font-size: 14px;
          font-weight: 760;
        }

        .stayHeroMeta i {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,.62);
        }

        .stayHeroMeta strong {
          color: #fff;
          font-size: 15px;
        }

        .stayHeroCounter {
          position: absolute;
          z-index: 4;
          right: 18px;
          bottom: 18px;
          padding: 7px 10px;
          border: 1px solid rgba(255,255,255,.22);
          border-radius: 999px;
          background: rgba(10,22,14,.46);
          color: #fff;
          font-size: 11px;
          font-weight: 900;
          backdrop-filter: blur(12px);
        }

        .stayHeroArrow {
          position: absolute;
          z-index: 4;
          top: 50%;
          width: 44px;
          height: 56px;
          transform: translateY(-50%);
          border: 1px solid rgba(255,255,255,.30);
          border-radius: 17px;
          background: rgba(16,29,20,.28);
          color: #fff;
          font-size: 34px;
          line-height: 1;
          opacity: 0;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: opacity .18s ease, background .18s ease;
        }

        .stayHeroVisual:hover .stayHeroArrow { opacity: 1; }
        .stayHeroArrow:hover { background: rgba(16,29,20,.52); }
        .stayHeroArrowLeft { left: 16px; }
        .stayHeroArrowRight { right: 16px; }

        .stayThumbRail {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 11px 2px 2px;
          scrollbar-width: none;
          scroll-snap-type: x proximity;
        }

        .stayThumbRail::-webkit-scrollbar { display: none; }

        .stayThumb {
          flex: 0 0 82px;
          height: 58px;
          padding: 0;
          overflow: hidden;
          border: 2px solid transparent;
          border-radius: 13px;
          background: #e3e7e2;
          opacity: .66;
          cursor: pointer;
          scroll-snap-align: start;
          transition: opacity .18s ease, border-color .18s ease, transform .18s ease;
        }

        .stayThumb img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .stayThumb:hover,
        .stayThumb.isActive {
          opacity: 1;
          transform: translateY(-1px);
        }

        .stayThumb.isActive {
          border-color: #1d4933;
        }

        /* CONTENT */
        .detailsGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 344px;
          gap: 28px;
          align-items: start;
        }

        .detailsContent {
          min-width: 0;
          padding: 6px 0 0;
          background: transparent;
          border: 0;
          box-shadow: none;
        }

        .eyebrow {
          display: block;
          color: #748279;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .stayFacts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 0;
          margin-bottom: 34px;
          overflow: hidden;
          border-top: 1px solid rgba(28,50,35,.13);
          border-bottom: 1px solid rgba(28,50,35,.13);
        }

        .stayFact {
          min-width: 0;
          padding: 18px 20px 18px 0;
        }

        .stayFact + .stayFact {
          padding-left: 20px;
          border-left: 1px solid rgba(28,50,35,.10);
        }

        .stayFact span {
          display: block;
          margin-bottom: 6px;
          color: #7a887f;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .stayFact strong {
          display: block;
          color: #183d2b;
          font-size: 17px;
          line-height: 1.22;
          letter-spacing: -.02em;
          overflow-wrap: anywhere;
        }

        .infoBlock {
          margin: 0 0 38px;
          padding: 0;
          border: 0;
        }

        .infoBlock h2 {
          margin: 7px 0 12px;
          max-width: 720px;
          font-size: clamp(28px, 3.4vw, 42px);
          line-height: 1;
          letter-spacing: -.045em;
        }

        .infoBlock p {
          max-width: 820px;
          margin: 0;
          color: #4d5d53;
          font-size: 16px;
          line-height: 1.82;
          white-space: pre-line;
        }

        .descriptionWrap {
          position: relative;
          max-width: 820px;
          max-height: 150px;
          overflow: hidden;
          transition: max-height .35s ease;
        }

        .descriptionWrap:not(.isExpanded)::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 68px;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            rgba(244,245,240,0),
            rgba(244,245,240,.96) 74%,
            #f4f5f0 100%
          );
        }

        .descriptionWrap.isExpanded {
          max-height: 2200px;
        }

        .descriptionToggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #173f2c;
          font: inherit;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .descriptionToggle span {
          display: inline-grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #e8efe9;
          font-size: 12px;
          transition: transform .18s ease;
        }

        .descriptionToggle:hover span {
          transform: translateY(1px);
        }

        .unitsSection {
          margin-top: 4px;
          padding-top: 28px;
          border-top: 1px solid rgba(28,50,35,.12);
        }

        .sectionHead {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 20px;
          margin-bottom: 18px;
        }

        .sectionHead h2 {
          margin: 6px 0 0;
          font-size: 29px;
          line-height: 1.05;
          letter-spacing: -.04em;
        }

        .sectionHead p {
          max-width: 630px;
          margin: 8px 0 0;
          color: #728078;
          font-size: 14px;
          line-height: 1.55;
        }

        /* CONTACT */
        .contactPanel {
          position: sticky;
          top: 18px;
          padding: 23px;
          border: 1px solid rgba(27,49,34,.09);
          border-radius: 26px;
          background: rgba(255,255,255,.94);
          box-shadow:
            0 24px 66px rgba(24,48,31,.10),
            inset 0 1px 0 rgba(255,255,255,.9);
          backdrop-filter: blur(18px);
        }

        .contactTitle {
          margin: 7px 0 2px;
          font-size: 22px;
          line-height: 1.06;
          letter-spacing: -.035em;
        }

        .hostRow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 17px 0;
          padding: 15px 0;
          border-top: 1px solid #edf0eb;
          border-bottom: 1px solid #edf0eb;
        }

        .hostRow img {
          width: 56px;
          height: 56px;
          border-radius: 17px;
          object-fit: cover;
        }

        .hostRow strong,
        .hostRow small {
          display: block;
        }

        .hostRow strong {
          color: #1d3124;
          font-size: 15px;
        }

        .hostRow small {
          margin-top: 4px;
          color: #79867f;
          font-size: 12px;
        }

        .contactActions {
          display: grid;
          gap: 9px;
        }

        .contactActions a,
        .hostProfileLink,
        .ownerButton {
          border: 0;
          border-radius: 14px;
          padding: 12px 14px;
          text-align: center;
          text-decoration: none;
          font-weight: 900;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .contactActions a {
          color: #fff;
          background: #173f2c;
          box-shadow: 0 10px 24px rgba(23,63,44,.15);
        }

        .contactActions a:hover,
        .hostProfileLink:hover,
        .ownerButton:hover {
          transform: translateY(-1px);
        }

        .hostProfileLink {
          display: block;
          margin-top: 10px;
          color: #173f2c;
          background: #edf3ee;
        }

        .ownerButton {
          white-space: nowrap;
          color: #fff;
          background: #173f2c;
        }

        /* UNITS */
        .unitGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 14px;
        }

        .unitCard {
          overflow: hidden;
          border: 1px solid #e4e9e4;
          border-radius: 21px;
          background: #fff;
          box-shadow: 0 10px 28px rgba(29,51,36,.05);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .unitCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(29,51,36,.09);
        }

        .unitCard > img {
          width: 100%;
          aspect-ratio: 1.62;
          object-fit: cover;
          display: block;
        }

        .unitBody {
          padding: 16px;
        }

        .unitTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: start;
        }

        .unitTop h3 {
          margin: 0;
          font-size: 18px;
          letter-spacing: -.02em;
        }

        .unitTop strong {
          color: #173f2c;
          font-size: 14px;
          white-space: nowrap;
        }

        .unitBody p {
          color: #68766d;
          line-height: 1.55;
        }

        .unitBody > small {
          color: #77857c;
          font-weight: 750;
        }

        .ownerUnitActions {
          display: flex;
          gap: 8px;
          margin-top: 14px;
        }

        .ownerUnitActions button {
          border: 1px solid #dce4dd;
          border-radius: 10px;
          padding: 8px 11px;
          background: #fff;
          cursor: pointer;
        }

        /* LIGHTBOX */
        .stayLightbox {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: grid;
          place-items: center;
          padding: 32px 72px;
          background: rgba(7,12,9,.95);
          backdrop-filter: blur(12px);
        }

        .lightboxStage {
          position: relative;
          width: min(1240px, 100%);
          height: min(84vh, 880px);
          display: grid;
          place-items: center;
        }

        .lightboxStage img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 17px;
          box-shadow: 0 30px 90px rgba(0,0,0,.42);
        }

        .lightboxCaption {
          position: absolute;
          left: 50%;
          bottom: 12px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 999px;
          background: rgba(12,20,15,.64);
          color: #fff;
          font-size: 12px;
          white-space: nowrap;
          backdrop-filter: blur(12px);
        }

        .lightboxClose,
        .lightboxNav {
          position: fixed;
          z-index: 505;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.18);
          color: #fff;
          background: rgba(255,255,255,.10);
          cursor: pointer;
          backdrop-filter: blur(10px);
        }

        .lightboxClose {
          top: 18px;
          right: 18px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          font-size: 28px;
        }

        .lightboxNav {
          top: 50%;
          width: 48px;
          height: 60px;
          transform: translateY(-50%);
          border-radius: 17px;
          font-size: 38px;
        }

        .lightboxPrev { left: 16px; }
        .lightboxNext { right: 16px; }

        /* OWNER MODAL */
        .modalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 600;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(10,20,14,.55);
        }

        .modal {
          width: min(720px, 100%);
          max-height: 92vh;
          overflow: auto;
          padding: 24px;
          border-radius: 24px;
          background: #fff;
        }

        .modalHead {
          display: flex;
          justify-content: space-between;
          align-items: start;
        }

        .modalHead h2 { margin: 5px 0 18px; }

        .modalHead > button {
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: #eef2ee;
          cursor: pointer;
          font-size: 20px;
        }

        .modal form {
          display: grid;
          gap: 14px;
        }

        .modal label {
          display: grid;
          gap: 7px;
          font-weight: 800;
        }

        .modal input,
        .modal textarea {
          width: 100%;
          padding: 12px 13px;
          border: 1px solid #dce4dd;
          border-radius: 13px;
          font: inherit;
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .checkboxRow {
          display: flex !important;
          align-items: center;
          gap: 9px !important;
        }

        .checkboxRow input { width: auto; }

        .photoEditor {
          padding: 14px;
          border: 1px solid #e1e8e2;
          border-radius: 16px;
        }

        .photoEditorHead {
          display: flex;
          justify-content: space-between;
        }

        .uploadBox {
          margin-top: 10px;
          padding: 14px;
          border: 1px dashed #bcc9be;
          border-radius: 13px;
          background: #f2f6f2;
          cursor: pointer;
        }

        .uploadBox input { display: none; }

        .photoGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        .photoGrid img {
          width: 100%;
          aspect-ratio: 1.2;
          object-fit: cover;
          border-radius: 10px;
        }

        .photoGrid button {
          border: 0;
          background: transparent;
          color: #8e3737;
          cursor: pointer;
        }

        .errorBox {
          padding: 11px 13px;
          border-radius: 12px;
          background: #fff0ef;
          color: #8f2c2c;
        }

        .modalActions {
          display: flex;
          justify-content: end;
          gap: 9px;
        }

        .modalActions button {
          padding: 11px 15px;
          border: 0;
          border-radius: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .modalActions .primary {
          background: #173f2c;
          color: #fff;
        }

        .modalActions .secondary {
          background: #edf2ed;
          color: #263a2e;
        }

        .detailsState {
          min-height: 70vh;
          display: grid;
          place-items: center;
          background: #f4f5f0;
          font-size: 18px;
          font-weight: 850;
        }

        @media (max-width: 980px) {
          .detailsGrid {
            grid-template-columns: 1fr;
          }

          .contactPanel {
            position: static;
          }
        }

        @media (max-width: 700px) {
          .detailsPage {
            padding: 10px 0 42px;
          }

          .detailsShell {
            width: min(100% - 20px, 1240px);
          }

          .backLink {
            margin: 4px 4px 11px;
            font-size: 13px;
          }

          .stayHeroVisual {
            height: 455px;
            border-radius: 23px;
          }

          .stayHeroTop {
            top: 13px;
            left: 13px;
            right: 13px;
          }

          .stayHeroBadge {
            padding: 8px 10px;
            font-size: 9px;
          }

          .stayHeroAll {
            padding: 9px 10px;
            font-size: 10px;
          }

          .stayHeroCopy {
            left: 20px;
            right: 20px;
            bottom: 26px;
          }

          .stayHeroCopy h1 {
            font-size: clamp(39px, 13vw, 60px);
          }

          .stayHeroMeta {
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 13px;
            font-size: 12px;
          }

          .stayHeroCounter {
            right: 12px;
            bottom: 12px;
          }

          .stayHeroArrow { display: none; }

          .stayThumbRail {
            width: calc(100% + 10px);
            margin-right: -10px;
          }

          .stayThumb {
            flex-basis: 70px;
            height: 52px;
            border-radius: 11px;
          }

          .detailsGrid {
            gap: 14px;
          }

          .stayFacts {
            grid-template-columns: 1fr;
            margin-bottom: 28px;
          }

          .stayFact {
            padding: 14px 0;
          }

          .stayFact + .stayFact {
            padding-left: 0;
            border-left: 0;
            border-top: 1px solid rgba(28,50,35,.10);
          }

          .infoBlock h2 {
            font-size: 31px;
          }

          .infoBlock p {
            font-size: 15px;
            line-height: 1.72;
          }

          .descriptionWrap {
            max-height: 132px;
          }

          .descriptionWrap:not(.isExpanded)::after {
            height: 58px;
          }

          .sectionHead {
            align-items: flex-start;
            flex-direction: column;
          }

          .unitGrid,
          .formGrid {
            grid-template-columns: 1fr;
          }

          .contactPanel {
            padding: 20px;
            border-radius: 22px;
          }

          .stayLightbox {
            padding: 16px 8px;
          }

          .lightboxStage {
            height: 78vh;
          }

          .lightboxNav {
            width: 42px;
            height: 52px;
            border-radius: 14px;
          }

          .lightboxPrev { left: 7px; }
          .lightboxNext { right: 7px; }

          .lightboxCaption span {
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .photoGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}
