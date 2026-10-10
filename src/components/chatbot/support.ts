// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The chatbot's support knowledge: one entry per help guide under
 * `content/docs-{ar,en}/support/`. The bot answers how-to questions from
 * `answer` only, and attaches the guide + the flow's published media (see
 * support-media.ts) — so every fact here must match the product and its guide.
 *
 * Adding a topic: write the guide MDX (ar + en), add the entry here, and set
 * `flow` to the /shoot flow slug when one exists — its video and screenshots
 * then attach themselves as soon as they land in media-manifest.json.
 */

export interface SupportTopic {
  slug: string
  /** /shoot flow slug — the media-manifest.json prefix (`add-student/…`). */
  flow?: string
  title: { ar: string; en: string }
  /** One line for the index the bot sees on every turn. */
  summary: { ar: string; en: string }
  /** Condensed steps/facts the bot answers from — the guide has the rest. */
  answer: { ar: string; en: string }
  /**
   * Match phrases. Every space-separated part must appear in the question
   * (substring, after normalisation), so Arabic roots like «ضيف» catch
   * أضيف / يضيف / إضافة alike.
   */
  keywords: string[]
  /** Locale-less guide path, e.g. `/docs/support/add-student`. */
  guide: string
  /** A pre-sale question (getting started): keep the trial ask on. */
  sales?: boolean
}

