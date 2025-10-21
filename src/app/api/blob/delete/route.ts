import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-context";
import { del } from "@vercel/blob";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Vercel Blob Delete API
 * Handles deletion of videos and materials from Vercel Blob storage
 *
 * Security:
 * - Verifies user is authenticated
 * - Verifies user has permission (teacher/admin)
 * - Verifies file belongs to user's school (multi-tenant)
 * - Checks if file is referenced in database before deletion
 */

export async function DELETE(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.STREAM_UPLOAD, "stream-delete");
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

    // 2. Authorization - Only teachers and admins can delete
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

    // 4. Get URL from request body
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      );
    }

    // 5. Verify URL is from Vercel Blob
    if (!url.includes("blob.vercel-storage.com")) {
      return NextResponse.json(
        { error: "Invalid blob URL" },
        { status: 400 }
      );
    }

    // 6. Extract pathname from URL
    // URL format: https://account.blob.vercel-storage.com/pathname
    const pathname = url.split("blob.vercel-storage.com/")[1];

    if (!pathname) {
      return NextResponse.json(
        { error: "Invalid blob pathname" },
        { status: 400 }
      );
    }

    // 7. Verify file belongs to user's school (pathname should start with stream/{schoolId}/)
    if (session.user.role !== "DEVELOPER") {
      const expectedPrefix = `stream/${schoolId}/`;
      if (!pathname.startsWith(expectedPrefix)) {
        return NextResponse.json(
          { error: "Unauthorized to delete this file" },
          { status: 403 }
        );
      }
    }

    // 8. Check if file is still referenced in database
    const [lessonWithVideo, lessonWithAttachment, chapterWithVideo] = await Promise.all([
      // Check if video is used in any lesson
      db.streamLesson.findFirst({
        where: {
          videoUrl: url,
          chapter: {
            course: {
              schoolId: schoolId || undefined,
            },
          },
        },
      }),
      // Check if it's an attachment
      db.streamAttachment.findFirst({
        where: {
          url,
          lesson: {
            chapter: {
              course: {
                schoolId: schoolId || undefined,
              },
            },
          },
        },
      }),
      // Check if video is used in any chapter
      db.streamChapter.findFirst({
        where: {
          videoUrl: url,
          course: {
            schoolId: schoolId || undefined,
          },
        },
      }),
    ]);

    if (lessonWithVideo || lessonWithAttachment || chapterWithVideo) {
      return NextResponse.json(
        {
          error: "Cannot delete file. It is currently being used in a course.",
          referenced: true,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // 9. Delete from Vercel Blob
    await del(url);

    // 10. Log successful deletion
    logger.info("Blob deleted successfully", {
      action: "blob_delete",
      schoolId,
      userId: session.user.id,
      url,
      pathname,
    });

    // 11. Return success response
    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      url,
    });
  } catch (error) {
    logger.error(
      "Blob deletion failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "blob_delete_error",
      }
    );

    return NextResponse.json(
      { error: "Failed to delete file. Please try again." },
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
      "Access-Control-Allow-Methods": "DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
