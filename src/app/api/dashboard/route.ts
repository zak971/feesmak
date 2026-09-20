import { NextResponse } from "next/server";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateCurrentMonthFees, monthStart } from "@/lib/fees";

export async function GET() {
  const user = await requireUser();
  await generateCurrentMonthFees(user.maktabId);
  const currentMonth = monthStart();

  const studentWhere = user.role === "OWNER"
    ? { maktabId: user.maktabId }
    : { maktabId: user.maktabId, class: { teacherId: user.id } };

  const feeWhere = user.role === "OWNER"
    ? { month: currentMonth, student: { maktabId: user.maktabId } }
    : { month: currentMonth, student: { maktabId: user.maktabId, class: { teacherId: user.id } } };

  const [students, classes, teachers, fees, payments] = await Promise.all([
    prisma.student.count({ where: studentWhere }),
    prisma.class.count({ where: user.role === "OWNER" ? { maktabId: user.maktabId } : { teacherId: user.id } }),
    user.role === "OWNER" ? prisma.user.count({ where: { maktabId: user.maktabId, role: "TEACHER" } }) : Promise.resolve(1),
    prisma.fee.findMany({ where: feeWhere, include: { allocations: true } }),
    user.role === "OWNER" ? prisma.payment.findMany({ where: { maktabId: user.maktabId }, orderBy: { paidAt: "desc" }, take: 10 }) : Promise.resolve([])
  ]);

  let expected = 0, collected = 0, pending = 0;
  for (const fee of fees) {
    expected += fee.amount;
    const paid = fee.allocations.reduce((s, a) => s + a.amount, 0);
    collected += paid;
    pending += Math.max(0, fee.amount - paid);
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const todayPayments = user.role === "OWNER"
    ? await prisma.payment.aggregate({ _sum: { amount: true }, where: { maktabId: user.maktabId, paidAt: { gte: start } } })
    : { _sum: { amount: null } };

  return NextResponse.json({
    students,
    classes,
    teachers,
    expected,
    collected,
    pending,
    todayCollection: todayPayments._sum.amount ?? 0,
    recentPayments: payments
  });
}
