import { ProfileContent } from '@/components/platform/profile/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = { title: 'Dashboard: Profile' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
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

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  // Verify dictionary has required data
  if (!dictionary) {
    console.error('[Profile Page] Dictionary is undefined')
    throw new Error('Failed to load dictionary')
  }

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent dictionary={dictionary} lang={lang} />
    </Suspense>
  )
}


