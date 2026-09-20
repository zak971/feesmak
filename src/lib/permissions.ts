import { getCurrentUser } from "./auth";

export async function requireOwner() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") throw new Error("FORBIDDEN");
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
