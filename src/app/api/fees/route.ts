import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateCurrentMonthFees } from "@/lib/fees";

export async function GET() {
  const user = await requireOwner();
  await generateCurrentMonthFees(user.maktabId);
  const fees = await prisma.fee.findMany({
    where: { student: { maktabId: user.maktabId } },
    include: { student: { select: { id: true, name: true } }, allocations: true },
    orderBy: [{ month: "desc" }, { student: { name: "asc" } }]
  });
  const result = fees.map(f => {
    const paid = f.allocations.reduce((sum, a) => sum + a.amount, 0);
    return { ...f, paid, balance: Math.max(0, f.amount - paid) };
  });
  return NextResponse.json(result);
}
