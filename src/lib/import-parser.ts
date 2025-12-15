/**
 * Import Parser for CSV and Excel files
 *
 * Handles bulk data imports for students, teachers, and classes.
 *
 * ARCHITECTURE:
 * 1. Parse raw CSV/Excel → 2. Validate per row → 3. Return structured result
 *
 * WHY VALIDATION PER ROW:
 * - One bad row shouldn't block entire import
 * - Users need line-by-line error feedback
 * - Allows partial imports (valid rows proceed)
 *
 * COLUMN MAPPING STRATEGY:
 * - sourceColumn: Header name in uploaded file (case-insensitive)
 * - targetField: Internal field name in our schema
 * - transform: Optional function to normalize data (e.g., trim, lowercase)
 *
 * GOTCHAS:
 * - Excel dates come as serial numbers, not strings
 * - Phone numbers may have leading zeros (must preserve as string)
 * - Comma-separated values in cells need special handling
 * - Different Excel versions use different encodings (UTF-8 BOM issues)
 *
 * DATA TYPE HANDLING:
 * - 'email': Validated against RFC 5322 pattern
 * - 'phone': Allows digits, spaces, dashes, plus, parens
 * - 'date': Expects ISO format (YYYY-MM-DD), not localized
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

// === TYPE DEFINITIONS ===

export interface ParsedRow {
  row: number;
  data: Record<string, any>;
  errors: ValidationError[];
}

export interface ValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ValidationError[];
  message: string;
  data?: ParsedRow[];
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'email' | 'phone' | 'boolean';
  transform?: (value: any) => any;
  validate?: (value: any) => boolean;
}

// === VALIDATION SCHEMAS ===

const emailSchema = z.string().email();
const phoneSchema = z.string().regex(/^[\d\s\-\+\(\)]+$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Student import schema
export const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  grade: z.string().optional(),
  studentId: z.string().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
});

// Teacher import schema
export const teacherSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().optional(),
  subjects: z.string().optional(), // Comma-separated
  employeeId: z.string().optional(),
});

// Class import schema
export const classSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  teacher: z.string().optional(),
  room: z.string().optional(),
  capacity: z.number().optional(),
  schedule: z.string().optional(),
});

// === CSV PARSER ===

export async function parseCsvData(
  csvContent: string,
  dataType: 'students' | 'teachers' | 'classes'
): Promise<ImportResult> {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          row: 0,
          column: '',
          value: '',
          message: 'CSV file is empty or contains only headers'
        }],
        message: 'Invalid CSV format',
      };
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const mappings = getColumnMappings(dataType, headers);
    
    // Parse data rows
    const parsedRows: ParsedRow[] = [];
    const errors: ValidationError[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        skipped++;
        continue;
      }

      const values = parseCSVLine(line);
      const rowData: Record<string, any> = {};
      const rowErrors: ValidationError[] = [];

      // Map values to fields
      mappings.forEach((mapping, index) => {
        const value = values[index];
        if (mapping) {
          const processed = processValue(value, mapping.type);
          
          // Validate required fields
          if (mapping.required && !processed) {
            rowErrors.push({
              row: i + 1,
              column: mapping.sourceColumn,
              value,
              message: `${mapping.sourceColumn} is required`
            });
          }
          
          // Apply custom validation
          if (processed && mapping.validate && !mapping.validate(processed)) {
            rowErrors.push({
              row: i + 1,
              column: mapping.sourceColumn,
              value,
              message: `Invalid ${mapping.type} format`
            });
          }
          
          rowData[mapping.targetField] = processed;
        }
      });

      // Validate using schema
      const schema = getSchemaForType(dataType);
      const validation = schema.safeParse(rowData);
      
      if (!validation.success) {
        validation.error.issues.forEach((err: any) => {
          rowErrors.push({
            row: i + 1,
            column: err.path.join('.'),
            value: rowData[err.path[0]],
            message: err.message
          });
        });
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        skipped++;
      } else {
        parsedRows.push({
          row: i + 1,
          data: rowData,
          errors: []
        });
        imported++;
      }
    }

    return {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
      message: errors.length === 0 
        ? `Successfully parsed ${imported} rows`
        : `Parsed with ${errors.length} errors`,
      data: parsedRows
    };
  } catch (error) {
    logger.error('Failed to parse CSV', error as Error);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [{
        row: 0,
        column: '',
        value: '',
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      message: 'Failed to parse CSV file',
    };
  }
}

// === EXCEL PARSER ===

export async function parseExcelData(
  excelBuffer: ArrayBuffer | Buffer,
  dataType: 'students' | 'teachers' | 'classes',
  sheetName?: string
): Promise<ImportResult> {
  try {
    // Dynamic import to avoid build issues if xlsx not installed
    const XLSX = await import('xlsx');

    // Read the workbook
    const workbook = XLSX.read(excelBuffer, { type: 'array' });

    // Get the worksheet (use first sheet if not specified)
    const worksheetName = sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];

    if (!worksheet) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          row: 0,
          column: '',
          value: '',
          message: `Worksheet "${worksheetName}" not found`
        }],
        message: 'Invalid worksheet',
      };
    }

    // Convert to JSON with header option
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Return array of arrays
      raw: false, // Format dates as strings
      defval: '' // Default value for empty cells
    }) as string[][];

    if (jsonData.length < 2) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          row: 0,
          column: '',
          value: '',
          message: 'Excel file is empty or contains only headers'
        }],
        message: 'Invalid Excel format',
      };
    }

    // Parse headers (first row)
    const headers = jsonData[0].map(h => String(h || ''));
    const mappings = getColumnMappings(dataType, headers);

    // Parse data rows
    const parsedRows: ParsedRow[] = [];
    const errors: ValidationError[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip empty rows
      if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
        skipped++;
        continue;
      }

      const rowData: Record<string, any> = {};
      const rowErrors: ValidationError[] = [];

      // Map values to fields
      mappings.forEach((mapping, index) => {
        const value = row[index];
        if (mapping && value !== undefined && value !== null) {
          const stringValue = String(value).trim();
          const processed = processValue(stringValue, mapping.type);

          // Validate required fields
          if (mapping.required && !processed) {
            rowErrors.push({
              row: i + 1,
              column: mapping.sourceColumn,
              value: stringValue,
              message: `${mapping.sourceColumn} is required`
            });
          }

          // Apply custom validation
          if (processed && mapping.validate && !mapping.validate(processed)) {
            rowErrors.push({
              row: i + 1,
              column: mapping.sourceColumn,
              value: stringValue,
              message: `Invalid ${mapping.type} format`
            });
          }

          // Apply transform if provided
          const finalValue = mapping.transform ? mapping.transform(processed) : processed;
          rowData[mapping.targetField] = finalValue;
        } else if (mapping && mapping.required) {
          rowErrors.push({
            row: i + 1,
            column: mapping.sourceColumn,
            value: '',
            message: `${mapping.sourceColumn} is required`
          });
        }
      });

      // Validate using schema
      const schema = getSchemaForType(dataType);
      const validation = schema.safeParse(rowData);

      if (!validation.success) {
        validation.error.issues.forEach((err: any) => {
          rowErrors.push({
            row: i + 1,
            column: err.path.join('.'),
            value: rowData[err.path[0]],
            message: err.message
          });
        });
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        skipped++;
      } else {
        parsedRows.push({
          row: i + 1,
          data: rowData,
          errors: []
        });
        imported++;
      }
    }

    return {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
      message: errors.length === 0
        ? `Successfully parsed ${imported} rows from Excel`
        : `Parsed Excel with ${errors.length} errors`,
      data: parsedRows
    };
  } catch (error) {
    logger.error('Failed to parse Excel', error as Error);

    // Check if xlsx module is installed
    if (error instanceof Error && error.message.includes("Cannot find module 'xlsx'")) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          row: 0,
          column: '',
          value: '',
          message: 'Excel parsing requires xlsx library. Installing...'
        }],
        message: 'xlsx library not found',
      };
    }

    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [{
        row: 0,
        column: '',
        value: '',
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      message: 'Failed to parse Excel file',
    };
  }
}

// === HELPER FUNCTIONS ===

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function processValue(value: string, type: string): any {
  if (!value || value === '') return null;
  
  switch (type) {
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    case 'boolean':
      return value.toLowerCase() === 'true' || value === '1';
    case 'date':
      // Try to parse various date formats
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toISOString().split('T')[0];
    default:
      return value.trim();
  }
}

function getSchemaForType(dataType: string) {
  switch (dataType) {
    case 'students':
      return studentSchema;
    case 'teachers':
      return teacherSchema;
    case 'classes':
      return classSchema;
    default:
      return z.object({});
  }
}

function getColumnMappings(
  dataType: string,
  headers: string[]
): (ColumnMapping | null)[] {
  const mappingConfigs = getMappingConfig(dataType);
  
  return headers.map(header => {
    const normalized = normalizeHeader(header);
    const config = mappingConfigs.find(c => 
      normalizeHeader(c.sourceColumn) === normalized ||
      c.alternateNames?.some(alt => normalizeHeader(alt) === normalized)
    );
    
    return config || null;
  });
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

interface MappingConfig extends ColumnMapping {
  alternateNames?: string[];
}

function getMappingConfig(dataType: string): MappingConfig[] {
  switch (dataType) {
    case 'students':
      return [
        {
          sourceColumn: 'First Name',
          alternateNames: ['firstname', 'fname', 'given name'],
          targetField: 'firstName',
          required: true,
          type: 'string'
        },
        {
          sourceColumn: 'Last Name',
          alternateNames: ['lastname', 'lname', 'surname', 'family name'],
          targetField: 'lastName',
          required: true,
          type: 'string'
        },
        {
          sourceColumn: 'Email',
          alternateNames: ['email address', 'student email'],
          targetField: 'email',
          required: false,
          type: 'email',
          validate: (v) => emailSchema.safeParse(v).success
        },
        {
          sourceColumn: 'Date of Birth',
          alternateNames: ['dob', 'birth date', 'birthday'],
          targetField: 'dateOfBirth',
          required: false,
          type: 'date'
        },
        {
          sourceColumn: 'Grade',
          alternateNames: ['grade level', 'year', 'class'],
          targetField: 'grade',
          required: false,
          type: 'string'
        },
        {
          sourceColumn: 'Student ID',
          alternateNames: ['id', 'student number', 'student code'],
          targetField: 'studentId',
          required: false,
          type: 'string'
        },
        {
          sourceColumn: 'Guardian Name',
          alternateNames: ['parent name', 'parent', 'guardian'],
          targetField: 'guardianName',
          required: false,
          type: 'string'
        },
        {
          sourceColumn: 'Guardian Email',
          alternateNames: ['parent email'],
          targetField: 'guardianEmail',
          required: false,
          type: 'email',
          validate: (v) => emailSchema.safeParse(v).success
        },
        {
          sourceColumn: 'Guardian Phone',
          alternateNames: ['parent phone', 'contact number'],
          targetField: 'guardianPhone',
          required: false,
          type: 'phone',
          validate: (v) => phoneSchema.safeParse(v).success
        }
      ];
      
    case 'teachers':
      return [
        {
          sourceColumn: 'First Name',
          alternateNames: ['firstname', 'fname', 'given name'],
          targetField: 'firstName',
          required: true,
          type: 'string'
        },
        {
          sourceColumn: 'Last Name',
          alternateNames: ['lastname', 'lname', 'surname'],
          targetField: 'lastName',
          required: true,
          type: 'string'
        },
        {
          sourceColumn: 'Email',
          alternateNames: ['email address', 'teacher email'],
          targetField: 'email',
          required: true,
          type: 'email',
          validate: (v) => emailSchema.safeParse(v).success
        },
        {
          sourceColumn: 'Phone',
          alternateNames: ['phone number', 'contact', 'mobile'],
          targetField: 'phone',
          required: false,
          type: 'phone',
          validate: (v) => phoneSchema.safeParse(v).success
        },
        {
          sourceColumn: 'Department',
          alternateNames: ['dept', 'subject area'],
          targetField: 'department',
          required: false,
          type: 'string'
        },
        {
          sourceColumn: 'Employee ID',
          alternateNames: ['id', 'teacher id', 'staff id'],
          targetField: 'employeeId',
          required: false,
          type: 'string'
        }
      ];
      
    case 'classes':
      return [
        {
          sourceColumn: 'Class Name',
          alternateNames: ['name', 'title', 'course name'],
          targetField: 'name',
          required: true,
          type: 'string'
        },
        {
          sourceColumn: 'Class Code',
          alternateNames: ['code', 'course code', 'id'],
          targetField: 'code',
          required: true,
          type: 'string'
        },
        {
          sourceColumn: 'Teacher',
          alternateNames: ['instructor', 'teacher name'],
          targetField: 'teacher',
          required: false,
          type: 'string'
        },
        {
          sourceColumn: 'Room',
          alternateNames: ['classroom', 'location'],
          targetField: 'room',
          required: false,
          type: 'string'
        },
        {
          sourceColumn: 'Capacity',
          alternateNames: ['max students', 'size'],
          targetField: 'capacity',
          required: false,
          type: 'number'
        }
      ];
      
    default:
      return [];
  }
}

// === EXPORT TEMPLATES ===

export function generateCsvTemplate(dataType: string): string {
  const config = getMappingConfig(dataType);
  const headers = config.map(c => c.sourceColumn);
  const exampleRow = config.map(c => {
    switch (c.type) {
      case 'email': return 'example@school.edu';
      case 'phone': return '555-0123';
      case 'date': return '2010-01-15';
      case 'number': return '30';
      default: return 'Example';
    }
  });

  return [
    headers.join(','),
    exampleRow.join(',')
  ].join('\n');
}

export async function generateExcelTemplate(dataType: string): Promise<Buffer> {
  try {
    const XLSX = await import('xlsx');

    const config = getMappingConfig(dataType);
    const headers = config.map(c => c.sourceColumn);

    // Create example rows based on data type
    const exampleRows: string[][] = [];

    switch (dataType) {
      case 'students':
        exampleRows.push(
          ['John', 'Doe', 'john.doe@school.edu', '2010-01-15', '10A', 'STU001', 'Jane Doe', 'jane.doe@parent.com', '555-0123'],
          ['Jane', 'Smith', 'jane.smith@school.edu', '2010-03-20', '10B', 'STU002', 'Bob Smith', 'bob.smith@parent.com', '555-0124']
        );
        break;
      case 'teachers':
        exampleRows.push(
          ['Alice', 'Johnson', 'alice.johnson@school.edu', '555-0125', 'Mathematics', 'TCH001'],
          ['Bob', 'Williams', 'bob.williams@school.edu', '555-0126', 'Science', 'TCH002']
        );
        break;
      case 'classes':
        exampleRows.push(
          ['Math 101', 'MATH101', 'Alice Johnson', 'Room 101', '30'],
          ['Science 101', 'SCI101', 'Bob Williams', 'Lab 1', '25']
        );
        break;
    }

    // Create worksheet data
    const wsData = [headers, ...exampleRows];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-size columns
    const colWidths = headers.map((header, i) => {
      const maxLength = Math.max(
        header.length,
        ...exampleRows.map(row => String(row[i] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 30) }; // Cap at 30 chars
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, dataType.charAt(0).toUpperCase() + dataType.slice(1));

    // Write to buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  } catch (error) {
    logger.error('Failed to generate Excel template', error as Error);
    throw new Error('Failed to generate Excel template');
  }
}

// === VALIDATION HELPERS ===

export function validateImportFile(
  file: File | { name: string; size: number; type: string }
): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const ALLOWED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit'
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    // Fallback to extension check
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload CSV or Excel files only'
      };
    }
  }

  return { valid: true };
}

export function getFileType(filename: string): 'csv' | 'excel' | 'unknown' {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (extension === 'csv') return 'csv';
  if (extension === 'xls' || extension === 'xlsx') return 'excel';
  return 'unknown';
}