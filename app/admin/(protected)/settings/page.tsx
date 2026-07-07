import { requireAdminRole } from "@/lib/auth/dal";
import { ResetDataForm } from "@/components/admin/reset-data-form";

export default async function AdminSettingsPage() {
  await requireAdminRole();

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Settings</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1.5rem", maxWidth: "60ch" }}>
        Administrator-only controls for this deployment.
      </p>

      <div className="info-card" style={{ maxWidth: "34rem", border: "none", background: "var(--surface-alt)" }}>
        <h3>Danger zone</h3>
        <p>
          Reset all data removes every survey response, generated report, and report download record. Admin users and
          sign-in history are not affected.
        </p>
        <div style={{ marginTop: "1.25rem" }}>
          <ResetDataForm />
        </div>
      </div>
    </div>
  );
}
