/**
 * Toast Notification Utilities - User Feedback System
 *
 * PURPOSE: Provides consistent, localized toast notifications across application
 * Wraps atom/toast components with convenience functions and CRUD helpers
 *
 * KEY FUNCTIONS:
 * - showSuccess(): Display success notification
 * - showError(): Display error notification
 * - showInfo(): Display info notification
 * - showDelete(): Display delete confirmation notification
 * - showCrudToast(): Smart CRUD operation feedback
 * - withToast(): Async wrapper with automatic error handling
 * - confirmDelete(): Modal confirmation before destructive action
 *
 * LOCALIZATION:
 * - Accepts message OR fallback string
 * - Falls back to generic message if none provided
 * - Integrates with dictionary for i18n
 * - Supports Arabic and English messages
 *
 * CRUD OPERATIONS:
 * showCrudToast(operation, success, messages, dictionary)
 * - "create": Triggers "Created successfully" message
 * - "update": Triggers "Updated successfully" message
 * - "delete": Triggers "Deleted successfully" message
 * - Customizable messages via options
 *
 * ERROR EXTRACTION:
 * - formatErrorMessage(): Convert error to displayable string
 * - extractValidationErrors(): Parse Zod field errors from response
 * - Works with Error instances, strings, and custom error objects
 *
 * ASYNC WRAPPER:
 * withToast<T>(promise, options): Execute async operation with UI feedback
 * - Auto-shows success toast on completion
 * - Auto-shows error toast on failure
 * - Returns promise result OR null if failed
 * - Useful for form submissions, API calls
 *
 * ARCHITECTURE:
 * - Thin wrapper around atom/toast components
 * - No state management (pure utility functions)
 * - Works in client components ("use client" not needed at module level)
 * - Re-exports toast components for direct access
 *
 * CONSTRAINTS & GOTCHAS:
 * - Must be called from client component (toast state is client-side)
 * - Dictionary parameter is optional (fallback messages always work)
 * - Validation errors must follow { errors: Record<string, string> } format
 * - withToast() returns null on error (check for null return value)
 * - Confirmation dialog is modal (blocks further interaction until resolved)
 *
 * PERFORMANCE:
 * - No re-renders (pure functions)
 * - Toast components handle animations (Framer Motion)
 * - Multiple toasts stack automatically
 *
 * INTEGRATION PATTERN:
 * ```ts
 * // In server action
 * const result = await createItem(formData);
 *
 * // In client component
 * const response = await serverAction(data);
 * showCrudToast("create", response.success, {
 *   create: "Item created successfully!",
 *   error: "Failed to create item"
 * }, dictionary);
 * ```
 */

import { SuccessToast, ErrorToast, InfoToast, DeleteToast, confirmDeleteDialog } from '@/components/atom/toast';

export interface ToastOptions {
  /** Custom message to display */
  message?: string;
  /** Fallback message if primary message is not provided */
  fallback?: string;
  /** Duration in milliseconds */
  duration?: number;
}

export interface CrudToastMessages {
  create?: string;
  update?: string;
  delete?: string;
  error?: string;
}

/**
 * Show a success toast with localized message
 */
export function showSuccess(
  message: string | undefined,
  fallback: string = 'Operation successful'
) {
  SuccessToast(message || fallback);
}

/**
 * Show an error toast with localized message
 */
export function showError(
  message: string | undefined,
  fallback: string = 'Operation failed'
) {
  ErrorToast(message || fallback);
}

/**
 * Show an info toast with localized message
 */
export function showInfo(
  message: string | undefined,
  fallback: string = 'Information'
) {
  InfoToast(message || fallback);
}

/**
 * Show a delete toast with localized message
 */
export function showDelete(
  message: string | undefined,
  fallback: string = 'Deleted successfully'
) {
  DeleteToast(message || fallback);
}

/**
 * Show a toast based on CRUD operation result
 */
export function showCrudToast(
  operation: 'create' | 'update' | 'delete',
  success: boolean,
  messages?: CrudToastMessages,
  dictionary?: any
) {
  if (success) {
    switch (operation) {
      case 'create':
        showSuccess(
          messages?.create || dictionary?.common?.success,
          'Created successfully'
        );
        break;
      case 'update':
        showSuccess(
          messages?.update || dictionary?.common?.success,
          'Updated successfully'
        );
        break;
      case 'delete':
        showDelete(
          messages?.delete || dictionary?.common?.success,
          'Deleted successfully'
        );
        break;
    }
  } else {
    showError(
      messages?.error || dictionary?.common?.error,
      'Operation failed'
    );
  }
}

/**
 * Show a confirmation dialog before deleting
 */
export async function confirmDelete(
  message?: string,
  dictionary?: any
): Promise<boolean> {
  const confirmMessage = message ||
    dictionary?.common?.confirm_delete ||
    'This action cannot be undone.';

  return confirmDeleteDialog(confirmMessage);
}

/**
 * Handle async operations with loading and toast notifications
 */
export async function withToast<T>(
  promise: Promise<T>,
  options: {
    loading?: string;
    success?: string;
    error?: string;
    dictionary?: any;
  } = {}
): Promise<T | null> {
  try {
    const result = await promise;

    if (options.success) {
      showSuccess(
        options.success,
        options.dictionary?.common?.success || 'Success'
      );
    }

    return result;
  } catch (error) {
    showError(
      options.error || (error as Error)?.message,
      options.dictionary?.common?.error || 'Failed'
    );
    return null;
  }
}

/**
 * Format error message for display
 */
export function formatErrorMessage(
  error: unknown,
  fallback: string = 'An error occurred'
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
}

/**
 * Extract validation errors from server response
 */
export function extractValidationErrors(
  error: unknown
): Record<string, string> | null {
  if (
    error &&
    typeof error === 'object' &&
    'errors' in error &&
    typeof error.errors === 'object'
  ) {
    return error.errors as Record<string, string>;
  }

  return null;
}

// Re-export toast functions for convenience
export {
  SuccessToast,
  ErrorToast,
  InfoToast,
  DeleteToast,
  confirmDeleteDialog
} from '@/components/atom/toast';