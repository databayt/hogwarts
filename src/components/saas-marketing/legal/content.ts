// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Public legal pages (privacy policy, account deletion) required by the
 * Google Play listing of the «بالقلم» Android app. Long-form legal text lives
 * here rather than in the JSON dictionaries so it ships only with these two
 * pages, not in every marketing chunk.
 */

export type LegalLang = "ar" | "en"

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  items?: string[]
}

export interface LegalDoc {
  metaTitle: string
  metaDescription: string
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

export type LegalKey = "privacy" | "deleteAccount"

const EMAIL = "hi@databayt.org"

const privacyEn: LegalDoc = {
  metaTitle: "Privacy Policy",
  metaDescription:
    "How Balqalam (بالقلم) handles personal data for schools, staff, parents and students.",
  title: "Privacy Policy",
  updated: "Last updated 27 November 2026",
  intro:
    "This policy covers the Balqalam (بالقلم) school-management platform: the Android app and the website at balqalam.com.",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        "Balqalam is operated by Databayt LTD, a company registered in Rwanda (company code / TIN 157332933), based in Kigali.",
        `Contact: ${EMAIL}`,
        "Balqalam is used by schools. Each school controls the data of its own students, parents and staff and is the data controller. Databayt processes that data on the school's behalf, to run the service.",
      ],
    },
    {
      heading: "What data we handle",
      items: [
        "Account details: name, email or phone number, and role (for example teacher, parent, student, administrator).",
        "School records entered by the school: students, classes, attendance, grades, exams, fees and invoices, and timetables.",
        "Messages and announcements sent inside the platform.",
        "Live classes: audio and video are streamed to participants. Live classes may be recorded only when the school enables recording.",
        "Files that users or schools upload.",
        "Device and diagnostic data: device information, crash reports, usage analytics and push-notification tokens. The Android app uses Firebase Cloud Messaging, Firebase Analytics and Firebase Crashlytics for this.",
      ],
    },
    {
      heading: "How we use it",
      paragraphs: [
        "We use data only to run the service for the school: sign-in, school records, messaging, live classes, notifications, and keeping the app stable.",
        "We do not sell personal data and we do not show advertising.",
      ],
    },
    {
      heading: "Who we share it with",
      paragraphs: [
        "We share data only with the providers that host and deliver the service, and only as needed:",
      ],
      items: [
        "Cloudflare: web hosting and delivery.",
        "Neon: database hosting.",
        "Amazon Web Services (S3): file storage.",
        "LiveKit: live-class audio and video.",
        "Google Firebase: push notifications, analytics and crash reporting in the Android app.",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "Students may be minors. Their accounts are created by the school, not by the children themselves. The school is responsible for obtaining any parental consent that applies to its students.",
      ],
    },
    {
      heading: "How long we keep data",
      paragraphs: [
        "We keep a school's data while the school is our customer. When the contract ends, the school receives an export of its data, and we delete the data within 30 days of the school's request.",
      ],
    },
    {
      heading: "Security",
      paragraphs: [
        "Data is encrypted in transit. Access inside the platform is limited by role, so people see only what their role allows.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        `You can ask to access, correct or delete your data through your school, or by writing to ${EMAIL}. To delete your account, see the account deletion page.`,
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "If we change this policy, we update the date at the top of this page.",
      ],
    },
  ],
}

const privacyAr: LegalDoc = {
  metaTitle: "سياسة الخصوصية",
  metaDescription:
    "كيف تتعامل «بالقلم» مع البيانات الشخصية للمدارس والمعلمين وأولياء الأمور والطلاب.",
  title: "سياسة الخصوصية",
  updated: "آخر تحديث: 27 نوفمبر 2026",
  intro:
    "تغطي هذه السياسة منصة «بالقلم» لإدارة المدارس: تطبيق أندرويد والموقع balqalam.com.",
  sections: [
    {
      heading: "من نحن",
      paragraphs: [
        "تُشغّل «بالقلم» شركة Databayt LTD، وهي شركة مسجلة في رواندا (رمز الشركة / الرقم الضريبي 157332933) ومقرها كيغالي.",
        `للتواصل: ${EMAIL}`,
        "تستخدم المدارس «بالقلم»، وكل مدرسة تتحكم في بيانات طلابها وأولياء أمورها وموظفيها وهي المسؤولة عن هذه البيانات. أما Databayt فتعالج البيانات نيابةً عن المدرسة لتشغيل الخدمة.",
      ],
    },
    {
      heading: "البيانات التي نتعامل معها",
      items: [
        "بيانات الحساب: الاسم والبريد الإلكتروني أو رقم الهاتف والدور (مثل معلم أو ولي أمر أو طالب أو مدير).",
        "السجلات التي تدخلها المدرسة: الطلاب والفصول والحضور والدرجات والاختبارات والرسوم والفواتير والجداول الدراسية.",
        "الرسائل والإعلانات المرسلة داخل المنصة.",
        "الحصص المباشرة: يُبث الصوت والفيديو للمشاركين. قد تُسجَّل الحصص المباشرة فقط عندما تفعّل المدرسة التسجيل.",
        "الملفات التي يرفعها المستخدمون أو المدارس.",
        "بيانات الجهاز والتشخيص: معلومات الجهاز وتقارير الأعطال وتحليلات الاستخدام ورموز الإشعارات. يستخدم تطبيق أندرويد خدمات Firebase Cloud Messaging وFirebase Analytics وFirebase Crashlytics لهذا الغرض.",
      ],
    },
    {
      heading: "كيف نستخدمها",
      paragraphs: [
        "نستخدم البيانات فقط لتشغيل الخدمة للمدرسة: تسجيل الدخول وسجلات المدرسة والمراسلة والحصص المباشرة والإشعارات والحفاظ على استقرار التطبيق.",
        "لا نبيع البيانات الشخصية ولا نعرض إعلانات.",
      ],
    },
    {
      heading: "مع من نشاركها",
      paragraphs: [
        "نشارك البيانات فقط مع مزودي الخدمات التي تستضيف المنصة وتوصلها، وبقدر الحاجة:",
      ],
      items: [
        "Cloudflare: استضافة الموقع وتوصيله.",
        "Neon: استضافة قاعدة البيانات.",
        "Amazon Web Services (S3): تخزين الملفات.",
        "LiveKit: صوت وفيديو الحصص المباشرة.",
        "Google Firebase: الإشعارات والتحليلات وتقارير الأعطال في تطبيق أندرويد.",
      ],
    },
    {
      heading: "الأطفال",
      paragraphs: [
        "قد يكون الطلاب قاصرين. تُنشئ المدرسة حساباتهم، ولا ينشئونها بأنفسهم. والمدرسة مسؤولة عن الحصول على أي موافقة من أولياء الأمور تنطبق على طلابها.",
      ],
    },
    {
      heading: "مدة الاحتفاظ بالبيانات",
      paragraphs: [
        "نحتفظ ببيانات المدرسة ما دامت عميلًا لدينا. عند انتهاء العقد تتسلّم المدرسة نسخة مُصدَّرة من بياناتها، ونحذف البيانات خلال 30 يومًا من طلب المدرسة.",
      ],
    },
    {
      heading: "الأمان",
      paragraphs: [
        "تُشفَّر البيانات أثناء النقل. والوصول داخل المنصة محدد بحسب الدور، فلا يرى كل شخص إلا ما يسمح به دوره.",
      ],
    },
    {
      heading: "حقوقك",
      paragraphs: [
        `يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها عن طريق مدرستك، أو بالكتابة إلى ${EMAIL}. ولحذف حسابك راجع صفحة حذف الحساب.`,
      ],
    },
    {
      heading: "تغييرات السياسة",
      paragraphs: ["إذا غيّرنا هذه السياسة فسنحدّث التاريخ في أعلى هذه الصفحة."],
    },
  ],
}

