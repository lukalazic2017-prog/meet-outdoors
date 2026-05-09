import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const FALLBACK_HERO = "/cities/beograd.jpg";
const FALLBACK_CITY = "/cities/default.jpg";
const EDEN_LOGO = "/eden-logo.png";

const COLORS = {
  bg: "#06100f",
  deep: "#030807",
  river: "#34e7ff",
  mint: "#78ffd7",
  lime: "#b7ff6a",
  gold: "#ffd27a",
  orange: "#ff9d55",
  card: "rgba(5, 15, 15, 0.78)",
  cardSoft: "rgba(7, 21, 21, 0.64)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderStrong: "1px solid rgba(120,255,215,0.26)",
  textSoft: "rgba(232,255,247,0.78)",
  textMuted: "rgba(215,255,242,0.62)",
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
    "linear-gradient(135deg, #78ffd7, #34e7ff)",
    "linear-gradient(135deg, #ffd27a, #ff9d55)",
    "linear-gradient(135deg, #b7ff6a, #48f0bc)",
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
      ? "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0.94) 100%)"
      : "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.88) 100%)";

  return (
    <>
      <img
        src={imageSrc}
        alt={alt}
        onError={() => {
          if (imageSrc !== FALLBACK_CITY) setImageSrc(FALLBACK_CITY);
        }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: overlayBackground }} />
    </>
  );
}

function StatCard({ label, value, sub, isMobile }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, rgba(8,24,22,0.82), rgba(5,12,14,0.70))",
        border: COLORS.border,
        borderRadius: isMobile ? 18 : 26,
        padding: isMobile ? 14 : 18,
        backdropFilter: "blur(18px)",
        minHeight: isMobile ? 96 : 116,
        boxShadow: "0 18px 46px rgba(0,0,0,0.20)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "auto -30px -50px auto",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,231,255,0.22), transparent 62%)",
        }}
      />
      <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(183,255,106,0.88)", marginBottom: 8, fontWeight: 950 }}>
        {label}
      </div>
      <div style={{ fontSize: isMobile ? 21 : 28, fontWeight: 950, color: "#f8fffb", lineHeight: 1.05 }}>
        {value}
      </div>
      {sub ? <div style={{ marginTop: 8, fontSize: 13, color: COLORS.textSoft, lineHeight: 1.45 }}>{sub}</div> : null}
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
              <img key={`${src}-${index}`} src={src} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(6,15,14,0.98)", marginLeft: index === 0 ? 0 : -8, background: "#091615" }} />
            ))
          : [0, 1, 2].map((index) => (
              <div key={index} style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", border: "2px solid rgba(6,15,14,0.98)", marginLeft: index === 0 ? 0 : -8, background: fallbackAvatarGradient(index), color: "#031512", fontWeight: 950, fontSize: 10 }}>
                {getInitials(cityName)}
              </div>
            ))}
      </div>
      <div style={{ fontSize: 13, color: "rgba(236,255,249,0.86)", fontWeight: 800 }}>
        <span style={{ color: "#fff", fontWeight: 950 }}>{formatCompactNumber(votes)}</span> glasalo
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, fullWidth = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "14px 17px", borderRadius: 17, border: "none", width: fullWidth ? "100%" : "auto", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 950, fontSize: 15, color: "#031512", background: disabled ? "rgba(255,255,255,0.14)" : "linear-gradient(135deg, #b7ff6a 0%, #78ffd7 48%, #34e7ff 100%)", boxShadow: disabled ? "none" : "0 16px 38px rgba(82,255,210,0.24), inset 0 1px 0 rgba(255,255,255,0.45)" }}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, disabled, fullWidth = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "14px 17px", borderRadius: 17, border: "1px solid rgba(255,255,255,0.14)", width: fullWidth ? "100%" : "auto", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 850, fontSize: 15, color: "#fff", background: "linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))", backdropFilter: "blur(12px)" }}>
      {children}
    </button>
  );
}

