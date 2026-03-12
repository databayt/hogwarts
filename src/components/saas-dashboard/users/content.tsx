// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { AlertTriangle, Shield, Users, UserX } from "lucide-react"

import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/saas-dashboard/common/empty-state"

import type { UserRow } from "./actions"
import { userColumns } from "./columns"
import { UsersTable } from "./table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  searchParams?: {
    page?: string
    limit?: string
    role?: string
    school?: string
    search?: string
  }
}

async function getUsers(searchParams: Props["searchParams"]) {
  const limit = Number(searchParams?.limit) || 20
  const page = Number(searchParams?.page) || 1
  const offset = (page - 1) * limit

  const where = {
    ...(searchParams?.role && searchParams.role !== "all"
      ? { role: searchParams.role as never }
      : {}),
    ...(searchParams?.school === "orphaned"
      ? {
          schoolId: null,
          role: "USER" as const,
          NOT: { role: "DEVELOPER" as const },
        }
      : searchParams?.school === "has-school"
        ? { NOT: { schoolId: null } }
        : {}),
    ...(searchParams?.search
      ? {
          OR: [
            {
              email: {
                contains: searchParams.search,
                mode: "insensitive" as const,
              },
            },
            {
              username: {
                contains: searchParams.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        schoolId: true,
        isSuspended: true,
        emailVerified: true,
        createdAt: true,
        school: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    db.user.count({ where }),
  ])

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    schoolId: u.schoolId,
    schoolName: u.school?.name ?? null,
    isSuspended: u.isSuspended,
    emailVerified: !!u.emailVerified,
    createdAt: u.createdAt.toISOString(),
  }))

  return { rows, total }
}

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

export async function UsersContent({ dictionary, lang, searchParams }: Props) {
  const limit = Number(searchParams?.limit) || 20

  const [userData, stats] = await Promise.all([
    getUsers(searchParams),
    getUserStats(),
  ])

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

      {/* Users Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">All Users</h3>
          {stats.orphanedUsers > 0 && (
            <span className="text-xs text-yellow-600">
              {stats.orphanedUsers} orphaned users
            </span>
          )}
        </div>

        {userData.rows.length > 0 ? (
          <UsersTable
            initialData={userData.rows}
            columns={userColumns}
            total={userData.total}
            perPage={limit}
          />
        ) : (
          <EmptyState
            title="No users found"
            description="Users will appear here once they register on the platform."
          />
        )}
      </div>
    </div>
  )
}
