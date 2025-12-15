import { Resend } from "resend";

// Email service for authentication flows - using noreply@databayt.org
const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL;
const isDev = process.env.NODE_ENV === "development";

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  if (isDev) console.log("Sending 2FA email to:", email);

  try {
    const response = await resend.emails.send({
      from: 'noreply@databayt.org',
      to: email,
      subject: "2FA Code",
      html: `<p>Your 2FA code: ${token}</p>`,
      text: `Your 2FA code: ${token}`
    });

    if (isDev) console.log("2FA email sent successfully, response:", response);
  } catch (error) {
    console.error("Error sending 2FA email:", error);
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  // Include locale in the reset link - routes require /[lang]/ prefix
  const resetLink = `${domain}/en/new-password?token=${token}`;

  if (isDev) console.log("Password reset link:", resetLink);

  try {
    const response = await resend.emails.send({
      from: 'noreply@databayt.org',
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset password.</p>`,
      text: `Click the following link to reset your password: ${resetLink}`
    });

    if (isDev) console.log("Password reset email sent successfully, response:", response);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  // Include locale in the verification link - routes require /[lang]/ prefix
  const confirmLink = `${domain}/en/new-verification?token=${token}`;

  if (isDev) console.log("Email confirmation link:", confirmLink);

  try {
    const response = await resend.emails.send({
      from: 'noreply@databayt.org',
      to: email,
      subject: "Confirm your email",
      html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`,
      text: `Click the following link to confirm your email: ${confirmLink}`
    });

    if (isDev) console.log("Verification email sent successfully, response:", response);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};
