/**
 * Library Seed Module
 * Creates library books - Arabic, Islamic, Sudanese, and International literature
 */

import type { SeedPrisma } from "./types";

const BOOKS_DATA = [
  // Arabic Literature
  { title: "موسم الهجرة إلى الشمال", titleEn: "Season of Migration to the North", author: "الطيب صالح", authorEn: "Tayeb Salih", genre: "Arabic Literature", rating: 5, coverColor: "#8B4513", totalCopies: 20, availableCopies: 15 },
  { title: "عرس الزين", titleEn: "The Wedding of Zein", author: "الطيب صالح", authorEn: "Tayeb Salih", genre: "Arabic Literature", rating: 5, coverColor: "#D4AF37", totalCopies: 15, availableCopies: 12 },
  { title: "بندرشاه", titleEn: "Bandarshah", author: "الطيب صالح", authorEn: "Tayeb Salih", genre: "Arabic Literature", rating: 5, coverColor: "#8B0000", totalCopies: 10, availableCopies: 8 },
  { title: "أولاد حارتنا", titleEn: "Children of Gebelawi", author: "نجيب محفوظ", authorEn: "Naguib Mahfouz", genre: "Arabic Literature", rating: 5, coverColor: "#2F4F4F", totalCopies: 12, availableCopies: 10 },
  { title: "ثلاثية القاهرة", titleEn: "The Cairo Trilogy", author: "نجيب محفوظ", authorEn: "Naguib Mahfouz", genre: "Arabic Literature", rating: 5, coverColor: "#4B0082", totalCopies: 8, availableCopies: 6 },
  { title: "رجال في الشمس", titleEn: "Men in the Sun", author: "غسان كنفاني", authorEn: "Ghassan Kanafani", genre: "Arabic Literature", rating: 5, coverColor: "#FF8C00", totalCopies: 10, availableCopies: 8 },
  { title: "ذاكرة الجسد", titleEn: "Memory in the Flesh", author: "أحلام مستغانمي", authorEn: "Ahlam Mosteghanemi", genre: "Arabic Literature", rating: 4, coverColor: "#DC143C", totalCopies: 8, availableCopies: 6 },

  // Islamic Studies & Quran
  { title: "القرآن الكريم", titleEn: "The Holy Quran", author: "كلام الله", authorEn: "Word of Allah", genre: "Islamic Studies", rating: 5, coverColor: "#006400", totalCopies: 50, availableCopies: 45 },
  { title: "صحيح البخاري", titleEn: "Sahih al-Bukhari", author: "الإمام البخاري", authorEn: "Imam Bukhari", genre: "Hadith", rating: 5, coverColor: "#8B4513", totalCopies: 20, availableCopies: 18 },
  { title: "صحيح مسلم", titleEn: "Sahih Muslim", author: "الإمام مسلم", authorEn: "Imam Muslim", genre: "Hadith", rating: 5, coverColor: "#4682B4", totalCopies: 20, availableCopies: 17 },
  { title: "رياض الصالحين", titleEn: "Riyad as-Salihin", author: "الإمام النووي", authorEn: "Imam Nawawi", genre: "Islamic Studies", rating: 5, coverColor: "#228B22", totalCopies: 25, availableCopies: 22 },
  { title: "تفسير ابن كثير", titleEn: "Tafsir Ibn Kathir", author: "ابن كثير", authorEn: "Ibn Kathir", genre: "Tafsir", rating: 5, coverColor: "#8B0000", totalCopies: 15, availableCopies: 12 },
  { title: "فقه السنة", titleEn: "Fiqh al-Sunnah", author: "السيد سابق", authorEn: "Sayyid Sabiq", genre: "Fiqh", rating: 5, coverColor: "#556B2F", totalCopies: 18, availableCopies: 15 },

  // Sudanese History & Culture
  { title: "تاريخ السودان الحديث", titleEn: "Modern History of Sudan", author: "محمد سعيد القدال", authorEn: "Muhammad Said al-Qaddal", genre: "Sudanese History", rating: 5, coverColor: "#D21034", totalCopies: 15, availableCopies: 12 },
  { title: "الممالك السودانية القديمة", titleEn: "Ancient Sudanese Kingdoms", author: "يوسف فضل حسن", authorEn: "Yusuf Fadl Hasan", genre: "Sudanese History", rating: 5, coverColor: "#007A3D", totalCopies: 12, availableCopies: 10 },
  { title: "الثورة المهدية في السودان", titleEn: "The Mahdist Revolution in Sudan", author: "محمد إبراهيم أبو سليم", authorEn: "Muhammad Ibrahim Abu Salim", genre: "Sudanese History", rating: 4, coverColor: "#000000", totalCopies: 10, availableCopies: 8 },

  // Arabic Language & Grammar
  { title: "النحو الواضح", titleEn: "Clear Arabic Grammar", author: "علي الجارم ومصطفى أمين", authorEn: "Ali al-Jarim & Mustafa Amin", genre: "Arabic Grammar", rating: 5, coverColor: "#1E90FF", totalCopies: 30, availableCopies: 25 },
  { title: "البلاغة الواضحة", titleEn: "Clear Rhetoric", author: "علي الجارم ومصطفى أمين", authorEn: "Ali al-Jarim & Mustafa Amin", genre: "Arabic Literature", rating: 4, coverColor: "#9932CC", totalCopies: 25, availableCopies: 22 },
  { title: "لسان العرب", titleEn: "Lisan al-Arab Dictionary", author: "ابن منظور", authorEn: "Ibn Manzur", genre: "Reference", rating: 5, coverColor: "#000080", totalCopies: 10, availableCopies: 8 },
  { title: "المعجم الوسيط", titleEn: "Al-Waseet Dictionary", author: "مجمع اللغة العربية", authorEn: "Arabic Language Academy", genre: "Reference", rating: 5, coverColor: "#8B4513", totalCopies: 20, availableCopies: 18 },

  // Science & Mathematics (Arabic editions)
  { title: "أساسيات الرياضيات", titleEn: "Mathematics Fundamentals", author: "د. محمد أحمد", authorEn: "Dr. Muhammad Ahmad", genre: "Mathematics", rating: 5, coverColor: "#32CD32", totalCopies: 25, availableCopies: 20 },
  { title: "الفيزياء العامة", titleEn: "General Physics", author: "د. حسن علي", authorEn: "Dr. Hassan Ali", genre: "Physics", rating: 4, coverColor: "#FF6347", totalCopies: 20, availableCopies: 18 },
  { title: "الكيمياء العامة", titleEn: "General Chemistry", author: "د. عبدالله محمد", authorEn: "Dr. Abdullah Muhammad", genre: "Chemistry", rating: 4, coverColor: "#9370DB", totalCopies: 20, availableCopies: 17 },
  { title: "علم الأحياء", titleEn: "Biology", author: "د. فاطمة إبراهيم", authorEn: "Dr. Fatima Ibrahim", genre: "Biology", rating: 5, coverColor: "#20B2AA", totalCopies: 20, availableCopies: 18 },

  // English Literature & Language
  { title: "Oxford English Dictionary", titleEn: "Oxford English Dictionary", author: "Oxford University Press", authorEn: "Oxford University Press", genre: "Reference", rating: 5, coverColor: "#000080", totalCopies: 15, availableCopies: 13 },
  { title: "English Grammar in Use", titleEn: "English Grammar in Use", author: "Raymond Murphy", authorEn: "Raymond Murphy", genre: "English Language", rating: 5, coverColor: "#4169E1", totalCopies: 30, availableCopies: 25 },
  { title: "Things Fall Apart", titleEn: "Things Fall Apart", author: "Chinua Achebe", authorEn: "Chinua Achebe", genre: "African Literature", rating: 5, coverColor: "#8B4513", totalCopies: 15, availableCopies: 12 },
  { title: "Long Walk to Freedom", titleEn: "Long Walk to Freedom", author: "Nelson Mandela", authorEn: "Nelson Mandela", genre: "Biography", rating: 5, coverColor: "#D4AF37", totalCopies: 12, availableCopies: 10 },

  // Computer Science
  { title: "مقدمة في علوم الحاسوب", titleEn: "Introduction to Computer Science", author: "د. أحمد حسن", authorEn: "Dr. Ahmed Hassan", genre: "Computer Science", rating: 4, coverColor: "#1E90FF", totalCopies: 20, availableCopies: 17 },
  { title: "أساسيات البرمجة", titleEn: "Programming Fundamentals", author: "د. محمد علي", authorEn: "Dr. Muhammad Ali", genre: "Computer Science", rating: 4, coverColor: "#2F4F4F", totalCopies: 18, availableCopies: 15 },
];

export async function seedLibrary(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("📚 Creating library (Arabic, Islamic, Sudanese & International literature)...");

  await prisma.book.createMany({
    data: BOOKS_DATA.map((book) => ({
      schoolId,
      title: book.titleEn,  // Use English title for DB compatibility
      author: book.authorEn,
      genre: book.genre,
      rating: book.rating,
      coverColor: book.coverColor,
      description: `${book.title} - ${book.titleEn}. A valuable resource for ${book.genre.toLowerCase()}.`,
      summary: `${book.titleEn} by ${book.authorEn} (${book.author}) is an essential read for students.`,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      coverUrl: `/placeholder-book-cover.jpg`,
    })),
    skipDuplicates: true,
  });

  console.log(`   ✅ Created: ${BOOKS_DATA.length} library books (including Sudanese authors: Tayeb Salih)\n`);
}
