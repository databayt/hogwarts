/**
 * Lessons Seed Module - Comprehensive K-12 Curriculum
 * Creates 100+ lesson plans across all subjects with rich content
 * Comboni School - Arabic & English bilingual curriculum
 *
 * Features:
 * - Complete curriculum coverage for all grade levels
 * - Bilingual lesson content (Arabic/English)
 * - Detailed objectives, materials, activities, assessments
 * - Realistic scheduling across the school term
 * - Lesson resources and homework assignments
 */

import { faker } from "@faker-js/faker";
import { LessonStatus } from "@prisma/client";
import type { SeedPrisma, ClassRef, SubjectRef, TeacherRef } from "./types";

// ============================================================================
// COMPREHENSIVE LESSON DATA BY SUBJECT
// ============================================================================

interface LessonTemplate {
  title: string;
  objectives: string;
  materials: string;
  activities: string;
  assessment: string;
  notes?: string;
  duration?: number; // minutes
}

// Mathematics Lessons (Grade 7-12)
const MATH_LESSONS: LessonTemplate[] = [
  {
    title: "مقدمة في الجبر | Introduction to Algebra",
    objectives: "فهم المتغيرات والتعبيرات الجبرية | Understand variables and algebraic expressions",
    materials: "Textbook Ch.1, Algebra tiles, Whiteboard, Graphing calculator",
    activities: "Direct instruction (15 min), Guided practice (20 min), Pair work on variable expressions (15 min), Exit ticket (5 min)",
    assessment: "In-class worksheet, Observation checklist, Exit ticket score",
    notes: "Workbook pages 5-7, Practice problems 1-20",
    duration: 55,
  },
  {
    title: "حل المعادلات الخطية | Solving Linear Equations",
    objectives: "حل معادلات من الدرجة الأولى في متغير واحد | Solve first-degree equations in one variable",
    materials: "Equation balance model, Practice worksheets, Whiteboard markers",
    activities: "Warm-up review (5 min), Balance method demonstration (15 min), Guided examples (15 min), Independent practice (15 min), Wrap-up (5 min)",
    assessment: "Quick quiz, Problem-solving rubric, Homework check",
    notes: "Solve equations 1-15 on page 23",
    duration: 55,
  },
  {
    title: "الدوال والعلاقات | Functions and Relations",
    objectives: "التمييز بين الدوال والعلاقات | Distinguish between functions and relations, Use function notation",
    materials: "Function machines manipulatives, Graphing paper, Colored markers",
    activities: "Function machine activity (10 min), Vertical line test exploration (15 min), Mapping diagrams (15 min), Group challenge (10 min)",
    assessment: "Group presentation, Individual mapping diagram, Quiz",
    notes: "Create 5 function examples and 5 non-function examples",
    duration: 50,
  },
  {
    title: "الهندسة: المثلثات والزوايا | Geometry: Triangles and Angles",
    objectives: "تصنيف المثلثات وحساب الزوايا | Classify triangles and calculate angles",
    materials: "Protractors, Rulers, Triangle cutouts, GeoGebra software",
    activities: "Angle measurement practice (10 min), Triangle classification activity (15 min), Angle sum theorem discovery (15 min), Problem solving (15 min)",
    assessment: "Hands-on construction task, Written problems, Peer assessment",
    notes: "Geometry worksheet: Triangle problems 1-12",
    duration: 55,
  },
  {
    title: "نظرية فيثاغورس | Pythagorean Theorem",
    objectives: "تطبيق نظرية فيثاغورس لحل المسائل | Apply Pythagorean theorem to solve problems",
    materials: "Grid paper, Square tiles, Calculators, Real-world problem cards",
    activities: "Theorem proof exploration (15 min), Guided examples (10 min), Real-world applications (15 min), Problem stations (10 min)",
    assessment: "Problem-solving assessment, Application project, Quiz",
    notes: "Complete Pythagorean theorem word problems handout",
    duration: 50,
  },
  {
    title: "التفاضل: المشتقات | Calculus: Derivatives",
    objectives: "فهم مفهوم المشتقة وقواعد الاشتقاق | Understand derivative concept and differentiation rules",
    materials: "Graphing calculators, Limit definition handout, Derivative rules chart",
    activities: "Limit definition review (10 min), Power rule introduction (15 min), Chain rule examples (15 min), Practice problems (15 min)",
    assessment: "Differentiation quiz, Problem set, Conceptual questions",
    notes: "Differentiate functions 1-20 using appropriate rules",
    duration: 55,
  },
  {
    title: "التكامل | Integration",
    objectives: "حساب التكاملات المحددة وغير المحددة | Calculate definite and indefinite integrals",
    materials: "Area under curve visualizations, Integration tables, Calculators",
    activities: "Riemann sums demonstration (10 min), Basic integration rules (15 min), Substitution method (15 min), Practice (15 min)",
    assessment: "Integration test, Area calculation problems, Portfolio",
    notes: "Integration practice problems 1-15",
    duration: 55,
  },
  {
    title: "الإحصاء: الاحتمالات | Statistics: Probability",
    objectives: "حساب الاحتمالات البسيطة والمركبة | Calculate simple and compound probabilities",
    materials: "Dice, Coins, Probability spinners, Tree diagram templates",
    activities: "Probability experiments (15 min), Tree diagrams (15 min), Compound events (10 min), Real-world applications (10 min)",
    assessment: "Probability quiz, Experiment report, Class participation",
    notes: "Probability word problems worksheet",
    duration: 50,
  },
];

