import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";
// Origem do storage de anexos: o browser faz o PUT/GET direto nele por URL assinada (E7.1).
const STORAGE_URL = process.env.STORAGE_URL ?? "http://localhost:9000";
const isDev = process.env.NODE_ENV === "development";

// ponytail: 'unsafe-inline' em script-src porque CSP com nonce deixaria toda página dinâmica;
// trocar por nonce no proxy.ts se aparecer conteúdo de terceiros.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self' ${STORAGE_URL}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Proxy same-origin do browser para a API: os cookies de sessão são HttpOnly +
  // SameSite=Lax, então o client precisa falar com a API sob a mesma origem da UI
  // (senão o browser recusa/perde os cookies no login).
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
