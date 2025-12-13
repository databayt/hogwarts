/**
 * Health & Student Records Seed Module
 * Creates student health records, achievements, and disciplinary records
 * - Health records (vaccinations, medical checkups, incidents)
 * - Achievements (academic, sports, arts, leadership)
 * - Disciplinary records (minor incidents, resolutions)
 *
 * Uses findFirst + create pattern - safe to run multiple times (no deletes)
 */

import type { SeedPrisma } from "./types";

// Health record types and templates
const HEALTH_RECORD_TYPES = [
  {
    type: "Vaccination",
    titles: [
      { en: "Annual Flu Vaccination", ar: "التطعيم السنوي ضد الإنفلونزا" },
      { en: "Hepatitis B Vaccine", ar: "لقاح التهاب الكبد ب" },
      { en: "MMR Booster", ar: "جرعة تنشيطية MMR" },
      { en: "Meningitis Vaccine", ar: "لقاح التهاب السحايا" },
    ],
    descriptions: [
      { en: "Student received annual flu vaccination as part of school health program.", ar: "تلقى الطالب التطعيم السنوي ضد الإنفلونزا كجزء من البرنامج الصحي المدرسي." },
      { en: "Vaccination administered as per national immunization schedule.", ar: "تم إعطاء اللقاح وفقاً لجدول التطعيمات الوطني." },
    ],
    severity: null,
  },
  {
    type: "Medical Check-up",
    titles: [
      { en: "Annual Health Screening", ar: "الفحص الصحي السنوي" },
      { en: "Vision Test", ar: "فحص النظر" },
      { en: "Hearing Test", ar: "فحص السمع" },
      { en: "Dental Check-up", ar: "فحص الأسنان" },
    ],
    descriptions: [
      { en: "Routine annual health screening completed. All parameters within normal range.", ar: "تم إكمال الفحص الصحي السنوي الروتيني. جميع المؤشرات ضمن المعدل الطبيعي." },
      { en: "Student passed vision screening with 20/20 vision.", ar: "اجتاز الطالب فحص الرؤية بنظر 20/20." },
    ],
    severity: "Low",
  },
  {
    type: "Incident",
    titles: [
      { en: "Minor Playground Injury", ar: "إصابة طفيفة في الملعب" },
      { en: "Sports Injury", ar: "إصابة رياضية" },
      { en: "Classroom Accident", ar: "حادث في الصف" },
    ],
    descriptions: [
      { en: "Student sustained minor scrape during recess. First aid applied.", ar: "أصيب الطالب بخدش طفيف أثناء الاستراحة. تم تطبيق الإسعافات الأولية." },
      { en: "Minor injury during PE class. Ice pack applied, no further treatment needed.", ar: "إصابة طفيفة أثناء حصة التربية البدنية. تم تطبيق كيس ثلج، لا حاجة لعلاج إضافي." },
    ],
    severity: "Low",
  },
  {
    type: "Illness",
    titles: [
      { en: "Fever and Cold Symptoms", ar: "حمى وأعراض برد" },
      { en: "Stomach Ache", ar: "ألم في المعدة" },
      { en: "Headache", ar: "صداع" },
    ],
    descriptions: [
      { en: "Student sent home with fever. Parent notified and picked up student.", ar: "تم إرسال الطالب للمنزل بسبب الحمى. تم إخطار ولي الأمر وجاء لاستلامه." },
      { en: "Student complained of stomach ache. Rested in nurse's office, felt better.", ar: "اشتكى الطالب من ألم في المعدة. استراح في مكتب الممرضة وتحسنت حالته." },
    ],
    severity: "Medium",
  },
  {
    type: "Allergy Update",
    titles: [
      { en: "Peanut Allergy Confirmed", ar: "تأكيد حساسية الفول السوداني" },
      { en: "Dust Allergy Noted", ar: "ملاحظة حساسية الغبار" },
      { en: "Bee Sting Allergy", ar: "حساسية لسعة النحل" },
    ],
    descriptions: [
      { en: "Parent provided updated allergy information. EpiPen kept in nurse's office.", ar: "قدم ولي الأمر معلومات محدثة عن الحساسية. يتم الاحتفاظ بـ EpiPen في مكتب الممرضة." },
      { en: "Allergy information updated in student records. Staff notified.", ar: "تم تحديث معلومات الحساسية في سجلات الطالب. تم إخطار الموظفين." },
    ],
    severity: "High",
  },
];

