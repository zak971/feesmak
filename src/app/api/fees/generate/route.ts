import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/permissions";
import { generateCurrentMonthFees } from "@/lib/fees";

export async function POST() {
  const user = await requireOwner();
  await generateCurrentMonthFees(user.maktabId);
  return NextResponse.json({ ok: true });
}
