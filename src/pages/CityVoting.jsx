import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const FALLBACK_HERO = "/cities/beograd.jpg";
const FALLBACK_CITY = "/cities/default.jpg";

const COLORS = {
  bg: "#071311",
  card: "rgba(8,18,18,0.74)",
  cardSoft: "rgba(8,18,18,0.62)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderStrong: "1px solid rgba(132,255,217,0.18)",
  textSoft: "rgba(230,255,245,0.74)",
  textMuted: "rgba(210,255,240,0.62)",
};

function formatNumber(n) {
  return new Intl.NumberFormat("sr-RS").format(Number(n || 0));
}

function formatCompactNumber(n) {
  return new Intl.NumberFormat("sr-RS", { notation: "compact" }).format(Number(n || 0));
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
  const getValue = useCallback(
    () => (typeof window !== "undefined" ? window.innerWidth <= breakpoint : false),
    [breakpoint]
  );

  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const onResize = () => setIsMobile(getValue());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getValue]);

  return isMobile;
}

function normalizeCityFileName(name = "") {
  return name
    .toLowerCase()
    .trim()
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "dj")
    .replace(/\s+/g, "-");
}

function getCityImage(item) {
  if (item?.image_url) return item.image_url;
  const file = normalizeCityFileName(item?.name || "");
  return file ? `/cities/${file}.jpg` : FALLBACK_CITY;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function fallbackAvatarGradient(index = 0) {
  const gradients = [
    "linear-gradient(135deg, #84ffd9, #73e4ff)",
    "linear-gradient(135deg, #ffd684, #ff9f73)",
    "linear-gradient(135deg, #b584ff, #73d8ff)",
  ];
  return gradients[index % gradients.length];
}

function getRankBadge(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function ImageLayer({ src, alt = "", overlay = "default" }) {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_CITY);

  useEffect(() => {
    setImageSrc(src || FALLBACK_CITY);
  }, [src]);

  const overlayBackground =
    overlay === "hero"
      ? "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.52) 42%, rgba(0,0,0,0.92) 100%)"
      : "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.22) 30%, rgba(0,0,0,0.86) 100%)";

  return (
    <>
      <img
        src={imageSrc}
        alt={alt}
        onError={() => {
          if (imageSrc !== FALLBACK_CITY) setImageSrc(FALLBACK_CITY);
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: overlayBackground,
        }}
      />
    </>
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
        backdropFilter: "blur(16px)",
        minHeight: isMobile ? 96 : 112,
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(210,255,240,0.72)",
          marginBottom: 8,
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: isMobile ? 22 : 28,
          fontWeight: 900,
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
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function AvatarStack({ cityName, avatars = [], votes = 0 }) {
  const normalized = Array.isArray(avatars) ? avatars.filter(Boolean).slice(0, 3) : [];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", paddingLeft: 8 }}>
        {normalized.length
          ? normalized.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={src}
                alt=""
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(8,18,18,0.96)",
                  marginLeft: index === 0 ? 0 : -8,
                  background: "#091615",
                }}
              />
            ))
          : [0, 1, 2].map((index) => (
              <div
                key={index}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  border: "2px solid rgba(8,18,18,0.96)",
                  marginLeft: index === 0 ? 0 : -8,
                  background: fallbackAvatarGradient(index),
                  color: "#052119",
                  fontWeight: 900,
                  fontSize: 10,
                }}
              >
                {getInitials(cityName)}
              </div>
            ))}
      </div>

      <div style={{ fontSize: 13, color: "rgba(232,255,247,0.84)", fontWeight: 700 }}>
        <span style={{ color: "#fff", fontWeight: 900 }}>{formatCompactNumber(votes)}</span> glasalo
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, fullWidth = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "14px 16px",
        borderRadius: 16,
        border: "none",
        width: fullWidth ? "100%" : "auto",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 900,
        fontSize: 15,
        color: "#04110d",
        background: disabled
          ? "rgba(255,255,255,0.14)"
          : "linear-gradient(135deg, #84ffd9, #73e4ff)",
        boxShadow: disabled ? "none" : "0 12px 30px rgba(118,255,216,0.22)",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, disabled, fullWidth = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "14px 16px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        width: fullWidth ? "100%" : "auto",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 800,
        fontSize: 15,
        color: "#fff",
        background: "rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </button>
  );
}

