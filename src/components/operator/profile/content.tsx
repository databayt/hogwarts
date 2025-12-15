"use client"

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/operator/common/empty-state"
import { Shell as PageContainer } from "@/components/table/shell"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export function ProfileContent(props: Props) {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account settings and preferences
          </p>
        </div>
        <EmptyState
          title="Profile Management Coming Soon"
          description="Profile management features are under development."
        />
      </div>
    </PageContainer>
  )
}
