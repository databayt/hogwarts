// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Combined classes: one teacher teaching several sections in the same period.
//
// alabidae has them every day: فادية teaches G7, G8 and G9 English together at
// 19:00, and the two G12 tracks share a teacher at 18:00 and 18:55. Each
// section keeps its own timetable slot, but it is ONE class, so it gets ONE
// room. Without this the sweep wrote a room per section, the teacher could host
// only one of them, and the other sections waited in rooms that never started.
//
// The PRIMARY slot (the group's first by id, so it is stable) owns the room.
// The other slots' join links lead into it, their students and guardians are
// admitted to it, its notices reach them, and the attendance read from its
// presence is written to every section's OWN slot.
//
// A group is: same school, term, weekOffset, dayOfWeek, teacher and period
// START time, ONLINE sections only. Per-grade bells give each grade its own
// Period row, so an equal start time, not an equal periodId, is the test.
// Breaks never group. A section taught in person that day sits in its
// classroom: it gets no room, and the room's presence must never mark it
// absent — so in a hybrid school it stays out of the group.
import "server-only"

import { db } from "@/lib/db"

import { resolveOnlinePolicies } from "./online-policy"

export type CombinedMember = { slotId: string; sectionId: string }
export type CombinedGroup = { primaryId: string; members: CombinedMember[] }

/**
 * Is a same-teacher pair of overlapping slots a combined class rather than a
 * timetable conflict? Yes only when both start at the same time, sit in two
 * DIFFERENT sections, and both sections are online. Pure.
 */
export function isCombinedClassPair(p: {
  sameStart: boolean
  sectionA: string | null
  sectionB: string | null
  onlineA: boolean
  onlineB: boolean
}): boolean {
  return (
    p.sameStart &&
    !!p.sectionA &&
    !!p.sectionB &&
    p.sectionA !== p.sectionB &&
    p.onlineA &&
    p.onlineB
  )
}

/** "HH:MM" of a period bound — periods store wall clock on 1970-01-01 UTC. */
export function periodStartKey(t: Date | string): string {
  return new Date(t).toISOString().slice(11, 16)
}

type SlotForGrouping = {
  id: string
  teacherId: string | null
  sectionId: string | null
  period: { startTime: Date | string } | null
}

/**
 * Group one day's slots into combined classes. Returns slot id → its group,
 * for groups of two or more DISTINCT sections only; a slot taught alone is
 * absent from the map. Pure, so the sweep can group a day it already loaded.
 */
export function groupCombinedSlots(
  slots: SlotForGrouping[]
): Map<string, CombinedGroup> {
  const buckets = new Map<string, SlotForGrouping[]>()
  for (const s of slots) {
    if (!s.teacherId || !s.sectionId || !s.period) continue
    const key = `${s.teacherId}|${periodStartKey(s.period.startTime)}`
    const list = buckets.get(key) ?? []
    list.push(s)
    buckets.set(key, list)
  }

  const out = new Map<string, CombinedGroup>()
  for (const list of buckets.values()) {
    const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id))
    // One member per section: two slots of one section at one start time is
    // bad data, not a combined class — the first by id stands for it.
    const seen = new Set<string>()
    const members: CombinedMember[] = []
    for (const s of sorted) {
      if (seen.has(s.sectionId!)) continue
      seen.add(s.sectionId!)
      members.push({ slotId: s.id, sectionId: s.sectionId! })
    }
    if (members.length < 2) continue
    const group: CombinedGroup = { primaryId: members[0].slotId, members }
    for (const s of list) out.set(s.id, group)
  }
  return out
}

/**
 * The combined group a slot belongs to, read from the database; `null` when
 * the slot is taught alone (or its section is not online on `date`). Never
 * throws: a failed lookup degrades to the one-room-per-section behaviour every
 * school had before.
 */
