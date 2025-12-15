import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

export type LogFilters = {
  page: number
  perPage: number
  action?: string
  ip?: string
  from?: number | string
  to?: number | string
  level?: string
  requestId?: string
  tenantId?: string
}

export type UnifiedLog = {
  id: string
  createdAt: Date
  userId: string
  schoolId: string | null
  action: string
  reason: string | null
  ip: string | null
  userEmail?: string | null
  schoolName?: string | null
  level?: string | null
  requestId?: string | null
}

export async function fetchLogs(
  filters: LogFilters
): Promise<{ rows: UnifiedLog[]; total: number }> {
  const provider = process.env.NEXT_PUBLIC_LOG_PROVIDER ?? "db"
  switch (provider) {
    case "http": {
      const base = process.env.LOG_API_URL
      if (!base) throw new Error("LOG_API_URL not configured")
      const params = new URLSearchParams()
      params.set("page", String(filters.page))
      params.set("perPage", String(filters.perPage))
      if (filters.action) params.set("action", filters.action)
      if (filters.ip) params.set("ip", filters.ip)
      if (filters.level) params.set("level", filters.level)
      if (filters.requestId) params.set("requestId", filters.requestId)
      if (filters.tenantId) params.set("tenantId", filters.tenantId)
      if (filters.from) params.set("from", String(filters.from))
      if (filters.to) params.set("to", String(filters.to))

      const url = `${base.replace(/\/$/, "")}/logs?${params.toString()}`
      const res = await fetch(url, {
        headers: {
          Authorization: process.env.LOG_API_TOKEN
            ? `Bearer ${process.env.LOG_API_TOKEN}`
            : "",
        },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`Log provider error: ${res.status}`)
      const json = (await res.json()) as {
        total: number
        logs: Array<{
          id: string
          ts: string | number
          userId: string
          schoolId?: string | null
          action: string
          reason?: string | null
          ip?: string | null
          userEmail?: string | null
          schoolName?: string | null
          level?: string | null
          requestId?: string | null
        }>
      }
      const rows: UnifiedLog[] = json.logs.map((l) => ({
        id: l.id,
        createdAt: new Date(typeof l.ts === "string" ? l.ts : Number(l.ts)),
        userId: l.userId,
        schoolId: l.schoolId ?? null,
        action: l.action,
        reason: l.reason ?? null,
        ip: l.ip ?? null,
        userEmail: l.userEmail ?? null,
        schoolName: l.schoolName ?? null,
        level: l.level ?? null,
        requestId: l.requestId ?? null,
      }))
      return { rows, total: json.total }
    }
    case "db":
    default: {
      const where: Prisma.AuditLogWhereInput = {
        ...(filters.action
          ? { action: { contains: filters.action, mode: "insensitive" } }
          : {}),
        ...(filters.ip
          ? { ip: { contains: filters.ip, mode: "insensitive" } }
          : {}),
        ...(filters.tenantId ? { schoolId: filters.tenantId } : {}),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from
                  ? { gte: new Date(Number(filters.from)) }
                  : {}),
                ...(filters.to ? { lte: new Date(Number(filters.to)) } : {}),
              },
            }
          : {}),
      }
      const skip = (filters.page - 1) * filters.perPage
      const [logs, total] = await db.$transaction([
        db.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: filters.perPage,
        }),
        db.auditLog.count({ where }),
      ])
      const rows: UnifiedLog[] = await Promise.all(
        logs.map(async (l) => {
          const [user, school] = await Promise.all([
            db.user.findUnique({
              where: { id: l.userId },
              select: { email: true },
            }),
            l.schoolId
              ? db.school.findUnique({
                  where: { id: l.schoolId },
                  select: { name: true },
                })
              : Promise.resolve(null),
          ])
          return {
            id: l.id,
            createdAt: l.createdAt,
            userId: l.userId,
            schoolId: l.schoolId ?? null,
            action: l.action,
            reason: l.reason ?? null,
            ip: l.ip ?? null,
            userEmail: user?.email ?? null,
            schoolName: school?.name ?? null,
            level: null, // not available from DB provider
            requestId: null, // not available from DB provider
          } satisfies UnifiedLog
        })
      )
      return { rows, total }
    }
  }
}
