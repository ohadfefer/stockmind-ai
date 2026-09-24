import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for a lean
  // Docker image — only traced dependencies are included.
  output: "standalone",

  // Keep each visited page in the browser's client cache for 30s, so clicking
  // back to a page seen moments ago (dashboard → portfolio → dashboard)
  // renders from memory instead of repeating the server round trip. Every
  // (main) page is dynamic, and Next 15 dropped this default from 30s to 0.
  // The cost is staleness after a write: a mutation must call
  // router.refresh(), which expires every saved page, or a return visit shows
  // the data from before it.
  experimental: {
    staleTimes: { dynamic: 30 },
  },

  // Baseline security headers. Applied by the Next server at runtime (works
  // with standalone output). HSTS only takes effect once served over HTTPS
  // behind the ALB/ACM cert; it is harmlessly ignored on http://localhost.
  // A Content-Security-Policy is intentionally omitted here — add it
  // separately in Report-Only first, then enforce, to avoid breaking inline
  // scripts/styles.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
