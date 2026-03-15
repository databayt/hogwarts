// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

import { getSubjectRoomAssignments } from "./actions"
import { SubjectRoomForm } from "./form"

interface Props {
  lang: Locale
}

export default async function SubjectRoomContent({ lang }: Props) {
  const result = await getSubjectRoomAssignments(lang)

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          {result.error || "Failed to load subject room assignments."}
        </CardContent>
      </Card>
    )
  }

  const grades = result.data

  if (grades.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          No grades configured. Set up academic grades first.
        </CardContent>
      </Card>
    )
  }

  const hasAnyClasses = grades.some((g) => g.classes.length > 0)

  if (!hasAnyClasses) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          No classes found. Run Configure &gt; Generate Classes first.
        </CardContent>
      </Card>
    )
  }

  return <SubjectRoomForm grades={grades} />
}
