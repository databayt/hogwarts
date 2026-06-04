// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * NotificationTemplate Seed — Locale-Aware Templates
 *
 * Distinct from `seedNotifications` (which seeds Notification instances).
 * This seeds the `NotificationTemplate` model used by `dispatchNotification`
 * to render locale-aware titles + bodies for parent-targeting notifications.
 *
 * Phase 1 of Aldar epic-4 / project_aldar_parent_portal_grade_block.
 *
 * Rows seeded as school-dashboard-wide (schoolId = null) so they apply to every
 * school as a default. School admins may override per-school later.
 *
 * Unique key: (schoolId, type, channel, lang) — see schema migration
 * `20260527010000_notification_template_lang_unique`.
 */

import type { NotificationChannel, PrismaClient } from "@prisma/client"

import { logSuccess } from "./utils"

type Channel = Extract<NotificationChannel, "in_app" | "email" | "whatsapp">

// Each template defines title + body per locale, plus an optional emailSubject
// for the email channel. Placeholders use {{var}} syntax (see schema comment
// on NotificationTemplate.body) — resolved at dispatch time from `metadata`.
interface TemplateDef {
  type:
    | "grade_posted"
    | "report_ready"
    | "attendance_alert"
    | "fee_due"
    | "fee_overdue"
    | "fee_paid"
    | "announcement"
    | "event_reminder"
    | "message"
  channels: Channel[]
  en: { title: string; body: string; emailSubject?: string }
  ar: { title: string; body: string; emailSubject?: string }
}

const TEMPLATES: TemplateDef[] = [
  {
    type: "grade_posted",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "Grade posted: {{subject}}",
      body: "{{studentName}} received {{grade}} in {{subject}}.",
      emailSubject: "New grade for {{studentName}}",
    },
    ar: {
      title: "تم نشر درجة: {{subject}}",
      body: "حصل {{studentName}} على {{grade}} في {{subject}}.",
      emailSubject: "درجة جديدة لـ {{studentName}}",
    },
  },
  {
    type: "report_ready",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "Report card ready",
      body: "{{studentName}}'s {{termName}} report card is now available.",
      emailSubject: "{{studentName}}'s report card is ready",
    },
    ar: {
      title: "بطاقة التقرير جاهزة",
      body: "بطاقة تقرير {{studentName}} للفصل {{termName}} متاحة الآن.",
      emailSubject: "بطاقة تقرير {{studentName}} جاهزة",
    },
  },
  {
    type: "attendance_alert",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "Absence alert",
      body: "{{studentName}} was marked absent from {{subject}} today.",
      emailSubject: "Absence notice for {{studentName}}",
    },
    ar: {
      title: "تنبيه غياب",
      body: "تم تسجيل غياب {{studentName}} من {{subject}} اليوم.",
      emailSubject: "إشعار غياب لـ {{studentName}}",
    },
  },
  {
    type: "fee_due",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "Fee payment due",
      body: "{{amount}} is due by {{dueDate}} for {{studentName}}.",
      emailSubject: "Upcoming fee payment for {{studentName}}",
    },
    ar: {
      title: "موعد سداد الرسوم",
      body: "{{amount}} مستحقة بحلول {{dueDate}} لـ {{studentName}}.",
      emailSubject: "رسوم مستحقة قريبًا لـ {{studentName}}",
    },
  },
  {
    type: "fee_overdue",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "Overdue payment",
      body: "Payment of {{amount}} for {{studentName}} is overdue. Please pay as soon as possible.",
      emailSubject: "Overdue fee for {{studentName}}",
    },
    ar: {
      title: "دفعة متأخرة",
      body: "دفعة {{amount}} لـ {{studentName}} متأخرة. يرجى السداد في أقرب وقت ممكن.",
      emailSubject: "رسوم متأخرة لـ {{studentName}}",
    },
  },
  {
    type: "fee_paid",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "Payment received",
      body: "Thank you. Payment of {{amount}} for {{studentName}} has been received.",
      emailSubject: "Payment confirmation for {{studentName}}",
    },
    ar: {
      title: "تم استلام الدفعة",
      body: "شكرًا لك. تم استلام دفعة {{amount}} لـ {{studentName}}.",
      emailSubject: "تأكيد الدفع لـ {{studentName}}",
    },
  },
  {
    type: "announcement",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "{{title}}",
      body: "{{preview}}",
      emailSubject: "{{title}}",
    },
    ar: {
      title: "{{title}}",
      body: "{{preview}}",
      emailSubject: "{{title}}",
    },
  },
  {
    type: "event_reminder",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "Reminder: {{eventName}}",
      body: "{{eventName}} is scheduled for {{eventDate}}.",
      emailSubject: "Reminder: {{eventName}}",
    },
    ar: {
      title: "تذكير: {{eventName}}",
      body: "{{eventName}} مقرر بتاريخ {{eventDate}}.",
      emailSubject: "تذكير: {{eventName}}",
    },
  },
  {
    type: "message",
    channels: ["in_app", "email", "whatsapp"],
    en: {
      title: "New message from {{senderName}}",
      body: "{{preview}}",
      emailSubject: "Message from {{senderName}}",
    },
    ar: {
      title: "رسالة جديدة من {{senderName}}",
      body: "{{preview}}",
      emailSubject: "رسالة من {{senderName}}",
    },
  },
]

/**
 * Seed school-dashboard-wide notification templates (schoolId = null) for both
 * EN and AR. Idempotent via upsert on the lang-aware unique key.
 *
 * Returns the number of rows touched (created + updated).
 */
export async function seedNotificationTemplates(
  prisma: PrismaClient
): Promise<number> {
  let touched = 0

  for (const tpl of TEMPLATES) {
    for (const channel of tpl.channels) {
      for (const lang of ["en", "ar"] as const) {
        const localized = tpl[lang]
        // Prisma 6 rejects `null` in composite-unique `where` selectors even
        // when the field is nullable in the schema, so we can't use `upsert`
        // here. Pattern: findFirst (schoolId IS NULL) → update or create.
        const existing = await prisma.notificationTemplate.findFirst({
          where: {
            schoolId: null,
            type: tpl.type,
            channel,
            lang,
          },
          select: { id: true },
        })

        const data = {
          title: localized.title,
          body: localized.body,
          emailSubject:
            channel === "email" ? localized.emailSubject : undefined,
          emailBody: channel === "email" ? localized.body : undefined,
          active: true,
        }

        if (existing) {
          await prisma.notificationTemplate.update({
            where: { id: existing.id },
            data,
          })
        } else {
          await prisma.notificationTemplate.create({
            data: {
              schoolId: null,
              type: tpl.type,
              channel,
              lang,
              ...data,
            },
          })
        }
        touched++
      }
    }
  }

  logSuccess("NotificationTemplates", touched, "EN+AR rows (global)")
  return touched
}
