import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activityFilter, setActivityFilter] = useState("All Activities");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [customActivity, setCustomActivity] = useState("");
  const [customCountry, setCustomCountry] = useState("");

  // CUSTOM DROPDOWNS
  const [showActivityList, setShowActivityList] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadTours() {
      let { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setTours(data);
      setLoading(false);
    }

    loadTours();
  }, []);

  const activities = [
    "All Activities",
    "Hiking",
    "Cycling",
    "Bicycling",
    "Running / Marathon",
    "Pilgrimage",
    "Camping",
    "Rafting",
    "Kayaking",
    "Quad Riding",
    "Horse Riding",
    "Climbing",
    "Canyoning",
    "Paragliding",
    "Parasailing",
    "Skiing & Snowboarding",
    "Water Skiing",
    "Surfing",
    "Diving",
    "Snorkeling",
    "Boat Rides",
    "Road Trip",
    "Other",
  ];

  const countries = [
    "All Countries",
    "Serbia",
    "Bosnia & Herzegovina",
    "Croatia",
    "Montenegro",
    "North Macedonia",
    "Albania",
    "Greece",
    "Bulgaria",
    "Romania",
    "Slovenia",
    "Hungary",
    "Austria",
    "Germany",
    "Switzerland",
    "Italy",
    "Spain",
    "France",
    "Portugal",
    "Turkey",
    "Georgia",
    "Cyprus",
    "USA",
    "Canada",
    "Australia",
    "Other",
  ];

  const chooseActivity = (v) => {
    setActivityFilter(v);
    setShowActivityList(false);
  };

  const chooseCountry = (v) => {
    setCountryFilter(v);
    setShowCountryList(false);
  };

  const filteredTours = tours.filter((tour) => {
    const matchActivity =
      activityFilter === "All Activities"
        ? true
        : activityFilter === "Other"
        ? customActivity
          ? tour.activity?.toLowerCase() === customActivity.toLowerCase()
          : true
        : tour.activity === activityFilter;

    const matchCountry =
      countryFilter === "All Countries"
        ? true
        : countryFilter === "Other"
        ? customCountry
          ? tour.country?.toLowerCase() === customCountry.toLowerCase()
          : true
        : tour.country === countryFilter;

    return matchActivity && matchCountry;
  });

  const getCover = (tour) => {
    if (tour.cover_url) return tour.cover_url;
    if (tour.image_url) return tour.image_url;
    return "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg";
  };

  // -------------------------------------------
  //  🔥 PREMIUM GLOBAL STYLES
  // -------------------------------------------
  const styles = {
    page: {
      minHeight: "100vh",
      padding: "30px 16px 40px",
      background:
        "radial-gradient(circle at top, #00b894 0%, #00171f 40%, #000000 90%)",
      display: "flex",
      justifyContent: "center",
      color: "#e6fff9",
      fontFamily: "system-ui",
    },
    container: {
      width: "100%",
      maxWidth: 1200,
    },
    header: {
      textAlign: "center",
      marginBottom: 30,
    },
    title: {
      fontSize: 40,
      fontWeight: 800,
      background: "linear-gradient(120deg, #fff, #aaffee, #00ffb4, #00d1ff)",
      WebkitBackgroundClip: "text",
      color: "transparent",
      textShadow: "0 0 30px rgba(0,255,180,0.7)",
    },
    subtitle: {
      opacity: 0.8,
      fontSize: 16,
      marginTop: 8,
    },

    // 🔥 FILTER BAR
    filterBar: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: 35,
      padding: 16,
      borderRadius: 20,
      background: "rgba(0,0,0,0.45)",
      border: "1px solid rgba(0,255,180,0.3)",
      backdropFilter: "blur(14px)",
      position: "relative",
      zIndex: 1000, // FIX: FILTER BAR ABOVE GRID
    },
    filterGroup: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      position: "relative", // REQUIRED FOR ABSOLUTE DROPDOWN
    },
    filterLabel: {
      fontSize: 12,
      opacity: 0.8,
      marginBottom: 5,
    },

    // 🔥 CUSTOM DROPDOWN BOX
    dropdownBox: {
      padding: "12px 16px",
      borderRadius: 12,
      background: "rgba(0,255,180,0.15)",
      border: "1px solid rgba(0,255,180,0.5)",
      cursor: "pointer",
      backdropFilter: "blur(10px)",
      boxShadow: "0 0 15px rgba(0,255,180,0.4)",
      color: "#e6fff9",
      userSelect: "none",
    },

    // 🔥 DROPDOWN LIST (FIXED zIndex)
    dropdownList: {
      position: "absolute",
      top: 70,
      width: "100%",
      maxHeight: 220,
      overflowY: "auto",
      background: "rgba(0, 0, 0, 0.85)",
      border: "1px solid rgba(0,255,180,0.4)",
      backdropFilter: "blur(10px)",
      borderRadius: 14,
      boxShadow: "0 0 20px rgba(0,255,180,0.45)",
      zIndex: 9999, // FIX: ALWAYS ON TOP
    },
    dropdownItem: {
      padding: "12px 16px",
      cursor: "pointer",
      transition: "0.2s",
      color: "#e6fff9",
    },

    // 🔥 GRID
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 22,
      position: "relative",
      zIndex: 1, // BELOW DROPDOWN
    },

    // 🔥 CARD
    card: {
      borderRadius: 24,
      overflow: "hidden",
      background: "linear-gradient(145deg, #000, #002920)",
      border: "1px solid rgba(0,255,180,0.35)",
      cursor: "pointer",
      boxShadow: "0 20px 50px rgba(0,0,0,0.75)",
      transition: "0.3s",
    },
    imgWrapper: {
      height: 210,
      overflow: "hidden",
      position: "relative",
    },
    img: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "0.3s",
    },
    overlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
    },
    cardBody: {
      padding: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 700,
      textShadow: "0 0 10px rgba(0,255,180,0.5)",
      marginBottom: 5,
    },
    location: { opacity: 0.85, marginBottom: 4 },
    meta: { opacity: 0.8, fontSize: 12, marginBottom: 10 },
    button: {
      padding: "8px 14px",
      border: "none",
      borderRadius: 999,
      background: "linear-gradient(120deg, #00ffb4, #00d1ff)",
      color: "#003321",
      fontWeight: 700,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>MeetOutdoors Tours</h1>
          <p style={styles.subtitle}>
            Discover adventures created by real outdoor lovers.
          </p>
        </div>

        {/* FILTER BAR */}
        <div style={styles.filterBar}>
          {/* ACTIVITY DROPDOWN */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Activity</span>

            <div
              style={styles.dropdownBox}
              onClick={() => setShowActivityList(!showActivityList)}
            >
              {activityFilter}
            </div>

            {showActivityList && (
              <div style={styles.dropdownList}>
                {activities.map((a) => (
                  <div
                    key={a}
                    style={{
                      ...styles.dropdownItem,
                      color: a === activityFilter ? "#00ffb4" : "#e6fff9",
                    }}
                    onClick={() => chooseActivity(a)}
                    onMouseEnter={(e) =>
                      (e.target.style.background = "rgba(0,255,180,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background = "transparent")
                    }
                  >
                    {a}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COUNTRY DROPDOWN */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Country</span>

            <div
              style={styles.dropdownBox}
              onClick={() => setShowCountryList(!showCountryList)}
            >
              {countryFilter}
            </div>

            {showCountryList && (
              <div style={styles.dropdownList}>
                {countries.map((c) => (
                  <div
                    key={c}
                    style={{
                      ...styles.dropdownItem,
                      color: c === countryFilter ? "#00ffb4" : "#e6fff9",
                    }}
                    onClick={() => chooseCountry(c)}
                    onMouseEnter={(e) =>
                      (e.target.style.background = "rgba(0,255,180,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background = "transparent")
                    }
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* GRID */}
        <div style={styles.grid}>
          {!loading &&
            filteredTours.map((tour) => (
              <div
                key={tour.id}
                style={styles.card}
                onClick={() => navigate(`/tour/${tour.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px)";
                }}
              >
                <div style={styles.imgWrapper}>
                  <img src={getCover(tour)} style={styles.img} />
                  <div style={styles.overlay} />
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardTitle}>{tour.title}</div>
                  <div style={styles.location}>
                    📍 {tour.location_name}, {tour.country}
                  </div>
                  <div style={styles.meta}>🧭 {tour.activity}</div>

                  <button
                    style={styles.button}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tour/${tour.id}`);
                    }}
                  >
                    View Tour
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}