function SponsorChip({ icon, title, sub }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 18,
        background: "rgba(8,18,18,0.46)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, rgba(132,255,217,0.24), rgba(115,228,255,0.20))",
          border: "1px solid rgba(255,255,255,0.10)",
          fontSize: 20,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 14, color: "#fff" }}>{title}</div>
        <div style={{ fontSize: 12, color: COLORS.textSoft }}>{sub}</div>
      </div>
    </div>
  );
}

function PrizeCard({ icon, title, sub }) {
  return (
    <div
      style={{
        background: "rgba(8,18,18,0.42)",
        border: COLORS.borderStrong,
        borderRadius: 22,
        padding: 16,
        backdropFilter: "blur(14px)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          fontSize: 22,
          marginBottom: 12,
          background: "linear-gradient(135deg, rgba(132,255,217,0.22), rgba(115,228,255,0.16))",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: COLORS.textSoft }}>{sub}</div>
    </div>
  );
}

function SearchBar({ value, onChange, isMobile, total, showClear }) {
  return (
    <div style={{ position: "sticky", top: 10, zIndex: 15, marginBottom: 16 }}>
      <div
        style={{
          background: "rgba(8,18,18,0.82)",
          border: COLORS.border,
          borderRadius: 20,
          padding: isMobile ? 12 : 14,
          backdropFilter: "blur(16px)",
          boxShadow: "0 16px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 16, opacity: 0.9 }}>⌕</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Pretraži grad ili opštinu..."
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "#fff",
              fontSize: isMobile ? 16 : 15,
              fontWeight: 700,
            }}
          />
          {showClear ? (
            <button
              onClick={() => onChange("")}
              style={{
                border: "none",
                background: "transparent",
                color: "#9cefff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Obriši
            </button>
          ) : null}
          <div
            style={{
              whiteSpace: "nowrap",
              fontSize: 12,
              color: "rgba(223,255,246,0.76)",
              fontWeight: 800,
            }}
          >
            {total} mesta
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection({ leader, poll, pollActive, isMobile, onScrollToVote }) {
  const heroImage = leader ? getCityImage(leader) : FALLBACK_HERO;
  const leaderName = leader?.name || "Beograd";
  const leaderVotes = leader?.votes || 0;
  const leaderPercent = leader?.percent || 0;
  const leaderAvatars = leader?.avatars || leader?.voter_avatars || leader?.profile_avatars || [];

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? 28 : 36,
        minHeight: isMobile ? 690 : 620,
        border: COLORS.border,
        boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
        marginBottom: 22,
      }}
    >
      <ImageLayer src={heroImage} alt={leaderName} overlay="hero" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 18%, rgba(99,255,214,0.20), transparent 32%), radial-gradient(circle at 82% 18%, rgba(85,186,255,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(122,255,203,0.12), transparent 28%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: isMobile ? 690 : 620,
          padding: isMobile ? "22px 16px" : "34px 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 999,
                background: "rgba(113,255,210,0.12)",
                border: "1px solid rgba(113,255,210,0.20)",
                color: "#9bffd7",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                backdropFilter: "blur(10px)",
              }}
            >
              MeetOutdoors × Skydiving Serbia, Paraćin
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 999,
                background: "linear-gradient(135deg, rgba(132,255,217,0.95), rgba(115,228,255,0.95))",
                color: "#03231a",
                fontSize: 12,
                fontWeight: 950,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: "0 0 34px rgba(115,228,255,0.22)",
              }}
            >
              🏆 U vođstvu: {leaderName}
            </div>
          </div>

          <div
            style={{
              fontSize: isMobile ? 38 : 72,
              fontWeight: 950,
              lineHeight: 0.97,
              maxWidth: 960,
              letterSpacing: "-0.05em",
              marginBottom: 16,
              textTransform: "uppercase",
              textShadow: "0 0 40px rgba(0,255,195,0.18), 0 14px 32px rgba(0,0,0,0.62)",
            }}
          >
            Glasaj za svoj grad.
            <br />
            Osvoji nezaboravno iskustvo.
          </div>

          <div
            style={{
              maxWidth: 930,
              fontSize: isMobile ? 15 : 18,
              lineHeight: 1.78,
              color: "rgba(238,255,249,0.94)",
              marginBottom: 20,
              textShadow: "0 6px 14px rgba(0,0,0,0.36)",
            }}
          >
            Pozadina prikazuje <strong>grad koji trenutno vodi</strong>. Grad sa najviše glasova dobija <strong>IZAĐI NAPOLJE EVENT #1</strong> — izlazak u prirodu kroz šetnju do šume, jezera, vidikovca, vrha ili druge prirodne lokacije koju ćemo prilagoditi pobedničkom gradu. Učesnici eventa ulaze u izbor za <strong>3 nagrade za 3 osobe</strong>: glavna nagrada je <strong>tandem skok padobranom</strong>, a još dve nagrade su <strong>let avionom</strong>.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <PrizeCard
              icon="🏞️"
              title="Pobednički grad dobija event"
              sub="Grad sa najviše glasova dobija IZAĐI NAPOLJE EVENT #1 i posebno osmišljeno iskustvo u prirodi."
            />
            <PrizeCard
              icon="🪂"
              title="Glavna nagrada"
              sub="Jedan učesnik pobedničkog eventa dobija tandem skok padobranom u partnerstvu sa Skydiving Serbia."
            />
            <PrizeCard
              icon="✈️"
              title="Još dve nagrade"
              sub="Dve dodatne osobe osvajaju let avionom. Ukupno 3 nagrade za 3 osobe."
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, max-content))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <SponsorChip
              icon="🐬"
              title="Radio Delfin, Prokuplje 100.2 MHz"
              sub="Medijski partner koji pojačava priču."
            />
            <SponsorChip
              icon="🚗"
              title="Auto Mirko, Prokuplje"
              sub="Sponzor koji vozi ovu energiju napred."
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <PrimaryButton onClick={onScrollToVote}>Glasaj odmah</PrimaryButton>
            <SecondaryButton>
              {pollActive ? `Glasanje traje još ${formatCountdown(poll?.seconds_left)}` : "Glasanje je završeno"}
            </SecondaryButton>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 18,
              background: "rgba(8,18,18,0.46)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(10px)",
              color: "rgba(240,255,250,0.92)",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Tvoj glas. Tvoj grad. Tvoj trenutak za poletanje.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
            gap: 14,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              background: "rgba(8,18,18,0.46)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 24,
              padding: isMobile ? 14 : 18,
              backdropFilter: "blur(14px)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#9bffd7",
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              Grad u pozadini trenutno vodi
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: isMobile ? 26 : 34,
                    fontWeight: 950,
                    lineHeight: 1.02,
                    marginBottom: 6,
                  }}
                >
                  {leaderName}
                </div>
                <div
                  style={{
                    color: COLORS.textSoft,
                    lineHeight: 1.6,
                    fontSize: 14,
                    maxWidth: 520,
                  }}
                >
                  Ovaj grad trenutno ima najviše glasova, zato je upravo njegova slika u hero sekciji.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <AvatarStack cityName={leaderName} avatars={leaderAvatars} votes={leaderVotes} />
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 16,
                    background: "rgba(111,255,209,0.12)",
                    border: "1px solid rgba(111,255,209,0.20)",
                    color: "#9bffd7",
                    fontWeight: 900,
                  }}
                >
                  {leaderPercent}% svih glasova
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(8,18,18,0.46)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 24,
              padding: isMobile ? 14 : 18,
              backdropFilter: "blur(14px)",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900 }}>
              <span>🎯</span>
              <span>Kako funkcioniše</span>
            </div>
            <div style={{ color: COLORS.textSoft, fontSize: 14, lineHeight: 1.65 }}>
              1. Glasaj za svoj grad.
              <br />
              2. Grad sa najviše glasova dobija event.
              <br />
              3. Učesnici eventa ulaze u izbor za 3 nagrade.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ item, featured = false, isMobile }) {
  if (!item) return null;
  const avatars = item?.avatars || item?.voter_avatars || item?.profile_avatars || [];

  return (
    <div
      style={{
        overflow: "hidden",
        borderRadius: isMobile ? 20 : 24,
        background: featured ? "linear-gradient(135deg, rgba(16,40,34,0.92), rgba(11,23,25,0.88))" : COLORS.card,
        border: featured ? COLORS.borderStrong : COLORS.border,
        boxShadow: featured ? "0 16px 40px rgba(91,255,202,0.12)" : "none",
      }}
    >
      <div style={{ position: "relative", height: featured ? (isMobile ? 136 : 164) : isMobile ? 104 : 124 }}>
        <ImageLayer src={getCityImage(item)} alt={item.name} />
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: featured ? 30 : 26, marginBottom: 8 }}>{getRankBadge(item.rank)}</div>
        <div style={{ fontSize: featured ? (isMobile ? 22 : 26) : 20, fontWeight: 950, marginBottom: 8 }}>
          {item.name}
        </div>
        <AvatarStack cityName={item.name} avatars={avatars} votes={item.votes} />
        <div style={{ marginTop: 12, color: "#9bffd7", fontSize: featured ? 26 : 22, fontWeight: 900 }}>
          {item.percent}%
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ authUser, isMyVote, busy, pollActive, onVote, onRemove, navigate, fullWidth }) {
  if (!authUser) {
    return (
      <PrimaryButton fullWidth={fullWidth} onClick={() => navigate("/login?redirect=/vote-city")}>
        Prijavi se za glasanje
      </PrimaryButton>
    );
  }

  return (
    <>
      <PrimaryButton fullWidth={fullWidth} disabled={!pollActive || busy} onClick={onVote}>
        {busy ? "Čuvanje..." : isMyVote ? "Glasato" : "Glasaj"}
      </PrimaryButton>
      {isMyVote ? (
        <SecondaryButton fullWidth={fullWidth} disabled={!pollActive || busy} onClick={onRemove}>
          Ukloni glas
        </SecondaryButton>
      ) : null}
    </>
  );
}

