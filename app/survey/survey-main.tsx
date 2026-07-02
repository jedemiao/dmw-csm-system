"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/lang-context";
import { SurveyForm } from "./survey-form";

export function SurveyMain() {
  const { lang, setLang, t } = useLang();

  return (
    <main id="main">
      <div className="page-header">
        <div className="container">
          <div className="page-header__top">
            <p className="breadcrumb">
              <Link href="/">Home</Link> / <span>{t("breadcrumb_current")}</span>
            </p>
            <div className="lang-toggle" role="group" aria-label="Language / Wika">
              <button
                type="button"
                className={`lang-btn${lang === "en" ? " is-active" : ""}`}
                aria-pressed={lang === "en"}
                onClick={() => setLang("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn${lang === "tl" ? " is-active" : ""}`}
                aria-pressed={lang === "tl"}
                onClick={() => setLang("tl")}
              >
                TL
              </button>
            </div>
          </div>
          <span className="page-header__eyebrow">{t("page_eyebrow")}</span>
          <h1>{t("page_h1")}</h1>
          <p>{t("page_lead")}</p>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: "2.5rem" }}>
        <SurveyForm />
      </div>
    </main>
  );
}
