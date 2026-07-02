import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
  },
  outputFileTracingIncludes: {
    "/admin/reports/pdf": [
      "./public/images/report-ph-coat-of-arms.png",
      "./public/images/report-bagong-pilipinas-logo.png",
      "./public/fonts/tinos-regular.woff",
      "./public/fonts/tinos-bold.woff",
    ],
  },
};

export default nextConfig;
