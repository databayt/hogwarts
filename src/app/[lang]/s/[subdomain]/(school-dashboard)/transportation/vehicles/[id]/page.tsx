// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { VehicleDetailContent } from "@/components/school-dashboard/transportation/vehicles/detail-content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.transportation?.vehicles?.title || "Vehicle",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

const ALLOWED_ROLES = ["DEVELOPER", "ADMIN", "STAFF"]

export default async function Page({ params }: Props) {
  const [{ lang, subdomain, id }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""

  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }
  if (!id) notFound()

  const dictionary = await getDictionary(lang)

  return (
    <VehicleDetailContent
      vehicleId={id}
      locale={lang}
      subdomain={subdomain}
      dictionary={dictionary}
    />
  )
}
