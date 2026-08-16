// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Post-provision notification — the other half of `provisionStudent`.
 *
 * `provisionStudent` runs inside a caller-owned transaction and deliberately
 * never notifies (`opts.notify` is `false` at every call site, and
 * `ensureStudentFeeAssignments` suppresses its own notification whenever a
 * `tx` is passed). Something has to tell the family afterwards, and until now
 * only ONE of the five callers did: `confirmEnrollment` carried ~150 lines of
 * inline post-commit dispatch, so a student added through the /students
 * wizard, a CSV import, `changeRole` or the mobile API got a login, fees and
 * invoices — and was never told, and neither was their guardian.
 *
 * This module is that dispatch, shared. Call it AFTER the transaction commits.
 *
 * Two deliberate constraints, both inherited from code this replaces:
 *
 * 1. No `after()`. `dispatch-notification.ts` documents why: it runs from
 *    server actions, crons AND webhooks, and `after()` is not available in all
 *    three. The established pattern here is a bare `.catch(console.error)`.
 * 2. Never inside a transaction. A notification row written mid-transaction is
 *    a lie if the transaction later rolls back.
 */

import type {
  AdmissionChannel,
  NotificationPriority,
  NotificationType,
} from "@prisma/client"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { sendNotificationEmail } from "@/components/school-dashboard/notifications/email-service"

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const NOTIF = {
  enrollment: {
    title: { ar: "تم تأكيد القبول", en: "Enrollment Confirmed" },
    body: (enrollmentNumber: string) => ({
      ar: `تهانينا! تم تأكيد تسجيلك بالمدرسة. رقم التسجيل: ${enrollmentNumber}`,
      en: `Congratulations! Your enrollment has been confirmed. Enrollment #: ${enrollmentNumber}`,
    }),
    // New accounts have no password — this variant links to the password-set
    // page so the student can actually log in for the first time.
    bodyWithSetup: (enrollmentNumber: string, setupUrl: string) => ({
      ar: `تهانينا! تم تأكيد تسجيلك بالمدرسة. رقم التسجيل: ${enrollmentNumber}. لإنشاء كلمة المرور وتسجيل الدخول لأول مرة، يرجى زيارة: ${setupUrl}`,
      en: `Congratulations! Your enrollment has been confirmed. Enrollment #: ${enrollmentNumber}. To set your password and log in for the first time, visit: ${setupUrl}`,
    }),
    // Direct-admit channels have no enrollment number to quote — the admin
    // added the student straight to the roll.
    bodyDirect: (schoolName: string) => ({
      ar: `تم إنشاء حسابك في ${schoolName}.`,
      en: `Your account at ${schoolName} has been created.`,
    }),
    bodyDirectWithSetup: (schoolName: string, setupUrl: string) => ({
      ar: `تم إنشاء حسابك في ${schoolName}. لإنشاء كلمة المرور وتسجيل الدخول لأول مرة، يرجى زيارة: ${setupUrl}`,
      en: `Your account at ${schoolName} has been created. To set your password and log in for the first time, visit: ${setupUrl}`,
    }),
  },
  feeDue: {
    title: { ar: "رسوم دراسية جديدة", en: "New Tuition Fees" },
    body: (count: number, total: string) => ({
      ar: `تم تعيين ${count} رسوم بقيمة ${total} لحسابك`,
      en: `${count} fee(s) totaling ${total} have been assigned to your account`,
    }),
    // With installments there is a schedule to state, not just a total. One
    // message covering all of them -- a four-installment structure raises four
    // invoices at enrollment, and mailing four separate invoices the moment a
    // child enrols is spam.
    bodyWithSchedule: (count: number, total: string, installments: number) => ({
      ar: `تم تعيين ${count} رسوم بقيمة ${total} لحسابك، مقسّمة على ${installments} دفعة. يمكنك الاطلاع على مواعيد السداد في صفحة الرسوم.`,
      en: `${count} fee(s) totaling ${total} have been assigned to your account, split across ${installments} instalments. You can see the due dates on your fees page.`,
    }),
  },
  guardianEnrollment: {
    title: { ar: "تم تأكيد القبول", en: "Enrollment Confirmed" },
    body: (name: string) => ({
      ar: `تم تأكيد تسجيل ${name} في المدرسة`,
      en: `${name} has been enrolled in the school`,
    }),
  },
} as const

