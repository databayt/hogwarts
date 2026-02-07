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

import { getPermissionMatrix, getRoleStats } from "./actions"

interface Props {
  lang: Locale
}

export default async function AccessContent({ lang }: Props) {
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
                {role}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.count}</span>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs">
                    <Key className="h-3 w-3" />
                    {stats.twoFactorCount} with 2FA
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
            Permission Matrix
          </CardTitle>
          <CardDescription>Permissions assigned to each role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(permissionMatrix).map(([role, permissions]) => (
              <div key={role} className="space-y-2">
                <h4 className="font-medium">{role}</h4>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm) => (
                    <Badge key={perm} variant="secondary">
                      {perm}
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
