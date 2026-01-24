import { SearchParams } from "nuqs/server"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
}

export default async function ClassScheduleContent({
  searchParams,
  dictionary,
}: Props) {
  const d = dictionary?.classes

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.schedule?.title || "Class Schedule"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">
            {d?.schedule?.description ||
              "Class schedules with time and room allocation will be displayed here."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
