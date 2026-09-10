import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import ShareSheet from "../components/ShareSheet";
import SeoHead from "../seo/SeoHead";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&auto=format&fit=crop";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=MeetOutdoors";

const ACTIVITY_LABELS = Object.fromEntries([
  ["hiking", "Planinarenje"],
  ["trekking", "Trekking"],
  ["camping", "Kampovanje"],
  ["cycling", "Biciklizam"],
  ["mountain biking", "MTB"],
  ["trail running", "Trail running"],
  ["climbing", "Penjanje"],
  ["via ferrata", "Via ferrata"],
  ["caving", "Speleologija"],
  ["canyoning", "Kanjoning"],
  ["rafting", "Rafting"],
  ["kayaking", "Kajak"],
  ["canoeing", "Kanu"],
  ["sup", "SUP"],
  ["sailing", "Jedrenje"],
  ["surfing", "Surfing"],
  ["kitesurfing", "Kitesurfing"],
  ["diving", "Ronjenje"],
  ["paragliding", "Paraglajding"],
  ["skydiving", "Padobranstvo"],
  ["skiing", "Skijanje"],
  ["snowboarding", "Snowboarding"],
  ["snowshoeing", "Krpljanje"],
  ["horse riding", "Jahanje"],
  ["fishing", "Ribolov"],
  ["off-road", "Off-road / 4x4"],
  ["nature trip", "Izlet u prirodi"],
  ["other", "Ostalo"],
]);

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
    chatBubble: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
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
  if (!value) return "Termin po dogovoru";

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

function formatChatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    ...(sameDay
      ? {}
      : {
          day: "2-digit",
          month: "short",
        }),
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
          <h1>Učitavanje avanture</h1>
          <p>Pripremamo sve detalje avanture.</p>
        </div>
      </main>
    </>
  );
}

