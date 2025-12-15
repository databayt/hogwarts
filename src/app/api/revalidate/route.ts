/**
 * Cache Revalidation API
 *
 * Programmatically invalidates Next.js cache by tag or path.
 *
 * REVALIDATION TYPES:
 * - Tag: Invalidates all cache entries with that tag
 *        Example: revalidateTag("students") clears all student data
 * - Path: Invalidates specific route's cache
 *        Example: revalidatePath("/dashboard") refreshes dashboard
 *
 * ACCESS CONTROL:
 * - DEVELOPER or PRINCIPAL only
 * - WHY: Cache invalidation affects performance
 * - Mass invalidation could cause database load spike
 * - Only trusted roles should have this power
 *
 * WHY BOTH TAG AND PATH:
 * - Tags: Cross-cutting invalidation (all pages showing students)
 * - Paths: Surgical invalidation (just this specific page)
 * - Different use cases require different strategies
 *
 * USE CASES:
 * - After bulk import: Invalidate "students" tag
 * - After settings change: Invalidate settings path
 * - Manual cache bust: Debug stale data issues
 *
 * WHY POST (not GET):
 * - Invalidation has side effects (clears cache)
 * - GET requests could be prefetched/cached
 * - POST semantics match "modify something" intent
 *
 * GOTCHAS:
 * - Over-invalidation causes performance degradation
 * - Tag names must match what's used in fetch() options
 * - Path must include locale prefix if using i18n
 *
 * @see Next.js docs: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
 */

import {
  revalidatePath as nextRevalidatePath,
  revalidateTag as nextRevalidateTag,
} from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only allow authenticated users with admin roles to revalidate cache
    if (
      !session?.user ||
      (session.user.role !== "DEVELOPER" && session.user.role !== "PRINCIPAL")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get("tag")
    const path = searchParams.get("path")

    if (!tag && !path) {
      return NextResponse.json(
        { error: "Either tag or path parameter is required" },
        { status: 400 }
      )
    }

    if (tag) {
      nextRevalidateTag(tag, "max")
      logger.info("Cache tag revalidated", {
        action: "cache_revalidate_tag",
        tag,
        userId: session.user.id,
        schoolId: session.user.schoolId,
      })
      return NextResponse.json({ revalidated: true, tag })
    }

    if (path) {
      nextRevalidatePath(path)
      logger.info("Cache path revalidated", {
        action: "cache_revalidate_path",
        path,
        userId: session.user.id,
        schoolId: session.user.schoolId,
      })
      return NextResponse.json({ revalidated: true, path })
    }
  } catch (error) {
    logger.error(
      "Cache revalidation error",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "cache_revalidation_error",
      }
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
