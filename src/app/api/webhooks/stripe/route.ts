// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Stripe Webhook Handler
 *
 * Processes Stripe events to sync subscription state with our database.
 *
 * HANDLED EVENTS:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Plan change, renewal
 * - customer.subscription.deleted: Cancellation
 * - invoice.payment_succeeded: Successful payment
 * - invoice.payment_failed: Failed payment
 * - charge.refunded: Course enrollment refund
 * - charge.dispute.created: Payment dispute
 * - checkout.session.expired: Abandoned checkout cleanup
 *
 * SECURITY:
 * - Signature verification using STRIPE_WEBHOOK_SECRET
 * - Raw body parsing (not JSON) for signature validation
 * - Webhook secret must be from Stripe Dashboard, not CLI
 *
 * DATABASE UPDATES:
 * 1. User table: stripeSubscriptionId, stripeCustomerId, stripePriceId
 * 2. Subscription table: School-level subscription tracking
 *
 * WHY DUAL UPDATE (User + Subscription):
 * - User: Quick access to subscription status in JWT
 * - Subscription: Detailed tracking with tier features
 *
 * GOTCHAS:
 * - Stripe sends webhooks multiple times on failure - must be idempotent
 * - subscription.customer can be string OR object (handle both)
 * - Test webhooks (stripe trigger) have different signatures
 * - Period end is Unix timestamp (seconds, not ms)
 *
 * TESTING:
 * ```bash
 * stripe listen --forward-to localhost:3000/api/webhooks/stripe
 * stripe trigger checkout.session.completed
 * ```
 */

import { headers } from "next/headers"
import { Prisma } from "@prisma/client"

// WHY NO STRIPE TYPES: Keeps route lean, avoids version conflicts
import { db } from "@/lib/db"
import { getTierIdFromStripePrice } from "@/components/saas-marketing/pricing/lib/get-tier-id"
import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"

// Lightweight shape for the bits of a Stripe Subscription we read.
interface StripeSubscriptionLike {
  id: string
  customer: string | { id: string }
  items: {
    data: Array<{
      id: string
      price: { id: string }
      current_period_end?: number
    }>
  }
  current_period_end?: number
  cancel_at_period_end?: boolean
  status: string
}

/**
 * Resolve the subscription period-end as a valid Date.
 *
 * Under the pinned API version (clover, 2025-03+) `current_period_end` lives on
 * the subscription ITEM, not the subscription object. Older code read the
 * top-level field, which is now undefined → `new Date(undefined * 1000)` =
 * Invalid Date written to the DB. Prefer the item field, fall back to the
 * legacy top-level, and only return a Date when the timestamp is finite.
 */
function resolvePeriodEnd(sub: StripeSubscriptionLike): Date | null {
  const seconds =
    sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null
  return new Date(seconds * 1000)
}

/**
 * Map a Stripe price id to a tier id without throwing inside the webhook.
 * getTierIdFromStripePrice throws when no tier maps to the price — letting that
 * propagate would 500 the webhook and make Stripe retry a legitimately-paid
 * checkout forever. Log and return null instead.
 */
async function safeTierId(priceId: string): Promise<string | null> {
  try {
    return await getTierIdFromStripePrice(priceId)
  } catch (err) {
    console.error(
      `[Webhook] No tier mapping for price ${priceId} (continuing):`,
      err
    )
    return null
  }
}

