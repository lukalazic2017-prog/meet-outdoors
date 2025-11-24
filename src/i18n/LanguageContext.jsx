import React, { createContext, useContext, useState, useEffect } from "react";
import translations from "./translations";

// KREIRAMO KONTEKST
const LanguageContext = createContext();

// PROVIDER — ceo app će biti obmotan ovim
export function LanguageProvider({ children }) {
  // Uzimamo jezik iz localStorage ili eng kao default
  const [language, setLanguage] = useState(
    localStorage.getItem("appLanguage") || "en"
  );

  // Kada se promeni jezik → sačuvaj u localStorage
  useEffect(() => {
    localStorage.setItem("appLanguage", language);
  }, [language]);

  // Funkcija za prevod stringova
  const t = (key) => {
    if (!translations[language] || !translations[language][key]) {
      console.warn(`❗ Missing translation for key: "${key}"`);
      return key;
    }
    return translations[language][key];
  };

  // Provider vraća sve
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook da možeš lako da koristiš prevod
export function useLanguage() {
  return useContext(LanguageContext);
}