import ExamsContent from '@/components/platform/exams/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Exams' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ExamsContent searchParams={searchParams} />
}
