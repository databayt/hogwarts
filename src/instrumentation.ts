// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Instrumentation } from "next"

import { describeRequestError, isControlFlow } from "@/lib/request-error"

/**
 * Every server error — a render, a route handler, a server action, the proxy —
 * becomes one JSON line on stderr, which the container's logs carry to
 * Workers Logs. Filter there on `event = "request_error"`; `school` is the
 * tenant, `digest` is the code the error page shows the reader.
 *
 * No third party and no extra request: the line is the whole mechanism, so it
 * cannot itself take a page down. Kept free of app imports that touch the
 * database or the session for the same reason.
 */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context
) => {
  try {
    if (isControlFlow(error)) return
    console.error(JSON.stringify(describeRequestError(error, request, context)))
  } catch {
    // Reporting an error must never raise another one.
  }
}
