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
    check: <path d="m5 12 4 4L19 6" />,
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    bolt: (
      <>
        <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
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

  const [participants, setParticipants] = useState([]);
  const [joined, setJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

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

  const loadParticipants = useCallback(
    async (eventId) => {
      const {
        data: interestRows,
        error: interestError,
      } = await supabase
        .from("event_interested")
        .select("id, user_id, created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (interestError) {
        console.error(
          "Greška pri učitavanju učesnika:",
          interestError
        );
        setParticipants([]);
        setJoined(false);
        return;
      }

      const rows = interestRows || [];
      const userIds = rows
        .map((row) => row.user_id)
        .filter(Boolean);

      if (!userIds.length) {
        setParticipants([]);
        setJoined(false);
        return;
      }

      const {
        data: profilesData,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id, role, username, full_name, avatar_url"
        )
        .in("id", userIds);

      if (profilesError) {
        console.error(
          "Greška pri učitavanju profila učesnika:",
          profilesError
        );
        setParticipants(
          rows.map((row) => ({
            ...row,
            profile: null,
          }))
        );
        setJoined(
          Boolean(
            profile?.id &&
              rows.some(
                (row) => row.user_id === profile.id
              )
          )
        );
        return;
      }

      const profileMap = new Map(
        (profilesData || []).map((item) => [
          item.id,
          item,
        ])
      );

      const merged = rows.map((row) => ({
        ...row,
        profile: profileMap.get(row.user_id) || null,
      }));

      setParticipants(merged);
      setJoined(
        Boolean(
          profile?.id &&
            merged.some(
              (row) => row.user_id === profile.id
            )
        )
      );
    },
    [profile?.id]
  );

  const loadEvent = useCallback(async () => {
    if (!id) {
      setEvent(null);
      setHost(null);
      setComments([]);
      setParticipants([]);
      setJoined(false);
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

      const [hostResult] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, username, full_name, avatar_url, role"
          )
          .eq("id", data.host_id)
          .single(),
        loadParticipants(data.id),
        loadComments(data.id),
      ]);

      if (hostResult.error) {
        console.error(
          "Greška pri učitavanju organizatora:",
          hostResult.error
        );
      }

      setHost(hostResult.data || null);
    } catch (loadError) {
      console.error(
        "Greška pri učitavanju događaja:",
        loadError
      );

      setEvent(null);
      setHost(null);
      setComments([]);
      setParticipants([]);
      setJoined(false);
      setError(
        loadError?.message ||
          "Događaj trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }, [id, loadComments, loadParticipants]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (!event?.id) return undefined;

    const participantsChannel = supabase
      .channel(`event-participants-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_interested",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          void loadParticipants(event.id);
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel(`event-comments-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_comments",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          void loadComments(event.id);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(participantsChannel);
      void supabase.removeChannel(commentsChannel);
    };
  }, [event?.id, loadComments, loadParticipants]);

  useEffect(() => {
    if (!actionMessage) return undefined;

    const timer = window.setTimeout(() => {
      setActionMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [actionMessage]);

  async function toggleJoin() {
    if (!profile?.id) {
      alert("Moraš prvo da se prijaviš.");
      return;
    }

    if (!event?.id) return;

    if (profile.id === event.host_id) {
      alert("Ti si organizator ovog događaja.");
      return;
    }

    try {
      setJoinLoading(true);
      setActionMessage("");

      if (joined) {
        const { error: deleteError } = await supabase
          .from("event_interested")
          .delete()
          .eq("event_id", event.id)
          .eq("user_id", profile.id);

        if (deleteError) throw deleteError;

        setJoined(false);
        setParticipants((current) =>
          current.filter(
            (item) => item.user_id !== profile.id
          )
        );
        setActionMessage(
          "Odjavljen/a si sa događaja."
        );

        return;
      }

      const currentCount = participants.length;
      const capacity = Number(event.capacity || 0);

      if (
        capacity > 0 &&
        currentCount >= capacity
      ) {
        alert("Događaj je popunjen.");
        return;
      }

      const { error: insertError } = await supabase
        .from("event_interested")
        .insert({
          event_id: event.id,
          user_id: profile.id,
        });

      if (insertError) throw insertError;

      setJoined(true);

      const optimisticParticipant = {
        id: `optimistic-${profile.id}`,
        user_id: profile.id,
        created_at: new Date().toISOString(),
        profile: {
          id: profile.id,
          role: profile.role,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      };

      setParticipants((current) => {
        if (
          current.some(
            (item) => item.user_id === profile.id
          )
        ) {
          return current;
        }

        return [...current, optimisticParticipant];
      });

      setActionMessage(
        "Uspešno si prijavljen/a na događaj."
      );

      if (event.host_id !== profile.id) {
        const newCount = currentCount + 1;

        const { error: notificationError } =
          await supabase
            .from("notifications")
            .insert({
              user_id: event.host_id,
              from_user_id: profile.id,
              event_id: event.id,
              type: "event_joined",
              title: "Nova prijava na događaj",
              message: `${
                profile.full_name ||
                profile.username ||
                "Novi učesnik"
              } se prijavio/la za događaj: ${
                event.title
              }. Trenutno je prijavljeno ${newCount} ${
                newCount === 1
                  ? "učesnik"
                  : "učesnika"
              }.`,
              is_read: false,
            });

        if (notificationError) {
          console.error(
            "Obaveštenje nije poslato:",
            notificationError
          );
        }
      }

      void loadParticipants(event.id);
    } catch (joinError) {
      console.error(
        "Greška pri prijavi na događaj:",
        joinError
      );

      alert(
        joinError?.message ||
          "Prijavu trenutno nije moguće promeniti."
      );
    } finally {
      setJoinLoading(false);
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
              is_read: false,
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

  const participantCount = participants.length;

  const capacity = Number(event?.capacity || 0);

  const remainingPlaces =
    capacity > 0
      ? Math.max(capacity - participantCount, 0)
      : null;

  const isFull =
    capacity > 0 &&
    participantCount >= capacity;

  const canJoin =
    Boolean(profile?.id) &&
    profile?.id !== event?.host_id;

  const canViewAllParticipants =
    Boolean(profile?.id) &&
    profile?.id === event?.host_id;

  const visibleParticipants =
    participants.slice(0, 8);

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
                onClick={() => void loadEvent()}
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
        {actionMessage && (
          <div className="eventActionToast">
            <span>
              <Icon name="check" size={17} />
            </span>
            <p>{actionMessage}</p>
          </div>
        )}

        <section
          className="eventHero"
          style={{
            backgroundImage: `linear-gradient(
              180deg,
              rgba(6, 20, 12, 0.08),
              rgba(6, 20, 12, 0.88)
            ), url(${event.cover_url || FALLBACK_COVER})`,
          }}
        >
          <div className="eventHeroCopy">
            <span className="eventEyebrow">
              <span />
              Otvoren MeetOutdoors događaj
            </span>

            <h1>{event.title}</h1>

            <p className="eventHeroLocation">
              <Icon name="mapPin" size={17} />
              {location}
            </p>

            <div className="eventHeroJoinLine">
              <span className="eventHeroLiveDot" />

              <strong>
                {participantCount}{" "}
                {participantCount === 1
                  ? "osoba je prijavljena"
                  : "osoba je prijavljeno"}
              </strong>

              {capacity > 0 && (
                <small>
                  · {remainingPlaces} mesta preostalo
                </small>
              )}
            </div>
          </div>

          <div className="eventHeroStats">
            <article>
              <span>Cena</span>
              <strong>€{event.price || 0}</strong>
            </article>

            <article>
              <span>Prijavljeno</span>
              <strong>
                {participantCount}
                {capacity > 0
                  ? ` / ${capacity}`
                  : ""}
              </strong>
            </article>

            <article>
              <span>Početak</span>
              <strong>
                {formatDate(event.start_date)}
              </strong>
            </article>

            <article>
              <span>Status</span>
              <strong>
                {isFull ? "Popunjeno" : "Otvoreno"}
              </strong>
            </article>
          </div>
        </section>

        <section className="eventContent">
          <div className="eventActionBar">
            <div className="eventActionLeft">
              <span className="eventActionLabel">
                Prijava na događaj
              </span>

              <strong>
                {joined
                  ? "Prijavljen/a si. Vidimo se na avanturi."
                  : isFull
                  ? "Događaj je trenutno popunjen."
                  : "Prijava je trenutna — nema čekanja na odobrenje."}
              </strong>

              <small>
                {capacity > 0
                  ? `${participantCount} od ${capacity} mesta je zauzeto.`
                  : `${participantCount} učesnika je trenutno prijavljeno.`}
              </small>
            </div>

            <div className="eventActionButtons">
              {canJoin && (
                <button
                  type="button"
                  className={`eventJoinButton ${
                    joined ? "active" : ""
                  }`}
                  onClick={toggleJoin}
                  disabled={
                    joinLoading ||
                    (!joined && isFull)
                  }
                >
                  <Icon
                    name={joined ? "check" : "bolt"}
                    size={18}
                  />

                  {joinLoading
                    ? "Čuvanje..."
                    : joined
                    ? "Prijavljen/a si"
                    : isFull
                    ? "Popunjeno"
                    : "Prijavi se"}
                </button>
              )}

              {joined && (
                <button
                  type="button"
                  className="eventLeaveButton"
                  onClick={toggleJoin}
                  disabled={joinLoading}
                >
                  <Icon name="x" size={16} />
                  Otkaži prijavu
                </button>
              )}

              {canViewAllParticipants && (
                <button
                  type="button"
                  className="eventHostParticipantsButton"
                  onClick={() =>
                    document
                      .getElementById("participants")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  <Icon name="users" size={17} />
                  Učesnici
                </button>
              )}
            </div>
          </div>

          <section
            className="eventParticipantsPanel"
            id="participants"
          >
            <div className="eventParticipantsHeader">
              <div>
                <span className="eventSectionLabel">
                  Ljudi koji dolaze
                </span>

                <h2>
                  Avantura već ima svoju ekipu.
                </h2>

                <p>
                  Prijavljeni učesnici su vidljivi svima,
                  tako da odmah znaš sa kim deliš iskustvo.
                </p>
              </div>

              <div className="eventParticipantCount">
                <span>
                  <Icon name="users" size={18} />
                </span>

                <div>
                  <strong>{participantCount}</strong>
                  <small>
                    {capacity > 0
                      ? `od ${capacity} mesta`
                      : "prijavljenih"}
                  </small>
                </div>
              </div>
            </div>

            {participantCount === 0 ? (
              <div className="eventParticipantsEmpty">
                <span>
                  <Icon name="users" size={25} />
                </span>

                <div>
                  <strong>
                    Još nema prijavljenih učesnika.
                  </strong>

                  <small>
                    Budi prvi koji će se pridružiti.
                  </small>
                </div>
              </div>
            ) : (
              <>
                <div className="eventAvatarStack">
                  {visibleParticipants.map((item) => {
                    const participant = item.profile;
                    const target =
                      participant?.role === "host"
                        ? `/h/${participant.username}`
                        : `/u/${participant?.username}`;

                    return participant?.username ? (
                      <Link
                        key={item.id}
                        to={target}
                        className="eventParticipantAvatar"
                        title={
                          participant.full_name ||
                          participant.username
                        }
                      >
                        <img
                          src={
                            participant.avatar_url ||
                            FALLBACK_AVATAR
                          }
                          alt={
                            participant.full_name ||
                            participant.username
                          }
                        />
                      </Link>
                    ) : (
                      <span
                        key={item.id}
                        className="eventParticipantAvatar"
                      >
                        <img
                          src={FALLBACK_AVATAR}
                          alt="Učesnik"
                        />
                      </span>
                    );
                  })}

                  {participantCount >
                    visibleParticipants.length && (
                    <span className="eventParticipantMore">
                      +
                      {participantCount -
                        visibleParticipants.length}
                    </span>
                  )}
                </div>

                <div className="eventParticipantNames">
                  {visibleParticipants
                    .slice(0, 4)
                    .map((item) => {
                      const participant = item.profile;

                      return (
                        <span key={item.id}>
                          {participant?.full_name ||
                            participant?.username ||
                            "Učesnik"}
                        </span>
                      );
                    })}

                  {participantCount > 4 && (
                    <small>
                      i još {participantCount - 4}
                    </small>
                  )}
                </div>

                {canViewAllParticipants && (
                  <div className="eventHostParticipantList">
                    {participants.map((item) => {
                      const participant = item.profile;
                      const target =
                        participant?.role === "host"
                          ? `/h/${participant.username}`
                          : `/u/${participant?.username}`;

                      return (
                        <article key={item.id}>
                          <img
                            src={
                              participant?.avatar_url ||
                              FALLBACK_AVATAR
                            }
                            alt={
                              participant?.full_name ||
                              participant?.username ||
                              "Učesnik"
                            }
                          />

                          <div>
                            <strong>
                              {participant?.full_name ||
                                participant?.username ||
                                "Učesnik"}
                            </strong>

                            <small>
                              {participant?.username
                                ? `@${participant.username}`
                                : "MeetOutdoors korisnik"}
                            </small>
                          </div>

                          {participant?.username && (
                            <Link to={target}>
                              <Icon
                                name="eye"
                                size={15}
                              />
                              Profil
                            </Link>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

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
                        {formatDate(
                          event.end_date
                        )}
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
                      <span>Prijavljeno</span>
                      <strong>
                        {participantCount}
                        {capacity > 0
                          ? ` / ${capacity}`
                          : ""}
                      </strong>
                    </div>
                  </article>

                  <article>
                    <Icon name="bolt" size={18} />

                    <div>
                      <span>Status prijava</span>
                      <strong>
                        {isFull
                          ? "Popunjeno"
                          : "Otvoreno"}
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
        background: #e9eee5;
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
        position: relative;
        padding: 118px 28px 70px;
        background:
          radial-gradient(
            circle at 7% 0%,
            rgba(177, 211, 139, 0.2),
            transparent 27%
          ),
          radial-gradient(
            circle at 94% 25%,
            rgba(64, 106, 75, 0.11),
            transparent 24%
          ),
          #e9eee5;
      }

      .eventPage a {
        color: inherit;
        text-decoration: none;
      }

      .eventActionToast {
        position: fixed;
        top: 96px;
        right: 24px;
        z-index: 5000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: min(420px, calc(100vw - 32px));
        padding: 12px 14px;
        border: 1px solid rgba(186, 255, 158, 0.25);
        border-radius: 16px;
        background: rgba(16, 49, 29, 0.95);
        color: white;
        box-shadow: 0 20px 55px rgba(17, 44, 27, 0.25);
        backdrop-filter: blur(18px);
      }

      .eventActionToast > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 11px;
        background: #baff9e;
        color: #173b27;
      }

      .eventActionToast p {
        margin: 0;
        font-size: 10px;
        line-height: 1.5;
      }

      .eventHero {
        position: relative;
        isolation: isolate;
        width: min(1240px, 100%);
        min-height: 690px;
        margin: 0 auto;
        padding: 38px;
        overflow: hidden;
        border-radius: 38px;
        background-position: center;
        background-size: cover;
        color: white;
        box-shadow:
          0 36px 95px rgba(23, 54, 36, 0.21);
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
        max-width: 940px;
        padding-top: 145px;
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
        background: #baff9e;
        box-shadow:
          0 0 0 5px rgba(186, 255, 158, 0.13);
      }

      .eventHeroCopy h1 {
        margin: 24px 0 0;
        font-size:
          clamp(60px, 7.8vw, 102px);
        line-height: 0.88;
        letter-spacing: -0.078em;
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

      .eventHeroJoinLine {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
        color: rgba(255, 255, 255, 0.78);
      }

      .eventHeroLiveDot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #baff9e;
        box-shadow:
          0 0 0 5px rgba(186, 255, 158, 0.11);
      }

      .eventHeroJoinLine strong {
        font-size: 10px;
      }

      .eventHeroJoinLine small {
        color: rgba(255, 255, 255, 0.48);
        font-size: 9px;
      }

      .eventHeroStats {
        position: absolute;
        right: 38px;
        bottom: 38px;
        left: 38px;
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
        overflow: hidden;
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        border: 1px solid #d6e1d3;
        border-radius: 24px;
        background:
          rgba(255, 255, 255, 0.86);
        box-shadow:
          0 18px 46px rgba(31, 51, 38, 0.08);
      }

      .eventActionLeft span,
      .eventActionLeft strong,
      .eventActionLeft small {
        display: block;
      }

      .eventActionLabel {
        color: #6f914e;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .eventActionLeft strong {
        margin-top: 6px;
        color: #30473a;
        font-size: 13px;
      }

      .eventActionLeft small {
        margin-top: 5px;
        color: #8a958d;
        font-size: 9px;
      }

      .eventActionButtons {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 9px;
      }

      .eventActionButtons button,
      .eventCommentForm button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 46px;
        padding: 0 16px;
        border-radius: 14px;
        font-size: 10px;
        font-weight: 900;
        transition: 0.2s ease;
      }

      .eventJoinButton {
        min-width: 155px;
        border: 1px solid #173b27;
        background: #173b27;
        color: white;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(23, 59, 39, 0.17);
      }

      .eventJoinButton:hover:not(:disabled) {
        transform: translateY(-2px);
        background: #224f35;
      }

      .eventJoinButton.active {
        border-color: #9bcf81;
        background: #eaf6e3;
        color: #3e6633;
        box-shadow: none;
      }

      .eventJoinButton:disabled {
        cursor: not-allowed;
        opacity: 0.62;
      }

      .eventLeaveButton {
        border: 1px solid #ddb1ab;
        background: #fff1ef;
        color: #a34d43;
        cursor: pointer;
      }

      .eventHostParticipantsButton {
        border: 1px solid #d5dfd2;
        background: #f8faf6;
        color: #4f6657;
        cursor: pointer;
      }

      .eventParticipantsPanel {
        margin-top: 18px;
        padding: 28px;
        border: 1px solid #d6e1d3;
        border-radius: 28px;
        background:
          radial-gradient(
            circle at 94% 0%,
            rgba(186, 255, 158, 0.09),
            transparent 28%
          ),
          linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.88),
            rgba(239, 246, 234, 0.84)
          );
        box-shadow:
          0 16px 42px rgba(31, 51, 38, 0.06);
      }

      .eventParticipantsHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
      }

      .eventParticipantsHeader h2,
      .eventExploreCard h2 {
        margin: 8px 0 0;
        color: #263d31;
        font-size: clamp(28px, 4vw, 43px);
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .eventParticipantsHeader p {
        max-width: 620px;
        margin: 10px 0 0;
        color: #7e8981;
        font-size: 10px;
        line-height: 1.65;
      }

      .eventParticipantCount {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 0 0 auto;
        padding: 12px 14px;
        border: 1px solid #d3e0cf;
        border-radius: 16px;
        background: white;
      }

      .eventParticipantCount > span {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #e7f0dc;
        color: #608047;
      }

      .eventParticipantCount strong,
      .eventParticipantCount small {
        display: block;
      }

      .eventParticipantCount strong {
        color: #2e4637;
        font-size: 17px;
      }

      .eventParticipantCount small {
        margin-top: 3px;
        color: #89938c;
        font-size: 8px;
      }

      .eventAvatarStack {
        display: flex;
        align-items: center;
        margin-top: 24px;
        padding-left: 5px;
      }

      .eventParticipantAvatar,
      .eventParticipantMore {
        position: relative;
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        margin-left: -10px;
        overflow: hidden;
        border: 4px solid #f5f8f1;
        border-radius: 18px;
        background: #dfe9d9;
        box-shadow: 0 9px 24px rgba(31, 51, 38, 0.12);
        transition: 0.18s ease;
      }

      .eventParticipantAvatar:first-child {
        margin-left: 0;
      }

      .eventParticipantAvatar:hover {
        z-index: 3;
        transform: translateY(-4px) scale(1.04);
      }

      .eventParticipantAvatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .eventParticipantMore {
        z-index: 2;
        background: #173b27;
        color: #baff9e;
        font-size: 10px;
        font-weight: 900;
      }

      .eventParticipantNames {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 10px;
        margin-top: 14px;
        color: #53665a;
        font-size: 9px;
        font-weight: 800;
      }

      .eventParticipantNames span::after {
        margin-left: 10px;
        color: #a0aaa2;
        content: "·";
      }

      .eventParticipantNames span:last-of-type::after {
        display: none;
      }

      .eventParticipantNames small {
        color: #7c8b80;
        font-size: 9px;
      }

      .eventParticipantsEmpty {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
        padding: 16px;
        border: 1px dashed #cbd8c7;
        border-radius: 17px;
        background: rgba(255, 255, 255, 0.58);
      }

      .eventParticipantsEmpty > span {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border-radius: 15px;
        background: #e7f0dc;
        color: #608047;
      }

      .eventParticipantsEmpty strong,
      .eventParticipantsEmpty small {
        display: block;
      }

      .eventParticipantsEmpty strong {
        color: #3d5144;
        font-size: 10px;
      }

      .eventParticipantsEmpty small {
        margin-top: 4px;
        color: #89938c;
        font-size: 8px;
      }

      .eventHostParticipantList {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 9px;
        margin-top: 22px;
        padding-top: 20px;
        border-top: 1px solid #dde5da;
      }

      .eventHostParticipantList article {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-width: 0;
        padding: 11px;
        border: 1px solid #dde5da;
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.72);
      }

      .eventHostParticipantList img {
        width: 43px;
        height: 43px;
        border-radius: 13px;
        object-fit: cover;
      }

      .eventHostParticipantList strong,
      .eventHostParticipantList small {
        display: block;
      }

      .eventHostParticipantList strong {
        overflow: hidden;
        color: #3d5144;
        font-size: 9px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .eventHostParticipantList small {
        margin-top: 3px;
        color: #89938c;
        font-size: 8px;
      }

      .eventHostParticipantList a {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        min-height: 33px;
        padding: 0 9px;
        border: 1px solid #d4ded1;
        border-radius: 10px;
        background: #f8faf6;
        color: #53665a;
        font-size: 8px;
        font-weight: 850;
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

      .eventSectionHeader h2 {
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
        border: 1px solid #244d34;
        background: #183a27;
        color: white;
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
          #e9eee5;
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
          min-height: 760px;
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
          min-height: 800px;
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

        .eventActionBar,
        .eventParticipantsHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .eventActionButtons {
          width: 100%;
          justify-content: flex-start;
        }

        .eventActionButtons button {
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

        .eventHostParticipantList {
          grid-template-columns: 1fr;
        }

        .eventExploreCard {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .eventHero {
          min-height: 840px;
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

        .eventActionButtons button {
          width: 100%;
        }

        .eventParticipantsPanel,
        .eventPanel {
          padding: 20px;
        }

        .eventParticipantAvatar,
        .eventParticipantMore {
          width: 50px;
          height: 50px;
          border-radius: 15px;
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
