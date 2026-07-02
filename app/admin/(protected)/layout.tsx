import { requireAdmin } from "@/lib/auth/dal";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminSidebar name={user.name} email={user.email} />
      <div className="admin-main">
        <AdminTopbar name={user.name} role={user.role} />
        <main className="admin-main__content">{children}</main>
      </div>
    </div>
  );
}
