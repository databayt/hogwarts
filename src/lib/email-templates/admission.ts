// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getSchoolDisplayName, type SchoolNameFields } from "@/lib/school-name"

type Lang = "ar" | "en" | string | null | undefined

type SchoolForEmail = SchoolNameFields & {
  preferredLanguage?: string | null
}

function resolveLang(school: SchoolForEmail, override?: Lang): "ar" | "en" {
  const raw = override ?? school.preferredLanguage ?? "ar"
  return raw === "en" ? "en" : "ar"
}

const T = {
  ar: {
    applicationReceived: {
      subject: (appNo: string) => `تم استلام الطلب - ${appNo}`,
      heading: "تم استلام طلبك بنجاح!",
      dearParent: (name: string) => `عزيزي/عزيزتي ${name}،`,
      thankYou: (studentName: string) =>
        `شكراً لتقديم طلب القبول للطالب/ة <strong>${studentName}</strong>.`,
      appNumber: (n: string) => `<strong>رقم الطلب:</strong> ${n}`,
      trackPrompt: "يمكنك متابعة حالة طلبك في أي وقت عبر الرابط التالي:",
      trackLink: "متابعة الطلب",
      reviewSoon: "سنقوم بمراجعة طلبك وسنعاود التواصل معك قريباً.",
      bestRegards: "مع أطيب التحيات",
    },
    offer: {
      subject: (appNo: string) => `عرض القبول - ${appNo}`,
      heading: "تهانينا! تم قبول طلبك",
      dearParent: (name: string) => `عزيزي/عزيزتي ${name}،`,
      congrats: (studentName: string) =>
        `يسعدنا إبلاغك بقبول الطالب/ة <strong>${studentName}</strong> للالتحاق بمدرستنا.`,
      appNumber: (n: string) => `<strong>رقم الطلب:</strong> ${n}`,
      offerPrompt:
        "لتأكيد القبول وإتمام التسجيل، يرجى الضغط على الرابط التالي:",
      offerLink: "عرض القبول والتسجيل",
      expiryNote: (date: string) => `هذا العرض صالح حتى ${date}.`,
      bestRegards: "مع أطيب التحيات",
    },
    resumeApplication: {
      subject: "طلبك قيد التعبئة",
      hello: "مرحباً،",
      savedBody: "تم حفظ طلبك. يمكنك استئنافه في أي وقت عبر الرابط التالي:",
      resumeLink: "استئناف الطلب",
      expiresIn: "ينتهي هذا الرابط خلال 7 أيام.",
      bestRegards: "مع أطيب التحيات",
    },
    newApplicationAdmin: {
      title: "طلب قبول جديد",
      body: (studentName: string, appNo: string) =>
        `تم تقديم طلب قبول جديد من ${studentName} - رقم الطلب: ${appNo}`,
    },
    tourCancelled: {
      subject: (n: string) => `تم إلغاء موعد الزيارة - ${n}`,
      heading: "تم إلغاء موعد الزيارة",
      dear: (name: string) => `عزيزي/عزيزتي ${name}،`,
      cancelledBody: (n: string) => `تم إلغاء موعد زيارتك (${n}).`,
      reason: (r: string) => `<strong>السبب:</strong> ${r}`,
      rescheduleBody: "إذا أردت جدولة زيارة جديدة، يمكنك زيارة:",
      rescheduleLink: "حجز موعد زيارة",
      bestRegards: "مع أطيب التحيات",
    },
    tourRescheduled: {
      subject: (n: string) => `تم تعديل موعد الزيارة - ${n}`,
      heading: "تم تعديل موعد الزيارة",
      dear: (name: string) => `عزيزي/عزيزتي ${name}،`,
      rescheduledBody: "تم تعديل موعد زيارتك. تفاصيل الموعد الجديد:",
      date: "التاريخ",
      time: "الوقت",
      bestRegards: "مع أطيب التحيات",
    },
  },
  en: {
    applicationReceived: {
      subject: (appNo: string) => `Application Received - ${appNo}`,
      heading: "Application Received Successfully!",
      dearParent: (name: string) => `Dear ${name},`,
      thankYou: (studentName: string) =>
        `Thank you for submitting your application for <strong>${studentName}</strong>.`,
      appNumber: (n: string) => `<strong>Application Number:</strong> ${n}`,
      trackPrompt:
        "You can track your application status at any time using this link:",
      trackLink: "Track Application",
      reviewSoon: "We will review your application and get back to you soon.",
      bestRegards: "Best regards",
    },
    offer: {
      subject: (appNo: string) => `Admission Offer - ${appNo}`,
      heading: "Congratulations! Your application has been accepted",
      dearParent: (name: string) => `Dear ${name},`,
      congrats: (studentName: string) =>
        `We are pleased to offer <strong>${studentName}</strong> admission to our school.`,
      appNumber: (n: string) => `<strong>Application Number:</strong> ${n}`,
      offerPrompt:
        "To accept the offer and complete registration, please use this link:",
      offerLink: "View Offer & Register",
      expiryNote: (date: string) => `This offer is valid until ${date}.`,
      bestRegards: "Best regards",
    },
    resumeApplication: {
      subject: "Your Application in Progress",
      hello: "Hello,",
      savedBody:
        "Your application has been saved. You can resume it anytime using this link:",
      resumeLink: "Resume Application",
      expiresIn: "This link expires in 7 days.",
      bestRegards: "Best regards",
    },
    newApplicationAdmin: {
      title: "New admission application",
      body: (studentName: string, appNo: string) =>
        `A new admission application was submitted by ${studentName} - Application #: ${appNo}`,
    },
    tourCancelled: {
      subject: (n: string) => `Tour Booking Cancelled - ${n}`,
      heading: "Tour Booking Cancelled",
      dear: (name: string) => `Dear ${name},`,
      cancelledBody: (n: string) =>
        `Your tour booking (${n}) has been cancelled.`,
      reason: (r: string) => `<strong>Reason:</strong> ${r}`,
      rescheduleBody: "If you'd like to schedule a new tour, please visit:",
      rescheduleLink: "Schedule Tour",
      bestRegards: "Best regards",
    },
    tourRescheduled: {
      subject: (n: string) => `Tour Rescheduled - ${n}`,
      heading: "Tour Booking Rescheduled",
      dear: (name: string) => `Dear ${name},`,
      rescheduledBody:
        "Your tour has been rescheduled. Here are the new details:",
      date: "Date",
      time: "Time",
      bestRegards: "Best regards",
    },
  },
} as const

