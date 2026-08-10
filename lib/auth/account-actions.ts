"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, canManageAccount, canCreateStaff } from "@/lib/auth/dal";
import { getDivisionBySlug } from "@/lib/constants/divisions";
import { hashPassword, verifyPassword } from "./password";
import { SESSION_COOKIE_NAME } from "./session-cookie";
import { validateNewPassword } from "./password-policy";

// `successCount` increments only on a successful submission. The client forms
// use it as a React `key` so the password inputs remount (and clear) after a
// success, while a failed attempt keeps whatever the user typed.
export type PasswordFormState = { error: string | null; success: string | null; successCount: number };

function failed(prevState: PasswordFormState, error: string): PasswordFormState {
  return { error, success: null, successCount: prevState.successCount };
}

function succeeded(prevState: PasswordFormState, success: string): PasswordFormState {
  return { error: null, success, successCount: prevState.successCount + 1 };
}

// Changing a password invalidates the old one everywhere, so any session that
// was established with it is cleared too. A stale LoginAttempt lockout on the
// username is cleared as well — it was counted against the old password.
async function revokeSessions(userId: string, exceptSessionId?: string) {
  await prisma.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
}

export async function changeOwnPassword(
  prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const user = await requireAdmin();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) {
    return failed(prevState, "Enter your current password.");
  }
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return failed(prevState, "Your current password is incorrect.");
  }
  if (newPassword === currentPassword) {
    return failed(prevState, "The new password must be different from your current one.");
  }

  const problem = validateNewPassword(newPassword, confirmPassword);
  if (problem) {
    return failed(prevState, problem);
  }

  const passwordHash = await hashPassword(newPassword);
  const store = await cookies();
  const currentSessionId = store.get(SESSION_COOKIE_NAME)?.value;

  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.auditLog.create({
    data: {
      action: "CHANGE_OWN_PASSWORD",
      performedByUsername: user.username,
      performedByName: user.name,
      details: { targetUsername: user.username },
    },
  });

  // This browser keeps its session; every other signed-in device is dropped.
  await revokeSessions(user.id, currentSessionId);
  await prisma.loginAttempt.deleteMany({ where: { username: user.username } });

  return succeeded(
    prevState,
    "Your password has been updated. Any other device signed in as you has been signed out.",
  );
}

export type ManagedAdmin = {
  id: string;
  username: string;
  name: string;
  divisionLabel: string;
  isActive: boolean;
  role: string;
};

