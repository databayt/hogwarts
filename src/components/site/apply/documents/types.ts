// Documents Step Types

export interface DocumentUpload {
  type: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface DocumentsFormData {
  photoUrl?: string;
  signatureUrl?: string;
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