const FAQ = "/docs/support/faq"

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    slug: "get-started",
    title: { ar: "البدء مع بالقلم", en: "Getting started" },
    summary: {
      ar: "تسجيل المدرسة وإعدادها وعنوانها الخاص",
      en: "Signing a school up, setting it up, its own web address",
    },
    answer: {
      ar: `1. اضغط «ابدأ الآن» على balqalam.com وسجّل الدخول أو أنشئ حسابًا.
2. يفتح معالج الإعداد: المعلومات الأساسية (الاسم، الوصف، الموقع).
3. ثم الإعداد: السعة، الهوية والشعار، واستيراد الطلاب من ملف CSV أو Excel إن رغبت.
4. ثم العمل: الظهور، السعر، الشروط، واختيار عنوان المدرسة (yourschool.balqalam.com).
5. عند إكمال الشروط تُفعَّل المدرسة وتُنشأ الصفوف والأقسام والفصول الدراسية والأدوار الافتراضية.
يستغرق الإعداد عادةً بين 10 و30 دقيقة.`,
      en: `1. Click "Get Started" on balqalam.com and sign in or create an account.
2. The setup wizard opens: basic information (name, description, location).
3. Then setup: capacity, branding and logo, and an optional student import from CSV or Excel.
4. Then business: visibility, price, terms, and choosing the school's address (yourschool.balqalam.com).
5. Finishing the terms activates the school and creates default grades, departments, terms and roles.
Setup usually takes 10–30 minutes.`,
    },
    keywords: [
      "ابدا",
      "سجل مدرس",
      "انشئ مدرس",
      "انشاء مدرس",
      "اعداد المدرس",
      "عنوان المدرس",
      "نطاق",
      "get started",
      "sign up",
      "signup",
      "register school",
      "create school",
      "onboard",
      "subdomain",
      "domain",
      "set up",
      "setup",
    ],
    guide: "/docs/support/get-started",
    sales: true,
  },
  {
    slug: "pricing",
    title: { ar: "الأسعار والدفع", en: "Pricing and payment" },
    summary: {
      ar: "السعر لكل طالب، الحاسبة، وخطة الدفع",
      en: "The per-student price, the calculator, the payment plan",
    },
    // The live figures (rate, currencies, worked examples) are in the
    // prompt's pricing block — this entry only routes to the calculator.
    answer: {
      ar: "استخدم قسم «الأسعار المباشرة» أعلاه، ووجّه الزائر إلى حاسبة الأسعار المرفقة ليرى سعر مدرسته بعملته.",
      en: "Answer from the live pricing section above, and point the visitor to the attached price calculator to see their school's price in their currency.",
    },
    keywords: [
      "سعر",
      "اسعار",
      "تكلف",
      "بكم",
      "عرض سعر",
      "price",
      "pricing",
      "cost",
      "how much",
      "quote",
      "plan",
    ],
    guide: "/pricing",
    sales: true,
  },
  {
    slug: "add-student",
    flow: "add-student",
    title: { ar: "إضافة طالب", en: "Add a student" },
    summary: {
      ar: "معالج إضافة طالب واحد مع بيانات دخوله",
      en: "The add-student wizard, with the student's login",
    },
    answer: {
      ar: `1. افتح «الطلاب» من القائمة الجانبية، ثم اضغط زر «+» (إنشاء).
2. المستندات: ارفع صورة الطالب وملفاته (الهوية، الشهادة) — تُملأ بعض الحقول منها تلقائيًا.
3. البيانات الشخصية: اسم الطالب وبيانات ولي الأمر (تبويبا الأب والأم).
4. العنوان.
5. الأكاديمي: الصف والمسار والشعبة، ثم اضغط «إنشاء».
6. تظهر بيانات دخول الطالب (اسم المستخدم وكلمة المرور) — انسخها أو أرسلها عبر واتساب أو رسالة نصية أو البريد.
المطلوب فقط: اسم الطالب وولي أمر واحد.`,
      en: `1. Open "Students" from the sidebar, then click the "+" (Create) button.
2. Documents: upload the student's photo and files (ID, transcript) — some fields fill in from them.
3. Personal details: the student's name and the guardian's details (Father and Mother tabs).
4. Address.
5. Academic: grade, stream and section, then click "Create".
6. The student's login (username and password) appears — copy it or send it by WhatsApp, SMS or email.
Only the student's name and one parent are required.`,
    },
    keywords: [
      "ضيف طالب",
      "ضيف طلاب",
      "ضاف طالب",
      "ضاف طلاب",
      "ضيف الطالب",
      "ضاف الطالب",
      "طالب جديد",
      "سجل طالب",
      "تسجيل طالب",
      "دخل طالب",
      "ادخال طالب",
      "انشئ طالب",
      "انشاء طالب",
      "add student",
      "add a student",
      "new student",
      "create student",
      "create a student",
      "register student",
      "register a student",
      "enrol",
      "enroll",
    ],
    guide: "/docs/support/add-student",
  },
  {
    slug: "add-teacher",
    flow: "add-teacher",
    title: { ar: "إضافة معلم", en: "Add a teacher" },
    summary: {
      ar: "معالج إضافة معلم مع مواده وشعبه",
      en: "The add-teacher wizard, with subjects and sections",
    },
    answer: {
      ar: `1. افتح «المعلمين» من القائمة الجانبية، ثم اضغط زر «+» (إنشاء).
2. المستندات: ارفع صورة المعلم وسيرته الذاتية إن وُجدت.
3. المعلومات الأساسية: الاسم والبيانات الشخصية.
4. التخصص: اختر المواد والشعب التي يدرّسها.
5. التواصل (البريد الإلكتروني مطلوب)، ثم العنوان، ثم بيانات التوظيف، واضغط «إنشاء».
6. لإعطائه بيانات دخول: من قائمة المعلمين افتح إجراءات الصف واختر «إنشاء بيانات الدخول».`,
      en: `1. Open "Teachers" from the sidebar, then click the "+" (Create) button.
2. Documents: upload the teacher's photo and CV if you have them.
3. Basic information: name and personal details.
4. Expertise: pick the subjects and sections they teach.
5. Contact (an email is required), then address, then employment details, and click "Create".
6. To give them a login: in the teachers list, open the row's actions and choose "Generate Credentials".`,
    },
    keywords: [
      "ضيف معلم",
      "ضاف معلم",
      "ضيف مدرس",
      "ضاف مدرس",
      "ضيف استاذ",
      "معلم جديد",
      "مدرس جديد",
      "سجل معلم",
      "تسجيل معلم",
      "انشاء معلم",
      "ضيف المعلم",
      "add teacher",
      "add a teacher",
      "new teacher",
      "create teacher",
      "create a teacher",
      "register teacher",
    ],
    guide: "/docs/support/add-teacher",
  },
  {
    slug: "bulk-student",
    flow: "bulk-student",
    title: { ar: "إدخال الطلاب جماعيًا", en: "Bulk-import students" },
    summary: {
      ar: "استيراد الطلاب من ملف Excel أو CSV مع بيانات دخولهم",
      en: "Importing students from an Excel or CSV file, with their logins",
    },
    answer: {
      ar: `1. افتح «المدرسة» ← «إدخال جماعي» (للمدير فقط).
2. في بطاقة الطلاب: نزّل «القالب» إن أردت، ثم اختر ملفك (Excel أو CSV أو JSON أو Word أو نص — حتى 10 ميغابايت و5,000 صف).
3. «مطابقة الأعمدة»: تُطابق الأعمدة تلقائيًا بالعربية أو الإنجليزية — راجعها.
4. «المراجعة»: يظهر كل صف جديدًا أو تحديثًا أو تخطيًا أو خطأً، ولا يُحفظ شيء قبل الاستيراد.
5. اضغط «استيراد»، ثم «تنزيل بيانات الدخول» (ملف) أو «طباعة بطاقات الدخول» (مع رمز QR). يختار كل مستخدم كلمة مروره عند أول دخول.
6. أخطأت؟ «تراجع» في «سجل الاستيراد» يحذف من أنشأهم الاستيراد (عدا من سجّل دخوله).`,
      en: `1. Open "School" → "Bulk" (admins only).
2. On the Students card: download the "Template" if you like, then choose your file (Excel, CSV, JSON, Word or text — up to 10 MB and 5,000 rows).
3. "Match columns": columns are matched automatically, in Arabic or English — check them.
4. "Review": each row shows as New, Update, Skip or Error, and nothing is saved before you import.
5. Click "Import", then "Download logins" (a file) or "Print login slips" (with QR codes). Each user picks their own password at first sign-in.
6. Made a mistake? "Undo" in "Import history" removes the people that import created (except anyone who already signed in).`,
    },
    keywords: [
      "استيراد طلاب",
      "استيراد الطلاب",
      "جماعي طلاب",
      "جماعي الطلاب",
      "طلاب اكسل",
      "طلاب excel",
      "طلاب ملف",
      "الطلاب من ملف",
      "دفعه طلاب",
      "كل الطلاب",
      "import student",
      "bulk student",
      "students excel",
      "students from excel",
      "students csv",
      "students from a file",
      "upload students",
      "many students",
      "all students",
      "اكسل",
      "excel",
      "csv",
      "استيراد",
      "جماعي",
      "bulk",
      "import",
    ],
    guide: "/docs/support/bulk-student",
  },
  {
    slug: "bulk-teacher",
    flow: "bulk-teacher",
    title: { ar: "إدخال المعلمين جماعيًا", en: "Bulk-import teachers" },
    summary: {
      ar: "استيراد المعلمين من ملف مع أقسامهم ومواده وبيانات دخولهم",
      en: "Importing teachers from a file, with departments, subjects and logins",
    },
    answer: {
      ar: `1. افتح «المدرسة» ← «إدخال جماعي» (للمدير فقط).
2. في بطاقة المعلمين: نزّل «القالب» إن أردت، ثم اختر ملفك (Excel أو CSV أو غيرهما — حتى 10 ميغابايت و5,000 صف).
3. «مطابقة الأعمدة»: تُطابق الأعمدة تلقائيًا (الاسم، البريد، القسم، المواد) — راجعها.
4. «المراجعة»: تأكد أن كل صف «جديد»، ولا يُحفظ شيء قبل الاستيراد.
5. اضغط «استيراد» — تُنشأ حسابات المعلمين — ثم «تنزيل بيانات الدخول» أو «طباعة بطاقات الدخول».
6. «تراجع» في «سجل الاستيراد» يحذف من أنشأهم الاستيراد (عدا من سجّل دخوله).`,
      en: `1. Open "School" → "Bulk" (admins only).
2. On the Teachers card: download the "Template" if you like, then choose your file (Excel, CSV and more — up to 10 MB and 5,000 rows).
3. "Match columns": columns are matched automatically (name, email, department, subjects) — check them.
4. "Review": check each row is New; nothing is saved before you import.
5. Click "Import" — teacher accounts are created — then "Download logins" or "Print login slips".
6. "Undo" in "Import history" removes the people that import created (except anyone who already signed in).`,
    },
    keywords: [
      "استيراد معلم",
      "استيراد المعلم",
      "جماعي معلم",
      "جماعي المعلم",
      "معلمين اكسل",
      "المعلمين من ملف",
      "معلمين ملف",
      "كل المعلمين",
      "import teacher",
      "bulk teacher",
      "teachers excel",
      "teachers from excel",
      "teachers csv",
      "teachers from a file",
      "upload teachers",
      "all teachers",
    ],
    guide: "/docs/support/bulk-teacher",
  },
  {
    slug: "login",
    title: { ar: "الدخول ونسيان كلمة المرور", en: "Signing in and passwords" },
    summary: {
      ar: "تسجيل الدخول واستعادة كلمة المرور",
      en: "Signing in and resetting a password",
    },
    answer: {
      ar: `- ادخل من صفحة الدخول على عنوان مدرستك بالبريد الإلكتروني أو اسم المستخدم، ثم «دخول».
- نسيت كلمة المرور؟ اضغط «نسيت كلمة المرور؟» وأدخل بريدك — يصلك رابط لتعيين كلمة جديدة.
- الاستعادة بالبريد فقط: من يدخل باسم مستخدم دون بريد يطلب من مدير المدرسة «إنشاء بيانات الدخول» من جديد.`,
      en: `- Sign in on your school's login page with your email or username, then "Login".
- Forgot your password? Click "Forgot Password?" and enter your email — you'll get a link to set a new one.
- Reset is by email only: someone who signs in with a username and no email asks the school admin to "Generate Credentials" again.`,
    },
    keywords: [
      "كلمه المرور",
      "كلمه السر",
      "نسيت",
      "تسجيل الدخول",
      "لا استطيع الدخول",
      "ما قادر ادخل",
      "اسم المستخدم",
      "بيانات الدخول",
      "password",
      "forgot",
      "log in",
      "login",
      "sign in",
      "signin",
      "username",
      "credentials",
      "locked out",
    ],
    guide: `${FAQ}#login`,
  },
  {
    slug: "roles",
    title: { ar: "الأدوار والصلاحيات", en: "Roles and permissions" },
    summary: {
      ar: "ما يراه المدير والمعلم والطالب وولي الأمر والمحاسب والموظف",
      en: "What admins, teachers, students, parents, accountants and staff see",
    },
    answer: {
      ar: `- المدير: كل شيء — المدرسة والطلاب والمعلمين والقبول والمالية والإعدادات.
- المعلم: الطلاب والفصول والاختبارات والحضور والجدول والدرجات.
- الطالب: حضوره واختباراته ودرجاته وجدوله وواجباته.
- ولي الأمر: بوابة ولي الأمر والدرجات والاختبارات والحضور.
- المحاسب: المالية والقبول ورسوم النقل. الموظف: الطلاب والمعلمين وأولياء الأمور والقبول.
- الجميع يرى: النظرة العامة والإعلانات والمكتبة والملف الشخصي والإعدادات.`,
      en: `- Admin: everything — school, students, teachers, admission, finance and settings.
- Teacher: students, classrooms, exams, attendance, timetable and grades.
- Student: their attendance, exams, grades, timetable and assignments.
- Parent: the parent portal, grades, exams and attendance.
- Accountant: finance, admission and transport fees. Staff: students, teachers, parents and admission.
- Everyone sees: overview, announcements, library, profile and settings.`,
    },
    keywords: [
      "صلاحي",
      "ادوار",
      "الدور",
      "محاسب",
      "موظف",
      "من يرى",
      "role",
      "permission",
      "access",
      "accountant",
      "staff",
      "who can see",
    ],
    guide: `${FAQ}#roles`,
  },
  {
    slug: "language",
    title: { ar: "العربية والإنجليزية", en: "Arabic and English" },
    summary: {
      ar: "تبديل لغة المنصة",
      en: "Switching the platform's language",
    },
    answer: {
      ar: `- اضغط أيقونة اللغات في الشريط العلوي («تبديل اللغة») للتبديل بين العربية والإنجليزية.
- العربية هي اللغة الافتراضية (من اليمين لليسار)، ويُحفظ اختيارك لمدة سنة.`,
      en: `- Click the languages icon in the top bar ("Switch language") to switch between Arabic and English.
- Arabic is the default (right-to-left), and your choice is remembered for a year.`,
    },
    keywords: [
      "لغه",
      "انجليزي",
      "انقليزي",
      "عربي",
      "language",
      "english",
      "arabic",
      "translate",
      "rtl",
    ],
    guide: `${FAQ}#language`,
  },
  {
    slug: "attendance",
    title: { ar: "الحضور والغياب", en: "Attendance" },
    summary: {
      ar: "تحضير الطلاب وطرق الحضور",
      en: "Taking attendance and the ways to do it",
    },
    answer: {
      ar: `1. يفتح المعلم «الحضور» فيجد «التحضير السريع»: الجميع حاضرون افتراضيًا.
2. اضغط على الطلاب الغائبين فقط، ثم احفظ.
- يُبلَّغ أولياء أمور الغائبين تلقائيًا، ويمكنهم تقديم عذر.
- طرق أخرى: يدوي، رمز QR، باركود، كشك، رفع ملف CSV، والسياج الجغرافي.
- التحضير السريع يعمل دون إنترنت ويتزامن عند عودة الاتصال.`,
      en: `1. The teacher opens "Attendance" and lands on "Quick Attendance": everyone starts present.
2. Tap only the absent students, then save.
- Parents of absent students are notified automatically, and can submit an excuse.
- Other methods: manual, QR code, barcode, kiosk, CSV upload and geofence.
- Quick Attendance works offline and syncs when the connection returns.`,
    },
    keywords: [
      "حضور",
      "غياب",
      "تحضير",
      "غائب",
      "attendance",
      "absent",
      "absence",
      "roll call",
      "qr",
    ],
    guide: `${FAQ}#attendance`,
  },
  {
    slug: "fees",
    title: { ar: "الرسوم والفواتير", en: "Fees and invoices" },
    summary: {
      ar: "إعداد الرسوم وتحصيلها وإصدار الفواتير",
      en: "Setting up fees, collecting them and invoicing",
    },
    answer: {
      ar: `1. افتح «المالية» ← الرسوم ← هياكل الرسوم، وأنشئ رسمًا: المبلغ والفئة والصف وعدد الأقساط ورسوم التأخير.
2. اربطه بالطلاب فرديًا أو جماعيًا — والطالب الذي يُوضع في صف يأخذ رسوم ذلك الصف تلقائيًا.
- الدفع: بطاقة (Stripe) ونقدًا وتحويلًا بنكيًا ومحافظ الجوال (بنكك/mBOK).
- يُرسَل تذكير يومي بالمتأخرات.
- الفواتير: تُنشأ تلقائيًا من الرسوم أو يدويًا من «الفواتير»، وتُشارك برابط أو PDF أو بالبريد.`,
      en: `1. Open "Finance" → Fees → Fee Structures and create a fee: amount, category, grade, number of instalments and late fee.
2. Assign it to students one by one or in bulk — a student placed in a grade gets that grade's fees automatically.
- Payment: card (Stripe), cash, bank transfer and mobile wallets (Bankak/mBOK).
- A daily reminder goes out for overdue fees.
- Invoices: created automatically from fees or by hand under "Invoice", and shared by link, PDF or email.`,
    },
    keywords: [
      "رسوم",
      "حصل رسوم",
      "تحصيل",
      "فاتور",
      "فواتير",
      "مصروفات",
      "اقساط",
      "قسط",
      "دفع",
      "مالي",
      "fee",
      "invoice",
      "payment",
      "tuition",
      "instalment",
      "installment",
      "finance",
      "billing",
    ],
    guide: `${FAQ}#fees`,
  },
  {
    slug: "academics",
    title: {
      ar: "الجدول والاختبارات والدرجات",
      en: "Timetable, exams and grades",
    },
    summary: {
      ar: "الجدول الأسبوعي، الاختبارات، الشهادات والدرجات",
      en: "The weekly timetable, exams, report cards and grades",
    },
    answer: {
      ar: `- الجدول: جدول أسبوعي لكل شعبة، يدويًا أو بالتوليد التلقائي، مع كشف التعارضات وتصدير PDF.
- الاختبارات: بنك أسئلة، توليد أوراق الاختبار، اختبارات إلكترونية، تصحيح تلقائي وشهادات.
- الدرجات: الشهادات وكشوف الدرجات والترفيع وقوالب الشهادات.`,
      en: `- Timetable: a weekly schedule per section, made by hand or generated automatically, with conflict checks and PDF export.
- Exams: a question bank, paper generation, online exams, auto-marking and certificates.
- Grades: report cards, transcripts, promotion and report-card templates.`,
    },
    keywords: [
      "جدول",
      "حصص",
      "اختبار",
      "امتحان",
      "درجات",
      "نتائج",
      "شهاد",
      "timetable",
      "schedule",
      "exam",
      "test",
      "grade",
      "report card",
      "result",
      "marks",
    ],
    guide: `${FAQ}#academics`,
  },
  {
    slug: "parents",
    title: { ar: "أولياء الأمور", en: "Parents" },
    summary: {
      ar: "دخول أولياء الأمور وما يرونه",
      en: "Parent logins and what parents see",
    },
    answer: {
      ar: `- إضافة طالب تحفظ ولي الأمر كجهة اتصال؛ ولإعطائه دخولًا: «إنشاء بيانات الدخول»، أو استيراد أولياء الأمور جماعيًا، أو ربطه برمز وصول.
- بوابة ولي الأمر: الأبناء، الرسوم، الإعلانات، الفعاليات والرسائل، إضافة إلى حضور الأبناء ودرجاتهم واختباراتهم.
- يُبلَّغ ولي الأمر تلقائيًا عند غياب ابنه ويمكنه تقديم عذر.`,
      en: `- Adding a student saves the parent as a contact; to give them a login: "Generate Credentials", a bulk import of guardians, or linking them with an access code.
- The parent portal: children, fees, announcements, events and messages, plus the children's attendance, grades and exams.
- Parents are notified automatically when their child is absent, and can submit an excuse.`,
    },
    keywords: [
      "ولي الامر",
      "اولياء الامور",
      "بوابه ولي",
      "الوالدين",
      "parent",
      "guardian",
      "father",
      "mother",
    ],
    guide: `${FAQ}#parents`,
  },
  {
    slug: "security",
    title: { ar: "أمان البيانات وخصوصيتها", en: "Data security and privacy" },
    summary: {
      ar: "فصل بيانات كل مدرسة، التشفير، والتصدير",
      en: "Each school's data kept apart, encryption, export",
    },
    answer: {
      ar: `- بيانات كل مدرسة منفصلة: كل سجل مرتبط بمدرستها، ولكل مدرسة عنوانها الخاص.
- كل مستخدم يرى ما يسمح به دوره فقط.
- البيانات الحساسة مشفّرة (AES-256).
- يمكن تصدير القوائم إلى CSV من زر «تصدير CSV».
- لأسئلة الاستضافة والنسخ الاحتياطي والعقود، راسل الفريق ليؤكدها لك.`,
      en: `- Each school's data is kept apart: every record belongs to its school, and each school has its own address.
- Every user sees only what their role allows.
- Sensitive data is encrypted (AES-256).
- Lists export to CSV with the "Export CSV" button.
- For hosting, backups and contract questions, email the team to confirm them for you.`,
    },
    keywords: [
      "امان",
      "حمايه",
      "خصوصي",
      "تشفير",
      "بياناتي",
      "نسخ احتياطي",
      "تصدير",
      "security",
      "secure",
      "privacy",
      "encrypt",
      "backup",
      "gdpr",
      "export",
      "safe",
      "my data",
    ],
    guide: `${FAQ}#security`,
  },
  {
    slug: "mobile",
    title: { ar: "الجوال والعمل دون إنترنت", en: "Mobile and offline" },
    summary: {
      ar: "تثبيت التطبيق على الجوال والعمل دون اتصال",
      en: "Installing the app on a phone, working offline",
    },
    answer: {
      ar: `- «بالقلم» تطبيق قابل للتثبيت باسم مدرستك وألوانها.
- أندرويد (كروم): افتح عنوان مدرستك واضغط «متابعة» للتثبيت.
- آيفون (سفاري): مشاركة ← «إضافة إلى الشاشة الرئيسية».
- دون إنترنت: التحضير السريع ودروس «لومُس» تعمل وتتزامن لاحقًا؛ باقي الصفحات تحتاج اتصالًا.`,
      en: `- Balqalam installs as an app with your school's name and colours.
- Android (Chrome): open your school's address and tap "Continue" to install.
- iPhone (Safari): Share → "Add to Home Screen".
- Offline: Quick Attendance and Lumos lessons keep working and sync later; other pages need a connection.`,
    },
    keywords: [
      "جوال",
      "موبايل",
      "هاتف",
      "تطبيق",
      "ايفون",
      "اندرويد",
      "بدون انترنت",
      "دون انترنت",
      "اوفلاين",
      "mobile",
      "phone",
      "app",
      "iphone",
      "android",
      "install",
      "offline",
      "internet",
    ],
    guide: `${FAQ}#mobile`,
  },
  {
    slug: "contact",
    title: { ar: "التواصل مع الدعم", en: "Contacting support" },
    summary: {
      ar: "متى وكيف تراسل فريق بالقلم",
      en: "When and how to reach the Balqalam team",
    },
    answer: {
      ar: `- راسلنا على contact@databayt.org مع اسم مدرستك ووصف المشكلة ولقطة شاشة.
- مفيد أن تذكر: الصفحة التي كنت فيها، وما الذي ضغطته، ونص رسالة الخطأ.`,
      en: `- Email contact@databayt.org with your school's name, what went wrong and a screenshot.
- It helps to include: the page you were on, what you clicked, and the error message.`,
    },
    keywords: [
      "تواصل",
      "دعم فني",
      "مشكله",
      "خطا",
      "عطل",
      "لا يعمل",
      "ما شغال",
      "بلاغ",
      "contact",
      "support",
      "help desk",
      "bug",
      "error",
      "not working",
      "broken",
      "problem",
      "issue",
    ],
    guide: `${FAQ}#contact`,
  },
]

