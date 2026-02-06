import { db } from "@/lib/db"

/**
 * School Join Code Utilities
 *
 * Generates and validates 6-character alphanumeric codes for self-enrollment.
 * Uses uppercase letters + digits (no ambiguous chars: 0/O, 1/I/L).
 * Collision resistance: 28^6 = 481M possible codes.
 */

// Unambiguous alphabet: no 0/O, 1/I/L
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ2345679"
const CODE_LENGTH = 6

/** Generate a random join code */
export function generateJoinCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")
}

/** Generate a unique join code (retries on collision) */
export async function generateUniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateJoinCode()
    const existing = await db.school.findUnique({
      where: { joinCode: code },
      select: { id: true },
    })
    if (!existing) return code
  }
  // Extremely unlikely to reach here with 481M possible codes
  throw new Error("Failed to generate unique join code after 5 attempts")
}