function SponsorChip({ icon, title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 20, background: "rgba(5,15,15,0.50)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(14px)", boxShadow: "0 12px 34px rgba(0,0,0,0.16)" }}>
      <div style={{ width: 46, height: 46, borderRadius: 16, display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(183,255,106,0.24), rgba(52,231,255,0.20))", border: "1px solid rgba(255,255,255,0.12)", fontSize: 20 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 950, fontSize: 14, color: "#fff" }}>{title}</div>
        <div style={{ fontSize: 12, color: COLORS.textSoft }}>{sub}</div>
      </div>
    </div>
  );
}



  return (
    <div
      style={{
        width: isMobile ? 90 : 118,
        height: isMobile ? 90 : 118,
        borderRadius: isMobile ? 24 : 30,
        padding: 10,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(145deg, #ffffff 0%, #f7fff8 100%)",
        border: "2px solid rgba(255,255,255,0.72)",
        boxShadow:
          "0 0 0 1px rgba(120,255,215,0.24), 0 0 46px rgba(120,255,215,0.26), 0 18px 50px rgba(0,0,0,0.42)",
        position: "relative",
        overflow: "hidden",
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: isMobile ? 20 : 26,
          border: "1px solid rgba(7,86,62,0.16)",
          pointerEvents: "none",
        }}
      />

      {!failed ? (
        <img
          src={EDEN_LOGO}
          alt="Rafting Camp Eden"
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.16))",
            position: "relative",
            zIndex: 2,
          }}
        />
      ) : (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            color: "#07543d",
            fontWeight: 950,
            lineHeight: 1.05,
            fontSize: isMobile ? 12 : 15,
            letterSpacing: "-0.03em",
          }}
        >
          EDEN
          <br />
          RAFTING
          <br />
          CAMP
        </div>
      )}
    </div>
  );

function VictoryWowCard({ isMobile }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", marginBottom: 20, borderRadius: isMobile ? 28 : 36, padding: isMobile ? 16 : 24, background: "linear-gradient(135deg, rgba(255,157,85,0.20), rgba(7,24,22,0.90) 42%, rgba(3,9,12,0.92))", border: "1px solid rgba(255,210,122,0.25)", boxShadow: "0 26px 90px rgba(0,0,0,0.30), 0 0 70px rgba(255,157,85,0.10)" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 12% 12%, rgba(255,210,122,0.23), transparent 30%), radial-gradient(circle at 88% 18%, rgba(52,231,255,0.20), transparent 28%), radial-gradient(circle at 50% 100%, rgba(120,255,215,0.15), transparent 32%)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(255,210,122,0.14)", border: "1px solid rgba(255,210,122,0.26)", color: "#ffe3a7", fontWeight: 950, fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 12 }}>
            🏆 Šta znači pobeda?
          </div>
          <div style={{ fontSize: isMobile ? 28 : 44, lineHeight: 0.98, fontWeight: 950, letterSpacing: "-0.05em", marginBottom: 10, textTransform: "uppercase" }}>
            Grad koji pobedi postaje arena za veliki outdoor izazov.
          </div>
          <div style={{ color: "rgba(242,255,251,0.86)", lineHeight: 1.72, fontSize: isMobile ? 14 : 16, maxWidth: 760 }}>
            Posle glasanja biramo pobednički grad, otvaramo prijave za timove i objavljujemo tačne instrukcije: format igre, pravila, vreme okupljanja i lokaciju. Tim koji najbolje odradi izazov osvaja <strong>rafting na Tari sa Rafting Camp Eden</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

function PrizeCard({ icon, title, sub, accent = "mint" }) {
  const glow = accent === "gold" ? "rgba(255,210,122,0.24)" : accent === "river" ? "rgba(52,231,255,0.22)" : "rgba(120,255,215,0.22)";
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(145deg, rgba(8,24,22,0.58), rgba(4,11,12,0.48))", border: COLORS.borderStrong, borderRadius: 24, padding: 16, backdropFilter: "blur(16px)", boxShadow: "0 18px 42px rgba(0,0,0,0.20)" }}>
      <div style={{ position: "absolute", right: -28, top: -28, width: 110, height: 110, borderRadius: "50%", background: `radial-gradient(circle, ${glow}, transparent 65%)` }} />
      <div style={{ width: 50, height: 50, borderRadius: 17, display: "grid", placeItems: "center", fontSize: 23, marginBottom: 12, background: "linear-gradient(135deg, rgba(183,255,106,0.20), rgba(52,231,255,0.15))", border: "1px solid rgba(255,255,255,0.11)" }}>
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: COLORS.textSoft }}>{sub}</div>
    </div>
  );
}

