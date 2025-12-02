"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { studentCreateSchema, studentUpdateSchema, getStudentsSchema } from "@/components/platform/students/validation";
import { arrayToCSV } from "@/lib/csv-export";

export async function createStudent(input: z.infer<typeof studentCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = studentCreateSchema.parse(input);
  let normalizedUserId: string | null = parsed.userId && parsed.userId.trim().length > 0 ? parsed.userId.trim() : null;
  
  if (normalizedUserId) {
    // Ensure the referenced user exists to avoid FK violation
    const user = await (db as any).user.findFirst({ where: { id: normalizedUserId } });
    if (!user) {
      normalizedUserId = null;
    } else {
      // Check if this userId is already being used by ANY student (global unique constraint)
      const existingStudent = await (db as any).student.findFirst({ 
        where: { 
          userId: normalizedUserId
        } 
      });
      if (existingStudent) {
        normalizedUserId = null; // Don't use this userId if it's already taken
      }
    }
  }
  
  const row = await (db as any).student.create({
    data: {
      schoolId,
      givenName: parsed.givenName,
      middleName: parsed.middleName ?? null,
      surname: parsed.surname,
      ...(parsed.dateOfBirth ? { dateOfBirth: new Date(parsed.dateOfBirth) } : {}),
      gender: parsed.gender,
      ...(parsed.enrollmentDate ? { enrollmentDate: new Date(parsed.enrollmentDate) } : {}),
      userId: normalizedUserId,
    },
  });
  revalidatePath("/lab/students");
  return { success: true as const, id: row.id as string };
}

export async function updateStudent(input: z.infer<typeof studentUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = studentUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName;
  if (typeof rest.middleName !== "undefined") data.middleName = rest.middleName ?? null;
  if (typeof rest.surname !== "undefined") data.surname = rest.surname;
  if (typeof rest.gender !== "undefined") data.gender = rest.gender;
  if (typeof rest.userId !== "undefined") {
    const trimmed = rest.userId?.trim();
    if (trimmed) {
      const user = await (db as any).user.findFirst({ where: { id: trimmed } });
      if (user) {
        // Check if this userId is already being used by ANY other student (global unique constraint)
        const existingStudent = await (db as any).student.findFirst({ 
          where: { 
            userId: trimmed,
            NOT: { id } // Exclude current student
          } 
        });
        data.userId = existingStudent ? null : trimmed;
      } else {
        data.userId = null;
      }
    } else {
      data.userId = null;
    }
  }
  if (typeof rest.dateOfBirth !== "undefined") data.dateOfBirth = new Date(rest.dateOfBirth);
  if (typeof rest.enrollmentDate !== "undefined") data.enrollmentDate = new Date(rest.enrollmentDate);
  await (db as any).student.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/lab/students");
  return { success: true as const };
}

export async function deleteStudent(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).student.deleteMany({ where: { id, schoolId } });
  revalidatePath("/lab/students");
  return { success: true as const };
}

// Reads
export async function getStudent(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).student) return { student: null as null };
  const s = await (db as any).student.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      givenName: true,
      middleName: true,
      surname: true,
      dateOfBirth: true,
      gender: true,
      enrollmentDate: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { student: s as null | Record<string, unknown> };
}

