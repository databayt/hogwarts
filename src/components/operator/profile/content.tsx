"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { EmptyState } from "@/components/operator/common/empty-state";
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export function ProfileContent(props: Props) {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <EmptyState 
          title="Profile Management Coming Soon" 
          description="Profile management features are under development." 
        />
      </div>
    </PageContainer>
  );
}