function InstructionStep({ number, title, text, isMobile }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12, alignItems: "start", padding: isMobile ? 13 : 15, borderRadius: 22, background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ width: 44, height: 44, borderRadius: 16, display: "grid", placeItems: "center", color: "#031512", fontWeight: 950, background: "linear-gradient(135deg, #b7ff6a, #78ffd7, #34e7ff)", boxShadow: "0 12px 28px rgba(82,255,210,0.18)" }}>{number}</div>
      <div>
        <div style={{ fontWeight: 950, fontSize: 15, marginBottom: 5, color: "#fff" }}>{title}</div>
        <div style={{ color: COLORS.textSoft, fontSize: 13, lineHeight: 1.62 }}>{text}</div>
      </div>
    </div>
  );
}

function InstructionsSection({ isMobile }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", marginBottom: 20, borderRadius: isMobile ? 26 : 34, border: "1px solid rgba(120,255,215,0.18)", background: "linear-gradient(135deg, rgba(7,22,20,0.88), rgba(4,13,16,0.86))", boxShadow: "0 22px 70px rgba(0,0,0,0.26)" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 18% 0%, rgba(183,255,106,0.18), transparent 30%), radial-gradient(circle at 84% 18%, rgba(52,231,255,0.20), transparent 32%), linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.035) 45%, transparent 70%)" }} />
      <div style={{ position: "relative", zIndex: 1, padding: isMobile ? 16 : 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: "rgba(183,255,106,0.12)", border: "1px solid rgba(183,255,106,0.20)", color: "#d8ff9a", fontWeight: 950, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              🛶 IZAĐI NAPOLJE #2 • RAFTING NA TARI
            </div>
            <div style={{ fontSize: isMobile ? 25 : 36, lineHeight: 1.05, fontWeight: 950, letterSpacing: "-0.04em", marginBottom: 8 }}>
              Kako ide glasanje i šta sledi posle?
            </div>
            <div style={{ maxWidth: 820, color: COLORS.textSoft, lineHeight: 1.7, fontSize: isMobile ? 14 : 15 }}>
              Ovo je prva faza eventa. Grad koji pobedi u glasanju postaje domaćin <strong>IZAĐI NAPOLJE #2</strong>. Nakon toga objavljujemo tačne instrukcije, lokaciju okupljanja, prijave za timove i format izazova. Glavna nagrada za pobednički tim je <strong>rafting na Tari sa Rafting Camp Eden</strong>.
            </div>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 20, background: "rgba(255,210,122,0.10)", border: "1px solid rgba(255,210,122,0.22)", color: "#ffe3a7", fontWeight: 950, minWidth: isMobile ? "100%" : 220 }}>
            🏆 Nagrada: rafting na Tari • Rafting Camp Eden
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          <InstructionStep isMobile={isMobile} number="1" title="Glasaj za grad" text="Izaberi jedan grad. Glas možeš promeniti ili ukloniti dok je glasanje aktivno." />
          <InstructionStep isMobile={isMobile} number="2" title="Pobednički grad dobija event" text="Grad sa najviše glasova postaje lokacija za IZAĐI NAPOLJE #2." />
          <InstructionStep isMobile={isMobile} number="3" title="Timovi ulaze u izazov" text="Detalji o prijavi, pravilima, timu i lokaciji biće objavljeni nakon glasanja." />
          <InstructionStep isMobile={isMobile} number="4" title="Pobednik osvaja rafting" text="Tim koji pobedi u izazovu osvaja rafting na Tari za svoju ekipu, u partnerstvu sa Rafting Camp Eden." />
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, isMobile, total, showClear }) {
  return (
    <div style={{ position: "sticky", top: 10, zIndex: 15, marginBottom: 16 }}>
      <div style={{ background: "rgba(5,15,15,0.88)", border: COLORS.border, borderRadius: 22, padding: isMobile ? 12 : 14, backdropFilter: "blur(18px)", boxShadow: "0 18px 38px rgba(0,0,0,0.20)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 18, opacity: 0.92 }}>⌕</span>
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Pretraži grad ili opštinu..." style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: "#fff", fontSize: isMobile ? 16 : 15, fontWeight: 800 }} />
          {showClear ? <button onClick={() => onChange("")} style={{ border: "none", background: "transparent", color: "#78ffd7", fontWeight: 900, cursor: "pointer" }}>Obriši</button> : null}
          <div style={{ whiteSpace: "nowrap", fontSize: 12, color: "rgba(223,255,246,0.78)", fontWeight: 900 }}>{total} mesta</div>
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
    <div style={{ position: "relative", overflow: "hidden", borderRadius: isMobile ? 30 : 40, minHeight: isMobile ? 730 : 650, border: COLORS.border, boxShadow: "0 30px 95px rgba(0,0,0,0.38)", marginBottom: 22 }}>
      <ImageLayer src={heroImage} alt={leaderName} overlay="hero" />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 18% 18%, rgba(183,255,106,0.20), transparent 30%), radial-gradient(circle at 82% 12%, rgba(52,231,255,0.22), transparent 28%), radial-gradient(circle at 50% 100%, rgba(120,255,215,0.14), transparent 30%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "64px 64px", opacity: 0.36 }} />

      <div style={{ position: "relative", zIndex: 2, minHeight: isMobile ? 730 : 650, padding: isMobile ? "22px 16px" : "36px 30px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999, background: "rgba(120,255,215,0.13)", border: "1px solid rgba(120,255,215,0.23)", color: "#9dffdc", fontSize: 12, fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", backdropFilter: "blur(10px)" }}>
              MeetOutdoors u partnerstvu sa Rafting Camp Eden
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999, background: "linear-gradient(135deg, rgba(183,255,106,0.96), rgba(52,231,255,0.96))", color: "#031512", fontSize: 12, fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: "0 0 38px rgba(52,231,255,0.24)" }}>
              🛶 IZAĐI NAPOLJE #2
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999, background: "rgba(255,210,122,0.13)", border: "1px solid rgba(255,210,122,0.24)", color: "#ffe1a0", fontSize: 12, fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase", backdropFilter: "blur(10px)" }}>
              🏆 U vođstvu: {leaderName}
            </div>
          </div>

          <div style={{ fontSize: isMobile ? 39 : 76, fontWeight: 950, lineHeight: 0.94, maxWidth: 1010, letterSpacing: "-0.06em", marginBottom: 16, textTransform: "uppercase", textShadow: "0 0 46px rgba(52,231,255,0.20), 0 16px 36px rgba(0,0,0,0.68)" }}>
            Glasaj za grad.
            <br />
            Pobedi i vodi ekipu na Taru.
          </div>

          <div style={{ maxWidth: 930, fontSize: isMobile ? 15 : 18, lineHeight: 1.78, color: "rgba(242,255,251,0.95)", marginBottom: 20, textShadow: "0 7px 16px rgba(0,0,0,0.40)" }}>
            Grad koji osvoji najviše glasova postaje domaćin <strong>IZAĐI NAPOLJE #2</strong> — velikog outdoor izazova sa timovima, potragom, zadacima i završnicom. <strong>Pobeda nije samo prvo mesto na tabeli:</strong> pobednički grad dobija event, a tim koji pobedi u izazovu osvaja <strong>rafting na Tari sa Rafting Camp Eden</strong>. Pozadina prikazuje grad koji trenutno vodi.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
            <PrizeCard icon="🏙️" title="Grad domaćin" sub="Grad sa najviše glasova dobija IZAĐI NAPOLJE #2 i postaje domaćin velikog outdoor izazova." />
            <PrizeCard icon="🧭" title="Izazov za timove" sub="Nakon glasanja objavljujemo pravila, prijave, lokaciju i instrukcije za učesnike." accent="river" />
            <PrizeCard icon="🛶" title="Glavna nagrada" sub="Tim koji pobedi u finalnom izazovu osvaja rafting na Tari sa Rafting Camp Eden — voda, brzaci, ekipa i pobeda za pamćenje." accent="gold" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, max-content))", gap: 12, marginBottom: 20 }}>
            <SponsorChip icon="🚗" title="Auto Mirko, Prokuplje" sub="Sponzor događaja" />
            <SponsorChip icon="🐬" title="Radio Delfin, Prokuplje 100.2 MHz" sub="Medijska podrška" />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <PrimaryButton onClick={onScrollToVote}>Glasaj odmah</PrimaryButton>
            <SecondaryButton>{poll?.status === "scheduled" ? `Glasanje počinje za ${formatCountdown(poll?.seconds_left)}` : pollActive ? `Glasanje traje još ${formatCountdown(poll?.seconds_left)}` : "Glasanje je završeno"}</SecondaryButton>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 18, background: "rgba(5,15,15,0.50)", border: "1px solid rgba(255,255,255,0.11)", backdropFilter: "blur(10px)", color: "rgba(242,255,251,0.94)", fontWeight: 900, fontSize: 14 }}>
            Tvoj glas bira grad. Pobednički grad dobija event. Pobednički tim ide na Taru.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: 14, alignItems: "stretch" }}>
          <div style={{ background: "rgba(5,15,15,0.52)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 26, padding: isMobile ? 14 : 18, backdropFilter: "blur(16px)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", color: "#b7ff6a", fontWeight: 950, marginBottom: 8 }}>Trenutno vodi</div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: isMobile ? 27 : 36, fontWeight: 950, lineHeight: 1.02, marginBottom: 6 }}>{leaderName}</div>
                <div style={{ color: COLORS.textSoft, lineHeight: 1.6, fontSize: 14, maxWidth: 520 }}>Ako ostane na prvom mestu, ovaj grad dobija IZAĐI NAPOLJE #2.</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <AvatarStack cityName={leaderName} avatars={leaderAvatars} votes={leaderVotes} />
                <div style={{ padding: "10px 14px", borderRadius: 16, background: "rgba(183,255,106,0.12)", border: "1px solid rgba(183,255,106,0.22)", color: "#d8ff9a", fontWeight: 950 }}>{leaderPercent}% svih glasova</div>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(5,15,15,0.52)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 26, padding: isMobile ? 14 : 18, backdropFilter: "blur(16px)", display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 950 }}><span>🎯</span><span>Pravila ukratko</span></div>
            <div style={{ color: COLORS.textSoft, fontSize: 14, lineHeight: 1.65 }}>1. Glasaj za jedan grad.<br />2. Možeš promeniti glas dok traje glasanje.<br />3. Pobednički grad dobija event.<br />4. Tim koji pobedi osvaja rafting.</div>
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
    <div style={{ overflow: "hidden", borderRadius: isMobile ? 22 : 26, background: featured ? "linear-gradient(135deg, rgba(20,51,42,0.94), rgba(7,18,22,0.90))" : COLORS.card, border: featured ? COLORS.borderStrong : COLORS.border, boxShadow: featured ? "0 18px 46px rgba(82,255,210,0.14)" : "0 10px 30px rgba(0,0,0,0.10)" }}>
      <div style={{ position: "relative", height: featured ? (isMobile ? 142 : 170) : isMobile ? 108 : 128 }}><ImageLayer src={getCityImage(item)} alt={item.name} /></div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: featured ? 31 : 26, marginBottom: 8 }}>{getRankBadge(item.rank)}</div>
        <div style={{ fontSize: featured ? (isMobile ? 22 : 27) : 20, fontWeight: 950, marginBottom: 8 }}>{item.name}</div>
        <AvatarStack cityName={item.name} avatars={avatars} votes={item.votes} />
        <div style={{ marginTop: 12, color: featured ? "#b7ff6a" : "#78ffd7", fontSize: featured ? 27 : 22, fontWeight: 950 }}>{item.percent}%</div>
      </div>
    </div>
  );
}