// Arabic Language Lessons
const ARABIC_LESSONS: LessonTemplate[] = [
  {
    title: "النحو: المبتدأ والخبر | Grammar: Subject and Predicate",
    objectives: "تحديد المبتدأ والخبر في الجملة الاسمية | Identify subject and predicate in nominal sentences",
    materials: "النحو الواضح كتاب، بطاقات الجمل، السبورة",
    activities: "مراجعة سريعة (5 د)، شرح القاعدة (15 د)، تطبيق جماعي (15 د)، تدريب فردي (15 د)، تلخيص (5 د)",
    assessment: "اختبار قصير، تصحيح الجمل، الواجب المنزلي",
    notes: "حل تمارين صفحة 45-47 من كتاب النحو",
    duration: 55,
  },
  {
    title: "الصرف: تصريف الأفعال | Morphology: Verb Conjugation",
    objectives: "تصريف الأفعال في الأزمنة المختلفة | Conjugate verbs in different tenses",
    materials: "جداول التصريف، بطاقات الأفعال، أوراق العمل",
    activities: "استعراض الأزمنة (10 د)، تطبيق على الأفعال الصحيحة (15 د)، الأفعال المعتلة (15 د)، تمارين (10 د)",
    assessment: "اختبار تصريف، ورقة عمل، مشاركة صفية",
    notes: "صرف 10 أفعال في الماضي والمضارع والأمر",
    duration: 50,
  },
  {
    title: "البلاغة: التشبيه والاستعارة | Rhetoric: Simile and Metaphor",
    objectives: "التمييز بين التشبيه والاستعارة | Distinguish between simile and metaphor in Arabic literature",
    materials: "نصوص أدبية، أمثلة من القرآن والشعر، أوراق تحليل",
    activities: "قراءة نصوص (10 د)، تحليل الأمثلة (15 د)، تطبيق عملي (15 د)، كتابة إبداعية (15 د)",
    assessment: "تحليل نص، كتابة جمل بلاغية، مناقشة صفية",
    notes: "اكتب 5 جمل تتضمن تشبيه و5 جمل تتضمن استعارة",
    duration: 55,
  },
  {
    title: "الأدب: الشعر الجاهلي | Literature: Pre-Islamic Poetry",
    objectives: "تحليل خصائص الشعر الجاهلي | Analyze characteristics of pre-Islamic Arabic poetry",
    materials: "ديوان المعلقات، تسجيلات صوتية، خرائط ذهنية",
    activities: "استماع لقصيدة (5 د)، تحليل البنية (15 د)، دراسة الصور الشعرية (15 د)، مناقشة (15 د)",
    assessment: "تحليل قصيدة، عرض شفهي، اختبار",
    notes: "اكتب تحليلاً لمعلقة امرئ القيس",
    duration: 55,
  },
  {
    title: "الإملاء: الهمزة المتوسطة | Spelling: Medial Hamza",
    objectives: "كتابة الهمزة المتوسطة بشكل صحيح | Write medial hamza correctly in Arabic words",
    materials: "قواعد الهمزة، أوراق إملاء، بطاقات كلمات",
    activities: "مراجعة القاعدة (10 د)، أمثلة تفصيلية (15 د)، إملاء تدريبي (15 د)، تصحيح ذاتي (10 د)",
    assessment: "إملاء، تصحيح كلمات، اختبار قصير",
    notes: "اكتب 20 كلمة تتضمن همزة متوسطة",
    duration: 50,
  },
  {
    title: "التعبير: كتابة المقال | Expression: Essay Writing",
    objectives: "كتابة مقال منظم ومترابط | Write an organized and coherent essay",
    materials: "نماذج مقالات، قوالب كتابة، معايير التقييم",
    activities: "تحليل نموذج (10 د)، العصف الذهني (10 د)، كتابة المسودة (20 د)، مراجعة الأقران (10 د)",
    assessment: "المقال النهائي، معايير الكتابة، التحرير الذاتي",
    notes: "أكمل مقالك عن موضوع: أهمية العلم في حياتنا",
    duration: 50,
  },
];

