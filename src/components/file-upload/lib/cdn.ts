/**
 * CDN Utility
 * Handles CDN URL generation, signed URLs, and content delivery optimization
 */

import { createHmac } from "crypto";

export interface CDNConfig {
  enabled: boolean;
  domain?: string; // e.g., cdn.databayt.org or CloudFront domain
  signedUrlsEnabled: boolean;
  signedUrlExpiry: number; // seconds
  signedUrlSecret?: string;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: "webp" | "avif" | "jpeg" | "png";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

/**
 * Get CDN configuration from environment
 */
export function getCDNConfig(): CDNConfig {
  return {
    enabled: process.env.CDN_ENABLED === "true",
    domain: process.env.CDN_DOMAIN,
    signedUrlsEnabled: process.env.CDN_SIGNED_URLS === "true",
    signedUrlExpiry: parseInt(process.env.CDN_SIGNED_URL_EXPIRY || "3600"),
    signedUrlSecret: process.env.CDN_SIGNED_URL_SECRET,
  };
}

/**
 * Generate CDN URL from storage URL
 * Replaces storage domain with CDN domain for faster delivery
 */
export function generateCDNUrl(storageUrl: string): string {
  const config = getCDNConfig();

  if (!config.enabled || !config.domain) {
    return storageUrl;
  }

  try {
    const url = new URL(storageUrl);
    // Replace storage domain with CDN domain
    url.hostname = config.domain;
    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return storageUrl;
  }
}

/**
 * Generate signed URL with expiration
 * Prevents hotlinking and unauthorized access
 */
export function generateSignedUrl(
  url: string,
  expirySeconds?: number
): string {
  const config = getCDNConfig();

  if (!config.signedUrlsEnabled || !config.signedUrlSecret) {
    return url;
  }

  const expiry = expirySeconds || config.signedUrlExpiry;
  const expiresAt = Math.floor(Date.now() / 1000) + expiry;

  try {
    const urlObj = new URL(url);
    const pathAndQuery = urlObj.pathname + urlObj.search;

    // Create signature
    const hmac = createHmac("sha256", config.signedUrlSecret);
    hmac.update(`${pathAndQuery}${expiresAt}`);
    const signature = hmac.digest("base64url");

    // Add signature and expiry to URL
    urlObj.searchParams.set("signature", signature);
    urlObj.searchParams.set("expires", expiresAt.toString());

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Verify signed URL signature
 * Server-side validation of signed URLs
 */
export function verifySignedUrl(url: string): boolean {
  const config = getCDNConfig();

  if (!config.signedUrlsEnabled || !config.signedUrlSecret) {
    return true; // If signing not enabled, all URLs are valid
  }

  try {
    const urlObj = new URL(url);
    const signature = urlObj.searchParams.get("signature");
    const expires = urlObj.searchParams.get("expires");

    if (!signature || !expires) {
      return false;
    }

    // Check expiry
    const expiresAt = parseInt(expires);
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt < now) {
      return false; // Expired
    }

    // Verify signature
    urlObj.searchParams.delete("signature");
    urlObj.searchParams.delete("expires");
    const pathAndQuery = urlObj.pathname + urlObj.search;

    const hmac = createHmac("sha256", config.signedUrlSecret);
    hmac.update(`${pathAndQuery}${expiresAt}`);
    const expectedSignature = hmac.digest("base64url");

    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Generate optimized image URL with transformations
 * Uses Vercel Image Optimization or CloudFront with Lambda@Edge
 */
export function generateOptimizedImageUrl(
  imageUrl: string,
  options: ImageTransformOptions = {}
): string {
  const config = getCDNConfig();

  if (!config.enabled) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);

    // Add transformation parameters
    if (options.width) url.searchParams.set("w", options.width.toString());
    if (options.height) url.searchParams.set("h", options.height.toString());
    if (options.quality) url.searchParams.set("q", options.quality.toString());
    if (options.format) url.searchParams.set("f", options.format);
    if (options.fit) url.searchParams.set("fit", options.fit);

    return url.toString();
  } catch {
    return imageUrl;
  }
}

/**
 * Generate responsive image srcset
 * Creates multiple image sizes for responsive design
 */
export function generateResponsiveSrcSet(
  imageUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string {
  return widths
    .map((width) => {
      const url = generateOptimizedImageUrl(imageUrl, { width, format: "webp" });
      return `${url} ${width}w`;
    })
    .join(", ");
}

/**
 * Generate thumbnail URL
 * Quick helper for common thumbnail sizes
 */
export function generateThumbnailUrl(
  imageUrl: string,
  size: "sm" | "md" | "lg" = "md"
): string {
  const sizes = {
    sm: { width: 150, height: 150 },
    md: { width: 300, height: 300 },
    lg: { width: 600, height: 600 },
  };

  return generateOptimizedImageUrl(imageUrl, {
    ...sizes[size],
    quality: 80,
    format: "webp",
    fit: "cover",
  });
}

/**
 * Prefetch CDN resources
 * Add prefetch hints to HTML for faster loading
 */
export function generatePrefetchLinks(urls: string[]): string {
  return urls
    .map((url) => `<link rel="prefetch" href="${url}" as="image" />`)
    .join("\n");
}

/**
 * Get cache-control headers for CDN
 * Optimized caching strategy based on file type
 */
export function getCacheControlHeaders(
  fileType: string,
  isPublic = false
): Record<string, string> {
  const publicPrefix = isPublic ? "public" : "private";

  // Image files: cache for 1 year
  if (fileType.startsWith("image/")) {
    return {
      "Cache-Control": `${publicPrefix}, max-age=31536000, immutable`,
      "CDN-Cache-Control": "max-age=31536000",
    };
  }

  // Video files: cache for 1 week
  if (fileType.startsWith("video/")) {
    return {
      "Cache-Control": `${publicPrefix}, max-age=604800`,
      "CDN-Cache-Control": "max-age=604800",
    };
  }

  // Documents: cache for 1 day
  if (
    fileType === "application/pdf" ||
    fileType.includes("document") ||
    fileType.includes("sheet")
  ) {
    return {
      "Cache-Control": `${publicPrefix}, max-age=86400`,
      "CDN-Cache-Control": "max-age=86400",
    };
  }

  // Default: cache for 1 hour
  return {
    "Cache-Control": `${publicPrefix}, max-age=3600`,
    "CDN-Cache-Control": "max-age=3600",
  };
}

/**
 * Purge CDN cache for a URL
 * Implementation depends on CDN provider (CloudFront, Vercel, etc.)
 */
export async function purgeCDNCache(urls: string[]): Promise<void> {
  const config = getCDNConfig();

  if (!config.enabled) {
    return;
  }

  // Implementation depends on CDN provider
  // Example for CloudFront:
  // await cloudfront.createInvalidation({
  //   DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
  //   InvalidationBatch: {
  //     Paths: { Quantity: urls.length, Items: urls },
  //     CallerReference: Date.now().toString(),
  //   },
  // });

  // Example for Vercel:
  // await fetch('https://api.vercel.com/v1/purge', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
  //   body: JSON.stringify({ urls }),
  // });

  console.log(`[CDN] Would purge cache for ${urls.length} URLs`, urls);
}
