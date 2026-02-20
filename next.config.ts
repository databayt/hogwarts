import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"
import { createMDX } from "fumadocs-mdx/next"

import { securityHeaders } from "./src/lib/security-headers"

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],

  // Optimize package imports for tree-shaking
  experimental: {
    optimizePackageImports: [
      "@assistant-ui/react",
      "@radix-ui/react-icons",
      "@tanstack/react-table",
      "recharts",
      "date-fns",
      "@tabler/icons-react",
      "lucide-react",
      "framer-motion",
    ],
  },

  // Exclude heavy packages from serverless function tracing
  // Prevents 1GB+ function bundles on Vercel (limit: 300mb)
  outputFileTracingExcludes: {
    "*": [
      // Build tooling (not needed at runtime)
      "./node_modules/@swc/core-linux-x64-gnu",
      "./node_modules/@swc/core-linux-x64-musl",
      "./node_modules/@esbuild",
      "./node_modules/esbuild",
      "./node_modules/tsx",
      "./node_modules/sharp",
      // Large static assets (served from CDN/S3, not serverless functions)
      "./public/clickview/**",
      "./public/anthropic/**",
      "./public/site/**",
      "./public/story.mp4",
      "./public/courses/**",
      "./public/stream/**",
      "./public/animations/**",
      "./public/onboarding/**",
      "./public/library/**",
      "./public/icons/**",
      // Content (processed at build time by fumadocs-mdx)
      "./content/**",
      // Dev/test artifacts
      "./screenshots/**",
      "./playwright-report/**",
      "./test-results/**",
      "./.playwright-mcp/**",
      "./tests/**",
      "./scripts/**",
    ],
  },

  // Keep Prisma binary engine out of edge/serverless bundles
  serverExternalPackages: ["@prisma/client", "prisma"],

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
    qualities: [25, 50, 75, 100],
    minimumCacheTTL: 2592000, // 30 days — catalog images rarely change
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/**",
      },
      { protocol: "https", hostname: "s.udemycdn.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.ctfassets.net", pathname: "/**" },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "www-cdn.anthropic.com", pathname: "/**" },
      { protocol: "https", hostname: "ik.imagekit.io", pathname: "/abdout/**" },
      { protocol: "https", hostname: "img.clickviewapp.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "hogwarts-databayt.s3.us-east-1.amazonaws.com",
        pathname: "/**",
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

  // Skip built-in TS check during build (handled by separate tsc --noEmit step)
  // Prevents OOM on Vercel's 8GB build machines for large codebases
  typescript: {
    ignoreBuildErrors: true,
  },
}

const withMDX = createMDX()

// Wrap MDX → Sentry → export
// Sentry only active when DSN is configured (graceful no-op otherwise)
export default withSentryConfig(withMDX(nextConfig), {
  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN is not set
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps for better stack traces in production
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Disable Sentry telemetry
  telemetry: false,
})
