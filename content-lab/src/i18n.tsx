import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "./domain/content";

const STORAGE_KEY = "ceptlens-lab-locale";
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: "zh-CN",
  setLocale: () => undefined
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "zh-CN" || saved === "en-US" ? saved : "en-US";
  });

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function uiText(locale: Locale, zhCN: string, enUS: string): string {
  return locale === "en-US" ? enUS : zhCN;
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const next = locale === "en-US" ? "zh-CN" : "en-US";
  return (
    <button
      className="language-switcher"
      type="button"
      onClick={() => setLocale(next)}
      aria-label={locale === "en-US" ? "Switch to Chinese" : "切换到英文"}
      title={locale === "en-US" ? "切换到中文" : "Switch to English"}
    >
      {locale === "en-US" ? "中文" : "English"}
    </button>
  );
}
