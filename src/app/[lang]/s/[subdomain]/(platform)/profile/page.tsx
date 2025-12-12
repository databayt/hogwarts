import { ProfileContent } from '@/components/platform/profile/content'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = { title: 'Dashboard: Profile' }

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="lg:col-span-9">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}

export default async function Page() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  )
}


