import type { Division } from "@/lib/constants/divisions";

// Pure authorization predicates, deliberately kept out of dal.ts (which is
// "server-only") so they can be unit-tested directly. These decide *policy*;
// the server actions in account-actions.ts are what enforce it.

type ActorLike = { id: string; role: string; division: Division | null };
type TargetLike = { id: string; role: string; division: Division | null };

// The oversight account: role ADMIN with no division, so it sees and manages
// every division. Division-scoped admins are ADMIN with a division set.
export function isOversightAdmin(user: { role: string; division: Division | null }): boolean {
  return user.role === "ADMIN" && user.division === null;
}

// Single source of truth for "may `actor` change `target`'s account?" — used by
// every account action so the rules can't drift between them.
//
//   oversight admin  -> any account but their own
//   division admin   -> only STAFF accounts inside their own division
//   staff            -> nobody
//
// The division-admin case deliberately excludes other ADMINs and other
// divisions: without that, a division admin could reset the oversight account's
// password (or another division's) and take over the deployment.
export function canManageAccount(actor: ActorLike, target: TargetLike): boolean {
  // Self-service goes through changeOwnPassword, which requires the current
  // password. Allowing it here would let an admin bypass that check.
  if (actor.id === target.id) return false;
  if (actor.role !== "ADMIN") return false;
  if (isOversightAdmin(actor)) return true;
  return target.role === "STAFF" && target.division === actor.division;
}

// Any ADMIN may create staff. The created account is always role STAFF, and a
// division admin's staff are always pinned to that admin's own division — both
// enforced in the action, since this only answers "may they at all?".
export function canCreateStaff(actor: { role: string }): boolean {
  return actor.role === "ADMIN";
}