export async function combinedGroupForSlot(
  schoolId: string,
  slotId: string,
  date: Date = new Date()
): Promise<CombinedGroup | null> {
  try {
    const slot = await db.timetable.findFirst({
      where: { id: slotId, schoolId },
      select: {
        termId: true,
        dayOfWeek: true,
        weekOffset: true,
        teacherId: true,
        sectionId: true,
        period: { select: { startTime: true, isBreak: true } },
      },
    })
    if (!slot?.teacherId || !slot.sectionId || !slot.period) return null
    if (slot.period.isBreak) return null
    const peers = await db.timetable.findMany({
      where: {
        schoolId,
        termId: slot.termId,
        dayOfWeek: slot.dayOfWeek,
        weekOffset: slot.weekOffset,
        teacherId: slot.teacherId,
        sectionId: { not: null },
        period: { isBreak: false },
      },
      select: {
        id: true,
        teacherId: true,
        sectionId: true,
        period: { select: { startTime: true } },
      },
    })
    const group = groupCombinedSlots(peers).get(slotId)
    if (!group) return null
    // The sweep groups only the sections that are online that day; so must
    // every reader, or a link would lead into a room the sweep never wrote.
    const policies = await resolveOnlinePolicies(
      schoolId,
      groupSectionIds(group),
      date
    )
    const online = peers.filter(
      (p) => p.sectionId && policies.get(p.sectionId)?.online
    )
    return groupCombinedSlots(online).get(slotId) ?? null
  } catch (err) {
    console.warn("[conference] combinedGroupForSlot failed", {
      schoolId,
      slotId,
      err: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

/**
 * Batched form of `combinedGroupForSlot` for readers that hold many slots (the
 * mobile timetable, the mobile session list): slot id → the primary slot id
 * that owns its room, for slots that belong to a combined group (a primary maps
 * to itself). Slots taught alone are absent. Two queries for any number of
 * slots, never throws — a failure degrades to one room per section.
 */
export async function combinedPrimaryForSlots(
  schoolId: string,
  slotIds: string[],
  date: Date = new Date()
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (slotIds.length === 0) return out
  try {
    const mine = await db.timetable.findMany({
      where: { schoolId, id: { in: slotIds }, teacherId: { not: null } },
      select: {
        termId: true,
        dayOfWeek: true,
        weekOffset: true,
        teacherId: true,
      },
    })
    if (mine.length === 0) return out
    const peers = await db.timetable.findMany({
      where: {
        schoolId,
        sectionId: { not: null },
        period: { isBreak: false },
        OR: mine.map((p) => ({
          termId: p.termId,
          dayOfWeek: p.dayOfWeek,
          weekOffset: p.weekOffset,
          teacherId: p.teacherId,
        })),
      },
      select: {
        id: true,
        teacherId: true,
        sectionId: true,
        period: { select: { startTime: true } },
      },
      take: 4000,
    })
    const policies = await resolveOnlinePolicies(
      schoolId,
      [...new Set(peers.map((p) => p.sectionId!))],
      date
    )
    const online = peers.filter((p) => policies.get(p.sectionId!)?.online)
    const wanted = new Set(slotIds)
    for (const [slotId, group] of groupCombinedSlots(online)) {
      if (wanted.has(slotId)) out.set(slotId, group.primaryId)
    }
  } catch (err) {
    console.warn("[conference] combinedPrimaryForSlots failed", {
      schoolId,
      err: err instanceof Error ? err.message : String(err),
    })
  }
  return out
}

/**
 * The slot ids of the rooms a viewer's sections SHARE with another section: the
 * primary slots of the combined groups their sections' slots belong to, minus
 * the viewer's own sections' slots. A student's session list is scoped by
 * section, so without these a sibling-section student could not see — in the
 * list — the class they attend. Never throws.
 */
export async function sharedRoomSlotIds(
  schoolId: string,
  sectionIds: string[],
  date: Date = new Date()
): Promise<string[]> {
  if (sectionIds.length === 0) return []
  try {
    const own = await db.timetable.findMany({
      where: {
        schoolId,
        sectionId: { in: sectionIds },
        teacherId: { not: null },
        period: { isBreak: false },
      },
      select: { id: true },
      take: 2000,
    })
    const ownIds = new Set(own.map((o) => o.id))
    const primaries = await combinedPrimaryForSlots(schoolId, [...ownIds], date)
    return [...new Set(primaries.values())].filter((id) => !ownIds.has(id))
  } catch (err) {
    console.warn("[conference] sharedRoomSlotIds failed", {
      schoolId,
      err: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

/** The section ids a group covers. */
export function groupSectionIds(group: CombinedGroup): string[] {
  return group.members.map((m) => m.sectionId)
}

/**
 * Every section a session's class covers: its own, plus its combined
 * siblings' when the session is anchored to a combined slot. The siblings are
 * the ones online on the class's own day.
 *
 * A MAKE-UP class (حصة تعويضية) has no slot of its own (`timetableId` null) but
 * stands in for the class it replaces: it covers the sections its ORIGINAL
 * covered, so the sibling sections of a combined class can join the make-up
 * too. The caller may pass `makeupForId`; a caller that selected only `id`
 * (join-core) has it read here — slot-less sessions are rare, so it is one
 * cheap query on the exception, not the rule. The original is a root (it never
 * points at another class), so this recurses once.
 */
export async function sessionSectionIds(
  schoolId: string,
  session: {
    id?: string
    sectionId: string | null
    timetableId: string | null
    scheduledStart?: Date | null
    makeupForId?: string | null
  }
): Promise<string[]> {
  if (!session.sectionId) return []
  if (!session.timetableId) {
    let makeupForId = session.makeupForId
    if (makeupForId === undefined && session.id) {
      const row = await db.conference.findFirst({
        where: { id: session.id, schoolId },
        select: { makeupForId: true },
      })
      makeupForId = row?.makeupForId ?? null
    }
    if (!makeupForId) return [session.sectionId]
    const origin = await db.conference.findFirst({
      where: { id: makeupForId, schoolId },
      select: { sectionId: true, timetableId: true, scheduledStart: true },
    })
    if (!origin) return [session.sectionId]
    // `makeupForId` is left off on purpose: the original is the end of the chain.
    const covered = await sessionSectionIds(schoolId, {
      sectionId: origin.sectionId,
      timetableId: origin.timetableId,
      scheduledStart: origin.scheduledStart,
      makeupForId: null,
    })
    return [...new Set([session.sectionId, ...covered])]
  }
  const group = await combinedGroupForSlot(
    schoolId,
    session.timetableId,
    session.scheduledStart ?? new Date()
  )
  if (!group) return [session.sectionId]
  return [...new Set([session.sectionId, ...groupSectionIds(group)])]
}
