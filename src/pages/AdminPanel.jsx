import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [applications, setApplications] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(auth.user);

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .single();

    setProfile(prof);

    if (prof?.role === "ADMIN") {
      loadApplications();
    }

    setLoading(false);
  }

  async function login(e) {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    init();
  }

  async function loadApplications() {
    const { data } = await supabase
      .from("creator_applications")
      .select(`
        id,
        full_name,
        bio,
        experience,
        status,
        profiles:user_id (
          email
        )
      `)
      .order("created_at", { ascending: false });

    setApplications(data || []);
  }

  async function approve(id) {
    await supabase
      .from("creator_applications")
      .update({
        status: "APPROVED",
        reviewed_at: new Date(),
      })
      .eq("id", id);

    loadApplications();
  }

  async function reject(id) {
    await supabase
      .from("creator_applications")
      .update({
        status: "REJECTED",
        reviewed_at: new Date(),
      })
      .eq("id", id);

    loadApplications();
  }

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div>
        <h2>Admin Login</h2>

        <form onSubmit={login}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <br />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <br />

          <button>Login</button>
        </form>

        {error && <p>{error}</p>}
      </div>
    );
  }

  if (profile?.role !== "ADMIN") {
    return <div>⛔ Access denied</div>;
  }

  return (
    <div>
      <h1>ADMIN PANEL</h1>

      <h2>Creator Applications</h2>

      {applications.map((a) => (
        <div key={a.id} style={{ border: "1px solid gray", margin: 10, padding: 10 }}>
          <b>{a.full_name}</b>
          <div>{a.profiles?.email}</div>
          <p>{a.bio}</p>
          <p>Status: {a.status}</p>

          {a.status === "PENDING" && (
            <div>
              <button onClick={() => approve(a.id)}>Approve</button>
              <button onClick={() => reject(a.id)}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
