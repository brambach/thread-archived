import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { googleTokens } from "@/lib/db/schema";
import { exchangeCode, fetchUserEmail } from "@/lib/google/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  try {
    const tokens = await exchangeCode(code);
    const email = await fetchUserEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Clear any existing row, then insert fresh
    await db.delete(googleTokens);
    await db.insert(googleTokens).values({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      email,
    });

    return NextResponse.redirect(new URL("/calendar", request.url));
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(new URL("/calendar", request.url));
  }
}
