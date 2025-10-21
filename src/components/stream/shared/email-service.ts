import { Resend } from "resend";
import { env } from "@/env.mjs";
import { EnrollmentEmail } from "../emails/enrollment-email";
import { CompletionEmail } from "../emails/completion-email";
import { logger } from "@/lib/logger";

const resend = new Resend(env.RESEND_API_KEY);

interface SendEnrollmentEmailParams {
  to: string;
  studentName: string;
  courseTitle: string;
  courseUrl: string;
  schoolName: string;
}

interface SendCompletionEmailParams {
  to: string;
  studentName: string;
  courseTitle: string;
  certificateUrl: string;
  schoolName: string;
  completionDate: string;
}

/**
 * Send enrollment confirmation email
 */
export async function sendEnrollmentEmail({
  to,
  studentName,
  courseTitle,
  courseUrl,
  schoolName,
}: SendEnrollmentEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM ?? "no-reply@databayt.org",
      to: process.env.NODE_ENV === "development" ? "delivered@resend.dev" : to,
      subject: `Enrollment Confirmed: ${courseTitle}`,
      react: EnrollmentEmail({
        studentName,
        courseTitle,
        courseUrl,
        schoolName,
      }),
      headers: {
        "X-Entity-Ref-ID": new Date().getTime() + "",
      },
    });

    if (error || !data) {
      throw new Error(error?.message || "Failed to send email");
    }

    logger.info("Enrollment email sent", {
      action: "send_enrollment_email",
      to,
      courseTitle,
      emailId: data.id,
    });

    return { success: true, emailId: data.id };
  } catch (error) {
    logger.error(
      "Failed to send enrollment email",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "send_enrollment_email_error",
        to,
        courseTitle,
      }
    );
    return { success: false, error };
  }
}

/**
 * Send course completion email
 */
export async function sendCompletionEmail({
  to,
  studentName,
  courseTitle,
  certificateUrl,
  schoolName,
  completionDate,
}: SendCompletionEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM ?? "no-reply@databayt.org",
      to: process.env.NODE_ENV === "development" ? "delivered@resend.dev" : to,
      subject: `Congratulations! You've completed ${courseTitle}`,
      react: CompletionEmail({
        studentName,
        courseTitle,
        certificateUrl,
        schoolName,
        completionDate,
      }),
      headers: {
        "X-Entity-Ref-ID": new Date().getTime() + "",
      },
    });

    if (error || !data) {
      throw new Error(error?.message || "Failed to send email");
    }

    logger.info("Completion email sent", {
      action: "send_completion_email",
      to,
      courseTitle,
      emailId: data.id,
    });

    return { success: true, emailId: data.id };
  } catch (error) {
    logger.error(
      "Failed to send completion email",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "send_completion_email_error",
        to,
        courseTitle,
      }
    );
    return { success: false, error };
  }
}