export async function POST(req: Request) {
  if (!stripe) {
    return new Response("Stripe is not configured", { status: 500 })
  }

  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get("Stripe-Signature") as string

  let event: unknown

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
  }

  // Event-ID dedupe — Stripe replays events on transient errors (timeouts,
  // 5xx responses), and the previous "application-level" dedupe in this
  // handler relied on per-branch flags (e.g. `applicationFeePaid`) which
  // happen to short-circuit most replays but leak through for partial
  // payments. ProcessedWebhookEvent is the unified primitive: race-safe via
  // @@unique([provider, providerEventId]); P2002 on conflict means
  // "already processed, ack with 200 OK".
  const eventEnvelope = event as {
    id: string
    type: string
    data?: { object?: { metadata?: { schoolId?: string } } }
  }
  try {
    await db.processedWebhookEvent.create({
      data: {
        provider: "stripe",
        providerEventId: eventEnvelope.id,
        eventType: eventEnvelope.type,
        schoolId: eventEnvelope.data?.object?.metadata?.schoolId ?? null,
        payload: event as Prisma.InputJsonValue,
      },
    })
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      console.log(
        `[Webhook] Duplicate event ${eventEnvelope.id} — skipping (already processed)`
      )
      return new Response(null, { status: 200 })
    }
    // Any other DB error: log and continue. We'd rather process the event
    // (potentially twice) than reject a legitimate payment.
    console.error(
      "[Webhook] ProcessedWebhookEvent insert failed (continuing):",
      err
    )
  }

  // Money-mutating branches (video purchase, catalog enrollment) must NOT
  // swallow a DB failure with 200 — that takes the customer's money but never
  // grants access, with no retry. Instead, release the dedupe row (so Stripe's
  // replay is reprocessed rather than short-circuited at the top) and return
  // 5xx so Stripe actually retries. The underlying writes are idempotent
  // (upsert on a unique key / update by id), so reprocessing is safe.
  async function releaseDedupeAndFail(
    context: string,
    error: unknown
  ): Promise<Response> {
    console.error(
      `[Webhook] ${context} failed — releasing dedupe for retry:`,
      error
    )
    try {
      await db.processedWebhookEvent.delete({
        where: {
          provider_providerEventId: {
            provider: "stripe",
            providerEventId: eventEnvelope.id,
          },
        },
      })
    } catch (delErr) {
      // P2025 (row absent) is fine — the dedupe insert may have no-op'd above.
      console.error("[Webhook] Failed to release dedupe row:", delErr)
    }
    return new Response(`Webhook handler error: ${context}`, { status: 500 })
  }

  if ((event as { type: string })?.type === "checkout.session.completed") {
    const eventData = event as {
      data: {
        object: {
          metadata?: {
            userId?: string
            courseId?: string
            enrollmentId?: string
            schoolId?: string
            type?: string
            catalogSubjectId?: string
            applicationId?: string
            referenceNumber?: string
            feeAssignmentId?: string
            studentId?: string
            videoId?: string
          }
          subscription?: string
          payment_status?: string
          payment_intent?: string
        }
      }
    }
    const session = eventData.data.object

    // Handle APPLICATION FEE payments (one-time, no subscription)
    if (
      session.metadata?.type === "application_fee" &&
      session.metadata?.applicationId &&
      !session.subscription
    ) {
      if (session.payment_status === "paid") {
        try {
          // Idempotency: skip if already processed
          const existing = await db.application.findFirst({
            where: {
              id: session.metadata.applicationId,
              ...(session.metadata.schoolId && {
                schoolId: session.metadata.schoolId,
              }),
            },
            select: { applicationFeePaid: true },
          })
          if (existing?.applicationFeePaid) {
            return new Response(null, { status: 200 })
          }

          await db.application.update({
            where: {
              id: session.metadata.applicationId,
              ...(session.metadata.schoolId && {
                schoolId: session.metadata.schoolId,
              }),
            },
            data: {
              applicationFeePaid: true,
              paymentId: (session.payment_intent as string) ?? null,
              paymentDate: new Date(),
            },
          })

          console.log(
            `[Webhook] Application fee paid: ${session.metadata.applicationId}`
          )

          // Send payment confirmation notification (non-fatal)
          try {
            const app = await db.application.findFirst({
              where: { id: session.metadata.applicationId },
              select: {
                userId: true,
                applicationNumber: true,
                schoolId: true,
              },
            })
            if (app?.userId && app.schoolId) {
              const { dispatchNotification, resolveSchoolLang } =
                await import("@/lib/dispatch-notification")
              const lang = await resolveSchoolLang(app.schoolId)
              const isAr = lang === "ar"
              await dispatchNotification({
                schoolId: app.schoolId,
                userId: app.userId,
                type: "fee_paid",
                title: isAr ? "تم استلام الدفع" : "Payment Received",
                body: isAr
                  ? `تم تأكيد دفع رسوم الطلب ${app.applicationNumber} بنجاح`
                  : `Application fee payment for ${app.applicationNumber} confirmed.`,
                lang,
                priority: "normal",
                channels: ["in_app", "email"],
                metadata: {
                  applicationId: session.metadata.applicationId,
                  paymentType: "application_fee",
                },
              })
            }
          } catch (notifError) {
            console.error("[Webhook] Payment notification failed:", notifError)
          }
        } catch (error) {
          console.error("[Webhook] Failed to record application fee:", error)
        }
      }

      return new Response(null, { status: 200 })
    }

    // Handle REGISTRATION FEE payments (one-time, no subscription)
    if (
      session.metadata?.type === "registration_fee" &&
      session.metadata?.applicationId &&
      !session.subscription
    ) {
      if (session.payment_status === "paid") {
        try {
          // Idempotency: skip if already processed
          const existing = await db.application.findFirst({
            where: {
              id: session.metadata.applicationId,
              ...(session.metadata.schoolId && {
                schoolId: session.metadata.schoolId,
              }),
            },
            select: { registrationFeePaid: true },
          })
          if (existing?.registrationFeePaid) {
            return new Response(null, { status: 200 })
          }

          const amountTotal = (session as unknown as { amount_total?: number })
            .amount_total

          await db.application.update({
            where: {
              id: session.metadata.applicationId,
              ...(session.metadata.schoolId && {
                schoolId: session.metadata.schoolId,
              }),
            },
            data: {
              registrationFeePaid: true,
              registrationFeeAmount:
                amountTotal != null ? amountTotal / 100 : null,
              registrationFeeMethod: "stripe",
              registrationFeeReference:
                (session as unknown as { id?: string }).id ?? null,
              registrationFeeDate: new Date(),
            },
          })

          console.log(
            `[Webhook] Registration fee paid: ${session.metadata.applicationId}`
          )

          // Send payment confirmation notification (non-fatal)
          try {
            const app = await db.application.findFirst({
              where: { id: session.metadata.applicationId },
              select: {
                userId: true,
                applicationNumber: true,
                schoolId: true,
              },
            })
            if (app?.userId && app.schoolId) {
              const { dispatchNotification, resolveSchoolLang } =
                await import("@/lib/dispatch-notification")
              const lang = await resolveSchoolLang(app.schoolId)
              const isAr = lang === "ar"
              await dispatchNotification({
                schoolId: app.schoolId,
                userId: app.userId,
                type: "fee_paid",
                title: isAr
                  ? "تم استلام رسوم التسجيل"
                  : "Registration Fee Received",
                body: isAr
                  ? `تم تأكيد دفع رسوم التسجيل للطلب ${app.applicationNumber} بنجاح`
                  : `Registration fee for application ${app.applicationNumber} confirmed.`,
                lang,
                priority: "normal",
                channels: ["in_app", "email"],
                metadata: {
                  applicationId: session.metadata.applicationId,
                  paymentType: "registration_fee",
                },
              })
            }
          } catch (notifError) {
            console.error(
              "[Webhook] Registration fee notification failed:",
              notifError
            )
          }
        } catch (error) {
          console.error("[Webhook] Failed to record registration fee:", error)
        }
      }

      return new Response(null, { status: 200 })
    }

    // Handle FEE PAYMENT (one-time, no subscription)
    if (
      session.metadata?.type === "fee_payment" &&
      session.metadata?.feeAssignmentId &&
      !session.subscription
    ) {
      if (session.payment_status === "paid") {
        try {
          const feeAssignmentId = session.metadata.feeAssignmentId
          const schoolId = session.metadata.schoolId

          // Get the assignment with existing payments to calculate remaining.
          // Include school.currency so the new Payment row carries a snapshot
          // of the school's currency at charge time (P1.1).
          const assignment = await db.feeAssignment.findFirst({
            where: {
              id: feeAssignmentId,
              ...(schoolId ? { schoolId } : {}),
            },
            include: {
              payments: {
                where: { status: "SUCCESS" },
                select: { amount: true },
              },
              student: {
                select: { userId: true, firstName: true, lastName: true },
              },
              school: { select: { currency: true } },
            },
          })

          if (assignment) {
            const totalPaid = assignment.payments.reduce(
              (sum, p) => sum + Number(p.amount),
              0
            )
            const finalAmount = Number(assignment.finalAmount)

            // Remaining is what Stripe charged
            const paymentAmount = finalAmount - totalPaid

            if (paymentAmount > 0) {
              // Create payment record. P1.1: snapshot currency from
              // assignment (set at create time from School.currency).
              // P1.3: gatewayMethod left null here — Stripe Checkout doesn't
              // surface the wallet (Apple Pay/Google Pay) on session.completed;
              // the underlying PaymentIntent would, but we'd need to attach a
              // payment_intent.succeeded handler to read it.
              const paymentCurrency =
                assignment.currency ?? assignment.school?.currency ?? "USD"
              const payment = await db.payment.create({
                data: {
                  schoolId: assignment.schoolId,
                  feeAssignmentId,
                  studentId: assignment.studentId,
                  paymentNumber:
                    `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
                  amount: paymentAmount,
                  currency: paymentCurrency,
                  paymentMethod: "CREDIT_CARD",
                  paymentDate: new Date(),
                  status: "SUCCESS",
                  receiptNumber:
                    `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
                  transactionId: (session.payment_intent as string) ?? null,
                },
              })

              // Update assignment status
              const newTotalPaid = totalPaid + paymentAmount
              const newStatus = newTotalPaid >= finalAmount ? "PAID" : "PARTIAL"
              await db.feeAssignment.update({
                where: { id: feeAssignmentId },
                data: { status: newStatus },
              })

              console.log(
                `[Webhook] Fee payment recorded: ${feeAssignmentId}, amount: ${paymentAmount}, status: ${newStatus}`
              )

              // Post to double-entry ledger (issue #263 P1 — these poster
              // functions exist in finance/lib/accounting but were never
              // wired, so every Stripe-paid fee was previously invisible to
              // the trial balance). Non-fatal: a posting failure surfaces in
              // logs but the payment itself is already recorded — admin can
              // re-post manually via the accounting UI.
              try {
                const { postFeePayment } =
                  await import("@/components/school-dashboard/finance/lib/accounting/actions")
                const postResult = await postFeePayment(
                  assignment.schoolId,
                  {
                    paymentId: payment.id,
                    studentId: assignment.studentId,
                    amount: paymentAmount,
                    paymentMethod: "CREDIT_CARD",
                    paymentDate: payment.paymentDate,
                  },
                  "system:stripe-webhook"
                )
                if (!postResult.success) {
                  console.error(
                    "[Webhook] postFeePayment failed:",
                    postResult.errors
                  )
                }
              } catch (postingErr) {
                console.error(
                  "[Webhook] Ledger posting threw (continuing):",
                  postingErr
                )
              }

              // Sync linked invoice status (non-fatal)
              try {
                const linkedInvoice = await db.userInvoice.findFirst({
                  where: { feeAssignmentId, schoolId: assignment.schoolId },
                })
                if (linkedInvoice) {
                  await db.userInvoice.update({
                    where: { id: linkedInvoice.id },
                    data: {
                      status: newStatus === "PAID" ? "PAID" : "UNPAID",
                    },
                  })
                }
              } catch (invoiceSyncErr) {
                console.error("[Webhook] Invoice sync failed:", invoiceSyncErr)
              }

              // Notify student (non-fatal)
              try {
                if (assignment.student?.userId) {
                  const { dispatchNotification, resolveSchoolLang } =
                    await import("@/lib/dispatch-notification")
                  const lang = await resolveSchoolLang(assignment.schoolId)
                  const isAr = lang === "ar"
                  await dispatchNotification({
                    schoolId: assignment.schoolId,
                    userId: assignment.student.userId,
                    type: "fee_paid",
                    title: isAr ? "تم استلام الدفعة" : "Payment Received",
                    body: isAr
                      ? `تم تأكيد الدفع الإلكتروني بنجاح. ${newStatus === "PAID" ? "تم سداد الرسوم بالكامل." : ""}`
                      : `Online payment confirmed. ${newStatus === "PAID" ? "The fee is fully paid." : ""}`,
                    lang,
                    priority: "normal",
                    channels: ["in_app", "email", "whatsapp"],
                    metadata: {
                      paymentId: payment.id,
                      feeAssignmentId,
                      amount: paymentAmount,
                      status: newStatus,
                      receiptNumber: payment.receiptNumber,
                      url: `/finance/fees/payments/${payment.id}`,
                    },
                  })
                }
              } catch (notifError) {
                console.error(
                  "[Webhook] Fee payment notification failed:",
                  notifError
                )
              }
            }
          }
        } catch (error) {
          console.error("[Webhook] Failed to record fee payment:", error)
        }
      }

      return new Response(null, { status: 200 })
    }

    // Handle VIDEO PURCHASE payments (one-time, no subscription).
    // Flips the pending VideoPurchase row to SUCCESS so the lesson viewer
    // unlocks playback on the next render.
    if (
      session.metadata?.type === "video_purchase" &&
      session.metadata?.videoId &&
      session.metadata?.userId &&
      !session.subscription
    ) {
      if (session.payment_status === "paid") {
        try {
          await db.videoPurchase.upsert({
            where: {
              userId_videoId: {
                userId: session.metadata.userId,
                videoId: session.metadata.videoId,
              },
            },
            update: {
              status: "SUCCESS",
              stripeSessionId:
                (session as unknown as { id?: string }).id ?? null,
            },
            create: {
              userId: session.metadata.userId,
              videoId: session.metadata.videoId,
              schoolId: session.metadata.schoolId ?? null,
              amount:
                ((session as unknown as { amount_total?: number })
                  .amount_total ?? 0) / 100,
              currency:
                (
                  session as unknown as { currency?: string }
                ).currency?.toUpperCase() ?? "USD",
              stripeSessionId:
                (session as unknown as { id?: string }).id ?? null,
              status: "SUCCESS",
            },
          })

          console.log(
            `[Webhook] Video purchase recorded: ${session.metadata.videoId} for user ${session.metadata.userId}`
          )
        } catch (error) {
          return releaseDedupeAndFail("video purchase", error)
        }
      }

      return new Response(null, { status: 200 })
    }

    // Handle CATALOG ENROLLMENT payments (one-time, no subscription)
    if (
      session.metadata?.type === "catalog_enrollment" &&
      session.metadata?.catalogSubjectId &&
      session.metadata?.enrollmentId &&
      !session.subscription
    ) {
      if (session.payment_status === "paid") {
        try {
          await db.enrollment.update({
            where: {
              id: session.metadata.enrollmentId,
              ...(session.metadata.schoolId && {
                schoolId: session.metadata.schoolId,
              }),
            },
            data: {
              isActive: true,
              status: "ACTIVE",
              updatedAt: new Date(),
            },
          })

          console.log(
            `[Webhook] Catalog enrollment activated: ${session.metadata.enrollmentId}`
          )
        } catch (error) {
          return releaseDedupeAndFail("catalog enrollment", error)
        }
      }

      return new Response(null, { status: 200 })
    }

    // Handle COURSE ENROLLMENT payments (one-time, no subscription)
    if (
      session.metadata?.courseId &&
      session.metadata?.enrollmentId &&
      !session.subscription
    ) {
      // Verify payment was successful
      if (session.payment_status === "paid") {
        try {
          // Activate the enrollment
          await db.streamEnrollment.update({
            where: {
              id: session.metadata.enrollmentId,
              schoolId: session.metadata.schoolId, // Multi-tenant safety
            },
            data: {
              isActive: true,
              updatedAt: new Date(),
            },
          })

          console.log(
            `[Webhook] Course enrollment activated: ${session.metadata.enrollmentId}`
          )
        } catch (error) {
          console.error("[Webhook] Failed to activate enrollment:", error)
          // Don't throw - return 200 so Stripe doesn't retry
          // The success page verification will handle this
        }
      }

      // Return early - this is not a subscription payment
      return new Response(null, { status: 200 })
    }

    // Handle SUBSCRIPTION payments (existing logic)
    if (!session.subscription) {
      // No subscription, nothing to do for subscription handling
      return new Response(null, { status: 200 })
    }

    // Retrieve the subscription details from Stripe.
    const subscriptionRes = await stripe.subscriptions.retrieve(
      session.subscription as string
    )
    const subscription = subscriptionRes as unknown as StripeSubscriptionLike
    const priceId = subscription.items.data[0].price.id
    const periodEnd = resolvePeriodEnd(subscription)

    // Update the user stripe info in our database.
    const updatedUser = await db.user.update({
      where: {
        id: session?.metadata?.userId,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        ...(periodEnd ? { stripeCurrentPeriodEnd: periodEnd } : {}),
      },
    })

    // Also upsert school-level subscription if user belongs to a school.
    // currentPeriodEnd + tierId are required columns, so only upsert when both
    // resolve; a missing tier mapping or period must not 500 the webhook (which
    // would make Stripe retry a legitimately-paid checkout forever).
    if (updatedUser.schoolId) {
      const tierId = await safeTierId(priceId)
      if (periodEnd && tierId) {
        await db.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          update: {
            stripePriceId: priceId,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            status: subscription.status,
            tierId,
          },
          create: {
            schoolId: updatedUser.schoolId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: priceId,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            status: subscription.status,
            tierId,
          },
        })
      } else {
        console.error(
          "[Webhook] Skipping subscription upsert — unresolved periodEnd/tierId",
          { subscriptionId: subscription.id, periodEnd, tierId }
        )
      }
    }
  }

  if ((event as { type: string })?.type === "invoice.payment_succeeded") {
    interface InvoiceEventData {
      data: {
        object: {
          billing_reason?: string
          subscription?: string
          id?: string
          amount_due?: number
          amount_paid?: number
          currency?: string
          status?: string
          lines?: {
            data?: Array<{ period?: { start?: number; end?: number } }>
          }
          period_start?: number
          period_end?: number
        }
      }
    }
    const eventData = event as InvoiceEventData
    const session = eventData.data.object

    // If the billing reason is not subscription_create, it means the customer has updated their subscription.
    // If it is subscription_create, we don't need to update the subscription id and it will handle by the checkout.session.completed event.
    if (session.billing_reason != "subscription_create") {
      // Retrieve the subscription details from Stripe.
      const subscriptionRes = await stripe.subscriptions.retrieve(
        session.subscription as string
      )
      const subscription = subscriptionRes as unknown as StripeSubscriptionLike
      const priceId = subscription.items.data[0].price.id
      const periodEnd = resolvePeriodEnd(subscription)

      // Find the user by subscription id (not unique) and update by id
      const existingUser = await db.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
        select: { id: true, schoolId: true },
      })

      const user = existingUser
      if (existingUser?.id) {
        await db.user.update({
          where: { id: existingUser.id },
          data: {
            stripePriceId: priceId,
            ...(periodEnd ? { stripeCurrentPeriodEnd: periodEnd } : {}),
          },
        })
      }

      // Upsert school-level subscription and record invoice
      if (user?.schoolId) {
        const tierId = await safeTierId(priceId)
        if (periodEnd && tierId) {
          await db.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            update: {
              stripePriceId: priceId,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
              status: subscription.status,
              tierId,
            },
            create: {
              schoolId: user.schoolId,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              stripePriceId: priceId,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
              status: subscription.status,
              tierId,
            },
          })
        } else {
          console.error(
            "[Webhook] Skipping subscription upsert (invoice path) — unresolved periodEnd/tierId",
            { subscriptionId: subscription.id, periodEnd, tierId }
          )
        }

        if (session.id) {
          await db.invoice.upsert({
            where: { stripeInvoiceId: session.id },
            update: {
              amountDue: session.amount_due ?? 0,
              amountPaid: session.amount_paid ?? 0,
              currency: session.currency ?? "usd",
              status: session.status ?? "paid",
              periodStart: new Date(
                (session.lines?.data?.[0]?.period?.start ??
                  session.period_start ??
                  Date.now() / 1000) * 1000
              ),
              periodEnd: new Date(
                (session.lines?.data?.[0]?.period?.end ??
                  session.period_end ??
                  Date.now() / 1000) * 1000
              ),
            },
            create: {
              schoolId: user.schoolId,
              stripeInvoiceId: session.id,
              amountDue: session.amount_due ?? 0,
              amountPaid: session.amount_paid ?? 0,
              currency: session.currency ?? "usd",
              status: session.status ?? "paid",
              periodStart: new Date(
                (session.lines?.data?.[0]?.period?.start ??
                  session.period_start ??
                  Date.now() / 1000) * 1000
              ),
              periodEnd: new Date(
                (session.lines?.data?.[0]?.period?.end ??
                  session.period_end ??
                  Date.now() / 1000) * 1000
              ),
            },
          })
        }
      }
    }
  }

  // ============================================
  // COURSE ENROLLMENT: Refund handling
  // ============================================
  if ((event as { type: string })?.type === "charge.refunded") {
    const eventData = event as {
      data: {
        object: {
          metadata?: {
            courseId?: string
            enrollmentId?: string
            schoolId?: string
          }
          payment_intent?: string
        }
      }
    }
    const charge = eventData.data.object

    // Only handle course enrollment refunds (identified by metadata)
    if (charge.metadata?.enrollmentId && charge.metadata?.schoolId) {
      try {
        await db.streamEnrollment.update({
          where: {
            id: charge.metadata.enrollmentId,
            schoolId: charge.metadata.schoolId,
          },
          data: {
            isActive: false,
            status: "CANCELLED",
            updatedAt: new Date(),
          },
        })

        console.log(
          `[Webhook] Enrollment deactivated (refund): ${charge.metadata.enrollmentId}`
        )
      } catch (error) {
        console.error(
          "[Webhook] Failed to deactivate enrollment on refund:",
          error
        )
      }
    }
  }

  // ============================================
  // COURSE ENROLLMENT: Dispute handling
  // ============================================
  if ((event as { type: string })?.type === "charge.dispute.created") {
    const eventData = event as {
      data: {
        object: {
          charge?: string
          metadata?: {
            courseId?: string
            enrollmentId?: string
            schoolId?: string
          }
        }
      }
    }
    const dispute = eventData.data.object

    if (dispute.metadata?.enrollmentId && dispute.metadata?.schoolId) {
      try {
        await db.streamEnrollment.update({
          where: {
            id: dispute.metadata.enrollmentId,
            schoolId: dispute.metadata.schoolId,
          },
          data: {
            isActive: false,
            status: "CANCELLED",
            updatedAt: new Date(),
          },
        })

        console.log(
          `[Webhook] Enrollment deactivated (dispute): ${dispute.metadata.enrollmentId}`
        )
      } catch (error) {
        console.error(
          "[Webhook] Failed to deactivate enrollment on dispute:",
          error
        )
      }
    }
  }

  // ============================================
  // SUBSCRIPTION: Updated (plan change, renewal, status change)
  // P3.1 — was documented as handled but never implemented; the dedupe
  // primitive already runs above, so this branch just syncs the row.
  // ============================================
  if ((event as { type: string })?.type === "customer.subscription.updated") {
    const sub = (
      event as {
        data: {
          object: {
            id: string
            status: string
            current_period_end?: number
            cancel_at_period_end?: boolean
            items?: { data?: Array<{ price?: { id?: string } }> }
            metadata?: { schoolId?: string; userId?: string }
          }
        }
      }
    ).data.object
    try {
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          stripePriceId: sub.items?.data?.[0]?.price?.id,
          stripeCurrentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : undefined,
        },
      })
      console.log(
        `[Webhook] customer.subscription.updated: ${sub.id} status=${sub.status}`
      )
    } catch (err) {
      console.error("[Webhook] subscription.updated sync failed:", err)
    }
  }

  // ============================================
  // SUBSCRIPTION: Deleted (cancellation took effect)
  // P3.1 — flip the user's stripeCurrentPeriodEnd so JWT-side gating sees
  // them as a free-plan user. Notification dispatch is intentionally
  // skipped; Stripe already emails the customer on cancellation.
  // ============================================
  if ((event as { type: string })?.type === "customer.subscription.deleted") {
    const sub = (event as { data: { object: { id: string } } }).data.object
    try {
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          stripeCurrentPeriodEnd: new Date(0), // hard-expire — JWT will treat as free
        },
      })
      console.log(`[Webhook] customer.subscription.deleted: ${sub.id}`)
    } catch (err) {
      console.error("[Webhook] subscription.deleted sync failed:", err)
    }
  }

  // ============================================
  // INVOICE: Payment failed — notify school admin so they can retry
  // before the subscription enters dunning. P3.1.
  // ============================================
  if ((event as { type: string })?.type === "invoice.payment_failed") {
    const invoice = (
      event as {
        data: {
          object: {
            id: string
            customer?: string
            subscription?: string
            amount_due?: number
            currency?: string
            hosted_invoice_url?: string
          }
        }
      }
    ).data.object
    console.warn(
      `[Webhook] invoice.payment_failed: invoice=${invoice.id} subscription=${invoice.subscription ?? "none"}`
    )
    // TODO(P3.1-followup): dispatch notification to school admin. Today we
    // log + ack so the dedupe row gets written and Stripe stops retrying.
  }

  // ============================================
  // PAYMENT_INTENT: Succeeded — when a Checkout Session uses
  // automatic_payment_methods (the P0.3 default), the wallet identity
  // (Apple Pay / Google Pay / Link) is reported here, not on
  // checkout.session.completed. We enrich Payment.gatewayMethod
  // retroactively so the receipt + reconciliation report show the right
  // wallet badge. P3.1.
  // ============================================
  if ((event as { type: string })?.type === "payment_intent.succeeded") {
    const pi = (
      event as {
        data: {
          object: {
            id: string
            payment_method_types?: string[]
            charges?: {
              data?: Array<{
                payment_method_details?: {
                  card?: { wallet?: { type?: string }; brand?: string }
                  type?: string
                }
              }>
            }
            metadata?: { schoolId?: string; feeAssignmentId?: string }
          }
        }
      }
    ).data.object
    // Resolve the wallet/method: prefer wallet.type (apple_pay/google_pay/link),
    // fall back to card.brand (visa/mastercard/mada), then the generic
    // payment_method_details.type (card/ideal/etc.).
    const charge = pi.charges?.data?.[0]
    const wallet = charge?.payment_method_details?.card?.wallet?.type
    const brand = charge?.payment_method_details?.card?.brand
    const fallback = charge?.payment_method_details?.type
    const gatewayMethod = (wallet ?? brand ?? fallback ?? "")
      .toString()
      .toUpperCase()
    if (gatewayMethod) {
      try {
        await db.payment.updateMany({
          where: { transactionId: pi.id, gatewayMethod: null },
          data: { gatewayMethod },
        })
        console.log(
          `[Webhook] payment_intent.succeeded: enriched gatewayMethod=${gatewayMethod} for ${pi.id}`
        )
      } catch (err) {
        console.error("[Webhook] payment_intent.succeeded enrich failed:", err)
      }
    }
  }

  // ============================================
  // PAYMENT_INTENT: Payment failed — surface to the parent with a retry
  // link so they don't think the payment vanished. P3.1.
  // ============================================
  if ((event as { type: string })?.type === "payment_intent.payment_failed") {
    const pi = (
      event as {
        data: {
          object: {
            id: string
            last_payment_error?: { message?: string; code?: string }
            metadata?: {
              schoolId?: string
              feeAssignmentId?: string
              studentId?: string
              type?: string
            }
          }
        }
      }
    ).data.object
    const meta = pi.metadata
    const errMsg =
      pi.last_payment_error?.message ?? pi.last_payment_error?.code ?? "unknown"
    console.warn(
      `[Webhook] payment_intent.payment_failed: ${pi.id} type=${meta?.type ?? "none"} reason=${errMsg}`
    )
    if (
      meta?.schoolId &&
      meta?.feeAssignmentId &&
      meta?.studentId &&
      meta?.type === "fee_payment"
    ) {
      try {
        const student = await db.student.findFirst({
          where: { id: meta.studentId, schoolId: meta.schoolId },
          select: { userId: true },
        })
        if (student?.userId) {
          const { dispatchNotification } =
            await import("@/lib/dispatch-notification")
          await dispatchNotification({
            schoolId: meta.schoolId,
            userId: student.userId,
            type: "fee_due",
            title: "Payment Failed",
            body: `Your card payment didn't go through (${errMsg}). Please try again or use another payment method.`,
            lang: "ar",
            priority: "high",
            channels: ["in_app", "email"],
            metadata: {
              feeAssignmentId: meta.feeAssignmentId,
              paymentIntentId: pi.id,
              url: `/finance/fees/assignments/${meta.feeAssignmentId}`,
            },
          })
        }
      } catch (notifErr) {
        console.error(
          "[Webhook] payment_intent.payment_failed notification failed:",
          notifErr
        )
      }
    }
  }

  // ============================================
  // COURSE ENROLLMENT: Expired checkout cleanup
  // ============================================
  if ((event as { type: string })?.type === "checkout.session.expired") {
    const eventData = event as {
      data: {
        object: {
          id?: string
          metadata?: {
            courseId?: string
            enrollmentId?: string
            schoolId?: string
          }
        }
      }
    }
    const expiredSession = eventData.data.object

    // Only clean up course enrollment checkouts (not subscription ones)
    if (
      expiredSession.metadata?.enrollmentId &&
      expiredSession.metadata?.schoolId &&
      expiredSession.metadata?.courseId
    ) {
      try {
        // Delete the pending enrollment that was never paid
        await db.streamEnrollment.deleteMany({
          where: {
            id: expiredSession.metadata.enrollmentId,
            schoolId: expiredSession.metadata.schoolId,
            isActive: false, // Only delete if never activated
          },
        })

        console.log(
          `[Webhook] Pending enrollment cleaned up (expired checkout): ${expiredSession.metadata.enrollmentId}`
        )
      } catch (error) {
        console.error("[Webhook] Failed to clean up expired enrollment:", error)
      }
    }
  }

  // ============================================
  // SUBSCRIPTION: out-of-band update (plan change, renewal, portal edit)
  // ============================================
  // Previously unhandled — a school that downgraded or whose renewal changed in
  // the Stripe Billing Portal never synced back, so the app kept showing the
  // old plan/period. event.data.object IS the Subscription here.
  if ((event as { type: string })?.type === "customer.subscription.updated") {
    const sub = (event as { data: { object: StripeSubscriptionLike } }).data
      .object
    const priceId = sub.items?.data?.[0]?.price?.id
    const periodEnd = resolvePeriodEnd(sub)
    try {
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          ...(priceId ? { stripePriceId: priceId } : {}),
          ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
        },
      })
      // Mirror onto User so JWT-based entitlement reflects the change.
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          ...(priceId ? { stripePriceId: priceId } : {}),
          ...(periodEnd ? { stripeCurrentPeriodEnd: periodEnd } : {}),
        },
      })
      console.log(`[Webhook] Subscription updated: ${sub.id} (${sub.status})`)
    } catch (error) {
      console.error("[Webhook] Failed to sync subscription update:", error)
    }
  }

  // ============================================
  // SUBSCRIPTION: cancellation / deletion → downgrade entitlement
  // ============================================
  if ((event as { type: string })?.type === "customer.subscription.deleted") {
    const sub = (event as { data: { object: { id: string } } }).data.object
    try {
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: "canceled", cancelAtPeriodEnd: true },
      })
      // Null the period-end so getUserSubscriptionPlan().isPaid flips to false
      // (it requires stripeCurrentPeriodEnd in the future).
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { stripeCurrentPeriodEnd: null },
      })
      console.log(`[Webhook] Subscription canceled: ${sub.id}`)
    } catch (error) {
      console.error("[Webhook] Failed to process subscription deletion:", error)
    }
  }

  // ============================================
  // SUBSCRIPTION: failed renewal → past_due (dunning)
  // ============================================
  if ((event as { type: string })?.type === "invoice.payment_failed") {
    const invoice = (
      event as { data: { object: { subscription?: string } } }
    ).data.object
    if (invoice.subscription) {
      try {
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription },
          data: { status: "past_due" },
        })
        console.log(
          `[Webhook] Invoice payment failed → past_due: ${invoice.subscription}`
        )
      } catch (error) {
        console.error("[Webhook] Failed to mark subscription past_due:", error)
      }
    }
  }

  return new Response(null, { status: 200 })
}