function MobileCityCard({ item, isMyVote, pollActive, busyCityId, onVote, onRemove, authUser, navigate }) {
  const rowId = item.local_unit_id || item.city_id || item.id;
  const percent = Math.max(0, Math.min(100, Number(item.percent || 0)));
  const avatars = item.avatars || item.voter_avatars || item.profile_avatars || [];
  const busy = busyCityId === rowId;

  return (
    <div
      style={{
        overflow: "hidden",
        background: isMyVote ? "linear-gradient(135deg, rgba(34,105,86,0.40), rgba(14,34,35,0.86))" : "rgba(8,18,18,0.78)",
        border: isMyVote ? "1px solid rgba(116,255,210,0.34)" : COLORS.border,
        borderRadius: 24,
        boxShadow: isMyVote ? "0 16px 34px rgba(63,255,191,0.12)" : "0 10px 28px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ position: "relative", height: 230 }}>
        <ImageLayer src={getCityImage(item)} alt={item.name} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <div
              style={{
                padding: "7px 10px",
                borderRadius: 999,
                background: "rgba(8,18,18,0.56)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontWeight: 900,
                fontSize: 13,
                color: "#fff",
                backdropFilter: "blur(10px)",
              }}
            >
              {getRankBadge(item.rank)}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {item.is_leading ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(111,255,209,0.18)",
                    color: "#9bffd7",
                    border: "1px solid rgba(111,255,209,0.22)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  Vodi
                </span>
              ) : null}
              {item.rank <= 3 ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(117,234,255,0.14)",
                    color: "#9cefff",
                    border: "1px solid rgba(117,234,255,0.18)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  U vrhu
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 31,
                lineHeight: 1.02,
                fontWeight: 950,
                color: "#fff",
                textShadow: "0 8px 20px rgba(0,0,0,0.38)",
                marginBottom: 8,
              }}
            >
              {item.name}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {isMyVote ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.14)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  Tvoj glas
                </span>
              ) : null}

              <span
                style={{
                  fontSize: 13,
                  color: "rgba(236,255,249,0.92)",
                  fontWeight: 800,
                  textShadow: "0 4px 12px rgba(0,0,0,0.32)",
                }}
              >
                {formatNumber(item.votes)} glasova • {item.percent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <AvatarStack cityName={item.name} avatars={avatars} votes={item.votes} />
        <div
          style={{
            marginTop: 12,
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, #77ffd3 0%, #75eaff 50%, #89b8ff 100%)",
              boxShadow: "0 0 18px rgba(122,255,218,0.32)",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMyVote && authUser ? "1fr 1fr" : "1fr",
            gap: 10,
            marginTop: 14,
          }}
        >
          <ActionButtons
            authUser={authUser}
            isMyVote={isMyVote}
            busy={busy}
            pollActive={pollActive}
            onVote={() => onVote(rowId)}
            onRemove={onRemove}
            navigate={navigate}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}

