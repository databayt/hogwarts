// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Registration-fee settlement — the one place an online capture marks an
 * application's registration fee paid and tells everyone.
 *
 * Called by the Stripe and Tap webhooks (which used to carry two diverging
 * copies of this block) and by the return-page verifier. Idempotent: an
 * application already marked paid is left alone and reported as such, so a
 * replayed event or a webhook racing the return page can never double-notify.
 *
 * Payment materialisation into the `Payment` table happens at enrollment
 * (`confirmEnrollment`), not here — this only flips the application state and
 * notifies the family + the school. Cash / bank / wallet intents are settled by
 * an admin through `confirmRegistrationPayment` instead; only a gateway that
 * has proof of capture may call this.
 */

import "server-only"

import { db } from "@/lib/db"

export interface SettleRegistrationFeeInput {
  applicationId: string
  schoolId: string
  /** Gateway id ("stripe" | "tap"). Stored on `registrationFeeMethod`. */
  method: string
  /** Gateway session / charge id — stored on `registrationFeeReference`. */
  reference: string | null
  /** Captured amount in MAJOR units, or null when the gateway did not say. */
  amount: number | null
}

export type SettleRegistrationFeeResult =
  | "settled"
  | "already_paid"
  | "not_found"

const COPY = {
  familyTitle: {
    ar: "تم استلام رسوم التسجيل",
    en: "Registration Fee Received",
  },
  familyBody: (applicationNumber: string) => ({
    ar: `تم تأكيد دفع رسوم التسجيل للطلب ${applicationNumber} بنجاح`,
    en: `Registration fee for application ${applicationNumber} confirmed.`,
  }),
  schoolBody: (name: string, applicationNumber: string) => ({
    ar: `دفع ولي أمر ${name} رسوم التسجيل إلكترونياً (الطلب ${applicationNumber}). يمكن الآن تأكيد التسجيل.`,
    en: `The family of ${name} paid the registration fee online (application ${applicationNumber}). Enrollment can now be confirmed.`,
  }),
}
const t = (msg: { ar: string; en: string }, lang: string) =>
  lang === "en" ? msg.en : msg.ar

export async function settleRegistrationFee(
  input: SettleRegistrationFeeInput
): Promise<SettleRegistrationFeeResult> {
  const { applicationId, schoolId, method, reference, amount } = input

  // Conditional flip: only an UNPAID application transitions, so two callers
  // (webhook + return page) racing on the same capture can't both "win".
  const { count } = await db.application.updateMany({
    where: { id: applicationId, schoolId, registrationFeePaid: false },
    data: {
      registrationFeePaid: true,
      registrationFeeAmount: amount,
      registrationFeeMethod: method,
      registrationFeeReference: reference,
      registrationFeeDate: new Date(),
    },
  })
  if (count === 0) {
    const exists = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: { registrationFeePaid: true },
    })
    if (!exists) return "not_found"
    return "already_paid"
  }

  console.log(
    `[registration-fee] settled via ${method}: application=${applicationId} ref=${reference ?? "-"}`
  )

  // Notifications are non-fatal — the fee IS paid regardless.
  try {
    const app = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        applicationNumber: true,
      },
    })
    if (!app) return "settled"

    const {
      dispatchNotification,
      dispatchNotificationsToAudience,
      resolveSchoolLang,
    } = await import("@/lib/dispatch-notification")
    const lang = await resolveSchoolLang(schoolId)

    // Family: registered applicants in-app + email; GUEST applicants (no
    // userId — the wizard allows it) by email.
    await dispatchNotification({
      schoolId,
      userId: app.userId ?? undefined,
      directEmail: app.userId ? undefined : (app.email ?? undefined),
      type: "fee_paid",
      title: t(COPY.familyTitle, lang),
      body: t(COPY.familyBody(app.applicationNumber), lang),
      lang,
      priority: "normal",
      channels: ["in_app", "email"],
      metadata: {
        applicationId,
        paymentType: "registration_fee",
        reference,
      },
    })
    // School: the online payment is the one funding event the dashboard
    // never proactively learned of (accept/decline/cash-intent all alert
    // ADMIN).
    // `targetScope` is REQUIRED — without it the dispatcher resolves nobody and
    // returns `{ created: 0 }` (which is exactly why the previous inline copies
    // in both webhooks never alerted anyone).
    await dispatchNotificationsToAudience({
      schoolId,
      targetScope: "role",
      targetRoles: ["ADMIN", "ACCOUNTANT"],
      type: "fee_paid",
      title: t(COPY.familyTitle, lang),
      body: t(
        COPY.schoolBody(
          `${app.firstName} ${app.lastName}`.trim(),
          app.applicationNumber
        ),
        lang
      ),
      lang,
      priority: "normal",
      channels: ["in_app"],
      metadata: {
        applicationId,
        paymentType: "registration_fee",
        url: `/admission/enrollment`,
      },
    })
  } catch (err) {
    console.error("[registration-fee] notification failed:", err)
  }

  return "settled"
}
