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
