"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import Stripe from "stripe"

import { env } from "@/env.mjs"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { getTenantContext } from "@/lib/tenant-context"
import { i18n } from "@/components/internationalization/config"
import {
  assertStreamPermission,
  getAuthContext,
} from "@/components/stream/authorization"
import { sendEnrollmentEmail } from "@/components/stream/shared/email-service"

/**
 * Enroll user in a catalog subject.
 * Migration: Uses Enrollment model instead of StreamEnrollment.
 * schoolId is optional — individuals can enroll without a school.
 */
export async function enrollInCatalogSubject(catalogSubjectId: string) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const locale = i18n.defaultLocale

  const authCtx = getAuthContext(session)
  if (!authCtx || !session?.user) throw new Error("Authentication required")
  authCtx.schoolId = schoolId
  assertStreamPermission(authCtx, "enroll")

  let checkoutUrl: string

  try {
    // Find catalog subject (no schoolId — global)
    const subject = await db.catalogSubject.findFirst({
      where: {
        id: catalogSubjectId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    if (!subject) {
      throw new Error("Subject not found or not available")
    }

    // Handle enrollment with transaction
    const result = await db.$transaction(async (tx) => {
      // Check existing enrollment
      const existingEnrollment = await tx.enrollment.findFirst({
        where: {
          userId: session.user.id,
          catalogSubjectId,
          ...(schoolId ? { schoolId } : {}),
        },
      })

      if (existingEnrollment?.isActive) {
        throw new Error("You are already enrolled in this subject")
      }

      // Create or update enrollment
      let enrollment
      if (existingEnrollment) {
        enrollment = await tx.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            isActive: true,
            status: "ACTIVE",
            updatedAt: new Date(),
          },
        })
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            userId: session.user.id,
            catalogSubjectId: subject.id,
            schoolId: schoolId ?? null,
            isActive: true,
            status: "ACTIVE",
          },
        })
      }

      // Get school name for email
      const school = schoolId
        ? await tx.school.findUnique({
            where: { id: schoolId },
            select: { name: true },
          })
        : null

      // Send enrollment confirmation email
      if (session.user.email) {
        sendEnrollmentEmail({
          to: session.user.email,
          studentName: session.user.name || "Student",
          courseTitle: subject.name,
          courseUrl: `${env.NEXT_PUBLIC_APP_URL}/${locale}/stream/dashboard/${subject.slug}`,
          schoolName: school?.name || "Platform",
        }).catch((err) =>
          console.error("Failed to send enrollment email:", err)
        )
      }

      return { enrollment, checkoutUrl: null }
    })

    // Free enrollment — redirect to dashboard
    redirect(`/${locale}/stream/dashboard/${subject.slug}`)
  } catch (error) {
    console.error("Catalog enrollment error:", error)

    if (error instanceof Stripe.errors.StripeError) {
      throw new Error("Payment system error. Please try again later.")
    }

    throw error instanceof Error
      ? error
      : new Error("Failed to enroll in subject")
  }
}

/**
 * Check catalog enrollment status.
 */
export async function checkCatalogEnrollmentStatus(catalogSubjectId: string) {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    return { enrolled: false }
  }

  const enrollment = await db.enrollment.findFirst({
    where: {
      userId: session.user.id,
      catalogSubjectId,
      isActive: true,
      ...(schoolId ? { schoolId } : {}),
    },
  })

  return {
    enrolled: !!enrollment,
    enrollmentId: enrollment?.id,
  }
}
