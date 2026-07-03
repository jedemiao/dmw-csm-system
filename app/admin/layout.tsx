import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/admin-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/admin-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
