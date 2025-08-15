export type StudentDTO = {
  id: string
  schoolId: string
  givenName: string
  middleName: string | null
  surname: string
  dateOfBirth: Date
  gender: string
  enrollmentDate: Date
  userId: string | null
  createdAt: Date
  updatedAt: Date
}

export type StudentRow = {
  id: string
  name: string
  className: string
  status: string
  createdAt: string
}


