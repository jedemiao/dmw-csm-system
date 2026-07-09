import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <SiteHeader variant="home" />

      <main id="main">
        <section className="hero">
          <div className="container hero__grid">
            <div>
              <span className="hero__eyebrow">Client Satisfaction Measurement &middot; ARTA-2242-3</span>
              <h1>Help us serve you better.</h1>
              <p className="hero__lead">
                After a DMW online transaction, share a quick rating so we can fix what isn&apos;t working and keep
                what is. It takes about two minutes.
              </p>
              <div className="hero__actions">
                <Link className="btn btn-primary" href="/survey">
                  Take the survey
                </Link>
                <a className="btn btn-secondary" href="#how-it-works">
                  See how it works
                </a>
              </div>
              <div className="hero__facts">
                <div className="hero__fact">
                  <strong>~2 min</strong>
                  <span>Time to complete</span>
                </div>
                <div className="hero__fact">
                  <strong>8</strong>
                  <span>Service quality questions</span>
                </div>
                <div className="hero__fact">
                  <strong>Confidential</strong>
                  <span>Used only to improve service</span>
                </div>
              </div>
            </div>

            <div className="hero__panel">
              <h2>The rating scale you&apos;ll use</h2>
              <ul className="hero__scale">
                <li>
                  <span className="emoji" aria-hidden="true">
                    😢
                  </span>
                  Strongly
                  <br />
                  Disagree
                </li>
                <li>
                  <span className="emoji" aria-hidden="true">
                    🙁
                  </span>
                  Disagree
                </li>
                <li>
                  <span className="emoji" aria-hidden="true">
                    😐
                  </span>
                  Neither
                </li>
                <li>
                  <span className="emoji" aria-hidden="true">
                    🙂
                  </span>
                  Agree
                </li>
                <li>
                  <span className="emoji" aria-hidden="true">
                    😀
                  </span>
                  Strongly
                  <br />
                  Agree
                </li>
                <li>
                  <span className="emoji" aria-hidden="true">
                    ➖
                  </span>
                  N/A
                </li>
              </ul>
              <p className="hero__panel-note">
                This is the official ARTA Client Satisfaction Measurement scale used across Philippine government
                offices. All eight questions use this same scale.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="container">
            <div className="section-head">
              <h2>How the survey works</h2>
              <p>Four short parts, in order. Nothing is saved until you submit at the end.</p>
            </div>
            <div className="steps">
              <div className="step">
                <span className="step__index">1</span>
                <h3>Tell us about your visit</h3>
                <p>Age, region, and the service you availed, so responses can be grouped correctly.</p>
              </div>
              <div className="step">
                <span className="step__index">2</span>
                <h3>Answer the Citizen&apos;s Charter questions</h3>
                <p>Three quick questions on whether you knew about and used our Citizen&apos;s Charter.</p>
              </div>
              <div className="step">
                <span className="step__index">3</span>
                <h3>Rate eight aspects of the service</h3>
                <p>Responsiveness, reliability, cost, and more, each on a five-point scale.</p>
              </div>
              <div className="step">
                <span className="step__index">4</span>
                <h3>Add remarks and submit</h3>
                <p>Optional, but if something stood out, good or bad, this is where to say it.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ background: "var(--surface)", borderBlock: "1px solid var(--border)" }}>
          <div className="container">
            <div className="section-head">
              <h2>Why we ask</h2>
              <p>This survey exists because of a specific law, not as a formality.</p>
            </div>
            <div className="card-grid">
              <div className="info-card">
                <span className="info-card__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3 4 6.5V11c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6.5L12 3Z" />
                    <path d="m9 12 2 2 4-4.5" />
                  </svg>
                </span>
                <h3>Required under RA 11032</h3>
                <p>
                  The Ease of Doing Business and Efficient Government Service Delivery Act requires every government
                  office to measure client satisfaction. The Anti-Red Tape Authority (ARTA) sets the questions.
                </p>
              </div>
              <div className="info-card">
                <span className="info-card__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <h3>Reported, not personal</h3>
                <p>
                  Your answers are grouped with other responses to score this office&apos;s service quality. They
                  are not attached to your application or used to identify you.
                </p>
              </div>
              <div className="info-card">
                <span className="info-card__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 10h8M8 14h5" />
                    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
                  </svg>
                </span>
                <h3>Remarks get read</h3>
                <p>The office named in your response reviews open-ended remarks as part of its regular service reporting.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="hero__panel" style={{ maxWidth: 720, marginInline: "auto", textAlign: "center" }}>
              <h2 style={{ marginBottom: "0.5rem" }}>Ready when you are</h2>
              <p style={{ color: "#c7d2ea", maxWidth: "48ch", marginInline: "auto" }}>
                The survey takes about two minutes. You can only submit it once you have completed all required
                questions.
              </p>
              <div className="hero__actions" style={{ justifyContent: "center", marginTop: "1.25rem", marginBottom: 0 }}>
                <Link className="btn btn-primary" href="/survey">
                  Take the survey
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter variant="home" />
    </>
  );
}
