import { prisma } from "./prisma";

export function monthStart(input = new Date()) {
  return new Date(input.getFullYear(), input.getMonth(), 1);
}

export async function generateCurrentMonthFees(maktabId: string) {
  const currentMonth = monthStart();
  const previousMonth = new Date(currentMonth);
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const students = await prisma.student.findMany({
    where: { maktabId, status: "ACTIVE" },
    include: { class: true }
  });

  for (const student of students) {
    const amount = student.monthlyFeeOverride ?? student.class.monthlyFee;
    for (const month of [previousMonth, currentMonth]) {
      await prisma.fee.upsert({
        where: { studentId_month: { studentId: student.id, month } },
        update: { amount },
        create: {
          studentId: student.id,
          classId: student.classId,
          month,
          amount
        }
      });
    }
  }
}