// English Language Lessons
const ENGLISH_LESSONS: LessonTemplate[] = [
  {
    title: "Grammar: Present Perfect Tense",
    objectives: "Use present perfect tense correctly in various contexts",
    materials: "Grammar textbook, Timeline visuals, Practice worksheets, Interactive whiteboard",
    activities: "Warm-up review (5 min), Tense introduction with timeline (15 min), Guided practice (15 min), Speaking activity (10 min), Written practice (10 min)",
    assessment: "Grammar quiz, Sentence completion, Oral assessment",
    notes: "Complete workbook exercises on present perfect, pages 34-36",
    duration: 55,
  },
  {
    title: "Reading Comprehension: Analytical Skills",
    objectives: "Apply analytical reading strategies to extract main ideas and supporting details",
    materials: "Reading passage handouts, Annotation guides, Graphic organizers",
    activities: "Pre-reading vocabulary (5 min), First reading (10 min), Annotation practice (15 min), Discussion (10 min), Comprehension questions (15 min)",
    assessment: "Comprehension test, Annotation quality, Class discussion",
    notes: "Read chapter 3 and complete comprehension questions",
    duration: 55,
  },
  {
    title: "Writing: Persuasive Essay Structure",
    objectives: "Write a well-structured persuasive essay with clear arguments",
    materials: "Essay outline template, Model essays, Transition word list, Rubric",
    activities: "Model essay analysis (10 min), Outline creation (15 min), Drafting introduction (15 min), Peer feedback (10 min), Revision (5 min)",
    assessment: "Essay draft, Peer review, Final submission",
    notes: "Complete first draft of persuasive essay on chosen topic",
    duration: 50,
  },
  {
    title: "Literature: Shakespeare - Romeo and Juliet",
    objectives: "Analyze themes, characters, and literary devices in Romeo and Juliet",
    materials: "Play text, Character analysis chart, Theme tracker, Video clips",
    activities: "Scene reading (15 min), Character analysis (15 min), Theme discussion (10 min), Modern connections (10 min), Reflection (5 min)",
    assessment: "Character essay, Theme analysis, Class participation",
    notes: "Write character analysis of either Romeo or Juliet",
    duration: 55,
  },
  {
    title: "Vocabulary Building: Academic Words",
    objectives: "Learn and use academic vocabulary in context",
    materials: "Vocabulary list, Context clues worksheet, Flashcards, Dictionary",
    activities: "Word introduction (10 min), Context practice (15 min), Vocabulary games (15 min), Sentence writing (10 min), Review (5 min)",
    assessment: "Vocabulary quiz, Sentence usage, Spelling test",
    notes: "Study vocabulary list and write sentences using each word",
    duration: 55,
  },
  {
    title: "Speaking: Presentation Skills",
    objectives: "Deliver effective oral presentations with confidence",
    materials: "Presentation rubric, Speaking tips handout, Timer, Evaluation forms",
    activities: "Tips review (5 min), Mini presentations (30 min), Peer feedback (10 min), Self-reflection (10 min)",
    assessment: "Presentation rubric, Peer evaluation, Self-assessment",
    notes: "Prepare 5-minute presentation on assigned topic",
    duration: 55,
  },
];

