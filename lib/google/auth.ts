import { db } from "@/lib/db";
import { googleTokens } from "@/lib/db/schema";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
  }>;
}

export async function getValidToken(): Promise<string | null> {
  const rows = await db.select().from(googleTokens).limit(1);
  if (rows.length === 0) return null;

  const token = rows[0];
  const now = new Date();
  const expiresAt = new Date(token.expiresAt);

  // If token is still valid (with 60s buffer), return it
  if (expiresAt.getTime() - now.getTime() > 60_000) {
    return token.accessToken;
  }

  // Token expired — try to refresh
  const refreshed = await refreshAccessToken(token.refreshToken);
  if (!refreshed) {
    // Refresh token was revoked — clean up
    await db.delete(googleTokens);
    return null;
  }

  // Update stored token
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await db
    .update(googleTokens)
    .set({
      accessToken: refreshed.access_token,
      expiresAt: newExpiresAt,
      updatedAt: new Date(),
    });

  return refreshed.access_token;
}

export async function fetchUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email ?? null;
  } catch {
    return null;
  }
}
