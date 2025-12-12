"use server";

import { db } from "@/lib/db";
import { getVerificationTokenByToken } from "./verificiation-token";
import { getUserByEmail } from "../user";


export const newVerification = async (token: string) => {
  console.log("New verification initiated. Token received:", token);

  const existingToken = await getVerificationTokenByToken(token);
  console.log("Token from database:", existingToken);

  if (!existingToken) {
    const existingUser = await getUserByEmail(token);
    if (existingUser && existingUser.emailVerified) {
      return { success: "Email already verified!" };
    } else {
      console.error("Token does not exist in the database.");
      return { error: "Token does not exist!" };
    }
  }

  console.log("Token exists in the database. Token ID:", existingToken.id);
  console.log("Token exists in the database. Token email:", existingToken.email);
  console.log("Token exists in the database. Token expiration:", existingToken.expires);

  const hasExpired = new Date(existingToken.expires) < new Date();
  console.log("Token expiration status:", hasExpired);

  if (hasExpired) {
    console.error("Token has expired.");
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);
  console.log("User associated with the token:", existingUser);

  if (!existingUser) {
    console.error("Email associated with the token does not exist.");
    return { error: "Email does not exist!" };
  }

  if (existingUser.emailVerified) {
    return { success: "Email verified!" };
  }

  await db.user.update({
    where: { id: existingUser.id },
    data: { 
      emailVerified: new Date(),
      email: existingToken.email,
    }
  });
  console.log("User email verified and updated successfully.");

  await db.verificationToken.delete({
    where: { id: existingToken.id }
  });
  console.log("Verification token deleted successfully.");

  return { success: "Email verified!" };
};