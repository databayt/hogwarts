// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const domain = process.env.NEXT_PUBLIC_APP_URL
const isDev = process.env.NODE_ENV === "development"

// ── Shared email layout ──────────────────────────────────────────────

function emailLayout(content: string, locale: string): string {
  const isRTL = locale === "ar"
  const dir = isRTL ? "rtl" : "ltr"
  const align = isRTL ? "right" : "left"
  const fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${isRTL ? "هجورتس" : "Hogwarts"}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:${fontFamily};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 40px 0 40px;">
              <img src="https://ed.databayt.org/logo.png" alt="Hogwarts" height="64" style="height:64px;width:auto;display:block;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:24px 40px 32px 40px;text-align:center;" dir="${dir}">
              ${content}
            </td>
          </tr>
        </table>
        <!-- Footer -->
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td align="center" style="padding:24px 40px;color:#71717a;font-size:12px;line-height:18px;font-family:${fontFamily};">
              &copy; 2026 Databayt &middot; <a href="https://ed.databayt.org" style="color:#71717a;text-decoration:underline;">ed.databayt.org</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Bulletproof CTA button ───────────────────────────────────────────

function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
  <tr>
    <td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%" strokecolor="#18181b" fillcolor="#18181b">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${href}" target="_blank" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;line-height:24px;mso-hide:all;">${label}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`
}

// ── Styled code box for 2FA ──────────────────────────────────────────

function emailCode(code: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
  <tr>
    <td align="center">
      <div style="display:inline-block;background-color:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:16px 32px;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#18181b;line-height:40px;">${code}</div>
    </td>
  </tr>
</table>`
}

// ── Email strings ────────────────────────────────────────────────────

const emailStrings = {
  en: {
    twoFactorSubject: "Your verification code",
    twoFactorBody: (token: string) =>
      emailLayout(
        `<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#18181b;line-height:32px;">Your verification code</h1>
<p style="margin:0 0 4px 0;font-size:16px;color:#52525b;line-height:24px;">Enter this code to complete your sign-in.</p>
${emailCode(token)}
<p style="margin:0;font-size:14px;color:#a1a1aa;line-height:20px;">This code expires in 10 minutes. If you didn&rsquo;t request this, you can safely ignore this email.</p>`,
        "en"
      ),
    twoFactorText: (token: string) =>
      `Your verification code: ${token}\n\nEnter this code to complete your sign-in.\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— Hogwarts (ed.databayt.org)`,

    resetSubject: "Reset your password",
    resetBody: (link: string) =>
      emailLayout(
        `<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#18181b;line-height:32px;">Reset your password</h1>
<p style="margin:0;font-size:16px;color:#52525b;line-height:24px;">Use the button below to set a new password.</p>
${emailButton(link, "Reset Password")}
<p style="margin:0;font-size:14px;color:#a1a1aa;line-height:20px;">If you didn&rsquo;t request a password reset, you can safely ignore this email.</p>`,
        "en"
      ),
    resetText: (link: string) =>
      `Reset your password\n\nUse the link below to set a new password:\n${link}\n\nIf you didn't request this, you can safely ignore this email.\n\n— Hogwarts (ed.databayt.org)`,

    verifySubject: "Confirm your email",
    verifyBody: (link: string) =>
      emailLayout(
        `<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#18181b;line-height:32px;">Confirm your email</h1>
<p style="margin:0;font-size:16px;color:#52525b;line-height:24px;">Verify your email address with the secure link below.</p>
${emailButton(link, "Confirm Email")}
<p style="margin:0;font-size:14px;color:#a1a1aa;line-height:20px;">If you didn&rsquo;t create an account, you can safely ignore this email.</p>`,
        "en"
      ),
    verifyText: (link: string) =>
      `Confirm your email\n\nVerify your email address by clicking the link below:\n${link}\n\nIf you didn't create an account, you can safely ignore this email.\n\n— Hogwarts (ed.databayt.org)`,
  },
  ar: {
    twoFactorSubject: "رمز التحقق",
    twoFactorBody: (token: string) =>
      emailLayout(
        `<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#18181b;line-height:32px;">رمز التحقق</h1>
<p style="margin:0 0 4px 0;font-size:16px;color:#52525b;line-height:24px;">أدخل هذا الرمز لإتمام تسجيل الدخول.</p>
${emailCode(token)}
<p style="margin:0;font-size:14px;color:#a1a1aa;line-height:20px;">ينتهي صلاحية هذا الرمز خلال 10 دقائق. إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد بأمان.</p>`,
        "ar"
      ),
    twoFactorText: (token: string) =>
      `رمز التحقق: ${token}\n\nأدخل هذا الرمز لإتمام تسجيل الدخول.\nينتهي صلاحية هذا الرمز خلال 10 دقائق.\n\nإذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد بأمان.\n\n— هجورتس (ed.databayt.org)`,

    resetSubject: "إعادة تعيين كلمة المرور",
    resetBody: (link: string) =>
      emailLayout(
        `<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#18181b;line-height:32px;">إعادة تعيين كلمة المرور</h1>
<p style="margin:0;font-size:16px;color:#52525b;line-height:24px;">استخدم الزر أدناه لتعيين كلمة مرور جديدة.</p>
${emailButton(link, "إعادة التعيين")}
<p style="margin:0;font-size:14px;color:#a1a1aa;line-height:20px;">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.</p>`,
        "ar"
      ),
    resetText: (link: string) =>
      `إعادة تعيين كلمة المرور\n\nاستخدم الرابط أدناه لتعيين كلمة مرور جديدة:\n${link}\n\nإذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان.\n\n— هجورتس (ed.databayt.org)`,

    verifySubject: "تأكيد بريدك الإلكتروني",
    verifyBody: (link: string) =>
      emailLayout(
        `<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#18181b;line-height:32px;">تأكيد بريدك الإلكتروني</h1>
<p style="margin:0;font-size:16px;color:#52525b;line-height:24px;">تحقق من بريدك الإلكتروني من خلال الرابط الآمن أدناه.</p>
${emailButton(link, "تأكيد البريد")}
<p style="margin:0;font-size:14px;color:#a1a1aa;line-height:20px;">إذا لم تنشئ حسابًا، يمكنك تجاهل هذا البريد بأمان.</p>`,
        "ar"
      ),
    verifyText: (link: string) =>
      `تأكيد بريدك الإلكتروني\n\nتحقق من بريدك الإلكتروني من خلال الرابط أدناه:\n${link}\n\nإذا لم تنشئ حسابًا، يمكنك تجاهل هذا البريد بأمان.\n\n— هجورتس (ed.databayt.org)`,
  },
} as const

