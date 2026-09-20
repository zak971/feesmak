import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateCurrentMonthFees } from "@/lib/fees";

const schema = z.object({
  studentId: z.string(),
  feeId: z.string().optional(),
  amount: z.number().int().positive(),
  method: z.enum(["CASH", "UPI", "BANK_TRANSFER"]),
  notes: z.string().optional()
});

function receiptNumber() {
  const d = new Date();
  const stamp = d.toISOString().replace(/\D/g, "").slice(0, 14);
  return `RCP-${stamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
}

export async function POST(req: Request) {
  const user = await requireUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await generateCurrentMonthFees(user.maktabId);

  const student = await prisma.student.findFirst({
    where: {
      id: parsed.data.studentId,
      maktabId: user.maktabId,
      ...(user.role === "TEACHER" ? { class: { teacherId: user.id } } : {})
    }
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const fees = await prisma.fee.findMany({
    where: { studentId: student.id },
    include: { allocations: true },
    orderBy: { month: "asc" }
  });

  if (parsed.data.feeId && !fees.some(fee => fee.id === parsed.data.feeId)) {
    return NextResponse.json({ error: "Selected fee was not found for this student" }, { status: 400 });
  }

  const orderedFees = parsed.data.feeId
    ? [...fees.filter(fee => fee.id === parsed.data.feeId), ...fees.filter(fee => fee.id !== parsed.data.feeId)]
    : fees;
  let remaining = parsed.data.amount;
  const allocations: { feeId: string; amount: number }[] = [];

  for (const fee of orderedFees) {
    const paid = fee.allocations.reduce((s, a) => s + a.amount, 0);
    const balance = fee.amount - paid;
    if (balance <= 0) continue;
    if (parsed.data.feeId && fee.id === parsed.data.feeId && parsed.data.amount > balance) {
      return NextResponse.json({ error: `Payment exceeds this month's balance by ₹${parsed.data.amount - balance}` }, { status: 400 });
    }
    const allocation = Math.min(balance, remaining);
    allocations.push({ feeId: fee.id, amount: allocation });
    remaining -= allocation;
    if (remaining === 0) break;
  }

  if (remaining > 0) {
    return NextResponse.json({ error: `Payment exceeds outstanding fees by ₹${remaining}` }, { status: 400 });
  }

  const payment = await prisma.$transaction(async tx => {
    const created = await tx.payment.create({
      data: {
        maktabId: user.maktabId,
        receiptNumber: receiptNumber(),
        amount: parsed.data.amount,
        method: parsed.data.method,
        notes: parsed.data.notes
      }
    });

    for (const a of allocations) {
      await tx.paymentAllocation.create({
        data: { paymentId: created.id, feeId: a.feeId, amount: a.amount }
      });
      const fee = await tx.fee.findUnique({ where: { id: a.feeId }, include: { allocations: true } });
      if (fee) {
        const paid = fee.allocations.reduce((s, x) => s + x.amount, 0);
        await tx.fee.update({
          where: { id: fee.id },
          data: { status: paid >= fee.amount ? "PAID" : "PARTIAL" }
        });
      }
    }

    await tx.receipt.create({
      data: { paymentId: created.id, receiptNumber: created.receiptNumber }
    });
    return created;
  });

  return NextResponse.json(payment, { status: 201 });
}
