import { cookies } from "next/headers";
import { REMEMBERED_USERNAME_COOKIE } from "@/lib/auth/remember-cookie";
import { LoginForm } from "./login-form";

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
