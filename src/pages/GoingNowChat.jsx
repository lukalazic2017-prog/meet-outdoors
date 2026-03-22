import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function GoingNowChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [item, setItem] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const listRef = useRef(null);

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

  const scrollToBottom = useCallback(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
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

      await loadMessages();

      if (!mounted) return;
      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [loadItem, loadMessages, loadParticipants, loadUser]);

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
        () => {
          loadMessages();
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

          if (!authUser || !itemData) return;

          const owner = authUser.id === itemData.user_id;
          const joined = participantRows.some((p) => p.user_id === authUser.id);

          setAccessDenied(!owner && !joined);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelMessages);
      supabase.removeChannel(channelParticipants);
    };
  }, [id, loadItem, loadMessages, loadParticipants, loadUser]);

  const canSend = useMemo(() => {
    return !!user && text.trim().length > 0 && !sending && !accessDenied;
  }, [user, text, sending, accessDenied]);

  const sendMessage = async () => {
    if (!canSend) return;

    try {
      setSending(true);
      setErrorMsg("");

      const { error } = await supabase.from("going_now_messages").insert({
        going_now_id: id,
        user_id: user.id,
        text: text.trim(),
      });

      if (error) {
        console.error("send message error:", error);
        setErrorMsg(error.message || "Could not send message.");
        return;
      }

      setText("");
      await loadMessages();
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading chat...</div>;
  }

  if (accessDenied) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Chat locked</h2>
        <p>You must be joined to this live plan to access chat.</p>
        <button onClick={() => navigate(`/going-now/${id}`)}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{item?.title || "Going Now Chat"}</h2>
      <p>Participants: {participants.length}</p>

      {errorMsg ? <p>{errorMsg}</p> : null}

      <div
        ref={listRef}
        style={{
          border: "1px solid #ccc",
          padding: 12,
          height: 300,
          overflowY: "auto",
          marginBottom: 12,
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 10 }}>
              <strong>{msg.user_id}</strong>: {msg.text}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={{ flex: 1 }}
        />
        <button onClick={sendMessage} disabled={!canSend}>
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}