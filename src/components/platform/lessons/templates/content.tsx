import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function LessonTemplatesContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.lessons

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.templates?.title || 'Lesson Templates'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.templates?.description || 'Reusable lesson plan templates will be managed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
