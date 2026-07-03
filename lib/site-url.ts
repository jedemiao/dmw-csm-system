import { headers } from "next/headers";

// Matches localhost and RFC 1918 private LAN ranges (192.168.x.x, 10.x.x.x,
// 172.16-31.x.x) — hosts the dev server only ever serves over plain HTTP.
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

// No production domain is chosen yet (see deployment notes), so the origin
// is derived from the incoming request rather than a hardcoded env var —
// this keeps working unchanged whenever the app lands on its eventual host.
export async function getSiteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (LOCAL_HOST_PATTERN.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
