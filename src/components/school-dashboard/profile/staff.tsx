"use client"

import { Building2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { ProfileViewData } from "./queries"

interface StaffDashboardProps {
  data: ProfileViewData
  dictionary?: Record<string, any>
}

export default function StaffDashboard({
  data,
  dictionary,
}: StaffDashboardProps) {
  const st = dictionary?.staff
  const orgs = data.organizations

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="text-primary size-5" />
            {st?.organizations ?? ""}
          </CardTitle>
          <CardDescription>
            {st?.organizationsDescription ?? ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {st?.noOrganizations ?? ""}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  className="border-border bg-card hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <Avatar className="size-9 shrink-0">
                    {org.avatarUrl && (
                      <AvatarImage src={org.avatarUrl} alt={org.name} />
                    )}
                    <AvatarFallback>
                      {org.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{org.name}</p>
                    {org.role && (
                      <p className="text-muted-foreground truncate text-xs">
                        {dictionary?.orgRoles?.[org.role] ?? org.role}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
