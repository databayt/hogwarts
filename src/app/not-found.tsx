// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { Button } from "@/components/ui/button"

/**
 * ROOT not-found boundary.
 *
 * Every routable page lives under `app/[lang]/`, so a genuine route-miss
 * (e.g. `/en/does-not-exist`) falls through to the root not-found rather than
 * the segment-level `app/[lang]/not-found.tsx` (which only catches explicit
 * `notFound()` calls). Without this file Next renders its built-in global
 * not-found OUTSIDE any anchoring layout, tripping `NEXT_MISSING_ROOT_TAGS`
 * ("Missing <html> and <body> tags in the root layout"). This boundary is
 * wrapped by `app/layout.tsx` (which provides <html>/<body>), so the 404
 * renders cleanly.
 *
 * Kept STATIC on purpose — the global not-found is statically rendered, so it
 * must not call dynamic APIs (`headers()`/`cookies()`); doing so makes Next
 * discard it and fall back to the built-in (re-triggering the error). The
 * "Go home" link points at `/`; middleware adds the visitor's locale prefix.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}
