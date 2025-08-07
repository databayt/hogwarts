"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { currentUser } from "@/components/auth/auth";
import { generateVerificationToken } from "@/components/auth/tokens";
import { sendVerificationEmail } from "@/components/auth/mail";
import { SettingsSchema } from "../validation";
import { getUserByEmail, getUserById } from "../user";
import { db } from "@/lib/db";
import { auth, signIn, signOut } from "@/auth";
import { revalidatePath } from "next/cache";

export const settings = async (
  values: z.infer<typeof SettingsSchema>
) => {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" }
  }

  const dbUser = await getUserById(user.id);

  if (!dbUser) {
    return { error: "Unauthorized" }
  }

  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" }
    }

    const verificationToken = await generateVerificationToken(
      values.email
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Verification email sent!" };
  }

  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(
      values.password,
      dbUser.password,
    );

    if (!passwordsMatch) {
      return { error: "Incorrect password!" };
    }

    const hashedPassword = await bcrypt.hash(
      values.newPassword,
      10,
    );
    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...values,
    }
  });

  // Force a session update by signing out and back in
  try {
    await signOut({ redirect: false });
    await signIn("credentials", {
      email: updatedUser.email,
      password: values.password,
      redirect: false,
    });
    
    // Revalidate the path to update UI
    revalidatePath("/");
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Failed to update session" }
    }
    throw error;
  }

  return { success: "Settings Updated!" }
}