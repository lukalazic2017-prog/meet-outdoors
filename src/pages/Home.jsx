import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* =========================================================
   SVG IKONICE — BEZ DODATNIH BIBLIOTEKA
========================================================= */

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  fill = "none",
  className = "",
}) {
  const icons = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),

    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),

    hiking: (
      <>
        <path d="M3 20 9 9l4 7 3-5 5 9" />
        <path d="M4 20h16" />
        <circle cx="17" cy="5" r="2" />
      </>
    ),

    camping: (
      <>
        <path d="m4 20 8-15 8 15" />
        <path d="M8 20h8" />
        <path d="m12 5 4 15" />
      </>
    ),

    rafting: (
      <>
        <path d="M4 15h16l-2 4H6l-2-4Z" />
        <path d="m8 15 2-7" />
        <path d="m16 15-2-7" />
        <path d="M3 22c2-1 4-1 6 0 2 1 4 1 6 0 2-1 4-1 6 0" />
      </>
    ),

    cycling: (
      <>
        <circle cx="6" cy="17" r="4" />
        <circle cx="18" cy="17" r="4" />
        <path d="m6 17 4-8h4l4 8" />
        <path d="M10 9 8 6" />
        <path d="M13 6h3" />
        <path d="m10 9 4 8" />
      </>
    ),

    climbing: (
      <>
        <circle cx="15" cy="4" r="2" />
        <path d="m13 7-3 4 3 3-2 6" />
        <path d="m13 9 4 3 3-1" />
        <path d="m10 11-4 2-2 4" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6" />
        <path d="M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    star: (
      <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9L6.4 20l1.1-6.2L3 9.4l6.2-.9L12 2.8Z" />
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    package: (
      <>
        <path d="m4 8 8-4 8 4-8 4-8-4Z" />
        <path d="m4 8 8 4 8-4" />
        <path d="M4 8v8l8 4 8-4V8" />
        <path d="M12 12v8" />
      </>
    ),

    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),

    booking: (
      <>
        <rect x="4" y="4" width="16" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M4 9h16" />
        <path d="m8 15 2 2 5-5" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    trend: (
      <>
        <path d="m3 17 6-6 4 4 7-8" />
        <path d="M15 7h5v5" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    sparkles: (
      <>
        <path d="m12 3 1.1 3.4L16.5 8l-3.4 1.6L12 13l-1.1-3.4L7.5 8l3.4-1.6L12 3Z" />
        <path d="m19 14 .7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14Z" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

/* =========================================================
   PODACI
========================================================= */

const categories = [
  { label: "Sve", value: "", icon: "compass" },
  { label: "Planinarenje", value: "hiking", icon: "hiking" },
  { label: "Kampovanje", value: "camping", icon: "camping" },
  { label: "Rafting", value: "rafting", icon: "rafting" },
  { label: "Biciklizam", value: "cycling", icon: "cycling" },
  { label: "Penjanje", value: "climbing", icon: "climbing" },
];

const featuredEvents = [
  {
    id: 1,
    title: "Izlazak sunca iznad oblaka",
    location: "Kopaonik, Srbija",
    date: "12. avg",
    category: "Planinarenje",
    price: "4.100 RSD",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=88",
  },
  {
    id: 2,
    title: "Divlji rafting kroz kanjon Tare",
    location: "Kanjon Tare, Crna Gora",
    date: "18. avg",
    category: "Rafting",
    price: "8.800 RSD",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=1400&q=88",
  },
  {
    id: 3,
    title: "Kampovanje pod zvezdama",
    location: "Zlatibor, Srbija",
    date: "24. avg",
    category: "Kampovanje",
    price: "5.700 RSD",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1400&q=88",
  },
];

const hostStats = [
  {
    label: "Aktivni događaji",
    value: "8",
    description: "+2 ovog meseca",
    icon: "calendar",
  },
  {
    label: "Rezervacije",
    value: "24",
    description: "5 novih zahteva",
    icon: "booking",
  },
  {
    label: "Zainteresovani",
    value: "137",
    description: "+18 ove nedelje",
    icon: "users",
  },
  {
    label: "Host ocena",
    value: "4.9",
    description: "Na osnovu 46 ocena",
    icon: "star",
  },
];

const hostBookings = [
  {
    id: 1,
    guest: "Nikola Jovanović",
    event: "Uspon na Midžor",
    people: 2,
    date: "14. avgust",
    status: "Na čekanju",
  },
  {
    id: 2,
    guest: "Ana Petrović",
    event: "Vikend na Tari",
    people: 1,
    date: "18. avgust",
    status: "Na čekanju",
  },
  {
    id: 3,
    guest: "Marko Ilić",
    event: "Kampovanje na Zlatiboru",
    people: 3,
    date: "24. avgust",
    status: "Odobreno",
  },
];

/* =========================================================
   ZAJEDNIČKA PRETRAGA
========================================================= */

function AdventureSearch({ firstName = "" }) {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (location.trim()) {
      params.set("location", location.trim());
    }

    if (category) {
      params.set("category", category);
    }

    const query = params.toString();

    navigate(query ? `/events?${query}` : "/events");
  }

  return (
    <form className="searchCard" onSubmit={handleSubmit}>
      <div className="searchTop">
        <div>
          <span>
            {firstName
              ? `Gde idemo sledeće, ${firstName}?`
              : "Pronađi sledeću avanturu"}
          </span>

          <strong>Šta želiš da istražiš?</strong>
        </div>

        <div className="searchTopIcon">
          <Icon name="sparkles" size={21} />
        </div>
      </div>

      <label className="searchInput">
        <Icon name="mapPin" size={20} />

        <input
          type="search"
          value={location}
          placeholder="Grad, planina ili destinacija"
          onChange={(event) => setLocation(event.target.value)}
        />
      </label>

      <div className="categoryRow">
        {categories.map((item) => (
          <button
            key={item.label}
            type="button"
            className={category === item.value ? "active" : ""}
            onClick={() => setCategory(item.value)}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </button>
        ))}
      </div>

      <button type="submit" className="primarySearchButton">
        <Icon name="search" size={19} />
        Istraži avanture
        <Icon name="arrowRight" size={19} />
      </button>
    </form>
  );
}

/* =========================================================
   KARTICE DOGAĐAJA
========================================================= */

function EventCards() {
  return (
    <div className="eventGrid">
      {featuredEvents.map((event) => (
        <Link
          key={event.id}
          to={`/event/${event.id}`}
          className="eventCard"
        >
          <img src={event.image} alt={event.title} />

          <div className="eventOverlay" />

          <div className="eventTop">
            <span>{event.category}</span>
            <span>{event.date}</span>
          </div>

          <div className="eventBody">
            <div className="eventLocation">
              <Icon name="mapPin" size={15} />
              {event.location}
            </div>

            <h3>{event.title}</h3>

            <div className="eventRating">
              <Icon name="star" size={15} fill="currentColor" />
              {event.rating}
            </div>

            <div className="eventFooter">
              <div>
                <small>Od</small>
                <strong>{event.price}</strong>
              </div>

              <span>
                <Icon name="arrowRight" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* =========================================================
   GUEST HOME — PRE PRIJAVE
========================================================= */

function GuestHome() {
  return (
    <main className="home">
      <section className="guestHero">
        <div className="guestHeroBackground" />
        <div className="guestHeroOverlay" />

        <div className="pageContainer guestHeroContent">
          <div className="guestCopy">
            <span className="eyebrow">
              <span className="eyebrowDot" />
              Prave avanture. Pravi ljudi.
            </span>

            <h1>
              Tvoja sledeća priča
              <em>počinje napolju.</em>
            </h1>

            <p>
              Pronađi outdoor događaje, upoznaj lokalne domaćine ili
              pretvori svoju strast prema prirodi u iskustva koja drugi
              mogu da rezervišu.
            </p>

            <div className="guestActions">
              <Link to="/signup" className="lightButton">
                Pridruži se zajednici
                <Icon name="arrowRight" />
              </Link>

              <Link to="/login" className="glassButton">
                Već imam nalog
              </Link>
            </div>

            <div className="guestProof">
              <div>
                <strong>350+</strong>
                <span>avanturista</span>
              </div>

              <div>
                <strong>70+</strong>
                <span>outdoor događaja</span>
              </div>

              <div>
                <strong>4.9</strong>
                <span>prosečna ocena</span>
              </div>
            </div>
          </div>

          <AdventureSearch />
        </div>
      </section>

      <section className="roleChoice pageContainer">
        <div className="sectionHeading centered">
          <span>Jedna zajednica, dva načina da je doživiš</span>
          <h2>Pronađi svoju ulogu u prirodi.</h2>
        </div>

        <div className="roleGrid">
          <article className="roleCard userRole">
            <div className="roleImage roleUserImage" />

            <div className="roleGradient" />

            <div className="roleContent">
              <span className="roleNumber">01</span>

              <h3>Tražiš sledeću avanturu?</h3>

              <p>
                Otkrij događaje, rezerviši mesto i upoznaj ljude koji
                dele tvoju energiju.
              </p>

              <Link to="/signup">
                Pridruži se kao korisnik
                <Icon name="arrowRight" />
              </Link>
            </div>
          </article>

          <article className="roleCard hostRole">
            <div className="roleImage roleHostImage" />

            <div className="roleGradient" />

            <div className="roleContent">
              <span className="roleNumber">02</span>

              <h3>Organizuješ outdoor iskustva?</h3>

              <p>
                Objavi događaje, upravljaj rezervacijama i izgradi
                reputaciju pouzdanog domaćina.
              </p>

              <Link to="/signup">
                Postani domaćin
                <Icon name="arrowRight" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="featuredSection pageContainer">
        <div className="sectionHeading">
          <div>
            <span>Odabrano za tebe</span>
            <h2>Avanture koje se pamte.</h2>
          </div>

          <Link to="/events" className="sectionLink">
            Pogledaj sve
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>

        <EventCards />
      </section>

      <section className="guestFinal">
        <div className="guestFinalBackground" />
        <div className="guestFinalOverlay" />

        <div className="guestFinalContent">
          <span>MeetOutdoors zajednica</span>

          <h2>
            Manje skrolovanja.
            <em>Više života napolju.</em>
          </h2>

          <p>
            Napravi nalog i pronađi ljude, mesta i iskustva zbog kojih ćeš
            želeti da vikend traje duže.
          </p>

          <Link to="/signup" className="lightButton">
            Kreiraj besplatan nalog
            <Icon name="arrowRight" />
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   USER HOME — ULOGOVANI KORISNIK
========================================================= */

function UserHome({ profile }) {
  const firstName = useMemo(() => {
    if (!profile?.full_name) return "";
    return profile.full_name.trim().split(" ")[0];
  }, [profile]);

  return (
    <main className="home">
      <section className="userHero">
        <div className="userHeroBackground" />
        <div className="userHeroOverlay" />

        <div className="pageContainer userHeroContent">
          <div className="userHeroCopy">
            <span className="eyebrow">
              <span className="eyebrowDot" />
              Dobrodošao nazad
            </span>

            <h1>
              {firstName ? `${firstName}, ` : ""}
              priroda ima
              <em>novi plan za tebe.</em>
            </h1>

            <p>
              Otkrij događaje prilagođene tvojoj energiji, rezerviši
              sledeću avanturu i upoznaj ljude sa kojima ćeš je pamtiti.
            </p>
          </div>

          <AdventureSearch firstName={firstName} />
        </div>
      </section>

      <section className="quickLinks pageContainer">
        <Link to="/events">
          <span>
            <Icon name="compass" />
          </span>

          <div>
            <strong>Istraži događaje</strong>
            <small>Pronađi sledeću avanturu</small>
          </div>

          <Icon name="arrowRight" />
        </Link>

        <Link to="/packages">
          <span>
            <Icon name="package" />
          </span>

          <div>
            <strong>Adventure paketi</strong>
            <small>Kompletna outdoor iskustva</small>
          </div>

          <Icon name="arrowRight" />
        </Link>

        <Link to="/hosts">
          <span>
            <Icon name="users" />
          </span>

          <div>
            <strong>Pronađi domaćina</strong>
            <small>Upoznaj lokalne eksperte</small>
          </div>

          <Icon name="arrowRight" />
        </Link>
      </section>

      <section className="featuredSection pageContainer">
        <div className="sectionHeading">
          <div>
            <span>Preporučeno za tebe</span>
            <h2>Tvoj sledeći vikend počinje ovde.</h2>
          </div>

          <Link to="/events" className="sectionLink">
            Svi događaji
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>

        <EventCards />
      </section>

      <section className="userBanner pageContainer">
        <div className="userBannerImage" />

        <div className="userBannerOverlay" />

        <div className="userBannerContent">
          <span>
            <Icon name="sparkles" size={16} />
            Izađi iz rutine
          </span>

          <h2>
            Ne čekaj savršen trenutak.
            <em>Napravi ga.</em>
          </h2>

          <p>
            Pronađi događaj koji odgovara tvojoj energiji i rezerviši
            svoje mesto.
          </p>

          <Link to="/events" className="lightButton">
            Pronađi avanturu
            <Icon name="arrowRight" />
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   HOST HOME — ULOGOVANI DOMAĆIN
========================================================= */

function HostHome({ profile }) {
  const firstName = useMemo(() => {
    if (!profile?.full_name) return "Domaćine";
    return profile.full_name.trim().split(" ")[0];
  }, [profile]);

  return (
    <main className="home hostHome">
      <section className="hostHero">
        <div className="hostHeroBackground" />
        <div className="hostHeroOverlay" />

        <div className="pageContainer hostHeroContent">
          <div className="hostHeroCopy">
            <span className="eyebrow">
              <span className="eyebrowDot" />
              Host studio
            </span>

            <h1>
              Dobrodošao, {firstName}.
              <em>Hajde da stvorimo nešto nezaboravno.</em>
            </h1>

            <p>
              Upravljaj događajima, rezervacijama i svojim outdoor
              biznisom sa jednog mesta.
            </p>

            <div className="hostHeroActions">
              <Link to="/create-event" className="lightButton">
                <Icon name="plus" />
                Kreiraj događaj
              </Link>

              <Link to="/dashboard" className="glassButton">
                <Icon name="dashboard" />
                Otvori dashboard
              </Link>
            </div>
          </div>

          <div className="hostTodayCard">
            <div className="hostTodayTop">
              <div>
                <span>Današnji pregled</span>
                <strong>Tvoj host studio</strong>
              </div>

              <div className="onlineBadge">
                <span />
                Aktivno
              </div>
            </div>

            <div className="hostTodayStats">
              <article>
                <Icon name="booking" />
                <div>
                  <strong>5</strong>
                  <span>Nove rezervacije</span>
                </div>
              </article>

              <article>
                <Icon name="eye" />
                <div>
                  <strong>218</strong>
                  <span>Pregleda profila</span>
                </div>
              </article>

              <article>
                <Icon name="users" />
                <div>
                  <strong>18</strong>
                  <span>Novih interesovanja</span>
                </div>
              </article>
            </div>

            <Link to="/dashboard">
              Pogledaj kompletan pregled
              <Icon name="arrowRight" />
            </Link>
          </div>
        </div>
      </section>

      <section className="hostStats pageContainer">
        {hostStats.map((stat) => (
          <article key={stat.label}>
            <div className="hostStatIcon">
              <Icon
                name={stat.icon}
                fill={stat.icon === "star" ? "currentColor" : "none"}
              />
            </div>

            <div className="hostStatTop">
              <span>{stat.label}</span>
              <Icon name="trend" size={17} />
            </div>

            <strong>{stat.value}</strong>
            <small>{stat.description}</small>
          </article>
        ))}
      </section>

      <section className="hostWorkspace pageContainer">
        <div className="hostMainColumn">
          <div className="hostSectionHeader">
            <div>
              <span>Potrebna je tvoja pažnja</span>
              <h2>Novi zahtevi za rezervaciju</h2>
            </div>

            <Link to="/dashboard/bookings">
              Sve rezervacije
              <Icon name="arrowRight" size={17} />
            </Link>
          </div>

          <div className="bookingList">
            {hostBookings.map((booking) => (
              <article className="bookingItem" key={booking.id}>
                <div className="bookingAvatar">
                  {booking.guest.charAt(0)}
                </div>

                <div className="bookingInfo">
                  <strong>{booking.guest}</strong>
                  <span>{booking.event}</span>
                </div>

                <div className="bookingMeta">
                  <span>
                    <Icon name="calendar" size={15} />
                    {booking.date}
                  </span>

                  <span>
                    <Icon name="users" size={15} />
                    {booking.people}
                  </span>
                </div>

                <span
                  className={`bookingStatus ${
                    booking.status === "Odobreno" ? "approved" : ""
                  }`}
                >
                  {booking.status}
                </span>

                <Link to="/dashboard/bookings">
                  <Icon name="arrowRight" />
                </Link>
              </article>
            ))}
          </div>
        </div>

        <aside className="hostSideColumn">
          <div className="quickCreateCard">
            <span className="hostCardKicker">Brze akcije</span>

            <h3>Šta želiš da kreiraš?</h3>

            <Link to="/create-event">
              <span>
                <Icon name="calendar" />
              </span>

              <div>
                <strong>Novi događaj</strong>
                <small>Jednodnevna outdoor aktivnost</small>
              </div>

              <Icon name="arrowRight" />
            </Link>

            <Link to="/create-package">
              <span>
                <Icon name="package" />
              </span>

              <div>
                <strong>Novi paket</strong>
                <small>Višednevno kompletno iskustvo</small>
              </div>

              <Icon name="arrowRight" />
            </Link>
          </div>

          <div className="profileProgressCard">
            <div className="progressTop">
              <span>Host profil</span>
              <strong>82%</strong>
            </div>

            <div className="progressBar">
              <span />
            </div>

            <h3>Tvoj profil je skoro spreman.</h3>

            <p>
              Dodaj još fotografija i detaljan opis kako bi povećao
              poverenje gostiju.
            </p>

            <Link to="/profile">
              Dovrši profil
              <Icon name="arrowRight" size={17} />
            </Link>
          </div>
        </aside>
      </section>

      <section className="hostMotivation pageContainer">
        <div className="hostMotivationImage" />
        <div className="hostMotivationOverlay" />

        <div className="hostMotivationContent">
          <span>Tvoja zajednica raste</span>

          <h2>
            Ne organizuješ samo događaje.
            <em>Stvaraš uspomene.</em>
          </h2>

          <p>
            Svaki novi događaj je prilika da neko otkrije novo mesto,
            upozna nove ljude i ponese priču koju će dugo pamtiti.
          </p>

          <Link to="/create-event" className="lightButton">
            Kreiraj sledeću avanturu
            <Icon name="arrowRight" />
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   GLAVNA HOME KOMPONENTA
========================================================= */

export default function Home() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <>
        <HomeStyles />

        <div className="homeLoading">
          <div className="loadingLogo">
            <Icon name="compass" size={31} />
          </div>

          <span>MeetOutdoors</span>
        </div>
      </>
    );
  }

  const isHost = profile?.role === "host";
  const isUser = profile && !isHost;

  return (
    <>
      <HomeStyles />

      {!profile && <GuestHome />}
      {isUser && <UserHome profile={profile} />}
      {isHost && <HostHome profile={profile} />}
    </>
  );
}

/* =========================================================
   SVE STILIZACIJE U ISTOM JSX FAJLU
========================================================= */

function HomeStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        background: #f4f5ef;
      }

      button,
      input {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .home {
        min-height: 100vh;
        overflow: hidden;
        background:
          radial-gradient(circle at 12% 20%, rgba(166, 201, 128, 0.15), transparent 28%),
          #f4f5ef;
        color: #14251d;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .home a {
        color: inherit;
        text-decoration: none;
      }

      .pageContainer {
        width: min(1200px, calc(100% - 48px));
        margin-inline: auto;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 9px 14px;
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 999px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(15px);
        color: white;
        font-size: 12px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .eyebrowDot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #c9f28c;
        box-shadow: 0 0 0 5px rgba(201,242,140,0.13);
      }

      .lightButton,
      .glassButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        min-height: 57px;
        padding: 0 22px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 850;
        transition: 0.22s ease;
      }

      .lightButton {
        background: #c9f28c;
        color: #153020 !important;
        box-shadow: 0 17px 38px rgba(0,0,0,0.2);
      }

      .lightButton:hover {
        gap: 16px;
        transform: translateY(-2px);
      }

      .glassButton {
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(255,255,255,0.09);
        color: white !important;
        backdrop-filter: blur(14px);
      }

      .glassButton:hover {
        background: rgba(255,255,255,0.16);
        transform: translateY(-2px);
      }

      /* GUEST HERO */

      .guestHero,
      .userHero,
      .hostHero {
        position: relative;
        isolation: isolate;
        min-height: 850px;
        display: flex;
        align-items: center;
        padding: 130px 0 90px;
        color: white;
      }

      .guestHeroBackground,
      .userHeroBackground,
      .hostHeroBackground {
        position: absolute;
        inset: 0;
        z-index: -3;
        background-size: cover;
        background-position: center;
      }

      .guestHeroBackground {
        background-image:
          url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=92");
      }

      .userHeroBackground {
        background-image:
          url("https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2200&q=92");
      }

      .hostHeroBackground {
        background-image:
          url("https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2200&q=92");
      }

      .guestHeroOverlay,
      .userHeroOverlay,
      .hostHeroOverlay {
        position: absolute;
        inset: 0;
        z-index: -2;
      }

      .guestHeroOverlay,
      .userHeroOverlay {
        background:
          linear-gradient(90deg, rgba(6,17,11,0.94), rgba(7,20,13,0.65) 55%, rgba(7,18,12,0.28)),
          linear-gradient(0deg, rgba(6,16,10,0.75), transparent 60%);
      }

      .hostHeroOverlay {
        background:
          linear-gradient(90deg, rgba(6,17,11,0.95), rgba(7,20,13,0.72) 60%, rgba(7,18,12,0.25)),
          linear-gradient(0deg, rgba(6,16,10,0.78), transparent 60%);
      }

      .guestHeroContent,
      .userHeroContent,
      .hostHeroContent {
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(390px, 0.72fr);
        align-items: center;
        gap: 75px;
      }

      .guestCopy h1,
      .userHeroCopy h1,
      .hostHeroCopy h1 {
        max-width: 790px;
        margin: 24px 0 0;
        font-size: clamp(55px, 7vw, 92px);
        line-height: 0.96;
        letter-spacing: -0.075em;
      }

      .guestCopy h1 em,
      .userHeroCopy h1 em,
      .hostHeroCopy h1 em {
        display: block;
        color: #c9f28c;
        font-style: normal;
      }

      .guestCopy > p,
      .userHeroCopy > p,
      .hostHeroCopy > p {
        max-width: 630px;
        margin: 27px 0 0;
        color: rgba(255,255,255,0.7);
        font-size: 17px;
        line-height: 1.75;
      }

      .guestActions,
      .hostHeroActions {
        display: flex;
        flex-wrap: wrap;
        gap: 13px;
        margin-top: 32px;
      }

      .guestProof {
        display: flex;
        flex-wrap: wrap;
        gap: 34px;
        margin-top: 40px;
      }

      .guestProof div {
        display: grid;
        gap: 3px;
      }

      .guestProof strong {
        font-size: 21px;
      }

      .guestProof span {
        color: rgba(255,255,255,0.55);
        font-size: 12px;
      }

      /* SEARCH */

      .searchCard,
      .hostTodayCard {
        padding: 28px;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 29px;
        background: rgba(247,249,243,0.95);
        color: #14251d;
        box-shadow: 0 35px 90px rgba(0,0,0,0.35);
        backdrop-filter: blur(22px);
      }

      .searchTop,
      .hostTodayTop {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 21px;
      }

      .searchTop span,
      .hostTodayTop span {
        display: block;
        margin-bottom: 6px;
        color: #758177;
        font-size: 11px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .searchTop strong,
      .hostTodayTop strong {
        font-size: 23px;
        letter-spacing: -0.035em;
      }

      .searchTopIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 45px;
        height: 45px;
        border-radius: 14px;
        background: #e8f3da;
        color: #416329;
      }

      .searchInput {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 58px;
        padding: 0 17px;
        border: 1px solid #d8ded5;
        border-radius: 16px;
        background: white;
        color: #68756d;
      }

      .searchInput:focus-within {
        border-color: #789a51;
        box-shadow: 0 0 0 4px rgba(120,154,81,0.12);
      }

      .searchInput input {
        width: 100%;
        min-height: 56px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #14251d;
      }

      .categoryRow {
        display: flex;
        gap: 8px;
        margin: 16px -3px 20px;
        padding: 3px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .categoryRow::-webkit-scrollbar {
        display: none;
      }

      .categoryRow button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 41px;
        padding: 0 13px;
        border: 1px solid #d9dfd6;
        border-radius: 999px;
        background: transparent;
        color: #69746c;
        cursor: pointer;
        font-size: 12px;
        font-weight: 750;
      }

      .categoryRow button.active {
        border-color: #183a27;
        background: #183a27;
        color: white;
      }

      .primarySearchButton {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        width: 100%;
        min-height: 58px;
        padding: 0 19px;
        border: 0;
        border-radius: 16px;
        background: #172f22;
        color: white;
        cursor: pointer;
        font-weight: 850;
        box-shadow: 0 15px 30px rgba(23,47,34,0.19);
      }

      .primarySearchButton svg:last-child {
        margin-left: auto;
      }

      /* ROLE CHOICE */

      .roleChoice,
      .featuredSection {
        padding: 115px 0;
      }

      .sectionHeading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 25px;
        margin-bottom: 40px;
      }

      .sectionHeading.centered {
        display: block;
        max-width: 720px;
        margin-inline: auto;
        text-align: center;
        margin-bottom: 45px;
      }

      .sectionHeading span,
      .hostSectionHeader > div > span,
      .hostCardKicker {
        display: block;
        margin-bottom: 11px;
        color: #718d52;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .sectionHeading h2,
      .hostSectionHeader h2 {
        margin: 0;
        font-size: clamp(39px, 5vw, 60px);
        line-height: 1.04;
        letter-spacing: -0.06em;
      }

      .sectionLink,
      .hostSectionHeader > a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 5px;
        border-bottom: 1px solid #9ba79e;
        font-size: 13px;
        font-weight: 850;
      }

      .roleGrid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 22px;
      }

      .roleCard {
        position: relative;
        min-height: 580px;
        overflow: hidden;
        border-radius: 32px;
        color: white;
        box-shadow: 0 24px 60px rgba(27,44,34,0.15);
      }

      .roleImage,
      .roleGradient {
        position: absolute;
        inset: 0;
      }

      .roleImage {
        background-size: cover;
        background-position: center;
        transition: transform 0.7s ease;
      }

      .roleCard:hover .roleImage {
        transform: scale(1.05);
      }

      .roleUserImage {
        background-image:
          url("https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1400&q=88");
      }

      .roleHostImage {
        background-image:
          url("https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=88");
      }

      .roleGradient {
        background:
          linear-gradient(180deg, rgba(5,15,9,0.05), rgba(5,16,10,0.92));
      }

      .roleContent {
        position: absolute;
        inset: auto 0 0;
        padding: 32px;
      }

      .roleNumber {
        color: #c9f28c;
        font-size: 12px;
        font-weight: 850;
      }

      .roleContent h3 {
        max-width: 470px;
        margin: 16px 0 13px;
        font-size: 38px;
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .roleContent p {
        max-width: 480px;
        margin: 0;
        color: rgba(255,255,255,0.68);
        line-height: 1.65;
      }

      .roleContent a {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin-top: 24px;
        color: #c9f28c;
        font-size: 13px;
        font-weight: 850;
      }

      /* EVENTS */

      .eventGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }

      .eventCard {
        position: relative;
        min-height: 510px;
        overflow: hidden;
        border-radius: 28px;
        color: white;
        box-shadow: 0 20px 50px rgba(24,41,31,0.14);
        transition: 0.3s ease;
      }

      .eventCard:hover {
        transform: translateY(-7px);
        box-shadow: 0 30px 70px rgba(24,41,31,0.22);
      }

      .eventCard > img,
      .eventOverlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .eventCard > img {
        object-fit: cover;
        transition: transform 0.7s ease;
      }

      .eventCard:hover > img {
        transform: scale(1.06);
      }

      .eventOverlay {
        background:
          linear-gradient(180deg, rgba(5,14,8,0.08), rgba(5,15,9,0.92));
      }

      .eventTop {
        position: absolute;
        top: 17px;
        left: 17px;
        right: 17px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .eventTop span {
        padding: 8px 11px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 999px;
        background: rgba(7,20,12,0.45);
        backdrop-filter: blur(11px);
        font-size: 10px;
        font-weight: 850;
      }

      .eventBody {
        position: absolute;
        inset: auto 0 0;
        padding: 24px;
      }

      .eventLocation,
      .eventRating {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .eventLocation {
        color: rgba(255,255,255,0.64);
        font-size: 12px;
      }

      .eventBody h3 {
        margin: 9px 0 13px;
        font-size: 27px;
        line-height: 1.08;
        letter-spacing: -0.045em;
      }

      .eventRating {
        color: #d0f89a;
        font-size: 13px;
        font-weight: 800;
      }

      .eventFooter {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-top: 18px;
        padding-top: 17px;
        border-top: 1px solid rgba(255,255,255,0.15);
      }

      .eventFooter small {
        display: block;
        color: rgba(255,255,255,0.55);
      }

      .eventFooter strong {
        display: block;
        margin-top: 2px;
      }

      .eventFooter > span {
        display: grid;
        place-items: center;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: #c9f28c;
        color: #163020;
      }

      /* GUEST FINAL */

      .guestFinal {
        position: relative;
        isolation: isolate;
        min-height: 650px;
        display: grid;
        place-items: center;
        padding: 80px 24px;
        color: white;
        text-align: center;
      }

      .guestFinalBackground,
      .guestFinalOverlay {
        position: absolute;
        inset: 0;
      }

      .guestFinalBackground {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=2200&q=90")
          center / cover;
      }

      .guestFinalOverlay {
        z-index: -1;
        background: rgba(7,20,12,0.78);
      }

      .guestFinalContent {
        max-width: 850px;
      }

      .guestFinalContent > span,
      .hostMotivationContent > span {
        color: #c9f28c;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .guestFinalContent h2,
      .hostMotivationContent h2 {
        margin: 17px 0 0;
        font-size: clamp(45px, 6vw, 76px);
        line-height: 1;
        letter-spacing: -0.065em;
      }

      .guestFinalContent h2 em,
      .hostMotivationContent h2 em {
        display: block;
        color: #c9f28c;
        font-style: normal;
      }

      .guestFinalContent p,
      .hostMotivationContent p {
        max-width: 630px;
        margin: 23px auto 30px;
        color: rgba(255,255,255,0.67);
        line-height: 1.7;
      }

      /* USER HOME */

      .quickLinks {
        position: relative;
        z-index: 5;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: -40px;
      }

      .quickLinks > a {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 14px;
        padding: 23px;
        border: 1px solid #dde3db;
        border-radius: 21px;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 20px 50px rgba(27,45,34,0.1);
        backdrop-filter: blur(14px);
        transition: 0.22s ease;
      }

      .quickLinks > a:hover {
        transform: translateY(-4px);
      }

      .quickLinks > a > span {
        display: grid;
        place-items: center;
        width: 47px;
        height: 47px;
        border-radius: 15px;
        background: #eaf3de;
        color: #47672e;
      }

      .quickLinks strong,
      .quickLinks small {
        display: block;
      }

      .quickLinks small {
        margin-top: 4px;
        color: #7b877f;
      }

      .userBanner,
      .hostMotivation {
        position: relative;
        isolation: isolate;
        min-height: 620px;
        display: flex;
        align-items: center;
        margin-bottom: 120px;
        overflow: hidden;
        border-radius: 34px;
        color: white;
      }

      .userBannerImage,
      .userBannerOverlay,
      .hostMotivationImage,
      .hostMotivationOverlay {
        position: absolute;
        inset: 0;
      }

      .userBannerImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1900&q=90")
          center / cover;
      }

      .userBannerOverlay,
      .hostMotivationOverlay {
        z-index: -1;
        background:
          linear-gradient(90deg, rgba(6,18,11,0.92), rgba(6,18,11,0.57), rgba(6,18,11,0.12));
      }

      .userBannerContent,
      .hostMotivationContent {
        max-width: 700px;
        padding: 70px;
      }

      .userBannerContent > span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #c9f28c;
        font-size: 11px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .userBannerContent h2 {
        margin: 18px 0 0;
        font-size: clamp(44px, 5.5vw, 70px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .userBannerContent h2 em {
        display: block;
        color: #c9f28c;
        font-style: normal;
      }

      .userBannerContent p {
        max-width: 570px;
        margin: 23px 0 29px;
        color: rgba(255,255,255,0.67);
        line-height: 1.7;
      }

      /* HOST HOME */

      .onlineBadge {
        display: flex;
        align-items: center;
        gap: 7px;
        align-self: flex-start;
        padding: 8px 10px;
        border-radius: 999px;
        background: #e9f5dc;
        color: #426429;
        font-size: 10px;
        font-weight: 850;
      }

      .onlineBadge span {
        width: 7px;
        height: 7px;
        margin: 0;
        border-radius: 50%;
        background: #61a62f;
      }

      .hostTodayStats {
        display: grid;
        gap: 10px;
      }

      .hostTodayStats article {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 15px;
        border: 1px solid #dfe5dc;
        border-radius: 16px;
        background: white;
      }

      .hostTodayStats article > svg {
        color: #658347;
      }

      .hostTodayStats strong,
      .hostTodayStats span {
        display: block;
      }

      .hostTodayStats strong {
        font-size: 19px;
      }

      .hostTodayStats span {
        margin: 2px 0 0;
        color: #7d8981;
        font-size: 11px;
        text-transform: none;
        letter-spacing: 0;
      }

      .hostTodayCard > a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid #dfe4dc;
        color: #36543f;
        font-size: 13px;
        font-weight: 850;
      }

      .hostStats {
        position: relative;
        z-index: 5;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-top: -45px;
      }

      .hostStats article {
        padding: 22px;
        border: 1px solid #dce2da;
        border-radius: 21px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 20px 50px rgba(27,45,34,0.1);
      }

      .hostStatIcon {
        display: grid;
        place-items: center;
        width: 43px;
        height: 43px;
        margin-bottom: 20px;
        border-radius: 14px;
        background: #eaf3de;
        color: #4a6d30;
      }

      .hostStatTop {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: #7a867e;
        font-size: 12px;
      }

      .hostStatTop svg {
        color: #719c4d;
      }

      .hostStats article > strong {
        display: block;
        margin-top: 8px;
        font-size: 35px;
        letter-spacing: -0.05em;
      }

      .hostStats article > small {
        color: #7e8982;
      }

      .hostWorkspace {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(310px, 0.55fr);
        gap: 24px;
        padding: 110px 0;
      }

      .hostSectionHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 27px;
      }

      .hostSectionHeader h2 {
        font-size: 37px;
      }

      .bookingList {
        overflow: hidden;
        border: 1px solid #dce2da;
        border-radius: 24px;
        background: white;
      }

      .bookingItem {
        display: grid;
        grid-template-columns: auto minmax(160px,1fr) auto auto auto;
        align-items: center;
        gap: 17px;
        padding: 19px;
      }

      .bookingItem + .bookingItem {
        border-top: 1px solid #e2e7e0;
      }

      .bookingAvatar {
        display: grid;
        place-items: center;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: #183a27;
        color: white;
        font-weight: 850;
      }

      .bookingInfo strong,
      .bookingInfo span {
        display: block;
      }

      .bookingInfo span {
        margin-top: 4px;
        color: #7a867e;
        font-size: 12px;
      }

      .bookingMeta {
        display: flex;
        gap: 12px;
      }

      .bookingMeta span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #6f7c73;
        font-size: 11px;
      }

      .bookingStatus {
        padding: 8px 10px;
        border-radius: 999px;
        background: #fff0d7;
        color: #9a6318;
        font-size: 10px;
        font-weight: 850;
      }

      .bookingStatus.approved {
        background: #e9f5dc;
        color: #4f772e;
      }

      .bookingItem > a {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #f1f3ee;
      }

      .hostSideColumn {
        display: grid;
        gap: 18px;
        align-content: start;
      }

      .quickCreateCard,
      .profileProgressCard {
        padding: 23px;
        border: 1px solid #dce2da;
        border-radius: 24px;
        background: white;
      }

      .quickCreateCard h3,
      .profileProgressCard h3 {
        margin: 0 0 18px;
        font-size: 23px;
        letter-spacing: -0.035em;
      }

      .quickCreateCard > a {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 15px 0;
      }

      .quickCreateCard > a + a {
        border-top: 1px solid #e1e6df;
      }

      .quickCreateCard > a > span {
        display: grid;
        place-items: center;
        width: 43px;
        height: 43px;
        border-radius: 14px;
        background: #eaf3de;
        color: #4a6c31;
      }

      .quickCreateCard strong,
      .quickCreateCard small {
        display: block;
      }

      .quickCreateCard small {
        margin-top: 3px;
        color: #808c84;
      }

      .progressTop {
        display: flex;
        justify-content: space-between;
        margin-bottom: 11px;
        font-size: 12px;
        font-weight: 850;
      }

      .progressBar {
        height: 8px;
        margin-bottom: 20px;
        overflow: hidden;
        border-radius: 999px;
        background: #e8ece6;
      }

      .progressBar span {
        display: block;
        width: 82%;
        height: 100%;
        border-radius: inherit;
        background: #719b4e;
      }

      .profileProgressCard p {
        color: #77837b;
        font-size: 13px;
        line-height: 1.6;
      }

      .profileProgressCard > a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 8px;
        color: #3c5d45;
        font-size: 12px;
        font-weight: 850;
      }

      .hostMotivationImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1900&q=90")
          center / cover;
      }

      .hostMotivationContent h2 {
        font-size: clamp(44px, 5vw, 68px);
      }

      .hostMotivationContent p {
        margin-inline: 0;
      }

      /* LOADING */

      .homeLoading {
        min-height: 100vh;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 13px;
        background: #f4f5ef;
        color: #183a27;
        font-family: Inter, system-ui, sans-serif;
        font-weight: 850;
      }

      .loadingLogo {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        border-radius: 20px;
        background: #183a27;
        color: #c9f28c;
        animation: homePulse 1.3s infinite ease-in-out;
      }

      @keyframes homePulse {
        50% {
          transform: scale(1.06);
          opacity: 0.78;
        }
      }

      /* RESPONSIVE */

      @media (max-width: 1000px) {
        .guestHeroContent,
        .userHeroContent,
        .hostHeroContent {
          grid-template-columns: 1fr;
          gap: 42px;
        }

        .searchCard,
        .hostTodayCard {
          max-width: 620px;
        }

        .hostStats {
          grid-template-columns: repeat(2, 1fr);
        }

        .hostWorkspace {
          grid-template-columns: 1fr;
        }

        .eventGrid {
          grid-template-columns: repeat(2, 1fr);
        }

        .eventCard:first-child {
          grid-column: span 2;
        }
      }

      @media (max-width: 760px) {
        .pageContainer {
          width: calc(100% - 36px);
        }

        .guestHero,
        .userHero,
        .hostHero {
          min-height: auto;
          padding: 112px 0 90px;
        }

        .guestCopy h1,
        .userHeroCopy h1,
        .hostHeroCopy h1 {
          font-size: 49px;
        }

        .guestCopy > p,
        .userHeroCopy > p,
        .hostHeroCopy > p {
          font-size: 15px;
        }

        .searchCard,
        .hostTodayCard {
          padding: 20px;
          border-radius: 23px;
        }

        .roleChoice,
        .featuredSection {
          padding: 85px 0;
        }

        .roleGrid,
        .eventGrid,
        .quickLinks,
        .hostStats {
          grid-template-columns: 1fr;
        }

        .eventCard:first-child {
          grid-column: auto;
        }

        .roleCard {
          min-height: 500px;
        }

        .roleContent h3 {
          font-size: 32px;
        }

        .eventCard {
          min-height: 470px;
        }

        .sectionHeading,
        .hostSectionHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .sectionLink {
          display: none;
        }

        .quickLinks {
          margin-top: -30px;
        }

        .hostStats {
          margin-top: -30px;
        }

        .hostWorkspace {
          padding: 85px 0;
        }

        .bookingItem {
          grid-template-columns: auto 1fr auto;
        }

        .bookingMeta,
        .bookingStatus {
          grid-column: 2;
        }

        .bookingItem > a {
          grid-column: 3;
          grid-row: 1 / span 3;
        }

        .userBanner,
        .hostMotivation {
          width: calc(100% - 36px);
          min-height: 650px;
          margin-bottom: 85px;
          border-radius: 27px;
        }

        .userBannerContent,
        .hostMotivationContent {
          padding: 32px;
        }

        .userBannerContent h2,
        .hostMotivationContent h2 {
          font-size: 44px;
        }
      }

      @media (max-width: 440px) {
        .guestCopy h1,
        .userHeroCopy h1,
        .hostHeroCopy h1 {
          font-size: 43px;
        }

        .guestActions,
        .hostHeroActions {
          flex-direction: column;
          align-items: stretch;
        }

        .guestProof {
          gap: 20px;
        }

        .searchTopIcon {
          display: none;
        }

        .sectionHeading h2,
        .hostSectionHeader h2 {
          font-size: 37px;
        }

        .bookingMeta {
          flex-direction: column;
          gap: 5px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}