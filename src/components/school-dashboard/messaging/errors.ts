// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Messaging error resolution.
 *
 * Server actions return ACTION_ERRORS codes (e.g. "MESSAGE_SEND_FAILED").
 * The client resolves them to a localized string via the messaging
 * dictionary's `errors.*` keys. Falls back to the generic load_failed
 * message for unknown codes so a raw code is never shown to a user.
 */

/** Maps ACTION_ERRORS codes → messaging dictionary `errors.*` keys. */
const CODE_TO_ERROR_KEY: Record<string, string> = {
  // Shared / generic codes
  NOT_AUTHENTICATED: "not_authenticated",
  MISSING_SCHOOL: "no_school_context",
  UNAUTHORIZED: "permission_denied",
  VALIDATION_ERROR: "create_error",
  RATE_LIMITED: "rate_limited",
  NOT_FOUND: "load_failed",
  CREATE_FAILED: "create_error",
  UPDATE_FAILED: "load_failed",
  DELETE_FAILED: "delete_failed",
  SAVE_FAILED: "load_failed",
  LOAD_FAILED: "load_failed",
  // Messaging-specific codes
  MESSAGE_SEND_FAILED: "send_failed",
  MESSAGE_EDIT_FAILED: "edit_failed",
  MESSAGE_DELETE_FAILED: "delete_failed",
  MESSAGE_NOT_FOUND: "message_not_found",
  MESSAGE_REACTION_FAILED: "react_failed",
  CONVERSATION_NOT_FOUND: "conversation_not_found",
  CONVERSATION_CREATE_FAILED: "create_error",
  CONVERSATION_ARCHIVE_FAILED: "archive_failed",
  CONVERSATION_LEAVE_FAILED: "cannot_leave_conversation",
  PARTICIPANT_ADD_FAILED: "cannot_add_participant",
  PARTICIPANT_REMOVE_FAILED: "cannot_remove_participant",
  SEARCH_QUERY_TOO_SHORT: "search_query_too_short",
  WHATSAPP_NOT_CONNECTED: "whatsapp_not_connected",
  ATTACHMENT_TOO_LARGE: "attachment_too_large",
  ATTACHMENT_TYPE_INVALID: "invalid_file_type",
  ATTACHMENT_UPLOAD_FAILED: "attachment_upload_failed",
}

/**
 * Resolve a server-action error code to a localized message.
 *
 * @param code - the `error` field of a failed ActionResponse (an ACTION_ERRORS code)
 * @param m - the messaging dictionary slice (loosely typed, like other dict consumers)
 */
export function resolveMessagingError(
  code: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  m: any
): string {
  const errors: Record<string, string> = m?.errors ?? {}
  const key = code ? CODE_TO_ERROR_KEY[code] : undefined
  return (
    (key && errors[key]) ||
    // Defensive: code might already be a dictionary key, or unknown → generic
    (code && errors[code]) ||
    errors.load_failed ||
    "Something went wrong"
  )
}
