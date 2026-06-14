// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Conference observability — DEVELOPER-only, cross-tenant metrics derived from
// the DB. This is a saas-dashboard query, so it intentionally does NOT scope by
// schoolId (the platform operator sees every school). Live SFU-internal metrics
// (egress queue depth) require the SFU and are surfaced as "requires SFU".

import "server-only"

import { db } from "@/lib/db"

export type ConferenceObservability = {
  liveCount: number
  scheduledToday: number
  recordingsReady: number
  storageBytes: number
  totalParticipants: number
  tcpFallbackCount: number
  tcpFallbackRate: number
  liveBySchool: { schoolId: string; name: string; count: number }[]
  recentEvents: {
    id: string
    eventType: string
    occurredAt: Date
    schoolId: string
    sessionId: string
  }[]
}

export async function getConferenceObservability(): Promise<ConferenceObservability> {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const [
    liveCount,
    liveBySchool,
    scheduledToday,
    recordingAgg,
    tcpFallbackCount,
    totalParticipants,
    recentEvents,
  ] = await Promise.all([
    db.conference.count({ where: { status: "live", deletedAt: null } }),
    db.conference.groupBy({
      by: ["schoolId"],
      where: { status: "live", deletedAt: null },
      _count: { _all: true },
    }),
    db.conference.count({
      where: {
        status: "scheduled",
        deletedAt: null,
        scheduledStart: { gte: startOfDay, lte: endOfDay },
      },
    }),
    db.conferenceRecording.aggregate({
      where: { status: "ready", deletedAt: null },
      _count: { _all: true },
      _sum: { fileSizeBytes: true },
    }),
    // Scope the fallback rate to participants who actually connected —
    // hadTcpFallback can only be set on a real join, so counting invited-but-
    // never-joined rows in the denominator would understate the true rate.
    db.conferenceParticipant.count({
      where: { hadTcpFallback: true, joinedAt: { not: null } },
    }),
    db.conferenceParticipant.count({ where: { joinedAt: { not: null } } }),
    db.conferenceEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 20,
      select: {
        id: true,
        eventType: true,
        occurredAt: true,
        schoolId: true,
        sessionId: true,
      },
    }),
  ])

  // Resolve school names for the live-by-school breakdown.
  const schoolIds = liveBySchool.map((r) => r.schoolId)
  const schools = schoolIds.length
    ? await db.school.findMany({
        where: { id: { in: schoolIds } },
        select: { id: true, name: true },
      })
    : []
  const nameById = new Map(schools.map((s) => [s.id, s.name]))

  return {
    liveCount,
    scheduledToday,
    recordingsReady: recordingAgg._count._all,
    storageBytes: Number(recordingAgg._sum.fileSizeBytes ?? 0),
    totalParticipants,
    tcpFallbackCount,
    tcpFallbackRate:
      totalParticipants > 0 ? tcpFallbackCount / totalParticipants : 0,
    liveBySchool: liveBySchool
      .map((r) => ({
        schoolId: r.schoolId,
        name: nameById.get(r.schoolId) ?? r.schoolId,
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    recentEvents,
  }
}

/** Human-readable storage size from a byte count. */
export function formatBytes(bytes: number): string {
  const n = bytes
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}
