/**
 * Student Documents Seed Module
 * Creates student document records (metadata only, no actual files)
 * - Birth certificates
 * - Vaccination records
 * - Transfer certificates
 * - Medical reports
 * - ID documents
 *
 * Uses findFirst + create pattern - safe to run multiple times (no deletes)
 */

import type { SeedPrisma } from "./types";

// Document types and templates
const DOCUMENT_TYPES = [
  {
    type: "Birth Certificate",
    names: [
      { en: "Birth Certificate", ar: "شهادة الميلاد" },
      { en: "Official Birth Record", ar: "سجل الميلاد الرسمي" },
    ],
    descriptions: [
      { en: "Official birth certificate issued by Civil Registry", ar: "شهادة ميلاد رسمية صادرة من السجل المدني" },
    ],
    mimeType: "application/pdf",
    tags: ["official", "required", "identification"],
    hasExpiry: false,
    probability: 1.0, // All students should have this
  },
  {
    type: "Vaccination Record",
    names: [
      { en: "Vaccination Card", ar: "بطاقة التطعيم" },
      { en: "Immunization Record", ar: "سجل التطعيمات" },
    ],
    descriptions: [
      { en: "Complete vaccination history as per national schedule", ar: "سجل التطعيمات الكامل وفقاً للجدول الوطني" },
    ],
    mimeType: "application/pdf",
    tags: ["health", "required", "medical"],
    hasExpiry: false,
    probability: 0.95, // 95% of students
  },
  {
    type: "National ID Copy",
    names: [
      { en: "National ID Card Copy", ar: "صورة البطاقة الوطنية" },
      { en: "Student ID Document", ar: "وثيقة هوية الطالب" },
    ],
    descriptions: [
      { en: "Copy of student's national identification card", ar: "صورة من بطاقة الهوية الوطنية للطالب" },
    ],
    mimeType: "image/jpeg",
    tags: ["identification", "official"],
    hasExpiry: true,
    probability: 0.8, // 80% of students (older students)
  },
  {
    type: "Transfer Certificate",
    names: [
      { en: "School Transfer Certificate", ar: "شهادة نقل مدرسية" },
      { en: "Previous School Records", ar: "سجلات المدرسة السابقة" },
    ],
    descriptions: [
      { en: "Transfer certificate from previous school", ar: "شهادة نقل من المدرسة السابقة" },
    ],
    mimeType: "application/pdf",
    tags: ["academic", "transfer"],
    hasExpiry: false,
    probability: 0.15, // 15% of students transferred
  },
  {
    type: "Medical Report",
    names: [
      { en: "Medical Fitness Certificate", ar: "شهادة اللياقة الطبية" },
      { en: "Health Clearance Report", ar: "تقرير الخلو من الأمراض" },
    ],
    descriptions: [
      { en: "Medical fitness report for school enrollment", ar: "تقرير اللياقة الطبية للالتحاق بالمدرسة" },
    ],
    mimeType: "application/pdf",
    tags: ["health", "medical", "enrollment"],
    hasExpiry: true,
    probability: 0.9, // 90% of students
  },
  {
    type: "Photo",
    names: [
      { en: "Student Passport Photo", ar: "صورة شخصية للطالب" },
      { en: "ID Photo", ar: "صورة الهوية" },
    ],
    descriptions: [
      { en: "Recent passport-sized photograph", ar: "صورة حديثة بحجم جواز السفر" },
    ],
    mimeType: "image/jpeg",
    tags: ["identification", "photo"],
    hasExpiry: false,
    probability: 1.0, // All students
  },
  {
    type: "Guardian ID Copy",
    names: [
      { en: "Parent/Guardian ID Copy", ar: "صورة هوية ولي الأمر" },
    ],
    descriptions: [
      { en: "Copy of parent or guardian's national ID", ar: "صورة من بطاقة هوية ولي الأمر" },
    ],
    mimeType: "image/jpeg",
    tags: ["guardian", "identification"],
    hasExpiry: true,
    probability: 0.85, // 85% of students
  },
  {
    type: "Address Proof",
    names: [
      { en: "Proof of Residence", ar: "إثبات السكن" },
      { en: "Utility Bill", ar: "فاتورة خدمات" },
    ],
    descriptions: [
      { en: "Document proving current residential address", ar: "وثيقة تثبت عنوان السكن الحالي" },
    ],
    mimeType: "application/pdf",
    tags: ["address", "residence"],
    hasExpiry: true,
    probability: 0.7, // 70% of students
  },
  {
    type: "Previous Report Card",
    names: [
      { en: "Previous Year Report Card", ar: "بطاقة التقارير السنة السابقة" },
      { en: "Academic Transcript", ar: "كشف الدرجات" },
    ],
    descriptions: [
      { en: "Academic report from previous academic year", ar: "التقرير الأكاديمي من السنة الدراسية السابقة" },
    ],
    mimeType: "application/pdf",
    tags: ["academic", "grades", "transcript"],
    hasExpiry: false,
    probability: 0.6, // 60% of students
  },
];

