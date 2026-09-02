const SITE_URL = "https://www.meetoutdoors.app";
const SUPABASE_URL = "https://gvdhpruhnwzsnrjeekmd.supabase.co";

/*
  Kopiraj OVDE isti Supabase ANON key koji već koristiš u src/supabaseClient.js.
  Ovo NE menja Supabase podešavanja, bazu, auth niti RLS.
  Nemoj koristiti service_role key.
*/
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZGhwcnVobnd6c25yamVla21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MDM3MjQsImV4cCI6MjA4MDM3OTcyNH0.-YeJcjryZ85aECWfY6Qb8DOPa6k2PdqJe4H6ujbiRJ8";

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function plain(value = "", max = 180) {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function absoluteImage(value) {
  if (!value) return `${SITE_URL}/og-image.jpg`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

async function supabaseRows(table, params) {
  if (
    !SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY === "PASTE_EXISTING_SUPABASE_ANON_KEY_HERE"
  ) {
    throw new Error(
      "SEO renderer: ubaci postojeći Supabase anon key u api/seo.mjs."
    );
  }

  const search = new URLSearchParams(params);
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${search.toString()}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase ${table}: ${response.status} ${await response.text()}`
    );
  }

  return response.json();
}

function profileUrl(username) {
  return `${SITE_URL}/h/${encodeURIComponent(username)}`;
}

async function loadPlace(slug) {
  const rows = await supabaseRows("places", {
    select:
      "id,name,slug,short_description,description,country_code,country_name,region,municipality,locality,latitude,longitude,location_precision,difficulty,cover_url,is_active,moderation_status",
    slug: `eq.${slug}`,
    is_active: "eq.true",
    moderation_status: "eq.approved",
    limit: "1",
  });

  const p = rows[0];
  if (!p) return null;

  const canonical = `${SITE_URL}/mesta/${encodeURIComponent(p.slug)}`;
  const description =
    plain(p.short_description || p.description, 155) ||
    `Istraži ${p.name} na MeetOutdoors. Pogledaj lokaciju, pristup, fotografije i informacije za posetu.`;

  const address = {
    "@type": "PostalAddress",
    addressLocality: p.locality || p.municipality || undefined,
    addressRegion: p.region || undefined,
    addressCountry: p.country_code || p.country_name || "RS",
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: p.name,
    description: p.short_description || p.description || undefined,
    image: p.cover_url || undefined,
    url: canonical,
    address,
    geo:
      p.location_precision === "exact" && p.latitude && p.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
          }
        : undefined,
  };

  const location = [p.locality || p.municipality, p.region, p.country_name]
    .filter(Boolean)
    .join(", ");

  return {
    title: `${p.name}${p.region ? ` – ${p.region}` : ""} | MeetOutdoors`,
    description,
    canonical,
    image: absoluteImage(p.cover_url),
    type: "article",
    structuredData,
    body: `
      <article>
        <p class="seo-kicker">MeetOutdoors mesto</p>
        <h1>${esc(p.name)}</h1>
        ${location ? `<p>${esc(location)}</p>` : ""}
        ${p.difficulty ? `<p>Težina: ${esc(p.difficulty)}</p>` : ""}
        ${p.short_description || p.description ? `<p>${esc(plain(p.short_description || p.description, 650))}</p>` : ""}
        <p><a href="${esc(canonical)}">Pogledaj mesto na MeetOutdoors</a></p>
      </article>`,
  };
}

async function loadPackage(slug) {
  const rows = await supabaseRows("packages", {
    select:
      "id,host_id,title,slug,description,activity,city,country,location,location_text,price,currency,cover_url,image_url,duration,capacity,start_date,end_date,is_active",
    slug: `eq.${slug}`,
    is_active: "eq.true",
    limit: "1",
  });

  const p = rows[0];
  if (!p) return null;

  let host = null;
  if (p.host_id) {
    const hostRows = await supabaseRows("profiles", {
      select: "username,full_name,is_verified",
      id: `eq.${p.host_id}`,
      role: "eq.host",
      limit: "1",
    });
    host = hostRows[0] || null;
  }

  const canonical = `${SITE_URL}/paketi/${encodeURIComponent(p.slug)}`;
  const location = [p.location || p.location_text || p.city, p.country]
    .filter(Boolean)
    .join(", ");
  const description =
    plain(p.description, 155) ||
    `Rezerviši ${p.title} na MeetOutdoors. Pogledaj cenu, termin, lokaciju i detalje outdoor avanture.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description || undefined,
    image: p.cover_url || p.image_url || undefined,
    category: p.activity || "Outdoor adventure",
    url: canonical,
    brand: { "@type": "Brand", name: "MeetOutdoors" },
    offers: {
      "@type": "Offer",
      url: canonical,
      price: Number(p.price || 0),
      priceCurrency: p.currency || "EUR",
      availability: "https://schema.org/InStock",
      seller: host
        ? {
            "@type": "Organization",
            name: host.full_name || host.username,
            url: host.username ? profileUrl(host.username) : undefined,
          }
        : undefined,
    },
  };

  return {
    title: `${p.title}${location ? ` – ${location}` : ""} | MeetOutdoors`,
    description,
    canonical,
    image: absoluteImage(p.cover_url || p.image_url),
    type: "product",
    structuredData,
    body: `
      <article>
        <p class="seo-kicker">MeetOutdoors paket</p>
        <h1>${esc(p.title)}</h1>
        ${location ? `<p>${esc(location)}</p>` : ""}
        <p><strong>${esc(p.currency || "EUR")} ${esc(p.price || 0)}</strong>${p.duration ? ` · ${esc(p.duration)}` : ""}</p>
        ${host ? `<p>Organizator: <a href="/h/${esc(host.username)}">${esc(host.full_name || host.username)}</a></p>` : ""}
        ${p.description ? `<p>${esc(plain(p.description, 750))}</p>` : ""}
        <p><a href="${esc(canonical)}">Pogledaj i rezerviši paket</a></p>
      </article>`,
  };
}

async function loadEvent(id) {
  const rows = await supabaseRows("events", {
    select:
      "id,host_id,title,description,location,country,cover_url,price,capacity,start_date,end_date,is_active",
    id: `eq.${id}`,
    is_active: "eq.true",
    limit: "1",
  });

  const e = rows[0];
  if (!e) return null;

  let host = null;
  if (e.host_id) {
    const hostRows = await supabaseRows("profiles", {
      select: "username,full_name",
      id: `eq.${e.host_id}`,
      role: "eq.host",
      limit: "1",
    });
    host = hostRows[0] || null;
  }

  const canonical = `${SITE_URL}/event/${encodeURIComponent(e.id)}`;
  const location = [e.location, e.country].filter(Boolean).join(", ");
  const description =
    plain(e.description, 155) ||
    `Pridruži se događaju ${e.title} na MeetOutdoors. Pogledaj datum, lokaciju, organizatora i detalje prijave.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description || undefined,
    image: e.cover_url ? [e.cover_url] : undefined,
    startDate: e.start_date || undefined,
    endDate: e.end_date || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.location || e.title,
      address: {
        "@type": "PostalAddress",
        addressLocality: e.location || undefined,
        addressCountry: e.country || "Serbia",
      },
    },
    organizer: host
      ? {
          "@type": "Organization",
          name: host.full_name || host.username,
          url: host.username ? profileUrl(host.username) : undefined,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: canonical,
      price: Number(e.price || 0),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    url: canonical,
  };

  return {
    title: `${e.title}${location ? ` – ${location}` : ""} | MeetOutdoors`,
    description,
    canonical,
    image: absoluteImage(e.cover_url),
    type: "article",
    structuredData,
    body: `
      <article>
        <p class="seo-kicker">MeetOutdoors događaj</p>
        <h1>${esc(e.title)}</h1>
        ${location ? `<p>${esc(location)}</p>` : ""}
        ${e.start_date ? `<p>Početak: ${esc(new Date(e.start_date).toLocaleString("sr-Latn-RS"))}</p>` : ""}
        ${e.description ? `<p>${esc(plain(e.description, 750))}</p>` : ""}
        <p><a href="${esc(canonical)}">Pogledaj događaj</a></p>
      </article>`,
  };
}

async function loadHost(username) {
  const rows = await supabaseRows("profiles", {
    select:
      "id,username,full_name,city,country,avatar_url,cover_url,bio,instagram_url,website_url,activities,is_verified,role",
    username: `eq.${username}`,
    role: "eq.host",
    limit: "1",
  });

  const h = rows[0];
  if (!h) return null;

  const displayName = h.full_name || h.username || "Outdoor Host";
  const canonical = profileUrl(h.username);
  const location = [h.city, h.country].filter(Boolean).join(", ");
  const description =
    plain(h.bio, 155) ||
    `${displayName} je outdoor domaćin na MeetOutdoors. Pogledaj događaje, ture, pakete, aktivnosti, lokacije i utiske učesnika.`;

  const sameAs = [h.instagram_url, h.website_url]
    .filter(Boolean)
    .map((value) =>
      /^https?:\/\//i.test(value) ? value : `https://${value}`
    );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonical,
    mainEntity: {
      "@type": "Person",
      name: displayName,
      alternateName: h.username ? `@${h.username}` : undefined,
      description: h.bio || undefined,
      image: h.avatar_url || h.cover_url || undefined,
      url: canonical,
      homeLocation: location
        ? { "@type": "Place", name: location }
        : undefined,
      knowsAbout:
        Array.isArray(h.activities) && h.activities.length
          ? h.activities
          : undefined,
      sameAs: sameAs.length ? sameAs : undefined,
    },
  };

  return {
    title: `${displayName}${h.city ? ` – ${h.city}` : ""} | MeetOutdoors`,
    description,
    canonical,
    image: absoluteImage(h.cover_url || h.avatar_url),
    type: "profile",
    structuredData,
    body: `
      <article>
        <p class="seo-kicker">${h.is_verified ? "Verifikovani MeetOutdoors domaćin" : "MeetOutdoors domaćin"}</p>
        <h1>${esc(displayName)}</h1>
        ${location ? `<p>${esc(location)}</p>` : ""}
        ${Array.isArray(h.activities) && h.activities.length ? `<p>Aktivnosti: ${esc(h.activities.join(", "))}</p>` : ""}
        ${h.bio ? `<p>${esc(plain(h.bio, 750))}</p>` : ""}
        <p><a href="${esc(canonical)}">Pogledaj profil domaćina</a></p>
      </article>`,
  };
}