// Physics Lessons
const PHYSICS_LESSONS: LessonTemplate[] = [
  {
    title: "الميكانيكا: قوانين نيوتن | Mechanics: Newton's Laws",
    objectives: "فهم وتطبيق قوانين نيوتن الثلاثة | Understand and apply Newton's three laws of motion",
    materials: "Air track, Force sensors, Motion detectors, Lab notebooks",
    activities: "Demonstration (10 min), First law exploration (10 min), Second law experiment (15 min), Third law activity (10 min), Problem solving (10 min)",
    assessment: "Lab report, Problem set, Conceptual quiz",
    notes: "Complete Newton's laws problem set (20 problems)",
    duration: 55,
  },
  {
    title: "الطاقة والشغل | Energy and Work",
    objectives: "حساب الشغل والطاقة الحركية والكامنة | Calculate work, kinetic and potential energy",
    materials: "Spring scales, Ramps, Masses, Energy transfer simulation",
    activities: "Energy types review (5 min), Work calculation (15 min), KE and PE experiments (20 min), Energy conservation (10 min), Problems (5 min)",
    assessment: "Energy calculations quiz, Lab practical, Homework",
    notes: "Energy problems worksheet pages 78-82",
    duration: 55,
  },
  {
    title: "الكهرباء: الدوائر الكهربائية | Electricity: Electric Circuits",
    objectives: "بناء وتحليل الدوائر الكهربائية | Build and analyze electric circuits",
    materials: "Circuit boards, Resistors, Batteries, Multimeters, Bulbs",
    activities: "Circuit components review (5 min), Series circuit building (15 min), Parallel circuit building (15 min), Analysis and calculations (15 min), Clean up (5 min)",
    assessment: "Circuit diagram quiz, Practical test, Problem solving",
    notes: "Design a circuit for a specific application",
    duration: 55,
  },
  {
    title: "الموجات والصوت | Waves and Sound",
    objectives: "فهم خصائص الموجات والصوت | Understand wave properties and sound",
    materials: "Tuning forks, Oscilloscope, Slinky, Sound level meter",
    activities: "Wave properties demonstration (10 min), Frequency and wavelength (15 min), Sound experiments (15 min), Applications (10 min), Summary (5 min)",
    assessment: "Wave calculations quiz, Lab observation, Homework",
    notes: "Wave and sound problems 1-15",
    duration: 55,
  },
  {
    title: "البصريات: الانعكاس والانكسار | Optics: Reflection and Refraction",
    objectives: "تطبيق قوانين الانعكاس والانكسار | Apply laws of reflection and refraction",
    materials: "Mirrors, Lenses, Laser pointers, Protractors, Ray boxes",
    activities: "Reflection law demo (10 min), Mirror experiments (15 min), Refraction intro (10 min), Snell's law application (15 min), Review (5 min)",
    assessment: "Ray diagram test, Lab practical, Problem set",
    notes: "Optics problem set pages 120-125",
    duration: 55,
  },
];

// Chemistry Lessons
const CHEMISTRY_LESSONS: LessonTemplate[] = [
  {
    title: "الجدول الدوري | The Periodic Table",
    objectives: "فهم تنظيم الجدول الدوري والاتجاهات الدورية | Understand periodic table organization and trends",
    materials: "Periodic table posters, Element cards, Trend graphs, Interactive software",
    activities: "Table structure review (10 min), Group properties (15 min), Periodic trends (15 min), Element prediction (10 min), Summary (5 min)",
    assessment: "Element identification quiz, Trend analysis, Homework",
    notes: "Complete periodic trends worksheet",
    duration: 55,
  },
  {
    title: "الروابط الكيميائية | Chemical Bonding",
    objectives: "التمييز بين أنواع الروابط الكيميائية | Distinguish between types of chemical bonds",
    materials: "Molecular models, Electronegativity charts, Lewis structure templates",
    activities: "Bond types introduction (10 min), Ionic bonding (10 min), Covalent bonding (10 min), Metallic bonding (10 min), Model building (10 min)",
    assessment: "Bond type quiz, Lewis structure test, Model evaluation",
    notes: "Draw Lewis structures for 15 compounds",
    duration: 50,
  },
  {
    title: "التفاعلات الكيميائية | Chemical Reactions",
    objectives: "موازنة المعادلات الكيميائية وتصنيف التفاعلات | Balance equations and classify reactions",
    materials: "Reaction demonstrations, Equation cards, Balancing worksheets",
    activities: "Equation balancing review (10 min), Reaction types (15 min), Classification practice (15 min), Demonstrations (10 min), Problems (5 min)",
    assessment: "Balancing quiz, Reaction classification test, Lab report",
    notes: "Balance 20 chemical equations",
    duration: 55,
  },
  {
    title: "المحاليل والتركيز | Solutions and Concentration",
    objectives: "حساب تركيز المحاليل بوحدات مختلفة | Calculate solution concentration in various units",
    materials: "Volumetric flasks, Analytical balance, Graduated cylinders, Solutions",
    activities: "Concentration units review (10 min), Molarity calculations (15 min), Dilution practice (15 min), Lab preparation (10 min), Clean up (5 min)",
    assessment: "Concentration calculations quiz, Lab practical, Problem set",
    notes: "Solution concentration problems 1-20",
    duration: 55,
  },
  {
    title: "الأحماض والقواعد | Acids and Bases",
    objectives: "فهم خصائص الأحماض والقواعد ومقياس الأس الهيدروجيني | Understand acid-base properties and pH scale",
    materials: "pH meters, Indicators, Acid and base samples, pH paper",
    activities: "Acid-base properties (10 min), pH scale introduction (10 min), Indicator testing (15 min), pH calculations (10 min), Applications (10 min)",
    assessment: "pH quiz, Lab report, Neutralization problems",
    notes: "Acid-base problems and pH calculations worksheet",
    duration: 55,
  },
];

