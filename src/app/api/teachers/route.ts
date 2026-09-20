import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireOwner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function GET() {
  const user = await requireOwner();
  const teachers = await prisma.user.findMany({
    where: { maktabId: user.maktabId, role: "TEACHER" },
    select: { id: true, name: true, email: true, taughtClass: { select: { id: true, name: true } } },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const owner = await requireOwner();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Name, valid email, and a password of at least 6 characters are required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

  const teacher = await prisma.user.create({
    data: {
      maktabId: owner.maktabId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: "TEACHER"
    },
    select: { id: true, name: true, email: true, role: true }
  });

  return NextResponse.json(teacher, { status: 201 });
}
