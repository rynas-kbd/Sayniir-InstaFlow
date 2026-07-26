import type { NextConfig } from "next";

// Static security headers — the per-request CSP (nonce-based, Report-Only
// for now) is set in proxy.ts instead, since it needs a fresh nonce per
// request. See docs/SECURITY_AUDIT.md P2 for context: this app previously
// shipped no security headers at all, making it clickjackable via framing.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