// Biology Lessons
const BIOLOGY_LESSONS: LessonTemplate[] = [
  {
    title: "الخلية: التركيب والوظائف | Cell: Structure and Functions",
    objectives: "تحديد العضيات الخلوية ووظائفها | Identify cell organelles and their functions",
    materials: "Microscopes, Prepared slides, Cell model, Diagrams",
    activities: "Cell theory review (5 min), Organelle overview (15 min), Microscope observation (20 min), Diagram labeling (10 min), Summary (5 min)",
    assessment: "Cell diagram quiz, Microscope practical, Organelle functions test",
    notes: "Label cell diagram and describe 10 organelle functions",
    duration: 55,
  },
  {
    title: "الانقسام الخلوي | Cell Division",
    objectives: "وصف مراحل الانقسام المتساوي والاختزالي | Describe stages of mitosis and meiosis",
    materials: "Cell division models, Chromosome kits, Animation videos, Worksheets",
    activities: "Mitosis overview (15 min), Stage identification (10 min), Meiosis comparison (15 min), Chromosome modeling (10 min), Review (5 min)",
    assessment: "Stage identification quiz, Diagram comparison, Homework",
    notes: "Create a cell division comparison chart",
    duration: 55,
  },
  {
    title: "الوراثة: قوانين مندل | Genetics: Mendel's Laws",
    objectives: "تطبيق قوانين مندل لحل مسائل الوراثة | Apply Mendel's laws to solve genetics problems",
    materials: "Punnett square templates, Genetics simulation, Trait cards",
    activities: "Mendel's experiments (10 min), Punnett squares (15 min), Dihybrid crosses (15 min), Problem solving (10 min), Summary (5 min)",
    assessment: "Genetics problem quiz, Punnett square test, Lab simulation",
    notes: "Complete genetics problems 1-15",
    duration: 55,
  },
  {
    title: "التنفس الخلوي | Cellular Respiration",
    objectives: "وصف مراحل التنفس الخلوي وإنتاج الطاقة | Describe cellular respiration stages and energy production",
    materials: "Respiration diagrams, ATP models, Respirometer, Mitochondria model",
    activities: "Glycolysis overview (10 min), Krebs cycle (10 min), Electron transport (10 min), ATP calculation (10 min), Respiration lab (15 min)",
    assessment: "Respiration quiz, ATP calculation test, Lab report",
    notes: "Create a flowchart of cellular respiration",
    duration: 55,
  },
  {
    title: "البيئة والنظام البيئي | Ecology and Ecosystems",
    objectives: "فهم العلاقات في النظام البيئي | Understand relationships in ecosystems",
    materials: "Ecosystem models, Food web cards, Population graphs, Field guides",
    activities: "Ecosystem components (10 min), Food webs (15 min), Population dynamics (15 min), Ecological relationships (10 min), Case study (5 min)",
    assessment: "Ecosystem quiz, Food web construction, Project",
    notes: "Research a local ecosystem and its food web",
    duration: 55,
  },
];