// Achievement categories and templates
const ACHIEVEMENT_TEMPLATES = [
  {
    category: "Academic",
    titles: [
      { en: "Honor Roll Achievement", ar: "الشرف الأكاديمي" },
      { en: "Perfect Attendance Award", ar: "جائزة الحضور المثالي" },
      { en: "Subject Excellence Award", ar: "جائزة التميز في المادة" },
      { en: "Math Olympiad Participation", ar: "المشاركة في أولمبياد الرياضيات" },
      { en: "Science Fair Winner", ar: "الفائز في معرض العلوم" },
    ],
    levels: ["School", "District", "State"],
    positions: ["1st Place", "2nd Place", "3rd Place", "Honorable Mention", "Participant"],
    issuers: ["Ministry of Education", "School Administration", "Academic Department"],
  },
  {
    category: "Sports",
    titles: [
      { en: "Football Tournament Winner", ar: "الفائز في بطولة كرة القدم" },
      { en: "Athletics Champion", ar: "بطل ألعاب القوى" },
      { en: "Swimming Competition", ar: "مسابقة السباحة" },
      { en: "Basketball Team Captain", ar: "قائد فريق كرة السلة" },
      { en: "School Sports Day Champion", ar: "بطل يوم الرياضة المدرسي" },
    ],
    levels: ["School", "District", "Regional"],
    positions: ["Gold Medal", "Silver Medal", "Bronze Medal", "Best Player"],
    issuers: ["Sports Federation", "School Athletics Department", "Ministry of Youth"],
  },
  {
    category: "Arts",
    titles: [
      { en: "Art Exhibition Winner", ar: "الفائز في معرض الفن" },
      { en: "Music Performance Award", ar: "جائزة الأداء الموسيقي" },
      { en: "Drama Club Lead Role", ar: "الدور الرئيسي في نادي المسرح" },
      { en: "Calligraphy Competition", ar: "مسابقة الخط العربي" },
      { en: "Poetry Recitation Winner", ar: "الفائز في مسابقة إلقاء الشعر" },
    ],
    levels: ["School", "District", "National"],
    positions: ["1st Place", "Outstanding Performance", "Best Artist"],
    issuers: ["Arts Council", "School Arts Department", "Cultural Ministry"],
  },
  {
    category: "Cultural",
    titles: [
      { en: "Quran Recitation Competition", ar: "مسابقة تلاوة القرآن الكريم" },
      { en: "Arabic Language Excellence", ar: "التميز في اللغة العربية" },
      { en: "Islamic Knowledge Quiz", ar: "مسابقة المعلومات الإسلامية" },
      { en: "Heritage Day Participation", ar: "المشاركة في يوم التراث" },
    ],
    levels: ["School", "District", "National"],
    positions: ["1st Place", "2nd Place", "3rd Place", "Best Recitation"],
    issuers: ["Islamic Affairs Ministry", "School Administration", "Cultural Committee"],
  },
  {
    category: "Leadership",
    titles: [
      { en: "Student Council President", ar: "رئيس مجلس الطلاب" },
      { en: "Class Representative", ar: "ممثل الصف" },
      { en: "Peer Mentor Award", ar: "جائزة المرشد الطلابي" },
      { en: "Leadership Excellence Award", ar: "جائزة التميز في القيادة" },
    ],
    levels: ["School"],
    positions: ["President", "Vice President", "Secretary", "Outstanding Leader"],
    issuers: ["School Administration", "Student Affairs"],
  },
  {
    category: "Community Service",
    titles: [
      { en: "Volunteer of the Year", ar: "متطوع العام" },
      { en: "Environmental Club Award", ar: "جائزة نادي البيئة" },
      { en: "Charity Fundraiser Leader", ar: "قائد جمع التبرعات الخيرية" },
      { en: "Community Helper Award", ar: "جائزة مساعد المجتمع" },
    ],
    levels: ["School", "Community"],
    positions: ["Outstanding Volunteer", "Most Hours", "Best Initiative"],
    issuers: ["School Administration", "Community Organizations", "NGOs"],
  },
];