const deleteEn: LegalDoc = {
  metaTitle: "Delete your account",
  metaDescription:
    "How to delete your Balqalam (بالقلم) account and data, in the app and on the web.",
  title: "Delete your account and data",
  updated: "Last updated 27 November 2026",
  intro:
    "This page applies to the Balqalam (بالقلم) Android app and to the Balqalam website.",
  sections: [
    {
      heading: "Accounts are created by schools",
      paragraphs: [
        "You cannot sign up on your own. Your school creates your account, so your school is also where deletion starts.",
      ],
    },
    {
      heading: "How to delete your account",
      items: [
        "Ask your school's administrator. They delete your account from the school dashboard.",
        `Or email ${EMAIL} from the email address of the account. Include your name and your school's name. We confirm the request with the school and delete the account within 30 days.`,
      ],
    },
    {
      heading: "What is deleted",
      items: [
        "Your profile.",
        "Your login.",
        "Messages you wrote.",
        "Device tokens used for push notifications.",
      ],
    },
    {
      heading: "What the school may keep",
      paragraphs: [
        "Grades, attendance and similar official school records may be kept by the school, under the school's own legal and record-keeping obligations. These records belong to the school, not to your account.",
      ],
    },
    {
      heading: "Questions",
      paragraphs: [`Write to ${EMAIL}.`],
    },
  ],
}

const deleteAr: LegalDoc = {
  metaTitle: "حذف الحساب",
  metaDescription:
    "كيف تحذف حسابك وبياناتك في «بالقلم»، في التطبيق وعلى الموقع.",
  title: "حذف حسابك وبياناتك",
  updated: "آخر تحديث: 27 نوفمبر 2026",
  intro: "تنطبق هذه الصفحة على تطبيق «بالقلم» لأندرويد وعلى موقع «بالقلم».",
  sections: [
    {
      heading: "المدرسة هي من تنشئ الحسابات",
      paragraphs: [
        "لا يمكنك التسجيل بنفسك. مدرستك هي التي تنشئ حسابك، ولذلك يبدأ الحذف من مدرستك أيضًا.",
      ],
    },
    {
      heading: "كيف تحذف حسابك",
      items: [
        "اطلب من مدير مدرستك. يحذف الحساب من لوحة تحكم المدرسة.",
        `أو راسل ${EMAIL} من البريد الإلكتروني الخاص بالحساب، واذكر اسمك واسم مدرستك. نؤكد الطلب مع المدرسة ونحذف الحساب خلال 30 يومًا.`,
      ],
    },
    {
      heading: "ما الذي يُحذف",
      items: [
        "ملفك الشخصي.",
        "بيانات تسجيل الدخول.",
        "الرسائل التي كتبتها.",
        "رموز الجهاز المستخدمة في الإشعارات.",
      ],
    },
    {
      heading: "ما قد تحتفظ به المدرسة",
      paragraphs: [
        "قد تحتفظ المدرسة بالدرجات والحضور وما شابهها من السجلات المدرسية الرسمية، بموجب التزاماتها القانونية والتوثيقية. هذه السجلات تخص المدرسة وليست جزءًا من حسابك.",
      ],
    },
    {
      heading: "أسئلة",
      paragraphs: [`راسلنا على ${EMAIL}.`],
    },
  ],
}

export const legalDocs: Record<LegalKey, Record<LegalLang, LegalDoc>> = {
  privacy: { en: privacyEn, ar: privacyAr },
  deleteAccount: { en: deleteEn, ar: deleteAr },
}
