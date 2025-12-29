import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend) // Load translation files from server
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    ns: ["common", "layout", "knowledge", "entertainment", "dashboard"], // Namespaces
    defaultNS: "common", // Default namespace

    // Backend settings
    backend: {
      // Translation files path
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
