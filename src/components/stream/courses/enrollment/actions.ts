"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"
import { auth } from "@/auth"
import Stripe from "stripe"

import { env } from "@/env.mjs"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { getTenantContext } from "@/lib/tenant-context"
import { i18n, type Locale } from "@/components/internationalization/config"
import { sendEnrollmentEmail } from "@/components/stream/shared/email-service"

/** Resolve the user's locale from cookie or accept-language header */
async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value
  if (localeCookie && i18n.locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale
  }
  return i18n.defaultLocale
}

/**
 * Verify Stripe payment and activate enrollment
 * Called from payment success page to confirm payment was successful
 */
export async function verifyPaymentAndActivateEnrollment(sessionId: string) {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    return { success: false, error: "Authentication required" }
  }

  if (!schoolId) {
    return { success: false, error: "School context required" }
  }

  if (!stripe) {
    return { success: false, error: "Stripe is not configured" }
  }

  try {
    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify payment was successful
    if (checkoutSession.payment_status !== "paid") {
      return {
        success: false,
        error: "Payment not completed",
        paymentStatus: checkoutSession.payment_status,
      }
    }

    // Verify this session belongs to the current user
    const metadata = checkoutSession.metadata
    if (!metadata?.userId || metadata.userId !== session.user.id) {
      return {
        success: false,
        error: "Session does not belong to current user",
      }
    }

    // Verify school context matches
    if (metadata.schoolId !== schoolId) {
      return { success: false, error: "Invalid school context" }
    }

    // Find the enrollment by checkout session ID
    const enrollment = await db.streamEnrollment.findFirst({
      where: {
        stripeCheckoutSessionId: sessionId,
        schoolId, // Multi-tenant safety
      },
      include: {
        course: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    })

    if (!enrollment) {
      return { success: false, error: "Enrollment not found" }
    }

    // If already active, return success
    if (enrollment.isActive) {
      return {
        success: true,
        message: "Already enrolled",
        courseSlug: enrollment.course.slug,
        courseTitle: enrollment.course.title,
      }
    }

    // Activate the enrollment
    await db.streamEnrollment.update({
      where: { id: enrollment.id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    })

    // User email + school name (for the enrollment email) are independent.
    const [user, school] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, username: true },
      }),
      db.school.findUnique({
        where: { id: schoolId },
        select: { name: true },
      }),
    ])

    // Send enrollment confirmation email (fire and forget)
    if (user?.email) {
      const emailLocale = await resolveLocale()
      sendEnrollmentEmail({
        to: user.email,
        studentName: user.username || "Student",
        courseTitle: enrollment.course.title,
        courseUrl: `${env.NEXT_PUBLIC_APP_URL}/${emailLocale}/stream/courses/${enrollment.course.slug}`,
        schoolName: school?.name || "School",
      }).catch((err) => console.error("Failed to send enrollment email:", err))
    }

    return {
      success: true,
      message: "Enrollment activated successfully",
      courseSlug: enrollment.course.slug,
      courseTitle: enrollment.course.title,
    }
  } catch (error) {
    console.error("Payment verification error:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return { success: false, error: "Failed to verify payment with Stripe" }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to verify payment",
    }
  }
}
