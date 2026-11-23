// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ContributeBookContent } from "@/components/library/contribute/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.library, b?.contribute].every(Boolean)
      ? [b?.library, b?.contribute].join(" - ")
      : "Contribute a Book",
    description: "Contribute a book to the global catalog",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const ALLOWED_ROLES = ["ADMIN", "TEACHER", "DEVELOPER"]

export default async function ContributeBookPage({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang)

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
