import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* =========================================================
   ICONS
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
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
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
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
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
   DATA
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
    spots: "6 mesta",
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
    spots: "4 mesta",
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
    spots: "8 mesta",
    image:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1400&q=88",
  },
];

const upcomingTrips = [
  {
    title: "Vikend na Tari",
    date: "18–20. avgust",
    status: "Potvrđeno",
  },
  {
    title: "Uspon na Rtanj",
    date: "27. avgust",
    status: "Na čekanju",
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
   SHARED UI
========================================================= */

function AdventureSearch({ compact = false, firstName = "" }) {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (location.trim()) params.set("location", location.trim());
    if (category) params.set("category", category);

    navigate(params.toString() ? `/events?${params.toString()}` : "/events");
  }

  return (
    <form
      className={compact ? "searchCard compact" : "searchCard"}
      onSubmit={handleSubmit}
    >
      <div className="searchTop">
        <div>
          <span>
            {firstName
              ? `Gde idemo sledeće, ${firstName}?`
              : "Pronađi sledeću avanturu"}
          </span>
          <strong>Šta želiš da istražiš?</strong>
        </div>

        <span className="searchTopIcon">
          <Icon name="sparkles" size={20} />
        </span>
      </div>

      <div className="searchMainRow">
        <label className="searchInput">
          <Icon name="mapPin" size={20} />

          <input
            type="search"
            value={location}
            placeholder="Grad, planina ili destinacija"
            onChange={(event) => setLocation(event.target.value)}
          />
        </label>

        <button type="submit" className="primarySearchButton">
          <Icon name="search" size={19} />
          <span>Istraži</span>
          <Icon name="arrowRight" size={18} />
        </button>
      </div>

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
    </form>
  );
}

function SectionHeader({ kicker, title, description, linkTo, linkLabel }) {
  return (
    <div className="sectionHeading">
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {linkTo && (
        <Link to={linkTo} className="sectionLink">
          {linkLabel}
          <Icon name="arrowRight" size={18} />
        </Link>
      )}
    </div>
  );
}

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

          <button
            type="button"
            className="eventHeart"
            onClick={(e) => e.preventDefault()}
            aria-label="Sačuvaj događaj"
          >
            <Icon name="heart" size={18} />
          </button>

          <div className="eventBody">
            <div className="eventLocation">
              <Icon name="mapPin" size={15} />
              {event.location}
            </div>

            <h3>{event.title}</h3>

            <div className="eventMetaLine">
              <span>
                <Icon name="star" size={14} fill="currentColor" />
                {event.rating}
              </span>
              <span>{event.spots}</span>
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
   GUEST HOME
========================================================= */

function GuestHome() {
  return (
    <main className="home">
      <section className="guestHero">
        <div className="heroMedia guestHeroBackground" />
        <div className="heroOverlay" />

        <div className="heroTopBar pageContainer">
            

          <div className="heroTopActions">
            <Link to="/signup" className="heroJoinLink">
              Napravi nalog
            </Link>
          </div>
        </div>

        <div className="pageContainer guestHeroContent">
          <div className="guestCopy">
            <span className="eyebrow">
              <span className="eyebrowDot" />
              Prave avanture. Pravi ljudi.
            </span>

            <h1>
              Vikend je prekratak
              <em>za dosadne planove.</em>
            </h1>

            <p>
              Otkrij outdoor događaje, upoznaj lokalne domaćine i
              rezerviši iskustva koja se pamte duže od jedne fotografije.
            </p>

            <div className="guestActions">
              <Link to="/events" className="lightButton">
                Istraži avanture
                <Icon name="arrowRight" />
              </Link>

              <Link to="/signup" className="glassButton">
                Pridruži se zajednici
              </Link>
            </div>

            <div className="guestProof">
              <div>
                <strong>350+</strong>
                <span>aktivnih avanturista</span>
              </div>
              <div>
                <strong>70+</strong>
                <span>outdoor iskustava</span>
              </div>
              <div>
                <strong>4.9</strong>
                <span>prosečna ocena</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="guestSearchWrap pageContainer">
        <AdventureSearch />
      </div>

      <section className="featuredSection pageContainer firstSection">
        <SectionHeader
          kicker="Odabrano za tebe"
          title="Avanture koje se pamte."
          description="Kratka lista događaja koji imaju najbolji odnos atmosfere, lokacije i host iskustva."
          linkTo="/events"
          linkLabel="Pogledaj sve"
        />

        <EventCards />
      </section>

      <section className="trustStrip pageContainer">
        <article>
          <span>
            <Icon name="shield" size={22} />
          </span>
          <div>
            <strong>Provereni domaćini</strong>
            <p>Jasni profili, ocene i iskustva drugih korisnika.</p>
          </div>
        </article>

        <article>
          <span>
            <Icon name="booking" size={22} />
          </span>
          <div>
            <strong>Jednostavna rezervacija</strong>
            <p>Bez lutanja po porukama i nepotrebnog čekanja.</p>
          </div>
        </article>

        <article>
          <span>
            <Icon name="users" size={22} />
          </span>
          <div>
            <strong>Zajednica, ne oglasnik</strong>
            <p>Ljudi, događaji i priče na jednom mestu.</p>
          </div>
        </article>
      </section>

      <section className="roleChoice pageContainer">
        <SectionHeader
          kicker="Jedna platforma, dve uloge"
          title="Doživi prirodu ili je pretvori u posao."
          description="MeetOutdoors radi i za ljude koji traže iskustva i za domaćine koji ih kreiraju."
        />

        <div className="roleGrid">
          <article className="roleCard userRole">
            <div className="roleImage roleUserImage" />
            <div className="roleGradient" />

            <div className="roleContent">
              <span className="roleNumber">01 / Avanturista</span>
              <h3>Pronađi ljude i mesta zbog kojih se vikend pamti.</h3>
              <p>
                Pretraži događaje, sačuvaj favorite i rezerviši sledeću
                avanturu bez komplikacija.
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
              <span className="roleNumber">02 / Domaćin</span>
              <h3>Pretvori znanje, lokaciju i energiju u iskustvo.</h3>
              <p>
                Objavi događaje, upravljaj rezervacijama i gradi reputaciju
                pouzdanog outdoor domaćina.
              </p>

              <Link to="/signup">
                Postani domaćin
                <Icon name="arrowRight" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="guestFinal">
        <div className="guestFinalBackground" />
        <div className="guestFinalOverlay" />

        <div className="guestFinalContent">
          <span>MeetOutdoors zajednica</span>

          <h2>
            Manje planiranja.
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
   USER HOME
========================================================= */

function UserHome({ profile }) {
  const firstName = useMemo(() => {
    if (!profile?.full_name) return "";
    return profile.full_name.trim().split(" ")[0];
  }, [profile]);

  return (
    <main className="home userHome">
      <section className="userTop pageContainer">
        <div className="userGreeting">
          <span className="dashboardKicker">
            <span />
            Dobrodošao nazad
          </span>

          <h1>
            {firstName ? `${firstName}, ` : ""}
            šta ti treba od vikenda?
          </h1>

          <p>
            Izaberi pravac, pronađi događaj i rezerviši mesto bez
            nepotrebnog skrolovanja.
          </p>
        </div>

        <div className="userTopActions">
          <Link to="/my-bookings">
            <Icon name="booking" size={18} />
            Moje rezervacije
          </Link>

          <Link to="/my-events">
            <Icon name="heart" size={18} />
            Sačuvano
          </Link>
        </div>
      </section>

      <section className="userSearchStage pageContainer">
        <div className="userSearchImage" />
        <div className="userSearchOverlay" />

        <div className="userSearchCopy">
          <span>Brza pretraga</span>
          <h2>Nađi avanturu za manje od jednog minuta.</h2>
          <p>
            Lokacija, aktivnost i jedan klik. Ostalo ćemo skratiti koliko
            možemo.
          </p>
        </div>

        <AdventureSearch compact firstName={firstName} />
      </section>

      <section className="quickLinks pageContainer">
        <Link to="/events">
          <span>
            <Icon name="compass" />
          </span>
          <div>
            <strong>Istraži događaje</strong>
            <small>Jednodnevne avanture i okupljanja</small>
          </div>
          <Icon name="arrowRight" />
        </Link>

        <Link to="/packages">
          <span>
            <Icon name="package" />
          </span>
          <div>
            <strong>Adventure paketi</strong>
            <small>Kompletna višednevna iskustva</small>
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
        <SectionHeader
          kicker="Preporučeno za tebe"
          title="Tvoj sledeći vikend počinje ovde."
          description="Najbolje ocenjeni događaji koji su trenutno otvoreni za rezervaciju."
          linkTo="/events"
          linkLabel="Svi događaji"
        />

        <EventCards />
      </section>

      <section className="userDashboardGrid pageContainer">
        <div className="upcomingCard">
          <div className="miniHeader">
            <div>
              <span>Sledeće rezervacije</span>
              <h3>Planovi koji te čekaju.</h3>
            </div>

            <Link to="/my-bookings">
              Sve
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          <div className="upcomingList">
            {upcomingTrips.map((trip) => (
              <article key={trip.title}>
                <span className="upcomingIcon">
                  <Icon name="calendar" size={19} />
                </span>

                <div>
                  <strong>{trip.title}</strong>
                  <small>{trip.date}</small>
                </div>

                <span className={`tripStatus ${trip.status === "Potvrđeno" ? "confirmed" : ""}`}>
                  {trip.status}
                </span>
              </article>
            ))}
          </div>
        </div>

        <div className="userSidePromo">
          <div className="userSidePromoImage" />
          <div className="userSidePromoOverlay" />

          <div>
            <span>
              <Icon name="sparkles" size={16} />
              Izađi iz rutine
            </span>

            <h3>Ne čekaj savršen trenutak. Napravi ga.</h3>

            <Link to="/events">
              Pronađi avanturu
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   HOST HOME
========================================================= */

function HostHome({ profile }) {
  const firstName = useMemo(() => {
    if (!profile?.full_name) return "Domaćine";
    return profile.full_name.trim().split(" ")[0];
  }, [profile]);

  return (
    <main className="home hostHome">
      <section className="hostTop pageContainer">
        <div>
          <span className="dashboardKicker">
            <span />
            Host studio
          </span>

          <h1>Dobrodošao, {firstName}.</h1>

          <p>
            Sve što traži tvoju pažnju, najvažnije brojke i brze akcije —
            bez ogromnog hero-a i bez gubljenja vremena.
          </p>
        </div>

        <div className="hostTopActions">
          <Link to="/create-event" className="hostPrimaryAction">
            <Icon name="plus" size={18} />
            Novi događaj
          </Link>

          <Link to="/dashboard" className="hostSecondaryAction">
            <Icon name="dashboard" size={18} />
            Dashboard
          </Link>
        </div>
      </section>

      <section className="hostOverview pageContainer">
        <div className="hostOverviewHero">
          <div className="hostOverviewImage" />
          <div className="hostOverviewOverlay" />

          <div className="hostOverviewCopy">
            <span>Današnji fokus</span>
            <h2>Pet novih zahteva čeka odgovor.</h2>
            <p>
              Brz odgovor povećava poverenje gostiju i šansu da rezervacija
              ostane kod tebe.
            </p>

            <Link to="/host-bookings" className="lightButton">
              Otvori rezervacije
              <Icon name="arrowRight" />
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

            <Link to="/host-bookings">
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

                <Link to="/host-bookings">
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

            <Link to="/edit-profile">
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
   MAIN
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
   STYLES
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
          radial-gradient(circle at 12% 18%, rgba(166, 201, 128, 0.14), transparent 27%),
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

      .eyebrow,
      .dashboardKicker {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .eyebrow {
        padding: 9px 14px;
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 999px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(15px);
        color: white;
        font-size: 12px;
      }

      .dashboardKicker {
        color: #6c8b4d;
        font-size: 10px;
      }

      .eyebrowDot,
      .dashboardKicker > span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #c9f28c;
        box-shadow: 0 0 0 5px rgba(201,242,140,0.13);
      }

      .dashboardKicker > span {
        background: #719b4e;
        box-shadow: 0 0 0 5px rgba(113,155,78,0.1);
      }

      .lightButton,
      .glassButton,
      .hostPrimaryAction,
      .hostSecondaryAction {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        min-height: 56px;
        padding: 0 22px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 850;
        transition: 0.22s ease;
      }

      .lightButton,
      .hostPrimaryAction {
        background: #c9f28c;
        color: #153020 !important;
        box-shadow: 0 17px 38px rgba(0,0,0,0.18);
      }

      .glassButton {
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(255,255,255,0.09);
        color: white !important;
        backdrop-filter: blur(14px);
      }

      .hostSecondaryAction {
        border: 1px solid #d9e1d5;
        background: white;
        color: #34513e;
      }

      .lightButton:hover,
      .glassButton:hover,
      .hostPrimaryAction:hover,
      .hostSecondaryAction:hover {
        transform: translateY(-2px);
      }

      /* HERO / GUEST */

      .guestHero {
        position: relative;
        isolation: isolate;
        min-height: 760px;
        display: flex;
        align-items: center;
        padding: 135px 0 105px;
        color: white;
      }

      .heroMedia,
      .heroOverlay {
        position: absolute;
        inset: 0;
      }

      .heroMedia {
        z-index: -3;
        background-size: cover;
        background-position: center;
      }

      .guestHeroBackground {
        background-image:
          url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=92");
      }

      .heroOverlay {
        z-index: -2;
        background:
          linear-gradient(90deg, rgba(5,16,10,0.95), rgba(6,18,11,0.72) 58%, rgba(6,18,11,0.22)),
          linear-gradient(0deg, rgba(6,16,10,0.6), transparent 58%);
      }

      .heroTopBar {
        position: absolute;
        top: 28px;
        left: 50%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transform: translateX(-50%);
      }

      .homeBrand {
        display: inline-flex;
        align-items: center;
        gap: 11px;
        color: white !important;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .homeBrand > span {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 14px;
        background: rgba(255,255,255,0.1);
        color: #c9f28c;
        backdrop-filter: blur(14px);
      }

      .heroTopActions {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .heroTopActions a {
        display: inline-flex;
        align-items: center;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 13px;
        font-size: 11px;
        font-weight: 850;
      }

      .heroLoginLink {
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.08);
        color: white !important;
      }

      .heroJoinLink {
        background: #c9f28c;
        color: #173021 !important;
      }

      .guestHeroContent {
        display: block;
      }

      .guestCopy {
        max-width: 820px;
      }

      .guestCopy h1 {
        margin: 24px 0 0;
        font-size: clamp(58px, 7vw, 95px);
        line-height: 0.93;
        letter-spacing: -0.075em;
      }

      .guestCopy h1 em {
        display: block;
        color: #c9f28c;
        font-style: normal;
      }

      .guestCopy > p {
        max-width: 650px;
        margin: 27px 0 0;
        color: rgba(255,255,255,0.72);
        font-size: 17px;
        line-height: 1.72;
      }

      .guestActions {
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
        font-size: 22px;
      }

      .guestProof span {
        color: rgba(255,255,255,0.55);
        font-size: 12px;
      }

      /* SEARCH */

      .guestSearchWrap {
        position: relative;
        z-index: 5;
        margin-top: -67px;
      }

      .searchCard,
      .hostTodayCard {
        padding: 25px;
        border: 1px solid rgba(34,52,41,0.1);
        border-radius: 26px;
        background: rgba(249,250,246,0.97);
        color: #14251d;
        box-shadow: 0 28px 75px rgba(22,39,29,0.16);
        backdrop-filter: blur(22px);
      }

      .searchCard.compact {
        box-shadow: none;
        border-color: rgba(255,255,255,0.13);
      }

      .searchTop,
      .hostTodayTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 18px;
      }

      .searchTop span,
      .hostTodayTop span {
        display: block;
        margin-bottom: 5px;
        color: #758177;
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .searchTop strong,
      .hostTodayTop strong {
        font-size: 22px;
        letter-spacing: -0.035em;
      }

      .searchTopIcon {
        display: grid !important;
        place-items: center;
        flex: 0 0 auto;
        width: 43px;
        height: 43px;
        margin: 0 !important;
        border-radius: 14px;
        background: #e8f3da;
        color: #416329 !important;
      }

      .searchMainRow {
        display: grid;
        grid-template-columns: minmax(0,1fr) auto;
        gap: 10px;
      }

      .searchInput {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 57px;
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
        min-height: 55px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #14251d;
      }

      .primarySearchButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        min-width: 150px;
        min-height: 57px;
        padding: 0 18px;
        border: 0;
        border-radius: 16px;
        background: #172f22;
        color: white;
        cursor: pointer;
        font-weight: 850;
        box-shadow: 0 15px 30px rgba(23,47,34,0.16);
      }

      .categoryRow {
        display: flex;
        gap: 8px;
        margin: 14px -3px -2px;
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
        min-height: 39px;
        padding: 0 12px;
        border: 1px solid #d9dfd6;
        border-radius: 999px;
        background: transparent;
        color: #69746c;
        cursor: pointer;
        font-size: 11px;
        font-weight: 750;
      }

      .categoryRow button.active {
        border-color: #183a27;
        background: #183a27;
        color: white;
      }

      /* SECTIONS */

      .featuredSection,
      .roleChoice {
        padding: 105px 0;
      }

      .firstSection {
        padding-top: 120px;
      }

      .sectionHeading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 34px;
      }

      .sectionHeading > div {
        max-width: 760px;
      }

      .sectionHeading span,
      .hostSectionHeader > div > span,
      .hostCardKicker {
        display: block;
        margin-bottom: 10px;
        color: #718d52;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .sectionHeading h2,
      .hostSectionHeader h2 {
        margin: 0;
        font-size: clamp(38px, 5vw, 60px);
        line-height: 1.02;
        letter-spacing: -0.06em;
      }

      .sectionHeading p {
        max-width: 650px;
        margin: 14px 0 0;
        color: #758178;
        font-size: 13px;
        line-height: 1.65;
      }

      .sectionLink,
      .hostSectionHeader > a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 5px;
        border-bottom: 1px solid #9ba79e;
        font-size: 12px;
        font-weight: 850;
      }

      /* EVENTS */

      .eventGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }

      .eventCard {
        position: relative;
        min-height: 490px;
        overflow: hidden;
        border-radius: 27px;
        color: white;
        box-shadow: 0 20px 50px rgba(24,41,31,0.14);
        transition: 0.28s ease;
      }

      .eventCard:hover {
        transform: translateY(-6px);
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
          linear-gradient(180deg, rgba(5,14,8,0.08), rgba(5,15,9,0.94));
      }

      .eventTop {
        position: absolute;
        top: 15px;
        left: 15px;
        right: 64px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .eventTop span {
        padding: 8px 10px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 999px;
        background: rgba(7,20,12,0.45);
        backdrop-filter: blur(11px);
        font-size: 9px;
        font-weight: 850;
      }

      .eventHeart {
        position: absolute;
        top: 15px;
        right: 15px;
        z-index: 2;
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        padding: 0;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 13px;
        background: rgba(7,20,12,0.45);
        color: white;
        cursor: pointer;
        backdrop-filter: blur(11px);
      }

      .eventBody {
        position: absolute;
        inset: auto 0 0;
        padding: 22px;
      }

      .eventLocation,
      .eventMetaLine,
      .eventMetaLine span {
        display: flex;
        align-items: center;
      }

      .eventLocation {
        gap: 6px;
        color: rgba(255,255,255,0.64);
        font-size: 11px;
      }

      .eventBody h3 {
        margin: 9px 0 13px;
        font-size: 26px;
        line-height: 1.08;
        letter-spacing: -0.045em;
      }

      .eventMetaLine {
        justify-content: space-between;
        gap: 12px;
        color: rgba(255,255,255,0.7);
        font-size: 11px;
      }

      .eventMetaLine span {
        gap: 6px;
      }

      .eventMetaLine span:first-child {
        color: #d0f89a;
        font-weight: 800;
      }

      .eventFooter {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-top: 17px;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.15);
      }

      .eventFooter small,
      .eventFooter strong {
        display: block;
      }

      .eventFooter small {
        color: rgba(255,255,255,0.55);
      }

      .eventFooter strong {
        margin-top: 2px;
      }

      .eventFooter > span {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #c9f28c;
        color: #163020;
      }

      /* TRUST */

      .trustStrip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-top: 8px;
      }

      .trustStrip article {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        padding: 20px;
        border: 1px solid #dde4da;
        border-radius: 20px;
        background: rgba(255,255,255,0.72);
      }

      .trustStrip article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: #eaf3de;
        color: #4b6c31;
      }

      .trustStrip strong {
        display: block;
        font-size: 12px;
      }

      .trustStrip p {
        margin: 5px 0 0;
        color: #7c887f;
        font-size: 10px;
        line-height: 1.55;
      }

      /* ROLES */

      .roleGrid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      .roleCard {
        position: relative;
        min-height: 540px;
        overflow: hidden;
        border-radius: 30px;
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
          linear-gradient(180deg, rgba(5,15,9,0.05), rgba(5,16,10,0.94));
      }

      .roleContent {
        position: absolute;
        inset: auto 0 0;
        padding: 30px;
      }

      .roleNumber {
        color: #c9f28c;
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .roleContent h3 {
        max-width: 500px;
        margin: 15px 0 12px;
        font-size: 35px;
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .roleContent p {
        max-width: 500px;
        margin: 0;
        color: rgba(255,255,255,0.68);
        font-size: 13px;
        line-height: 1.65;
      }

      .roleContent a {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin-top: 23px;
        color: #c9f28c;
        font-size: 12px;
        font-weight: 850;
      }

      /* GUEST FINAL */

      .guestFinal {
        position: relative;
        isolation: isolate;
        min-height: 620px;
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
        background: rgba(7,20,12,0.8);
      }

      .guestFinalContent {
        max-width: 850px;
      }

      .guestFinalContent > span,
      .hostMotivationContent > span {
        color: #c9f28c;
        font-size: 10px;
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

      /* USER */

      .userHome,
      .hostHome {
        padding: 46px 0 100px;
      }

      .userTop,
      .hostTop {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 25px;
        padding-top: 25px;
      }

      .userGreeting,
      .hostTop > div:first-child {
        max-width: 760px;
      }

      .userGreeting h1,
      .hostTop h1 {
        margin: 12px 0 0;
        font-size: clamp(46px, 6vw, 76px);
        line-height: 0.95;
        letter-spacing: -0.07em;
      }

      .userGreeting p,
      .hostTop p {
        max-width: 650px;
        margin: 17px 0 0;
        color: #758178;
        font-size: 14px;
        line-height: 1.7;
      }

      .userTopActions,
      .hostTopActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 9px;
      }

      .userTopActions a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 14px;
        border: 1px solid #dae2d7;
        border-radius: 13px;
        background: white;
        color: #3c5545;
        font-size: 10px;
        font-weight: 850;
      }

      .userSearchStage {
        position: relative;
        isolation: isolate;
        display: grid;
        grid-template-columns: minmax(0,0.72fr) minmax(390px,0.78fr);
        align-items: center;
        gap: 35px;
        min-height: 440px;
        margin-top: 35px;
        padding: 38px;
        overflow: hidden;
        border-radius: 30px;
        color: white;
      }

      .userSearchImage,
      .userSearchOverlay {
        position: absolute;
        inset: 0;
      }

      .userSearchImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1900&q=92")
          center / cover;
      }

      .userSearchOverlay {
        z-index: -1;
        background:
          linear-gradient(90deg, rgba(5,16,10,0.92), rgba(5,16,10,0.62), rgba(5,16,10,0.38));
      }

      .userSearchCopy {
        max-width: 520px;
      }

      .userSearchCopy > span {
        color: #c9f28c;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .userSearchCopy h2 {
        margin: 13px 0 0;
        font-size: clamp(38px, 5vw, 58px);
        line-height: 0.98;
        letter-spacing: -0.06em;
      }

      .userSearchCopy p {
        max-width: 480px;
        margin: 16px 0 0;
        color: rgba(255,255,255,0.66);
        font-size: 12px;
        line-height: 1.65;
      }

      .quickLinks {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-top: 18px;
      }

      .quickLinks > a {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 13px;
        padding: 20px;
        border: 1px solid #dde3db;
        border-radius: 20px;
        background: rgba(255,255,255,0.94);
        box-shadow: 0 16px 42px rgba(27,45,34,0.07);
        transition: 0.22s ease;
      }

      .quickLinks > a:hover {
        transform: translateY(-4px);
      }

      .quickLinks > a > span {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: #eaf3de;
        color: #47672e;
      }

      .quickLinks strong,
      .quickLinks small {
        display: block;
      }

      .quickLinks strong {
        font-size: 11px;
      }

      .quickLinks small {
        margin-top: 4px;
        color: #7b877f;
        font-size: 9px;
      }

      .userDashboardGrid {
        display: grid;
        grid-template-columns: minmax(0,1.1fr) minmax(330px,0.9fr);
        gap: 18px;
        margin-bottom: 30px;
      }

      .upcomingCard {
        padding: 24px;
        border: 1px solid #dce3da;
        border-radius: 24px;
        background: white;
      }

      .miniHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .miniHeader span {
        display: block;
        color: #718d52;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .miniHeader h3 {
        margin: 6px 0 0;
        font-size: 25px;
        letter-spacing: -0.04em;
      }

      .miniHeader > a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        font-weight: 850;
      }

      .upcomingList {
        display: grid;
        gap: 10px;
      }

      .upcomingList article {
        display: grid;
        grid-template-columns: auto minmax(0,1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 13px;
        border: 1px solid #e0e6de;
        border-radius: 16px;
        background: #f8faf6;
      }

      .upcomingIcon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #e8f1dd;
        color: #5d7a43;
      }

      .upcomingList strong,
      .upcomingList small {
        display: block;
      }

      .upcomingList strong {
        font-size: 10px;
      }

      .upcomingList small {
        margin-top: 4px;
        color: #879289;
        font-size: 8px;
      }

      .tripStatus {
        padding: 8px 10px;
        border-radius: 999px;
        background: #fff0d7;
        color: #9a6318;
        font-size: 8px;
        font-weight: 850;
      }

      .tripStatus.confirmed {
        background: #e9f5dc;
        color: #4f772e;
      }

      .userSidePromo {
        position: relative;
        isolation: isolate;
        min-height: 300px;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
        border-radius: 24px;
        color: white;
      }

      .userSidePromoImage,
      .userSidePromoOverlay {
        position: absolute;
        inset: 0;
      }

      .userSidePromoImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1300&q=90")
          center / cover;
      }

      .userSidePromoOverlay {
        z-index: -1;
        background:
          linear-gradient(180deg, rgba(5,16,10,0.08), rgba(5,16,10,0.9));
      }

      .userSidePromo > div:last-child {
        padding: 24px;
      }

      .userSidePromo span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #c9f28c;
        font-size: 9px;
        font-weight: 850;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .userSidePromo h3 {
        max-width: 480px;
        margin: 12px 0 18px;
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .userSidePromo a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #c9f28c;
        font-size: 10px;
        font-weight: 850;
      }

      /* HOST */

      .hostOverview {
        display: grid;
        grid-template-columns: minmax(0,1.35fr) minmax(340px,0.65fr);
        gap: 18px;
        margin-top: 34px;
      }

      .hostOverviewHero {
        position: relative;
        isolation: isolate;
        min-height: 390px;
        display: flex;
        align-items: center;
        overflow: hidden;
        border-radius: 28px;
        color: white;
      }

      .hostOverviewImage,
      .hostOverviewOverlay {
        position: absolute;
        inset: 0;
      }

      .hostOverviewImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=92")
          center / cover;
      }

      .hostOverviewOverlay {
        z-index: -1;
        background:
          linear-gradient(90deg, rgba(5,16,10,0.94), rgba(5,16,10,0.6), rgba(5,16,10,0.2));
      }

      .hostOverviewCopy {
        max-width: 600px;
        padding: 34px;
      }

      .hostOverviewCopy > span {
        color: #c9f28c;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .hostOverviewCopy h2 {
        margin: 13px 0 0;
        font-size: clamp(40px, 5vw, 58px);
        line-height: 0.98;
        letter-spacing: -0.06em;
      }

      .hostOverviewCopy p {
        max-width: 520px;
        margin: 17px 0 24px;
        color: rgba(255,255,255,0.68);
        font-size: 12px;
        line-height: 1.65;
      }

      .onlineBadge {
        display: flex;
        align-items: center;
        gap: 7px;
        align-self: flex-start;
        padding: 8px 10px;
        border-radius: 999px;
        background: #e9f5dc;
        color: #426429;
        font-size: 9px;
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
        gap: 9px;
      }

      .hostTodayStats article {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        border: 1px solid #dfe5dc;
        border-radius: 15px;
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
        font-size: 18px;
      }

      .hostTodayStats span {
        margin: 2px 0 0;
        color: #7d8981;
        font-size: 10px;
        text-transform: none;
        letter-spacing: 0;
      }

      .hostTodayCard > a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #dfe4dc;
        color: #36543f;
        font-size: 11px;
        font-weight: 850;
      }

      .hostStats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-top: 18px;
      }

      .hostStats article {
        padding: 20px;
        border: 1px solid #dce2da;
        border-radius: 20px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 14px 34px rgba(27,45,34,0.06);
      }

      .hostStatIcon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        margin-bottom: 18px;
        border-radius: 13px;
        background: #eaf3de;
        color: #4a6d30;
      }

      .hostStatTop {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: #7a867e;
        font-size: 10px;
      }

      .hostStatTop svg {
        color: #719c4d;
      }

      .hostStats article > strong {
        display: block;
        margin-top: 8px;
        font-size: 34px;
        letter-spacing: -0.05em;
      }

      .hostStats article > small {
        color: #7e8982;
        font-size: 8px;
      }

      .hostWorkspace {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(310px, 0.55fr);
        gap: 22px;
        padding: 90px 0;
      }

      .hostSectionHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 24px;
      }

      .hostSectionHeader h2 {
        font-size: 35px;
      }

      .bookingList {
        overflow: hidden;
        border: 1px solid #dce2da;
        border-radius: 23px;
        background: white;
      }

      .bookingItem {
        display: grid;
        grid-template-columns: auto minmax(160px,1fr) auto auto auto;
        align-items: center;
        gap: 16px;
        padding: 18px;
      }

      .bookingItem + .bookingItem {
        border-top: 1px solid #e2e7e0;
      }

      .bookingAvatar {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #183a27;
        color: white;
        font-weight: 850;
      }

      .bookingInfo strong,
      .bookingInfo span {
        display: block;
      }

      .bookingInfo strong {
        font-size: 10px;
      }

      .bookingInfo span {
        margin-top: 4px;
        color: #7a867e;
        font-size: 10px;
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
        font-size: 9px;
      }

      .bookingStatus {
        padding: 8px 10px;
        border-radius: 999px;
        background: #fff0d7;
        color: #9a6318;
        font-size: 8px;
        font-weight: 850;
      }

      .bookingStatus.approved {
        background: #e9f5dc;
        color: #4f772e;
      }

      .bookingItem > a {
        display: grid;
        place-items: center;
        width: 37px;
        height: 37px;
        border-radius: 11px;
        background: #f1f3ee;
      }

      .hostSideColumn {
        display: grid;
        gap: 17px;
        align-content: start;
      }

      .quickCreateCard,
      .profileProgressCard {
        padding: 22px;
        border: 1px solid #dce2da;
        border-radius: 23px;
        background: white;
      }

      .quickCreateCard h3,
      .profileProgressCard h3 {
        margin: 0 0 17px;
        font-size: 22px;
        letter-spacing: -0.035em;
      }

      .quickCreateCard > a {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 11px;
        padding: 14px 0;
      }

      .quickCreateCard > a + a {
        border-top: 1px solid #e1e6df;
      }

      .quickCreateCard > a > span {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #eaf3de;
        color: #4a6c31;
      }

      .quickCreateCard strong,
      .quickCreateCard small {
        display: block;
      }

      .quickCreateCard strong {
        font-size: 10px;
      }

      .quickCreateCard small {
        margin-top: 3px;
        color: #808c84;
        font-size: 8px;
      }

      .progressTop {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 10px;
        font-weight: 850;
      }

      .progressBar {
        height: 8px;
        margin-bottom: 18px;
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
        font-size: 11px;
        line-height: 1.6;
      }

      .profileProgressCard > a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 8px;
        color: #3c5d45;
        font-size: 10px;
        font-weight: 850;
      }

      .hostMotivation {
        position: relative;
        isolation: isolate;
        min-height: 560px;
        display: flex;
        align-items: center;
        overflow: hidden;
        border-radius: 32px;
        color: white;
      }

      .hostMotivationImage,
      .hostMotivationOverlay {
        position: absolute;
        inset: 0;
      }

      .hostMotivationImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1900&q=90")
          center / cover;
      }

      .hostMotivationOverlay {
        z-index: -1;
        background:
          linear-gradient(90deg, rgba(6,18,11,0.92), rgba(6,18,11,0.57), rgba(6,18,11,0.12));
      }

      .hostMotivationContent {
        max-width: 700px;
        padding: 60px;
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

      @media (max-width: 1050px) {
        .eventGrid {
          grid-template-columns: repeat(2, 1fr);
        }

        .eventCard:first-child {
          grid-column: span 2;
        }

        .hostOverview,
        .userSearchStage {
          grid-template-columns: 1fr;
        }

        .hostStats {
          grid-template-columns: repeat(2, 1fr);
        }

        .hostWorkspace,
        .userDashboardGrid {
          grid-template-columns: 1fr;
        }

        .searchCard.compact {
          max-width: 650px;
        }
      }

      @media (max-width: 760px) {
        .pageContainer {
          width: calc(100% - 32px);
        }

        .guestHero {
          min-height: 700px;
          padding: 115px 0 90px;
        }

        .heroTopBar {
          top: 20px;
        }

        .homeBrand {
          font-size: 14px;
        }

        .homeBrand > span {
          width: 40px;
          height: 40px;
        }

        .heroJoinLink {
          display: none !important;
        }

        .guestCopy h1 {
          font-size: 49px;
        }

        .guestCopy > p {
          font-size: 15px;
        }

        .guestSearchWrap {
          margin-top: -45px;
        }

        .searchCard,
        .hostTodayCard {
          padding: 18px;
          border-radius: 22px;
        }

        .searchMainRow {
          grid-template-columns: 1fr;
        }

        .primarySearchButton {
          width: 100%;
        }

        .featuredSection,
        .roleChoice {
          padding: 80px 0;
        }

        .firstSection {
          padding-top: 95px;
        }

        .sectionHeading,
        .hostSectionHeader,
        .userTop,
        .hostTop {
          align-items: flex-start;
          flex-direction: column;
        }

        .sectionLink {
          display: none;
        }

        .eventGrid,
        .roleGrid,
        .quickLinks,
        .trustStrip,
        .hostStats {
          grid-template-columns: 1fr;
        }

        .eventCard:first-child {
          grid-column: auto;
        }

        .eventCard {
          min-height: 460px;
        }

        .roleCard {
          min-height: 490px;
        }

        .roleContent h3 {
          font-size: 31px;
        }

        .userHome,
        .hostHome {
          padding-top: 26px;
        }

        .userGreeting h1,
        .hostTop h1 {
          font-size: 46px;
        }

        .userTopActions,
        .hostTopActions {
          justify-content: flex-start;
        }

        .userSearchStage {
          min-height: auto;
          padding: 24px;
        }

        .userSearchCopy h2,
        .hostOverviewCopy h2 {
          font-size: 40px;
        }

        .hostOverviewHero {
          min-height: 420px;
        }

        .hostWorkspace {
          padding: 75px 0;
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

        .hostMotivation {
          min-height: 620px;
          border-radius: 26px;
        }

        .hostMotivationContent {
          padding: 30px;
        }

        .hostMotivationContent h2 {
          font-size: 43px;
        }
      }

      @media (max-width: 460px) {
        .guestHero {
          min-height: 670px;
        }

        .guestCopy h1 {
          font-size: 43px;
        }

        .guestActions,
        .hostTopActions {
          flex-direction: column;
          align-items: stretch;
        }

        .guestActions a,
        .hostTopActions a {
          width: 100%;
        }

        .guestProof {
          gap: 18px;
        }

        .guestProof strong {
          font-size: 19px;
        }

        .guestProof span {
          font-size: 10px;
        }

        .searchTopIcon {
          display: none !important;
        }

        .sectionHeading h2,
        .hostSectionHeader h2 {
          font-size: 36px;
        }

        .userGreeting h1,
        .hostTop h1 {
          font-size: 41px;
        }

        .userTopActions {
          width: 100%;
        }

        .userTopActions a {
          flex: 1;
          justify-content: center;
        }

        .userSearchStage {
          padding: 19px;
        }

        .upcomingList article {
          grid-template-columns: auto 1fr;
        }

        .tripStatus {
          grid-column: 2;
          justify-self: start;
        }

        .bookingMeta {
          flex-direction: column;
          gap: 5px;
        }

        .hostOverviewCopy {
          padding: 24px;
        }

        .hostMotivationContent {
          padding: 24px;
        }
      }


      /* =========================================================
         FINAL RESPONSIVE UX HARDENING
      ========================================================= */

      :root {
        --home-navbar-clearance: 148px;
        --home-page-gap: 24px;
      }

      html,
      body,
      #root {
        width: 100%;
        max-width: 100%;
        overflow-x: clip;
      }

      .home,
      .home * {
        min-width: 0;
      }

      .home {
        width: 100%;
        max-width: 100vw;
        overflow-x: clip;
      }

      .pageContainer {
        width: min(1200px, calc(100% - (var(--home-page-gap) * 2)));
        max-width: 100%;
      }

      /* Fixed navbar clearance: content never sits beneath navigation. */
      .userHome,
      .hostHome {
        padding-top: var(--home-navbar-clearance);
      }

      .userTop,
      .hostTop {
        position: relative;
        z-index: 2;
        padding-top: 0;
      }

      .userGreeting h1,
      .hostTop h1,
      .userSearchCopy h2,
      .guestCopy h1,
      .sectionHeading h2,
      .hostSectionHeader h2 {
        overflow-wrap: anywhere;
        text-wrap: balance;
      }

      .userGreeting p,
      .hostTop p,
      .userSearchCopy p,
      .guestCopy > p,
      .sectionHeading p {
        text-wrap: pretty;
      }

      /* User search stage */
      .userSearchStage {
        grid-template-columns: minmax(0, 0.88fr) minmax(360px, 0.72fr);
        gap: clamp(24px, 4vw, 52px);
        padding: clamp(28px, 4vw, 48px);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 28px 75px rgba(14,31,20,0.2);
      }

      .userSearchStage > * {
        min-width: 0;
        max-width: 100%;
      }

      .searchCard,
      .searchCard.compact {
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }

      .searchCard.compact {
        padding: clamp(18px, 2.4vw, 26px);
        border-color: rgba(255,255,255,0.22);
        background: rgba(250,251,247,0.97);
        box-shadow: 0 22px 55px rgba(3,17,9,0.2);
      }

      .searchTop > div {
        min-width: 0;
      }

      .searchTop strong {
        display: block;
        max-width: 100%;
        overflow-wrap: anywhere;
        text-wrap: balance;
      }

      .searchMainRow {
        width: 100%;
        grid-template-columns: minmax(0, 1fr) minmax(132px, auto);
      }

      .searchInput {
        width: 100%;
        min-width: 0;
      }

      .searchInput input {
        min-width: 0;
        max-width: 100%;
        font-size: 16px;
      }

      .primarySearchButton {
        width: auto;
        min-width: 136px;
        max-width: 100%;
        white-space: nowrap;
      }

      .categoryRow {
        width: calc(100% + 6px);
        max-width: calc(100% + 6px);
        scroll-padding-inline: 3px;
        overscroll-behavior-inline: contain;
        -webkit-overflow-scrolling: touch;
      }

      .categoryRow button {
        white-space: nowrap;
      }

      /* Cards and action rows never force horizontal overflow. */
      .userTopActions,
      .hostTopActions,
      .guestActions,
      .quickLinks,
      .eventGrid,
      .roleGrid,
      .hostStats,
      .userDashboardGrid,
      .hostWorkspace {
        max-width: 100%;
      }

      .userTopActions a,
      .hostTopActions a,
      .quickLinks > a,
      .bookingItem,
      .upcomingList article {
        min-width: 0;
      }

      .quickLinks strong,
      .quickLinks small,
      .bookingInfo strong,
      .bookingInfo span {
        overflow-wrap: anywhere;
      }

      @media (max-width: 1050px) {
        :root {
          --home-navbar-clearance: 138px;
        }

        .userSearchStage {
          grid-template-columns: 1fr;
          min-height: auto;
        }

        .userSearchCopy {
          max-width: 680px;
        }

        .searchCard.compact {
          max-width: none;
        }
      }

      @media (max-width: 760px) {
        :root {
          --home-navbar-clearance: 146px;
          --home-page-gap: 16px;
        }

        .userHome,
        .hostHome {
          padding-top: var(--home-navbar-clearance);
          padding-bottom: 72px;
        }

        .userTop,
        .hostTop {
          gap: 20px;
        }

        .userGreeting h1,
        .hostTop h1 {
          font-size: clamp(40px, 11vw, 54px);
          line-height: 0.98;
          letter-spacing: -0.06em;
        }

        .userTopActions,
        .hostTopActions {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .userTopActions a,
        .hostTopActions a {
          width: 100%;
          min-height: 52px;
          justify-content: center;
          padding-inline: 12px;
          text-align: center;
        }

        .userSearchStage {
          gap: 24px;
          margin-top: 28px;
          padding: 24px;
          border-radius: 28px;
          background: #0c2116;
        }

        .userSearchCopy h2 {
          font-size: clamp(38px, 10vw, 52px);
          line-height: 0.98;
        }

        .userSearchCopy p {
          max-width: 100%;
          font-size: 13px;
        }

        .searchCard,
        .searchCard.compact {
          padding: 20px;
          border-radius: 24px;
        }

        .searchTop {
          gap: 12px;
        }

        .searchTop strong {
          font-size: clamp(24px, 7vw, 31px);
          line-height: 1.08;
        }

        .searchMainRow {
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
        }

        .searchInput,
        .primarySearchButton {
          width: 100%;
          min-width: 0;
          min-height: 58px;
        }

        .primarySearchButton {
          justify-content: center;
        }

        .categoryRow {
          margin-top: 15px;
          padding-bottom: 6px;
        }

        .categoryRow button {
          min-height: 43px;
          padding-inline: 14px;
        }

        .quickLinks {
          gap: 12px;
        }

        .quickLinks > a {
          padding: 18px;
        }
      }

      @media (max-width: 460px) {
        :root {
          --home-navbar-clearance: 138px;
          --home-page-gap: 13px;
        }

        .userTopActions,
        .hostTopActions {
          grid-template-columns: 1fr 1fr;
        }

        .userTopActions a,
        .hostTopActions a {
          min-height: 54px;
          font-size: 10px;
          gap: 7px;
        }

        .userSearchStage {
          padding: 19px;
          border-radius: 26px;
        }

        .searchCard,
        .searchCard.compact {
          padding: 18px;
          border-radius: 22px;
        }

        .searchTopIcon {
          display: none !important;
        }

        .searchInput {
          padding-inline: 14px;
        }

        .primarySearchButton {
          min-height: 56px;
        }

        .categoryRow {
          width: calc(100% + 2px);
          max-width: calc(100% + 2px);
          margin-inline: -1px;
        }
      }

      @media (max-width: 360px) {
        .userTopActions,
        .hostTopActions {
          grid-template-columns: 1fr;
        }

        .userGreeting h1,
        .hostTop h1 {
          font-size: 38px;
        }

        .userSearchStage {
          padding: 15px;
        }

        .searchCard,
        .searchCard.compact {
          padding: 16px;
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
