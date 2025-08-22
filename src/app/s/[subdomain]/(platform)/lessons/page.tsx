import LessonsContent from '@/components/platform/lessons/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Lessons' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <LessonsContent searchParams={searchParams} />
}
