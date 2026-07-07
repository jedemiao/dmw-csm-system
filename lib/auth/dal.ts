import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

// Gates destructive/administrative pages to the ADMIN role only (STAFF accounts
// are redirected away rather than shown a permission error).
export async function requireAdminRole() {
  const user = await requireAdmin();
  if (user.role !== "ADMIN") {
    redirect("/admin");
  }
  return user;
}
