/**
 * Library Seed Data - Production Ready
 *
 * Comprehensive library collection for MEA region schools with:
 * - Arabic books (with Arabic metadata)
 * - English books (school curriculum relevant)
 * - Sudanese & regional literature
 * - Educational & academic books
 */

export interface LibraryBook {
  title: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  description: string;
  summary: string;
  totalCopies: number;
  availableCopies: number;
  videoUrl?: string;
}

// Arabic Books - with Arabic metadata
export const ARABIC_BOOKS: LibraryBook[] = [
  // Sudanese Literature
  {
    title: "عرس الزين",
    author: "الطيب صالح",
    genre: "أدب سوداني",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81Zy3g8vJjL._AC_UF1000,1000_QL80_.jpg",
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
    coverUrl: "https://m.media-amazon.com/images/I/71Ql3FE2hGL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#1a237e",
    description: "رواية موسم الهجرة إلى الشمال، واحدة من أهم الروايات العربية في القرن العشرين. تتناول صراع الهوية بين الشرق والغرب من خلال قصة مصطفى سعيد.",
    summary: "رحلة مصطفى سعيد من السودان إلى إنجلترا وعودته، وما يكشفه ذلك عن التصادم الحضاري والبحث عن الهوية. رواية عميقة عن الاستعمار وآثاره النفسية.",
    totalCopies: 20,
    availableCopies: 15,
  },
  {
    title: "بندر شاه",
    author: "الطيب صالح",
    genre: "أدب سوداني",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/61uCMvJg9iL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#4a148c",
    description: "ملحمة روائية تتألف من جزأين: ضو البيت ومريود. تروي قصة قرية ود حامد وشخصياتها المتعددة عبر أجيال مختلفة.",
    summary: "استمرار لعالم الطيب صالح الروائي في قرية ود حامد، مع شخصيات جديدة وقصص متشابكة تكشف عن عمق المجتمع السوداني.",
    totalCopies: 10,
    availableCopies: 8,
  },

  // Egyptian Literature
  {
    title: "أولاد حارتنا",
    author: "نجيب محفوظ",
    genre: "أدب مصري",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81h2gWPTYJL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#bf360c",
    description: "رواية رمزية للكاتب المصري نجيب محفوظ الحائز على جائزة نوبل، تتناول تاريخ البشرية من خلال حكاية حارة مصرية وأجيالها المتعاقبة.",
    summary: "ملحمة رمزية عن تاريخ الإنسانية والأديان من خلال قصة عائلة الجبلاوي وأبنائه الذين يمثلون الأنبياء والمصلحين عبر التاريخ.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "الثلاثية: بين القصرين",
    author: "نجيب محفوظ",
    genre: "أدب مصري",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/91ZVqfGv8HL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#1b5e20",
    description: "الجزء الأول من ثلاثية نجيب محفوظ الشهيرة، تدور أحداثها في حي الجمالية بالقاهرة في بدايات القرن العشرين.",
    summary: "قصة عائلة أحمد عبد الجواد في القاهرة القديمة، مع تصوير دقيق للمجتمع المصري وتحولاته السياسية والاجتماعية.",
    totalCopies: 15,
    availableCopies: 11,
  },
  {
    title: "اللص والكلاب",
    author: "نجيب محفوظ",
    genre: "أدب مصري",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71dPvNvx9gL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#263238",
    description: "رواية نفسية تتناول قصة سعيد مهران الذي يخرج من السجن ليجد أن زوجته خانته وصديقه سرق أمواله.",
    summary: "رحلة الانتقام والضياع في مصر الستينيات، مع تصوير عميق للصراع الداخلي والتحولات الاجتماعية.",
    totalCopies: 12,
    availableCopies: 10,
  },

  // Classical Arabic Literature
  {
    title: "الأيام",
    author: "طه حسين",
    genre: "سيرة ذاتية",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71Fm7ZmfuaL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#5d4037",
    description: "السيرة الذاتية لعميد الأدب العربي طه حسين، يروي فيها طفولته في صعيد مصر وفقدانه البصر ورحلته العلمية.",
    summary: "قصة كفاح طه حسين من قرية صغيرة في الصعيد المصري إلى أعلى المناصب الأدبية والأكاديمية رغم فقدان البصر.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "رسالة الغفران",
    author: "أبو العلاء المعري",
    genre: "أدب كلاسيكي",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/61Qa2T9yNJL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#4e342e",
    description: "تحفة أدبية من القرن الحادي عشر، رحلة خيالية في الجنة والنار يلتقي فيها المعري بشعراء وأدباء العرب.",
    summary: "رحلة فلسفية وأدبية خيالية تصور الآخرة بأسلوب ساخر وعميق، مع حوارات مع شخصيات تاريخية وأدبية.",
    totalCopies: 8,
    availableCopies: 6,
  },
  {
    title: "كليلة ودمنة",
    author: "ابن المقفع",
    genre: "أدب كلاسيكي",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71CJgbdKOsL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#00695c",
    description: "مجموعة من الحكايات على ألسنة الحيوانات، ترجمها ابن المقفع من الفارسية، وتحمل حكماً ودروساً في السياسة والأخلاق.",
    summary: "قصص الحيوانات الشهيرة التي تحمل دروساً في الحكمة والسياسة والأخلاق، من أشهر كتب الأدب العربي.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "ألف ليلة وليلة",
    author: "مجهول",
    genre: "أدب شعبي",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/91vjsvh0ksL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#6a1b9a",
    description: "مجموعة من الحكايات الشعبية العربية والفارسية والهندية، رواها شهرزاد للملك شهريار على مدى ألف ليلة وليلة.",
    summary: "أشهر مجموعة قصصية في التراث العربي، تضم قصص علاء الدين والسندباد وعلي بابا وغيرها من الحكايات الخالدة.",
    totalCopies: 30,
    availableCopies: 25,
  },

  // Islamic Studies
  {
    title: "رياض الصالحين",
    author: "الإمام النووي",
    genre: "دراسات إسلامية",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81kSWQYb1jL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#1b5e20",
    description: "مجموعة من الأحاديث النبوية الشريفة مرتبة في أبواب تتناول مختلف جوانب الحياة الإسلامية والأخلاق.",
    summary: "كتاب جامع للأحاديث النبوية في الأخلاق والعبادات والمعاملات، من أهم كتب الحديث للمسلمين.",
    totalCopies: 40,
    availableCopies: 35,
  },
  {
    title: "فقه السنة",
    author: "السيد سابق",
    genre: "دراسات إسلامية",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71HMbkqJKFL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#004d40",
    description: "موسوعة فقهية شاملة تتناول أحكام العبادات والمعاملات بأسلوب ميسر يجمع بين المذاهب الفقهية.",
    summary: "مرجع فقهي شامل يعرض الأحكام الشرعية بأدلتها من الكتاب والسنة بأسلوب واضح ومبسط.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "السيرة النبوية",
    author: "ابن هشام",
    genre: "دراسات إسلامية",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71TfWcG3DkL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#33691e",
    description: "أشهر كتاب في السيرة النبوية، يروي حياة النبي محمد صلى الله عليه وسلم منذ الميلاد حتى الوفاة.",
    summary: "السيرة النبوية الكاملة بتفاصيلها من المصادر الأصلية، مرجع أساسي لدراسة حياة النبي.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "تفسير ابن كثير",
    author: "ابن كثير",
    genre: "دراسات إسلامية",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/91a+UVZV9jL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#0d47a1",
    description: "تفسير القرآن الكريم بالمأثور، يعتمد على تفسير القرآن بالقرآن والسنة وأقوال الصحابة والتابعين.",
    summary: "من أشهر كتب التفسير وأكثرها انتشاراً، يجمع بين التفسير بالمأثور والرأي المعتدل.",
    totalCopies: 20,
    availableCopies: 15,
  },

  // Modern Arabic Poetry
  {
    title: "ديوان محمود درويش",
    author: "محمود درويش",
    genre: "شعر",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71Gmy5KmhGL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#c62828",
    description: "مجموعة من أشعار الشاعر الفلسطيني الكبير محمود درويش، شاعر المقاومة والهوية.",
    summary: "قصائد تتناول القضية الفلسطينية والوطن والحب والهوية، من أجمل ما كتب في الشعر العربي المعاصر.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "ديوان المتنبي",
    author: "أبو الطيب المتنبي",
    genre: "شعر كلاسيكي",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81TDGVhfTBL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#ff6f00",
    description: "ديوان أشعار المتنبي، أعظم شعراء العربية، يضم قصائده في المدح والفخر والحكمة والغزل.",
    summary: "أشعار المتنبي الخالدة في الحكمة والفخر والمدح، من أهم دواوين الشعر العربي.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Arabic Science & Education
  {
    title: "مقدمة ابن خلدون",
    author: "ابن خلدون",
    genre: "فلسفة وتاريخ",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81mhVL3jY9L._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#37474f",
    description: "المقدمة الشهيرة لكتاب العبر، أسست لعلم الاجتماع وفلسفة التاريخ، من أهم الكتب في التراث العربي والإنساني.",
    summary: "دراسة عميقة للمجتمعات والحضارات وقوانين صعودها وسقوطها، كتاب أسس علم الاجتماع.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "القانون في الطب",
    author: "ابن سينا",
    genre: "علوم",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71pTZDNOyTL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#00838f",
    description: "موسوعة طبية شاملة ألفها ابن سينا، ظلت مرجعاً طبياً في الشرق والغرب لقرون طويلة.",
    summary: "أعظم موسوعة طبية في التاريخ، تتناول الأمراض وعلاجاتها والأدوية والتشريح بشكل منهجي.",
    totalCopies: 10,
    availableCopies: 8,
  },

  // Children's Literature in Arabic
  {
    title: "حكايات كامل كيلاني",
    author: "كامل كيلاني",
    genre: "أدب أطفال",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81jqxpzg4CL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#e65100",
    description: "مجموعة من القصص والحكايات للأطفال من تأليف رائد أدب الطفل العربي كامل كيلاني.",
    summary: "قصص ممتعة ومفيدة للأطفال تجمع بين التسلية والتعليم، من كلاسيكيات أدب الطفل العربي.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "قصص الأنبياء",
    author: "ابن كثير",
    genre: "أدب أطفال إسلامي",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81uPk+yVnxL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#2e7d32",
    description: "قصص الأنبياء من القرآن الكريم والسنة النبوية، مقدمة بأسلوب مبسط للأطفال والناشئة.",
    summary: "قصص الأنبياء والرسل من آدم إلى محمد عليهم السلام، مع الدروس والعبر المستفادة.",
    totalCopies: 35,
    availableCopies: 30,
  },
];

// English Books - School Curriculum Relevant
export const ENGLISH_BOOKS: LibraryBook[] = [
  // Classic Literature
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81aY1lxk+9L._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#ffc107",
    description: "A gripping tale of racial injustice and childhood innocence in the American South. Through the eyes of Scout Finch, we witness her father Atticus defend a Black man wrongly accused of a crime.",
    summary: "A Pulitzer Prize-winning novel about justice, morality, and growing up in a racially divided society. Essential reading for understanding themes of equality and courage.",
    totalCopies: 20,
    availableCopies: 15,
  },
  {
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#d32f2f",
    description: "A chilling dystopian masterpiece about a totalitarian society where Big Brother watches everything. Winston Smith's rebellion against the Party explores themes of freedom, truth, and resistance.",
    summary: "George Orwell's prophetic novel about surveillance, propaganda, and the corruption of truth. A crucial text for understanding political systems and individual freedom.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "Animal Farm",
    author: "George Orwell",
    genre: "Political Allegory",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/91LUbAcpACL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#4caf50",
    description: "A satirical allegory about the Russian Revolution and Stalinism, told through a farm where animals rebel against their human farmer, only to end up under the tyranny of the pigs.",
    summary: "A powerful political fable that uses animals to explore corruption, power, and the betrayal of revolutionary ideals. Perfect for understanding political dynamics.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "Lord of the Flies",
    author: "William Golding",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81WUAoL-wFL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#ff5722",
    description: "A group of boys stranded on a deserted island descend into savagery in this powerful exploration of human nature, civilization, and the thin veneer of social order.",
    summary: "William Golding's Nobel Prize-winning novel about the darkness within humanity. Essential for exploring themes of civilization versus savagery.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Classic Romance",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71Q1tPupKjL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#e91e63",
    description: "The witty and romantic story of Elizabeth Bennet and Mr. Darcy, exploring themes of class, marriage, and personal growth in Regency-era England.",
    summary: "Jane Austen's beloved masterpiece about love, pride, and social expectations. A timeless exploration of relationships and personal growth.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "Great Expectations",
    author: "Charles Dickens",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/91hgi0bkRDL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#795548",
    description: "The coming-of-age story of orphan Pip, who rises from humble beginnings to become a gentleman in Victorian England, learning about love, loyalty, and true worth.",
    summary: "Dickens' masterful bildungsroman exploring social class, ambition, and moral development. A rich portrait of Victorian society.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#1a237e",
    description: "The tragic story of Jay Gatsby and his pursuit of the American Dream in the Jazz Age, exploring themes of wealth, love, and disillusionment.",
    summary: "Fitzgerald's defining novel of the 1920s, examining the corruption of the American Dream and the hollowness of wealth without meaning.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // World Literature & African/Middle Eastern Focus
  {
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    genre: "African Literature",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71UItGpTdcL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#8d6e63",
    description: "The story of Okonkwo, a proud Igbo warrior, and the devastating effects of colonialism on traditional African society. A foundational work of African literature.",
    summary: "Chinua Achebe's masterpiece about pre-colonial Nigeria and the clash between traditional African culture and European colonialism.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    genre: "Contemporary Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81LVEH25aQL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#f44336",
    description: "A powerful story of friendship, betrayal, and redemption set against the backdrop of a changing Afghanistan, from the fall of the monarchy to the Taliban era.",
    summary: "Hosseini's debut novel about two boys in Kabul and how their friendship shapes their lives. A moving exploration of guilt, redemption, and the bonds of family.",
    totalCopies: 20,
    availableCopies: 16,
  },
  {
    title: "A Thousand Splendid Suns",
    author: "Khaled Hosseini",
    genre: "Contemporary Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81bT6ypHZCL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#ff9800",
    description: "The story of two Afghan women, Mariam and Laila, whose lives intersect during three decades of war and upheaval. A tribute to the strength and resilience of women.",
    summary: "An epic tale of love, sacrifice, and survival spanning three decades of Afghan history, told through the lives of two remarkable women.",
    totalCopies: 18,
    availableCopies: 14,
  },

  // Science & Education
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    genre: "Science",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81pZeZEHyyL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#000000",
    description: "Stephen Hawking's landmark work explaining complex concepts like black holes, the Big Bang, and the nature of time in accessible language for general readers.",
    summary: "A groundbreaking exploration of the universe, from the Big Bang to black holes, making complex physics accessible to everyone.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    genre: "History/Science",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71N3-FFXtaL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#e65100",
    description: "An exploration of how Homo sapiens came to dominate the Earth, examining the cognitive, agricultural, and scientific revolutions that shaped human history.",
    summary: "Harari's sweeping narrative of human history, from the emergence of our species to the present day and beyond.",
    totalCopies: 20,
    availableCopies: 15,
  },
  {
    title: "The Origin of Species",
    author: "Charles Darwin",
    genre: "Science",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71YlxXWlDjL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#33691e",
    description: "Darwin's revolutionary work on evolution by natural selection, one of the most influential scientific books ever written, that changed our understanding of life on Earth.",
    summary: "The foundational text of evolutionary biology, presenting Darwin's theory of how species evolve through natural selection.",
    totalCopies: 12,
    availableCopies: 10,
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    genre: "Science",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/91Cnrbd4sqL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#1565c0",
    description: "Carl Sagan's poetic journey through the universe, exploring the origins of life, the nature of intelligence, and humanity's place in the cosmos.",
    summary: "A celebration of science and the human spirit of exploration, taking readers on a journey through space and time.",
    totalCopies: 15,
    availableCopies: 12,
  },

  // Mathematics & Logic
  {
    title: "The Joy of x: A Guided Tour of Math",
    author: "Steven Strogatz",
    genre: "Mathematics",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71OSTq4Y6LL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#7b1fa2",
    description: "An engaging exploration of mathematical concepts from basic arithmetic to calculus, showing how math illuminates our daily lives and the universe.",
    summary: "A delightful journey through mathematics that reveals the beauty and relevance of numbers in everyday life.",
    totalCopies: 12,
    availableCopies: 10,
  },
  {
    title: "Flatland: A Romance of Many Dimensions",
    author: "Edwin Abbott",
    genre: "Mathematics/Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/51nMH7JMEgL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#4527a0",
    description: "A classic mathematical fiction exploring dimensional geometry through a world inhabited by two-dimensional beings. Both a satire of Victorian society and an introduction to dimensions.",
    summary: "A unique novella that uses a two-dimensional world to explore mathematical concepts of dimension and space.",
    totalCopies: 15,
    availableCopies: 12,
  },

  // History
  {
    title: "A Short History of Nearly Everything",
    author: "Bill Bryson",
    genre: "Science/History",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71hRLF8RNIL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#0277bd",
    description: "Bill Bryson takes readers on a journey through scientific discovery, from the Big Bang to the rise of civilization, making complex topics entertaining and accessible.",
    summary: "An entertaining exploration of how we know what we know about the universe, Earth, and life itself.",
    totalCopies: 18,
    availableCopies: 14,
  },
  {
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    genre: "History",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81TQBP5FMYL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#bf360c",
    description: "Pulitzer Prize-winning exploration of why certain civilizations developed faster than others, examining the role of geography, agriculture, and technology.",
    summary: "Diamond's groundbreaking analysis of the factors that shaped human civilizations and determined which societies would dominate.",
    totalCopies: 15,
    availableCopies: 12,
  },

  // Personal Development
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    genre: "Psychology",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71wvKXWfcML._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#00897b",
    description: "Nobel laureate Daniel Kahneman explores the two systems that drive the way we think—fast, intuitive thinking and slow, deliberate thinking.",
    summary: "A fascinating exploration of how we make decisions and judgments, revealing the biases that influence our thinking.",
    totalCopies: 15,
    availableCopies: 12,
  },
  {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    genre: "Self-Development",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81PXFqYBRFL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#1976d2",
    description: "A comprehensive approach to personal and professional effectiveness, presenting seven fundamental habits for achieving goals and building character.",
    summary: "Covey's influential guide to personal effectiveness through principle-centered living and character development.",
    totalCopies: 20,
    availableCopies: 16,
  },

  // Young Adult Fiction
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/81FPzmB5fgL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#f9a825",
    description: "The mystical story of Santiago, an Andalusian shepherd boy who travels from Spain to Egypt in search of treasure and discovers his Personal Legend.",
    summary: "A philosophical tale about following your dreams and recognizing the extraordinary in the ordinary.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    genre: "Fiction",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71OZY035QKL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#29b6f6",
    description: "The beloved tale of a pilot stranded in the desert who meets a young prince from a tiny asteroid, exploring themes of love, loss, and what truly matters in life.",
    summary: "A timeless fable about seeing with the heart, friendship, and the importance of childlike wonder.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "The Giver",
    author: "Lois Lowry",
    genre: "Young Adult",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71Bp8u-wY3L._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#546e7a",
    description: "In a seemingly perfect community without pain or suffering, young Jonas is chosen to inherit the position of Receiver of Memory and discovers the dark truth about his society.",
    summary: "A powerful dystopian novel about memory, choice, and the importance of human connection and emotion.",
    totalCopies: 25,
    availableCopies: 20,
  },

  // Drama & Poetry
  {
    title: "Romeo and Juliet",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/91GSqphIvvL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#ad1457",
    description: "Shakespeare's timeless tragedy of two young lovers whose deaths ultimately reconcile their feuding families. The definitive story of love against all odds.",
    summary: "The world's most famous love story, exploring the intensity of young love and the tragedy of family conflict.",
    totalCopies: 30,
    availableCopies: 25,
  },
  {
    title: "Hamlet",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/71VNPSxS2WL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#263238",
    description: "Shakespeare's greatest tragedy, following Prince Hamlet as he seeks revenge for his father's murder while wrestling with questions of mortality, morality, and action.",
    summary: "The iconic story of the Danish prince, exploring themes of revenge, mortality, and the complexity of human nature.",
    totalCopies: 25,
    availableCopies: 20,
  },
  {
    title: "Macbeth",
    author: "William Shakespeare",
    genre: "Drama",
    rating: 5,
    coverUrl: "https://m.media-amazon.com/images/I/91V7qlfrdmL._AC_UF1000,1000_QL80_.jpg",
    coverColor: "#4e342e",
    description: "The dark tale of Macbeth's ambition and descent into tyranny after three witches prophesy that he will become King of Scotland.",
    summary: "Shakespeare's powerful exploration of ambition, guilt, and the corrupting nature of power.",
    totalCopies: 20,
    availableCopies: 16,
  },
];

