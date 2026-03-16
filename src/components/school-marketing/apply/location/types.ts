// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface LocationFormData {
  address: string
  city: string
  state: string
  postalCode?: string
  country: string
}

export interface LocationFormRef {
  saveAndNext: () => Promise<void>
}

export interface LocationFormProps {
  initialData?: Partial<LocationFormData>
  onSuccess?: () => void
  dictionary?: Record<string, unknown>
}
