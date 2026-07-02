import Image from "next/image";
import { ThemeToggle } from "@/lib/theme/theme-toggle";

export function AdminTopbar({ name, role }: { name: string; role: string }) {
  return (
    <div className="admin-topbar">
      <div className="admin-topbar__user">
        <Image
          className="admin-topbar__avatar"
          src="/images/dmw_logo.png"
          alt=""
          width={30}
          height={30}
        />
        <div>
          <span className="admin-topbar__name">{name}</span>
          <span className="admin-topbar__role">{role.toLowerCase()}</span>
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}
