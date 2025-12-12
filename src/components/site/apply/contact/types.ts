// Contact Step Types

export interface ContactFormData {
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ContactFormRef {
  saveAndNext: () => Promise<void>;
}

export interface ContactFormProps {
  sessionToken?: string;
  initialData?: Partial<ContactFormData>;
  onSuccess?: () => void;
  dictionary?: Record<string, unknown>;
}
