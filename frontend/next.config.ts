import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for a lean
  // Docker image — only traced dependencies are included.
  output: "standalone",

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
