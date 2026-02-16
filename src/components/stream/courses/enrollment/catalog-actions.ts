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
 * Supports both free (immediate) and paid (Stripe checkout) enrollment.
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
        price: true,
        currency: true,
      },
    })

    if (!subject) {
      throw new Error("Subject not found or not available")
    }

    const isPaid = subject.price && Number(subject.price) > 0

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
            isActive: !isPaid, // Immediate for free, pending for paid
            status: isPaid ? "PENDING" : "ACTIVE",
            updatedAt: new Date(),
          },
        })
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            userId: session.user.id,
            catalogSubjectId: subject.id,
            schoolId: schoolId ?? null,
            isActive: !isPaid,
            status: isPaid ? "PENDING" : "ACTIVE",
          },
        })
      }

      // Free enrollment: send email and return
      if (!isPaid) {
        const school = schoolId
          ? await tx.school.findUnique({
              where: { id: schoolId },
              select: { name: true },
            })
          : null

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
      }

      // Paid enrollment: create Stripe checkout
      if (!stripe) {
        throw new Error("Stripe is not configured")
      }

      // Get or create Stripe customer
      let stripeCustomerId: string
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true },
      })

      if (user?.stripeCustomerId) {
        stripeCustomerId = user.stripeCustomerId
      } else {
        const customer = await stripe.customers.create({
          email: session.user.email || undefined,
          name: session.user.name || undefined,
          metadata: {
            userId: session.user.id,
            ...(schoolId ? { schoolId } : {}),
          },
        })
        stripeCustomerId = customer.id
        await tx.user.update({
          where: { id: session.user.id },
          data: { stripeCustomerId },
        })
      }

      // Create checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price_data: {
              currency: subject.currency || "usd",
              product_data: { name: subject.name },
              unit_amount: Math.round(Number(subject.price) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/stream/dashboard/${subject.slug}?enrolled=true`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/stream/browse`,
        metadata: {
          userId: session.user.id,
          catalogSubjectId: subject.id,
          enrollmentId: enrollment.id,
          type: "catalog_enrollment",
          ...(schoolId ? { schoolId } : {}),
        },
      })

      // Store checkout session ID on enrollment
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          stripeCheckoutSessionId: checkoutSession.id,
        },
      })

      return { enrollment, checkoutUrl: checkoutSession.url }
    })

    if (result.checkoutUrl) {
      checkoutUrl = result.checkoutUrl
    } else {
      // Free enrollment — redirect to dashboard
      redirect(`/${locale}/stream/dashboard/${subject.slug}`)
    }
  } catch (error) {
    console.error("Catalog enrollment error:", error)

    if (error instanceof Stripe.errors.StripeError) {
      throw new Error("Payment system error. Please try again later.")
    }

    throw error instanceof Error
      ? error
      : new Error("Failed to enroll in subject")
  }

  redirect(checkoutUrl)
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
