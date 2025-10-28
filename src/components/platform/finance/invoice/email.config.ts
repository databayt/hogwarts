import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, reactHTML: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: "AmitInvoice <onboarding@resend.dev>",
      to: to,
      subject: subject,
      react: reactHTML,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
