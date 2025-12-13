/**
 * ImageKit Upload API Route
 *
 * Handles file uploads to ImageKit CDN for the Hogwarts library.
 * Provides both authentication parameters for client-side uploads
 * and server-side upload handling.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAuthenticationParameters,
  uploadToImageKit,
  IMAGEKIT_FOLDERS,
  type ImageKitUploadResult,
} from "@/components/file";

// ============================================================================
// GET: Authentication Parameters for Client-Side Upload
// ============================================================================

/**
 * Get authentication parameters for client-side ImageKit uploads
 * Returns time-limited tokens for secure direct uploads from the browser
 */
export async function GET() {
  try {
    // Verify user is authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate auth params (valid for ~30 minutes)
    const authParams = getAuthenticationParameters();

    return NextResponse.json({
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    });
  } catch (error) {
    console.error("ImageKit auth error:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST: Server-Side Upload
// ============================================================================

interface UploadRequest {
  /** Base64 encoded file data */
  file: string;
  /** Original file name */
  fileName: string;
  /** Folder path (defaults to library/books) */
  folder?: string;
  /** Optional tags for organization */
  tags?: string[];
  /** Optional metadata */
  metadata?: Record<string, string>;
}

interface UploadResponse {
  success: boolean;
  data?: ImageKitUploadResult;
  error?: string;
}

/**
 * Upload a file to ImageKit via server-side processing
 * Use this for form submissions or when client-side upload isn't suitable
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // Verify user is authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: UploadRequest = await request.json();

    if (!body.file || !body.fileName) {
      return NextResponse.json(
        { success: false, error: "File and fileName are required" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const base64Size = body.file.length * 0.75; // Approximate decoded size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (base64Size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Determine folder based on request or default
    const folder = body.folder || IMAGEKIT_FOLDERS.LIBRARY_BOOKS;

    // Add user info to metadata
    const metadata = {
      ...body.metadata,
      uploadedBy: session.user.id || "unknown",
      uploadedAt: new Date().toISOString(),
    };

    // Upload to ImageKit
    const result = await uploadToImageKit({
      file: body.file,
      fileName: body.fileName,
      folder,
      tags: body.tags,
      useUniqueFileName: true,
      customMetadata: metadata,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