function getStrings(locale: string) {
  return locale === "ar" ? emailStrings.ar : emailStrings.en
}

// ── Send functions ───────────────────────────────────────────────────

export const sendTwoFactorTokenEmail = async (
  email: string,
  token: string,
  locale = "en"
): Promise<boolean> => {
  if (isDev) console.log("Sending 2FA email to:", email)
  const t = getStrings(locale)

  try {
    const response = await resend.emails.send({
      from: "Hogwarts <noreply@databayt.org>",
      to: email,
      subject: t.twoFactorSubject,
      html: t.twoFactorBody(token),
      text: t.twoFactorText(token),
    })

    if (isDev) console.log("2FA email sent successfully, response:", response)
    return true
  } catch (error) {
    console.error("Error sending 2FA email:", error)
    return false
  }
}

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  locale = "en"
): Promise<boolean> => {
  const resetLink = `${domain}/${locale}/new-password?token=${token}`
  const t = getStrings(locale)

  if (isDev) console.log("Password reset link:", resetLink)

  try {
    const response = await resend.emails.send({
      from: "Hogwarts <noreply@databayt.org>",
      to: email,
      subject: t.resetSubject,
      html: t.resetBody(resetLink),
      text: t.resetText(resetLink),
    })

    if (isDev)
      console.log("Password reset email sent successfully, response:", response)
    return true
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return false
  }
}

export const sendVerificationEmail = async (
  email: string,
  token: string,
  locale = "en"
): Promise<boolean> => {
  const confirmLink = `${domain}/${locale}/new-verification?token=${token}`
  const t = getStrings(locale)

  if (isDev) console.log("Email confirmation link:", confirmLink)

  try {
    const response = await resend.emails.send({
      from: "Hogwarts <noreply@databayt.org>",
      to: email,
      subject: t.verifySubject,
      html: t.verifyBody(confirmLink),
      text: t.verifyText(confirmLink),
    })

    if (isDev)
      console.log("Verification email sent successfully, response:", response)
    return true
  } catch (error) {
    console.error("Error sending verification email:", error)
    return false
  }
}
