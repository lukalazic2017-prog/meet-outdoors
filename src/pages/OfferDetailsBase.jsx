import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SeoHead from "../seo/SeoHead";

const FALLBACK =
  "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=88";

const MAX_VARIANT_PHOTOS = 6;

function normalizeUrl(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function money(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return "Cena na upit";

  return `Od ${new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(number)}`;
}

function kindMeta(kind) {
  if (kind === "rental") {
    return {
      eyebrow: "IZNAJMLJIVANJE",
      title: "Ponuda za iznajmljivanje",
      variantsTitle: "Opcije / varijante",
      emptyVariants: "Ova ponuda nema dodatne varijante.",
      addVariant: "Dodaj varijantu",
      editVariant: "Izmeni varijantu",
      variantNameLabel: "Naziv varijante",
      variantNamePlaceholder: "npr. Kajak dvosed",
      quantityLabel: "Količina",
      priceLabel: "Cena (€)",
      descriptionPlaceholder:
        "Opiši ovu varijantu, šta korisnik dobija i eventualne uslove iznajmljivanja.",
    };
  }

  return {
    eyebrow: "USLUGA",
    title: "Usluga domaćina",
    variantsTitle: "Paketi / opcije",
    emptyVariants: "Ova usluga nema dodatne pakete.",
    addVariant: "Dodaj paket",
    editVariant: "Izmeni paket",
    variantNameLabel: "Naziv paketa",
    variantNamePlaceholder: "npr. Privatna tura",
    quantityLabel: null,
    priceLabel: "Cena od (€)",
    descriptionPlaceholder:
      "Opiši šta ovaj paket uključuje i kome je namenjen.",
  };
}

function VariantEditor({
  open,
  variant,
  offer,
  kind,
  onClose,
  onSaved,
}) {
  const meta = kindMeta(kind);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price_from: "",
    price_on_request: false,
    max_people: "",
    quantity: "",
  });

  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      title: variant?.title || "",
      description: variant?.description || "",
      price_from:
        variant?.price_from !== null && variant?.price_from !== undefined
          ? String(variant.price_from)
          : "",
      price_on_request: Boolean(variant?.price_on_request),
      max_people:
        variant?.max_people !== null && variant?.max_people !== undefined
          ? String(variant.max_people)
          : "",
      quantity:
        variant?.quantity !== null && variant?.quantity !== undefined
          ? String(variant.quantity)
          : "",
    });

    const urls = [
      variant?.cover_url,
      ...(Array.isArray(variant?.gallery_urls)
        ? variant.gallery_urls
        : []),
    ].filter(Boolean);

    setPhotos(
      urls.map((url, index) => ({
        id: `existing-${index}-${url}`,
        url,
        file: null,
      }))
    );

    setError("");
  }, [open, variant]);

  if (!open) return null;

  const addPhotos = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    const invalid = files.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (invalid) {
      setError("Fotografije moraju biti JPG, PNG ili WEBP.");
      return;
    }

    const tooLarge = files.find(
      (file) => file.size > 8 * 1024 * 1024
    );

    if (tooLarge) {
      setError("Svaka fotografija može imati najviše 8 MB.");
      return;
    }

    setPhotos((current) => {
      const room = Math.max(MAX_VARIANT_PHOTOS - current.length, 0);

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

      if (target?.file && target.url?.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const makeCover = (index) => {
    setPhotos((current) => {
      const clone = [...current];
      const [selected] = clone.splice(index, 1);
      return [selected, ...clone];
    });
  };

  const save = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Unesi naziv.");
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

        const extension =
          photo.file.name.split(".").pop()?.toLowerCase() ||
          (photo.file.type === "image/png"
            ? "png"
            : photo.file.type === "image/webp"
              ? "webp"
              : "jpg");

        const path = `${offer.host_id}/variants/${offer.id}/${Date.now()}-${i}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("host-offers")
          .upload(path, photo.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.file.type,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("host-offers")
          .getPublicUrl(path);

        urls.push(data.publicUrl);
      }

      const payload = {
        offer_id: offer.id,
        host_id: offer.host_id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price_from: form.price_on_request
          ? null
          : form.price_from
            ? Number(form.price_from)
            : null,
        price_on_request: Boolean(form.price_on_request),
        max_people: form.max_people ? Number(form.max_people) : null,
        quantity:
          kind === "rental" && form.quantity !== ""
            ? Number(form.quantity)
            : null,
        cover_url: urls[0] || null,
        gallery_urls: urls.slice(1, MAX_VARIANT_PHOTOS),
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (variant?.id) {
        result = await supabase
          .from("host_offer_variants")
          .update(payload)
          .eq("id", variant.id)
          .eq("host_id", offer.host_id)
          .select("*")
          .single();
      } else {
        result = await supabase
          .from("host_offer_variants")
          .insert(payload)
          .select("*")
          .single();
      }

      if (result.error) throw result.error;

      onSaved(result.data);
      onClose();
    } catch (err) {
      setError(err?.message || "Opcija nije sačuvana.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="variantModalBackdrop" onMouseDown={onClose}>
      <div
        className="variantModal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="variantModalHead">
          <div>
            <span className="smallLabel">
              {kind === "rental" ? "VARIJANTA" : "PAKET"}
            </span>
            <h2>
              {variant ? meta.editVariant : meta.addVariant}
            </h2>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={save}>
          <label>
            {meta.variantNameLabel} *
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder={meta.variantNamePlaceholder}
              required
            />
          </label>

          <label>
            Opis
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder={meta.descriptionPlaceholder}
            />
          </label>

          <div className="variantFormGrid">
            <label>
              {meta.priceLabel}
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={form.price_on_request}
                value={form.price_from}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price_from: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Maks. osoba
              <input
                type="number"
                min="1"
                value={form.max_people}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    max_people: event.target.value,
                  }))
                }
              />
            </label>

            {kind === "rental" && (
              <label>
                Količina
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                />
              </label>
            )}
          </div>

          <label className="variantCheckbox">
            <input
              type="checkbox"
              checked={form.price_on_request}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price_on_request: event.target.checked,
                }))
              }
            />
            Cena na upit
          </label>

          <div className="variantPhotoEditor">
            <div className="variantPhotoHead">
              <div>
                <strong>Fotografije</strong>
                <small>
                  Prva fotografija je naslovna. Maksimalno {MAX_VARIANT_PHOTOS}.
                </small>
              </div>

              <span>
                {photos.length}/{MAX_VARIANT_PHOTOS}
              </span>
            </div>

            {photos.length < MAX_VARIANT_PHOTOS && (
              <label className="variantUpload">
                + Dodaj fotografije sa telefona ili računara
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={addPhotos}
                />
              </label>
            )}

            {photos.length > 0 && (
              <div className="variantPhotoGrid">
                {photos.map((photo, index) => (
                  <div
                    className={`variantPhoto ${
                      index === 0 ? "isCover" : ""
                    }`}
                    key={photo.id}
                  >
                    <img src={photo.url} alt="" />

                    {index === 0 && (
                      <span className="coverBadge">Naslovna</span>
                    )}

                    <div className="variantPhotoActions">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(index)}
                        >
                          Postavi kao naslovnu
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                      >
                        Ukloni
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="variantError">{error}</div>}

          <div className="variantModalActions">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              Odustani
            </button>

            <button
              type="submit"
              className="primary"
              disabled={saving}
            >
              {saving ? "Čuvanje..." : "Sačuvaj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OfferDetailsBase({ kind }) {
  const { id } = useParams();

  const [offer, setOffer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [variants, setVariants] = useState([]);
  const [userId, setUserId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const meta = kindMeta(kind);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id || null);

      const { data: item, error } = await supabase
        .from("host_offers")
        .select("*")
        .eq("id", id)
        .eq("offer_type", kind)
        .single();

      if (error) throw error;

      setOffer(item);

      const [
        { data: host, error: hostError },
        { data: variantRows, error: variantsError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", item.host_id)
          .single(),

        supabase
          .from("host_offer_variants")
          .select("*")
          .eq("offer_id", item.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (hostError) throw hostError;
      if (variantsError) throw variantsError;

      setProfile(host || null);
      setVariants(variantRows || []);
    } catch (err) {
      console.error("Offer details:", err);
      setOffer(null);
    } finally {
      setLoading(false);
    }
  }, [id, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const photos = useMemo(
    () =>
      Array.from(
        new Set(
          [
            offer?.cover_url,
            ...(Array.isArray(offer?.gallery_urls)
              ? offer.gallery_urls
              : []),
          ].filter(Boolean)
        )
      ),
    [offer]
  );

  const galleryPhotos = photos.length ? photos : [FALLBACK];

  useEffect(() => {
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
  }, [offer?.id, kind]);

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
    return <main className="offerState">Učitavanje...</main>;
  }

  if (!offer) {
    return <main className="offerState">Ponuda nije pronađena.</main>;
  }

  const isOwner = userId === offer.host_id;

  const visibleVariants = isOwner
    ? variants
    : variants.filter((variant) => variant.is_active !== false);

  const phone = profile?.phone
    ? `tel:${String(profile.phone).replace(/\s/g, "")}`
    : "";

  const instagram = normalizeUrl(profile?.instagram_url);
  const website = normalizeUrl(profile?.website_url);

  const deleteVariant = async (variant) => {
    if (!isOwner) return;

    const confirmed = window.confirm(
      `Obriši "${variant.title}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("host_offer_variants")
      .delete()
      .eq("id", variant.id)
      .eq("host_id", offer.host_id);

    if (error) {
      window.alert(error.message);
      return;
    }

    setVariants((current) =>
      current.filter((item) => item.id !== variant.id)
    );
  };

  const toggleVariant = async (variant) => {
    if (!isOwner) return;

    const nextValue = !variant.is_active;

    const { data, error } = await supabase
      .from("host_offer_variants")
      .update({
        is_active: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", variant.id)
      .eq("host_id", offer.host_id)
      .select("*")
      .single();

    if (error) {
      window.alert(error.message);
      return;
    }

    setVariants((current) =>
      current.map((item) =>
        item.id === data.id ? data : item
      )
    );
  };

  return (
    <>
      <SeoHead
        title={`${offer.title || meta.title} | MeetOutdoors`}
        description={offer.description || meta.title}
      />

      <main className="offerDetailsPage">
        <div className="offerDetailsShell">
          <Link
            to={profile?.username ? `/h/${profile.username}` : "/"}
            className="backLink"
          >
            ← Nazad na domaćina
          </Link>

          <section className="offerHero">
            <div className="offerHeroVisual">
              <button
                type="button"
                className="offerHeroImage"
                onClick={() => setLightboxOpen(true)}
                aria-label="Otvori galeriju ponude"
              >
                <img
                  src={galleryPhotos[activePhotoIndex]}
                  alt={offer.title || meta.title}
                />
              </button>

              <div className="offerHeroShade" />

              <div className="offerHeroTop">
                <span className="offerHeroBadge">{meta.eyebrow}</span>

                {galleryPhotos.length > 1 && (
                  <button
                    type="button"
                    className="offerHeroGalleryButton"
                    onClick={() => setLightboxOpen(true)}
                  >
                    Sve fotografije · {galleryPhotos.length}
                  </button>
                )}
              </div>

              <div className="offerHeroCopy">
                <div className="offerHeroLocation">
                  {offer.location || "Lokacija po dogovoru"}
                </div>
                <h1>{offer.title}</h1>
                <div className="offerHeroMeta">
                  <span>{offer.category || meta.title}</span>
                  <i />
                  <strong>
                    {offer.price_on_request
                      ? "Cena na upit"
                      : money(offer.price_from)}
                  </strong>
                </div>
              </div>

              {galleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="offerHeroArrow offerHeroArrowLeft"
                    onClick={showPreviousPhoto}
                    aria-label="Prethodna fotografija"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="offerHeroArrow offerHeroArrowRight"
                    onClick={showNextPhoto}
                    aria-label="Sledeća fotografija"
                  >
                    ›
                  </button>
                </>
              )}

              <div className="offerHeroCounter">
                {activePhotoIndex + 1} / {galleryPhotos.length}
              </div>
            </div>

            {galleryPhotos.length > 1 && (
              <div className="offerThumbRail">
                {galleryPhotos.map((photo, index) => (
                  <button
                    type="button"
                    key={`${photo}-${index}`}
                    className={`offerThumb ${index === activePhotoIndex ? "isActive" : ""}`}
                    onClick={() => setActivePhotoIndex(index)}
                    aria-label={`Prikaži fotografiju ${index + 1}`}
                  >
                    <img src={photo} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="offerGrid">
            <section className="mainCard">
              <div className="offerFacts">
                <div className="offerFact">
                  <span>Kategorija</span>
                  <strong>{offer.category || meta.title}</strong>
                </div>

                <div className="offerFact">
                  <span>Cena</span>
                  <strong>
                    {offer.price_on_request
                      ? "Cena na upit"
                      : money(offer.price_from)}
                  </strong>
                </div>

                <div className="offerFact">
                  <span>Lokacija</span>
                  <strong>{offer.location || "Po dogovoru"}</strong>
                </div>
              </div>

              {offer.description && (
                <section className="description">
                  <span>O PONUDI</span>
                  <h2>
                    {kind === "rental"
                      ? "Detalji iznajmljivanja"
                      : "Šta usluga uključuje"}
                  </h2>

                  <div
                    className={`offerDescriptionWrap ${
                      descriptionExpanded ? "isExpanded" : ""
                    }`}
                  >
                    <p>{offer.description}</p>
                  </div>

                  {String(offer.description).trim().length > 260 && (
                    <button
                      type="button"
                      className="offerDescriptionToggle"
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

              {(visibleVariants.length > 0 || isOwner) && (
                <>
                  <section className="variants">
                <div className="variantsHeader">
                  <div>
                    <span>{meta.eyebrow}</span>

                    <h2>{meta.variantsTitle}</h2>

                    <p>
                      {kind === "rental"
                        ? "Dodaj različite modele, veličine ili tipove opreme samo ako ih ponuda stvarno ima."
                        : "Dodaj različite pakete samo ako usluga ima više opcija."}
                    </p>
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      className="ownerAddButton"
                      onClick={() => {
                        setEditingVariant(null);
                        setEditorOpen(true);
                      }}
                    >
                      + {meta.addVariant}
                    </button>
                  )}
                </div>

                {visibleVariants.length ? (
                  <div className="variantGrid">
                    {visibleVariants.map((variant) => {
                      const variantPhotos = [
                        variant.cover_url,
                        ...(Array.isArray(variant.gallery_urls)
                          ? variant.gallery_urls
                          : []),
                      ].filter(Boolean);

                      return (
                        <article
                          key={variant.id}
                          className={`variantCard ${
                            variant.is_active === false
                              ? "isInactive"
                              : ""
                          }`}
                        >
                          <img
                            src={
                              variantPhotos[0] ||
                              offer.cover_url ||
                              FALLBACK
                            }
                            alt={variant.title}
                          />

                          <div className="variantBody">
                            <div className="variantTitleRow">
                              <h3>{variant.title}</h3>

                              {isOwner &&
                                variant.is_active === false && (
                                  <span className="inactiveBadge">
                                    Sakriveno
                                  </span>
                                )}
                            </div>

                            {variant.description && (
                              <p>{variant.description}</p>
                            )}

                            <div className="variantMeta">
                              <strong>
                                {variant.price_on_request
                                  ? "Cena na upit"
                                  : money(variant.price_from)}
                              </strong>

                              {variant.max_people && (
                                <small>
                                  Do {variant.max_people} osoba
                                </small>
                              )}

                              {kind === "rental" &&
                                variant.quantity !== null &&
                                variant.quantity !== undefined && (
                                  <small>
                                    Količina: {variant.quantity}
                                  </small>
                                )}
                            </div>

                            {variantPhotos.length > 1 && (
                              <div className="variantMiniGallery">
                                {variantPhotos
                                  .slice(1, 4)
                                  .map((photo, index) => (
                                    <img
                                      key={`${photo}-${index}`}
                                      src={photo}
                                      alt=""
                                    />
                                  ))}
                              </div>
                            )}

                            {isOwner && (
                              <div className="ownerVariantActions">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVariant(variant);
                                    setEditorOpen(true);
                                  }}
                                >
                                  Izmeni
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleVariant(variant)
                                  }
                                >
                                  {variant.is_active === false
                                    ? "Prikaži"
                                    : "Sakrij"}
                                </button>

                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() =>
                                    deleteVariant(variant)
                                  }
                                >
                                  Obriši
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="emptyVariants">
                    <strong>
                      {meta.emptyVariants}
                    </strong>

                    {isOwner && (
                      <span>
                        Ako ti ne trebaju paketi ili varijante,
                        glavna ponuda može ostati ovako.
                      </span>
                    )}
                  </div>
                )}
                  </section>

                </>
              )}
            </section>

            <aside className="contactCard">
              <span>DOMAĆIN</span>
              <h3 className="contactTitle">Kontaktiraj domaćina</h3>

              <div className="host">
                <img
                  src={profile?.avatar_url || FALLBACK}
                  alt=""
                />

                <div>
                  <strong>
                    {profile?.full_name ||
                      profile?.username ||
                      "MeetOutdoors host"}
                  </strong>

                  <small>
                    {[profile?.city, profile?.country]
                      .filter(Boolean)
                      .join(", ")}
                  </small>
                </div>
              </div>

              {!isOwner && (
                <>
                  <div className="contactActions">
                    {phone && <a href={phone}>Pozovi</a>}

                    {instagram && (
                      <a
                        href={instagram}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Instagram
                      </a>
                    )}

                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Web-sajt
                      </a>
                    )}
                  </div>

                  {profile?.username && (
                    <Link
                      to={`/h/${profile.username}`}
                      className="profileLink"
                    >
                      Pogledaj profil domaćina →
                    </Link>
                  )}
                </>
              )}

              {isOwner && (
                <div className="ownerNotice">
                  <strong>Ovo je tvoja ponuda.</strong>
                  <span>
                    Pakete i varijante uređuješ direktno
                    na ovoj stranici.
                  </span>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      {lightboxOpen && (
        <div
          className="offerLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Galerija ponude"
          onMouseDown={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="offerLightboxClose"
            onClick={() => setLightboxOpen(false)}
            aria-label="Zatvori galeriju"
          >
            ×
          </button>

          {galleryPhotos.length > 1 && (
            <button
              type="button"
              className="offerLightboxNav offerLightboxPrev"
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
            className="offerLightboxStage"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <img
              src={galleryPhotos[activePhotoIndex]}
              alt={`${offer.title || meta.title} - fotografija ${activePhotoIndex + 1}`}
            />
            <div className="offerLightboxCaption">
              <span>{offer.title}</span>
              <strong>{activePhotoIndex + 1} / {galleryPhotos.length}</strong>
            </div>
          </div>

          {galleryPhotos.length > 1 && (
            <button
              type="button"
              className="offerLightboxNav offerLightboxNext"
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

      <VariantEditor
        open={editorOpen}
        variant={editingVariant}
        offer={offer}
        kind={kind}
        onClose={() => {
          setEditorOpen(false);
          setEditingVariant(null);
        }}
        onSaved={(saved) => {
          setVariants((current) => {
            const exists = current.some(
              (item) => item.id === saved.id
            );

            if (exists) {
              return current.map((item) =>
                item.id === saved.id ? saved : item
              );
            }

            return [...current, saved];
          });
        }}
      />

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .offerDetailsPage {
          min-height: 100vh;
          background: #f4f7f2;
          color: #14231a;
          padding: 30px 0 70px;
        }

        .offerDetailsShell {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
        }

        .backLink {
          display: inline-flex;
          margin-bottom: 18px;
          color: #315443;
          text-decoration: none;
          font-weight: 850;
        }

        .visual {
          height: 520px;
          border-radius: 28px;
          overflow: hidden;
          position: relative;
          background: #dfe7df;
        }

        .visual > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .visual::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 30%,
            rgba(8, 20, 13, 0.72)
          );
        }

        .visualOverlay {
          position: absolute;
          z-index: 2;
          left: 30px;
          right: 30px;
          bottom: 28px;
          color: #fff;
        }

        .visualOverlay span,
        .description > span,
        .variantsHeader span,
        .contactCard > span,
        .smallLabel {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .visualOverlay h1 {
          font-size: clamp(38px, 6vw, 68px);
          letter-spacing: -0.045em;
          line-height: 0.95;
          margin: 7px 0 8px;
        }

        .visualOverlay p {
          margin: 0;
          font-weight: 750;
        }

        .offerGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 28px;
          margin-top: 28px;
          align-items: start;
        }

        .mainCard,
        .contactCard {
          background: #fff;
          border: 1px solid rgba(20, 35, 26, 0.08);
          border-radius: 24px;
          box-shadow: 0 18px 60px rgba(33, 55, 42, 0.07);
        }

        .mainCard {
          padding: 28px;
        }

        .topSummary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .topSummary > div {
          padding: 16px;
          border-radius: 16px;
          background: #f3f7f2;
        }

        .topSummary small,
        .topSummary strong {
          display: block;
        }

        .topSummary small {
          color: #758278;
          margin-bottom: 5px;
        }

        .description,
        .variants {
          margin-top: 32px;
          padding-top: 28px;
          border-top: 1px solid #edf0ec;
        }

        .description p {
          color: #4b5c50;
          line-height: 1.75;
          font-size: 17px;
          white-space: pre-line;
        }

        .gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 28px;
        }

        .gallery img {
          width: 100%;
          aspect-ratio: 1.3;
          object-fit: cover;
          border-radius: 16px;
        }

        .variantsHeader {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: end;
          margin-bottom: 18px;
        }

        .variantsHeader h2 {
          margin: 5px 0 6px;
          font-size: 28px;
        }

        .variantsHeader p {
          max-width: 620px;
          margin: 0;
          color: #6e7b72;
          line-height: 1.55;
        }

        .ownerAddButton {
          flex: 0 0 auto;
          border: 0;
          border-radius: 14px;
          padding: 12px 15px;
          background: #173f2c;
          color: #fff;
          font-weight: 850;
          cursor: pointer;
        }

        .variantGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .variantCard {
          overflow: hidden;
          border: 1px solid #e4ebe5;
          border-radius: 18px;
          background: #fbfcfa;
        }

        .variantCard.isInactive {
          opacity: 0.68;
        }

        .variantCard > img {
          width: 100%;
          aspect-ratio: 1.55;
          object-fit: cover;
          display: block;
        }

        .variantBody {
          padding: 16px;
        }

        .variantTitleRow {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 8px;
        }

        .variantTitleRow h3 {
          margin: 0;
        }

        .inactiveBadge {
          flex: 0 0 auto;
          padding: 5px 8px;
          border-radius: 999px;
          background: #e9eeea;
          color: #617067;
          font-size: 11px;
          font-weight: 850;
        }

        .variantBody p {
          color: #68766d;
          line-height: 1.6;
        }

        .variantMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 14px;
          margin-top: 12px;
          align-items: center;
        }

        .variantMiniGallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-top: 14px;
        }

        .variantMiniGallery img {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 9px;
          object-fit: cover;
        }

        .ownerVariantActions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 15px;
        }

        .ownerVariantActions button {
          border: 1px solid #dbe3dc;
          border-radius: 10px;
          background: #fff;
          color: #274032;
          padding: 8px 10px;
          font-weight: 750;
          cursor: pointer;
        }

        .ownerVariantActions .danger {
          color: #9d3939;
        }

        .emptyVariants {
          border: 1px dashed #ccd8ce;
          border-radius: 18px;
          background: #f8faf7;
          padding: 20px;
        }

        .emptyVariants strong,
        .emptyVariants span {
          display: block;
        }

        .emptyVariants span {
          margin-top: 5px;
          color: #758278;
        }

        .contactCard {
          position: sticky;
          top: 20px;
          padding: 22px;
        }

        .host {
          display: flex;
          gap: 12px;
          align-items: center;
          margin: 14px 0 18px;
        }

        .host img {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          object-fit: cover;
        }

        .host strong,
        .host small {
          display: block;
        }

        .host small {
          color: #748177;
          margin-top: 4px;
        }

        .contactActions {
          display: grid;
          gap: 9px;
        }

        .contactActions a,
        .profileLink {
          text-decoration: none;
          border-radius: 14px;
          padding: 13px 15px;
          text-align: center;
          font-weight: 850;
        }

        .contactActions a {
          background: #173f2c;
          color: #fff;
        }

        .profileLink {
          display: block;
          margin-top: 11px;
          background: #edf4ee;
          color: #173f2c;
        }

        .ownerNotice {
          margin-top: 12px;
          padding: 14px;
          border-radius: 14px;
          background: #edf4ee;
        }

        .ownerNotice strong,
        .ownerNotice span {
          display: block;
        }

        .ownerNotice span {
          margin-top: 5px;
          color: #617067;
          line-height: 1.5;
        }

        .variantModalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(9, 20, 13, 0.58);
          padding: 18px;
          display: grid;
          place-items: center;
        }

        .variantModal {
          width: min(760px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.25);
        }

        .variantModalHead {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 20px;
        }

        .variantModalHead h2 {
          margin: 5px 0 20px;
        }

        .variantModalHead > button {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 50%;
          background: #edf2ed;
          cursor: pointer;
          font-size: 22px;
        }

        .variantModal form {
          display: grid;
          gap: 14px;
        }

        .variantModal label {
          display: grid;
          gap: 7px;
          font-weight: 800;
        }

        .variantModal input,
        .variantModal textarea {
          width: 100%;
          border: 1px solid #dce4dd;
          border-radius: 13px;
          padding: 12px 13px;
          font: inherit;
          outline: none;
        }

        .variantModal input:focus,
        .variantModal textarea:focus {
          border-color: #7f9e88;
          box-shadow: 0 0 0 3px rgba(68, 111, 80, 0.09);
        }

        .variantFormGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .variantCheckbox {
          display: flex !important;
          align-items: center;
          gap: 9px !important;
        }

        .variantCheckbox input {
          width: auto;
        }

        .variantPhotoEditor {
          border: 1px solid #e1e8e2;
          border-radius: 17px;
          padding: 14px;
        }

        .variantPhotoHead {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: start;
        }

        .variantPhotoHead strong,
        .variantPhotoHead small {
          display: block;
        }

        .variantPhotoHead small {
          margin-top: 3px;
          color: #738078;
        }

        .variantUpload {
          margin-top: 12px;
          padding: 14px;
          border: 1px dashed #b9c7bb;
          border-radius: 13px;
          background: #f4f7f3;
          cursor: pointer;
        }

        .variantUpload input {
          display: none;
        }

        .variantPhotoGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
          margin-top: 12px;
        }

        .variantPhoto {
          position: relative;
          border-radius: 13px;
          overflow: hidden;
          border: 1px solid #e3e8e3;
          background: #f4f6f3;
        }

        .variantPhoto > img {
          width: 100%;
          aspect-ratio: 1.25;
          object-fit: cover;
          display: block;
        }

        .coverBadge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(20, 54, 37, 0.9);
          color: #fff;
          font-size: 10px;
          font-weight: 900;
        }

        .variantPhotoActions {
          display: grid;
          gap: 4px;
          padding: 7px;
        }

        .variantPhotoActions button {
          border: 0;
          background: transparent;
          color: #415248;
          font-size: 11px;
          cursor: pointer;
          text-align: left;
        }

        .variantError {
          padding: 11px 13px;
          border-radius: 12px;
          background: #fff0ef;
          color: #8f2c2c;
        }

        .variantModalActions {
          display: flex;
          justify-content: end;
          gap: 9px;
        }

        .variantModalActions button {
          border: 0;
          border-radius: 12px;
          padding: 11px 15px;
          font-weight: 850;
          cursor: pointer;
        }

        .variantModalActions .primary {
          background: #173f2c;
          color: #fff;
        }

        .variantModalActions .secondary {
          background: #edf2ed;
          color: #263a2e;
        }

        .offerState {
          min-height: 70vh;
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        @media (max-width: 880px) {
          .visual {
            height: 400px;
          }

          .offerGrid {
            grid-template-columns: 1fr;
          }

          .contactCard {
            position: static;
          }
        }

        @media (max-width: 680px) {
          .offerDetailsShell {
            width: min(100% - 20px, 1180px);
          }

          .visual {
            height: 340px;
            border-radius: 20px;
          }

          .visualOverlay {
            left: 20px;
            right: 20px;
            bottom: 20px;
          }

          .mainCard {
            padding: 20px;
          }

          .topSummary,
          .gallery,
          .variantGrid,
          .variantFormGrid,
          .variantPhotoGrid {
            grid-template-columns: 1fr;
          }

          .variantsHeader {
            align-items: start;
            flex-direction: column;
          }

          .ownerAddButton {
            width: 100%;
          }
        }

        /* Premium MeetOutdoors details polish */
        .offerDetailsPage {
          background:
            radial-gradient(circle at 12% 0%, rgba(63, 104, 75, .08), transparent 28rem),
            #f6f7f3;
        }
        .backLink {
          gap: 7px;
          align-items: center;
          opacity: .9;
          transition: transform .18s ease, opacity .18s ease;
        }
        .backLink:hover { transform: translateX(-3px); opacity: 1; }
        .visual {
          box-shadow: 0 24px 70px rgba(19, 42, 28, .13);
          border: 1px solid rgba(20,35,26,.08);
        }
        .visual > img { transition: transform .5s ease; }
        .visual:hover > img { transform: scale(1.012); }
        .visual::after {
          background: linear-gradient(
            180deg,
            rgba(8,20,13,.02) 22%,
            rgba(8,20,13,.16) 55%,
            rgba(8,20,13,.76) 100%
          );
        }
        .visualOverlay h1 {
          max-width: 900px;
          text-wrap: balance;
        }
        .mainCard {
          box-shadow: none;
          border-color: rgba(20,35,26,.07);
        }
        .topSummary > div {
          border: 1px solid #e7ece6;
          background: linear-gradient(180deg, #f8faf7, #f2f6f1);
          min-height: 82px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .topSummary strong { color: #183b2a; }
        .contactCard {
          border-color: rgba(20,35,26,.08);
          box-shadow: 0 18px 55px rgba(24, 51, 34, .10);
        }
        .contactTitle {
          margin: 7px 0 4px;
          font-size: 22px;
          letter-spacing: -.025em;
        }
        .host {
          padding: 14px 0 16px;
          margin: 4px 0 14px;
          border-bottom: 1px solid #edf0ec;
        }
        .contactActions a {
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .contactActions a:first-child {
          box-shadow: 0 10px 24px rgba(23, 63, 44, .18);
        }
        .contactActions a:hover,
        .profileLink:hover { transform: translateY(-1px); }
        .variantCard {
          background: #fff;
          box-shadow: 0 10px 32px rgba(30,52,38,.06);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .variantCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 42px rgba(30,52,38,.10);
        }
        .ownerAddButton {
          box-shadow: 0 9px 22px rgba(23,63,44,.16);
        }
        @media (max-width: 680px) {
          .offerDetailsPage { padding-top: 18px; padding-bottom: 36px; }
          .visual {
            width: calc(100% + 20px);
            margin-left: -10px;
            border-radius: 0;
            border-left: 0;
            border-right: 0;
            box-shadow: none;
          }
          .offerGrid { margin-top: 14px; gap: 14px; }
          .mainCard, .contactCard {
            box-shadow: none;
            border-radius: 18px;
          }
          .visualOverlay h1 { font-size: 38px; line-height: .98; }
          .topSummary { gap: 8px; }
          .topSummary > div { min-height: 68px; padding: 13px 14px; }
          .contactCard { padding: 20px; }
        }


        /* WORLDCLASS V2 — compact premium public layout */
        html, body {
          overflow-y: auto !important;
          overflow-x: hidden;
        }

        .offerDetailsPage {
          padding: 22px 0 82px;
          background:
            radial-gradient(circle at 8% 0%, rgba(54,96,65,.09), transparent 32rem),
            radial-gradient(circle at 94% 18%, rgba(205,190,148,.10), transparent 26rem),
            #f4f5f0;
        }

        .offerDetailsShell {
          width: min(1240px, calc(100% - 36px));
        }

        .offerHero {
          margin-bottom: 22px;
        }

        .offerHeroVisual {
          position: relative;
          height: clamp(470px, 60vw, 670px);
          overflow: hidden;
          border-radius: 34px;
          background: #dfe5df;
          box-shadow: 0 30px 78px rgba(20,43,29,.16);
          isolation: isolate;
        }

        .offerHeroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: zoom-in;
        }

        .offerHeroImage img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform .7s cubic-bezier(.2,.7,.2,1);
        }

        .offerHeroVisual:hover .offerHeroImage img {
          transform: scale(1.017);
        }

        .offerHeroShade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(6,13,9,.20), rgba(6,13,9,.02) 32%, rgba(6,13,9,.09) 52%, rgba(6,13,9,.83)),
            linear-gradient(90deg, rgba(6,13,9,.22), transparent 46%);
        }

        .offerHeroTop {
          position: absolute;
          z-index: 3;
          top: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .offerHeroBadge,
        .offerHeroGalleryButton {
          border: 1px solid rgba(255,255,255,.42);
          border-radius: 999px;
          background: rgba(17,31,22,.34);
          color: #fff;
          backdrop-filter: blur(16px);
        }

        .offerHeroBadge {
          padding: 9px 12px;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .12em;
        }

        .offerHeroGalleryButton {
          padding: 10px 13px;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .offerHeroCopy {
          position: absolute;
          z-index: 3;
          left: clamp(24px,4vw,52px);
          right: clamp(24px,4vw,52px);
          bottom: clamp(28px,4vw,50px);
          max-width: 900px;
          color: #fff;
          text-shadow: 0 2px 26px rgba(0,0,0,.2);
        }

        .offerHeroLocation {
          margin-bottom: 10px;
          color: rgba(255,255,255,.86);
          font-size: 14px;
          font-weight: 850;
        }

        .offerHeroCopy h1 {
          margin: 0;
          font-size: clamp(44px,6vw,80px);
          line-height: .93;
          letter-spacing: -.055em;
          text-wrap: balance;
        }

        .offerHeroMeta {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 17px;
          color: rgba(255,255,255,.92);
          font-size: 14px;
          font-weight: 760;
        }

        .offerHeroMeta i {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,.62);
        }

        .offerHeroCounter {
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

        .offerHeroArrow {
          position: absolute;
          z-index: 4;
          top: 50%;
          width: 44px;
          height: 56px;
          transform: translateY(-50%);
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 17px;
          background: rgba(16,29,20,.28);
          color: #fff;
          font-size: 34px;
          opacity: 0;
          cursor: pointer;
          backdrop-filter: blur(12px);
        }

        .offerHeroVisual:hover .offerHeroArrow { opacity: 1; }
        .offerHeroArrowLeft { left: 16px; }
        .offerHeroArrowRight { right: 16px; }

        .offerThumbRail {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 11px 2px 2px;
          scrollbar-width: none;
        }

        .offerThumbRail::-webkit-scrollbar { display: none; }

        .offerThumb {
          flex: 0 0 82px;
          height: 58px;
          padding: 0;
          overflow: hidden;
          border: 2px solid transparent;
          border-radius: 13px;
          background: #e3e7e2;
          opacity: .66;
          cursor: pointer;
        }

        .offerThumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .offerThumb.isActive,
        .offerThumb:hover {
          opacity: 1;
        }

        .offerThumb.isActive {
          border-color: #1d4933;
        }

        .offerGrid {
          grid-template-columns: minmax(0,1fr) 344px;
          gap: 28px;
          margin-top: 0;
        }

        .mainCard {
          padding: 6px 0 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .offerFacts {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          margin-bottom: 34px;
          border-top: 1px solid rgba(28,50,35,.13);
          border-bottom: 1px solid rgba(28,50,35,.13);
        }

        .offerFact {
          min-width: 0;
          padding: 18px 20px 18px 0;
        }

        .offerFact + .offerFact {
          padding-left: 20px;
          border-left: 1px solid rgba(28,50,35,.10);
        }

        .offerFact span {
          display: block;
          margin-bottom: 6px;
          color: #7a887f;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .offerFact strong {
          display: block;
          color: #183d2b;
          font-size: 17px;
          line-height: 1.22;
        }

        .description {
          margin: 0 0 38px;
          padding: 0;
          border: 0;
        }

        .description > span {
          color: #748279;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .16em;
        }

        .description h2 {
          margin: 7px 0 12px;
          font-size: clamp(28px,3.4vw,42px);
          line-height: 1;
          letter-spacing: -.045em;
        }

        .description p {
          max-width: 820px;
          margin: 0;
          color: #4d5d53;
          font-size: 16px;
          line-height: 1.82;
          white-space: pre-line;
        }

        .offerDescriptionWrap {
          position: relative;
          max-width: 820px;
          max-height: 150px;
          overflow: hidden;
          transition: max-height .35s ease;
        }

        .offerDescriptionWrap:not(.isExpanded)::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 68px;
          pointer-events: none;
          background: linear-gradient(180deg,rgba(244,245,240,0),rgba(244,245,240,.96) 74%,#f4f5f0);
        }

        .offerDescriptionWrap.isExpanded {
          max-height: 2400px;
        }

        .offerDescriptionToggle {
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

        .offerDescriptionToggle span {
          display: inline-grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #e8efe9;
        }

        .variants {
          margin-top: 4px;
          padding-top: 28px;
          border-top: 1px solid rgba(28,50,35,.12);
        }

        .variantCard {
          border-radius: 21px;
          background: #fff;
          box-shadow: 0 10px 28px rgba(29,51,36,.05);
        }

        .contactCard {
          position: sticky;
          top: 18px;
          padding: 23px;
          border-radius: 26px;
          background: rgba(255,255,255,.94);
          box-shadow: 0 24px 66px rgba(24,48,31,.10);
          backdrop-filter: blur(18px);
        }

        .offerLightbox {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: grid;
          place-items: center;
          padding: 32px 72px;
          background: rgba(7,12,9,.95);
          backdrop-filter: blur(12px);
        }

        .offerLightboxStage {
          position: relative;
          width: min(1240px,100%);
          height: min(84vh,880px);
          display: grid;
          place-items: center;
        }

        .offerLightboxStage img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 17px;
          box-shadow: 0 30px 90px rgba(0,0,0,.42);
        }

        .offerLightboxCaption {
          position: absolute;
          left: 50%;
          bottom: 12px;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 999px;
          background: rgba(12,20,15,.64);
          color: #fff;
          font-size: 12px;
          backdrop-filter: blur(12px);
        }

        .offerLightboxClose,
        .offerLightboxNav {
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

        .offerLightboxClose {
          top: 18px;
          right: 18px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          font-size: 28px;
        }

        .offerLightboxNav {
          top: 50%;
          width: 48px;
          height: 60px;
          transform: translateY(-50%);
          border-radius: 17px;
          font-size: 38px;
        }

        .offerLightboxPrev { left: 16px; }
        .offerLightboxNext { right: 16px; }

        @media (max-width: 880px) {
          .offerGrid { grid-template-columns: 1fr; }
          .contactCard { position: static; }
        }

        @media (max-width: 680px) {
          .offerDetailsPage { padding: 10px 0 42px; }
          .offerDetailsShell { width: min(100% - 20px,1240px); }

          .offerHeroVisual {
            width: 100%;
            height: 455px;
            margin: 0;
            border-radius: 23px;
          }

          .offerHeroTop {
            top: 13px;
            left: 13px;
            right: 13px;
          }

          .offerHeroBadge { font-size: 9px; }
          .offerHeroGalleryButton { font-size: 10px; }

          .offerHeroCopy {
            left: 20px;
            right: 20px;
            bottom: 26px;
          }

          .offerHeroCopy h1 {
            font-size: clamp(39px,13vw,60px);
          }

          .offerHeroMeta {
            flex-wrap: wrap;
            font-size: 12px;
          }

          .offerHeroArrow { display: none; }

          .offerThumb {
            flex-basis: 70px;
            height: 52px;
          }

          .offerFacts {
            grid-template-columns: 1fr;
            margin-bottom: 28px;
          }

          .offerFact {
            padding: 14px 0;
          }

          .offerFact + .offerFact {
            padding-left: 0;
            border-left: 0;
            border-top: 1px solid rgba(28,50,35,.10);
          }

          .description h2 { font-size: 31px; }
          .description p { font-size: 15px; line-height: 1.72; }
          .offerDescriptionWrap { max-height: 132px; }

          .variantGrid,
          .variantFormGrid,
          .variantPhotoGrid {
            grid-template-columns: 1fr;
          }

          .offerLightbox {
            padding: 16px 8px;
          }

          .offerLightboxStage {
            height: 78vh;
          }

          .offerLightboxNav {
            width: 42px;
            height: 52px;
          }

          .offerLightboxPrev { left: 7px; }
          .offerLightboxNext { right: 7px; }
        }

      `}</style>
    </>
  );
}