// Disciplinary record templates
const DISCIPLINARY_TEMPLATES = [
  {
    type: "Warning",
    severity: "Minor",
    incidents: [
      { en: "Late to class", ar: "التأخر عن الحصة" },
      { en: "Incomplete homework", ar: "واجب منزلي غير مكتمل" },
      { en: "Talking during class", ar: "التحدث أثناء الحصة" },
      { en: "Uniform violation", ar: "مخالفة الزي المدرسي" },
    ],
    actions: [
      { en: "Verbal warning given. Student reminded of class rules.", ar: "تم إعطاء تحذير شفهي. تم تذكير الطالب بقواعد الصف." },
      { en: "Written warning sent home. Parent signature required.", ar: "تم إرسال تحذير مكتوب للمنزل. يلزم توقيع ولي الأمر." },
    ],
    resolutions: [
      { en: "Student acknowledged the warning and promised improvement.", ar: "أقر الطالب بالتحذير ووعد بالتحسن." },
      { en: "Parent contacted and aware of the situation.", ar: "تم التواصل مع ولي الأمر وهو على علم بالموقف." },
    ],
  },
  {
    type: "Detention",
    severity: "Major",
    incidents: [
      { en: "Repeated tardiness", ar: "التأخر المتكرر" },
      { en: "Disruptive behavior in class", ar: "سلوك مزعج في الصف" },
      { en: "Disrespect to teacher", ar: "عدم احترام المعلم" },
    ],
    actions: [
      { en: "One hour after-school detention assigned.", ar: "تم تعيين حبس لمدة ساعة بعد المدرسة." },
      { en: "Lunchtime detention for one week.", ar: "حبس وقت الغداء لمدة أسبوع." },
    ],
    resolutions: [
      { en: "Student completed detention. Behavior improved.", ar: "أكمل الطالب فترة الحبس. تحسن السلوك." },
      { en: "Parent meeting held. Improvement plan in place.", ar: "تم عقد اجتماع مع ولي الأمر. خطة تحسين قيد التنفيذ." },
    ],
  },
];

