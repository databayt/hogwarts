import type { NextConfig } from "next"
import { createMDX } from "fumadocs-mdx/next"

import { securityHeaders } from "./src/lib/security-headers"

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],

  // Optimize package imports
  experimental: {
    optimizePackageImports: ["@assistant-ui/react", "@radix-ui/react-icons"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ]
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "s.udemycdn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "www-cdn.anthropic.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/abdout/**",
      },
    ],
  },

  // Compiler options for production build
  compiler: {
    // Remove console.log in production (keep errors and warnings)
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Disable powered by header for security
  poweredByHeader: false,

  // Enable response compression
  compress: true,

  // Generate build ID based on git commit or timestamp
  generateBuildId: async () => {
    return process.env.BUILD_ID || Date.now().toString()
  },

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Strict mode for better debugging
  reactStrictMode: true,
}

const withMDX = createMDX()

// Wrap MDX and Next.js config with each other
export default withMDX(nextConfig)
