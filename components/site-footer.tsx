import Image from "next/image";
import Link from "next/link";

export function SiteFooter({ variant }: { variant: "home" | "survey" }) {
  const howItWorksHref = variant === "home" ? "#how-it-works" : "/#how-it-works";

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <Image
            className="footer-logo"
            src="/images/republika_ng_pilipinas.png"
            alt="Coat of Arms of the Philippines"
            width={200}
            height={200}
          />
          <div className="footer-columns">
            <div id={variant === "home" ? "data-privacy" : undefined}>
              <h4>Republic of the Philippines</h4>
              <p>
                All content is in the public domain unless otherwise stated. This CSM survey is administered under
                RA 11032 and ARTA guidelines. Responses are used for service reporting only.
              </p>
            </div>
            <div>
              <h4>About GOVPH</h4>
              <ul>
                <li>
                  <a href="https://www.gov.ph" target="_blank" rel="noopener noreferrer">
                    GOVPH
                  </a>
                </li>
                <li>
                  <a href="https://www.officialgazette.gov.ph" target="_blank" rel="noopener noreferrer">
                    Official Gazette
                  </a>
                </li>
                <li>
                  <a href="https://arta.gov.ph" target="_blank" rel="noopener noreferrer">
                    Anti-Red Tape Authority
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4>This survey</h4>
              <ul>
                <li>
                  <Link href="/">Overview</Link>
                </li>
                <li>
                  <Link href="/survey">Take the survey</Link>
                </li>
                <li>
                  <a href={howItWorksHref}>How it works</a>
                </li>
              </ul>
            </div>
            <div id={variant === "home" ? "contact" : undefined}>
              <h4>Contact Us</h4>
              <p>
                Department of Migrant Workers
                <br />
                Blas F. Ople Building, Ortigas Ave., Cor. EDSA
                <br />
                Mandaluyong City, Philippines 1555
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Department of Migrant Workers (DMW)</p>
        <p>&copy; 2026 DMW. All rights reserved. CSM survey content per ARTA, PSA Approval No. ARTA-2242-3.</p>
      </div>
      <a className="back-to-top" href="#main" aria-label="Back to top">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </a>
    </footer>
  );
}
