// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getSubjectRoomAssignments } from "./actions"
import { SubjectRoomForm } from "./form"

interface Props {
  lang: Locale
}

export default async function SubjectRoomContent({ lang }: Props) {
  const dictionary = await getDictionary(lang)
  const d = dictionary.school.classrooms
  const result = await getSubjectRoomAssignments(lang)

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          {result.error || d.failedToLoad}
        </CardContent>
      </Card>
    )
  }

  const grades = result.data

  if (grades.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          {d.noGradesConfigured}
        </CardContent>
      </Card>
    )
  }

  const hasAnyClasses = grades.some((g) => g.classes.length > 0)

  if (!hasAnyClasses) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          {d.noClassesFound}
        </CardContent>
      </Card>
    )
  }

  return <SubjectRoomForm grades={grades} />
}
