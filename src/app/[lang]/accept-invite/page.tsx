// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { isInvitationExpired } from "@/lib/invitation-utils"

import { AcceptInviteForm } from "./form"

interface AcceptInvitePageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptInvitePage({
  params,
  searchParams,
}: AcceptInvitePageProps) {
  const { lang } = await params
  const { token } = await searchParams

  if (!token) {
    return (
      <InviteCard>
        <h2 className="text-xl font-semibold">Invalid Link</h2>
        <p className="text-muted-foreground">
          This invitation link is missing a token. Please check the link from
          your email.
        </p>
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
        <h2 className="text-xl font-semibold">Invitation Not Found</h2>
        <p className="text-muted-foreground">
          This invitation link is invalid or has already been used.
        </p>
      </InviteCard>
    )
  }

  if (request.status !== "PENDING") {
    return (
      <InviteCard>
        <h2 className="text-xl font-semibold">
          Invitation Already{" "}
          {request.status === "APPROVED" ? "Accepted" : "Declined"}
        </h2>
        <p className="text-muted-foreground">
          This invitation has already been{" "}
          {request.status === "APPROVED" ? "accepted" : "declined"}.
        </p>
        {request.status === "APPROVED" && request.school.domain && (
          <Link
            href={`https://${request.school.domain}.databayt.org`}
            className="mt-4 inline-block underline"
          >
            Go to {request.school.name}
          </Link>
        )}
      </InviteCard>
    )
  }

  if (isInvitationExpired(request.expiresAt)) {
    return (
      <InviteCard>
        <h2 className="text-xl font-semibold">Invitation Expired</h2>
        <p className="text-muted-foreground">
          This invitation has expired. Please contact the school administrator
          to request a new one.
        </p>
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
          You have been invited to join {request.school.name}
        </h2>
        <p className="text-muted-foreground">
          Role: <span className="font-medium">{request.requestedRole}</span>
        </p>
        <p className="text-muted-foreground mt-2">
          Please sign in to accept this invitation.
        </p>
        <Link
          href={`/${lang}/login?callbackUrl=${callbackUrl}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-medium"
        >
          Sign in to accept
        </Link>
      </InviteCard>
    )
  }

  return (
    <InviteCard>
      <h2 className="text-xl font-semibold">
        You have been invited to join {request.school.name}
      </h2>
      <p className="text-muted-foreground">
        Role: <span className="font-medium">{request.requestedRole}</span>
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        Signed in as {session.user.email}
      </p>
      <AcceptInviteForm
        token={token}
        schoolDomain={request.school.domain || ""}
        lang={lang}
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