const TASHKEEL = /[ً-ٰٟـ]/g

/** Lower-case, strip tashkeel/tatweel, fold alef/ta-marbuta/ya variants. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(TASHKEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const INDEX = SUPPORT_TOPICS.map((topic) => ({
  topic,
  phrases: topic.keywords.map((k) => normalize(k).split(" ").filter(Boolean)),
}))

/** Score of one text: each matched phrase counts its number of parts. */
function score(text: string, phrases: string[][]): number {
  // Pad so a short English keyword ("app", "test") only matches whole words.
  const padded = ` ${text} `
  let total = 0
  for (const parts of phrases) {
    const hit = parts.every((p) =>
      /^[a-z0-9]+$/.test(p) && p.length <= 4
        ? padded.includes(` ${p} `) || padded.includes(` ${p}s `)
        : text.includes(p)
    )
    if (hit) total += parts.length
  }
  return total
}

/**
 * The guides a question is about, best first. `texts` is the latest user
 * message first, then earlier ones as context (weighted lower), so a
 * follow-up ("and then?") keeps the topic under discussion.
 */
export function matchTopics(texts: string[], n = 2): SupportTopic[] {
  const normalized = texts.map(normalize)
  return INDEX.map(({ topic, phrases }) => ({
    topic,
    score: normalized.reduce(
      (sum, text, i) => sum + score(text, phrases) / (i + 1) ** 2,
      0
    ),
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((s) => s.topic)
}

const HELP_INDEX = [
  "تساعدني",
  "تساعد في",
  "ماذا تستطيع",
  "بماذا تساعد",
  "ايش تقدر",
  "مركز المساعده",
  "help me with",
  "can you help",
  "what can you",
  "help center",
  "what guides",
].map(normalize)

/**
 * "What can you help me with?" — the Support chip's own question. No single
 * guide answers it: the bot lists the guides and attaches the help center.
 */
export function isHelpIndexQuestion(text: string): boolean {
  const t = normalize(text)
  return HELP_INDEX.some((k) => t.includes(k))
}

/** A how-to question about using the product — not a pre-sale one. */
export function isSupportQuestion(matched: SupportTopic[]): boolean {
  return matched.length > 0 && !matched[0]!.sales
}

/**
 * The `{support}` block of the SaaS prompt: every guide's title + summary
 * (so the bot can list what it helps with), then the full answer of the
 * guides this question matched.
 */
export function formatSupport(locale: string, matched: SupportTopic[]): string {
  const lang = locale === "ar" ? "ar" : "en"
  const index = SUPPORT_TOPICS.map(
    (t) => `- ${t.title[lang]}: ${t.summary[lang]}`
  ).join("\n")
  if (!matched.length) return index
  const guides = matched
    .map((t) => `### ${t.title[lang]}\n${t.answer[lang]}`)
    .join("\n\n")
  const heading =
    lang === "ar"
      ? "### الأدلة المطابقة لهذا السؤال"
      : "### Guides matching this question"
  return `${index}\n\n${heading}\n\n${guides}`
}
