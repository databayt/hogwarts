"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getStudentScopes } from "@/lib/teaching-scope"
import { buildViewerAudienceWhere } from "@/components/school-dashboard/listings/announcements/queries"
import { localize } from "@/components/translation/localize"

export async function getParentAnnouncements(displayLang?: "ar" | "en") {
  try {
    const session = await auth()

    if (!session?.user?.schoolId) {
      return {
        ...actionError(ACTION_ERRORS.NOT_AUTHENTICATED),
        announcements: [],
      }
    }

    // The guardian and where each child sits (section, grade)
    const guardian = await db.guardian.findFirst({
      where: {
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
      include: {
        studentGuardians: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!guardian) {
      return {
        ...actionError(ACTION_ERRORS.PARENT_NOT_FOUND),
        announcements: [],
      }
    }

    const schoolId = session.user.schoolId
    const children = guardian.studentGuardians.map((sg) => sg.student)
    const scopes = await getStudentScopes(
      schoolId,
      children.map((c) => c.id)
    )

    // The notices a guardian is an audience for — the same rule as the
    // announcements page: school-wide, the guardian role, their children's
    // grades and sections, published and unexpired
    const audience = await buildViewerAudienceWhere(
      schoolId,
      session.user.id,
      "GUARDIAN"
    )
    const announcements = await db.announcement.findMany({
      where: { schoolId, ...audience },
      include: {
        grade: { select: { name: true } },
        section: { select: { name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Which children a notice is for
    const relevantFor = (a: {
      scope: string
      gradeId: string | null
      sectionId: string | null
    }) =>
      scopes
        .filter((sc) =>
          a.scope === "section"
            ? sc.sectionId === a.sectionId
            : a.scope === "grade"
              ? sc.gradeId === a.gradeId
              : a.scope !== "class"
        )
        .map((sc) => sc.studentId)

    // Map announcements with additional context and on-demand translation.
    // ONE batched localize() pass for the whole list (replaces N×getText).
    const lang = displayLang || "ar"
    const localized = await localize("Announcement", announcements, {
      schoolId,
      lang,
    })
    const mappedAnnouncements = localized.map((announcement) => ({
      id: announcement.id,
      title: announcement.title || "",
      body: announcement.body || "",
      scope: announcement.scope,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      // The grade or section it's for
      audienceName:
        announcement.section?.name ?? announcement.grade?.name ?? null,
      // Mark which children this announcement is relevant for
      relevantStudents: relevantFor(announcement),
    }))

    logger.info("Parent announcements fetched", {
      action: "parent_announcements_fetch",
      userId: session.user.id,
      guardianId: guardian.id,
      announcementCount: mappedAnnouncements.length,
    })

    return {
      success: true,
      announcements: mappedAnnouncements,
      students: children.map((c) => ({
        id: c.id,
        name: `${c.firstName}${c.middleName ? ` ${c.middleName}` : ""} ${c.lastName}`,
      })),
    }
  } catch (error) {
    logger.error(
      "Failed to fetch parent announcements",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "parent_announcements_fetch_error",
      }
    )
    return {
      success: false,
      error: "Failed to fetch announcements",
      announcements: [],
    }
  }
}
