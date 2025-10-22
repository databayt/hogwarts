import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-context";
import { put } from "@vercel/blob";
import { logger } from "@/lib/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { STORAGE_CONFIG, SIZE_LABELS } from "@/lib/storage-config";

/**
 * Vercel Blob Upload API (with Extended Storage Support)
 * Handles video and material uploads for Stream courses
 *
 * Supported file types:
 * - Videos: mp4, webm, mov, avi
 * - Materials: pdf, doc, docx, ppt, pptx, xls, xlsx, zip
 * - Images: jpg, jpeg, png, gif, svg, webp
 *
 * Storage Strategy:
 * - Small videos (< 500MB): Vercel Blob
 * - Large videos (up to 5GB): Cloudflare R2 or AWS S3 (if configured)
 * - For 40-min lessons at 1080p (~2.4GB), configure extended storage
 */

const MAX_FILE_SIZE = {
  video: STORAGE_CONFIG.getMaxSize("video"),
  material: STORAGE_CONFIG.getMaxSize("material"),
  image: STORAGE_CONFIG.getMaxSize("image"),
};

const ALLOWED_TYPES = {
  video: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
  ],
  material: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed",
  ],
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/webp",
  ],
};

function getFileCategory(mimeType: string): "video" | "material" | "image" | null {
  if (ALLOWED_TYPES.video.includes(mimeType)) return "video";
  if (ALLOWED_TYPES.material.includes(mimeType)) return "material";
  if (ALLOWED_TYPES.image.includes(mimeType)) return "image";
  return null;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.STREAM_UPLOAD, "stream-upload");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Authorization - Only teachers and admins can upload
    if (!["TEACHER", "ADMIN", "DEVELOPER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // 3. Multi-tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId && session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "School context required" },
        { status: 400 }
      );
    }

    // 4. Get file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("type") as string; // 'video' | 'material' | 'image'

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 5. Validate file type
    const category = getFileCategory(file.type);
    if (!category) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed types: videos (mp4, webm, mov, avi), materials (pdf, doc, ppt, xls, zip), images (jpg, png, gif, svg, webp)`
        },
        { status: 400 }
      );
    }

    // 6. Validate file size
    const maxSize = MAX_FILE_SIZE[category];
    if (file.size > maxSize) {
      const sizeLabel = SIZE_LABELS.getLabel(maxSize);
      const fileSizeLabel = SIZE_LABELS.getLabel(file.size);

      return NextResponse.json(
        {
          error: `File size (${fileSizeLabel}) exceeds limit. Maximum allowed: ${sizeLabel}`,
          maxSize: sizeLabel,
          fileSize: fileSizeLabel,
          hint: category === "video" && file.size > STORAGE_CONFIG.MAX_SIZES.VERCEL_BLOB.video
            ? "For videos larger than 500MB, please configure AWS S3 or Cloudflare R2 in your environment variables."
            : undefined,
        },
        { status: 400 }
      );
    }

    // 7. Generate unique filename with school context
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `stream/${schoolId ?? "platform"}/${category}/${timestamp}_${sanitizedName}`;

    // 8. Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // 9. Log successful upload
    logger.info("Blob upload successful", {
      action: "blob_upload",
      schoolId: schoolId ?? "platform",
      userId: session.user.id,
      filename: blob.pathname,
      size: file.size,
      type: file.type,
      category,
      url: blob.url,
    });

    // 10. Return success response
    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      metadata: {
        size: file.size,
        type: file.type,
        category,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user.id,
      },
    });
  } catch (error) {
    logger.error(
      "Blob upload failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "blob_upload_error",
      }
    );

    return NextResponse.json(
      { error: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
