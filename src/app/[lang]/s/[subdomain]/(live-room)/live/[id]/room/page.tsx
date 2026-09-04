// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getLiveClass } from "@/components/school-dashboard/live/actions/sessions"
import { checkLiveClassPermission } from "@/components/school-dashboard/live/authorization"
import { DEFAULT_SCHOOL_TZ } from "@/components/school-dashboard/live/day-window"
import { resolveLiveClassError } from "@/components/school-dashboard/live/error-map"
import { isRecordingConfigured } from "@/components/school-dashboard/live/livekit/client"
import {
  findRoomCardSession,
  findRoomClassPeople,
  findRoomRelatedLessons,
  findRoomShelfSessions,
} from "@/components/school-dashboard/live/queries"
import { RoomClient } from "@/components/school-dashboard/live/room"
import { JOIN_ERROR_CODES } from "@/components/school-dashboard/live/room/join-errors"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import {
  RoomBonusShelf,
  RoomClassShelf,
  RoomPageSections,
  RoomPeopleShelf,
  RoomRelatedShelf,
  type RoomBonusItem,
  type RoomPerson,
  type RoomRelatedItem,
  type RoomShelfItem,
} from "@/components/school-dashboard/live/room/shelves"
import { getSlideOptions } from "@/components/school-dashboard/live/room/slide-options"
import type { RoomTitleCardData } from "@/components/school-dashboard/live/room/title-card"
import { getLabels, getName, getNames } from "@/components/translation/person"

