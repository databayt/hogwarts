"use server";

import { renderToStream } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Locale } from "@/components/internationalization/config";
import {
  GradeCertificate,
  GradeCertificatePrint,
  type CertificateData,
  type CertificateOptions,
} from "./template";

interface GenerateCertificateInput {
  gradeId: string;
  type: "certificate" | "print";
  language: Locale;
  includeSignatures?: boolean;
  includeFeedback?: boolean;
}

interface GenerateCertificateResult {
  success: boolean;
  pdfUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * Generate a grade certificate PDF
 */
export async function generateGradeCertificate(
  input: GenerateCertificateInput
): Promise<GenerateCertificateResult> {
  try {
    // 1. Authenticate
    const session = await auth();
    const schoolId = session?.user?.schoolId;

    if (!schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Fetch grade data with all relations
    const grade = await db.result.findFirst({
      where: {
        id: input.gradeId,
        schoolId,
      },
      include: {
        student: {
          select: {
            givenName: true,
            surname: true,
            studentId: true,
            email: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            subjectName: true,
          },
        },
        assignment: {
          select: {
            title: true,
            totalPoints: true,
            dueDate: true,
            description: true,
          },
        },
        exam: {
          select: {
            title: true,
            totalMarks: true,
            examDate: true,
            description: true,
          },
        },
        school: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!grade) {
      return { success: false, error: "Grade not found" };
    }

    // 3. Build certificate data
    const studentName = grade.student
      ? `${grade.student.givenName} ${grade.student.surname}`
      : "Unknown Student";

    const title =
      grade.assignment?.title ||
      grade.exam?.title ||
      grade.title ||
      "Assessment";

    const itemType = grade.assignment
      ? "assignment"
      : grade.exam
        ? "exam"
        : "grade";

    const date =
      grade.assignment?.dueDate || grade.exam?.examDate || grade.gradedAt || new Date();

    const certificateData: CertificateData = {
      studentName,
      studentId: grade.student?.studentId || undefined,
      className: grade.class?.name || undefined,
      title,
      type: itemType,
      subject: grade.subject?.subjectName || undefined,
      score: Number(grade.score),
      maxScore: Number(grade.maxScore),
      percentage: grade.percentage,
      grade: grade.grade,
      schoolName: grade.school?.name || "School",
      schoolLogo: grade.school?.logoUrl || undefined,
      date: date instanceof Date ? date : new Date(date),
      gradedAt: grade.gradedAt ? new Date(grade.gradedAt) : undefined,
      feedback: grade.feedback || undefined,
      gradedBy: grade.gradedBy || undefined,
    };

    const options: CertificateOptions = {
      language: input.language,
      template: "elegant",
      includeSignatures: input.includeSignatures ?? true,
      includeFeedback: input.includeFeedback ?? true,
    };

    // 4. Generate PDF
    const component =
      input.type === "certificate"
        ? GradeCertificate({ data: certificateData, options })
        : GradeCertificatePrint({ data: certificateData, options });

    const stream = await renderToStream(component as React.ReactElement<any>);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Uint8Array);
    }
    const buffer = Buffer.concat(chunks);

    // Convert to base64 data URL
    const base64 = buffer.toString("base64");
    const pdfUrl = `data:application/pdf;base64,${base64}`;

    // Generate filename
    const sanitizedName = studentName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
    const timestamp = new Date().toISOString().split("T")[0];
    const typeLabel = input.type === "certificate" ? "certificate" : "report";
    const fileName = `${sanitizedName}_${sanitizedTitle}_${typeLabel}_${timestamp}.pdf`;

    return {
      success: true,
      pdfUrl,
      fileName,
    };
  } catch (error) {
    console.error("Certificate generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
