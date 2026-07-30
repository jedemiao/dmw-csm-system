import { requireAdmin, isOversightAdmin } from "@/lib/auth/dal";
import { getDivisionLabel } from "@/lib/constants/divisions";
import { prisma } from "@/lib/db";
import type { ManagedAdmin } from "@/lib/auth/account-actions";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager";
import { ResetDataForm } from "@/components/admin/reset-data-form";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const oversight = isOversightAdmin(user);
  const scopeText = user.division ? `in ${getDivisionLabel(user.division)}` : "across every division";

  // Oversight manages the other accounts' credentials; its own password goes
  // through the "Your password" form, so it isn't listed here.
  const accounts: ManagedAdmin[] = oversight
    ? (
        await prisma.adminUser.findMany({
          where: { id: { not: user.id } },
          select: { id: true, username: true, name: true, division: true, isActive: true },
          orderBy: [{ division: "asc" }, { username: "asc" }],
        })
      ).map((a) => ({
        id: a.id,
        username: a.username,
        name: a.name,
        divisionLabel: a.division ? getDivisionLabel(a.division) : "All divisions (oversight)",
        isActive: a.isActive,
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

      {oversight && (
        <section className="settings-section" aria-labelledby="accounts-heading">
          <div className="settings-section__head">
            <h2 id="accounts-heading">Administrator accounts</h2>
            <p>
              As the oversight administrator you can set a new password for any division account without knowing
              their current one. Every reset is recorded in the audit log.
            </p>
          </div>
          <div className="settings-section__body">
            <AdminAccountsManager accounts={accounts} />
          </div>
        </section>
      )}

      {user.role === "ADMIN" && (
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
