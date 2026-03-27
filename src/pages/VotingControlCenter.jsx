import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const COLORS = {
  bg: "#071311",
  card: "rgba(8,18,18,0.74)",
  cardSoft: "rgba(8,18,18,0.62)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderStrong: "1px solid rgba(132,255,217,0.18)",
  text: "#f4fff9",
  textSoft: "rgba(230,255,245,0.74)",
  textMuted: "rgba(210,255,240,0.62)",
};

function formatNumber(n) {
  return new Intl.NumberFormat("sr-RS").format(Number(n || 0));
}

function formatCountdown(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const onResize = () =>
      setIsMobile(typeof window !== "undefined" ? window.innerWidth <= breakpoint : false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

function StatusBadge({ status }) {
  const map = {
    scheduled: {
      label: "Zakazano",
      bg: "rgba(255,255,255,0.08)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.12)",
    },
    active: {
      label: "Aktivno",
      bg: "rgba(132,255,217,0.16)",
      color: "#9bffd7",
      border: "1px solid rgba(132,255,217,0.22)",
    },
    finished: {
      label: "Završeno",
      bg: "rgba(255,120,120,0.12)",
      color: "#ffd0d0",
      border: "1px solid rgba(255,120,120,0.20)",
    },
  };

  const active = map[status] || map.scheduled;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: active.bg,
        color: active.color,
        border: active.border,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <span>{active.label}</span>
    </div>
  );
}

function StatCard({ label, value, sub, isMobile }) {
  return (
    <div
      style={{
        background: COLORS.cardSoft,
        border: COLORS.border,
        borderRadius: isMobile ? 18 : 24,
        padding: isMobile ? 14 : 18,
        minHeight: isMobile ? 96 : 112,
        backdropFilter: "blur(16px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: COLORS.textMuted,
          marginBottom: 8,
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: isMobile ? 22 : 28,
          fontWeight: 950,
          color: "#f5fffb",
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>

      {sub ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: COLORS.textSoft,
            lineHeight: 1.5,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function RowBar({ percent }) {
  return (
    <div
      style={{
        width: "100%",
        height: 10,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, Number(percent || 0)))}%`,
          height: "100%",
          borderRadius: 999,
          background: "linear-gradient(90deg, #77ffd3 0%, #75eaff 50%, #89b8ff 100%)",
        }}
      />
    </div>
  );
}

export default function VotingControlCenter() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(900);

  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState(null);
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setErrorMsg("");

      const [
        { data: pollData, error: pollError },
        { data: summaryData, error: summaryError },
        { data: resultsData, error: resultsError },
      ] = await Promise.all([
        supabase
          .from("city_poll_status")
          .select("*")
          .order("starts_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("city_vote_summary").select("*").limit(1).maybeSingle(),
        supabase.from("city_vote_results").select("*").order("rank", { ascending: true }),
      ]);

      if (pollError) throw pollError;
      if (summaryError && summaryError.code !== "PGRST116") throw summaryError;
      if (resultsError) throw resultsError;

      setPoll(pollData || null);
      setSummary(summaryData || null);
      setResults(resultsData || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Greška pri učitavanju statistike.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!poll?.seconds_left) return undefined;

    const timer = setInterval(() => {
      setPoll((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          seconds_left: Math.max(0, Number(prev.seconds_left || 0) - 1),
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [poll?.id, poll?.seconds_left]);

  useEffect(() => {
    const channel = supabase
      .channel("voting-control-center")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "city_votes" },
        () => {
          loadStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "city_poll" },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStats]);

  const pollStatusText = useMemo(() => {
    if (!poll) return "Nema glasanja";

    if (poll.status === "scheduled") {
      return `Počinje za ${formatCountdown(poll.seconds_left)}`;
    }

    if (poll.status === "active") {
      return `Traje još ${formatCountdown(poll.seconds_left)}`;
    }

    return "Glasanje je završeno";
  }, [poll]);

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (results || []).filter((item) =>
      !q ? true : String(item.name || "").toLowerCase().includes(q)
    );
  }, [results, search]);

  const top3 = useMemo(() => filteredResults.slice(0, 3), [filteredResults]);
  const top10 = useMemo(() => filteredResults.slice(0, 10), [filteredResults]);

  const averageVotes = useMemo(() => {
    if (!results.length) return 0;
    return Math.round((Number(summary?.total_votes || 0) / results.length) * 10) / 10;
  }, [results.length, summary?.total_votes]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          padding: 24,
        }}
      >
        <div
          style={{
            padding: 22,
            borderRadius: 24,
            background: "rgba(255,255,255,0.04)",
            border: COLORS.border,
            fontWeight: 800,
          }}
        >
          Učitavanje statistike...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(3,11,10,0.86), rgba(4,9,12,0.97)), #071311",
        color: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: isMobile ? "16px 14px 44px" : "28px 18px 60px",
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: isMobile ? 24 : 30,
            background: "linear-gradient(145deg, rgba(8,24,18,0.86), rgba(7,17,13,0.94))",
            border: COLORS.borderStrong,
            boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
            padding: isMobile ? 18 : 24,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(132,255,217,0.10)",
                  border: "1px solid rgba(132,255,217,0.18)",
                  color: "#9bffd7",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Voting control center
              </div>

              <div
                style={{
                  fontSize: isMobile ? 30 : 46,
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: "-0.05em",
                  marginBottom: 10,
                }}
              >
                Praćenje glasanja uživo
              </div>

              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: COLORS.textSoft,
                  maxWidth: 760,
                }}
              >
                Ovde pratiš status glasanja, countdown, vodeći grad i top listu u realnom vremenu.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <StatusBadge status={poll?.status} />
              <button
                type="button"
                onClick={loadStats}
                style={{
                  padding: "12px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: 14,
                  color: "#fff",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                Osveži
              </button>
              <button
                type="button"
                onClick={() => navigate("/vote-city")}
                style={{
                  padding: "12px 16px",
                  borderRadius: 16,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: 14,
                  color: "#04110d",
                  background: "linear-gradient(135deg, #84ffd9, #73e4ff)",
                }}
              >
                Otvori glasanje
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            <StatCard
              label={poll?.status === "scheduled" ? "Početak" : "Status"}
              value={pollStatusText}
              sub={
                poll?.status === "scheduled"
                  ? poll?.starts_at
                    ? `Start: ${new Date(poll.starts_at).toLocaleString()}`
                    : null
                  : poll?.ends_at
                  ? `Kraj: ${new Date(poll.ends_at).toLocaleString()}`
                  : null
              }
              isMobile={isMobile}
            />

            <StatCard
              label="Ukupno glasova"
              value={formatNumber(summary?.total_votes || 0)}
              sub="Ukupan broj glasova u ovom krugu"
              isMobile={isMobile}
            />

            <StatCard
              label="Vodeći grad"
              value={summary?.leading_name || "—"}
              sub={
                summary?.leading_votes != null
                  ? `${formatNumber(summary.leading_votes)} glasova`
                  : "Još nema glasova"
              }
              isMobile={isMobile}
            />

            <StatCard
              label="Gradova u igri"
              value={formatNumber(results.length)}
              sub={lastRefresh ? `Osveženo: ${lastRefresh.toLocaleTimeString()}` : "—"}
              isMobile={isMobile}
            />
          </div>
        </div>

        {errorMsg ? (
          <div
            style={{
              marginBottom: 14,
              background: "rgba(255,85,85,0.12)",
              border: "1px solid rgba(255,120,120,0.24)",
              color: "#ffd5d5",
              padding: "14px 16px",
              borderRadius: 18,
              fontWeight: 700,
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <StatCard
            label="Top 1"
            value={top3[0]?.name || "—"}
            sub={top3[0] ? `${formatNumber(top3[0].votes)} glasova` : "Još nema podataka"}
            isMobile={isMobile}
          />
          <StatCard
            label="Top 2"
            value={top3[1]?.name || "—"}
            sub={top3[1] ? `${formatNumber(top3[1].votes)} glasova` : "Još nema podataka"}
            isMobile={isMobile}
          />
          <StatCard
            label="Prosek po gradu"
            value={formatNumber(averageVotes)}
            sub="Koliko glasova u proseku ima jedan grad"
            isMobile={isMobile}
          />
        </div>

        <div
          style={{
            background: "rgba(6,14,14,0.72)",
            border: COLORS.border,
            borderRadius: isMobile ? 24 : 30,
            padding: isMobile ? 14 : 20,
            backdropFilter: "blur(14px)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 950,
                  lineHeight: 1.05,
                  marginBottom: 6,
                }}
              >
                Top 10 gradova
              </div>

              <div style={{ fontSize: 14, color: COLORS.textSoft }}>
                Pregled vodećih gradova u realnom vremenu.
              </div>
            </div>

            <div
              style={{
                width: isMobile ? "100%" : 260,
                background: "rgba(8,18,18,0.82)",
                border: COLORS.border,
                borderRadius: 16,
                padding: "12px 14px",
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pretraži grad..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {top10.map((item, index) => (
              <div
                key={item.local_unit_id || item.id || index}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "56px 1fr auto" : "72px 1fr 180px auto",
                  gap: 12,
                  alignItems: "center",
                  padding: isMobile ? 14 : 16,
                  borderRadius: 20,
                  background:
                    index === 0
                      ? "linear-gradient(135deg, rgba(34,105,86,0.34), rgba(14,34,35,0.84))"
                      : COLORS.card,
                  border:
                    index === 0
                      ? "1px solid rgba(116,255,210,0.28)"
                      : COLORS.border,
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 950,
                    color: index === 0 ? "#9bffd7" : "#fff",
                  }}
                >
                  #{item.rank || index + 1}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: isMobile ? 16 : 18,
                      fontWeight: 900,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: COLORS.textSoft,
                    }}
                  >
                    {formatNumber(item.votes || 0)} glasova
                  </div>
                </div>

                {!isMobile ? <RowBar percent={item.percent || 0} /> : null}

                <div
                  style={{
                    fontSize: isMobile ? 15 : 17,
                    fontWeight: 900,
                    color: "#9cefff",
                    minWidth: 56,
                    textAlign: "right",
                  }}
                >
                  {Number(item.percent || 0)}%
                </div>
              </div>
            ))}

            {!top10.length ? (
              <div
                style={{
                  padding: "24px 10px 6px",
                  textAlign: "center",
                  color: "rgba(230,255,245,0.68)",
                  fontWeight: 700,
                }}
              >
                Nema rezultata za prikaz.
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            background: "rgba(6,14,14,0.72)",
            border: COLORS.border,
            borderRadius: isMobile ? 24 : 30,
            padding: isMobile ? 14 : 20,
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 950,
              marginBottom: 8,
            }}
          >
            Napomena
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: COLORS.textSoft,
            }}
          >
            Ovaj panel prati glasanje uživo iz Supabase-a. Reach sa Instagrama/TikToka i novi nalozi
            ne mogu bezbedno direktno iz client-side React koda. Za to koristi Instagram Insights,
            TikTok Analytics, Vercel Analytics i poseban secure admin endpoint za auth.users.
          </div>
        </div>
      </div>
    </div>
  );
}
