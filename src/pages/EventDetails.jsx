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
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&auto=format&fit=crop";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=MeetOutdoors";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
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
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
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
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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

function LoadingState() {
  return (
    <>
      <EventDetailsStyles />

      <main className="eventStatePage">
        <div className="eventStateCard">
          <span className="eventLoader" />
          <h1>Učitavanje događaja</h1>
          <p>Pripremamo sve detalje avanture.</p>
        </div>
      </main>
    </>
  );
}

export default function EventDetails() {
  const { id } = useParams();
  const { profile } = useAuth();

  const [event, setEvent] = useState(null);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);

  const [interested, setInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);

  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [error, setError] = useState("");

  const loadComments = useCallback(async (eventId) => {
    const { data, error: commentsError } = await supabase
      .from("event_comments")
      .select(`
        id,
        body,
        created_at,
        profiles:user_id (
          id,
          role,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error(
        "Greška pri učitavanju komentara:",
        commentsError
      );
      setComments([]);
      return;
    }

    setComments(data || []);
  }, []);

  const loadEvent = useCallback(async () => {
    if (!id) {
      setEvent(null);
      setHost(null);
      setComments([]);
      setError("ID događaja nije dostupan.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError || !data) {
        throw (
          eventError ||
          new Error("Događaj nije pronađen.")
        );
      }

      setEvent(data);

      const [
        hostResult,
        interestedCountResult,
        commentsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "username, full_name, avatar_url, role"
          )
          .eq("id", data.host_id)
          .single(),

        supabase
          .from("event_interested")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("event_id", data.id),

        supabase
          .from("event_comments")
          .select(`
            id,
            body,
            created_at,
            profiles:user_id (
              id,
              role,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq("event_id", data.id)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (hostResult.error) {
        console.error(
          "Greška pri učitavanju organizatora:",
          hostResult.error
        );
      }

      setHost(hostResult.data || null);
      setInterestedCount(
        interestedCountResult.count || 0
      );

      if (commentsResult.error) {
        console.error(
          "Greška pri učitavanju komentara:",
          commentsResult.error
        );
        setComments([]);
      } else {
        setComments(commentsResult.data || []);
      }

      if (profile?.id) {
        const { data: existing, error: interestError } =
          await supabase
            .from("event_interested")
            .select("id")
            .eq("event_id", data.id)
            .eq("user_id", profile.id)
            .maybeSingle();

        if (interestError) {
          console.error(
            "Greška pri proveri interesovanja:",
            interestError
          );
        }

        setInterested(Boolean(existing));
      } else {
        setInterested(false);
      }
    } catch (loadError) {
      console.error(
        "Greška pri učitavanju događaja:",
        loadError
      );
      setEvent(null);
      setHost(null);
      setComments([]);
      setInterested(false);
      setInterestedCount(0);
      setError(
        loadError?.message ||
          "Događaj trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }, [id, profile?.id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  async function toggleInterested() {
    if (!profile?.id) {
      alert("Moraš prvo da se prijaviš.");
      return;
    }

    if (!event?.id) return;

    try {
      if (interested) {
        const { error: deleteError } = await supabase
          .from("event_interested")
          .delete()
          .eq("event_id", event.id)
          .eq("user_id", profile.id);

        if (deleteError) throw deleteError;

        setInterested(false);
        setInterestedCount((previous) =>
          Math.max(previous - 1, 0)
        );
        return;
      }

      const { error: insertError } = await supabase
        .from("event_interested")
        .insert({
          event_id: event.id,
          user_id: profile.id,
        });

      if (insertError) throw insertError;

      setInterested(true);
      setInterestedCount((previous) => previous + 1);

      if (event.host_id !== profile.id) {
        const { error: notificationError } =
          await supabase
            .from("notifications")
            .insert({
              user_id: event.host_id,
              from_user_id: profile.id,
              event_id: event.id,
              type: "event_interested",
              title: "Novo interesovanje",
              message: `${
                profile.full_name ||
                profile.username
              } je zainteresovan/a za događaj: ${
                event.title
              }`,
            });

        if (notificationError) {
          console.error(
            "Obaveštenje nije poslato:",
            notificationError
          );
        }
      }
    } catch (interestError) {
      console.error(
        "Greška pri promeni interesovanja:",
        interestError
      );
      alert(
        interestError?.message ||
          "Interesovanje trenutno nije moguće promeniti."
      );
    }
  }

  async function submitComment() {
    if (!profile?.id) {
      alert("Moraš da budeš prijavljen/a.");
      return;
    }

    if (!event?.id) return;

    const body = commentBody.trim();

    if (!body) {
      alert("Komentar je prazan.");
      return;
    }

    try {
      setCommentLoading(true);

      const { error: commentError } = await supabase
        .from("event_comments")
        .insert({
          event_id: event.id,
          user_id: profile.id,
          body,
        });

      if (commentError) throw commentError;

      setCommentBody("");
      await loadComments(event.id);

      if (event.host_id !== profile.id) {
        const { error: notificationError } =
          await supabase
            .from("notifications")
            .insert({
              user_id: event.host_id,
              from_user_id: profile.id,
              event_id: event.id,
              type: "event_comment",
              title: "Novi komentar",
              message: `${
                profile.full_name ||
                profile.username
              } je komentarisao/la događaj: ${
                event.title
              }`,
            });

        if (notificationError) {
          console.error(
            "Obaveštenje nije poslato:",
            notificationError
          );
        }
      }
    } catch (commentError) {
      console.error(
        "Greška pri objavljivanju komentara:",
        commentError
      );
      alert(
        commentError?.message ||
          "Komentar trenutno nije moguće objaviti."
      );
    } finally {
      setCommentLoading(false);
    }
  }

  const location = useMemo(
    () =>
      [event?.location, event?.country]
        .filter(Boolean)
        .join(", ") || "Lokacija nije navedena",
    [event?.location, event?.country]
  );

  const canViewInterestedUsers =
    Boolean(profile?.id) &&
    profile?.id === event?.host_id;

  if (loading) {
    return <LoadingState />;
  }

  if (!event) {
    return (
      <>
        <EventDetailsStyles />

        <main className="eventStatePage">
          <div className="eventStateCard">
            <span className="eventStateIcon">
              <Icon name="alert" size={28} />
            </span>

            <h1>Događaj nije pronađen</h1>

            <p>
              {error ||
                "Ovaj događaj ne postoji ili više nije dostupan."}
            </p>

            <div className="eventStateActions">
              <button
                type="button"
                onClick={loadEvent}
              >
                <Icon name="refresh" size={16} />
                Pokušaj ponovo
              </button>

              <Link to="/events">
                <Icon name="arrowLeft" size={16} />
                Svi događaji
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <EventDetailsStyles />

      <main className="eventPage">
        <section
          className="eventHero"
          style={{
            backgroundImage: `linear-gradient(
              180deg,
              rgba(6, 20, 12, 0.08),
              rgba(6, 20, 12, 0.86)
            ), url(${event.cover_url || FALLBACK_COVER})`,
          }}
        >
          <div className="eventHeroCopy">
            <span className="eventEyebrow">
              <span />
              MeetOutdoors događaj
            </span>

            <h1>{event.title}</h1>

            <p className="eventHeroLocation">
              <Icon name="mapPin" size={17} />
              {location}
            </p>
          </div>

          <div className="eventHeroStats">
            <article>
              <span>Cena</span>
              <strong>€{event.price || 0}</strong>
            </article>

            <article>
              <span>Kapacitet</span>
              <strong>{event.capacity || 1}</strong>
            </article>

            <article>
              <span>Početak</span>
              <strong>
                {formatDate(event.start_date)}
              </strong>
            </article>

            <article>
              <span>Interesovanje</span>
              <strong>
                {interestedCount} ljudi
              </strong>
            </article>
          </div>
        </section>

        <section className="eventContent">
          <div className="eventActionBar">
            <div>
              <span className="eventActionLabel">
                {interestedCount} zainteresovanih
              </span>

              <strong>
                {interested
                  ? "Ovaj događaj je na tvojoj listi."
                  : "Sačuvaj događaj i prati interesovanje."}
              </strong>
            </div>

            <div className="eventActionButtons">
              <button
                type="button"
                className={`eventInterestedButton ${
                  interested ? "active" : ""
                }`}
                onClick={toggleInterested}
              >
                <Icon name="heart" size={18} />
                {interested
                  ? "Zainteresovan/a"
                  : "Zanima me"}
              </button>

              {canViewInterestedUsers && (
                <Link
                  to={`/event/${event.id}/interested`}
                  className="eventPeopleLink"
                >
                  <Icon name="users" size={18} />
                  Zainteresovani
                </Link>
              )}
            </div>
          </div>

          <div className="eventMainGrid">
            <div className="eventMainColumn">
              <section className="eventPanel">
                <div className="eventSectionHeader">
                  <div>
                    <span>O događaju</span>
                    <h2>Detalji avanture.</h2>
                  </div>
                </div>

                <p className="eventDescription">
                  {event.description ||
                    "Opis još nije dodat."}
                </p>
              </section>

              <section className="eventPanel eventTimelinePanel">
                <div className="eventSectionHeader">
                  <div>
                    <span>Vreme događaja</span>
                    <h2>Planiraj unapred.</h2>
                  </div>
                </div>

                <div className="eventTimeline">
                  <article>
                    <span className="eventTimelineIcon">
                      <Icon
                        name="calendar"
                        size={20}
                      />
                    </span>

                    <div>
                      <small>Početak</small>
                      <strong>
                        {formatDate(
                          event.start_date
                        )}
                      </strong>
                    </div>
                  </article>

                  <span className="eventTimelineLine" />

                  <article>
                    <span className="eventTimelineIcon">
                      <Icon
                        name="clock"
                        size={20}
                      />
                    </span>

                    <div>
                      <small>Kraj</small>
                      <strong>
                        {formatDate(event.end_date)}
                      </strong>
                    </div>
                  </article>
                </div>
              </section>
            </div>

            <aside className="eventSidebar">
              {host && (
                <section className="eventPanel eventHostCard">
                  <span className="eventPanelKicker">
                    Organizator
                  </span>

                  <Link
                    to={`/h/${host.username}`}
                    className="eventHostProfile"
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
                      <span>
                        @{host.username}
                      </span>
                    </div>

                    <Icon
                      name="arrowRight"
                      size={16}
                    />
                  </Link>

                  <p>
                    Otvori profil organizatora za više
                    događaja i informacija.
                  </p>
                </section>
              )}

              <section className="eventPanel eventFactsCard">
                <span className="eventPanelKicker">
                  Brzi pregled
                </span>

                <div className="eventFacts">
                  <article>
                    <Icon name="mapPin" size={18} />

                    <div>
                      <span>Lokacija</span>
                      <strong>{location}</strong>
                    </div>
                  </article>

                  <article>
                    <Icon name="users" size={18} />

                    <div>
                      <span>Kapacitet</span>
                      <strong>
                        {event.capacity || 1}
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

                  <article>
                    <Icon
                      name="sparkle"
                      size={18}
                    />

                    <div>
                      <span>Cena</span>
                      <strong>
                        €{event.price || 0}
                      </strong>
                    </div>
                  </article>
                </div>
              </section>
            </aside>
          </div>

          <section className="eventPanel eventCommentsSection">
            <div className="eventSectionHeader">
              <div>
                <span>Komentari</span>
                <h2>Pitanja i razgovor.</h2>
              </div>

              <small>{comments.length}</small>
            </div>

            <div className="eventCommentForm">
              <textarea
                placeholder="Postavi pitanje ili napiši komentar..."
                value={commentBody}
                onChange={(changeEvent) =>
                  setCommentBody(
                    changeEvent.target.value
                  )
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

            <div className="eventCommentsList">
              {comments.length === 0 ? (
                <div className="eventEmpty">
                  Još nema komentara.
                </div>
              ) : (
                comments.map((comment) => {
                  const user = comment.profiles;

                  const userUrl =
                    user?.role === "host"
                      ? `/h/${user.username}`
                      : `/u/${user?.username}`;

                  return (
                    <article
                      className="eventComment"
                      key={comment.id}
                    >
                      <Link to={userUrl}>
                        <img
                          src={
                            user?.avatar_url ||
                            FALLBACK_AVATAR
                          }
                          alt={
                            user?.full_name ||
                            user?.username ||
                            "Korisnik"
                          }
                        />
                      </Link>

                      <div>
                        <div className="eventCommentTop">
                          <Link to={userUrl}>
                            {user?.full_name ||
                              user?.username ||
                              "Nepoznat korisnik"}
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
          </section>

          <section className="eventExploreCard">
            <div>
              <span className="eventSectionLabel">
                Još avantura
              </span>

              <h2>
                Pronađi sledeći događaj koji odgovara
                tvom tempu.
              </h2>

              <p>
                Istraži MeetOutdoors zajednicu i pronađi
                nova okupljanja na otvorenom.
              </p>
            </div>

            <Link to="/events">
              Pregledaj događaje
              <Icon name="arrowRight" size={16} />
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function EventDetailsStyles() {
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
      textarea {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .eventPage,
      .eventStatePage {
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

      .eventPage {
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

      .eventPage a {
        color: inherit;
        text-decoration: none;
      }

      .eventHero {
        position: relative;
        isolation: isolate;
        width: min(1240px, 100%);
        min-height: 670px;
        margin: 0 auto;
        padding: 34px;
        overflow: hidden;
        border-radius: 36px;
        background-position: center;
        background-size: cover;
        color: white;
        box-shadow:
          0 34px 90px rgba(23, 54, 36, 0.18);
      }

      .eventHero::before {
        position: absolute;
        inset: 0;
        z-index: -1;
        background:
          linear-gradient(
            180deg,
            rgba(5, 18, 11, 0.02),
            rgba(5, 18, 11, 0.48)
          );
        content: "";
      }

      .eventHeroCopy {
        max-width: 930px;
        padding-top: 155px;
      }

      .eventEyebrow {
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

      .eventEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow:
          0 0 0 5px rgba(206, 243, 154, 0.12);
      }

      .eventHeroCopy h1 {
        margin: 24px 0 0;
        font-size:
          clamp(58px, 7.5vw, 98px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .eventHeroLocation {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 24px 0 0;
        color:
          rgba(255, 255, 255, 0.72);
        font-size: 13px;
        font-weight: 750;
      }

      .eventHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .eventHeroStats article {
        padding: 17px;
        border:
          1px solid rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background:
          rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .eventHeroStats span,
      .eventHeroStats strong {
        display: block;
      }

      .eventHeroStats span {
        color:
          rgba(255, 255, 255, 0.5);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .eventHeroStats strong {
        margin-top: 7px;
        font-size: 14px;
      }

      .eventContent {
        width: min(1140px, 100%);
        margin: 18px auto 0;
      }

      .eventActionBar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 22px;
        border: 1px solid #dbe4d8;
        border-radius: 24px;
        background:
          rgba(255, 255, 255, 0.83);
        box-shadow:
          0 18px 46px rgba(31, 51, 38, 0.07);
      }

      .eventActionBar span,
      .eventActionBar strong {
        display: block;
      }

      .eventActionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .eventActionBar strong {
        margin-top: 6px;
        color: #3f5447;
        font-size: 12px;
      }

      .eventActionButtons {
        display: flex;
        gap: 10px;
      }

      .eventActionButtons button,
      .eventActionButtons a,
      .eventCommentForm button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 45px;
        padding: 0 16px;
        border-radius: 14px;
        font-size: 10px;
        font-weight: 850;
        transition: 0.2s ease;
      }

      .eventInterestedButton {
        border: 1px solid #d4dfcf;
        background: #f8faf6;
        color: #526758;
        cursor: pointer;
      }

      .eventInterestedButton.active {
        border-color: #d7aaa5;
        background: #fff0ee;
        color: #a34c43;
      }

      .eventPeopleLink,
      .eventCommentForm button {
        border: 1px solid #244d34;
        background: #183a27;
        color: white !important;
      }

      .eventMainGrid {
        display: grid;
        grid-template-columns:
          minmax(0, 1.3fr)
          minmax(300px, 0.7fr);
        gap: 18px;
        margin-top: 18px;
      }

      .eventMainColumn,
      .eventSidebar {
        display: grid;
        align-content: start;
        gap: 18px;
      }

      .eventPanel {
        padding: 26px;
        border: 1px solid #dbe4d8;
        border-radius: 26px;
        background:
          rgba(255, 255, 255, 0.76);
        box-shadow:
          0 14px 38px rgba(31, 51, 38, 0.05);
      }

      .eventSectionHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 16px;
      }

      .eventSectionHeader span,
      .eventPanelKicker,
      .eventSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .eventSectionHeader h2,
      .eventExploreCard h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size: 28px;
        line-height: 1.05;
        letter-spacing: -0.05em;
      }

      .eventSectionHeader small {
        color: #8d978f;
        font-size: 9px;
      }

      .eventDescription {
        margin: 0;
        color: #6e7a72;
        font-size: 12px;
        line-height: 1.8;
        white-space: pre-wrap;
      }

      .eventTimeline {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr)
          34px
          minmax(0, 1fr);
        align-items: center;
        gap: 12px;
      }

      .eventTimeline article {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 16px;
        border: 1px solid #e0e7dd;
        border-radius: 17px;
        background: #f8faf6;
      }

      .eventTimelineIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #e7f0dc;
        color: #608047;
      }

      .eventTimeline small,
      .eventTimeline strong {
        display: block;
      }

      .eventTimeline small {
        color: #929b95;
        font-size: 8px;
      }

      .eventTimeline strong {
        margin-top: 4px;
        color: #405347;
        font-size: 10px;
        line-height: 1.4;
      }

      .eventTimelineLine {
        height: 1px;
        background: #cbd6c7;
      }

      .eventHostProfile {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        margin-top: 16px;
        padding: 13px;
        border: 1px solid #dfe6dc;
        border-radius: 17px;
        background: #f8faf6;
      }

      .eventHostProfile img {
        width: 54px;
        height: 54px;
        border-radius: 16px;
        object-fit: cover;
      }

      .eventHostProfile strong,
      .eventHostProfile span {
        display: block;
      }

      .eventHostProfile strong {
        color: #35493c;
        font-size: 12px;
      }

      .eventHostProfile span {
        margin-top: 4px;
        color: #8b958e;
        font-size: 9px;
      }

      .eventHostCard > p {
        margin: 14px 0 0;
        color: #758178;
        font-size: 10px;
        line-height: 1.65;
      }

      .eventFacts {
        display: grid;
        gap: 10px;
        margin-top: 16px;
      }

      .eventFacts article {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 13px;
        border: 1px solid #e0e7dd;
        border-radius: 15px;
        background: #f8faf6;
        color: #65804c;
      }

      .eventFacts span,
      .eventFacts strong {
        display: block;
      }

      .eventFacts span {
        color: #8b958e;
        font-size: 8px;
      }

      .eventFacts strong {
        margin-top: 3px;
        color: #405347;
        font-size: 9px;
      }

      .eventCommentsSection {
        margin-top: 18px;
      }

      .eventCommentForm {
        display: grid;
        gap: 10px;
      }

      .eventCommentForm textarea {
        width: 100%;
        min-height: 115px;
        padding: 14px;
        border: 1px solid #dbe4d8;
        border-radius: 15px;
        background: #f8faf6;
        color: #33483b;
        outline: none;
        line-height: 1.6;
        resize: vertical;
      }

      .eventCommentForm textarea:focus {
        border-color: #9db28f;
        box-shadow:
          0 0 0 4px rgba(126, 158, 92, 0.1);
      }

      .eventCommentForm button {
        justify-self: start;
        cursor: pointer;
      }

      .eventCommentForm button:disabled {
        cursor: wait;
        opacity: 0.65;
      }

      .eventCommentsList {
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }

      .eventComment {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr);
        gap: 12px;
        padding: 14px;
        border: 1px solid #e0e7dd;
        border-radius: 17px;
        background: #f8faf6;
      }

      .eventComment img {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        object-fit: cover;
      }

      .eventCommentTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .eventCommentTop a {
        color: #3d5144;
        font-size: 10px;
        font-weight: 850;
      }

      .eventCommentTop small {
        color: #929b95;
        font-size: 7px;
      }

      .eventComment p {
        margin: 7px 0 0;
        color: #6f7b73;
        font-size: 10px;
        line-height: 1.65;
      }

      .eventEmpty {
        padding: 24px;
        border: 1px dashed #ccd7c8;
        border-radius: 16px;
        color: #879289;
        text-align: center;
        font-size: 10px;
      }

      .eventExploreCard {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        margin-top: 18px;
        padding: 31px;
        border: 1px solid #dbe4d8;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.72);
        box-shadow:
          0 14px 38px rgba(31, 51, 38, 0.05);
      }

      .eventExploreCard p {
        max-width: 650px;
        margin: 13px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .eventExploreCard > a {
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

      .eventExploreCard > a:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .eventStatePage {
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

      .eventStateCard {
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

      .eventLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          eventSpin 0.8s linear infinite;
      }

      @keyframes eventSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .eventStateIcon {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        border-radius: 20px;
        background: #ffe9e5;
        color: #a85247;
      }

      .eventStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .eventStateCard p {
        max-width: 380px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      .eventStateActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 9px;
        margin-top: 20px;
      }

      .eventStateActions button,
      .eventStateActions a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 850;
      }

      .eventStateActions button {
        border: 0;
        background: #183a27;
        color: white;
        cursor: pointer;
      }

      .eventStateActions a {
        border: 1px solid #d5ded2;
        background: white;
        color: #51665a;
        text-decoration: none;
      }

      @media (max-width: 960px) {
        .eventMainGrid {
          grid-template-columns: 1fr;
        }

        .eventHeroStats {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .eventHero {
          min-height: 740px;
        }
      }

      @media (max-width: 700px) {
        .eventPage {
          padding: 84px 0 64px;
        }

        .eventStatePage {
          padding-top: 84px;
        }

        .eventHero {
          min-height: 780px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .eventHeroCopy {
          padding-top: 135px;
        }

        .eventHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .eventContent {
          padding: 0 18px;
        }

        .eventActionBar {
          align-items: flex-start;
          flex-direction: column;
        }

        .eventActionButtons {
          width: 100%;
        }

        .eventActionButtons button,
        .eventActionButtons a {
          flex: 1;
        }

        .eventTimeline {
          grid-template-columns: 1fr;
        }

        .eventTimelineLine {
          width: 1px;
          height: 24px;
          margin-left: 21px;
        }

        .eventExploreCard {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .eventHero {
          min-height: 820px;
          padding: 19px;
        }

        .eventHeroCopy h1 {
          font-size: 49px;
        }

        .eventHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .eventContent {
          padding: 0 13px;
        }

        .eventActionButtons {
          flex-direction: column;
        }

        .eventActionButtons button,
        .eventActionButtons a {
          width: 100%;
        }

        .eventPanel {
          padding: 20px;
        }

        .eventCommentTop {
          align-items: flex-start;
          flex-direction: column;
        }

        .eventExploreCard {
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
