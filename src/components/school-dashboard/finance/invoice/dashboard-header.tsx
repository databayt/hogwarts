// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SidebarTrigger } from "@/components/ui/sidebar"
import { currentUser } from "@/components/auth/auth"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import UserProfileDropDown from "./user-profile-dropdown"

interface DashboardHeaderProps {
  lang?: Locale
}

export default async function DashboardHeader({
  lang = "ar",
}: DashboardHeaderProps) {
  const user = await currentUser()
  const dictionary = await getDictionary(lang)
  const t = (dictionary as any)?.finance?.invoiceSidebar

  return (
    <header className="sticky top-0 flex h-14 w-full items-center border-b px-4 backdrop-blur-3xl">
      <SidebarTrigger />
      <div>
        {t?.welcome || "Welcome"}{" "}
        <span className="font-semibold">
          <span>{user?.name ?? "-"}</span>
        </span>
      </div>

      <div className="ms-auto w-fit">
        <UserProfileDropDown isArrowUp={false} isFullName={false} />
      </div>
    </header>
  )
}
