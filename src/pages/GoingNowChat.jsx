import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=12";
const QUICK_MESSAGES = [
  "I’m coming 👋",
  "5 min away ⏱️",
  "Where exactly? 📍",
  "Running a bit late 🙏",
];
const CHAT_BUCKET = "going-now-media";

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDisplayName(profile, userId) {
  const fullName = profile?.full_name?.trim?.() || "";
  const firstName = profile?.first_name?.trim?.() || "";
  const lastName = profile?.last_name?.trim?.() || "";
  const username = profile?.username?.trim?.() || profile?.user_name?.trim?.() || "";

  if (fullName) return fullName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (username) return username;

  return `Explorer ${String(userId || "").slice(0, 6)}`;
}

function getAvatar(profile) {
  return (
    profile?.avatar_url ||
    profile?.avatar ||
    profile?.profile_image ||
    profile?.image ||
    FALLBACK_AVATAR
  );
}

function normalizeProfile(profile) {
  if (!profile) return null;

  return {
    ...profile,
    id: profile.id || profile.user_id || profile.profile_id || null,
    user_id: profile.user_id || profile.id || profile.profile_id || null,
    full_name:
      profile.full_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.name ||
      "",
    username: profile.username || profile.user_name || "",
    avatar_url:
      profile.avatar_url ||
      profile.avatar ||
      profile.profile_image ||
      profile.image ||
      "",
  };
}

function getLat(item) {
  const value =
    item?.latitude ??
    item?.lat ??
    item?.location_lat ??
    item?.meeting_lat ??
    null;
  return value === null || value === undefined || value === "" ? null : Number(value);
}

function getLng(item) {
  const value =
    item?.longitude ??
    item?.lng ??
    item?.lon ??
    item?.location_lng ??
    item?.meeting_lng ??
    null;
  return value === null || value === undefined || value === "" ? null : Number(value);
}

function inferMediaType(file, fallback = null) {
  const type = file?.type || fallback || "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type === "image") return "image";
  if (type === "video") return "video";
  return null;
}

