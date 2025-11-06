import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function YearLevelsContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.students

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.yearLevels?.title || 'Year Levels'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.yearLevels?.description || 'Students organized by year level will be displayed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
