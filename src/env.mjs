import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    NEXTAUTH_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    FACEBOOK_CLIENT_ID: z.string().min(1).optional(),
    FACEBOOK_CLIENT_SECRET: z.string().min(1).optional(),
    GITHUB_OAUTH_TOKEN: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    STRIPE_API_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    ENABLE_PRODUCTION_LOGS: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    // File Upload & Storage
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(), // Vercel Blob
    AWS_ACCESS_KEY_ID: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val)), // AWS S3
    AWS_SECRET_ACCESS_KEY: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    AWS_REGION: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    AWS_S3_BUCKET: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1).optional(), // Cloudflare R2
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    CLOUDFLARE_R2_BUCKET: z.string().optional(),
    CLOUDFLARE_R2_ENDPOINT: z.string().url().optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),

    // CDN Configuration
    CDN_ENABLED: z.string().optional(),
    CDN_DOMAIN: z.string().optional(),
    CDN_SIGNED_URLS: z.string().optional(),
    CDN_SIGNED_URL_EXPIRY: z.string().optional(),
    CDN_SIGNED_URL_SECRET: z.string().min(1).optional(),

    // CloudFront CDN (Video Streaming)
    CLOUDFRONT_DOMAIN: z.string().optional(),
    CLOUDFRONT_KEY_PAIR_ID: z.string().optional(),
    CLOUDFRONT_PRIVATE_KEY: z.string().optional(),
    CLOUDFRONT_DISTRIBUTION_ID: z.string().optional(),

    // Storage Tier Configuration
    STORAGE_HOT_MAX_SIZE: z.string().optional(),
    STORAGE_WARM_MAX_SIZE: z.string().optional(),
    STORAGE_HOT_MAX_AGE: z.string().optional(),
    STORAGE_WARM_MAX_AGE: z.string().optional(),
    STORAGE_HOT_MIN_ACCESS: z.string().optional(),
    STORAGE_WARM_MIN_ACCESS: z.string().optional(),
    STORAGE_HOT_MAX_IDLE: z.string().optional(),
    STORAGE_WARM_MAX_IDLE: z.string().optional(),
    USE_CLOUDFLARE_R2: z.string().optional(),

    // Weather API
    OPENWEATHERMAP_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1).optional(),
    NEXT_PUBLIC_DEMO_URL: z.string().url().optional(),
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID: z.string().min(1).optional(),
    // Allow "Ultra" naming as a synonym for Business
    NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_PLAN_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_PLAN_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  },
  runtimeEnv: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    GITHUB_OAUTH_TOKEN: process.env.GITHUB_OAUTH_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    ENABLE_PRODUCTION_LOGS: process.env.ENABLE_PRODUCTION_LOGS,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    // File Upload & Storage
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY:
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_BUCKET: process.env.CLOUDFLARE_R2_BUCKET,
    CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,

    // CDN Configuration
    CDN_ENABLED: process.env.CDN_ENABLED,
    CDN_DOMAIN: process.env.CDN_DOMAIN,
    CDN_SIGNED_URLS: process.env.CDN_SIGNED_URLS,
    CDN_SIGNED_URL_EXPIRY: process.env.CDN_SIGNED_URL_EXPIRY,
    CDN_SIGNED_URL_SECRET: process.env.CDN_SIGNED_URL_SECRET,

    // CloudFront CDN (Video Streaming)
    CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN,
    CLOUDFRONT_KEY_PAIR_ID: process.env.CLOUDFRONT_KEY_PAIR_ID,
    CLOUDFRONT_PRIVATE_KEY: process.env.CLOUDFRONT_PRIVATE_KEY,
    CLOUDFRONT_DISTRIBUTION_ID: process.env.CLOUDFRONT_DISTRIBUTION_ID,

    // Storage Tier Configuration
    STORAGE_HOT_MAX_SIZE: process.env.STORAGE_HOT_MAX_SIZE,
    STORAGE_WARM_MAX_SIZE: process.env.STORAGE_WARM_MAX_SIZE,
    STORAGE_HOT_MAX_AGE: process.env.STORAGE_HOT_MAX_AGE,
    STORAGE_WARM_MAX_AGE: process.env.STORAGE_WARM_MAX_AGE,
    STORAGE_HOT_MIN_ACCESS: process.env.STORAGE_HOT_MIN_ACCESS,
    STORAGE_WARM_MIN_ACCESS: process.env.STORAGE_WARM_MIN_ACCESS,
    STORAGE_HOT_MAX_IDLE: process.env.STORAGE_HOT_MAX_IDLE,
    STORAGE_WARM_MAX_IDLE: process.env.STORAGE_WARM_MAX_IDLE,
    USE_CLOUDFLARE_R2: process.env.USE_CLOUDFLARE_R2,

    // Weather API
    OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    NEXT_PUBLIC_DEMO_URL: process.env.NEXT_PUBLIC_DEMO_URL,
    STRIPE_API_KEY: process.env.STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID,
    NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID,
    NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID,
    NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID,
    NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_ULTRA_MONTHLY_PLAN_ID,
    NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_ULTRA_YEARLY_PLAN_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
})
