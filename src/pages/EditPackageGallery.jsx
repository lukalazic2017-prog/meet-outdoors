import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
}) {
  const icons = {
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
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    stack: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
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

function LoadingState() {
  return (
    <>
      <EditPackageGalleryStyles />

      <main className="galleryStatePage">
        <div className="galleryStateCard">
          <span className="galleryLoader" />

          <h1>Učitavanje galerije</h1>

          <p>
            Pripremamo fotografije paketa.
          </p>
        </div>
      </main>
    </>
  );
}

export default function EditPackageGallery() {
  const { id } = useParams();
  const {
    profile,
    isHost,
    loading: authLoading,
  } = useAuth();

  const [packageItem, setPackageItem] =
    useState(null);
  const [images, setImages] = useState([]);
  const [pageLoading, setPageLoading] =
    useState(true);
  const [uploading, setUploading] =
    useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] =
    useState(null);

  const loadPackage = useCallback(async () => {
    if (!id || !profile?.id) return;

    const {
      data,
      error: packageError,
    } = await supabase
      .from("packages")
      .select("*")
      .eq("id", id)
      .single();

    if (packageError) {
      throw packageError;
    }

    setPackageItem(data || null);
  }, [id, profile?.id]);

  const loadImages = useCallback(async () => {
    if (!id || !profile?.id) return;

    const {
      data,
      error: imagesError,
    } = await supabase
      .from("package_images")
      .select("*")
      .eq("package_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (imagesError) {
      throw imagesError;
    }

    setImages(data || []);
  }, [id, profile?.id]);

  const loadGallery = useCallback(async () => {
    if (authLoading) return;

    if (!profile?.id) {
      setPackageItem(null);
      setImages([]);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setError("");

    try {
      await Promise.all([
        loadPackage(),
        loadImages(),
      ]);
    } catch (loadError) {
      console.error(
        "Greška pri učitavanju galerije:",
        loadError
      );

      setPackageItem(null);
      setImages([]);
      setError(
        loadError?.message ||
          "Galeriju trenutno nije moguće učitati."
      );
    } finally {
      setPageLoading(false);
    }
  }, [
    authLoading,
    loadImages,
    loadPackage,
    profile?.id,
  ]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  async function refreshImages() {
    setError("");

    try {
      await loadImages();
    } catch (refreshError) {
      console.error(
        "Greška pri osvežavanju galerije:",
        refreshError
      );

      setError(
        refreshError?.message ||
          "Fotografije trenutno nije moguće osvežiti."
      );
    }
  }

  async function uploadImages(fileList) {
    const files = Array.from(fileList || []);

    if (!files.length || uploading) return;

    if (!profile?.id) {
      setError(
        "Moraš da budeš prijavljen."
      );
      return;
    }

    if (packageItem?.host_id !== profile.id) {
      setError(
        "Samo vlasnik paketa može da dodaje fotografije."
      );
      return;
    }

    try {
      setUploading(true);
      setError("");

      for (const file of files) {
        const extension =
          file.name.split(".").pop();
        const cleanExtension = extension
          ? extension.toLowerCase()
          : "jpg";

        const filePath = `${
          profile.id
        }/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${cleanExtension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("package-gallery")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType:
              file.type || undefined,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } =
          supabase.storage
            .from("package-gallery")
            .getPublicUrl(filePath);

        const publicUrl =
          publicData.publicUrl;

        const {
          error: insertError,
        } = await supabase
          .from("package_images")
          .insert({
            package_id: id,
            image_url: publicUrl,
          });

        if (insertError) {
          await supabase.storage
            .from("package-gallery")
            .remove([filePath]);

          throw insertError;
        }
      }

      await loadImages();
    } catch (uploadError) {
      console.error(
        "Greška pri uploadu fotografija:",
        uploadError
      );

      setError(
        uploadError?.message ||
          "Fotografije nije moguće dodati."
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(imageId) {
    const confirmed = window.confirm(
      "Da li sigurno želiš da obrišeš ovu fotografiju?"
    );

    if (!confirmed) return;

    const image = images.find(
      (item) => item.id === imageId
    );

    try {
      setDeletingId(imageId);
      setError("");

      const {
        error: deleteError,
      } = await supabase
        .from("package_images")
        .delete()
        .eq("id", imageId);

      if (deleteError) {
        throw deleteError;
      }

      setImages((previous) =>
        previous.filter(
          (item) => item.id !== imageId
        )
      );

      if (image?.image_url) {
        const [, storagePath] =
          image.image_url.split(
            "/package-gallery/"
          );

        if (storagePath) {
          const {
            error: storageError,
          } = await supabase.storage
            .from("package-gallery")
            .remove([
              decodeURIComponent(
                storagePath
              ),
            ]);

          if (storageError) {
            console.error(
              "Fotografija je obrisana iz baze, ali nije iz storage-a:",
              storageError
            );
          }
        }
      }
    } catch (deleteError) {
      console.error(
        "Greška pri brisanju fotografije:",
        deleteError
      );

      setError(
        deleteError?.message ||
          "Fotografiju nije moguće obrisati."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const packageTitle = useMemo(
    () => packageItem?.title || "Paket",
    [packageItem?.title]
  );

  if (authLoading || pageLoading) {
    return <LoadingState />;
  }

  if (!isHost) {
    return (
      <>
        <EditPackageGalleryStyles />

        <main className="galleryStatePage">
          <div className="galleryStateCard">
            <span className="galleryStateIcon">
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
              uređuju galeriju paketa.
            </p>

            <Link
              to="/"
              className="galleryStatePrimary"
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

  if (!packageItem) {
    return (
      <>
        <EditPackageGalleryStyles />

        <main className="galleryStatePage">
          <div className="galleryStateCard">
            <span className="galleryStateIcon danger">
              <Icon
                name="alert"
                size={28}
              />
            </span>

            <h1>
              Paket nije pronađen
            </h1>

            <p>
              {error ||
                "Ovaj paket ne postoji ili više nije dostupan."}
            </p>

            <button
              type="button"
              className="galleryStatePrimary galleryStateButton"
              onClick={loadGallery}
            >
              <Icon
                name="refresh"
                size={16}
              />
              Pokušaj ponovo
            </button>
          </div>
        </main>
      </>
    );
  }

  if (
    packageItem.host_id !== profile?.id
  ) {
    return (
      <>
        <EditPackageGalleryStyles />

        <main className="galleryStatePage">
          <div className="galleryStateCard">
            <span className="galleryStateIcon danger">
              <Icon
                name="alert"
                size={28}
              />
            </span>

            <h1>Galerija nije tvoja</h1>

            <p>
              Možeš da uređuješ samo
              galerije paketa koje si ti
              kreirao.
            </p>

            <Link
              to="/dashboard"
              className="galleryStatePrimary"
            >
              Otvori dashboard
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

  return (
    <>
      <EditPackageGalleryStyles />

      <main className="galleryPage">
        <section className="galleryHero">
          <div className="galleryHeroCopy">
            <span className="galleryEyebrow">
              <span />
              Host galerija
            </span>

            <h1>
              Fotografije koje
              <br />
              prodaju doživljaj.
            </h1>

            <p>
              Dodaj više vizuelnih detalja
              za paket
              <strong>
                {" "}
                {packageTitle}
              </strong>{" "}
              i predstavi iskustvo iz više
              uglova.
            </p>
          </div>

          <div className="galleryHeroStats">
            <article>
              <strong>
                {images.length}
              </strong>
              <span>fotografija</span>
            </article>

            <article>
              <strong>
                {uploading
                  ? "U toku"
                  : "Spremno"}
              </strong>
              <span>status uploada</span>
            </article>

            <article>
              <strong>
                {packageTitle}
              </strong>
              <span>aktivni paket</span>
            </article>
          </div>
        </section>

        <section className="galleryContent">
          <div className="galleryToolbar">
            <div>
              <span className="gallerySectionLabel">
                Upravljanje galerijom
              </span>

              <h2>
                Dodaj nove fotografije.
              </h2>

              <p>
                Možeš izabrati više slika
                odjednom.
              </p>
            </div>

            <div className="galleryToolbarActions">
              <Link
                to={`/package/${id}`}
              >
                <Icon
                  name="image"
                  size={16}
                />
                Pogledaj paket
              </Link>

              <Link
                to={`/edit-package/${id}`}
              >
                <Icon
                  name="edit"
                  size={16}
                />
                Uredi paket
              </Link>
            </div>
          </div>

          {error && (
            <div
              className="galleryError"
              role="alert"
            >
              <span>
                <Icon
                  name="alert"
                  size={18}
                />
              </span>

              <p>{error}</p>

              <button
                type="button"
                onClick={loadGallery}
              >
                Pokušaj ponovo
              </button>
            </div>
          )}

          <section className="galleryUploadPanel">
            <div className="galleryUploadIcon">
              <Icon
                name="upload"
                size={28}
              />
            </div>

            <div className="galleryUploadCopy">
              <span>
                Dodaj fotografije
              </span>

              <h2>
                Izaberi slike sa računara
                ili telefona.
              </h2>

              <p>
                Podržan je izbor više
                fotografija u jednom
                uploadu.
              </p>
            </div>

            <label
              className={
                uploading
                  ? "galleryUploadButton disabled"
                  : "galleryUploadButton"
              }
            >
              <Icon
                name="upload"
                size={17}
              />

              {uploading
                ? "Upload u toku..."
                : "Izaberi slike"}

              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(event) => {
                  uploadImages(
                    event.target.files
                  );

                  event.target.value = "";
                }}
              />
            </label>
          </section>

          <header className="galleryListHeader">
            <div>
              <span className="gallerySectionLabel">
                Trenutna galerija
              </span>

              <h2>
                {images.length} fotografija
              </h2>
            </div>

            <button
              type="button"
              onClick={refreshImages}
            >
              <Icon
                name="refresh"
                size={16}
              />
              Osveži
            </button>
          </header>

          {images.length === 0 ? (
            <section className="galleryEmpty">
              <span>
                <Icon
                  name="stack"
                  size={31}
                />
              </span>

              <h2>
                Galerija je još prazna.
              </h2>

              <p>
                Dodaj nekoliko kvalitetnih
                fotografija kako bi paket
                izgledao privlačnije.
              </p>
            </section>
          ) : (
            <section className="galleryGrid">
              {images.map(
                (image, index) => (
                  <article
                    key={image.id}
                    className="galleryCard"
                  >
                    <div className="galleryImageWrap">
                      <img
                        src={image.image_url}
                        alt={`${packageTitle} ${
                          index + 1
                        }`}
                      />

                      <span className="galleryIndex">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="galleryCardFooter">
                      <div>
                        <span>
                          Fotografija
                        </span>

                        <strong>
                          {packageTitle}
                        </strong>
                      </div>

                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          image.id
                        }
                        onClick={() =>
                          deleteImage(
                            image.id
                          )
                        }
                      >
                        <Icon
                          name="trash"
                          size={16}
                        />

                        {deletingId ===
                        image.id
                          ? "Brisanje..."
                          : "Obriši"}
                      </button>
                    </div>
                  </article>
                )
              )}
            </section>
          )}

          <section className="gallerySummary">
            <div>
              <span className="gallerySectionLabel">
                Vizuelni utisak
              </span>

              <h2>
                Prikaži atmosferu, detalje
                i osećaj iskustva.
              </h2>

              <p>
                Dobra galerija pomaže
                gostima da lakše zamisle
                kako će izgledati njihov
                boravak.
              </p>
            </div>

            <Link
              to={`/package/${id}`}
            >
              Otvori paket
              <Icon
                name="arrowRight"
                size={16}
              />
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function EditPackageGalleryStyles() {
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
      input {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .galleryPage,
      .galleryStatePage {
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

      .galleryPage {
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

      .galleryPage a {
        color: inherit;
        text-decoration: none;
      }

      .galleryHero {
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
          0 34px 90px rgba(23, 54, 36, 0.18);
      }

      .galleryHero::before {
        position: absolute;
        top: -170px;
        right: -140px;
        z-index: -1;
        width: 550px;
        height: 550px;
        border:
          1px solid rgba(255, 255, 255, 0.07);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 80px rgba(255, 255, 255, 0.02),
          0 0 0 160px rgba(255, 255, 255, 0.012);
      }

      .galleryHeroCopy {
        max-width: 860px;
        padding-top: 105px;
      }

      .galleryEyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border:
          1px solid rgba(255, 255, 255, 0.14);
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

      .galleryEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow:
          0 0 0 5px rgba(206, 243, 154, 0.12);
      }

      .galleryHeroCopy h1 {
        margin: 24px 0 0;
        font-size:
          clamp(56px, 7.3vw, 94px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .galleryHeroCopy p {
        max-width: 610px;
        margin: 25px 0 0;
        color:
          rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .galleryHeroCopy strong {
        color: white;
      }

      .galleryHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .galleryHeroStats article {
        padding: 17px;
        border:
          1px solid rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background:
          rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .galleryHeroStats strong,
      .galleryHeroStats span {
        display: block;
      }

      .galleryHeroStats strong {
        overflow: hidden;
        font-size: 18px;
        letter-spacing: -0.03em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .galleryHeroStats span {
        margin-top: 6px;
        color:
          rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .galleryContent {
        width: min(1100px, 100%);
        margin: 0 auto;
      }

      .galleryToolbar,
      .galleryListHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
      }

      .galleryToolbar {
        margin: 50px 0 22px;
      }

      .galleryListHeader {
        margin: 34px 0 18px;
      }

      .gallerySectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .galleryToolbar h2,
      .galleryListHeader h2,
      .gallerySummary h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size:
          clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .galleryToolbar p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
      }

      .galleryToolbarActions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .galleryToolbarActions a,
      .galleryListHeader button {
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

      .galleryListHeader button {
        cursor: pointer;
      }

      .galleryError {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        margin-bottom: 18px;
        padding: 14px;
        border: 1px solid #efc7c2;
        border-radius: 16px;
        background: #fff0ee;
        color: #963f35;
      }

      .galleryError > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .galleryError p {
        margin: 0;
        font-size: 10px;
      }

      .galleryError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .galleryUploadPanel {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 18px;
        padding: 24px;
        border: 1px solid #dbe4d8;
        border-radius: 26px;
        background:
          rgba(255, 255, 255, 0.79);
        box-shadow:
          0 16px 42px rgba(31, 51, 38, 0.06);
      }

      .galleryUploadIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: #e7f0dc;
        color: #608047;
      }

      .galleryUploadCopy > span {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .galleryUploadCopy h2 {
        margin: 7px 0 0;
        color: #33483b;
        font-size: 24px;
        letter-spacing: -0.045em;
      }

      .galleryUploadCopy p {
        margin: 7px 0 0;
        color: #839087;
        font-size: 10px;
      }

      .galleryUploadButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 46px;
        padding: 0 17px;
        border-radius: 14px;
        background: #183a27;
        color: white;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
        transition: 0.2s ease;
      }

      .galleryUploadButton:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .galleryUploadButton.disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .galleryUploadButton input {
        display: none;
      }

      .galleryGrid {
        display: grid;
        grid-template-columns:
          repeat(
            auto-fit,
            minmax(260px, 1fr)
          );
        gap: 18px;
      }

      .galleryCard {
        overflow: hidden;
        border: 1px solid #dbe4d8;
        border-radius: 25px;
        background:
          rgba(255, 255, 255, 0.8);
        box-shadow:
          0 14px 38px rgba(31, 51, 38, 0.05);
        transition: 0.22s ease;
      }

      .galleryCard:hover {
        transform: translateY(-4px);
        border-color: #bccbb7;
        background: white;
        box-shadow:
          0 22px 48px rgba(31, 51, 38, 0.1);
      }

      .galleryImageWrap {
        position: relative;
        height: 250px;
        overflow: hidden;
      }

      .galleryImageWrap::after {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            transparent 55%,
            rgba(11, 29, 18, 0.4)
          );
        content: "";
      }

      .galleryImageWrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.45s ease;
      }

      .galleryCard:hover
        .galleryImageWrap img {
        transform: scale(1.035);
      }

      .galleryIndex {
        position: absolute;
        right: 14px;
        bottom: 14px;
        z-index: 2;
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border:
          1px solid rgba(255, 255, 255, 0.18);
        border-radius: 13px;
        background:
          rgba(18, 44, 28, 0.46);
        color: white;
        font-size: 9px;
        font-weight: 900;
        backdrop-filter: blur(12px);
      }

      .galleryCardFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 16px;
      }

      .galleryCardFooter span,
      .galleryCardFooter strong {
        display: block;
      }

      .galleryCardFooter span {
        color: #8b958e;
        font-size: 7px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .galleryCardFooter strong {
        max-width: 180px;
        margin-top: 4px;
        overflow: hidden;
        color: #3d5144;
        font-size: 10px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .galleryCardFooter button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 39px;
        padding: 0 12px;
        border: 1px solid #dfaaa4;
        border-radius: 12px;
        background: #fff0ee;
        color: #a34d43;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .galleryCardFooter button:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .galleryEmpty {
        display: grid;
        place-items: center;
        padding: 76px 25px;
        border: 1px dashed #cad6c6;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.6);
        text-align: center;
      }

      .galleryEmpty > span {
        display: grid;
        place-items: center;
        width: 70px;
        height: 70px;
        border-radius: 22px;
        background: #e7f0dc;
        color: #608047;
      }

      .galleryEmpty h2 {
        margin: 19px 0 0;
        color: #34483b;
        font-size: 23px;
        letter-spacing: -0.04em;
      }

      .galleryEmpty p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .gallerySummary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        margin-top: 24px;
        padding: 31px;
        border: 1px solid #dbe4d8;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.72);
        box-shadow:
          0 14px 38px rgba(31, 51, 38, 0.05);
      }

      .gallerySummary p {
        max-width: 650px;
        margin: 13px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .gallerySummary > a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 0 0 auto;
        min-height: 45px;
        padding: 0 16px;
        border-radius: 14px;
        background: #183a27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
        transition: 0.2s ease;
      }

      .gallerySummary > a:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .galleryStatePage {
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

      .galleryStateCard {
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
          0 20px 60px rgba(28, 48, 35, 0.08);
      }

      .galleryLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          gallerySpin 0.8s linear infinite;
      }

      @keyframes gallerySpin {
        to {
          transform: rotate(360deg);
        }
      }

      .galleryStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .galleryStateIcon.danger {
        background: #ffe9e5;
        color: #a85247;
      }

      .galleryStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .galleryStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      .galleryStatePrimary {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 20px;
        padding: 12px 15px;
        border: 0;
        border-radius: 12px;
        background: #183a27;
        color: white !important;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
        text-decoration: none;
      }

      @media (max-width: 820px) {
        .galleryHeroStats {
          grid-template-columns: 1fr;
        }

        .galleryHero {
          min-height: 720px;
        }

        .galleryUploadPanel {
          grid-template-columns:
            auto minmax(0, 1fr);
        }

        .galleryUploadButton {
          grid-column: 1 / -1;
          width: 100%;
        }

        .gallerySummary {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 700px) {
        .galleryPage {
          padding: 84px 0 64px;
        }

        .galleryStatePage {
          padding-top: 84px;
        }

        .galleryHero {
          min-height: 750px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .galleryHeroCopy {
          padding-top: 110px;
        }

        .galleryHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .galleryContent {
          padding: 0 18px;
        }

        .galleryToolbar,
        .galleryListHeader {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .galleryHero {
          min-height: 790px;
          padding: 19px;
        }

        .galleryHeroCopy h1 {
          font-size: 47px;
        }

        .galleryHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .galleryContent {
          padding: 0 13px;
        }

        .galleryUploadPanel {
          grid-template-columns: 1fr;
        }

        .galleryUploadIcon {
          width: 54px;
          height: 54px;
        }

        .galleryToolbarActions {
          width: 100%;
        }

        .galleryToolbarActions a {
          flex: 1;
          justify-content: center;
        }

        .galleryCardFooter {
          align-items: flex-start;
          flex-direction: column;
        }

        .galleryCardFooter button {
          width: 100%;
        }

        .gallerySummary {
          padding: 22px;
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
