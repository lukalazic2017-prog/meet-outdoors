import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=Host";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=90";

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

function ContactItem({
  icon,
  title,
  value,
  href,
  mutedText,
}) {
  const content = (
    <>
      <span className="contactIcon">
        <Icon name={icon} size={18} />
      </span>

      <span className="contactText">
        <small>{title}</small>
        <strong>{value || mutedText}</strong>
      </span>

      {href && (
        <span className="contactArrow">
          <Icon name="external" size={15} />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={
          href.startsWith("tel:") ? undefined : "_blank"
        }
        rel={
          href.startsWith("tel:") ? undefined : "noreferrer"
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
          <p>Pripremamo informacije o domaćinu.</p>
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
  if (!value) return "Termin uskoro";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Termin uskoro";
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

function EventCard({ event }) {
  const location =
    [event.location, event.country]
      .filter(Boolean)
      .join(", ") || "Lokacija nije navedena";

  return (
    <Link
      to={`/event/${event.id}`}
      className="hostListingCard"
    >
      <div className="hostListingImage">
        <img
          src={event.cover_url || FALLBACK_COVER}
          alt={event.title || "Događaj"}
        />

        <div className="listingImageShade" />

        <span className="hostListingType">
          <Icon name="calendar" size={14} />
          Događaj
        </span>

        <span className="listingDateBadge">
          {formatDate(event.start_date)}
        </span>
      </div>

      <div className="hostListingBody">
        <h3>{event.title || "Outdoor događaj"}</h3>

        <span className="hostListingLocation">
          <Icon name="mapPin" size={14} />
          {location}
        </span>

        {event.description && (
          <p className="hostListingDescription">
            {event.description}
          </p>
        )}

        <div className="hostListingFooter">
          <strong>{formatPrice(event.price)}</strong>

          <span>
            Pogledaj događaj
            <Icon name="arrowRight" size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PackageCard({ item, reviewSummary }) {
  const location =
    [item.location, item.country]
      .filter(Boolean)
      .join(", ") || "Lokacija nije navedena";

  return (
    <article className="hostListingCard packageListingCard">
      <div className="hostListingImage">
        <img
          src={item.cover_url || FALLBACK_COVER}
          alt={item.title || "Paket"}
        />

        <div className="listingImageShade" />

        <span className="hostListingType packageType">
          <Icon name="package" size={14} />
          Paket
        </span>

        {reviewSummary?.count > 0 && (
          <span className="listingRatingBadge">
            <Icon
              name="star"
              size={12}
              fill="currentColor"
            />
            {reviewSummary.average.toFixed(1)}
          </span>
        )}
      </div>

      <div className="hostListingBody">
        <h3>{item.title || "Outdoor paket"}</h3>

        <span className="hostListingLocation">
          <Icon name="mapPin" size={14} />
          {location}
        </span>

        {item.description && (
          <p className="hostListingDescription">
            {item.description}
          </p>
        )}

        <div className="packageQuickFacts">
          <span>
            <Icon name="users" size={14} />
            {item.capacity || 1} mesta
          </span>

          <span>
            <Icon name="calendar" size={14} />
            {item.duration || "Trajanje nije navedeno"}
          </span>
        </div>

        <div className="hostListingFooter">
          <strong>{formatPrice(item.price)}</strong>

          <span className="packageOfferLabel">
            Outdoor iskustvo
          </span>
        </div>
      </div>
    </article>
  );
}

function ReviewCard({
  review,
  packageTitle,
  reviewer,
}) {
  return (
    <article className="reviewCard">
      <div className="reviewCardTop">
        <div className="reviewerIdentity">
          <img
            src={
              reviewer?.avatar_url ||
              `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
                reviewer?.full_name ||
                  reviewer?.username ||
                  "Guest"
              )}`
            }
            alt=""
          />

          <div>
            <strong>
              {reviewer?.full_name ||
                reviewer?.username ||
                "MeetOutdoors član"}
            </strong>

            <small>{packageTitle || "Outdoor paket"}</small>
          </div>
        </div>

        <span className="reviewDate">
          {formatDate(review.created_at)}
        </span>
      </div>

      <div className="reviewStars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            size={15}
            fill={
              star <= Number(review.rating)
                ? "currentColor"
                : "none"
            }
          />
        ))}
      </div>

      <p>
        {review.review ||
          "Korisnik je ostavio ocenu bez dodatnog komentara."}
      </p>
    </article>
  );
}

export default function HostProfile() {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] =
    useState(null);
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewers, setReviewers] = useState({});
  const [loading, setLoading] = useState(true);

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
        { data: eventsData, error: eventsError },
        { data: packagesData, error: packagesError },
      ] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("host_id", hostData.id)
          .eq("is_active", true)
          .order("start_date", { ascending: true }),

        supabase
          .from("packages")
          .select("*")
          .eq("host_id", hostData.id)
          .order("created_at", { ascending: false }),
      ]);

      if (eventsError) {
        console.error(
          "Greška pri učitavanju događaja:",
          eventsError
        );
      }

      if (packagesError) {
        console.error(
          "Greška pri učitavanju paketa:",
          packagesError
        );
      }

      const cleanEvents = eventsData || [];
      const cleanPackages = packagesData || [];

      setEvents(cleanEvents);
      setPackages(cleanPackages);

      const packageIds = cleanPackages
        .map((item) => item.id)
        .filter(Boolean);

      if (packageIds.length === 0) {
        setReviews([]);
        setReviewers({});
        return;
      }

      const {
        data: reviewsData,
        error: reviewsError,
      } = await supabase
        .from("package_reviews")
        .select("*")
        .in("package_id", packageIds)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error(
          "Greška pri učitavanju recenzija:",
          reviewsError
        );
        setReviews([]);
        setReviewers({});
        return;
      }

      const cleanReviews = reviewsData || [];
      setReviews(cleanReviews);

      const reviewerIds = [
        ...new Set(
          cleanReviews
            .map((review) => review.user_id)
            .filter(Boolean)
        ),
      ];

      if (reviewerIds.length === 0) {
        setReviewers({});
        return;
      }

      const {
        data: reviewerProfiles,
        error: reviewerError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", reviewerIds);

      if (reviewerError) {
        console.error(
          "Greška pri učitavanju autora recenzija:",
          reviewerError
        );
        setReviewers({});
        return;
      }

      const reviewerMap = {};

      (reviewerProfiles || []).forEach((item) => {
        reviewerMap[item.id] = item;
      });

      setReviewers(reviewerMap);
    } catch (error) {
      console.error(
        "Greška pri učitavanju host profila:",
        error
      );

      setProfile(null);
      setEvents([]);
      setPackages([]);
      setReviews([]);
      setReviewers({});
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const reviewStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        average: 0,
        count: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let total = 0;

    reviews.forEach((review) => {
      const rating = Math.max(
        1,
        Math.min(5, Number(review.rating || 0))
      );

      total += rating;

      if (distribution[rating] !== undefined) {
        distribution[rating] += 1;
      }
    });

    return {
      average: total / reviews.length,
      count: reviews.length,
      distribution,
    };
  }, [reviews]);

  const reviewsByPackage = useMemo(() => {
    const result = {};

    reviews.forEach((review) => {
      const packageId = review.package_id;

      if (!packageId) return;

      if (!result[packageId]) {
        result[packageId] = {
          count: 0,
          total: 0,
          average: 0,
        };
      }

      result[packageId].count += 1;
      result[packageId].total += Number(
        review.rating || 0
      );
    });

    Object.keys(result).forEach((packageId) => {
      result[packageId].average =
        result[packageId].count > 0
          ? result[packageId].total /
            result[packageId].count
          : 0;
    });

    return result;
  }, [reviews]);

  const packageTitleMap = useMemo(() => {
    const result = {};

    packages.forEach((item) => {
      result[item.id] = item.title;
    });

    return result;
  }, [packages]);

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

  const displayName =
    profile.full_name ||
    profile.username ||
    "Outdoor Host";

  return (
    <>
      <HostProfileStyles />

      <main className="hostProfilePage">
        <section className="profileShell">
          <div className="profileHero">
            <img
              src={
                profile.cover_url || FALLBACK_COVER
              }
              alt=""
              className="coverImage"
            />

            <div className="coverOverlay" />

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

                  {reviewStats.count > 0 && (
                    <span className="heroRatingBadge">
                      <Icon
                        name="star"
                        size={14}
                        fill="currentColor"
                      />
                      {reviewStats.average.toFixed(1)}
                      <small>
                        ({reviewStats.count})
                      </small>
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
              </div>
            </div>
          </div>

          <div className="profileContent">
            {isOwnProfile && (
              <Link
                to="/edit-profile"
                className="editButton mobileEdit"
              >
                <Icon
                  name="edit"
                  size={17}
                />
                Uredi host profil
              </Link>
            )}

            <section className="hostStats">
              <article>
                <span>
                  <Icon
                    name="calendar"
                    size={19}
                  />
                </span>

                <div>
                  <strong>{events.length}</strong>
                  <small>
                    Aktivnih događaja
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon
                    name="package"
                    size={19}
                  />
                </span>

                <div>
                  <strong>
                    {packages.length}
                  </strong>
                  <small>Paketa i tura</small>
                </div>
              </article>

              <article>
                <span>
                  <Icon
                    name="users"
                    size={19}
                  />
                </span>

                <div>
                  <strong>
                    {reviewStats.count}
                  </strong>
                  <small>
                    Recenzija paketa
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon
                    name="star"
                    size={19}
                  />
                </span>

                <div>
                  <strong>
                    {reviewStats.count > 0
                      ? reviewStats.average.toFixed(1)
                      : "—"}
                  </strong>
                  <small>
                    Prosečna ocena
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
                        Informacije na profilu
                        pomažu učesnicima da
                        upoznaju organizatora pre
                        rezervacije.
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
                        Aktivnosti još nisu
                        dodate.
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
                      href={profile.website_url}
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
                      Upoznaj domaćina pre nego
                      što rezervišeš.
                    </h3>

                    <p>
                      Pregledaj opis, aktivnosti,
                      događaje, pakete i iskustva
                      drugih učesnika.
                    </p>
                  </div>
                </section>
              </aside>
            </div>

            <section className="listingSection">
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">
                    Događaji
                  </span>
                  <h2>
                    Predstojeće avanture
                  </h2>

                  <p>
                    Aktivni događaji koje ovaj
                    domaćin trenutno organizuje.
                  </p>
                </div>

                {isOwnProfile && (
                  <Link
                    to="/create-event"
                    className="sectionAction"
                  >
                    Kreiraj događaj
                    <Icon
                      name="arrowRight"
                      size={17}
                    />
                  </Link>
                )}
              </div>

              {events.length > 0 ? (
                <div className="hostListingsGrid">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                    />
                  ))}
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
                    Trenutno nema objavljenih
                    događaja.
                  </h3>

                  <p>
                    Kada domaćin objavi novu
                    avanturu, moći ćeš da je
                    pronađeš ovde.
                  </p>

                  {isOwnProfile && (
                    <Link to="/create-event">
                      Objavi prvi događaj
                      <Icon
                        name="arrowRight"
                        size={16}
                      />
                    </Link>
                  )}
                </div>
              )}
            </section>

            <section className="listingSection packagesSection">
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">
                    Ture i paketi
                  </span>
                  <h2>
                    Iskustva koja možeš da
                    rezervišeš
                  </h2>

                  <p>
                    Paketi, ture i kompletna
                    outdoor iskustva ovog
                    domaćina.
                  </p>
                </div>

                {isOwnProfile && (
                  <Link
                    to="/create-package"
                    className="sectionAction"
                  >
                    Kreiraj paket
                    <Icon
                      name="arrowRight"
                      size={17}
                    />
                  </Link>
                )}
              </div>

              {packages.length > 0 ? (
                <div className="hostListingsGrid">
                  {packages.map((item) => (
                    <PackageCard
                      key={item.id}
                      item={item}
                      reviewSummary={
                        reviewsByPackage[
                          item.id
                        ]
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="emptyListing">
                  <span>
                    <Icon
                      name="package"
                      size={27}
                    />
                  </span>

                  <h3>
                    Trenutno nema aktivnih
                    paketa.
                  </h3>

                  <p>
                    Novi paketi i ture će se
                    automatski prikazati na ovom
                    profilu.
                  </p>

                  {isOwnProfile && (
                    <Link to="/create-package">
                      Objavi prvi paket
                      <Icon
                        name="arrowRight"
                        size={16}
                      />
                    </Link>
                  )}
                </div>
              )}
            </section>

            <section className="reviewsSection">
              <div className="reviewsIntro">
                <span className="sectionKicker">
                  Utisci učesnika
                </span>
                <h2>
                  Recenzije hostovih paketa
                </h2>

                <p>
                  Ocena domaćina se računa iz
                  recenzija svih paketa koje je
                  kreirao.
                </p>

                {reviewStats.count > 0 && (
                  <div className="overallRating">
                    <strong>
                      {reviewStats.average.toFixed(
                        1
                      )}
                    </strong>

                    <div>
                      <span className="overallStars">
                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <Icon
                              key={star}
                              name="star"
                              size={16}
                              fill={
                                star <=
                                Math.round(
                                  reviewStats.average
                                )
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          )
                        )}
                      </span>

                      <small>
                        Na osnovu{" "}
                        {reviewStats.count}{" "}
                        {reviewStats.count === 1
                          ? "recenzije"
                          : "recenzija"}
                      </small>
                    </div>
                  </div>
                )}
              </div>

              <div className="reviewsSummary">
                <div className="reviewsPlaceholder">
                  <div className="ratingBlock">
                    <span>
                      <Icon
                        name="star"
                        size={27}
                        fill={
                          reviewStats.count > 0
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </span>

                    <strong>
                      {reviewStats.count > 0
                        ? reviewStats.average.toFixed(
                            1
                          )
                        : "Još nema ocena"}
                    </strong>

                    <small>
                      {reviewStats.count > 0
                        ? `${reviewStats.count} ukupno`
                        : "Prva recenzija će se pojaviti ovde."}
                    </small>
                  </div>

                  <div className="reviewBars">
                    {[5, 4, 3, 2, 1].map(
                      (rating) => {
                        const count =
                          reviewStats
                            .distribution[
                            rating
                          ] || 0;

                        const width =
                          reviewStats.count > 0
                            ? `${Math.round(
                                (count /
                                  reviewStats.count) *
                                  100
                              )}%`
                            : "0%";

                        return (
                          <div key={rating}>
                            <span>{rating}</span>

                            <Icon
                              name="star"
                              size={12}
                              fill="currentColor"
                            />

                            <div>
                              <span
                                style={{
                                  width,
                                }}
                              />
                            </div>

                            <small>
                              {count}
                            </small>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </section>

            {reviews.length > 0 && (
              <section className="reviewFeedSection">
                <div className="listingHeader">
                  <div>
                    <span className="sectionKicker">
                      Poslednji utisci
                    </span>

                    <h2>
                      Šta kažu učesnici
                    </h2>

                    <p>
                      Najnovije recenzije paketa
                      ovog domaćina.
                    </p>
                  </div>
                </div>

                <div className="reviewFeedGrid">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      packageTitle={
                        packageTitleMap[
                          review.package_id
                        ]
                      }
                      reviewer={
                        reviewers[
                          review.user_id
                        ]
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function HostProfileStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f2f4ed;
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

      .hostProfilePage {
        min-height: 100vh;
        padding: 118px 30px 30px;
        background:
          radial-gradient(
            circle at 10% 0%,
            rgba(170, 203, 135, 0.16),
            transparent 26%
          ),
          radial-gradient(
            circle at 90% 20%,
            rgba(93, 134, 94, 0.09),
            transparent 27%
          ),
          #f2f4ed;
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

      .hostProfilePage a {
        color: inherit;
        text-decoration: none;
      }

      .profileShell {
        width: min(1240px, 100%);
        margin: 0 auto;
        overflow: hidden;
        border: 1px solid rgba(34, 55, 43, 0.1);
        border-radius: 34px;
        background: rgba(250, 251, 247, 0.88);
        box-shadow: 0 30px 90px rgba(30, 50, 37, 0.11);
      }

      .profileHero {
        position: relative;
        isolation: isolate;
        min-height: 590px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 34px;
        overflow: hidden;
        color: white;
      }

      .coverImage,
      .coverOverlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .coverImage {
        z-index: -3;
        object-fit: cover;
        transition: transform 0.8s ease;
      }

      .profileHero:hover .coverImage {
        transform: scale(1.018);
      }

      .coverOverlay {
        z-index: -2;
        background:
          linear-gradient(
            180deg,
            rgba(5, 16, 10, 0.32),
            rgba(5, 16, 10, 0.22) 30%,
            rgba(4, 14, 8, 0.83) 76%,
            rgba(4, 14, 8, 0.98)
          ),
          linear-gradient(
            90deg,
            rgba(4, 14, 8, 0.43),
            transparent 66%
          );
      }

      .editButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 43px;
        padding: 0 15px;
        border: 1px solid #c9f28c;
        border-radius: 13px;
        background: #c9f28c;
        color: #183a27 !important;
        box-shadow: 0 10px 25px rgba(5, 20, 10, 0.18);
        cursor: pointer;
        font-size: 11px;
        font-weight: 850;
        transition: 0.18s ease;
      }

      .editButton:hover {
        background: #d8f7a9;
        transform: translateY(-2px);
      }

      .heroProfileInfo {
        display: flex;
        align-items: flex-end;
        gap: 25px;
      }

      .profileAvatar {
        flex: 0 0 auto;
        width: 150px;
        height: 150px;
        border: 5px solid rgba(255, 255, 255, 0.93);
        border-radius: 36px;
        object-fit: cover;
        background: #1a2e23;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.27);
      }

      .heroText {
        min-width: 0;
        padding-bottom: 5px;
      }

      .hostBadgeRow {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-bottom: 14px;
      }

      .hostBadge,
      .heroRatingBadge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 8px 11px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.84);
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.04em;
        backdrop-filter: blur(12px);
      }

      .hostBadge.verified {
        border-color: rgba(201, 242, 140, 0.32);
        background: rgba(201, 242, 140, 0.13);
        color: #d9f7ae;
      }

      .heroRatingBadge {
        border-color: rgba(255, 225, 138, 0.28);
        background: rgba(255, 211, 92, 0.12);
        color: #ffe28a;
      }

      .heroRatingBadge small {
        color: rgba(255, 255, 255, 0.62);
        font-size: 8px;
      }

      .heroText h1 {
        max-width: 850px;
        margin: 0;
        font-size: clamp(47px, 7vw, 89px);
        line-height: 0.94;
        letter-spacing: -0.075em;
      }

      .profileMeta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
        color: rgba(255, 255, 255, 0.65);
        font-size: 12px;
        font-weight: 750;
      }

      .profileMeta > span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .metaDivider {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.34);
      }

      .profileContent {
        position: relative;
        padding: 30px;
      }

      .mobileEdit {
        display: none;
      }

      .hostStats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 13px;
        margin-bottom: 24px;
      }

      .hostStats article {
        display: flex;
        align-items: center;
        gap: 13px;
        min-width: 0;
        padding: 18px;
        border: 1px solid #dfe5dc;
        border-radius: 19px;
        background: rgba(255, 255, 255, 0.72);
      }

      .hostStats article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 43px;
        height: 43px;
        border-radius: 13px;
        background: #e9f2de;
        color: #58743f;
      }

      .hostStats strong,
      .hostStats small {
        display: block;
      }

      .hostStats strong {
        color: #23362a;
        font-size: 19px;
      }

      .hostStats small {
        margin-top: 3px;
        color: #869087;
        font-size: 10px;
        line-height: 1.35;
      }

      .mainGrid {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(290px, 0.75fr);
        gap: 20px;
      }

      .mainColumn,
      .sideColumn {
        display: grid;
        align-content: start;
        gap: 20px;
      }

      .contentCard,
      .listingSection,
      .reviewsSection,
      .reviewFeedSection {
        border: 1px solid #dde4da;
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.76);
        box-shadow: 0 12px 35px rgba(33, 52, 40, 0.045);
      }

      .contentCard {
        padding: 25px;
      }

      .sectionHeading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }

      .sectionHeading.compact {
        margin-bottom: 17px;
      }

      .sectionKicker {
        display: block;
        margin-bottom: 8px;
        color: #759253;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .sectionHeading h2,
      .listingHeader h2,
      .reviewsIntro h2 {
        margin: 0;
        color: #21342a;
        font-size: clamp(24px, 3vw, 34px);
        line-height: 1.05;
        letter-spacing: -0.045em;
      }

      .sectionIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 43px;
        height: 43px;
        border-radius: 14px;
        background: #e9f2de;
        color: #5d7843;
      }

      .hostBio {
        margin: 0;
        color: #647169;
        font-size: 14px;
        line-height: 1.8;
      }

      .trustMessage {
        display: flex;
        gap: 12px;
        margin-top: 22px;
        padding: 16px;
        border: 1px solid #dbe7d2;
        border-radius: 17px;
        background: #f3f8ed;
      }

      .trustMessage > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #e2efd7;
        color: #587640;
      }

      .trustMessage strong {
        display: block;
        color: #304438;
        font-size: 12px;
      }

      .trustMessage p {
        margin: 4px 0 0;
        color: #7d8981;
        font-size: 10px;
        line-height: 1.5;
      }

      .activityList {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
      }

      .activityChip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 38px;
        padding: 0 13px;
        border: 1px solid #d4ded0;
        border-radius: 999px;
        background: #f7f9f4;
        color: #526359;
        font-size: 11px;
        font-weight: 800;
      }

      .activityChip svg {
        color: #6d9050;
      }

      .emptyInline {
        width: 100%;
        padding: 15px;
        border-radius: 14px;
        background: #f5f7f2;
        color: #8a958d;
        font-size: 11px;
      }

      .contactList {
        display: grid;
        gap: 10px;
      }

      .contactItem {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        min-height: 68px;
        padding: 11px;
        border: 1px solid #dee4dc;
        border-radius: 16px;
        background: #f9faf7;
        transition: 0.18s ease;
      }

      .contactItem.active:hover {
        border-color: #9bae91;
        background: white;
        transform: translateY(-2px);
      }

      .contactItem.disabled {
        opacity: 0.62;
      }

      .contactIcon {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #e9f2de;
        color: #5b7741;
      }

      .contactText {
        min-width: 0;
      }

      .contactText small,
      .contactText strong {
        display: block;
      }

      .contactText small {
        color: #929b94;
        font-size: 9px;
      }

      .contactText strong {
        overflow: hidden;
        margin-top: 4px;
        color: #3c4d42;
        font-size: 10px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .contactArrow {
        color: #89938c;
      }

      .verifiedCard {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 23px;
        border-radius: 24px;
        background: linear-gradient(145deg, #173b27, #234f36);
        color: white;
        box-shadow: 0 18px 40px rgba(24, 58, 39, 0.16);
      }

      .verifiedIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 48px;
        height: 48px;
        border: 1px solid rgba(201, 242, 140, 0.22);
        border-radius: 15px;
        background: rgba(201, 242, 140, 0.12);
        color: #c9f28c;
      }

      .verifiedLabel {
        color: #c9f28c;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .verifiedCard h3 {
        margin: 8px 0 0;
        font-size: 18px;
        line-height: 1.2;
        letter-spacing: -0.03em;
      }

      .verifiedCard p {
        margin: 10px 0 0;
        color: rgba(255, 255, 255, 0.58);
        font-size: 10px;
        line-height: 1.6;
      }

      .listingSection,
      .reviewFeedSection {
        margin-top: 20px;
        padding: 28px;
      }

      .listingHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
      }

      .listingHeader p,
      .reviewsIntro p {
        margin: 12px 0 0;
        color: #7c8880;
        font-size: 11px;
        line-height: 1.6;
      }

      .sectionAction {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        min-height: 42px;
        padding: 0 14px;
        border: 1px solid #d6dfd2;
        border-radius: 13px;
        background: white;
        color: #37513f !important;
        font-size: 10px;
        font-weight: 850;
        transition: 0.18s ease;
      }

      .sectionAction:hover {
        gap: 12px;
        border-color: #8fa584;
        transform: translateY(-2px);
      }

      .emptyListing {
        display: grid;
        place-items: center;
        margin-top: 24px;
        padding: 55px 20px;
        border: 1px dashed #cfd8cc;
        border-radius: 20px;
        background:
          linear-gradient(
            145deg,
            rgba(241, 246, 235, 0.8),
            rgba(250, 251, 248, 0.8)
          );
        text-align: center;
      }

      .emptyListing > span {
        display: grid;
        place-items: center;
        width: 60px;
        height: 60px;
        border-radius: 19px;
        background: #e5efdb;
        color: #607d46;
      }

      .emptyListing h3 {
        margin: 18px 0 0;
        color: #34483b;
        font-size: 17px;
      }

      .emptyListing p {
        max-width: 500px;
        margin: 9px auto 0;
        color: #89938c;
        font-size: 11px;
        line-height: 1.6;
      }

      .emptyListing a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 18px;
        padding: 11px 14px;
        border-radius: 12px;
        background: #183a27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
      }

      .packagesSection {
        background:
          linear-gradient(
            145deg,
            rgba(238, 245, 231, 0.9),
            rgba(255, 255, 255, 0.8)
          );
      }

      .hostListingsGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 24px;
      }

      .hostListingCard {
        min-width: 0;
        overflow: hidden;
        border: 1px solid #dce4d9;
        border-radius: 22px;
        background: #ffffff;
        box-shadow: 0 10px 30px rgba(31, 51, 38, 0.05);
        transition:
          transform 0.22s ease,
          box-shadow 0.22s ease,
          border-color 0.22s ease;
      }

      .hostListingCard:hover {
        transform: translateY(-5px);
        border-color: #a8bb9c;
        box-shadow: 0 22px 46px rgba(31, 51, 38, 0.11);
      }

      .hostListingImage {
        position: relative;
        height: 190px;
        overflow: hidden;
        background: #e4eadf;
      }

      .hostListingImage img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: transform 0.55s ease;
      }

      .hostListingCard:hover .hostListingImage img {
        transform: scale(1.05);
      }

      .listingImageShade {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(4, 14, 8, 0.08),
            transparent 45%,
            rgba(4, 14, 8, 0.55)
          );
      }

      .hostListingType,
      .listingDateBadge,
      .listingRatingBadge {
        position: absolute;
        top: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 31px;
        padding: 0 10px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background: rgba(9, 28, 16, 0.6);
        color: white;
        font-size: 8px;
        font-weight: 900;
        backdrop-filter: blur(12px);
      }

      .hostListingType {
        left: 12px;
      }

      .hostListingType.packageType {
        color: #d9f7ae;
      }

      .listingDateBadge,
      .listingRatingBadge {
        right: 12px;
      }

      .listingRatingBadge {
        color: #ffe28a;
      }

      .hostListingBody {
        padding: 17px;
      }

      .hostListingBody h3 {
        margin: 0;
        color: #293d31;
        font-size: 18px;
        line-height: 1.15;
        letter-spacing: -0.035em;
      }

      .hostListingLocation {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        color: #748078;
        font-size: 9px;
        font-weight: 750;
      }

      .hostListingLocation svg {
        flex: 0 0 auto;
        color: #719252;
      }

      .hostListingDescription {
        display: -webkit-box;
        min-height: 30px;
        margin: 12px 0 0;
        overflow: hidden;
        color: #7a867e;
        font-size: 9px;
        line-height: 1.6;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .packageQuickFacts {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 13px;
      }

      .packageQuickFacts > span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        min-height: 29px;
        padding: 0 9px;
        border-radius: 999px;
        background: #f1f5ed;
        color: #65746b;
        font-size: 8px;
        font-weight: 800;
      }

      .packageQuickFacts svg {
        color: #719252;
      }

      .hostListingFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 15px;
        padding-top: 14px;
        border-top: 1px solid #e5eae3;
      }

      .hostListingFooter strong {
        color: #233d2d;
        font-size: 13px;
      }

      .hostListingFooter span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #638047;
        font-size: 8px;
        font-weight: 850;
      }

      .packageOfferLabel {
        color: #7b887f !important;
      }

      .reviewsSection {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(350px, 1.2fr);
        gap: 30px;
        margin-top: 20px;
        padding: 28px;
      }

      .overallRating {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 20px;
      }

      .overallRating > strong {
        color: #24392d;
        font-size: 42px;
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .overallRating > div {
        display: grid;
        gap: 5px;
      }

      .overallStars {
        display: flex;
        gap: 3px;
        color: #d7a52f;
      }

      .overallRating small {
        color: #8a958d;
        font-size: 9px;
      }

      .reviewsPlaceholder {
        display: grid;
        grid-template-columns: minmax(150px, 0.55fr) minmax(230px, 1fr);
        gap: 25px;
        align-items: center;
        padding: 21px;
        border: 1px solid #e0e5de;
        border-radius: 20px;
        background: #f8faf6;
      }

      .ratingBlock {
        display: grid;
        place-items: center;
        text-align: center;
      }

      .ratingBlock > span {
        display: grid;
        place-items: center;
        width: 53px;
        height: 53px;
        border-radius: 17px;
        background: #e9f2de;
        color: #d3a12c;
      }

      .ratingBlock strong {
        margin-top: 12px;
        color: #35483d;
        font-size: 13px;
      }

      .ratingBlock small {
        margin-top: 5px;
        color: #909992;
        font-size: 9px;
      }

      .reviewBars {
        display: grid;
        gap: 8px;
      }

      .reviewBars > div {
        display: grid;
        grid-template-columns: 12px 13px 1fr 18px;
        align-items: center;
        gap: 6px;
        color: #859087;
        font-size: 9px;
      }

      .reviewBars > div > svg {
        color: #d3a12c;
      }

      .reviewBars > div > div {
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: #e1e7df;
      }

      .reviewBars > div > div > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: #88a66b;
      }

      .reviewBars > div > small {
        color: #9aa39c;
        font-size: 8px;
        text-align: right;
      }

      .reviewFeedGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 22px;
      }

      .reviewCard {
        padding: 18px;
        border: 1px solid #dfe6dc;
        border-radius: 19px;
        background: #fafbf8;
      }

      .reviewCardTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 15px;
      }

      .reviewerIdentity {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .reviewerIdentity img {
        width: 42px;
        height: 42px;
        flex: 0 0 auto;
        border-radius: 13px;
        object-fit: cover;
        background: #e5ebdf;
      }

      .reviewerIdentity > div {
        min-width: 0;
      }

      .reviewerIdentity strong,
      .reviewerIdentity small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .reviewerIdentity strong {
        color: #34483b;
        font-size: 10px;
      }

      .reviewerIdentity small {
        margin-top: 4px;
        color: #8c968f;
        font-size: 8px;
      }

      .reviewDate {
        flex: 0 0 auto;
        color: #9aa39d;
        font-size: 8px;
      }

      .reviewStars {
        display: flex;
        gap: 3px;
        margin-top: 13px;
        color: #d3a12c;
      }

      .reviewCard > p {
        margin: 12px 0 0;
        color: #6f7c74;
        font-size: 10px;
        line-height: 1.65;
      }

      .stateCard {
        display: grid;
        place-items: center;
        width: min(520px, 100%);
        margin: 20px auto 110px;
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.8);
        text-align: center;
        box-shadow: 0 20px 60px rgba(28, 48, 35, 0.08);
      }

      .stateLoader {
        width: 36px;
        height: 36px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation: profileSpin 0.8s linear infinite;
      }

      @keyframes profileSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .stateIcon {
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        border-radius: 18px;
        background: #f3dfdc;
        color: #98463c;
      }

      .stateCard h1 {
        margin: 18px 0 0;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .stateCard p {
        max-width: 380px;
        margin: 10px auto 0;
        color: #7e8981;
        font-size: 12px;
        line-height: 1.6;
      }

      .stateButton {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 22px;
        padding: 12px 15px;
        border-radius: 13px;
        background: #183a27;
        color: white !important;
        font-size: 11px;
        font-weight: 850;
      }

      @media (max-width: 1000px) {
        .hostStats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .mainGrid {
          grid-template-columns: 1fr;
        }

        .sideColumn {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .reviewsSection {
          grid-template-columns: 1fr;
        }

        .hostListingsGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .hostProfilePage {
          padding: 84px 0 0;
        }

        .profileShell {
          border: 0;
          border-radius: 0;
        }

        .profileHero {
          min-height: 590px;
          padding: 22px;
        }

        .mobileEdit {
          display: flex;
          width: 100%;
          margin-bottom: 17px;
        }

        .heroProfileInfo {
          align-items: flex-start;
          flex-direction: column;
          gap: 17px;
        }

        .profileAvatar {
          width: 120px;
          height: 120px;
          border-radius: 28px;
        }

        .heroText h1 {
          font-size: clamp(46px, 12vw, 68px);
        }

        .profileContent {
          padding: 22px;
        }

        .sideColumn {
          grid-template-columns: 1fr;
        }

        .listingHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .reviewsPlaceholder {
          grid-template-columns: 1fr;
        }

        .reviewFeedGrid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        .hostListingsGrid {
          grid-template-columns: 1fr;
        }

        .hostListingImage {
          height: 220px;
        }
      }

      @media (max-width: 520px) {
        .profileHero {
          min-height: 560px;
          padding: 18px;
        }

        .profileAvatar {
          width: 105px;
          height: 105px;
          border-radius: 25px;
        }

        .heroText h1 {
          font-size: 43px;
        }

        .profileMeta {
          align-items: flex-start;
          flex-direction: column;
          gap: 7px;
        }

        .metaDivider {
          display: none !important;
        }

        .profileContent {
          padding: 16px;
        }

        .hostStats {
          grid-template-columns: 1fr;
        }

        .contentCard,
        .listingSection,
        .reviewsSection,
        .reviewFeedSection {
          padding: 20px;
          border-radius: 21px;
        }

        .sectionHeading h2,
        .listingHeader h2,
        .reviewsIntro h2 {
          font-size: 27px;
        }

        .sectionIcon {
          display: none;
        }

        .contactItem {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .contactArrow {
          display: none;
        }

        .overallRating > strong {
          font-size: 36px;
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
