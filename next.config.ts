import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
  },
  outputFileTracingIncludes: {
    "/admin/reports/pdf": ["./public/images/header-report.png"],
  },
  // `next dev` only trusts `localhost` by default and silently blocks cross-origin
  // requests to its dev assets (HMR socket, JS chunks) from anywhere else — which is
  // exactly how a phone reaches this server (via the LAN IP), and breaks all client-side
  // interactivity with no visible error on the page itself. Dev-only; irrelevant once deployed.
  allowedDevOrigins: ["192.168.100.77"],
};

export default nextConfig;