// Page-data OOM safety: auth-gated room, render on demand.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const [{ lang, id }, session] = await Promise.all([params, auth()])
  if (!session?.user?.id) {
    redirect(`/${lang}/login`)
  }

  const dictionary = await getDictionary(lang)

  // External-link sessions have no SFU room — an eligible viewer landing here
  // is handed to the vendor meeting instead of an SFU error. getLiveClass is
  // enrollment-gated, so the URL never leaves the server for outsiders.
  const detail = await getLiveClass(id)
  if (
    "success" in detail &&
    detail.success &&
    detail.data.provider === "external"
  ) {
    if (
      detail.data.meetingUrl &&
      (detail.data.status === "live" || detail.data.status === "scheduled")
    ) {
      redirect(detail.data.meetingUrl)
    }
    redirect(`/${lang}/live/${id}`)
  }

  const t = dictionary?.liveClasses
  const c = t?.room?.card

  // The eligibility gate is `getLiveClass`, not the join. A viewer who may not
  // see this session must never reach the card — offering someone a Join
  // button that can only ever refuse is worse than the plain refusal.
  //
  // The TICKET, though, is deliberately NOT minted here. As HOST, minting one
  // opens the SFU room, flips the session to `live` and writes the participant
  // row presence is read from — none of which should happen because a teacher
  // opened a tab. The client mints it when Join is pressed.
  if (!("success" in detail) || !detail.success) {
    const code = "error" in detail ? detail.error : undefined
    return (
      <div className="bg-background flex h-screen w-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-destructive text-base font-medium">
          {resolveLiveClassError(dictionary, code)}
        </p>
        <a className="text-sm underline" href={`/${lang}/live/${id}`}>
          {t?.actions?.back ?? "Back"}
        </a>
      </div>
    )
  }

  const { schoolId } = await getTenantContext()
  const now = new Date()
  const [slides, row, school, shelfRows, relatedRows, rosterRows] =
    await Promise.all([
      schoolId ? getSlideOptions(schoolId, id) : Promise.resolve([]),
      schoolId ? findRoomCardSession(schoolId, id) : Promise.resolve(null),
      schoolId
        ? db.school.findUnique({
            where: { id: schoolId },
            select: {
              timezone: true,
              // The card's honest tool marks (lr-07) — the same four
              // switches `join-core.ts` reads into `RoomConfig.tools`.
              // `conferenceToolStudentShare` is deliberately not selected:
              // it is a token grant, not a mark the card shows.
              conferenceToolChat: true,
              conferenceToolHands: true,
              conferenceToolPolls: true,
              conferenceToolWhiteboard: true,
            },
          })
        : Promise.resolve(null),
      // The shelf under the card. In the SAME wave as the card's own row: its
      // only input is `sectionId`, which `getLiveClass` has already returned
      // above, so making it wait on `findRoomCardSession` would buy nothing and
      // cost a round trip on a page that is `force-dynamic`.
      schoolId
        ? findRoomShelfSessions(schoolId, {
            sessionId: id,
            sectionId: detail.data.sectionId,
            // The shelf is scoped by whatever ADMITTED the reader, not by the
            // row's section — see `findRoomShelfSessions`.
            visibility: detail.data.visibility,
            now,
          })
        : Promise.resolve([]),
      // The two rows under it, in the same wave for the same reason: both read
      // only from `detail.data`, which is already resolved.
      schoolId
        ? findRoomRelatedLessons(schoolId, {
            subjectId: detail.data.subjectId,
            excludeLessonId: detail.data.catalogLessonId,
          })
        : Promise.resolve([]),
      schoolId
        ? findRoomClassPeople(schoolId, {
            sectionId: detail.data.sectionId,
            visibility: detail.data.visibility,
          })
        : Promise.resolve([]),
    ])

  // Times are formatted HERE, in the school's own zone. A client-side format
  // uses the reader's device zone and a bare server-side one uses the
  // runtime's, which is UTC on Vercel — both wrong for a school elsewhere.
  const timeZone = school?.timezone || DEFAULT_SCHOOL_TZ
  const timeFormat = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  })

  const teacherRaw = row?.teacher
    ? `${row.teacher.firstName} ${row.teacher.lastName}`.trim()
    : ""
  const teacher =
    row?.teacher && schoolId && teacherRaw
      ? await getName(row.teacher, lang, schoolId)
      : teacherRaw || null

  // Catalog and roster names are stored in ONE language and translated on
  // read. Batched through `getLabels` in a single call — a `getText` per row
  // here would be five sequential round trips for five short strings. Person
  // names go through `getName` above instead, which transliterates when the
  // API is down rather than printing the wrong script.
  const rawSubject = row?.subject?.name ?? detail.data.title
  const labelSources = [
    rawSubject,
    row?.section?.grade?.name,
    row?.section?.name,
    row?.catalogLesson?.chapter?.name,
    row?.catalogLesson?.name,
    // The shelf's rows join the SAME batch. A `getText` per tile would be a
    // dozen sequential round trips for a dozen short strings, which is the
    // exact mistake `getLabels` exists to prevent.
    ...shelfRows.flatMap((s) => [
      s.subject?.name ?? s.title,
      s.catalogLesson?.name,
    ]),
    ...relatedRows.flatMap((l) => [l.name, l.chapter?.name]),
    ...(detail.data.resources ?? []).map(
      (r) => r.schoolExam?.title ?? r.schoolAssignment?.title ?? r.title
    ),
  ]
  const labels = schoolId
    ? await getLabels(labelSources, lang, schoolId)
    : new Map<string, string>()
  const label = (value: string | null | undefined) =>
    value ? (labels.get(value) ?? value) : null

  const minutes =
    row?.scheduledStart && row?.scheduledEnd
      ? Math.round(
          (row.scheduledEnd.getTime() - row.scheduledStart.getTime()) / 60000
        )
      : null

  const card: RoomTitleCardData = {
    // The SUBJECT alone. `Conference.title` is "subject · section", so it
    // would repeat the section the meta line already carries.
    subject: label(rawSubject) ?? rawSubject,
    // Off the grade row itself: `Section.name` is "Grade 7-A", the section
    // including its letter.
    grade: label(row?.section?.grade?.name),
    section: label(row?.section?.name),
    teacher,
    chapter: label(row?.catalogLesson?.chapter?.name),
    lesson: label(row?.catalogLesson?.name),
    startTime: row?.scheduledStart
      ? timeFormat.format(row.scheduledStart)
      : null,
    durationLabel:
      minutes && minutes > 0 ? `${minutes} ${c?.minutes ?? "min"}` : null,
    isLive: row?.status === "live",
    // A session can opt into recording before the bucket exists; the card
    // must not promise REC (nor the room a consent notice) until it can be true.
    isRecording: Boolean(row?.recordingEnabled) && isRecordingConfigured(),
    // Defaults mirror the Prisma column defaults (school.prisma) for the
    // rare unresolved-school path, rather than silently marking every tool
    // off.
    tools: {
      chat: school?.conferenceToolChat ?? true,
      hands: school?.conferenceToolHands ?? true,
      polls: school?.conferenceToolPolls ?? true,
      whiteboard: school?.conferenceToolWhiteboard ?? true,
    },
    // Instants, not labels: the pill's progress bar has to keep moving, and
    // only the client has a clock that is still ticking after the render.
    startsAtMs: row?.scheduledStart?.getTime() ?? null,
    endsAtMs: row?.scheduledEnd?.getTime() ?? null,
    // The frame's paragraph. Built the way its own reads — who is behind it
    // first ("Narrated by Simon Smith, this documentary…"), then what it
    // covers, then whatever the teacher wrote. Empty parts drop out, and a
    // class with none of the three gets no paragraph at all.
    description:
      [
        teacher
          ? (c?.taughtBy ?? "Taught by {name}.").replace("{name}", teacher)
          : null,
        [row?.catalogLesson?.chapter?.name, row?.catalogLesson?.name]
          .filter(Boolean)
          .map((part) => label(part as string))
          .join(" · ") || null,
        row?.description ?? null,
      ]
        .filter(Boolean)
        .join(" ") || null,
    resourceCount: detail.data.resources?.length ?? 0,
    // Null whenever the subject has no artwork OR CloudFront is unconfigured.
    // A normal state, not an error: the subject's colour is the ground.
    thumbnailUrl: getCatalogImageUrl(row?.subject?.thumbnail, "lg"),
    color: row?.subject?.color ?? null,
  }

  // ACCOUNTANT reads every session through `read_school_dashboard` but is
  // granted no `view_recordings`, so a tile linking one would be refused on
  // arrival. Resolved ONCE — the shelf asks the same question of every row.
  const canViewRecordings = checkLiveClassPermission(
    {
      userId: session.user.id,
      role: session.user.role as UserRole,
      schoolId,
    },
    "view_recordings"
  )

  // Which day a shelf row falls on, and whether that is the reader's own. Both
  // resolved in the SCHOOL's zone, like the clock times above: a `getDay()`
  // here would answer in the runtime's zone, which is UTC on Vercel and hands
  // a school east of it the wrong weekday for its first two periods.
  const weekdayFormat = new Intl.DateTimeFormat(
    lang === "ar" ? "ar" : "en-US",
    {
      weekday: "short",
      timeZone,
    }
  )
  const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  })
  const todayKey = dayKeyFormat.format(now)
  const weekdayOf = (at: Date | null) =>
    at && dayKeyFormat.format(at) !== todayKey ? weekdayFormat.format(at) : null

  const durationOf = (start: Date | null, end: Date | null) => {
    if (!start || !end) return null
    const mins = Math.round((end.getTime() - start.getTime()) / 60000)
    return mins > 0 ? `${mins} ${c?.minutes ?? "min"}` : null
  }

  const shelfItems: RoomShelfItem[] = [
    // This class's OWN recording, first — the shelf's episode 1. It used to be
    // a glyph in the header, which the reference spends on ADD and share; a
    // tile is where a thing you can watch belongs anyway, and it is the only
    // row here that is about the class the reader is already looking at.
    ...(row?.recordings?.[0] && canViewRecordings
      ? [
          {
            id: `${id}-recording`,
            href: `/${lang}/live/${id}/recordings`,
            title: label(rawSubject) ?? rawSubject,
            lesson: null,
            day: null,
            time: null,
            durationLabel: null,
            isLive: false,
            hasRecording: true,
            thumbnailUrl: getCatalogImageUrl(row?.subject?.thumbnail, "md"),
            color: row?.subject?.color ?? null,
          } satisfies RoomShelfItem,
        ]
      : []),
    ...shelfRows.map((s) => {
      const watchable = Boolean(s.recordings?.[0]) && canViewRecordings
      const raw = s.subject?.name ?? s.title
      return {
        id: s.id,
        // A running class opens in its room, the way the landing strip's rows
        // do — one click, not a detail page with a Join on it. Anything with a
        // recording goes to the recording; everything else to the class.
        href:
          s.status === "live"
            ? `/${lang}/live/${s.id}/room`
            : watchable
              ? `/${lang}/live/${s.id}/recordings`
              : `/${lang}/live/${s.id}`,
        title: label(raw) ?? raw,
        lesson: label(s.catalogLesson?.name),
        day: weekdayOf(s.scheduledStart),
        time: s.scheduledStart ? timeFormat.format(s.scheduledStart) : null,
        durationLabel: durationOf(s.scheduledStart, s.scheduledEnd),
        isLive: s.status === "live",
        hasRecording: watchable,
        thumbnailUrl: getCatalogImageUrl(s.subject?.thumbnail, "md"),
        color: s.subject?.color ?? null,
      } satisfies RoomShelfItem
    }),
  ]

  // What the class comes with. `ConferenceResource` carries exactly ONE of
  // exam / assignment / url per row (the ContentOverride pattern), which is
  // what the branch reads off — never three optional fields.
  const dateFormat = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-US", {
    day: "numeric",
    month: "short",
    timeZone,
  })
  const bonusItems: RoomBonusItem[] = (detail.data.resources ?? []).map((r) => {
    if (r.schoolExam) {
      return {
        id: r.id,
        href: `/${lang}/exams/${r.schoolExam.id}`,
        kind: "exam",
        title: label(r.schoolExam.title) ?? r.schoolExam.title,
        detail: r.schoolExam.examDate
          ? dateFormat.format(r.schoolExam.examDate)
          : null,
      } satisfies RoomBonusItem
    }
    if (r.schoolAssignment) {
      return {
        id: r.id,
        href: `/${lang}/assignments/${r.schoolAssignment.id}`,
        kind: "assignment",
        title: label(r.schoolAssignment.title) ?? r.schoolAssignment.title,
        detail: r.schoolAssignment.dueDate
          ? dateFormat.format(r.schoolAssignment.dueDate)
          : null,
      } satisfies RoomBonusItem
    }
    return {
      id: r.id,
      // A pasted link leaves the app, so it is the one tile here that is not
      // an in-app route.
      href: r.url ?? `/${lang}/live/${id}`,
      kind: "link",
      title: label(r.title) ?? r.title ?? t?.room?.shelf?.link ?? "Link",
      detail: null,
    } satisfies RoomBonusItem
  })

  // Where to go next: the subject's own catalog lessons, in lumos.
  const relatedItems: RoomRelatedItem[] = relatedRows.map((l) => ({
    id: l.id,
    href: `/${lang}/lumos/courses/${l.chapter?.subject?.slug ?? ""}/${l.id}`,
    title: label(l.name) ?? l.name,
    chapter: label(l.chapter?.name),
    durationLabel: l.durationMinutes
      ? `${l.durationMinutes} ${c?.minutes ?? "min"}`
      : null,
    thumbnailUrl: getCatalogImageUrl(l.thumbnail, "md"),
    color: l.color ?? null,
  }))
  const relatedHref = row?.subject
    ? `/${lang}/lumos/courses/${relatedRows[0]?.chapter?.subject?.slug ?? ""}`
    : null

  // Who is in it. Roster names go through `getNames` — ONE batched call for
  // up to 24 people, and it transliterates when the translation API is down
  // rather than printing the wrong script.
  const rosterNames = schoolId
    ? await getNames(rosterRows, (r) => r, lang, schoolId)
    : new Map<string, string>()
  const people: RoomPerson[] = [
    ...(teacher && row?.teacher
      ? [
          {
            id: row.teacher.id,
            name: teacher,
            role: t?.room?.shelf?.teacherRole ?? "Teacher",
            photoUrl: row.teacher.profilePhotoUrl ?? null,
          } satisfies RoomPerson,
        ]
      : []),
    ...rosterRows.map((r) => {
      const raw = `${r.firstName} ${r.lastName}`.trim()
      return {
        id: r.id,
        name: rosterNames.get(raw) ?? raw,
        role: t?.room?.shelf?.studentRole ?? "Student",
        photoUrl: r.profilePhotoUrl ?? null,
      } satisfies RoomPerson
    }),
  ]

  const joinErrors: Record<string, string> = {
    "": resolveLiveClassError(dictionary, undefined),
  }
  for (const code of JOIN_ERROR_CODES) {
    joinErrors[code] = resolveLiveClassError(dictionary, code)
  }

  return (
    <RoomClient
      sessionId={id}
      // The already-localized subject, not `Conference.title` — that is
      // stored as "subject · section" and would print raw + untranslated on
      // the in-call chrome's fallback line (`room-shell.tsx`'s `title`).
      title={card.subject}
      locale={lang}
      slides={slides}
      card={card}
      shelf={
        <RoomPageSections>
          <RoomClassShelf
            items={shelfItems}
            seeAllHref={`/${lang}/live`}
            labels={{
              // The section IS the series — "Grade 10-A" where the reference
              // says "Season 2". A school-wide assembly has no section, so it
              // falls back to naming what the row actually holds.
              heading:
                card.section ?? t?.room?.shelf?.schoolWide ?? "More classes",
              live: t?.status?.live ?? "Live",
              recorded: t?.room?.shelf?.recording ?? "Recording",
            }}
          />
          <RoomBonusShelf
            items={bonusItems}
            color={card.color}
            labels={{
              heading: t?.room?.shelf?.bonus ?? "Bonus Content",
              exam: t?.room?.shelf?.exam ?? "Exam",
              assignment: t?.room?.shelf?.assignment ?? "Assignment",
              link: t?.room?.shelf?.link ?? "Link",
            }}
          />
          <RoomRelatedShelf
            items={relatedItems}
            seeAllHref={relatedHref}
            labels={{
              heading: t?.room?.shelf?.related ?? "Related",
              seeAll: t?.room?.shelf?.seeAll ?? "See All",
            }}
          />
          <RoomPeopleShelf
            people={people}
            labels={{
              heading: t?.room?.shelf?.people ?? "Teacher & students",
            }}
          />
        </RoomPageSections>
      }
      labels={{
        error: t?.errors?.tokenExpired ?? "Token expired. Please rejoin.",
        joinErrors,
        room: resolveRoomLabels(t?.room),
        card: {
          join: t?.actions?.join ?? "Join",
          joining: c?.joining ?? "Joining…",
          more: c?.more ?? "MORE",
          live: t?.status?.live ?? "Live",
          scheduled: t?.status?.scheduled ?? "Scheduled",
          recorded: c?.recorded ?? "Recorded",
          resourceOne: c?.resourceOne ?? "resource",
          resourceMany: c?.resourceMany ?? "resources",
          free: c?.free ?? "Free",
          // The honest mark row (lr-07): sourced from `room/labels.ts`'s
          // top-level keys, the SAME strings the in-call panel/tabs use for
          // the identical tools — not a second copy under `room.card`.
          hd: t?.room?.hd ?? "HD",
          rec: t?.room?.rec ?? "REC",
          chat: t?.room?.chat ?? "Chat",
          poll: t?.room?.poll ?? "Poll",
          whiteboard: t?.room?.whiteboard ?? "Whiteboard",
          hands: t?.room?.hands ?? "Hands",
          remaining: c?.remaining ?? "{n}m left",
          remainingHours: c?.remainingHours ?? "{h}h {m}m left",
          back: c?.back ?? "Back",
          add: c?.add ?? "ADD",
          addToCalendar: c?.addToCalendar ?? "Add to calendar",
          share: c?.share ?? "Share",
          linkCopied: c?.linkCopied ?? "Link copied",
        },
        participants: {
          title: t?.room?.participants ?? "Participants",
          remove: t?.room?.moderation?.remove ?? "Remove",
          removing: t?.room?.moderation?.removing ?? "Removing…",
          removed: t?.room?.moderation?.removed ?? "Participant removed",
          failed: t?.room?.moderation?.failed ?? "Couldn't remove participant",
          empty: t?.room?.moderation?.empty ?? "No other participants",
        },
      }}
    />
  )
}
