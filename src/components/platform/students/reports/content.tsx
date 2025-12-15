import { SearchParams } from "nuqs/server"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
}

export default async function StudentReportsContent({
  searchParams,
  dictionary,
}: Props) {
  const d = dictionary?.students

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.reports?.title || "Student Reports"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">
            {d?.reports?.description ||
              "Report cards, transcripts, and progress reports will be generated here."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