const t = (msg: { ar: string; en: string }, lang: string) =>
  lang === "en" ? msg.en : msg.ar

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/**
 * `"immediate"` sends the email inline, so an admin who just clicked "Create"
 * sees the mail land. `"queue"` only writes the `Notification` row and lets the
 * `process-email-notifications` cron (every 15 min) drain it, 50 per run.
 *
 * The distinction is not cosmetic. Immediate delivery is the ONLY mode that
 * bursts Resend, and a CSV import can carry hundreds of rows — so bulk paths
 * must always queue. A 500-row import then drains over roughly two and a half
 * hours instead of firing 500 sends at once.
 */
export type NotifyDelivery = "immediate" | "queue"

/** A synthesized address, not a real inbox — see `student-provisioning.ts`. */
const PLACEHOLDER_EMAIL_DOMAIN = "@student.local"

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(PLACEHOLDER_EMAIL_DOMAIN)
}

async function deliver(params: {
  schoolId: string
  userId?: string
  /** Recipients with no account (most guardians) get email only. */
  directEmail?: string
  type: NotificationType
  title: string
  body: string
  lang: string
  priority?: NotificationPriority
  metadata?: Record<string, unknown>
  actorId?: string
  delivery: NotifyDelivery
}): Promise<boolean> {
  let channels: ("in_app" | "email")[] = params.userId
    ? ["in_app", "email"]
    : // No account to read an in-app notification with -- most guardians are
      // contact records created by `createOrLinkGuardian`, never users.
      ["email"]

  // Honour the school's "Automatic Email Notifications" toggle. in_app is
  // never affected.
  const settings = await db.admissionSettings.findUnique({
    where: { schoolId: params.schoolId },
    select: { autoEmailNotifications: true },
  })
  // The column defaults to true; only a persisted `false` turns email off.
  if (settings?.autoEmailNotifications === false) {
    channels = channels.filter((c) => c !== "email")
  }

  // Resolve the recipient's address BEFORE dispatching. A student with no
  // email of their own carries a synthesized `@student.local` placeholder, and
  // the email channel has to come off the row itself -- otherwise the
  // `process-email-notifications` cron happily tries to deliver to it later
  // (it only skips recipients with NO address, and a placeholder is an
  // address). The in-app notification still lands.
  let recipientEmail: string | null = params.directEmail ?? null
  if (params.userId) {
    const user = await db.user.findUnique({
      where: { id: params.userId },
      select: { email: true },
    })
    recipientEmail = user?.email ?? null
  }
  if (!recipientEmail || isPlaceholderEmail(recipientEmail)) {
    channels = channels.filter((c) => c !== "email")
  }

  const notificationId = await dispatchNotification({
    schoolId: params.schoolId,
    userId: params.userId,
    directEmail: params.directEmail,
    type: params.type,
    title: params.title,
    body: params.body,
    lang: params.lang,
    priority: params.priority ?? "normal",
    channels,
    metadata: params.metadata,
    actorId: params.actorId,
  })

  // Guest path: dispatchNotification already delivered to directEmail and
  // returned null (there is no in-app row to follow up on), so a null id here
  // is success, not failure.
  if (!params.userId) return true
  // `dispatchNotification` swallows its own errors and returns null. Without
  // this the caller cannot tell "sent" from "silently failed" — and the fee
  // block would stamp `sentAt` on invoices nobody was ever told about.
  if (!notificationId) return false
  if (!channels.includes("email")) return true
  // Queued: the cron owns the send from here.
  if (params.delivery === "queue") return true
  if (!recipientEmail) return true

  await sendNotificationEmail({
    notificationId,
    to: recipientEmail,
    locale: (params.lang === "en" ? "en" : "ar") as "ar" | "en",
    type: params.type,
    priority: params.priority ?? "normal",
    title: params.title,
    body: params.body,
    metadata: params.metadata,
  })

  return true
}

// ---------------------------------------------------------------------------
// The shared entry point
// ---------------------------------------------------------------------------

