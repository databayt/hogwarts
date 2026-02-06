"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function getParentAnnouncements() {
  try {
    const session = await auth()

    if (!session?.user?.schoolId) {
      return { success: false, error: "Not authenticated", announcements: [] }
    }

    // Get guardian and their students' classes
    const guardian = await db.guardian.findFirst({
      where: {
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
      include: {
        studentGuardians: {
          include: {
            student: {
              include: {
                studentClasses: {
                  select: {
                    classId: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!guardian) {
      return { success: false, error: "Guardian not found", announcements: [] }
    }

    // Get all class IDs for the guardian's students
    const classIds = new Set<string>()
    guardian.studentGuardians.forEach((sg) => {
      sg.student.studentClasses.forEach((sc) => {
        classIds.add(sc.classId)
      })
    })

    // Fetch announcements that are:
    // 1. School-wide (scope: 'school')
    // 2. Parent-specific (scope: 'parents' or role: 'PARENT')
    // 3. Class-specific for their children's classes
    const announcements = await db.announcement.findMany({
      where: {
        schoolId: session.user.schoolId,
        published: true,
        OR: [
          // School-wide announcements
          { scope: "school" },
          // Role-based announcements for parents
          {
            AND: [{ scope: "role" }, { role: "PARENT" as any }],
          },
          // Class-specific announcements for their children
          {
            AND: [
              { scope: "class" },
              { classId: { in: Array.from(classIds) } },
            ],
          },
        ],
      },
      include: {
        class: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                givenName: true,
                surname: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Map announcements with additional context
    const mappedAnnouncements = announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title || "",
      body: announcement.body || "",
      scope: announcement.scope,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      class: announcement.class
        ? {
            id: announcement.class.id,
            name: announcement.class.name,
            subject: announcement.class.subject.subjectName,
            teacher: announcement.class.teacher
              ? `${announcement.class.teacher.givenName} ${announcement.class.teacher.surname}`
              : "N/A",
          }
        : null,
      // Mark which student this announcement is relevant for
      relevantStudents: announcement.classId
        ? guardian.studentGuardians
            .filter((sg) =>
              sg.student.studentClasses.some(
                (sc) => sc.classId === announcement.classId
              )
            )
            .map((sg) => sg.student.id)
        : guardian.studentGuardians.map((sg) => sg.student.id),
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
      students: guardian.studentGuardians.map((sg) => ({
        id: sg.student.id,
        name: `${sg.student.givenName}${sg.student.middleName ? ` ${sg.student.middleName}` : ""} ${sg.student.surname}`,
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