function DesktopRow({ item, isMyVote, pollActive, busyCityId, onVote, onRemove, authUser, navigate }) {
  const rowId = item.local_unit_id || item.city_id || item.id;
  const percent = Math.max(0, Math.min(100, Number(item.percent || 0)));
  const avatars = item.avatars || item.voter_avatars || item.profile_avatars || [];
  const busy = busyCityId === rowId;

  return (
    <div
      style={{
        overflow: "hidden",
        background: isMyVote ? "linear-gradient(135deg, rgba(34,105,86,0.40), rgba(14,34,35,0.86))" : COLORS.card,
        border: isMyVote ? "1px solid rgba(116,255,210,0.34)" : COLORS.border,
        borderRadius: 22,
        padding: 16,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "178px 1fr auto", gap: 16, alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            height: 118,
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <ImageLayer src={getCityImage(item)} alt={item.name} />
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(8,18,18,0.56)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontWeight: 900,
              fontSize: 13,
              color: "#fff",
            }}
          >
            {getRankBadge(item.rank)}
          </div>

          <div
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 10,
              color: "#fff",
              fontWeight: 900,
              fontSize: 20,
              textShadow: "0 8px 18px rgba(0,0,0,0.36)",
            }}
          >
            {item.name}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {item.is_leading ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(111,255,209,0.18)",
                  color: "#9bffd7",
                  border: "1px solid rgba(111,255,209,0.22)",
                }}
              >
                Vodi
              </span>
            ) : null}
            {item.rank <= 3 ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(117,234,255,0.14)",
                  color: "#9cefff",
                  border: "1px solid rgba(117,234,255,0.18)",
                }}
              >
                U vrhu
              </span>
            ) : null}
            {isMyVote ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.10)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Tvoj glas
              </span>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              fontSize: 14,
              color: "rgba(226,255,246,0.76)",
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            <span>{formatNumber(item.votes)} glasova</span>
            <span>{item.percent}%</span>
            <span>{item.rank === 1 ? "Prvo mesto" : `Mesto #${item.rank}`}</span>
          </div>

          <AvatarStack cityName={item.name} avatars={avatars} votes={item.votes} />

          <div
            style={{
              marginTop: 12,
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, #77ffd3 0%, #75eaff 50%, #89b8ff 100%)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <ActionButtons
            authUser={authUser}
            isMyVote={isMyVote}
            busy={busy}
            pollActive={pollActive}
            onVote={() => onVote(rowId)}
            onRemove={onRemove}
            navigate={navigate}
          />
        </div>
      </div>
    </div>
  );
}