export default function GoingNowChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [item, setItem] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState(null);

  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const loadUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    setUser(authUser || null);
    return authUser || null;
  }, []);

  const loadItem = useCallback(async () => {
    const { data, error } = await supabase
      .from("going_now_overview")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("load item error:", error);
      setErrorMsg(error.message || "Could not load chat item.");
      return null;
    }

    setItem(data || null);
    return data || null;
  }, [id]);

  const loadParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from("going_now_participants")
      .select("*")
      .eq("going_now_id", id)
      .eq("status", "joined");

    if (error) {
      console.error("load participants error:", error);
      setErrorMsg(error.message || "Could not load participants.");
      return [];
    }

    setParticipants(data || []);
    return data || [];
  }, [id]);

  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("going_now_messages")
      .select("*")
      .eq("going_now_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("load messages error:", error);
      setErrorMsg(error.message || "Could not load messages.");
      return [];
    }

    setMessages(data || []);
    return data || [];
  }, [id]);

  const loadProfiles = useCallback(
    async (participantRows, messageRows, ownerId) => {
      const ids = Array.from(
        new Set([
          ownerId,
          ...(participantRows || []).map((p) => p.user_id),
          ...(messageRows || []).map((m) => m.user_id),
          user?.id,
        ].filter(Boolean))
      );

      if (!ids.length) {
        setProfilesMap({});
        return {};
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);

      if (error) {
        console.error("load profiles error:", error);
        return {};
      }

      const nextMap = {};
      (data || []).forEach((raw) => {
        const profile = normalizeProfile(raw);
        if (!profile) return;

        if (profile.id) nextMap[profile.id] = profile;
        if (profile.user_id) nextMap[profile.user_id] = profile;
        if (raw?.profile_id) nextMap[raw.profile_id] = profile;
      });
      setProfilesMap(nextMap);
      return nextMap;
    },
    [user?.id]
  );

  const scrollToBottom = useCallback((smooth = true) => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      setAccessDenied(false);
      setErrorMsg("");

      const authUser = await loadUser();

      if (!authUser) {
        if (!mounted) return;
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const itemData = await loadItem();
      const participantRows = await loadParticipants();

      if (!itemData) {
        if (!mounted) return;
        setLoading(false);
        return;
      }

      const owner = authUser.id === itemData.user_id;
      const joined = participantRows.some((p) => p.user_id === authUser.id);

      if (!owner && !joined) {
        if (!mounted) return;
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const messageRows = await loadMessages();
      await loadProfiles(participantRows, messageRows, itemData.user_id);

      if (!mounted) return;
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 20);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [loadItem, loadMessages, loadParticipants, loadProfiles, loadUser, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const channelMessages = supabase
      .channel(`going-now-chat-messages-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_messages",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          const rows = await loadMessages();
          await loadProfiles(participants, rows, item?.user_id);
        }
      )
      .subscribe();

    const channelParticipants = supabase
      .channel(`going-now-chat-participants-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_participants",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          const authUser = await loadUser();
          const itemData = await loadItem();
          const participantRows = await loadParticipants();
          const rows = await loadMessages();

          if (!authUser || !itemData) return;

          const owner = authUser.id === itemData.user_id;
          const joined = participantRows.some((p) => p.user_id === authUser.id);

          setAccessDenied(!owner && !joined);
          await loadProfiles(participantRows, rows, itemData.user_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelMessages);
      supabase.removeChannel(channelParticipants);
    };
  }, [
    id,
    item?.user_id,
    loadItem,
    loadMessages,
    loadParticipants,
    loadProfiles,
    loadUser,
    participants,
  ]);

  useEffect(() => {
    return () => {
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    };
  }, [selectedPreview]);

  const canSend = useMemo(() => {
    return !!user && (!!text.trim() || !!selectedFile) && !sending && !accessDenied;
  }, [user, text, selectedFile, sending, accessDenied]);

  const handleFilePick = (file) => {
    if (!file) return;
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    setSelectedFile(file);
    setSelectedMediaType(inferMediaType(file));
    setSelectedPreview(URL.createObjectURL(file));
  };

  const resetSelectedMedia = () => {
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    setSelectedFile(null);
    setSelectedPreview("");
    setSelectedMediaType(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const uploadSelectedFile = async () => {
    if (!selectedFile) return { mediaUrl: null, mediaType: null };

    const ext = selectedFile.name?.split(".").pop() || "bin";
    const path = `${id}/${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(path, selectedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: selectedFile.type || undefined,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(path);

    return {
      mediaUrl: data?.publicUrl || null,
      mediaType: inferMediaType(selectedFile),
    };
  };

  const sendMessage = async (forcedText = null) => {
    const nextText = typeof forcedText === "string" ? forcedText : text.trim();
    if (!user || (!nextText && !selectedFile) || sending || accessDenied) return;

    try {
      setSending(true);
      setErrorMsg("");

      const { mediaUrl, mediaType } = await uploadSelectedFile();

      const payload = {
        going_now_id: id,
        user_id: user.id,
        text: nextText || null,
        media_url: mediaUrl,
        media_type: mediaType,
      };

      const { error } = await supabase.from("going_now_messages").insert(payload);

      if (error) {
        console.error("send message error:", error);
        setErrorMsg(error.message || "Could not send message.");
        return;
      }

      setText("");
      resetSelectedMedia();
      const rows = await loadMessages();
      await loadProfiles(participants, rows, item?.user_id);
      if (textareaRef.current) textareaRef.current.style.height = "52px";
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickMessage = (value) => {
    setText(value);
    sendMessage(value);
  };

  const ownerProfile = profilesMap[item?.user_id] || null;
  const participantCount = participants.length;
  const lat = getLat(item);
  const lng = getLng(item);
  const directionsUrl =
    lat !== null && lng !== null
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : item?.location_text
      ? `https://www.google.com/maps/search/${encodeURIComponent(item.location_text)}`
      : null;

  const participantHeader = participants.slice(0, 6);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.centerBox}>Loading chat...</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.lockedCard}>
            <div style={styles.lockedBadge}>🔒 Chat locked</div>
            <h2 style={styles.lockedTitle}>Join this live plan to enter chat</h2>
            <p style={styles.lockedText}>
              The host and joined participants can use the live chat for updates,
              meeting point coordination, and quick check-ins.
            </p>
            <div style={styles.lockedActions}>
              <button onClick={() => navigate(`/going-now/${id}`)} style={styles.primaryBtn}>
                Back to live plan
              </button>
              <button onClick={() => navigate(-1)} style={styles.secondaryBtn}>
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowOne} />
      <div style={styles.bgGlowTwo} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <button onClick={() => navigate(`/going-now/${id}`)} style={styles.backBtn}>
            ← Back
          </button>
          <div style={styles.topActions}>
            {directionsUrl ? (
              <a href={directionsUrl} target="_blank" rel="noreferrer" style={styles.ghostLink}>
                Open map
              </a>
            ) : null}
            <button onClick={() => navigate(`/going-now/${id}`)} style={styles.ghostBtn}>
              Open details
            </button>
          </div>
        </div>

        <div style={styles.chatShell}>
          <div style={styles.headerCard}>
            <div style={styles.headerTop}>
              <div>
                <div style={styles.liveBadge}>⚡ Live chat</div>
                <h1 style={styles.title}>{item?.title || "Going Now Chat"}</h1>
                <div style={styles.headerMeta}>
                  <span>📍 {item?.location_text || "Live location"}</span>
                  <span>👥 {participantCount} inside</span>
                  {item?.status ? <span>• {item.status}</span> : null}
                </div>
              </div>

              <div style={styles.headerRight}>
                <div style={styles.avatarStack}>
                  {participantHeader.map((participant, index) => {
                    const profile = profilesMap[participant.user_id];
                    return (
                      <img
                        key={participant.id || participant.user_id}
                        src={getAvatar(profile)}
                        alt={getDisplayName(profile, participant.user_id)}
                        title={getDisplayName(profile, participant.user_id)}
                        style={{
                          ...styles.stackAvatar,
                          marginLeft: index === 0 ? 0 : -10,
                          zIndex: participantHeader.length - index,
                        }}
                      />
                    );
                  })}
                </div>
                <div style={styles.onlineText}>Live participants</div>
              </div>
            </div>

            <div style={styles.hostRow}>
              <img
                src={getAvatar(ownerProfile)}
                alt={getDisplayName(ownerProfile, item?.user_id)}
                style={styles.hostAvatar}
              />
              <div>
                <div style={styles.hostNameRow}>
                  <span style={styles.hostName}>{getDisplayName(ownerProfile, item?.user_id)}</span>
                  <span style={styles.hostBadge}>HOST</span>
                </div>
                <div style={styles.hostSub}>Use the chat for updates, meetup timing, and location details.</div>
              </div>
            </div>

            <div style={styles.quickWrap}>
              {QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => handleQuickMessage(msg)}
                  style={styles.quickBtn}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {errorMsg ? <div style={styles.errorBox}>{errorMsg}</div> : null}

          <div ref={listRef} style={styles.messagesCard}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>💬</div>
                <div style={styles.emptyTitle}>No messages yet</div>
                <div style={styles.emptyText}>Start the conversation and coordinate the meetup.</div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.user_id === user?.id;
                const profile = profilesMap[msg.user_id] || null;
                const isHost = msg.user_id === item?.user_id;
                const displayName = getDisplayName(profile, msg.user_id);
                const mediaType = inferMediaType(null, msg.media_type);

                return (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.messageRow,
                      justifyContent: isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isMine ? (
                      <img src={getAvatar(profile)} alt={displayName} style={styles.messageAvatar} />
                    ) : null}

                    <div
                      style={{
                        ...styles.messageBubble,
                        ...(isMine ? styles.myBubble : styles.theirBubble),
                      }}
                    >
                      <div style={styles.messageHead}>
                        <div style={styles.messageNameWrap}>
                          <span style={styles.messageName}>{isMine ? "You" : displayName}</span>
                          {isHost ? <span style={styles.messageHostBadge}>HOST</span> : null}
                        </div>
                        <span style={styles.messageTime}>{formatTime(msg.created_at)}</span>
                      </div>

                      {msg.text ? <div style={styles.messageText}>{msg.text}</div> : null}

                      {msg.media_url && mediaType === "image" ? (
                        <img src={msg.media_url} alt="chat upload" style={styles.messageImage} />
                      ) : null}

                      {msg.media_url && mediaType === "video" ? (
                        <video src={msg.media_url} controls playsInline style={styles.messageVideo} />
                      ) : null}
                    </div>

                    {isMine ? (
                      <img src={getAvatar(profile)} alt={displayName} style={styles.messageAvatar} />
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {selectedPreview ? (
            <div style={styles.previewCard}>
              <div style={styles.previewHead}>
                <div style={styles.previewTitle}>Ready to send</div>
                <button type="button" onClick={resetSelectedMedia} style={styles.removeMediaBtn}>
                  Remove
                </button>
              </div>

              {selectedMediaType === "image" ? (
                <img src={selectedPreview} alt="Selected preview" style={styles.selectedImage} />
              ) : selectedMediaType === "video" ? (
                <video src={selectedPreview} controls playsInline style={styles.selectedVideo} />
              ) : null}
            </div>
          ) : null}

          <div style={styles.composerCard}>
            <div style={styles.mediaButtonsRow}>
              <button type="button" onClick={() => galleryInputRef.current?.click()} style={styles.mediaBtn}>
                🖼️ Gallery
              </button>
              <button type="button" onClick={() => cameraInputRef.current?.click()} style={styles.mediaBtn}>
                📷 Camera
              </button>
              <div style={styles.mediaHint}>Send text, photo, or video straight from your phone.</div>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => handleFilePick(e.target.files?.[0])}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleFilePick(e.target.files?.[0])}
            />

            <div style={styles.composerRow}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Type a message..."
                rows={1}
                style={styles.textarea}
                onInput={(e) => {
                  e.target.style.height = "52px";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                }}
              />

              <button onClick={() => sendMessage()} disabled={!canSend} style={styles.sendBtn(canSend)}>
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top left, rgba(18,54,45,0.95), rgba(5,10,13,1) 34%), linear-gradient(180deg, #071015 0%, #08161c 100%)",
    padding: "12px 12px 120px",
  },
  bgGlowOne: {
    position: "fixed",
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(52,211,153,0.10)",
    filter: "blur(80px)",
    pointerEvents: "none",
  },
  bgGlowTwo: {
    position: "fixed",
    bottom: -120,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "rgba(96,165,250,0.10)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: 1080,
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },
  centerBox: {
    maxWidth: 760,
    margin: "60px auto",
    borderRadius: 26,
    padding: 24,
    color: "#fff",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(16px)",
    textAlign: "center",
    fontWeight: 800,
  },
  lockedCard: {
    maxWidth: 760,
    margin: "80px auto",
    borderRadius: 30,
    padding: 24,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(16px)",
    color: "#effffb",
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
  },
  lockedBadge: {
    display: "inline-flex",
    padding: "9px 13px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 900,
    marginBottom: 12,
  },
  lockedTitle: { margin: "0 0 10px", fontSize: 28, fontWeight: 950 },
  lockedText: { margin: 0, opacity: 0.86, lineHeight: 1.7 },
  lockedActions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  backBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#f5fffd",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  topActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  ghostBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#f5fffd",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  ghostLink: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#f5fffd",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    textDecoration: "none",
  },
  primaryBtn: {
    border: "none",
    borderRadius: 18,
    padding: "14px 16px",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
    color: "#07252d",
    background:
      "linear-gradient(135deg, rgba(167,243,208,1), rgba(103,232,249,1), rgba(96,165,250,1))",
  },
  secondaryBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: "14px 16px",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
    color: "#effffb",
    background: "rgba(255,255,255,0.06)",
  },
  chatShell: {
    display: "grid",
    gap: 14,
  },
  headerCard: {
    borderRadius: 28,
    padding: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "9px 13px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    background:
      "linear-gradient(135deg, rgba(167,243,208,1), rgba(103,232,249,1), rgba(96,165,250,1))",
    color: "#05232b",
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: "clamp(28px, 5vw, 42px)",
    lineHeight: 1,
    letterSpacing: "-0.05em",
    fontWeight: 950,
    margin: "0 0 8px",
  },
  headerMeta: {
    color: "rgba(234,250,245,0.88)",
    fontSize: 14,
    fontWeight: 700,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  headerRight: { textAlign: "right" },
  avatarStack: { display: "flex", justifyContent: "flex-end", paddingLeft: 10 },
  stackAvatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #08161c",
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
  },
  onlineText: {
    color: "rgba(234,250,245,0.82)",
    fontSize: 12,
    fontWeight: 800,
    marginTop: 8,
  },
  hostRow: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  hostAvatar: { width: 52, height: 52, borderRadius: "50%", objectFit: "cover" },
  hostNameRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  hostName: { color: "#fff", fontWeight: 900 },
  hostBadge: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.08em",
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(167,243,208,0.14)",
    border: "1px solid rgba(167,243,208,0.18)",
    color: "#d2fff1",
  },
  hostSub: { color: "rgba(234,250,245,0.75)", fontSize: 13, marginTop: 4, lineHeight: 1.5 },
  quickWrap: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 },
  quickBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#f5fffd",
    borderRadius: 999,
    padding: "10px 12px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  errorBox: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,90,90,0.10)",
    border: "1px solid rgba(255,90,90,0.18)",
    color: "#ffd7d7",
    fontWeight: 700,
    fontSize: 14,
  },
  messagesCard: {
    minHeight: 420,
    maxHeight: "55vh",
    overflowY: "auto",
    borderRadius: 28,
    padding: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
    display: "grid",
    gap: 12,
  },
  emptyState: {
    minHeight: 300,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#effffb",
  },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { marginTop: 10, fontSize: 22, fontWeight: 900 },
  emptyText: { marginTop: 6, opacity: 0.75, maxWidth: 380, lineHeight: 1.6 },
  messageRow: { display: "flex", alignItems: "flex-end", gap: 10 },
  messageAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  messageBubble: {
    maxWidth: "min(82%, 720px)",
    borderRadius: 22,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.16)",
  },
  myBubble: {
    background:
      "linear-gradient(135deg, rgba(167,243,208,0.16), rgba(103,232,249,0.16), rgba(96,165,250,0.16))",
  },
  theirBubble: {
    background: "rgba(255,255,255,0.06)",
  },
  messageHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  messageNameWrap: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  messageName: { color: "#fff", fontWeight: 900, fontSize: 13 },
  messageHostBadge: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.08em",
    padding: "3px 7px",
    borderRadius: 999,
    background: "rgba(167,243,208,0.12)",
    border: "1px solid rgba(167,243,208,0.18)",
    color: "#d2fff1",
  },
  messageTime: { color: "rgba(234,250,245,0.62)", fontSize: 11, fontWeight: 800 },
  messageText: { color: "#f4fffb", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  messageImage: {
    marginTop: 10,
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    display: "block",
    objectFit: "cover",
  },
  messageVideo: {
    marginTop: 10,
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    display: "block",
    background: "#000",
  },
  previewCard: {
    borderRadius: 24,
    padding: 14,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  previewHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  previewTitle: { color: "#fff", fontWeight: 900 },
  removeMediaBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#f5fffd",
    borderRadius: 12,
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  selectedImage: { width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 18, display: "block" },
  selectedVideo: { width: "100%", maxHeight: 320, borderRadius: 18, display: "block", background: "#000" },
  composerCard: {
    position: "sticky",
    bottom: 12,
    borderRadius: 24,
    padding: 14,
    background: "rgba(8,22,28,0.86)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.22)",
  },
  mediaButtonsRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 },
  mediaBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#f5fffd",
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  mediaHint: { color: "rgba(234,250,245,0.68)", fontSize: 12, fontWeight: 700 },
  composerRow: { display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" },
  textarea: {
    width: "100%",
    minHeight: 52,
    maxHeight: 160,
    borderRadius: 18,
    padding: "14px 15px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#f4fffb",
    outline: "none",
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.5,
    resize: "none",
    boxSizing: "border-box",
  },
  sendBtn: (enabled) => ({
    border: "none",
    borderRadius: 18,
    padding: "15px 18px",
    fontWeight: 900,
    fontSize: 15,
    cursor: enabled ? "pointer" : "not-allowed",
    color: "#07252d",
    background: enabled
      ? "linear-gradient(135deg, rgba(167,243,208,1), rgba(103,232,249,1), rgba(96,165,250,1))"
      : "linear-gradient(135deg, rgba(167,243,208,0.45), rgba(103,232,249,0.45), rgba(96,165,250,0.45))",
    boxShadow: enabled ? "0 18px 36px rgba(103,232,249,0.18)" : "none",
    opacity: enabled ? 1 : 0.75,
    minWidth: 116,
  }),
};
