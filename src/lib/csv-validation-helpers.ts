import { ZodError, ZodIssue } from "zod";

/**
 * CSV Validation Helper
 *
 * Provides enhanced error reporting for CSV import validation failures
 * with detailed field-level messages and suggestions for common errors.
 */

interface DetailedError {
  field: string;
  message: string;
  suggestion?: string;
  receivedValue?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: DetailedError[];
  formattedMessage?: string;
}

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatZodError(error: ZodError): ValidationResult {
  const errors: DetailedError[] = error.issues.map((issue: ZodIssue) => {
    const field = issue.path.join(".");
    const receivedValue =
      "received" in issue ? String(issue.received) : undefined;

    let message = issue.message;
    let suggestion: string | undefined;

    // Enhance error messages based on issue type
    switch (issue.code) {
      case "invalid_type":
        if ("received" in issue && "expected" in issue) {
          if (issue.expected === "string" && issue.received === "undefined") {
            message = `${field} is required but was not provided`;
            suggestion = `Please ensure the ${field} column exists and has a value`;
          } else {
            message = `${field} expected ${issue.expected}, received ${issue.received}`;
            suggestion = `Please check the data type for ${field}`;
          }
        }
        break;

      case "invalid_format":
        if ("validation" in issue) {
          if (issue.validation === "email") {
            message = `${field} must be a valid email address`;
            suggestion = `Example: student@example.com`;
          } else if (issue.validation === "url") {
            message = `${field} must be a valid URL`;
            suggestion = `Example: https://example.com`;
          }
        }
        break;

      case "too_small":
        if (issue.type === "string") {
          message = `${field} must be at least ${issue.minimum} characters`;
          suggestion = `Current length: ${receivedValue?.length || 0}`;
        }
        break;

      case "too_big":
        if (issue.type === "string") {
          message = `${field} must be at most ${issue.maximum} characters`;
          suggestion = `Current length: ${receivedValue?.length || 0}`;
        }
        break;

      case "invalid_enum_value":
        message = `${field} must be one of: ${issue.options.join(", ")}`;
        suggestion = `Received: ${receivedValue}`;
        break;

      default:
        message = issue.message;
    }

    return {
      field,
      message,
      suggestion,
      receivedValue,
    };
  });

  const formattedMessage = errors
    .map((err) => {
      let msg = `• ${err.message}`;
      if (err.suggestion) {
        msg += ` (${err.suggestion})`;
      }
      if (err.receivedValue && !err.suggestion?.includes(err.receivedValue)) {
        msg += ` [got: "${err.receivedValue}"]`;
      }
      return msg;
    })
    .join("\n");

  return {
    isValid: false,
    errors,
    formattedMessage,
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(
  dateString: string,
  fieldName: string = "date"
): ValidationResult {
  const errors: DetailedError[] = [];

  // Check if empty
  if (!dateString || dateString.trim() === "") {
    return {
      isValid: true,
      errors: [],
    };
  }

  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be in YYYY-MM-DD format`,
      suggestion: `Example: 2008-05-15`,
      receivedValue: dateString,
    });

    return {
      isValid: false,
      errors,
      formattedMessage: `${fieldName} format error: Expected YYYY-MM-DD (e.g., 2008-05-15), got "${dateString}"`,
    };
  }

  // Check if valid date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is not a valid date`,
      suggestion: `Please check the day/month values`,
      receivedValue: dateString,
    });

    return {
      isValid: false,
      errors,
      formattedMessage: `${fieldName} is invalid: "${dateString}" is not a real date`,
    };
  }

  // Check if date is reasonable (not in future, not too old)
  const now = new Date();
  if (date > now) {
    errors.push({
      field: fieldName,
      message: `${fieldName} cannot be in the future`,
      suggestion: `Please verify the date`,
      receivedValue: dateString,
    });

    return {
      isValid: false,
      errors,
      formattedMessage: `${fieldName} is in the future: "${dateString}"`,
    };
  }

  const hundredYearsAgo = new Date();
  hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
  if (date < hundredYearsAgo) {
    errors.push({
      field: fieldName,
      message: `${fieldName} seems too old`,
      suggestion: `Please verify the year`,
      receivedValue: dateString,
    });

    return {
      isValid: false,
      errors,
      formattedMessage: `${fieldName} is more than 100 years ago: "${dateString}"`,
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Validate phone number format
 */
export function validatePhoneFormat(
  phone: string,
  fieldName: string = "phone"
): ValidationResult {
  const errors: DetailedError[] = [];

  // Check if empty (optional field)
  if (!phone || phone.trim() === "") {
    return {
      isValid: true,
      errors: [],
    };
  }

  // Remove common separators for validation
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // Check if contains only digits and +
  if (!/^[\+]?[0-9]+$/.test(cleaned)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} contains invalid characters`,
      suggestion: `Use only numbers, spaces, dashes, or + for international code`,
      receivedValue: phone,
    });

    return {
      isValid: false,
      errors,
      formattedMessage: `${fieldName} format error: "${phone}" contains invalid characters`,
    };
  }

  // Check length (international numbers can be 7-15 digits)
  if (cleaned.length < 7 || cleaned.length > 15) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be 7-15 digits`,
      suggestion: `Current length: ${cleaned.length} digits`,
      receivedValue: phone,
    });

    return {
      isValid: false,
      errors,
      formattedMessage: `${fieldName} length error: "${phone}" has ${cleaned.length} digits (expected 7-15)`,
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Validate guardian information completeness
 */
export function validateGuardianInfo(data: {
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
}): ValidationResult {
  const errors: DetailedError[] = [];

  const hasAnyGuardianInfo =
    data.guardianName || data.guardianEmail || data.guardianPhone;

  // If guardian info is provided, require at least name
  if (hasAnyGuardianInfo && !data.guardianName) {
    errors.push({
      field: "guardianName",
      message: "Guardian name is required when guardian information is provided",
      suggestion: "Please provide the guardian's full name",
    });
  }

  // If guardian info is provided, require at least one contact method
  if (
    hasAnyGuardianInfo &&
    !data.guardianEmail &&
    !data.guardianPhone
  ) {
    errors.push({
      field: "guardianEmail/guardianPhone",
      message:
        "At least one guardian contact method is required (email or phone)",
      suggestion: "Please provide guardian email or phone number",
    });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      formattedMessage: errors.map((e) => `• ${e.message}`).join("\n"),
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Format duplicate error with helpful context
 */
export function formatDuplicateError(
  field: string,
  value: string,
  entityType: string = "record"
): string {
  return `Duplicate ${field}: "${value}" already exists in the system. Each ${entityType} must have a unique ${field}.`;
}

/**
 * Format missing required field error
 */
export function formatRequiredFieldError(
  field: string,
  rowData: Record<string, unknown>
): string {
  const availableFields = Object.keys(rowData).join(", ");
  return `Required field "${field}" is missing. Available fields: ${availableFields}`;
}

/**
 * Create a comprehensive error message for a row
 */
export function createRowErrorMessage(
  rowNumber: number,
  errors: DetailedError[]
): string {
  const errorList = errors
    .map((err) => {
      let msg = `  • ${err.field}: ${err.message}`;
      if (err.suggestion) {
        msg += `\n    ℹ ${err.suggestion}`;
      }
      if (err.receivedValue && !err.message.includes(err.receivedValue)) {
        msg += `\n    📥 Received: "${err.receivedValue}"`;
      }
      return msg;
    })
    .join("\n");

  return `Row ${rowNumber} validation failed:\n${errorList}`;
}

/**
 * Validate CSV headers match expected schema
 */
export function validateCSVHeaders(
  actualHeaders: string[],
  requiredHeaders: string[],
  optionalHeaders: string[] = []
): ValidationResult {
  const errors: DetailedError[] = [];
  const allValidHeaders = [...requiredHeaders, ...optionalHeaders];

  // Check for missing required headers
  const missingRequired = requiredHeaders.filter(
    (header) => !actualHeaders.includes(header)
  );

  if (missingRequired.length > 0) {
    errors.push({
      field: "CSV Headers",
      message: `Missing required columns: ${missingRequired.join(", ")}`,
      suggestion: `Please ensure your CSV file includes all required columns`,
    });
  }

  // Check for unknown headers (potential typos)
  const unknownHeaders = actualHeaders.filter(
    (header) => !allValidHeaders.includes(header)
  );

  if (unknownHeaders.length > 0) {
    errors.push({
      field: "CSV Headers",
      message: `Unknown columns found: ${unknownHeaders.join(", ")}`,
      suggestion: `These columns will be ignored. Check for typos in column names.`,
    });
  }

  if (errors.length > 0) {
    const formattedMessage = [
      "CSV header validation failed:",
      ...errors.map((e) => `• ${e.message}`),
      errors.some((e) => e.suggestion)
        ? `\nℹ ${errors.find((e) => e.suggestion)?.suggestion}`
        : "",
    ].join("\n");

    return {
      isValid: false,
      errors,
      formattedMessage,
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Suggest corrections for common field value errors
 */
export function suggestCorrection(
  field: string,
  value: string,
  validOptions: string[]
): string | undefined {
  const lowerValue = value.toLowerCase();

  // Find closest match
  const matches = validOptions.filter((option) =>
    option.toLowerCase().includes(lowerValue)
  );

  if (matches.length > 0) {
    return `Did you mean: ${matches.join(" or ")}?`;
  }

  // Check for common typos
  const similarMatches = validOptions.filter((option) => {
    const lowerOption = option.toLowerCase();
    // Simple similarity check (Levenshtein distance would be better)
    const distance = Math.abs(lowerValue.length - lowerOption.length);
    return distance <= 2 && lowerOption.startsWith(lowerValue[0]);
  });

  if (similarMatches.length > 0) {
    return `Did you mean: ${similarMatches.join(" or ")}?`;
  }

  return undefined;
}
