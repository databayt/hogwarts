/**
 * Import Parser for CSV and Excel files
 * Provides utilities to parse and validate bulk data imports
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
        validation.error.errors.forEach(err => {
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
  excelBuffer: ArrayBuffer,
  dataType: 'students' | 'teachers' | 'classes'
): Promise<ImportResult> {
  // Note: Excel parsing requires external library like xlsx or exceljs
  // This is a placeholder implementation
  
  return {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [{
      row: 0,
      column: '',
      value: '',
      message: 'Excel parsing requires xlsx library installation. Run: pnpm add xlsx'
    }],
    message: 'Excel import not yet implemented',
  };
  
  // Actual implementation would be:
  // const XLSX = await import('xlsx');
  // const workbook = XLSX.read(excelBuffer, { type: 'array' });
  // const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  // const jsonData = XLSX.utils.sheet_to_json(worksheet);
  // ... process jsonData similar to CSV
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