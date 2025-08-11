import { headers } from "next/headers";
// Avoid direct Stripe type import to keep route lean and avoid type deps
import { db } from "@/lib/db";
import { stripe } from "@/components/marketing/pricing/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("Stripe-Signature") as string;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (error: any) {
    return new Response(`Webhook Error: ${String(error?.message || error)}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

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
          subscription.current_period_end * 1000,
        ),
      },
    });

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
        },
      });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const session = event.data.object as any;

    // If the billing reason is not subscription_create, it means the customer has updated their subscription.
    // If it is subscription_create, we don't need to update the subscription id and it will handle by the checkout.session.completed event.
    if (session.billing_reason != "subscription_create") {
      // Retrieve the subscription details from Stripe.
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      // Find the user by subscription id (not unique) and update by id
      const existingUser = await db.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
        select: { id: true, schoolId: true },
      });

      let user = existingUser;
      if (existingUser?.id) {
        await db.user.update({
          where: { id: existingUser.id },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000,
            ),
          },
        });
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
          },
        });

        if (session.id) {
          await db.invoice.upsert({
            where: { stripeInvoiceId: session.id },
            update: {
              amountDue: session.amount_due ?? 0,
              amountPaid: session.amount_paid ?? 0,
              currency: session.currency ?? "usd",
              status: session.status ?? "paid",
              periodStart: new Date((session.lines?.data?.[0]?.period?.start ?? session.period_start ?? Date.now()/1000) * 1000),
              periodEnd: new Date((session.lines?.data?.[0]?.period?.end ?? session.period_end ?? Date.now()/1000) * 1000),
            },
            create: {
              schoolId: user.schoolId,
              stripeInvoiceId: session.id,
              amountDue: session.amount_due ?? 0,
              amountPaid: session.amount_paid ?? 0,
              currency: session.currency ?? "usd",
              status: session.status ?? "paid",
              periodStart: new Date((session.lines?.data?.[0]?.period?.start ?? session.period_start ?? Date.now()/1000) * 1000),
              periodEnd: new Date((session.lines?.data?.[0]?.period?.end ?? session.period_end ?? Date.now()/1000) * 1000),
            },
          });
        }
      }
    }
  }

  return new Response(null, { status: 200 });
}