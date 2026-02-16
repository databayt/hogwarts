import { cache } from "react"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface CatalogCertificate {
  id: string
  certificateNumber: string
  courseTitle: string
  completedAt: Date
  issuedAt: Date
}

/**
 * Get all subject certificates for the current user.
 * Migration: Replaces get-certificates.ts which queries StreamCertificate.
 */
export const getCatalogUserCertificates = cache(
  async (): Promise<CatalogCertificate[]> => {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id) {
      return []
    }

    const certificates = await db.subjectCertificate.findMany({
      where: {
        userId: session.user.id,
        ...(schoolId ? { schoolId } : {}),
      },
      select: {
        id: true,
        certificateNumber: true,
        subjectTitle: true,
        completedAt: true,
        issuedAt: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    })

    return certificates.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      courseTitle: c.subjectTitle,
      completedAt: c.completedAt,
      issuedAt: c.issuedAt,
    }))
  }
)

/**
 * Get a specific certificate by number (for verification).
 */
export const getCatalogCertificateByNumber = cache(
  async (certificateNumber: string) => {
    const certificate = await db.subjectCertificate.findUnique({
      where: {
        certificateNumber,
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
        school: {
          select: {
            name: true,
          },
        },
      },
    })

    return certificate
  }
)

/**
 * Get certificate for a specific catalog subject.
 */
export const getCatalogSubjectCertificate = cache(
  async (catalogSubjectId: string) => {
    const session = await auth()

    if (!session?.user?.id) {
      return null
    }

    const certificate = await db.subjectCertificate.findFirst({
      where: {
        userId: session.user.id,
        catalogSubjectId,
      },
      select: {
        id: true,
        certificateNumber: true,
        subjectTitle: true,
        completedAt: true,
        issuedAt: true,
      },
    })

    if (!certificate) return null

    return {
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      courseTitle: certificate.subjectTitle,
      completedAt: certificate.completedAt,
      issuedAt: certificate.issuedAt,
    }
  }
)