export function buildApplicationReceivedEmail(args: {
  school: SchoolForEmail
  parentName: string
  studentName: string
  applicationNumber: string
  trackUrl: string
  langOverride?: Lang
}): { subject: string; html: string } {
  const lang = resolveLang(args.school, args.langOverride)
  const t = T[lang].applicationReceived
  const dir = lang === "ar" ? "rtl" : "ltr"
  const name = getSchoolDisplayName(args.school, lang)
  return {
    subject: t.subject(args.applicationNumber),
    html: `<div dir="${dir}">
  <h2>${t.heading}</h2>
  <p>${t.dearParent(args.parentName)}</p>
  <p>${t.thankYou(args.studentName)}</p>
  <p>${t.appNumber(args.applicationNumber)}</p>
  <p>${t.trackPrompt}</p>
  <p><a href="${args.trackUrl}">${t.trackLink}</a></p>
  <p>${t.reviewSoon}</p>
  <p>${t.bestRegards},<br>${name}</p>
</div>`,
  }
}

export function buildOfferEmail(args: {
  school: SchoolForEmail
  parentName: string
  studentName: string
  applicationNumber: string
  offerUrl: string
  expiryDate?: string
  langOverride?: Lang
}): { subject: string; html: string } {
  const lang = resolveLang(args.school, args.langOverride)
  const t = T[lang].offer
  const dir = lang === "ar" ? "rtl" : "ltr"
  const name = getSchoolDisplayName(args.school, lang)
  return {
    subject: t.subject(args.applicationNumber),
    html: `<div dir="${dir}">
  <h2>${t.heading}</h2>
  <p>${t.dearParent(args.parentName)}</p>
  <p>${t.congrats(args.studentName)}</p>
  <p>${t.appNumber(args.applicationNumber)}</p>
  <p>${t.offerPrompt}</p>
  <p><a href="${args.offerUrl}">${t.offerLink}</a></p>
  ${args.expiryDate ? `<p>${t.expiryNote(args.expiryDate)}</p>` : ""}
  <p>${t.bestRegards},<br>${name}</p>
</div>`,
  }
}

