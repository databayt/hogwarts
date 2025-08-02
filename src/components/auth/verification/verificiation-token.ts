import { db } from "@/lib/db";

// Get verification token by token string
export const getVerificationTokenByToken = async (token: string) => {
  try {
    console.log("Searching for verification token by token:", token); // Log the token being searched
    const verificationToken = await db.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      console.error("Token not found in the database:", token); // Log if token is not found
      return null;
    }

    console.log("Verification token retrieved successfully:", verificationToken); // Log the retrieved token
    return verificationToken;
  } catch (error) {
    console.error("Error retrieving token from the database:", error); // Log the error in detail
    return null;
  }
};

// Get verification token by email
export const getVerificationTokenByEmail = async (email: string) => {
  try {
    console.log("Searching for verification token by email:", email); // Log the email being searched
    const verificationToken = await db.verificationToken.findFirst({
      where: { email }
    });

    if (!verificationToken) {
      console.error("Token not found for the email in the database:", email); // Log if token is not found for the email
      return null;
    }

    console.log("Verification token retrieved successfully for email:", verificationToken); // Log the retrieved token
    return verificationToken;
  } catch (error) {
    console.error("Error retrieving token by email from the database:", error); // Log the error in detail
    return null;
  }
}
