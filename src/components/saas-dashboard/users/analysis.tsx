// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { AlertTriangle, Shield, Users, UserX } from "lucide-react"

import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function getUserStats() {
  const [totalUsers, usersWithSchool, orphanedUsers, suspendedUsers] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { NOT: { schoolId: null } } }),
      db.user.count({
        where: { schoolId: null, role: "USER", NOT: { role: "DEVELOPER" } },
      }),
      db.user.count({ where: { isSuspended: true } }),
    ])

  return { totalUsers, usersWithSchool, orphanedUsers, suspendedUsers }
}

export async function UsersAnalysis() {
  const stats = await getUserStats()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              All platform accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Schools</CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.usersWithSchool.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              Associated with a school
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orphaned</CardTitle>
            <UserX className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.orphanedUsers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              No school, role USER
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.suspendedUsers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Account suspended</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
