function getImportMetaEnv(key: string): string | undefined {
    try {
        // @ts-ignore - import.meta may not exist in Next
        return typeof import.meta !== "undefined" ? import.meta.env?.[key] : undefined;
    } catch {
        return undefined;
    }
}

const HA_HOST = getImportMetaEnv("VITE_HA_URL") || process.env.NEXT_PUBLIC_HA_URL || process.env.HA_URL; // e.g. homeassistant.local
const HA_PORT = getImportMetaEnv("VITE_HA_PORT") || process.env.NEXT_PUBLIC_HA_PORT || process.env.HA_PORT; // e.g. 8123
const HA_HTTP_URL = `http://${HA_HOST}:${HA_PORT}`;

// OAuth2 app credentials (must match Home Assistant config)
const CLIENT_ID = getImportMetaEnv("VITE_HA_CLIENT_ID") ?? process.env.NEXT_PUBLIC_HA_CLIENT_ID!;
const REDIRECT_URI = getImportMetaEnv("VITE_HA_REDIRECT_URI") ?? process.env.NEXT_PUBLIC_HA_REDIRECT_URI!;

// Optional override: if set, skip OAuth2
const LONG_LIVED_TOKEN = getImportMetaEnv("VITE_HA_LONG_LIVED_TOKEN") || process.env.NEXT_PUBLIC_HA_LONG_LIVED_TOKEN;

const STORAGE_KEY = "ha_tokens";

export type Tokens = {
    access_token: string;
    refresh_token?: string;
    expires_in?: number; // in seconds
    token_type: string;
    created_at: number; // epoch ms
};

function log(...args: any[]) {
    console.log("[HA AUTH]", ...args);
}

/**
 * Save tokens into localStorage (with created_at timestamp).
 */
export function saveTokens(tokens: any) {
    const data: Tokens = {
        ...tokens,
        created_at: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    log("Saved tokens to localStorage:", {
        access_token: !!data.access_token,
        refresh_token: !!data.refresh_token,
        expires_in: data.expires_in,
    });
}

/**
 * Load tokens from localStorage.
 */
export function loadTokens(): Tokens | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch {
        return null;
    }
}

/**
 * Clear stored tokens.
 */
export function clearTokens() {
    localStorage.removeItem(STORAGE_KEY);
    log("Cleared tokens");
}

/**
 * Redirect to Home Assistant OAuth2 login.
 */
export function login() {
    if (LONG_LIVED_TOKEN) {
        log("Using long-lived token; skipping OAuth login");
        return;
    }
    const authUrl =
        `${HA_HTTP_URL}/auth/authorize?response_type=code` +
        `&client_id=${encodeURIComponent(CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    log("Redirecting to HA login:", authUrl);
    window.location.href = authUrl;
}

/**
 * Exchange authorization code for access + refresh tokens.
 */
export async function exchangeCodeForToken(code: string) {
    log("Exchanging code for token");
    const res = await fetch(`${HA_HTTP_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
        }),
    });

    const text = await res.text();
    if (!res.ok) {
        log("Token exchange failed:", res.status, text);
        throw new Error(`Token exchange failed: ${res.status}`);
    }
    const data = JSON.parse(text);
    saveTokens(data);
    return data as Tokens;
}

/**
 * Refresh access token using stored refresh token.
 */
export async function refreshAccessToken() {
    const tokens = loadTokens();
    if (!tokens?.refresh_token) throw new Error("No refresh token available");

    log("Refreshing access token...");
    const res = await fetch(`${HA_HTTP_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: tokens.refresh_token,
            client_id: CLIENT_ID,
        }),
    });

    const text = await res.text();
    if (!res.ok) {
        log("Refresh failed:", res.status, text);
        throw new Error(`Refresh failed: ${res.status}`);
    }
    const data = JSON.parse(text);
    saveTokens(data);
    log("Refresh successful; new access token saved");
    return data as Tokens;
}

/**
 * Get current access token (returns null if expired or missing).
 */
export function getAccessToken(): string | null {
    if (LONG_LIVED_TOKEN) return LONG_LIVED_TOKEN;

    const t = loadTokens();
    if (!t) return null;

    if (!t.expires_in) return t.access_token;

    const expiresAt = t.created_at + t.expires_in * 1000;
    if (Date.now() >= expiresAt) {
        log("Access token expired");
        return null;
    }
    return t.access_token;
}

/**
 * Get time (ms) until current access token expires.
 */
export function getTimeToExpiryMs(): number | null {
    const t = loadTokens();
    if (!t?.expires_in) return null;
    return t.created_at + t.expires_in * 1000 - Date.now();
}

/**
 * Force a refresh now (useful for debugging).
 */
export async function forceRefreshNow() {
    return refreshAccessToken();
}
