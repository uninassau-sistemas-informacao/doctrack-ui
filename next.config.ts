import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";

const nextConfig: NextConfig = {
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
