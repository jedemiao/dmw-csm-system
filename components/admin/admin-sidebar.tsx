"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CaretDoubleLeft,
  ChartBar,
  FilePdf,
  Gauge,
  IconProps,
  ListBullets,
  SignOut,
} from "@phosphor-icons/react";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<IconProps>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", Icon: Gauge },
  { href: "/admin/responses", label: "Responses", Icon: ListBullets },
  { href: "/admin/analytics", label: "Analytics", Icon: ChartBar },
  { href: "/admin/reports", label: "Reports", Icon: FilePdf },
];

export function AdminSidebar({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <nav className={`admin-sidebar${open ? "" : " admin-sidebar--collapsed"}`} aria-label="Admin navigation">
      <div className="admin-sidebar__brand">
        <Image className="admin-sidebar__mark" src="/images/dmw_logo.png" alt="" width={36} height={36} />

        {open && (
          <div className="admin-sidebar__brand-text">
            <span className="admin-sidebar__brand-title">DMW CSM Admin</span>
            <span className="admin-sidebar__brand-sub">{name}</span>
          </div>
        )}
      </div>

      <div className="admin-sidebar__links">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`admin-sidebar__link${isActive ? " is-active" : ""}`}
              title={open ? undefined : label}
            >
              <Icon size={18} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
              {open && <span>{label}</span>}
            </Link>
          );
        })}
      </div>

      {open && (
        <div className="admin-sidebar__footer-note" title={email}>
          Signed in as {email}
        </div>
      )}

      <form action="/api/auth/logout" method="post" className="admin-sidebar__signout">
        <button type="submit" className="admin-sidebar__link" title={open ? undefined : "Sign out"}>
          <SignOut size={18} aria-hidden="true" />
          {open && <span>Sign out</span>}
        </button>
      </form>

      <button
        type="button"
        className="admin-sidebar__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <CaretDoubleLeft size={16} className={open ? "" : "admin-sidebar__toggle-icon--flipped"} aria-hidden="true" />
        {open && <span>Collapse</span>}
      </button>
    </nav>
  );
}
