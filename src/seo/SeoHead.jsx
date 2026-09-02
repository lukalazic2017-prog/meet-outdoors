import { useEffect } from "react";

const SITE_NAME = "MeetOutdoors";
const SITE_URL = "https://www.meetoutdoors.app";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function setCanonical(url) {
  let canonical = document.head.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
}

export default function SeoHead({
  title,
  description,
  canonicalPath = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  structuredData = null,
}) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : "MeetOutdoors | Outdoor avanture, mesta i događaji";

    const canonicalUrl = `${SITE_URL}${canonicalPath}`;
    const metaDescription =
      description ||
      "Pronađi outdoor mesta, događaje, ture i domaćine. Istraži prirodu uz MeetOutdoors.";

    document.title = fullTitle;

    setMeta('meta[name="description"]', {
      name: "description",
      content: metaDescription,
    });

    setMeta('meta[name="robots"]', {
      name: "robots",
      content: noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large",
    });

    setMeta('meta[property="og:title"]', {
      property: "og:title",
      content: fullTitle,
    });

    setMeta('meta[property="og:description"]', {
      property: "og:description",
      content: metaDescription,
    });

    setMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });

    setMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });

    setMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE_NAME,
    });

    setMeta('meta[property="og:image"]', {
      property: "og:image",
      content: image,
    });

    setMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });

    setMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: fullTitle,
    });

    setMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: metaDescription,
    });

    setMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: image,
    });

    setCanonical(canonicalUrl);

    const scriptId = "meetoutdoors-structured-data";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement("script");

      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);

      document.head.appendChild(script);
    }

    return () => {
      const script = document.getElementById(scriptId);

      if (script) {
        script.remove();
      }
    };
  }, [
    title,
    description,
    canonicalPath,
    image,
    type,
    noindex,
    structuredData,
  ]);

  return null;
}