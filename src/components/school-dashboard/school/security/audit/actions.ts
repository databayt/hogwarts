"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export async function getAuditLogs(filters?: {
  page?: number
  limit?: number
  action?: string
  entityType?: string
  userId?: string
  dateFrom?: Date
  dateTo?: Date
}) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!session?.user || !schoolId) throw new Error("Unauthorized")

  const page = filters?.page || 1
  const limit = filters?.limit || 20

  const where: any = { schoolId }

  if (filters?.action) where.action = { contains: filters.action }
  if (filters?.entityType) where.entityType = filters.entityType
  if (filters?.userId) where.userId = filters.userId

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {}
    if (filters?.dateFrom) where.createdAt.gte = filters.dateFrom
    if (filters?.dateTo) where.createdAt.lte = filters.dateTo
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        performer: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ])

  return { logs, total, page, limit }
}

export async function getAuditStats() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Unauthorized")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [totalEvents, eventsToday, uniqueActions, recentLoginFailures] =
    await Promise.all([
      db.auditLog.count({ where: { schoolId } }),
      db.auditLog.count({
        where: { schoolId, createdAt: { gte: today } },
      }),
      db.auditLog
        .findMany({
          where: { schoolId },
          select: { action: true },
          distinct: ["action"],
        })
        .then((r) => r.length),
      db.loginAttempt
        .count({
          where: { schoolId, success: false, timestamp: { gte: last24h } },
        })
        .catch(() => 0),
    ])

  return { totalEvents, eventsToday, uniqueActions, recentLoginFailures }
}
