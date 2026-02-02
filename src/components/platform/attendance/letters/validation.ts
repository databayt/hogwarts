/**
 * Compliance Letters Validation Schemas
 *
 * Schemas for auto-generated attendance compliance letters.
 */
import { z } from "zod"

// Letter types aligned with MTSS tiers
export const letterTypes = [
  "ATTENDANCE_NOTICE_1", // Tier 2 - First warning
  "ATTENDANCE_NOTICE_2", // Tier 2 - Second warning
  "ATTENDANCE_NOTICE_3", // Tier 3 - Final warning
  "TRUANCY_WARNING", // Tier 3 - Truancy notice
  "ATTENDANCE_CONTRACT", // Tier 3 - Contract request
  "ATTENDANCE_IMPROVEMENT", // Positive - Improvement recognition
  "PERFECT_ATTENDANCE", // Tier 1 - Certificate
] as const

export type LetterType = (typeof letterTypes)[number]

// Letter status
export const letterStatuses = [
  "DRAFT",
  "GENERATED",
  "SENT",
  "DELIVERED",
  "FAILED",
] as const

export type LetterStatus = (typeof letterStatuses)[number]

// Delivery methods
export const deliveryMethods = ["EMAIL", "PRINT", "SMS", "PORTAL"] as const

export type DeliveryMethod = (typeof deliveryMethods)[number]

/**
 * Schema for generating a letter
 */
export const generateLetterSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  letterType: z.enum(letterTypes),
  deliveryMethod: z.enum(deliveryMethods).default("EMAIL"),
  customMessage: z.string().optional(),
  scheduledSendDate: z.date().optional(),
})

export type GenerateLetterInput = z.infer<typeof generateLetterSchema>

/**
 * Schema for bulk letter generation
 */
export const bulkGenerateLettersSchema = z.object({
  studentIds: z.array(z.string()).min(1, "At least one student required"),
  letterType: z.enum(letterTypes),
  deliveryMethod: z.enum(deliveryMethods).default("EMAIL"),
})

export type BulkGenerateLettersInput = z.infer<typeof bulkGenerateLettersSchema>

/**
 * Letter template configuration
 */
export interface LetterTemplate {
  type: LetterType
  tier: "TIER_1" | "TIER_2" | "TIER_3"
  subject: { en: string; ar: string }
  body: { en: string; ar: string }
  requiredFields: string[]
  callToAction?: { en: string; ar: string }
}

/**
 * Letter templates for each type
 */