export async function getStudents(input: Partial<z.infer<typeof getStudentsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getStudentsSchema.parse(input ?? {});
  if (!(db as any).student) return { rows: [] as Array<{ id: string; name: string; className: string; status: string; createdAt: string }>, total: 0 };
  const where: any = {
    schoolId,
    ...(sp.name
      ? {
          OR: [
            { givenName: { contains: sp.name, mode: "insensitive" } },
            { surname: { contains: sp.name, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(sp.status
      ? sp.status === "active"
        ? { NOT: { userId: null } }
        : sp.status === "inactive"
          ? { userId: null }
          : {}
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];
  const [rows, count] = await Promise.all([
    (db as any).student.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        studentClasses: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
          take: 1, // Get primary class
        },
      },
    }),
    (db as any).student.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((s) => ({
    id: s.id as string,
    userId: s.userId as string | null,
    name: [s.givenName, s.surname].filter(Boolean).join(" "),
    className:
      s.studentClasses && s.studentClasses.length > 0
        ? s.studentClasses[0].class?.name || "-"
        : "-",
    status: s.userId ? "active" : "inactive",
    createdAt: (s.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}

/**
 * Export students to CSV format
 */
export async function getStudentsCSV(input?: Partial<z.infer<typeof getStudentsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const sp = getStudentsSchema.parse(input ?? {});
  if (!(db as any).student) return "";

  // Build where clause with filters
  const where: any = {
    schoolId,
    ...(sp.name
      ? {
          OR: [
            { givenName: { contains: sp.name, mode: "insensitive" } },
            { surname: { contains: sp.name, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(sp.status
      ? sp.status === "active"
        ? { NOT: { userId: null } }
        : sp.status === "inactive"
          ? { userId: null }
          : {}
      : {}),
  };

  // Fetch ALL students matching filters (no pagination for export)
  const students = await (db as any).student.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
        },
      },
      studentClasses: {
        include: {
          class: {
            select: {
              name: true,
            },
          },
        },
        take: 1, // Get primary class
      },
    },
    orderBy: [{ givenName: "asc" }, { surname: "asc" }],
  });

  // Transform data for CSV export
  const exportData = students.map((student: any) => ({
    studentId: student.id,
    givenName: student.givenName || "",
    middleName: student.middleName || "",
    surname: student.surname || "",
    fullName: [student.givenName, student.middleName, student.surname]
      .filter(Boolean)
      .join(" "),
    dateOfBirth: student.dateOfBirth
      ? new Date(student.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: student.gender || "",
    email: student.user?.email || "",
    enrollmentDate: student.enrollmentDate
      ? new Date(student.enrollmentDate).toISOString().split("T")[0]
      : "",
    status: student.userId ? "Active" : "Inactive",
    className:
      student.studentClasses && student.studentClasses.length > 0
        ? student.studentClasses[0].class.name
        : "",
    createdAt: new Date(student.createdAt).toISOString().split("T")[0],
  }));

  // Define CSV columns
  const columns = [
    { key: "studentId", label: "Student ID" },
    { key: "givenName", label: "First Name" },
    { key: "middleName", label: "Middle Name" },
    { key: "surname", label: "Last Name" },
    { key: "fullName", label: "Full Name" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "gender", label: "Gender" },
    { key: "email", label: "Email" },
    { key: "enrollmentDate", label: "Enrollment Date" },
    { key: "status", label: "Status" },
    { key: "className", label: "Class" },
    { key: "createdAt", label: "Created Date" },
  ];

  return arrayToCSV(exportData, { columns });
}

/**
 * Register a new student with comprehensive information
 */
export async function registerStudent(input: any) {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) throw new Error("Missing school context");

    // Process guardian data first if provided
    const guardianIds = [];
    if (input.guardians && input.guardians.length > 0) {
      for (const guardian of input.guardians) {
        // Check if guardian already exists by email
        let guardianRecord = await (db as any).guardian.findFirst({
          where: {
            schoolId,
            emailAddress: guardian.email,
          },
        });

        if (!guardianRecord) {
          // Create new guardian
          guardianRecord = await (db as any).guardian.create({
            data: {
              schoolId,
              givenName: guardian.givenName,
              surname: guardian.surname,
              emailAddress: guardian.email,
            },
          });

          // Add phone number if provided
          if (guardian.mobileNumber) {
            await (db as any).guardianPhoneNumber.create({
              data: {
                schoolId,
                guardianId: guardianRecord.id,
                phoneNumber: guardian.mobileNumber,
                phoneType: "mobile",
                isPrimary: true,
              },
            });
          }
        }

        guardianIds.push({
          id: guardianRecord.id,
          relation: guardian.relation,
          isPrimary: guardian.isPrimary || false,
        });
      }
    }

    // Prepare student data
    const studentData: any = {
      schoolId,
      givenName: input.givenName,
      middleName: input.middleName || null,
      surname: input.surname,
      dateOfBirth: new Date(input.dateOfBirth),
      gender: input.gender,
      bloodGroup: input.bloodGroup || null,
      nationality: input.nationality || "Saudi Arabia",
      passportNumber: input.passportNumber || null,
      visaStatus: input.visaStatus || null,
      visaExpiryDate: input.visaExpiryDate ? new Date(input.visaExpiryDate) : null,

      // Contact Information
      email: input.email || null,
      mobileNumber: input.mobileNumber || null,
      alternatePhone: input.alternatePhone || null,

      // Address
      currentAddress: input.currentAddress || null,
      permanentAddress: input.sameAsPermanent
        ? input.currentAddress
        : (input.permanentAddress || null),
      city: input.city || null,
      state: input.state || null,
      postalCode: input.postalCode || null,
      country: input.country || "Saudi Arabia",

      // Emergency Contact
      emergencyContactName: input.emergencyContactName || null,
      emergencyContactPhone: input.emergencyContactPhone || null,
      emergencyContactRelation: input.emergencyContactRelation || null,

      // Status and Enrollment
      status: input.status || "ACTIVE",
      enrollmentDate: input.enrollmentDate ? new Date(input.enrollmentDate) : new Date(),
      admissionNumber: input.admissionNumber || null,
      admissionDate: input.admissionDate ? new Date(input.admissionDate) : new Date(),

      // Academic
      category: input.category || null,
      studentType: input.studentType || "REGULAR",

      // Health Information
      medicalConditions: input.medicalConditions || null,
      allergies: input.allergies || null,
      medicationRequired: input.medicationRequired || null,
      doctorName: input.doctorName || null,
      doctorContact: input.doctorContact || null,
      insuranceProvider: input.insuranceProvider || null,
      insuranceNumber: input.insuranceNumber || null,

      // Previous Education
      previousSchoolName: input.previousSchoolName || null,
      previousSchoolAddress: input.previousSchoolAddress || null,
      previousGrade: input.previousGrade || null,
      transferCertificateNo: input.transferCertificateNo || null,
      transferDate: input.transferDate ? new Date(input.transferDate) : null,
      previousAcademicRecord: input.previousAcademicRecord || null,

      // Photo
      profilePhotoUrl: input.profilePhotoUrl || null,

      // GR Number - Auto-generate if not provided
      grNumber: input.grNumber || null,
    };

    // Generate GR Number if not provided
    if (!studentData.grNumber) {
      const lastStudent = await (db as any).student.findFirst({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        select: { grNumber: true },
      });

      let nextGRNumber = 1;
      if (lastStudent?.grNumber) {
        const match = lastStudent.grNumber.match(/\d+/);
        if (match) {
          nextGRNumber = parseInt(match[0]) + 1;
        }
      }

      const year = new Date().getFullYear();
      studentData.grNumber = `GR${year}${nextGRNumber.toString().padStart(4, '0')}`;
    }

    // Create the student record
    const student = await (db as any).student.create({
      data: studentData,
    });

    // Create guardian relationships
    if (guardianIds.length > 0) {
      // Get or create guardian type
      let guardianType = await (db as any).guardianType.findFirst({
        where: {
          schoolId,
          name: "Parent"
        },
      });

      if (!guardianType) {
        guardianType = await (db as any).guardianType.create({
          data: {
            schoolId,
            name: "Parent",
          },
        });
      }

      // Create student-guardian relationships
      for (const guardian of guardianIds) {
        await (db as any).studentGuardian.create({
          data: {
            schoolId,
            studentId: student.id,
            guardianId: guardian.id,
            guardianTypeId: guardianType.id,
            isPrimary: guardian.isPrimary,
          },
        });
      }
    }

    // Save documents if provided
    if (input.documents && input.documents.length > 0) {
      for (const doc of input.documents) {
        if (doc.fileUrl) {
          await (db as any).studentDocument.create({
            data: {
              schoolId,
              studentId: student.id,
              documentType: doc.documentType,
              documentName: doc.documentName,
              description: doc.description || null,
              fileUrl: doc.fileUrl,
              fileSize: doc.fileSize || null,
              mimeType: doc.mimeType || null,
              tags: doc.tags || [],
            },
          });
        }
      }
    }

    // Save health records/vaccinations if provided
    if (input.vaccinations && input.vaccinations.length > 0) {
      for (const vaccination of input.vaccinations) {
        if (vaccination.name) {
          await (db as any).healthRecord.create({
            data: {
              schoolId,
              studentId: student.id,
              recordDate: new Date(vaccination.date),
              recordType: "VACCINATION",
              title: vaccination.name,
              description: `Vaccination record for ${vaccination.name}`,
              followUpDate: vaccination.nextDueDate ? new Date(vaccination.nextDueDate) : null,
              recordedBy: "System",
            },
          });
        }
      }
    }

    // Enroll in class/batch if provided
    if (input.classId) {
      await (db as any).studentClass.create({
        data: {
          schoolId,
          studentId: student.id,
          classId: input.classId,
          dateJoined: new Date(),
          isActive: true,
        },
      });
    }

    if (input.batchId) {
      await (db as any).studentBatch.create({
        data: {
          schoolId,
          studentId: student.id,
          batchId: input.batchId,
          startDate: new Date(),
          isActive: true,
        },
      });
    }

    revalidatePath("/students");

    return {
      success: true,
      data: student,
      message: "Student registered successfully"
    };
  } catch (error: any) {
    console.error("Student registration error:", error);
    return {
      success: false,
      error: error?.message || "Failed to register student"
    };
  }
}