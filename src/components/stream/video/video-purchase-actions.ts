"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import Stripe from "stripe"

import { env } from "@/env.mjs"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { getTenantContext } from "@/lib/tenant-context"
import { i18n } from "@/components/internationalization/config"

function extractLocaleFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const firstSegment = pathname.split("/")[1]
    return i18n.locales.includes(firstSegment as (typeof i18n.locales)[number])
      ? firstSegment
      : null
  } catch {
    return null
  }
}

type PurchaseResponse = {
  status: "success" | "error"
  message?: string
  checkoutUrl?: string
}

/**
 * Unlock a PAID lesson video for the current user via Stripe checkout.
 *
 * Flow: checkout session → Stripe webhook writes VideoPurchase on
 * checkout.session.completed → next page render reads the row via
 * `get-lesson-with-progress.ts` and enables playback for that user.
 */
export async function purchaseVideo(
  videoId: string
): Promise<PurchaseResponse> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user?.id) {
    return { status: "error", message: "Authentication required" }
  }

  if (!stripe) {
    return { status: "error", message: "Payment system is not configured" }
  }

  const headersList = await headers()
  const referer = headersList.get("referer") || ""
  const locale = extractLocaleFromUrl(referer) || i18n.defaultLocale

  const video = await db.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      visibility: true,
      approvalStatus: true,
      catalogLessonId: true,
      lesson: {
        select: {
          chapter: {
            select: { subject: { select: { slug: true } } },
          },
        },
      },
    },
  })

  if (!video) {
    return { status: "error", message: "Video not found" }
  }

  if (video.approvalStatus !== "APPROVED" || video.visibility !== "PAID") {
    return {
      status: "error",
      message: "This video is not available for purchase",
    }
  }

  if (!video.price || video.price <= 0 || !video.currency) {
    return { status: "error", message: "Video pricing is incomplete" }
  }

  // Re-unlock is a no-op — the webhook-created row is unique per (user, video).
  const existing = await db.videoPurchase.findUnique({
    where: { userId_videoId: { userId: session.user.id, videoId } },
    select: { status: true },
  })

  if (existing?.status === "SUCCESS") {
    return { status: "error", message: "You already own this video" }
  }

  // Reuse any existing Stripe customer to keep receipts/invoices consolidated.
  let stripeCustomerId: string
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true, username: true },
  })

  if (user?.stripeCustomerId) {
    stripeCustomerId = user.stripeCustomerId
  } else {
    const customer = await stripe.customers.create({
      email: user?.email || undefined,
      name: user?.username || undefined,
      metadata: {
        userId: session.user.id,
        ...(schoolId ? { schoolId } : {}),
      },
    })
    stripeCustomerId = customer.id
    await db.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId },
    })
  }

  const subjectSlug = video.lesson.chapter.subject.slug
  const successUrl = `${env.NEXT_PUBLIC_APP_URL}/${locale}/stream/courses/${subjectSlug}?purchased=${video.id}`
  const cancelUrl = `${env.NEXT_PUBLIC_APP_URL}/${locale}/stream/courses/${subjectSlug}`

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: video.currency.toLowerCase(),
            product_data: { name: video.title },
            unit_amount: Math.round(Number(video.price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: session.user.id,
        videoId: video.id,
        type: "video_purchase",
        ...(schoolId ? { schoolId } : {}),
      },
    })

    // Upsert a PENDING row so the admin UI can show the pending intent even
    // before the webhook fires. The webhook flips status to SUCCESS.
    await db.videoPurchase.upsert({
      where: { userId_videoId: { userId: session.user.id, videoId: video.id } },
      update: {
        stripeSessionId: checkoutSession.id,
        amount: Number(video.price),
        currency: video.currency,
        schoolId: schoolId ?? null,
        status: "PENDING",
      },
      create: {
        userId: session.user.id,
        videoId: video.id,
        schoolId: schoolId ?? null,
        amount: Number(video.price),
        currency: video.currency,
        stripeSessionId: checkoutSession.id,
        status: "PENDING",
      },
    })

    if (!checkoutSession.url) {
      return { status: "error", message: "Failed to create checkout session" }
    }

    return { status: "success", checkoutUrl: checkoutSession.url }
  } catch (error) {
    console.error("Video purchase error:", error)
    if (error instanceof Stripe.errors.StripeError) {
      return {
        status: "error",
        message: "Payment system error. Please try again later.",
      }
    }
    return { status: "error", message: "Failed to start purchase" }
  }
}

/**
 * Server-action wrapper that initiates the purchase and redirects to Stripe
 * Checkout. Use this from `<form action={...}>` or button click handlers
 * where a redirect is the expected outcome.
 */
export async function purchaseVideoAndRedirect(videoId: string) {
  const result = await purchaseVideo(videoId)
  if (result.status === "success" && result.checkoutUrl) {
    redirect(result.checkoutUrl)
  }
  throw new Error(result.message || "Failed to start purchase")
}
