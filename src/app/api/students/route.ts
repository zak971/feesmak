import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { generateCurrentMonthFees, monthStart } from "@/lib/fees";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
  classId: z.string().optional(),
  monthlyFeeOverride: z.number().int().nonnegative().nullable().optional()
});

export async function GET() {
  const user = await requireUser();
  await generateCurrentMonthFees(user.maktabId);
  const students = await prisma.student.findMany({
    where: user.role === "OWNER"
      ? { maktabId: user.maktabId }
      : { maktabId: user.maktabId, class: { teacherId: user.id } },
    include: {
      class: { select: { id: true, name: true, monthlyFee: true } },
      fees: { include: { allocations: true }, orderBy: { month: "asc" } }
    },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(students.map(student => {
    const fees = student.fees.map(fee => {
      const paid = fee.allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
      return {
        id: fee.id,
        month: fee.month,
        amount: fee.amount,
        paid,
        balance: Math.max(0, fee.amount - paid),
        status: fee.status
      };
    });
    const fee = fees.find(item => new Date(item.month).getTime() === monthStart().getTime());
    const paid = fee?.paid ?? 0;
    return {
      ...student,
      fees: undefined,
      feeStatus: fee?.status ?? "PENDING",
      feeAmount: fee?.amount ?? 0,
      feePaid: paid,
      feeBalance: fee?.balance ?? 0,
      feeHistory: fees,
      outstandingFees: fees.filter(item => item.balance > 0)
    };
  }));
}

export async function POST(req: Request) {
  const user = await requireUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  let classId = parsed.data.classId;
  if (user.role === "TEACHER") {
    const cls = await prisma.class.findUnique({ where: { teacherId: user.id } });
    if (!cls) return NextResponse.json({ error: "Teacher has no assigned class" }, { status: 400 });
    classId = cls.id;
  }

  if (!classId) return NextResponse.json({ error: "classId is required" }, { status: 400 });

  const cls = await prisma.class.findFirst({ where: { id: classId, maktabId: user.maktabId } });
  if (!cls) return NextResponse.json({ error: "Invalid class" }, { status: 400 });

  if (user.role === "TEACHER" && cls.teacherId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.create({
    data: {
      maktabId: user.maktabId,
      classId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      parentName: parsed.data.parentName,
      parentPhone: parsed.data.parentPhone,
      address: parsed.data.address,
      monthlyFeeOverride: parsed.data.monthlyFeeOverride ?? null,
      createdById: user.id
    }
  });
  return NextResponse.json(student, { status: 201 });
}
