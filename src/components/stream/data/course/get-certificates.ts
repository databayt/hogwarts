import { cache } from "react"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface Certificate {
  id: string
  certificateNumber: string
  courseTitle: string
  completedAt: Date
  issuedAt: Date
}

/**
 * Get all certificates for the current user
 */
export const getUserCertificates = cache(async (): Promise<Certificate[]> => {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user?.id || !schoolId) {
    return []
  }

  const certificates = await db.streamCertificate.findMany({
    where: {
      userId: session.user.id,
      schoolId,
    },
    select: {
      id: true,
      certificateNumber: true,
      courseTitle: true,
      completedAt: true,
      issuedAt: true,
    },
    orderBy: {
      completedAt: "desc",
    },
  })

  return certificates
})

/**
 * Get a specific certificate by number (for verification)
 */
export const getCertificateByNumber = cache(
  async (certificateNumber: string) => {
    const certificate = await db.streamCertificate.findUnique({
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
 * Get certificate for a specific course
 */
export const getCourseCertificate = cache(async (courseId: string) => {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user?.id || !schoolId) {
    return null
  }

  const certificate = await db.streamCertificate.findFirst({
    where: {
      userId: session.user.id,
      courseId,
      schoolId,
    },
    select: {
      id: true,
      certificateNumber: true,
      courseTitle: true,
      completedAt: true,
      issuedAt: true,
    },
  })

  return certificate
})
