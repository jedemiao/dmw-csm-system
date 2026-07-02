"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Lang, translate } from "./translations";

const LANG_KEY = "dmw-csm-lang";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    // Reads localStorage post-mount so SSR/client markup match; the
    // resulting one-time setState is unavoidable for this hydration pattern.
    try {
      const stored = localStorage.getItem(LANG_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "tl") setLangState("tl");
    } catch {
      // storage unavailable
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // storage unavailable
    }
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: (key: string) => translate(lang, key) }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within a LangProvider");
  return ctx;
}