async function loadSeoData(type, value) {
  if (type === "place") return loadPlace(value);
  if (type === "package") return loadPackage(value);
  if (type === "event") return loadEvent(value);
  if (type === "host") return loadHost(value);
  return null;
}

function replaceOrInsert(html, regex, replacement) {
  if (regex.test(html)) return html.replace(regex, replacement);
  return html.replace("</head>", `${replacement}\n</head>`);
}

function injectSeo(indexHtml, seo) {
  let html = indexHtml;

  html = replaceOrInsert(
    html,
    /<title>[\s\S]*?<\/title>/i,
    `<title>${esc(seo.title)}</title>`
  );

  html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "");
  html = html.replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "");
  html = html.replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>\s*/gi, "");
  html = html.replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "");
  html = html.replace(
    /<script[^>]+id=["']meetoutdoors-server-structured-data["'][^>]*>[\s\S]*?<\/script>\s*/gi,
    ""
  );

  const head = `
    <meta name="description" content="${esc(seo.description)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${esc(seo.canonical)}">
    <meta property="og:title" content="${esc(seo.title)}">
    <meta property="og:description" content="${esc(seo.description)}">
    <meta property="og:url" content="${esc(seo.canonical)}">
    <meta property="og:type" content="${esc(seo.type || "website")}">
    <meta property="og:site_name" content="MeetOutdoors">
    <meta property="og:image" content="${esc(seo.image)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(seo.title)}">
    <meta name="twitter:description" content="${esc(seo.description)}">
    <meta name="twitter:image" content="${esc(seo.image)}">
    <script id="meetoutdoors-server-structured-data" type="application/ld+json">${jsonLd(seo.structuredData)}</script>`;

  html = html.replace("</head>", `${head}\n</head>`);

  const ssr = `
    <div id="meetoutdoors-seo-prerender" style="max-width:1100px;margin:0 auto;padding:120px 24px 48px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#203229">
      ${seo.body}
    </div>`;

  if (/<div\s+id=["']root["']\s*>\s*<\/div>/i.test(html)) {
    html = html.replace(
      /<div\s+id=["']root["']\s*>\s*<\/div>/i,
      `<div id="root">${ssr}</div>`
    );
  }

  return html;
}

async function getIndexHtml(request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const response = await fetch(`${origin}/index.html`, {
    headers: { Accept: "text/html" },
  });

  if (!response.ok) {
    throw new Error(`index.html: ${response.status}`);
  }

  return response.text();
}

export async function GET(request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const value =
    url.searchParams.get("slug") ||
    url.searchParams.get("id") ||
    url.searchParams.get("username");

  try {
    const [indexHtml, seo] = await Promise.all([
      getIndexHtml(request),
      value ? loadSeoData(type, value) : Promise.resolve(null),
    ]);

    if (!seo) {
      return new Response(indexHtml, {
        status: 404,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=0, s-maxage=60",
        },
      });
    }

    return new Response(injectSeo(indexHtml, seo), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control":
          "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("MeetOutdoors SEO renderer:", error);

    try {
      const indexHtml = await getIndexHtml(request);
      return new Response(indexHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-MeetOutdoors-SEO": "fallback",
        },
      });
    } catch {
      return new Response("SEO renderer error", { status: 500 });
    }
  }
}
