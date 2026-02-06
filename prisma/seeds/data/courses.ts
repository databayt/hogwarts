/**
 * ClickView Educational Courses Data
 *
 * 59 K-12 courses with Arabic titles and descriptions
 * Each course has 5-8 chapters organized by educational topic
 *
 * Source: ClickView Education (clickvieweducation.com)
 */

export interface CourseChapter {
  title: string
}

export interface CourseData {
  slug: string
  title: string
  category: string
  image: string
  description: string
  chapters: CourseChapter[]
}

export const STREAM_CATEGORIES = [
  { name: "الرياضيات" },
  { name: "العلوم" },
  { name: "اللغات والأدب" },
  {
    name: "الدراسات الاجتماعية والتاريخ",
  },
  { name: "الصحة والعافية" },
  { name: "الفنون والإعلام" },
  { name: "التكنولوجيا والحوسبة" },
  { name: "المهارات الحياتية" },
] as const

export const CLICKVIEW_COURSES: CourseData[] = [
  // ============================================
  // MATHEMATICS (6 courses)
  // ============================================
  {
    slug: "algebra",
    title: "الجبر",
    category: "Mathematics",
    image: "/courses/algebra.png",
    description:
      "إتقان مفاهيم الجبر من المتغيرات إلى المعادلات. بناء مهارات حل المشكلات الأساسية للرياضيات المتقدمة.",
    chapters: [
      { title: "مقدمة للمتغيرات" },
      {
        title: "التعبيرات والعمليات",
      },
      { title: "حل المعادلات الخطية" },
      { title: "المتراجحات" },
      { title: "كثيرات الحدود" },
      { title: "تقنيات التحليل" },
    ],
  },
  {
    slug: "geometry",
    title: "الهندسة",
    category: "Mathematics",
    image: "/courses/geometry.png",
    description:
      "استكشاف الأشكال والزوايا والعلاقات المكانية. تطوير التفكير المنطقي من خلال البراهين الهندسية.",
    chapters: [
      {
        title: "النقاط والخطوط والمستويات",
      },
      { title: "الزوايا والقياسات" },
      { title: "المثلثات والتطابق" },
      { title: "الأشكال الرباعية" },
      { title: "الدوائر" },
      { title: "المساحة والحجم" },
    ],
  },
  {
    slug: "2d-shapes",
    title: "الأشكال ثنائية الأبعاد",
    category: "Mathematics",
    image: "/courses/2d-shapes.png",
    description:
      "تعرف على الأشكال ثنائية الأبعاد وخصائصها وكيفية التعرف عليها في العالم من حولنا.",
    chapters: [
      { title: "الدوائر والأشكال البيضاوية" },
      { title: "المثلثات" },
      { title: "المربعات والمستطيلات" },
      { title: "المضلعات" },
      { title: "التماثل في الأشكال" },
    ],
  },
  {
    slug: "symmetry",
    title: "التماثل",
    category: "Mathematics",
    image: "/courses/symmetry.png",
    description:
      "اكتشف جمال التماثل في الرياضيات والطبيعة والفن. تعرف على التماثل الانعكاسي والدوراني.",
    chapters: [
      { title: "ما هو التماثل؟" },
      { title: "خطوط التماثل" },
      { title: "التماثل الدوراني" },
      { title: "التماثل في الطبيعة" },
      {
        title: "إنشاء أنماط متماثلة",
      },
    ],
  },
  {
    slug: "math-foundations",
    title: "أساسيات الرياضيات",
    category: "Mathematics",
    image: "/courses/math-foundations.png",
    description:
      "بناء أسس رياضية قوية مع الحس العددي والعمليات واستراتيجيات حل المشكلات.",
    chapters: [
      { title: "أنظمة الأعداد" },
      { title: "الجمع والطرح" },
      { title: "الضرب والقسمة" },
      { title: "الكسور والأعداد العشرية" },
      {
        title: "استراتيجيات حل المشكلات",
      },
      { title: "تقنيات الحساب الذهني" },
    ],
  },
  {
    slug: "data-and-information",
    title: "البيانات والمعلومات",
    category: "Mathematics",
    image: "/courses/data-and-information.png",
    description:
      "تعلم جمع البيانات وتنظيمها وتفسيرها. إنشاء الرسوم البيانية لتوصيل المعلومات بفعالية.",
    chapters: [
      { title: "جمع البيانات" },
      { title: "تنظيم المعلومات" },
      {
        title: "الرسوم البيانية الشريطية والصورية",
      },
      { title: "الرسوم البيانية الخطية" },
      { title: "تفسير البيانات" },
    ],
  },

  // ============================================
  // SCIENCES (12 courses)
  // ============================================
  {
    slug: "volcanoes",
    title: "البراكين",
    category: "Sciences",
    image: "/courses/volcanoes.png",
    description:
      "استكشف القوى الجبارة للبراكين. تعرف على كيفية تشكلها ولماذا تثور وتأثيرها على الأرض.",
    chapters: [
      { title: "ما هو البركان؟" },
      { title: "أنواع البراكين" },
      { title: "كيف تثور البراكين" },
      {
        title: "الانفجارات البركانية الشهيرة",
      },
      { title: "البراكين والبيئة" },
      { title: "العيش بالقرب من البراكين" },
    ],
  },
  {
    slug: "the-solar-system",
    title: "النظام الشمسي",
    category: "Sciences",
    image: "/courses/the-solar-system.png",
    description:
      "رحلة عبر نظامنا الشمسي. اكتشف الكواكب والأقمار والأجرام السماوية الأخرى التي تدور حول شمسنا.",
    chapters: [
      { title: "شمسنا" },
      { title: "الكواكب الداخلية" },
      { title: "الكواكب الخارجية" },
      { title: "الأقمار والكويكبات" },
      { title: "استكشاف الفضاء" },
    ],
  },
  {
    slug: "atoms-and-bonding",
    title: "الذرات والروابط",
    category: "Sciences",
    image: "/courses/atoms-and-bonding.png",
    description:
      "الغوص في عالم الذرات. فهم كيف ترتبط الذرات معاً لتشكل المادة من حولنا.",
    chapters: [
      { title: "بنية الذرة" },
      {
        title: "العناصر والجدول الدوري",
      },
      { title: "الروابط الأيونية" },
      { title: "الروابط التساهمية" },
      { title: "التفاعلات الكيميائية" },
    ],
  },
  {
    slug: "forces-and-motion",
    title: "القوى والحركة",
    category: "Sciences",
    image: "/courses/forces-and-motion.png",
    description:
      "اكتشف فيزياء الحركة. تعرف على القوى وقوانين نيوتن وكيف تتحرك الأجسام في عالمنا.",
    chapters: [
      { title: "ما هي القوة؟" },
      { title: "أنواع القوى" },
      { title: "قوانين نيوتن للحركة" },
      { title: "الجاذبية" },
      { title: "الاحتكاك" },
      { title: "الآلات البسيطة" },
    ],
  },
  {
    slug: "cellular-structure-and-function",
    title: "بنية الخلية ووظائفها",
    category: "Sciences",
    image: "/courses/cellular-structure-and-function.png",
    description:
      "استكشف اللبنات الأساسية للحياة. تعرف على بنية الخلية والعضيات وكيف تعمل الخلايا.",
    chapters: [
      { title: "مقدمة للخلايا" },
      { title: "غشاء الخلية وجدارها" },
      { title: "النواة والحمض النووي" },
      { title: "العضيات" },
      { title: "انقسام الخلية" },
    ],
  },
  {
    slug: "living-and-non-living-things",
    title: "الكائنات الحية وغير الحية",
    category: "Sciences",
    image: "/courses/living-and-non-living-things.png",
    description:
      "تعلم التمييز بين الكائنات الحية وغير الحية. اكتشف ما الذي يجعل شيئاً ما حياً.",
    chapters: [
      {
        title: "خصائص الكائنات الحية",
      },
      { title: "النباتات" },
      { title: "الحيوانات" },
      { title: "الأشياء غير الحية" },
      { title: "الأنظمة البيئية" },
    ],
  },
  {
    slug: "adaptations",
    title: "التكيفات",
    category: "Sciences",
    image: "/courses/adaptations.png",
    description:
      "اكتشف كيف تتكيف الحيوانات والنباتات للبقاء على قيد الحياة في بيئات مختلفة حول العالم.",
    chapters: [
      { title: "ما هي التكيفات؟" },
      { title: "التكيفات الجسدية" },
      { title: "التكيفات السلوكية" },
      { title: "تكيفات الصحراء" },
      { title: "تكيفات المحيط" },
      { title: "تكيفات القطب الشمالي" },
    ],
  },
  {
    slug: "weather-and-seasons",
    title: "الطقس والفصول",
    category: "Sciences",
    image: "/courses/weather-and-seasons.png",
    description:
      "فهم أنماط الطقس والتغيرات الموسمية. تعرف على أسباب أنواع الطقس المختلفة.",
    chapters: [
      { title: "ما هو الطقس؟" },
      { title: "دورة الماء" },
      { title: "أنواع الطقس" },
      { title: "الفصول الأربعة" },
      { title: "التنبؤ بالطقس" },
    ],
  },
  {
    slug: "climate-and-weather",
    title: "المناخ والطقس",
    category: "Sciences",
    image: "/courses/climate-and-weather.png",
    description:
      "استكشف الفرق بين المناخ والطقس. تعرف على المناطق المناخية وتغير المناخ.",
    chapters: [
      { title: "المناخ مقابل الطقس" },
      { title: "المناطق المناخية" },
      {
        title: "العوامل المؤثرة في المناخ",
      },
      { title: "تغير المناخ" },
      { title: "اتخاذ الإجراءات" },
    ],
  },
  {
    slug: "natural-resources",
    title: "الموارد الطبيعية",
    category: "Sciences",
    image: "/courses/natural-resources.png",
    description:
      "تعرف على الموارد الطبيعية للأرض. فهم الموارد المتجددة وغير المتجددة والحفاظ عليها.",
    chapters: [
      {
        title: "ما هي الموارد الطبيعية؟",
      },
      { title: "الموارد المتجددة" },
      { title: "الموارد غير المتجددة" },
      { title: "موارد المياه" },
      { title: "الحفاظ على البيئة" },
    ],
  },
  {
    slug: "bees",
    title: "النحل",
    category: "Sciences",
    image: "/courses/bees.png",
    description:
      "اكتشف عالم النحل الرائع. تعرف على أهميته للأنظمة البيئية وإنتاج الغذاء.",
    chapters: [
      { title: "حياة النحلة" },
      { title: "أنواع النحل" },
      { title: "الخلية" },
      { title: "التلقيح" },
      { title: "حماية النحل" },
    ],
  },
  {
    slug: "recycling",
    title: "إعادة التدوير",
    category: "Sciences",
    image: "/courses/recycling.png",
    description:
      "تعرف على إعادة التدوير وتقليل النفايات. اكتشف كيفية المساعدة في حماية بيئتنا.",
    chapters: [
      { title: "لماذا نعيد التدوير؟" },
      { title: "ما الذي يمكن إعادة تدويره" },
      { title: "عملية إعادة التدوير" },
      { title: "التقليل وإعادة الاستخدام" },
      { title: "التسميد" },
    ],
  },

  // ============================================
  // LANGUAGES & LITERATURE (8 courses)
  // ============================================
  {
    slug: "grammar",
    title: "القواعد النحوية",
    category: "Languages & Literature",
    image: "/courses/grammar.png",
    description:
      "إتقان قواعد النحو. تعرف على أجزاء الكلام وبنية الجملة وعلامات الترقيم.",
    chapters: [
      { title: "الأسماء والضمائر" },
      { title: "الأفعال والأزمنة" },
      { title: "الصفات والظروف" },
      { title: "بنية الجملة" },
      { title: "علامات الترقيم" },
      { title: "الأخطاء الشائعة" },
    ],
  },
  {
    slug: "literature",
    title: "الأدب",
    category: "Languages & Literature",
    image: "/courses/literature.png",
    description:
      "استكشف عالم الأدب. تعرف على الأنواع الأدبية والعناصر والأعمال الشهيرة.",
    chapters: [
      { title: "ما هو الأدب؟" },
      { title: "الخيال والواقع" },
      { title: "الشعر" },
      { title: "المسرح" },
      { title: "العناصر الأدبية" },
    ],
  },
  {
    slug: "characterization",
    title: "رسم الشخصيات",
    category: "Languages & Literature",
    image: "/courses/characterization.png",
    description:
      "فهم كيف يخلق المؤلفون شخصيات لا تُنسى. تعرف على التوصيف المباشر وغير المباشر.",
    chapters: [
      { title: "ما هو رسم الشخصيات؟" },
      { title: "التوصيف المباشر" },
      { title: "التوصيف غير المباشر" },
      { title: "تطور الشخصية" },
      { title: "تحليل الشخصيات" },
    ],
  },
  {
    slug: "alliteration-and-onomatopoeia",
    title: "الجناس والمحاكاة الصوتية",
    category: "Languages & Literature",
    image: "/courses/alliteration-and-onomatopoeia.png",
    description:
      "اكتشف الأدوات الصوتية في اللغة. تعرف على كيفية تعزيز الجناس والمحاكاة الصوتية للكتابة.",
    chapters: [
      { title: "ما هو الجناس؟" },
      { title: "أمثلة على الجناس" },
      { title: "ما هي المحاكاة الصوتية؟" },
      { title: "الكلمات الصوتية" },
      {
        title: "استخدام الصوت في الكتابة",
      },
    ],
  },
  {
    slug: "world-languages",
    title: "لغات العالم",
    category: "Languages & Literature",
    image: "/courses/world-languages.png",
    description:
      "استكشف تنوع لغات العالم. تعرف على عائلات اللغات والروابط الثقافية.",
    chapters: [
      { title: "عائلات اللغات" },
      { title: "أكثر اللغات انتشاراً" },
      { title: "أنظمة الكتابة" },
      { title: "اللغة والثقافة" },
      { title: "تعلم لغات جديدة" },
    ],
  },
  {
    slug: "book-week",
    title: "أسبوع الكتاب",
    category: "Languages & Literature",
    image: "/courses/book-week.png",
    description:
      "احتفل بمتعة القراءة. استكشف أنواعاً مختلفة واكتشف كتبك المفضلة الجديدة.",
    chapters: [
      { title: "متعة القراءة" },
      { title: "استكشاف الأنواع" },
      { title: "مؤلفون مشهورون" },
      { title: "توصيات الكتب" },
      { title: "كتابة قصتك الخاصة" },
    ],
  },
  {
    slug: "parts-of-the-body-and-five-senses",
    title: "أجزاء الجسم والحواس الخمس",
    category: "Languages & Literature",
    image: "/courses/parts-of-the-body-and-five-senses.png",
    description:
      "تعلم المفردات المتعلقة بأجزاء الجسم والحواس الخمس. مثالي للمتعلمين الأوائل للغة.",
    chapters: [
      { title: "الرأس والوجه" },
      { title: "أجزاء الجسم" },
      { title: "البصر والسمع" },
      { title: "اللمس والتذوق والشم" },
      { title: "استخدام حواسنا" },
    ],
  },
  {
    slug: "seasons",
    title: "الفصول",
    category: "Languages & Literature",
    image: "/courses/seasons.png",
    description:
      "استكشف مفردات ومفاهيم الفصول. تعرف على الفصول الأربعة وخصائصها.",
    chapters: [
      { title: "الربيع" },
      { title: "الصيف" },
      { title: "الخريف" },
      { title: "الشتاء" },
      { title: "الأنشطة الموسمية" },
    ],
  },

  // ============================================
  // SOCIAL STUDIES & HISTORY (10 courses)
  // ============================================
  {
    slug: "us-history",
    title: "تاريخ الولايات المتحدة",
    category: "Social Studies & History",
    image: "/courses/us-history.png",
    description:
      "رحلة عبر التاريخ الأمريكي من الاستعمار إلى العصر الحديث. استكشف الأحداث والشخصيات الرئيسية.",
    chapters: [
      { title: "أمريكا الاستعمارية" },
      { title: "الثورة الأمريكية" },
      { title: "التوسع الغربي" },
      { title: "الحرب الأهلية" },
      { title: "أمريكا الحديثة" },
    ],
  },
  {
    slug: "world-history",
    title: "التاريخ العالمي",
    category: "Social Studies & History",
    image: "/courses/world-history.png",
    description:
      "استكشف الأحداث الكبرى والحضارات التي شكلت عالمنا من العصور القديمة إلى اليوم.",
    chapters: [
      { title: "الحضارات القديمة" },
      { title: "العصور الوسطى" },
      {
        title: "عصر النهضة والإصلاح",
      },
      { title: "الحروب العالمية" },
      { title: "العالم الحديث" },
    ],
  },
  {
    slug: "civil-rights-movement",
    title: "حركة الحقوق المدنية",
    category: "Social Studies & History",
    image: "/courses/civil-rights-movement.png",
    description:
      "تعرف على النضال من أجل المساواة والعدالة. اكتشف الشخصيات والأحداث الرئيسية في عصر الحقوق المدنية.",
    chapters: [
      { title: "الكفاح من أجل المساواة" },
      { title: "القادة الرئيسيون" },
      { title: "الأحداث التاريخية" },
      { title: "التشريعات والتغيير" },
      {
        title: "الإرث والعمل المستمر",
      },
    ],
  },
  {
    slug: "the-united-states-as-a-nation",
    title: "الولايات المتحدة كدولة",
    category: "Social Studies & History",
    image: "/courses/the-united-states-as-a-nation.png",
    description:
      "فهم كيف تشكلت وتطورت الولايات المتحدة كدولة. تعرف على حكومتها ورموزها.",
    chapters: [
      { title: "تشكيل الأمة" },
      { title: "الدستور" },
      { title: "فروع الحكومة" },
      { title: "الرموز الوطنية" },
      { title: "المواطنة" },
    ],
  },
  {
    slug: "map-skills",
    title: "مهارات قراءة الخرائط",
    category: "Social Studies & History",
    image: "/courses/map-skills.png",
    description:
      "تعلم مهارات قراءة الخرائط الأساسية. فهم الرموز والمقاييس وكيفية التنقل باستخدام الخرائط.",
    chapters: [
      { title: "أنواع الخرائط" },
      { title: "رموز الخرائط ومفاتيحها" },
      { title: "المقياس والمسافة" },
      { title: "اتجاهات البوصلة" },
      { title: "قراءة الإحداثيات" },
    ],
  },
  {
    slug: "culture-and-society",
    title: "الثقافة والمجتمع",
    category: "Social Studies & History",
    image: "/courses/culture-and-society.png",
    description:
      "استكشف الثقافات والمجتمعات المتنوعة حول العالم. تعرف على التقاليد والعادات والقيم.",
    chapters: [
      { title: "ما هي الثقافة؟" },
      { title: "التقاليد والعادات" },
      { title: "العائلة والمجتمع" },
      {
        title: "الاحتفالات حول العالم",
      },
      { title: "التنوع الثقافي" },
    ],
  },
  {
    slug: "identity-and-community",
    title: "الهوية والمجتمع",
    category: "Social Studies & History",
    image: "/courses/identity-and-community.png",
    description:
      "فهم الهوية الشخصية والانتماء للمجتمع. استكشف ما يجعل كل شخص فريداً.",
    chapters: [
      { title: "فهم الهوية" },
      { title: "التراث العائلي" },
      { title: "أدوار المجتمع" },
      { title: "احترام الاختلافات" },
      { title: "بناء المجتمع" },
    ],
  },
  {
    slug: "rights-and-advocacy",
    title: "الحقوق والمناصرة",
    category: "Social Studies & History",
    image: "/courses/rights-and-advocacy.png",
    description:
      "تعرف على حقوق الإنسان وكيفية المناصرة من أجل التغيير الإيجابي في مجتمعك والعالم.",
    chapters: [
      { title: "ما هي الحقوق؟" },
      { title: "حقوق الإنسان" },
      { title: "حقوق الطفل" },
      { title: "أن تكون مناصراً" },
      { title: "إحداث فرق" },
    ],
  },
  {
    slug: "changemakers",
    title: "صناع التغيير",
    category: "Social Studies & History",
    image: "/courses/changemakers.png",
    description:
      "اكتشف صناع التغيير الملهمين الذين أحدثوا فرقاً. تعلم كيف يمكنك إحداث تغيير إيجابي.",
    chapters: [
      { title: "من هو صانع التغيير؟" },
      { title: "صناع التغيير التاريخيون" },
      { title: "صناع التغيير الشباب" },
      { title: "القادة البيئيون" },
      { title: "أن تصبح صانع تغيير" },
    ],
  },
  {
    slug: "veterans-day",
    title: "يوم المحاربين القدامى",
    category: "Social Studies & History",
    image: "/courses/veterans-day.png",
    description:
      "تكريم الذين خدموا في الجيش. تعرف على يوم المحاربين القدامى وأهميته.",
    chapters: [
      {
        title: "تاريخ يوم المحاربين القدامى",
      },
      { title: "من هم المحاربون القدامى؟" },
      { title: "تكريم الخدمة" },
      {
        title: "المحاربون القدامى في مجتمعنا",
      },
      { title: "طرق إظهار التقدير" },
    ],
  },

  // ============================================
  // HEALTH & WELLNESS (8 courses)
  // ============================================
  {
    slug: "physical-education",
    title: "التربية البدنية",
    category: "Health & Wellness",
    image: "/courses/physical-education.png",
    description:
      "تطوير اللياقة البدنية والمهارات الحركية. تعرف على الرياضة والتمارين والحياة الصحية.",
    chapters: [
      { title: "أساسيات اللياقة" },
      { title: "الرياضات الجماعية" },
      { title: "الرياضات الفردية" },
      { title: "المرونة والقوة" },
      { title: "العادات الصحية" },
    ],
  },
  {
    slug: "mental-and-emotional-wellbeing",
    title: "الصحة النفسية والعاطفية",
    category: "Health & Wellness",
    image: "/courses/mental-and-emotional-wellbeing.png",
    description:
      "تعلم فهم وإدارة المشاعر. تطوير استراتيجيات للصحة النفسية والعافية.",
    chapters: [
      { title: "فهم المشاعر" },
      { title: "إدارة التوتر" },
      { title: "بناء تقدير الذات" },
      { title: "اليقظة الذهنية" },
      { title: "طلب المساعدة" },
    ],
  },
  {
    slug: "healthy-lifestyle",
    title: "نمط الحياة الصحي",
    category: "Health & Wellness",
    image: "/courses/healthy-lifestyle.png",
    description:
      "بناء عادات لحياة صحية. تعرف على التغذية والنوم والعيش المتوازن.",
    chapters: [
      { title: "أساسيات التغذية" },
      { title: "أهمية النوم" },
      { title: "البقاء نشيطاً" },
      { title: "النظافة الشخصية" },
      { title: "التوازن في الحياة" },
    ],
  },
  {
    slug: "resilience",
    title: "المرونة",
    category: "Health & Wellness",
    image: "/courses/resilience.png",
    description:
      "تطوير القدرة على التعافي من التحديات. تعلم استراتيجيات بناء المرونة.",
    chapters: [
      { title: "ما هي المرونة؟" },
      { title: "مواجهة التحديات" },
      { title: "عقلية النمو" },
      { title: "التعلم من الفشل" },
      { title: "بناء القوة الداخلية" },
    ],
  },
  {
    slug: "friendship",
    title: "الصداقة",
    category: "Health & Wellness",
    image: "/courses/friendship.png",
    description:
      "تعرف على بناء صداقات صحية والحفاظ عليها. تطوير المهارات الاجتماعية والتعاطف.",
    chapters: [
      {
        title: "ما الذي يجعل صديقاً جيداً؟",
      },
      { title: "تكوين الصداقات" },
      { title: "أن تكون صديقاً جيداً" },
      { title: "حل النزاعات" },
      { title: "الصداقات عبر الإنترنت" },
    ],
  },
  {
    slug: "bullying",
    title: "التنمر",
    category: "Health & Wellness",
    image: "/courses/bullying.png",
    description: "فهم التنمر ومنعه. تعلم استراتيجيات للوقوف ضد سلوك التنمر.",
    chapters: [
      { title: "ما هو التنمر؟" },
      { title: "أنواع التنمر" },
      { title: "التنمر الإلكتروني" },
      { title: "الوقوف في وجه المتنمرين" },
      { title: "الحصول على المساعدة" },
    ],
  },
  {
    slug: "decision-making",
    title: "اتخاذ القرارات",
    category: "Health & Wellness",
    image: "/courses/decision-making.png",
    description:
      "تطوير مهارات التفكير النقدي واتخاذ القرارات. تعلم اتخاذ خيارات مسؤولة.",
    chapters: [
      { title: "عملية اتخاذ القرار" },
      { title: "الموازنة بين الخيارات" },
      { title: "التفكير في العواقب" },
      { title: "ضغط الأقران" },
      { title: "اتخاذ خيارات مسؤولة" },
    ],
  },
  {
    slug: "national-fitness-day",
    title: "يوم اللياقة الوطني",
    category: "Health & Wellness",
    image: "/courses/national-fitness-day.png",
    description:
      "احتفل باللياقة البدنية والحياة النشطة. تعلم طرقاً ممتعة للبقاء لائقاً وصحياً.",
    chapters: [
      { title: "ما هي اللياقة؟" },
      { title: "أنشطة لياقة ممتعة" },
      { title: "تحديد أهداف اللياقة" },
      { title: "لياقة العائلة" },
      { title: "البقاء متحمساً" },
    ],
  },

  // ============================================
  // ARTS & MEDIA (6 courses)
  // ============================================
  {
    slug: "visual-arts",
    title: "الفنون البصرية",
    category: "Arts & Media",
    image: "/courses/visual-arts.png",
    description:
      "استكشف الرسم والتلوين والفنون البصرية الأخرى. تطوير الإبداع والتعبير الفني.",
    chapters: [
      { title: "عناصر الفن" },
      { title: "تقنيات الرسم" },
      { title: "الرسم بالألوان" },
      { title: "النحت" },
      { title: "تذوق الفن" },
    ],
  },
  {
    slug: "music",
    title: "الموسيقى",
    category: "Arts & Media",
    image: "/courses/music.png",
    description:
      "اكتشف عالم الموسيقى. تعرف على الإيقاع واللحن والأنواع الموسيقية المختلفة.",
    chapters: [
      { title: "الإيقاع والنبضة" },
      { title: "اللحن والتناغم" },
      { title: "الآلات الموسيقية" },
      { title: "أنواع الموسيقى" },
      { title: "إنشاء الموسيقى" },
    ],
  },
  {
    slug: "drama-and-theater",
    title: "الدراما والمسرح",
    category: "Arts & Media",
    image: "/courses/drama-and-theater.png",
    description:
      "استكشف الفنون الأدائية. تعرف على التمثيل وفن المسرح والإنتاج المسرحي.",
    chapters: [
      { title: "مقدمة للدراما" },
      { title: "أساسيات التمثيل" },
      { title: "فن المسرح" },
      { title: "كتابة السيناريو" },
      { title: "الأداء" },
    ],
  },
  {
    slug: "video-production",
    title: "إنتاج الفيديو",
    category: "Arts & Media",
    image: "/courses/video-production.png",
    description:
      "تعلم أساسيات إنتاج الفيديو. أنشئ مقاطع الفيديو الخاصة بك من التخطيط إلى التحرير.",
    chapters: [
      { title: "تخطيط الفيديو الخاص بك" },
      { title: "أساسيات الكاميرا" },
      { title: "الإضاءة والصوت" },
      { title: "تحرير الفيديو" },
      { title: "مشاركة عملك" },
    ],
  },
  {
    slug: "media-literacy",
    title: "محو الأمية الإعلامية",
    category: "Arts & Media",
    image: "/courses/media-literacy.png",
    description:
      "تطوير التفكير النقدي حول الإعلام. تعلم تحليل وتقييم الرسائل الإعلامية.",
    chapters: [
      { title: "ما هو الإعلام؟" },
      { title: "أنواع الإعلام" },
      { title: "تحليل الرسائل" },
      {
        title: "الأخبار الكاذبة والمعلومات المضللة",
      },
      { title: "كن مستهلكاً ذكياً" },
    ],
  },
  {
    slug: "thanksgiving",
    title: "عيد الشكر",
    category: "Arts & Media",
    image: "/courses/thanksgiving.png",
    description: "تعرف على تقاليد وتاريخ عيد الشكر. استكشف معنى الامتنان.",
    chapters: [
      { title: "تاريخ عيد الشكر" },
      { title: "تقاليد عيد الشكر" },
      { title: "معنى الامتنان" },
      { title: "حرف عيد الشكر" },
      { title: "رد الجميل" },
    ],
  },

  // ============================================
  // TECHNOLOGY & COMPUTING (6 courses)
  // ============================================
  {
    slug: "coding-and-computer-programming",
    title: "البرمجة وبرمجة الحاسوب",
    category: "Technology & Computing",
    image: "/courses/coding-and-computer-programming.png",
    description:
      "ابدأ رحلتك في البرمجة. تعلم أساسيات البرمجة والتفكير الحسابي.",
    chapters: [
      { title: "ما هي البرمجة؟" },
      { title: "التسلسلات والحلقات" },
      { title: "الشروط" },
      { title: "المتغيرات" },
      { title: "تصحيح الأخطاء" },
      { title: "إنشاء المشاريع" },
    ],
  },
  {
    slug: "programming-and-coding",
    title: "البرمجة والترميز",
    category: "Technology & Computing",
    image: "/courses/programming-and-coding.png",
    description: "طور مهاراتك البرمجية. بناء برامج وتطبيقات أكثر تعقيداً.",
    chapters: [
      { title: "لغات البرمجة" },
      { title: "الدوال" },
      { title: "هياكل البيانات" },
      { title: "الخوارزميات" },
      { title: "تطوير المشاريع" },
    ],
  },
  {
    slug: "digital-citizenship",
    title: "المواطنة الرقمية",
    category: "Technology & Computing",
    image: "/courses/digital-citizenship.png",
    description:
      "كن مواطناً رقمياً مسؤولاً. تعرف على السلامة عبر الإنترنت والخصوصية والآداب الرقمية.",
    chapters: [
      { title: "السلامة عبر الإنترنت" },
      { title: "الخصوصية والأمان" },
      { title: "البصمة الرقمية" },
      { title: "التواصل المحترم" },
      { title: "محو الأمية المعلوماتية" },
    ],
  },
  {
    slug: "study-skills",
    title: "مهارات الدراسة",
    category: "Technology & Computing",
    image: "/courses/study-skills.png",
    description: "تطوير عادات وتقنيات دراسية فعالة. تعلم تنظيم وإدارة تعلمك.",
    chapters: [
      { title: "إدارة الوقت" },
      { title: "تدوين الملاحظات" },
      { title: "استراتيجيات القراءة" },
      { title: "تقنيات الذاكرة" },
      { title: "التحضير للاختبارات" },
    ],
  },
  {
    slug: "career-and-technical-education",
    title: "التعليم المهني والتقني",
    category: "Technology & Computing",
    image: "/courses/career-and-technical-education.png",
    description: "استكشف المسارات المهنية وطور المهارات العملية لمكان العمل.",
    chapters: [
      { title: "استكشاف المهن" },
      { title: "مهارات مكان العمل" },
      { title: "مهارات التواصل" },
      { title: "حل المشكلات" },
      { title: "التخطيط لمستقبلك" },
    ],
  },
  {
    slug: "business",
    title: "الأعمال",
    category: "Technology & Computing",
    image: "/courses/business.png",
    description:
      "تعلم مفاهيم الأعمال الأساسية. فهم ريادة الأعمال وكيف تعمل الشركات.",
    chapters: [
      { title: "ما هي الأعمال؟" },
      { title: "ريادة الأعمال" },
      { title: "إدارة المال" },
      { title: "أساسيات التسويق" },
      { title: "بدء عمل تجاري" },
    ],
  },

  // ============================================
  // LIFE SKILLS (3 courses)
  // ============================================
  {
    slug: "world-religions",
    title: "الأديان العالمية",
    category: "Life Skills",
    image: "/courses/world-religions.png",
    description:
      "استكشف الأديان العالمية الرئيسية. تعرف على المعتقدات والممارسات والتقاليد الثقافية.",
    chapters: [
      {
        title: "مقدمة للأديان العالمية",
      },
      { title: "المسيحية" },
      { title: "الإسلام" },
      { title: "اليهودية" },
      { title: "الأديان الشرقية" },
      { title: "التسامح الديني" },
    ],
  },
  {
    slug: "psychology",
    title: "علم النفس",
    category: "Life Skills",
    image: "/courses/psychology.png",
    description: "مقدمة في علم النفس. فهم السلوك البشري والأفكار والعواطف.",
    chapters: [
      { title: "ما هو علم النفس؟" },
      { title: "الدماغ" },
      { title: "التعلم والذاكرة" },
      { title: "العواطف" },
      { title: "علم النفس الاجتماعي" },
    ],
  },
  {
    slug: "teacher-professional-development",
    title: "التطوير المهني للمعلمين",
    category: "Life Skills",
    image: "/courses/teacher-professional-development.png",
    description:
      "موارد لنمو المعلمين. تعلم استراتيجيات التدريس الجديدة وأفضل الممارسات.",
    chapters: [
      {
        title: "استراتيجيات التدريس الفعالة",
      },
      { title: "إدارة الصف" },
      { title: "التكنولوجيا في التعليم" },
      { title: "طرق التقييم" },
      { title: "مشاركة الطلاب" },
    ],
  },
]
