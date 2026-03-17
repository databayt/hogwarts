// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { EmptyState } from "@/components/saas-dashboard/common/empty-state"

import type { UserRow } from "./actions"
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

export async function UsersContent({ dictionary, lang, searchParams }: Props) {
  const limit = Number(searchParams?.limit) || 20
  const userData = await getUsers(searchParams)

  return userData.rows.length > 0 ? (
    <UsersTable
      initialData={userData.rows}
      total={userData.total}
      perPage={limit}
    />
  ) : (
    <EmptyState
      title="No users found"
      description="Users will appear here once they register on the platform."
    />
  )
}
