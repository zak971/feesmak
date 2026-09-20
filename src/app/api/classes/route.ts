import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner, requireUser } from "@/lib/permissions";

const schema = z.object({
  name: z.string().min(1),
  monthlyFee: z.number().int().nonnegative(),
  teacherId: z.string().nullable().optional()
});

export async function GET() {
  const user = await requireUser();
  const classes = await prisma.class.findMany({
    where: user.role === "OWNER" ? { maktabId: user.maktabId } : { teacherId: user.id },
    include: { teacher: { select: { id: true, name: true, email: true } }, _count: { select: { students: true } } },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(classes);
}

export async function POST(req: Request) {
  const user = await requireOwner();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (parsed.data.teacherId) {
    const teacher = await prisma.user.findFirst({
      where: { id: parsed.data.teacherId, maktabId: user.maktabId, role: "TEACHER" }
    });
    if (!teacher) return NextResponse.json({ error: "Invalid teacher" }, { status: 400 });
  }

  const cls = await prisma.class.create({
    data: {
      maktabId: user.maktabId,
      name: parsed.data.name,
      monthlyFee: parsed.data.monthlyFee,
      teacherId: parsed.data.teacherId ?? null,
      feeHistories: { create: { amount: parsed.data.monthlyFee, effectiveFrom: new Date() } }
    }
  });
  return NextResponse.json(cls, { status: 201 });
}
