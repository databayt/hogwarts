import { SearchParams } from "nuqs/server"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
}

export default async function EventCategoriesContent({
  searchParams,
  dictionary,
}: Props) {
  const d = dictionary?.events

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.categories?.title || "Event Categories"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">
            {d?.categories?.description ||
              "Manage event categories like academic, sports, cultural events."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
