import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";
const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=12";

function formatDateTime(value) {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not set";

  return d.toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value) {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not set";

  return d.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeOnly(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgoLabel(value) {
  if (!value) return "Live now";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Live now";

  const diffMs = Date.now() - d.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));

  if (mins < 60) return `Started ${mins}m ago`;

  const hours = Math.floor(mins / 60);
  const rem = mins % 60;

  if (hours < 24) {
    return rem ? `Started ${hours}h ${rem}m ago` : `Started ${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `Started ${days}d ago`;
}

function timeLeftLabel(value) {
  if (!value) return "No end time";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No end time";

  const diffMs = d.getTime() - Date.now();
  if (diffMs <= 0) return "Ended";

  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `Ends in ${mins}m`;

  const hours = Math.floor(mins / 60);
  const rem = mins % 60;

  if (hours < 24) {
    return rem ? `Ends in ${hours}h ${rem}m` : `Ends in ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `Ends in ${days}d`;
}

function getStatusLabel(item) {
  if (!item) return "Loading";

  if (item.status === "cancelled") return "Cancelled";
  if (item.status === "ended") return "Ended";
  if (item.status === "full") return "Full";

  if (item.expires_at) {
    const endTs = new Date(item.expires_at).getTime();
    if (!Number.isNaN(endTs) && endTs <= Date.now()) return "Ended";
  }

  if (item.starts_at) {
    const startTs = new Date(item.starts_at).getTime();
    if (!Number.isNaN(startTs) && startTs > Date.now()) return "Starting soon";
  }

  return "Live";
}

function getDisplayName(profile, userId) {
  const fullName = profile?.full_name?.trim();
  const username = profile?.username?.trim();

  return fullName || username || `Explorer ${String(userId || "").slice(0, 6)}`;
}

function getAvatarUrl(profile) {
  return profile?.avatar_url?.trim() || FALLBACK_AVATAR;
}

function getProfileRecord(profilesMap, userId) {
  if (!userId) return null;

  return (
    profilesMap?.[userId] ||
    profilesMap?.[String(userId)] ||
    null
  );
}

function getFirstDefined(obj, keys, fallback = null) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getLat(item) {
  return parseNumber(
    getFirstDefined(item, [
      "latitude",
      "lat",
      "location_lat",
      "location_latitude",
      "meeting_lat",
      "meeting_latitude",
    ])
  );
}

function getLng(item) {
  return parseNumber(
    getFirstDefined(item, [
      "longitude",
      "lng",
      "lon",
      "location_lng",
      "location_longitude",
      "meeting_lng",
      "meeting_longitude",
    ])
  );
}

function getLocationLabel(item) {
  return (
    getFirstDefined(item, [
      "location_text",
      "meeting_point",
      "place_name",
      "city",
      "location",
      "address",
    ]) || "Location not set"
  );
}

function getCountryLabel(item) {
  return getFirstDefined(item, ["country", "country_name"], "");
}

function getCityLabel(item) {
  return getFirstDefined(item, ["city", "town"], "");
}

function getActivityLabel(item) {
  return (
    getFirstDefined(item, ["activity", "category", "type", "sport_type"], "Adventure")
  );
}

function getVisibilityLabel(item) {
  return getFirstDefined(item, ["visibility", "privacy"], "Public");
}

function getDifficultyLabel(item) {
  return getFirstDefined(item, ["difficulty", "level"], "All levels");
}

function getDurationLabel(item) {
  const raw = getFirstDefined(item, [
    "duration_text",
    "duration_label",
    "duration",
  ]);
  if (raw) return String(raw);

  if (item?.starts_at && item?.expires_at) {
    const start = new Date(item.starts_at).getTime();
    const end = new Date(item.expires_at).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      const mins = Math.round((end - start) / 60000);
      if (mins < 60) return `${mins} min`;
      const hours = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem ? `${hours}h ${rem}m` : `${hours}h`;
    }
  }

  return "Flexible";
}

function getWeatherEmoji(code) {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌍";
}

function getWeatherLabel(code) {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Weather";
}

function statusTone(statusLabel) {
  if (statusLabel === "Live") {
    return {
      bg: "rgba(31, 224, 125, 0.18)",
      border: "rgba(31, 224, 125, 0.45)",
      color: "#8dffbf",
      dot: "#1fe07d",
    };
  }
  if (statusLabel === "Starting soon") {
    return {
      bg: "rgba(255, 184, 0, 0.16)",
      border: "rgba(255, 184, 0, 0.4)",
      color: "#ffd76b",
      dot: "#ffb800",
    };
  }
  if (statusLabel === "Ended") {
    return {
      bg: "rgba(255,255,255,0.08)",
      border: "rgba(255,255,255,0.18)",
      color: "#d6d6d6",
      dot: "#9c9c9c",
    };
  }
  if (statusLabel === "Cancelled") {
    return {
      bg: "rgba(255,70,70,0.16)",
      border: "rgba(255,70,70,0.35)",
      color: "#ff9f9f",
      dot: "#ff5f5f",
    };
  }
  return {
    bg: "rgba(95,177,255,0.16)",
    border: "rgba(95,177,255,0.32)",
    color: "#a6d0ff",
    dot: "#5fb1ff",
  };
}

