import React, { useCallback, useEffect, useState } from "react";
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

function ContactItem({ icon, title, value, href, mutedText }) {
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
        target={href.startsWith("tel:") ? undefined : "_blank"}
        rel={href.startsWith("tel:") ? undefined : "noreferrer"}
        className="contactItem active"
      >
        {content}
      </a>
    );
  }

  return <div className="contactItem disabled">{content}</div>;
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

export default function HostProfile() {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .eq("role", "host")
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error("Greška pri učitavanju host profila:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return <LoadingState />;
  }

  if (!profile) {
    return <NotFoundState />;
  }

  const isOwnProfile = currentUserId === profile.id;

  const location =
    [profile.city, profile.country].filter(Boolean).join(", ") ||
    "Lokacija još nije dodata";

  const activities = Array.isArray(profile.activities)
    ? profile.activities
    : [];

  const displayName =
    profile.full_name || profile.username || "Outdoor Host";

  return (
    <>
      <HostProfileStyles />

      <main className="hostProfilePage">
        <section className="profileShell">
          <div className="profileHero">
            <img
              src={profile.cover_url || FALLBACK_COVER}
              alt=""
              className="coverImage"
            />

            <div className="coverOverlay" />

            <div className="heroProfileInfo">
              <img
                src={profile.avatar_url || FALLBACK_AVATAR}
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
                      name={profile.is_verified ? "verified" : "shield"}
                      size={15}
                    />

                    {profile.is_verified
                      ? "MeetOutdoors verifikovani domaćin"
                      : "MeetOutdoors domaćin"}
                  </span>
                </div>

                <h1>{displayName}</h1>

                <div className="profileMeta">
                  <span>@{profile.username}</span>

                  <span className="metaDivider" />

                  <span>
                    <Icon name="mapPin" size={15} />
                    {location}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="profileContent">
            {isOwnProfile && (
              <Link to="/edit-profile" className="editButton mobileEdit">
                <Icon name="edit" size={17} />
                Uredi host profil
              </Link>
            )}

            <section className="hostStats">
              <article>
                <span>
                  <Icon name="calendar" size={19} />
                </span>

                <div>
                  <strong>0</strong>
                  <small>Aktivnih događaja</small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="package" size={19} />
                </span>

                <div>
                  <strong>0</strong>
                  <small>Paketa i tura</small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="users" size={19} />
                </span>

                <div>
                  <strong>0</strong>
                  <small>Učesnika</small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="star" size={19} />
                </span>

                <div>
                  <strong>—</strong>
                  <small>Prosečna ocena</small>
                </div>
              </article>
            </section>

            <div className="mainGrid">
              <div className="mainColumn">
                <section className="contentCard aboutCard">
                  <div className="sectionHeading">
                    <div>
                      <span className="sectionKicker">O domaćinu</span>
                      <h2>Iskustvo iza avanture.</h2>
                    </div>

                    <span className="sectionIcon">
                      <Icon name="compass" size={21} />
                    </span>
                  </div>

                  <p className="hostBio">
                    {profile.bio ||
                      "Ovaj domaćin još nije dodao opis. Uskoro će ovde biti više informacija o iskustvu, pristupu organizaciji i avanturama koje nudi."}
                  </p>

                  <div className="trustMessage">
                    <span>
                      <Icon name="shield" size={18} />
                    </span>

                    <div>
                      <strong>Profil domaćina</strong>

                      <p>
                        Informacije na profilu pomažu učesnicima da
                        upoznaju organizatora pre rezervacije.
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

                      <h2>Avanture koje organizuje.</h2>
                    </div>
                  </div>

                  <div className="activityList">
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <span key={activity} className="activityChip">
                          <Icon name="check" size={14} />
                          {activity}
                        </span>
                      ))
                    ) : (
                      <div className="emptyInline">
                        Aktivnosti još nisu dodate.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <aside className="sideColumn">
                <section className="contentCard contactCard">
                  <div className="sectionHeading compact">
                    <div>
                      <span className="sectionKicker">Kontakt</span>
                      <h2>Poveži se sa domaćinom.</h2>
                    </div>
                  </div>

                  <div className="contactList">
                    <ContactItem
                      icon="phone"
                      title="Telefon"
                      value={profile.phone}
                      href={
                        profile.phone
                          ? `tel:${profile.phone.replace(/\s/g, "")}`
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
                      href={profile.instagram_url}
                      mutedText="Instagram nije dodat"
                    />

                    <ContactItem
                      icon="globe"
                      title="Web-sajt"
                      value={
                        profile.website_url ? "Poseti web-sajt" : ""
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
                      href={profile.promo_video_url}
                      mutedText="Promo video nije dodat"
                    />
                  </div>
                </section>

                <section className="verifiedCard">
                  <span className="verifiedIcon">
                    <Icon name="shield" size={23} />
                  </span>

                  <div>
                    <span className="verifiedLabel">
                      MeetOutdoors sigurnost
                    </span>

                    <h3>
                      Upoznaj domaćina pre nego što rezervišeš.
                    </h3>

                    <p>
                      Pregledaj opis, aktivnosti, događaje i iskustva
                      drugih učesnika.
                    </p>
                  </div>
                </section>
              </aside>
            </div>

            <section className="listingSection">
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">Događaji</span>
                  <h2>Predstojeće avanture</h2>

                  <p>
                    Događaji koje ovaj domaćin organizuje pojaviće se
                    ovde.
                  </p>
                </div>

                {isOwnProfile && (
                  <Link to="/create-event" className="sectionAction">
                    Kreiraj događaj
                    <Icon name="arrowRight" size={17} />
                  </Link>
                )}
              </div>

              <div className="emptyListing">
                <span>
                  <Icon name="calendar" size={27} />
                </span>

                <h3>Trenutno nema objavljenih događaja.</h3>

                <p>
                  Kada domaćin objavi novu avanturu, moći ćeš da je
                  pronađeš ovde.
                </p>

                {isOwnProfile && (
                  <Link to="/create-event">
                    Objavi prvi događaj
                    <Icon name="arrowRight" size={16} />
                  </Link>
                )}
              </div>
            </section>

            <section className="listingSection packagesSection">
              <div className="listingHeader">
                <div>
                  <span className="sectionKicker">Ture i paketi</span>
                  <h2>Višednevna iskustva</h2>

                  <p>
                    Paketi, ture i kompletna outdoor iskustva ovog
                    domaćina.
                  </p>
                </div>

                {isOwnProfile && (
                  <Link to="/create-package" className="sectionAction">
                    Kreiraj paket
                    <Icon name="arrowRight" size={17} />
                  </Link>
                )}
              </div>

              <div className="emptyListing">
                <span>
                  <Icon name="package" size={27} />
                </span>

                <h3>Trenutno nema aktivnih paketa.</h3>

                <p>
                  Novi paketi i ture će se automatski prikazati na ovom
                  profilu.
                </p>

                {isOwnProfile && (
                  <Link to="/create-package">
                    Objavi prvi paket
                    <Icon name="arrowRight" size={16} />
                  </Link>
                )}
              </div>
            </section>

            <section className="reviewsSection">
              <div className="reviewsIntro">
                <span className="sectionKicker">Utisci učesnika</span>
                <h2>Recenzije domaćina</h2>

                <p>
                  Recenzije će pomoći budućim učesnicima da izaberu
                  avanturu sa više sigurnosti.
                </p>
              </div>

              <div className="reviewsPlaceholder">
                <div className="ratingBlock">
                  <span>
                    <Icon name="star" size={27} />
                  </span>

                  <strong>Još nema ocena</strong>
                  <small>Prva recenzija će se pojaviti ovde.</small>
                </div>

                <div className="reviewBars">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating}>
                      <span>{rating}</span>
                      <Icon name="star" size={12} />
                      <div>
                        <span style={{ width: "0%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
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

      .hostBadge {
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
      .reviewsSection {
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

      .listingSection {
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

      .reviewsSection {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(350px, 1.2fr);
        gap: 30px;
        margin-top: 20px;
        padding: 28px;
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
        color: #6b894f;
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
        grid-template-columns: 12px 13px 1fr;
        align-items: center;
        gap: 6px;
        color: #859087;
        font-size: 9px;
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
        .reviewsSection {
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
