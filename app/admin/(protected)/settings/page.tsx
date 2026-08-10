import { requireAdmin, isOversightAdmin } from "@/lib/auth/dal";
import { DIVISIONS, getDivisionLabel } from "@/lib/constants/divisions";
import { prisma } from "@/lib/db";
import type { ManagedAdmin } from "@/lib/auth/account-actions";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager";
import { AddStaffForm } from "@/components/admin/add-staff-form";
import { ResetDataForm } from "@/components/admin/reset-data-form";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const oversight = isOversightAdmin(user);
  const scopeText = user.division ? `in ${getDivisionLabel(user.division)}` : "across every division";

  const isAdmin = user.role === "ADMIN";

  // Mirrors canManageAccount() in dal.ts: oversight sees every other account, a
  // division admin sees only their own division's staff. Keep the two in sync —
  // listing a row the actions would refuse just produces a confusing error.
  // Either way the current user is excluded; their own password is handled by
  // the "Your password" form above.
  const accounts: ManagedAdmin[] = isAdmin
    ? (
        await prisma.adminUser.findMany({
          where: oversight
            ? { id: { not: user.id } }
            : { id: { not: user.id }, role: "STAFF", division: user.division },
          select: { id: true, username: true, name: true, division: true, isActive: true, role: true },
          orderBy: [{ division: "asc" }, { role: "asc" }, { username: "asc" }],
        })
      ).map((a) => ({
        id: a.id,
        username: a.username,
        name: a.name,
        divisionLabel: a.division ? getDivisionLabel(a.division) : "All divisions (oversight)",
        isActive: a.isActive,
        role: a.role,
      }))
    : [];

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Settings</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1.5rem", maxWidth: "60ch" }}>
        Account and deployment controls for {user.division ? getDivisionLabel(user.division) : "all divisions"}.
      </p>

      <section className="settings-section" aria-labelledby="own-password-heading">
        <div className="settings-section__head">
          <h2 id="own-password-heading">Your password</h2>
          <p>
            Signed in as <strong>{user.username}</strong>. You need your current password to set a new one.
          </p>
        </div>
        <div className="settings-section__body" style={{ maxWidth: "34rem" }}>
          <ChangePasswordForm />
        </div>
      </section>

      {isAdmin && (
        <section className="settings-section" aria-labelledby="accounts-heading">
          <div className="settings-section__head">
            <h2 id="accounts-heading">{oversight ? "Accounts" : "Division staff"}</h2>
            <p>
              {oversight
                ? "Add staff, reset any account's password without knowing their current one, and deactivate accounts. Every change is recorded in the audit log."
                : `Give colleagues in ${getDivisionLabel(user.division!)} their own sign-in instead of sharing yours. Staff can record responses and prepare reports, but cannot reset data or manage accounts. Every change is recorded in the audit log.`}
            </p>
          </div>
          <div className="settings-section__body">
            <div style={{ marginBottom: "1.5rem" }}>
              <AddStaffForm
                divisionLabel={user.division ? getDivisionLabel(user.division) : null}
                divisions={oversight ? DIVISIONS : undefined}
              />
            </div>
            <AdminAccountsManager accounts={accounts} />
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="settings-section" aria-labelledby="danger-heading">
          <div className="settings-section__head">
            <h2 id="danger-heading">Danger zone</h2>
            <p>
              Reset all data removes every survey response, generated report, and report download record {scopeText}.
              {user.division ? "" : " Submission-throttle records are also cleared."} Admin users and sign-in history
              are not affected.
            </p>
          </div>
          <div className="settings-section__body" style={{ maxWidth: "34rem" }}>
            <ResetDataForm />
          </div>
        </section>
      )}
    </div>
  );
}
