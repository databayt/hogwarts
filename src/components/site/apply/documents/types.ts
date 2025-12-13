// Documents Step Types

/**
 * File reference from upload system
 */
export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number;
  uploadedAt?: string;
}

/**
 * Document upload with category type
 */
export interface DocumentUpload {
  type: string;        // Document category (e.g., 'birth_certificate', 'previous_report')
  name: string;        // Display name
  url: string;         // File URL
  uploadedAt: string;  // ISO date string
  fileId?: string;     // Optional file ID from upload system
  size?: number;       // File size in bytes
}

export interface DocumentsFormData {
  photoUrl?: string;
  signatureUrl?: string;
  photo?: UploadedFile;
  signature?: UploadedFile;
  documents?: DocumentUpload[];
}

export interface DocumentsFormRef {
  saveAndNext: () => Promise<void>;
}

export interface DocumentsFormProps {
  sessionToken?: string;
  initialData?: Partial<DocumentsFormData>;
  onSuccess?: () => void;
  dictionary?: Record<string, unknown>;
}
