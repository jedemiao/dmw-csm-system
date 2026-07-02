import Image from "next/image";
import { ThemeToggle } from "@/lib/theme/theme-toggle";
import { NotificationBell } from "@/components/admin/notification-bell";

export function AdminTopbar({ name }: { name: string }) {
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
          <span className="admin-topbar__role">Department of Migrant Workers Region XIII</span>
        </div>
      </div>
      <NotificationBell />
      <ThemeToggle />
    </div>
  );
}
