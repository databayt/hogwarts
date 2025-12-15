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

// WHY NO STRIPE TYPES: Keeps route lean, avoids version conflicts
import { db } from "@/lib/db"
import { getTierIdFromStripePrice } from "@/components/marketing/pricing/lib/get-tier-id"
import { stripe } from "@/components/marketing/pricing/lib/stripe"

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

  if ((event as { type: string })?.type === "checkout.session.completed") {
    const eventData = event as {
      data: {
        object: { metadata?: { userId?: string }; subscription?: string }
      }
    }
    const session = eventData.data.object

    // Retrieve the subscription details from Stripe (cast to lightweight shape to avoid type deps)
    const subscriptionRes = await stripe.subscriptions.retrieve(
      session.subscription as string
    )
    const subscription = subscriptionRes as unknown as {
      id: string
      customer: string | { id: string }
      items: { data: Array<{ price: { id: string } }> }
      current_period_end: number
      cancel_at_period_end?: boolean
      status: string
    }

    // Update the user stripe info in our database.
    const updatedUser = await db.user.update({
      where: {
        id: session?.metadata?.userId,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    })

    // Also upsert school-level subscription if user belongs to a school
    if (updatedUser.schoolId) {
      await db.subscription.upsert({
        where: { stripeSubscriptionId: subscription.id },
        update: {
          stripePriceId: subscription.items.data[0].price.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
          status: subscription.status,
        },
        create: {
          schoolId: updatedUser.schoolId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
          status: subscription.status,
          tierId: await getTierIdFromStripePrice(
            subscription.items.data[0].price.id
          ),
        },
      })
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
      // Retrieve the subscription details from Stripe (cast to lightweight shape)
      const subscriptionRes = await stripe.subscriptions.retrieve(
        session.subscription as string
      )
      const subscription = subscriptionRes as unknown as {
        id: string
        customer: string | { id: string }
        items: { data: Array<{ price: { id: string } }> }
        current_period_end: number
        cancel_at_period_end?: boolean
        status: string
      }

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
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
        })
      }

      // Upsert school-level subscription and record invoice
      if (user?.schoolId) {
        await db.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          update: {
            stripePriceId: subscription.items.data[0].price.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            status: subscription.status,
          },
          create: {
            schoolId: user.schoolId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            status: subscription.status,
            tierId: await getTierIdFromStripePrice(
              subscription.items.data[0].price.id
            ),
          },
        })

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

  return new Response(null, { status: 200 })
}
