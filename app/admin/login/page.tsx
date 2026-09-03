import { cookies } from "next/headers";
import { REMEMBERED_USERNAME_COOKIE } from "@/lib/auth/remember-cookie";
import { LoginForm } from "./login-form";

// Deliberately does not redirect an already-signed-in admin to /admin. Any
// server-side redirect here is applied to the login Server Action's response
// as a client-side navigation, which robs the browser's password manager of
// the full page load it needs before it will offer to save the password
// (see login-form.tsx). Sign-in therefore requires JS — as does every other
// admin screen.
export default async function AdminLoginPage() {
  const rememberedUsername = (await cookies()).get(REMEMBERED_USERNAME_COOKIE)?.value;

  return (
    <main className="admin-login-bg">
      <div className="container">
        <LoginForm rememberedUsername={rememberedUsername} />
      </div>
    </main>
  );
}