export interface NotifyProvisionedStudentInput {
  schoolId: string
  studentId: string
  /** `provisionStudent`'s `userId`. Null only if the caller lost it. */
  userId: string | null
  /** Drives per-channel policy. */
  origin: AdmissionChannel
  /** Student display name, quoted in the guardian notice. */
  studentName: string
  /**
   * The address a password-setup link should go to. Falls back to the User's
   * own address. A synthesized `@student.local` placeholder is ignored.
   */
  email?: string | null
  /** PORTAL quotes this; direct-admit channels have none. */
  enrollmentNumber?: string | null
  /** A brand-new User has no password — mint a setup link. */
  isNewUser: boolean
  lang?: string | null
  actorId?: string
  delivery: NotifyDelivery
  /**
   * Per-channel policy. All default to true; a caller opts OUT of the parts
   * that do not apply to it. `changeRole` promotes someone who already has an
   * account and a password, so a "welcome, here is your new account" notice
   * and a guardian announcement would both be wrong -- but the fees the
   * promotion just assigned are still real and still owed.
   */
  sendWelcome?: boolean
  sendFeeDue?: boolean
  sendGuardian?: boolean
}

/**
 * Tell a freshly-provisioned student (and their guardians) that they exist:
 * their account, how to set a password, and what they now owe.
 *
 * Every step is best-effort and independently guarded — a failure to notify
 * must never surface as a failure to enrol. Call after the transaction commits.
 */
