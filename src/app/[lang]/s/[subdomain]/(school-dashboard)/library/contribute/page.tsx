// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { ContributeBookContent } from "@/components/library/contribute/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Contribute a Book",
  description: "Contribute a book to the global catalog",
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const ALLOWED_ROLES = ["ADMIN", "TEACHER", "DEVELOPER"]

export default async function ContributeBookPage({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  if (!session?.user?.id) {
    redirect("/library")
  }

  if (!ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/library")
  }

  return (
    <>
      <PageHeadingSetter title="Contribute a Book" />
      <ContributeBookContent lang={lang} />
    </>
  )
}
