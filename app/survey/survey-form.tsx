"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/i18n/lang-context";
import { REGIONS, DEFAULT_AGENCY, SQD_ITEMS, SCALE_OPTIONS } from "@/lib/constants/survey-options";
import {
  SERVICES_BY_DIVISION,
  isGroupedCatalog,
  isTabbedCatalog,
  tabHasCatalog,
  type DivisionMeta,
} from "@/lib/constants/divisions";
import { toReferenceCode } from "@/lib/reference";
import { submitSurvey } from "./actions";

type Values = {
  age: string;
  sex: string;
  region: string;
  serviceType: string;
  serviceCategory: string;
  services: string[];
  customerType: string;
  cc1: string;
  cc2: string;
  cc3: string;
  cc3Reason: string;
  remarks: string;
  email: string;
} & Record<`sqd${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_VALUES: Values = {
  age: "",
  sex: "",
  region: "",
  serviceType: "",
  serviceCategory: "",
  services: [],
  customerType: "",
  cc1: "",
  cc2: "",
  cc3: "",
  cc3Reason: "",
  sqd0: "",
  sqd1: "",
  sqd2: "",
  sqd3: "",
  sqd4: "",
  sqd5: "",
  sqd6: "",
  sqd7: "",
  sqd8: "",
  remarks: "",
  email: "",
};

export function SurveyForm({ division }: { division: DivisionMeta }) {
  const { t } = useLang();
  const catalog = SERVICES_BY_DIVISION[division.value];
  const tabbed = isTabbedCatalog(catalog);
  const [values, setValues] = useState<Values>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invalidItems, setInvalidItems] = useState<Array<{ id: string; label: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const showCc3Reason = values.cc3 === "2";
  const selectedTab = tabbed ? catalog.find((tab) => tab.type === values.serviceType) : undefined;
  // A tab with no sub-catalog is terminal — picking it IS the service, nothing more to ask.
  const hasSubCatalog = tabbed ? Boolean(selectedTab && tabHasCatalog(selectedTab)) : true;
  const activeTabCatalog = tabbed ? (selectedTab?.catalog ?? []) : catalog;
  const grouped = isGroupedCatalog(activeTabCatalog);
  const serviceOptions = grouped
    ? (activeTabCatalog.find((group) => group.category === values.serviceCategory)?.services ?? [])
    : activeTabCatalog;

  function set<K extends keyof Omit<Values, "services">>(key: K, value: string) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "cc3" && value !== "2") {
        next.cc3Reason = "";
      }
      return next;
    });
  }

  function setServiceType(value: string) {
    const tab = tabbed ? catalog.find((t) => t.type === value) : undefined;
    const isTerminal = value !== "" && tab !== undefined && !tabHasCatalog(tab);
    setValues((prev) => ({
      ...prev,
      serviceType: value,
      serviceCategory: "",
      services: isTerminal ? [value] : [],
    }));
  }

  function setServiceCategory(value: string) {
    setValues((prev) => ({ ...prev, serviceCategory: value, services: [] }));
  }

  function setSingleService(value: string) {
    setValues((prev) => ({ ...prev, services: value ? [value] : [] }));
  }

  function toggleService(service: string, checked: boolean) {
    setValues((prev) => ({
      ...prev,
      services: checked ? [...prev.services, service] : prev.services.filter((s) => s !== service),
    }));
  }

  function focusField(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.scrollIntoView({ block: "center", behavior: "auto" });
    const focusable = container.querySelector<HTMLElement>("input, select, textarea");
    focusable?.focus();
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    const items: Array<{ id: string; label: string }> = [];

    function check(id: string, ok: boolean, message: string, label: string) {
      if (!ok) {
        nextErrors[id] = message;
        items.push({ id, label });
      }
    }

    const ageNum = Number(values.age);
    check("field-age", values.age.trim() !== "" && ageNum > 0 && ageNum < 120, t("msg_age"), t("lbl_age"));
    check("field-sex", values.sex !== "", t("msg_select_option"), t("lbl_sex"));
    check("field-region", values.region !== "", t("msg_region"), t("lbl_region"));
    if (tabbed) {
      check("field-service-type", values.serviceType !== "", t("msg_service_category"), t("lbl_service_category"));
    }
    if (grouped) {
      check(
        "field-service-category",
        values.serviceCategory !== "",
        tabbed ? t("msg_service_subcategory") : t("msg_service_category"),
        tabbed ? t("lbl_service_subcategory") : t("lbl_service_category"),
      );
    }
    check("field-service", values.services.length > 0, t("msg_service"), t("lbl_service"));
    check("field-customer-type", values.customerType !== "", t("msg_customer_type"), t("lbl_customer_type"));
    check("field-cc1", values.cc1 !== "", t("msg_cc1"), t("lbl_cc1"));

    check("field-cc2", values.cc2 !== "", t("msg_cc2"), t("lbl_cc2"));
    check("field-cc3", values.cc3 !== "", t("msg_cc3"), t("lbl_cc3"));
    if (showCc3Reason) check("field-cc3-reason", values.cc3Reason.trim() !== "", t("msg_cc3_reason"), t("lbl_cc3_reason"));

    SQD_ITEMS.forEach((item) => {
      check(`field-${item.name}`, values[item.name as keyof Values] !== "", t("msg_sqd"), item.name.toUpperCase());
    });

    const emailTrimmed = values.email.trim();
    check("field-email", emailTrimmed === "" || EMAIL_PATTERN.test(emailTrimmed), t("msg_email"), t("lbl_email"));

    setErrors(nextErrors);
    setInvalidItems(items);

    if (items.length > 0) {
      focusField(items[0].id);
      return false;
    }
    return true;
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    setSubmitError(false);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await submitSurvey({
        age: values.age,
        sex: values.sex,
        region: values.region,
        agency: DEFAULT_AGENCY,
        division: division.slug,
        services: values.services,
        customerType: values.customerType,
        cc1: values.cc1,
        cc2: values.cc2,
        cc3: values.cc3,
        cc3Reason: showCc3Reason ? values.cc3Reason : undefined,
        sqd0: values.sqd0,
        sqd1: values.sqd1,
        sqd2: values.sqd2,
        sqd3: values.sqd3,
        sqd4: values.sqd4,
        sqd5: values.sqd5,
        sqd6: values.sqd6,
        sqd7: values.sqd7,
        sqd8: values.sqd8,
        remarks: values.remarks || undefined,
        email: values.email.trim() || undefined,
      });
      setReference(toReferenceCode(response.id));
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div className="form-shell confirm">
        <span className="confirm__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 tabIndex={-1} ref={(el) => el?.focus()}>
          {t("confirm_h2")}
        </h2>
        <p>{t("confirm_p")}</p>
        <p className="confirm__ref">
          {t("confirm_ref_prefix")}
          {reference}
        </p>
        <div className="confirm__actions">
          <Link className="btn btn-secondary" href="/">
            {t("btn_back_home")}
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            {t("btn_submit_another")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-shell">
      <div className="form-doc-head">
        <div className="form-doc-head__identity">
          <Image
            className="crest-badge"
            src="/images/dmw_logo.png"
            alt="Department of Migrant Workers seal"
            height={60}
            width={60}
            quality={100}
          />
          <div>
            <h2>Department of Migrant Workers</h2>
            <p>{t("doc_tagline")}</p>
          </div>
        </div>
        <div className="form-doc-head__code">
          Anti-Red Tape Authority
          <br />
          Client Satisfaction Measurement Form
          <br />
          PSA Approval No.: ARTA-2242-3
        </div>
      </div>

      <p className="form-intro">{t("form_intro")}</p>

      <div className="alert alert-error" role="alert" hidden={invalidItems.length === 0}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
        <div>
          <p className="alert-summary">
            <span>{invalidItems.length}</span> <span>{t("alert_rest")}</span>
          </p>
          <ul className="alert-list">
            {invalidItems.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => focusField(item.id)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {submitError && (
        <div className="alert alert-error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <p className="alert-summary">{t("msg_submit_failed")}</p>
        </div>
      )}

      <form id="csm-form" noValidate onSubmit={handleSubmit}>
        <section className="form-section">
          <h3>{t("s1_h3")}</h3>
          <p className="form-section__hint">{t("s1_hint")}</p>

          <div className="field-grid">
            <div className={`field${errors["field-age"] ? " has-error" : ""}`} id="field-age">
              <label htmlFor="age">{t("lbl_age")}</label>
              <input
                type="number"
                id="age"
                min={1}
                max={119}
                inputMode="numeric"
                required
                aria-describedby="age-error"
                value={values.age}
                onChange={(e) => set("age", e.target.value)}
              />
              <span className="field-error" id="age-error" role="alert">
                {errors["field-age"]}
              </span>
            </div>
            <div className={`field${errors["field-sex"] ? " has-error" : ""}`} id="field-sex">
              <label htmlFor="sex">{t("lbl_sex")}</label>
              <select id="sex" required aria-describedby="sex-error" value={values.sex} onChange={(e) => set("sex", e.target.value)}>
                <option value="">{t("opt_select")}</option>
                <option value="female">{t("opt_female")}</option>
                <option value="male">{t("opt_male")}</option>
                <option value="non-binary">{t("opt_non_binary")}</option>
                <option value="did-not-specify">{t("opt_did_not_specify")}</option>
              </select>
              <span className="field-error" id="sex-error" role="alert">
                {errors["field-sex"]}
              </span>
            </div>
            <div className={`field${errors["field-region"] ? " has-error" : ""}`} id="field-region">
              <label htmlFor="region">{t("lbl_region")}</label>
              <select
                id="region"
                required
                aria-describedby="region-error"
                value={values.region}
                onChange={(e) => set("region", e.target.value)}
              >
                <option value="">{t("opt_select")}</option>
                {REGIONS.map((region) =>
                  region === "Outside the Philippines" ? (
                    <option key={region} value={region}>
                      {t("opt_outside_ph")}
                    </option>
                  ) : (
                    <option key={region}>{region}</option>
                  ),
                )}
              </select>
              <span className="field-error" id="region-error" role="alert">
                {errors["field-region"]}
              </span>
            </div>
          </div>

          <div className="field-grid" style={{ marginTop: "1.25rem" }}>
            <div className="field" id="field-agency">
              <label htmlFor="agency">{t("lbl_agency")}</label>
              <input type="text" id="agency" value={DEFAULT_AGENCY} readOnly />
            </div>
            <div className="field" id="field-division">
              <label htmlFor="division">{t("lbl_division")}</label>
              <input type="text" id="division" value={division.label} readOnly />
            </div>
            {tabbed ? (
              <div className={`field${errors["field-service-type"] ? " has-error" : ""}`} id="field-service-type">
                <label htmlFor="serviceType">{t("lbl_service_category")}</label>
                <select
                  id="serviceType"
                  required
                  aria-describedby="serviceType-error"
                  value={values.serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  <option value="">{t("opt_select")}</option>
                  {catalog.map((tab) => (
                    <option key={tab.type}>{tab.type}</option>
                  ))}
                </select>
                <span className="field-error" id="serviceType-error" role="alert">
                  {errors["field-service-type"]}
                </span>
              </div>
            ) : grouped ? (
              <div className={`field${errors["field-service-category"] ? " has-error" : ""}`} id="field-service-category">
                <label htmlFor="serviceCategory">{t("lbl_service_category")}</label>
                <select
                  id="serviceCategory"
                  required
                  aria-describedby="serviceCategory-error"
                  value={values.serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                >
                  <option value="">{t("opt_select")}</option>
                  {activeTabCatalog.map((group) => (
                    <option key={group.category}>{group.category}</option>
                  ))}
                </select>
                <span className="field-error" id="serviceCategory-error" role="alert">
                  {errors["field-service-category"]}
                </span>
              </div>
            ) : (
              <div className={`field${errors["field-service"] ? " has-error" : ""}`} id="field-service">
                <label htmlFor="service">{t("lbl_service")}</label>
                <select
                  id="service"
                  required
                  aria-describedby="service-error"
                  value={values.services[0] ?? ""}
                  onChange={(e) => setSingleService(e.target.value)}
                >
                  <option value="">{t("opt_select")}</option>
                  {serviceOptions.map((service) => (
                    <option key={service}>{service}</option>
                  ))}
                </select>
                <span className="field-error" id="service-error" role="alert">
                  {errors["field-service"]}
                </span>
              </div>
            )}
          </div>

          {tabbed && values.serviceType !== "" && grouped && (
            <div
              className={`field${errors["field-service-category"] ? " has-error" : ""}`}
              style={{ marginTop: "1.25rem" }}
              id="field-service-category"
            >
              <label htmlFor="serviceCategory">{t("lbl_service_subcategory")}</label>
              <select
                id="serviceCategory"
                required
                aria-describedby="serviceCategory-error"
                value={values.serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
              >
                <option value="">{t("opt_select")}</option>
                {activeTabCatalog.map((group) => (
                  <option key={group.category}>{group.category}</option>
                ))}
              </select>
              <span className="field-error" id="serviceCategory-error" role="alert">
                {errors["field-service-category"]}
              </span>
            </div>
          )}

          {tabbed && hasSubCatalog && !grouped && (
            <div
              className={`field${errors["field-service"] ? " has-error" : ""}`}
              style={{ marginTop: "1.25rem" }}
              id="field-service"
            >
              <label htmlFor="service">{t("lbl_service")}</label>
              <select
                id="service"
                required
                aria-describedby="service-error"
                value={values.services[0] ?? ""}
                onChange={(e) => setSingleService(e.target.value)}
              >
                <option value="">{t("opt_select")}</option>
                {serviceOptions.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>
              <span className="field-error" id="service-error" role="alert">
                {errors["field-service"]}
              </span>
            </div>
          )}

          {grouped && values.serviceCategory !== "" && (
            <fieldset
              style={{ marginTop: "1.25rem" }}
              id="field-service"
              className={errors["field-service"] ? "has-error" : ""}
            >
              <legend>{t("lbl_service")}</legend>
              <div className="radio-row">
                {serviceOptions.map((service) => (
                  <label className="radio-option" key={service}>
                    <input
                      type="checkbox"
                      checked={values.services.includes(service)}
                      onChange={(e) => toggleService(service, e.target.checked)}
                    />{" "}
                    <span>{service}</span>
                  </label>
                ))}
              </div>
              <span className="field-error" role="alert">
                {errors["field-service"]}
              </span>
            </fieldset>
          )}

          <fieldset
            style={{ marginTop: "1.25rem" }}
            id="field-customer-type"
            className={errors["field-customer-type"] ? "has-error" : ""}
          >
            <legend>{t("lbl_customer_type")}</legend>
            <div className="radio-row" style={{ flexDirection: "row", flexWrap: "wrap", gap: "1.5rem" }}>
              <label className="radio-option">
                <input
                  type="radio"
                  name="customerType"
                  value="citizen"
                  checked={values.customerType === "citizen"}
                  onChange={(e) => set("customerType", e.target.value)}
                />{" "}
                <span>{t("opt_citizen")}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="customerType"
                  value="business"
                  checked={values.customerType === "business"}
                  onChange={(e) => set("customerType", e.target.value)}
                />{" "}
                <span>{t("opt_business")}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="customerType"
                  value="government"
                  checked={values.customerType === "government"}
                  onChange={(e) => set("customerType", e.target.value)}
                />{" "}
                <span>{t("opt_government")}</span>
              </label>
            </div>
            <span className="field-error" role="alert">
              {errors["field-customer-type"]}
            </span>
          </fieldset>
        </section>

        <section className="form-section">
          <h3>{t("s2_h3")}</h3>
          <p className="form-section__hint">{t("s2_hint")}</p>

          <fieldset id="field-cc1" className={errors["field-cc1"] ? "has-error" : ""}>
            <legend>{t("cc1_legend")}</legend>
            <div className="radio-row">
              <label className="radio-option">
                <input type="radio" name="cc1" value="1" checked={values.cc1 === "1"} onChange={(e) => set("cc1", e.target.value)} />{" "}
                <span>{t("cc1_opt1")}</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="cc1" value="2" checked={values.cc1 === "2"} onChange={(e) => set("cc1", e.target.value)} />{" "}
                <span>{t("cc1_opt2")}</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="cc1" value="3" checked={values.cc1 === "3"} onChange={(e) => set("cc1", e.target.value)} />{" "}
                <span>{t("cc1_opt3")}</span>
              </label>
            </div>
            <span className="field-error" role="alert">
              {errors["field-cc1"]}
            </span>
          </fieldset>

          <fieldset id="field-cc2" className={errors["field-cc2"] ? "has-error" : ""}>
            <legend>{t("cc2_legend")}</legend>
            <div className="radio-row">
              <label className="radio-option">
                <input type="radio" name="cc2" value="1" checked={values.cc2 === "1"} onChange={(e) => set("cc2", e.target.value)} />{" "}
                <span>{t("cc2_opt1")}</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="cc2" value="2" checked={values.cc2 === "2"} onChange={(e) => set("cc2", e.target.value)} />{" "}
                <span>{t("cc2_opt2")}</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="cc2" value="3" checked={values.cc2 === "3"} onChange={(e) => set("cc2", e.target.value)} />{" "}
                <span>{t("cc2_opt3")}</span>
              </label>
            </div>
            <span className="field-error" role="alert">
              {errors["field-cc2"]}
            </span>
          </fieldset>

          <fieldset id="field-cc3" className={errors["field-cc3"] ? "has-error" : ""}>
            <legend>{t("cc3_legend")}</legend>
            <div className="radio-row">
              <label className="radio-option">
                <input type="radio" name="cc3" value="1" checked={values.cc3 === "1"} onChange={(e) => set("cc3", e.target.value)} />{" "}
                <span>{t("cc3_opt1")}</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="cc3" value="2" checked={values.cc3 === "2"} onChange={(e) => set("cc3", e.target.value)} />{" "}
                <span>{t("cc3_opt2")}</span>
              </label>
            </div>
            <span className="field-error" role="alert">
              {errors["field-cc3"]}
            </span>
          </fieldset>

          <div className="conditional-block" id="cc3-reason-block" hidden={!showCc3Reason}>
            <div className={`field${errors["field-cc3-reason"] ? " has-error" : ""}`} id="field-cc3-reason">
              <label htmlFor="cc3Reason">{t("lbl_why_not")}</label>
              <input
                type="text"
                id="cc3Reason"
                aria-describedby="cc3Reason-error"
                value={values.cc3Reason}
                onChange={(e) => set("cc3Reason", e.target.value)}
              />
              <span className="field-error" id="cc3Reason-error" role="alert">
                {errors["field-cc3-reason"]}
              </span>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>{t("s3_h3")}</h3>
          <p className="form-section__hint">{t("s3_hint")}</p>

          <div className="likert">
            <div className="likert-head" aria-hidden="true">
              <span>&nbsp;</span>
              {SCALE_OPTIONS.map((opt) => (
                <span key={opt.value}>
                  <span className="emoji">{opt.emoji}</span>
                  <span>{t(opt.scaleKey)}</span>
                </span>
              ))}
            </div>

            {SQD_ITEMS.map((item) => {
              const options = item.allowsNA
                ? SCALE_OPTIONS
                : SCALE_OPTIONS.filter((opt) => opt.value !== "NA");

              return (
                <fieldset
                  key={item.name}
                  className={`likert-row${errors[`field-${item.name}`] ? " has-error" : ""}`}
                  id={`field-${item.name}`}
                  aria-labelledby={`${item.name}-label`}
                >
                  <div className="likert-question" id={`${item.name}-label`}>
                    <span>{t(item.qKey)}</span>
                    <span className="dimension">{t(item.dimKey)}</span>
                  </div>
                  <div className="likert-scale-mobile" aria-hidden="true">
                    {options.map((opt) => (
                      <span key={opt.value}>
                        <span className="emoji">{opt.emoji}</span>
                        <span>{t(opt.scaleKey)}</span>
                      </span>
                    ))}
                  </div>
                  {options.map((opt) => (
                    <label className="likert-cell" key={opt.value}>
                      <span className="visually-hidden">{t(opt.vhKey)}</span>
                      <input
                        type="radio"
                        name={item.name}
                        value={opt.value}
                        checked={values[item.name as keyof Values] === opt.value}
                        onChange={(e) => set(item.name as keyof Omit<Values, "services">, e.target.value)}
                      />
                    </label>
                  ))}
                  <span className="field-error" role="alert">
                    {errors[`field-${item.name}`]}
                  </span>
                </fieldset>
              );
            })}
          </div>
        </section>

        <section className="form-section">
          <h3>
            <span>{t("s4_h3")}</span> <span className="optional">{t("lbl_optional")}</span>
          </h3>
          <div className="field">
            <label htmlFor="remarks">{t("lbl_remarks")}</label>
            <textarea
              id="remarks"
              placeholder={t("placeholder_remarks")}
              value={values.remarks}
              onChange={(e) => set("remarks", e.target.value)}
            />
          </div>
          <div className={`field${errors["field-email"] ? " has-error" : ""}`} id="field-email" style={{ marginTop: "1.25rem" }}>
            <label htmlFor="email">
              {t("lbl_email")} <span className="optional">{t("lbl_optional")}</span>
            </label>
            <input
              type="email"
              id="email"
              placeholder={t("placeholder_email")}
              aria-describedby="email-error"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <span className="field-error" id="email-error" role="alert">
              {errors["field-email"]}
            </span>
          </div>
        </section>

        <div className="form-actions">
          <p>{t("actions_note")}</p>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? t("btn_submitting") : t("btn_submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
