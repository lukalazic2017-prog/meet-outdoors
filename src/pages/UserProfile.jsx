import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=MeetOutdoors";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
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
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
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
      <UserProfileStyles />

      <main className="userProfileStatePage">
        <div className="userProfileStateCard">
          <span className="userProfileLoader" />
          <h1>Učitavanje profila</h1>
          <p>Pripremamo javni MeetOutdoors profil.</p>
        </div>
      </main>
    </>
  );
}

export default function UserProfile() {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Greška pri proveri korisnika:", authError);
      }

      setCurrentUserId(user?.id || null);

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .eq("role", "user")
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(data);
    } catch (err) {
      console.error("Greška pri učitavanju profila:", err);
      setProfile(null);
      setError(
        err.message || "Korisnički profil trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isOwnProfile = currentUserId === profile?.id;

  const displayName =
    profile?.full_name || "MeetOutdoors User";

  const location = [profile?.city, profile?.country]
    .filter(Boolean)
    .join(", ");

  const activities = useMemo(
    () =>
      Array.isArray(profile?.activities)
        ? profile.activities
        : [],
    [profile?.activities]
  );

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    const fields = [
      profile.full_name,
      profile.username,
      profile.avatar_url,
      profile.cover_url,
      profile.city || profile.country,
      profile.bio,
      activities.length > 0,
    ];

    const completed = fields.filter(Boolean).length;

    return Math.round((completed / fields.length) * 100);
  }, [profile, activities.length]);

  if (loading) {
    return <LoadingState />;
  }

  if (!profile) {
    return (
      <>
        <UserProfileStyles />

        <main className="userProfileStatePage">
          <div className="userProfileStateCard">
            <span className="userProfileStateIcon">
              <Icon name="alert" size={28} />
            </span>

            <h1>Profil nije pronađen</h1>

            <p>
              {error ||
                "Ovaj korisnički profil ne postoji ili više nije dostupan."}
            </p>

            <div className="userProfileStateActions">
              <button type="button" onClick={loadProfile}>
                <Icon name="refresh" size={16} />
                Pokušaj ponovo
              </button>

              <Link to="/">
                <Icon name="arrowLeft" size={16} />
                Početna
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <UserProfileStyles />

      <main className="userProfilePage">
        <section
          className="userProfileHero"
          style={
            profile.cover_url
              ? {
                  backgroundImage: `linear-gradient(
                    180deg,
                    rgba(6, 21, 13, 0.08),
                    rgba(6, 21, 13, 0.82)
                  ), url(${profile.cover_url})`,
                }
              : undefined
          }
        >
          <div className="userProfileHeroTop">
            <Link to="/" className="userProfileBrand">
              <span>
                <Icon name="compass" size={21} />
              </span>

              MeetOutdoors
            </Link>

            <Link to="/users" className="userProfileBackLink">
              <Icon name="arrowLeft" size={16} />
              Svi članovi
            </Link>
          </div>

          <div className="userProfileHeroCopy">
            <span className="userProfileEyebrow">
              <span />
              Outdoor član
            </span>

            <h1>
              Ljudi koji
              <br />
              biraju prirodu.
            </h1>

            <p>
              Upoznaj članove MeetOutdoors zajednice, njihove
              aktivnosti i mesta koja ih inspirišu.
            </p>
          </div>
        </section>

        <section className="userProfileContent">
          <article className="userProfileMainCard">
            <div className="userProfileIdentity">
              <div className="userProfileAvatarWrap">
                <img
                  src={profile.avatar_url || FALLBACK_AVATAR}
                  alt={displayName}
                  className="userProfileAvatar"
                />

                <span className="userProfileOnlineMark">
                  <Icon name="sparkle" size={17} />
                </span>
              </div>

              <div className="userProfileIdentityCopy">
                <span className="userProfileMemberBadge">
                  Outdoor member
                </span>

                <h2>{displayName}</h2>

                <p className="userProfileUsername">
                  @{profile.username}
                </p>

                <p className="userProfileLocation">
                  <Icon name="mapPin" size={16} />
                  {location || "Lokacija još nije dodata"}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <Link
                to="/edit-profile"
                className="userProfileEditButton"
              >
                <Icon name="edit" size={17} />
                Izmeni profil
              </Link>
            )}
          </article>

          <div className="userProfileGrid">
            <section className="userProfilePanel">
              <div className="userProfilePanelHeader">
                <div>
                  <span className="userProfileSectionLabel">
                    O članu
                  </span>

                  <h3>Priča iza profila.</h3>
                </div>

                <span className="userProfilePanelIcon">
                  <Icon name="user" size={21} />
                </span>
              </div>

              <p className="userProfileBio">
                {profile.bio ||
                  "Ovaj član još nije dodao biografiju. Avanture možda govore više od reči, ali dobar opis ipak pomaže."}
              </p>

              <div className="userProfileActivities">
                <span className="userProfileActivitiesTitle">
                  Omiljene aktivnosti
                </span>

                {activities.length > 0 ? (
                  <div className="userProfileChips">
                    {activities.map((activity) => (
                      <span
                        className="userProfileChip"
                        key={activity}
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="userProfileMiniEmpty">
                    <Icon name="sparkle" size={17} />
                    Aktivnosti još nisu dodate.
                  </div>
                )}
              </div>
            </section>

            <aside className="userProfilePanel userProfileOverview">
              <div className="userProfilePanelHeader">
                <div>
                  <span className="userProfileSectionLabel">
                    Pregled
                  </span>

                  <h3>Profil na prvi pogled.</h3>
                </div>

                <span className="userProfilePanelIcon">
                  <Icon name="shield" size={21} />
                </span>
              </div>

              <div className="userProfileStats">
                <article>
                  <span>Tip člana</span>
                  <strong>Outdoor member</strong>
                </article>

                <article>
                  <span>Aktivnosti</span>
                  <strong>{activities.length}</strong>
                </article>

                <article>
                  <span>Popunjenost profila</span>
                  <strong>{profileCompletion}%</strong>
                </article>
              </div>

              <div className="userProfileProgress">
                <div>
                  <span>Profil</span>
                  <strong>{profileCompletion}%</strong>
                </div>

                <div className="userProfileProgressTrack">
                  <span
                    style={{
                      width: `${profileCompletion}%`,
                    }}
                  />
                </div>
              </div>
            </aside>
          </div>

          <section className="userProfileCommunityCard">
            <div>
              <span className="userProfileSectionLabel">
                MeetOutdoors zajednica
              </span>

              <h3>
                Svaki profil počinje jednom dobrom pričom.
              </h3>

              <p>
                Poveži se sa ljudima koji dele tvoju ljubav prema
                prirodi, kretanju i novim iskustvima.
              </p>
            </div>

            <Link to="/events">
              Istraži događaje
              <Icon name="arrowRight" size={16} />
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function UserProfileStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #edf1e9;
      }

      button {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .userProfilePage,
      .userProfileStatePage {
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

      .userProfilePage {
        padding: 118px 28px 28px;
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

      .userProfilePage a {
        color: inherit;
        text-decoration: none;
      }

      .userProfileHero {
        position: relative;
        isolation: isolate;
        width: min(1200px, 100%);
        min-height: 570px;
        margin: 0 auto;
        padding: 34px;
        overflow: hidden;
        border-radius: 36px;
        background:
          radial-gradient(
            circle at 85% 15%,
            rgba(202, 241, 148, 0.14),
            transparent 27%
          ),
          linear-gradient(
            135deg,
            #0d2a1a,
            #173f28 58%,
            #28563a
          );
        background-position: center;
        background-size: cover;
        color: white;
        box-shadow: 0 34px 90px rgba(23, 54, 36, 0.18);
      }

      .userProfileHero::before {
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

      .userProfileHeroTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }

      .userProfileBrand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: white !important;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .userProfileBrand > span {
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

      .userProfileBackLink {
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

      .userProfileBackLink:hover {
        gap: 11px;
        background: rgba(255, 255, 255, 0.17);
      }

      .userProfileHeroCopy {
        max-width: 800px;
        padding-top: 120px;
      }

      .userProfileEyebrow {
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

      .userProfileEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow: 0 0 0 5px rgba(206, 243, 154, 0.12);
      }

      .userProfileHeroCopy h1 {
        margin: 24px 0 0;
        font-size: clamp(60px, 8vw, 102px);
        line-height: 0.88;
        letter-spacing: -0.08em;
      }

      .userProfileHeroCopy p {
        max-width: 590px;
        margin: 25px 0 0;
        color: rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .userProfileContent {
        position: relative;
        z-index: 3;
        width: min(1120px, 100%);
        margin: -72px auto 0;
      }

      .userProfileMainCard {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 28px;
        padding: 26px;
        border: 1px solid rgba(221, 229, 218, 0.9);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 24px 60px rgba(28, 49, 35, 0.1);
        backdrop-filter: blur(22px);
      }

      .userProfileIdentity {
        display: flex;
        align-items: flex-end;
        gap: 22px;
        min-width: 0;
      }

      .userProfileAvatarWrap {
        position: relative;
        flex: 0 0 auto;
      }

      .userProfileAvatar {
        display: block;
        width: 150px;
        height: 150px;
        border: 5px solid white;
        border-radius: 38px;
        background: #e7eee3;
        object-fit: cover;
        box-shadow: 0 18px 42px rgba(29, 50, 37, 0.16);
      }

      .userProfileOnlineMark {
        position: absolute;
        right: -6px;
        bottom: 7px;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border: 4px solid white;
        border-radius: 50%;
        background: #264f36;
        color: #d7f7a5;
      }

      .userProfileIdentityCopy {
        min-width: 0;
        padding-bottom: 8px;
      }

      .userProfileMemberBadge {
        display: inline-flex;
        align-items: center;
        min-height: 29px;
        padding: 0 10px;
        border-radius: 999px;
        background: #e7f0dc;
        color: #5b7840;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .userProfileIdentityCopy h2 {
        margin: 13px 0 0;
        color: #263a2f;
        font-size: clamp(32px, 5vw, 50px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .userProfileUsername {
        margin: 7px 0 0;
        color: #87928a;
        font-size: 12px;
        font-weight: 650;
      }

      .userProfileLocation {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 12px 0 0;
        color: #627168;
        font-size: 10px;
        font-weight: 700;
      }

      .userProfileEditButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 45px;
        padding: 0 16px;
        border: 1px solid #244d34;
        border-radius: 14px;
        background: #183a27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
        transition: 0.2s ease;
      }

      .userProfileEditButton:hover {
        transform: translateY(-2px);
        background: #214b32;
        box-shadow: 0 12px 24px rgba(24, 58, 39, 0.16);
      }

      .userProfileGrid {
        display: grid;
        grid-template-columns:
          minmax(0, 1.3fr)
          minmax(320px, 0.7fr);
        gap: 18px;
        margin-top: 18px;
      }

      .userProfilePanel,
      .userProfileCommunityCard {
        border: 1px solid #dbe4d8;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.74);
        box-shadow: 0 14px 38px rgba(31, 51, 38, 0.05);
      }

      .userProfilePanel {
        padding: 27px;
      }

      .userProfilePanelHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
      }

      .userProfileSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .userProfilePanelHeader h3,
      .userProfileCommunityCard h3 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size: 22px;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }

      .userProfilePanelIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: #e8f0de;
        color: #608046;
      }

      .userProfileBio {
        margin: 27px 0 0;
        color: #69766e;
        font-size: 13px;
        line-height: 1.8;
      }

      .userProfileActivities {
        margin-top: 29px;
        padding-top: 22px;
        border-top: 1px solid #e4e9e1;
      }

      .userProfileActivitiesTitle {
        display: block;
        margin-bottom: 12px;
        color: #667369;
        font-size: 9px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .userProfileChips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .userProfileChip {
        padding: 9px 12px;
        border: 1px solid #d7e2d1;
        border-radius: 999px;
        background: #f5f8f2;
        color: #506557;
        font-size: 9px;
        font-weight: 750;
      }

      .userProfileMiniEmpty {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px;
        border: 1px dashed #ccd7c8;
        border-radius: 15px;
        color: #879289;
        font-size: 10px;
      }

      .userProfileStats {
        display: grid;
        gap: 10px;
        margin-top: 24px;
      }

      .userProfileStats article {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 15px;
        border: 1px solid #e0e7dd;
        border-radius: 16px;
        background: #f8faf6;
      }

      .userProfileStats span {
        color: #879188;
        font-size: 9px;
      }

      .userProfileStats strong {
        color: #415549;
        font-size: 10px;
      }

      .userProfileProgress {
        margin-top: 18px;
        padding: 16px;
        border: 1px solid #e0e7dd;
        border-radius: 16px;
        background: #f8faf6;
      }

      .userProfileProgress > div:first-child {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .userProfileProgress span,
      .userProfileProgress strong {
        font-size: 9px;
      }

      .userProfileProgress span {
        color: #879188;
      }

      .userProfileProgress strong {
        color: #415549;
      }

      .userProfileProgressTrack {
        height: 7px;
        margin-top: 10px;
        overflow: hidden;
        border-radius: 999px;
        background: #e3e9df;
      }

      .userProfileProgressTrack > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background:
          linear-gradient(
            90deg,
            #638746,
            #9fc972
          );
      }

      .userProfileCommunityCard {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 28px;
        margin-top: 18px;
        padding: 30px;
      }

      .userProfileCommunityCard p {
        max-width: 650px;
        margin: 14px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .userProfileCommunityCard > a {
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

      .userProfileCommunityCard > a:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .userProfileStatePage {
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

      .userProfileStateCard {
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

      .userProfileLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation: userProfileSpin 0.8s linear infinite;
      }

      @keyframes userProfileSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .userProfileStateIcon {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        border-radius: 20px;
        background: #ffe9e5;
        color: #a85247;
      }

      .userProfileStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .userProfileStateCard p {
        max-width: 380px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      .userProfileStateActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 9px;
        margin-top: 20px;
      }

      .userProfileStateActions button,
      .userProfileStateActions a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
      }

      .userProfileStateActions button {
        border: 0;
        background: #183a27;
        color: white;
      }

      .userProfileStateActions a {
        border: 1px solid #d5ded2;
        background: white;
        color: #51665a;
        text-decoration: none;
      }

      @media (max-width: 930px) {
        .userProfileMainCard {
          align-items: flex-start;
          flex-direction: column;
        }

        .userProfileGrid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 700px) {
        .userProfilePage {
          padding: 84px 0 64px;
        }

        .userProfileStatePage {
          padding-top: 84px;
        }

        .userProfileHero {
          min-height: 590px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .userProfileHeroCopy {
          padding-top: 130px;
        }

        .userProfileContent {
          padding: 0 18px;
        }

        .userProfileIdentity {
          align-items: flex-start;
          flex-direction: column;
        }

        .userProfileAvatar {
          width: 132px;
          height: 132px;
          border-radius: 34px;
        }

        .userProfileCommunityCard {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .userProfileHero {
          min-height: 550px;
          padding: 19px;
        }

        .userProfileHeroCopy h1 {
          font-size: 50px;
        }

        .userProfileBackLink {
          width: 42px;
          padding: 0;
          justify-content: center;
          font-size: 0;
        }

        .userProfileContent {
          padding: 0 13px;
        }

        .userProfileMainCard,
        .userProfilePanel,
        .userProfileCommunityCard {
          padding: 20px;
        }

        .userProfileEditButton {
          width: 100%;
        }

        .userProfilePanelHeader {
          align-items: flex-start;
          flex-direction: column-reverse;
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
