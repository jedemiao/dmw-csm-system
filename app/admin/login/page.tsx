import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", background: "var(--surface-alt)" }}>
      <div className="container">
        <LoginForm />
      </div>
    </main>
  );
}
