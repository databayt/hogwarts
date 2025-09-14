import EventsContent from '@/components/platform/events/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Events' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <EventsContent searchParams={searchParams} />
}
