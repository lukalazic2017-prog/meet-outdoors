import React, { useMemo, useState } from "react";

const STORY_W = 1080;
const STORY_H = 1920;

function ShareIcon({ name, size = 20 }) {
  const icons = {
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2" />
      </>
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none" />
      </>
    ),
    facebook: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M14.5 7.5h-2A2.5 2.5 0 0 0 10 10v8M8 12h6" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" />
        <path d="M9 8.5c.3 2.3 2.2 4.2 4.5 4.8" />
      </>
    ),
    messenger: (
      <>
        <path d="M21 11.5c0 4.7-4 8.5-9 8.5-1 0-2-.2-2.9-.5L5 21l1.2-3.5A8.2 8.2 0 0 1 3 11.5C3 6.8 7 3 12 3s9 3.8 9 8.5Z" />
        <path d="m7.5 14 3.2-3.4 2.6 2 3.2-3.4" />
      </>
    ),
    telegram: (
      <>
        <path d="m21 3-7.5 18-4-7-6.5-3 18-8Z" />
        <path d="m9.5 14 4-3.5" />
      </>
    ),
    viber: (
      <>
        <path d="M5 4.5C7 2.7 15.5 2.4 18.7 5.8c2.8 3 2.4 8.8.4 11.1-1.4 1.6-3.3 2.2-5.1 2.5L10 22v-2.3c-2.5-.2-4.6-1-5.8-2.4C1.6 14.2 2 7.2 5 4.5Z" />
        <path d="M8 8.3c.5 3 2.6 5.2 5.7 5.8M14.2 7.5c1.4.4 2.1 1.1 2.4 2.4M13.8 5.5c2.7.5 4.2 2 4.7 4.7" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),
    magic: (
      <>
        <path d="m15 4 5 5L9 20l-5-5L15 4Z" />
        <path d="M14 3v3M21 10h-3M5 4l2 2" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function buildShareText({ type, title, location, subtitle }) {
  if (type === "event") {
    return [
      `🥾 ${title}`,
      location ? `📍 ${location}` : "",
      subtitle || "",
      "Pogledaj događaj na MeetOutdoors.",
    ].filter(Boolean).join("\n");
  }

  if (type === "package") {
    return [
      `🌿 ${title}`,
      location ? `📍 ${location}` : "",
      subtitle || "",
      "Pogledaj ovu outdoor turu na MeetOutdoors.",
    ].filter(Boolean).join("\n");
  }

  return [
    `🌿 ${title}`,
    location ? `📍 ${location}` : "",
    "Pogledaj ovog domaćina na MeetOutdoors.",
    "Događaji, ture, paketi i outdoor lokacije na jednom mestu.",
  ].filter(Boolean).join("\n");
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h) {
  if (!img) return;
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.max(0, (img.width - sw) / 2);
  const sy = Math.max(0, (img.height - sh) / 2);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function fitText(ctx, text, maxWidth, maxSize, minSize = 34, weight = 900) {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px Inter, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return minSize;
}

function wrapText(ctx, text, maxWidth, maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);

  if (lines.join(" ").length < String(text || "").length) {
    let last = lines[lines.length - 1] || "";
    while (last && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last.trim()}…`;
  }

  return lines;
}

async function loadImage(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("Image fetch failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const img = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = reject;
        element.src = objectUrl;
      });
      return img;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    console.warn("Story image could not be loaded:", error);
    return null;
  }
}

async function createStoryFile({
  type,
  title,
  image,
  avatar,
  location,
  subtitle,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nije dostupan.");

  const [coverImg, avatarImg] = await Promise.all([
    loadImage(image),
    loadImage(avatar),
  ]);

  // Base.
  const bg = ctx.createLinearGradient(0, 0, 0, STORY_H);
  bg.addColorStop(0, "#0a1710");
  bg.addColorStop(0.58, "#10281a");
  bg.addColorStop(1, "#07100b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  if (coverImg) {
    drawCover(ctx, coverImg, 0, 0, STORY_W, STORY_H);

    const shade = ctx.createLinearGradient(0, 0, 0, STORY_H);
    shade.addColorStop(0, "rgba(5,16,10,.12)");
    shade.addColorStop(0.45, "rgba(5,16,10,.28)");
    shade.addColorStop(0.72, "rgba(5,16,10,.74)");
    shade.addColorStop(1, "rgba(5,16,10,.98)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, STORY_W, STORY_H);
  }

  // Soft glow.
  const glow = ctx.createRadialGradient(930, 520, 20, 930, 520, 620);
  glow.addColorStop(0, "rgba(186,255,158,.20)");
  glow.addColorStop(1, "rgba(186,255,158,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Brand pill.
  roundedRect(ctx, 64, 70, 362, 78, 39);
  ctx.fillStyle = "rgba(5,18,11,.62)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#baff9e";
  ctx.beginPath();
  ctx.arc(108, 109, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 29px Inter, Arial, sans-serif";
  ctx.fillText("MEETOUTDOORS", 140, 119);

  // Type chip.
  const typeLabel =
    type === "event"
      ? "OUTDOOR DOGAĐAJ"
      : type === "package"
      ? "TURA I PAKET"
      : "OUTDOOR DOMAĆIN";

  roundedRect(ctx, 64, 176, 360, 56, 28);
  ctx.fillStyle = "rgba(186,255,158,.14)";
  ctx.fill();
  ctx.fillStyle = "#d9ffca";
  ctx.font = "900 20px Inter, Arial, sans-serif";
  ctx.fillText(typeLabel, 92, 212);

  // Avatar for host.
  if (type === "host" && avatarImg) {
    const ax = 64;
    const ay = 1240;
    const size = 154;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + size / 2, ay + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, avatarImg, ax, ay, size, size);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(ax + size / 2, ay + size / 2, size / 2 + 7, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ax + size - 4, ay + size - 18, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#baff9e";
    ctx.fill();
    ctx.strokeStyle = "#173b27";
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.fillStyle = "#173b27";
    ctx.font = "900 22px Arial";
    ctx.fillText("✓", ax + size - 15, ay + size - 10);
  }

  // Main copy block.
  const textY = type === "host" && avatarImg ? 1435 : 1270;
  ctx.fillStyle = "#baff9e";
  ctx.font = "900 24px Inter, Arial, sans-serif";
  ctx.fillText(
    type === "host"
      ? "UPOZNAJ DOMAĆINA"
      : type === "event"
      ? "PRIDRUŽI SE AVANTURI"
      : "REZERVIŠI AVANTURU",
    64,
    textY
  );

  const titleSize = fitText(ctx, title || "MeetOutdoors", 930, 76, 50, 900);
  ctx.font = `900 ${titleSize}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";

  const titleLines = wrapText(ctx, title || "MeetOutdoors", 930, 3);
  let y = textY + 88;
  const lineHeight = titleSize * 1.02;

  titleLines.forEach((line) => {
    ctx.fillText(line, 64, y);
    y += lineHeight;
  });

  if (location) {
    y += 22;
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.font = "750 31px Inter, Arial, sans-serif";
    ctx.fillText(`●  ${location}`, 64, y);
    y += 52;
  }

  if (subtitle) {
    ctx.fillStyle = "rgba(255,255,255,.56)";
    ctx.font = "650 27px Inter, Arial, sans-serif";
    const subLines = wrapText(ctx, subtitle, 930, 2);
    subLines.forEach((line) => {
      ctx.fillText(line, 64, y);
      y += 40;
    });
  }

  // CTA card.
  const ctaY = 1690;
  roundedRect(ctx, 64, ctaY, 952, 142, 36);
  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.fill();

  ctx.fillStyle = "#173b27";
  ctx.font = "900 25px Inter, Arial, sans-serif";
  ctx.fillText("PRONAĐI NA", 104, ctaY + 52);

  ctx.font = "900 45px Inter, Arial, sans-serif";
  ctx.fillText("meetoutdoors.app", 104, ctaY + 103);

  ctx.beginPath();
  ctx.arc(936, ctaY + 71, 43, 0, Math.PI * 2);
  ctx.fillStyle = "#baff9e";
  ctx.fill();

  ctx.fillStyle = "#173b27";
  ctx.font = "900 39px Arial";
  ctx.fillText("↗", 916, ctaY + 85);

  // Footer.
  ctx.fillStyle = "rgba(255,255,255,.38)";
  ctx.font = "750 18px Inter, Arial, sans-serif";
  ctx.fillText(
    "EXPLORE • DISCOVER • SHARE",
    64,
    1882
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Story slika nije generisana."));
      },
      "image/png",
      0.96
    );
  });

  const safeName = String(title || "meetoutdoors")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return new File(
    [blob],
    `meetoutdoors-${safeName || "story"}.png`,
    { type: "image/png" }
  );
}

