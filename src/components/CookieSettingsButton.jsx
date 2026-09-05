import React from "react";
import { openCookieSettings } from "./CookieConsent";

export default function CookieSettingsButton({
  className = "",
  children = "Cookie podešavanja",
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={openCookieSettings}
    >
      {children}
    </button>
  );
}