export async function seedHealth(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("🏥 Creating health records, achievements, and disciplinary records...");

  // Get students
  const students = await prisma.student.findMany({
    where: { schoolId },
    select: { id: true, givenName: true, surname: true },
  });

  // Get admin user for recordedBy/reportedBy fields
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@databayt.org" },
    select: { id: true },
  });

  if (students.length === 0) {
    console.log("   ⚠️  No students found, skipping health records\n");
    return;
  }

  const recordedBy = adminUser?.id || "system";

  // Check existing counts
  const existingHealth = await prisma.healthRecord.count({ where: { schoolId } });
  const existingAchievements = await prisma.achievement.count({ where: { schoolId } });
  const existingDisciplinary = await prisma.disciplinaryRecord.count({ where: { schoolId } });

  if (existingHealth >= 100 && existingAchievements >= 50 && existingDisciplinary >= 20) {
    console.log(`   ✅ Records already exist (health: ${existingHealth}, achievements: ${existingAchievements}, disciplinary: ${existingDisciplinary}), skipping\n`);
    return;
  }

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // === HEALTH RECORDS (1 per student = 1000) ===
  let healthCount = 0;
  if (existingHealth < 100) {
    const healthRecords: Array<{
      schoolId: string;
      studentId: string;
      recordDate: Date;
      recordType: string;
      title: string;
      description: string;
      severity: string | null;
      doctorName: string | null;
      hospitalName: string | null;
      recordedBy: string;
    }> = [];

    for (const student of students) {
      // Each student gets 1-2 health records
      const numRecords = Math.random() > 0.5 ? 2 : 1;

      for (let i = 0; i < numRecords; i++) {
        const recordTemplate = HEALTH_RECORD_TYPES[Math.floor(Math.random() * HEALTH_RECORD_TYPES.length)];
        const titleTemplate = recordTemplate.titles[Math.floor(Math.random() * recordTemplate.titles.length)];
        const descTemplate = recordTemplate.descriptions[Math.floor(Math.random() * recordTemplate.descriptions.length)];
        const useArabic = Math.random() > 0.5;

        healthRecords.push({
          schoolId,
          studentId: student.id,
          recordDate: new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime())),
          recordType: recordTemplate.type,
          title: useArabic ? titleTemplate.ar : titleTemplate.en,
          description: useArabic ? descTemplate.ar : descTemplate.en,
          severity: recordTemplate.severity,
          doctorName: recordTemplate.type === "Medical Check-up" ? "Dr. Ahmed Hassan" : null,
          hospitalName: recordTemplate.type === "Medical Check-up" ? "Khartoum Medical Center" : null,
          recordedBy,
        });
      }
    }

    const healthResult = await prisma.healthRecord.createMany({
      data: healthRecords,
      skipDuplicates: true,
    });
    healthCount = healthResult.count;
  }

  // === ACHIEVEMENTS (30% of students = ~300) ===
  let achievementCount = 0;
  if (existingAchievements < 50) {
    const achievements: Array<{
      schoolId: string;
      studentId: string;
      title: string;
      description: string;
      achievementDate: Date;
      category: string;
      level: string;
      position: string;
      issuedBy: string;
      points: number;
    }> = [];

    // Select ~30% of students for achievements
    const achievingStudents = students.filter(() => Math.random() < 0.3);

    for (const student of achievingStudents) {
      const template = ACHIEVEMENT_TEMPLATES[Math.floor(Math.random() * ACHIEVEMENT_TEMPLATES.length)];
      const titleTemplate = template.titles[Math.floor(Math.random() * template.titles.length)];
      const useArabic = Math.random() > 0.5;

      achievements.push({
        schoolId,
        studentId: student.id,
        title: useArabic ? titleTemplate.ar : titleTemplate.en,
        description: `${student.givenName} ${student.surname} earned this achievement for outstanding performance.`,
        achievementDate: new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime())),
        category: template.category,
        level: template.levels[Math.floor(Math.random() * template.levels.length)],
        position: template.positions[Math.floor(Math.random() * template.positions.length)],
        issuedBy: template.issuers[Math.floor(Math.random() * template.issuers.length)],
        points: Math.floor(Math.random() * 100) + 1,
      });
    }

    const achievementResult = await prisma.achievement.createMany({
      data: achievements,
      skipDuplicates: true,
    });
    achievementCount = achievementResult.count;
  }

  // === DISCIPLINARY RECORDS (5% of students = ~50) ===
  let disciplinaryCount = 0;
  if (existingDisciplinary < 20) {
    const disciplinaryRecords: Array<{
      schoolId: string;
      studentId: string;
      incidentDate: Date;
      incidentType: string;
      severity: string;
      description: string;
      action: string;
      reportedBy: string;
      parentNotified: boolean;
      notifiedDate: Date | null;
      resolution: string;
    }> = [];

    // Select ~5% of students for disciplinary records
    const studentsWithIncidents = students.filter(() => Math.random() < 0.05);

    for (const student of studentsWithIncidents) {
      const template = DISCIPLINARY_TEMPLATES[Math.floor(Math.random() * DISCIPLINARY_TEMPLATES.length)];
      const incidentTemplate = template.incidents[Math.floor(Math.random() * template.incidents.length)];
      const actionTemplate = template.actions[Math.floor(Math.random() * template.actions.length)];
      const resolutionTemplate = template.resolutions[Math.floor(Math.random() * template.resolutions.length)];
      const useArabic = Math.random() > 0.5;

      const incidentDate = new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));

      disciplinaryRecords.push({
        schoolId,
        studentId: student.id,
        incidentDate,
        incidentType: template.type,
        severity: template.severity,
        description: useArabic ? incidentTemplate.ar : incidentTemplate.en,
        action: useArabic ? actionTemplate.ar : actionTemplate.en,
        reportedBy: recordedBy,
        parentNotified: true,
        notifiedDate: new Date(incidentDate.getTime() + 24 * 60 * 60 * 1000),
        resolution: useArabic ? resolutionTemplate.ar : resolutionTemplate.en,
      });
    }

    const disciplinaryResult = await prisma.disciplinaryRecord.createMany({
      data: disciplinaryRecords,
      skipDuplicates: true,
    });
    disciplinaryCount = disciplinaryResult.count;
  }

  console.log(`   ✅ Created student records:`);
  console.log(`      - Health records: ${healthCount} (vaccinations, checkups, incidents)`);
  console.log(`      - Achievements: ${achievementCount} (academic, sports, arts, leadership)`);
  console.log(`      - Disciplinary: ${disciplinaryCount} (warnings, resolutions)\n`);
}