export default function ShareSheet({
  type = "host",
  title,
  image,
  avatar,
  location,
  subtitle,
  url,
  triggerClassName = "shareSheetTrigger",
  triggerEyebrow = "PODELI",
  triggerLabel = "Profil",
}) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [storyLoading, setStoryLoading] = useState(false);

  const shareUrl = useMemo(() => {
    if (url) return url;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, [url]);

  const shareText = useMemo(
    () => buildShareText({ type, title, location, subtitle }),
    [type, title, location, subtitle]
  );

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  async function copyLink(message = "Link je kopiran.") {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash(message);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      flash(message);
    }
  }

  async function nativeShare() {
    const data = {
      title: title || "MeetOutdoors",
      text: shareText,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("Share error:", error);
      }
    }

    await copyLink("Link je kopiran.");
  }

  async function shareStoryImage(targetName = "Instagram Stories") {
    if (storyLoading) return;

    try {
      setStoryLoading(true);
      setNotice("");

      const file = await createStoryFile({
        type,
        title,
        image,
        avatar,
        location,
        subtitle,
      });

      const canShareFile =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (!navigator.canShare ||
          navigator.canShare({
            files: [file],
          }));

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            title: title || "MeetOutdoors",
            text: `${shareText}\n\n${shareUrl}`,
          });
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
          console.error("Story share error:", error);
        }
      }

      // Desktop / unsupported fallback: save the branded 9:16 image.
      const objectUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

      flash(
        `Story kartica je sačuvana. Otvori ${targetName} i dodaj je kao Story.`
      );
    } catch (error) {
      console.error("Story generation error:", error);
      flash("Story kartica trenutno nije mogla da se napravi.");
    } finally {
      setStoryLoading(false);
    }
  }

  function openWindow(targetUrl) {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  function shareWhatsApp() {
    const text = `${shareText}\n\n${shareUrl}`;
    openWindow(`https://wa.me/?text=${encodeURIComponent(text)}`);
  }

  function shareFacebook() {
    openWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`
    );
  }

  function shareTelegram() {
    openWindow(
      `https://t.me/share/url?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareText)}`
    );
  }

  function shareViber() {
    const text = `${shareText}\n\n${shareUrl}`;
    window.location.href = `viber://forward?text=${encodeURIComponent(text)}`;
  }

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        <ShareIcon name="share" size={17} />
        <div>
          <small>{triggerEyebrow}</small>
          <strong>{triggerLabel}</strong>
        </div>
      </button>

      {open && (
        <div className="moShareOverlay" role="dialog" aria-modal="true">
          <button
            type="button"
            className="moShareBackdrop"
            aria-label="Zatvori deljenje"
            onClick={() => setOpen(false)}
          />

          <section className="moShareSheet">
            <div className="moShareHandle" />

            <header className="moShareHeader">
              <div>
                <span>MEETOUTDOORS SHARE STUDIO</span>
                <h2>
                  {type === "host"
                    ? "Podeli domaćina"
                    : type === "event"
                    ? "Podeli događaj"
                    : "Podeli paket"}
                </h2>
              </div>

              <button type="button" onClick={() => setOpen(false)}>
                <ShareIcon name="close" size={18} />
              </button>
            </header>

            <article className="moSharePreview">
              <div className="moSharePreviewImage">
                <img src={image} alt="" />
                <div />
                {type === "host" && avatar && (
                  <img
                    src={avatar}
                    alt=""
                    className="moShareAvatar"
                  />
                )}
                <span>MEETOUTDOORS</span>
              </div>

              <div className="moSharePreviewCopy">
                <small>
                  {type === "host"
                    ? "OUTDOOR DOMAĆIN"
                    : type === "event"
                    ? "OUTDOOR DOGAĐAJ"
                    : "TURA I PAKET"}
                </small>
                <strong>{title}</strong>
                {location && <span>{location}</span>}
                {subtitle && <em>{subtitle}</em>}
              </div>
            </article>

            <button
              type="button"
              className="moStoryHero"
              onClick={() => shareStoryImage("Instagram")}
              disabled={storyLoading}
            >
              <span className="moStoryHeroIcon">
                <ShareIcon name="instagram" size={27} />
              </span>

              <div>
                <small>9:16 • BRANDED STORY</small>
                <strong>
                  {storyLoading
                    ? "Pravimo Story karticu..."
                    : "Instagram Story"}
                </strong>
                <p>
                  Automatski pravi MeetOutdoors Story sa slikom,
                  imenom, lokacijom i meetoutdoors.app.
                </p>
              </div>

              <span className="moStoryMagic">
                <ShareIcon name="magic" size={19} />
              </span>
            </button>

            <div className="moShareGrid">
              <button
                type="button"
                className="facebook"
                onClick={shareFacebook}
              >
                <span><ShareIcon name="facebook" size={22} /></span>
                <strong>Facebook</strong>
                <small>Podeli link</small>
              </button>

              <button
                type="button"
                className="whatsapp"
                onClick={shareWhatsApp}
              >
                <span><ShareIcon name="whatsapp" size={22} /></span>
                <strong>WhatsApp</strong>
                <small>Pošalji odmah</small>
              </button>

              <button
                type="button"
                className="messenger"
                onClick={() => shareStoryImage("Messenger")}
              >
                <span><ShareIcon name="messenger" size={22} /></span>
                <strong>Messenger</strong>
                <small>Slika + link</small>
              </button>

              <button
                type="button"
                className="telegram"
                onClick={shareTelegram}
              >
                <span><ShareIcon name="telegram" size={22} /></span>
                <strong>Telegram</strong>
                <small>Pošalji link</small>
              </button>

              <button
                type="button"
                className="viber"
                onClick={shareViber}
              >
                <span><ShareIcon name="viber" size={22} /></span>
                <strong>Viber</strong>
                <small>Pošalji link</small>
              </button>

              <button
                type="button"
                className="storyImage"
                onClick={() => shareStoryImage("željenu aplikaciju")}
                disabled={storyLoading}
              >
                <span><ShareIcon name="image" size={22} /></span>
                <strong>Story slika</strong>
                <small>1080 × 1920</small>
              </button>
            </div>

            <button
              type="button"
              className="moShareNative"
              onClick={nativeShare}
            >
              <span><ShareIcon name="share" size={19} /></span>
              <div>
                <small>SVE APLIKACIJE</small>
                <strong>Podeli link preko telefona</strong>
              </div>
            </button>

            <div className="moShareLinkRow">
              <div>
                <small>DIREKTAN LINK</small>
                <strong>{shareUrl.replace(/^https?:\/\//, "")}</strong>
              </div>

              <button type="button" onClick={() => copyLink()}>
                <ShareIcon name="copy" size={16} />
                Kopiraj
              </button>
            </div>

            <p className="moShareHint">
              Instagram Story dugme pravi pravu 9:16 PNG karticu i šalje je
              Android/iOS share meniju. Ako Instagram dozvoli Story kao share
              destinaciju na uređaju, samo ga izaberi iz sistemskog menija.
            </p>

            {notice && <div className="moShareNotice">{notice}</div>}
          </section>

          <style>{`
            .moShareOverlay{position:fixed;inset:0;z-index:99999;display:grid;place-items:end center;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
            .moShareBackdrop{position:absolute;inset:0;border:0;background:rgba(4,12,7,.73);backdrop-filter:blur(10px);cursor:pointer}
            .moShareSheet{position:relative;z-index:2;width:min(650px,calc(100% - 20px));max-height:min(860px,calc(100svh - 16px));margin:0 10px 8px;padding:18px;overflow:auto;border:1px solid rgba(255,255,255,.11);border-radius:32px;background:radial-gradient(circle at 85% 0%,rgba(186,255,158,.08),transparent 26%),linear-gradient(160deg,#07170e,#102b1b 62%,#07170e);color:#fff;box-shadow:0 42px 130px rgba(0,0,0,.58);animation:moShareIn .24s cubic-bezier(.2,.75,.2,1)}
            @keyframes moShareIn{from{opacity:0;transform:translateY(28px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
            .moShareHandle{width:48px;height:4px;margin:0 auto 15px;border-radius:999px;background:rgba(255,255,255,.18)}
            .moShareHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
            .moShareHeader span{color:#baff9e;font-size:7px;font-weight:950;letter-spacing:.12em}
            .moShareHeader h2{margin:5px 0 0;font-size:28px;line-height:1;letter-spacing:-.05em}
            .moShareHeader>button{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.055);color:#fff;cursor:pointer}
            .moSharePreview{display:grid;grid-template-columns:128px minmax(0,1fr);gap:14px;margin-top:17px;padding:9px;border:1px solid rgba(255,255,255,.09);border-radius:20px;background:rgba(255,255,255,.045)}
            .moSharePreviewImage{position:relative;height:118px;overflow:hidden;border-radius:15px;background:#173b27}
            .moSharePreviewImage>img:not(.moShareAvatar){width:100%;height:100%;display:block;object-fit:cover}
            .moSharePreviewImage>div{position:absolute;inset:0;background:linear-gradient(180deg,transparent 20%,rgba(4,14,8,.78))}
            .moSharePreviewImage>span{position:absolute;right:8px;bottom:8px;left:8px;color:#d9ffca;font-size:6px;font-weight:950;letter-spacing:.1em}
            .moShareAvatar{position:absolute;left:9px;bottom:26px;width:42px;height:42px;border:3px solid white;border-radius:50%;object-fit:cover;box-shadow:0 7px 20px rgba(0,0,0,.25)}
            .moSharePreviewCopy{display:flex;justify-content:center;flex-direction:column;min-width:0;padding-right:6px}
            .moSharePreviewCopy small{color:#baff9e;font-size:6px;font-weight:950;letter-spacing:.1em}
            .moSharePreviewCopy strong{margin-top:6px;overflow:hidden;font-size:17px;line-height:1.12;text-overflow:ellipsis;white-space:nowrap}
            .moSharePreviewCopy span,.moSharePreviewCopy em{display:block;margin-top:5px;color:rgba(255,255,255,.46);font-size:8px;font-style:normal;line-height:1.4}
            .moStoryHero{display:grid;grid-template-columns:54px minmax(0,1fr) 42px;align-items:center;gap:12px;width:100%;margin-top:14px;padding:14px;border:1px solid rgba(255,113,192,.23);border-radius:21px;background:linear-gradient(135deg,rgba(255,70,142,.17),rgba(174,72,255,.14) 52%,rgba(255,164,67,.13));color:#fff;text-align:left;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.06);transition:.18s ease}
            .moStoryHero:hover{transform:translateY(-2px);border-color:rgba(255,168,219,.38)}
            .moStoryHero:disabled{cursor:wait;opacity:.72}
            .moStoryHeroIcon{display:grid;place-items:center;width:54px;height:54px;border-radius:17px;background:linear-gradient(145deg,#833ab4,#fd1d1d 52%,#fcb045);color:#fff;box-shadow:0 12px 25px rgba(214,58,127,.25)}
            .moStoryHero small,.moStoryHero strong{display:block}
            .moStoryHero small{color:#ffcdea;font-size:6px;font-weight:950;letter-spacing:.09em}
            .moStoryHero strong{margin-top:4px;font-size:12px}
            .moStoryHero p{margin:5px 0 0;color:rgba(255,255,255,.47);font-size:7px;line-height:1.45}
            .moStoryMagic{display:grid;place-items:center;width:42px;height:42px;border:1px solid rgba(255,255,255,.1);border-radius:13px;background:rgba(255,255,255,.06);color:#ffd5ef}
            .moShareGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
            .moShareGrid>button{display:grid;justify-items:start;min-width:0;min-height:102px;padding:12px;border:1px solid rgba(255,255,255,.085);border-radius:17px;background:rgba(255,255,255,.04);color:#fff;text-align:left;cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease}
            .moShareGrid>button:hover{transform:translateY(-2px);border-color:rgba(186,255,158,.22);background:rgba(255,255,255,.07)}
            .moShareGrid>button:disabled{cursor:wait;opacity:.65}
            .moShareGrid>button>span{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:rgba(255,255,255,.07);color:#dfffd2}
            .moShareGrid>button strong{align-self:end;margin-top:9px;font-size:9px}
            .moShareGrid>button small{margin-top:3px;color:rgba(255,255,255,.36);font-size:6px}
            .moShareGrid .facebook>span{background:rgba(88,139,255,.14);color:#9fc0ff}
            .moShareGrid .whatsapp>span{background:rgba(71,215,130,.13);color:#86efb0}
            .moShareGrid .messenger>span{background:rgba(111,128,255,.14);color:#b4bdff}
            .moShareGrid .telegram>span{background:rgba(83,181,238,.13);color:#9cdcff}
            .moShareGrid .viber>span{background:rgba(170,114,227,.14);color:#d8b4ff}
            .moShareGrid .storyImage>span{background:rgba(186,255,158,.1);color:#baff9e}
            .moShareNative{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:10px;width:100%;min-height:62px;margin-top:9px;padding:9px 11px;border:1px solid rgba(186,255,158,.2);border-radius:17px;background:rgba(186,255,158,.075);color:#fff;text-align:left;cursor:pointer}
            .moShareNative>span{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#baff9e;color:#102619}
            .moShareNative small,.moShareNative strong{display:block}
            .moShareNative small{color:#baff9e;font-size:5px;font-weight:950;letter-spacing:.1em}
            .moShareNative strong{margin-top:3px;font-size:9px}
            .moShareLinkRow{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;margin-top:9px;padding:11px;border:1px solid rgba(255,255,255,.075);border-radius:15px;background:rgba(255,255,255,.035)}
            .moShareLinkRow>div{min-width:0}
            .moShareLinkRow small,.moShareLinkRow strong{display:block}
            .moShareLinkRow small{color:rgba(255,255,255,.34);font-size:5px;font-weight:900;letter-spacing:.08em}
            .moShareLinkRow strong{margin-top:4px;overflow:hidden;color:rgba(255,255,255,.72);font-size:7px;text-overflow:ellipsis;white-space:nowrap}
            .moShareLinkRow>button{display:inline-flex;align-items:center;gap:6px;min-height:37px;padding:0 10px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font-size:7px;font-weight:850}
            .moShareHint{margin:10px 3px 0;color:rgba(255,255,255,.31);font-size:6px;line-height:1.5}
            .moShareNotice{position:sticky;bottom:0;margin-top:10px;padding:10px 11px;border:1px solid rgba(186,255,158,.17);border-radius:12px;background:#173b27;color:#d9ffca;font-size:7px;font-weight:850;text-align:center}
            @media(min-width:761px){.moShareOverlay{place-items:center}.moShareSheet{margin:12px}}
            @media(max-width:520px){.moShareSheet{width:calc(100% - 10px);margin:0 5px 5px;padding:14px;border-radius:25px}.moSharePreview{grid-template-columns:96px minmax(0,1fr)}.moSharePreviewImage{height:96px}.moShareGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.moShareGrid>button{min-height:96px}.moShareHeader h2{font-size:23px}.moStoryHero{grid-template-columns:48px minmax(0,1fr) 38px;padding:12px}.moStoryHeroIcon{width:48px;height:48px}.moStoryMagic{width:38px;height:38px}}
            @media(prefers-reduced-motion:reduce){.moShareSheet,.moShareGrid>button,.moStoryHero{animation:none!important;transition:none!important}}
          `}</style>
        </div>
      )}
    </>
  );
}
