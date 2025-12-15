// Personal Step Types

export interface PersonalFormData {
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE" | "OTHER"
  nationality: string
  religion?: string
  category?: string
}

export interface PersonalFormRef {
  saveAndNext: () => Promise<void>
}

export interface PersonalFormProps {
  sessionToken?: string
  initialData?: Partial<PersonalFormData>
  onSuccess?: () => void
  dictionary?: Record<string, unknown>
}