function InfoChip({ icon, label, value }) {
  return (
    <div style={styles.infoChip}>
      <div style={styles.infoChipIcon}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={styles.infoChipLabel}>{label}</div>
        <div style={styles.infoChipValue}>{value}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHead}>
        <div>
          <h2 style={styles.sectionTitle}>{title}</h2>
          {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function AvatarStack({ participants, profilesMap, ownerId, navigate }) {
  const visible = participants.slice(0, 7);
  const extra = participants.length - visible.length;

  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {visible.map((participant, index) => {
          const profile = getProfileRecord(profilesMap, participant.user_id);
          const name = getDisplayName(profile, participant.user_id);
          return (
            <button
              key={participant.id || participant.user_id}
              type="button"
              onClick={() => navigate(`/profile/${participant.user_id}`)}
              title={name}
              style={{
                ...styles.avatarStackBtn,
                marginLeft: index === 0 ? 0 : -10,
                zIndex: visible.length - index,
              }}
            >
              <img
                src={getAvatarUrl(profile)}
                alt={name}
                style={styles.avatarStackImg}
              />
              {participant.user_id === ownerId ? (
                <span style={styles.avatarStackHost}>★</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {extra > 0 ? <div style={styles.extraBubble}>+{extra} more</div> : null}
    </div>
  );
}

function FullscreenMedia({ open, item, onClose }) {
  if (!open) return null;

  const src = item?.media_url || FALLBACK_IMAGE;
  const isVideo = item?.media_type === "video";

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={styles.closeBtn}>
          ×
        </button>

        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            style={styles.fullscreenVideo}
          />
        ) : (
          <img
            src={src}
            alt={item?.title || "Going now media"}
            style={styles.fullscreenImg}
          />
        )}
      </div>
    </div>
  );
}

export default function GoingNowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [item, setItem] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [messagesPreview, setMessagesPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinBusy, setJoinBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const loadUser = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("loadUser session error:", error);
      setUser(null);
      return null;
    }

    const authUser = session?.user || null;
    setUser(authUser);
    return authUser;
  }, []);

  const loadItem = useCallback(async () => {
    const { data, error } = await supabase
      .from("going_now_overview")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      return null;
    }

    setItem(data);
    return data;
  }, [id]);

  const loadParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from("going_now_participants")
      .select("*")
      .eq("going_now_id", id)
      .eq("status", "joined")
      .order("joined_at", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      return [];
    }

    setParticipants(data || []);
    return data || [];
  }, [id]);

  const loadProfiles = useCallback(async (rows, ownerId) => {
    const ids = Array.from(
      new Set([ownerId, ...(rows || []).map((row) => row.user_id)].filter(Boolean))
    );

    if (ids.length === 0) {
      setProfilesMap({});
      return {};
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    if (error) {
      console.error("load profiles error:", error);
      setProfilesMap({});
      return {};
    }

    const nextMap = {};
    (data || []).forEach((profile) => {
      if (profile?.id) {
        nextMap[profile.id] = profile;
        nextMap[String(profile.id)] = profile;
      }
      if (profile?.user_id) {
        nextMap[profile.user_id] = profile;
        nextMap[String(profile.user_id)] = profile;
      }
    });

    setProfilesMap(nextMap);
    return nextMap;
  }, []);

  const loadMessagesPreview = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("going_now_messages")
        .select("*")
        .eq("going_now_id", id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.warn("messages preview skipped:", error.message);
        setMessagesPreview([]);
        return [];
      }

      const rows = (data || []).slice().reverse();
      setMessagesPreview(rows);
      return rows;
    } catch (err) {
      console.warn("messages preview failed:", err);
      setMessagesPreview([]);
      return [];
    }
  }, [id]);

  const loadWeather = useCallback(async (nextItem) => {
    const lat = getLat(nextItem);
    const lng = getLng(nextItem);

    if (lat === null || lng === null) {
      setWeather(null);
      return;
    }

    try {
      setWeatherLoading(true);

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
      );

      if (!res.ok) throw new Error("Weather request failed");

      const data = await res.json();
      setWeather(data?.current || null);
    } catch (err) {
      console.warn("weather failed:", err);
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setErrorMsg("");
    await loadUser();
    const nextItem = await loadItem();
    const nextParticipants = await loadParticipants();

    if (nextItem) {
      await loadProfiles(nextParticipants, nextItem.user_id);
      await loadWeather(nextItem);
    }

    await loadMessagesPreview();
  }, [
    loadItem,
    loadMessagesPreview,
    loadParticipants,
    loadProfiles,
    loadUser,
    loadWeather,
  ]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      await refresh();
      if (!mounted) return;
      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [refresh]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    const channel1 = supabase
      .channel("going-now-item-" + id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now",
          filter: `id=eq.${id}`,
        },
        async () => {
          const nextItem = await loadItem();
          const nextParticipants = await loadParticipants();
          if (nextItem) {
            await loadProfiles(nextParticipants, nextItem.user_id);
            await loadWeather(nextItem);
          }
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel("going-now-participants-" + id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_participants",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          const nextParticipants = await loadParticipants();
          if (item?.user_id) {
            await loadProfiles(nextParticipants, item.user_id);
          }
        }
      )
      .subscribe();

    const channel3 = supabase
      .channel("going-now-messages-" + id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_messages",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          await loadMessagesPreview();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, [
    id,
    item?.user_id,
    loadItem,
    loadMessagesPreview,
    loadParticipants,
    loadProfiles,
    loadWeather,
  ]);

  const hasJoined = useMemo(() => {
    if (!user) return false;
    return participants.some((p) => p.user_id === user.id);
  }, [participants, user]);

  const isOwner = useMemo(() => {
    if (!user || !item) return false;
    return item.user_id === user.id;
  }, [user, item]);

  const creatorProfile = useMemo(() => {
    if (!item?.user_id) return null;
    return getProfileRecord(profilesMap, item.user_id);
  }, [item, profilesMap]);

  const creatorName = useMemo(() => {
    return getDisplayName(creatorProfile, item?.user_id);
  }, [creatorProfile, item]);

  const creatorAvatar = useMemo(() => {
    return getAvatarUrl(creatorProfile);
  }, [creatorProfile]);

  const creatorUsername = useMemo(() => {
    return creatorProfile?.username?.trim() || "";
  }, [creatorProfile]);

  const statusLabel = useMemo(() => getStatusLabel(item), [item]);
  const statusStyle = useMemo(() => statusTone(statusLabel), [statusLabel]);

  const mediaSrc = item?.media_url || FALLBACK_IMAGE;
  const isVideo = item?.media_type === "video";
  const lat = getLat(item);
  const lng = getLng(item);
  const locationLabel = getLocationLabel(item);
  const cityLabel = getCityLabel(item);
  const countryLabel = getCountryLabel(item);
  const activityLabel = getActivityLabel(item);
  const visibilityLabel = getVisibilityLabel(item);
  const difficultyLabel = getDifficultyLabel(item);
  const durationLabel = getDurationLabel(item);
  const spotsTotal = getFirstDefined(item, ["spots_total", "max_people", "capacity"], null);

  const peopleLine =
    spotsTotal !== null && spotsTotal !== undefined && spotsTotal !== ""
      ? `${participants.length} / ${spotsTotal}`
      : `${participants.length}`;

  const placeLine = [locationLabel, cityLabel, countryLabel]
    .filter(Boolean)
    .join(cityLabel || countryLabel ? " • " : "");

  const joinedMeRow = participants.find((p) => p.user_id === user?.id) || null;

  const weatherEmoji = weather ? getWeatherEmoji(weather.weather_code) : "🌍";
  const weatherLabel = weather ? getWeatherLabel(weather.weather_code) : "Weather";
  const weatherTemp =
    weather?.temperature_2m !== undefined && weather?.temperature_2m !== null
      ? `${Math.round(weather.temperature_2m)}°C`
      : "—";
  const weatherWind =
    weather?.wind_speed_10m !== undefined && weather?.wind_speed_10m !== null
      ? `${Math.round(weather.wind_speed_10m)} km/h`
      : "—";

  const directionsUrl =
    lat !== null && lng !== null
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : locationLabel && locationLabel !== "Location not set"
      ? `https://www.google.com/maps/search/${encodeURIComponent(locationLabel)}`
      : null;

  const mapSrc =
    lat !== null && lng !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`
      : null;

  const handleJoin = async () => {
    try {
      setJoinBusy(true);
      setErrorMsg("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(sessionError);
        setErrorMsg(sessionError.message || "Session error");
        return;
      }

      const authUser = session?.user || null;

      if (!authUser) {
        navigate("/login");
        return;
      }

      setUser(authUser);

      const { error } = await supabase.from("going_now_participants").upsert(
        {
          going_now_id: id,
          user_id: authUser.id,
          status: "joined",
        },
        {
          onConflict: "going_now_id,user_id",
        }
      );

      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Join failed");
        return;
      }

      const nextParticipants = await loadParticipants();
      if (item?.user_id) {
        await loadProfiles(nextParticipants, item.user_id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Join failed");
    } finally {
      setJoinBusy(false);
    }
  };

  const handleLeave = async () => {
    try {
      setLeaveBusy(true);
      setErrorMsg("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(sessionError);
        setErrorMsg(sessionError.message || "Session error");
        return;
      }

      const authUser = session?.user || null;

      if (!authUser) {
        navigate("/login");
        return;
      }

      setUser(authUser);

      const { error } = await supabase
        .from("going_now_participants")
        .delete()
        .eq("going_now_id", id)
        .eq("user_id", authUser.id);

      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Leave failed");
        return;
      }

      const nextParticipants = await loadParticipants();
      if (item?.user_id) {
        await loadProfiles(nextParticipants, item.user_id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Leave failed");
    } finally {
      setLeaveBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;

    const ok = window.confirm("Delete this live plan?");
    if (!ok) return;

    try {
      setDeleteBusy(true);
      setErrorMsg("");

      const { error } = await supabase.from("going_now").delete().eq("id", id);

      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Delete failed");
        return;
      }

      navigate("/going-now");
    } catch (err) {
      console.error(err);
      setErrorMsg("Delete failed");
    } finally {
      setDeleteBusy(false);
    }
  };

  const openChat = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      navigate("/login");
      return;
    }

    navigate(`/going-now/${id}/chat`);
  };

  const openCreatorProfile = () => {
    if (!item?.user_id) return;
    navigate(`/profile/${item.user_id}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = item?.title || "Live plan";

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out this live plan on MeetOutdoors`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied");
      }
    } catch (err) {
      console.warn("share cancelled or failed", err);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingBox}>Loading live plan...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingBox}>Live plan not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <FullscreenMedia
        open={showMedia}
        item={item}
        onClose={() => setShowMedia(false)}
      />

      <div style={styles.container}>
        <div style={styles.topToolbar}>
          <button type="button" onClick={() => navigate(-1)} style={styles.topBtn}>
            ← Back
          </button>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={handleShare} style={styles.topBtnMuted}>
              Share
            </button>
            <button type="button" onClick={openChat} style={styles.topBtnMuted}>
              Chat
            </button>
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/going-now/${id}/edit`)}
                  style={styles.topBtnMuted}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteBusy}
                  style={styles.topBtnDanger}
                >
                  {deleteBusy ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <section style={styles.hero}>
          <div style={styles.heroMediaWrap}>
            {isVideo ? (
              <video
                src={mediaSrc}
                controls
                playsInline
                poster={FALLBACK_IMAGE}
                style={styles.heroMedia}
              />
            ) : (
              <img
                src={mediaSrc}
                alt={item.title}
                style={styles.heroMedia}
                onClick={() => setShowMedia(true)}
              />
            )}

            <div style={styles.heroOverlay} />

            <div style={styles.heroTopRow}>
              <div
                style={{
                  ...styles.statusBadge,
                  background: statusStyle.bg,
                  borderColor: statusStyle.border,
                  color: statusStyle.color,
                }}
              >
                <span
                  style={{
                    ...styles.statusDot,
                    background: statusStyle.dot,
                    boxShadow: `0 0 16px ${statusStyle.dot}`,
                  }}
                />
                {statusLabel}
              </div>

              <button
                type="button"
                onClick={() => setShowMedia(true)}
                style={styles.expandBtn}
              >
                ⤢ View
              </button>
            </div>

            <div style={styles.heroBottom}>
              <div style={styles.heroTextBlock}>
                <div style={styles.heroEyebrow}>{activityLabel}</div>
                <h1 style={styles.heroTitle}>{item.title || "Untitled live plan"}</h1>
                <div style={styles.heroMeta}>
                  <span>📍 {placeLine || "Location not set"}</span>
                  <span>🕒 {formatDateTime(item.starts_at)}</span>
                  <span>👥 {peopleLine} going</span>
                </div>
                <div style={styles.heroSubMeta}>
                  <span>{timeAgoLabel(item.starts_at)}</span>
                  <span>{timeLeftLabel(item.expires_at)}</span>
                </div>
              </div>

              <div style={styles.heroActionColumn}>
                {!isOwner ? (
                  !hasJoined ? (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joinBusy}
                      style={styles.primaryCta}
                    >
                      {joinBusy ? "Joining..." : "Join now"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLeave}
                      disabled={leaveBusy}
                      style={styles.secondaryCta}
                    >
                      {leaveBusy ? "Leaving..." : "Leave plan"}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/going-now/${id}/edit`)}
                    style={styles.primaryCta}
                  >
                    Edit live plan
                  </button>
                )}

                <button type="button" onClick={openChat} style={styles.chatCta}>
                  Open live chat
                </button>
              </div>
            </div>
          </div>
        </section>

        <div style={styles.contentGrid}>
          <div style={styles.mainCol}>
            <div style={styles.chipsGrid}>
              <InfoChip icon="🏔️" label="Activity" value={activityLabel} />
              <InfoChip icon="⏱️" label="Duration" value={durationLabel} />
              <InfoChip icon="📡" label="Status" value={statusLabel} />
              <InfoChip icon="🌍" label="Visibility" value={visibilityLabel} />
              <InfoChip icon="🧭" label="Difficulty" value={difficultyLabel} />
              <InfoChip icon="👥" label="Spots" value={peopleLine} />
            </div>

            {errorMsg ? <div style={styles.errorBox}>{errorMsg}</div> : null}

            {hasJoined ? (
              <div style={styles.successBox}>
                ✅ You’re in this live plan
                {joinedMeRow?.joined_at ? (
                  <span style={{ opacity: 0.8 }}>
                    {" "}
                    • joined {formatTimeOnly(joinedMeRow.joined_at)}
                  </span>
                ) : null}
              </div>
            ) : null}

            <SectionCard
              title="Created by"
              subtitle="Host profile and quick trust info"
            >
              <button
                type="button"
                onClick={openCreatorProfile}
                style={styles.creatorCard}
              >
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  style={styles.creatorAvatar}
                />

                <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                  <div style={styles.creatorNameRow}>
                    <span style={styles.creatorName}>{creatorName}</span>
                    {creatorProfile?.is_verified ? (
                      <span style={styles.verifiedBadge}>Verified</span>
                    ) : null}
                    <span style={styles.hostBadge}>Host</span>
                  </div>

                  <div style={styles.creatorUsername}>
                    {creatorUsername ? `@${creatorUsername}` : "Explorer"}
                  </div>

                  <div style={styles.creatorMiniMeta}>
                    <span>Tap to open profile</span>
                    <span>Created on {formatDateOnly(item.created_at)}</span>
                  </div>
                </div>

                <div style={styles.creatorArrow}>→</div>
              </button>
            </SectionCard>

            <SectionCard
              title="Live participants"
              subtitle="See who’s already inside this plan"
              action={
                <AvatarStack
                  participants={participants}
                  profilesMap={profilesMap}
                  ownerId={item.user_id}
                  navigate={navigate}
                />
              }
            >
              {participants.length > 0 ? (
                <div style={styles.participantsGrid}>
                  {participants.map((participant) => {
                    const profile = getProfileRecord(profilesMap, participant.user_id);
                    const name = getDisplayName(profile, participant.user_id);
                    const username = profile?.username?.trim();

                    return (
                      <button
                        key={participant.id || participant.user_id}
                        type="button"
                        onClick={() => navigate(`/profile/${participant.user_id}`)}
                        style={styles.participantCard}
                      >
                        <img
                          src={getAvatarUrl(profile)}
                          alt={name}
                          style={styles.participantAvatar}
                        />

                        <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                          <div style={styles.participantNameRow}>
                            <span style={styles.participantName}>{name}</span>
                            {participant.user_id === item.user_id ? (
                              <span style={styles.miniHostPill}>Host</span>
                            ) : null}
                          </div>

                          <div style={styles.participantUsername}>
                            {username ? `@${username}` : "Explorer"}
                          </div>

                          <div style={styles.participantJoined}>
                            {participant.joined_at
                              ? `Joined ${formatTimeOnly(participant.joined_at)}`
                              : "Active now"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyCard}>
                  Nobody joined yet. Be the first explorer in this live plan.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Map & directions"
              subtitle="Meeting point and route access"
              action={
                directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.inlineAction}
                  >
                    Get directions
                  </a>
                ) : null
              }
            >
              {mapSrc ? (
                <>
                  <div style={styles.mapWrap}>
                    <iframe
                      title="Live plan map"
                      src={mapSrc}
                      style={styles.mapIframe}
                    />
                  </div>

                  <div style={styles.mapInfoBar}>
                    <div>
                      <div style={styles.mapInfoLabel}>Meeting point</div>
                      <div style={styles.mapInfoValue}>{locationLabel}</div>
                    </div>

                    <div>
                      <div style={styles.mapInfoLabel}>Coordinates</div>
                      <div style={styles.mapInfoValue}>
                        {lat}, {lng}
                      </div>
                    </div>

                    {directionsUrl ? (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.mapBtn}
                      >
                        Open in Maps
                      </a>
                    ) : null}
                  </div>
                </>
              ) : (
                <div style={styles.emptyCard}>
                  No exact coordinates yet.
                  {locationLabel ? ` Meeting point: ${locationLabel}` : ""}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="About this plan"
              subtitle="Everything participants should know before joining"
            >
              <div style={styles.aboutText}>
                {item.description?.trim() || "No description added yet."}
              </div>

              <div style={styles.aboutHints}>
                <div style={styles.hintCard}>
                  <div style={styles.hintTitle}>What you’ll do</div>
                  <div style={styles.hintText}>{activityLabel}</div>
                </div>
                <div style={styles.hintCard}>
                  <div style={styles.hintTitle}>Who can join</div>
                  <div style={styles.hintText}>{difficultyLabel}</div>
                </div>
                <div style={styles.hintCard}>
                  <div style={styles.hintTitle}>Estimated duration</div>
                  <div style={styles.hintText}>{durationLabel}</div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Media"
              subtitle="Tap to view the photo or video in fullscreen"
            >
              <div style={styles.mediaGrid}>
                <button
                  type="button"
                  style={styles.mediaThumbBtn}
                  onClick={() => setShowMedia(true)}
                >
                  {isVideo ? (
                    <>
                      <video
                        src={mediaSrc}
                        muted
                        playsInline
                        style={styles.mediaThumb}
                      />
                      <div style={styles.videoPlayBadge}>▶</div>
                    </>
                  ) : (
                    <img
                      src={mediaSrc}
                      alt={item.title || "Live plan"}
                      style={styles.mediaThumb}
                    />
                  )}
                  <div style={styles.mediaThumbOverlay}>Open fullscreen</div>
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Live chat preview"
              subtitle="Latest conversation before you jump into chat"
              action={
                <button type="button" onClick={openChat} style={styles.inlineActionBtn}>
                  Open live chat
                </button>
              }
            >
              {messagesPreview.length > 0 ? (
                <div style={styles.chatPreviewList}>
                  {messagesPreview.map((msg, index) => {
                    const profile = getProfileRecord(profilesMap, msg.user_id);
                    const name = getDisplayName(profile, msg.user_id);
                    return (
                      <div key={msg.id || index} style={styles.chatPreviewItem}>
                        <img
                          src={getAvatarUrl(profile)}
                          alt={name}
                          style={styles.chatPreviewAvatar}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={styles.chatPreviewNameRow}>
                            <span style={styles.chatPreviewName}>{name}</span>
                            <span style={styles.chatPreviewTime}>
                              {formatTimeOnly(msg.created_at)}
                            </span>
                          </div>
                          <div style={styles.chatPreviewText}>
                            {msg.text || msg.message || "Message"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyCard}>
                  No chat messages yet. Start the conversation.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Trust & details"
              subtitle="Useful visibility and timing info"
            >
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Created on</span>
                  <span style={styles.detailValue}>{formatDateTime(item.created_at)}</span>
                </div>

                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Start</span>
                  <span style={styles.detailValue}>{formatDateTime(item.starts_at)}</span>
                </div>

                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>End</span>
                  <span style={styles.detailValue}>{formatDateTime(item.expires_at)}</span>
                </div>

                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Visibility</span>
                  <span style={styles.detailValue}>{visibilityLabel}</span>
                </div>

                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Meeting point</span>
                  <span style={styles.detailValue}>{locationLabel}</span>
                </div>

                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Chat access</span>
                  <span style={styles.detailValue}>Open via live chat</span>
                </div>
              </div>
            </SectionCard>
          </div>

          <aside style={styles.sideCol}>
            <div style={styles.sideSticky}>
              <div style={styles.sideWidget}>
                <div style={styles.sideWidgetTitle}>Live summary</div>
                <div style={styles.sideWidgetValue}>{statusLabel}</div>
                <div style={styles.sideDivider} />
                <div style={styles.sideInfoRow}>
                  <span>People</span>
                  <strong>{peopleLine}</strong>
                </div>
                <div style={styles.sideInfoRow}>
                  <span>Activity</span>
                  <strong>{activityLabel}</strong>
                </div>
                <div style={styles.sideInfoRow}>
                  <span>Start</span>
                  <strong>{formatTimeOnly(item.starts_at)}</strong>
                </div>
                <div style={styles.sideInfoRow}>
                  <span>End</span>
                  <strong>{formatTimeOnly(item.expires_at)}</strong>
                </div>

                <div style={{ marginTop: 16 }}>
                  {!isOwner ? (
                    !hasJoined ? (
                      <button
                        type="button"
                        onClick={handleJoin}
                        disabled={joinBusy}
                        style={styles.sidePrimaryBtn}
                      >
                        {joinBusy ? "Joining..." : "Join now"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLeave}
                        disabled={leaveBusy}
                        style={styles.sideSecondaryBtn}
                      >
                        {leaveBusy ? "Leaving..." : "Leave plan"}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/going-now/${id}/edit`)}
                      style={styles.sidePrimaryBtn}
                    >
                      Edit live plan
                    </button>
                  )}
                </div>

                <button type="button" onClick={openChat} style={styles.sideGhostBtn}>
                  Open chat
                </button>
              </div>

              <div style={styles.sideWidget}>
                <div style={styles.sideWidgetTitle}>Local weather</div>

                {weatherLoading ? (
                  <div style={styles.weatherLoading}>Loading weather...</div>
                ) : weather ? (
                  <>
                    <div style={styles.weatherHero}>
                      <div style={styles.weatherEmoji}>{weatherEmoji}</div>
                      <div>
                        <div style={styles.weatherTemp}>{weatherTemp}</div>
                        <div style={styles.weatherLabel}>{weatherLabel}</div>
                      </div>
                    </div>

                    <div style={styles.sideDivider} />

                    <div style={styles.sideInfoRow}>
                      <span>Wind</span>
                      <strong>{weatherWind}</strong>
                    </div>
                    <div style={styles.sideInfoRow}>
                      <span>Location</span>
                      <strong>{cityLabel || locationLabel || "Outdoor spot"}</strong>
                    </div>
                  </>
                ) : (
                  <div style={styles.weatherLoading}>
                    Weather available when coordinates are set.
                  </div>
                )}
              </div>

              <div style={styles.sideWidget}>
                <div style={styles.sideWidgetTitle}>Quick actions</div>
                <button type="button" onClick={handleShare} style={styles.sideGhostBtn}>
                  Share plan
                </button>
                {directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.sideGhostLink}
                  >
                    Get directions
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={openCreatorProfile}
                  style={styles.sideGhostBtn}
                >
                  View host profile
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isMobile ? (
        <div style={styles.mobileStickyBar}>
          <button type="button" onClick={openChat} style={styles.mobileChatBtn}>
            Chat
          </button>

          {!isOwner ? (
            !hasJoined ? (
              <button
                type="button"
                onClick={handleJoin}
                disabled={joinBusy}
                style={styles.mobilePrimaryBtn}
              >
                {joinBusy ? "Joining..." : "Join now"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLeave}
                disabled={leaveBusy}
                style={styles.mobileSecondaryBtn}
              >
                {leaveBusy ? "Leaving..." : "Leave"}
              </button>
            )
          ) : directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              style={styles.mobilePrimaryLink}
            >
              Directions
            </a>
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/going-now/${id}/edit`)}
              style={styles.mobilePrimaryBtn}
            >
              Edit
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(24,174,132,0.18), transparent 24%), radial-gradient(circle at top right, rgba(42,124,255,0.16), transparent 22%), linear-gradient(180deg, #07110f 0%, #081513 22%, #091a17 100%)",
    color: "#fff",
    paddingBottom: 120,
  },

  container: {
    width: "min(1320px, calc(100% - 24px))",
    margin: "0 auto",
    paddingTop: 18,
  },

  topToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  topBtn: {
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
    backdropFilter: "blur(14px)",
  },

  topBtnMuted: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e8f3ef",
    padding: "11px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
  },

  topBtnDanger: {
    border: "1px solid rgba(255,94,94,0.34)",
    background: "rgba(255,94,94,0.12)",
    color: "#ffb2b2",
    padding: "11px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
  },

  hero: {
    marginBottom: 22,
  },

  heroMediaWrap: {
    position: "relative",
    minHeight: 520,
    borderRadius: 30,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
    background: "#09110f",
  },

  heroMedia: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    cursor: "pointer",
    background: "#000",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(6,10,9,0.14) 0%, rgba(6,10,9,0.2) 20%, rgba(6,10,9,0.56) 58%, rgba(4,7,7,0.94) 100%)",
    pointerEvents: "none",
  },

  heroTopRow: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 2,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid",
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 13,
    backdropFilter: "blur(16px)",
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },

  expandBtn: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.34)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 800,
    backdropFilter: "blur(12px)",
  },

  heroBottom: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 22,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    zIndex: 2,
  },

  heroTextBlock: {
    maxWidth: 820,
  },

  heroEyebrow: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    fontWeight: 800,
    fontSize: 12,
    marginBottom: 14,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#b9fff0",
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(30px, 5vw, 60px)",
    lineHeight: 1.02,
    fontWeight: 950,
    letterSpacing: "-0.03em",
    maxWidth: 900,
  },

  heroMeta: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 14,
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    fontWeight: 600,
  },

  heroSubMeta: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 12,
    color: "rgba(216,244,237,0.9)",
    fontSize: 14,
    fontWeight: 700,
  },

  heroActionColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 220,
  },

  primaryCta: {
    border: "none",
    background: "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)",
    color: "#06110e",
    padding: "16px 22px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 16,
    boxShadow: "0 18px 40px rgba(27, 193, 150, 0.35)",
  },

  secondaryCta: {
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.09)",
    color: "#fff",
    padding: "16px 22px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 16,
    backdropFilter: "blur(14px)",
  },

  chatCta: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(5,10,10,0.42)",
    color: "#fff",
    padding: "15px 18px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 15,
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 340px",
    gap: 22,
    alignItems: "start",
  },

  mainCol: {
    minWidth: 0,
  },

  sideCol: {
    minWidth: 0,
  },

  sideSticky: {
    position: "sticky",
    top: 18,
    display: "grid",
    gap: 16,
  },

  sideWidget: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(18px)",
    padding: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.24)",
  },

  sideWidgetTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
    marginBottom: 10,
  },

  sideWidgetValue: {
    fontSize: 24,
    fontWeight: 950,
    marginBottom: 4,
  },

  sideDivider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "14px 0",
  },

  sideInfoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 14,
    color: "rgba(230,239,236,0.9)",
    marginBottom: 10,
  },

  sidePrimaryBtn: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)",
    color: "#06110e",
    padding: "14px 16px",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 15,
  },

  sideSecondaryBtn: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "14px 16px",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 15,
  },

  sideGhostBtn: {
    width: "100%",
    marginTop: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#eaf6f2",
    padding: "13px 15px",
    borderRadius: 15,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
  },

  sideGhostLink: {
    width: "100%",
    marginTop: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#eaf6f2",
    padding: "13px 15px",
    borderRadius: 15,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
    display: "block",
    textDecoration: "none",
    textAlign: "center",
    boxSizing: "border-box",
  },

  weatherHero: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  weatherEmoji: {
    width: 58,
    height: 58,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    background: "rgba(255,255,255,0.08)",
  },

  weatherTemp: {
    fontSize: 28,
    fontWeight: 950,
  },

  weatherLabel: {
    color: "rgba(224,239,233,0.88)",
    fontSize: 14,
    fontWeight: 700,
  },

  weatherLoading: {
    color: "rgba(224,239,233,0.82)",
    fontSize: 14,
    lineHeight: 1.5,
  },

  chipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 18,
  },

  infoChip: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(16px)",
    minWidth: 0,
  },

  infoChipIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(135deg, rgba(34,211,154,0.22), rgba(49,195,255,0.20))",
    fontSize: 20,
    flexShrink: 0,
  },

  infoChipLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(194,217,210,0.76)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  infoChipValue: {
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
    marginTop: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  sectionCard: {
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(18px)",
    padding: 20,
    boxShadow: "0 18px 50px rgba(0,0,0,0.24)",
    marginBottom: 18,
  },

  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
    letterSpacing: "-0.02em",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "rgba(219,235,229,0.78)",
    fontSize: 14,
    lineHeight: 1.5,
  },

  creatorCard: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(135deg, rgba(34,211,154,0.08), rgba(49,195,255,0.06))",
    color: "#fff",
    cursor: "pointer",
  },

  creatorAvatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "2px solid rgba(255,255,255,0.16)",
  },

  creatorNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  creatorName: {
    fontSize: 20,
    fontWeight: 950,
  },

  creatorUsername: {
    marginTop: 6,
    color: "rgba(219,235,229,0.82)",
    fontWeight: 700,
    fontSize: 14,
  },

  creatorMiniMeta: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    color: "rgba(219,235,229,0.74)",
    fontSize: 13,
    fontWeight: 700,
  },

  verifiedBadge: {
    padding: "4px 9px",
    borderRadius: 999,
    background: "rgba(74,159,255,0.18)",
    color: "#a8d0ff",
    border: "1px solid rgba(74,159,255,0.32)",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },

  hostBadge: {
    padding: "4px 9px",
    borderRadius: 999,
    background: "rgba(34,211,154,0.18)",
    color: "#98ffd7",
    border: "1px solid rgba(34,211,154,0.32)",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },

  creatorArrow: {
    fontSize: 24,
    fontWeight: 900,
    opacity: 0.85,
  },

  participantsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  participantCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    cursor: "pointer",
  },

  participantAvatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  participantNameRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  participantName: {
    fontSize: 15,
    fontWeight: 900,
  },

  participantUsername: {
    marginTop: 4,
    color: "rgba(218,235,229,0.78)",
    fontSize: 13,
    fontWeight: 700,
  },

  participantJoined: {
    marginTop: 6,
    color: "rgba(159,255,212,0.92)",
    fontSize: 12,
    fontWeight: 800,
  },

  miniHostPill: {
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  emptyCard: {
    padding: 18,
    borderRadius: 18,
    border: "1px dashed rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(220,235,229,0.78)",
    lineHeight: 1.6,
  },

  avatarStackBtn: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "2px solid #0b1513",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    position: "relative",
    overflow: "visible",
  },

  avatarStackImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
  },

  avatarStackHost: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#22d39a",
    color: "#04110d",
    fontSize: 10,
    fontWeight: 900,
    border: "2px solid #0b1513",
  },

  extraBubble: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    fontSize: 12,
    fontWeight: 800,
    color: "#e6f6f1",
  },

  mapWrap: {
    width: "100%",
    height: 380,
    overflow: "hidden",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0a1210",
  },

  mapIframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },

  mapInfoBar: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: 14,
    marginTop: 14,
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  mapInfoLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(195,215,209,0.76)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  mapInfoValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.4,
  },

  mapBtn: {
    textDecoration: "none",
    color: "#06110e",
    background: "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)",
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
  },

  inlineAction: {
    textDecoration: "none",
    color: "#8dffcf",
    fontWeight: 900,
    fontSize: 14,
  },

  inlineActionBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
  },

  aboutText: {
    fontSize: 15.5,
    lineHeight: 1.75,
    color: "rgba(237,245,242,0.96)",
    whiteSpace: "pre-wrap",
  },

  aboutHints: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginTop: 16,
  },

  hintCard: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.04)",
  },

  hintTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(194,217,210,0.76)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  hintText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
  },

  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 14,
  },

  mediaThumbBtn: {
    position: "relative",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    borderRadius: 22,
    overflow: "hidden",
    padding: 0,
    cursor: "pointer",
    minHeight: 300,
  },

  mediaThumb: {
    width: "100%",
    height: 420,
    objectFit: "cover",
    display: "block",
    background: "#000",
  },

  mediaThumbOverlay: {
    position: "absolute",
    left: 14,
    bottom: 14,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.44)",
    color: "#fff",
    fontWeight: 800,
    backdropFilter: "blur(10px)",
  },

  videoPlayBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 78,
    height: 78,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    fontWeight: 900,
    backdropFilter: "blur(14px)",
  },

  chatPreviewList: {
    display: "grid",
    gap: 12,
  },

  chatPreviewItem: {
    display: "grid",
    gridTemplateColumns: "46px minmax(0, 1fr)",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.04)",
  },

  chatPreviewAvatar: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    objectFit: "cover",
  },

  chatPreviewNameRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },

  chatPreviewName: {
    fontWeight: 900,
    fontSize: 15,
    color: "#fff",
  },

  chatPreviewTime: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(200,218,212,0.74)",
    whiteSpace: "nowrap",
  },

  chatPreviewText: {
    marginTop: 6,
    color: "rgba(230,240,236,0.9)",
    fontSize: 14,
    lineHeight: 1.6,
    wordBreak: "break-word",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  detailItem: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.04)",
  },

  detailLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(194,217,210,0.76)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  detailValue: {
    display: "block",
    marginTop: 8,
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.55,
  },

  errorBox: {
    marginBottom: 16,
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,94,94,0.24)",
    background: "rgba(255,94,94,0.12)",
    color: "#ffb7b7",
    fontWeight: 700,
  },

  successBox: {
    marginBottom: 16,
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(34,211,154,0.22)",
    background: "rgba(34,211,154,0.12)",
    color: "#a4ffd8",
    fontWeight: 800,
  },

  loadingBox: {
    marginTop: 60,
    padding: 24,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    fontSize: 18,
    fontWeight: 800,
    textAlign: "center",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 18,
  },

  modal: {
    position: "relative",
    width: "min(1200px, 100%)",
    maxHeight: "95vh",
    background: "#000",
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
  },

  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.44)",
    color: "#fff",
    fontSize: 24,
    cursor: "pointer",
  },

  fullscreenVideo: {
    width: "100%",
    maxHeight: "95vh",
    background: "#000",
    display: "block",
  },

  fullscreenImg: {
    width: "100%",
    maxHeight: "95vh",
    objectFit: "contain",
    display: "block",
    background: "#000",
  },

  mobileStickyBar: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: 12,
    display: "grid",
    gridTemplateColumns: "0.9fr 1.1fr",
    gap: 10,
    padding: 10,
    borderRadius: 22,
    background: "rgba(7,14,13,0.88)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    zIndex: 1000,
    boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
  },

  mobileChatBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "15px 14px",
    borderRadius: 16,
    fontWeight: 900,
    cursor: "pointer",
  },

  mobilePrimaryBtn: {
    border: "none",
    background: "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)",
    color: "#06110e",
    padding: "15px 16px",
    borderRadius: 16,
    fontWeight: 950,
    cursor: "pointer",
    textAlign: "center",
  },

  mobileSecondaryBtn: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.09)",
    color: "#fff",
    padding: "15px 16px",
    borderRadius: 16,
    fontWeight: 950,
    cursor: "pointer",
    textAlign: "center",
  },

  mobilePrimaryLink: {
    textDecoration: "none",
    border: "none",
    background: "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)",
    color: "#06110e",
    padding: "15px 16px",
    borderRadius: 16,
    fontWeight: 950,
    cursor: "pointer",
    textAlign: "center",
    display: "block",
  },
};

if (typeof window !== "undefined") {
  const mediaQuery = window.matchMedia("(max-width: 1024px)");
  const applyResponsiveStyles = () => {
    const main = document.documentElement;
    if (mediaQuery.matches) {
      main.style.setProperty("--gn-grid-main", "1fr");
    } else {
      main.style.setProperty("--gn-grid-main", "minmax(0, 1fr) 340px");
    }
  };
  applyResponsiveStyles();
  mediaQuery.addEventListener?.("change", applyResponsiveStyles);
}

styles.contentGrid.gridTemplateColumns =
  "var(--gn-grid-main, minmax(0, 1fr) 340px)";

styles.chipsGrid.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
styles.participantsGrid.gridTemplateColumns =
  "repeat(auto-fit, minmax(240px, 1fr))";
styles.aboutHints.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
styles.detailsGrid.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";