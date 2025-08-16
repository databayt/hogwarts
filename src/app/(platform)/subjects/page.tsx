import SubjectsContent from '@/components/platform/subjects/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Subjects' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <SubjectsContent searchParams={searchParams} />
}
