import { db } from "@/lib/db";

export const getUserByEmail = async (email: string) => {
  try {
    // In multi-tenant setup, we need to find users by email
    // We'll get the first user with this email (for OAuth, this is usually what we want)
    const users = await db.user.findMany({ 
      where: { email },
      orderBy: { createdAt: 'desc' } // Get the most recent user with this email
    });

    return users[0] || null; // Return the first user or null
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });

    return user;
  } catch {
    return null;
  }
};

// New function to handle OAuth user creation/linking
export const getOrCreateOAuthUser = async (email: string, provider: string, profile: { name?: string; username?: string; image?: string }) => {
  try {
    // First, try to find an existing user with this email
    const users = await db.user.findMany({ 
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    let user = users[0];

    if (!user) {
      // Create a new user for OAuth (without schoolId initially)
      user = await db.user.create({
        data: {
          email,
          username: profile.name || profile.username || email.split('@')[0],
          image: profile.image,
          emailVerified: new Date(),
          role: 'USER', // Default role for OAuth users
        }
      });
    }

    return user;
  } catch (error) {
    console.error('Error in getOrCreateOAuthUser:', error);
    return null;
  }
};
