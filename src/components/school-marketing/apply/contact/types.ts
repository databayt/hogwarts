// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Contact Step Types

export interface ContactFormData {
  email: string
  phone: string
  alternatePhone?: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface ContactFormRef {
  saveAndNext: () => Promise<void>
}

export interface ContactFormProps {
  sessionToken?: string
  initialData?: Partial<ContactFormData>
  onSuccess?: () => void
  dictionary?: Record<string, unknown>
}
