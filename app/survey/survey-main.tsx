"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/lang-context";
import type { DivisionMeta } from "@/lib/constants/divisions";
import { SurveyForm } from "./survey-form";

export function SurveyMain({ division }: { division: DivisionMeta }) {
  const { lang, setLang, t } = useLang();
  const [consented, setConsented] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function confirmConsent() {
    setConsented(true);
  }

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
        {consented ? (
          <SurveyForm division={division} />
        ) : (
          <div className="consent-card">
            <h2 id="consent-title">{t("consent_h2")}</h2>
            <p>{t("consent_instruction")}</p>
            <div className="consent-card__body">
              <p>{t("consent_body_p1")}</p>
              <p>{t("consent_body_p2")}</p>
            </div>
            <label className="consent-checkbox">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>{t("consent_checkbox_label")}</span>
            </label>
            <div className="consent-card__actions">
              <button type="button" className="btn btn-primary" onClick={confirmConsent} disabled={!agreed}>
                {t("consent_agree_btn")}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
