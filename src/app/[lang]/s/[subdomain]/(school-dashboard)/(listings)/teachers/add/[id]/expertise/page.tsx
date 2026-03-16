// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  getGradesAndSubjects,
  type GradeWithSubjects,
} from "@/components/school-dashboard/listings/teachers/wizard/expertise/actions"
import ExpertiseContent from "@/components/school-dashboard/listings/teachers/wizard/expertise/content"

export default async function ExpertisePage() {
  const result = await getGradesAndSubjects()
  const grades: GradeWithSubjects[] = result.success ? (result.data ?? []) : []

  return <ExpertiseContent grades={grades} />
}
