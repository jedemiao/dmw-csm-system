import Image from "next/image";
import { ThemeToggle } from "@/lib/theme/theme-toggle";
import { NotificationBell } from "@/components/admin/notification-bell";
import { getDivisionLabel, type Division } from "@/lib/constants/divisions";

export function AdminTopbar({ name, division }: { name: string; division: Division | null }) {
  const scopeText = division ? getDivisionLabel(division) : "All divisions — Regional Office XIII";

  return (
    <div className="admin-topbar">
      <div className="admin-topbar__user">
        <Image
          className="admin-topbar__avatar"
          src="/images/dmw_logo.png"
          alt=""
          width={38}
          height={38}
          quality={100}
        />
        <div>
          <span className="admin-topbar__name">{name}</span>
          <span className="admin-topbar__role">{scopeText}</span>
        </div>
      </div>
      <NotificationBell />
      <ThemeToggle />
    </div>
  );
}
