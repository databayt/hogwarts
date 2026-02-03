/**
 * File Upload API - Logos & Avatars
 *
 * Handles image uploads with type-based permission checks.
 *
 * SUPPORTED TYPES:
 * - logo: School branding image (stored in /logos folder)
 * - avatar: User profile picture (stored in /avatars folder)
 *
 * PERMISSION MODEL:
 * - Avatar: Any authenticated user can upload their own
 * - Logo: Only PRINCIPAL or DEVELOPER (school-level branding)
 *
 * WHY SEPARATE PERMISSIONS:
 * - Avatars are personal (user owns their profile)
 * - Logos are organizational (represents entire school)
 * - Prevents students/teachers from changing school branding
 *
 * WHY PRINCIPAL FOR LOGOS (not ADMIN):
 * - ADMIN role is school-scoped but may be too broad
 * - Principal is specifically the school leader role
 * - DEVELOPER included for school-dashboard support/testing
 *
 * DATABASE UPDATES:
 * - Logo: Updates School.logoUrl for tenant branding
 * - Avatar: Updates User.image for profile display
 *
 * STORAGE DELEGATION:
 * - Uses centralized uploadFile() from file module
 * - Handles Vercel Blob or S3 based on config
 * - Returns public URL for database storage
 *
 * WHY CORS HEADERS (OPTIONS):
 * - Allows cross-origin uploads from client apps
 * - Required for browser FormData submissions
 * - Permissive (*) since auth is header-based
 *
 * GOTCHAS:
 * - File size limits enforced by uploadFile()
 * - Image validation (dimensions, format) in file module
 * - Old images not deleted (consider cleanup job)
 *
 * @see /components/file/index.ts for upload implementation
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { uploadFile } from "@/components/file"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!type || !["logo", "avatar"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid upload type" },
        { status: 400 }
      )
    }

    // Configure upload options based on type
    const uploadFormData = new FormData()
    uploadFormData.set("file", file)

    const uploadOptions =
      type === "logo"
        ? { category: "image" as const, type: "logo" as const, folder: "logos" }
        : {
            category: "image" as const,
            type: "avatar" as const,
            folder: "avatars",
          }

    if (type === "logo") {
      // Only allow school admins to upload logos
      if (
        session.user.role !== "PRINCIPAL" &&
        session.user.role !== "DEVELOPER"
      ) {
        return NextResponse.json(
          { error: "Insufficient permissions to upload logo" },
          { status: 403 }
        )
      }

      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: "No school associated with user" },
          { status: 400 }
        )
      }
    }

    // Upload file using centralized file module
    const result = await uploadFile(uploadFormData, uploadOptions)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 400 }
      )
    }

    // Update database with new URL
    if (type === "logo" && session.user.schoolId) {
      await db.school.update({
        where: { id: session.user.schoolId },
        data: { logoUrl: result.url },
      })

      logger.info("School logo updated", {
        action: "school_logo_update",
        schoolId: session.user.schoolId,
        userId: session.user.id,
      })
    } else if (type === "avatar") {
      await db.user.update({
        where: { id: session.user.id },
        data: { image: result.url },
      })

      logger.info("User avatar updated", {
        action: "user_avatar_update",
        userId: session.user.id,
      })
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      metadata: {
        size: result.size,
        type: result.mimeType,
      },
    })
  } catch (error) {
    logger.error(
      "Upload API error",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "upload_api_error",
      }
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
  })
}
