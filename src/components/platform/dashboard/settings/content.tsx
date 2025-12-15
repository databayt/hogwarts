import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"

import { Separator } from "@/components/ui/separator"
import { currentUser } from "@/components/auth/auth"
import { type Locale } from "@/components/internationalization/config"
import { type getDictionary } from "@/components/internationalization/dictionaries"
import { UserRoleForm } from "@/components/marketing/pricing/forms/user-role-form"
import { DeleteAccountSection } from "@/components/platform/dashboard/delete-account"
import { DashboardHeader } from "@/components/platform/dashboard/header"
import { UserNameForm } from "@/components/platform/dashboard/settings/user-name-form"
import { RoleSwitcher } from "@/components/platform/settings/role-switcher"

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string
  email?: string | null
  role?: string
  schoolId?: string | null
  name?: string | null
}

interface SettingsContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default async function SettingsContent({
  dictionary,
  lang,
}: SettingsContentProps) {
  const user = (await currentUser()) as ExtendedUser | null

  if (!user?.id) redirect("/login")

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Manage account and website settings."
      />
      <div className="space-y-8 py-4 pb-10">
        <div className="bg-muted flex flex-col rounded-lg px-6">
          <UserNameForm user={{ id: user.id, name: user.name || "" }} />
          <Separator />
          <UserRoleForm user={{ id: user.id, role: user.role as UserRole }} />
        </div>

        {/* Role Switcher for testing different lab views */}
        <RoleSwitcher
          currentRole={user.role as UserRole}
          currentUserId={user.id}
          schoolId={user.schoolId || undefined}
        />

        <DeleteAccountSection />
      </div>
    </>
  )
}
