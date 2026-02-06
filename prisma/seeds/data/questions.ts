/**
 * Real Arabic Question Bank Data
 *
 * 15-20 real educational questions per subject group
 * Used by prisma/seeds/qbank.ts
 */

export interface QuestionData {
  questionText: string
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY"
  options?: { text: string; isCorrect: boolean }[]
  sampleAnswer?: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  bloomLevel:
    | "REMEMBER"
    | "UNDERSTAND"
    | "APPLY"
    | "ANALYZE"
    | "EVALUATE"
    | "CREATE"
  points: number
}

// ============================================================================
// الرياضيات - Mathematics
// ============================================================================

export const MATH_QUESTIONS: QuestionData[] = [
  {
    questionText: "ما حاصل ضرب (-3) × (-5)؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "15", isCorrect: true },
      { text: "-15", isCorrect: false },
      { text: "-8", isCorrect: false },
      { text: "8", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "ما قيمة x في المعادلة: 2x + 6 = 20؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "7", isCorrect: true },
      { text: "13", isCorrect: false },
      { text: "8", isCorrect: false },
      { text: "5", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "مساحة المستطيل الذي طوله 8 سم وعرضه 5 سم هي:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "40 سم²", isCorrect: true },
      { text: "26 سم²", isCorrect: false },
      { text: "13 سم²", isCorrect: false },
      { text: "80 سم²", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "ما هو المضاعف المشترك الأصغر للعددين 4 و 6؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "12", isCorrect: true },
      { text: "24", isCorrect: false },
      { text: "6", isCorrect: false },
      { text: "2", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "مجموع زوايا المثلث يساوي 180 درجة.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "الجذر التربيعي لـ 144 هو 14.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: false },
      { text: "خطأ", isCorrect: true },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "حل المتباينة: 3x - 7 > 8",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "x > 5",
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 8,
  },
  {
    questionText: "أوجد مساحة الدائرة التي نصف قطرها 7 سم (π = 22/7)",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "المساحة = π × نق² = 22/7 × 49 = 154 سم²",
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 8,
  },
  {
    questionText:
      "إذا كان ثمن 5 كتب هو 75 ريالاً، فما ثمن 12 كتاباً من نفس النوع؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "180 ريالاً", isCorrect: true },
      { text: "150 ريالاً", isCorrect: false },
      { text: "200 ريالاً", isCorrect: false },
      { text: "160 ريالاً", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "ما هي خواص المعين؟ اذكر ثلاثاً منها.",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "1. جميع أضلاعه متساوية 2. كل زاويتين متقابلتين متساويتان 3. القطران ينصف كل منهما الآخر عمودياً",
    difficulty: "MEDIUM",
    bloomLevel: "REMEMBER",
    points: 10,
  },
  {
    questionText:
      "اشرح الفرق بين المتتابعة الحسابية والمتتابعة الهندسية مع مثال لكل منهما.",
    questionType: "ESSAY",
    sampleAnswer:
      "المتتابعة الحسابية: الفرق بين كل حدين متتاليين ثابت، مثال: 2, 5, 8, 11 (أساس = 3). المتتابعة الهندسية: النسبة بين كل حدين متتاليين ثابتة، مثال: 2, 6, 18, 54 (أساس = 3).",
    difficulty: "HARD",
    bloomLevel: "ANALYZE",
    points: 15,
  },
  {
    questionText:
      "العدد النسبي هو العدد الذي يمكن كتابته على صورة كسر أ/ب حيث ب ≠ 0.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "أوجد قيمة: 3² + 4² - 5²",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "0", isCorrect: true },
      { text: "2", isCorrect: false },
      { text: "-2", isCorrect: false },
      { text: "50", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "محيط المربع الذي طول ضلعه 9 سم يساوي:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "36 سم", isCorrect: true },
      { text: "81 سم²", isCorrect: false },
      { text: "18 سم", isCorrect: false },
      { text: "27 سم", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "بسّط العبارة الجبرية: 5x + 3y - 2x + 7y",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "3x + 10y",
    difficulty: "EASY",
    bloomLevel: "APPLY",
    points: 8,
  },
]

// ============================================================================
// الفيزياء - Physics
// ============================================================================

export const PHYSICS_QUESTIONS: QuestionData[] = [
  {
    questionText: "وحدة قياس القوة في النظام الدولي هي:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "نيوتن", isCorrect: true },
      { text: "جول", isCorrect: false },
      { text: "واط", isCorrect: false },
      { text: "باسكال", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "تتناسب قوة الجاذبية طردياً مع مربع المسافة بين الجسمين.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: false },
      { text: "خطأ", isCorrect: true },
    ],
    sampleAnswer: "خطأ - تتناسب عكسياً مع مربع المسافة",
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 3,
  },
  {
    questionText: "سيارة تتحرك بسرعة 72 كم/ساعة. ما سرعتها بالمتر/ثانية؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "20 م/ث", isCorrect: true },
      { text: "72 م/ث", isCorrect: false },
      { text: "36 م/ث", isCorrect: false },
      { text: "10 م/ث", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "ينص قانون نيوتن الثاني على أن:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "القوة = الكتلة × التسارع", isCorrect: true },
      { text: "القوة = الكتلة × السرعة", isCorrect: false },
      { text: "القوة = الكتلة / التسارع", isCorrect: false },
      { text: "القوة = التسارع / الكتلة", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "الطاقة الحركية لجسم كتلته 2 كجم ويتحرك بسرعة 3 م/ث تساوي:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "9 جول", isCorrect: true },
      { text: "6 جول", isCorrect: false },
      { text: "12 جول", isCorrect: false },
      { text: "3 جول", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "الصوت ينتقل في الفراغ.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: false },
      { text: "خطأ", isCorrect: true },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "سرعة الضوء في الفراغ تقارب:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "3 × 10⁸ م/ث", isCorrect: true },
      { text: "3 × 10⁶ م/ث", isCorrect: false },
      { text: "3 × 10¹⁰ م/ث", isCorrect: false },
      { text: "3 × 10⁴ م/ث", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "اشرح قانون حفظ الطاقة مع ذكر مثال تطبيقي.",
    questionType: "ESSAY",
    sampleAnswer:
      "ينص قانون حفظ الطاقة على أن الطاقة لا تُفنى ولا تُستحدث بل تتحول من شكل لآخر. مثال: عند سقوط كرة من ارتفاع، تتحول طاقة الوضع (الكامنة) إلى طاقة حركية.",
    difficulty: "HARD",
    bloomLevel: "ANALYZE",
    points: 15,
  },
  {
    questionText: "عرّف التسارع واذكر وحدة قياسه.",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "التسارع هو معدل تغير السرعة بالنسبة للزمن. وحدته: م/ث²",
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 8,
  },
  {
    questionText: "جسم كتلته 5 كجم يسقط سقوطاً حراً. ما وزنه؟ (ت = 9.8 م/ث²)",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "الوزن = ك × ت = 5 × 9.8 = 49 نيوتن",
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 8,
  },
  {
    questionText: "الكثافة تساوي الكتلة مقسومة على الحجم.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText:
      "قارن بين الموجات الطولية والموجات المستعرضة مع مثال لكل منهما.",
    questionType: "ESSAY",
    sampleAnswer:
      "الموجات الطولية: اتجاه اهتزاز الجسيمات موازٍ لاتجاه انتشار الموجة (مثل: الصوت). الموجات المستعرضة: اتجاه اهتزاز الجسيمات عمودي على اتجاه انتشار الموجة (مثل: الضوء).",
    difficulty: "HARD",
    bloomLevel: "ANALYZE",
    points: 15,
  },
  {
    questionText: "درجة حرارة تجمد الماء النقي عند الضغط الجوي العادي هي:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "0 درجة مئوية", isCorrect: true },
      { text: "100 درجة مئوية", isCorrect: false },
      { text: "-10 درجات مئوية", isCorrect: false },
      { text: "32 درجة مئوية", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "ما الفرق بين المسافة والإزاحة؟",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "المسافة: كمية عددية تمثل طول المسار الفعلي. الإزاحة: كمية متجهة تمثل أقصر مسافة بين نقطتين مع تحديد الاتجاه.",
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 8,
  },
  {
    questionText:
      "في الدائرة الكهربائية، التيار يسري من القطب الموجب إلى السالب خارج البطارية.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 3,
  },
]

// ============================================================================
// اللغة العربية - Arabic Language
// ============================================================================

export const ARABIC_QUESTIONS: QuestionData[] = [
  {
    questionText: "أعرب الكلمة التي تحتها خط: ذهب الطالبُ إلى المدرسة.",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "الطالبُ: فاعل مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 10,
  },
  {
    questionText: "المفعول به هو اسم منصوب يقع عليه فعل الفاعل.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "ما نوع الهمزة في كلمة 'استغفر'؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "همزة وصل", isCorrect: true },
      { text: "همزة قطع", isCorrect: false },
      { text: "همزة متوسطة", isCorrect: false },
      { text: "همزة متطرفة", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 5,
  },
  {
    questionText: "جمع كلمة 'كتاب' هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "كُتُب", isCorrect: true },
      { text: "كتابات", isCorrect: false },
      { text: "كتّاب", isCorrect: false },
      { text: "مكاتب", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "استخرج الحال من الجملة: عاد المسافر سالماً.",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "سالماً: حال منصوب وعلامة نصبه الفتحة",
    difficulty: "MEDIUM",
    bloomLevel: "APPLY",
    points: 8,
  },
  {
    questionText: "الفعل المضارع المرفوع علامة رفعه:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الضمة", isCorrect: true },
      { text: "الفتحة", isCorrect: false },
      { text: "الكسرة", isCorrect: false },
      { text: "السكون", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText:
      "حلل البلاغة في قول الشاعر: 'والنجوم تبتسم في السماء'. ما نوع الصورة البيانية؟",
    questionType: "ESSAY",
    sampleAnswer:
      "استعارة مكنية: شبّه الشاعر النجوم بإنسان يبتسم، حذف المشبه به (الإنسان) وأبقى على صفة من صفاته (الابتسام). تفيد إضفاء الحياة والجمال على المشهد الطبيعي.",
    difficulty: "HARD",
    bloomLevel: "ANALYZE",
    points: 15,
  },
  {
    questionText: "التمييز اسم نكرة منصوب يأتي بعد مبهم ليوضحه.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "ما الفرق بين 'إن' و 'أن'؟",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "إنّ: حرف توكيد ونصب يدخل على الجملة الاسمية في بداية الكلام. أنّ: حرف توكيد ونصب مصدري يأتي في وسط الكلام.",
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 8,
  },
  {
    questionText: "مرادف كلمة 'الجود' هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الكرم", isCorrect: true },
      { text: "البخل", isCorrect: false },
      { text: "الحزن", isCorrect: false },
      { text: "الغضب", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "اكتب فقرة عن أهمية القراءة في حياة الإنسان.",
    questionType: "ESSAY",
    sampleAnswer:
      "القراءة غذاء العقل والروح، فهي تفتح آفاقاً جديدة وتوسع المدارك. تنمي القراءة الخيال واللغة، وتزود القارئ بالمعرفة والخبرات. هي نافذة على العالم ومفتاح التقدم والحضارة.",
    difficulty: "MEDIUM",
    bloomLevel: "CREATE",
    points: 15,
  },
  {
    questionText: "كلمة 'مدرسة' مشتقة من الجذر:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "د-ر-س", isCorrect: true },
      { text: "م-د-ر", isCorrect: false },
      { text: "د-س-ر", isCorrect: false },
      { text: "ر-س-م", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText:
      "ضع كلمة 'علم' في جملتين بحيث تكون مرة فاعلاً ومرة مفعولاً به.",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "فاعل: نفعَ العلمُ الناسَ. مفعول به: طلبَ الطالبُ العلمَ.",
    difficulty: "MEDIUM",
    bloomLevel: "CREATE",
    points: 10,
  },
  {
    questionText: "الأفعال الخمسة ترفع بثبوت النون وتنصب وتجزم بحذفها.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "ضد كلمة 'الشجاعة' هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الجبن", isCorrect: true },
      { text: "القوة", isCorrect: false },
      { text: "الحكمة", isCorrect: false },
      { text: "الصبر", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
]

// ============================================================================
// العلوم - General Science (KG-6)
// ============================================================================

export const SCIENCE_QUESTIONS: QuestionData[] = [
  {
    questionText: "ما أصغر وحدة بناء في الكائنات الحية؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الخلية", isCorrect: true },
      { text: "النسيج", isCorrect: false },
      { text: "العضو", isCorrect: false },
      { text: "الجهاز", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "الشمس هي أقرب نجم إلى الأرض.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "عدد كواكب المجموعة الشمسية هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "8", isCorrect: true },
      { text: "9", isCorrect: false },
      { text: "7", isCorrect: false },
      { text: "10", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "النباتات الخضراء تصنع غذاءها بنفسها عن طريق:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "البناء الضوئي", isCorrect: true },
      { text: "التنفس", isCorrect: false },
      { text: "الهضم", isCorrect: false },
      { text: "الامتصاص", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "ما حالات المادة الثلاث الأساسية؟",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "الحالة الصلبة، الحالة السائلة، الحالة الغازية",
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 8,
  },
  {
    questionText: "الماء يتكون من ذرتي هيدروجين وذرة أكسجين.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "الحيوان الذي يغطي جسمه الريش هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الطائر", isCorrect: true },
      { text: "الزواحف", isCorrect: false },
      { text: "الثدييات", isCorrect: false },
      { text: "البرمائيات", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "اشرح دورة الماء في الطبيعة.",
    questionType: "ESSAY",
    sampleAnswer:
      "تبدأ دورة الماء بتبخر الماء من المسطحات المائية بفعل حرارة الشمس، ثم يتصاعد البخار ويتكاثف مكوناً السحب، ثم يسقط على شكل أمطار أو ثلوج، ويجري في الأنهار ويعود إلى المحيطات.",
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 15,
  },
  {
    questionText: "الجزء من النبات المسؤول عن امتصاص الماء والأملاح هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الجذر", isCorrect: true },
      { text: "الساق", isCorrect: false },
      { text: "الورقة", isCorrect: false },
      { text: "الزهرة", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "الجهاز المسؤول عن ضخ الدم في جسم الإنسان هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "القلب", isCorrect: true },
      { text: "الكبد", isCorrect: false },
      { text: "الرئة", isCorrect: false },
      { text: "المعدة", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "الديناصورات انقرضت قبل ملايين السنين.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText:
      "صنّف الحيوانات التالية إلى ثدييات وزواحف: القط، التمساح، الحصان، الثعبان.",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "ثدييات: القط، الحصان. زواحف: التمساح، الثعبان.",
    difficulty: "EASY",
    bloomLevel: "UNDERSTAND",
    points: 8,
  },
  {
    questionText: "المغناطيس يجذب جميع المعادن.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: false },
      { text: "خطأ", isCorrect: true },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 3,
  },
  {
    questionText: "أقرب كوكب إلى الشمس هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "عطارد", isCorrect: true },
      { text: "الزهرة", isCorrect: false },
      { text: "المريخ", isCorrect: false },
      { text: "الأرض", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "ما الفرق بين الكائنات الحية وغير الحية؟ اذكر ثلاث صفات.",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "الكائنات الحية: تتنفس، تتغذى، تتكاثر. الكائنات غير الحية: لا تتنفس، لا تتغذى، لا تتكاثر.",
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 10,
  },
]

// ============================================================================
// التربية الإسلامية - Islamic Studies
// ============================================================================

export const ISLAMIC_QUESTIONS: QuestionData[] = [
  {
    questionText: "أركان الإسلام خمسة. ما هي؟",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "الشهادتان، الصلاة، الزكاة، صوم رمضان، حج البيت لمن استطاع إليه سبيلاً",
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 10,
  },
  {
    questionText: "عدد ركعات صلاة الظهر هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "4 ركعات", isCorrect: true },
      { text: "3 ركعات", isCorrect: false },
      { text: "2 ركعتان", isCorrect: false },
      { text: "5 ركعات", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "نزل القرآن الكريم في شهر رمضان.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "وقعت غزوة بدر في السنة الهجرية:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الثانية", isCorrect: true },
      { text: "الأولى", isCorrect: false },
      { text: "الثالثة", isCorrect: false },
      { text: "الخامسة", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "ما هو نصاب زكاة المال؟",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "نصاب زكاة المال هو ما يعادل 85 غراماً من الذهب أو 595 غراماً من الفضة، ويُخرج منه 2.5% إذا حال عليه الحول.",
    difficulty: "MEDIUM",
    bloomLevel: "REMEMBER",
    points: 10,
  },
  {
    questionText: "أول مسجد بُني في الإسلام هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "مسجد قباء", isCorrect: true },
      { text: "المسجد النبوي", isCorrect: false },
      { text: "المسجد الحرام", isCorrect: false },
      { text: "المسجد الأقصى", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "اشرح آداب التعامل بين المسلمين كما وردت في سورة الحجرات.",
    questionType: "ESSAY",
    sampleAnswer:
      "من آداب سورة الحجرات: عدم السخرية من الآخرين، تجنب التنابز بالألقاب، اجتناب الظن السيء، عدم التجسس والغيبة، والتعارف بين الناس. قال تعالى: 'يا أيها الذين آمنوا لا يسخر قوم من قوم'.",
    difficulty: "HARD",
    bloomLevel: "ANALYZE",
    points: 15,
  },
  {
    questionText: "هجرة الرسول صلى الله عليه وسلم كانت من مكة إلى المدينة.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "عدد سور القرآن الكريم هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "114 سورة", isCorrect: true },
      { text: "112 سورة", isCorrect: false },
      { text: "120 سورة", isCorrect: false },
      { text: "110 سور", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "الصوم يجب على كل مسلم بالغ عاقل.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "ما الحكمة من مشروعية الزكاة؟",
    questionType: "ESSAY",
    sampleAnswer:
      "تطهير النفس من البخل والشح، مساعدة الفقراء والمحتاجين، تحقيق التكافل الاجتماعي، تنمية المال وبركته، وتقوية الروابط بين أفراد المجتمع المسلم.",
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 15,
  },
  {
    questionText: "من هو خاتم الأنبياء والمرسلين؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "محمد صلى الله عليه وسلم", isCorrect: true },
      { text: "عيسى عليه السلام", isCorrect: false },
      { text: "موسى عليه السلام", isCorrect: false },
      { text: "إبراهيم عليه السلام", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "اذكر ثلاثة من أسماء الله الحسنى مع شرح مختصر لكل اسم.",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "الرحمن: ذو الرحمة الواسعة. العليم: الذي يعلم كل شيء. القدير: الذي لا يعجزه شيء.",
    difficulty: "EASY",
    bloomLevel: "UNDERSTAND",
    points: 10,
  },
  {
    questionText: "حرّم الإسلام الربا.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "ما أركان الإيمان الستة؟",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "الإيمان بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، والقدر خيره وشره.",
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 10,
  },
]

// ============================================================================
// القرآن الكريم - Quran Studies
// ============================================================================

export const QURAN_QUESTIONS: QuestionData[] = [
  {
    questionText: "ما اسم السورة التي تبدأ بـ 'تبارك الذي بيده الملك'؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "سورة الملك", isCorrect: true },
      { text: "سورة الرحمن", isCorrect: false },
      { text: "سورة يس", isCorrect: false },
      { text: "سورة الواقعة", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "المد الطبيعي مقداره حركتان.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "من أحكام النون الساكنة والتنوين:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الإظهار والإدغام والإقلاب والإخفاء", isCorrect: true },
      { text: "الإظهار والإدغام فقط", isCorrect: false },
      { text: "المد والقصر", isCorrect: false },
      { text: "الوقف والابتداء", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "أكمل الآية: 'قل هو الله ...'",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "أحد",
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "سورة الفاتحة تسمى أيضاً:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "أم الكتاب", isCorrect: true },
      { text: "قلب القرآن", isCorrect: false },
      { text: "سنام القرآن", isCorrect: false },
      { text: "عروس القرآن", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "عدد آيات سورة الفاتحة هو:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "7 آيات", isCorrect: true },
      { text: "5 آيات", isCorrect: false },
      { text: "6 آيات", isCorrect: false },
      { text: "8 آيات", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "اشرح معنى الإدغام في التجويد واذكر حروفه.",
    questionType: "ESSAY",
    sampleAnswer:
      "الإدغام هو إدخال حرف ساكن في حرف متحرك بحيث يصيران حرفاً واحداً مشدداً. حروفه مجموعة في كلمة 'يرملون': الياء، الراء، الميم، اللام، الواو، النون.",
    difficulty: "HARD",
    bloomLevel: "UNDERSTAND",
    points: 15,
  },
  {
    questionText: "سورة يس تُلقّب بقلب القرآن.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "أطول سورة في القرآن الكريم هي:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "سورة البقرة", isCorrect: true },
      { text: "سورة آل عمران", isCorrect: false },
      { text: "سورة النساء", isCorrect: false },
      { text: "سورة الأعراف", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText: "ما الفرق بين السور المكية والسور المدنية؟",
    questionType: "SHORT_ANSWER",
    sampleAnswer:
      "المكية: نزلت قبل الهجرة وتتناول العقيدة والتوحيد. المدنية: نزلت بعد الهجرة وتتناول التشريعات والأحكام.",
    difficulty: "MEDIUM",
    bloomLevel: "UNDERSTAND",
    points: 10,
  },
  {
    questionText: "آية الكرسي في سورة:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "البقرة", isCorrect: true },
      { text: "آل عمران", isCorrect: false },
      { text: "النساء", isCorrect: false },
      { text: "المائدة", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
  {
    questionText:
      "الإقلاب هو قلب النون الساكنة أو التنوين ميماً عند حرف الباء.",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "MEDIUM",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "اكتب من حفظك الآيات (1-5) من سورة الملك.",
    questionType: "ESSAY",
    sampleAnswer:
      "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ * الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ الْعَزِيزُ الْغَفُورُ * الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ * ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ * وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ",
    difficulty: "HARD",
    bloomLevel: "REMEMBER",
    points: 20,
  },
  {
    questionText: "كم عدد أجزاء القرآن الكريم؟",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "30 جزءاً", isCorrect: true },
      { text: "25 جزءاً", isCorrect: false },
      { text: "20 جزءاً", isCorrect: false },
      { text: "40 جزءاً", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
]

// ============================================================================
// Subject-to-Questions mapping
// ============================================================================

export const SUBJECT_QUESTIONS: Record<string, QuestionData[]> = {
  الرياضيات: MATH_QUESTIONS,
  الفيزياء: PHYSICS_QUESTIONS,
  "اللغة العربية": ARABIC_QUESTIONS,
  العلوم: SCIENCE_QUESTIONS,
  "التربية الإسلامية": ISLAMIC_QUESTIONS,
  "القرآن الكريم": QURAN_QUESTIONS,
}

// Fallback generic questions for unmapped subjects
export const GENERIC_QUESTIONS: QuestionData[] = [
  {
    questionText: "ما المفهوم الأساسي في هذا الدرس؟",
    questionType: "SHORT_ANSWER",
    sampleAnswer: "يعتمد على المادة الدراسية",
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 8,
  },
  {
    questionText: "اشرح أهمية هذا الموضوع وعلاقته بالحياة اليومية.",
    questionType: "ESSAY",
    sampleAnswer: "إجابة تفصيلية تربط الموضوع بالتطبيقات العملية",
    difficulty: "MEDIUM",
    bloomLevel: "ANALYZE",
    points: 15,
  },
  {
    questionText: "هل هذا المفهوم صحيح؟",
    questionType: "TRUE_FALSE",
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 3,
  },
  {
    questionText: "اختر الإجابة الصحيحة:",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "الخيار الأول", isCorrect: true },
      { text: "الخيار الثاني", isCorrect: false },
      { text: "الخيار الثالث", isCorrect: false },
      { text: "الخيار الرابع", isCorrect: false },
    ],
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: 5,
  },
]