export function buildResumeApplicationEmail(args: {
  school: SchoolForEmail
  resumeUrl: string
  langOverride?: Lang
}): { subject: string; html: string } {
  const lang = resolveLang(args.school, args.langOverride)
  const t = T[lang].resumeApplication
  const dir = lang === "ar" ? "rtl" : "ltr"
  const name = getSchoolDisplayName(args.school, lang)
  return {
    subject: t.subject,
    html: `<div dir="${dir}">
  <p>${t.hello}</p>
  <p>${t.savedBody}</p>
  <p><a href="${args.resumeUrl}">${t.resumeLink}</a></p>
  <p>${t.expiresIn}</p>
  <p>${t.bestRegards},<br>${name}</p>
</div>`,
  }
}

export function buildNewApplicationAdminNotification(args: {
  school: SchoolForEmail
  studentName: string
  applicationNumber: string
  langOverride?: Lang
}): { title: string; body: string } {
  const lang = resolveLang(args.school, args.langOverride)
  const t = T[lang].newApplicationAdmin
  return {
    title: t.title,
    body: t.body(args.studentName, args.applicationNumber),
  }
}

export function buildTourCancelledEmail(args: {
  school: SchoolForEmail
  parentName: string
  bookingNumber: string
  reason?: string | null
  rescheduleUrl: string
  langOverride?: Lang
}): { subject: string; html: string } {
  const lang = resolveLang(args.school, args.langOverride)
  const t = T[lang].tourCancelled
  const dir = lang === "ar" ? "rtl" : "ltr"
  const name = getSchoolDisplayName(args.school, lang)
  return {
    subject: t.subject(args.bookingNumber),
    html: `<div dir="${dir}">
  <h2>${t.heading}</h2>
  <p>${t.dear(args.parentName)}</p>
  <p>${t.cancelledBody(args.bookingNumber)}</p>
  ${args.reason ? `<p>${t.reason(args.reason)}</p>` : ""}
  <p>${t.rescheduleBody}</p>
  <p><a href="${args.rescheduleUrl}">${t.rescheduleLink}</a></p>
  <p>${t.bestRegards},<br>${name}</p>
</div>`,
  }
}

export function buildTourRescheduledEmail(args: {
  school: SchoolForEmail
  parentName: string
  bookingNumber: string
  date: string
  time: string
  langOverride?: Lang
}): { subject: string; html: string } {
  const lang = resolveLang(args.school, args.langOverride)
  const t = T[lang].tourRescheduled
  const dir = lang === "ar" ? "rtl" : "ltr"
  const name = getSchoolDisplayName(args.school, lang)
  return {
    subject: t.subject(args.bookingNumber),
    html: `<div dir="${dir}">
  <h2>${t.heading}</h2>
  <p>${t.dear(args.parentName)}</p>
  <p>${t.rescheduledBody}</p>
  <table style="border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;"><strong>${t.date}</strong></td>
      <td style="padding: 8px; border: 1px solid #ddd;">${args.date}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;"><strong>${t.time}</strong></td>
      <td style="padding: 8px; border: 1px solid #ddd;">${args.time}</td>
    </tr>
  </table>
  <p>${t.bestRegards},<br>${name}</p>
</div>`,
  }
}
