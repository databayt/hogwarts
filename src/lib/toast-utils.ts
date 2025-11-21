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