export async function notifyProvisionedStudent(
  input: NotifyProvisionedStudentInput
): Promise<void> {
  const { schoolId, studentId, userId, delivery } = input

  const school = await db.school.findFirst({
    where: { id: schoolId },
    select: { preferredLanguage: true, name: true },
  })
  const lang = input.lang ?? school?.preferredLanguage ?? "ar"
  const schoolName = school?.name ?? ""

  // -------------------------------------------------------------------
  // 1. The student's own account notice, with a password-setup link when
  //    the account was created here and has no password yet.
  // -------------------------------------------------------------------
  if (userId && input.sendWelcome !== false) {
    let passwordSetupUrl: string | null = null
    const setupEmail = input.email

    if (input.isNewUser && setupEmail && !isPlaceholderEmail(setupEmail)) {
      try {
        const { generatePasswordResetToken } =
          await import("@/components/auth/tokens")
        const reset = await generatePasswordResetToken(setupEmail)
        // The /new-password page lives on the root domain only — there is no
        // per-subdomain route, and cross-subdomain SSO shares the session once
        // a password is set.
        const rootUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? "https://ed.databayt.org"
        passwordSetupUrl = `${rootUrl}/${lang}/new-password?token=${encodeURIComponent(reset.token)}`
      } catch (err) {
        console.warn(
          "[notifyProvisionedStudent] Failed to mint password-setup link:",
          err
        )
      }
    }

    const enrollmentNumber = input.enrollmentNumber
    const body = enrollmentNumber
      ? passwordSetupUrl
        ? t(
            NOTIF.enrollment.bodyWithSetup(enrollmentNumber, passwordSetupUrl),
            lang
          )
        : t(NOTIF.enrollment.body(enrollmentNumber), lang)
      : passwordSetupUrl
        ? t(
            NOTIF.enrollment.bodyDirectWithSetup(schoolName, passwordSetupUrl),
            lang
          )
        : t(NOTIF.enrollment.bodyDirect(schoolName), lang)

    await deliver({
      schoolId,
      userId,
      type: "account_created",
      title: t(NOTIF.enrollment.title, lang),
      body,
      lang,
      priority: "high",
      metadata: {
        studentId,
        channel: input.origin,
        ...(enrollmentNumber ? { enrollmentNumber } : {}),
        url: passwordSetupUrl ?? "/",
      },
      actorId: input.actorId,
      delivery,
    }).catch((err) =>
      console.error("[notifyProvisionedStudent] account notice failed:", err)
    )
  }

  // -------------------------------------------------------------------
  // 2. What they now owe. `provisionStudent` has already assigned fees and
  //    fanned each one out into an invoice per installment.
  // -------------------------------------------------------------------
  if (userId && input.sendFeeDue !== false) {
    try {
      const pendingFees = await db.feeAssignment.findMany({
        where: { schoolId, studentId, status: "PENDING" },
        select: { id: true, finalAmount: true },
      })
      if (pendingFees.length > 0) {
        const totalAmount = pendingFees.reduce(
          (sum, fa) => sum + Number(fa.finalAmount),
          0
        )

        // The invoices `ensureInvoicesForAssignment` just raised — one per
        // instalment. Nothing used to tell the family they existed:
        // `UserInvoice.sentAt` was stamped only by the manual admin
        // "send invoice" button, so an enrolled student was chased by the
        // fee-due and fee-overdue crons for invoices they had never been sent.
        const invoices = await db.userInvoice.findMany({
          where: {
            schoolId,
            feeAssignmentId: { in: pendingFees.map((f) => f.id) },
            sentAt: null,
          },
          select: { id: true },
        })

        const feeNoticeSent = await deliver({
          schoolId,
          userId,
          type: "fee_due",
          title: t(NOTIF.feeDue.title, lang),
          body: t(
            invoices.length > 1
              ? NOTIF.feeDue.bodyWithSchedule(
                  pendingFees.length,
                  totalAmount.toLocaleString(),
                  invoices.length
                )
              : NOTIF.feeDue.body(
                  pendingFees.length,
                  totalAmount.toLocaleString()
                ),
            lang
          ),
          lang,
          priority: "high",
          metadata: {
            studentId,
            feeCount: pendingFees.length,
            invoiceCount: invoices.length,
            totalAmount,
            // The finance "my fees" surface is where a family can actually
            // PAY (Stripe / Tap / manual rails), see invoices and receipts.
            // This used to point at /my-fees, the preferences view, which
            // shows what is owed but offers no way to settle it.
            url: "/finance/fees/my",
          },
          actorId: input.actorId,
          delivery,
        })

        // Stamp only AFTER the notice went out, so a failure above leaves the
        // invoices unstamped and the next run can try again.
        //
        // Note the widened meaning: `sentAt` now reads "the family has been
        // told about this invoice", not "this exact PDF was mailed". The
        // per-invoice admin sender (`sendInvoiceEmail`) still stamps it the
        // narrower way, and both are true statements about the same fact --
        // that the family has been informed.
        if (feeNoticeSent && invoices.length > 0) {
          await db.userInvoice.updateMany({
            where: { id: { in: invoices.map((i) => i.id) } },
            data: { sentAt: new Date() },
          })
        }
      }
    } catch (err) {
      console.error("[notifyProvisionedStudent] fee notice failed:", err)
    }
  }

  // -------------------------------------------------------------------
  // 3. Guardians. Those created by `createOrLinkGuardian` are contact
  //    records with no `userId`, so fall back to their address directly —
  //    without this, guardian mail never fires for most intake paths.
  // -------------------------------------------------------------------
  if (input.sendGuardian === false) return

  try {
    const guardianLinks = await db.studentGuardian.findMany({
      where: { studentId, schoolId },
      select: { guardian: { select: { userId: true, emailAddress: true } } },
    })
    for (const link of guardianLinks) {
      const guardianUserId = link.guardian?.userId
      const guardianEmail = link.guardian?.emailAddress
      if (!guardianUserId && !guardianEmail) continue
      if (!guardianUserId && isPlaceholderEmail(guardianEmail)) continue

      await deliver({
        schoolId,
        ...(guardianUserId
          ? { userId: guardianUserId }
          : { directEmail: guardianEmail! }),
        type: "account_created",
        title: t(NOTIF.guardianEnrollment.title, lang),
        body: t(NOTIF.guardianEnrollment.body(input.studentName), lang),
        lang,
        priority: "high",
        metadata: {
          studentId,
          studentName: input.studentName,
          ...(input.enrollmentNumber
            ? { enrollmentNumber: input.enrollmentNumber }
            : {}),
          url: "/",
        },
        actorId: input.actorId,
        delivery,
      }).catch((err) =>
        console.error("[notifyProvisionedStudent] guardian notice failed:", err)
      )
    }
  } catch (err) {
    console.error("[notifyProvisionedStudent] guardian lookup failed:", err)
  }
}
