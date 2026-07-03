import { NextResponse } from "next/server";
import type { MetadataRoute } from "next";

// Next's file-convention manifest.ts only auto-generates a route (and
// auto-links it) at the app root, applying it site-wide — wrong here, since
// only /admin should be installable, not the public /survey form. A manual
// route handler keeps this scoped under /admin (and thus behind proxy.ts's
// auth gate) instead of leaking to the whole site.
export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: "/admin",
    name: "DMW CSM Admin Dashboard",
    short_name: "CSM Admin",
    description: "Internal reporting dashboard for the DMW Client Satisfaction Measurement survey.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#f4f5f8",
    theme_color: "#162456",
    lang: "en",
    icons: [
      { src: "/icons/admin-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/admin-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/admin-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
