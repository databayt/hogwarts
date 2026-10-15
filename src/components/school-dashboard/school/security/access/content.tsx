// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Key, Shield, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  enumLabel,
  fill,
  formatConsoleNumber,
} from "@/components/school-dashboard/school/format"

import { getPermissionMatrix, getRoleStats } from "./actions"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function AccessContent({ dictionary, lang }: Props) {
  const t = dictionary.schoolConsole.access
  const [roleStats, permissionMatrix] = await Promise.all([
    getRoleStats(),
    getPermissionMatrix(),
  ])

  return (
    <div className="space-y-6">
      {/* Role Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(roleStats).map(([role, stats]) => (
          <Card key={role}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                {enumLabel(t.roles, role)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatConsoleNumber(stats.count, lang)}
                </span>
                <div className="text-end">
                  <div className="flex items-center gap-1 text-xs">
                    <Key className="h-3 w-3" />
                    {fill(t.withTwoFactor, {
                      count: formatConsoleNumber(stats.twoFactorCount, lang),
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.matrixTitle}
          </CardTitle>
          <CardDescription>{t.matrixDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(permissionMatrix).map(([role, permissions]) => (
              <div key={role} className="space-y-2">
                <h4 className="font-medium">{enumLabel(t.roles, role)}</h4>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm) => (
                    <Badge key={perm} variant="secondary">
                      {enumLabel(t.permissions, perm)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
