"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { Mail, Phone, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

import type { ProfileViewData } from "./queries"

interface StudentGuardiansProps {
  data: ProfileViewData
  dictionary?: Record<string, any>
  lang?: Locale
}

/**
 * A student's guardians. Unlike the listings (which show one contact line, a
 * school setting), the profile shows both email and phone — for viewers who
 * may see contact details at all; the query nulls them for everyone else.
 */
export default function StudentGuardians({
  data,
  dictionary,
  lang,
}: StudentGuardiansProps) {
  const g = dictionary?.guardians
  const guardians = data.roleDetail.guardians

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="text-primary size-5" />
          {g?.title ?? "Guardians"}
        </CardTitle>
        <CardDescription>
          {g?.description ?? "Parents and guardians linked to this student."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {guardians.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {g?.empty ?? "No guardians linked yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {guardians.map((guardian) => (
              <div
                key={guardian.id}
                className="border-border bg-card flex items-start gap-3 rounded-lg border p-3"
              >
                <Avatar className="size-10 shrink-0">
                  {guardian.photoUrl && (
                    <AvatarImage src={guardian.photoUrl} alt={guardian.name} />
                  )}
                  <AvatarFallback>
                    {guardian.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/${lang ?? "ar"}/profile/${guardian.profileId}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {guardian.name}
                    </Link>
                    {guardian.isPrimary && (
                      <Badge variant="secondary" className="text-xs">
                        {g?.primary ?? "Primary"}
                      </Badge>
                    )}
                  </div>
                  {guardian.relation && (
                    <p className="text-muted-foreground text-xs">
                      {guardian.relation}
                    </p>
                  )}
                  {guardian.email && (
                    <a
                      href={`mailto:${guardian.email}`}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
                    >
                      <Mail className="size-3.5 shrink-0" />
                      <bdi dir="ltr" className="truncate">
                        {guardian.email}
                      </bdi>
                    </a>
                  )}
                  {guardian.phone && (
                    <a
                      href={`tel:${guardian.phone}`}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
                    >
                      <Phone className="size-3.5 shrink-0" />
                      <bdi dir="ltr" className="tabular-nums">
                        {guardian.phone}
                      </bdi>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