/**
 * Seed library books to the database
 */
export async function seedLibraryBooks(prisma: any, schoolId: string) {
  const allBooks = [...ARABIC_BOOKS, ...ENGLISH_BOOKS];

  // Get existing books to avoid duplicates
  const existingBooks = await prisma.book.findMany({
    where: { schoolId },
    select: { title: true },
  });
  const existingTitles = new Set(existingBooks.map((b: any) => b.title));

  // Filter out existing books
  const newBooks = allBooks.filter((book) => !existingTitles.has(book.title));

  if (newBooks.length > 0) {
    await prisma.book.createMany({
      data: newBooks.map((book) => ({
        ...book,
        schoolId,
      })),
      skipDuplicates: true,
    });
    console.log(`✅ Seeded ${newBooks.length} new library books (${ARABIC_BOOKS.length} Arabic, ${ENGLISH_BOOKS.length} English)`);
  } else {
    console.log("✅ Library books already exist");
  }

  return allBooks.length;
}

/**
 * Get all library books for export/display
 */
export function getAllLibraryBooks(): LibraryBook[] {
  return [...ARABIC_BOOKS, ...ENGLISH_BOOKS];
}

/**
 * Get Arabic books only
 */
export function getArabicBooks(): LibraryBook[] {
  return ARABIC_BOOKS;
}

/**
 * Get English books only
 */
export function getEnglishBooks(): LibraryBook[] {
  return ENGLISH_BOOKS;
}
