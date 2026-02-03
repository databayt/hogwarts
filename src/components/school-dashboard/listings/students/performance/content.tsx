import { SearchParams } from "nuqs/server"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
}

export default async function StudentPerformanceContent({
  searchParams,
  dictionary,
}: Props) {
  const d = dictionary?.students

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {d?.performance?.title || "Student Performance"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">
            {d?.performance?.description ||
              "Performance analytics, grade trends, and academic metrics will be displayed here."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
