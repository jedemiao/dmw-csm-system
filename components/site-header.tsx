import Image from "next/image";
import Link from "next/link";
import { LiveClock } from "./live-clock";
import { ThemeToggle } from "@/lib/theme/theme-toggle";

export function SiteHeader({ variant }: { variant: "home" | "survey" }) {
  const privacyHref = variant === "home" ? "#data-privacy" : "/#data-privacy";
  const contactHref = variant === "home" ? "#contact" : "/#contact";

  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="container utility-bar__inner">
          <nav className="utility-nav" aria-label="Government utility links">
            <a href="https://www.gov.ph" target="_blank" rel="noopener noreferrer">
              GOVPH
            </a>
            <Link href="/" aria-current={variant === "home" ? "page" : undefined}>
              Home
            </Link>
          </nav>
          <div className="utility-actions">
            <a href={privacyHref}>Data Privacy Notice</a>
            <a href={contactHref}>Contact Us</a>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="brand-bar">
        <div className="container brand-bar__inner">
          <div className="brand-bar__identity">
            <Image
              className="brand-bar__seal seal-badge"
              src="/images/dmw_logo.png"
              alt="Department of Migrant Workers seal"
              width={100}
              height={100}
            />
            <div className="brand-bar__text">
              <p className="brand-bar__eyebrow">Republic of the Philippines</p>
              <p className="brand-bar__name">Department of Migrant Workers</p>
              <p className="brand-bar__tagline">Kagawaran ng Manggagawang Pandarayuhan</p>
            </div>
          </div>
          <div className="brand-bar__meta">
            <div className="brand-bar__seals">
              <Image
                className="seal-badge"
                src="/images/transparency_seal.png"
                alt="Philippine Transparency Seal"
                width={60}
                height={60}
              />
              <Image
                className="seal-badge"
                src="/images/foi_logo.png"
                alt="Freedom of Information Philippines seal"
                width={60}
                height={60}
              />
            </div>
            <div className="brand-bar__status">
              <span className="home-label">Tahanan ng OFW</span>
              <LiveClock />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
