import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@/lib/theme/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Satisfaction Measurement | Department of Migrant Workers",
  description:
    "Share feedback on your DMW online transaction through the official Client Satisfaction Measurement (CSM) survey.",
};

// Matches --navy-950 in globals.css (oklch(28.2% 0.091 267.935) -> srgb).
export const viewport: Viewport = {
  themeColor: "#162456",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-theme is set by the inline ThemeScript below before hydration, so
    // the attribute intentionally differs from the server-rendered markup.
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
