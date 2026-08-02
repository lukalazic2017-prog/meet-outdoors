import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600";
const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=MeetOutdoors";

function Icon({ name, size = 20 }) {
  const icons = {
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 2 2.3Z" />
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    back: (
      <>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
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
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function formatDate(value) {
  if (!value) return "Nije postavljeno";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Nije postavljeno";
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function externalUrl(value) {
  if (!value) return "";

  return /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;
}

function getBookingStatusText(status) {
  if (status === "approved") return "Rezervacija je odobrena";
  if (status === "rejected") return "Rezervacija je odbijena";
  return "Rezervacija je na čekanju";
}

function getBookingStatusDescription(status) {
  if (status === "approved") {
    return "Host je prihvatio tvoj zahtev. Detalje rezervacije možeš da pratiš u sekciji Moje rezervacije.";
  }

  if (status === "rejected") {
    return "Host trenutno nije prihvatio zahtev. Možeš poslati novi zahtev za ovaj paket.";
  }

  return "Zahtev je uspešno poslat hostu. Status će se promeniti čim host donese odluku.";
}

function LoadingState() {
  return (
    <>
      <PackageDetailsStyles />

      <main className="packageStatePage">
        <div className="packageStateCard">
          <span className="packageLoader" />
          <h1>Učitavanje paketa</h1>
          <p>Pripremamo sve detalje avanture.</p>
        </div>
      </main>
    </>
  );
}

export default function PackageDetails() {
  const { id } = useParams();
  const { profile } = useAuth();

  const [item, setItem] = useState(null);
  const [host, setHost] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  const [interested, setInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);

  const [currentBooking, setCurrentBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const [error, setError] = useState("");

  const loadComments = useCallback(async (packageId) => {
    const { data, error: commentsError } = await supabase
      .from("package_comments")
      .select(`
        id,
        body,
        created_at,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq("package_id", packageId)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Greška pri učitavanju komentara:", commentsError);
      return;
    }

    setComments(data || []);
  }, []);

  const loadReviews = useCallback(async (packageId) => {
    const { data, error: reviewsError } = await supabase
      .from("package_reviews")
      .select(`
        id,
        rating,
        review,
        created_at,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq("package_id", packageId)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      console.error("Greška pri učitavanju recenzija:", reviewsError);
      return;
    }

    const rows = data || [];
    setReviews(rows);

    if (rows.length > 0) {
      const average =
        rows.reduce(
          (sum, review) =>
            sum + Number(review.rating || 0),
          0
        ) / rows.length;

      setAverageRating(average.toFixed(1));
    } else {
      setAverageRating(0);
    }
  }, []);

  const loadPackage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: packageError } = await supabase
        .from("packages")
        .select("*")
        .eq("id", id)
        .single();

      if (packageError || !data) {
        throw packageError || new Error("Package not found.");
      }

      setItem(data);

      const { data: hostData, error: hostError } = await supabase
        .from("profiles")
        .select(
          "username, full_name, avatar_url, phone, instagram_url, website_url"
        )
        .eq("id", data.host_id)
        .single();

      if (hostError) {
        console.error("Greška pri učitavanju hosta:", hostError);
      }

      setHost(hostData || null);

      const { data: galleryData, error: galleryError } =
        await supabase
          .from("package_images")
          .select("*")
          .eq("package_id", data.id)
          .order("created_at", { ascending: false });

      if (galleryError) {
        console.error("Greška pri učitavanju galerije:", galleryError);
      }

      setGallery(galleryData || []);

      const { count, error: countError } = await supabase
        .from("package_interested")
        .select("*", { count: "exact", head: true })
        .eq("package_id", data.id);

      if (countError) {
        console.error("Greška pri brojanju interesovanja:", countError);
      }

      setInterestedCount(count || 0);

      if (profile?.id) {
        const { data: existing, error: interestedError } =
          await supabase
            .from("package_interested")
            .select("id")
            .eq("package_id", data.id)
            .eq("user_id", profile.id)
            .maybeSingle();

        if (interestedError) {
          console.error(
            "Greška pri učitavanju interesovanja:",
            interestedError
          );
        }

        setInterested(Boolean(existing));

        const { data: bookingData, error: bookingStatusError } =
          await supabase
            .from("bookings")
            .select("id, status, created_at, updated_at")
            .eq("package_id", data.id)
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (bookingStatusError) {
          console.error(
            "Greška pri učitavanju rezervacije:",
            bookingStatusError
          );
        }

        setCurrentBooking(bookingData || null);
      } else {
        setInterested(false);
        setCurrentBooking(null);
      }

      await Promise.all([
        loadComments(data.id),
        loadReviews(data.id),
      ]);
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
      setLoading(false);
    }
  }, [
    id,
    profile?.id,
    loadComments,
    loadReviews,
  ]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  useEffect(() => {
    if (!profile?.id || !item?.id) return undefined;

    const channel = supabase
      .channel(`package-booking-${item.id}-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const changedBooking = payload.new || payload.old;

          if (
            Number(changedBooking?.package_id) !== Number(item.id)
          ) {
            return;
          }

          if (payload.eventType === "DELETE") {
            setCurrentBooking(null);
            return;
          }

          setCurrentBooking(changedBooking);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [item?.id, profile?.id]);

  async function toggleInterested() {
    if (!profile?.id) {
      alert("Prijavi se da bi sačuvao paket.");
      return;
    }

    if (!item?.id) return;

    if (interested) {
      const { error: deleteError } = await supabase
        .from("package_interested")
        .delete()
        .eq("package_id", item.id)
        .eq("user_id", profile.id);

      if (deleteError) {
        alert(deleteError.message);
        return;
      }

      setInterested(false);
      setInterestedCount((previous) =>
        Math.max(previous - 1, 0)
      );
      return;
    }

    const { error: insertError } = await supabase
      .from("package_interested")
      .insert({
        package_id: item.id,
        user_id: profile.id,
      });

    if (insertError) {
      alert(insertError.message);
      return;
    }

    setInterested(true);
    setInterestedCount((previous) => previous + 1);

    if (item.host_id !== profile.id) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: item.host_id,
          from_user_id: profile.id,
          package_id: item.id,
          type: "package_interested",
          title: "Novo interesovanje za paket",
          message: `${
            profile.full_name || profile.username
          } je zainteresovan/a za paket: ${item.title}`,
        });

      if (notificationError) {
        console.error(
          "Greška pri slanju notifikacije:",
          notificationError
        );
      }
    }
  }

  async function bookNow() {
    if (!profile?.id) {
      alert("Prijavi se da bi rezervisao paket.");
      return;
    }

    if (!item?.id) return;

    if (
      currentBooking?.status === "pending" ||
      currentBooking?.status === "approved"
    ) {
      return;
    }

    try {
      setBookingLoading(true);

      const { data: createdBooking, error: bookingError } =
        await supabase
          .from("bookings")
          .insert({
            package_id: item.id,
            host_id: item.host_id,
            user_id: profile.id,
            guests: 1,
            status: "pending",
          })
          .select("id, status, created_at, updated_at")
          .single();

      if (bookingError) throw bookingError;

      setCurrentBooking(createdBooking);

      if (item.host_id !== profile.id) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: item.host_id,
            from_user_id: profile.id,
            package_id: item.id,
            type: "package_booking",
            title: "Novi zahtev za rezervaciju",
            message: `${
              profile.full_name || profile.username
            } je poslao/la zahtev za rezervaciju paketa ${item.title}`,
          });

        if (notificationError) {
          console.error(
            "Greška pri slanju notifikacije:",
            notificationError
          );
        }
      }

      alert("Zahtev za rezervaciju je poslat.");
    } catch (bookingError) {
      alert(
        bookingError.message ||
          "Rezervacija nije uspela."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  async function submitComment() {
    if (!profile?.id) {
      alert("Prijavi se da bi ostavio komentar.");
      return;
    }

    if (!item?.id) return;

    const body = commentBody.trim();

    if (!body) {
      alert("Komentar je prazan.");
      return;
    }

    try {
      setCommentLoading(true);

      const { error: commentError } = await supabase
        .from("package_comments")
        .insert({
          package_id: item.id,
          user_id: profile.id,
          body,
        });

      if (commentError) throw commentError;

      if (item.host_id !== profile.id) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: item.host_id,
            from_user_id: profile.id,
            package_id: item.id,
            type: "package_comment",
            title: "Novi komentar na paketu",
            message: `${
              profile.full_name || profile.username
            } je komentarisao/la paket: ${item.title}`,
          });

        if (notificationError) {
          console.error(
            "Greška pri slanju notifikacije:",
            notificationError
          );
        }
      }

      setCommentBody("");
      await loadComments(item.id);
    } catch (commentError) {
      alert(
        commentError.message ||
          "Komentar nije objavljen."
      );
    } finally {
      setCommentLoading(false);
    }
  }

  async function submitReview() {
    if (!profile?.id) {
      alert("Prijavi se da bi ostavio recenziju.");
      return;
    }

    if (!item?.id) return;

    try {
      setReviewLoading(true);

      const { error: reviewError } = await supabase
        .from("package_reviews")
        .insert({
          package_id: item.id,
          user_id: profile.id,
          rating,
          review: reviewText.trim(),
        });

      if (reviewError) throw reviewError;

      if (item.host_id !== profile.id) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: item.host_id,
            from_user_id: profile.id,
            package_id: item.id,
            type: "package_review",
            title: "Nova recenzija paketa",
            message: `${
              profile.full_name || profile.username
            } je ocenio/la paket ${rating}/5: ${item.title}`,
          });

        if (notificationError) {
          console.error(
            "Greška pri slanju notifikacije:",
            notificationError
          );
        }
      }

      setReviewText("");
      setRating(5);
      await loadReviews(item.id);

      alert("Recenzija je poslata.");
    } catch (reviewError) {
      alert(
        reviewError.message ||
          "Recenzija nije poslata."
      );
    } finally {
      setReviewLoading(false);
    }
  }

  const location = useMemo(
    () =>
      [item?.location, item?.country]
        .filter(Boolean)
        .join(", ") || "Lokacija nije navedena",
    [item?.location, item?.country]
  );

  const bookingButtonText = useMemo(() => {
    if (bookingLoading) return "Slanje...";
    if (currentBooking?.status === "pending") return "Na čekanju";
    if (currentBooking?.status === "approved") return "Odobreno";
    if (currentBooking?.status === "rejected") return "Rezerviši ponovo";
    return "Rezerviši";
  }, [bookingLoading, currentBooking?.status]);

  if (loading) {
    return <LoadingState />;
  }

  if (!item) {
    return (
      <>
        <PackageDetailsStyles />

        <main className="packageStatePage">
          <div className="packageStateCard">
            <span className="packageStateIcon">
              <Icon name="alert" size={28} />
            </span>

            <h1>Paket nije pronađen</h1>

            <p>
              {error ||
                "Ovaj paket ne postoji ili više nije dostupan."}
            </p>

            <div className="packageStateActions">
              <button
                type="button"
                onClick={loadPackage}
              >
                <Icon name="refresh" size={16} />
                Pokušaj ponovo
              </button>

              <Link to="/packages">
                <Icon name="back" size={16} />
                Svi paketi
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PackageDetailsStyles />

      <main className="packagePage">
        <section
          className="packageHero"
          style={{
            backgroundImage: `linear-gradient(
              180deg,
              rgba(6, 20, 12, 0.08),
              rgba(6, 20, 12, 0.84)
            ), url(${item.cover_url || FALLBACK_COVER})`,
          }}
        >
          <div className="packageHeroCopy">
            <span className="packageEyebrow">
              <span />
              MeetOutdoors paket
            </span>

            <h1>{item.title}</h1>

            <p className="packageHeroLocation">
              <Icon name="pin" size={17} />
              {location}
            </p>
          </div>

          <div className="packageHeroStats">
            <article>
              <span>Cena</span>
              <strong>
                {item.currency || "EUR"} {item.price || 0}
              </strong>
            </article>

            <article>
              <span>Trajanje</span>
              <strong>
                {item.duration || "Nije navedeno"}
              </strong>
            </article>

            <article>
              <span>Kapacitet</span>
              <strong>{item.capacity || 1}</strong>
            </article>

            <article>
              <span>Ocena</span>
              <strong>{averageRating || 0} / 5</strong>
            </article>
          </div>
        </section>

        <section className="packageContent">
          <div className="packageActionBar">
            <div>
              <span className="packageActionLabel">
                {interestedCount} zainteresovanih
              </span>

              <strong>
                {currentBooking
                  ? getBookingStatusText(currentBooking.status)
                  : interested
                  ? "Ovaj paket je na tvojoj listi."
                  : "Sačuvaj paket ili pošalji rezervaciju."}
              </strong>

              {currentBooking && (
                <div
                  className={`packageBookingStatus ${
                    currentBooking.status || "pending"
                  }`}
                >
                  <span />
                  {getBookingStatusText(currentBooking.status)}
                </div>
              )}
            </div>

            <div className="packageActionButtons">
              <button
                type="button"
                className={`packageInterestedButton ${
                  interested ? "active" : ""
                }`}
                onClick={toggleInterested}
              >
                <Icon name="heart" size={18} />
                {interested
                  ? "Zainteresovan/a"
                  : "Zanima me"}
              </button>

              <button
                type="button"
                className="packageBookButton"
                onClick={bookNow}
                disabled={
                  bookingLoading ||
                  currentBooking?.status === "pending" ||
                  currentBooking?.status === "approved"
                }
              >
                <Icon name="calendar" size={18} />
                {bookingButtonText}
              </button>
            </div>
          </div>

          {currentBooking && (
            <section
              className={`packageBookingBanner ${
                currentBooking.status || "pending"
              }`}
              aria-live="polite"
            >
              <span className="packageBookingBannerIcon">
                <Icon
                  name={
                    currentBooking.status === "approved"
                      ? "check"
                      : currentBooking.status === "rejected"
                      ? "x"
                      : "clock"
                  }
                  size={21}
                />
              </span>

              <div className="packageBookingBannerCopy">
                <span>Status tvoje rezervacije</span>
                <strong>
                  {getBookingStatusText(currentBooking.status)}
                </strong>
                <p>
                  {getBookingStatusDescription(
                    currentBooking.status
                  )}
                </p>
                <small>
                  Poslato: {formatDate(currentBooking.created_at)}
                </small>
              </div>

              <Link to="/my-bookings">
                Moje rezervacije
                <Icon name="arrow" size={16} />
              </Link>
            </section>
          )}

          {gallery.length > 0 && (
            <section className="packageGallerySection">
              <div className="packageSectionHeader">
                <div>
                  <span>Galerija</span>
                  <h2>Atmosfera paketa.</h2>
                </div>

                <small>
                  {gallery.length} fotografija
                </small>
              </div>

              <div className="packageGallery">
                {gallery.map((image, index) => (
                  <img
                    key={image.id}
                    src={image.image_url}
                    alt={`${item.title} ${index + 1}`}
                    className={
                      index === 0 ? "featured" : ""
                    }
                  />
                ))}
              </div>
            </section>
          )}

          <div className="packageMainGrid">
            <div className="packageMainColumn">
              <section className="packagePanel">
                <div className="packageSectionHeader">
                  <div>
                    <span>O paketu</span>
                    <h2>Detalji avanture.</h2>
                  </div>
                </div>

                <p className="packageDescription">
                  {item.description ||
                    "Opis još nije dodat."}
                </p>
              </section>

              <div className="packageIncludeGrid">
                <section className="packagePanel packageIncludePanel">
                  <span className="packagePanelIcon success">
                    <Icon name="check" size={21} />
                  </span>

                  <span className="packagePanelKicker">
                    Uključeno
                  </span>

                  <h3>Šta dobijaš</h3>

                  <p>
                    {item.includes ||
                      "Informacije još nisu dodate."}
                  </p>
                </section>

                <section className="packagePanel packageIncludePanel">
                  <span className="packagePanelIcon danger">
                    <Icon name="x" size={21} />
                  </span>

                  <span className="packagePanelKicker">
                    Nije uključeno
                  </span>

                  <h3>Šta pripremaš samostalno</h3>

                  <p>
                    {item.not_included ||
                      "Informacije još nisu dodate."}
                  </p>
                </section>
              </div>
            </div>

            <aside className="packageSidebar">
              {host && (
                <section className="packagePanel packageHostCard">
                  <span className="packagePanelKicker">
                    Organizator
                  </span>

                  <Link
                    to={`/h/${host.username}`}
                    className="packageHostProfile"
                  >
                    <img
                      src={
                        host.avatar_url ||
                        FALLBACK_AVATAR
                      }
                      alt={
                        host.full_name ||
                        host.username
                      }
                    />

                    <div>
                      <strong>
                        {host.full_name ||
                          host.username}
                      </strong>

                      <span>@{host.username}</span>
                    </div>

                    <Icon name="arrow" size={16} />
                  </Link>

                  <div className="packageHostLinks">
                    {host.phone && (
                      <a href={`tel:${host.phone}`}>
                        <Icon name="phone" size={17} />
                        {host.phone}
                      </a>
                    )}

                    {host.instagram_url && (
                      <a
                        href={externalUrl(
                          host.instagram_url
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon
                          name="instagram"
                          size={17}
                        />
                        Instagram
                      </a>
                    )}

                    {host.website_url && (
                      <a
                        href={externalUrl(
                          host.website_url
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon name="globe" size={17} />
                        Website
                      </a>
                    )}
                  </div>
                </section>
              )}

              <section className="packagePanel packageFactsCard">
                <span className="packagePanelKicker">
                  Brzi pregled
                </span>

                <div className="packageFacts">
                  <article>
                    <Icon name="calendar" size={18} />

                    <div>
                      <span>Početak</span>
                      <strong>
                        {formatDate(item.start_date)}
                      </strong>
                    </div>
                  </article>

                  <article>
                    <Icon name="clock" size={18} />

                    <div>
                      <span>Trajanje</span>
                      <strong>
                        {item.duration ||
                          "Nije navedeno"}
                      </strong>
                    </div>
                  </article>

                  <article>
                    <Icon name="users" size={18} />

                    <div>
                      <span>Kapacitet</span>
                      <strong>
                        {item.capacity || 1}
                      </strong>
                    </div>
                  </article>

                  <article>
                    <Icon name="heart" size={18} />

                    <div>
                      <span>Interesovanje</span>
                      <strong>
                        {interestedCount} ljudi
                      </strong>
                    </div>
                  </article>
                </div>
              </section>
            </aside>
          </div>

          <section className="packageCommunityGrid">
            <div className="packagePanel">
              <div className="packageSectionHeader">
                <div>
                  <span>Komentari</span>
                  <h2>Pitanja i razgovor.</h2>
                </div>

                <small>{comments.length}</small>
              </div>

              <div className="packageForm">
                <textarea
                  placeholder="Postavi pitanje ili napiši komentar..."
                  value={commentBody}
                  onChange={(event) =>
                    setCommentBody(event.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={submitComment}
                  disabled={commentLoading}
                >
                  <Icon name="message" size={17} />
                  {commentLoading
                    ? "Objavljivanje..."
                    : "Objavi komentar"}
                </button>
              </div>

              <div className="packageFeed">
                {comments.length === 0 ? (
                  <div className="packageEmpty">
                    Još nema komentara.
                  </div>
                ) : (
                  comments.map((comment) => {
                    const user = comment.profiles;
                    const profileUrl =
                      user?.role === "host"
                        ? `/h/${user.username}`
                        : `/u/${user?.username}`;

                    return (
                      <article
                        className="packageFeedItem"
                        key={comment.id}
                      >
                        <Link to={profileUrl}>
                          <img
                            src={
                              user?.avatar_url ||
                              FALLBACK_AVATAR
                            }
                            alt={
                              user?.full_name ||
                              user?.username ||
                              "User"
                            }
                          />
                        </Link>

                        <div>
                          <div className="packageFeedTop">
                            <Link to={profileUrl}>
                              {user?.full_name ||
                                user?.username}
                            </Link>

                            <small>
                              {formatDate(
                                comment.created_at
                              )}
                            </small>
                          </div>

                          <p>{comment.body}</p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            <div className="packagePanel">
              <div className="packageSectionHeader">
                <div>
                  <span>Recenzije</span>
                  <h2>Iskustva učesnika.</h2>
                </div>

                <small>
                  {averageRating || 0} / 5
                </small>
              </div>

              <div className="packageForm">
                <select
                  value={rating}
                  onChange={(event) =>
                    setRating(
                      Number(event.target.value)
                    )
                  }
                >
                  <option value={5}>
                    5 — Odlično
                  </option>
                  <option value={4}>
                    4 — Vrlo dobro
                  </option>
                  <option value={3}>
                    3 — Dobro
                  </option>
                  <option value={2}>
                    2 — Može bolje
                  </option>
                  <option value={1}>
                    1 — Loše
                  </option>
                </select>

                <textarea
                  placeholder="Podeli svoje iskustvo..."
                  value={reviewText}
                  onChange={(event) =>
                    setReviewText(event.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewLoading}
                >
                  <Icon name="star" size={17} />
                  {reviewLoading
                    ? "Slanje..."
                    : "Pošalji recenziju"}
                </button>
              </div>

              <div className="packageFeed">
                {reviews.length === 0 ? (
                  <div className="packageEmpty">
                    Još nema recenzija.
                  </div>
                ) : (
                  reviews.map((review) => {
                    const user = review.profiles;
                    const profileUrl =
                      user?.role === "host"
                        ? `/h/${user.username}`
                        : `/u/${user?.username}`;

                    return (
                      <article
                        className="packageFeedItem"
                        key={review.id}
                      >
                        <Link to={profileUrl}>
                          <img
                            src={
                              user?.avatar_url ||
                              FALLBACK_AVATAR
                            }
                            alt={
                              user?.full_name ||
                              user?.username ||
                              "User"
                            }
                          />
                        </Link>

                        <div>
                          <div className="packageFeedTop">
                            <Link to={profileUrl}>
                              {user?.full_name ||
                                user?.username}
                            </Link>

                            <small>
                              {formatDate(
                                review.created_at
                              )}
                            </small>
                          </div>

                          <div className="packageStars">
                            {Array.from({
                              length: 5,
                            }).map((_, index) => (
                              <span
                                key={index}
                                className={
                                  index <
                                  Number(review.rating)
                                    ? "active"
                                    : ""
                                }
                              >
                                ★
                              </span>
                            ))}
                          </div>

                          <p>
                            {review.review ||
                              "Bez pisanog komentara."}
                          </p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

function PackageDetailsStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      body{margin:0;background:#edf1e9}
      button,textarea,select{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .packagePage,.packageStatePage{min-height:100vh;color:#203229;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .packagePage{padding:118px 28px 28px;background:radial-gradient(circle at 7% 0%,rgba(177,211,139,.18),transparent 27%),radial-gradient(circle at 94% 25%,rgba(64,106,75,.1),transparent 24%),#edf1e9}
      .packagePage a{color:inherit;text-decoration:none}
      .packageHero{position:relative;isolation:isolate;width:min(1240px,100%);min-height:660px;margin:0 auto;padding:34px;overflow:hidden;border-radius:36px;background-position:center;background-size:cover;color:white;box-shadow:0 34px 90px rgba(23,54,36,.18)}
      .packageHero:before{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(5,18,11,.04),rgba(5,18,11,.46));content:""}
      .packageHeroCopy{max-width:900px;padding-top:150px}
      .packageEyebrow{display:inline-flex;align-items:center;gap:9px;padding:9px 13px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.76);font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .packageEyebrow>span{width:7px;height:7px;border-radius:50%;background:#cef39a;box-shadow:0 0 0 5px rgba(206,243,154,.12)}
      .packageHeroCopy h1{max-width:980px;margin:24px 0 0;font-size:clamp(54px,7vw,96px);line-height:.9;letter-spacing:-.075em}
      .packageHeroLocation{display:flex;align-items:center;gap:8px;margin:24px 0 0;color:rgba(255,255,255,.72);font-size:13px;font-weight:750}
      .packageHeroStats{position:absolute;right:34px;bottom:34px;left:34px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .packageHeroStats article{padding:17px;border:1px solid rgba(255,255,255,.13);border-radius:17px;background:rgba(12,35,21,.34);backdrop-filter:blur(16px)}
      .packageHeroStats span,.packageHeroStats strong{display:block}
      .packageHeroStats span{color:rgba(255,255,255,.5);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      .packageHeroStats strong{margin-top:7px;font-size:14px}
      .packageContent{width:min(1140px,100%);margin:18px auto 0}
      .packageActionBar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px;border:1px solid #dbe4d8;border-radius:24px;background:rgba(255,255,255,.83);box-shadow:0 18px 46px rgba(31,51,38,.07)}
      .packageActionBar span,.packageActionBar strong{display:block}
      .packageActionLabel{color:#789456;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .packageActionBar strong{margin-top:6px;color:#3f5447;font-size:12px}
      .packageBookingStatus{display:inline-flex!important;align-items:center;gap:8px;margin-top:10px;padding:8px 11px;border-radius:999px;font-size:10px;font-weight:850}
      .packageBookingStatus>span{width:7px;height:7px;border-radius:50%}
      .packageBookingStatus.pending{background:#fff2d8;color:#94651d}
      .packageBookingStatus.pending>span{background:#d99b31}
      .packageBookingStatus.approved{background:#e7f3e1;color:#47733d}
      .packageBookingStatus.approved>span{background:#5d9a4d}
      .packageBookingStatus.rejected{background:#fff0ee;color:#a24d43}
      .packageBookingStatus.rejected>span{background:#c85e52}
      .packageBookingBanner{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;margin-top:14px;padding:18px;border:1px solid;border-radius:20px;box-shadow:0 12px 30px rgba(31,51,38,.05)}
      .packageBookingBanner.pending{border-color:#ead5a5;background:#fff8e9;color:#8a5b16}
      .packageBookingBanner.approved{border-color:#bfd8b5;background:#edf7e9;color:#416d36}
      .packageBookingBanner.rejected{border-color:#e8bbb5;background:#fff2f0;color:#9d463d}
      .packageBookingBannerIcon{display:grid!important;place-items:center;width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.68)}
      .packageBookingBannerCopy>span,.packageBookingBannerCopy>strong,.packageBookingBannerCopy>small{display:block}
      .packageBookingBannerCopy>span{font-size:8px;font-weight:900;letter-spacing:.11em;text-transform:uppercase;opacity:.72}
      .packageBookingBannerCopy>strong{margin-top:4px;font-size:15px}
      .packageBookingBannerCopy>p{margin:6px 0 0;color:#66736a;font-size:10px;line-height:1.55}
      .packageBookingBannerCopy>small{margin-top:6px;color:#7f8982;font-size:8px}
      .packageBookingBanner>a{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 13px;border-radius:12px;background:#183a27;color:white!important;font-size:9px;font-weight:850;white-space:nowrap}
      .packageActionButtons{display:flex;gap:10px}
      .packageActionButtons button,.packageForm button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:45px;padding:0 16px;border-radius:14px;cursor:pointer;font-size:10px;font-weight:850;transition:.2s}
      .packageInterestedButton{border:1px solid #d4dfcf;background:#f8faf6;color:#526758}
      .packageInterestedButton.active{border-color:#d7aaa5;background:#fff0ee;color:#a34c43}
      .packageBookButton,.packageForm button{border:1px solid #244d34;background:#183a27;color:white}
      .packageActionButtons button:disabled,.packageForm button:disabled{cursor:not-allowed;opacity:.65}
      .packageGallerySection,.packageMainGrid,.packageCommunityGrid{margin-top:18px}
      .packageSectionHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px}
      .packageSectionHeader span,.packagePanelKicker{color:#789456;font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
      .packageSectionHeader h2{margin:8px 0 0;color:#2f4437;font-size:28px;line-height:1.05;letter-spacing:-.05em}
      .packageSectionHeader small{color:#8d978f;font-size:9px}
      .packageGallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:220px;gap:12px}
      .packageGallery img{width:100%;height:100%;border-radius:22px;object-fit:cover;box-shadow:0 14px 32px rgba(31,51,38,.08)}
      .packageGallery img.featured{grid-column:span 2;grid-row:span 2}
      .packageMainGrid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(300px,.7fr);gap:18px}
      .packageMainColumn,.packageSidebar{display:grid;align-content:start;gap:18px}
      .packagePanel{padding:26px;border:1px solid #dbe4d8;border-radius:26px;background:rgba(255,255,255,.76);box-shadow:0 14px 38px rgba(31,51,38,.05)}
      .packageDescription,.packageIncludePanel p,.packageHostCard p{margin:0;color:#6e7a72;font-size:12px;line-height:1.8;white-space:pre-wrap}
      .packageIncludeGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
      .packageIncludePanel h3{margin:8px 0 12px;color:#33483a;font-size:20px;letter-spacing:-.04em}
      .packagePanelIcon{display:grid;place-items:center;width:44px;height:44px;margin-bottom:18px;border-radius:14px}
      .packagePanelIcon.success{background:#e7f0dc;color:#5e7c42}
      .packagePanelIcon.danger{background:#fff0ee;color:#a4544a}
      .packageHostProfile{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;margin-top:16px;padding:13px;border:1px solid #dfe6dc;border-radius:17px;background:#f8faf6}
      .packageHostProfile img{width:54px;height:54px;border-radius:16px;object-fit:cover}
      .packageHostProfile strong,.packageHostProfile span{display:block}
      .packageHostProfile strong{color:#35493c;font-size:12px}
      .packageHostProfile span{margin-top:4px;color:#8b958e;font-size:9px}
      .packageHostLinks{display:grid;gap:8px;margin-top:12px}
      .packageHostLinks a{display:flex;align-items:center;gap:9px;padding:12px;border:1px solid #e0e7dd;border-radius:14px;background:#fafbf9;color:#55695b;font-size:10px;font-weight:750}
      .packageFacts{display:grid;gap:10px;margin-top:16px}
      .packageFacts article{display:flex;align-items:center;gap:11px;padding:13px;border:1px solid #e0e7dd;border-radius:15px;background:#f8faf6;color:#65804c}
      .packageFacts span,.packageFacts strong{display:block}
      .packageFacts span{color:#8b958e;font-size:8px}
      .packageFacts strong{margin-top:3px;color:#405347;font-size:9px}
      .packageCommunityGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
      .packageForm{display:grid;gap:10px}
      .packageForm textarea,.packageForm select{width:100%;border:1px solid #dbe4d8;border-radius:15px;background:#f8faf6;color:#33483b;outline:none}
      .packageForm textarea{min-height:110px;padding:14px;resize:vertical;line-height:1.6}
      .packageForm select{min-height:44px;padding:0 12px}
      .packageForm textarea:focus,.packageForm select:focus{border-color:#9db28f;box-shadow:0 0 0 4px rgba(126,158,92,.1)}
      .packageFeed{display:grid;gap:10px;margin-top:18px}
      .packageFeedItem{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;padding:14px;border:1px solid #e0e7dd;border-radius:17px;background:#f8faf6}
      .packageFeedItem img{width:46px;height:46px;border-radius:14px;object-fit:cover}
      .packageFeedTop{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .packageFeedTop a{color:#3d5144;font-size:10px;font-weight:850}
      .packageFeedTop small{color:#929b95;font-size:7px}
      .packageFeedItem p{margin:7px 0 0;color:#6f7b73;font-size:10px;line-height:1.65}
      .packageStars{display:flex;gap:2px;margin-top:7px}
      .packageStars span{color:#d9dfd5;font-size:13px}
      .packageStars span.active{color:#d3a833}
      .packageEmpty{padding:24px;border:1px dashed #ccd7c8;border-radius:16px;color:#879289;text-align:center;font-size:10px}
      .packageStatePage{display:grid;place-items:center;padding:118px 24px 24px;background:radial-gradient(circle at top left,rgba(166,203,126,.18),transparent 30%),#edf1e9}
      .packageStateCard{display:grid;place-items:center;width:min(500px,100%);padding:50px 30px;border:1px solid #dce3d9;border-radius:28px;background:rgba(255,255,255,.84);text-align:center;box-shadow:0 20px 60px rgba(28,48,35,.08)}
      .packageLoader{width:38px;height:38px;border:3px solid #dce5d7;border-top-color:#52783c;border-radius:50%;animation:spin .8s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      .packageStateIcon{display:grid;place-items:center;width:62px;height:62px;border-radius:20px;background:#ffe9e5;color:#a85247}
      .packageStateCard h1{margin:18px 0 0;color:#263a2f;font-size:28px;letter-spacing:-.04em}
      .packageStateCard p{max-width:380px;margin:9px 0 0;color:#7e8981;font-size:11px;line-height:1.65}
      .packageStateActions{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin-top:20px}
      .packageStateActions button,.packageStateActions a{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 14px;border-radius:12px;font-size:10px;font-weight:850}
      .packageStateActions button{border:0;background:#183a27;color:white;cursor:pointer}
      .packageStateActions a{border:1px solid #d5ded2;background:white;color:#51665a}
      @media(max-width:960px){.packageMainGrid,.packageCommunityGrid{grid-template-columns:1fr}.packageHeroStats{grid-template-columns:repeat(2,minmax(0,1fr))}.packageGallery{grid-auto-rows:180px}}
      @media(max-width:760px){.packageBookingBanner{grid-template-columns:auto minmax(0,1fr)}.packageBookingBanner>a{grid-column:1/-1;justify-content:center;width:100%}}
      @media(max-width:700px){.packagePage{padding:84px 0 64px}.packageStatePage{padding-top:84px}.packageHero{min-height:720px;padding:24px;border-radius:0 0 32px 32px}.packageHeroCopy{padding-top:130px}.packageHeroStats{right:24px;bottom:24px;left:24px}.packageContent{padding:0 18px}.packageActionBar{align-items:flex-start;flex-direction:column}.packageActionButtons{width:100%}.packageActionButtons button{flex:1}.packageGallery{grid-template-columns:1fr;grid-auto-rows:220px}.packageGallery img.featured{grid-column:auto;grid-row:auto}.packageIncludeGrid{grid-template-columns:1fr}}
      @media(max-width:480px){.packageHero{min-height:760px;padding:19px}.packageHeroCopy h1{font-size:48px}.packageHeroStats{right:19px;bottom:19px;left:19px}.packageContent{padding:0 13px}.packageActionButtons{flex-direction:column}.packageActionButtons button{width:100%}.packagePanel{padding:20px}.packageFeedTop{align-items:flex-start;flex-direction:column}}
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    `}</style>
  );
}
