// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

/** The `school.liveClasses` slice every landing section reads its copy from. */
export type LiveDictionary = Dictionary["school"]["liveClasses"]

/**
 * The `liveClasses.settings` slice — a DIFFERENT namespace file, and the one
 * that already holds every delivery-mode, provider and link-coverage label,
 * fully translated. The readiness band reads it rather than duplicating those
 * strings into `school.liveClasses`, because duplicated translations drift.
 */
export type LiveSettingsDictionary = Dictionary["liveClasses"]["settings"]

export interface LandingSectionProps {
  dictionary: LiveDictionary
  lang: string
}

/**
 * The five states the card's last row can report.
 *
 * `scheduled` is the quiet one — a class far enough out that the time alone
 * says everything — and `past` is the shelf's, where the row prints a date.
 */
export type LandingSessionPhase =
  | "soon"
  | "started"
  | "ending"
  | "scheduled"
  | "past"

/** One row in the live / coming-up strip, already localized by the page. */
export interface LandingSession {
  id: string
  title: string
  teacherName: string
  /** The teacher's own portrait for the byline; null falls back to initials. */
  teacherPhotoUrl: string | null
  subjectName: string | null
  sectionName: string | null
  /** The academic grade — "الصف الأول" — badged beside the heading. */
  gradeName: string | null
  /** The catalog chapter and lesson this class is teaching, when a teacher has
   *  anchored it to one. Null on any session materialized from the timetable,
   *  which knows its subject but not today's lesson. */
  chapterName: string | null
  lessonName: string | null
  /** Pre-formatted by the page, in the SCHOOL's timezone — not the reader's. */
  scheduledStart: string
  isLive: boolean
  /** Where the class sits in its own clock, resolved on the SERVER against the
   *  render's `now`. It is therefore as fresh as the page is — a card that has
   *  been sitting open does not re-label itself. */
  phase: LandingSessionPhase
  /** Minutes elapsed against minutes booked, for the running card's count. */
  progress: { done: number; total: number } | null
  /** Catalog thumbnail URL for the session's subject, when it has one. */
  imageUrl: string | null
  /** Catalog colour, the fallback ground when there is no thumbnail. */
  color: string | null
}

/** What this viewer is allowed to do, resolved once on the server. */
export interface LandingViewer {
  role: string
  /** Staff who may create sessions — ADMIN, DEVELOPER, TEACHER. */
  canSchedule: boolean
  /** ADMIN and DEVELOPER — the only roles that see the readiness band. */
  canConfigure: boolean
  /** A teacher or admin hosting, rather than a student joining. */
  isHost: boolean
  /**
   * ACCOUNTANT can list sessions but may neither join one nor watch a
   * recording, so it must never be offered either.
   */
  canJoin: boolean
  canViewRecordings: boolean
  /**
   * Does a session card name the TEACHER.
   *
   * False for a teacher reading their own rows — the landing page narrows a
   * teacher's strip to the classes they teach, so their own name on every card
   * is the one word that carries no information. It stays TRUE for a teacher
   * whose narrowing did not apply (no `Teacher` row, so they are seeing the
   * whole school), which is why it is resolved from the query that ran rather
   * than from the role alone.
   */
  showsTeacher: boolean
  /**
   * Does a session card name the SECTION.
   *
   * False for a student, whose every row is their own section. True for
   * everyone else: an admin and an accountant read across the school, a
   * guardian across their children's sections, and a teacher across the
   * classes they teach — for all of them the section is what tells two
   * otherwise identical cards apart.
   */
  showsSection: boolean
}

/** How the school delivers teaching right now, for the hero and the band. */
export interface LandingPolicy {
  /** `physical` · `online` · `hybrid` — straight off the School row. */
  deliveryMode: "physical" | "online" | "hybrid"
  /** Is any online teaching actually reaching students today. */
  isOnline: boolean
  /** A temporary go-online window is in force today. */
  windowActive: boolean
  provider: "livekit" | "external"
  /** School wants in-app rooms but the SFU is unprovisioned. */
  degraded: boolean
}

/** The admin readiness checklist's data, assembled from existing helpers. */
export interface LandingReadiness {
  livekitReady: boolean
  recordingReady: boolean
  /** Standing meeting link — without one an uncovered pair materializes nothing. */
  hasFallback: boolean
  /** Null when the coverage read failed or the school has no active term. */
  coverage: { total: number; covered: number; gapCount: number } | null
}

/**
 * One square in the past shelf's tile column — a SUBJECT, not a session.
 *
 * The reference's shelf pairs a list of items with a grid of the channels
 * those items came from; the school's equivalent of a channel is the subject,
 * and its catalog artwork is the only square image this block has.
 */
export interface LandingSubjectTile {
  /** Catalog subject id — the dedupe key, and the React key. */
  id: string
  /** Localized subject name; the tile's only text, on the image's alt. */
  name: string
  imageUrl: string | null
  color: string | null
  /** The subject's most recent ended session, which is where the tile lands. */
  sessionId: string
}
