/**
 * Library Seed
 * Creates 90 unique Arabic-titled books and borrow records
 *
 * Phase 6: Library
 *
 * Features:
 * - 90 unique books (no duplicated editions):
 *   - 15 Arabic Literature (المعلقات, لسان العرب, البلاغة)
 *   - 12 Islamic Studies (رياض الصالحين, فقه العبادات, قصص الأنبياء)
 *   - 12 Science textbooks (فيزياء, كيمياء, أحياء)
 *   - 10 Mathematics
 *   - 8 History/Geography
 *   - 8 Children's (KG-Primary)
 *   - 8 English
 *   - 8 Computer Science/Reference
 *   - 9 Quran Sciences
 * - totalCopies: 2-5 per book (realistic)
 * - 100 borrow records: 55 active + 15 overdue + 30 returned
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef } from "./types"
import { logPhase, logSuccess, randomNumber } from "./utils"

// ============================================================================
// BOOK DATA - 90 unique Arabic-titled books
// ============================================================================

interface BookSeed {
  title: string
  author: string
  genre: string
  description: string
  summary: string
  coverColor: string
  copies: number
}

const BOOKS: BookSeed[] = [
  // Arabic Literature (15)
  {
    title: "المعلقات السبع",
    author: "شعراء الجاهلية",
    genre: "الأدب العربي",
    description: "المعلقات السبع الشهيرة من الشعر الجاهلي مع شرح وتحليل",
    summary: "دراسة تحليلية للمعلقات السبع",
    coverColor: "#3B82F6",
    copies: 4,
  },
  {
    title: "لسان العرب",
    author: "ابن منظور",
    genre: "الأدب العربي",
    description: "أشهر معاجم اللغة العربية وأكثرها شمولاً",
    summary: "المعجم العربي الشامل",
    coverColor: "#3B82F6",
    copies: 3,
  },
  {
    title: "البلاغة الواضحة",
    author: "علي الجارم ومصطفى أمين",
    genre: "الأدب العربي",
    description: "كتاب في البلاغة العربية للمرحلة الثانوية مع تمارين وأمثلة",
    summary: "أساسيات البلاغة العربية",
    coverColor: "#3B82F6",
    copies: 5,
  },
  {
    title: "النحو الوافي",
    author: "عباس حسن",
    genre: "الأدب العربي",
    description: "مرجع شامل في النحو العربي مع أمثلة تطبيقية من القرآن والشعر",
    summary: "مرجع النحو العربي",
    coverColor: "#3B82F6",
    copies: 4,
  },
  {
    title: "الكامل في اللغة والأدب",
    author: "المبرد",
    genre: "الأدب العربي",
    description: "موسوعة أدبية لغوية من التراث العربي",
    summary: "موسوعة اللغة والأدب",
    coverColor: "#3B82F6",
    copies: 2,
  },
  {
    title: "ألف ليلة وليلة",
    author: "مجهول",
    genre: "الأدب العربي",
    description: "مجموعة حكايات شعبية عربية شهيرة",
    summary: "حكايات ألف ليلة وليلة",
    coverColor: "#3B82F6",
    copies: 5,
  },
  {
    title: "كليلة ودمنة",
    author: "ابن المقفع",
    genre: "الأدب العربي",
    description: "حكايات على ألسنة الحيوانات في الحكمة والأخلاق",
    summary: "حكايات الحكمة والأخلاق",
    coverColor: "#3B82F6",
    copies: 4,
  },
  {
    title: "مقدمة ابن خلدون",
    author: "ابن خلدون",
    genre: "الأدب العربي",
    description: "أول كتاب في علم الاجتماع وفلسفة التاريخ",
    summary: "أساس علم الاجتماع",
    coverColor: "#3B82F6",
    copies: 3,
  },
  {
    title: "الأغاني",
    author: "أبو الفرج الأصفهاني",
    genre: "الأدب العربي",
    description: "موسوعة في الأدب والغناء والشعر العربي",
    summary: "موسوعة الأدب والغناء",
    coverColor: "#3B82F6",
    copies: 2,
  },
  {
    title: "ديوان المتنبي",
    author: "أبو الطيب المتنبي",
    genre: "الأدب العربي",
    description: "ديوان شاعر العرب الأكبر",
    summary: "أشعار المتنبي الخالدة",
    coverColor: "#3B82F6",
    copies: 3,
  },
  {
    title: "طوق الحمامة",
    author: "ابن حزم",
    genre: "الأدب العربي",
    description: "رسالة في الحب والأخلاق من التراث الأندلسي",
    summary: "فلسفة الحب عند العرب",
    coverColor: "#3B82F6",
    copies: 3,
  },
  {
    title: "الإملاء والترقيم",
    author: "عبد العليم إبراهيم",
    genre: "الأدب العربي",
    description: "قواعد الإملاء والترقيم في اللغة العربية",
    summary: "دليل الإملاء العربي",
    coverColor: "#3B82F6",
    copies: 5,
  },
  {
    title: "جواهر الأدب",
    author: "أحمد الهاشمي",
    genre: "الأدب العربي",
    description: "مختارات من أجمل النصوص الأدبية العربية",
    summary: "روائع الأدب العربي",
    coverColor: "#3B82F6",
    copies: 4,
  },
  {
    title: "المعجم الوسيط",
    author: "مجمع اللغة العربية",
    genre: "الأدب العربي",
    description: "معجم عصري شامل من مجمع اللغة العربية بالقاهرة",
    summary: "المعجم العربي الحديث",
    coverColor: "#3B82F6",
    copies: 3,
  },
  {
    title: "قواعد اللغة العربية المبسطة",
    author: "محمد أسعد النادري",
    genre: "الأدب العربي",
    description: "كتاب مبسط في قواعد اللغة العربية للطلاب",
    summary: "تبسيط قواعد العربية",
    coverColor: "#3B82F6",
    copies: 5,
  },

  // Islamic Studies (12)
  {
    title: "رياض الصالحين",
    author: "الإمام النووي",
    genre: "الدراسات الإسلامية",
    description: "مجموعة أحاديث نبوية في الأخلاق والعبادات والآداب",
    summary: "أحاديث في الأخلاق والعبادات",
    coverColor: "#059669",
    copies: 5,
  },
  {
    title: "فقه العبادات",
    author: "الشيخ محمد الأمين",
    genre: "الدراسات الإسلامية",
    description:
      "شرح مبسط لأحكام العبادات الأساسية: الطهارة والصلاة والصيام والزكاة والحج",
    summary: "أحكام العبادات الأساسية",
    coverColor: "#059669",
    copies: 4,
  },
  {
    title: "قصص الأنبياء",
    author: "ابن كثير",
    genre: "الدراسات الإسلامية",
    description: "قصص الأنبياء والرسل من القرآن الكريم والسنة النبوية",
    summary: "قصص الأنبياء من القرآن",
    coverColor: "#059669",
    copies: 5,
  },
  {
    title: "السيرة النبوية",
    author: "ابن هشام",
    genre: "الدراسات الإسلامية",
    description: "سيرة النبي محمد صلى الله عليه وسلم من المولد إلى الوفاة",
    summary: "حياة النبي صلى الله عليه وسلم",
    coverColor: "#059669",
    copies: 4,
  },
  {
    title: "تفسير ابن كثير",
    author: "ابن كثير",
    genre: "الدراسات الإسلامية",
    description: "من أشهر التفاسير بالمأثور، يعتمد على الأحاديث والآثار",
    summary: "تفسير القرآن بالمأثور",
    coverColor: "#059669",
    copies: 3,
  },
  {
    title: "الأربعون النووية",
    author: "الإمام النووي",
    genre: "الدراسات الإسلامية",
    description: "أربعون حديثاً نبوياً جامعة لأصول الدين",
    summary: "أحاديث جامعة لأصول الدين",
    coverColor: "#059669",
    copies: 5,
  },
  {
    title: "فقه السنة",
    author: "سيد سابق",
    genre: "الدراسات الإسلامية",
    description: "كتاب شامل في الفقه الإسلامي مع الأدلة من الكتاب والسنة",
    summary: "الفقه الإسلامي الميسر",
    coverColor: "#059669",
    copies: 3,
  },
  {
    title: "حصن المسلم",
    author: "سعيد القحطاني",
    genre: "الدراسات الإسلامية",
    description: "أذكار وأدعية من الكتاب والسنة",
    summary: "الأذكار والأدعية اليومية",
    coverColor: "#059669",
    copies: 5,
  },
  {
    title: "العقيدة الإسلامية",
    author: "محمد نعيم ياسين",
    genre: "الدراسات الإسلامية",
    description: "شرح مبسط لأركان الإيمان والعقيدة الإسلامية",
    summary: "أساسيات العقيدة",
    coverColor: "#059669",
    copies: 4,
  },
  {
    title: "الرحيق المختوم",
    author: "صفي الرحمن المباركفوري",
    genre: "الدراسات الإسلامية",
    description: "سيرة نبوية حائزة على جائزة رابطة العالم الإسلامي",
    summary: "أفضل كتب السيرة النبوية",
    coverColor: "#059669",
    copies: 4,
  },
  {
    title: "تاريخ الخلفاء الراشدين",
    author: "السيوطي",
    genre: "الدراسات الإسلامية",
    description: "تاريخ الخلفاء من أبي بكر إلى علي رضي الله عنهم",
    summary: "عصر الخلفاء الراشدين",
    coverColor: "#059669",
    copies: 3,
  },
  {
    title: "الأخلاق الإسلامية",
    author: "عبد الرحمن الميداني",
    genre: "الدراسات الإسلامية",
    description: "موسوعة في الأخلاق الإسلامية وأسسها",
    summary: "منظومة الأخلاق في الإسلام",
    coverColor: "#059669",
    copies: 3,
  },

  // Sciences (12)
  {
    title: "أساسيات الفيزياء",
    author: "د. إبراهيم محمد",
    genre: "العلوم",
    description:
      "كتاب الفيزياء للمرحلة الثانوية: الميكانيكا والحرارة والكهرباء",
    summary: "فيزياء المرحلة الثانوية",
    coverColor: "#8B5CF6",
    copies: 5,
  },
  {
    title: "الكيمياء العامة",
    author: "د. أمينة خالد",
    genre: "العلوم",
    description: "أساسيات الكيمياء: العناصر والمركبات والتفاعلات الكيميائية",
    summary: "أساسيات الكيمياء",
    coverColor: "#8B5CF6",
    copies: 5,
  },
  {
    title: "علم الأحياء",
    author: "د. زينب محمود",
    genre: "العلوم",
    description: "دراسة الكائنات الحية: الخلية والوراثة والبيئة",
    summary: "علم الحياة والكائنات",
    coverColor: "#8B5CF6",
    copies: 5,
  },
  {
    title: "الفيزياء الحديثة",
    author: "د. خالد حسن",
    genre: "العلوم",
    description: "النظرية النسبية وميكانيكا الكم والفيزياء النووية",
    summary: "فيزياء القرن العشرين",
    coverColor: "#8B5CF6",
    copies: 3,
  },
  {
    title: "الكيمياء العضوية",
    author: "د. سمير عبدالله",
    genre: "العلوم",
    description: "كيمياء المركبات العضوية والبوليمرات",
    summary: "كيمياء الكربون",
    coverColor: "#8B5CF6",
    copies: 3,
  },
  {
    title: "علم البيئة",
    author: "د. نور الهدى",
    genre: "العلوم",
    description: "النظم البيئية والتوازن البيئي والتنوع الحيوي",
    summary: "البيئة والتنوع الحيوي",
    coverColor: "#8B5CF6",
    copies: 4,
  },
  {
    title: "العلوم للمرحلة المتوسطة",
    author: "فريق تربوي",
    genre: "العلوم",
    description: "كتاب العلوم الشامل للمرحلة المتوسطة",
    summary: "علوم المرحلة المتوسطة",
    coverColor: "#8B5CF6",
    copies: 5,
  },
  {
    title: "جسم الإنسان",
    author: "د. فاطمة إبراهيم",
    genre: "العلوم",
    description: "تشريح ووظائف أعضاء الجسم البشري",
    summary: "رحلة داخل جسم الإنسان",
    coverColor: "#8B5CF6",
    copies: 4,
  },
  {
    title: "علم الفلك",
    author: "د. محمد الأمين",
    genre: "العلوم",
    description: "مقدمة في علم الفلك: النجوم والكواكب والمجرات",
    summary: "اكتشف الكون",
    coverColor: "#8B5CF6",
    copies: 2,
  },
  {
    title: "التجارب العلمية المنزلية",
    author: "سارة أحمد",
    genre: "العلوم",
    description: "100 تجربة علمية يمكن إجراؤها في المنزل",
    summary: "تجارب علمية ممتعة",
    coverColor: "#8B5CF6",
    copies: 4,
  },
  {
    title: "علوم الأرض",
    author: "د. عمر صالح",
    genre: "العلوم",
    description: "الجيولوجيا والصخور والمعادن والزلازل والبراكين",
    summary: "علوم الأرض والجيولوجيا",
    coverColor: "#8B5CF6",
    copies: 3,
  },
  {
    title: "المختبر الكيميائي",
    author: "د. هالة يوسف",
    genre: "العلوم",
    description: "دليل التجارب المخبرية في الكيمياء",
    summary: "تجارب كيميائية عملية",
    coverColor: "#8B5CF6",
    copies: 4,
  },

  // Mathematics (10)
  {
    title: "الجبر والهندسة",
    author: "د. يوسف عمر",
    genre: "الرياضيات",
    description: "أساسيات الجبر والهندسة للمرحلة الثانوية",
    summary: "رياضيات المرحلة الثانوية",
    coverColor: "#F59E0B",
    copies: 5,
  },
  {
    title: "حساب التفاضل والتكامل",
    author: "د. أحمد مصطفى",
    genre: "الرياضيات",
    description: "مقدمة في التفاضل والتكامل مع تطبيقات عملية",
    summary: "أساسيات التفاضل والتكامل",
    coverColor: "#F59E0B",
    copies: 4,
  },
  {
    title: "الإحصاء والاحتمالات",
    author: "د. حسن علي",
    genre: "الرياضيات",
    description: "مبادئ الإحصاء الوصفي والاستدلالي ونظرية الاحتمالات",
    summary: "الإحصاء والاحتمالات",
    coverColor: "#F59E0B",
    copies: 4,
  },
  {
    title: "الرياضيات للمرحلة المتوسطة",
    author: "فريق تربوي",
    genre: "الرياضيات",
    description: "كتاب الرياضيات الشامل للمرحلة المتوسطة",
    summary: "رياضيات المرحلة المتوسطة",
    coverColor: "#F59E0B",
    copies: 5,
  },
  {
    title: "الهندسة الفراغية",
    author: "د. مصطفى محمد",
    genre: "الرياضيات",
    description: "دراسة الأشكال ثلاثية الأبعاد والمجسمات",
    summary: "الهندسة في ثلاثة أبعاد",
    coverColor: "#F59E0B",
    copies: 3,
  },
  {
    title: "المصفوفات والمحددات",
    author: "د. عبدالرحمن خالد",
    genre: "الرياضيات",
    description: "الجبر الخطي: المصفوفات والمحددات والفضاءات الشعاعية",
    summary: "أساسيات الجبر الخطي",
    coverColor: "#F59E0B",
    copies: 3,
  },
  {
    title: "الرياضيات الممتعة",
    author: "ياسر الحسن",
    genre: "الرياضيات",
    description: "ألغاز وتمارين رياضية ممتعة لتنمية التفكير",
    summary: "ألغاز رياضية مسلية",
    coverColor: "#F59E0B",
    copies: 4,
  },
  {
    title: "حساب المثلثات",
    author: "د. صلاح الدين",
    genre: "الرياضيات",
    description: "الدوال المثلثية وتطبيقاتها في الفيزياء والهندسة",
    summary: "أساسيات حساب المثلثات",
    coverColor: "#F59E0B",
    copies: 4,
  },
  {
    title: "الرياضيات للابتدائي",
    author: "هدى محمد",
    genre: "الرياضيات",
    description: "كتاب الرياضيات للمرحلة الابتدائية بأسلوب تفاعلي",
    summary: "رياضيات ابتدائية ممتعة",
    coverColor: "#F59E0B",
    copies: 5,
  },
  {
    title: "نظرية الأعداد",
    author: "د. بشير أحمد",
    genre: "الرياضيات",
    description: "مقدمة في نظرية الأعداد وخواصها",
    summary: "عالم الأعداد الساحر",
    coverColor: "#F59E0B",
    copies: 2,
  },

  // History & Geography (8)
  {
    title: "تاريخ السودان",
    author: "د. طارق بشير",
    genre: "التاريخ والجغرافيا",
    description: "تاريخ السودان من العصور القديمة حتى العصر الحديث",
    summary: "رحلة عبر تاريخ السودان",
    coverColor: "#EC4899",
    copies: 4,
  },
  {
    title: "تاريخ الحضارة الإسلامية",
    author: "د. عبدالله النور",
    genre: "التاريخ والجغرافيا",
    description: "نهضة الحضارة الإسلامية وإنجازاتها في العلوم والفنون",
    summary: "العصر الذهبي للإسلام",
    coverColor: "#EC4899",
    copies: 3,
  },
  {
    title: "جغرافية العالم العربي",
    author: "د. سارة عثمان",
    genre: "التاريخ والجغرافيا",
    description: "الجغرافيا الطبيعية والبشرية للعالم العربي",
    summary: "العالم العربي جغرافياً",
    coverColor: "#EC4899",
    copies: 4,
  },
  {
    title: "أطلس العالم",
    author: "فريق جغرافي",
    genre: "التاريخ والجغرافيا",
    description: "خرائط ومعلومات عن جميع دول العالم",
    summary: "الأطلس الجغرافي الشامل",
    coverColor: "#EC4899",
    copies: 3,
  },
  {
    title: "تاريخ الأندلس",
    author: "د. محمد العناني",
    genre: "التاريخ والجغرافيا",
    description: "تاريخ الحضارة الإسلامية في الأندلس من الفتح إلى السقوط",
    summary: "قصة الأندلس",
    coverColor: "#EC4899",
    copies: 3,
  },
  {
    title: "التاريخ المعاصر",
    author: "د. أحمد سليمان",
    genre: "التاريخ والجغرافيا",
    description: "أحداث القرن العشرين والحرب العالمية وحركات التحرر",
    summary: "تاريخ العالم المعاصر",
    coverColor: "#EC4899",
    copies: 3,
  },
  {
    title: "جغرافية أفريقيا",
    author: "د. حسن موسى",
    genre: "التاريخ والجغرافيا",
    description: "جغرافية القارة الأفريقية: المناخ والسكان والموارد",
    summary: "أفريقيا القارة الغنية",
    coverColor: "#EC4899",
    copies: 3,
  },
  {
    title: "الحضارات القديمة",
    author: "د. مريم الأمين",
    genre: "التاريخ والجغرافيا",
    description: "حضارات مصر القديمة وبلاد الرافدين وكوش",
    summary: "حضارات ما قبل الإسلام",
    coverColor: "#EC4899",
    copies: 2,
  },

  // Children's Books (8)
  {
    title: "حكايات قبل النوم",
    author: "هدى إبراهيم",
    genre: "كتب الأطفال",
    description: "مجموعة حكايات ممتعة وتعليمية للأطفال قبل النوم",
    summary: "حكايات جميلة للصغار",
    coverColor: "#F472B6",
    copies: 5,
  },
  {
    title: "ألوان وأشكال",
    author: "منى صالح",
    genre: "كتب الأطفال",
    description: "تعلم الألوان والأشكال الهندسية بطريقة تفاعلية",
    summary: "الألوان والأشكال للأطفال",
    coverColor: "#F472B6",
    copies: 5,
  },
  {
    title: "الحروف العربية",
    author: "فاطمة حسن",
    genre: "كتب الأطفال",
    description: "تعلم الحروف العربية بالصور والألعاب التفاعلية",
    summary: "أبجدية عربية مصورة",
    coverColor: "#F472B6",
    copies: 5,
  },
  {
    title: "الأرقام الممتعة",
    author: "سمية البشير",
    genre: "كتب الأطفال",
    description: "تعلم العد والأرقام من 1 إلى 100 بطريقة مسلية",
    summary: "عالم الأرقام للصغار",
    coverColor: "#F472B6",
    copies: 5,
  },
  {
    title: "أنا أحب وطني",
    author: "نور عبدالقادر",
    genre: "كتب الأطفال",
    description: "قصة عن حب الوطن والانتماء للأطفال",
    summary: "قصة وطنية للأطفال",
    coverColor: "#F472B6",
    copies: 4,
  },
  {
    title: "الحيوانات حول العالم",
    author: "أميرة عثمان",
    genre: "كتب الأطفال",
    description: "تعرف على الحيوانات وبيئاتها المختلفة حول العالم",
    summary: "عالم الحيوانات المدهش",
    coverColor: "#F472B6",
    copies: 4,
  },
  {
    title: "قصص من القرآن للأطفال",
    author: "رقية سليمان",
    genre: "كتب الأطفال",
    description: "قصص الأنبياء مبسطة ومصورة للأطفال",
    summary: "قصص قرآنية للصغار",
    coverColor: "#F472B6",
    copies: 5,
  },
  {
    title: "المهن والحرف",
    author: "حليمة آدم",
    genre: "كتب الأطفال",
    description: "تعرف على المهن المختلفة: الطبيب والمعلم والمهندس",
    summary: "ماذا تريد أن تكون؟",
    coverColor: "#F472B6",
    copies: 4,
  },

  // English (8)
  {
    title: "English for Beginners",
    author: "John Smith",
    genre: "اللغة الإنجليزية",
    description: "Step-by-step guide to learning English from scratch",
    summary: "Start your English journey",
    coverColor: "#10B981",
    copies: 5,
  },
  {
    title: "English Grammar in Use",
    author: "Raymond Murphy",
    genre: "اللغة الإنجليزية",
    description:
      "The world's best-selling grammar book for intermediate learners",
    summary: "Essential English grammar",
    coverColor: "#10B981",
    copies: 4,
  },
  {
    title: "Oxford Picture Dictionary",
    author: "Jayme Adelson-Goldstein",
    genre: "اللغة الإنجليزية",
    description: "Bilingual visual dictionary with 4,000 words",
    summary: "Visual English-Arabic dictionary",
    coverColor: "#10B981",
    copies: 4,
  },
  {
    title: "English Vocabulary in Use",
    author: "Michael McCarthy",
    genre: "اللغة الإنجليزية",
    description: "Build your vocabulary with practice exercises",
    summary: "Essential English vocabulary",
    coverColor: "#10B981",
    copies: 3,
  },
  {
    title: "Stories for Young Readers",
    author: "Sarah Williams",
    genre: "اللغة الإنجليزية",
    description: "Short stories in simple English for young learners",
    summary: "Easy English stories",
    coverColor: "#10B981",
    copies: 5,
  },
  {
    title: "English Conversation Practice",
    author: "Grant Taylor",
    genre: "اللغة الإنجليزية",
    description: "Practical dialogues for everyday English conversation",
    summary: "Speak English confidently",
    coverColor: "#10B981",
    copies: 3,
  },
  {
    title: "English Writing Skills",
    author: "Diana Hanbury King",
    genre: "اللغة الإنجليزية",
    description: "Develop your English writing from sentences to essays",
    summary: "Master English writing",
    coverColor: "#10B981",
    copies: 3,
  },
  {
    title: "English Phonics",
    author: "Jolly Learning",
    genre: "اللغة الإنجليزية",
    description: "Learn English sounds and pronunciation systematically",
    summary: "English pronunciation guide",
    coverColor: "#10B981",
    copies: 4,
  },

  // Computer Science & Reference (8)
  {
    title: "مقدمة في البرمجة",
    author: "م. أحمد خالد",
    genre: "الحاسوب والمراجع",
    description: "تعلم أساسيات البرمجة بلغة بايثون",
    summary: "ابدأ رحلة البرمجة",
    coverColor: "#6366F1",
    copies: 3,
  },
  {
    title: "أساسيات الحاسوب",
    author: "م. علي حسين",
    genre: "الحاسوب والمراجع",
    description: "مكونات الحاسوب ونظم التشغيل والشبكات",
    summary: "عالم الحاسوب",
    coverColor: "#6366F1",
    copies: 5,
  },
  {
    title: "تصميم صفحات الويب",
    author: "م. نور الدين",
    genre: "الحاسوب والمراجع",
    description: "تعلم HTML وCSS وتصميم مواقع الإنترنت",
    summary: "بناء مواقع الويب",
    coverColor: "#6366F1",
    copies: 3,
  },
  {
    title: "أمن المعلومات",
    author: "م. هشام بكري",
    genre: "الحاسوب والمراجع",
    description: "مبادئ أمن المعلومات وحماية البيانات",
    summary: "حماية المعلومات الرقمية",
    coverColor: "#6366F1",
    copies: 2,
  },
  {
    title: "القاموس العربي-الإنجليزي",
    author: "هانز ويهر",
    genre: "الحاسوب والمراجع",
    description: "قاموس ثنائي اللغة شامل للطلاب والباحثين",
    summary: "المرجع اللغوي الشامل",
    coverColor: "#78716C",
    copies: 3,
  },
  {
    title: "الموسوعة العلمية الميسرة",
    author: "فريق تحريري",
    genre: "الحاسوب والمراجع",
    description: "موسوعة علمية مبسطة تغطي جميع فروع العلوم",
    summary: "العلوم في متناول الجميع",
    coverColor: "#78716C",
    copies: 3,
  },
  {
    title: "معجم المصطلحات العلمية",
    author: "د. محمد الخطيب",
    genre: "الحاسوب والمراجع",
    description: "مصطلحات علمية عربية-إنجليزية في الفيزياء والكيمياء والأحياء",
    summary: "مصطلحات علمية مترجمة",
    coverColor: "#78716C",
    copies: 2,
  },
  {
    title: "الذكاء الاصطناعي للمبتدئين",
    author: "م. سارة حامد",
    genre: "الحاسوب والمراجع",
    description: "مقدمة في الذكاء الاصطناعي وتعلم الآلة",
    summary: "عالم الذكاء الاصطناعي",
    coverColor: "#6366F1",
    copies: 3,
  },

  // Quran Sciences (9)
  {
    title: "أحكام تجويد القرآن",
    author: "الشيخ محمود خليل الحصري",
    genre: "علوم القرآن",
    description: "شرح مفصل لأحكام التجويد مع أمثلة تطبيقية",
    summary: "تعلم التجويد",
    coverColor: "#14B8A6",
    copies: 5,
  },
  {
    title: "تفسير الجلالين",
    author: "المحلي والسيوطي",
    genre: "علوم القرآن",
    description: "تفسير موجز وشامل للقرآن الكريم",
    summary: "تفسير مختصر للقرآن",
    coverColor: "#14B8A6",
    copies: 3,
  },
  {
    title: "علوم القرآن",
    author: "مناع القطان",
    genre: "علوم القرآن",
    description: "مباحث في علوم القرآن: النزول والجمع والرسم والقراءات",
    summary: "مقدمة في علوم القرآن",
    coverColor: "#14B8A6",
    copies: 3,
  },
  {
    title: "المعين في حفظ القرآن",
    author: "الشيخ أحمد القطان",
    genre: "علوم القرآن",
    description: "طرق وأساليب حفظ القرآن الكريم ومراجعته",
    summary: "دليل حفظ القرآن",
    coverColor: "#14B8A6",
    copies: 5,
  },
  {
    title: "معاني الكلمات القرآنية",
    author: "د. حسنين مخلوف",
    genre: "علوم القرآن",
    description: "شرح كلمات القرآن الكريم الغريبة والصعبة",
    summary: "معجم ألفاظ القرآن",
    coverColor: "#14B8A6",
    copies: 4,
  },
  {
    title: "أسباب النزول",
    author: "الواحدي",
    genre: "علوم القرآن",
    description: "الأحداث والوقائع التي نزلت فيها آيات القرآن",
    summary: "أسباب نزول الآيات",
    coverColor: "#14B8A6",
    copies: 3,
  },
  {
    title: "إعراب القرآن الكريم",
    author: "محيي الدين الدرويش",
    genre: "علوم القرآن",
    description: "إعراب مفصل لآيات القرآن الكريم",
    summary: "الإعراب القرآني",
    coverColor: "#14B8A6",
    copies: 2,
  },
  {
    title: "تحفة الأطفال في التجويد",
    author: "سليمان الجمزوري",
    genre: "علوم القرآن",
    description: "منظومة في أحكام التجويد للمبتدئين",
    summary: "تجويد للمبتدئين",
    coverColor: "#14B8A6",
    copies: 5,
  },
  {
    title: "القراءات العشر",
    author: "الشيخ أحمد الطيبي",
    genre: "علوم القرآن",
    description: "مقدمة في القراءات القرآنية العشر المتواترة",
    summary: "علم القراءات",
    coverColor: "#14B8A6",
    copies: 2,
  },
]

// ============================================================================
// BOOK SEEDING
// ============================================================================

export async function seedBooks(
  prisma: PrismaClient,
  schoolId: string
): Promise<string[]> {
  logPhase(6, "LIBRARY", "المكتبة")

  const bookIds: string[] = []

  for (const bookData of BOOKS) {
    try {
      const existing = await prisma.book.findFirst({
        where: { schoolId, title: bookData.title, author: bookData.author },
      })

      if (existing) {
        bookIds.push(existing.id)
      } else {
        const book = await prisma.book.create({
          data: {
            schoolId,
            title: bookData.title,
            author: bookData.author,
            genre: bookData.genre,
            description: bookData.description,
            summary: bookData.summary,
            coverUrl: `https://picsum.photos/seed/${encodeURIComponent(bookData.title)}/200/300`,
            coverColor: bookData.coverColor,
            rating: randomNumber(3, 5),
            totalCopies: bookData.copies,
            availableCopies: bookData.copies,
          },
        })
        bookIds.push(book.id)
      }
    } catch {
      // Skip duplicates
    }
  }

  logSuccess("Books", bookIds.length, "unique Arabic-titled collection")

  return bookIds
}

// ============================================================================
// BORROW RECORDS SEEDING
// ============================================================================

export async function seedBorrowRecords(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  let borrowCount = 0

  const books = await prisma.book.findMany({
    where: { schoolId },
    select: { id: true, availableCopies: true },
  })

  if (books.length === 0) {
    logSuccess("Borrow Records", 0, "no books found")
    return 0
  }

  const studentUserIds = students
    .filter((s) => s.userId)
    .map((s) => s.userId!)
    .slice(0, 100)

  if (studentUserIds.length === 0) {
    logSuccess("Borrow Records", 0, "no student users found")
    return 0
  }

  const borrowConfigs = [
    // Active loans - on time (55)
    ...Array(55)
      .fill(null)
      .map(() => ({
        status: "BORROWED" as const,
        daysAgo: randomNumber(1, 10),
        dueDaysFromNow: randomNumber(4, 14),
        isReturned: false,
      })),
    // Overdue loans (15)
    ...Array(15)
      .fill(null)
      .map(() => ({
        status: "OVERDUE" as const,
        daysAgo: randomNumber(20, 30),
        dueDaysFromNow: -randomNumber(1, 10),
        isReturned: false,
      })),
    // Returned books (30)
    ...Array(30)
      .fill(null)
      .map(() => ({
        status: "RETURNED" as const,
        daysAgo: randomNumber(30, 60),
        dueDaysFromNow: 0,
        isReturned: true,
        returnDaysAgo: randomNumber(5, 25),
      })),
  ]

  let bookIndex = 0
  let userIndex = 0

  for (const config of borrowConfigs) {
    const bookId = books[bookIndex % books.length].id
    const userId = studentUserIds[userIndex % studentUserIds.length]

    bookIndex++
    userIndex++

    const now = new Date()
    const borrowDate = new Date(now)
    borrowDate.setDate(borrowDate.getDate() - config.daysAgo)

    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + config.dueDaysFromNow)

    let returnDate: Date | null = null
    if (config.isReturned && "returnDaysAgo" in config) {
      returnDate = new Date(now)
      returnDate.setDate(returnDate.getDate() - config.returnDaysAgo)
    }

    try {
      const existing = await prisma.borrowRecord.findFirst({
        where: {
          schoolId,
          bookId,
          userId,
          borrowDate: {
            gte: new Date(borrowDate.getTime() - 86400000),
            lte: new Date(borrowDate.getTime() + 86400000),
          },
        },
      })

      if (!existing) {
        await prisma.borrowRecord.create({
          data: {
            schoolId,
            bookId,
            userId,
            borrowDate,
            dueDate,
            returnDate,
            status: config.status,
          },
        })

        if (!config.isReturned) {
          await prisma.book.update({
            where: { id: bookId },
            data: { availableCopies: { decrement: 1 } },
          })
        }

        borrowCount++
      }
    } catch {
      // Skip if borrow record creation fails
    }
  }

  logSuccess(
    "Borrow Records",
    borrowCount,
    "55 active + 15 overdue + 30 returned"
  )

  return borrowCount
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedLibrary(
  prisma: PrismaClient,
  schoolId: string,
  students?: StudentRef[]
): Promise<number> {
  const bookIds = await seedBooks(prisma, schoolId)

  if (students && students.length > 0) {
    await seedBorrowRecords(prisma, schoolId, students)
  }

  return bookIds.length
}
