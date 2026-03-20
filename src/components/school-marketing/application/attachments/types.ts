// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface AttachmentsFormRef {
  saveAndNext: () => Promise<void>
}

export interface AttachmentsFormProps {
  initialData?: Record<string, string>
  onSuccess?: () => void
  dictionary?: Record<string, unknown>
}
