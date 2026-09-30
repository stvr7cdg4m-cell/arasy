import { cookies } from "next/headers";

const COOKIE_NAME = "arasy_session";
const DEMO_SECRET = process.env.DEMO_PASSWORD || "arasy2026";

export async function createSession(password: string): Promise<boolean> {
  const expectedPassword = process.env.DEMO_PASSWORD || "arasy2026";
  if (password !== expectedPassword) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated_session_active", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return true;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return !!session && session.value === "authenticated_session_active";
}