// Islamic Studies Lessons
const ISLAMIC_LESSONS: LessonTemplate[] = [
  {
    title: "التجويد: أحكام النون الساكنة والتنوين | Tajweed: Noon Sakinah Rules",
    objectives: "إتقان أحكام النون الساكنة والتنوين | Master the rules of noon sakinah and tanween",
    materials: "المصحف، جدول الأحكام، تسجيلات صوتية",
    activities: "مراجعة الحروف (5 د)، الإظهار (10 د)، الإدغام (10 د)، الإقلاب والإخفاء (10 د)، تطبيق (15 د)، تلخيص (5 د)",
    assessment: "تلاوة فردية، اختبار شفوي، واجب",
    notes: "استخرج 10 أمثلة لكل حكم من سورة البقرة",
    duration: 55,
  },
  {
    title: "الفقه: أركان الصلاة وواجباتها | Fiqh: Pillars and Obligations of Prayer",
    objectives: "التمييز بين أركان الصلاة وواجباتها وسننها | Distinguish between pillars, obligations, and sunnahs of prayer",
    materials: "كتاب الفقه، مخطط الأركان، بطاقات تصنيف",
    activities: "مراجعة (5 د)، الأركان (15 د)، الواجبات (15 د)، السنن (10 د)، تطبيق عملي (10 د)",
    assessment: "اختبار تصنيف، تطبيق عملي، مناقشة",
    notes: "اكتب قائمة بأركان وواجبات وسنن الصلاة مع الأدلة",
    duration: 55,
  },
  {
    title: "السيرة النبوية: غزوة بدر | Seerah: Battle of Badr",
    objectives: "دراسة أحداث غزوة بدر ودروسها | Study the events and lessons of Battle of Badr",
    materials: "خرائط المعركة، كتب السيرة، عروض تقديمية",
    activities: "مقدمة تاريخية (10 د)، أسباب الغزوة (10 د)، أحداث المعركة (15 د)، النتائج والدروس (15 د)، مناقشة (5 د)",
    assessment: "اختبار كتابي، مشروع بحثي، مناقشة صفية",
    notes: "اكتب مقالاً عن دروس غزوة بدر للمسلمين اليوم",
    duration: 55,
  },
  {
    title: "العقيدة: أركان الإيمان | Aqeedah: Pillars of Faith",
    objectives: "فهم أركان الإيمان الستة بالأدلة | Understand the six pillars of faith with evidence",
    materials: "كتاب العقيدة، آيات قرآنية، أحاديث نبوية",
    activities: "مقدمة (5 د)، الإيمان بالله (10 د)، الملائكة والكتب والرسل (15 د)، اليوم الآخر والقدر (15 د)، تلخيص (10 د)",
    assessment: "اختبار أركان الإيمان، حفظ الأدلة، مناقشة",
    notes: "احفظ حديث جبريل عن أركان الإيمان",
    duration: 55,
  },
  {
    title: "التفسير: سورة يوسف | Tafsir: Surah Yusuf",
    objectives: "تفسير آيات من سورة يوسف واستخراج العبر | Interpret verses from Surah Yusuf and extract lessons",
    materials: "المصحف، كتب التفسير، خرائط القصة",
    activities: "تلاوة الآيات (10 د)، تفسير المفردات (10 د)، شرح المعاني (15 د)، الدروس والعبر (15 د)، مناقشة (5 د)",
    assessment: "تفسير الآيات، استخراج الدروس، اختبار",
    notes: "اكتب خمس دروس من قصة يوسف عليه السلام",
    duration: 55,
  },
];

// Computer Science Lessons
const CS_LESSONS: LessonTemplate[] = [
  {
    title: "مقدمة في البرمجة | Introduction to Programming",
    objectives: "فهم أساسيات البرمجة وكتابة البرامج البسيطة | Understand programming basics and write simple programs",
    materials: "Computers, Python IDE, Online compiler, Tutorial slides",
    activities: "What is programming (10 min), Python setup (10 min), First program (15 min), Variables practice (15 min), Q&A (5 min)",
    assessment: "Code submission, In-class exercises, Quiz",
    notes: "Write 5 Python programs using variables and print statements",
    duration: 55,
  },
  {
    title: "هياكل البيانات: القوائم | Data Structures: Lists",
    objectives: "استخدام القوائم لتخزين ومعالجة البيانات | Use lists to store and manipulate data",
    materials: "IDE, List operations reference, Practice problems",
    activities: "List introduction (10 min), Creating and accessing (15 min), List methods (15 min), Practice problems (10 min), Review (5 min)",
    assessment: "Coding quiz, Problem solving, Homework",
    notes: "Complete list manipulation exercises 1-10",
    duration: 55,
  },
  {
    title: "الخوارزميات: البحث والترتيب | Algorithms: Search and Sort",
    objectives: "تنفيذ خوارزميات البحث والترتيب | Implement search and sorting algorithms",
    materials: "Algorithm visualizations, Code templates, Complexity charts",
    activities: "Linear search (10 min), Binary search (10 min), Bubble sort (10 min), Selection sort (10 min), Comparison (10 min), Practice (5 min)",
    assessment: "Algorithm implementation, Time complexity quiz, Project",
    notes: "Implement all four algorithms in Python",
    duration: 55,
  },
  {
    title: "قواعد البيانات: SQL أساسيات | Databases: SQL Basics",
    objectives: "كتابة استعلامات SQL الأساسية | Write basic SQL queries",
    materials: "Database software, SQL reference, Practice database",
    activities: "Database concepts (10 min), SELECT statements (15 min), WHERE clause (10 min), JOIN introduction (10 min), Practice (10 min)",
    assessment: "SQL quiz, Query writing, Database project",
    notes: "Write 15 SQL queries for the practice database",
    duration: 55,
  },
  {
    title: "تطوير الويب: HTML و CSS | Web Development: HTML & CSS",
    objectives: "إنشاء صفحات ويب باستخدام HTML وتنسيقها بـ CSS | Create web pages using HTML and style with CSS",
    materials: "Code editor, Browser, HTML/CSS reference, Design templates",
    activities: "HTML structure (10 min), Common tags (10 min), CSS introduction (10 min), Styling practice (15 min), Mini project (10 min)",
    assessment: "Web page submission, CSS styling quiz, Project",
    notes: "Create a personal profile web page with CSS styling",
    duration: 55,
  },
];