// Verification statuses
const VERIFICATION_STATUSES = [
  { verified: true, probability: 0.75 },   // 75% verified
  { verified: false, probability: 0.25 },  // 25% pending
];

export async function seedDocuments(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("📄 Creating student documents...");

  // Get students
  const students = await prisma.student.findMany({
    where: { schoolId },
    select: { id: true, givenName: true, surname: true },
  });

  // Get admin user for uploadedBy/verifiedBy fields
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@databayt.org" },
    select: { id: true },
  });

  if (students.length === 0) {
    console.log("   ⚠️  No students found, skipping documents\n");
    return;
  }

  // Check existing count
  const existingCount = await prisma.studentDocument.count({
    where: { schoolId },
  });

  if (existingCount >= 500) {
    console.log(`   ✅ Documents already exist (${existingCount}), skipping\n`);
    return;
  }

  const uploadedBy = adminUser?.id || null;
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const documents: Array<{
    schoolId: string;
    studentId: string;
    documentType: string;
    documentName: string;
    description: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    uploadedBy: string | null;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    isVerified: boolean;
    expiryDate: Date | null;
    tags: string[];
  }> = [];

  for (const student of students) {
    // Generate documents based on probability for each type
    for (const docType of DOCUMENT_TYPES) {
      if (Math.random() <= docType.probability) {
        const nameTemplate = docType.names[Math.floor(Math.random() * docType.names.length)];
        const descTemplate = docType.descriptions[Math.floor(Math.random() * docType.descriptions.length)];
        const useArabic = Math.random() > 0.5;

        // Determine verification status
        const isVerified = Math.random() < 0.75;
        const uploadDate = new Date(
          oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime())
        );

        // Generate placeholder file URL (simulating cloud storage)
        const fileExtension = docType.mimeType === "application/pdf" ? "pdf" : "jpg";
        const fileUrl = `https://storage.databayt.org/schools/${schoolId}/students/${student.id}/documents/${docType.type.toLowerCase().replace(/\s+/g, "-")}.${fileExtension}`;

        documents.push({
          schoolId,
          studentId: student.id,
          documentType: docType.type,
          documentName: useArabic ? nameTemplate.ar : nameTemplate.en,
          description: useArabic ? descTemplate.ar : descTemplate.en,
          fileUrl,
          fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          mimeType: docType.mimeType,
          uploadedAt: uploadDate,
          uploadedBy,
          verifiedAt: isVerified ? new Date(uploadDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          verifiedBy: isVerified ? uploadedBy : null,
          isVerified,
          expiryDate: docType.hasExpiry ? oneYearFromNow : null,
          tags: docType.tags,
        });
      }
    }
  }

  // Create documents in batches
  const batchSize = 500;
  let createdCount = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const result = await prisma.studentDocument.createMany({
      data: batch,
      skipDuplicates: true,
    });
    createdCount += result.count;
  }

  // Count by type
  const typeCountMap: Record<string, number> = {};
  for (const doc of documents) {
    typeCountMap[doc.documentType] = (typeCountMap[doc.documentType] || 0) + 1;
  }

  const verifiedCount = documents.filter(d => d.isVerified).length;

  console.log(`   ✅ Created ${createdCount} student documents:`);
  console.log(`      - Verified: ${verifiedCount} (${Math.round(verifiedCount/documents.length*100)}%)`);
  console.log(`      - Pending: ${documents.length - verifiedCount} (${Math.round((documents.length - verifiedCount)/documents.length*100)}%)`);
  console.log(`      - Types: ${Object.keys(typeCountMap).length} document types\n`);
}
