"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, isOversightAdmin } from "@/lib/auth/dal";
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
};

// Oversight-only: reset another admin's password without knowing their current
// one. The acting admin re-enters their OWN password to confirm, matching the
// reset-data flow. Self-resets are refused so an oversight admin can't sign
// themselves out here — that's what changeOwnPassword is for.
export async function resetAdminPassword(
  prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const actor = await requireAdmin();
  if (!isOversightAdmin(actor)) {
    return failed(prevState, "Only the oversight administrator can reset other accounts.");
  }

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
    select: { id: true, username: true, name: true },
  });
  if (!target) {
    return failed(prevState, "That account no longer exists.");
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