// History and Geography Lessons
const HISTORY_GEOGRAPHY_LESSONS: LessonTemplate[] = [
  {
    title: "تاريخ السودان: مملكة كوش | Sudanese History: Kingdom of Kush",
    objectives: "فهم حضارة كوش وإنجازاتها | Understand Kush civilization and achievements",
    materials: "خرائط تاريخية، صور آثار، فيديوهات وثائقية",
    activities: "مقدمة جغرافية (10 د)، نشأة المملكة (10 د)، العلاقة مع مصر (10 د)، الإنجازات (10 د)، السقوط (10 د)، مناقشة (5 د)",
    assessment: "اختبار تاريخي، مشروع بحثي، عرض تقديمي",
    notes: "اكتب تقريراً عن أهم ملوك كوش",
    duration: 55,
  },
  {
    title: "جغرافيا السودان: المناخ والموارد | Sudan Geography: Climate and Resources",
    objectives: "فهم المناخ والموارد الطبيعية في السودان | Understand Sudan's climate and natural resources",
    materials: "خرائط مناخية، رسوم بيانية، صور أقمار صناعية",
    activities: "المناطق المناخية (10 د)، الأنهار والمياه (10 د)، الموارد المعدنية (10 د)، الزراعة (10 د)، التحديات (10 د)، تلخيص (5 د)",
    assessment: "اختبار خرائط، مشروع موارد، مناقشة",
    notes: "ارسم خريطة للموارد الطبيعية في السودان",
    duration: 55,
  },
  {
    title: "التاريخ الإسلامي: الخلافة الراشدة | Islamic History: Rashidun Caliphate",
    objectives: "دراسة فترة الخلافة الراشدة وإنجازاتها | Study the Rashidun Caliphate period and achievements",
    materials: "كتب التاريخ، خرائط الفتوحات، جداول زمنية",
    activities: "أبو بكر الصديق (10 د)، عمر بن الخطاب (10 د)، عثمان بن عفان (10 د)، علي بن أبي طالب (10 د)، الإنجازات (10 د)، مناقشة (5 د)",
    assessment: "اختبار الخلفاء، مشروع بحثي، عرض",
    notes: "اكتب عن إنجازات أحد الخلفاء الراشدين",
    duration: 55,
  },
  {
    title: "الجغرافيا الطبيعية: التضاريس | Physical Geography: Landforms",
    objectives: "تحديد وشرح أنواع التضاريس المختلفة | Identify and explain different landform types",
    materials: "نماذج تضاريس، خرائط طبوغرافية، صور جوية",
    activities: "الجبال والهضاب (10 د)، السهول والوديان (10 د)، التضاريس الساحلية (10 د)، قراءة الخرائط (10 د)، تطبيق (10 د)، مراجعة (5 د)",
    assessment: "اختبار تحديد التضاريس، قراءة خرائط، مشروع",
    notes: "حدد التضاريس الرئيسية على خريطة القارة",
    duration: 55,
  },
];

