/**
 * ClickView Educational Courses Data
 *
 * 59 K-12 courses with bilingual support (English + Arabic)
 * Each course has 5-8 chapters organized by educational topic
 *
 * Source: ClickView Education (clickvieweducation.com)
 */

export interface CourseChapter {
  titleEn: string
  titleAr: string
}

export interface CourseData {
  slug: string
  titleEn: string
  titleAr: string
  category: string
  categoryAr: string
  image: string
  descriptionEn: string
  descriptionAr: string
  chapters: CourseChapter[]
}

export const STREAM_CATEGORIES = [
  { nameEn: "Mathematics", nameAr: "الرياضيات" },
  { nameEn: "Sciences", nameAr: "العلوم" },
  { nameEn: "Languages & Literature", nameAr: "اللغات والأدب" },
  {
    nameEn: "Social Studies & History",
    nameAr: "الدراسات الاجتماعية والتاريخ",
  },
  { nameEn: "Health & Wellness", nameAr: "الصحة والعافية" },
  { nameEn: "Arts & Media", nameAr: "الفنون والإعلام" },
  { nameEn: "Technology & Computing", nameAr: "التكنولوجيا والحوسبة" },
  { nameEn: "Life Skills", nameAr: "المهارات الحياتية" },
] as const

export const CLICKVIEW_COURSES: CourseData[] = [
  // ============================================
  // MATHEMATICS (6 courses)
  // ============================================
  {
    slug: "algebra",
    titleEn: "Algebra",
    titleAr: "الجبر",
    category: "Mathematics",
    categoryAr: "الرياضيات",
    image: "/courses/algebra.png",
    descriptionEn:
      "Master algebraic concepts from variables to equations. Build problem-solving skills essential for advanced mathematics.",
    descriptionAr:
      "إتقان مفاهيم الجبر من المتغيرات إلى المعادلات. بناء مهارات حل المشكلات الأساسية للرياضيات المتقدمة.",
    chapters: [
      { titleEn: "Introduction to Variables", titleAr: "مقدمة للمتغيرات" },
      {
        titleEn: "Expressions and Operations",
        titleAr: "التعبيرات والعمليات",
      },
      { titleEn: "Solving Linear Equations", titleAr: "حل المعادلات الخطية" },
      { titleEn: "Inequalities", titleAr: "المتراجحات" },
      { titleEn: "Polynomials", titleAr: "كثيرات الحدود" },
      { titleEn: "Factoring Techniques", titleAr: "تقنيات التحليل" },
    ],
  },
  {
    slug: "geometry",
    titleEn: "Geometry",
    titleAr: "الهندسة",
    category: "Mathematics",
    categoryAr: "الرياضيات",
    image: "/courses/geometry.png",
    descriptionEn:
      "Explore shapes, angles, and spatial relationships. Develop logical reasoning through geometric proofs.",
    descriptionAr:
      "استكشاف الأشكال والزوايا والعلاقات المكانية. تطوير التفكير المنطقي من خلال البراهين الهندسية.",
    chapters: [
      {
        titleEn: "Points, Lines, and Planes",
        titleAr: "النقاط والخطوط والمستويات",
      },
      { titleEn: "Angles and Measurements", titleAr: "الزوايا والقياسات" },
      { titleEn: "Triangles and Congruence", titleAr: "المثلثات والتطابق" },
      { titleEn: "Quadrilaterals", titleAr: "الأشكال الرباعية" },
      { titleEn: "Circles", titleAr: "الدوائر" },
      { titleEn: "Area and Volume", titleAr: "المساحة والحجم" },
    ],
  },
  {
    slug: "2d-shapes",
    titleEn: "2D Shapes",
    titleAr: "الأشكال ثنائية الأبعاد",
    category: "Mathematics",
    categoryAr: "الرياضيات",
    image: "/courses/2d-shapes.png",
    descriptionEn:
      "Learn about two-dimensional shapes, their properties, and how to identify them in the world around us.",
    descriptionAr:
      "تعرف على الأشكال ثنائية الأبعاد وخصائصها وكيفية التعرف عليها في العالم من حولنا.",
    chapters: [
      { titleEn: "Circles and Ovals", titleAr: "الدوائر والأشكال البيضاوية" },
      { titleEn: "Triangles", titleAr: "المثلثات" },
      { titleEn: "Squares and Rectangles", titleAr: "المربعات والمستطيلات" },
      { titleEn: "Polygons", titleAr: "المضلعات" },
      { titleEn: "Symmetry in Shapes", titleAr: "التماثل في الأشكال" },
    ],
  },
  {
    slug: "symmetry",
    titleEn: "Symmetry",
    titleAr: "التماثل",
    category: "Mathematics",
    categoryAr: "الرياضيات",
    image: "/courses/symmetry.png",
    descriptionEn:
      "Discover the beauty of symmetry in mathematics, nature, and art. Learn about reflective and rotational symmetry.",
    descriptionAr:
      "اكتشف جمال التماثل في الرياضيات والطبيعة والفن. تعرف على التماثل الانعكاسي والدوراني.",
    chapters: [
      { titleEn: "What is Symmetry?", titleAr: "ما هو التماثل؟" },
      { titleEn: "Lines of Symmetry", titleAr: "خطوط التماثل" },
      { titleEn: "Rotational Symmetry", titleAr: "التماثل الدوراني" },
      { titleEn: "Symmetry in Nature", titleAr: "التماثل في الطبيعة" },
      {
        titleEn: "Creating Symmetric Patterns",
        titleAr: "إنشاء أنماط متماثلة",
      },
    ],
  },
  {
    slug: "math-foundations",
    titleEn: "Math Foundations",
    titleAr: "أساسيات الرياضيات",
    category: "Mathematics",
    categoryAr: "الرياضيات",
    image: "/courses/math-foundations.png",
    descriptionEn:
      "Build strong mathematical foundations with number sense, operations, and problem-solving strategies.",
    descriptionAr:
      "بناء أسس رياضية قوية مع الحس العددي والعمليات واستراتيجيات حل المشكلات.",
    chapters: [
      { titleEn: "Number Systems", titleAr: "أنظمة الأعداد" },
      { titleEn: "Addition and Subtraction", titleAr: "الجمع والطرح" },
      { titleEn: "Multiplication and Division", titleAr: "الضرب والقسمة" },
      { titleEn: "Fractions and Decimals", titleAr: "الكسور والأعداد العشرية" },
      {
        titleEn: "Problem Solving Strategies",
        titleAr: "استراتيجيات حل المشكلات",
      },
      { titleEn: "Mental Math Techniques", titleAr: "تقنيات الحساب الذهني" },
    ],
  },
  {
    slug: "data-and-information",
    titleEn: "Data and Information",
    titleAr: "البيانات والمعلومات",
    category: "Mathematics",
    categoryAr: "الرياضيات",
    image: "/courses/data-and-information.png",
    descriptionEn:
      "Learn to collect, organize, and interpret data. Create graphs and charts to communicate information effectively.",
    descriptionAr:
      "تعلم جمع البيانات وتنظيمها وتفسيرها. إنشاء الرسوم البيانية لتوصيل المعلومات بفعالية.",
    chapters: [
      { titleEn: "Collecting Data", titleAr: "جمع البيانات" },
      { titleEn: "Organizing Information", titleAr: "تنظيم المعلومات" },
      {
        titleEn: "Bar Graphs and Pictographs",
        titleAr: "الرسوم البيانية الشريطية والصورية",
      },
      { titleEn: "Line Graphs", titleAr: "الرسوم البيانية الخطية" },
      { titleEn: "Interpreting Data", titleAr: "تفسير البيانات" },
    ],
  },

  // ============================================
  // SCIENCES (12 courses)
  // ============================================
  {
    slug: "volcanoes",
    titleEn: "Volcanoes",
    titleAr: "البراكين",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/volcanoes.png",
    descriptionEn:
      "Explore the powerful forces of volcanoes. Learn how they form, why they erupt, and their impact on Earth.",
    descriptionAr:
      "استكشف القوى الجبارة للبراكين. تعرف على كيفية تشكلها ولماذا تثور وتأثيرها على الأرض.",
    chapters: [
      { titleEn: "What is a Volcano?", titleAr: "ما هو البركان؟" },
      { titleEn: "Types of Volcanoes", titleAr: "أنواع البراكين" },
      { titleEn: "How Volcanoes Erupt", titleAr: "كيف تثور البراكين" },
      {
        titleEn: "Famous Volcanic Eruptions",
        titleAr: "الانفجارات البركانية الشهيرة",
      },
      { titleEn: "Volcanoes and the Environment", titleAr: "البراكين والبيئة" },
      { titleEn: "Living Near Volcanoes", titleAr: "العيش بالقرب من البراكين" },
    ],
  },
  {
    slug: "the-solar-system",
    titleEn: "The Solar System",
    titleAr: "النظام الشمسي",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/the-solar-system.png",
    descriptionEn:
      "Journey through our solar system. Discover the planets, moons, and other celestial bodies that orbit our Sun.",
    descriptionAr:
      "رحلة عبر نظامنا الشمسي. اكتشف الكواكب والأقمار والأجرام السماوية الأخرى التي تدور حول شمسنا.",
    chapters: [
      { titleEn: "Our Sun", titleAr: "شمسنا" },
      { titleEn: "The Inner Planets", titleAr: "الكواكب الداخلية" },
      { titleEn: "The Outer Planets", titleAr: "الكواكب الخارجية" },
      { titleEn: "Moons and Asteroids", titleAr: "الأقمار والكويكبات" },
      { titleEn: "Space Exploration", titleAr: "استكشاف الفضاء" },
    ],
  },
  {
    slug: "atoms-and-bonding",
    titleEn: "Atoms and Bonding",
    titleAr: "الذرات والروابط",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/atoms-and-bonding.png",
    descriptionEn:
      "Dive into the atomic world. Understand how atoms bond together to form the matter around us.",
    descriptionAr:
      "الغوص في عالم الذرات. فهم كيف ترتبط الذرات معاً لتشكل المادة من حولنا.",
    chapters: [
      { titleEn: "Structure of an Atom", titleAr: "بنية الذرة" },
      {
        titleEn: "Elements and the Periodic Table",
        titleAr: "العناصر والجدول الدوري",
      },
      { titleEn: "Ionic Bonds", titleAr: "الروابط الأيونية" },
      { titleEn: "Covalent Bonds", titleAr: "الروابط التساهمية" },
      { titleEn: "Chemical Reactions", titleAr: "التفاعلات الكيميائية" },
    ],
  },
  {
    slug: "forces-and-motion",
    titleEn: "Forces and Motion",
    titleAr: "القوى والحركة",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/forces-and-motion.png",
    descriptionEn:
      "Discover the physics of motion. Learn about forces, Newton's laws, and how objects move in our world.",
    descriptionAr:
      "اكتشف فيزياء الحركة. تعرف على القوى وقوانين نيوتن وكيف تتحرك الأجسام في عالمنا.",
    chapters: [
      { titleEn: "What is Force?", titleAr: "ما هي القوة؟" },
      { titleEn: "Types of Forces", titleAr: "أنواع القوى" },
      { titleEn: "Newton's Laws of Motion", titleAr: "قوانين نيوتن للحركة" },
      { titleEn: "Gravity", titleAr: "الجاذبية" },
      { titleEn: "Friction", titleAr: "الاحتكاك" },
      { titleEn: "Simple Machines", titleAr: "الآلات البسيطة" },
    ],
  },
  {
    slug: "cellular-structure-and-function",
    titleEn: "Cellular Structure and Function",
    titleAr: "بنية الخلية ووظائفها",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/cellular-structure-and-function.png",
    descriptionEn:
      "Explore the building blocks of life. Learn about cell structure, organelles, and how cells function.",
    descriptionAr:
      "استكشف اللبنات الأساسية للحياة. تعرف على بنية الخلية والعضيات وكيف تعمل الخلايا.",
    chapters: [
      { titleEn: "Introduction to Cells", titleAr: "مقدمة للخلايا" },
      { titleEn: "Cell Membrane and Wall", titleAr: "غشاء الخلية وجدارها" },
      { titleEn: "Nucleus and DNA", titleAr: "النواة والحمض النووي" },
      { titleEn: "Organelles", titleAr: "العضيات" },
      { titleEn: "Cell Division", titleAr: "انقسام الخلية" },
    ],
  },
  {
    slug: "living-and-non-living-things",
    titleEn: "Living and Non-Living Things",
    titleAr: "الكائنات الحية وغير الحية",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/living-and-non-living-things.png",
    descriptionEn:
      "Learn to distinguish between living and non-living things. Discover what makes something alive.",
    descriptionAr:
      "تعلم التمييز بين الكائنات الحية وغير الحية. اكتشف ما الذي يجعل شيئاً ما حياً.",
    chapters: [
      {
        titleEn: "Characteristics of Living Things",
        titleAr: "خصائص الكائنات الحية",
      },
      { titleEn: "Plants", titleAr: "النباتات" },
      { titleEn: "Animals", titleAr: "الحيوانات" },
      { titleEn: "Non-Living Things", titleAr: "الأشياء غير الحية" },
      { titleEn: "Ecosystems", titleAr: "الأنظمة البيئية" },
    ],
  },
  {
    slug: "adaptations",
    titleEn: "Adaptations",
    titleAr: "التكيفات",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/adaptations.png",
    descriptionEn:
      "Discover how animals and plants adapt to survive in different environments around the world.",
    descriptionAr:
      "اكتشف كيف تتكيف الحيوانات والنباتات للبقاء على قيد الحياة في بيئات مختلفة حول العالم.",
    chapters: [
      { titleEn: "What are Adaptations?", titleAr: "ما هي التكيفات؟" },
      { titleEn: "Physical Adaptations", titleAr: "التكيفات الجسدية" },
      { titleEn: "Behavioral Adaptations", titleAr: "التكيفات السلوكية" },
      { titleEn: "Desert Adaptations", titleAr: "تكيفات الصحراء" },
      { titleEn: "Ocean Adaptations", titleAr: "تكيفات المحيط" },
      { titleEn: "Arctic Adaptations", titleAr: "تكيفات القطب الشمالي" },
    ],
  },
  {
    slug: "weather-and-seasons",
    titleEn: "Weather and Seasons",
    titleAr: "الطقس والفصول",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/weather-and-seasons.png",
    descriptionEn:
      "Understand weather patterns and seasonal changes. Learn what causes different types of weather.",
    descriptionAr:
      "فهم أنماط الطقس والتغيرات الموسمية. تعرف على أسباب أنواع الطقس المختلفة.",
    chapters: [
      { titleEn: "What is Weather?", titleAr: "ما هو الطقس؟" },
      { titleEn: "The Water Cycle", titleAr: "دورة الماء" },
      { titleEn: "Types of Weather", titleAr: "أنواع الطقس" },
      { titleEn: "The Four Seasons", titleAr: "الفصول الأربعة" },
      { titleEn: "Weather Forecasting", titleAr: "التنبؤ بالطقس" },
    ],
  },
  {
    slug: "climate-and-weather",
    titleEn: "Climate and Weather",
    titleAr: "المناخ والطقس",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/climate-and-weather.png",
    descriptionEn:
      "Explore the difference between climate and weather. Learn about climate zones and climate change.",
    descriptionAr:
      "استكشف الفرق بين المناخ والطقس. تعرف على المناطق المناخية وتغير المناخ.",
    chapters: [
      { titleEn: "Climate vs Weather", titleAr: "المناخ مقابل الطقس" },
      { titleEn: "Climate Zones", titleAr: "المناطق المناخية" },
      {
        titleEn: "Factors Affecting Climate",
        titleAr: "العوامل المؤثرة في المناخ",
      },
      { titleEn: "Climate Change", titleAr: "تغير المناخ" },
      { titleEn: "Taking Action", titleAr: "اتخاذ الإجراءات" },
    ],
  },
  {
    slug: "natural-resources",
    titleEn: "Natural Resources",
    titleAr: "الموارد الطبيعية",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/natural-resources.png",
    descriptionEn:
      "Learn about Earth's natural resources. Understand renewable and non-renewable resources and conservation.",
    descriptionAr:
      "تعرف على الموارد الطبيعية للأرض. فهم الموارد المتجددة وغير المتجددة والحفاظ عليها.",
    chapters: [
      {
        titleEn: "What are Natural Resources?",
        titleAr: "ما هي الموارد الطبيعية؟",
      },
      { titleEn: "Renewable Resources", titleAr: "الموارد المتجددة" },
      { titleEn: "Non-Renewable Resources", titleAr: "الموارد غير المتجددة" },
      { titleEn: "Water Resources", titleAr: "موارد المياه" },
      { titleEn: "Conservation", titleAr: "الحفاظ على البيئة" },
    ],
  },
  {
    slug: "bees",
    titleEn: "Bees",
    titleAr: "النحل",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/bees.png",
    descriptionEn:
      "Discover the fascinating world of bees. Learn about their importance to ecosystems and food production.",
    descriptionAr:
      "اكتشف عالم النحل الرائع. تعرف على أهميته للأنظمة البيئية وإنتاج الغذاء.",
    chapters: [
      { titleEn: "The Life of a Bee", titleAr: "حياة النحلة" },
      { titleEn: "Types of Bees", titleAr: "أنواع النحل" },
      { titleEn: "The Hive", titleAr: "الخلية" },
      { titleEn: "Pollination", titleAr: "التلقيح" },
      { titleEn: "Protecting Bees", titleAr: "حماية النحل" },
    ],
  },
  {
    slug: "recycling",
    titleEn: "Recycling",
    titleAr: "إعادة التدوير",
    category: "Sciences",
    categoryAr: "العلوم",
    image: "/courses/recycling.png",
    descriptionEn:
      "Learn about recycling and waste reduction. Discover how to help protect our environment.",
    descriptionAr:
      "تعرف على إعادة التدوير وتقليل النفايات. اكتشف كيفية المساعدة في حماية بيئتنا.",
    chapters: [
      { titleEn: "Why Recycle?", titleAr: "لماذا نعيد التدوير؟" },
      { titleEn: "What Can Be Recycled", titleAr: "ما الذي يمكن إعادة تدويره" },
      { titleEn: "The Recycling Process", titleAr: "عملية إعادة التدوير" },
      { titleEn: "Reduce and Reuse", titleAr: "التقليل وإعادة الاستخدام" },
      { titleEn: "Composting", titleAr: "التسميد" },
    ],
  },

  // ============================================
  // LANGUAGES & LITERATURE (8 courses)
  // ============================================
  {
    slug: "grammar",
    titleEn: "Grammar",
    titleAr: "القواعد النحوية",
    category: "Languages & Literature",
    categoryAr: "اللغات والأدب",
    image: "/courses/grammar.png",
    descriptionEn:
      "Master the rules of grammar. Learn about parts of speech, sentence structure, and punctuation.",
    descriptionAr:
      "إتقان قواعد النحو. تعرف على أجزاء الكلام وبنية الجملة وعلامات الترقيم.",
    chapters: [
      { titleEn: "Nouns and Pronouns", titleAr: "الأسماء والضمائر" },
      { titleEn: "Verbs and Tenses", titleAr: "الأفعال والأزمنة" },
      { titleEn: "Adjectives and Adverbs", titleAr: "الصفات والظروف" },
      { titleEn: "Sentence Structure", titleAr: "بنية الجملة" },
      { titleEn: "Punctuation", titleAr: "علامات الترقيم" },
      { titleEn: "Common Mistakes", titleAr: "الأخطاء الشائعة" },
    ],
  },
  {
    slug: "literature",
    titleEn: "Literature",
    titleAr: "الأدب",
    category: "Languages & Literature",
    categoryAr: "اللغات والأدب",
    image: "/courses/literature.png",
    descriptionEn:
      "Explore the world of literature. Learn about literary genres, elements, and famous works.",
    descriptionAr:
      "استكشف عالم الأدب. تعرف على الأنواع الأدبية والعناصر والأعمال الشهيرة.",
    chapters: [
      { titleEn: "What is Literature?", titleAr: "ما هو الأدب؟" },
      { titleEn: "Fiction and Non-Fiction", titleAr: "الخيال والواقع" },
      { titleEn: "Poetry", titleAr: "الشعر" },
      { titleEn: "Drama", titleAr: "المسرح" },
      { titleEn: "Literary Elements", titleAr: "العناصر الأدبية" },
    ],
  },
  {
    slug: "characterization",
    titleEn: "Characterization",
    titleAr: "رسم الشخصيات",
    category: "Languages & Literature",
    categoryAr: "اللغات والأدب",
    image: "/courses/characterization.png",
    descriptionEn:
      "Understand how authors create memorable characters. Learn about direct and indirect characterization.",
    descriptionAr:
      "فهم كيف يخلق المؤلفون شخصيات لا تُنسى. تعرف على التوصيف المباشر وغير المباشر.",
    chapters: [
      { titleEn: "What is Characterization?", titleAr: "ما هو رسم الشخصيات؟" },
      { titleEn: "Direct Characterization", titleAr: "التوصيف المباشر" },
      { titleEn: "Indirect Characterization", titleAr: "التوصيف غير المباشر" },
      { titleEn: "Character Development", titleAr: "تطور الشخصية" },
      { titleEn: "Analyzing Characters", titleAr: "تحليل الشخصيات" },
    ],
  },
  {
    slug: "alliteration-and-onomatopoeia",
    titleEn: "Alliteration and Onomatopoeia",
    titleAr: "الجناس والمحاكاة الصوتية",
    category: "Languages & Literature",
    categoryAr: "اللغات والأدب",
    image: "/courses/alliteration-and-onomatopoeia.png",
    descriptionEn:
      "Discover sound devices in language. Learn how alliteration and onomatopoeia enhance writing.",
    descriptionAr:
      "اكتشف الأدوات الصوتية في اللغة. تعرف على كيفية تعزيز الجناس والمحاكاة الصوتية للكتابة.",
    chapters: [
      { titleEn: "What is Alliteration?", titleAr: "ما هو الجناس؟" },
      { titleEn: "Examples of Alliteration", titleAr: "أمثلة على الجناس" },
      { titleEn: "What is Onomatopoeia?", titleAr: "ما هي المحاكاة الصوتية؟" },
      { titleEn: "Sound Words", titleAr: "الكلمات الصوتية" },
      {
        titleEn: "Using Sound in Writing",
        titleAr: "استخدام الصوت في الكتابة",
      },
    ],
  },
  {
    slug: "world-languages",
    titleEn: "World Languages",
    titleAr: "لغات العالم",
    category: "Languages & Literature",
    categoryAr: "اللغات والأدب",
    image: "/courses/world-languages.png",
    descriptionEn:
      "Explore the diversity of world languages. Learn about language families and cultural connections.",
    descriptionAr:
      "استكشف تنوع لغات العالم. تعرف على عائلات اللغات والروابط الثقافية.",
    chapters: [
      { titleEn: "Language Families", titleAr: "عائلات اللغات" },
      { titleEn: "Most Spoken Languages", titleAr: "أكثر اللغات انتشاراً" },
      { titleEn: "Writing Systems", titleAr: "أنظمة الكتابة" },
      { titleEn: "Language and Culture", titleAr: "اللغة والثقافة" },
      { titleEn: "Learning New Languages", titleAr: "تعلم لغات جديدة" },
    ],
  },
  {
    slug: "book-week",
    titleEn: "Book Week",
    titleAr: "أسبوع الكتاب",
    category: "Languages & Literature",
    categoryAr: "اللغات والأدب",
    image: "/courses/book-week.png",
    descriptionEn:
      "Celebrate the joy of reading. Explore different genres and discover new favorite books.",
    descriptionAr:
      "احتفل بمتعة القراءة. استكشف أنواعاً مختلفة واكتشف كتبك المفضلة الجديدة.",
    chapters: [
      { titleEn: "The Joy of Reading", titleAr: "متعة القراءة" },
      { titleEn: "Exploring Genres", titleAr: "استكشاف الأنواع" },
      { titleEn: "Famous Authors", titleAr: "مؤلفون مشهورون" },
      { titleEn: "Book Recommendations", titleAr: "توصيات الكتب" },
      { titleEn: "Creating Your Own Story", titleAr: "كتابة قصتك الخاصة" },
    ],
  },
  {
    slug: "parts-of-the-body-and-five-senses",
    titleEn: "Parts of the Body & Five Senses",
    titleAr: "أجزاء الجسم والحواس الخمس",
    category: "Languages & Literature",
    categoryAr: "اللغات والأدب",
    image: "/courses/parts-of-the-body-and-five-senses.png",
    descriptionEn:
      "Learn vocabulary for body parts and the five senses. Perfect for early language learners.",
    descriptionAr:
      "تعلم المفردات المتعلقة بأجزاء الجسم والحواس الخمس. مثالي للمتعلمين الأوائل للغة.",
    chapters: [
      { titleEn: "Head and Face", titleAr: "الرأس والوجه" },
      { titleEn: "Body Parts", titleAr: "أجزاء الجسم" },
      { titleEn: "Sight and Hearing", titleAr: "البصر والسمع" },
      { titleEn: "Touch, Taste, and Smell", titleAr: "اللمس والتذوق والشم" },
      { titleEn: "Using Our Senses", titleAr: "استخدام حواسنا" },
    ],
  },
  {
    slug: "seasons",
    titleEn: "Seasons",
    titleAr: "الفصول",
    category: "Languages & Literature",
    categoryAr: "اللغات والأدب",
    image: "/courses/seasons.png",
    descriptionEn:
      "Explore seasonal vocabulary and concepts. Learn about the four seasons and their characteristics.",
    descriptionAr:
      "استكشف مفردات ومفاهيم الفصول. تعرف على الفصول الأربعة وخصائصها.",
    chapters: [
      { titleEn: "Spring", titleAr: "الربيع" },
      { titleEn: "Summer", titleAr: "الصيف" },
      { titleEn: "Autumn", titleAr: "الخريف" },
      { titleEn: "Winter", titleAr: "الشتاء" },
      { titleEn: "Seasonal Activities", titleAr: "الأنشطة الموسمية" },
    ],
  },

  // ============================================
  // SOCIAL STUDIES & HISTORY (10 courses)
  // ============================================
  {
    slug: "us-history",
    titleEn: "US History",
    titleAr: "تاريخ الولايات المتحدة",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/us-history.png",
    descriptionEn:
      "Journey through American history from colonization to modern times. Explore key events and figures.",
    descriptionAr:
      "رحلة عبر التاريخ الأمريكي من الاستعمار إلى العصر الحديث. استكشف الأحداث والشخصيات الرئيسية.",
    chapters: [
      { titleEn: "Colonial America", titleAr: "أمريكا الاستعمارية" },
      { titleEn: "The American Revolution", titleAr: "الثورة الأمريكية" },
      { titleEn: "Westward Expansion", titleAr: "التوسع الغربي" },
      { titleEn: "Civil War", titleAr: "الحرب الأهلية" },
      { titleEn: "Modern America", titleAr: "أمريكا الحديثة" },
    ],
  },
  {
    slug: "world-history",
    titleEn: "World History",
    titleAr: "التاريخ العالمي",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/world-history.png",
    descriptionEn:
      "Explore the major events and civilizations that shaped our world from ancient times to today.",
    descriptionAr:
      "استكشف الأحداث الكبرى والحضارات التي شكلت عالمنا من العصور القديمة إلى اليوم.",
    chapters: [
      { titleEn: "Ancient Civilizations", titleAr: "الحضارات القديمة" },
      { titleEn: "The Middle Ages", titleAr: "العصور الوسطى" },
      {
        titleEn: "Renaissance and Reformation",
        titleAr: "عصر النهضة والإصلاح",
      },
      { titleEn: "World Wars", titleAr: "الحروب العالمية" },
      { titleEn: "The Modern World", titleAr: "العالم الحديث" },
    ],
  },
  {
    slug: "civil-rights-movement",
    titleEn: "Civil Rights Movement",
    titleAr: "حركة الحقوق المدنية",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/civil-rights-movement.png",
    descriptionEn:
      "Learn about the struggle for equality and justice. Discover the key figures and events of the civil rights era.",
    descriptionAr:
      "تعرف على النضال من أجل المساواة والعدالة. اكتشف الشخصيات والأحداث الرئيسية في عصر الحقوق المدنية.",
    chapters: [
      { titleEn: "The Fight for Equality", titleAr: "الكفاح من أجل المساواة" },
      { titleEn: "Key Leaders", titleAr: "القادة الرئيسيون" },
      { titleEn: "Historic Events", titleAr: "الأحداث التاريخية" },
      { titleEn: "Legislation and Change", titleAr: "التشريعات والتغيير" },
      {
        titleEn: "Legacy and Continuing Work",
        titleAr: "الإرث والعمل المستمر",
      },
    ],
  },
  {
    slug: "the-united-states-as-a-nation",
    titleEn: "The United States as a Nation",
    titleAr: "الولايات المتحدة كدولة",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/the-united-states-as-a-nation.png",
    descriptionEn:
      "Understand how the United States formed and developed as a nation. Learn about its government and symbols.",
    descriptionAr:
      "فهم كيف تشكلت وتطورت الولايات المتحدة كدولة. تعرف على حكومتها ورموزها.",
    chapters: [
      { titleEn: "Formation of the Nation", titleAr: "تشكيل الأمة" },
      { titleEn: "The Constitution", titleAr: "الدستور" },
      { titleEn: "Branches of Government", titleAr: "فروع الحكومة" },
      { titleEn: "National Symbols", titleAr: "الرموز الوطنية" },
      { titleEn: "Citizenship", titleAr: "المواطنة" },
    ],
  },
  {
    slug: "map-skills",
    titleEn: "Map Skills",
    titleAr: "مهارات قراءة الخرائط",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/map-skills.png",
    descriptionEn:
      "Learn essential map reading skills. Understand symbols, scales, and how to navigate using maps.",
    descriptionAr:
      "تعلم مهارات قراءة الخرائط الأساسية. فهم الرموز والمقاييس وكيفية التنقل باستخدام الخرائط.",
    chapters: [
      { titleEn: "Types of Maps", titleAr: "أنواع الخرائط" },
      { titleEn: "Map Symbols and Keys", titleAr: "رموز الخرائط ومفاتيحها" },
      { titleEn: "Scale and Distance", titleAr: "المقياس والمسافة" },
      { titleEn: "Compass Directions", titleAr: "اتجاهات البوصلة" },
      { titleEn: "Reading Coordinates", titleAr: "قراءة الإحداثيات" },
    ],
  },
  {
    slug: "culture-and-society",
    titleEn: "Culture and Society",
    titleAr: "الثقافة والمجتمع",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/culture-and-society.png",
    descriptionEn:
      "Explore diverse cultures and societies around the world. Learn about traditions, customs, and values.",
    descriptionAr:
      "استكشف الثقافات والمجتمعات المتنوعة حول العالم. تعرف على التقاليد والعادات والقيم.",
    chapters: [
      { titleEn: "What is Culture?", titleAr: "ما هي الثقافة؟" },
      { titleEn: "Traditions and Customs", titleAr: "التقاليد والعادات" },
      { titleEn: "Family and Community", titleAr: "العائلة والمجتمع" },
      {
        titleEn: "Celebrations Around the World",
        titleAr: "الاحتفالات حول العالم",
      },
      { titleEn: "Cultural Diversity", titleAr: "التنوع الثقافي" },
    ],
  },
  {
    slug: "identity-and-community",
    titleEn: "Identity and Community",
    titleAr: "الهوية والمجتمع",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/identity-and-community.png",
    descriptionEn:
      "Understand personal identity and community belonging. Explore what makes each person unique.",
    descriptionAr:
      "فهم الهوية الشخصية والانتماء للمجتمع. استكشف ما يجعل كل شخص فريداً.",
    chapters: [
      { titleEn: "Understanding Identity", titleAr: "فهم الهوية" },
      { titleEn: "Family Heritage", titleAr: "التراث العائلي" },
      { titleEn: "Community Roles", titleAr: "أدوار المجتمع" },
      { titleEn: "Respecting Differences", titleAr: "احترام الاختلافات" },
      { titleEn: "Building Community", titleAr: "بناء المجتمع" },
    ],
  },
  {
    slug: "rights-and-advocacy",
    titleEn: "Rights and Advocacy",
    titleAr: "الحقوق والمناصرة",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/rights-and-advocacy.png",
    descriptionEn:
      "Learn about human rights and how to advocate for positive change in your community and world.",
    descriptionAr:
      "تعرف على حقوق الإنسان وكيفية المناصرة من أجل التغيير الإيجابي في مجتمعك والعالم.",
    chapters: [
      { titleEn: "What are Rights?", titleAr: "ما هي الحقوق؟" },
      { titleEn: "Human Rights", titleAr: "حقوق الإنسان" },
      { titleEn: "Children's Rights", titleAr: "حقوق الطفل" },
      { titleEn: "Being an Advocate", titleAr: "أن تكون مناصراً" },
      { titleEn: "Making a Difference", titleAr: "إحداث فرق" },
    ],
  },
  {
    slug: "changemakers",
    titleEn: "Changemakers",
    titleAr: "صناع التغيير",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/changemakers.png",
    descriptionEn:
      "Discover inspiring changemakers who made a difference. Learn how you can create positive change.",
    descriptionAr:
      "اكتشف صناع التغيير الملهمين الذين أحدثوا فرقاً. تعلم كيف يمكنك إحداث تغيير إيجابي.",
    chapters: [
      { titleEn: "What is a Changemaker?", titleAr: "من هو صانع التغيير؟" },
      { titleEn: "Historic Changemakers", titleAr: "صناع التغيير التاريخيون" },
      { titleEn: "Young Changemakers", titleAr: "صناع التغيير الشباب" },
      { titleEn: "Environmental Leaders", titleAr: "القادة البيئيون" },
      { titleEn: "Becoming a Changemaker", titleAr: "أن تصبح صانع تغيير" },
    ],
  },
  {
    slug: "veterans-day",
    titleEn: "Veterans Day",
    titleAr: "يوم المحاربين القدامى",
    category: "Social Studies & History",
    categoryAr: "الدراسات الاجتماعية والتاريخ",
    image: "/courses/veterans-day.png",
    descriptionEn:
      "Honor those who have served in the military. Learn about Veterans Day and its significance.",
    descriptionAr:
      "تكريم الذين خدموا في الجيش. تعرف على يوم المحاربين القدامى وأهميته.",
    chapters: [
      {
        titleEn: "History of Veterans Day",
        titleAr: "تاريخ يوم المحاربين القدامى",
      },
      { titleEn: "Who are Veterans?", titleAr: "من هم المحاربون القدامى؟" },
      { titleEn: "Honoring Service", titleAr: "تكريم الخدمة" },
      {
        titleEn: "Veterans in Our Community",
        titleAr: "المحاربون القدامى في مجتمعنا",
      },
      { titleEn: "Ways to Show Appreciation", titleAr: "طرق إظهار التقدير" },
    ],
  },

  // ============================================
  // HEALTH & WELLNESS (8 courses)
  // ============================================
  {
    slug: "physical-education",
    titleEn: "Physical Education",
    titleAr: "التربية البدنية",
    category: "Health & Wellness",
    categoryAr: "الصحة والعافية",
    image: "/courses/physical-education.png",
    descriptionEn:
      "Develop physical fitness and motor skills. Learn about sports, exercise, and healthy living.",
    descriptionAr:
      "تطوير اللياقة البدنية والمهارات الحركية. تعرف على الرياضة والتمارين والحياة الصحية.",
    chapters: [
      { titleEn: "Fitness Fundamentals", titleAr: "أساسيات اللياقة" },
      { titleEn: "Team Sports", titleAr: "الرياضات الجماعية" },
      { titleEn: "Individual Sports", titleAr: "الرياضات الفردية" },
      { titleEn: "Flexibility and Strength", titleAr: "المرونة والقوة" },
      { titleEn: "Healthy Habits", titleAr: "العادات الصحية" },
    ],
  },
  {
    slug: "mental-and-emotional-wellbeing",
    titleEn: "Mental and Emotional Wellbeing",
    titleAr: "الصحة النفسية والعاطفية",
    category: "Health & Wellness",
    categoryAr: "الصحة والعافية",
    image: "/courses/mental-and-emotional-wellbeing.png",
    descriptionEn:
      "Learn to understand and manage emotions. Develop strategies for mental health and wellbeing.",
    descriptionAr:
      "تعلم فهم وإدارة المشاعر. تطوير استراتيجيات للصحة النفسية والعافية.",
    chapters: [
      { titleEn: "Understanding Emotions", titleAr: "فهم المشاعر" },
      { titleEn: "Managing Stress", titleAr: "إدارة التوتر" },
      { titleEn: "Building Self-Esteem", titleAr: "بناء تقدير الذات" },
      { titleEn: "Mindfulness", titleAr: "اليقظة الذهنية" },
      { titleEn: "Seeking Help", titleAr: "طلب المساعدة" },
    ],
  },
  {
    slug: "healthy-lifestyle",
    titleEn: "Healthy Lifestyle",
    titleAr: "نمط الحياة الصحي",
    category: "Health & Wellness",
    categoryAr: "الصحة والعافية",
    image: "/courses/healthy-lifestyle.png",
    descriptionEn:
      "Build habits for a healthy life. Learn about nutrition, sleep, and balanced living.",
    descriptionAr:
      "بناء عادات لحياة صحية. تعرف على التغذية والنوم والعيش المتوازن.",
    chapters: [
      { titleEn: "Nutrition Basics", titleAr: "أساسيات التغذية" },
      { titleEn: "Importance of Sleep", titleAr: "أهمية النوم" },
      { titleEn: "Staying Active", titleAr: "البقاء نشيطاً" },
      { titleEn: "Hygiene", titleAr: "النظافة الشخصية" },
      { titleEn: "Balance in Life", titleAr: "التوازن في الحياة" },
    ],
  },
  {
    slug: "resilience",
    titleEn: "Resilience",
    titleAr: "المرونة",
    category: "Health & Wellness",
    categoryAr: "الصحة والعافية",
    image: "/courses/resilience.png",
    descriptionEn:
      "Develop the ability to bounce back from challenges. Learn strategies for building resilience.",
    descriptionAr:
      "تطوير القدرة على التعافي من التحديات. تعلم استراتيجيات بناء المرونة.",
    chapters: [
      { titleEn: "What is Resilience?", titleAr: "ما هي المرونة؟" },
      { titleEn: "Facing Challenges", titleAr: "مواجهة التحديات" },
      { titleEn: "Growth Mindset", titleAr: "عقلية النمو" },
      { titleEn: "Learning from Failure", titleAr: "التعلم من الفشل" },
      { titleEn: "Building Inner Strength", titleAr: "بناء القوة الداخلية" },
    ],
  },
  {
    slug: "friendship",
    titleEn: "Friendship",
    titleAr: "الصداقة",
    category: "Health & Wellness",
    categoryAr: "الصحة والعافية",
    image: "/courses/friendship.png",
    descriptionEn:
      "Learn about building and maintaining healthy friendships. Develop social skills and empathy.",
    descriptionAr:
      "تعرف على بناء صداقات صحية والحفاظ عليها. تطوير المهارات الاجتماعية والتعاطف.",
    chapters: [
      {
        titleEn: "What Makes a Good Friend?",
        titleAr: "ما الذي يجعل صديقاً جيداً؟",
      },
      { titleEn: "Making Friends", titleAr: "تكوين الصداقات" },
      { titleEn: "Being a Good Friend", titleAr: "أن تكون صديقاً جيداً" },
      { titleEn: "Resolving Conflicts", titleAr: "حل النزاعات" },
      { titleEn: "Online Friendships", titleAr: "الصداقات عبر الإنترنت" },
    ],
  },
  {
    slug: "bullying",
    titleEn: "Bullying",
    titleAr: "التنمر",
    category: "Health & Wellness",
    categoryAr: "الصحة والعافية",
    image: "/courses/bullying.png",
    descriptionEn:
      "Understand and prevent bullying. Learn strategies to stand up against bullying behavior.",
    descriptionAr: "فهم التنمر ومنعه. تعلم استراتيجيات للوقوف ضد سلوك التنمر.",
    chapters: [
      { titleEn: "What is Bullying?", titleAr: "ما هو التنمر؟" },
      { titleEn: "Types of Bullying", titleAr: "أنواع التنمر" },
      { titleEn: "Cyberbullying", titleAr: "التنمر الإلكتروني" },
      { titleEn: "Standing Up to Bullies", titleAr: "الوقوف في وجه المتنمرين" },
      { titleEn: "Getting Help", titleAr: "الحصول على المساعدة" },
    ],
  },
  {
    slug: "decision-making",
    titleEn: "Decision Making",
    titleAr: "اتخاذ القرارات",
    category: "Health & Wellness",
    categoryAr: "الصحة والعافية",
    image: "/courses/decision-making.png",
    descriptionEn:
      "Develop critical thinking and decision-making skills. Learn to make responsible choices.",
    descriptionAr:
      "تطوير مهارات التفكير النقدي واتخاذ القرارات. تعلم اتخاذ خيارات مسؤولة.",
    chapters: [
      { titleEn: "The Decision-Making Process", titleAr: "عملية اتخاذ القرار" },
      { titleEn: "Weighing Options", titleAr: "الموازنة بين الخيارات" },
      { titleEn: "Considering Consequences", titleAr: "التفكير في العواقب" },
      { titleEn: "Peer Pressure", titleAr: "ضغط الأقران" },
      { titleEn: "Making Responsible Choices", titleAr: "اتخاذ خيارات مسؤولة" },
    ],
  },
  {
    slug: "national-fitness-day",
    titleEn: "National Fitness Day",
    titleAr: "يوم اللياقة الوطني",
    category: "Health & Wellness",
    categoryAr: "الصحة والعافية",
    image: "/courses/national-fitness-day.png",
    descriptionEn:
      "Celebrate physical fitness and active living. Learn fun ways to stay fit and healthy.",
    descriptionAr:
      "احتفل باللياقة البدنية والحياة النشطة. تعلم طرقاً ممتعة للبقاء لائقاً وصحياً.",
    chapters: [
      { titleEn: "What is Fitness?", titleAr: "ما هي اللياقة؟" },
      { titleEn: "Fun Fitness Activities", titleAr: "أنشطة لياقة ممتعة" },
      { titleEn: "Setting Fitness Goals", titleAr: "تحديد أهداف اللياقة" },
      { titleEn: "Family Fitness", titleAr: "لياقة العائلة" },
      { titleEn: "Staying Motivated", titleAr: "البقاء متحمساً" },
    ],
  },

  // ============================================
  // ARTS & MEDIA (6 courses)
  // ============================================
  {
    slug: "visual-arts",
    titleEn: "Visual Arts",
    titleAr: "الفنون البصرية",
    category: "Arts & Media",
    categoryAr: "الفنون والإعلام",
    image: "/courses/visual-arts.png",
    descriptionEn:
      "Explore drawing, painting, and other visual arts. Develop creativity and artistic expression.",
    descriptionAr:
      "استكشف الرسم والتلوين والفنون البصرية الأخرى. تطوير الإبداع والتعبير الفني.",
    chapters: [
      { titleEn: "Elements of Art", titleAr: "عناصر الفن" },
      { titleEn: "Drawing Techniques", titleAr: "تقنيات الرسم" },
      { titleEn: "Painting", titleAr: "الرسم بالألوان" },
      { titleEn: "Sculpture", titleAr: "النحت" },
      { titleEn: "Art Appreciation", titleAr: "تذوق الفن" },
    ],
  },
  {
    slug: "music",
    titleEn: "Music",
    titleAr: "الموسيقى",
    category: "Arts & Media",
    categoryAr: "الفنون والإعلام",
    image: "/courses/music.png",
    descriptionEn:
      "Discover the world of music. Learn about rhythm, melody, and different musical genres.",
    descriptionAr:
      "اكتشف عالم الموسيقى. تعرف على الإيقاع واللحن والأنواع الموسيقية المختلفة.",
    chapters: [
      { titleEn: "Rhythm and Beat", titleAr: "الإيقاع والنبضة" },
      { titleEn: "Melody and Harmony", titleAr: "اللحن والتناغم" },
      { titleEn: "Musical Instruments", titleAr: "الآلات الموسيقية" },
      { titleEn: "Music Genres", titleAr: "أنواع الموسيقى" },
      { titleEn: "Creating Music", titleAr: "إنشاء الموسيقى" },
    ],
  },
  {
    slug: "drama-and-theater",
    titleEn: "Drama and Theater",
    titleAr: "الدراما والمسرح",
    category: "Arts & Media",
    categoryAr: "الفنون والإعلام",
    image: "/courses/drama-and-theater.png",
    descriptionEn:
      "Explore the performing arts. Learn about acting, stagecraft, and theatrical production.",
    descriptionAr:
      "استكشف الفنون الأدائية. تعرف على التمثيل وفن المسرح والإنتاج المسرحي.",
    chapters: [
      { titleEn: "Introduction to Drama", titleAr: "مقدمة للدراما" },
      { titleEn: "Acting Basics", titleAr: "أساسيات التمثيل" },
      { titleEn: "Stagecraft", titleAr: "فن المسرح" },
      { titleEn: "Script Writing", titleAr: "كتابة السيناريو" },
      { titleEn: "Performance", titleAr: "الأداء" },
    ],
  },
  {
    slug: "video-production",
    titleEn: "Video Production",
    titleAr: "إنتاج الفيديو",
    category: "Arts & Media",
    categoryAr: "الفنون والإعلام",
    image: "/courses/video-production.png",
    descriptionEn:
      "Learn the basics of video production. Create your own videos from planning to editing.",
    descriptionAr:
      "تعلم أساسيات إنتاج الفيديو. أنشئ مقاطع الفيديو الخاصة بك من التخطيط إلى التحرير.",
    chapters: [
      { titleEn: "Planning Your Video", titleAr: "تخطيط الفيديو الخاص بك" },
      { titleEn: "Camera Basics", titleAr: "أساسيات الكاميرا" },
      { titleEn: "Lighting and Sound", titleAr: "الإضاءة والصوت" },
      { titleEn: "Video Editing", titleAr: "تحرير الفيديو" },
      { titleEn: "Sharing Your Work", titleAr: "مشاركة عملك" },
    ],
  },
  {
    slug: "media-literacy",
    titleEn: "Media Literacy",
    titleAr: "محو الأمية الإعلامية",
    category: "Arts & Media",
    categoryAr: "الفنون والإعلام",
    image: "/courses/media-literacy.png",
    descriptionEn:
      "Develop critical thinking about media. Learn to analyze and evaluate media messages.",
    descriptionAr:
      "تطوير التفكير النقدي حول الإعلام. تعلم تحليل وتقييم الرسائل الإعلامية.",
    chapters: [
      { titleEn: "What is Media?", titleAr: "ما هو الإعلام؟" },
      { titleEn: "Types of Media", titleAr: "أنواع الإعلام" },
      { titleEn: "Analyzing Messages", titleAr: "تحليل الرسائل" },
      {
        titleEn: "Fake News and Misinformation",
        titleAr: "الأخبار الكاذبة والمعلومات المضللة",
      },
      { titleEn: "Being a Smart Consumer", titleAr: "كن مستهلكاً ذكياً" },
    ],
  },
  {
    slug: "thanksgiving",
    titleEn: "Thanksgiving",
    titleAr: "عيد الشكر",
    category: "Arts & Media",
    categoryAr: "الفنون والإعلام",
    image: "/courses/thanksgiving.png",
    descriptionEn:
      "Learn about Thanksgiving traditions and history. Explore the meaning of gratitude.",
    descriptionAr: "تعرف على تقاليد وتاريخ عيد الشكر. استكشف معنى الامتنان.",
    chapters: [
      { titleEn: "History of Thanksgiving", titleAr: "تاريخ عيد الشكر" },
      { titleEn: "Thanksgiving Traditions", titleAr: "تقاليد عيد الشكر" },
      { titleEn: "The Meaning of Gratitude", titleAr: "معنى الامتنان" },
      { titleEn: "Thanksgiving Crafts", titleAr: "حرف عيد الشكر" },
      { titleEn: "Giving Back", titleAr: "رد الجميل" },
    ],
  },

  // ============================================
  // TECHNOLOGY & COMPUTING (6 courses)
  // ============================================
  {
    slug: "coding-and-computer-programming",
    titleEn: "Coding and Computer Programming",
    titleAr: "البرمجة وبرمجة الحاسوب",
    category: "Technology & Computing",
    categoryAr: "التكنولوجيا والحوسبة",
    image: "/courses/coding-and-computer-programming.png",
    descriptionEn:
      "Start your coding journey. Learn programming fundamentals and computational thinking.",
    descriptionAr:
      "ابدأ رحلتك في البرمجة. تعلم أساسيات البرمجة والتفكير الحسابي.",
    chapters: [
      { titleEn: "What is Coding?", titleAr: "ما هي البرمجة؟" },
      { titleEn: "Sequences and Loops", titleAr: "التسلسلات والحلقات" },
      { titleEn: "Conditionals", titleAr: "الشروط" },
      { titleEn: "Variables", titleAr: "المتغيرات" },
      { titleEn: "Debugging", titleAr: "تصحيح الأخطاء" },
      { titleEn: "Creating Projects", titleAr: "إنشاء المشاريع" },
    ],
  },
  {
    slug: "programming-and-coding",
    titleEn: "Programming and Coding",
    titleAr: "البرمجة والترميز",
    category: "Technology & Computing",
    categoryAr: "التكنولوجيا والحوسبة",
    image: "/courses/programming-and-coding.png",
    descriptionEn:
      "Advance your programming skills. Build more complex programs and applications.",
    descriptionAr: "طور مهاراتك البرمجية. بناء برامج وتطبيقات أكثر تعقيداً.",
    chapters: [
      { titleEn: "Programming Languages", titleAr: "لغات البرمجة" },
      { titleEn: "Functions", titleAr: "الدوال" },
      { titleEn: "Data Structures", titleAr: "هياكل البيانات" },
      { titleEn: "Algorithms", titleAr: "الخوارزميات" },
      { titleEn: "Project Development", titleAr: "تطوير المشاريع" },
    ],
  },
  {
    slug: "digital-citizenship",
    titleEn: "Digital Citizenship",
    titleAr: "المواطنة الرقمية",
    category: "Technology & Computing",
    categoryAr: "التكنولوجيا والحوسبة",
    image: "/courses/digital-citizenship.png",
    descriptionEn:
      "Be a responsible digital citizen. Learn about online safety, privacy, and digital etiquette.",
    descriptionAr:
      "كن مواطناً رقمياً مسؤولاً. تعرف على السلامة عبر الإنترنت والخصوصية والآداب الرقمية.",
    chapters: [
      { titleEn: "Online Safety", titleAr: "السلامة عبر الإنترنت" },
      { titleEn: "Privacy and Security", titleAr: "الخصوصية والأمان" },
      { titleEn: "Digital Footprint", titleAr: "البصمة الرقمية" },
      { titleEn: "Respectful Communication", titleAr: "التواصل المحترم" },
      { titleEn: "Information Literacy", titleAr: "محو الأمية المعلوماتية" },
    ],
  },
  {
    slug: "study-skills",
    titleEn: "Study Skills",
    titleAr: "مهارات الدراسة",
    category: "Technology & Computing",
    categoryAr: "التكنولوجيا والحوسبة",
    image: "/courses/study-skills.png",
    descriptionEn:
      "Develop effective study habits and techniques. Learn to organize and manage your learning.",
    descriptionAr: "تطوير عادات وتقنيات دراسية فعالة. تعلم تنظيم وإدارة تعلمك.",
    chapters: [
      { titleEn: "Time Management", titleAr: "إدارة الوقت" },
      { titleEn: "Note-Taking", titleAr: "تدوين الملاحظات" },
      { titleEn: "Reading Strategies", titleAr: "استراتيجيات القراءة" },
      { titleEn: "Memory Techniques", titleAr: "تقنيات الذاكرة" },
      { titleEn: "Test Preparation", titleAr: "التحضير للاختبارات" },
    ],
  },
  {
    slug: "career-and-technical-education",
    titleEn: "Career and Technical Education",
    titleAr: "التعليم المهني والتقني",
    category: "Technology & Computing",
    categoryAr: "التكنولوجيا والحوسبة",
    image: "/courses/career-and-technical-education.png",
    descriptionEn:
      "Explore career paths and develop practical skills for the workplace.",
    descriptionAr: "استكشف المسارات المهنية وطور المهارات العملية لمكان العمل.",
    chapters: [
      { titleEn: "Exploring Careers", titleAr: "استكشاف المهن" },
      { titleEn: "Workplace Skills", titleAr: "مهارات مكان العمل" },
      { titleEn: "Communication Skills", titleAr: "مهارات التواصل" },
      { titleEn: "Problem Solving", titleAr: "حل المشكلات" },
      { titleEn: "Planning Your Future", titleAr: "التخطيط لمستقبلك" },
    ],
  },
  {
    slug: "business",
    titleEn: "Business",
    titleAr: "الأعمال",
    category: "Technology & Computing",
    categoryAr: "التكنولوجيا والحوسبة",
    image: "/courses/business.png",
    descriptionEn:
      "Learn basic business concepts. Understand entrepreneurship and how businesses work.",
    descriptionAr:
      "تعلم مفاهيم الأعمال الأساسية. فهم ريادة الأعمال وكيف تعمل الشركات.",
    chapters: [
      { titleEn: "What is Business?", titleAr: "ما هي الأعمال؟" },
      { titleEn: "Entrepreneurship", titleAr: "ريادة الأعمال" },
      { titleEn: "Money Management", titleAr: "إدارة المال" },
      { titleEn: "Marketing Basics", titleAr: "أساسيات التسويق" },
      { titleEn: "Starting a Business", titleAr: "بدء عمل تجاري" },
    ],
  },

  // ============================================
  // LIFE SKILLS (3 courses)
  // ============================================
  {
    slug: "world-religions",
    titleEn: "World Religions",
    titleAr: "الأديان العالمية",
    category: "Life Skills",
    categoryAr: "المهارات الحياتية",
    image: "/courses/world-religions.png",
    descriptionEn:
      "Explore the major world religions. Learn about beliefs, practices, and cultural traditions.",
    descriptionAr:
      "استكشف الأديان العالمية الرئيسية. تعرف على المعتقدات والممارسات والتقاليد الثقافية.",
    chapters: [
      {
        titleEn: "Introduction to World Religions",
        titleAr: "مقدمة للأديان العالمية",
      },
      { titleEn: "Christianity", titleAr: "المسيحية" },
      { titleEn: "Islam", titleAr: "الإسلام" },
      { titleEn: "Judaism", titleAr: "اليهودية" },
      { titleEn: "Eastern Religions", titleAr: "الأديان الشرقية" },
      { titleEn: "Religious Tolerance", titleAr: "التسامح الديني" },
    ],
  },
  {
    slug: "psychology",
    titleEn: "Psychology",
    titleAr: "علم النفس",
    category: "Life Skills",
    categoryAr: "المهارات الحياتية",
    image: "/courses/psychology.png",
    descriptionEn:
      "Introduction to psychology. Understand human behavior, thoughts, and emotions.",
    descriptionAr: "مقدمة في علم النفس. فهم السلوك البشري والأفكار والعواطف.",
    chapters: [
      { titleEn: "What is Psychology?", titleAr: "ما هو علم النفس؟" },
      { titleEn: "The Brain", titleAr: "الدماغ" },
      { titleEn: "Learning and Memory", titleAr: "التعلم والذاكرة" },
      { titleEn: "Emotions", titleAr: "العواطف" },
      { titleEn: "Social Psychology", titleAr: "علم النفس الاجتماعي" },
    ],
  },
  {
    slug: "teacher-professional-development",
    titleEn: "Teacher Professional Development",
    titleAr: "التطوير المهني للمعلمين",
    category: "Life Skills",
    categoryAr: "المهارات الحياتية",
    image: "/courses/teacher-professional-development.png",
    descriptionEn:
      "Resources for educator growth. Learn new teaching strategies and best practices.",
    descriptionAr:
      "موارد لنمو المعلمين. تعلم استراتيجيات التدريس الجديدة وأفضل الممارسات.",
    chapters: [
      {
        titleEn: "Effective Teaching Strategies",
        titleAr: "استراتيجيات التدريس الفعالة",
      },
      { titleEn: "Classroom Management", titleAr: "إدارة الصف" },
      { titleEn: "Technology in Education", titleAr: "التكنولوجيا في التعليم" },
      { titleEn: "Assessment Methods", titleAr: "طرق التقييم" },
      { titleEn: "Student Engagement", titleAr: "مشاركة الطلاب" },
    ],
  },
]
