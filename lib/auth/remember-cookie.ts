// "Keep me signed in" remembers the *username* only, so the login page can
// prefill it and keep the box ticked on the next visit. The password is never
// stored by the app — the browser's own password manager handles that via the
// autocomplete attributes on the login form.
export const REMEMBERED_USERNAME_COOKIE = "dmw_admin_remembered_user";

const REMEMBER_COOKIE_MAX_AGE_S = 180 * 24 * 60 * 60; // 180d

export function rememberedUsernameCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin/login",
    maxAge: REMEMBER_COOKIE_MAX_AGE_S,
  };
}