export default function EventDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();

  const [event, setEvent] = useState(null);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);

  const [participants, setParticipants] = useState([]);
  const [joined, setJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [confirmingParticipantId, setConfirmingParticipantId] = useState(null);
  const [rejectingParticipantId, setRejectingParticipantId] = useState(null);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatBody, setChatBody] = useState("");
  const chatEndRef = useRef(null);


  const [lightboxIndex, setLightboxIndex] = useState(null);
  const lightboxTouchStartX = useRef(null);

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
    async (eventId, hostId = null) => {
      const participantFields =
        profile?.id && hostId && profile.id === hostId
          ? "id, user_id, created_at, full_name, phone, status"
          : "id, user_id, created_at, full_name, status";

      const {
        data: interestRows,
        error: interestError,
      } = await supabase
        .from("event_interested")
        .select(participantFields)
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
                (row) =>
                  row.user_id === profile.id &&
                  row.status !== "rejected"
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
              (row) =>
                row.user_id === profile.id &&
                row.status !== "rejected"
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
      setError("ID avanture nije dostupan.");
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
          new Error("Avantura nije pronađena.")
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
        loadParticipants(data.id, data.host_id),
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
          "Avanturu trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }, [id, loadComments, loadParticipants]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (!event?.id || !profile?.id) return undefined;

    const refreshRegistration = () => {
      void loadParticipants(event.id, event.host_id);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshRegistration();
      }
    };

    window.addEventListener("focus", refreshRegistration);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const intervalId = window.setInterval(refreshRegistration, 10000);

    return () => {
      window.removeEventListener("focus", refreshRegistration);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [event?.id, event?.host_id, profile?.id, loadParticipants]);

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
          void loadParticipants(event.id, event.host_id);
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
  }, [event?.id, event?.host_id, loadComments, loadParticipants]);

  useEffect(() => {
    if (!actionMessage) return undefined;

    const timer = window.setTimeout(() => {
      setActionMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [actionMessage]);

  async function submitJoin() {
    if (!profile?.id || !event?.id) return;

    if (
      event.status === "completed" ||
      event.status === "cancelled" ||
      event.is_active === false
    ) {
      alert("Ova avantura je završena i više ne prima prijave.");
      return;
    }

    if (profile.id === event.host_id) {
      alert("Ti si organizator ove avanture.");
      return;
    }

    const currentCount = participants.filter(
      (item) => item.status !== "rejected"
    ).length;
    const capacity = Number(event.capacity || 0);

    if (capacity > 0 && currentCount >= capacity) {
      alert("Avantura je popunjena.");
      return;
    }

    try {
      setJoinLoading(true);
      setActionMessage("");

      let insertedRow = null;

      if (currentRegistrationRejected && currentRegistration?.id) {
        const { data: updatedRow, error: updateError } = await supabase
          .from("event_interested")
          .update({
            full_name: profile.full_name || profile.username || "Korisnik",
            phone: null,
            status: "pending",
          })
          .eq("id", currentRegistration.id)
          .eq("event_id", event.id)
          .eq("user_id", profile.id)
          .select("id, user_id, created_at, full_name, phone, status")
          .single();

        if (updateError) throw updateError;
        insertedRow = updatedRow;
      } else {
        const { data: newRow, error: insertError } = await supabase
          .from("event_interested")
          .insert({
            event_id: event.id,
            user_id: profile.id,
            full_name: profile.full_name || profile.username || "Korisnik",
            phone: null,
            status: "pending",
          })
          .select("id, user_id, created_at, full_name, phone, status")
          .single();

        if (insertError) throw insertError;
        insertedRow = newRow;
      }

      setJoined(true);

      const optimisticParticipant = {
        id: insertedRow?.id || `optimistic-${profile.id}`,
        user_id: profile.id,
        created_at: insertedRow?.created_at || new Date().toISOString(),
        full_name:
          insertedRow?.full_name ||
          profile.full_name ||
          profile.username ||
          "Korisnik",
        phone: null,
        status: insertedRow?.status || "pending",
        profile: {
          id: profile.id,
          role: profile.role,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      };

      setParticipants((current) => {
        const existingIndex = current.findIndex(
          (item) => item.user_id === profile.id
        );

        if (existingIndex === -1) {
          return [...current, optimisticParticipant];
        }

        return current.map((item, index) =>
          index === existingIndex ? optimisticParticipant : item
        );
      });

      setActionMessage("Prijava je poslata. Grupni chat je otključan.");

      if (event.host_id !== profile.id) {
        const newCount = currentCount + 1;
        const displayName =
          profile.full_name || profile.username || "Korisnik";

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: event.host_id,
            from_user_id: profile.id,
            event_id: event.id,
            type: "event_joined",
            title: "Nova prijava na avanturu",
            message: `${displayName} se prijavio/la za avanturu: ${event.title}. Trenutno je prijavljeno ${newCount} ${
              newCount === 1 ? "učesnik" : "učesnika"
            }.`,
            is_read: false,
          });

        if (notificationError) {
          console.error("Obaveštenje nije poslato:", notificationError);
        }
      }

      void loadParticipants(event.id, event.host_id);
    } catch (joinError) {
      console.error("Greška pri prijavi na avanturu:", joinError);
      alert(joinError?.message || "Prijavu trenutno nije moguće poslati.");
    } finally {
      setJoinLoading(false);
    }
  }

  async function cancelJoin() {
    if (!profile?.id || !event?.id || !joined) return;

    try {
      setJoinLoading(true);
      setActionMessage("");

      const { error: deleteError } = await supabase
        .from("event_interested")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", profile.id);

      if (deleteError) throw deleteError;

      setJoined(false);
      setParticipants((current) =>
        current.filter((item) => item.user_id !== profile.id)
      );

      if (event.host_id !== profile.id) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: event.host_id,
            from_user_id: profile.id,
            event_id: event.id,
            type: "event_application_cancelled",
            title: "Prijava je otkazana",
            message: `${
              profile.full_name || profile.username || "Korisnik"
            } je otkazao/la prijavu za avanturu: ${event.title}.`,
            is_read: false,
          });

        if (notificationError) {
          console.error(
            "Obaveštenje o otkazivanju nije poslato:",
            notificationError
          );
        }
      }

      setActionMessage("Prijava je otkazana.");
    } catch (joinError) {
      console.error("Greška pri otkazivanju prijave:", joinError);
      alert(joinError?.message || "Prijavu trenutno nije moguće otkazati.");
    } finally {
      setJoinLoading(false);
    }
  }

  async function confirmParticipant(registrationId) {
    if (!profile?.id || profile.id !== event?.host_id) return;

    const registration = participants.find(
      (item) => item.id === registrationId
    );

    if (!registration) {
      alert("Prijava više nije dostupna. Osveži stranicu i pokušaj ponovo.");
      return;
    }

    try {
      setConfirmingParticipantId(registrationId);

      const { error: confirmError } = await supabase
        .from("event_interested")
        .update({ status: "confirmed" })
        .eq("id", registrationId)
        .eq("event_id", event.id);

      if (confirmError) throw confirmError;

      setParticipants((current) =>
        current.map((item) =>
          item.id === registrationId
            ? { ...item, status: "confirmed" }
            : item
        )
      );

      if (registration.user_id && registration.user_id !== profile.id) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: registration.user_id,
            from_user_id: profile.id,
            event_id: event.id,
            type: "event_application_confirmed",
            title: "Prijava je potvrđena",
            message: `Domaćin je prihvatio tvoju prijavu za avanturu: ${event.title}.`,
            is_read: false,
          });

        if (notificationError) {
          console.error(
            "Obaveštenje korisniku nije poslato:",
            notificationError
          );
        }
      }

      setActionMessage("Prijava je potvrđena i korisnik je obavešten.");
    } catch (confirmError) {
      console.error("Greška pri potvrdi prijave:", confirmError);
      alert(
        confirmError?.message ||
          "Prijavu trenutno nije moguće potvrditi."
      );
    } finally {
      setConfirmingParticipantId(null);
    }
  }

  async function rejectParticipant(registrationId) {
    if (!profile?.id || profile.id !== event?.host_id) return;

    const registration = participants.find(
      (item) => item.id === registrationId
    );

    if (!registration) {
      alert("Prijava više nije dostupna. Osveži stranicu i pokušaj ponovo.");
      return;
    }

    try {
      setRejectingParticipantId(registrationId);

      const { error: rejectError } = await supabase
        .from("event_interested")
        .update({ status: "rejected" })
        .eq("id", registrationId)
        .eq("event_id", event.id);

      if (rejectError) throw rejectError;

      setParticipants((current) =>
        current.map((item) =>
          item.id === registrationId
            ? { ...item, status: "rejected" }
            : item
        )
      );

      if (registration.user_id && registration.user_id !== profile.id) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: registration.user_id,
            from_user_id: profile.id,
            event_id: event.id,
            type: "event_application_rejected",
            title: "Prijava nije prihvaćena",
            message: `Domaćin trenutno nije u mogućnosti da potvrdi tvoju prijavu za avanturu: ${event.title}.`,
            is_read: false,
          });

        if (notificationError) {
          console.error(
            "Obaveštenje o odbijanju nije poslato:",
            notificationError
          );
        }
      }

      setActionMessage("Prijava je odbijena i korisnik je obavešten.");
    } catch (rejectError) {
      console.error("Greška pri odbijanju prijave:", rejectError);
      alert(
        rejectError?.message ||
          "Prijavu trenutno nije moguće odbiti."
      );
    } finally {
      setRejectingParticipantId(null);
    }
  }

  async function finishEvent(showOnProfile) {
    if (!profile?.id || !event?.id || profile.id !== event.host_id) return;

    try {
      setFinishLoading(true);
      setActionMessage("");

      const completedAt = new Date().toISOString();
      const { data: updatedEvent, error: finishError } = await supabase
        .from("events")
        .update({
          status: "completed",
          is_active: false,
          show_on_profile: showOnProfile,
          completed_at: completedAt,
          updated_at: completedAt,
        })
        .eq("id", event.id)
        .eq("host_id", profile.id)
        .select("*")
        .single();

      if (finishError) throw finishError;

      setEvent(updatedEvent || {
        ...event,
        status: "completed",
        is_active: false,
        show_on_profile: showOnProfile,
        completed_at: completedAt,
        updated_at: completedAt,
      });
      setFinishModalOpen(false);
      setActionMessage(
        showOnProfile
          ? "Avantura je završena i sačuvana u portfoliju."
          : "Avantura je završena bez prikaza na profilu."
      );
    } catch (finishError) {
      console.error("Greška pri završavanju avanture:", finishError);
      alert(finishError?.message || "Avanturu trenutno nije moguće završiti.");
    } finally {
      setFinishLoading(false);
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
              } je komentarisao/la avanturu: ${
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

  const eventPhotos = useMemo(
    () =>
      Array.from(
        new Set([
          event?.cover_url,
          ...(Array.isArray(event?.gallery_urls) ? event.gallery_urls : []),
        ].filter(Boolean))
      ).slice(0, 8),
    [event?.cover_url, event?.gallery_urls]
  );

  useEffect(() => {
    if (lightboxIndex === null) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        setLightboxIndex(null);
        return;
      }

      if (eventPhotos.length < 2) return;

      if (keyboardEvent.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null
            ? 0
            : (current + 1) % eventPhotos.length
        );
      }

      if (keyboardEvent.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null
            ? 0
            : (current - 1 + eventPhotos.length) % eventPhotos.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, eventPhotos.length]);

  function openLightbox(index) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
    lightboxTouchStartX.current = null;
  }

  function showPreviousPhoto() {
    if (!eventPhotos.length) return;

    setLightboxIndex((current) =>
      current === null
        ? 0
        : (current - 1 + eventPhotos.length) % eventPhotos.length
    );
  }

  function showNextPhoto() {
    if (!eventPhotos.length) return;

    setLightboxIndex((current) =>
      current === null
        ? 0
        : (current + 1) % eventPhotos.length
    );
  }

  function scrollGallery(direction) {
    const gallery = document.getElementById("eventGalleryRail");
    if (!gallery) return;

    const amount = Math.max(gallery.clientWidth * 0.78, 280);
    gallery.scrollBy({
      left: direction * amount,
      behavior: "smooth",
    });
  }

  function handleLightboxTouchStart(touchEvent) {
    lightboxTouchStartX.current =
      touchEvent.changedTouches?.[0]?.clientX ?? null;
  }

  function handleLightboxTouchEnd(touchEvent) {
    const startX = lightboxTouchStartX.current;
    const endX = touchEvent.changedTouches?.[0]?.clientX;

    lightboxTouchStartX.current = null;

    if (
      startX === null ||
      typeof endX !== "number" ||
      eventPhotos.length < 2
    ) {
      return;
    }

    const distance = endX - startX;

    if (Math.abs(distance) < 45) return;

    if (distance < 0) {
      showNextPhoto();
    } else {
      showPreviousPhoto();
    }
  }

  const eventActivities = Array.isArray(event?.activities)
    ? event.activities
    : [];

  const includedItems = Array.isArray(event?.included_items)
    ? event.included_items.filter(Boolean)
    : [];

  const activeParticipants = useMemo(
    () => participants.filter((item) => item.status !== "rejected"),
    [participants]
  );

  const pendingParticipants = useMemo(
    () => participants.filter((item) => item.status === "pending"),
    [participants]
  );

  const confirmedParticipants = useMemo(
    () => participants.filter((item) => item.status === "confirmed"),
    [participants]
  );

  const rejectedParticipants = useMemo(
    () => participants.filter((item) => item.status === "rejected"),
    [participants]
  );

  const participantCount = activeParticipants.length;
  const pendingCount = pendingParticipants.length;
  const confirmedCount = confirmedParticipants.length;
  const rejectedCount = rejectedParticipants.length;

  const capacity = Number(event?.capacity || 0);

  // Pending prijave privremeno rezervišu mesto dok ih host ne obradi.
  // Odbijene prijave više ne zauzimaju kapacitet.
  const remainingPlaces =
    capacity > 0
      ? Math.max(capacity - participantCount, 0)
      : null;

  const isFull =
    capacity > 0 &&
    participantCount >= capacity;

  const isCompleted = event?.status === "completed";
  const registrationsClosed =
    isCompleted ||
    event?.status === "cancelled" ||
    event?.is_active === false;

  const canJoin =
    Boolean(profile?.id) &&
    profile?.id !== event?.host_id &&
    !registrationsClosed;

  const canViewAllParticipants =
    Boolean(profile?.id) &&
    profile?.id === event?.host_id;

  const visibleParticipants =
    activeParticipants.slice(0, 8);

  const currentRegistration = profile?.id
    ? participants.find((item) => item.user_id === profile.id)
    : null;

  const currentRegistrationStatus = currentRegistration?.status || null;
  const currentRegistrationPending = currentRegistrationStatus === "pending";
  const currentRegistrationConfirmed = currentRegistrationStatus === "confirmed";
  const currentRegistrationRejected = currentRegistrationStatus === "rejected";

  const canAccessGroupChat = Boolean(
    profile?.id &&
      event?.id &&
      (
        profile.id === event.host_id ||
        currentRegistrationPending ||
        currentRegistrationConfirmed
      )
  );

  const loadChatMessages = useCallback(async () => {
    if (!profile?.id || !event?.id) {
      setChatMessages([]);
      return;
    }

    setChatLoading(true);

    try {
      const { data, error: chatError } = await supabase
        .from("event_chat_messages")
        .select(`
          id,
          event_id,
          user_id,
          body,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("event_id", event.id)
        .order("created_at", { ascending: true })
        .limit(300);

      if (chatError) throw chatError;
      setChatMessages(data || []);
    } catch (chatError) {
      console.error("Greška pri učitavanju grupnog chata:", chatError);
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  }, [profile?.id, event?.id]);

  const openGroupChat = useCallback(() => {
    if (!profile?.id) {
      alert("Moraš prvo da se prijaviš.");
      return;
    }

    if (!canAccessGroupChat) {
      alert("Grupni chat je dostupan organizatoru i prijavljenim učesnicima.");
      return;
    }

    setChatOpen(true);
    void loadChatMessages();
  }, [profile?.id, canAccessGroupChat, loadChatMessages]);

  useEffect(() => {
    if (
      searchParams.get("chat") !== "1" ||
      !canAccessGroupChat ||
      chatOpen
    ) {
      return;
    }

    setChatOpen(true);
    void loadChatMessages();

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("chat");
    setSearchParams(nextParams, { replace: true });
  }, [
    searchParams,
    setSearchParams,
    canAccessGroupChat,
    chatOpen,
    loadChatMessages,
  ]);

  const sendChatMessage = useCallback(async () => {
    const body = chatBody.trim();

    if (!body || !profile?.id || !event?.id || !canAccessGroupChat) {
      return;
    }

    try {
      setChatSending(true);

      const { data: insertedMessage, error: sendError } = await supabase
        .from("event_chat_messages")
        .insert({
          event_id: event.id,
          user_id: profile.id,
          body,
        })
        .select("id, event_id, user_id, body, created_at")
        .single();

      if (sendError) throw sendError;

      setChatBody("");

      if (insertedMessage) {
        setChatMessages((current) => {
          if (current.some((item) => item.id === insertedMessage.id)) {
            return current;
          }

          return [
            ...current,
            {
              ...insertedMessage,
              profiles: {
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
              },
            },
          ];
        });
      }

      const senderName =
        profile.full_name || profile.username || "Učesnik";

      const activeRecipientIds = Array.from(
        new Set([
          event.host_id,
          ...participants
            .filter((item) => item.status !== "rejected")
            .map((item) => item.user_id),
        ])
      ).filter((userId) => userId && userId !== profile.id);

      if (activeRecipientIds.length > 0) {
        const preview =
          body.length > 140 ? `${body.slice(0, 137)}...` : body;

        const rows = activeRecipientIds.map((userId) => ({
          user_id: userId,
          from_user_id: profile.id,
          event_id: event.id,
          type: "event_chat_message",
          title: `Nova poruka · ${event.title}`,
          message: `${senderName}: ${preview}`,
          is_read: false,
        }));

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(rows);

        if (notificationError) {
          console.error(
            "Chat obaveštenja nisu poslata:",
            notificationError
          );
        }
      }
    } catch (sendError) {
      console.error("Greška pri slanju poruke:", sendError);
      alert(sendError?.message || "Poruku trenutno nije moguće poslati.");
    } finally {
      setChatSending(false);
    }
  }, [
    chatBody,
    profile?.id,
    profile?.username,
    profile?.full_name,
    profile?.avatar_url,
    event?.id,
    event?.host_id,
    event?.title,
    canAccessGroupChat,
    participants,
  ]);

  useEffect(() => {
    if (!chatOpen || !canAccessGroupChat || !event?.id) return undefined;

    void loadChatMessages();

    const channel = supabase
      .channel(`event-chat-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_chat_messages",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const rawMessage = payload.new;

          setChatMessages((current) => {
            if (current.some((item) => item.id === rawMessage.id)) {
              return current;
            }

            return [
              ...current,
              {
                ...rawMessage,
                profiles:
                  rawMessage.user_id === profile.id
                    ? {
                        id: profile.id,
                        username: profile.username,
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url,
                      }
                    : null,
              },
            ];
          });

          if (rawMessage.user_id !== profile.id) {
            window.setTimeout(() => {
              void loadChatMessages();
            }, 150);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    chatOpen,
    canAccessGroupChat,
    event?.id,
    loadChatMessages,
    profile?.id,
    profile?.username,
    profile?.full_name,
    profile?.avatar_url,
  ]);

  useEffect(() => {
    if (!chatOpen) return;

    const timer = window.setTimeout(() => {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [chatOpen, chatMessages.length]);

  useEffect(() => {
    if (!canAccessGroupChat && chatOpen) {
      setChatOpen(false);
      setChatMessages([]);
      setChatBody("");
    }
  }, [canAccessGroupChat, chatOpen]);


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

            <h1>Avantura nije pronađena</h1>

            <p>
              {error ||
                "Ova avantura ne postoji ili više nije dostupna."}
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
                Sve avanture
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={`${event.title}${event.location ? ` – ${event.location}` : ""}`}
        description={
          event.description?.slice(0, 155) ||
          `Pridruži se avanturi ${event.title} na MeetOutdoors. Pogledaj datum, lokaciju, organizatora, cenu i detalje prijave.`
        }
        canonicalPath={`/event/${event.id}`}
        image={eventPhotos[0] || FALLBACK_COVER}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          description: event.description || undefined,
          image: eventPhotos.length ? eventPhotos : undefined,
          startDate: event.start_date || undefined,
          endDate: event.end_date || undefined,
          eventStatus: isCompleted
            ? "https://schema.org/EventCompleted"
            : event.status === "cancelled"
            ? "https://schema.org/EventCancelled"
            : "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: event.location || event.title,
            address: {
              "@type": "PostalAddress",
              addressLocality: event.location || undefined,
              addressCountry: event.country || "Serbia",
            },
          },
          organizer: host
            ? {
                "@type": "Organization",
                name: host.full_name || host.username || "MeetOutdoors host",
                url: host.username
                  ? `https://www.meetoutdoors.app/h/${host.username}`
                  : undefined,
              }
            : undefined,
          offers: {
            "@type": "Offer",
            url: `https://www.meetoutdoors.app/event/${event.id}`,
            price: Number(event.price || 0),
            priceCurrency: "EUR",
            availability: isFull
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
          },
          url: `https://www.meetoutdoors.app/event/${event.id}`,
        }}
      />

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

        {finishModalOpen && (
          <div
            className="eventFinishModalBackdrop"
            role="presentation"
            onMouseDown={(mouseEvent) => {
              if (mouseEvent.target === mouseEvent.currentTarget && !finishLoading) {
                setFinishModalOpen(false);
              }
            }}
          >
            <section
              className="eventFinishModal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="eventFinishModalTitle"
            >
              <button
                type="button"
                className="eventFinishModalClose"
                onClick={() => setFinishModalOpen(false)}
                disabled={finishLoading}
                aria-label="Zatvori"
              >
                <Icon name="x" size={18} />
              </button>

              <span className="eventFinishModalKicker">ZAVRŠETAK AVANTURE</span>
              <h2 id="eventFinishModalTitle">Sačuvaj iskustvo.</h2>
              <p className="eventFinishModalIntro">
                Avantura više neće primati nove prijave. Možeš da je ostaviš na profilu kao deo svog portfolija.
              </p>

              <div className="eventFinishChoices">
                <button
                  type="button"
                  className="eventFinishChoice primary"
                  onClick={() => void finishEvent(true)}
                  disabled={finishLoading}
                >
                  <span className="eventFinishChoiceIcon">
                    <Icon name="check" size={19} />
                  </span>
                  <span>
                    <strong>{finishLoading ? "Čuvanje..." : "Završi i prikaži na profilu"}</strong>
                    <small>Avantura ostaje vidljiva u sekciji Održane avanture.</small>
                  </span>
                  <Icon name="arrowRight" size={17} />
                </button>

                <button
                  type="button"
                  className="eventFinishChoice"
                  onClick={() => void finishEvent(false)}
                  disabled={finishLoading}
                >
                  <span className="eventFinishChoiceIcon muted">
                    <Icon name="eye" size={19} />
                  </span>
                  <span>
                    <strong>Završi bez prikaza</strong>
                    <small>Avantura se završava, ali se ne prikazuje javno na profilu.</small>
                  </span>
                  <Icon name="arrowRight" size={17} />
                </button>
              </div>
            </section>
          </div>
        )}

        {chatOpen && canAccessGroupChat && (
          <div
            className="eventChatBackdrop"
            role="presentation"
            onMouseDown={(mouseEvent) => {
              if (mouseEvent.target === mouseEvent.currentTarget) {
                setChatOpen(false);
              }
            }}
          >
            <section
              className="eventChatModal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="eventChatTitle"
            >
              <header className="eventChatHeader">
                <div>
                  <span className="eventChatKicker">GRUPNI CHAT AVANTURE</span>
                  <h2 id="eventChatTitle">{event.title}</h2>
                  <p>
                    <Icon name="users" size={14} />
                    {participantCount + 1} članova · organizator + prijavljeni
                  </p>
                </div>

                <button
                  type="button"
                  className="eventChatClose"
                  onClick={() => setChatOpen(false)}
                  aria-label="Zatvori grupni chat"
                >
                  <Icon name="x" size={19} />
                </button>
              </header>

              <div className="eventChatMemberStrip">
                <div className="eventChatMember hostMember">
                  <img
                    src={host?.avatar_url || FALLBACK_AVATAR}
                    alt={host?.full_name || host?.username || "Organizator"}
                  />
                  <span>
                    <strong>{host?.full_name || host?.username || "Organizator"}</strong>
                    <small>ORGANIZATOR</small>
                  </span>
                </div>

                {activeParticipants.slice(0, 7).map((participant) => {
                  const participantProfile = participant.profile;
                  return (
                    <div className="eventChatMember" key={participant.id}>
                      <img
                        src={participantProfile?.avatar_url || FALLBACK_AVATAR}
                        alt={
                          participantProfile?.full_name ||
                          participantProfile?.username ||
                          participant.full_name ||
                          "Učesnik"
                        }
                      />
                      <span>
                        <strong>
                          {participantProfile?.full_name ||
                            participantProfile?.username ||
                            participant.full_name ||
                            "Učesnik"}
                        </strong>
                        <small>
                          {participant.status === "confirmed"
                            ? "POTVRĐEN"
                            : "PRIJAVLJEN"}
                        </small>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="eventChatMessages">
                {chatLoading ? (
                  <div className="eventChatEmpty">
                    <span className="eventLoader" />
                    <strong>Učitavanje razgovora...</strong>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="eventChatEmpty">
                    <span className="eventChatEmptyIcon">
                      <Icon name="chatBubble" size={25} />
                    </span>
                    <strong>Još nema poruka.</strong>
                    <p>
                      {profile.id === event.host_id
                        ? "Pošalji prvu poruku ekipi — vreme okupljanja, oprema ili važne informacije."
                        : "Napiši nešto ekipi ili postavi pitanje organizatoru."}
                    </p>
                  </div>
                ) : (
                  chatMessages.map((message) => {
                    const sender = message.profiles;
                    const isOwn = message.user_id === profile.id;
                    const isHostMessage = message.user_id === event.host_id;
                    const senderName =
                      sender?.full_name ||
                      sender?.username ||
                      (isOwn
                        ? profile.full_name || profile.username
                        : "Učesnik");

                    return (
                      <article
                        key={message.id}
                        className={`eventChatMessage ${isOwn ? "own" : ""} ${
                          isHostMessage ? "hostMessage" : ""
                        }`}
                      >
                        {!isOwn && (
                          <img
                            className="eventChatMessageAvatar"
                            src={sender?.avatar_url || FALLBACK_AVATAR}
                            alt={senderName}
                          />
                        )}

                        <div className="eventChatBubble">
                          <div className="eventChatMessageMeta">
                            <strong>{isOwn ? "Ti" : senderName}</strong>
                            {isHostMessage && (
                              <span>ORGANIZATOR</span>
                            )}
                            <small>{formatChatTime(message.created_at)}</small>
                          </div>
                          <p>{message.body}</p>
                        </div>
                      </article>
                    );
                  })
                )}

                <div ref={chatEndRef} />
              </div>

              <form
                className="eventChatComposer"
                onSubmit={(submitEvent) => {
                  submitEvent.preventDefault();
                  void sendChatMessage();
                }}
              >
                <textarea
                  value={chatBody}
                  onChange={(changeEvent) => setChatBody(changeEvent.target.value)}
                  placeholder={
                    profile.id === event.host_id
                      ? "Poruka svim prijavljenim učesnicima..."
                      : "Napiši poruku grupi..."
                  }
                  rows={1}
                  maxLength={2000}
                  onKeyDown={(keyboardEvent) => {
                    if (
                      keyboardEvent.key === "Enter" &&
                      !keyboardEvent.shiftKey
                    ) {
                      keyboardEvent.preventDefault();
                      void sendChatMessage();
                    }
                  }}
                />

                <button
                  type="submit"
                  disabled={chatSending || !chatBody.trim()}
                >
                  <Icon name="arrowRight" size={18} />
                  <span>{chatSending ? "Slanje..." : "Pošalji"}</span>
                </button>
              </form>
            </section>
          </div>
        )}

        {lightboxIndex !== null && eventPhotos[lightboxIndex] && (
          <div
            className="eventLightboxBackdrop"
            role="presentation"
            onMouseDown={(mouseEvent) => {
              if (mouseEvent.target === mouseEvent.currentTarget) {
                closeLightbox();
              }
            }}
          >
            <section
              className="eventLightbox"
              role="dialog"
              aria-modal="true"
              aria-label={`Fotografija ${lightboxIndex + 1} od ${eventPhotos.length}`}
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}
            >
              <div className="eventLightboxTopbar">
                <span className="eventLightboxCounter">
                  {lightboxIndex + 1} / {eventPhotos.length}
                </span>

                <button
                  type="button"
                  className="eventLightboxClose"
                  onClick={closeLightbox}
                  aria-label="Zatvori galeriju"
                >
                  <Icon name="x" size={20} />
                </button>
              </div>

              <div className="eventLightboxStage">
                {eventPhotos.length > 1 && (
                  <button
                    type="button"
                    className="eventLightboxNav previous"
                    onClick={showPreviousPhoto}
                    aria-label="Prethodna fotografija"
                  >
                    <Icon name="arrowLeft" size={24} />
                  </button>
                )}

                <img
                  src={eventPhotos[lightboxIndex]}
                  alt={`${event.title} — fotografija ${lightboxIndex + 1}`}
                  draggable="false"
                />

                {eventPhotos.length > 1 && (
                  <button
                    type="button"
                    className="eventLightboxNav next"
                    onClick={showNextPhoto}
                    aria-label="Sledeća fotografija"
                  >
                    <Icon name="arrowRight" size={24} />
                  </button>
                )}
              </div>

              {eventPhotos.length > 1 && (
                <div className="eventLightboxThumbs" aria-label="Fotografije avanture">
                  {eventPhotos.map((url, index) => (
                    <button
                      type="button"
                      key={`${url}-${index}`}
                      className={index === lightboxIndex ? "active" : ""}
                      onClick={() => setLightboxIndex(index)}
                      aria-label={`Otvori fotografiju ${index + 1}`}
                    >
                      <img
                        src={url}
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                      />
                    </button>
                  ))}
                </div>
              )}

              <small className="eventLightboxHint">
                {eventPhotos.length > 1
                  ? "Koristi strelice, tastaturu ili prevuci prstom."
                  : "Pritisni ESC ili × za zatvaranje."}
              </small>
            </section>
          </div>
        )}

        <section
          className="eventHero"
          style={{
            backgroundImage: `linear-gradient(
              180deg,
              rgba(6, 20, 12, 0.08),
              rgba(6, 20, 12, 0.88)
            ), url(${eventPhotos[0] || FALLBACK_COVER})`,
          }}
        >
          <div className="eventHeroCopy">
            <span className="eventEyebrow">
              <span />
              {isCompleted ? "Održana MeetOutdoors avantura" : "Otvorena MeetOutdoors avantura"}
            </span>

            <h1>{event.title}</h1>

            <p className="eventHeroLocation">
              <Icon name="mapPin" size={17} />
              {location}
            </p>

            {eventActivities.length > 0 && (
              <div className="eventActivityChips">
                {eventActivities.map((activity) => (
                  <span key={activity}>
                    {ACTIVITY_LABELS[activity] || activity}
                  </span>
                ))}
              </div>
            )}

            <div className="eventHeroJoinLine">
              <span className="eventHeroLiveDot" />

              <strong>
                {confirmedCount}{" "}
                {confirmedCount === 1
                  ? "potvrđen učesnik"
                  : "potvrđenih učesnika"}
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
                {confirmedCount}
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
                {isCompleted ? "Završeno" : isFull ? "Popunjeno" : "Otvoreno"}
              </strong>
            </article>
          </div>
        </section>

        <section className="eventContent">
          <div className="eventActionBar">
            <div className="eventActionLeft">
              <span className="eventActionLabel">
                Prijava na avanturu
              </span>

              <strong>
                {isCompleted
                  ? "Avantura je završena i više ne prima nove prijave."
                  : currentRegistrationConfirmed
                  ? "Tvoje mesto je potvrđeno."
                  : currentRegistrationPending
                  ? "Prijava je poslata i čeka potvrdu domaćina."
                  : currentRegistrationRejected
                  ? "Prethodna prijava nije prihvaćena. Možeš poslati novu prijavu."
                  : isFull
                  ? "Avantura je trenutno popunjena."
                  : "Prijavi se jednim klikom i uđi u grupni chat."}
              </strong>

              <small>
                {isCompleted
                  ? `${confirmedCount} potvrđenih učesnika.`
                  : capacity > 0
                  ? `${confirmedCount} potvrđeno · ${pendingCount} čeka · ${remainingPlaces} slobodno.`
                  : `${confirmedCount} potvrđeno · ${pendingCount} čeka potvrdu.`}
              </small>
            </div>

            <div className="eventActionButtons">
              <ShareSheet
                type="event"
                title={event.title || "Outdoor avantura"}
                image={eventPhotos[0] || FALLBACK_COVER}
                location={location}
                subtitle={`${formatDate(event.start_date)} · €${event.price || 0}`}
                url={`https://www.meetoutdoors.app/event/${event.id}`}
                triggerClassName="eventShareButton"
                triggerEyebrow="PODELI"
                triggerLabel="Avantura"
              />

              {canJoin && !joined && (
                <button
                  type="button"
                  className="eventJoinButton"
                  onClick={() => void submitJoin()}
                  disabled={joinLoading || isFull}
                >
                  <Icon name="bolt" size={18} />
                  {joinLoading
                    ? "Čuvanje..."
                    : isFull
                    ? "Popunjeno"
                    : currentRegistrationRejected
                    ? "Pošalji novu prijavu"
                    : "Prijavi se"}
                </button>
              )}

              {joined && (
                <div
                  className={`eventRegistrationBadge ${
                    currentRegistrationConfirmed ? "confirmed" : "pending"
                  }`}
                  role="status"
                >
                  <Icon
                    name={currentRegistrationConfirmed ? "check" : "clock"}
                    size={17}
                  />
                  <span>
                    <small>Status prijave</small>
                    <strong>
                      {currentRegistrationConfirmed
                        ? "Mesto potvrđeno"
                        : "Čeka potvrdu"}
                    </strong>
                  </span>
                </div>
              )}

              {canAccessGroupChat && (
                <button
                  type="button"
                  className="eventChatButton"
                  onClick={openGroupChat}
                >
                  <Icon name="chatBubble" size={17} />
                  Grupni chat
                  <span>{participantCount + 1}</span>
                </button>
              )}

              {joined && !registrationsClosed && (
                <button
                  type="button"
                  className="eventLeaveButton"
                  onClick={cancelJoin}
                  disabled={joinLoading}
                >
                  <Icon name="x" size={16} />
                  Otkaži prijavu
                </button>
              )}

              {canViewAllParticipants && !registrationsClosed && (
                <button
                  type="button"
                  className="eventFinishButton"
                  onClick={() => setFinishModalOpen(true)}
                  disabled={finishLoading}
                >
                  <Icon name="check" size={17} />
                  Završi avanturu
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

          {!canViewAllParticipants &&
            (currentRegistrationConfirmed ||
              currentRegistrationPending ||
              currentRegistrationRejected) && (
              <section
                className={`eventMyRegistrationPanel ${
                  currentRegistrationConfirmed
                    ? "confirmed"
                    : currentRegistrationRejected
                    ? "rejected"
                    : "pending"
                }`}
              >
                <span className="eventMyRegistrationIcon">
                  <Icon
                    name={
                      currentRegistrationConfirmed
                        ? "check"
                        : currentRegistrationRejected
                        ? "x"
                        : "clock"
                    }
                    size={22}
                  />
                </span>

                <div>
                  <span className="eventSectionLabel">Tvoja prijava</span>
                  <strong>
                    {currentRegistrationConfirmed
                      ? "Tvoje mesto je potvrđeno."
                      : currentRegistrationRejected
                      ? "Prijava nije prihvaćena."
                      : "Čeka potvrdu domaćina."}
                  </strong>
                  <small>
                    {currentRegistrationConfirmed
                      ? "Domaćin je prihvatio tvoju prijavu. Sve detalje možete dogovoriti u grupnom chatu."
                      : currentRegistrationRejected
                      ? "Mesto nije rezervisano. Ako se okolnosti promene, možeš poslati novu prijavu."
                      : "Tvoja prijava privremeno čuva mesto dok domaćin ne odgovori."}
                  </small>
                </div>
              </section>
            )}

          <section
            className="eventParticipantsPanel"
            id="participants"
          >
            <div className="eventParticipantsHeader">
              <div>
                <span className="eventSectionLabel">
                  Prijavljeni učesnici
                </span>

                <h2>
                  Pogledaj ko se prijavio.
                </h2>

                <p>
                  Profili prijavljenih su vidljivi zajednici. Dogovor sa organizatorom i ekipom ide kroz grupni chat avanture.
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
                      ? `${confirmedCount} potvrđeno · ${pendingCount} čeka`
                      : `${confirmedCount} potvrđeno · ${pendingCount} čeka`}
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
                  <div className="eventHostRegistrationSummary">
                    <span className="confirmed">
                      <strong>{confirmedCount}</strong>
                      potvrđeno
                    </span>
                    <span className="pending">
                      <strong>{pendingCount}</strong>
                      čeka
                    </span>
                    {rejectedCount > 0 && (
                      <span className="rejected">
                        <strong>{rejectedCount}</strong>
                        odbijeno
                      </span>
                    )}
                    {capacity > 0 && (
                      <span>
                        <strong>{remainingPlaces}</strong>
                        slobodno
                      </span>
                    )}
                  </div>
                )}

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

                          <div className="eventHostParticipantIdentity">
                            <strong>
                              {item.full_name ||
                                participant?.full_name ||
                                participant?.username ||
                                "Učesnik"}
                            </strong>

                            <small>
                              {participant?.username
                                ? `@${participant.username}`
                                : "MeetOutdoors korisnik"}
                            </small>

                            <span
                              className={`eventRegistrationStatus ${
                                item.status === "confirmed"
                                  ? "confirmed"
                                  : item.status === "rejected"
                                  ? "rejected"
                                  : "pending"
                              }`}
                            >
                              {item.status === "confirmed"
                                ? "Potvrđeno"
                                : item.status === "rejected"
                                ? "Odbijeno"
                                : "Čeka potvrdu"}
                            </span>
                          </div>

                          <div className="eventHostParticipantActions">
                            {item.phone ? (
                              <a
                                href={`tel:${item.phone.replace(/\s+/g, "")}`}
                                className="eventParticipantPhone"
                              >
                                <Icon name="phone" size={15} />
                                {item.phone}
                              </a>
                            ) : (
                              <span className="eventParticipantPhone missing">
                                Bez broja telefona
                              </span>
                            )}

                            <div className="eventParticipantActionRow">
                              {participant?.username && (
                                <Link to={target}>
                                  <Icon name="eye" size={15} />
                                  Profil
                                </Link>
                              )}

                              {item.status === "pending" && (
                                <>
                                  <button
                                    type="button"
                                    className="eventConfirmParticipantButton"
                                    onClick={() => confirmParticipant(item.id)}
                                    disabled={
                                      confirmingParticipantId === item.id ||
                                      rejectingParticipantId === item.id
                                    }
                                  >
                                    <Icon name="check" size={15} />
                                    {confirmingParticipantId === item.id
                                      ? "Potvrđivanje..."
                                      : "Potvrdi"}
                                  </button>

                                  <button
                                    type="button"
                                    className="eventRejectParticipantButton"
                                    onClick={() => rejectParticipant(item.id)}
                                    disabled={
                                      confirmingParticipantId === item.id ||
                                      rejectingParticipantId === item.id
                                    }
                                  >
                                    <Icon name="x" size={15} />
                                    {rejectingParticipantId === item.id
                                      ? "Odbijanje..."
                                      : "Odbij"}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          {eventPhotos.length > 1 && (
            <section className="eventPanel eventGalleryPanel">
              <div className="eventSectionHeader eventGalleryHeader">
                <div>
                  <span>Galerija</span>
                  <h2>Fotografije avanture.</h2>
                </div>

                <div className="eventGalleryHeaderActions">
                  <small>{eventPhotos.length} fotografija</small>

                  <div className="eventGalleryArrows">
                    <button
                      type="button"
                      onClick={() => scrollGallery(-1)}
                      aria-label="Prethodne fotografije"
                    >
                      <Icon name="arrowLeft" size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollGallery(1)}
                      aria-label="Sledeće fotografije"
                    >
                      <Icon name="arrowRight" size={17} />
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="eventGalleryGrid"
                id="eventGalleryRail"
                aria-label="Galerija fotografija avanture"
              >
                {eventPhotos.map((url, index) => (
                  <button
                    type="button"
                    key={`${url}-${index}`}
                    className={`eventGalleryItem ${
                      index === 0 ? "featured" : ""
                    }`}
                    onClick={() => openLightbox(index)}
                    aria-label={`Otvori fotografiju ${index + 1} od ${eventPhotos.length}`}
                  >
                    <img
                      src={url}
                      alt={`${event.title} — fotografija ${index + 1}`}
                      draggable="false"
                    />

                    <span className="eventGalleryZoom">
                      <Icon name="eye" size={15} />
                      Otvori
                    </span>

                    {index === 0 && (
                      <span className="eventGalleryCoverBadge">
                        Naslovna
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <small className="eventGallerySwipeHint">
                Prevuci fotografije ili koristi strelice.
              </small>
            </section>
          )}

          <div className="eventMainGrid">
            <div className="eventMainColumn">
              <section className="eventPanel">
                <div className="eventSectionHeader">
                  <div>
                    <span>O avanturi</span>
                    <h2>Detalji avanture.</h2>
                  </div>
                </div>

                <p className="eventDescription">
                  {event.description ||
                    "Opis još nije dodat."}
                </p>
              </section>

              {includedItems.length > 0 && (
                <section className="eventPanel">
                  <div className="eventSectionHeader">
                    <div>
                      <span>Šta je uključeno</span>
                      <h2>U sklopu iskustva.</h2>
                    </div>
                  </div>

                  <div className="eventIncludedList">
                    {includedItems.map((item) => (
                      <article key={item}>
                        <span>✓</span>
                        <strong>{item}</strong>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className="eventPanel eventTimelinePanel">
                <div className="eventSectionHeader">
                  <div>
                    <span>Vreme avanture</span>
                    <h2>{event.start_date ? "Planiraj unapred." : "Termin po dogovoru."}</h2>
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
                    avantura i informacija.
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
                Pronađi sledeću avanturu koja odgovara
                tvom tempu.
              </h2>

              <p>
                Istraži MeetOutdoors zajednicu i pronađi
                nova okupljanja na otvorenom.
              </p>
            </div>

            <Link to="/events">
              Pregledaj avanture
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
      textarea,
      input {
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

      .eventJoinModalBackdrop {
        position: fixed;
        inset: 0;
        z-index: 6000;
        display: grid;
        place-items: center;
        padding: 22px;
        background: rgba(8, 24, 15, 0.58);
        backdrop-filter: blur(12px);
      }

      .eventJoinModal {
        position: relative;
        width: min(500px, 100%);
        padding: 30px;
        border: 1px solid rgba(215, 229, 211, 0.92);
        border-radius: 28px;
        background: #fbfdf9;
        box-shadow: 0 32px 90px rgba(8, 30, 17, 0.32);
      }

      .eventJoinModalClose {
        position: absolute;
        top: 18px;
        right: 18px;
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        padding: 0;
        border: 1px solid #dbe5d8;
        border-radius: 12px;
        background: #f4f7f1;
        color: #4d6355;
        cursor: pointer;
      }

      .eventJoinModalKicker {
        color: #6f914e;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.11em;
      }

      .eventJoinModal h2 {
        margin: 8px 48px 0 0;
        color: #203229;
        font-size: clamp(28px, 5vw, 42px);
        line-height: 0.98;
        letter-spacing: -0.045em;
      }

      .eventJoinModalIntro {
        max-width: 420px;
        margin: 14px 0 22px;
        color: #718078;
        font-size: 12px;
        line-height: 1.65;
      }

      .eventJoinField { display: block; margin-top: 14px; }
      .eventJoinField > span { display:block; margin-bottom:7px; color:#43584b; font-size:10px; font-weight:900; }
      .eventJoinField input { width:100%; min-height:52px; padding:0 15px; border:1px solid #d6e1d3; border-radius:14px; outline:none; background:white; color:#203229; font-size:13px; transition:.18s ease; }
      .eventJoinField input:focus { border-color:#7da868; box-shadow:0 0 0 4px rgba(125,168,104,.12); }
      .eventJoinSubmit { display:inline-flex; align-items:center; justify-content:center; gap:9px; width:100%; min-height:54px; margin-top:20px; padding:0 18px; border:1px solid #173b27; border-radius:15px; background:#173b27; color:white; font-size:11px; font-weight:950; cursor:pointer; box-shadow:0 14px 30px rgba(23,59,39,.18); }
      .eventJoinSubmit:disabled, .eventJoinModalClose:disabled { cursor:not-allowed; opacity:.62; }
      .eventJoinPrivacy { display:block; margin-top:12px; color:#8a958d; font-size:9px; line-height:1.55; text-align:center; }


      .eventFinishModalBackdrop {
        position: fixed;
        inset: 0;
        z-index: 6100;
        display: grid;
        place-items: center;
        padding: 22px;
        background: rgba(7, 22, 13, 0.64);
        backdrop-filter: blur(14px);
      }

      .eventFinishModal {
        position: relative;
        width: min(570px, 100%);
        padding: 32px;
        overflow: hidden;
        border: 1px solid rgba(211, 226, 207, 0.95);
        border-radius: 30px;
        background: linear-gradient(145deg, #fcfefa, #f2f7ee);
        box-shadow: 0 36px 100px rgba(6, 27, 14, 0.36);
      }

      .eventFinishModal::before {
        position: absolute;
        top: -90px;
        right: -80px;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(160, 204, 126, 0.2), transparent 68%);
        content: "";
        pointer-events: none;
      }

      .eventFinishModalClose {
        position: absolute;
        top: 18px;
        right: 18px;
        z-index: 2;
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        padding: 0;
        border: 1px solid #d7e2d4;
        border-radius: 12px;
        background: rgba(255,255,255,.76);
        color: #4d6355;
        cursor: pointer;
      }

      .eventFinishModalKicker {
        color: #6f914e;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .11em;
      }

      .eventFinishModal h2 {
        margin: 8px 48px 0 0;
        color: #203229;
        font-size: clamp(30px, 5vw, 46px);
        line-height: .96;
        letter-spacing: -.05em;
      }

      .eventFinishModalIntro {
        max-width: 460px;
        margin: 14px 0 22px;
        color: #718078;
        font-size: 11px;
        line-height: 1.65;
      }

      .eventFinishChoices { display:grid; gap:10px; }
      .eventFinishChoice { display:grid; grid-template-columns:42px minmax(0,1fr) auto; align-items:center; gap:12px; width:100%; min-height:78px; padding:12px 14px; border:1px solid #d7e1d4; border-radius:17px; background:#fff; color:#344a3b; text-align:left; cursor:pointer; transition:.2s ease; }
      .eventFinishChoice:hover:not(:disabled) { transform:translateY(-2px); border-color:#a9c49a; box-shadow:0 14px 30px rgba(31,58,39,.08); }
      .eventFinishChoice.primary { border-color:#a9c99a; background:linear-gradient(135deg,#f3faed,#fff); }
      .eventFinishChoice:disabled,.eventFinishModalClose:disabled { cursor:not-allowed; opacity:.62; }
      .eventFinishChoiceIcon { display:grid; place-items:center; width:42px; height:42px; border-radius:13px; background:#dff1d3; color:#426532; }
      .eventFinishChoiceIcon.muted { background:#eef2eb; color:#68776c; }
      .eventFinishChoice strong,.eventFinishChoice small { display:block; }
      .eventFinishChoice strong { font-size:10px; font-weight:950; }
      .eventFinishChoice small { margin-top:4px; color:#87928a; font-size:8px; line-height:1.45; }

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

      .eventActivityChips{
        display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;
      }
      .eventActivityChips span{
        padding:7px 10px;border-radius:999px;
        background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);
        color:#fff;font-size:10px;font-weight:800;backdrop-filter:blur(8px);
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

      .eventFinishButton {
        border: 1px solid #9fbf8e;
        background: #eef8e8;
        color: #456836;
        cursor: pointer;
      }

      .eventFinishButton:hover:not(:disabled) {
        transform: translateY(-2px);
        border-color: #7ea56a;
        background: #e4f3db;
      }

      .eventFinishButton:disabled { cursor:not-allowed; opacity:.62; }

      .eventHostParticipantsButton {
        border: 1px solid #d5dfd2;
        background: #f8faf6;
        color: #4f6657;
        cursor: pointer;
      }

      .eventShareButton {
        display: inline-grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        min-height: 46px;
        padding: 7px 14px;
        border: 1px solid #d5dfd2;
        border-radius: 14px;
        background: #f8faf6;
        color: #4f6657;
        cursor: pointer;
        text-align: left;
        transition: 0.2s ease;
      }

      .eventShareButton:hover {
        transform: translateY(-2px);
        border-color: #b7c8b2;
        background: #ffffff;
      }

      .eventShareButton > div {
        min-width: 0;
      }

      .eventShareButton small,
      .eventShareButton strong {
        display: block;
      }

      .eventShareButton small {
        color: #7c9664;
        font-size: 6px;
        font-weight: 900;
        letter-spacing: 0.08em;
      }

      .eventShareButton strong {
        margin-top: 2px;
        font-size: 9px;
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

      .eventIncludedList{
        display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;
      }
      .eventIncludedList article{
        display:flex;align-items:center;gap:10px;min-height:44px;
        padding:10px 12px;border-radius:13px;background:#f4f7f3;
        border:1px solid rgba(26,57,40,.09);
      }
      .eventIncludedList article span{
        display:grid;place-items:center;flex:0 0 auto;width:23px;height:23px;
        border-radius:50%;background:#244d36;color:#fff;font-size:11px;font-weight:900;
      }
      .eventIncludedList article strong{
        color:#203d2d;font-size:11px;line-height:1.35;
      }
      @media(max-width:640px){
        .eventIncludedList{grid-template-columns:1fr}
      }

      .eventHostParticipantIdentity { min-width: 0; }
      .eventRegistrationStatus { display:inline-flex; align-items:center; width:fit-content; margin-top:7px; padding:5px 8px; border-radius:999px; font-size:8px; font-weight:950; letter-spacing:.04em; text-transform:uppercase; }
      .eventRegistrationStatus.pending { background:#fff4cf; color:#8a6a13; }
      .eventRegistrationStatus.confirmed { background:#e7f6df; color:#3f6b36; }
      .eventHostParticipantActions { display:flex; align-items:flex-end; flex-direction:column; gap:8px; margin-left:auto; }
      .eventParticipantPhone { display:inline-flex; align-items:center; gap:6px; color:#315b3e; font-size:10px; font-weight:900; }
      .eventParticipantPhone.missing { color:#9aa49d; font-size:9px; }
      .eventParticipantActionRow { display:flex; align-items:center; justify-content:flex-end; flex-wrap:wrap; gap:7px; }
      .eventConfirmParticipantButton { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:34px; padding:0 10px; border:1px solid #9bcf81; border-radius:10px; background:#eaf6e3; color:#3e6633; font-size:9px; font-weight:950; cursor:pointer; }
      .eventConfirmParticipantButton:disabled { cursor:wait; opacity:.65; }

      .eventGalleryPanel{margin-bottom:18px}
      .eventGalleryGrid{
        display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;
      }
      .eventGalleryGrid a{
        position:relative;overflow:hidden;border-radius:16px;
        aspect-ratio:4/3;background:#edf1ec;display:block;
      }
      .eventGalleryGrid a.featured{grid-column:span 2;grid-row:span 2}
      .eventGalleryGrid img{
        width:100%;height:100%;object-fit:cover;display:block;
        transition:transform .25s ease;
      }
      .eventGalleryGrid a:hover img{transform:scale(1.025)}
      .eventGalleryGrid span{
        position:absolute;left:9px;top:9px;padding:6px 9px;border-radius:999px;
        background:rgba(10,30,20,.82);color:#fff;font-size:9px;font-weight:800;
      }
      @media(max-width:700px){
        .eventGalleryGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .eventGalleryGrid a.featured{grid-column:span 2;grid-row:auto;aspect-ratio:16/10}
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


      /* =========================================================
         EVENT DETAILS — ULTRA COMPACT UX
         Visual/UX only. Existing Supabase, join, comments,
         notifications, ShareSheet and routes stay unchanged.
         ========================================================= */

      .eventPage{
        padding:88px 18px 34px;
      }

      .eventHero{
        width:min(1240px,100%);
        min-height:430px;
        padding:26px;
        border-radius:28px;
      }

      .eventHeroCopy{
        max-width:780px;
        padding-top:58px;
      }

      .eventEyebrow{
        gap:7px;
        padding:7px 10px;
        font-size:7px;
      }

      .eventHeroCopy h1{
        margin-top:15px;
        font-size:clamp(44px,5.4vw,72px);
        line-height:.92;
      }

      .eventHeroLocation{
        margin-top:12px;
        font-size:10px;
      }

      .eventHeroJoinLine{
        margin-top:10px;
        gap:6px;
      }

      .eventHeroJoinLine strong{font-size:8px}
      .eventHeroJoinLine small{font-size:7px}

      .eventHeroStats{
        right:26px;
        bottom:26px;
        left:26px;
        gap:7px;
      }

      .eventHeroStats article{
        padding:10px 12px;
        border-radius:13px;
      }

      .eventHeroStats span{font-size:6px}
      .eventHeroStats strong{
        margin-top:4px;
        font-size:10px;
      }

      .eventContent{
        width:min(1180px,100%);
        margin-top:10px;
      }

      .eventActionBar{
        gap:12px;
        padding:12px 14px;
        border-radius:16px;
      }

      .eventActionLabel{font-size:7px}
      .eventActionLeft strong{
        margin-top:3px;
        font-size:10px;
      }
      .eventActionLeft small{
        margin-top:2px;
        font-size:7px;
      }

      .eventActionButtons{gap:6px}

      .eventActionButtons button,
      .eventCommentForm button{
        min-height:38px;
        padding:0 11px;
        border-radius:10px;
        font-size:8px;
      }

      .eventJoinButton{min-width:125px}

      .eventShareButton{
        min-height:38px;
        padding:5px 10px;
        border-radius:10px;
      }

      .eventParticipantsPanel{
        margin-top:9px;
        padding:14px;
        border-radius:17px;
      }

      .eventParticipantsHeader{
        align-items:center;
        gap:12px;
      }

      .eventParticipantsHeader h2,
      .eventExploreCard h2{
        margin-top:4px;
        font-size:clamp(20px,2.5vw,28px);
      }

      .eventParticipantsHeader p{
        max-width:700px;
        margin-top:5px;
        font-size:7px;
        line-height:1.4;
      }

      .eventSectionLabel{font-size:6px}

      .eventParticipantCount{
        gap:7px;
        padding:7px 9px;
        border-radius:11px;
      }

      .eventParticipantCount>span{
        width:29px;
        height:29px;
        border-radius:9px;
      }

      .eventParticipantCount strong{font-size:12px}
      .eventParticipantCount small{
        margin-top:1px;
        font-size:6px;
      }

      .eventAvatarStack{
        margin-top:10px;
      }

      .eventParticipantAvatar,
      .eventParticipantMore{
        width:40px;
        height:40px;
        margin-left:-7px;
        border-width:3px;
        border-radius:12px;
      }

      .eventParticipantMore{font-size:7px}

      .eventParticipantNames{
        gap:4px 7px;
        margin-top:7px;
        font-size:7px;
      }

      .eventParticipantNames span::after{margin-left:7px}
      .eventParticipantNames small{font-size:7px}

      .eventParticipantsEmpty{
        margin-top:9px;
        padding:10px;
        border-radius:11px;
      }

      .eventHostParticipantList{
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:5px;
        max-height:230px;
        margin-top:9px;
        overflow:auto;
      }

      .eventHostParticipantList article{
        padding:7px;
        border-radius:10px;
      }

      .eventMainGrid{
        grid-template-columns:minmax(0,1.5fr) minmax(250px,.5fr);
        gap:9px;
        margin-top:9px;
      }

      .eventMainColumn,
      .eventSidebar{
        gap:9px;
      }

      .eventPanel{
        padding:14px;
        border-radius:17px;
      }

      .eventSectionHeader{
        margin-bottom:8px;
      }

      .eventSectionHeader span,
      .eventPanelKicker{
        font-size:6px;
      }

      .eventSectionHeader h2{
        margin-top:4px;
        font-size:20px;
      }

      .eventDescription{
        font-size:9px;
        line-height:1.55;
      }

      .eventTimeline{
        gap:8px;
      }

      .eventTimeline article{
        gap:7px;
        padding:8px;
        border-radius:11px;
      }

      .eventTimelineIcon{
        width:31px;
        height:31px;
        border-radius:9px;
      }

      .eventTimeline small{font-size:6px}
      .eventTimeline strong{
        margin-top:2px;
        font-size:7.5px;
      }

      .eventHostProfile{
        gap:8px;
        margin-top:8px;
        padding:8px;
        border-radius:11px;
      }

      .eventHostProfile img{
        width:40px;
        height:40px;
        border-radius:11px;
      }

      .eventHostProfile strong{font-size:8px}
      .eventHostProfile span{font-size:6px}
      .eventHostCard>p{
        margin-top:7px;
        font-size:6.5px;
        line-height:1.4;
      }

      .eventFacts{
        gap:5px;
        margin-top:8px;
      }

      .eventFacts article{
        gap:7px;
        padding:7px;
        border-radius:10px;
      }

      .eventFacts article>svg{width:15px;height:15px}
      .eventFacts span{font-size:5.5px}
      .eventFacts strong{
        margin-top:2px;
        font-size:7px;
      }

      .eventCommentsSection{
        margin-top:9px;
      }

      .eventCommentForm{
        gap:6px;
      }

      .eventCommentForm textarea{
        min-height:64px;
        padding:9px 10px;
        border-radius:10px;
        font-size:8px;
        resize:none;
      }

      .eventCommentsList{
        max-height:330px;
        margin-top:8px;
        overflow:auto;
        padding-right:3px;
      }

      .eventComment{
        gap:8px;
        padding:8px 0;
      }

      .eventComment img{
        width:34px;
        height:34px;
        border-radius:10px;
      }

      .eventCommentTop a{font-size:7.5px}
      .eventCommentTop small{font-size:5.5px}
      .eventComment p{
        margin-top:3px;
        font-size:7.5px;
        line-height:1.45;
      }

      .eventExploreCard{
        gap:12px;
        margin-top:9px;
        padding:14px;
        border-radius:17px;
      }

      .eventExploreCard p{
        margin-top:5px;
        font-size:7px;
        line-height:1.4;
      }

      .eventExploreCard>a{
        min-height:38px;
        padding:0 11px;
        border-radius:10px;
        font-size:7.5px;
      }

      @media(max-width:960px){
        .eventPage{padding-top:82px}
        .eventHero{min-height:470px}
        .eventHeroCopy{padding-top:64px}
        .eventMainGrid{grid-template-columns:1fr}
        .eventSidebar{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
      }

      @media(max-width:700px){
        .eventPage{
          padding:70px 0 74px;
        }

        .eventHero{
          min-height:390px;
          padding:16px;
          border-radius:0 0 22px 22px;
        }

        .eventHeroCopy{
          padding-top:38px;
        }

        .eventEyebrow{
          padding:6px 8px;
          font-size:6px;
        }

        .eventHeroCopy h1{
          margin-top:10px;
          font-size:clamp(36px,11vw,52px);
          line-height:.94;
        }

        .eventHeroLocation{
          margin-top:8px;
          font-size:8px;
        }

        .eventHeroJoinLine{
          margin-top:7px;
        }

        .eventHeroStats{
          right:12px;
          bottom:12px;
          left:12px;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:5px;
        }

        .eventHeroStats article{
          padding:7px 8px;
          border-radius:10px;
        }

        .eventContent{
          padding:0 8px;
          margin-top:7px;
        }

        .eventActionBar{
          position:sticky;
          z-index:20;
          bottom:6px;
          align-items:stretch;
          flex-direction:column;
          gap:7px;
          padding:8px;
          border-radius:13px;
          background:rgba(255,255,255,.94);
          backdrop-filter:blur(15px);
        }

        .eventActionLeft small{display:none}
        .eventActionButtons{
          width:100%;
          flex-wrap:nowrap;
          gap:5px;
        }

        .eventActionButtons button,
        .eventShareButton{
          flex:1;
          min-width:0;
          min-height:36px;
        }

        .eventLeaveButton{
          flex:0 0 auto !important;
        }

        .eventParticipantsPanel{
          margin-top:7px;
          padding:10px;
          border-radius:13px;
        }

        .eventParticipantsHeader{
          align-items:flex-start;
          flex-direction:row;
          gap:7px;
        }

        .eventParticipantsHeader h2{
          font-size:18px;
        }

        .eventParticipantsHeader p{display:none}

        .eventParticipantCount{
          padding:5px 7px;
        }

        .eventAvatarStack{margin-top:7px}

        .eventParticipantAvatar,
        .eventParticipantMore{
          width:34px;
          height:34px;
          border-radius:10px;
        }

        .eventParticipantNames{
          margin-top:5px;
          font-size:6px;
        }

        .eventHostParticipantList{
          grid-template-columns:1fr;
          max-height:190px;
        }

        .eventMainGrid{
          gap:7px;
          margin-top:7px;
        }

        .eventMainColumn{gap:7px}
        .eventSidebar{
          grid-template-columns:1fr 1fr;
          gap:7px;
        }

        .eventPanel{
          padding:10px;
          border-radius:13px;
        }

        .eventSectionHeader{
          margin-bottom:6px;
        }

        .eventSectionHeader h2{
          font-size:17px;
        }

        .eventDescription{
          font-size:8px;
          line-height:1.5;
        }

        .eventTimeline{
          grid-template-columns:1fr 1fr;
          gap:5px;
        }

        .eventTimelineLine{display:none}

        .eventTimeline article{
          padding:6px;
        }

        .eventHostCard>p{display:none}
        .eventHostProfile{
          margin-top:5px;
          padding:6px;
        }

        .eventHostProfile img{
          width:34px;
          height:34px;
        }

        .eventFacts{
          margin-top:5px;
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .eventFacts article{
          padding:5px;
        }

        .eventCommentsSection{
          margin-top:7px;
        }

        .eventCommentForm textarea{
          min-height:56px;
        }

        .eventCommentsList{
          max-height:250px;
        }

        .eventExploreCard{
          align-items:center;
          flex-direction:row;
          margin-top:7px;
          padding:10px;
        }

        .eventExploreCard h2{
          font-size:17px;
        }

        .eventExploreCard p{display:none}
      }

      @media(max-width:480px){
        .eventHero{
          min-height:370px;
          padding:13px;
        }

        .eventHeroCopy{
          padding-top:32px;
        }

        .eventHeroCopy h1{
          font-size:38px;
        }

        .eventHeroStats{
          right:9px;
          bottom:9px;
          left:9px;
        }

        .eventContent{
          padding:0 6px;
        }

        .eventActionButtons{
          overflow-x:auto;
        }

        .eventActionButtons>*{
          flex:0 0 auto;
        }

        .eventJoinButton{
          min-width:120px !important;
        }

        .eventParticipantsPanel,
        .eventPanel{
          padding:9px;
        }

        .eventSidebar{
          grid-template-columns:1fr;
        }

        .eventTimeline{
          grid-template-columns:1fr 1fr;
        }

        .eventExploreCard>a{
          flex:0 0 auto;
        }
      }


      @media (max-width: 700px) {
        .eventJoinModalBackdrop { align-items:end; padding:12px; }
        .eventFinishModalBackdrop { align-items:end; padding:12px; }
        .eventFinishModal { padding:25px 16px 16px; border-radius:24px; }
        .eventFinishModal h2 { font-size:32px; }
        .eventFinishModalIntro { margin-bottom:16px; font-size:10px; }
        .eventFinishChoice { grid-template-columns:38px minmax(0,1fr) auto; min-height:72px; padding:10px; }
        .eventFinishChoiceIcon { width:38px; height:38px; }
        .eventJoinModal { padding:25px 18px 20px; border-radius:24px; }
        .eventHostParticipantList article { align-items:flex-start; flex-wrap:wrap; }
        .eventHostParticipantActions { align-items:stretch; width:100%; margin:6px 0 0 54px; }
        .eventParticipantActionRow { justify-content:flex-start; }
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

      /* =========================================================
         EVENT DETAILS V2 — PREMIUM COMPACT
         Existing Supabase/actions/modals/routes are preserved.
         ========================================================= */

      .eventPage{
        padding-top:76px;
        padding-bottom:34px;
      }

      .eventHero,
      .eventContent{
        width:min(1420px,calc(100% - 28px));
      }

      .eventHero{
        min-height:430px;
        padding:26px;
        border-radius:28px;
      }

      .eventHeroCopy{
        max-width:850px;
      }

      .eventHeroCopy h1{
        font-size:clamp(42px,5.4vw,72px);
        line-height:.94;
        letter-spacing:-.065em;
      }

      .eventHeroLocation{
        margin-top:10px;
      }

      .eventActivityChips{
        margin-top:10px;
        gap:5px;
      }

      .eventHeroJoinLine{
        margin-top:13px;
      }

      .eventHeroStats{
        right:20px;
        bottom:18px;
        left:20px;
        gap:6px;
      }

      .eventHeroStats article{
        min-height:58px;
        padding:8px 10px;
        border-radius:12px;
      }

      .eventHeroStats article span{
        font-size:6px;
      }

      .eventHeroStats article strong{
        margin-top:3px;
        font-size:14px;
      }

      .eventContent{
        padding-top:10px;
      }

      .eventActionBar{
        position:sticky;
        top:72px;
        z-index:30;
        gap:10px;
        margin-bottom:8px;
        padding:10px 12px;
        border-radius:15px;
        backdrop-filter:blur(18px);
      }

      .eventActionLeft strong{
        font-size:12px;
      }

      .eventActionLeft small{
        margin-top:2px;
        font-size:7px;
      }

      .eventActionButtons{
        gap:5px;
      }

      .eventShareButton,
      .eventJoinButton,
      .eventLeaveButton,
      .eventFinishButton,
      .eventHostParticipantsButton{
        min-height:38px;
        padding:0 11px;
        border-radius:10px;
      }

      .eventParticipantsPanel,
      .eventPanel,
      .eventExploreCard{
        margin-top:8px;
        padding:13px;
        border-radius:15px;
      }

      .eventParticipantsHeader{
        gap:10px;
      }

      .eventParticipantsHeader h2,
      .eventSectionHeader h2,
      .eventExploreCard h2{
        font-size:clamp(19px,2vw,25px);
      }

      .eventParticipantsHeader p{
        max-width:650px;
        margin-top:4px;
        font-size:7.5px;
      }

      .eventParticipantCount{
        padding:8px 10px;
        border-radius:11px;
      }

      .eventAvatarStack{
        margin-top:10px;
      }

      .eventParticipantAvatar{
        width:38px;
        height:38px;
      }

      .eventHostParticipantList{
        margin-top:10px;
        gap:6px;
      }

      .eventHostParticipantList article{
        padding:8px;
        border-radius:11px;
      }

      .eventGalleryGrid{
        display:flex;
        gap:8px;
        overflow-x:auto;
        margin-top:9px;
        padding-bottom:5px;
        scroll-snap-type:x mandatory;
        scrollbar-width:none;
        -webkit-overflow-scrolling:touch;
      }

      .eventGalleryGrid::-webkit-scrollbar{
        display:none;
      }

      .eventGalleryGrid a,
      .eventGalleryGrid a.featured{
        flex:0 0 clamp(220px,24vw,310px);
        width:auto;
        height:180px;
        grid-column:auto;
        grid-row:auto;
        border-radius:13px;
        scroll-snap-align:start;
      }

      .eventMainGrid{
        gap:8px;
        margin-top:8px;
      }

      .eventMainColumn,
      .eventSidebar{
        gap:8px;
      }

      .eventDescription{
        font-size:11px;
        line-height:1.65;
      }

      .eventIncludedList{
        gap:6px;
        margin-top:8px;
      }

      .eventIncludedList article{
        min-height:38px;
        padding:8px 10px;
        border-radius:10px;
      }

      .eventTimeline{
        gap:7px;
        margin-top:8px;
      }

      .eventTimeline article{
        padding:9px;
        border-radius:11px;
      }

      .eventHostProfile{
        margin-top:8px;
        padding:8px;
        border-radius:11px;
      }

      .eventHostProfile img{
        width:42px;
        height:42px;
      }

      .eventFacts{
        gap:5px;
        margin-top:8px;
      }

      .eventFacts article{
        padding:8px;
        border-radius:10px;
      }

      .eventCommentsSection{
        margin-top:8px;
      }

      .eventCommentForm{
        gap:7px;
        margin-top:9px;
      }

      .eventCommentForm textarea{
        min-height:76px;
        padding:10px;
        border-radius:11px;
      }

      .eventCommentsList{
        gap:6px;
        margin-top:9px;
      }

      .eventComment{
        padding:8px;
        border-radius:11px;
      }

      .eventExploreCard{
        min-height:auto;
      }

      @media(max-width:760px){
        .eventPage{
          padding-top:64px;
          padding-bottom:74px;
        }

        .eventHero,
        .eventContent{
          width:100%;
        }

        .eventHero{
          min-height:410px;
          padding:14px;
          border-radius:0 0 24px 24px;
        }

        .eventHeroCopy{
          padding-bottom:88px;
        }

        .eventHeroCopy h1{
          font-size:36px;
        }

        .eventHeroLocation{
          font-size:9px;
        }

        .eventActivityChips span:nth-child(n+4){
          display:none;
        }

        .eventHeroStats{
          right:10px;
          bottom:10px;
          left:10px;
          gap:4px;
        }

        .eventHeroStats article{
          min-height:52px;
          padding:6px;
        }

        .eventHeroStats article strong{
          font-size:11px;
        }

        .eventContent{
          padding:6px;
        }

        .eventActionBar{
          top:62px;
          gap:7px;
          padding:8px;
          border-radius:13px;
        }

        .eventActionLeft{
          min-width:0;
        }

        .eventActionLeft small{
          display:none;
        }

        .eventActionButtons{
          flex-wrap:nowrap;
          overflow-x:auto;
          scrollbar-width:none;
        }

        .eventActionButtons::-webkit-scrollbar{
          display:none;
        }

        .eventActionButtons > *{
          flex:0 0 auto;
        }

        .eventParticipantsPanel,
        .eventPanel,
        .eventExploreCard{
          padding:10px;
          border-radius:13px;
        }

        .eventParticipantsHeader h2,
        .eventSectionHeader h2,
        .eventExploreCard h2{
          font-size:18px;
        }

        .eventGalleryGrid{
          margin-right:-10px;
          padding-right:18px;
        }

        .eventGalleryGrid a,
        .eventGalleryGrid a.featured{
          flex-basis:78vw;
          max-width:310px;
          height:185px;
        }

        .eventMainGrid{
          grid-template-columns:1fr;
        }

        .eventSidebar{
          position:static;
        }

        .eventIncludedList{
          grid-template-columns:1fr;
        }

        .eventTimeline{
          grid-template-columns:1fr;
        }

        .eventTimelineLine{
          display:none;
        }
      }

      @media(max-width:420px){
        .eventHero{
          min-height:390px;
        }

        .eventHeroCopy h1{
          font-size:32px;
        }

        .eventHeroStats article span{
          font-size:5px;
        }

        .eventHeroStats article strong{
          font-size:10px;
        }

        .eventGalleryGrid a,
        .eventGalleryGrid a.featured{
          flex-basis:82vw;
        }
      }


      /* =========================================================
         EVENT DETAILS V3 — GALLERY + CONFIRMATION UX
         ========================================================= */

      .eventGalleryPanel{
        position:relative;
        overflow:hidden;
      }

      .eventGalleryHeader{
        align-items:center;
        gap:12px;
      }

      .eventGalleryHeaderActions{
        display:flex;
        align-items:center;
        gap:10px;
        flex:0 0 auto;
      }

      .eventGalleryHeaderActions>small{
        margin:0;
        white-space:nowrap;
        font-size:11px;
        color:#748077;
        font-weight:800;
      }

      .eventGalleryArrows{
        display:flex;
        align-items:center;
        gap:6px;
      }

      .eventGalleryArrows button{
        display:inline-grid;
        place-items:center;
        width:38px;
        height:38px;
        padding:0;
        border:1px solid rgba(25,54,35,.12);
        border-radius:11px;
        background:#fff;
        color:#173d27;
        cursor:pointer;
        box-shadow:0 8px 18px rgba(20,48,31,.08);
        transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
      }

      .eventGalleryArrows button:hover{
        transform:translateY(-1px);
        background:#f5faf6;
        box-shadow:0 10px 22px rgba(20,48,31,.12);
      }

      .eventGalleryGrid{
        overscroll-behavior-x:contain;
        scroll-padding-inline:2px;
      }

      .eventGalleryGrid .eventGalleryItem,
      .eventGalleryGrid .eventGalleryItem.featured{
        position:relative;
        flex:0 0 clamp(230px,24vw,320px);
        width:auto;
        height:188px;
        padding:0;
        border:0;
        border-radius:14px;
        overflow:hidden;
        background:#e9efe9;
        cursor:zoom-in;
        scroll-snap-align:start;
        box-shadow:0 8px 22px rgba(18,48,29,.08);
      }

      .eventGalleryGrid .eventGalleryItem img{
        display:block;
        width:100%;
        height:100%;
        object-fit:cover;
        transition:transform .28s ease;
      }

      .eventGalleryGrid .eventGalleryItem::after{
        content:"";
        position:absolute;
        inset:0;
        background:linear-gradient(180deg,rgba(4,18,9,0) 48%,rgba(4,18,9,.58) 100%);
        pointer-events:none;
      }

      .eventGalleryGrid .eventGalleryItem:hover img{
        transform:scale(1.025);
      }

      .eventGalleryZoom{
        position:absolute;
        right:9px;
        bottom:9px;
        z-index:2;
        display:inline-flex;
        align-items:center;
        gap:5px;
        min-height:29px;
        padding:0 9px;
        border-radius:9px;
        background:rgba(255,255,255,.92);
        color:#173d27;
        font-size:10px;
        font-weight:900;
        backdrop-filter:blur(8px);
      }

      .eventGalleryCoverBadge{
        position:absolute;
        top:9px;
        left:9px;
        z-index:2;
        display:inline-flex;
        align-items:center;
        min-height:27px;
        padding:0 8px;
        border-radius:8px;
        background:rgba(16,53,29,.86);
        color:#fff;
        font-size:9px;
        font-weight:900;
        letter-spacing:.02em;
        backdrop-filter:blur(8px);
      }

      .eventGallerySwipeHint{
        display:block;
        margin-top:6px;
        font-size:10px;
        color:#7b867f;
        font-weight:700;
      }

      .eventLightboxBackdrop{
        position:fixed;
        inset:0;
        z-index:10050;
        display:grid;
        place-items:center;
        padding:18px;
        background:rgba(5,12,8,.88);
        backdrop-filter:blur(14px);
      }

      .eventLightbox{
        position:relative;
        width:min(1180px,96vw);
        max-height:94vh;
        display:flex;
        flex-direction:column;
        gap:10px;
        padding:12px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:20px;
        background:rgba(17,25,20,.98);
        box-shadow:0 28px 80px rgba(0,0,0,.42);
        overflow:hidden;
      }

      .eventLightboxTopbar{
        display:flex;
        align-items:center;
        justify-content:space-between;
        min-height:38px;
        gap:10px;
        padding:0 2px;
      }

      .eventLightboxCounter{
        display:inline-flex;
        align-items:center;
        min-height:30px;
        padding:0 10px;
        border-radius:9px;
        background:rgba(255,255,255,.08);
        color:#fff;
        font-size:12px;
        font-weight:900;
        letter-spacing:.02em;
      }

      .eventLightboxClose{
        display:inline-grid;
        place-items:center;
        width:38px;
        height:38px;
        padding:0;
        border:1px solid rgba(255,255,255,.12);
        border-radius:10px;
        background:rgba(255,255,255,.08);
        color:#fff;
        cursor:pointer;
      }

      .eventLightboxStage{
        position:relative;
        min-height:0;
        display:grid;
        place-items:center;
        flex:1 1 auto;
        border-radius:14px;
        overflow:hidden;
        background:#08100b;
      }

      .eventLightboxStage>img{
        display:block;
        width:100%;
        height:min(68vh,760px);
        object-fit:contain;
        user-select:none;
      }

      .eventLightboxNav{
        position:absolute;
        top:50%;
        z-index:3;
        display:grid;
        place-items:center;
        width:48px;
        height:48px;
        padding:0;
        border:1px solid rgba(255,255,255,.18);
        border-radius:50%;
        background:rgba(12,24,16,.74);
        color:#fff;
        cursor:pointer;
        transform:translateY(-50%);
        backdrop-filter:blur(10px);
        box-shadow:0 10px 25px rgba(0,0,0,.22);
      }

      .eventLightboxNav.previous{left:14px}
      .eventLightboxNav.next{right:14px}

      .eventLightboxNav:hover{
        background:rgba(255,255,255,.16);
      }

      .eventLightboxThumbs{
        display:flex;
        gap:7px;
        overflow-x:auto;
        padding:1px 1px 3px;
        scrollbar-width:none;
      }

      .eventLightboxThumbs::-webkit-scrollbar{display:none}

      .eventLightboxThumbs button{
        flex:0 0 72px;
        width:72px;
        height:50px;
        padding:0;
        border:2px solid transparent;
        border-radius:9px;
        overflow:hidden;
        background:#111;
        opacity:.62;
        cursor:pointer;
      }

      .eventLightboxThumbs button.active{
        border-color:#fff;
        opacity:1;
      }

      .eventLightboxThumbs img{
        display:block;
        width:100%;
        height:100%;
        object-fit:cover;
      }

      .eventLightboxHint{
        display:block;
        text-align:center;
        color:rgba(255,255,255,.62);
        font-size:10px;
        line-height:1.35;
      }

      /* Readability pass without making the page bulky. */
      .eventActionLabel,
      .eventSectionLabel,
      .eventPanelKicker,
      .eventSectionHeader>div>span{
        font-size:10px;
      }

      .eventActionLeft strong{
        font-size:13px;
        line-height:1.35;
      }

      .eventActionLeft small,
      .eventParticipantsHeader p{
        font-size:11px;
        line-height:1.45;
      }

      .eventShareButton,
      .eventJoinButton,
      .eventLeaveButton,
      .eventFinishButton,
      .eventHostParticipantsButton,
      .eventConfirmParticipantButton{
        font-size:11px;
        white-space:nowrap;
      }

      .eventDescription{
        font-size:13px;
        line-height:1.65;
      }

      .eventHostProfile strong{
        font-size:12px;
      }

      .eventHostProfile span{
        font-size:10px;
      }

      .eventFacts article span{
        font-size:9px;
      }

      .eventFacts article strong{
        font-size:11px;
        line-height:1.35;
        overflow-wrap:anywhere;
      }

      .eventCommentTop a{
        font-size:11px;
      }

      .eventCommentTop small{
        font-size:9px;
      }

      .eventComment p{
        font-size:11px;
        line-height:1.5;
      }

      @media(max-width:760px){
        .eventGalleryHeader{
          align-items:flex-start;
        }

        .eventGalleryHeaderActions{
          gap:6px;
        }

        .eventGalleryHeaderActions>small{
          display:none;
        }

        .eventGalleryArrows button{
          width:34px;
          height:34px;
        }

        .eventGalleryGrid .eventGalleryItem,
        .eventGalleryGrid .eventGalleryItem.featured{
          flex-basis:80vw;
          max-width:320px;
          height:190px;
        }

        .eventGalleryZoom{
          font-size:10px;
        }

        .eventGallerySwipeHint{
          font-size:10px;
        }

        .eventLightboxBackdrop{
          padding:0;
          align-items:stretch;
        }

        .eventLightbox{
          width:100%;
          max-height:100dvh;
          min-height:100dvh;
          border:0;
          border-radius:0;
          padding:10px;
        }

        .eventLightboxStage>img{
          height:min(72dvh,720px);
        }

        .eventLightboxNav{
          width:42px;
          height:42px;
        }

        .eventLightboxNav.previous{left:7px}
        .eventLightboxNav.next{right:7px}

        .eventLightboxThumbs button{
          flex-basis:62px;
          width:62px;
          height:44px;
        }

        .eventActionLeft strong{
          font-size:12px;
        }

        .eventParticipantsHeader p{
          display:none;
        }

        .eventDescription{
          font-size:12px;
        }

        .eventCommentForm textarea{
          font-size:12px;
        }

        .eventCommentTop a,
        .eventComment p{
          font-size:11px;
        }
      }

      @media(max-width:420px){
        .eventGalleryGrid .eventGalleryItem,
        .eventGalleryGrid .eventGalleryItem.featured{
          flex-basis:84vw;
        }

        .eventGalleryArrows{
          gap:4px;
        }

        .eventGalleryArrows button{
          width:32px;
          height:32px;
        }

        .eventLightbox{
          padding:8px;
        }

        .eventLightboxStage>img{
          height:70dvh;
        }
      }


      /* =========================================================
         EVENT DETAILS V4 — FINAL BOOKING FLOW
         ========================================================= */

      .eventRegistrationBadge{
        display:inline-flex;
        align-items:center;
        gap:9px;
        min-height:42px;
        padding:6px 11px;
        border:1px solid rgba(25,54,35,.12);
        border-radius:12px;
        background:#f5f8f5;
        color:#244332;
        flex:0 0 auto;
      }

      .eventRegistrationBadge.confirmed{
        border-color:rgba(34,122,67,.22);
        background:#edf8f0;
        color:#176332;
      }

      .eventRegistrationBadge.pending{
        border-color:rgba(171,117,22,.22);
        background:#fff8e9;
        color:#7c5714;
      }

      .eventRegistrationBadge>span{
        display:flex;
        flex-direction:column;
        gap:1px;
        min-width:0;
      }

      .eventRegistrationBadge small{
        font-size:8px;
        line-height:1.1;
        font-weight:900;
        letter-spacing:.06em;
        text-transform:uppercase;
        opacity:.66;
      }

      .eventRegistrationBadge strong{
        font-size:11px;
        line-height:1.2;
        white-space:nowrap;
      }

      .eventMyRegistrationPanel{
        display:grid;
        grid-template-columns:44px minmax(0,1fr);
        align-items:center;
        gap:12px;
        margin-bottom:10px;
        padding:13px 15px;
        border:1px solid rgba(25,54,35,.12);
        border-radius:15px;
        background:#f7f9f7;
        box-shadow:0 8px 22px rgba(20,48,31,.05);
      }

      .eventMyRegistrationPanel.confirmed{
        border-color:rgba(34,122,67,.2);
        background:linear-gradient(135deg,#f1faf3,#f8fbf8);
      }

      .eventMyRegistrationPanel.pending{
        border-color:rgba(171,117,22,.2);
        background:linear-gradient(135deg,#fff9ec,#fffdf8);
      }

      .eventMyRegistrationPanel.rejected{
        border-color:rgba(170,57,57,.18);
        background:linear-gradient(135deg,#fff4f3,#fffafa);
      }

      .eventMyRegistrationIcon{
        display:grid;
        place-items:center;
        width:42px;
        height:42px;
        border-radius:12px;
        background:#fff;
        box-shadow:0 6px 16px rgba(20,48,31,.08);
      }

      .eventMyRegistrationPanel.confirmed .eventMyRegistrationIcon{color:#1f7b3d}
      .eventMyRegistrationPanel.pending .eventMyRegistrationIcon{color:#9a6814}
      .eventMyRegistrationPanel.rejected .eventMyRegistrationIcon{color:#a43d3d}

      .eventMyRegistrationPanel>div{
        display:flex;
        flex-direction:column;
        gap:3px;
        min-width:0;
      }

      .eventMyRegistrationPanel strong{
        font-size:13px;
        line-height:1.3;
        color:#173d27;
      }

      .eventMyRegistrationPanel small{
        font-size:10px;
        line-height:1.45;
        color:#66736a;
      }

      .eventHostRegistrationSummary{
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        margin:9px 0 10px;
      }

      .eventHostRegistrationSummary>span{
        display:inline-flex;
        align-items:center;
        gap:5px;
        min-height:30px;
        padding:0 9px;
        border:1px solid rgba(25,54,35,.1);
        border-radius:9px;
        background:#f6f8f6;
        color:#617066;
        font-size:9px;
        font-weight:850;
        white-space:nowrap;
      }

      .eventHostRegistrationSummary>span strong{
        color:#173d27;
        font-size:11px;
      }

      .eventHostRegistrationSummary>span.confirmed{
        background:#eef8f0;
        color:#34724a;
      }

      .eventHostRegistrationSummary>span.pending{
        background:#fff8e9;
        color:#85611c;
      }

      .eventHostRegistrationSummary>span.rejected{
        background:#fff2f1;
        color:#98443f;
      }

      .eventRegistrationStatus.rejected{
        background:#fff0ef;
        color:#a33f39;
        border-color:rgba(163,63,57,.16);
      }

      .eventRejectParticipantButton{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:5px;
        min-height:31px;
        padding:0 9px;
        border:1px solid rgba(166,55,49,.16);
        border-radius:9px;
        background:#fff4f3;
        color:#a13e38;
        font:inherit;
        font-size:9px;
        font-weight:900;
        cursor:pointer;
        white-space:nowrap;
        transition:transform .16s ease, background .16s ease;
      }

      .eventRejectParticipantButton:hover:not(:disabled){
        transform:translateY(-1px);
        background:#ffeceb;
      }

      .eventRejectParticipantButton:disabled{
        opacity:.55;
        cursor:not-allowed;
      }

      .eventParticipantActionRow{
        flex-wrap:wrap;
      }

      .eventHostParticipantList article{
        align-items:center;
      }

      @media(max-width:760px){
        .eventRegistrationBadge{
          min-height:39px;
          padding:5px 9px;
        }

        .eventRegistrationBadge strong{
          font-size:10px;
        }

        .eventMyRegistrationPanel{
          grid-template-columns:39px minmax(0,1fr);
          padding:11px 12px;
          gap:10px;
        }

        .eventMyRegistrationIcon{
          width:38px;
          height:38px;
          border-radius:10px;
        }

        .eventMyRegistrationPanel strong{
          font-size:12px;
        }

        .eventMyRegistrationPanel small{
          font-size:9px;
        }

        .eventHostRegistrationSummary{
          overflow-x:auto;
          flex-wrap:nowrap;
          scrollbar-width:none;
          padding-bottom:2px;
        }

        .eventHostRegistrationSummary::-webkit-scrollbar{
          display:none;
        }

        .eventHostRegistrationSummary>span{
          flex:0 0 auto;
        }

        .eventParticipantActionRow{
          gap:5px;
        }

        .eventConfirmParticipantButton,
        .eventRejectParticipantButton{
          min-height:30px;
          font-size:9px;
        }
      }

      @media(max-width:420px){
        .eventActionButtons{
          align-items:stretch;
        }

        .eventRegistrationBadge{
          width:100%;
          justify-content:flex-start;
        }

        .eventLeaveButton{
          width:100%;
        }

        .eventHostParticipantActions{
          width:100%;
        }

        .eventParticipantActionRow{
          width:100%;
        }
      }


      /* =========================================================
         EVENT GROUP CHAT — V1
         Access = host OR active event_interested registration.
         ========================================================= */

      .eventChatButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 14px;
        border: 1px solid rgba(57, 104, 70, .22);
        border-radius: 14px;
        background: linear-gradient(135deg, #eef6e8, #f8fbf5);
        color: #29553a;
        cursor: pointer;
        font-size: 12px;
        font-weight: 900;
        box-shadow: 0 8px 22px rgba(38, 76, 49, .06);
      }

      .eventChatButton > span {
        display: grid;
        place-items: center;
        min-width: 23px;
        height: 23px;
        padding: 0 6px;
        border-radius: 999px;
        background: #1f5034;
        color: #fff;
        font-size: 9px;
      }

      .eventChatBackdrop {
        position: fixed;
        z-index: 2400;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(8, 21, 13, .66);
        backdrop-filter: blur(10px);
      }

      .eventChatModal {
        width: min(860px, 100%);
        height: min(760px, calc(100svh - 48px));
        min-height: 500px;
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.42);
        border-radius: 26px;
        background: #f7f9f5;
        box-shadow: 0 34px 110px rgba(4, 17, 9, .34);
      }

      .eventChatHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        padding: 18px 20px 15px;
        color: #fff;
        background:
          radial-gradient(circle at 88% 0%, rgba(206, 240, 164, .16), transparent 30%),
          linear-gradient(135deg, #0c291b 0%, #16442d 55%, #2c6243 100%);
      }

      .eventChatKicker {
        color: #c9ee9e;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .12em;
      }

      .eventChatHeader h2 {
        margin: 6px 0 0;
        max-width: 680px;
        font-size: clamp(22px, 3vw, 34px);
        line-height: 1;
        letter-spacing: -.04em;
      }

      .eventChatHeader p {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 8px 0 0;
        color: rgba(255,255,255,.62);
        font-size: 10px;
      }

      .eventChatClose {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 12px;
        background: rgba(255,255,255,.08);
        color: #fff;
        cursor: pointer;
      }

      .eventChatMemberStrip {
        display: flex;
        gap: 8px;
        padding: 9px 12px;
        overflow-x: auto;
        border-bottom: 1px solid #dde6da;
        background: rgba(255,255,255,.88);
        scrollbar-width: none;
      }

      .eventChatMemberStrip::-webkit-scrollbar {
        display: none;
      }

      .eventChatMember {
        display: flex;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        min-width: 138px;
        padding: 7px 9px;
        border: 1px solid #e0e6dd;
        border-radius: 13px;
        background: #f7f9f5;
      }

      .eventChatMember.hostMember {
        border-color: #bfd1af;
        background: #edf5e7;
      }

      .eventChatMember img {
        width: 31px;
        height: 31px;
        flex: 0 0 auto;
        object-fit: cover;
        border-radius: 50%;
      }

      .eventChatMember span {
        min-width: 0;
      }

      .eventChatMember strong,
      .eventChatMember small {
        display: block;
      }

      .eventChatMember strong {
        max-width: 105px;
        overflow: hidden;
        color: #34483b;
        font-size: 9px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .eventChatMember small {
        margin-top: 3px;
        color: #819087;
        font-size: 6px;
        font-weight: 900;
        letter-spacing: .06em;
      }

      .eventChatMember.hostMember small {
        color: #5b7b42;
      }

      .eventChatMessages {
        min-height: 0;
        overflow-y: auto;
        padding: 18px;
        background:
          radial-gradient(circle at 10% 0%, rgba(174,210,139,.08), transparent 26%),
          #f3f6f1;
      }

      .eventChatMessage {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        margin: 0 0 11px;
      }

      .eventChatMessage.own {
        justify-content: flex-end;
      }

      .eventChatMessageAvatar {
        width: 31px;
        height: 31px;
        flex: 0 0 auto;
        object-fit: cover;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #fff;
      }

      .eventChatBubble {
        width: fit-content;
        max-width: min(72%, 570px);
        padding: 10px 12px;
        border: 1px solid #dce4d8;
        border-radius: 16px 16px 16px 5px;
        background: #fff;
        box-shadow: 0 6px 18px rgba(34,57,41,.045);
      }

      .eventChatMessage.own .eventChatBubble {
        border-color: #275b3c;
        border-radius: 16px 16px 5px 16px;
        background: linear-gradient(135deg, #123d28, #286044);
        color: #fff;
      }

      .eventChatMessage.hostMessage:not(.own) .eventChatBubble {
        border-color: #b9d0a6;
        background: #f1f7ea;
      }

      .eventChatMessageMeta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 4px;
      }

      .eventChatMessageMeta strong {
        color: #46604f;
        font-size: 9px;
      }

      .eventChatMessage.own .eventChatMessageMeta strong {
        color: #d9efcc;
      }

      .eventChatMessageMeta span {
        padding: 3px 5px;
        border-radius: 999px;
        background: #1c4c31;
        color: #dff3bd;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: .06em;
      }

      .eventChatMessage.own .eventChatMessageMeta span {
        background: rgba(255,255,255,.12);
        color: #e7f7d5;
      }

      .eventChatMessageMeta small {
        margin-left: auto;
        color: #97a19b;
        font-size: 7px;
      }

      .eventChatMessage.own .eventChatMessageMeta small {
        color: rgba(255,255,255,.55);
      }

      .eventChatBubble p {
        margin: 0;
        color: #4c5d52;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .eventChatMessage.own .eventChatBubble p {
        color: #fff;
      }

      .eventChatEmpty {
        min-height: 100%;
        display: grid;
        place-items: center;
        align-content: center;
        padding: 28px;
        color: #506258;
        text-align: center;
      }

      .eventChatEmptyIcon {
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        margin-bottom: 11px;
        border-radius: 18px;
        background: #e5efdd;
        color: #55783f;
      }

      .eventChatEmpty strong {
        font-size: 16px;
      }

      .eventChatEmpty p {
        max-width: 430px;
        margin: 6px auto 0;
        color: #859087;
        font-size: 10px;
        line-height: 1.55;
      }

      .eventChatComposer {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        padding: 11px 12px;
        border-top: 1px solid #dbe4d8;
        background: rgba(255,255,255,.96);
      }

      .eventChatComposer textarea {
        width: 100%;
        min-height: 43px;
        max-height: 120px;
        resize: none;
        padding: 12px 13px;
        border: 1px solid #d7e0d4;
        border-radius: 13px;
        outline: none;
        background: #f8faf7;
        color: #304238;
        font: inherit;
        font-size: 12px;
        line-height: 1.45;
      }

      .eventChatComposer textarea:focus {
        border-color: #8eae78;
        box-shadow: 0 0 0 3px rgba(114,155,84,.10);
      }

      .eventChatComposer button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-width: 104px;
        border: 0;
        border-radius: 13px;
        background: linear-gradient(135deg, #153d28, #2c6546);
        color: #fff;
        cursor: pointer;
        font-size: 10px;
        font-weight: 900;
      }

      .eventChatComposer button:disabled {
        cursor: default;
        opacity: .45;
      }

      @media (max-width: 700px) {
        .eventChatBackdrop {
          padding: 0;
          place-items: stretch;
        }

        .eventChatModal {
          width: 100%;
          height: 100svh;
          min-height: 100svh;
          border: 0;
          border-radius: 0;
        }

        .eventChatHeader {
          padding: 15px 14px 13px;
        }

        .eventChatHeader h2 {
          font-size: 22px;
        }

        .eventChatMessages {
          padding: 14px 10px;
        }

        .eventChatBubble {
          max-width: 84%;
        }

        .eventChatComposer {
          padding:
            9px 9px
            calc(9px + env(safe-area-inset-bottom));
        }

        .eventChatComposer button {
          min-width: 48px;
          width: 48px;
        }

        .eventChatComposer button span {
          display: none;
        }

        .eventChatButton {
          min-height: 42px;
        }
      }


      /* EventDetails V7 fixes */
      .eventChatBackdrop {
        z-index: 5000 !important;
      }

      .eventChatModal {
        z-index: 5001 !important;
      }

      @media (max-width: 700px) {
        .eventChatBackdrop {
          position: fixed !important;
          inset: 0 !important;
          z-index: 5000 !important;
          width: 100vw !important;
          height: 100dvh !important;
          min-height: 100dvh !important;
          padding: 0 !important;
          background: #f7f9f5 !important;
          backdrop-filter: none !important;
        }

        .eventChatModal {
          position: fixed !important;
          inset: 0 !important;
          z-index: 5001 !important;
          width: 100vw !important;
          max-width: none !important;
          height: 100dvh !important;
          min-height: 100dvh !important;
          max-height: 100dvh !important;
          margin: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
        }
      }

      .eventGalleryCoverBadge img {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        filter: none !important;
      }

      .eventGalleryGrid img {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        filter: none !important;
      }

      .eventGalleryZoom img {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        filter: none !important;
      }

    `}</style>
  );
}
