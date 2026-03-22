import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { siteConfig } from "@/lib/content";

export const ADMIN_COOKIE_NAME = "golden_bake_admin";

const defaultSecret = "golden-bake-demo-secret-change-me";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? defaultSecret;
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? siteConfig.adminEmail,
    password: process.env.ADMIN_PASSWORD ?? "GoldenBake123!",
  };
}

function sign(email: string) {
  return createHmac("sha256", getSecret()).update(email).digest("hex");
}

export function createAdminToken(email: string) {
  return `${email}.${sign(email)}`;
}

export function verifyAdminToken(token?: string | null) {
  if (!token) {
    return false;
  }

  const [email, signature] = token.split(".");
  if (!email || !signature) {
    return false;
  }

  const expected = Buffer.from(sign(email), "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
