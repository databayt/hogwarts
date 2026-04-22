// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { Button } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PaymentContent from "@/components/school-marketing/application/payment/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const d = await getDictionary(lang)
  const steps = d?.school?.admission?.apply?.steps
  return {
    title: `${steps?.payment?.title ?? "Payment"} | ${(d?.school?.admission as Record<string, unknown>)?.title ?? "Apply"}`,
    description: steps?.payment?.description ?? "Pay your application fee.",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{
    number?: string
    cancelled?: string
    token?: string
  }>
}

export default async function PaymentPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams

  const { subdomain, id: applicationId, lang } = resolvedParams
  const accessToken = resolvedSearch.token

  const dictionary = await getDictionary(lang)
  const paymentDict = (
    dictionary as unknown as {
      school?: { admission?: { apply?: { payment?: Record<string, string> } } }
    }
  )?.school?.admission?.apply?.payment

  const renderInvalidLink = () => (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <svg
          className="h-8 w-8 text-amber-600 dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold">
        {paymentDict?.invalidLinkTitle || "Invalid payment link"}
      </h2>
      <p className="text-muted-foreground text-sm">
        {paymentDict?.invalidLinkDescription ||
          "This payment link is invalid or has expired. Please check your email for a valid link, or contact the school for help."}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href={`/${lang}/application/status`}>
            {paymentDict?.goToStatus || "Check application status"}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/${lang}`}>{paymentDict?.goToHome || "Home"}</Link>
        </Button>
      </div>
    </div>
  )

  // Access token is required to prevent IDOR attacks
  if (!accessToken) {
    return renderInvalidLink()
  }

  // Resolve school
  const schoolResult = await getSchoolBySubdomain(subdomain)
  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  const schoolId = schoolResult.data.id
  const currency = schoolResult.data.currency ?? "USD"

  // Fetch application + campaign fee from DB (never trust URL params for these)
  // accessToken in where clause ensures the caller owns this application
  const application = await db.application.findFirst({
    where: { id: applicationId, schoolId, accessToken },
    select: {
      id: true,
      applicationNumber: true,
      applicationFeePaid: true,
      accessToken: true,
      status: true,
      campaign: {
        select: { applicationFee: true },
      },
    },
  })

  if (!application) {
    return renderInvalidLink()
  }

  // Already paid guard
  if (application.applicationFeePaid) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
          <svg
            className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">
          {paymentDict?.paymentConfirmed}
        </h2>
        <p className="text-muted-foreground text-sm">
          {paymentDict?.paymentAlreadyRecorded}
        </p>
      </div>
    )
  }

  const fee = Number(application.campaign.applicationFee ?? 0)

  // Resolve available payment gateways from admission settings
  const settings = await db.admissionSettings.findUnique({
    where: { schoolId },
    select: { paymentMethods: true, enableOnlinePayment: true },
  })

  const defaultMethods = ["stripe", "cash"]
  let methods = Array.isArray(settings?.paymentMethods)
    ? (settings.paymentMethods as string[])
    : defaultMethods

  // When online payment is disabled, filter out electronic gateways
  if (!settings?.enableOnlinePayment) {
    methods = methods.filter((m) => m !== "stripe" && m !== "tap")
    // Ensure at least cash is available
    if (methods.length === 0) methods = ["cash"]
  }

  return (
    <PaymentContent
      applicationNumber={resolvedSearch.number ?? application.applicationNumber}
      applicationId={application.id}
      accessToken={accessToken}
      fee={fee}
      currency={currency}
      methods={methods}
      locale={lang}
      dictionary={dictionary}
    />
  )
}
