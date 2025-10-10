import { DataTypeConfig, ImportSource } from './types';

export const IMPORT_SOURCES: { id: ImportSource; label: string; description: string }[] = [
  {
    id: 'csv',
    label: 'CSV File',
    description: 'Import data from a comma-separated values file',
  },
  {
    id: 'excel',
    label: 'Excel File',
    description: 'Import data from an Excel spreadsheet',
  },
  {
    id: 'api',
    label: 'API Integration',
    description: 'Connect to your existing system via API',
  },
  {
    id: 'manual',
    label: 'Manual Entry',
    description: 'Add records manually through the admin panel',
  },
] as const;

export const IMPORT_TYPES = IMPORT_SOURCES.map(source => ({
  value: source.id,
  label: source.label,
  description: source.description,
}));

export const SUPPORTED_FORMATS = ['csv', 'xlsx', 'xls'];

export const DATA_TYPES: DataTypeConfig[] = [
  {
    id: 'students',
    label: 'Students',
    description: 'Student enrollment records',
    requiredColumns: ['firstName', 'lastName', 'dateOfBirth', 'grade'],
    optionalColumns: ['email', 'phone', 'address', 'guardianEmail'],
    template: '/templates/student-import.csv',
  },
  {
    id: 'teachers',
    label: 'Teachers',
    description: 'Teaching staff records',
    requiredColumns: ['firstName', 'lastName', 'email', 'subjects'],
    optionalColumns: ['phone', 'qualifications', 'startDate'],
    template: '/templates/teacher-import.csv',
  },
  {
    id: 'staff',
    label: 'Staff',
    description: 'Non-teaching staff records',
    requiredColumns: ['firstName', 'lastName', 'email', 'role'],
    optionalColumns: ['phone', 'department', 'startDate'],
    template: '/templates/staff-import.csv',
  },
  {
    id: 'classes',
    label: 'Classes',
    description: 'Class and section records',
    requiredColumns: ['name', 'grade', 'teacher', 'subject'],
    optionalColumns: ['room', 'schedule', 'maxStudents'],
    template: '/templates/class-import.csv',
  },
  {
    id: 'guardians',
    label: 'Guardians',
    description: 'Parent/guardian records',
    requiredColumns: ['firstName', 'lastName', 'email', 'studentId'],
    optionalColumns: ['phone', 'relationship', 'address'],
    template: '/templates/guardian-import.csv',
  },
] as const;

export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  MAX_ROWS: 5000,
} as const;

export const IMPORT_MESSAGES = {
  FILE_TOO_LARGE: `File must be smaller than ${FILE_LIMITS.MAX_SIZE / (1024 * 1024)}MB`,
  INVALID_FILE_TYPE: 'Please upload a CSV or Excel file',
  TOO_MANY_ROWS: `File cannot contain more than ${FILE_LIMITS.MAX_ROWS} rows`,
  MISSING_COLUMNS: 'Required columns are missing',
  INVALID_FORMAT: 'File format is invalid',
  SELECT_DATA_TYPE: 'Please select at least one data type to import',
  PROCESSING_ERROR: 'Error processing file',
  VALIDATION_ERROR: 'Some records contain invalid data',
} as const;
