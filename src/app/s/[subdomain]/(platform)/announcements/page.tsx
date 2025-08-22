import AnnouncementsContent from '@/components/platform/announcements/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Announcements' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <AnnouncementsContent searchParams={searchParams} />
}


