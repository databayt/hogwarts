"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

export default function StudentSettingsContent({ dictionary, lang }: Props) {
  const d = dictionary?.students

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.settings?.title || "Student Settings"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">
            {d?.settings?.description ||
              "Grading scales, promotion rules, and module configurations will be available here."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
