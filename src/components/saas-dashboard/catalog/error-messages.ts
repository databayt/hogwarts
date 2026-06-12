// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Maps server-action error codes (snake_case) from the catalog actions to
 * operator-readable messages. Falls back to prettifying unknown codes so a
 * raw `paid_requires_price_and_currency` never reaches a toast.
 */

interface ManageMessages {
  paidRequiresPrice?: string
  paidUnsupported?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  paid_requires_price_and_currency:
    "Paid content requires a price and 3-letter currency",
  paid_visibility_unsupported:
    "PAID visibility is not supported for this content type",
  status_unsupported_for_content_type:
    "Status is not supported for this content type",
  pricing_unsupported_for_content_type:
    "Pricing is not supported for this content type",
  rejection_reason_required: "Rejection reason is required",
  assignment_not_found: "Assignment not found",
  catalog_book_not_found: "Catalog book not found",
  invalid_options_json: "Invalid options JSON",
  file_too_large: "File too large (max 10MB)",
  file_must_be_image: "File must be an image",
}

const CODE_SHAPE = /^[a-z0-9]+(?:_[a-z0-9]+)+$/

export function catalogActionError(
  code: string | null | undefined,
  m?: ManageMessages
): string {
  if (!code) return "Something went wrong"
  if (code === "paid_requires_price_and_currency" && m?.paidRequiresPrice)
    return m.paidRequiresPrice
  if (code === "paid_visibility_unsupported" && m?.paidUnsupported)
    return m.paidUnsupported
  const mapped = ERROR_MESSAGES[code]
  if (mapped) return mapped
  // Unknown snake_case code → prettify; anything else (legacy English) passes through.
  if (CODE_SHAPE.test(code)) {
    const text = code.replace(/_/g, " ")
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  return code
}
