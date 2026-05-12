/**
 * Cloudflare Turnstile verification.
 *
 * Required for anonymous reports (HF3). Authenticated users skip captcha —
 * the auth is the trust signal.
 *
 * Returns true on a valid token, false otherwise. Never throws.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // In development without a Turnstile secret, pass through. Real deployments
    // must set the env var (otherwise HF3 would reject every anonymous report).
    if (process.env.NODE_ENV !== "production") return true;
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set in production");
    return false;
  }

  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
      // Keep this fast — Turnstile is normally <200ms.
      signal: AbortSignal.timeout(3_000),
    });

    if (!res.ok) {
      console.warn("[turnstile] verify HTTP", res.status);
      return false;
    }

    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.warn("[turnstile] verify failed:", err);
    return false;
  }
}
