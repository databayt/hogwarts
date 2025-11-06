import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
}

export default async function LessonResourcesContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.lessons

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.resources?.title || 'Lesson Resources'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.resources?.description || 'Resource library with materials and attachments will be managed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