function ActionButtons({ authUser, isMyVote, busy, pollActive, onVote, onRemove, navigate, fullWidth }) {
  if (!authUser) {
    return <PrimaryButton fullWidth={fullWidth} onClick={() => navigate("/login?redirect=/vote-city")}>Prijavi se za glasanje</PrimaryButton>;
  }
  return (
    <>
      <PrimaryButton fullWidth={fullWidth} disabled={!pollActive || busy} onClick={onVote}>{busy ? "Čuvanje..." : isMyVote ? "Glasali ste" : "Glasaj"}</PrimaryButton>
      {isMyVote ? <SecondaryButton fullWidth={fullWidth} disabled={!pollActive || busy} onClick={onRemove}>Ukloni glas</SecondaryButton> : null}
    </>
  );
}

function MobileCityCard({ item, isMyVote, pollActive, busyCityId, onVote, onRemove, authUser, navigate }) {
  const rowId = item.local_unit_id || item.city_id || item.id;
  const percent = Math.max(0, Math.min(100, Number(item.percent || 0)));
  const avatars = item.avatars || item.voter_avatars || item.profile_avatars || [];
  const busy = busyCityId === rowId;
  return (
    <div style={{ overflow: "hidden", background: isMyVote ? "linear-gradient(135deg, rgba(47,128,92,0.42), rgba(8,24,25,0.90))" : "rgba(5,15,15,0.82)", border: isMyVote ? "1px solid rgba(183,255,106,0.34)" : COLORS.border, borderRadius: 26, boxShadow: isMyVote ? "0 18px 38px rgba(128,255,168,0.14)" : "0 12px 32px rgba(0,0,0,0.14)" }}>
      <div style={{ position: "relative", height: 236 }}>
        <ImageLayer src={getCityImage(item)} alt={item.name} />
        <div style={{ position: "absolute", inset: 0, padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <div style={{ padding: "7px 10px", borderRadius: 999, background: "rgba(5,15,15,0.60)", border: "1px solid rgba(255,255,255,0.11)", fontWeight: 950, fontSize: 13, color: "#fff", backdropFilter: "blur(10px)" }}>{getRankBadge(item.rank)}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {item.is_leading ? <span style={{ fontSize: 11, fontWeight: 950, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 10px", borderRadius: 999, background: "rgba(183,255,106,0.17)", color: "#d8ff9a", border: "1px solid rgba(183,255,106,0.22)", backdropFilter: "blur(10px)" }}>Vodi</span> : null}
              {item.rank <= 3 ? <span style={{ fontSize: 11, fontWeight: 950, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 10px", borderRadius: 999, background: "rgba(52,231,255,0.14)", color: "#9defff", border: "1px solid rgba(52,231,255,0.18)", backdropFilter: "blur(10px)" }}>U vrhu</span> : null}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 32, lineHeight: 1.02, fontWeight: 950, color: "#fff", textShadow: "0 8px 20px rgba(0,0,0,0.42)", marginBottom: 8 }}>{item.name}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {isMyVote ? <span style={{ fontSize: 11, fontWeight: 950, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>Tvoj glas</span> : null}
              <span style={{ fontSize: 13, color: "rgba(236,255,249,0.94)", fontWeight: 850, textShadow: "0 4px 12px rgba(0,0,0,0.34)" }}>{formatNumber(item.votes)} glasova • {item.percent}%</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <AvatarStack cityName={item.name} avatars={avatars} votes={item.votes} />
        <div style={{ marginTop: 12, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #b7ff6a 0%, #78ffd7 45%, #34e7ff 100%)", boxShadow: "0 0 18px rgba(122,255,218,0.34)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMyVote && authUser ? "1fr 1fr" : "1fr", gap: 10, marginTop: 14 }}>
          <ActionButtons authUser={authUser} isMyVote={isMyVote} busy={busy} pollActive={pollActive} onVote={() => onVote(rowId)} onRemove={onRemove} navigate={navigate} fullWidth />
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
    <div style={{ overflow: "hidden", background: isMyVote ? "linear-gradient(135deg, rgba(47,128,92,0.40), rgba(8,24,25,0.88))" : COLORS.card, border: isMyVote ? "1px solid rgba(183,255,106,0.34)" : COLORS.border, borderRadius: 24, padding: 16, boxShadow: "0 12px 34px rgba(0,0,0,0.10)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 16, alignItems: "center" }}>
        <div style={{ position: "relative", height: 120, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ImageLayer src={getCityImage(item)} alt={item.name} />
          <div style={{ position: "absolute", left: 10, top: 10, padding: "6px 10px", borderRadius: 999, background: "rgba(5,15,15,0.60)", border: "1px solid rgba(255,255,255,0.11)", fontWeight: 950, fontSize: 13, color: "#fff" }}>{getRankBadge(item.rank)}</div>
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 10, color: "#fff", fontWeight: 950, fontSize: 20, textShadow: "0 8px 18px rgba(0,0,0,0.40)" }}>{item.name}</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {item.is_leading ? <span style={{ fontSize: 11, fontWeight: 950, letterSpacing: "0.06em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 999, background: "rgba(183,255,106,0.16)", color: "#d8ff9a", border: "1px solid rgba(183,255,106,0.22)" }}>Vodi</span> : null}
            {item.rank <= 3 ? <span style={{ fontSize: 11, fontWeight: 950, letterSpacing: "0.06em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 999, background: "rgba(52,231,255,0.14)", color: "#9defff", border: "1px solid rgba(52,231,255,0.18)" }}>U vrhu</span> : null}
            {isMyVote ? <span style={{ fontSize: 11, fontWeight: 950, letterSpacing: "0.06em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,0.10)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>Tvoj glas</span> : null}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14, color: "rgba(226,255,246,0.78)", marginBottom: 12, fontWeight: 750 }}>
            <span>{formatNumber(item.votes)} glasova</span><span>{item.percent}%</span><span>{item.rank === 1 ? "Prvo mesto" : `Mesto #${item.rank}`}</span>
          </div>
          <AvatarStack cityName={item.name} avatars={avatars} votes={item.votes} />
          <div style={{ marginTop: 12, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #b7ff6a 0%, #78ffd7 45%, #34e7ff 100%)" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <ActionButtons authUser={authUser} isMyVote={isMyVote} busy={busy} pollActive={pollActive} onVote={() => onVote(rowId)} onRemove={onRemove} navigate={navigate} />
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        supabase.from("city_poll_status").select("*").order("starts_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("city_vote_results").select("*").order("rank", { ascending: true }),
        supabase.from("city_vote_summary").select("*").limit(1).maybeSingle(),
        supabase.from("current_user_vote").select("*").maybeSingle(),
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

  useEffect(() => { loadAll(); }, [loadAll]);

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
  const pollScheduled = poll?.status === "scheduled" && Number(poll?.seconds_left || 0) > 0;
  const pollFinished = poll?.status === "finished" || (poll && Number(poll?.seconds_left || 0) <= 0 && poll?.status !== "scheduled");
  const myCityId = myVote?.local_unit_id || myVote?.city_id || null;

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (results || []).filter((item) => (!q ? true : String(item.name || "").toLowerCase().includes(q)));
  }, [results, search]);

  const top3 = useMemo(() => results.slice(0, 3), [results]);
  const leader = results[0] || null;

  const handleVote = useCallback(async (localUnitId) => {
    try {
      if (!authUser) { navigate("/login?redirect=/vote-city"); return; }
      if (!poll?.id) return;
      setBusyCityId(localUnitId);
      setErrorMsg("");
      const { error } = await supabase.rpc("cast_or_change_vote", { p_poll_id: poll.id, p_local_unit_id: localUnitId });
      if (error) throw error;
      await loadAll({ silent: true });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Čuvanje glasa nije uspelo.");
    } finally {
      setBusyCityId(null);
    }
  }, [authUser, navigate, poll?.id, loadAll]);

  const handleRemoveVote = useCallback(async () => {
    try {
      if (!authUser) { navigate("/login?redirect=/vote-city"); return; }
      if (!poll?.id) return;
      setBusyCityId("__remove__");
      setErrorMsg("");
      const { error } = await supabase.rpc("remove_my_vote", { p_poll_id: poll.id });
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
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "grid", placeItems: "center", color: "#fff", padding: 24 }}>
        <div style={{ padding: 22, borderRadius: 26, background: "rgba(255,255,255,0.045)", border: COLORS.border, fontWeight: 900 }}>Učitavanje glasanja...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 10% 0%, rgba(183,255,106,0.12), transparent 30%), radial-gradient(circle at 90% 4%, rgba(52,231,255,0.15), transparent 34%), linear-gradient(180deg, rgba(2,8,7,0.92), rgba(4,9,12,0.98)), #06100f", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.42,
          background:
            "linear-gradient(115deg, transparent 0%, rgba(120,255,215,0.05) 42%, transparent 55%), radial-gradient(circle at 50% 0%, rgba(255,157,85,0.08), transparent 34%)",
          mixBlendMode: "screen",
        }}
      />
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? "16px 14px 44px" : "28px 18px 64px" }}>
        <HeroSection leader={leader} poll={poll} pollActive={pollActive} isMobile={isMobile} onScrollToVote={() => { const el = document.getElementById("glasanje-lista"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} />

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
          <StatCard label={poll?.status === "scheduled" ? "Početak glasanja" : "Vreme do kraja"} value={poll?.status === "scheduled" ? formatCountdown(poll?.seconds_left) : pollActive ? formatCountdown(poll?.seconds_left) : "Završeno"} sub={poll?.status === "scheduled" ? poll?.starts_at ? `Start: ${new Date(poll.starts_at).toLocaleString()}` : null : poll?.ends_at ? `Kraj: ${new Date(poll.ends_at).toLocaleString()}` : null} isMobile={isMobile} />
          <StatCard label="Ukupno glasova" value={formatNumber(summary?.total_votes || results[0]?.total_votes || 0)} sub="Uživo pregled rezultata" isMobile={isMobile} />
          <StatCard label="Vodeći grad" value={summary?.leading_name || results[0]?.name || "—"} sub={summary?.leading_votes != null ? `${formatNumber(summary.leading_votes)} glasova` : "Još nema glasova"} isMobile={isMobile} />
          <StatCard label="Tvoj izbor" value={myVote?.city_name || "Još nisi glasao"} sub={myVote?.city_name ? "Možeš ukloniti ili promeniti glas" : authUser ? "Podrži jedno mesto" : "Prijavi se da glasaš"} isMobile={isMobile} />
        </div>

        <InstructionsSection isMobile={isMobile} />
        <VictoryWowCard isMobile={isMobile} />

        {errorMsg ? <div style={{ marginBottom: 14, background: "rgba(255,85,85,0.12)", border: "1px solid rgba(255,120,120,0.24)", color: "#ffd5d5", padding: "14px 16px", borderRadius: 18, fontWeight: 750 }}>{errorMsg}</div> : null}

        {top3.length > 0 ? <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.15fr 1fr", gap: 14, marginBottom: 20, alignItems: isMobile ? "stretch" : "end" }}><PodiumCard item={top3[1]} isMobile={isMobile} /><PodiumCard item={top3[0]} featured isMobile={isMobile} /><PodiumCard item={top3[2]} isMobile={isMobile} /></div> : null}

        <div id="glasanje-lista" style={{ background: "rgba(4,12,12,0.78)", border: COLORS.border, borderRadius: isMobile ? 26 : 34, padding: isMobile ? 14 : 20, backdropFilter: "blur(16px)", boxShadow: "0 22px 60px rgba(0,0,0,0.26)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: isMobile ? 23 : 30, fontWeight: 950, lineHeight: 1.05, marginBottom: 6 }}>Glasanje gradova</div>
              <div style={{ fontSize: 14, color: COLORS.textSoft }}>{pollScheduled ? "Glasanje je zakazano. Gradovi su vidljivi, a glasanje kreće uskoro." : pollActive ? "Podrži svoj grad i pomozi da baš on dobije IZAĐI NAPOLJE #2." : pollFinished ? "Glasanje je završeno. Rezultati ostaju vidljivi." : "Podrži svoj grad i pomozi da baš on dobije IZAĐI NAPOLJE #2."}</div>
            </div>
            {!authUser ? <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><PrimaryButton onClick={() => navigate("/login?redirect=/vote-city")}>Prijava</PrimaryButton><SecondaryButton onClick={() => navigate("/register?redirect=/vote-city")}>Registracija</SecondaryButton></div> : null}
          </div>

          <SearchBar value={search} onChange={setSearch} isMobile={isMobile} total={filteredResults.length} showClear={Boolean(search)} />

          <div style={{ display: "grid", gap: 14 }}>
            {filteredResults.map((item) => {
              const rowId = item.local_unit_id || item.city_id || item.id;
              const isMyVote = myCityId === rowId;
              return isMobile ? <MobileCityCard key={rowId} item={item} isMyVote={isMyVote} pollActive={pollActive} busyCityId={busyCityId} onVote={handleVote} onRemove={handleRemoveVote} authUser={authUser} navigate={navigate} /> : <DesktopRow key={rowId} item={item} isMyVote={isMyVote} pollActive={pollActive} busyCityId={busyCityId} onVote={handleVote} onRemove={handleRemoveVote} authUser={authUser} navigate={navigate} />;
            })}
          </div>

          {!filteredResults.length ? <div style={{ padding: "24px 10px 6px", textAlign: "center", color: "rgba(230,255,245,0.68)", fontWeight: 750 }}>Nema rezultata za ovu pretragu.</div> : null}
        </div>
      </div>
    </div>
  );
}
