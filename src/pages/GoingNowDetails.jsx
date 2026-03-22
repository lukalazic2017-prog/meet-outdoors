import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function GoingNowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [joinBusy, setJoinBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* =========================
     LOAD AUTH USER
  ========================= */
  const loadAuthUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    setUser(authUser || null);
    return authUser || null;
  }, []);

  /* =========================
     LOAD ITEM
  ========================= */
  const loadItem = useCallback(async (goingNowId) => {
    const { data, error } = await supabase
      .from("going_now_overview")
      .select("*")
      .eq("id", goingNowId)
      .single();

    if (error) {
      console.error("load item error:", error);
      setErrorMsg(error.message || "Could not load live plan.");
      return null;
    }

    setItem(data || null);
    return data || null;
  }, []);

  /* =========================
     LOAD PARTICIPANTS
  ========================= */
  const loadParticipants = useCallback(async (goingNowId, ownerId = null) => {
    const { data, error } = await supabase
      .from("going_now_participants")
      .select(`
        id,
        user_id,
        joined_at,
        status,
        profiles (
          full_name,
          username,
          avatar_url,
          is_verified
        )
      `)
      .eq("going_now_id", goingNowId)
      .eq("status", "joined")
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("load participants error:", error);
      setErrorMsg(error.message || "Could not load participants.");
      return [];
    }

    const sorted = [...(data || [])].sort((a, b) => {
      if (ownerId) {
        if (a.user_id === ownerId) return -1;
        if (b.user_id === ownerId) return 1;
      }
      return new Date(a.joined_at) - new Date(b.joined_at);
    });

    setParticipants(sorted);
    return sorted;
  }, []);

  /* =========================
     REFRESH ALL
  ========================= */
  const refreshAll = useCallback(async () => {
    setErrorMsg("");

    const authUser = await loadAuthUser();
    const itemData = await loadItem(id);

    if (!itemData) {
      setItem(null);
      setParticipants([]);
      return { authUser, itemData: null, participantRows: [] };
    }

    const participantRows = await loadParticipants(id, itemData.user_id);

    return {
      authUser,
      itemData,
      participantRows,
    };
  }, [id, loadAuthUser, loadItem, loadParticipants]);

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      await refreshAll();
      if (!mounted) return;
      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [refreshAll]);

  /* =========================
     REALTIME SUBSCRIPTIONS
  ========================= */
  useEffect(() => {
    if (!id) return;

    const itemChannel = supabase
      .channel(`going-now-details-item-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now",
          filter: `id=eq.${id}`,
        },
        async () => {
          const freshItem = await loadItem(id);
          await loadParticipants(id, freshItem?.user_id || null);
        }
      )
      .subscribe();

    const participantsChannel = supabase
      .channel(`going-now-details-participants-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_participants",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          const freshItem = await loadItem(id);
          await loadParticipants(id, freshItem?.user_id || null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [id, loadItem, loadParticipants]);

  /* =========================
     DERIVED STATE
  ========================= */
  const hasJoined = useMemo(() => {
    if (!user?.id) return false;
    return participants.some((p) => p.user_id === user.id);
  }, [participants, user]);

  const isOwner = useMemo(() => {
    return !!user?.id && !!item?.user_id && user.id === item.user_id;
  }, [user, item]);

  const isEnded = useMemo(() => {
    if (!item) return false;

    if (item.status === "cancelled" || item.status === "ended") {
      return true;
    }

    if (item.expires_at) {
      const endTs = new Date(item.expires_at).getTime();
      if (!Number.isNaN(endTs) && endTs <= Date.now()) {
        return true;
      }
    }

    return false;
  }, [item]);

  const isFull = useMemo(() => {
    if (!item?.spots_total) return false;
    return participants.length >= item.spots_total;
  }, [participants.length, item?.spots_total]);

  const canJoin = useMemo(() => {
    if (!item) return false;
    if (hasJoined) return false;
    if (isEnded) return false;
    if (item.status === "full") return false;
    if (isFull) return false;
    return true;
  }, [item, hasJoined, isEnded, isFull]);

  /* =========================
     JOIN
  ========================= */
  const handleJoin = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (!item?.id || joinBusy || !canJoin) return;

    try {
      setJoinBusy(true);
      setErrorMsg("");

      const { error } = await supabase.from("going_now_participants").insert({
        going_now_id: item.id,
        user_id: user.id,
        status: "joined",
        joined_at: new Date().toISOString(),
      });

      if (error) {
        console.error("join error:", error);
        setErrorMsg(error.message || "Could not join.");
        return;
      }

      const freshItem = await loadItem(item.id);
      await loadParticipants(item.id, freshItem?.user_id || null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not join.");
    } finally {
      setJoinBusy(false);
    }
  };

  /* =========================
     LEAVE
  ========================= */
  const handleLeave = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (!item?.id || leaveBusy || !hasJoined) return;

    try {
      setLeaveBusy(true);
      setErrorMsg("");

      const { error } = await supabase
        .from("going_now_participants")
        .delete()
        .eq("going_now_id", item.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("leave error:", error);
        setErrorMsg(error.message || "Could not leave.");
        return;
      }

      const freshItem = await loadItem(item.id);
      await loadParticipants(item.id, freshItem?.user_id || null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not leave.");
    } finally {
      setLeaveBusy(false);
    }
  };

  /* =========================
     CHAT
  ========================= */
  const openChat = () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (!hasJoined && !isOwner) {
      setErrorMsg("Join this live plan first to enter the chat.");
      return;
    }

    navigate(`/going-now/${id}/chat`);
  };

  /* =========================
     OPTIONAL HELPERS
  ========================= */
  const openCreatorProfile = () => {
    if (!item?.user_id) return;
    navigate(`/profile/${item.user_id}`);
  };

  const openParticipantProfile = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  /* =========================
     TEMP DEBUG UI
     (obriši kasnije kad budeš radio pravi UI)
  ========================= */
  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!item) {
    return <div style={{ padding: 24 }}>Not found.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>{item.title}</h1>

      <p>{item.location_text}</p>
      <p>Status: {item.status}</p>
      <p>Participants: {participants.length}</p>
      <p>Has joined: {hasJoined ? "yes" : "no"}</p>
      <p>Owner: {isOwner ? "yes" : "no"}</p>
      <p>Can join: {canJoin ? "yes" : "no"}</p>

      {errorMsg ? <p style={{ color: "red" }}>{errorMsg}</p> : null}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={handleJoin} disabled={!canJoin || joinBusy}>
          {joinBusy ? "Joining..." : "Join"}
        </button>

        <button onClick={handleLeave} disabled={!hasJoined || leaveBusy}>
          {leaveBusy ? "Leaving..." : "Leave"}
        </button>

        <button onClick={openChat}>Open chat</button>

        <button onClick={openCreatorProfile}>Creator profile</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Participants</h3>
        {participants.map((p) => (
          <div
            key={p.id}
            onClick={() => openParticipantProfile(p.user_id)}
            style={{ cursor: "pointer", marginBottom: 8 }}
          >
            {p?.profiles?.full_name ||
              p?.profiles?.username ||
              p.user_id}
          </div>
        ))}
      </div>
    </div>
  );
}