/**
 * CSV Export Utility
 * Provides reusable functions for exporting data to CSV format
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  options?: {
    columns?: Array<{ key: keyof T; label: string }>;
    includeHeaders?: boolean;
    delimiter?: string;
  }
): string {
  const {
    columns,
    includeHeaders = true,
    delimiter = ",",
  } = options || {};

  if (data.length === 0) {
    return "";
  }

  // If columns not specified, use all keys from first object
  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  const rows: string[] = [];

  // Add header row
  if (includeHeaders) {
    const headerRow = cols.map((col) => escapeCSVValue(col.label)).join(delimiter);
    rows.push(headerRow);
  }

  // Add data rows
  for (const item of data) {
    const row = cols
      .map((col) => {
        const value = item[col.key];
        return escapeCSVValue(formatValue(value));
      })
      .join(delimiter);
    rows.push(row);
  }

  return rows.join("\n");
}

/**
 * Escape CSV values (handle quotes, commas, newlines)
 */
function escapeCSVValue(value: string): string {
  // Convert to string
  const stringValue = String(value || "");

  // If value contains delimiter, quotes, or newlines, wrap in quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    // Escape quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringValue;
}

/**
 * Format value for CSV output
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Generate filename with timestamp
 */
export function generateCSVFilename(
  prefix: string,
  options?: { timestamp?: boolean; extension?: string }
): string {
  const { timestamp = true, extension = "csv" } = options || {};

  let filename = prefix;

  if (timestamp) {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
    filename += `_${dateStr}_${timeStr}`;
  }

  return `${filename}.${extension}`;
}

/**
 * Create CSV download from data
 */
export function downloadCSV(
  data: any[],
  filename: string,
  columns?: Array<{ key: string; label: string }>
): void {
  const csv = arrayToCSV(data, { columns });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Common column definitions for standard entities
 */
export const COMMON_COLUMNS = {
  student: [
    { key: "studentId", label: "Student ID" },
    { key: "givenName", label: "First Name" },
    { key: "surname", label: "Last Name" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "gender", label: "Gender" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "enrollmentDate", label: "Enrollment Date" },
    { key: "status", label: "Status" },
    { key: "className", label: "Class" },
  ],
  teacher: [
    { key: "employeeId", label: "Employee ID" },
    { key: "givenName", label: "First Name" },
    { key: "surname", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "subjects", label: "Subjects" },
    { key: "qualification", label: "Qualification" },
  ],
  assignment: [
    { key: "title", label: "Assignment Title" },
    { key: "class", label: "Class" },
    { key: "subject", label: "Subject" },
    { key: "dueDate", label: "Due Date" },
    { key: "totalPoints", label: "Total Points" },
    { key: "submissions", label: "Submissions" },
    { key: "status", label: "Status" },
  ],
  exam: [
    { key: "title", label: "Exam Title" },
    { key: "subject", label: "Subject" },
    { key: "class", label: "Class" },
    { key: "examDate", label: "Exam Date" },
    { key: "duration", label: "Duration (min)" },
    { key: "totalMarks", label: "Total Marks" },
    { key: "examType", label: "Type" },
  ],
  attendance: [
    { key: "date", label: "Date" },
    { key: "studentName", label: "Student Name" },
    { key: "studentId", label: "Student ID" },
    { key: "className", label: "Class" },
    { key: "status", label: "Status" },
    { key: "notes", label: "Notes" },
  ],
  announcement: [
    { key: "title", label: "Title" },
    { key: "priority", label: "Priority" },
    { key: "scope", label: "Scope" },
    { key: "targetAudience", label: "Target Audience" },
    { key: "createdAt", label: "Created Date" },
    { key: "expiresAt", label: "Expires Date" },
    { key: "published", label: "Published" },
  ],
  event: [
    { key: "title", label: "Event Title" },
    { key: "description", label: "Description" },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
    { key: "location", label: "Location" },
    { key: "attendees", label: "Expected Attendees" },
    { key: "rsvpCount", label: "RSVPs" },
  ],
  parent: [
    { key: "givenName", label: "First Name" },
    { key: "surname", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "relationship", label: "Relationship" },
    { key: "children", label: "Children" },
    { key: "isPrimary", label: "Primary Contact" },
  ],
} as const;
