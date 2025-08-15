export type ImportSource = 'csv' | 'excel' | 'api' | 'manual';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DataType = 'students' | 'teachers' | 'staff' | 'classes' | 'guardians';

export interface ImportData {
  source: ImportSource;
  dataTypes: DataType[];
  file?: File;
  status: ImportStatus;
  progress?: number;
  errors?: ImportError[];
}

export interface ImportFormData {
  source: ImportSource;
  dataTypes: DataType[];
  file?: File;
}

export interface ImportError {
  row: number;
  column: string;
  value: string;
  message: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'email' | 'phone';
  validation?: string;
}

export interface DataTypeConfig {
  id: DataType;
  label: string;
  description: string;
  requiredColumns: string[];
  optionalColumns: string[];
  template?: string;
}
