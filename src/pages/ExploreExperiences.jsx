// src/pages/ExploreExperiences.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK = "https://images.pexels.com/photos/1732278/pexels-photo-1732278.jpeg";

const COLORS = {
  text: "#f4fff9",
  textSoft: "rgba(231,255,247,.76)",
  textDim: "rgba(231,255,247,.56)",
  line: "rgba(125,255,209,.13)",
  lineStrong: "rgba(125,255,209,.26)",
  mintSoft: "#8fffe0",
};

function useIsMobile(breakpoint = 820) {
  const getValue = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  }, [breakpoint]);

  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const onResize = () => setIsMobile(getValue());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getValue]);

  return isMobile;
}

function formatDate(value) {
  if (!value) return "Date soon";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date soon";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

export default function ExploreExperiences() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [hosts, setHosts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [dates, setDates] = useState([]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyFreeSpots, setOnlyFreeSpots] = useState(false);
  const [depositMode, setDepositMode] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: hostData } = await supabase
        .from("experience_hosts")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      const safeHosts = hostData || [];
      let packageData = [];
      let dateData = [];

      if (safeHosts.length) {
        const hostIds = safeHosts.map((host) => host.id);

        const { data: packageRows } = await supabase
          .from("experience_packages")
          .select("*")
          .in("host_id", hostIds)
          .eq("active", true)
          .order("created_at", { ascending: false });

        packageData = packageRows || [];

        if (packageData.length) {
          const packageIds = packageData.map((pkg) => pkg.id);

          const { data: dateRows } = await supabase
            .from("experience_dates")
            .select("*")
            .in("package_id", packageIds)
            .order("start_date", { ascending: true });

          dateData = dateRows || [];
        }
      }

      setHosts(safeHosts);
      setPackages(packageData);
      setDates(dateData);
      setLoading(false);
    }

    load();
  }, []);

  const categories = useMemo(() => {
    const list = hosts
      .map((host) => host.category)
      .filter(Boolean)
      .map((x) => String(x).trim());

    return ["all", ...Array.from(new Set(list)).slice(0, 10)];
  }, [hosts]);

  const experienceCards = useMemo(() => {
    return hosts.map((host) => {
      const hostPackages = packages.filter((pkg) => pkg.host_id === host.id);
      const hostDates = dates.filter((date) =>
        hostPackages.some((pkg) => pkg.id === date.package_id)
      );

      const firstPackage = hostPackages[0] || null;

      const minPrice = hostPackages
        .map((pkg) => Number(pkg.price || 0))
        .filter((price) => price > 0)
        .sort((a, b) => a - b)[0];

      const freeSpots = hostDates.reduce(
        (sum, date) => sum + Number(date.free_spots || 0),
        0
      );

      const hasDeposit = hostPackages.some((pkg) => pkg.deposit_required);

      const searchable = [
        host.name,
        host.category,
        host.location,
        host.city,
        host.country,
        host.address,
        host.short_description,
        host.description,
        ...hostPackages.map((pkg) => pkg.title),
        ...hostPackages.map((pkg) => pkg.description),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return {
        id: host.id,
        slug: host.slug,
        name: host.name || "Experience host",
        category: host.category || "Outdoor",
        location:
          host.location ||
          [host.city, host.country].filter(Boolean).join(", ") ||
          host.address ||
          "Outdoor location",
        city: host.city || "",
        image: firstPackage?.cover_url || host.cover_url || FALLBACK,
        verified: !!host.verified,
        packagesCount: hostPackages.length,
        freeSpots,
        hasDeposit,
        price: minPrice
          ? `From ${minPrice} ${firstPackage?.currency || "EUR"}`
          : "Price on request",
        dates: hostDates.map((date) => ({
          ...date,
          label: `${formatDate(date.start_date)}${
            date.end_date ? ` - ${formatDate(date.end_date)}` : ""
          }`,
        })),
        searchable,
      };
    });
  }, [hosts, packages, dates]);

  const filteredExperiences = useMemo(() => {
    const q = normalize(query);

    return experienceCards.filter((item) => {
      if (q && !item.searchable.includes(q)) return false;
      if (category !== "all" && normalize(item.category) !== normalize(category)) return false;
      if (onlyVerified && !item.verified) return false;
      if (onlyFreeSpots && item.freeSpots <= 0) return false;
      if (depositMode === "deposit" && !item.hasDeposit) return false;
      if (depositMode === "no-deposit" && item.hasDeposit) return false;
      return true;
    });
  }, [experienceCards, query, category, onlyVerified, onlyFreeSpots, depositMode]);

  const stats = useMemo(() => {
    const totalSpots = experienceCards.reduce((sum, item) => sum + item.freeSpots, 0);
    const verified = experienceCards.filter((item) => item.verified).length;
    const cities = new Set(
      experienceCards.map((item) => item.city || item.location).filter(Boolean)
    ).size;

    return {
      hosts: experienceCards.length,
      packages: packages.length,
      totalSpots,
      verified,
      cities,
    };
  }, [experienceCards, packages]);

  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 48% -8%, rgba(22,245,162,.18), transparent 34%), radial-gradient(circle at 92% 8%, rgba(64,231,255,.12), transparent 30%), linear-gradient(180deg,#010302,#06130e 48%,#071611)",
        color: COLORS.text,
        padding: isMobile ? "96px 14px 90px" : "104px 24px 110px",
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      wrap: { maxWidth: 1320, margin: "0 auto" },
      hero: {
        position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? 34 : 44,
        padding: isMobile ? 20 : 28,
        minHeight: isMobile ? 460 : 520,
        display: "flex",
        alignItems: "flex-end",
        border: `1px solid ${COLORS.lineStrong}`,
        background:
          "radial-gradient(circle at 80% 0%, rgba(64,231,255,.16), transparent 30%), linear-gradient(145deg, rgba(8,24,18,.84), rgba(3,9,7,.96))",
        boxShadow: "0 34px 100px rgba(0,0,0,.38)",
        marginBottom: 22,
      },
      heroImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: 0.34,
        filter: "saturate(1.08) contrast(1.1)",
      },
      heroOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(1,3,2,.98), rgba(1,3,2,.58) 52%, rgba(1,3,2,.22)), linear-gradient(90deg, rgba(1,3,2,.88), rgba(1,3,2,.22))",
      },
      heroContent: { position: "relative", zIndex: 2, width: "100%" },
      badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 13px",
        borderRadius: 999,
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: ".13em",
        textTransform: "uppercase",
      },
      title: {
        margin: "18px 0 0",
        fontSize: isMobile ? 52 : 96,
        lineHeight: 0.84,
        letterSpacing: "-.085em",
        fontWeight: 950,
        maxWidth: 900,
      },
      accent: {
        background: "linear-gradient(135deg,#16f5a2,#8fffe0,#40e7ff)",
        WebkitBackgroundClip: "text",
        color: "transparent",
      },
      subtitle: {
        maxWidth: 700,
        color: "rgba(231,255,247,.82)",
        fontSize: isMobile ? 15 : 19,
        lineHeight: 1.58,
        marginTop: 18,
        fontWeight: 650,
      },
      searchPanel: {
        marginTop: 24,
        padding: 14,
        borderRadius: 30,
        background: "rgba(255,255,255,.055)",
        border: `1px solid ${COLORS.lineStrong}`,
        backdropFilter: "blur(18px)",
        display: "grid",
        gap: 12,
        maxWidth: 980,
      },
      searchRow: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
        gap: 10,
      },
      searchInput: {
        width: "100%",
        boxSizing: "border-box",
        border: `1px solid ${COLORS.lineStrong}`,
        background: "rgba(1,3,2,.48)",
        color: COLORS.text,
        borderRadius: 999,
        padding: "17px 18px",
        outline: "none",
        fontSize: 15,
        fontWeight: 800,
      },
      clearButton: {
        border: `1px solid ${COLORS.line}`,
        background: "rgba(255,255,255,.055)",
        color: COLORS.text,
        borderRadius: 999,
        padding: "0 16px",
        minHeight: 52,
        cursor: "pointer",
        fontWeight: 900,
      },
      chips: { display: "flex", gap: 9, flexWrap: "wrap" },
      chip: (active) => ({
        border: active ? `1px solid ${COLORS.lineStrong}` : `1px solid ${COLORS.line}`,
        background: active
          ? "linear-gradient(135deg, rgba(22,245,162,.18), rgba(64,231,255,.13))"
          : "rgba(255,255,255,.045)",
        color: COLORS.text,
        borderRadius: 999,
        padding: "10px 13px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 900,
      }),
      stats: {
        marginTop: 22,
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)",
        gap: 10,
      },
      stat: {
        padding: 15,
        borderRadius: 22,
        background: "rgba(255,255,255,.045)",
        border: `1px solid ${COLORS.line}`,
      },
      statNum: { fontSize: 25, fontWeight: 950, letterSpacing: "-.04em" },
      statLabel: {
        marginTop: 4,
        color: COLORS.textDim,
        fontSize: 11,
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: ".10em",
      },
      toolbar: {
        margin: "22px 0 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 14,
        flexWrap: "wrap",
      },
      toolbarTitle: {
        fontSize: isMobile ? 31 : 46,
        lineHeight: 0.96,
        fontWeight: 950,
        letterSpacing: "-.065em",
      },
      toolbarText: { marginTop: 8, color: COLORS.textSoft, fontSize: 14, lineHeight: 1.55 },
      hostCta: {
        border: "none",
        borderRadius: 999,
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        padding: "14px 17px",
        fontWeight: 950,
        cursor: "pointer",
      },
      grid: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(330px, 1fr))",
        gap: 16,
      },
      card: {
        overflow: "hidden",
        borderRadius: 34,
        border: `1px solid ${COLORS.lineStrong}`,
        background: "linear-gradient(155deg, rgba(9,25,19,.86), rgba(3,9,7,.97))",
        boxShadow: "0 26px 74px rgba(0,0,0,.28)",
        cursor: "pointer",
        color: COLORS.text,
        padding: 0,
        textAlign: "left",
      },
      media: { position: "relative", height: 280, overflow: "hidden" },
      image: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.035)",
        filter: "saturate(1.08) contrast(1.05)",
      },
      overlay: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(1,3,2,.96), rgba(1,3,2,.12) 58%)",
      },
      topRow: {
        position: "absolute",
        top: 14,
        left: 14,
        right: 14,
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
      },
      pill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 11px",
        borderRadius: 999,
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontSize: 11,
        fontWeight: 950,
        textTransform: "uppercase",
        letterSpacing: ".08em",
      },
      ghostPill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 11px",
        borderRadius: 999,
        background: "rgba(3,15,11,.62)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontSize: 11,
        fontWeight: 900,
      },
      mediaBottom: { position: "absolute", left: 17, right: 17, bottom: 17 },
      type: {
        color: COLORS.mintSoft,
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        marginBottom: 8,
      },
      cardTitle: {
        margin: 0,
        fontSize: 34,
        lineHeight: 0.96,
        letterSpacing: "-.055em",
        fontWeight: 950,
      },
      location: { marginTop: 9, color: COLORS.textSoft, fontSize: 13, fontWeight: 750 },
      body: { padding: 16 },
      bodyTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 12,
        alignItems: "center",
      },
      smallLabel: {
        color: COLORS.textDim,
        fontSize: 10,
        fontWeight: 950,
        textTransform: "uppercase",
        letterSpacing: ".14em",
      },
      spots: { color: COLORS.mintSoft, fontSize: 13, fontWeight: 950 },
      dateList: { display: "grid", gap: 8 },
      dateRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "center",
        padding: "11px 12px",
        borderRadius: 17,
        background: "rgba(255,255,255,.045)",
        border: `1px solid ${COLORS.line}`,
      },
      dateFull: { opacity: 0.55 },
      dateLabel: { fontSize: 13, fontWeight: 850 },
      dateSpots: { fontSize: 12, fontWeight: 950, color: COLORS.mintSoft },
      bottomButton: {
        marginTop: 13,
        width: "100%",
        border: "none",
        borderRadius: 999,
        padding: "14px 16px",
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontSize: 14,
        fontWeight: 950,
        cursor: "pointer",
      },
      empty: {
        padding: 24,
        borderRadius: 30,
        background:
          "radial-gradient(circle at 90% 0%, rgba(22,245,162,.15), transparent 34%), linear-gradient(145deg, rgba(8,24,18,.74), rgba(3,9,7,.94))",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.textSoft,
      },
    }),
    [isMobile]
  );

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <section style={styles.hero}>
          <img src={FALLBACK} alt="Outdoor experiences" style={styles.heroImage} />
          <div style={styles.heroOverlay} />

          <div style={styles.heroContent}>
            <div style={styles.badge}>Explore Experiences</div>

            <h1 style={styles.title}>
              Find hosts.
              <br />
              <span style={styles.accent}>Book real adventures.</span>
            </h1>

            <div style={styles.subtitle}>
              Search outdoor hosts by activity, city, place or package. Discover dates,
              free spots, verified hosts and deposit options.
            </div>

            <div style={styles.searchPanel}>
              <div style={styles.searchRow}>
                <input
                  style={styles.searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search rafting, Tara, Niš, camping, skydiving..."
                />

                <button
                  type="button"
                  style={styles.clearButton}
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                    setOnlyVerified(false);
                    setOnlyFreeSpots(false);
                    setDepositMode("all");
                  }}
                >
                  Clear
                </button>
              </div>

              <div style={styles.chips}>
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    style={styles.chip(category === item)}
                    onClick={() => setCategory(item)}
                  >
                    {item === "all" ? "All" : item}
                  </button>
                ))}

                <button type="button" style={styles.chip(onlyVerified)} onClick={() => setOnlyVerified((x) => !x)}>
                  Verified
                </button>

                <button type="button" style={styles.chip(onlyFreeSpots)} onClick={() => setOnlyFreeSpots((x) => !x)}>
                  Free spots
                </button>

                <button
                  type="button"
                  style={styles.chip(depositMode === "no-deposit")}
                  onClick={() => setDepositMode((x) => (x === "no-deposit" ? "all" : "no-deposit"))}
                >
                  No deposit
                </button>

                <button
                  type="button"
                  style={styles.chip(depositMode === "deposit")}
                  onClick={() => setDepositMode((x) => (x === "deposit" ? "all" : "deposit"))}
                >
                  Deposit
                </button>
              </div>
            </div>

            <div style={styles.stats}>
              <div style={styles.stat}>
                <div style={styles.statNum}>{stats.hosts}</div>
                <div style={styles.statLabel}>Hosts</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.statNum}>{stats.packages}</div>
                <div style={styles.statLabel}>Packages</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.statNum}>{stats.totalSpots}</div>
                <div style={styles.statLabel}>Free spots</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.statNum}>{stats.verified}</div>
                <div style={styles.statLabel}>Verified</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.statNum}>{stats.cities}</div>
                <div style={styles.statLabel}>Cities</div>
              </div>
            </div>
          </div>
        </section>

        <div style={styles.toolbar}>
          <div>
            <div style={styles.toolbarTitle}>
              {loading ? "Loading experiences..." : `${filteredExperiences.length} experiences`}
            </div>
            <div style={styles.toolbarText}>
              Premium discovery for host profiles, packages and dates.
            </div>
          </div>

          <button type="button" style={styles.hostCta} onClick={() => navigate("/create-host")}>
            Become a host
          </button>
        </div>

        {filteredExperiences.length ? (
          <section style={styles.grid}>
            {filteredExperiences.map((item) => (
              <button key={item.id} type="button" style={styles.card} onClick={() => navigate(`/host/${item.slug}`)}>
                <div style={styles.media}>
                  <img src={item.image} alt={item.name} style={styles.image} />
                  <div style={styles.overlay} />

                  <div style={styles.topRow}>
                    <span style={styles.pill}>{item.verified ? "Verified" : "Experience"}</span>
                    <span style={styles.ghostPill}>{item.price}</span>
                  </div>

                  <div style={styles.mediaBottom}>
                    <div style={styles.type}>{item.category}</div>
                    <h2 style={styles.cardTitle}>{item.name}</h2>
                    <div style={styles.location}>📍 {item.location}</div>
                  </div>
                </div>

                <div style={styles.body}>
                  <div style={styles.bodyTop}>
                    <span style={styles.smallLabel}>
                      {item.packagesCount} package{item.packagesCount === 1 ? "" : "s"}
                    </span>
                    <span style={styles.spots}>{item.freeSpots} free spots</span>
                  </div>

                  <div style={styles.dateList}>
                    {item.dates.length ? (
                      item.dates.slice(0, 3).map((date) => {
                        const full = Number(date.free_spots || 0) <= 0 || date.closed;
                        return (
                          <div key={date.id} style={{ ...styles.dateRow, ...(full ? styles.dateFull : {}) }}>
                            <span style={styles.dateLabel}>{date.label}</span>
                            <span style={styles.dateSpots}>
                              {full ? "FULL" : `${date.free_spots}/${date.total_spots} free`}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={styles.dateRow}>
                        <span style={styles.dateLabel}>Dates soon</span>
                        <span style={styles.dateSpots}>Ask host</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.bottomButton}>Open booking page</div>
                </div>
              </button>
            ))}
          </section>
        ) : (
          <div style={styles.empty}>
            No experiences found. Try another search or create the first host profile.
          </div>
        )}
      </div>
    </main>
  );
}