export const letterTemplates: Record<LetterType, LetterTemplate> = {
  ATTENDANCE_NOTICE_1: {
    type: "ATTENDANCE_NOTICE_1",
    tier: "TIER_2",
    subject: {
      en: "Attendance Concern Notice - {{studentName}}",
      ar: "إشعار بشأن الحضور - {{studentName}}",
    },
    body: {
      en: `Dear {{guardianName}},

We are writing to inform you about attendance concerns regarding your child, {{studentName}}, enrolled in {{className}}.

Current attendance record:
- Absence Rate: {{absenceRate}}%
- Days Absent: {{absentDays}} out of {{totalDays}} school days

Regular attendance is critical for academic success. Students who miss more than 10% of school days are at risk of falling behind.

We encourage you to:
1. Review the attendance records with your child
2. Contact us if there are any circumstances we should be aware of
3. Work with us to develop a plan to improve attendance

Please contact the school office at {{schoolPhone}} or email {{schoolEmail}} to discuss this matter.

Sincerely,
{{schoolName}} Administration`,
      ar: `عزيزي {{guardianName}}،

نكتب إليكم لإبلاغكم عن مخاوف تتعلق بحضور ابنكم/ابنتكم {{studentName}} المسجل في {{className}}.

سجل الحضور الحالي:
- نسبة الغياب: {{absenceRate}}%
- أيام الغياب: {{absentDays}} من أصل {{totalDays}} يوم دراسي

الحضور المنتظم ضروري للنجاح الأكاديمي. الطلاب الذين يتغيبون أكثر من 10% من الأيام الدراسية معرضون لخطر التأخر الدراسي.

نشجعكم على:
1. مراجعة سجلات الحضور مع ابنكم/ابنتكم
2. التواصل معنا إذا كانت هناك أي ظروف يجب أن نكون على علم بها
3. العمل معنا لوضع خطة لتحسين الحضور

يرجى الاتصال بمكتب المدرسة على {{schoolPhone}} أو البريد الإلكتروني {{schoolEmail}} لمناقشة هذا الأمر.

مع خالص التحيات،
إدارة {{schoolName}}`,
    },
    requiredFields: [
      "studentName",
      "guardianName",
      "className",
      "absenceRate",
      "absentDays",
      "totalDays",
      "schoolPhone",
      "schoolEmail",
      "schoolName",
    ],
    callToAction: {
      en: "Please respond within 5 business days",
      ar: "يرجى الرد خلال 5 أيام عمل",
    },
  },

  ATTENDANCE_NOTICE_2: {
    type: "ATTENDANCE_NOTICE_2",
    tier: "TIER_2",
    subject: {
      en: "Second Attendance Notice - Immediate Action Required - {{studentName}}",
      ar: "إشعار الحضور الثاني - يتطلب إجراء فوري - {{studentName}}",
    },
    body: {
      en: `Dear {{guardianName}},

This is our second notice regarding the attendance of {{studentName}}. Despite our previous communication, attendance has not improved.

Current attendance record:
- Absence Rate: {{absenceRate}}%
- Days Absent: {{absentDays}} out of {{totalDays}} school days

This level of absenteeism is significantly impacting your child's academic progress. We strongly urge you to take immediate action.

A meeting with the school administration is required. Please contact us within 48 hours to schedule a meeting.

If we do not hear from you, we will be required to escalate this matter to the appropriate authorities.

Contact: {{schoolPhone}} or {{schoolEmail}}

Sincerely,
{{schoolName}} Administration`,
      ar: `عزيزي {{guardianName}}،

هذا هو إشعارنا الثاني بخصوص حضور {{studentName}}. على الرغم من اتصالنا السابق، لم يتحسن الحضور.

سجل الحضور الحالي:
- نسبة الغياب: {{absenceRate}}%
- أيام الغياب: {{absentDays}} من أصل {{totalDays}} يوم دراسي

هذا المستوى من الغياب يؤثر بشكل كبير على التقدم الأكاديمي لابنكم/ابنتكم. نحثكم بشدة على اتخاذ إجراء فوري.

مطلوب عقد اجتماع مع إدارة المدرسة. يرجى الاتصال بنا خلال 48 ساعة لتحديد موعد الاجتماع.

إذا لم نسمع منكم، سنضطر لتصعيد هذا الأمر إلى الجهات المختصة.

للتواصل: {{schoolPhone}} أو {{schoolEmail}}

مع خالص التحيات،
إدارة {{schoolName}}`,
    },
    requiredFields: [
      "studentName",
      "guardianName",
      "absenceRate",
      "absentDays",
      "totalDays",
      "schoolPhone",
      "schoolEmail",
      "schoolName",
    ],
    callToAction: {
      en: "Contact us within 48 hours",
      ar: "تواصل معنا خلال 48 ساعة",
    },
  },

  ATTENDANCE_NOTICE_3: {
    type: "ATTENDANCE_NOTICE_3",
    tier: "TIER_3",
    subject: {
      en: "FINAL NOTICE - Chronic Absenteeism - {{studentName}}",
      ar: "إشعار نهائي - الغياب المزمن - {{studentName}}",
    },
    body: {
      en: `Dear {{guardianName}},

This is our FINAL NOTICE regarding the chronic absenteeism of {{studentName}}.

CRITICAL ATTENDANCE RECORD:
- Absence Rate: {{absenceRate}}%
- Days Absent: {{absentDays}} out of {{totalDays}} school days

Your child is now classified as a chronic absentee. This level of absence:
- Significantly hinders academic progress
- May result in grade retention
- Is a violation of compulsory attendance laws

IMMEDIATE ACTION REQUIRED:
A mandatory meeting is scheduled for {{meetingDate}} at {{meetingTime}}.

If you fail to attend this meeting or continue to have unexcused absences, we will be required to:
1. Report to the school district
2. File a truancy referral with appropriate authorities
3. Consider legal action as required by law

Contact immediately: {{schoolPhone}} or {{schoolEmail}}

Sincerely,
{{principalName}}
Principal, {{schoolName}}`,
      ar: `عزيزي {{guardianName}}،

هذا هو إشعارنا النهائي بخصوص الغياب المزمن لـ {{studentName}}.

سجل الحضور الحرج:
- نسبة الغياب: {{absenceRate}}%
- أيام الغياب: {{absentDays}} من أصل {{totalDays}} يوم دراسي

ابنكم/ابنتكم مصنف الآن كغائب مزمن. هذا المستوى من الغياب:
- يعيق التقدم الأكاديمي بشكل كبير
- قد يؤدي إلى إعادة السنة الدراسية
- يعد مخالفة لقوانين التعليم الإلزامي

مطلوب إجراء فوري:
تم تحديد اجتماع إلزامي في {{meetingDate}} الساعة {{meetingTime}}.

إذا تخلفتم عن حضور هذا الاجتماع أو استمر الغياب غير المبرر، سنضطر إلى:
1. إبلاغ إدارة التعليم
2. تقديم إحالة تغيب للجهات المختصة
3. النظر في الإجراءات القانونية كما يقتضي القانون

للتواصل الفوري: {{schoolPhone}} أو {{schoolEmail}}

مع خالص التحيات،
{{principalName}}
مدير {{schoolName}}`,
    },
    requiredFields: [
      "studentName",
      "guardianName",
      "absenceRate",
      "absentDays",
      "totalDays",
      "meetingDate",
      "meetingTime",
      "schoolPhone",
      "schoolEmail",
      "principalName",
      "schoolName",
    ],
    callToAction: {
      en: "MANDATORY MEETING - Attendance Required",
      ar: "اجتماع إلزامي - الحضور مطلوب",
    },
  },

  TRUANCY_WARNING: {
    type: "TRUANCY_WARNING",
    tier: "TIER_3",
    subject: {
      en: "Official Truancy Warning - {{studentName}}",
      ar: "تحذير رسمي بشأن التغيب - {{studentName}}",
    },
    body: {
      en: `OFFICIAL TRUANCY WARNING

Student: {{studentName}}
Guardian: {{guardianName}}
Date: {{currentDate}}

This letter serves as an official warning that {{studentName}} has been identified as truant under the compulsory attendance laws.

Truancy Statistics:
- Unexcused Absences: {{unexcusedAbsences}}
- Total Absences: {{absentDays}}
- Absence Rate: {{absenceRate}}%

Legal Consequences:
Continued truancy may result in:
- Referral to juvenile court
- Fines and penalties for parents/guardians
- Loss of driving privileges (if applicable)
- Other legal action as permitted by law

This is a legal document. Please retain for your records.

{{schoolName}}
{{schoolAddress}}
{{schoolPhone}}`,
      ar: `تحذير رسمي بشأن التغيب

الطالب: {{studentName}}
ولي الأمر: {{guardianName}}
التاريخ: {{currentDate}}

هذه الرسالة بمثابة تحذير رسمي بأن {{studentName}} قد تم تصنيفه كمتغيب بموجب قوانين التعليم الإلزامي.

إحصائيات التغيب:
- الغياب غير المبرر: {{unexcusedAbsences}}
- إجمالي الغياب: {{absentDays}}
- نسبة الغياب: {{absenceRate}}%

العواقب القانونية:
قد يؤدي استمرار التغيب إلى:
- إحالة إلى محكمة الأحداث
- غرامات وعقوبات على أولياء الأمور
- سحب رخصة القيادة (إن وجدت)
- إجراءات قانونية أخرى وفقاً للقانون

هذه وثيقة رسمية. يرجى الاحتفاظ بها للسجلات.

{{schoolName}}
{{schoolAddress}}
{{schoolPhone}}`,
    },
    requiredFields: [
      "studentName",
      "guardianName",
      "currentDate",
      "unexcusedAbsences",
      "absentDays",
      "absenceRate",
      "schoolName",
      "schoolAddress",
      "schoolPhone",
    ],
  },

  ATTENDANCE_CONTRACT: {
    type: "ATTENDANCE_CONTRACT",
    tier: "TIER_3",
    subject: {
      en: "Attendance Improvement Contract - {{studentName}}",
      ar: "عقد تحسين الحضور - {{studentName}}",
    },
    body: {
      en: `ATTENDANCE IMPROVEMENT CONTRACT

Student Name: {{studentName}}
Student ID: {{studentId}}
Grade/Class: {{className}}
Date: {{currentDate}}

This contract is entered into between {{schoolName}} and the family of {{studentName}} to address chronic absenteeism.

CURRENT STATUS:
- Absence Rate: {{absenceRate}}%
- Days Absent: {{absentDays}}

ATTENDANCE GOALS:
1. Reduce absence rate to below 10% within {{contractPeriod}}
2. Provide documentation for all absences within 48 hours
3. Attend all scheduled check-in meetings

SCHOOL COMMITMENTS:
1. Provide academic support as needed
2. Weekly attendance monitoring
3. Regular communication with family

CONSEQUENCES FOR NON-COMPLIANCE:
Failure to meet the terms of this contract may result in further disciplinary action and/or legal referral.

_________________________ Date: _______
Student Signature

_________________________ Date: _______
Parent/Guardian Signature

_________________________ Date: _______
School Representative`,
      ar: `عقد تحسين الحضور

اسم الطالب: {{studentName}}
رقم الطالب: {{studentId}}
الصف/الفصل: {{className}}
التاريخ: {{currentDate}}

هذا العقد مبرم بين {{schoolName}} وعائلة {{studentName}} لمعالجة الغياب المزمن.

الوضع الحالي:
- نسبة الغياب: {{absenceRate}}%
- أيام الغياب: {{absentDays}}

أهداف الحضور:
1. تقليل نسبة الغياب إلى أقل من 10% خلال {{contractPeriod}}
2. تقديم المستندات لجميع حالات الغياب خلال 48 ساعة
3. حضور جميع اجتماعات المتابعة المقررة

التزامات المدرسة:
1. تقديم الدعم الأكاديمي حسب الحاجة
2. متابعة الحضور أسبوعياً
3. التواصل المنتظم مع الأسرة

عواقب عدم الالتزام:
قد يؤدي عدم الالتزام بشروط هذا العقد إلى إجراءات تأديبية إضافية و/أو إحالة قانونية.

_________________________ التاريخ: _______
توقيع الطالب

_________________________ التاريخ: _______
توقيع ولي الأمر

_________________________ التاريخ: _______
ممثل المدرسة`,
    },
    requiredFields: [
      "studentName",
      "studentId",
      "className",
      "currentDate",
      "absenceRate",
      "absentDays",
      "contractPeriod",
      "schoolName",
    ],
  },

  ATTENDANCE_IMPROVEMENT: {
    type: "ATTENDANCE_IMPROVEMENT",
    tier: "TIER_2",
    subject: {
      en: "Congratulations on Improved Attendance! - {{studentName}}",
      ar: "تهانينا على تحسن الحضور! - {{studentName}}",
    },
    body: {
      en: `Dear {{guardianName}},

We are pleased to inform you that {{studentName}} has shown significant improvement in attendance!

IMPROVEMENT HIGHLIGHTS:
- Previous Absence Rate: {{previousRate}}%
- Current Absence Rate: {{absenceRate}}%
- Improvement: {{improvementPercent}}%

We want to recognize {{studentName}}'s effort and commitment to regular attendance. Keep up the great work!

Thank you for your partnership in supporting your child's education.

Warm regards,
{{schoolName}} Administration`,
      ar: `عزيزي {{guardianName}}،

يسعدنا إبلاغكم بأن {{studentName}} قد أظهر تحسناً ملحوظاً في الحضور!

أبرز التحسينات:
- نسبة الغياب السابقة: {{previousRate}}%
- نسبة الغياب الحالية: {{absenceRate}}%
- التحسن: {{improvementPercent}}%

نريد أن نعترف بجهد {{studentName}} والتزامه بالحضور المنتظم. استمر في العمل الرائع!

شكراً لشراكتكم في دعم تعليم ابنكم/ابنتكم.

مع أطيب التحيات،
إدارة {{schoolName}}`,
    },
    requiredFields: [
      "studentName",
      "guardianName",
      "previousRate",
      "absenceRate",
      "improvementPercent",
      "schoolName",
    ],
  },

  PERFECT_ATTENDANCE: {
    type: "PERFECT_ATTENDANCE",
    tier: "TIER_1",
    subject: {
      en: "Perfect Attendance Certificate - {{studentName}}",
      ar: "شهادة الحضور المثالي - {{studentName}}",
    },
    body: {
      en: `CERTIFICATE OF PERFECT ATTENDANCE

This is to certify that

{{studentName}}

has achieved PERFECT ATTENDANCE
for the period of {{attendancePeriod}}

at {{schoolName}}

This outstanding achievement demonstrates dedication, responsibility, and commitment to education.

Congratulations!

_________________________
Principal's Signature

Date: {{currentDate}}`,
      ar: `شهادة الحضور المثالي

نشهد بأن

{{studentName}}

قد حقق الحضور المثالي
خلال فترة {{attendancePeriod}}

في {{schoolName}}

يُظهر هذا الإنجاز المتميز التفاني والمسؤولية والالتزام بالتعليم.

مبارك!

_________________________
توقيع المدير

التاريخ: {{currentDate}}`,
    },
    requiredFields: [
      "studentName",
      "attendancePeriod",
      "schoolName",
      "currentDate",
    ],
  },
}
