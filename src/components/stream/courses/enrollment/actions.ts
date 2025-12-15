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

export async function enrollInCourseAction(courseId: string) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const subdomain = host.split(".")[0]
  const locale = i18n.defaultLocale

  if (!session?.user) {
    throw new Error("Authentication required")
  }

  if (!schoolId) {
    throw new Error("School context required")
  }

  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  let checkoutUrl: string

  try {
    // Find course WITH schoolId scope
    const course = await db.streamCourse.findFirst({
      where: {
        id: courseId,
        schoolId, // IMPORTANT: Multi-tenant scope
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
      },
    })

    if (!course) {
      throw new Error("Course not found or not available")
    }

    // Handle Stripe customer
    let stripeCustomerId: string
    const userWithStripeCustomerId = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        stripeCustomerId: true,
      },
    })

    if (userWithStripeCustomerId?.stripeCustomerId) {
      stripeCustomerId = userWithStripeCustomerId.stripeCustomerId
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
          schoolId, // Add school context to Stripe
        },
      })

      stripeCustomerId = customer.id

      await db.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          stripeCustomerId: stripeCustomerId,
        },
      })
    }

    // Handle enrollment with transaction
    const result = await db.$transaction(async (tx) => {
      // Check existing enrollment WITH schoolId scope
      const existingEnrollment = await tx.streamEnrollment.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId,
          schoolId, // IMPORTANT: Multi-tenant scope
        },
      })

      if (existingEnrollment?.isActive) {
        throw new Error("You are already enrolled in this course")
      }

      // Create or update enrollment
      let enrollment
      if (existingEnrollment) {
        enrollment = await tx.streamEnrollment.update({
          where: {
            id: existingEnrollment.id,
          },
          data: {
            isActive: false, // Reset to pending
            updatedAt: new Date(),
          },
        })
      } else {
        enrollment = await tx.streamEnrollment.create({
          data: {
            userId: session.user.id,
            courseId: course.id,
            schoolId, // IMPORTANT: Multi-tenant scope
            isActive: false, // Will be activated after payment
          },
        })
      }

      // Handle free courses
      if (!course.price || course.price === 0) {
        // Immediately activate for free courses
        await tx.streamEnrollment.update({
          where: { id: enrollment.id },
          data: { isActive: true },
        })

        return {
          enrollment,
          checkoutUrl: null,
        }
      }

      // Create Stripe price if not exists
      // We already checked stripe is not null above, but TypeScript doesn't track it across closure
      const stripeProduct = await stripe!.products.create({
        name: course.title,
        metadata: {
          courseId: course.id,
          schoolId,
        },
      })

      const stripePrice = await stripe!.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(course.price * 100), // Convert to cents
        currency: "usd",
      })

      // Create checkout session
      const checkoutSession = await stripe!.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: stripePrice.id,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/stream/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/stream/payment/cancel`,
        metadata: {
          userId: session.user.id,
          courseId: course.id,
          enrollmentId: enrollment.id,
          schoolId, // IMPORTANT: Multi-tenant scope
        },
      })

      // Store checkout session ID
      await tx.streamEnrollment.update({
        where: { id: enrollment.id },
        data: {
          stripeCheckoutSessionId: checkoutSession.id,
          stripePriceId: stripePrice.id,
        },
      })

      return {
        enrollment,
        checkoutUrl: checkoutSession.url,
      }
    })

    // Handle redirection
    if (result.checkoutUrl) {
      checkoutUrl = result.checkoutUrl
    } else {
      // Free course - redirect to course page
      redirect(`/${locale}/stream/dashboard/${course.slug}`)
    }
  } catch (error) {
    console.error("Enrollment error:", error)

    if (error instanceof Stripe.errors.StripeError) {
      throw new Error("Payment system error. Please try again later.")
    }

    throw error instanceof Error
      ? error
      : new Error("Failed to enroll in course")
  }

  redirect(checkoutUrl)
}

export async function checkEnrollmentStatus(courseId: string) {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user || !schoolId) {
    return { enrolled: false }
  }

  const enrollment = await db.streamEnrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId,
      schoolId,
      isActive: true,
    },
  })

  return {
    enrolled: !!enrollment,
    enrollmentId: enrollment?.id,
  }
}
