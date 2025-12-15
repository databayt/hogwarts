/**
 * Events Seed Module - Bilingual (AR/EN)
 * Creates 50+ school events with comprehensive coverage
 *
 * Event Categories:
 * - Academic (exams, competitions, fairs)
 * - Sports (tournaments, sports days)
 * - Cultural (celebrations, performances)
 * - Islamic (Eid, Mawlid, Hijri events)
 * - Parent meetings & workshops
 * - Staff development
 * - Community service
 * - Health & safety
 * - Grade-specific activities
 */

import { EventType, EventStatus } from "@prisma/client";
import type { SeedPrisma } from "./types";

export async function seedEvents(prisma: SeedPrisma, schoolId: string): Promise<void> {
  console.log("🎉 Creating school events (50+ events, Bilingual AR/EN)...");

  // Helper to create dates relative to today
  const today = new Date();
  const daysFromNow = (days: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };
  const daysAgo = (days: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date;
  };

  const events = [
    // ============================================================
    // ACADEMIC EVENTS
    // ============================================================
    {
      title: "اختبارات منتصف الفصل | Mid-Term Examinations",
      description: `أسبوع اختبارات منتصف الفصل لجميع المراحل. نتوقع من طلابنا إظهار التميز الأكاديمي.

Mid-term examination week for all grades. Students are expected to demonstrate academic excellence.

جدول الامتحانات | Examination Schedule:
- الروضة والابتدائي | KG & Primary: 7:45 AM - 11:00 AM
- المتوسط | Intermediate: 7:45 AM - 12:00 PM
- الثانوي | Secondary: 7:45 AM - 1:00 PM

يرجى الحضور قبل 15 دقيقة من الموعد المحدد.`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(14),
      startTime: "07:45",
      endTime: "13:00",
      location: "جميع الفصول | All Classrooms",
      organizer: "الشؤون الأكاديمية | Academic Affairs",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: 500,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "معرض العلوم والتكنولوجيا | Science & Technology Fair",
      description: `المعرض السنوي للعلوم والتكنولوجيا لعرض مشاريع الطلاب والابتكارات.

Annual Science & Technology Fair showcasing student projects and innovations.

الفئات | Categories:
- الفيزياء والهندسة | Physics & Engineering
- الكيمياء والأحياء | Chemistry & Biology
- علوم الحاسوب | Computer Science
- العلوم البيئية | Environmental Science

جوائز للمشاريع المتميزة في كل فئة.`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(30),
      startTime: "09:00",
      endTime: "15:00",
      location: "القاعة الرئيسية والمعامل | Main Hall & Labs",
      organizer: "قسم العلوم | Science Department",
      targetAudience: "الطلاب، أولياء الأمور، العامة | Students, Parents, Public",
      maxAttendees: 300,
      isPublic: true,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "مسابقة القرآن الكريم | Quran Recitation Competition",
      description: `مسابقة سنوية في تلاوة وحفظ القرآن الكريم. تشجيع الطلاب على التنافس في حفظ كتاب الله.

Annual Quran recitation and memorization competition.

الفئات | Categories:
- حفظ خمسة أجزاء | 5 Juz Memorization
- حفظ عشرة أجزاء | 10 Juz Memorization
- التلاوة المجودة | Tajweed Recitation
- أفضل صوت | Best Voice`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(40),
      startTime: "09:00",
      endTime: "14:00",
      location: "القاعة الرئيسية | Main Hall",
      organizer: "قسم الدراسات الإسلامية | Religious Studies Dept",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: 200,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "أولمبياد الرياضيات | Mathematics Olympiad",
      description: `مسابقة الرياضيات السنوية لاكتشاف المواهب الرياضية.

Annual Mathematics competition to discover math talents.

المستويات | Levels:
- الابتدائي (1-6) | Primary (Grades 1-6)
- المتوسط (7-9) | Intermediate (Grades 7-9)
- الثانوي (10-12) | Secondary (Grades 10-12)`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(45),
      startTime: "08:00",
      endTime: "12:00",
      location: "قاعة الاختبارات | Examination Hall",
      organizer: "قسم الرياضيات | Mathematics Dept",
      targetAudience: "الطلاب المتميزون | Outstanding Students",
      maxAttendees: 150,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "مسابقة الإملاء العربي | Arabic Spelling Bee",
      description: `مسابقة الإملاء السنوية لتعزيز مهارات الكتابة العربية الصحيحة.

Annual Arabic spelling competition to enhance proper Arabic writing skills.

المراحل | Stages:
- التصفيات الأولية | Preliminary Rounds
- نصف النهائي | Semi-Finals
- النهائي | Finals`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(35),
      startTime: "09:00",
      endTime: "13:00",
      location: "القاعة الرئيسية | Main Hall",
      organizer: "قسم اللغة العربية | Arabic Language Dept",
      targetAudience: "الصفوف 4-12 | Grades 4-12",
      maxAttendees: 100,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "English Debate Championship",
      description: `Annual English debate competition to develop critical thinking and public speaking skills.

Format:
- Parliamentary style debate
- 3 students per team
- Topics announced 30 minutes before debates

Categories:
- Junior (Grades 7-9)
- Senior (Grades 10-12)`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(50),
      startTime: "09:00",
      endTime: "15:00",
      location: "Main Assembly Hall",
      organizer: "English Department",
      targetAudience: "Grades 7-12",
      maxAttendees: 80,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "معرض الكتاب الأسبوعي | Weekly Book Fair",
      description: `معرض الكتاب الأسبوعي في مكتبة المدرسة. كتب بأسعار مخفضة.

Week-long book fair at the school library. Books at discounted prices.

المجموعات | Collections:
- الأدب العربي | Arabic Literature
- الكلاسيكيات الإنجليزية | English Classics
- العلوم والتكنولوجيا | Science & Technology
- كتّاب سودانيون | Sudanese Authors`,
      eventType: EventType.CULTURAL,
      eventDate: daysAgo(2),
      startTime: "08:00",
      endTime: "14:00",
      location: "المكتبة | School Library",
      organizer: "لجنة المكتبة | Library Committee",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: null,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.ONGOING,
    },

    // ============================================================
    // SPORTS EVENTS
    // ============================================================
    {
      title: "يوم الرياضة السنوي | Annual Sports Day",
      description: `يوم الرياضة السنوي للمدرسة! جميع الطلاب مدعوون للمشاركة.

Annual Sports Day! All students are encouraged to participate.

المسابقات | Events:
- ألعاب القوى | Track & Field (100m, 200m, 400m, Relay)
- كرة القدم | Football Tournament
- كرة السلة | Basketball Competition
- الكرة الطائرة | Volleyball Matches
- الألعاب التقليدية | Traditional Sudanese Games

"إلى الأمام دائماً" - Always Forward!`,
      eventType: EventType.SPORTS,
      eventDate: daysFromNow(21),
      startTime: "07:00",
      endTime: "17:00",
      location: "الملعب الرياضي | Sports Ground",
      organizer: "قسم التربية الرياضية | PE Department",
      targetAudience: "جميع الطلاب، أولياء الأمور | All Students, Parents",
      maxAttendees: 1000,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "بطولة كرة القدم بين المدارس | Inter-School Football Championship",
      description: `بطولة كرة القدم السنوية بين المدارس. فرق من مختلف مدارس الخرطوم تتنافس على الكأس.

Annual inter-school football championship.

الجدول | Schedule:
- دور المجموعات | Group Stage: Days 1-2
- نصف النهائي | Semi-Finals: Day 3
- النهائي | Finals: Day 4`,
      eventType: EventType.SPORTS,
      eventDate: daysFromNow(60),
      startTime: "08:00",
      endTime: "18:00",
      location: "ملعب كرة القدم الرئيسي | Main Football Field",
      organizer: "اللجنة الرياضية | Sports Committee",
      targetAudience: "الطلاب، أولياء الأمور، العامة | Students, Parents, Public",
      maxAttendees: 500,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "بطولة كرة السلة للبنات | Girls Basketball Tournament",
      description: `بطولة كرة السلة للطالبات. تشجيع الرياضة النسائية.

Girls basketball tournament. Promoting female sports.

المراحل | Stages:
- المتوسط | Intermediate (Grades 7-9)
- الثانوي | Secondary (Grades 10-12)`,
      eventType: EventType.SPORTS,
      eventDate: daysFromNow(75),
      startTime: "14:00",
      endTime: "17:00",
      location: "صالة كرة السلة | Basketball Court",
      organizer: "قسم التربية الرياضية | PE Department",
      targetAudience: "الطالبات | Female Students",
      maxAttendees: 150,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "بطولة السباحة | Swimming Championship",
      description: `بطولة السباحة السنوية للمدرسة.

Annual school swimming championship.

الفئات | Categories:
- سباحة حرة 50م | 50m Freestyle
- سباحة حرة 100م | 100m Freestyle
- سباحة الصدر | Breaststroke
- سباق التتابع | Relay Race`,
      eventType: EventType.SPORTS,
      eventDate: daysFromNow(90),
      startTime: "08:00",
      endTime: "13:00",
      location: "حمام السباحة | Swimming Pool",
      organizer: "قسم التربية الرياضية | PE Department",
      targetAudience: "الطلاب المسجلون في السباحة | Swimming Class Students",
      maxAttendees: 80,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "يوم اللياقة البدنية | Fitness Day",
      description: `يوم مخصص لتعزيز اللياقة البدنية والصحة.

A day dedicated to promoting fitness and health.

الأنشطة | Activities:
- تمارين الصباح | Morning Exercises
- ورشة التغذية الصحية | Healthy Nutrition Workshop
- اختبارات اللياقة | Fitness Tests
- مسابقات القوة | Strength Competitions`,
      eventType: EventType.SPORTS,
      eventDate: daysFromNow(28),
      startTime: "07:00",
      endTime: "12:00",
      location: "الملعب | Sports Ground",
      organizer: "قسم التربية الرياضية | PE Department",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: 500,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // CULTURAL EVENTS
    // ============================================================
    {
      title: "يوم استقلال السودان | Sudan Independence Day",
      description: `الاحتفال بيوم استقلال السودان مع عروض ثقافية وموسيقى تقليدية.

Commemorating Sudan's Independence Day with cultural performances and traditional music.

البرنامج | Program:
- النشيد الوطني | National Anthem
- عروض تاريخية | Historical Presentations
- رقصات سودانية تقليدية | Traditional Sudanese Dances
- إلقاء الشعر | Poetry Recitations
- عروض موسيقية تقليدية | Traditional Music Performances`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(60),
      startTime: "09:00",
      endTime: "13:00",
      location: "قاعة التجمعات | Main Assembly Hall",
      organizer: "اللجنة الثقافية | Cultural Committee",
      targetAudience: "مجتمع المدرسة | All School Community",
      maxAttendees: 500,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "يوم التعدد الثقافي | Multicultural Day",
      description: `الاحتفال بتنوع مجتمعنا المدرسي! الطلاب والعائلات يشاركون ثقافاتهم وتقاليدهم ومأكولاتهم.

Celebrating the diversity of our school community! Students and families share their cultures, traditions, and cuisines.

الأنشطة | Activities:
- معارض ثقافية | Cultural Exhibitions
- معرض الطعام التقليدي | Traditional Food Fair
- عروض موسيقية وراقصة | Music & Dance Performances
- معرض الفنون والحرف | Art & Craft Displays`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(35),
      startTime: "10:00",
      endTime: "15:00",
      location: "ساحة المدرسة | School Courtyard",
      organizer: "جمعية الآباء والمعلمين | PTA",
      targetAudience: "مجتمع المدرسة | School Community",
      maxAttendees: 400,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "اليوم العالمي للغة العربية | World Arabic Language Day",
      description: `الاحتفال باليوم العالمي للغة العربية (18 ديسمبر). فعاليات تحتفي بلغة الضاد.

Celebrating World Arabic Language Day (December 18).

الفعاليات | Activities:
- مسابقة الخطابة | Public Speaking Competition
- ورشة الخط العربي | Calligraphy Workshop
- مسابقة الشعر | Poetry Competition
- عرض مسرحي | Theater Performance`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(70),
      startTime: "09:00",
      endTime: "14:00",
      location: "القاعة الرئيسية والفصول | Main Hall & Classrooms",
      organizer: "قسم اللغات | Languages Department",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: 500,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "ورشة الخط العربي | Arabic Calligraphy Workshop",
      description: `تعلم فن الخط العربي من خطاط محترف. احتفاء بتراثنا العربي.

Learn Arabic calligraphy from a master calligrapher.

المحتوى | Content:
- أساسيات خط النسخ | Naskh script basics
- الأدوات والتقنيات التقليدية | Traditional tools and techniques
- إنشاء قطعة خطية خاصة | Creating your own calligraphy piece`,
      eventType: EventType.WORKSHOP,
      eventDate: daysFromNow(7),
      startTime: "14:00",
      endTime: "16:00",
      location: "غرفة الفنون | Art Room",
      organizer: "قسم اللغات | Languages Department",
      targetAudience: "الصفوف 7-12 | Grades 7-12",
      maxAttendees: 30,
      currentAttendees: 18,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "عرض مسرحي طلابي | Student Drama Performance",
      description: `عرض مسرحي سنوي من إعداد وتقديم الطلاب.

Annual drama performance prepared and presented by students.

العرض | Performance:
- مسرحية باللغة العربية | Arabic Play
- مسرحية باللغة الإنجليزية | English Play
- عرض موسيقي | Musical Performance`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(55),
      startTime: "17:00",
      endTime: "20:00",
      location: "القاعة الرئيسية | Main Hall",
      organizer: "نادي المسرح | Drama Club",
      targetAudience: "مجتمع المدرسة | School Community",
      maxAttendees: 300,
      isPublic: true,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "معرض الفنون الطلابي | Student Art Exhibition",
      description: `معرض سنوي لأعمال الطلاب الفنية.

Annual exhibition of student artwork.

الأقسام | Sections:
- الرسم والتلوين | Painting & Drawing
- النحت | Sculpture
- التصوير الفوتوغرافي | Photography
- الفن الرقمي | Digital Art`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(80),
      startTime: "10:00",
      endTime: "16:00",
      location: "معرض الفنون | Art Gallery",
      organizer: "قسم الفنون | Art Department",
      targetAudience: "مجتمع المدرسة | School Community",
      maxAttendees: 200,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // ISLAMIC CELEBRATIONS
    // ============================================================
    {
      title: "عيد الفطر المبارك | Eid al-Fitr Celebration",
      description: `احتفال المدرسة بعيد الفطر المبارك. نتمنى لجميع طلابنا وعائلاتهم عيداً سعيداً ومباركاً.

School celebration to mark Eid al-Fitr.

البرنامج | Program:
- صلاة العيد | Eid Prayer: 7:00 AM
- احتفال مدرسي | School Celebration: 9:00 AM
- توزيع الحلويات | Sweet Distribution: 10:00 AM

"كل عام وأنتم بخير - تقبل الله منا ومنكم"`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(90),
      startTime: "08:00",
      endTime: "12:00",
      location: "ساحة المدرسة | School Grounds",
      organizer: "قسم الدراسات الإسلامية | Religious Studies Dept",
      targetAudience: "مجتمع المدرسة | All School Community",
      maxAttendees: 1000,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "عيد الأضحى المبارك | Eid al-Adha Celebration",
      description: `احتفال المدرسة بعيد الأضحى المبارك. نتذكر تضحية سيدنا إبراهيم عليه السلام.

Commemorating Eid al-Adha with our school community.

البرنامج | Program:
- صلاة العيد | Eid Prayer: 7:00 AM
- درس ديني | Religious Lesson: 9:00 AM
- احتفال واستقبال | Celebration & Reception: 10:00 AM

"عيد مبارك - تقبل الله منا ومنكم صالح الأعمال"`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(180),
      startTime: "08:00",
      endTime: "12:00",
      location: "ساحة المدرسة | School Grounds",
      organizer: "قسم الدراسات الإسلامية | Religious Studies Dept",
      targetAudience: "مجتمع المدرسة | All School Community",
      maxAttendees: 1000,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "المولد النبوي الشريف | Prophet's Birthday (Mawlid)",
      description: `احتفال بذكرى المولد النبوي الشريف. فعاليات تذكرنا بسيرة النبي محمد ﷺ.

Celebrating the birthday of Prophet Muhammad (PBUH).

البرنامج | Program:
- تلاوة القرآن الكريم | Quran Recitation: 8:00 AM
- المديح النبوي | Prophetic Praise: 9:00 AM
- محاضرة في السيرة | Seerah Lecture: 10:00 AM
- إنشاد ديني | Religious Songs: 11:00 AM

"اللهم صل وسلم على سيدنا محمد"`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(150),
      startTime: "08:00",
      endTime: "13:00",
      location: "القاعة الرئيسية | Main Assembly Hall",
      organizer: "قسم الدراسات الإسلامية | Religious Studies Dept",
      targetAudience: "مجتمع المدرسة | All School Community",
      maxAttendees: 500,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "رأس السنة الهجرية | Islamic New Year",
      description: `الاحتفال ببداية السنة الهجرية الجديدة. فرصة للتأمل والتخطيط للعام الجديد.

Celebrating the beginning of the new Hijri year.

البرنامج | Program:
- إذاعة صباحية خاصة | Special Morning Assembly
- درس عن الهجرة النبوية | Lesson on Prophet's Migration
- مسابقات ثقافية | Cultural Competitions`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(200),
      startTime: "08:00",
      endTime: "11:00",
      location: "القاعة الرئيسية | Main Assembly Hall",
      organizer: "قسم الدراسات الإسلامية | Religious Studies Dept",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: 500,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "إفطار رمضان الجماعي | Ramadan Iftar Gathering",
      description: `إفطار جماعي للطلاب والمعلمين خلال شهر رمضان المبارك.

Communal Iftar for students and staff during Ramadan.

البرنامج | Program:
- صلاة المغرب | Maghrib Prayer
- الإفطار | Iftar Meal
- صلاة التراويح | Taraweeh Prayer`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(85),
      startTime: "17:30",
      endTime: "21:00",
      location: "ساحة المدرسة | School Courtyard",
      organizer: "قسم الدراسات الإسلامية | Religious Studies Dept",
      targetAudience: "مجتمع المدرسة | School Community",
      maxAttendees: 400,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // PARENT MEETINGS & WORKSHOPS
    // ============================================================
    {
      title: "اجتماع أولياء الأمور | Parent-Teacher Conference",
      description: `اجتماع أولياء الأمور الفصلي. مشاركتكم في تعليم أبنائكم أمر محوري.

Quarterly parent-teacher conference.

الجدول | Schedule:
- الروضة والابتدائي | KG & Primary: 4:00 PM - 5:30 PM
- المتوسط | Intermediate: 5:30 PM - 6:30 PM
- الثانوي | Secondary: 6:30 PM - 7:30 PM`,
      eventType: EventType.PARENT_MEETING,
      eventDate: daysFromNow(10),
      startTime: "16:00",
      endTime: "19:30",
      location: "الفصول المعنية | Respective Classrooms",
      organizer: "إدارة المدرسة | School Administration",
      targetAudience: "أولياء الأمور، المعلمون | Parents, Teachers",
      maxAttendees: null,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "توجيه أولياء أمور الصف 12 | Grade 12 Parent Orientation",
      description: `اجتماع هام لأولياء أمور طلاب الصف 12 بخصوص امتحانات الشهادة السودانية.

Important meeting for parents of Grade 12 students regarding Sudan Certificate examinations.

المواضيع | Topics:
- جدول الامتحانات ومتطلباتها | Examination Schedule & Requirements
- عملية التقديم للجامعات | University Application Process
- خدمات الإرشاد المهني | Career Counseling Services
- موارد الدعم | Support Resources`,
      eventType: EventType.PARENT_MEETING,
      eventDate: daysFromNow(5),
      startTime: "17:00",
      endTime: "19:00",
      location: "القاعة الرئيسية | Main Hall",
      organizer: "المرشد الأكاديمي | Senior Academic Counselor",
      targetAudience: "أولياء أمور الصف 12 | Grade 12 Parents",
      maxAttendees: 100,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "ورشة التربية الإيجابية | Positive Parenting Workshop",
      description: `ورشة عمل لأولياء الأمور حول أساليب التربية الإيجابية.

Workshop for parents on positive parenting techniques.

المواضيع | Topics:
- التواصل الفعال مع الأبناء | Effective Communication with Children
- إدارة السلوك | Behavior Management
- دعم التعلم في المنزل | Supporting Learning at Home
- التعامل مع ضغوط المراهقة | Handling Teenage Stress`,
      eventType: EventType.WORKSHOP,
      eventDate: daysFromNow(20),
      startTime: "17:00",
      endTime: "19:00",
      location: "غرفة التدريب | Training Room",
      organizer: "قسم الإرشاد | Counseling Department",
      targetAudience: "أولياء الأمور | Parents",
      maxAttendees: 50,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "اجتماع الآباء - الروضة | KG Parents Meeting",
      description: `اجتماع خاص بأولياء أمور طلاب الروضة.

Special meeting for KG parents.

المواضيع | Topics:
- تقدم الطفل في الفصل الأول | Child's progress in Term 1
- الأنشطة القادمة | Upcoming activities
- كيفية دعم تعلم طفلك | How to support your child's learning`,
      eventType: EventType.PARENT_MEETING,
      eventDate: daysFromNow(12),
      startTime: "09:00",
      endTime: "10:30",
      location: "فصول الروضة | KG Classrooms",
      organizer: "قسم الروضة | KG Section",
      targetAudience: "أولياء أمور الروضة | KG Parents",
      maxAttendees: 50,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "ورشة الأمان الرقمي للآباء | Digital Safety Workshop for Parents",
      description: `ورشة لتوعية أولياء الأمور بأمان الأطفال على الإنترنت.

Workshop to educate parents about children's online safety.

المواضيع | Topics:
- مخاطر الإنترنت | Internet Risks
- الرقابة الأبوية | Parental Controls
- التواصل مع الأبناء حول الإنترنت | Talking to Children about Internet`,
      eventType: EventType.WORKSHOP,
      eventDate: daysFromNow(25),
      startTime: "17:00",
      endTime: "19:00",
      location: "معمل الحاسوب | Computer Lab",
      organizer: "قسم تقنية المعلومات | IT Department",
      targetAudience: "أولياء الأمور | Parents",
      maxAttendees: 30,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // STAFF DEVELOPMENT
    // ============================================================
    {
      title: "ورشة تدريب المعلمين | Teacher Training Workshop",
      description: `ورشة تطوير مهني للمعلمين حول أساليب التدريس الحديثة وتقنيات التعليم.

Professional development workshop for teachers on modern pedagogical approaches and educational technology.`,
      eventType: EventType.WORKSHOP,
      eventDate: daysAgo(15),
      startTime: "09:00",
      endTime: "15:00",
      location: "غرفة التدريب | Training Room",
      organizer: "الشؤون الأكاديمية | Academic Affairs",
      targetAudience: "هيئة التدريس | Teaching Staff",
      maxAttendees: 50,
      currentAttendees: 45,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.COMPLETED,
    },
    {
      title: "تدريب التعليم المدمج | Blended Learning Training",
      description: `تدريب المعلمين على استخدام أدوات التعليم المدمج.

Training teachers on blended learning tools.

المحتوى | Content:
- منصات التعلم الإلكتروني | E-learning Platforms
- إنشاء المحتوى الرقمي | Digital Content Creation
- تقييم الطلاب عبر الإنترنت | Online Student Assessment`,
      eventType: EventType.WORKSHOP,
      eventDate: daysFromNow(18),
      startTime: "09:00",
      endTime: "14:00",
      location: "معمل الحاسوب | Computer Lab",
      organizer: "قسم تقنية المعلومات | IT Department",
      targetAudience: "المعلمون | Teachers",
      maxAttendees: 25,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "اجتماع هيئة التدريس | Staff Meeting",
      description: `اجتماع شهري لهيئة التدريس لمناقشة التحديثات والتخطيط.

Monthly staff meeting to discuss updates and planning.

جدول الأعمال | Agenda:
- تحديثات الإدارة | Administrative Updates
- التحصيل الأكاديمي | Academic Performance Review
- الفعاليات القادمة | Upcoming Events
- مناقشة مفتوحة | Open Discussion`,
      eventType: EventType.PARENT_MEETING,
      eventDate: daysFromNow(3),
      startTime: "14:30",
      endTime: "16:00",
      location: "غرفة الاجتماعات | Meeting Room",
      organizer: "إدارة المدرسة | School Administration",
      targetAudience: "جميع الموظفين | All Staff",
      maxAttendees: 80,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "تدريب الإسعافات الأولية | First Aid Training",
      description: `تدريب على الإسعافات الأولية للمعلمين والموظفين.

First aid training for teachers and staff.

المحتوى | Content:
- الإسعافات الأولية الأساسية | Basic First Aid
- الإنعاش القلبي الرئوي | CPR
- التعامل مع الحالات الطارئة | Emergency Response`,
      eventType: EventType.WORKSHOP,
      eventDate: daysFromNow(32),
      startTime: "09:00",
      endTime: "13:00",
      location: "قاعة التدريب | Training Hall",
      organizer: "قسم الصحة | Health Department",
      targetAudience: "المعلمون والموظفون | Teachers & Staff",
      maxAttendees: 40,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // CELEBRATIONS & SPECIAL DAYS
    // ============================================================
    {
      title: "يوم المعلم | Teachers' Day Celebration",
      description: `الاحتفال بيوم المعلم وتقدير جهود معلمينا الأفاضل.

Celebrating Teachers' Day and honoring our dedicated educators.

"من علمني حرفاً صرت له عبداً"

البرنامج | Program:
- كلمات الشكر والتقدير | Words of Appreciation
- تكريم المعلمين المتميزين | Honoring Outstanding Teachers
- عروض طلابية | Student Performances
- حفل شاي | Tea Reception`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(25),
      startTime: "10:00",
      endTime: "13:00",
      location: "القاعة الرئيسية | Main Hall",
      organizer: "مجلس الطلاب | Student Council",
      targetAudience: "الطلاب، المعلمون | Students, Teachers",
      maxAttendees: 500,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "يوم الأم | Mother's Day Celebration",
      description: `الاحتفال بيوم الأم العربي (21 مارس). تقدير لأمهاتنا الفاضلات.

Celebrating Arab Mother's Day (March 21).

"الجنة تحت أقدام الأمهات"

البرنامج | Program:
- كلمات التقدير | Words of Appreciation
- عروض فنية | Artistic Performances
- معرض أعمال يدوية | Handicraft Exhibition
- توزيع الهدايا | Gift Distribution`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(100),
      startTime: "10:00",
      endTime: "12:00",
      location: "القاعة الرئيسية | Main Hall",
      organizer: "لجنة الأنشطة الطلابية | Student Activities Committee",
      targetAudience: "الطلاب، الأمهات | Students, Mothers",
      maxAttendees: 400,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "يوم الطفل العالمي | International Children's Day",
      description: `الاحتفال بيوم الطفل العالمي. يوم ترفيهي للأطفال في المرحلة الابتدائية.

Celebrating International Children's Day.

الفعاليات | Activities:
- ألعاب ومسابقات | Games & Competitions
- عروض مسرحية | Theater Shows
- رسم وتلوين | Drawing & Painting
- حفل توزيع جوائز | Prize Distribution`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(55),
      startTime: "08:00",
      endTime: "13:00",
      location: "ساحة المدرسة | School Grounds",
      organizer: "قسم المرحلة الابتدائية | Primary Section",
      targetAudience: "طلاب الروضة والابتدائي | KG & Primary Students",
      maxAttendees: 400,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "يوم المؤسسين | Founders Day",
      description: `الاحتفال بإرث المدرسة وتأسيسها. يوم للتذكر والاحتفاء بتاريخ المدرسة العريق.

Celebrating the legacy and founding of our school.

البرنامج | Program:
- خدمة شكر | Thanksgiving Service
- معرض تاريخي | Historical Exhibition
- شهادات الخريجين | Alumni Testimonials
- عروض ثقافية | Cultural Performances

"إلى الأمام دائماً!"`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(50),
      startTime: "09:00",
      endTime: "14:00",
      location: "القاعة الرئيسية | Main Assembly Hall",
      organizer: "إدارة المدرسة | School Administration",
      targetAudience: "الطلاب، أولياء الأمور، الخريجون | Students, Parents, Alumni",
      maxAttendees: 500,
      isPublic: true,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "حفل التخرج السنوي | Annual Graduation Ceremony",
      description: `حفل التخرج السنوي لطلاب الصف 12. احتفال بالإنجاز الأكاديمي وبداية رحلات جديدة.

Annual graduation ceremony for Grade 12 students.

البرنامج | Program:
- الموكب الأكاديمي | Academic Procession
- الكلمات والجوائز | Speeches & Awards
- تسليم الشهادات | Diploma Presentation
- حفل استقبال | Reception`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(120),
      startTime: "17:00",
      endTime: "20:00",
      location: "القاعة الرئيسية | Main Hall",
      organizer: "إدارة المدرسة | School Administration",
      targetAudience: "طلاب الصف 12، أولياء الأمور، الموظفون | Grade 12, Parents, Staff",
      maxAttendees: 300,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // HEALTH & SAFETY
    // ============================================================
    {
      title: "يوم الصحة المدرسية | School Health Day",
      description: `يوم مخصص للتوعية الصحية والفحوصات الطبية.

A day dedicated to health awareness and medical check-ups.

الأنشطة | Activities:
- فحص النظر | Vision Screening
- فحص الأسنان | Dental Check-up
- قياس الطول والوزن | Height & Weight Measurement
- ورشة التغذية الصحية | Healthy Nutrition Workshop`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(42),
      startTime: "08:00",
      endTime: "14:00",
      location: "عيادة المدرسة | School Clinic",
      organizer: "قسم الصحة المدرسية | School Health Dept",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: null,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "تدريب الإخلاء في حالات الطوارئ | Emergency Evacuation Drill",
      description: `تدريب على إجراءات الإخلاء في حالات الطوارئ.

Training on emergency evacuation procedures.

الأهداف | Objectives:
- معرفة مخارج الطوارئ | Know emergency exits
- التعامل مع إنذار الحريق | Respond to fire alarm
- التجمع في نقاط الأمان | Gather at safety points`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(15),
      startTime: "10:00",
      endTime: "11:00",
      location: "جميع المباني | All Buildings",
      organizer: "فريق السلامة | Safety Team",
      targetAudience: "جميع الطلاب والموظفين | All Students & Staff",
      maxAttendees: null,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "حملة التطعيم السنوية | Annual Vaccination Campaign",
      description: `حملة التطعيم السنوية بالتعاون مع وزارة الصحة.

Annual vaccination campaign in cooperation with Ministry of Health.

التطعيمات | Vaccinations:
- التطعيمات الروتينية | Routine Vaccinations
- تطعيم الأنفلونزا الموسمية | Seasonal Flu Vaccine`,
      eventType: EventType.CELEBRATION,
      eventDate: daysFromNow(65),
      startTime: "08:00",
      endTime: "14:00",
      location: "عيادة المدرسة | School Clinic",
      organizer: "قسم الصحة المدرسية | School Health Dept",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: null,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // COMMUNITY SERVICE
    // ============================================================
    {
      title: "حملة جمع الملابس | Clothing Drive",
      description: `حملة لجمع الملابس للمحتاجين. ساهموا في مساعدة المجتمع.

Clothing collection campaign for those in need.

المطلوب | What to Bring:
- ملابس نظيفة بحالة جيدة | Clean clothes in good condition
- أحذية | Shoes
- ملابس شتوية | Winter clothes`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(38),
      startTime: "07:30",
      endTime: "14:00",
      location: "بهو المدرسة | School Lobby",
      organizer: "نادي الخدمة المجتمعية | Community Service Club",
      targetAudience: "مجتمع المدرسة | School Community",
      maxAttendees: null,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "يوم التنظيف البيئي | Environmental Clean-up Day",
      description: `يوم تطوعي لتنظيف البيئة المحيطة بالمدرسة.

Volunteer day to clean the school surroundings.

الأنشطة | Activities:
- تنظيف الشوارع المحيطة | Cleaning surrounding streets
- زراعة الأشجار | Tree planting
- توعية بيئية | Environmental awareness`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(48),
      startTime: "08:00",
      endTime: "12:00",
      location: "محيط المدرسة | School Surroundings",
      organizer: "نادي البيئة | Environment Club",
      targetAudience: "الطلاب المتطوعون | Volunteer Students",
      maxAttendees: 100,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "زيارة دار الأيتام | Orphanage Visit",
      description: `زيارة تطوعية لدار الأيتام لتقديم الهدايا والترفيه عن الأطفال.

Volunteer visit to the orphanage to provide gifts and entertainment.

الأنشطة | Activities:
- تقديم الهدايا | Gift giving
- ألعاب وأنشطة | Games and activities
- وجبة مشتركة | Shared meal`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(72),
      startTime: "09:00",
      endTime: "13:00",
      location: "دار الأيتام | Local Orphanage",
      organizer: "نادي الخدمة المجتمعية | Community Service Club",
      targetAudience: "الطلاب المتطوعون | Volunteer Students",
      maxAttendees: 30,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // GRADE-SPECIFIC EVENTS
    // ============================================================
    {
      title: "يوم ترحيب الروضة | KG Welcome Day",
      description: `يوم ترحيب خاص بطلاب الروضة الجدد وأولياء أمورهم.

Special welcome day for new KG students and their parents.

البرنامج | Program:
- جولة في المدرسة | School Tour
- التعرف على المعلمات | Meet the Teachers
- أنشطة ترفيهية | Fun Activities`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(8),
      startTime: "09:00",
      endTime: "11:00",
      location: "قسم الروضة | KG Section",
      organizer: "قسم الروضة | KG Section",
      targetAudience: "طلاب الروضة الجدد وأولياء أمورهم | New KG Students & Parents",
      maxAttendees: 60,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "رحلة علمية - الصفوف 7-9 | Science Field Trip - Grades 7-9",
      description: `رحلة علمية إلى متحف السودان الوطني ومركز العلوم.

Science field trip to Sudan National Museum and Science Center.

البرنامج | Program:
- زيارة المتحف | Museum Visit
- ورشة علمية | Science Workshop
- جولة تعليمية | Educational Tour`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(22),
      startTime: "08:00",
      endTime: "14:00",
      location: "متحف السودان الوطني | Sudan National Museum",
      organizer: "قسم العلوم | Science Department",
      targetAudience: "الصفوف 7-9 | Grades 7-9",
      maxAttendees: 80,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },
    {
      title: "يوم التوجيه المهني - الصف 11 | Career Day - Grade 11",
      description: `يوم للتعريف بالمهن المختلفة والتخطيط للمستقبل.

Career exploration and future planning day.

المتحدثون | Speakers:
- أطباء | Doctors
- مهندسون | Engineers
- رجال أعمال | Business Professionals
- معلمون | Educators`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(58),
      startTime: "09:00",
      endTime: "14:00",
      location: "القاعة الرئيسية | Main Hall",
      organizer: "قسم الإرشاد | Counseling Department",
      targetAudience: "طلاب الصف 11 | Grade 11 Students",
      maxAttendees: 100,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "رحلة الصف السادس | Grade 6 Field Trip",
      description: `رحلة ترفيهية وتعليمية لطلاب الصف السادس.

Educational and recreational trip for Grade 6 students.

الوجهة | Destination:
- حديقة الحيوان | Zoo
- متنزه ترفيهي | Amusement Park`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(30),
      startTime: "08:00",
      endTime: "15:00",
      location: "حديقة حيوان الخرطوم | Khartoum Zoo",
      organizer: "معلمو الصف السادس | Grade 6 Teachers",
      targetAudience: "طلاب الصف السادس | Grade 6 Students",
      maxAttendees: 60,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // MONTHLY RECURRING EVENTS
    // ============================================================
    {
      title: "الطابور الصباحي الأسبوعي | Weekly Morning Assembly",
      description: `الطابور الصباحي الأسبوعي لجميع الطلاب.

Weekly morning assembly for all students.

البرنامج | Program:
- تلاوة القرآن الكريم | Quran Recitation
- النشيد الوطني | National Anthem
- إعلانات المدرسة | School Announcements
- عرض طلابي | Student Presentation`,
      eventType: EventType.ACADEMIC,
      eventDate: daysFromNow(1),
      startTime: "07:30",
      endTime: "08:00",
      location: "ساحة المدرسة | School Courtyard",
      organizer: "إدارة المدرسة | School Administration",
      targetAudience: "جميع الطلاب | All Students",
      maxAttendees: 500,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.PLANNED,
    },
    {
      title: "نادي القراءة الشهري | Monthly Book Club",
      description: `اجتماع شهري لنادي القراءة لمناقشة كتاب الشهر.

Monthly book club meeting to discuss the book of the month.

كتاب هذا الشهر | This Month's Book:
- "رحلة ابن بطوطة" | "The Travels of Ibn Battuta"`,
      eventType: EventType.CULTURAL,
      eventDate: daysFromNow(16),
      startTime: "14:00",
      endTime: "15:30",
      location: "المكتبة | Library",
      organizer: "نادي القراءة | Book Club",
      targetAudience: "أعضاء نادي القراءة | Book Club Members",
      maxAttendees: 25,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.PLANNED,
    },

    // ============================================================
    // COMPLETED & OTHER STATUS EVENTS
    // ============================================================
    {
      title: "حفل افتتاح العام الدراسي | Welcome Assembly 2025-2026",
      description: `حفل الترحيب بالعام الدراسي الجديد. اجتمع جميع الطلاب والموظفين للانطلاق في عام جديد من التميز.

Welcome assembly for the new academic year. All students and staff gathered to kick off another year of excellence.`,
      eventType: EventType.ACADEMIC,
      eventDate: daysAgo(30),
      startTime: "08:00",
      endTime: "09:30",
      location: "القاعة الرئيسية | Main Assembly Hall",
      organizer: "إدارة المدرسة | School Administration",
      targetAudience: "جميع الطلاب والموظفين | All Students, Staff",
      maxAttendees: 500,
      currentAttendees: 480,
      isPublic: false,
      registrationRequired: false,
      status: EventStatus.COMPLETED,
    },
    {
      title: "رحلة متحف السودان الوطني | Field Trip to National Museum",
      description: `تم تأجيل الرحلة التعليمية إلى متحف السودان الوطني بسبب ظروف غير متوقعة. سيتم الإعلان عن موعد جديد قريباً.

Educational field trip to the Sudan National Museum has been postponed. New date will be announced soon.`,
      eventType: EventType.ACADEMIC,
      eventDate: daysAgo(5),
      startTime: "08:00",
      endTime: "14:00",
      location: "متحف السودان الوطني | Sudan National Museum",
      organizer: "قسم التاريخ | History Department",
      targetAudience: "الصفوف 7-9 | Grades 7-9",
      maxAttendees: 60,
      currentAttendees: 0,
      isPublic: false,
      registrationRequired: true,
      status: EventStatus.POSTPONED,
      notes: "تم إعادة الجدولة للشهر القادم بسبب مشاكل النقل | Rescheduled to next month due to transportation issues.",
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const event of events) {
    // Check if event already exists (by title + schoolId)
    const existing = await prisma.event.findFirst({
      where: { schoolId, title: event.title },
    });

    if (!existing) {
      await prisma.event.create({
        data: { schoolId, ...event },
      });
      createdCount++;
    } else {
      skippedCount++;
    }
  }

  // Count by type
  const typeCount = events.reduce((acc, e) => {
    acc[e.eventType] = (acc[e.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`   ✅ Events: ${createdCount} new, ${skippedCount} already existed`);
  console.log(`      - Total events: ${events.length}`);
  console.log(`      - Academic: ${typeCount.ACADEMIC || 0}`);
  console.log(`      - Sports: ${typeCount.SPORTS || 0}`);
  console.log(`      - Cultural: ${typeCount.CULTURAL || 0}`);
  console.log(`      - Celebrations: ${typeCount.CELEBRATION || 0}`);
  console.log(`      - Workshops: ${typeCount.WORKSHOP || 0}`);
  console.log(`      - Parent Meetings: ${typeCount.PARENT_MEETING || 0}\n`);
}
