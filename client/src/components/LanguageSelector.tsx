import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import {
  GlobeAltIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export default function LanguageSelector({
  isCollapsed,
}: {
  isCollapsed: boolean;
}) {
  const { i18n, t } = useTranslation("layout");
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  ];

  const currentLanguage =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center ${
          isCollapsed ? "justify-center px-2" : "gap-3 px-4"
        } w-full py-3 text-skin-muted hover:bg-skin-text/5 hover:text-skin-text rounded-xl transition-all duration-200 group`}
        title={isCollapsed ? t("languageSelection.language") : ""}
      >
        <GlobeAltIcon className="w-6 h-6 shrink-0 group-hover:text-skin-primary transition-colors" />
        {!isCollapsed && (
          <div className="flex flex-col items-start">
            <span className="font-medium whitespace-nowrap text-sm">
              {t("languageSelection.language")}
            </span>
            <span className="text-xs text-skin-muted group-hover:text-skin-text">
              {currentLanguage.name}
            </span>
          </div>
        )}
      </button>

      {/* MODAL */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-skin-surface border border-skin-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-skin-border/20">
                <h3 className="text-lg font-bold text-skin-text flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5 text-skin-primary" />
                  {t("languageSelection.select_language")}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-skin-muted hover:text-skin-text hover:bg-skin-text/5 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-2 space-y-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      i18n.language === lang.code
                        ? "bg-skin-primary/10 border border-skin-primary/50 text-skin-primary"
                        : "hover:bg-skin-text/5 text-skin-muted hover:text-skin-text border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </div>
                    {i18n.language === lang.code && (
                      <CheckIcon className="w-5 h-5 text-skin-primary" />
                    )}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 bg-skin-base/50 text-center">
                <p className="text-xs text-skin-muted">
                  {t("languageSelection.language_hint")}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
