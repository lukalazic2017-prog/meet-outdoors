import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapContainer,
  Marker,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&auto=format&fit=crop";
const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=Explorer";

function Icon({ name, size = 20, strokeWidth = 2 }) {
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
    camera: (
      <>
        <path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    navigation: <path d="m3 11 18-8-8 18-2-8-8-2Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
        <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
        <path d="M12 13v4M8 21h8M9 17h6" />
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

const markerIcon = L.divIcon({
  className: "detailPinShell",
  html: `<div class="detailPin"><span>●</span></div>`,
  iconSize: [48, 58],
  iconAnchor: [24, 52],
});

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PlaceDetails() {
  const { id } = useParams();
  const { profile } = useAuth();
  const fileRef = useRef(null);

  const [place, setPlace] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [comments, setComments] = useState([]);
  const [saved, setSaved] = useState(false);
  const [myCheckin, setMyCheckin] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPlace = useCallback(async () => {
    const { data, error: placeError } = await supabase
      .from("places")
      .select(`
        *,
        place_categories:category_id (
          id,
          name,
          code
        )
      `)
      .eq("id", id)
      .single();

    if (placeError) throw placeError;

    setPlace(data);
  }, [id]);

  const loadCommunity = useCallback(async () => {
    const [
      checkinsResult,
      photosResult,
      commentsResult,
    ] = await Promise.all([
      supabase
        .from("place_checkins")
        .select(`
          id,
          user_id,
          caption,
          visited_at,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("place_id", id)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("place_photos")
        .select(`
          id,
          image_url,
          caption,
          user_id,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("place_id", id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("place_comments")
        .select(`
          id,
          body,
          created_at,
          user_id,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("place_id", id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (!checkinsResult.error) {
      setCheckins(checkinsResult.data || []);
    }

    if (!photosResult.error) {
      setPhotos(photosResult.data || []);
    }

    if (!commentsResult.error) {
      setComments(commentsResult.data || []);
    }
  }, [id]);

  const loadMine = useCallback(async () => {
    if (!profile?.id) {
      setSaved(false);
      setMyCheckin(null);
      return;
    }

    const [saveResult, checkinResult] =
      await Promise.all([
        supabase
          .from("place_saves")
          .select("id")
          .eq("place_id", id)
          .eq("user_id", profile.id)
          .maybeSingle(),

        supabase
          .from("place_checkins")
          .select("id, created_at")
          .eq("place_id", id)
          .eq("user_id", profile.id)
          .eq("is_gps_verified", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (!saveResult.error) {
      setSaved(Boolean(saveResult.data));
    }

    if (!checkinResult.error) {
      setMyCheckin(checkinResult.data || null);
    }
  }, [id, profile?.id]);

  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadPlace(),
        loadCommunity(),
        loadMine(),
      ]);
    } catch (loadError) {
      setError(
        loadError?.message ||
          "Mesto trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }, [loadCommunity, loadMine, loadPlace]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function toggleSave() {
    if (!profile?.id) {
      setError("Prijavi se da sačuvaš mesto.");
      return;
    }

    if (saved) {
      const { error: removeError } = await supabase
        .from("place_saves")
        .delete()
        .eq("place_id", id)
        .eq("user_id", profile.id);

      if (!removeError) setSaved(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("place_saves")
      .insert({
        place_id: id,
        user_id: profile.id,
      });

    if (!saveError) setSaved(true);
  }

  function checkIn() {
    if (!profile?.id) {
      setError("Prijavi se da napraviš GPS check-in.");
      return;
    }

    if (!navigator.geolocation) {
      setError("GPS nije dostupan.");
      return;
    }

    setCheckingIn(true);
    setError("");
    setNotice("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data, error: rpcError } =
            await supabase.rpc(
              "create_verified_checkin",
              {
                p_place_id: id,
                p_latitude:
                  position.coords.latitude,
                p_longitude:
                  position.coords.longitude,
                p_accuracy_m:
                  position.coords.accuracy,
                p_caption: null,
                p_visibility: "public",
                p_device_timestamp:
                  new Date().toISOString(),
              }
            );

          if (rpcError) throw rpcError;

          const result = data?.[0];

          setMyCheckin({
            id: result?.checkin_id,
            created_at: new Date().toISOString(),
          });

          setNotice(
            `GPS VERIFIED ✓ ${Math.round(
              result?.distance_m || 0
            )} m od lokacije.`
          );

          await Promise.all([
            loadPlace(),
            loadCommunity(),
          ]);
        } catch (checkinError) {
          setError(
            checkinError?.message ||
              "GPS check-in nije uspeo."
          );
        } finally {
          setCheckingIn(false);
        }
      },
      (geoError) => {
        setCheckingIn(false);
        setError(
          geoError?.message ||
            "Lokaciju nije moguće očitati."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !profile?.id || !place) return;

    if (!myCheckin && place.created_by !== profile.id) {
      setError(
        "Fotografiju možeš dodati nakon GPS check-ina."
      );
      return;
    }

    setUploading(true);
    setError("");

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const path = `${profile.id}/${place.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("place-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("place-media")
        .getPublicUrl(path);

      const { error: photoError } = await supabase
        .from("place_photos")
        .insert({
          place_id: place.id,
          user_id: profile.id,
          checkin_id: myCheckin?.id || null,
          storage_path: path,
          image_url: publicData.publicUrl,
          mime_type: file.type || null,
          file_size: file.size || null,
        });

      if (photoError) {
        await supabase.storage
          .from("place-media")
          .remove([path]);
        throw photoError;
      }

      setNotice("Fotografija je dodata.");
      await Promise.all([loadCommunity(), loadPlace()]);
    } catch (uploadPhotoError) {
      setError(
        uploadPhotoError?.message ||
          "Fotografiju nije moguće dodati."
      );
    } finally {
      setUploading(false);
    }
  }

  async function submitComment() {
    const body = comment.trim();

    if (!profile?.id || !body) return;

    setCommenting(true);

    const { error: commentError } = await supabase
      .from("place_comments")
      .insert({
        place_id: id,
        user_id: profile.id,
        body,
      });

    setCommenting(false);

    if (commentError) {
      setError(commentError.message);
      return;
    }

    setComment("");
    await loadCommunity();
  }

  const visitors = useMemo(() => {
    const unique = new Map();

    checkins.forEach((checkin) => {
      if (checkin.profiles?.id) {
        unique.set(
          checkin.profiles.id,
          checkin.profiles
        );
      }
    });

    return Array.from(unique.values());
  }, [checkins]);

  if (loading) {
    return (
      <>
        <DetailsStyles />
        <main className="detailState">
          <span />
          <strong>Učitavanje mesta...</strong>
        </main>
      </>
    );
  }

  if (!place) {
    return (
      <>
        <DetailsStyles />
        <main className="detailState">
          <Icon name="alert" size={28} />
          <strong>Mesto nije pronađeno.</strong>
          <Link to="/explore">Nazad na mapu</Link>
        </main>
      </>
    );
  }

  const heroImage =
    photos[0]?.image_url ||
    place.cover_url ||
    FALLBACK_COVER;

  return (
    <>
      <DetailsStyles />

      <main className="detailPage">
        <section
          className="detailHero"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(5,17,10,.06),rgba(5,17,10,.92)),url(${heroImage})`,
          }}
        >
          <Link to="/explore" className="detailBack">
            <Icon name="arrowLeft" size={16} />
            Explore
          </Link>

          <div className="detailHeroCopy">
            <span>
              <i />
              {place.place_categories?.name ||
                "Outdoor mesto"}
            </span>

            <h1>{place.name}</h1>

            <p>
              <Icon name="mapPin" size={16} />
              {[place.locality, place.region]
                .filter(Boolean)
                .join(" · ") || "Srbija"}
            </p>
          </div>

          <div className="detailHeroStats">
            <article>
              <strong>{place.visitors_count || 0}</strong>
              <span>ljudi bilo ovde</span>
            </article>
            <article>
              <strong>{place.checkins_count || 0}</strong>
              <span>GPS check-inova</span>
            </article>
            <article>
              <strong>{place.photos_count || 0}</strong>
              <span>fotografija</span>
            </article>
            <article>
              <strong>{place.saves_count || 0}</strong>
              <span>želi da poseti</span>
            </article>
          </div>
        </section>

        <section className="detailContent">
          <section className="detailActionDock">
            <div>
              <span>GPS VERIFIED VISIT</span>
              <strong>
                {myCheckin
                  ? `Poslednji check-in ${formatDate(
                      myCheckin.created_at
                    )}`
                  : "Dođi na lokaciju i potvrdi da si stvarno bio/la ovde."}
              </strong>
            </div>

            <div>
              <button
                type="button"
                className="light"
                onClick={toggleSave}
              >
                <Icon name="heart" size={17} />
                {saved ? "Sačuvano" : "Želim da idem"}
              </button>

              <button
                type="button"
                className="primary"
                disabled={checkingIn}
                onClick={checkIn}
              >
                <Icon name="navigation" size={17} />
                {checkingIn
                  ? "GPS provera..."
                  : "Čekiraj se"}
              </button>

              <button
                type="button"
                className="accent"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="camera" size={17} />
                {uploading ? "Upload..." : "Dodaj sliku"}
              </button>

              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/*"
                onChange={uploadPhoto}
              />
            </div>
          </section>

          {error && (
            <div className="detailMessage error">
              <Icon name="alert" size={16} />
              {error}
            </div>
          )}

          {notice && (
            <div className="detailMessage success">
              <Icon name="check" size={16} />
              {notice}
            </div>
          )}

          <div className="detailGrid">
            <div className="detailMain">
              <section className="detailPanel">
                <span className="detailKicker">O MESTU</span>
                <h2>Ovo je razlog da skreneš sa puta.</h2>

                <p className="detailDescription">
                  {place.description ||
                    place.short_description ||
                    "Zajednica još nije dodala detaljan opis ovog mesta."}
                </p>

                <div className="detailFacts">
                  <article>
                    <span>Težina</span>
                    <strong>
                      {place.difficulty || "—"}
                    </strong>
                  </article>
                  <article>
                    <span>Pristup</span>
                    <strong>
                      {place.access_type || "—"}
                    </strong>
                  </article>
                  <article>
                    <span>Deca</span>
                    <strong>
                      {place.child_friendly === true
                        ? "Da"
                        : place.child_friendly === false
                          ? "Ne"
                          : "—"}
                    </strong>
                  </article>
                  <article>
                    <span>GPS zaštita</span>
                    <strong>
                      {place.location_precision === "exact"
                        ? "Tačna"
                        : "Zaštićena"}
                    </strong>
                  </article>
                </div>
              </section>

              <section className="detailPanel">
                <div className="detailSectionHead">
                  <div>
                    <span className="detailKicker">
                      COMMUNITY GALERIJA
                    </span>
                    <h2>Kako mesto stvarno izgleda.</h2>
                  </div>

                  <small>{photos.length}</small>
                </div>

                {photos.length === 0 ? (
                  <div className="detailEmpty">
                    <Icon name="camera" size={28} />
                    <strong>Još nema fotografija.</strong>
                  </div>
                ) : (
                  <div className="detailGallery">
                    {photos.map((photo, index) => (
                      <article
                        key={photo.id}
                        className={
                          index === 0 ? "featured" : ""
                        }
                      >
                        <img
                          src={photo.image_url}
                          alt={place.name}
                        />

                        <footer>
                          <img
                            src={
                              photo.profiles?.avatar_url ||
                              FALLBACK_AVATAR
                            }
                            alt=""
                          />

                          <span>
                            {photo.profiles?.full_name ||
                              photo.profiles?.username ||
                              "Explorer"}
                          </span>
                        </footer>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="detailPanel">
                <div className="detailSectionHead">
                  <div>
                    <span className="detailKicker">
                      RAZGOVOR
                    </span>
                    <h2>Korisne stvari, bez buke.</h2>
                  </div>

                  <small>{comments.length}</small>
                </div>

                <div className="detailCommentForm">
                  <textarea
                    value={comment}
                    onChange={(event) =>
                      setComment(event.target.value)
                    }
                    placeholder="Put, parking, stanje staze, savet..."
                  />

                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={commenting || !comment.trim()}
                  >
                    <Icon name="message" size={16} />
                    {commenting ? "Objavljivanje..." : "Objavi"}
                  </button>
                </div>

                <div className="detailComments">
                  {comments.map((item) => {
                    const user = item.profiles;
                    const userUrl =
                      user?.role === "host"
                        ? `/h/${user.username}`
                        : `/u/${user?.username}`;

                    return (
                      <article key={item.id}>
                        <Link to={userUrl}>
                          <img
                            src={
                              user?.avatar_url ||
                              FALLBACK_AVATAR
                            }
                            alt=""
                          />
                        </Link>

                        <div>
                          <div>
                            <Link to={userUrl}>
                              {user?.full_name ||
                                user?.username ||
                                "Explorer"}
                            </Link>

                            <small>
                              {formatDate(item.created_at)}
                            </small>
                          </div>

                          <p>{item.body}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="detailSide">
              <section className="detailPanel">
                <span className="detailKicker">LOKACIJA</span>
                <h2>Pronađi trag.</h2>

                <div className="detailMiniMap">
                  <MapContainer
                    center={[
                      Number(place.latitude),
                      Number(place.longitude),
                    ]}
                    zoom={
                      place.location_precision === "exact"
                        ? 13
                        : 10
                    }
                    scrollWheelZoom={false}
                    dragging={false}
                    className="detailLeaflet"
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker
                      position={[
                        Number(place.latitude),
                        Number(place.longitude),
                      ]}
                      icon={markerIcon}
                    />
                  </MapContainer>
                </div>

                {place.location_precision !== "exact" && (
                  <div className="detailProtected">
                    <Icon name="shield" size={16} />
                    <span>
                      Javna tačka je namerno približna.
                    </span>
                  </div>
                )}
              </section>

              <section className="detailPanel">
                <div className="detailSectionHead compact">
                  <div>
                    <span className="detailKicker">
                      BILI SU OVDE
                    </span>
                    <h2>{visitors.length} ljudi</h2>
                  </div>
                </div>

                <div className="detailVisitors">
                  {visitors.slice(0, 20).map((user) => (
                    <Link
                      key={user.id}
                      to={
                        user.role === "host"
                          ? `/h/${user.username}`
                          : `/u/${user.username}`
                      }
                      title={
                        user.full_name ||
                        user.username
                      }
                    >
                      <img
                        src={
                          user.avatar_url ||
                          FALLBACK_AVATAR
                        }
                        alt=""
                      />
                    </Link>
                  ))}
                </div>
              </section>

              <section className="detailPassport">
                <Icon name="trophy" size={24} />

                <span>OUTDOOR PASSPORT</span>

                <h3>
                  Ne skupljaš lajkove.
                  <br />
                  Skupljaš mesta.
                </h3>

                <p>
                  GPS potvrđena lokacija ulazi u tvoj Explore identitet.
                </p>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function DetailsStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      body{margin:0;background:#e8ece4}
      button,textarea{font:inherit}
      .detailPage,.detailState{min-height:100vh;color:#1d3025;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .detailPage{padding:118px 24px 70px;background:radial-gradient(circle at 6% 0%,rgba(186,255,158,.13),transparent 24%),#e8ece4}
      .detailPage a{color:inherit;text-decoration:none}
      .detailHero{position:relative;isolation:isolate;width:min(1280px,100%);min-height:690px;margin:0 auto;padding:32px;overflow:hidden;border-radius:36px;background-position:center;background-size:cover;color:#fff;box-shadow:0 32px 90px rgba(24,55,36,.22)}
      .detailBack{display:inline-flex;align-items:center;gap:7px;min-height:39px;padding:0 12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(4,14,8,.25);color:#fff!important;font-size:8px;font-weight:850;backdrop-filter:blur(12px)}
      .detailHeroCopy{max-width:970px;padding-top:140px}.detailHeroCopy>span{display:inline-flex;align-items:center;gap:7px;color:#baff9e;font-size:8px;font-weight:950;letter-spacing:.11em;text-transform:uppercase}.detailHeroCopy i{width:7px;height:7px;border-radius:50%;background:#baff9e}.detailHero h1{margin:19px 0 0;font-size:clamp(60px,8vw,108px);line-height:.84;letter-spacing:-.08em}.detailHeroCopy>p{display:flex;align-items:center;gap:7px;margin:19px 0 0;color:rgba(255,255,255,.65);font-size:9px}
      .detailHeroStats{position:absolute;right:32px;bottom:32px;left:32px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.detailHeroStats article{padding:15px;border:1px solid rgba(255,255,255,.11);border-radius:15px;background:rgba(4,14,8,.38);backdrop-filter:blur(14px)}.detailHeroStats strong,.detailHeroStats span{display:block}.detailHeroStats strong{font-size:20px}.detailHeroStats span{margin-top:5px;color:rgba(255,255,255,.4);font-size:6px;font-weight:850;text-transform:uppercase}
      .detailContent{width:min(1180px,100%);margin:18px auto 0}.detailActionDock{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px;border:1px solid #d8e0d5;border-radius:19px;background:#fff;box-shadow:0 14px 35px rgba(28,48,35,.06)}.detailActionDock>div:first-child span,.detailActionDock>div:first-child strong{display:block}.detailActionDock>div:first-child span{color:#789456;font-size:7px;font-weight:900;letter-spacing:.1em}.detailActionDock>div:first-child strong{margin-top:4px;color:#465b4e;font-size:8px}.detailActionDock>div:last-child{display:flex;gap:7px}.detailActionDock button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 12px;border-radius:12px;cursor:pointer;font-size:8px;font-weight:850}.detailActionDock .light{border:1px solid #d6dfd2;background:#f7f9f5;color:#53675a}.detailActionDock .primary{border:1px solid #173b27;background:#173b27;color:#fff}.detailActionDock .accent{border:1px solid #c8e5b6;background:#eaf7df;color:#4d7138}.detailActionDock button:disabled{opacity:.5}
      .detailMessage{display:flex;align-items:center;gap:7px;margin-top:9px;padding:11px 13px;border-radius:12px;font-size:8px}.detailMessage.error{border:1px solid #efc2bc;background:#fff0ee;color:#98463c}.detailMessage.success{border:1px solid #cbe0c1;background:#eef8e8;color:#4f733b}
      .detailGrid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:15px;margin-top:15px}.detailMain,.detailSide{display:grid;align-content:start;gap:15px}.detailPanel{padding:22px;border:1px solid #d8e0d5;border-radius:23px;background:rgba(255,255,255,.85);box-shadow:0 13px 34px rgba(28,48,35,.045)}.detailKicker{color:#789456;font-size:7px;font-weight:900;letter-spacing:.11em}.detailPanel>h2,.detailSectionHead h2{margin:7px 0 0;color:#293e31;font-size:29px;line-height:1.05;letter-spacing:-.05em}.detailDescription{margin:15px 0 0;color:#6e7b72;font-size:10px;line-height:1.8;white-space:pre-wrap}
      .detailFacts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:17px}.detailFacts article{padding:10px;border:1px solid #e0e6dd;border-radius:12px;background:#f7f9f5}.detailFacts span,.detailFacts strong{display:block}.detailFacts span{color:#929b95;font-size:6px}.detailFacts strong{margin-top:4px;color:#415549;font-size:8px}
      .detailSectionHead{display:flex;align-items:flex-end;justify-content:space-between;gap:15px;margin-bottom:14px}.detailSectionHead.compact{margin-bottom:10px}.detailSectionHead small{display:grid;place-items:center;min-width:30px;height:30px;border-radius:10px;background:#eaf2e2;color:#5b7842;font-size:8px;font-weight:900}
      .detailGallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.detailGallery article{position:relative;height:230px;overflow:hidden;border-radius:14px;background:#dce5d8}.detailGallery article.featured{grid-column:1/-1;height:340px}.detailGallery>article>img{width:100%;height:100%;object-fit:cover}.detailGallery footer{position:absolute;right:8px;bottom:8px;left:8px;display:flex;align-items:center;gap:6px;padding:7px;border-radius:10px;background:rgba(5,17,10,.68);color:#fff;backdrop-filter:blur(10px)}.detailGallery footer img{width:25px;height:25px;border-radius:8px;object-fit:cover}.detailGallery footer span{font-size:7px;font-weight:800}
      .detailEmpty{display:grid;place-items:center;padding:45px 20px;border:1px dashed #ccd6c8;border-radius:15px;background:#f8faf6;color:#718276;text-align:center}.detailEmpty strong{margin-top:8px;font-size:9px}
      .detailCommentForm{display:grid;gap:8px}.detailCommentForm textarea{min-height:88px;padding:11px;border:1px solid #d9e2d6;border-radius:11px;background:#f7f9f5;color:#33483b;outline:0;resize:vertical;font-size:9px;line-height:1.55}.detailCommentForm button{justify-self:start;display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 11px;border:0;border-radius:10px;background:#173b27;color:#fff;cursor:pointer;font-size:8px;font-weight:850}
      .detailComments{display:grid;gap:7px;margin-top:13px}.detailComments>article{display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px;padding:10px;border:1px solid #e0e6dd;border-radius:12px;background:#f8faf6}.detailComments>article>a img{width:38px;height:38px;border-radius:11px;object-fit:cover}.detailComments>article>div>div{display:flex;align-items:center;justify-content:space-between;gap:10px}.detailComments a{font-size:8px;font-weight:850}.detailComments small{color:#929b95;font-size:6px}.detailComments p{margin:5px 0 0;color:#6f7b73;font-size:8px;line-height:1.5}
      .detailMiniMap{height:270px;margin-top:13px;overflow:hidden;border-radius:15px}.detailLeaflet{width:100%;height:100%}.detailPinShell{background:transparent!important;border:0!important}.detailPin{display:grid;place-items:center;width:44px;height:44px;border:3px solid #fff;border-radius:15px 15px 15px 4px;background:#173b27;color:#baff9e;box-shadow:0 13px 28px rgba(9,31,17,.3);transform:rotate(-45deg)}.detailPin span{transform:rotate(45deg)}.detailProtected{display:flex;align-items:flex-start;gap:7px;margin-top:9px;padding:10px;border-radius:11px;background:#fff7dc;color:#806a25;font-size:7px;line-height:1.45}
      .detailVisitors{display:flex;flex-wrap:wrap;gap:6px}.detailVisitors a{display:block;width:44px;height:44px;padding:2px;border:1px solid #d4dfd0;border-radius:14px;background:#fff}.detailVisitors img{width:100%;height:100%;border-radius:11px;object-fit:cover}
      .detailPassport{padding:22px;border-radius:23px;background:linear-gradient(145deg,#0e2a1a,#1d4b31);color:#baff9e;box-shadow:0 18px 40px rgba(23,58,39,.16)}.detailPassport>span{display:block;margin-top:12px;font-size:7px;font-weight:900;letter-spacing:.11em}.detailPassport h3{margin:7px 0 0;color:#fff;font-size:23px;line-height:1.05;letter-spacing:-.04em}.detailPassport p{margin:9px 0 0;color:rgba(255,255,255,.49);font-size:8px;line-height:1.55}
      .detailState{display:grid;place-items:center;align-content:center;gap:10px;background:#e8ece4;text-align:center}.detailState>span{width:38px;height:38px;border:3px solid #d0d9cc;border-top-color:#52783c;border-radius:50%;animation:detailSpin .8s linear infinite}@keyframes detailSpin{to{transform:rotate(360deg)}}.detailState a{padding:11px 13px;border-radius:11px;background:#173b27;color:#fff;text-decoration:none;font-size:8px;font-weight:850}
      @media(max-width:960px){.detailGrid{grid-template-columns:1fr}.detailHeroStats{grid-template-columns:repeat(2,minmax(0,1fr))}.detailHero{min-height:750px}}
      @media(max-width:720px){.detailPage{padding:84px 0 55px}.detailHero{min-height:780px;padding:21px;border-radius:0 0 30px 30px}.detailHeroCopy{padding-top:125px}.detailHeroStats{right:21px;bottom:21px;left:21px}.detailContent{padding:0 12px}.detailActionDock{align-items:flex-start;flex-direction:column}.detailActionDock>div:last-child{display:grid;grid-template-columns:1fr 1fr;width:100%}.detailActionDock .accent{grid-column:1/-1}.detailGallery article.featured{height:280px}}
      @media(max-width:480px){.detailHero{min-height:820px;padding:17px}.detailHero h1{font-size:50px}.detailHeroStats{right:17px;bottom:17px;left:17px}.detailContent{padding:0 9px}.detailActionDock>div:last-child{grid-template-columns:1fr}.detailActionDock .accent{grid-column:auto}.detailPanel{padding:18px}.detailFacts{grid-template-columns:repeat(2,minmax(0,1fr))}.detailGallery{grid-template-columns:1fr}.detailGallery article.featured{grid-column:auto;height:260px}.detailGallery article{height:240px}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    `}</style>
  );
}
