import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";
import { getDivisionBySlug, type Division } from "@/lib/constants/divisions";

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

type ScopedUser = { division: Division | null };

// "ALL" means an oversight admin (division = null on their AdminUser row) who
// sees/manages every division combined.
export function getDivisionScope(user: ScopedUser): Division | "ALL" {
  return user.division ?? "ALL";
}

// The division to filter admin data queries by. Scoped admins always get
// their own division regardless of what's requested (a `?division=` query
// param can't be used to view another division's data). Oversight admins can
// narrow to a requested division, or see everything when none is requested
// (undefined => no division filter in the caller's Prisma `where`).
export function resolveDivisionFilter(user: ScopedUser, requestedSlug?: string): Division | undefined {
  if (user.division) return user.division;
  if (!requestedSlug) return undefined;
  return getDivisionBySlug(requestedSlug)?.value;
}

// Whether the admin is allowed to view/act on the given division at all —
// used where a mismatch should be rejected outright (e.g. a scoped admin
// requesting another division's QR code) rather than silently ignored.
export function canAccessDivision(user: ScopedUser, division: Division): boolean {
  return user.division === null || user.division === division;
}
