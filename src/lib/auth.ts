import { cookies } from "next/headers";
import { createHmac, randomBytes } from "crypto";
import { prisma } from "./prisma";

const COOKIE_NAME = "maktab_session";

function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function createSession(userId: string) {
  const token = `${userId}.${randomBytes(32).toString("hex")}`;
  const signed = `${token}.${sign(token)}`;
  (await cookies()).set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  const parts = cookie.split(".");
  if (parts.length !== 3) return null;
  const token = `${parts[0]}.${parts[1]}`;
  if (sign(token) !== parts[2]) return null;
  return prisma.user.findUnique({
    where: { id: parts[0] },
    select: { id: true, name: true, email: true, role: true, maktabId: true }
  });
}
