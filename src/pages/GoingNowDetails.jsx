import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function GoingNowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [item, setItem] = useState(null);
  const [participants, setParticipants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [joinBusy, setJoinBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ================= LOAD USER ================= */

  const loadUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    setUser(authUser || null);
    return authUser;
  }, []);

  /* ================= LOAD ITEM ================= */

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

  /* ================= LOAD PARTICIPANTS ================= */

  const loadParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from("going_now_participants")
      .select("*")
      .eq("going_now_id", id)
      .eq("status", "joined");

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      return [];
    }

    setParticipants(data || []);
    return data || [];
  }, [id]);

  /* ================= REFRESH ================= */

  const refresh = useCallback(async () => {
    await loadUser();
    await loadItem();
    await loadParticipants();
  }, [loadUser, loadItem, loadParticipants]);

  /* ================= INITIAL LOAD ================= */

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

  /* ================= REALTIME ================= */

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
        () => {
          loadItem();
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
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [id, loadItem, loadParticipants]);

  /* ================= DERIVED ================= */

  const hasJoined = useMemo(() => {
    if (!user) return false;
    return participants.some((p) => p.user_id === user.id);
  }, [participants, user]);

  const isOwner = useMemo(() => {
    if (!user || !item) return false;
    return item.user_id === user.id;
  }, [user, item]);

  /* ================= JOIN ================= */

  const handleJoin = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setJoinBusy(true);
      setErrorMsg("");

      await supabase
        .from("going_now_participants")
        .upsert(
          {
            going_now_id: id,
            user_id: user.id,
            status: "joined",
          },
          {
            onConflict: "going_now_id,user_id",
          }
        );

      await loadParticipants();
    } catch (err) {
      console.error(err);
      setErrorMsg("Join failed");
    } finally {
      setJoinBusy(false);
    }
  };

  /* ================= LEAVE ================= */

  const handleLeave = async () => {
    if (!user) return;

    try {
      setLeaveBusy(true);

      await supabase
        .from("going_now_participants")
        .delete()
        .eq("going_now_id", id)
        .eq("user_id", user.id);

      await loadParticipants();
    } catch (err) {
      console.error(err);
      setErrorMsg("Leave failed");
    } finally {
      setLeaveBusy(false);
    }
  };

  /* ================= CHAT ================= */

  const openChat = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    navigate(`/going-now/${id}/chat`);
  };

  /* ================= UI ================= */

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!item) return <div style={{ padding: 20 }}>Not found</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{item.title}</h2>

      <p>participants: {participants.length}</p>
      <p>joined: {hasJoined ? "yes" : "no"}</p>
      <p>owner: {isOwner ? "yes" : "no"}</p>

      {errorMsg && <p>{errorMsg}</p>}

      <div style={{ display: "flex", gap: 10 }}>
        {!isOwner ? (
          !hasJoined ? (
            <button onClick={handleJoin} disabled={joinBusy}>
              {joinBusy ? "Joining..." : "Join"}
            </button>
          ) : (
            <button onClick={handleLeave} disabled={leaveBusy}>
              {leaveBusy ? "Leaving..." : "Leave"}
            </button>
          )
        ) : null}

        <button onClick={openChat}>
          Chat
        </button>

        {isOwner && (
          <button onClick={() => navigate(`/going-now/${id}/edit`)}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}