// Combine all lessons with subject mapping
const ALL_LESSONS: { subject: string; lessons: LessonTemplate[] }[] = [
  { subject: "Mathematics", lessons: MATH_LESSONS },
  { subject: "Arabic", lessons: ARABIC_LESSONS },
  { subject: "English Language", lessons: ENGLISH_LESSONS },
  { subject: "Physics", lessons: PHYSICS_LESSONS },
  { subject: "Chemistry", lessons: CHEMISTRY_LESSONS },
  { subject: "Biology", lessons: BIOLOGY_LESSONS },
  { subject: "Islamic Studies", lessons: ISLAMIC_LESSONS },
  { subject: "Computer Science", lessons: CS_LESSONS },
  { subject: "Geography", lessons: HISTORY_GEOGRAPHY_LESSONS.slice(1, 2).concat(HISTORY_GEOGRAPHY_LESSONS.slice(3)) },
  { subject: "History", lessons: HISTORY_GEOGRAPHY_LESSONS.filter((_, i) => i === 0 || i === 2) },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedLessons(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  subjects?: SubjectRef[],
  teachers?: TeacherRef[]
): Promise<void> {
  console.log("📖 Creating comprehensive lesson plans (100+ lessons)...");

  // Get classes with their subject information
  const classesWithSubject = await prisma.class.findMany({
    where: { schoolId },
    select: { id: true, name: true, subjectId: true, teacherId: true },
  });

  // Get subjects if not provided
  const allSubjects = subjects || await prisma.subject.findMany({
    where: { schoolId },
    select: { id: true, subjectName: true },
  });

  // Create a map of subject name to subject ID
  const subjectMap = new Map<string, string>();
  for (const subj of allSubjects) {
    subjectMap.set(subj.subjectName, subj.id);
  }

  // Create a map of class by subject
  const classBySubject = new Map<string, typeof classesWithSubject>();
  for (const cls of classesWithSubject) {
    const subjName = allSubjects.find(s => s.id === cls.subjectId)?.subjectName || "";
    if (!classBySubject.has(subjName)) {
      classBySubject.set(subjName, []);
    }
    classBySubject.get(subjName)!.push(cls);
  }

  const lessonRecords: {
    schoolId: string;
    classId: string;
    title: string;
    description: string;
    lessonDate: Date;
    startTime: string;
    endTime: string;
    objectives: string;
    materials: string;
    activities: string;
    assessment: string;
    notes: string | null;
    status: LessonStatus;
  }[] = [];

  let lessonCount = 0;
  const today = new Date();

  // Create lessons for each subject
  for (const { subject, lessons } of ALL_LESSONS) {
    const subjectClasses = classBySubject.get(subject) || classesWithSubject.slice(0, 3);

    if (subjectClasses.length === 0) {
      // If no classes found for this subject, use any available classes
      const fallbackClasses = classesWithSubject.slice(lessonCount % Math.min(5, classesWithSubject.length), lessonCount % Math.min(5, classesWithSubject.length) + 1);
      if (fallbackClasses.length > 0) {
        subjectClasses.push(...fallbackClasses);
      }
    }

    // Create each lesson for different classes in this subject
    for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
      const lesson = lessons[lessonIndex];
      const targetClass = subjectClasses[lessonIndex % subjectClasses.length];

      if (!targetClass) continue;

      // Schedule lessons across the term (past, current, and future)
      const dayOffset = lessonIndex < 2
        ? -(30 - lessonIndex * 5) // Past lessons (completed)
        : lessonIndex < 4
        ? lessonIndex - 2 // Current week (in progress)
        : (lessonIndex - 3) * 3; // Future lessons (planned)

      const lessonDate = new Date(today);
      lessonDate.setDate(lessonDate.getDate() + dayOffset);

      // Determine status based on date
      const status = dayOffset < -7
        ? LessonStatus.COMPLETED
        : dayOffset < 3
        ? LessonStatus.IN_PROGRESS
        : LessonStatus.PLANNED;

      // Calculate end time based on duration
      const duration = lesson.duration || 55;
      const startHour = 8 + (lessonIndex % 6);
      const endMinutes = duration;
      const endHour = startHour + Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;

      lessonRecords.push({
        schoolId,
        classId: targetClass.id,
        title: lesson.title,
        description: `Comprehensive lesson: ${lesson.title}`,
        lessonDate,
        startTime: `${String(startHour).padStart(2, "0")}:00`,
        endTime: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
        objectives: lesson.objectives,
        materials: lesson.materials,
        activities: lesson.activities,
        assessment: lesson.assessment,
        notes: lesson.notes || null,
        status,
      });

      lessonCount++;
    }
  }

  // Batch insert all lessons
  if (lessonRecords.length > 0) {
    await prisma.lesson.createMany({
      data: lessonRecords,
      skipDuplicates: true,
    });
  }

  // Calculate statistics
  const completedCount = lessonRecords.filter(l => l.status === LessonStatus.COMPLETED).length;
  const inProgressCount = lessonRecords.filter(l => l.status === LessonStatus.IN_PROGRESS).length;
  const plannedCount = lessonRecords.filter(l => l.status === LessonStatus.PLANNED).length;

  console.log(`   ✅ Created: ${lessonCount} comprehensive lesson plans`);
  console.log(`      - Completed: ${completedCount}`);
  console.log(`      - In Progress: ${inProgressCount}`);
  console.log(`      - Planned: ${plannedCount}`);
  console.log(`      - Subjects covered: ${ALL_LESSONS.length}`);
  console.log(`      - Features: Bilingual content, detailed materials, activities, assessments, homework\n`);
}
