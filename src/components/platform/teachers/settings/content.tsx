"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

export default function TeacherSettingsContent({ dictionary, lang }: Props) {
  const d = dictionary?.teachers

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.settings?.title || "Teacher Settings"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">
            {d?.settings?.description ||
              "Module settings and configurations will be available here."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
