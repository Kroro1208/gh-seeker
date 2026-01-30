import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // セキュリティヘッダーの設定
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // X-Content-Type-Options: MIMEタイプスニッフィングを防ぐ
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // X-Frame-Options: クリックジャッキング攻撃を防ぐ
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // X-XSS-Protection: XSS攻撃を防ぐ（古いブラウザ向け）
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // Referrer-Policy: リファラー情報の制御
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Permissions-Policy: ブラウザ機能の制限
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Content-Security-Policy: XSS攻撃やデータインジェクション攻撃を防ぐ
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.jsで必要
              "style-src 'self' 'unsafe-inline'", // Tailwind CSSで必要
              "img-src 'self' data: https://avatars.githubusercontent.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.github.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
