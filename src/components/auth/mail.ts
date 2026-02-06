import { Resend } from "resend"

// Email service for authentication flows - using noreply@databayt.org
const resend = new Resend(process.env.RESEND_API_KEY)

const domain = process.env.NEXT_PUBLIC_APP_URL
const isDev = process.env.NODE_ENV === "development"

const emailStrings = {
  en: {
    twoFactorSubject: "2FA Code",
    twoFactorBody: (token: string) => `<p>Your 2FA code: ${token}</p>`,
    twoFactorText: (token: string) => `Your 2FA code: ${token}`,
    resetSubject: "Reset your password",
    resetBody: (link: string) =>
      `<p>Click <a href="${link}">here</a> to reset password.</p>`,
    resetText: (link: string) =>
      `Click the following link to reset your password: ${link}`,
    verifySubject: "Confirm your email",
    verifyBody: (link: string) =>
      `<p>Click <a href="${link}">here</a> to confirm email.</p>`,
    verifyText: (link: string) =>
      `Click the following link to confirm your email: ${link}`,
  },
  ar: {
    twoFactorSubject: "رمز التحقق",
    twoFactorBody: (token: string) =>
      `<p dir="rtl">رمز التحقق الخاص بك: ${token}</p>`,
    twoFactorText: (token: string) => `رمز التحقق الخاص بك: ${token}`,
    resetSubject: "إعادة تعيين كلمة المرور",
    resetBody: (link: string) =>
      `<p dir="rtl">انقر <a href="${link}">هنا</a> لإعادة تعيين كلمة المرور.</p>`,
    resetText: (link: string) =>
      `انقر على الرابط التالي لإعادة تعيين كلمة المرور: ${link}`,
    verifySubject: "تأكيد بريدك الإلكتروني",
    verifyBody: (link: string) =>
      `<p dir="rtl">انقر <a href="${link}">هنا</a> لتأكيد بريدك الإلكتروني.</p>`,
    verifyText: (link: string) =>
      `انقر على الرابط التالي لتأكيد بريدك الإلكتروني: ${link}`,
  },
} as const

function getStrings(locale: string) {
  return locale === "ar" ? emailStrings.ar : emailStrings.en
}

export const sendTwoFactorTokenEmail = async (
  email: string,
  token: string,
  locale = "en"
) => {
  if (isDev) console.log("Sending 2FA email to:", email)
  const t = getStrings(locale)

  try {
    const response = await resend.emails.send({
      from: "noreply@databayt.org",
      to: email,
      subject: t.twoFactorSubject,
      html: t.twoFactorBody(token),
      text: t.twoFactorText(token),
    })

    if (isDev) console.log("2FA email sent successfully, response:", response)
  } catch (error) {
    console.error("Error sending 2FA email:", error)
  }
}

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  locale = "en"
) => {
  const resetLink = `${domain}/${locale}/new-password?token=${token}`
  const t = getStrings(locale)

  if (isDev) console.log("Password reset link:", resetLink)

  try {
    const response = await resend.emails.send({
      from: "noreply@databayt.org",
      to: email,
      subject: t.resetSubject,
      html: t.resetBody(resetLink),
      text: t.resetText(resetLink),
    })

    if (isDev)
      console.log("Password reset email sent successfully, response:", response)
  } catch (error) {
    console.error("Error sending password reset email:", error)
  }
}

export const sendVerificationEmail = async (
  email: string,
  token: string,
  locale = "en"
) => {
  const confirmLink = `${domain}/${locale}/new-verification?token=${token}`
  const t = getStrings(locale)

  if (isDev) console.log("Email confirmation link:", confirmLink)

  try {
    const response = await resend.emails.send({
      from: "noreply@databayt.org",
      to: email,
      subject: t.verifySubject,
      html: t.verifyBody(confirmLink),
      text: t.verifyText(confirmLink),
    })

    if (isDev)
      console.log("Verification email sent successfully, response:", response)
  } catch (error) {
    console.error("Error sending verification email:", error)
  }
}