// Reset another account's password without knowing their current one. The
// acting admin re-enters their OWN password to confirm, matching the reset-data
// flow. Who may target whom is decided by canManageAccount — oversight can reset
// anyone, a division admin only their own division's staff. Self-resets are
// refused; that's what changeOwnPassword is for.
export async function resetAdminPassword(
  prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const actor = await requireAdmin();

  const targetId = String(formData.get("targetId") ?? "");
  const actorPassword = String(formData.get("actorPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!targetId) {
    return failed(prevState, "Select the account to reset.");
  }
  if (targetId === actor.id) {
    return failed(prevState, "Use “Your password” above to change your own password.");
  }

  const target = await prisma.adminUser.findUnique({
    where: { id: targetId },
    select: { id: true, username: true, name: true, role: true, division: true },
  });
  if (!target) {
    return failed(prevState, "That account no longer exists.");
  }
  if (!canManageAccount(actor, target)) {
    return failed(prevState, "You don't have permission to reset that account.");
  }

  if (!actorPassword) {
    return failed(prevState, "Confirm this reset with your own password.");
  }
  if (!(await verifyPassword(actorPassword, actor.passwordHash))) {
    return failed(prevState, "Your own password is incorrect.");
  }

  const problem = validateNewPassword(newPassword, confirmPassword);
  if (problem) {
    return failed(prevState, problem);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.adminUser.update({ where: { id: target.id }, data: { passwordHash } });
  await prisma.auditLog.create({
    data: {
      action: "RESET_ADMIN_PASSWORD",
      performedByUsername: actor.username,
      performedByName: actor.name,
      details: { targetUsername: target.username, targetName: target.name },
    },
  });

  // The target must sign in again with the new password on every device.
  await revokeSessions(target.id);
  await prisma.loginAttempt.deleteMany({ where: { username: target.username } });

  revalidatePath("/admin/settings");

  return succeeded(
    prevState,
    `Password reset for ${target.username}. They have been signed out and must sign in with the new password.`,
  );
}

// Login lowercases and trims the submitted username, so stored usernames must be
// in that same normalised form or the account could never be signed into.
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

// Create a working account for someone else in the division, so staff don't have
// to share the division admin's credentials. Always role STAFF; a division
// admin's staff are pinned to that admin's own division (a division admin cannot
// create an ADMIN, nor place staff in another division).
export async function createStaffAccount(
  prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const actor = await requireAdmin();
  if (!canCreateStaff(actor)) {
    return failed(prevState, "Only administrators can add staff accounts.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const actorPassword = String(formData.get("actorPassword") ?? "");
  const requestedDivision = String(formData.get("division") ?? "");

  if (!name) {
    return failed(prevState, "Enter the staff member's full name.");
  }
  if (!USERNAME_PATTERN.test(username)) {
    return failed(
      prevState,
      "Username must be 3-32 characters, lowercase letters, numbers, dot, underscore or hyphen only.",
    );
  }

  // A division admin's own division always wins; only oversight may choose one.
  const division = actor.division ?? (requestedDivision ? getDivisionBySlug(requestedDivision)?.value : undefined);
  if (!division) {
    return failed(prevState, "Select which division this staff account belongs to.");
  }

  const problem = validateNewPassword(newPassword, confirmPassword);
  if (problem) {
    return failed(prevState, problem);
  }

  if (!actorPassword) {
    return failed(prevState, "Confirm this with your own password.");
  }
  if (!(await verifyPassword(actorPassword, actor.passwordHash))) {
    return failed(prevState, "Your own password is incorrect.");
  }

  if (await prisma.adminUser.findUnique({ where: { username }, select: { id: true } })) {
    return failed(prevState, `The username "${username}" is already taken.`);
  }

  const created = await prisma.adminUser.create({
    data: { username, name, passwordHash: await hashPassword(newPassword), role: "STAFF", division },
  });
  await prisma.auditLog.create({
    data: {
      action: "CREATE_STAFF_ACCOUNT",
      performedByUsername: actor.username,
      performedByName: actor.name,
      details: { targetUsername: created.username, targetName: created.name, division },
    },
  });

  revalidatePath("/admin/settings");

  return succeeded(
    prevState,
    `Staff account "${username}" created. Give them the password directly — it is not emailed, and it can't be shown again.`,
  );
}

// Deactivate (or restore) an account. Deactivating is the safe alternative to
// deletion: it keeps the audit trail intact while immediately cutting off
// access, since login rejects inactive users and their sessions are revoked.
export async function setAccountActive(
  prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const actor = await requireAdmin();

  const targetId = String(formData.get("targetId") ?? "");
  const makeActive = String(formData.get("isActive") ?? "") === "true";

  const target = await prisma.adminUser.findUnique({
    where: { id: targetId },
    select: { id: true, username: true, name: true, role: true, division: true, isActive: true },
  });
  if (!target) {
    return failed(prevState, "That account no longer exists.");
  }
  if (!canManageAccount(actor, target)) {
    return failed(prevState, "You don't have permission to change that account.");
  }
  if (target.isActive === makeActive) {
    return failed(prevState, `That account is already ${makeActive ? "active" : "deactivated"}.`);
  }

  await prisma.adminUser.update({ where: { id: target.id }, data: { isActive: makeActive } });
  await prisma.auditLog.create({
    data: {
      action: makeActive ? "REACTIVATE_ACCOUNT" : "DEACTIVATE_ACCOUNT",
      performedByUsername: actor.username,
      performedByName: actor.name,
      details: { targetUsername: target.username, targetName: target.name },
    },
  });

  // Cut off any session the deactivated account still has open.
  if (!makeActive) {
    await revokeSessions(target.id);
  }

  revalidatePath("/admin/settings");

  return succeeded(
    prevState,
    makeActive
      ? `${target.username} can sign in again.`
      : `${target.username} has been deactivated and signed out.`,
  );
}
