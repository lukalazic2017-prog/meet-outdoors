import React, { useMemo, useState } from "react";

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
    external: (
      <>
        <path d="M14 4h6v6" />
        <path d="m20 4-9 9" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
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
      "Pogledaj događaj na MeetOutdoors. 🍃",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (type === "package") {
    return [
      `🌿 ${title}`,
      location ? `📍 ${location}` : "",
      subtitle || "",
      "Pogledaj ovu outdoor turu na MeetOutdoors. 🍃",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `🌿 Pogledaj profil domaćina ${title} na MeetOutdoors.`,
    location ? `📍 ${location}` : "",
    "Događaji, ture, paketi i outdoor lokacije na jednom mestu.",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function ShareSheet({
  type = "host",
  title,
  image,
  location,
  subtitle,
  url,
  triggerClassName = "shareSheetTrigger",
  triggerEyebrow = "PODELI",
  triggerLabel = "Profil",
}) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

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
    window.setTimeout(() => setNotice(""), 2200);
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

  async function nativeShare(targetName = "") {
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

    await copyLink(
      targetName
        ? `Link je kopiran. Otvori ${targetName} i nalepi ga.`
        : "Link je kopiran."
    );
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
                <span>MEETOUTDOORS SHARE</span>
                <h2>
                  {type === "host"
                    ? "Podeli profil"
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

            <div className="moShareGrid">
              <button
                type="button"
                className="instagram"
                onClick={() => nativeShare("Instagram")}
              >
                <span><ShareIcon name="instagram" size={22} /></span>
                <strong>Instagram</strong>
                <small>Story / poruka</small>
              </button>

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
                onClick={() => nativeShare("Messenger")}
              >
                <span><ShareIcon name="messenger" size={22} /></span>
                <strong>Messenger</strong>
                <small>Izaberi kontakt</small>
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
            </div>

            <button
              type="button"
              className="moShareNative"
              onClick={() => nativeShare()}
            >
              <span><ShareIcon name="share" size={19} /></span>
              <div>
                <small>SVE APLIKACIJE</small>
                <strong>Podeli preko telefona</strong>
              </div>
              <ShareIcon name="external" size={16} />
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
              Za Instagram i Messenger otvara se sistemski meni za deljenje —
              tamo izaberi željenu aplikaciju.
            </p>

            {notice && <div className="moShareNotice">{notice}</div>}
          </section>

          <style>{`
            .moShareOverlay{position:fixed;inset:0;z-index:99999;display:grid;place-items:end center;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
            .moShareBackdrop{position:absolute;inset:0;border:0;background:rgba(4,12,7,.66);backdrop-filter:blur(7px);cursor:pointer}
            .moShareSheet{position:relative;z-index:2;width:min(620px,calc(100% - 24px));max-height:min(820px,calc(100svh - 24px));margin:0 12px 12px;padding:18px;overflow:auto;border:1px solid rgba(255,255,255,.1);border-radius:30px;background:linear-gradient(160deg,#0a1b11,#102b1b 62%,#0a1d12);color:#fff;box-shadow:0 36px 110px rgba(0,0,0,.5);animation:moShareIn .24s cubic-bezier(.2,.75,.2,1)}
            @keyframes moShareIn{from{opacity:0;transform:translateY(24px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
            .moShareHandle{width:48px;height:4px;margin:0 auto 15px;border-radius:999px;background:rgba(255,255,255,.18)}
            .moShareHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
            .moShareHeader span{color:#baff9e;font-size:7px;font-weight:950;letter-spacing:.12em}
            .moShareHeader h2{margin:5px 0 0;font-size:27px;line-height:1;letter-spacing:-.05em}
            .moShareHeader>button{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.055);color:#fff;cursor:pointer}
            .moSharePreview{display:grid;grid-template-columns:126px minmax(0,1fr);gap:14px;margin-top:17px;padding:9px;border:1px solid rgba(255,255,255,.09);border-radius:20px;background:rgba(255,255,255,.045)}
            .moSharePreviewImage{position:relative;height:116px;overflow:hidden;border-radius:15px;background:#173b27}
            .moSharePreviewImage img{width:100%;height:100%;display:block;object-fit:cover}
            .moSharePreviewImage>div{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(4,14,8,.74))}
            .moSharePreviewImage>span{position:absolute;right:8px;bottom:8px;left:8px;color:#d9ffca;font-size:6px;font-weight:950;letter-spacing:.1em}
            .moSharePreviewCopy{display:flex;justify-content:center;flex-direction:column;min-width:0;padding-right:6px}
            .moSharePreviewCopy small{color:#baff9e;font-size:6px;font-weight:950;letter-spacing:.1em}
            .moSharePreviewCopy strong{margin-top:6px;overflow:hidden;font-size:17px;line-height:1.12;text-overflow:ellipsis;white-space:nowrap}
            .moSharePreviewCopy span,.moSharePreviewCopy em{display:block;margin-top:5px;color:rgba(255,255,255,.46);font-size:8px;font-style:normal;line-height:1.4}
            .moShareGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}
            .moShareGrid>button{display:grid;justify-items:start;min-width:0;min-height:108px;padding:13px;border:1px solid rgba(255,255,255,.085);border-radius:17px;background:rgba(255,255,255,.04);color:#fff;text-align:left;cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease}
            .moShareGrid>button:hover{transform:translateY(-2px);border-color:rgba(186,255,158,.22);background:rgba(255,255,255,.07)}
            .moShareGrid>button>span{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:rgba(255,255,255,.07);color:#dfffd2}
            .moShareGrid>button strong{align-self:end;margin-top:10px;font-size:9px}
            .moShareGrid>button small{margin-top:3px;color:rgba(255,255,255,.36);font-size:6px}
            .moShareGrid .instagram>span{background:linear-gradient(135deg,rgba(255,91,120,.18),rgba(177,89,255,.16));color:#ffb6dc}
            .moShareGrid .facebook>span{background:rgba(88,139,255,.14);color:#9fc0ff}
            .moShareGrid .whatsapp>span{background:rgba(71,215,130,.13);color:#86efb0}
            .moShareGrid .messenger>span{background:rgba(111,128,255,.14);color:#b4bdff}
            .moShareGrid .telegram>span{background:rgba(83,181,238,.13);color:#9cdcff}
            .moShareGrid .viber>span{background:rgba(170,114,227,.14);color:#d8b4ff}
            .moShareNative{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:62px;margin-top:9px;padding:9px 11px;border:1px solid rgba(186,255,158,.2);border-radius:17px;background:rgba(186,255,158,.075);color:#fff;text-align:left;cursor:pointer}
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
            .moShareHint{margin:10px 3px 0;color:rgba(255,255,255,.3);font-size:6px;line-height:1.5}
            .moShareNotice{position:sticky;bottom:0;margin-top:10px;padding:9px 11px;border:1px solid rgba(186,255,158,.15);border-radius:12px;background:#173b27;color:#d9ffca;font-size:7px;font-weight:850;text-align:center}
            @media(min-width:761px){.moShareOverlay{place-items:center}.moShareSheet{margin:12px}}
            @media(max-width:520px){.moShareSheet{width:calc(100% - 12px);margin:0 6px 6px;padding:14px;border-radius:25px}.moSharePreview{grid-template-columns:96px minmax(0,1fr)}.moSharePreviewImage{height:96px}.moShareGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.moShareGrid>button{min-height:100px}.moShareHeader h2{font-size:23px}}
            @media(prefers-reduced-motion:reduce){.moShareSheet,.moShareGrid>button{animation:none!important;transition:none!important}}
          `}</style>
        </div>
      )}
    </>
  );
}
