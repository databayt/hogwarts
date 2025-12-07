/**
 * Library Seed Module
 * Creates production-ready library with Arabic and English books
 * - Arabic books with Arabic metadata
 * - English books relevant to MEA region schools
 * - Actual book cover URLs
 *
 * Uses findFirst + create pattern - safe to run multiple times (no deletes)
 */

import type { SeedPrisma } from "./types";

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
    description: "رواية عرس الزين للكاتب السوداني الطيب صالح، تروي قصة شاب بسيط في قرية سودانية يعيش حياة مليئة بالبراءة والطيبة. تصور الرواية الحياة الريفية السودانية بكل تفاصيلها وجمالياتها.",
    summary: "قصة الزين، الشاب البسيط الذي يعيش في قرية سودانية، وكيف يتحول زواجه إلى حدث يجمع القرية كلها. رواية تحتفي بالقيم الإنسانية والتقاليد السودانية الأصيلة.",
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
    description: "رواية موسم الهجرة إلى الشمال، واحدة من أهم الروايات العربية في القرن العشرين. تتناول صراع الهوية بين الشرق والغرب من خلال قصة مصطفى سعيد.",
    summary: "رحلة مصطفى سعيد من السودان إلى إنجلترا وعودته، وما يكشفه ذلك عن التصادم الحضاري والبحث عن الهوية.",
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
    description: "ملحمة روائية تتألف من جزأين: ضو البيت ومريود. تروي قصة قرية ود حامد وشخصياتها المتعددة عبر أجيال مختلفة.",
    summary: "استمرار لعالم الطيب صالح الروائي في قرية ود حامد، مع شخصيات جديدة وقصص متشابكة.",
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
    description: "رواية رمزية للكاتب المصري نجيب محفوظ الحائز على جائزة نوبل، تتناول تاريخ البشرية من خلال حكاية حارة مصرية.",
    summary: "ملحمة رمزية عن تاريخ الإنسانية والأديان من خلال قصة عائلة الجبلاوي.",
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
    description: "الجزء الأول من ثلاثية نجيب محفوظ الشهيرة، تدور أحداثها في حي الجمالية بالقاهرة.",
    summary: "قصة عائلة أحمد عبد الجواد في القاهرة القديمة، مع تصوير دقيق للمجتمع المصري.",
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
    description: "رواية نفسية تتناول قصة سعيد مهران الذي يخرج من السجن ليجد أن زوجته خانته.",
    summary: "رحلة الانتقام والضياع في مصر الستينيات، مع تصوير عميق للصراع الداخلي.",
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
    description: "السيرة الذاتية لعميد الأدب العربي طه حسين، يروي فيها طفولته في صعيد مصر وفقدانه البصر.",
    summary: "قصة كفاح طه حسين من قرية صغيرة في الصعيد المصري إلى أعلى المناصب الأدبية.",
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
    description: "مجموعة من الحكايات على ألسنة الحيوانات، تحمل حكماً ودروساً في السياسة والأخلاق.",
    summary: "قصص الحيوانات الشهيرة التي تحمل دروساً في الحكمة والسياسة والأخلاق.",
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
    description: "مجموعة من الحكايات الشعبية العربية والفارسية والهندية، رواها شهرزاد للملك شهريار.",
    summary: "أشهر مجموعة قصصية في التراث العربي، تضم قصص علاء الدين والسندباد وعلي بابا.",
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
    description: "مجموعة من الأحاديث النبوية الشريفة مرتبة في أبواب تتناول مختلف جوانب الحياة الإسلامية.",
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
    description: "موسوعة فقهية شاملة تتناول أحكام العبادات والمعاملات بأسلوب ميسر.",
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
    description: "أشهر كتاب في السيرة النبوية، يروي حياة النبي محمد صلى الله عليه وسلم.",
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
    description: "مجموعة من أشعار الشاعر الفلسطيني الكبير محمود درويش، شاعر المقاومة والهوية.",
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
    description: "ديوان أشعار المتنبي، أعظم شعراء العربية، يضم قصائده في المدح والفخر والحكمة.",
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
    description: "المقدمة الشهيرة لكتاب العبر، أسست لعلم الاجتماع وفلسفة التاريخ.",
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
    description: "مجموعة من القصص والحكايات للأطفال من تأليف رائد أدب الطفل العربي.",
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
    description: "قصص الأنبياء من القرآن الكريم والسنة النبوية، مقدمة بأسلوب مبسط.",
    summary: "قصص الأنبياء والرسل من آدم إلى محمد عليهم السلام.",
    totalCopies: 35,
    availableCopies: 30,
  },
];

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
    description: "A gripping tale of racial injustice and childhood innocence in the American South. Through the eyes of Scout Finch, we witness her father Atticus defend a Black man wrongly accused.",
    summary: "A Pulitzer Prize-winning novel about justice, morality, and growing up in a racially divided society.",
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
    description: "A chilling dystopian masterpiece about a totalitarian society where Big Brother watches everything.",
    summary: "George Orwell's prophetic novel about surveillance, propaganda, and the corruption of truth.",
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
    description: "A satirical allegory about the Russian Revolution, told through a farm where animals rebel.",
    summary: "A powerful political fable that uses animals to explore corruption and power.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "Lord of the Flies",
    author: "William Golding",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327869409i/7624.jpg",
    coverColor: "#ff5722",
    description: "A group of boys stranded on a deserted island descend into savagery.",
    summary: "William Golding's Nobel Prize-winning novel about the darkness within humanity.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Classic Romance",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg",
    coverColor: "#e91e63",
    description: "The witty and romantic story of Elizabeth Bennet and Mr. Darcy.",
    summary: "Jane Austen's beloved masterpiece about love, pride, and social expectations.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg",
    coverColor: "#1a237e",
    description: "The tragic story of Jay Gatsby and his pursuit of the American Dream.",
    summary: "Fitzgerald's defining novel of the 1920s, examining the corruption of the American Dream.",
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
    description: "The story of Okonkwo and the devastating effects of colonialism on traditional African society.",
    summary: "Chinua Achebe's masterpiece about pre-colonial Nigeria and the clash with European colonialism.",
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
    description: "A powerful story of friendship, betrayal, and redemption set against the backdrop of Afghanistan.",
    summary: "Hosseini's debut novel about two boys in Kabul and how their friendship shapes their lives.",
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
    description: "The story of two Afghan women whose lives intersect during three decades of war.",
    summary: "An epic tale of love, sacrifice, and survival spanning three decades of Afghan history.",
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
    description: "Stephen Hawking's landmark work explaining complex concepts like black holes and the Big Bang.",
    summary: "A groundbreaking exploration of the universe, from the Big Bang to black holes.",
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
    description: "An exploration of how Homo sapiens came to dominate the Earth.",
    summary: "Harari's sweeping narrative of human history, from emergence to the present day.",
    totalCopies: 20,
    availableCopies: 15,
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    genre: "Science",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1532931155i/55030.jpg",
    coverColor: "#1565c0",
    description: "Carl Sagan's poetic journey through the universe, exploring the origins of life.",
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
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg",
    coverColor: "#f9a825",
    description: "The mystical story of Santiago, a shepherd boy who travels from Spain to Egypt.",
    summary: "A philosophical tale about following your dreams and recognizing the extraordinary.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    genre: "Fiction",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1367545443i/157993.jpg",
    coverColor: "#29b6f6",
    description: "The beloved tale of a pilot stranded in the desert who meets a young prince.",
    summary: "A timeless fable about seeing with the heart, friendship, and childlike wonder.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "The Giver",
    author: "Lois Lowry",
    genre: "Young Adult",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1342493368i/3636.jpg",
    coverColor: "#546e7a",
    description: "In a seemingly perfect community, young Jonas discovers the dark truth.",
    summary: "A powerful dystopian novel about memory, choice, and human connection.",
    totalCopies: 25,
    availableCopies: 20,
  },

  // Shakespeare
  {
    title: "Romeo and Juliet",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1629680008i/18135.jpg",
    coverColor: "#ad1457",
    description: "Shakespeare's timeless tragedy of two young lovers whose deaths reconcile their families.",
    summary: "The world's most famous love story, exploring the intensity of young love.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "Hamlet",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1351051208i/1420.jpg",
    coverColor: "#263238",
    description: "Shakespeare's greatest tragedy, following Prince Hamlet as he seeks revenge.",
    summary: "The iconic story of the Danish prince, exploring revenge and mortality.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "Macbeth",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348967016i/8852.jpg",
    coverColor: "#4e342e",
    description: "The dark tale of Macbeth's ambition and descent into tyranny.",
    summary: "Shakespeare's powerful exploration of ambition, guilt, and the corrupting nature of power.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Personal Development
  {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    genre: "Self-Development",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1421842784i/36072.jpg",
    coverColor: "#1976d2",
    description: "A comprehensive approach to personal and professional effectiveness.",
    summary: "Covey's influential guide to personal effectiveness through principle-centered living.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // History
  {
    title: "A Short History of Nearly Everything",
    author: "Bill Bryson",
    genre: "Science/History",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1433086293i/21.jpg",
    coverColor: "#0277bd",
    description: "Bill Bryson takes readers on a journey through scientific discovery.",
    summary: "An entertaining exploration of how we know what we know about the universe.",
    totalCopies: 18,
    availableCopies: 14,
  },

  // NEW: Added incrementally to demonstrate additive seeding
  {
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Development",
    rating: 5,
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg",
    coverColor: "#ff6f00",
    description: "An Easy & Proven Way to Build Good Habits & Break Bad Ones. Learn how tiny changes can lead to remarkable results.",
    summary: "James Clear's guide to building good habits and breaking bad ones through small, incremental changes.",
    totalCopies: 20,
    availableCopies: 18,
  },
];

// Featured Book - Harry Potter (created last to appear first)
const FEATURED_BOOK = {
  title: "Harry Potter and the Philosopher's Stone",
  author: "J.K. Rowling",
  genre: "Fantasy",
  rating: 5,
  coverUrl: "https://covers.openlibrary.org/b/isbn/9780747532743-L.jpg",
  coverColor: "#1a1a2e",
  description: "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. Addressed in green ink on yellowish parchment with a purple seal, they are swiftly confiscated by his grisly aunt and uncle. Then, on Harry's eleventh birthday, a great beetle-eyed giant of a man called Rubeus Hagrid bursts in with some astonishing news: Harry Potter is a wizard, and he has a place at Hogwarts School of Witchcraft and Wizardry.",
  summary: "The magical journey begins as Harry discovers he's a wizard and enters the enchanting world of Hogwarts.",
  totalCopies: 25,
  availableCopies: 20,
};

export async function seedLibrary(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("📚 Creating library (Arabic, Islamic, Sudanese & International literature)...");

  const allBooks = [...ARABIC_BOOKS, ...ENGLISH_BOOKS, FEATURED_BOOK];
  let createdCount = 0;
  let skippedCount = 0;

  // Create books one by one, checking if they exist first
  for (const book of allBooks) {
    const existing = await prisma.book.findFirst({
      where: { schoolId, title: book.title },
    });

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
      });
      createdCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`   ✅ Library: ${createdCount} new books, ${skippedCount} already existed`);
  console.log(`      - Arabic books: ${ARABIC_BOOKS.length} (Sudanese, Egyptian, Classical Arabic, Islamic)`);
  console.log(`      - English books: ${ENGLISH_BOOKS.length} (Literature, Science, Young Adult)`);
  console.log(`      - Featured: Harry Potter and the Philosopher's Stone\n`);
}
