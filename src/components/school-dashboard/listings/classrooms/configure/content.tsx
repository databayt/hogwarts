import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

import { getGradeConfiguration } from "./actions"
import { ConfigureForm } from "./form"

interface Props {
  dictionary: any
  lang: Locale
}

export async function ConfigureContent({ dictionary, lang }: Props) {
  const result = await getGradeConfiguration()

  if (!result.success) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">
          {result.error}
        </CardContent>
      </Card>
    )
  }

  const { grades, roomTypes } = result.data

  if (roomTypes.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">
          Please set up classroom types first (e.g., &quot;Classroom&quot;,
          &quot;Lab&quot;) in the Rooms tab.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sections per Grade</CardTitle>
        <CardDescription>
          Configure how many sections each grade should have. Generating
          sections automatically creates both the class section and its assigned
          room.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfigureForm grades={grades} roomTypes={roomTypes} />
      </CardContent>
    </Card>
  )
}
