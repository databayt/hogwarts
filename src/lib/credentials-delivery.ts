// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Credentials Delivery
 *
 * Sends a freshly-minted student/guardian login over the platform's
 * notification channels (email + WhatsApp + in-app) so admins on
 * `kingfahad.databayt.org/en/students` don't have to copy/paste from the
 * dialog into a separate WhatsApp chat. The dialog still works for ad-hoc
 * sharing — this helper covers the "automate it" case the founder asked for.
 *
 * Tradeoff: `Notification.body` carries the temp password (because the
 * notification email/WhatsApp pipeline renders body verbatim, and there is
 * no metadata-aware template yet). This is acceptable because:
 *
 * 1. Notifications are gated to the recipient's own user — only the student
 *    can read their own in-app notification panel.
 * 2. `mustChangePassword: true` is set on the User, so the password is
 *    single-use and invalidated on first login.
 * 3. A future enhancement can render password from `metadata.tempPassword`
 *    while keeping the body password-free.
 */
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"

interface DeliverCredentialsInput {
  schoolId: string
  studentUserId: string
  username: string
  /** Plaintext temp password. Pass `null` for self-onboarded students who
   *  set their own password — we only confirm the account exists. */
  tempPassword: string | null
  /** True on first User creation; false on resets. Drives copy. */
  isFirstTime: boolean
}

interface DeliverCredentialsResult {
  notified: boolean
  reason?: string
}

export async function deliverStudentCredentials(
  input: DeliverCredentialsInput
): Promise<DeliverCredentialsResult> {
  const { schoolId, studentUserId, username, tempPassword, isFirstTime } = input

  const [school, user] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true, name: true, domain: true },
    }),
    db.user.findUnique({
      where: { id: studentUserId },
      select: { email: true },
    }),
  ])

  if (!school) {
    return { notified: false, reason: "school-not-found" }
  }
  if (!user) {
    return { notified: false, reason: "user-not-found" }
  }

  const lang = school.preferredLanguage ?? "ar"
  const baseUrl = buildLoginBaseUrl(school.domain)
  const loginUrl = `${baseUrl}/${lang}/login`
  const isAr = lang === "ar"

  const title = isAr
    ? isFirstTime
      ? `تم إنشاء حساب الطالب لدى ${school.name}`
      : `تم إعادة تعيين كلمة المرور لدى ${school.name}`
    : isFirstTime
      ? `Your ${school.name} student account is ready`
      : `Your ${school.name} password was reset`

  const body = buildBody({
    isAr,
    schoolName: school.name,
    username,
    tempPassword,
    loginUrl,
    isFirstTime,
  })

  await dispatchNotification({
    schoolId,
    userId: studentUserId,
    type: "account_created",
    title,
    body,
    lang,
    priority: "high",
    channels: ["in_app", "email", "whatsapp"],
    metadata: {
      // Kept so a future template can render password from metadata while
      // scrubbing it from body. Today the email/WhatsApp pipeline reads body
      // verbatim, so the body field above carries the credentials.
      username,
      tempPassword: tempPassword ?? "",
      loginUrl,
      isFirstTime: String(isFirstTime),
      url: loginUrl,
    },
  })

  return { notified: true }
}

function buildBody(args: {
  isAr: boolean
  schoolName: string
  username: string
  tempPassword: string | null
  loginUrl: string
  isFirstTime: boolean
}): string {
  const { isAr, schoolName, username, tempPassword, loginUrl, isFirstTime } =
    args

  if (isAr) {
    const intro = isFirstTime
      ? `تم إنشاء حسابك في ${schoolName}.`
      : `تم تحديث بيانات الدخول لحسابك في ${schoolName}.`
    const lines = [intro, `اسم المستخدم: ${username}`]
    if (tempPassword) {
      lines.push(`كلمة المرور المؤقتة: ${tempPassword}`)
      lines.push(`سيُطلب منك تغييرها عند أول تسجيل دخول.`)
    } else {
      lines.push(
        `كلمة المرور التي اخترتها سابقاً لا تزال صالحة. إذا نسيتها يمكنك طلب إعادة التعيين.`
      )
    }
    lines.push(`تسجيل الدخول: ${loginUrl}`)
    return lines.join("\n")
  }

  const intro = isFirstTime
    ? `Your ${schoolName} account has been created.`
    : `Your ${schoolName} login has been reset.`
  const lines = [intro, `Username: ${username}`]
  if (tempPassword) {
    lines.push(`Temporary password: ${tempPassword}`)
    lines.push(`You'll be asked to change it on first login.`)
  } else {
    lines.push(
      `Your existing password is still valid. Use "forgot password" if you need to reset it.`
    )
  }
  lines.push(`Sign in: ${loginUrl}`)
  return lines.join("\n")
}

/**
 * Local mirror of `buildTenantBaseUrl` from finance/fees/actions. Kept here
 * to avoid pulling a `"use server"` module into a generic library. Behaviour
 * must stay in sync with the finance helper — both default to the same
 * production / dev / fallback hosts.
 */
function buildLoginBaseUrl(subdomain: string | null | undefined): string {
  if (!subdomain) {
    return process.env.NEXT_PUBLIC_APP_URL || "https://app.databayt.org"
  }
  if (process.env.NODE_ENV === "production") {
    return `https://${subdomain}.databayt.org`
  }
  return `http://${subdomain}.localhost:3000`
}
