import AssignmentsContent from '@/components/platform/assignments/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Assignments' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <AssignmentsContent searchParams={searchParams} />
}
