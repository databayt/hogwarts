/**
 * WhatsApp Message Template Engine
 *
 * Renders message templates with variable substitution.
 * Templates use {{variable}} syntax.
 *
 * Default templates are provided for common school events.
 * Schools can customize via WhatsAppMessageTemplate model.
 */

export type TemplateVariables = Record<string, string | number>

/**
 * Render a template string with variable substitution
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

// =============================================================================
// Default Templates (Arabic + English)
// =============================================================================

export const DEFAULT_TEMPLATES = {
  // Attendance
  attendance_absent: {
    ar: "تنبيه حضور: الطالب/ة {{studentName}} تم تسجيله/ها غائب/ة اليوم {{date}} في {{schoolName}}.",
    en: "Attendance Alert: {{studentName}} was marked absent today ({{date}}) at {{schoolName}}.",
  },
  attendance_late: {
    ar: "تنبيه: الطالب/ة {{studentName}} وصل/ت متأخر/ة اليوم {{date}} في {{schoolName}}.",
    en: "Alert: {{studentName}} arrived late today ({{date}}) at {{schoolName}}.",
  },

  // Fees
  fee_due: {
    ar: "تذكير: رسوم بقيمة {{amount}} {{currency}} مستحقة بتاريخ {{dueDate}} للطالب/ة {{studentName}} في {{schoolName}}.",
    en: "Reminder: Fee of {{amount}} {{currency}} is due on {{dueDate}} for {{studentName}} at {{schoolName}}.",
  },
  fee_overdue: {
    ar: "تنبيه: رسوم بقيمة {{amount}} {{currency}} متأخرة للطالب/ة {{studentName}} في {{schoolName}}. يرجى السداد في أقرب وقت.",
    en: "Alert: Fee of {{amount}} {{currency}} is overdue for {{studentName}} at {{schoolName}}. Please settle as soon as possible.",
  },
  fee_paid: {
    ar: "تأكيد: تم استلام دفعة بقيمة {{amount}} {{currency}} للطالب/ة {{studentName}} في {{schoolName}}. شكراً لكم.",
    en: "Confirmed: Payment of {{amount}} {{currency}} received for {{studentName}} at {{schoolName}}. Thank you.",
  },

  // Emergency
  emergency: {
    ar: "🚨 تنبيه عاجل من {{schoolName}}: {{message}}",
    en: "🚨 Urgent Alert from {{schoolName}}: {{message}}",
  },

  // Grades
  grade_posted: {
    ar: "تم نشر درجات {{subjectName}} للطالب/ة {{studentName}} في {{schoolName}}.",
    en: "Grades for {{subjectName}} have been posted for {{studentName}} at {{schoolName}}.",
  },
  report_ready: {
    ar: "التقرير الدراسي للطالب/ة {{studentName}} جاهز للاطلاع في {{schoolName}}.",
    en: "Report card for {{studentName}} is ready to view at {{schoolName}}.",
  },

  // Events
  event_reminder: {
    ar: "تذكير: {{eventName}} في {{schoolName}} بتاريخ {{date}} الساعة {{time}}.",
    en: "Reminder: {{eventName}} at {{schoolName}} on {{date}} at {{time}}.",
  },

  // Announcements
  announcement: {
    ar: "إعلان من {{schoolName}}: {{title}}\n\n{{body}}",
    en: "Announcement from {{schoolName}}: {{title}}\n\n{{body}}",
  },

  // Parent-teacher meeting
  meeting_invite: {
    ar: "دعوة اجتماع أولياء الأمور في {{schoolName}} بتاريخ {{date}} الساعة {{time}}. {{message}}",
    en: "Parent-teacher meeting at {{schoolName}} on {{date}} at {{time}}. {{message}}",
  },

  // Assignment
  assignment_due: {
    ar: "تذكير: واجب {{assignmentName}} في مادة {{subjectName}} مستحق بتاريخ {{dueDate}}.",
    en: "Reminder: Assignment {{assignmentName}} for {{subjectName}} is due on {{dueDate}}.",
  },
} as const

export type TemplateName = keyof typeof DEFAULT_TEMPLATES

/**
 * Get default template content by name and language
 */
export function getDefaultTemplate(
  name: TemplateName,
  lang: "ar" | "en"
): string {
  return (
    DEFAULT_TEMPLATES[name]?.[lang] ?? DEFAULT_TEMPLATES[name]?.["en"] ?? ""
  )
}
