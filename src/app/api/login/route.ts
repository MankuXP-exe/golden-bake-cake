import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  getAdminCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const credentials = getAdminCredentials();

  if (email !== credentials.email.toLowerCase() || password !== credentials.password) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createAdminToken(credentials.email.toLowerCase()),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