export default function CityVoting() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(900);

  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [search, setSearch] = useState("");
  const [busyCityId, setBusyCityId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthUser(data?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

      const loadAll = useCallback(async () => {
  try {
    setErrorMsg("");
    setLoading(true);

    const [
      { data: pollData, error: pollError },
      { data: resultsData, error: resultsError },
      { data: summaryData, error: summaryError },
      { data: myVoteData, error: myVoteError },
    ] = await Promise.all([
      supabase
        .from("city_poll_status")
        .select("*")
        .eq("status", "active")
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("city_vote_results")
        .select("*")
        .order("rank", { ascending: true }),
      supabase
        .from("city_vote_summary")
        .select("*")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("current_user_vote")
        .select("*")
        .maybeSingle(),
    ]);

    if (pollError) throw pollError;
    if (resultsError) throw resultsError;
    if (summaryError && summaryError.code !== "PGRST116") throw summaryError;
    if (myVoteError && myVoteError.code !== "PGRST116") throw myVoteError;

    setPoll(pollData || null);
    setResults(resultsData || []);
    setSummary(summaryData || null);
    setMyVote(myVoteData || null);
  } catch (err) {
    console.error(err);
    setErrorMsg(err.message || "Došlo je do greške.");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!poll?.seconds_left) return undefined;

    const t = setInterval(() => {
      setPoll((prev) => {
        if (!prev) return prev;
        return { ...prev, seconds_left: Math.max(0, Number(prev.seconds_left || 0) - 1) };
      });
    }, 1000);

    return () => clearInterval(t);
  }, [poll?.seconds_left]);

  const pollActive = poll?.status === "active" && Number(poll?.seconds_left || 0) > 0;
  const myCityId = myVote?.local_unit_id || myVote?.city_id || null;

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (results || []).filter((item) =>
      !q ? true : String(item.name || "").toLowerCase().includes(q)
    );
  }, [results, search]);

  const top3 = useMemo(() => results.slice(0, 3), [results]);
  const leader = results[0] || null;

  const handleVote = useCallback(
    async (localUnitId) => {
      try {
        if (!authUser) {
          navigate("/login?redirect=/vote-city");
          return;
        }
        if (!poll?.id) return;

        setBusyCityId(localUnitId);
        setErrorMsg("");

        const { error } = await supabase.rpc("cast_or_change_vote", {
          p_poll_id: poll.id,
          p_local_unit_id: localUnitId,
        });

        if (error) throw error;
        await loadAll({ silent: true });
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "Čuvanje glasa nije uspelo.");
      } finally {
        setBusyCityId(null);
      }
    },
    [authUser, navigate, poll?.id, loadAll]
  );

  const handleRemoveVote = useCallback(async () => {
    try {
      if (!authUser) {
        navigate("/login?redirect=/vote-city");
        return;
      }
      if (!poll?.id) return;

      setBusyCityId("__remove__");
      setErrorMsg("");

      const { error } = await supabase.rpc("remove_my_vote", {
        p_poll_id: poll.id,
      });

      if (error) throw error;
      await loadAll({ silent: true });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Uklanjanje glasa nije uspelo.");
    } finally {
      setBusyCityId(null);
    }
  }, [authUser, navigate, poll?.id, loadAll]);

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
          Učitavanje glasanja...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, rgba(3,11,10,0.86), rgba(4,9,12,0.97)), #071311",
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
        <HeroSection
          leader={leader}
          poll={poll}
          pollActive={pollActive}
          isMobile={isMobile}
          onScrollToVote={() => {
            const el = document.getElementById("glasanje-lista");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <StatCard
            label="Vreme do kraja"
            value={pollActive ? formatCountdown(poll?.seconds_left) : "Završeno"}
            sub={poll?.ends_at ? `Kraj: ${new Date(poll.ends_at).toLocaleString()}` : null}
            isMobile={isMobile}
          />
          <StatCard
            label="Ukupno glasova"
            value={formatNumber(summary?.total_votes || results[0]?.total_votes || 0)}
            sub="Uživo pregled rezultata"
            isMobile={isMobile}
          />
          <StatCard
            label="Vodeći grad"
            value={summary?.leading_name || results[0]?.name || "—"}
            sub={
              summary?.leading_votes != null
                ? `${formatNumber(summary.leading_votes)} glasova`
                : "Još nema glasova"
            }
            isMobile={isMobile}
          />
          <StatCard
            label="Tvoj izbor"
            value={myVote?.city_name || "Još nisi glasao"}
            sub={
              myVote?.city_name
                ? "Možeš ukloniti ili promeniti glas"
                : authUser
                ? "Podrži jedno mesto"
                : "Prijavi se da glasaš"
            }
            isMobile={isMobile}
          />
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

        {top3.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1.15fr 1fr",
              gap: 14,
              marginBottom: 20,
              alignItems: isMobile ? "stretch" : "end",
            }}
          >
            <PodiumCard item={top3[1]} isMobile={isMobile} />
            <PodiumCard item={top3[0]} featured isMobile={isMobile} />
            <PodiumCard item={top3[2]} isMobile={isMobile} />
          </div>
        ) : null}

        <div
          id="glasanje-lista"
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
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
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
                Glasanje gradova
              </div>
              <div style={{ fontSize: 14, color: COLORS.textSoft }}>
                Podrži svoj grad i pomozi da baš on dobije IZAĐI NAPOLJE EVENT #1.
              </div>
            </div>

            {!authUser ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <PrimaryButton onClick={() => navigate("/login?redirect=/vote-city")}>
                  Prijava
                </PrimaryButton>
                <SecondaryButton onClick={() => navigate("/register?redirect=/vote-city")}>
                  Registracija
                </SecondaryButton>
              </div>
            ) : null}
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
            isMobile={isMobile}
            total={filteredResults.length}
            showClear={Boolean(search)}
          />

          <div style={{ display: "grid", gap: 14 }}>
            {filteredResults.map((item) => {
              const rowId = item.local_unit_id || item.city_id || item.id;
              const isMyVote = myCityId === rowId;

              return isMobile ? (
                <MobileCityCard
                  key={rowId}
                  item={item}
                  isMyVote={isMyVote}
                  pollActive={pollActive}
                  busyCityId={busyCityId}
                  onVote={handleVote}
                  onRemove={handleRemoveVote}
                  authUser={authUser}
                  navigate={navigate}
                />
              ) : (
                <DesktopRow
                  key={rowId}
                  item={item}
                  isMyVote={isMyVote}
                  pollActive={pollActive}
                  busyCityId={busyCityId}
                  onVote={handleVote}
                  onRemove={handleRemoveVote}
                  authUser={authUser}
                  navigate={navigate}
                />
              );
            })}
          </div>

          {!filteredResults.length ? (
            <div
              style={{
                padding: "24px 10px 6px",
                textAlign: "center",
                color: "rgba(230,255,245,0.68)",
                fontWeight: 700,
              }}
            >
              Nema rezultata za ovu pretragu.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
