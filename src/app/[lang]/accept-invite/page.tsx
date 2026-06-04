// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { isInvitationExpired } from "@/lib/invitation-utils"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { AcceptInviteForm } from "./form"

interface AcceptInvitePageProps {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptInvitePage({
  params,
  searchParams,
}: AcceptInvitePageProps) {
  const { lang } = await params
  const { token } = await searchParams
  const dictionary = await getDictionary(lang)
  const t = dictionary.acceptInvite

  if (!token) {
    return (
      <InviteCard>
        <h2 className="text-xl font-semibold">{t.invalidLinkTitle}</h2>
        <p className="text-muted-foreground">{t.invalidLinkDescription}</p>
      </InviteCard>
    )
  }

  const request = await db.membershipRequest.findUnique({
    where: { invitationToken: token },
    include: {
      school: { select: { id: true, name: true, domain: true } },
    },
  })

  if (!request) {
    return (
      <InviteCard>
        <h2 className="text-xl font-semibold">{t.notFoundTitle}</h2>
        <p className="text-muted-foreground">{t.notFoundDescription}</p>
      </InviteCard>
    )
  }

  if (request.status !== "PENDING") {
    const isApproved = request.status === "APPROVED"
    return (
      <InviteCard>
        <h2 className="text-xl font-semibold">
          {isApproved ? t.alreadyAcceptedTitle : t.alreadyDeclinedTitle}
        </h2>
        <p className="text-muted-foreground">
          {isApproved
            ? t.alreadyAcceptedDescription
            : t.alreadyDeclinedDescription}
        </p>
        {isApproved && request.school.domain && (
          <Link
            href={`https://${request.school.domain}.databayt.org`}
            className="mt-4 inline-block underline"
          >
            {t.goToSchool.replace("{school}", request.school.name)}
          </Link>
        )}
      </InviteCard>
    )
  }

  if (isInvitationExpired(request.expiresAt)) {
    return (
      <InviteCard>
        <h2 className="text-xl font-semibold">{t.expiredTitle}</h2>
        <p className="text-muted-foreground">{t.expiredDescription}</p>
      </InviteCard>
    )
  }

  const session = await auth()

  if (!session?.user) {
    const callbackUrl = encodeURIComponent(
      `/${lang}/accept-invite?token=${token}`
    )
    return (
      <InviteCard>
        <h2 className="text-xl font-semibold">
          {t.invitedTitle.replace("{school}", request.school.name)}
        </h2>
        <p className="text-muted-foreground">
          {t.roleLabel}{" "}
          <span className="font-medium">{request.requestedRole}</span>
        </p>
        <p className="text-muted-foreground mt-2">{t.signInPrompt}</p>
        <Link
          href={`/${lang}/login?callbackUrl=${callbackUrl}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-medium"
        >
          {t.signInToAccept}
        </Link>
      </InviteCard>
    )
  }

  return (
    <InviteCard>
      <h2 className="text-xl font-semibold">
        {t.invitedTitle.replace("{school}", request.school.name)}
      </h2>
      <p className="text-muted-foreground">
        {t.roleLabel}{" "}
        <span className="font-medium">{request.requestedRole}</span>
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {t.signedInAs.replace("{email}", session.user.email ?? "")}
      </p>
      <AcceptInviteForm
        token={token}
        schoolDomain={request.school.domain || ""}
        lang={lang}
        dictionary={t}
      />
    </InviteCard>
  )
}

function InviteCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-lg border p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          {children}
        </div>
      </div>
    </div>
  )
}
