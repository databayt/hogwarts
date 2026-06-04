"use client"

import { asset } from "@/lib/asset-url"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ParentDashboardProps {
  data: Record<string, unknown>
  isOwner?: boolean
  dictionary?: Record<string, any>
}

interface Child {
  id: string
  firstName: string
  lastName: string
  profilePhotoUrl: string | null
}

export default function ParentDashboard({
  data,
  dictionary,
}: ParentDashboardProps) {
  const pa = dictionary?.parent
  // Real, tenant-scoped linked children derived in getProfileBasicData.
  const children = Array.isArray(data.children)
    ? (data.children as Child[])
    : []

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">
            {pa?.children ?? "Children"}
          </CardTitle>
          <CardDescription>
            {(pa?.childrenCount ?? "{count} linked").replace(
              "{count}",
              String(children.length)
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {children.length > 0 ? (
            <ul className="space-y-2">
              {children.map((c) => {
                const name = `${c.firstName} ${c.lastName}`.trim()
                return (
                  <li
                    key={c.id}
                    className="border-border flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Avatar className="size-9">
                      <AvatarImage
                        src={
                          c.profilePhotoUrl ??
                          asset("/photos/contributors-h.jpeg")
                        }
                        alt={name}
                      />
                      <AvatarFallback>
                        {(c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{name}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              {pa?.noChildren ?? "No children linked yet"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
