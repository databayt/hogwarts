// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { UsersContent } from "@/components/saas-dashboard/users/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "User Management",
  description: "Manage platform user accounts",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Users({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Users" />
      <UsersContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
