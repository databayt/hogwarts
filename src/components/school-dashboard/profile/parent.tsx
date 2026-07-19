"use client"

import Link from "next/link"
import { Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

import type { ProfileViewData } from "./queries"

interface ParentDashboardProps {
  data: ProfileViewData
  dictionary?: Record<string, any>
  lang?: Locale
}

export default function ParentDashboard({
  data,
  dictionary,
  lang,
}: ParentDashboardProps) {
  const pr = dictionary?.parent
  const children = data.roleDetail.children

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="text-primary size-5" />
            {pr?.children ?? ""}
          </CardTitle>
          <CardDescription>{pr?.childrenDescription ?? ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {pr?.noChildren ?? ""}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/${lang ?? "ar"}/profile/${child.id}`}
                  className="border-border bg-card hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <Avatar className="size-10 shrink-0">
                    {child.photoUrl && (
                      <AvatarImage src={child.photoUrl} alt={child.name} />
                    )}
                    <AvatarFallback>
                      {child.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{child.name}</p>
                    {child.sectionName && (
                      <p className="text-muted-foreground truncate text-xs">
                        {child.sectionName}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
