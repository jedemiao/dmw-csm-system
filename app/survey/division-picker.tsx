"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/lang-context";
import { DIVISIONS } from "@/lib/constants/divisions";

const DIVISION_LABEL_KEYS: Record<string, string> = {
  fad: "division_fad",
  mwptd: "division_mwptd",
  mwpsd: "division_mwpsd",
  wrsd: "division_wrsd",
};

export function DivisionPicker() {
  const { lang, setLang, t } = useLang();

  return (
    <main id="main">
      <div className="page-header">
        <div className="container">
          <div className="page-header__top">
            <p className="breadcrumb">
              <Link href="/">Home</Link> / <span>{t("picker_breadcrumb")}</span>
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
          <span className="page-header__eyebrow">{t("picker_eyebrow")}</span>
          <h1>{t("picker_h1")}</h1>
          <p>{t("picker_lead")}</p>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: "2.5rem" }}>
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {DIVISIONS.map((division) => (
            <Link key={division.slug} href={`/survey/${division.slug}`} className="info-card info-card--link">
              <h3>{t(DIVISION_LABEL_KEYS[division.slug])}</h3>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
