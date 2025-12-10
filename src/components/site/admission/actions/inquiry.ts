"use server";

import { db } from "@/lib/db";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { Resend } from "resend";
import { createInquirySchema } from "../validation";
import type { ActionResult, InquiryFormData } from "../types";

// Initialize Resend for email
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ============================================
// Inquiry Actions
// ============================================

/**
 * Submit an inquiry form
 */
export async function submitInquiry(
  subdomain: string,
  data: InquiryFormData
): Promise<ActionResult<{ message: string }>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain);
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" };
    }

    const schoolId = schoolResult.data.id;

    // Validate data
    const schema = createInquirySchema();
    const validated = schema.parse(data);

    // Check if settings allow inquiry form
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
    });

    if (settings && !settings.enableInquiryForm) {
      return { success: false, error: "Inquiry form is currently not accepting submissions" };
    }

    // Check for duplicate inquiry (same email in last 24 hours)
    const recentInquiry = await db.admissionInquiry.findFirst({
      where: {
        schoolId,
        email: validated.email,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentInquiry) {
      return {
        success: false,
        error: "You have already submitted an inquiry recently. Our team will contact you soon."
      };
    }

    // Create inquiry
    await db.admissionInquiry.create({
      data: {
        schoolId,
        parentName: validated.parentName,
        email: validated.email,
        phone: validated.phone || null,
        studentName: validated.studentName || null,
        studentDOB: validated.studentDOB ? new Date(validated.studentDOB) : null,
        interestedGrade: validated.interestedGrade || null,
        source: validated.source || null,
        message: validated.message || null,
        subscribeNewsletter: validated.subscribeNewsletter,
        status: "NEW",
      },
    });

    // Send confirmation email to parent
    if (resend) {
      try {
        await resend.emails.send({
          from: "noreply@databayt.org",
          to: validated.email,
          subject: `Thank You for Your Inquiry - ${schoolResult.data.name}`,
          html: `
            <h2>Thank You for Your Interest!</h2>
            <p>Dear ${validated.parentName},</p>
            <p>Thank you for your inquiry about ${schoolResult.data.name}. We have received your message and our admissions team will get back to you soon.</p>
            ${validated.studentName ? `<p>We look forward to learning more about <strong>${validated.studentName}</strong>.</p>` : ""}
            <p>In the meantime, you can:</p>
            <ul>
              <li><a href="https://${subdomain}.databayt.org/tour">Schedule a Campus Tour</a></li>
              <li><a href="https://${subdomain}.databayt.org/apply">Start an Application</a></li>
            </ul>
            <p>Best regards,<br>Admissions Team<br>${schoolResult.data.name}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send inquiry confirmation email:", emailError);
      }

      // Send notification to school (if configured)
      // This would use school's configured notification email
      // For now, we'll skip this as we don't have the admin email configured
    }

    return {
      success: true,
      data: { message: "Thank you for your inquiry! We will contact you soon." }
    };
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return { success: false, error: "Failed to submit inquiry. Please try again." };
  }
}

/**
 * Check if inquiry form is enabled for a school
 */
export async function isInquiryFormEnabled(subdomain: string): Promise<ActionResult<boolean>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain);
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" };
    }

    const schoolId = schoolResult.data.id;

    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
    });

    // Default to enabled if no settings exist
    const enabled = settings ? settings.enableInquiryForm : true;

    return { success: true, data: enabled };
  } catch (error) {
    console.error("Error checking inquiry form status:", error);
    return { success: false, error: "Failed to check form status" };
  }
}
