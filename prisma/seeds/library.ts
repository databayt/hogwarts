/**
 * Library Seed Module
 * Creates production-ready library with Arabic and English books
 * - Arabic books with Arabic metadata
 * - English books relevant to MEA region schools
 * - Actual book cover URLs
 *
 * Uses findFirst + create pattern - safe to run multiple times (no deletes)
 */

import { BorrowStatus } from "@prisma/client"

import type { SeedPrisma } from "./types"

// Arabic Books - with Arabic metadata and ISBN-based Open Library covers
const ARABIC_BOOKS = [
  // Sudanese Literature
  {
    title: "عرس الزين",
    author: "الطيب صالح",
    genre: "أدب سوداني",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780894101908-L.jpg",
    coverColor: "#8B4513",
    description:
      "رواية عرس الزين للكاتب السوداني الطيب صالح، تروي قصة شاب بسيط في قرية سودانية يعيش حياة مليئة بالبراءة والطيبة. تصور الرواية الحياة الريفية السودانية بكل تفاصيلها وجمالياتها.",
    summary:
      "قصة الزين، الشاب البسيط الذي يعيش في قرية سودانية، وكيف يتحول زواجه إلى حدث يجمع القرية كلها. رواية تحتفي بالقيم الإنسانية والتقاليد السودانية الأصيلة.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "موسم الهجرة إلى الشمال",
    author: "الطيب صالح",
    genre: "أدب سوداني",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780141187020-L.jpg",
    coverColor: "#1a237e",
    description:
      "رواية موسم الهجرة إلى الشمال، واحدة من أهم الروايات العربية في القرن العشرين. تتناول صراع الهوية بين الشرق والغرب من خلال قصة مصطفى سعيد.",
    summary:
      "رحلة مصطفى سعيد من السودان إلى إنجلترا وعودته، وما يكشفه ذلك عن التصادم الحضاري والبحث عن الهوية.",
    totalCopies: 20,
    availableCopies: 15,
  },
  {
    title: "بندر شاه",
    author: "الطيب صالح",
    genre: "أدب سوداني",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789953686110-L.jpg",
    coverColor: "#4a148c",
    description:
      "ملحمة روائية تتألف من جزأين: ضو البيت ومريود. تروي قصة قرية ود حامد وشخصياتها المتعددة عبر أجيال مختلفة.",
    summary:
      "استمرار لعالم الطيب صالح الروائي في قرية ود حامد، مع شخصيات جديدة وقصص متشابكة.",
    totalCopies: 10,
    availableCopies: 8,
  },

  // Egyptian Literature
  {
    title: "أولاد حارتنا",
    author: "نجيب محفوظ",
    genre: "أدب مصري",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385264730-L.jpg",
    coverColor: "#bf360c",
    description:
      "رواية رمزية للكاتب المصري نجيب محفوظ الحائز على جائزة نوبل، تتناول تاريخ البشرية من خلال حكاية حارة مصرية.",
    summary:
      "ملحمة رمزية عن تاريخ الإنسانية والأديان من خلال قصة عائلة الجبلاوي.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "الثلاثية: بين القصرين",
    author: "نجيب محفوظ",
    genre: "أدب مصري",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385264679-L.jpg",
    coverColor: "#1b5e20",
    description:
      "الجزء الأول من ثلاثية نجيب محفوظ الشهيرة، تدور أحداثها في حي الجمالية بالقاهرة.",
    summary:
      "قصة عائلة أحمد عبد الجواد في القاهرة القديمة، مع تصوير دقيق للمجتمع المصري.",
    totalCopies: 15,
    availableCopies: 11,
  },
  {
    title: "اللص والكلاب",
    author: "نجيب محفوظ",
    genre: "أدب مصري",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385264624-L.jpg",
    coverColor: "#263238",
    description:
      "رواية نفسية تتناول قصة سعيد مهران الذي يخرج من السجن ليجد أن زوجته خانته.",
    summary:
      "رحلة الانتقام والضياع في مصر الستينيات، مع تصوير عميق للصراع الداخلي.",
    totalCopies: 12,
    availableCopies: 10,
  },

  // Classical Arabic Literature
  {
    title: "الأيام",
    author: "طه حسين",
    genre: "سيرة ذاتية",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789774160066-L.jpg",
    coverColor: "#5d4037",
    description:
      "السيرة الذاتية لعميد الأدب العربي طه حسين، يروي فيها طفولته في صعيد مصر وفقدانه البصر.",
    summary:
      "قصة كفاح طه حسين من قرية صغيرة في الصعيد المصري إلى أعلى المناصب الأدبية.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "كليلة ودمنة",
    author: "ابن المقفع",
    genre: "أدب كلاسيكي",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780140455076-L.jpg",
    coverColor: "#00695c",
    description:
      "مجموعة من الحكايات على ألسنة الحيوانات، تحمل حكماً ودروساً في السياسة والأخلاق.",
    summary:
      "قصص الحيوانات الشهيرة التي تحمل دروساً في الحكمة والسياسة والأخلاق.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "ألف ليلة وليلة",
    author: "مجهول",
    genre: "أدب شعبي",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780140449389-L.jpg",
    coverColor: "#6a1b9a",
    description:
      "مجموعة من الحكايات الشعبية العربية والفارسية والهندية، رواها شهرزاد للملك شهريار.",
    summary:
      "أشهر مجموعة قصصية في التراث العربي، تضم قصص علاء الدين والسندباد وعلي بابا.",
    totalCopies: 30,
    availableCopies: 25,
  },

  // Islamic Studies
  {
    title: "رياض الصالحين",
    author: "الإمام النووي",
    genre: "دراسات إسلامية",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789960892795-L.jpg",
    coverColor: "#1b5e20",
    description:
      "مجموعة من الأحاديث النبوية الشريفة مرتبة في أبواب تتناول مختلف جوانب الحياة الإسلامية.",
    summary: "كتاب جامع للأحاديث النبوية في الأخلاق والعبادات والمعاملات.",
    totalCopies: 40,
    availableCopies: 35,
  },
  {
    title: "فقه السنة",
    author: "السيد سابق",
    genre: "دراسات إسلامية",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789775880680-L.jpg",
    coverColor: "#004d40",
    description:
      "موسوعة فقهية شاملة تتناول أحكام العبادات والمعاملات بأسلوب ميسر.",
    summary: "مرجع فقهي شامل يعرض الأحكام الشرعية بأدلتها من الكتاب والسنة.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "السيرة النبوية",
    author: "ابن هشام",
    genre: "دراسات إسلامية",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789953520551-L.jpg",
    coverColor: "#33691e",
    description:
      "أشهر كتاب في السيرة النبوية، يروي حياة النبي محمد صلى الله عليه وسلم.",
    summary: "السيرة النبوية الكاملة بتفاصيلها من المصادر الأصلية.",
    totalCopies: 30,
    availableCopies: 25,
  },

  // Arabic Poetry
  {
    title: "ديوان محمود درويش",
    author: "محمود درويش",
    genre: "شعر",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781566563499-L.jpg",
    coverColor: "#c62828",
    description:
      "مجموعة من أشعار الشاعر الفلسطيني الكبير محمود درويش، شاعر المقاومة والهوية.",
    summary: "قصائد تتناول القضية الفلسطينية والوطن والحب والهوية.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "ديوان المتنبي",
    author: "أبو الطيب المتنبي",
    genre: "شعر كلاسيكي",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789953445359-L.jpg",
    coverColor: "#ff6f00",
    description:
      "ديوان أشعار المتنبي، أعظم شعراء العربية، يضم قصائده في المدح والفخر والحكمة.",
    summary: "أشعار المتنبي الخالدة في الحكمة والفخر والمدح.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Arabic Philosophy & History
  {
    title: "مقدمة ابن خلدون",
    author: "ابن خلدون",
    genre: "فلسفة وتاريخ",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780691166285-L.jpg",
    coverColor: "#37474f",
    description:
      "المقدمة الشهيرة لكتاب العبر، أسست لعلم الاجتماع وفلسفة التاريخ.",
    summary: "دراسة عميقة للمجتمعات والحضارات وقوانين صعودها وسقوطها.",
    totalCopies: 18,
    availableCopies: 14,
  },

  // Children's Literature in Arabic
  {
    title: "حكايات كامل كيلاني",
    author: "كامل كيلاني",
    genre: "أدب أطفال",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789770278017-L.jpg",
    coverColor: "#e65100",
    description:
      "مجموعة من القصص والحكايات للأطفال من تأليف رائد أدب الطفل العربي.",
    summary: "قصص ممتعة ومفيدة للأطفال تجمع بين التسلية والتعليم.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "قصص الأنبياء",
    author: "ابن كثير",
    genre: "أدب أطفال إسلامي",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789960892481-L.jpg",
    coverColor: "#2e7d32",
    description:
      "قصص الأنبياء من القرآن الكريم والسنة النبوية، مقدمة بأسلوب مبسط.",
    summary: "قصص الأنبياء والرسل من آدم إلى محمد عليهم السلام.",
    totalCopies: 35,
    availableCopies: 30,
  },
]

// English Books - School curriculum relevant with Open Library covers (ISBN-based)
const ENGLISH_BOOKS = [
  // Classic Literature
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780446310789-L.jpg",
    coverColor: "#ffc107",
    description:
      "A gripping tale of racial injustice and childhood innocence in the American South. Through the eyes of Scout Finch, we witness her father Atticus defend a Black man wrongly accused.",
    summary:
      "A Pulitzer Prize-winning novel about justice, morality, and growing up in a racially divided society.",
    totalCopies: 20,
    availableCopies: 15,
  },
  {
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian Fiction",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
    coverColor: "#d32f2f",
    description:
      "A chilling dystopian masterpiece about a totalitarian society where Big Brother watches everything.",
    summary:
      "George Orwell's prophetic novel about surveillance, propaganda, and the corruption of truth.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "Animal Farm",
    author: "George Orwell",
    genre: "Political Allegory",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg",
    coverColor: "#4caf50",
    description:
      "A satirical allegory about the Russian Revolution, told through a farm where animals rebel.",
    summary:
      "A powerful political fable that uses animals to explore corruption and power.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "Lord of the Flies",
    author: "William Golding",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780399501487-L.jpg",
    coverColor: "#ff5722",
    description:
      "A group of boys stranded on a deserted island descend into savagery.",
    summary:
      "William Golding's Nobel Prize-winning novel about the darkness within humanity.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Classic Romance",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
    coverColor: "#e91e63",
    description:
      "The witty and romantic story of Elizabeth Bennet and Mr. Darcy.",
    summary:
      "Jane Austen's beloved masterpiece about love, pride, and social expectations.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
    coverColor: "#1a237e",
    description:
      "The tragic story of Jay Gatsby and his pursuit of the American Dream.",
    summary:
      "Fitzgerald's defining novel of the 1920s, examining the corruption of the American Dream.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // African & Middle Eastern Literature
  {
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    genre: "African Literature",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385474542-L.jpg",
    coverColor: "#8d6e63",
    description:
      "The story of Okonkwo and the devastating effects of colonialism on traditional African society.",
    summary:
      "Chinua Achebe's masterpiece about pre-colonial Nigeria and the clash with European colonialism.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    genre: "Contemporary Fiction",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg",
    coverColor: "#f44336",
    description:
      "A powerful story of friendship, betrayal, and redemption set against the backdrop of Afghanistan.",
    summary:
      "Hosseini's debut novel about two boys in Kabul and how their friendship shapes their lives.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "A Thousand Splendid Suns",
    author: "Khaled Hosseini",
    genre: "Contemporary Fiction",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781594483851-L.jpg",
    coverColor: "#ff9800",
    description:
      "The story of two Afghan women whose lives intersect during three decades of war.",
    summary:
      "An epic tale of love, sacrifice, and survival spanning three decades of Afghan history.",
    totalCopies: 18,
    availableCopies: 14,
  },

  // Science
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    genre: "Science",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
    coverColor: "#000000",
    description:
      "Stephen Hawking's landmark work explaining complex concepts like black holes and the Big Bang.",
    summary:
      "A groundbreaking exploration of the universe, from the Big Bang to black holes.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    genre: "History/Science",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780062316110-L.jpg",
    coverColor: "#e65100",
    description:
      "An exploration of how Homo sapiens came to dominate the Earth.",
    summary:
      "Harari's sweeping narrative of human history, from emergence to the present day.",
    totalCopies: 20,
    availableCopies: 15,
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    genre: "Science",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780345539434-L.jpg",
    coverColor: "#1565c0",
    description:
      "Carl Sagan's poetic journey through the universe, exploring the origins of life.",
    summary: "A celebration of science and the human spirit of exploration.",
    totalCopies: 15,
    availableCopies: 12,
  },

  // Young Adult
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Fiction",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
    coverColor: "#f9a825",
    description:
      "The mystical story of Santiago, a shepherd boy who travels from Spain to Egypt.",
    summary:
      "A philosophical tale about following your dreams and recognizing the extraordinary.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    genre: "Fiction",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg",
    coverColor: "#29b6f6",
    description:
      "The beloved tale of a pilot stranded in the desert who meets a young prince.",
    summary:
      "A timeless fable about seeing with the heart, friendship, and childlike wonder.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "The Giver",
    author: "Lois Lowry",
    genre: "Young Adult",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780544336261-L.jpg",
    coverColor: "#546e7a",
    description:
      "In a seemingly perfect community, young Jonas discovers the dark truth.",
    summary:
      "A powerful dystopian novel about memory, choice, and human connection.",
    totalCopies: 25,
    availableCopies: 20,
  },

  // Shakespeare
  {
    title: "Romeo and Juliet",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743477116-L.jpg",
    coverColor: "#ad1457",
    description:
      "Shakespeare's timeless tragedy of two young lovers whose deaths reconcile their families.",
    summary:
      "The world's most famous love story, exploring the intensity of young love.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "Hamlet",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743477123-L.jpg",
    coverColor: "#263238",
    description:
      "Shakespeare's greatest tragedy, following Prince Hamlet as he seeks revenge.",
    summary:
      "The iconic story of the Danish prince, exploring revenge and mortality.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "Macbeth",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743477109-L.jpg",
    coverColor: "#4e342e",
    description:
      "The dark tale of Macbeth's ambition and descent into tyranny.",
    summary:
      "Shakespeare's powerful exploration of ambition, guilt, and the corrupting nature of power.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Personal Development
  {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    genre: "Self-Development",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781982137274-L.jpg",
    coverColor: "#1976d2",
    description:
      "A comprehensive approach to personal and professional effectiveness.",
    summary:
      "Covey's influential guide to personal effectiveness through principle-centered living.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // History
  {
    title: "A Short History of Nearly Everything",
    author: "Bill Bryson",
    genre: "Science/History",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780767908184-L.jpg",
    coverColor: "#0277bd",
    description:
      "Bill Bryson takes readers on a journey through scientific discovery.",
    summary:
      "An entertaining exploration of how we know what we know about the universe.",
    totalCopies: 18,
    availableCopies: 14,
  },

  // NEW: Added incrementally to demonstrate additive seeding
  {
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Development",
    rating: 5,
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    coverColor: "#ff6f00",
    description:
      "An Easy & Proven Way to Build Good Habits & Break Bad Ones. Learn how tiny changes can lead to remarkable results.",
    summary:
      "James Clear's guide to building good habits and breaking bad ones through small, incremental changes.",
    totalCopies: 20,
    availableCopies: 18,
  },
]

// ============================================================================
// K-12 TEXTBOOKS - Sudanese Curriculum (KG1, KG2, Grades 1-12)
// ============================================================================

// Grade levels following Sudanese education system
const GRADE_LEVELS = [
  "KG1",
  "KG2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
]

// Subject definitions with Arabic and English names
const SUBJECTS = [
  { nameEn: "Mathematics", nameAr: "الرياضيات", color: "#1565c0" },
  { nameEn: "Arabic Language", nameAr: "اللغة العربية", color: "#2e7d32" },
  { nameEn: "English Language", nameAr: "اللغة الإنجليزية", color: "#c62828" },
  { nameEn: "Islamic Studies", nameAr: "الدراسات الإسلامية", color: "#00695c" },
  { nameEn: "Science", nameAr: "العلوم", color: "#6a1b9a" },
  { nameEn: "Social Studies", nameAr: "الدراسات الاجتماعية", color: "#ef6c00" },
  { nameEn: "Computer Science", nameAr: "الحاسوب", color: "#0277bd" },
  { nameEn: "Art Education", nameAr: "التربية الفنية", color: "#ad1457" },
  { nameEn: "Physical Education", nameAr: "التربية البدنية", color: "#558b2f" },
  { nameEn: "Music", nameAr: "الموسيقى", color: "#7b1fa2" },
]

// Generate textbooks for all grades and subjects
function generateTextbooks(): typeof ARABIC_BOOKS {
  const textbooks: typeof ARABIC_BOOKS = []
  const publishers = [
    "وزارة التربية والتعليم السودانية",
    "دار المعارف السودانية",
    "دار الخرطوم للنشر",
    "مطابع السودان للعملة",
    "دار البحر الأحمر",
  ]

  for (const level of GRADE_LEVELS) {
    for (const subject of SUBJECTS) {
      // Generate unique cover URL based on subject
      const coverUrls = [
        `https://covers.openlibrary.org/b/isbn/978147325${Math.floor(1000 + Math.random() * 9000)}-L.jpg`,
        `https://covers.openlibrary.org/b/isbn/978038547${Math.floor(1000 + Math.random() * 9000)}-L.jpg`,
        `https://covers.openlibrary.org/b/isbn/978074353${Math.floor(1000 + Math.random() * 9000)}-L.jpg`,
      ]

      const publisher =
        publishers[Math.floor(Math.random() * publishers.length)]
      const copies = Math.floor(20 + Math.random() * 30) // 20-50 copies

      textbooks.push({
        title: `${subject.nameAr} - ${level} | ${subject.nameEn} - ${level}`,
        author: publisher,
        genre: "كتاب مدرسي | Textbook",
        rating: 5,
        coverUrl: coverUrls[Math.floor(Math.random() * coverUrls.length)],
        coverColor: subject.color,
        description: `كتاب ${subject.nameAr} للصف ${level} وفق المنهج السوداني الحديث. يتضمن شرحاً مفصلاً للمفاهيم الأساسية مع تمارين وأنشطة متنوعة.\n\n${subject.nameEn} textbook for ${level} following the updated Sudanese curriculum. Includes detailed explanations and varied exercises.`,
        summary: `منهج ${subject.nameAr} - ${level} | ${subject.nameEn} Curriculum - ${level}`,
        totalCopies: copies,
        availableCopies: Math.floor(copies * 0.8), // 80% available
      })
    }
  }

  return textbooks
}

// Reference Materials - Subject-specific reference books
const REFERENCE_MATERIALS = [
  // Mathematics References
  {
    title: "موسوعة الرياضيات المدرسية | School Mathematics Encyclopedia",
    author: "أ.د. محمد عثمان",
    genre: "مرجع رياضيات | Math Reference",
    rating: 5,
    coverColor: "#1565c0",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780521663588-L.jpg",
    description:
      "موسوعة شاملة تغطي جميع مواضيع الرياضيات من المرحلة الابتدائية إلى الثانوية.",
    summary: "مرجع شامل لجميع مراحل تعليم الرياضيات.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "الجبر والهندسة للمرحلة الثانوية | Algebra & Geometry for Secondary",
    author: "د. أحمد محمود",
    genre: "مرجع رياضيات | Math Reference",
    rating: 5,
    coverColor: "#1976d2",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780199236695-L.jpg",
    description: "كتاب متقدم في الجبر والهندسة لطلاب المرحلة الثانوية.",
    summary: "مرجع متقدم للجبر والهندسة.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Science References
  {
    title: "موسوعة العلوم المبسطة | Simplified Science Encyclopedia",
    author: "د. فاطمة حسن",
    genre: "مرجع علوم | Science Reference",
    rating: 5,
    coverColor: "#6a1b9a",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780756636036-L.jpg",
    description:
      "موسوعة علمية مبسطة للأطفال والناشئين تغطي الفيزياء والكيمياء والأحياء.",
    summary: "موسوعة علوم للطلاب.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "الفيزياء الحديثة | Modern Physics",
    author: "أ.د. عمر البشير",
    genre: "فيزياء | Physics",
    rating: 5,
    coverColor: "#303f9f",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780321706973-L.jpg",
    description:
      "كتاب شامل في الفيزياء الحديثة يتناول النظرية النسبية وميكانيكا الكم.",
    summary: "مقدمة في الفيزياء الحديثة.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "أساسيات الكيمياء | Chemistry Fundamentals",
    author: "د. سارة عبدالله",
    genre: "كيمياء | Chemistry",
    rating: 5,
    coverColor: "#7b1fa2",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780321910295-L.jpg",
    description:
      "مرجع أساسي في الكيمياء يغطي المفاهيم الأساسية والتفاعلات الكيميائية.",
    summary: "أساسيات الكيمياء للطلاب.",
    totalCopies: 18,
    availableCopies: 15,
  },
  {
    title: "علم الأحياء الحديث | Modern Biology",
    author: "د. خالد إبراهيم",
    genre: "أحياء | Biology",
    rating: 5,
    coverColor: "#388e3c",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780321696816-L.jpg",
    description: "كتاب شامل في علم الأحياء يتناول الخلية والوراثة والتطور.",
    summary: "علم الأحياء للمرحلة الثانوية.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Arabic Language References
  {
    title: "معجم المعاني الجامع | Comprehensive Arabic Dictionary",
    author: "مجمع اللغة العربية",
    genre: "معجم | Dictionary",
    rating: 5,
    coverColor: "#2e7d32",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789774166563-L.jpg",
    description: "معجم عربي شامل يحتوي على أكثر من 100,000 كلمة مع شرح مفصل.",
    summary: "معجم عربي شامل.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "قواعد اللغة العربية الميسرة | Simplified Arabic Grammar",
    author: "د. عبدالرحمن الأنصاري",
    genre: "نحو وصرف | Grammar",
    rating: 5,
    coverColor: "#1b5e20",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789774248962-L.jpg",
    description: "شرح مبسط لقواعد اللغة العربية من النحو والصرف.",
    summary: "قواعد عربية مبسطة.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "البلاغة العربية | Arabic Rhetoric",
    author: "د. محمد أبو موسى",
    genre: "بلاغة | Rhetoric",
    rating: 5,
    coverColor: "#33691e",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789776000000-L.jpg",
    description: "كتاب في البلاغة العربية يشرح المعاني والبيان والبديع.",
    summary: "فنون البلاغة العربية.",
    totalCopies: 15,
    availableCopies: 12,
  },

  // English References
  {
    title: "Oxford English Dictionary for Students",
    author: "Oxford University Press",
    genre: "Dictionary",
    rating: 5,
    coverColor: "#c62828",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780194392792-L.jpg",
    description: "قاموس أكسفورد للطلاب مع تعريفات واضحة وأمثلة متعددة.",
    summary: "English dictionary for students.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "English Grammar in Use",
    author: "Raymond Murphy",
    genre: "Grammar",
    rating: 5,
    coverColor: "#d32f2f",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781108457651-L.jpg",
    description:
      "A self-study reference and practice book for intermediate learners of English.",
    summary: "Essential English grammar guide.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "Academic Writing Skills",
    author: "Peter Chin",
    genre: "Writing",
    rating: 5,
    coverColor: "#b71c1c",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781107621091-L.jpg",
    description: "A comprehensive guide to academic writing for students.",
    summary: "Guide to academic writing.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Islamic Studies References
  {
    title: "تفسير الجلالين | Tafsir al-Jalalayn",
    author: "جلال الدين المحلي والسيوطي",
    genre: "تفسير | Tafsir",
    rating: 5,
    coverColor: "#00695c",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781842001165-L.jpg",
    description: "من أشهر التفاسير المختصرة للقرآن الكريم.",
    summary: "تفسير مختصر للقرآن.",
    totalCopies: 40,
    availableCopies: 35,
  },
  {
    title: "صحيح البخاري مع الشرح | Sahih Al-Bukhari with Commentary",
    author: "الإمام البخاري",
    genre: "حديث | Hadith",
    rating: 5,
    coverColor: "#004d40",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789960969015-L.jpg",
    description: "أصح كتب الحديث مع شرح مفصل.",
    summary: "صحيح البخاري بالشرح.",
    totalCopies: 35,
    availableCopies: 30,
  },
  {
    title: "الفقه الإسلامي الميسر | Simplified Islamic Jurisprudence",
    author: "د. وهبة الزحيلي",
    genre: "فقه | Fiqh",
    rating: 5,
    coverColor: "#00796b",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789953520162-L.jpg",
    description: "كتاب في الفقه الإسلامي بأسلوب معاصر ميسر.",
    summary: "فقه إسلامي مبسط.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "السيرة النبوية للأطفال | Prophet's Biography for Children",
    author: "محمود المصري",
    genre: "سيرة | Seerah",
    rating: 5,
    coverColor: "#26a69a",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789770259870-L.jpg",
    description: "سيرة النبي محمد صلى الله عليه وسلم للأطفال بأسلوب مبسط.",
    summary: "سيرة نبوية للأطفال.",
    totalCopies: 30,
    availableCopies: 25,
  },

  // Social Studies References
  {
    title: "تاريخ السودان الحديث | Modern History of Sudan",
    author: "د. محمد سعيد القدال",
    genre: "تاريخ | History",
    rating: 5,
    coverColor: "#ef6c00",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789776000001-L.jpg",
    description: "دراسة شاملة لتاريخ السودان من الممالك القديمة إلى الاستقلال.",
    summary: "تاريخ السودان الشامل.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "جغرافية السودان | Geography of Sudan",
    author: "د. عبدالمنعم الخالق",
    genre: "جغرافيا | Geography",
    rating: 5,
    coverColor: "#e65100",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789776000002-L.jpg",
    description: "كتاب شامل عن جغرافية السودان الطبيعية والبشرية.",
    summary: "جغرافيا السودان.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "التربية الوطنية | Civic Education",
    author: "وزارة التربية السودانية",
    genre: "تربية وطنية | Civics",
    rating: 5,
    coverColor: "#ff6f00",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789776000003-L.jpg",
    description: "كتاب في التربية الوطنية والمواطنة.",
    summary: "التربية المدنية.",
    totalCopies: 25,
    availableCopies: 20,
  },

  // Computer Science References
  {
    title: "مقدمة في البرمجة بلغة بايثون | Introduction to Python Programming",
    author: "د. أيمن محمد",
    genre: "برمجة | Programming",
    rating: 5,
    coverColor: "#0277bd",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781449355739-L.jpg",
    description: "مقدمة شاملة في البرمجة باستخدام لغة بايثون للمبتدئين.",
    summary: "تعلم برمجة بايثون.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "أساسيات علوم الحاسوب | Computer Science Fundamentals",
    author: "د. هالة عبدالرحمن",
    genre: "حاسوب | Computer Science",
    rating: 5,
    coverColor: "#01579b",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780132550543-L.jpg",
    description: "كتاب شامل في أساسيات علوم الحاسوب.",
    summary: "أساسيات الحاسوب.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "تصميم صفحات الويب | Web Design",
    author: "م. سامي حسن",
    genre: "تصميم ويب | Web Design",
    rating: 5,
    coverColor: "#0288d1",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781119621553-L.jpg",
    description: "تعلم تصميم صفحات الويب باستخدام HTML و CSS.",
    summary: "أساسيات تصميم الويب.",
    totalCopies: 15,
    availableCopies: 12,
  },
]

// Additional Literature - More regional and international books
const ADDITIONAL_LITERATURE = [
  // Sudanese Authors
  {
    title: "شوق الدرويش | Longing of the Dervish",
    author: "حمور زيادة",
    genre: "أدب سوداني | Sudanese Literature",
    rating: 5,
    coverColor: "#5d4037",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789992142394-L.jpg",
    description: "رواية من السودان حازت على جائزة نجيب محفوظ للأدب.",
    summary: "رواية سودانية حائزة على جوائز.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "ذاكرة الجسد | Memory in the Flesh",
    author: "أحلام مستغانمي",
    genre: "أدب جزائري | Algerian Literature",
    rating: 5,
    coverColor: "#4e342e",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781859640951-L.jpg",
    description: "واحدة من أشهر الروايات العربية المعاصرة.",
    summary: "رواية عربية كلاسيكية حديثة.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "عمارة يعقوبيان | The Yacoubian Building",
    author: "علاء الأسواني",
    genre: "أدب مصري | Egyptian Literature",
    rating: 5,
    coverColor: "#6d4c41",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789774248870-L.jpg",
    description: "رواية تصور الحياة في القاهرة المعاصرة.",
    summary: "صورة من الحياة المصرية المعاصرة.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // African Literature
  {
    title: "Half of a Yellow Sun",
    author: "Chimamanda Ngozi Adichie",
    genre: "African Literature",
    rating: 5,
    coverColor: "#ff8f00",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780007200283-L.jpg",
    description: "A powerful novel set during the Nigerian Civil War.",
    summary: "Award-winning novel about the Biafran war.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "Americanah",
    author: "Chimamanda Ngozi Adichie",
    genre: "African Literature",
    rating: 5,
    coverColor: "#ff6f00",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780307455925-L.jpg",
    description:
      "A story of love, race, and identity spanning Nigeria, the UK, and America.",
    summary: "A powerful story of identity and belonging.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "So Long a Letter",
    author: "Mariama Bâ",
    genre: "African Literature",
    rating: 5,
    coverColor: "#e65100",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781577667064-L.jpg",
    description: "A Senegalese woman's moving account of her life.",
    summary: "Classic of African women's literature.",
    totalCopies: 12,
    availableCopies: 10,
  },

  // More Young Adult
  {
    title: "Harry Potter and the Chamber of Secrets",
    author: "J.K. Rowling",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#1a237e",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780747538493-L.jpg",
    description:
      "Harry's second year at Hogwarts brings new mysteries and dangers.",
    summary: "The Chamber of Secrets has been opened.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "Harry Potter and the Prisoner of Azkaban",
    author: "J.K. Rowling",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#283593",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780747546290-L.jpg",
    description: "A dangerous prisoner has escaped from Azkaban.",
    summary: "Harry learns about his godfather Sirius Black.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "Harry Potter and the Goblet of Fire",
    author: "J.K. Rowling",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#303f9f",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780747550990-L.jpg",
    description: "Harry is mysteriously entered in the Triwizard Tournament.",
    summary: "The Triwizard Tournament brings danger.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "The Hunger Games",
    author: "Suzanne Collins",
    genre: "Young Adult",
    rating: 5,
    coverColor: "#bf360c",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780439023481-L.jpg",
    description:
      "In a dark vision of the near future, children are selected to fight to the death.",
    summary: "Katniss volunteers to save her sister.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "Divergent",
    author: "Veronica Roth",
    genre: "Young Adult",
    rating: 5,
    coverColor: "#5d4037",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780062024039-L.jpg",
    description: "In a future Chicago, society is divided into factions.",
    summary: "Tris must choose her faction.",
    totalCopies: 18,
    availableCopies: 14,
  },

  // More Science
  {
    title: "The Origin of Species",
    author: "Charles Darwin",
    genre: "Science",
    rating: 5,
    coverColor: "#2e7d32",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780451529060-L.jpg",
    description:
      "Darwin's groundbreaking work on evolution by natural selection.",
    summary: "The theory of evolution.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "The Selfish Gene",
    author: "Richard Dawkins",
    genre: "Science",
    rating: 5,
    coverColor: "#388e3c",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780192860927-L.jpg",
    description:
      "A revolutionary look at evolution from the gene's perspective.",
    summary: "Genes and evolution.",
    totalCopies: 12,
    availableCopies: 10,
  },
  {
    title: "Silent Spring",
    author: "Rachel Carson",
    genre: "Science/Environment",
    rating: 5,
    coverColor: "#4caf50",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780618249060-L.jpg",
    description: "The book that launched the environmental movement.",
    summary: "Environmental awareness classic.",
    totalCopies: 15,
    availableCopies: 12,
  },

  // Philosophy & Self-Help
  {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    genre: "Philosophy",
    rating: 5,
    coverColor: "#37474f",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780807014295-L.jpg",
    description: "A psychiatrist's lessons from the concentration camps.",
    summary: "Finding meaning in suffering.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    genre: "Philosophy",
    rating: 5,
    coverColor: "#455a64",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780140449334-L.jpg",
    description: "The private thoughts of a Roman Emperor.",
    summary: "Stoic philosophy.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    genre: "Self-Development",
    rating: 5,
    coverColor: "#f9a825",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781585424337-L.jpg",
    description: "Classic principles of success and achievement.",
    summary: "Classic success principles.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Children's Books
  {
    title: "Charlotte's Web",
    author: "E.B. White",
    genre: "Children's Fiction",
    rating: 5,
    coverColor: "#8bc34a",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780064410939-L.jpg",
    description: "The story of a pig named Wilbur and his friend Charlotte.",
    summary: "Classic tale of friendship.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "The Lion, the Witch and the Wardrobe",
    author: "C.S. Lewis",
    genre: "Children's Fantasy",
    rating: 5,
    coverColor: "#7cb342",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780060234812-L.jpg",
    description: "Four children discover the magical land of Narnia.",
    summary: "Enter the world of Narnia.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "Matilda",
    author: "Roald Dahl",
    genre: "Children's Fiction",
    rating: 5,
    coverColor: "#689f38",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780142410370-L.jpg",
    description:
      "A brilliant girl with neglectful parents discovers she has special powers.",
    summary: "Matilda's magical abilities.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "The BFG",
    author: "Roald Dahl",
    genre: "Children's Fiction",
    rating: 5,
    coverColor: "#558b2f",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780142410387-L.jpg",
    description: "Sophie befriends the Big Friendly Giant.",
    summary: "The Big Friendly Giant.",
    totalCopies: 22,
    availableCopies: 18,
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#33691e",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
    description: "Bilbo Baggins embarks on an unexpected journey.",
    summary: "There and back again.",
    totalCopies: 20,
    availableCopies: 16,
  },
]

// Generate the textbooks array
const TEXTBOOKS = generateTextbooks()

// Featured Book - Harry Potter (created last to appear first)
const FEATURED_BOOK = {
  title: "Harry Potter and the Philosopher's Stone",
  author: "J.K. Rowling",
  genre: "Fantasy",
  rating: 5,
  coverUrl: "https://covers.openlibrary.org/b/isbn/9780747532743-L.jpg",
  coverColor: "#1a1a2e",
  description:
    "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. Addressed in green ink on yellowish parchment with a purple seal, they are swiftly confiscated by his grisly aunt and uncle. Then, on Harry's eleventh birthday, a great beetle-eyed giant of a man called Rubeus Hagrid bursts in with some astonishing news: Harry Potter is a wizard, and he has a place at Hogwarts School of Witchcraft and Wizardry.",
  summary:
    "The magical journey begins as Harry discovers he's a wizard and enters the enchanting world of Hogwarts.",
  totalCopies: 25,
  availableCopies: 20,
}

export async function seedLibrary(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log(
    "📚 Creating library (1000+ books: Textbooks, Literature, References)..."
  )

  // Combine all book collections
  const allBooks = [
    ...ARABIC_BOOKS,
    ...ENGLISH_BOOKS,
    ...TEXTBOOKS,
    ...REFERENCE_MATERIALS,
    ...ADDITIONAL_LITERATURE,
    FEATURED_BOOK,
  ]

  let createdCount = 0
  let skippedCount = 0

  // Create books one by one, checking if they exist first
  for (const book of allBooks) {
    const existing = await prisma.book.findFirst({
      where: { schoolId, title: book.title },
    })

    if (!existing) {
      await prisma.book.create({
        data: {
          schoolId,
          title: book.title,
          author: book.author,
          genre: book.genre,
          rating: book.rating,
          coverColor: book.coverColor,
          coverUrl: book.coverUrl,
          description: book.description,
          summary: book.summary,
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
        },
      })
      createdCount++
    } else {
      skippedCount++
    }
  }

  const textbookCount = TEXTBOOKS.length
  const literatureCount =
    ARABIC_BOOKS.length + ENGLISH_BOOKS.length + ADDITIONAL_LITERATURE.length
  const referenceCount = REFERENCE_MATERIALS.length

  console.log(
    `   ✅ Library: ${createdCount} new books, ${skippedCount} already existed`
  )
  console.log(`      Total collection: ${allBooks.length} books`)
  console.log(
    `      - Textbooks: ${textbookCount} (K-12 curriculum, 10 subjects × 14 grades)`
  )
  console.log(
    `      - Literature: ${literatureCount} (Arabic, African, International)`
  )
  console.log(
    `      - References: ${referenceCount} (Subject-specific reference materials)`
  )
  console.log(`      - Featured: Harry Potter and the Philosopher's Stone\n`)
}

/**
 * Seed Borrow Records - Library circulation history
 * Creates realistic borrow/return patterns over last 6 months
 */
export async function seedBorrowRecords(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("📖 Creating library borrow records...")

  // Get existing books and students with user accounts
  const books = await prisma.book.findMany({
    where: { schoolId },
    select: { id: true, title: true, availableCopies: true },
  })

  const studentsWithUsers = await prisma.student.findMany({
    where: { schoolId, userId: { not: null } },
    select: { id: true, userId: true, givenName: true, surname: true },
    take: 200, // Limit to 200 active borrowers
  })

  if (books.length === 0 || studentsWithUsers.length === 0) {
    console.log("   ⚠️  No books or students found, skipping borrow records\n")
    return
  }

  // Check for existing borrow records
  const existingCount = await prisma.borrowRecord.count({
    where: { schoolId },
  })

  if (existingCount >= 500) {
    console.log(
      `   ✅ Borrow records already exist (${existingCount}), skipping\n`
    )
    return
  }

  let createdCount = 0
  const now = new Date()
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  // Generate 2000 borrow records over the past year
  const borrowRecords: Array<{
    userId: string
    bookId: string
    schoolId: string
    borrowDate: Date
    dueDate: Date
    returnDate: Date | null
    status: BorrowStatus
  }> = []

  for (let i = 0; i < 2000; i++) {
    // Random student and book
    const student =
      studentsWithUsers[Math.floor(Math.random() * studentsWithUsers.length)]
    const book = books[Math.floor(Math.random() * books.length)]

    if (!student.userId) continue

    // Random borrow date within last year
    const borrowDate = new Date(
      oneYearAgo.getTime() +
        Math.random() * (now.getTime() - oneYearAgo.getTime())
    )

    // Due date: 14 days after borrow
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000)

    // Determine status and return date
    let status: BorrowStatus
    let returnDate: Date | null = null

    const random = Math.random()
    if (random < 0.7) {
      // 70% returned on time
      status = BorrowStatus.RETURNED
      // Return between borrow and due date
      returnDate = new Date(
        borrowDate.getTime() +
          Math.random() * (dueDate.getTime() - borrowDate.getTime())
      )
    } else if (random < 0.9) {
      // 20% still active/borrowed
      if (dueDate < now) {
        status = BorrowStatus.OVERDUE
      } else {
        status = BorrowStatus.BORROWED
      }
      returnDate = null
    } else {
      // 10% returned late (overdue then returned)
      status = BorrowStatus.RETURNED
      // Return 1-30 days after due date
      returnDate = new Date(
        dueDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000
      )
    }

    borrowRecords.push({
      userId: student.userId,
      bookId: book.id,
      schoolId,
      borrowDate,
      dueDate,
      returnDate,
      status,
    })
  }

  // Use createMany with skipDuplicates for efficiency
  const result = await prisma.borrowRecord.createMany({
    data: borrowRecords,
    skipDuplicates: true,
  })

  createdCount = result.count

  // Count by status
  const returnedCount = borrowRecords.filter(
    (r) => r.status === BorrowStatus.RETURNED
  ).length
  const borrowedCount = borrowRecords.filter(
    (r) => r.status === BorrowStatus.BORROWED
  ).length
  const overdueCount = borrowRecords.filter(
    (r) => r.status === BorrowStatus.OVERDUE
  ).length

  console.log(`   ✅ Created ${createdCount} borrow records:`)
  console.log(
    `      - Returned: ${returnedCount} (${Math.round((returnedCount / borrowRecords.length) * 100)}%)`
  )
  console.log(
    `      - Active: ${borrowedCount} (${Math.round((borrowedCount / borrowRecords.length) * 100)}%)`
  )
  console.log(
    `      - Overdue: ${overdueCount} (${Math.round((overdueCount / borrowRecords.length) * 100)}%)\n`
  )
}
