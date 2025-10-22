/**
 * Storage Configuration
 * Supports multiple storage providers based on file size and type
 */

export const STORAGE_CONFIG = {
  // File size limits (in bytes)
  MAX_SIZES: {
    // Vercel Blob limits (use for smaller files)
    VERCEL_BLOB: {
      video: 500 * 1024 * 1024, // 500 MB
      material: 50 * 1024 * 1024, // 50 MB
      image: 10 * 1024 * 1024, // 10 MB
    },
    // Extended limits (use for large videos with S3/R2)
    EXTENDED: {
      video: 5 * 1024 * 1024 * 1024, // 5 GB (supports 40+ min 1080p, 20+ min 4K)
      material: 500 * 1024 * 1024, // 500 MB
      image: 50 * 1024 * 1024, // 50 MB
    },
  },

  // Storage providers
  PROVIDERS: {
    VERCEL_BLOB: "vercel_blob",
    AWS_S3: "aws_s3",
    CLOUDFLARE_R2: "cloudflare_r2",
  },

  // Provider selection rules
  getProvider: (fileSize: number, fileType: "video" | "material" | "image"): string => {
    // For videos over 500MB, use extended storage if configured
    if (fileType === "video" && fileSize > STORAGE_CONFIG.MAX_SIZES.VERCEL_BLOB.video) {
      // Check which extended provider is available
      if (process.env.CLOUDFLARE_R2_ACCOUNT_ID) return STORAGE_CONFIG.PROVIDERS.CLOUDFLARE_R2;
      if (process.env.AWS_S3_BUCKET) return STORAGE_CONFIG.PROVIDERS.AWS_S3;

      // No extended storage configured, reject file
      throw new Error(
        `Video file size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds Vercel Blob limit. ` +
        `Please configure AWS S3 or Cloudflare R2 for large video files.`
      );
    }

    // Use Vercel Blob for small files
    return STORAGE_CONFIG.PROVIDERS.VERCEL_BLOB;
  },

  // Get max size for file type based on available storage
  getMaxSize: (fileType: "video" | "material" | "image"): number => {
    // Check if extended storage is configured
    const hasExtendedStorage =
      process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
      process.env.AWS_S3_BUCKET;

    if (hasExtendedStorage) {
      return STORAGE_CONFIG.MAX_SIZES.EXTENDED[fileType];
    }

    return STORAGE_CONFIG.MAX_SIZES.VERCEL_BLOB[fileType];
  },
} as const;

// Human-readable size labels
export const SIZE_LABELS = {
  getLabel: (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);

    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  },
} as const;

// Video quality recommendations
export const VIDEO_RECOMMENDATIONS = {
  "480p (SD)": {
    bitrate: "2.5 Mbps",
    duration40min: "750 MB",
    recommended: "Basic lessons, slower connections",
  },
  "720p (HD)": {
    bitrate: "5 Mbps",
    duration40min: "1.5 GB",
    recommended: "Standard quality, most lessons",
  },
  "1080p (Full HD)": {
    bitrate: "8 Mbps",
    duration40min: "2.4 GB",
    recommended: "High quality, detailed content",
  },
  "4K (Ultra HD)": {
    bitrate: "20 Mbps",
    duration40min: "6 GB",
    recommended: "Maximum quality, large displays",
  },
} as const;
