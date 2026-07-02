// Split out from session.ts so the proxy (Edge runtime) can read the cookie
// name without pulling in Prisma, which isn't supported on the Edge runtime.
export const SESSION_COOKIE_NAME = "dmw_admin_session";
